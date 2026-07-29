/**
 * suite8CreateScaffold.model.ts — THE NAME-FIRST DEMOMETRIC MINT (MD-3 · D-NM-1)
 *
 * PURE module · zero Stratimux/Huirth/Express deps · CLI- and test-importable. Holds the
 * NDEP name validation + the barebones Instance.md / Maintainer.md content builders + the
 * scaffold planner (the fs-effecting caller in vue.principle.ts calls buildMintPlan then
 * writes the returned {dir, files}). Extracting the logic here makes the mint TESTABLE
 * without booting Express (the repo idiom · cf. suite8ReaderPaths.model.ts).
 *
 * THE NAME-FIRST DEMOMETRIC MINT: the minted Suite 8 is a DIRECTORY (`Cascades/8_SUITES/
 * <name>/`) holding barebones docs — NOT a compiled Stratimux concept. The generic `suite8`
 * island renders it BY PARAM (risk-2 law · never a bespoke compiled entry). Because it is a
 * directory-entry Name (NDEP · the literal dir under 8_SUITES · existing entries like
 * "Cadmium Researcher" carry a SPACE), the mint validator allows ALPHANUMERIC + SPACE — it is
 * NOT the camelCase-strict `validateDesignationForWizard` (that governs the compiled SCP
 * concept ident · no spaces). NDEP is preserved: the name IS the dir entry, no slug.
 *
 * THE FailureNode Doctrine: validateMintName returns { ok:false, reason } on every reject;
 * the caller replies { error, reason } (400 on invalid name · 409 on collision). Every reject
 * carries the honest reason — never a silent no-op.
 *
 * THE PATH-TRAVERSAL GUARD (verbatim idiom · shared with suite8ReaderPaths.model isInsideBase):
 * the resolved <suite8RiBase>/<name> must be STRICTLY INSIDE the base — a `..` escape / absolute
 * override / sibling `baseX/` resolves OUTSIDE → the caller replies 400 (invalid name). `path.resolve`
 * collapses `..` BEFORE the check.
 *
 * THE CADMIUM RECOMMENDATION: the barebones Instance.md carries the verbatim-adapted first-motion
 * note — engage the Cadmium Researcher to establish a Reference Design as this Suite 8's ground.
 *
 * Citation: DIAMOND-SCP-ACTUALIZATION-EPOCH.md §MD-3 · the NDEP mint + the Cadmium recommendation.
 * Citation: suite8ReaderPaths.model.ts isInsideBase (the traversal guard idiom · verbatim).
 * Citation: suite8Registration.model.ts NDEP (name IS the directory entry · no slug).
 */

import path from 'path';
import { isInsideBase } from './suite8ReaderPaths.model';

// ============================================
// NDEP NAME VALIDATION (alphanumeric + space · the mint rule)
// ============================================

/**
 * Length bounds mirror the wizard ergonomics (designationValidator.model.ts: 2-32) — a mint
 * name is a directory entry, so the same filesystem-ergonomic bounds apply.
 */
export const MINT_NAME_MIN_LENGTH = 2;
export const MINT_NAME_MAX_LENGTH = 32;

/**
 * ALPHANUMERIC + SPACE only (the NDEP directory-entry rule · the suite8PageCreate:724 lineage
 * relaxed for the space-bearing 8_SUITES dir convention). No leading/trailing space, no double
 * space, no path separators, no `.` — those keep the dir entry clean AND traversal-safe.
 */
const MINT_NAME_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

export interface MintNameOk {
  ok: true;
  /** The trimmed, validated name — the literal dir entry the caller mkdirs. */
  name: string;
}
export interface MintNameFail {
  ok: false;
  /** The honest reject reason (the caller's 400 body · FailureNode Doctrine). */
  reason: string;
}
export type MintNameResult = MintNameOk | MintNameFail;

/**
 * Validate a mint name: non-empty · 2-32 chars · alphanumeric + single interior spaces only ·
 * no reserved / traversal shapes. Returns the trimmed name on ok, the honest reason on fail.
 * The trim tolerates surrounding whitespace in the request body; the PATTERN then rejects any
 * INTERIOR malformation (double space · separators · dots).
 */
