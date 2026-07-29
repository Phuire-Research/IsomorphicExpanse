/**
 * scpManifest.model · C822 D2 · THE SCP MANIFEST VALIDATOR (the SCP template side — the twin table)
 *
 * Implements RD-SCP-MANIFEST.md v1 VERBATIM (the CONTRACT — cite by section, never extend):
 * §The Contract (manifestVersion 1) · §Field Rules · the Privacy Doctrine. Both sides
 * validate identically; the bridge carries its own copy of this table (both sides implement the RD verbatim).
 * STRICTNESS IS THE PRIVACY GUARANTEE: unknown keys REJECT, unknown versions REJECT.
 */

export interface ScpManifestSuite8 {
  name: string;
  functionalDescription: string;
}

export interface ParsedScpManifest {
  manifestVersion: 1;
  commit: { hash: string; message: string; timestamp: string };
  description: string;
  suite8s: ScpManifestSuite8[];
  // C837 · the OPTIONAL origin — either/or with PRIORITY to the remote host (a git remote
  // URL anor a file:// local path). The registry SCREENS local paths at upload (a remote
  // host is required for a public SCP); absent = a pre-C837 manifest (still valid).
  origin?: string;
  // C838 · the OPTIONAL designation — the sharer's own scpName (PascalCase-sanitized). The
  // intake PRE-FILLS its Designation field from it (copy-and-paste carries everything);
  // the receiver edits it if they see fit. Absent = a pre-C838 manifest (still valid).
  designation?: string;
}

export type ManifestValidation =
  | { ok: true; manifest: ParsedScpManifest }
  | { ok: false; reason: string };

const HASH_RE = /^[0-9a-f]{7,40}$/;
const MAX_BYTES = 32 * 1024;
const SKEW_MS = 15 * 60 * 1000;

const exactKeys = (obj: object, keys: string[]): string | null => {
  const present = Object.keys(obj);
  for (const k of present) if (!keys.includes(k)) return k;
  return null;
};

export function validateScpManifest(raw: string): ManifestValidation {
  if (typeof raw !== 'string' || raw.length === 0) return { ok: false, reason: 'empty manifest' };
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    return { ok: false, reason: 'manifest exceeds the 32 KB size cap' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not valid JSON' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'the manifest must be a JSON object' };
  }
  const m = parsed as Record<string, unknown>;
  const stray = exactKeys(m, ['manifestVersion', 'commit', 'description', 'suite8s', 'origin', 'designation']);
  if (stray) return { ok: false, reason: `unknown key '${stray}' — unknown keys are not accepted` };
  if (m.manifestVersion !== 1) {
    return { ok: false, reason: `manifestVersion ${String(m.manifestVersion)} is not supported (only 1)` };
  }
  const c = m.commit as Record<string, unknown> | undefined;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return { ok: false, reason: 'commit must be an object' };
  const strayC = exactKeys(c, ['hash', 'message', 'timestamp']);
  if (strayC) return { ok: false, reason: `unknown commit key '${strayC}'` };
  if (typeof c.hash !== 'string' || !HASH_RE.test(c.hash)) {
    return { ok: false, reason: 'commit.hash must be lowercase hex, 7-40 chars' };
  }
  if (typeof c.message !== 'string' || c.message.trim().length < 1 || c.message.trim().length > 200) {
    return { ok: false, reason: 'commit.message must be 1-200 chars' };
  }
  if (typeof c.timestamp !== 'string' || !/Z$/.test(c.timestamp)) {
    return { ok: false, reason: 'commit.timestamp must be ISO 8601 UTC (Z-suffixed)' };
  }
  const ts = Date.parse(c.timestamp);
  if (Number.isNaN(ts)) return { ok: false, reason: 'commit.timestamp does not parse' };
  if (ts > Date.now() + SKEW_MS) return { ok: false, reason: 'commit.timestamp is in the future' };
  if (typeof m.description !== 'string' || m.description.trim().length < 1 || m.description.trim().length > 2000) {
    return { ok: false, reason: 'description must be 1-2000 chars' };
  }
  if (!Array.isArray(m.suite8s) || m.suite8s.length > 32) {
    return { ok: false, reason: 'suite8s must be an array of 0-32 items' };
  }
  // C837 · origin is OPTIONAL; when present it must be a non-empty string within 500 chars.
  if (m.origin !== undefined && (typeof m.origin !== 'string' || m.origin.trim().length < 1 || m.origin.trim().length > 500)) {
    return { ok: false, reason: 'origin must be a non-empty string of at most 500 chars when present' };
  }
  // C838 · designation is OPTIONAL; when present it must satisfy the intake's PascalCase law.
  if (m.designation !== undefined && (typeof m.designation !== 'string' || !/^[A-Z][A-Za-z0-9]{0,59}$/.test(m.designation))) {
    return { ok: false, reason: 'designation must be PascalCase (1-60 chars) when present' };
  }
  for (const [i, sRaw] of m.suite8s.entries()) {
    if (!sRaw || typeof sRaw !== 'object' || Array.isArray(sRaw)) {
      return { ok: false, reason: `suite8s[${i}] must be an object` };
    }
    const s = sRaw as Record<string, unknown>;
    const strayS = exactKeys(s, ['name', 'functionalDescription']);
    if (strayS) return { ok: false, reason: `unknown suite8s[${i}] key '${strayS}'` };
    if (typeof s.name !== 'string' || s.name.length < 1 || s.name.length > 60) {
      return { ok: false, reason: `suite8s[${i}].name must be 1-60 chars` };
    }
    if (typeof s.functionalDescription !== 'string' || s.functionalDescription.length < 1 || s.functionalDescription.length > 300) {
      return { ok: false, reason: `suite8s[${i}].functionalDescription must be 1-300 chars` };
    }
  }
  return {
    ok: true,
    manifest: {
      manifestVersion: 1,
      commit: { hash: c.hash, message: c.message.trim(), timestamp: c.timestamp },
      description: m.description.trim(),
      suite8s: m.suite8s.map((s) => {
        const x = s as Record<string, string>;
        return { name: x.name, functionalDescription: x.functionalDescription };
      }),
      ...(typeof m.origin === 'string' ? { origin: m.origin.trim() } : {}),
      ...(typeof m.designation === 'string' ? { designation: m.designation } : {}),
    },
  };
}
