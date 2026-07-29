/**
 * suite8ReaderPaths.model.ts — THE ENDPOINT READERS path logic (MD-4 · D-RD-1/D-RD-2)
 *
 * PURE module · zero Stratimux/Huirth/Express deps · CLI- and test-importable. Holds the
 * path-resolution + PATH-TRAVERSAL GUARD idiom for the SCP-local Suite 8 document readers
 * registered on vue.principle.ts (beside the suite8-anchor-spawn block). Extracting the
 * path logic here makes the traversal guard + the reader targets TESTABLE without booting
 * the Express server (the repo idiom · cf. sordEnvelope.model.ts, designationValidator.model.ts,
 * scpConfig.model.ts).
 *
 * THE GUARD IDIOM (verbatim from vue.principle.ts /suite8-anchor-spawn :766-773 and
 * /suite8-skill-prime :797-810): a resolved child path is IN-BOUNDS iff
 *   resolved !== base  AND  resolved.startsWith(base + path.sep)
 * A `..` traversal, an absolute override, or a sibling `baseX/` resolves OUTSIDE base →
 * fails the prefix check → the route replies 403. `path.resolve` collapses `..` segments
 * BEFORE the check, so `../` cannot slip through.
 *
 * THE FailureNode Doctrine: resolveReaderTarget returns a discriminated result — either
 * { ok: true, path } (in-bounds · caller stat/reads it · 404 if absent) or
 * { ok: false, reason: 'traversal' } (out-of-bounds · caller replies 403). Every 404 the
 * caller emits carries { error, path } (the path it TRIED) — the honest reason.
 *
 * SCP-LOCAL: base = <suite8RiScsRoot>/Cascades/8_SUITES/<name> where suite8RiScsRoot =
 * SCS_BRIDGE_ROOT_OVERRIDE ?? cwd (dev:self → SCS repo root; production → install cwd) —
 * the C338 boundary · already SCP-local. The caller supplies the resolved suite8RiBase.
 *
 * Citation: DIAMOND-SCP-ACTUALIZATION-EPOCH.md §MD-4 · the traversal guard idiom verbatim.
 */

import path from 'path';

// ============================================
// GUARD RESULT TYPES (FailureNode Doctrine)
// ============================================

export interface ReaderTargetOk {
  ok: true;
  /** The resolved, in-bounds absolute path the caller reads (404 if absent on disk). */
  path: string;
}
export interface ReaderTargetFail {
  ok: false;
  /** 'traversal' → the caller replies 403. 'empty' → the caller replies 400 (missing input). */
  reason: 'traversal' | 'empty';
}
export type ReaderTargetResult = ReaderTargetOk | ReaderTargetFail;

// ============================================
// THE TRAVERSAL GUARD (verbatim idiom · pure)
// ============================================

/**
 * True iff `resolved` is STRICTLY INSIDE `base` — the verbatim vue.principle.ts guard.
 * `resolved !== base` rejects the base dir itself; the `base + sep` prefix rejects both
 * `..` escapes (resolve collapses them outside base) AND sibling `baseX/` false-prefixes.
 */
export function isInsideBase(base: string, resolved: string): boolean {
  return resolved !== base && resolved.startsWith(base + path.sep);
}

/**
 * Resolve `segment` (user-controlled) against `base` and apply the guard. Empty segment →
 * { ok:false, reason:'empty' } (a missing :name / ?ref → the caller's 400). Out-of-bounds
 * → { ok:false, reason:'traversal' } (the caller's 403). In-bounds → { ok:true, path }.
 */