export function validateMintName(raw: unknown): MintNameResult {
  if (typeof raw !== 'string') {
    return { ok: false, reason: 'Name must be a string' };
  }
  const name = raw.trim();
  if (name.length === 0) {
    return { ok: false, reason: 'Enter a name for your Suite 8' };
  }
  if (name.length < MINT_NAME_MIN_LENGTH) {
    return { ok: false, reason: `Name must be at least ${MINT_NAME_MIN_LENGTH} characters` };
  }
  if (name.length > MINT_NAME_MAX_LENGTH) {
    return { ok: false, reason: `Name cannot exceed ${MINT_NAME_MAX_LENGTH} characters` };
  }
  if (!MINT_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      reason:
        'Name may contain only letters, numbers, and single spaces (no leading/trailing/double spaces · no separators or periods)',
    };
  }
  return { ok: true, name };
}

// ============================================
// SCAFFOLD PATH RESOLUTION (traversal-guarded · shared idiom)
// ============================================

export interface MintDirOk {
  ok: true;
  /** The absolute <suite8RiBase>/<name> dir the caller creates. */
  dir: string;
  /** The validated (trimmed) name. */
  name: string;
}
export interface MintDirFail {
  ok: false;
  /** 'invalid-name' → caller 400 {reason}. 'traversal' → caller 400 (out-of-bounds name). */
  reason: string;
  code: 'invalid-name' | 'traversal';
}
export type MintDirResult = MintDirOk | MintDirFail;

/**
 * Validate the name AND resolve+guard the target dir under the 8_SUITES base. Combines the NDEP
 * validation with the traversal guard so the caller has ONE gate before the collision check.
 */
export function resolveMintDir(suite8RiBase: string, raw: unknown): MintDirResult {
  const validated = validateMintName(raw);
  if (!validated.ok) {
    return { ok: false, reason: validated.reason, code: 'invalid-name' };
  }
  const dir = path.resolve(suite8RiBase, validated.name);
  if (!isInsideBase(suite8RiBase, dir)) {
    return { ok: false, reason: 'Name resolves outside the 8_SUITES boundary', code: 'traversal' };
  }
  return { ok: true, dir, name: validated.name };
}

// ============================================
// THE BAREBONES DOCUMENT BUILDERS (Instance.md + Maintainer.md)
// ============================================

/**
 * THE CADMIUM RECOMMENDATION — the verbatim-adapted first-motion note seeded into every mint.
 * Engaging the Cadmium Researcher to establish a Reference Design is the recommended ground.
 */
export const CADMIUM_RECOMMENDATION =
  'Recommended first motion: engage the Cadmium Researcher to create a Planned Query establishing a Reference Design for your chosen domain — the RD becomes this Suite 8\'s ground.';

/** The barebones Instance.md for a freshly minted Suite 8 (Configuration: Direct · Domain: TBD). */
export function buildMintInstanceMd(name: string): string {
  return `# ${name} — Suite 8 Instance

**Designation**: ${name}
**Configuration**: Direct
**Domain**: TBD

---

## First Motion

${CADMIUM_RECOMMENDATION}
`;
}

/**
 * The barebones Maintainer.md seeded with the MD-2 schema. `homeScp` = the minting SCP's own
 * scpName (read from scp.config.json by the caller). The Boundary Law preamble carries the
 * part-renewal doctrine applied to Suite-8 identity (Designation/Home/Dependencies are
 * identity-bearing at any future update seam · risk-3).
 */
export function buildMintMaintainerMd(name: string, homeScp: string): string {
  return `# ${name} — Maintainer

## Preamble — the Boundary Law

Designation, Home SCP, and Dependencies are IDENTITY-BEARING at any future update seam. The
part-renewal doctrine applies: an update MUST preserve this Suite 8's identity across the seam —
renaming or re-homing is an identity change, not a maintenance edit.

## Sovereignty Boundary

- **Home SCP**: ${homeScp}
- **Installed-in**: ${homeScp}

## Skills Registry

_(empty — no Skills authored yet)_

| Skill | Currency Gate | Last Executed |
|---|---|---|

## Muxonomy Registration

- **Designation**: ${name}
- **Configuration**: Direct
- **Domain**: TBD
- **Dependencies**: none

## Cascade Position

UNKNOWN
`;
}

// ============================================
// IE-D4b · THE 3-FILE EXTENDED MINT SEED (Operation-Born Diamond/Onyx)
// ============================================
//
// A minted Suite 8 seeds its SCP-LOCAL Cascades/Extended/<name>/ memory folder so the extended
// auto-registration circuit can register the dir + arm its menu the instant it is created. Three
// files ONLY (IE-D4b design correction · user law):
//   - Cascade.json — the OPERATION-BORN stub (`cycles: []`; NO activeDiamond/activeOnyx keys)
//   - menu.json    — a minimal VALID MenuStage (the ShatteriteMenu contract)
//   - S8.json      — the empty-valid Suite 8 manifest (anchorSpawn mode)
// The Diamond/Onyx pair is NOT seeded — the Suite 8 mints it DYNAMICALLY once in operation (the
// Dock §4 teaches it), stamping activeDiamond/activeOnyx into the Cascade.json stub at that time.
// Total mint = the identity pair (Instance.md + Maintainer.md) + these 3 = FIVE files.
// Content is plain-language (no internal codenames) — mirrors the IE hand-seeded files as the spec.

