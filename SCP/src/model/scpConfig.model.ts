// scpConfig.model.ts — the SCP-resident declarative identity (Per-SCP-Identity-Config · FKIS Origin).
//
// The client twin of the bridge-side reader. Where hifiConfig.json carries the SCP's SHIPPED HiFi
// design, scp.config.json carries the SCP's OWN name. The install wizard stamps it
// ({ "scpName": <designation> }); the template ships { "scpName": "template" }. The SCP server serves
// it at GET /scp-config (vue.principle.ts · same-origin · path-traversal-safe). The scsBridgeController
// boot-reads it (loadScpConfig) and caches scpName, then carries it as originScpName on every
// send_message POST — closing the installed-SCP 'no-origin' bail (the shared workspace bridge muxium
// has no per-SCP env to read; the SCP's OWN name IS its origin).
//
// Mirrors loadHifiConfig: same-origin relative fetch · null on absent/unreadable/malformed.

export interface ScpConfig {
  scpName: string;
}

// Fetch THIS SCP's controlling scp.config.json via the server endpoint. Null on
// absent/unreadable/malformed/absent-field. Same-origin (the SCP's own express server · NOT the bridge).
//
// C375 · THE ENGAGE AWAIT HARDENING (SOURCE) · ABORT-CONTROLLER TIMEOUT. Prior code did a bare
// `await fetch('/scp-config')` with NO timeout — a hung SCP server (socket open, unanswered mid-restart:
// the SAME PRIME-STALL socket-open-but-silent mode triggerSendMessage already guards) would NEVER settle,
// the `catch` NEVER fires (no throw on a hung-open connection), and the whole resolveScpName promise stays
// pending forever → the Forge Engage's `await ctrl.getScpName()` hangs → the dispatch is never reached →
// silence. A 3s AbortController now guarantees the fetch settles: on abort the catch returns null and the
// caller proceeds with the bridge default. NEVER let this fetch outlive the Engage's own race window.
export async function loadScpConfig(): Promise<ScpConfig | null> {
  if (typeof window === 'undefined') return null;
  const abort = new AbortController();
  const SCP_CONFIG_TIMEOUT_MS = 3000;
  const timeoutId = setTimeout(() => abort.abort(), SCP_CONFIG_TIMEOUT_MS);
  try {
    const r = await fetch('/scp-config', { signal: abort.signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { scpName?: unknown };
    return j && typeof j === 'object' && typeof j.scpName === 'string' && j.scpName.length > 0
      ? { scpName: j.scpName }
      : null;
  } catch {
    return null; // includes AbortError (the 3s timeout · hung-open SCP server) → the safe default
  } finally {
    clearTimeout(timeoutId);
  }
}