export function resolveGuardedChild(base: string, segment: string): ReaderTargetResult {
  if (typeof segment !== 'string' || segment.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  const resolved = path.resolve(base, segment);
  if (!isInsideBase(base, resolved)) {
    return { ok: false, reason: 'traversal' };
  }
  return { ok: true, path: resolved };
}

// ============================================
// SUITE 8 DIR RESOLUTION
// ============================================

/**
 * The absolute dir of Suite 8 `name` under the 8_SUITES base, guarded on `name`. The FIRST
 * gate of every reader route — resolves <suite8RiBase>/<name> or fails traversal.
 */
export function resolveSuite8Dir(suite8RiBase: string, name: string): ReaderTargetResult {
  return resolveGuardedChild(suite8RiBase, name);
}

// ============================================
// THE TRIO + MAINTAINER (D-RD-1)
// ============================================

export type Suite8DocKind = 'instance' | 'conductor' | 'maintainer';

const DOC_FILENAME: Record<Suite8DocKind, string> = {
  instance: 'Instance.md',
  conductor: 'Conductor.md',
  maintainer: 'Maintainer.md',
};

/** <suite8Dir>/{Instance,Conductor,Maintainer}.md — no user input on the leaf (fixed name). */
export function suite8DocPath(suite8Dir: string, kind: Suite8DocKind): string {
  return path.resolve(suite8Dir, DOC_FILENAME[kind]);
}

// ============================================
// SKILLS (D-RD-1) — HETEROGENEOUS: flat *.md AND <SkillDir>/Skill.md
// ============================================

export interface Suite8SkillEntry {
  /** The skill identifier — the flat file's basename-sans-ext, or the subdir name. */
  name: string;
  /** 'flat' = a *.md directly in Skills/; 'dir' = a subdir holding Skill.md. */
  kind: 'flat' | 'dir';
  /** The Skills/-relative path to the Skill markdown (the .md itself, or <dir>/Skill.md). */
  skillMdRelPath: string;
}

/** <suite8Dir>/Skills — the base for the skills listing + the :skill reader. */
export function suite8SkillsDir(suite8Dir: string): string {
  return path.resolve(suite8Dir, 'Skills');
}

/** <suite8Dir>/Strategy — the base for the strategies listing + the :strat reader. */
export function suite8StrategyDir(suite8Dir: string): string {
  return path.resolve(suite8Dir, 'Strategy');
}

/**
 * Build the Skills listing from a shallow dir read. `entries` = { name, isDir } per Skills/
 * child (the caller supplies fs.readdirSync(..., {withFileTypes:true})-derived pairs — kept
 * pure/testable here). Flat non-Skill *.md → a 'flat' entry (name = sans-ext); a subdir →
 * a 'dir' entry (skillMd = <dir>/Skill.md · presence checked by the caller/route). Non-.md
 * flat files are ignored. Deterministic sort by name.
 */
export function buildSkillsListing(
  entries: Array<{ name: string; isDir: boolean }>,
): Suite8SkillEntry[] {
  const out: Suite8SkillEntry[] = [];
  for (const e of entries) {
    if (e.isDir) {
      out.push({
        name: e.name,
        kind: 'dir',
        skillMdRelPath: `${e.name}/Skill.md`,
      });
    } else if (/\.md$/i.test(e.name)) {
      out.push({
        name: e.name.replace(/\.md$/i, ''),
        kind: 'flat',
        skillMdRelPath: e.name,
      });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fuzzy-tolerant match of a requested `skill` token against a built listing. Exact
 * (case-insensitive) name match wins; else the FIRST case-insensitive substring match
 * (either direction) on the entry name. Returns the matched entry or null (→ caller 404).
 */
export function matchSkill(
  listing: Suite8SkillEntry[],
  skill: string,
): Suite8SkillEntry | null {
  const needle = skill.toLowerCase();
  const exact = listing.find((e) => e.name.toLowerCase() === needle);
  if (exact) return exact;
  const partial = listing.find(
    (e) => e.name.toLowerCase().includes(needle) || needle.includes(e.name.toLowerCase()),
  );
  return partial ?? null;
}

// ============================================
// STRATEGIES (D-RD-2) — flat *.md listing + fuzzy :strat reader
// ============================================

export interface Suite8StrategyEntry {
  /** The strategy identifier — basename-sans-ext. */
  name: string;
  /** The Strategy/-relative filename (e.g. 'GreetingStrategy.md'). */
  file: string;
}

/** Build the Strategy listing from flat *.md filenames. Non-.md ignored. Sorted by name. */
export function buildStrategyListing(filenames: string[]): Suite8StrategyEntry[] {
  return filenames
    .filter((f) => /\.md$/i.test(f))
    .map((f) => ({ name: f.replace(/\.md$/i, ''), file: f }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Fuzzy-tolerant :strat match — same exact-then-substring rule as matchSkill. */
export function matchStrategy(
  listing: Suite8StrategyEntry[],
  strat: string,
): Suite8StrategyEntry | null {
  const needle = strat.toLowerCase();
  const exact = listing.find((e) => e.name.toLowerCase() === needle);
  if (exact) return exact;
  const partial = listing.find(
    (e) => e.name.toLowerCase().includes(needle) || needle.includes(e.name.toLowerCase()),
  );
  return partial ?? null;
}

// ============================================
// WORKING DOCS (D-RD-2) — name-filtered Cascades/Working listing
// ============================================

export interface WorkingDocEntry {
  file: string;
  firstLine: string;
}

/**
 * Filter Working/ docs to those whose FILENAME or FIRST-LINE contains the Suite 8 `name`
 * (case-insensitive). `docs` = { file, firstLine } per Working/*.md (the caller reads the
 * first line off disk — kept pure here). Empty array = honest "no matching docs".
 */
export function filterWorkingDocs(
  docs: WorkingDocEntry[],
  name: string,
): WorkingDocEntry[] {
  const needle = name.toLowerCase();
  return docs.filter(
    (d) =>
      d.file.toLowerCase().includes(needle) ||
      d.firstLine.toLowerCase().includes(needle),
  );
}

// ============================================
// ASSET (D-RD-2) — ?ref=logo default · extension probe
// ============================================

/** The image extensions probed for an asset ref, in first-present order. */
export const ASSET_EXTENSIONS: readonly string[] = ['png', 'svg', 'jpg', 'jpeg', 'webp'];

/** <suite8Dir>/assets — the base for the asset route. */
export function suite8AssetsDir(suite8Dir: string): string {
  return path.resolve(suite8Dir, 'assets');
}

/**
 * Resolve an asset `ref` (default 'logo') against the assets base, GUARDED on ref, then
 * yield the candidate absolute paths (<assetsBase>/<ref>.<ext> per ASSET_EXTENSIONS) for
 * the caller to probe first-present. Guard fail → { ok:false } (→ 403). The ref must be a
 * bare name (no extension); the extension probe is ours.
 */
export function resolveAssetCandidates(
  assetsBase: string,
  ref: string,
): { ok: true; candidates: string[] } | ReaderTargetFail {
  const safeRef = typeof ref === 'string' && ref.length > 0 ? ref : 'logo';
  const guarded = resolveGuardedChild(assetsBase, safeRef);
  if (!guarded.ok) return guarded;
  const candidates = ASSET_EXTENSIONS.map((ext) => `${guarded.path}.${ext}`);
  return { ok: true, candidates };
}

/** Content-Type for a served asset by extension. Unknowns → application/octet-stream. */
export function assetContentType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