/**
 * NOTE — DIAMOND-TIER-1.md / ONYX-TIER-1.md are DELIBERATELY NOT scaffolded (IE-D4b · user law).
 * The identity pair (Instance.md + Maintainer.md) + the Cascade.json stub + menu.json + S8.json
 * are the ONLY seeded files. The Diamond (Ego plan) and Onyx (Lambda trajectory) are created
 * DYNAMICALLY by the Suite 8 itself once in operation — the Dock (§4) teaches it to mint its own
 * pair on first cycle, then to stamp activeDiamond/activeOnyx into the Cascade.json stub at that
 * time. Seeding them at mint would pre-empt the operation-born pair (and pre-derive their root).
 */

/**
 * The manifest (Cascade.json) — the OPERATION-BORN stub. It carries NO activeDiamond/activeOnyx
 * keys: the Diamond/Onyx pair is NOT scaffolded — the Suite 8 mints them DYNAMICALLY once in
 * operation (the Dock §4 teaches it), then writes these manifest keys itself at that time. The
 * absent keys are the NON-CRASHING shape: the ACFR watcher's buildActiveCascadeFiles iterates
 * GENERAL_CASCADE_FILE_MANIFEST_KEYS and `continue`s on any key whose value is not a non-empty
 * string (an absent key yields undefined → skipped) — so an empty `cycles: []` stub streams no
 * files and never ENOENTs. Citation: suiteCascadeJsonWatcher.principle.huirth.ts buildActiveCascadeFiles.
 *
 * C727 · 2 THE Working/-RELATIVE MANIFEST CONVENTION · the manifest stays AT ROOT
 * (Extended/<name>/Cascade.json · Root-Manifest Watcher-Zero-Change Principle) but the pair it
 * points INTO lives one level down in Working/. When the founding writes the pair (operation-born),
 * it stamps `activeDiamond`/`activeOnyx` as Working/-relative paths, e.g.
 *   { "activeDiamond": "Working/DIAMOND-TIER-1.md", "activeOnyx": "Working/ONYX-TIER-1.md" }
 * The watcher's dual-resolution (cascadeLocalPath FIRST = Extended/<name>/Working/DIAMOND-TIER-1.md
 * · then scsRootPath fallback) threads the Working/ segment opaquely — zero watcher change. The
 * stub itself carries NO keys (operation-born); this comment is the convention shape the founding
 * (buildFoundingVermillionCommand) stamps.
 */
export function buildExtendedCascadeJson(_name: string): string {
  const obj = {
    schemaVersion: '1',
    cycles: [] as unknown[],
  };
  return `${JSON.stringify(obj, null, 2)}\n`;
}

/**
 * THE FOUNDING VERMILLION — the full existence-aware procedure carried by menu option 1.
 *
 * menu.json is STATIC (seeded once at mint), so the existence check cannot run in the file — it
 * runs in the SPAWNED Suite 8 SESSION, instruction-borne. On select, this text relays to the live
 * anchor and the session executes it: first it looks in its OWN Extended memory folder for a
 * Diamond/Onyx pair; if the pair EXISTS it simply engages it (the ordinary continue behavior); if
 * the pair is ABSENT the option becomes a Vermillion — the session asks the user the First-Goal
 * questions and the answers BECOME the founding pair. This is the newborn-reads-a-stranger's-Ego
 * fix: an unfounded Suite 8 births its own pair from the founding conference rather than walking up
 * to the workspace and narrating another domain's Ego as its own.
 *
 * The ${name} substitution and the always-own-Extended path (Cascades/Extended/${name}/) keep the
 * procedure self-encapsulated (the 4A law): every path this option names is the Suite 8's OWN.
 */
export function buildFoundingVermillionCommand(name: string): string {
  return [
    `Establish this Suite 8's ground — the First Goal Conference for the ${name} project. The ground IS your Cascade Memory Documents.`,
    ``,
    `YOUR VOCABULARY, FIRST. Your Cascade Memory Documents ARE your Diamond and Onyx pair — exactly two files: Working/DIAMOND-TIER-1.md (your Ego plan) and Working/ONYX-TIER-1.md (your Lambda ledger), living in the Working/ subfolder of YOUR memory home at <scpRoot>/Cascades/Extended/${name}/. They render LIVE on your Suite 8 page's Cascade Memory section. When the user says "Cascade Documents" or "Cascade Memory", they mean THIS pair at THIS address — nothing in Documentation/, nothing at the workspace, nothing in another domain's folder. It is Cascade Memory, not project memory: Suite 8s interact with each other while each maintains its own domain, so no single project encapsulates you.`,
    ``,
    `PHASE 1 · RESOLVE YOUR SCP ROOT (location only — no status judgment). An absent file at your current working directory means NOTHING about whether you are founded — your home is SCP-local, not cwd-local. Work through these rungs IN ORDER and stop at the first that answers:`,
    `  (0) Your system instruction's Dock section 4 may already STAMP "Your SCP root" as a resolved absolute path — if it does, that IS your SCP root and you are done resolving; the rungs below are the fallback.`,
    `  (a) At your current working directory, read Cascades/Extended/${name}/S8.json. IF it is present, its scpLocalRoot field is your SCP root (and its scpName, if present, names your SCP) — you are done resolving.`,
    `  (b) IF that S8.json is absent, read Cascades/Bridge/bridge.json at your current working directory: for EACH entry in boundScps, take its dir field (the SCP's absolute root) and check whether <dir>/Cascades/8_SUITES/${name}/ exists — the dir that contains your designation is your SCP root. A miss at rung (a) is only a miss of LOCATION; this rung may still find your fully-built SCP-local home.`,
    `  (c) ONLY IF all prior rungs fail to yield a root, ASK the user for the absolute path to the ${name} SCP before touching anything — do NOT guess and do NOT default to cwd.`,
    `  SELF-HEAL: if you resolved via rung (b) or (c), repair the seat the miss revealed — ensure <scpRoot>/Cascades/Extended/${name}/S8.json exists and carries "scpLocalRoot" (your resolved root) and "scpName", merging into the existing file and preserving its other keys; create it if absent, then read it back. Resolution without repair leaks the cost forward.`,
    ``,
    `PHASE 2 · JUDGE FOUNDEDNESS AT THE RESOLVED ROOT ONLY. Now that you hold your SCP root from Phase 1, read <scpRoot>/Cascades/Extended/${name}/Cascade.json for its manifest, and remember your Cascade Memory Documents themselves live in the Working/ subfolder (Working/DIAMOND-TIER-1.md etc. per that manifest). Judge foundedness ONLY here, never at the bare-cwd path you may have missed in Phase 1:`,
    `  - IF the manifest lists a Diamond (activeDiamond) and an Onyx (activeOnyx) — your Cascade Memory Documents EXIST THERE — then you are FOUNDED: read your DIAMOND-TIER-1.md and ONYX-TIER-1.md from <scpRoot>/Cascades/Extended/${name}/Working/, report where the ${name} project stands and its pending items, and continue the work.`,
    `  - ONLY IF the manifest at the resolved root lists no Diamond and no Onyx — your Cascade Memory Documents are ABSENT THERE — declare yourself UNFOUNDED. DO NOT read any Cascade.json outside your own ${name} Extended folder, and DO NOT narrate any other project as your own. Instead, run the First Goal Conference: ask the user three questions and wait for the answers —`,
    `      1. What is this Suite 8's domain — the aspect the ${name} project maintains?`,
    `      2. What is its first goal for the page?`,
    `      3. What are its first three aspirations?`,
    ``,
    `Then CREATE YOUR CASCADE MEMORY DOCUMENTS from the answers, written into the Working/ subfolder of the RESOLVED Extended folder — <scpRoot>/Cascades/Extended/${name}/Working/ (the mint already created this Working/ dir for you):`,
    `  - Working/DIAMOND-TIER-1.md — the Ego plan. Status Standing/Aspiring/Open, the Domain taken from answer 1, and the First Goal (answer 2) as the first row of the plan.`,
    `  - Working/ONYX-TIER-1.md — the Lambda trajectory. An open ledger whose first entry is this founding conversation itself.`,
    `  - Cascade.json (which stays at the Extended/${name}/ ROOT, NOT in Working/) — add activeDiamond and activeOnyx keys with Working/-relative paths pointing at those two files, so the page lists both: "activeDiamond": "Working/DIAMOND-TIER-1.md", "activeOnyx": "Working/ONYX-TIER-1.md".`,
    ``,
    `After writing, read each file back to confirm it landed, then report the founded ground — your Cascade Memory Documents now render on your page's Cascade Memory section.`,
  ].join('\n');
}

/**
 * The minimal VALID MenuStage (menu.json) — matches the ShatteriteMenu contract. The two options
 * are the RI-engagement surface for a freshly minted Suite 8: option 1 founds the RI (the
 * existence-aware Founding Vermillion above — engage the pair if it exists, else birth it from the
 * First Goal Conference), option 2 reports the domain/status without changing anything.
 */
export function buildExtendedMenuJson(name: string): string {
  // C766 · 3B — the seed is STAGED from birth: the whole workflow lives in menu.json
  // ({ currentStageIndex, stages: [...] }); the founding stage is stages[0].
  const stage = {
    stageIndex: 0,
    title: name,
    prompt: `Choose how to engage the ${name} project.`,
    options: [
      {
        label: `Establish this Suite 8's ground — the First Goal Conference`,
        kind: 'askMore',
        // C772 · W4b — the founding conversation belongs IN the terminal: In Focus explicit.
        inFocus: true,
        scsCommand: buildFoundingVermillionCommand(name),
        tooltip: `Found this project's plan and record — or continue it if the ground already exists.`,
      },
      {
        label: 'Explain the domain and status',
        kind: 'askMore',
        inFocus: true,
        scsCommand: `Read only Cascades/Extended/${name}/ and report the ${name} project's domain and where it currently stands, without changing anything.`,
        tooltip: 'Describe the project from its own memory folder — no edits.',
      },
      {
        // W6 (C775) · the Documentation summon — every mint is born able to pull the manual.
        label: 'Summon the Menu Documentation',
        kind: 'askMore',
        inFocus: true,
        scsCommand:
          'Summon the Shatterite Menu Documentation: read Cascades/Documentation/SHATTERITE-MENU.md at your SCP root (resolve your root per the Dock section 4 stamp anor the ladder). It is the complete, cycle-traced manual for the menu component you are bound to — the staged document model you author, the option kinds and the In Focus anor Pass Through discipline, the file authority, Auto-Spawn and Auto Mode, and the Turing-complete Pass Through doctrine. Summarize what it enables for THIS domain, then hold it as your operating reference for authoring menu.json.',
        tooltip: 'The Anchor loads SHATTERITE-MENU.md — the full manual for this menu system.',
      },
      {
        // C772 · W4b — the plain Focus button (pure window focus · no relay).
        label: 'Focus',
        kind: 'focus',
        scsCommand: '',
        tooltip: "Focus the bound session's window.",
      },
    ],
  };
  return `${JSON.stringify({ schemaVersion: '1', currentStageIndex: 0, stages: [stage] }, null, 2)}\n`;
}

/**
 * The empty-valid Suite 8 manifest (S8.json) — anchorSpawn mode.
 *
 * C716 · 1A THE MINT-STAMP SEED · the mint KNOWS the owning SCP root (scpRoot · process.cwd() at
 * the call site since C708), so it seeds `scpLocalRoot` DIRECTLY — a newborn Anchor reads it from
 * its own S8.json and writes its founding Diamond/Onyx pair at <scpLocalRoot>/Cascades/Extended/
 * <name>/ (ABSOLUTE) rather than at bare cwd (the workspace). Absent scpRoot ⇒ omit the field (the
 * founding falls back to declaring the ambiguity · the never-guess law · matches the bridge writer).
 *
 * C727 · 1 THE scpName STAMP · additive-alongside scpLocalRoot at the SAME seam. The mint reads the
 * owning SCP's designation from scp.config.json (the call-site's `homeScp`) and seeds `scpName`
 * directly, so a newborn Anchor knows its SCP BY NAME as well as by root out of the box — it can
 * surface/assert a named SCP identity (closing the r1 GAP) without deriving scpName by a second
 * read of <scpLocalRoot>/scp.config.json. Absent/default scpName ⇒ omit the field (never guess ·
 * the never-guess law · matches the bridge writer's own OMIT-when-unresolvable discipline).
 */
export function buildExtendedS8Json(scpRoot?: string, scpName?: string): string {
  const obj: Record<string, unknown> = { anchorSpawn: 'prompt' };
  if (typeof scpRoot === 'string' && scpRoot.length > 0) {
    obj.scpLocalRoot = path.resolve(scpRoot);
  }
  if (typeof scpName === 'string' && scpName.length > 0) {
    obj.scpName = scpName;
  }
  return `${JSON.stringify(obj, null, 2)}\n`;
}

// ============================================
// THE MINT PLAN (pure · the caller effects the fs writes)
// ============================================

export interface MintFile {
  /** Absolute path the caller writes. */
  path: string;
  /** The file's content. */
  content: string;
}
export interface MintPlan {
  /** The absolute Suite 8 dir to create. */
  dir: string;
  /** The validated name. */
  name: string;
  /** The files to write (Instance.md + Maintainer.md + the 3 Extended seed files = FIVE total). */
  files: MintFile[];
  /**
   * IE-D4b · additional dirs the caller must mkdir (recursive) BEFORE writing files — the
   * SCP-LOCAL Cascades/Extended/<name>/ seed folder (derived from the passed `scpRoot`, NOT from
   * the 8_SUITES dir; fs.writeFileSync does not create parent dirs). The caller mkdirs `dir` +
   * each of these. Every file path already sits under `dir` or one of these extraDirs, so
   * mkdir-p-before-write is guaranteed (ENOENT-on-open = missing dir).
   */
  extraDirs: string[];
}

/**
 * Build the fs-write plan for a minted Suite 8 (name ALREADY validated + dir resolved by the
 * caller via resolveMintDir). Pure — returns the dir + the two barebones files; the caller does
 * the mkdir + writes (after the collision check). `homeScp` seeds the Maintainer.md Home SCP.
 *
 * THE REGISTRATION TRUTH — the mint has NO page yet, so it stamps NO registration file: a minted
 * S8 joins the sidebar nav ONLY through the compiled page duplication (`scs suite8:page`). Its
 * pre-page home is the /suite8 roster; the nav gate that read a muxonomy.json here is reversed.
 */
export function buildMintPlan(
  dir: string,
  name: string,
  homeScp: string,
  scpRoot: string,
  scpName?: string,
): MintPlan {
  // IE-D4b · derive the SCP-LOCAL Cascades/Extended/<name>/ seed folder from the passed `scpRoot`
  // (the minting SCP's OWN root · process.cwd() at the call site) — the 4A self-encapsulation law.
  // The PRIOR bug derived it from `dir` (<8_SUITESroot>/Cascades/8_SUITES/<name>, up two levels),
  // but `dir`'s root is the resolveBridgeRoot()-walk-up = the WORKSPACE 8_SUITES base (a SHARED
  // bridge root), so the Extended seed landed at <workspace>/Cascades/Extended/<name> — OUTSIDE the
  // SCP (the 4A violation · the ENOENT). The Extended readers walk up from process.cwd() (SCP-first),
  // so writer and reader disagreed. Anchoring on scpRoot keeps writer + reader on the SAME SCP root.
  const extendedDir = path.resolve(scpRoot, 'Cascades', 'Extended', name);
  // C727 · 2 THE Working/ SCAFFOLD · the Temporal-Accumulating Ledger Concentration dir. Seeded
  // EMPTY at mint (the Diamond/Onyx pair stays OPERATION-BORN — the founding writes it here later),
  // but mkdir'd now so a newborn Anchor's first write into Extended/<name>/Working/ never ENOENTs.
  // Pushed to extraDirs so the caller's mkdir-p loop creates it (fs.writeFileSync creates no parents).
  const workingDir = path.resolve(extendedDir, 'Working');
  return {
    dir,
    name,
    extraDirs: [extendedDir, workingDir],
    files: [
      { path: path.resolve(dir, 'Instance.md'), content: buildMintInstanceMd(name) },
      { path: path.resolve(dir, 'Maintainer.md'), content: buildMintMaintainerMd(name, homeScp) },
      // IE-D4b · the 3-file Extended mint seed (manifest stub + menu + S8 · NO Diamond/Onyx —
      // those are operation-born · minted dynamically by the Suite 8 once docked into Working/).
      { path: path.resolve(extendedDir, 'Cascade.json'), content: buildExtendedCascadeJson(name) },
      { path: path.resolve(extendedDir, 'menu.json'), content: buildExtendedMenuJson(name) },
      // C716 · 1A · seed scpLocalRoot into the S8.json (the mint KNOWS scpRoot since C708).
      // C727 · 1 · additive-alongside seed scpName (the mint KNOWS the designation via homeScp).
      { path: path.resolve(extendedDir, 'S8.json'), content: buildExtendedS8Json(scpRoot, scpName) },
    ],
  };
}
