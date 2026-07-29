/**
 * GitM Concept Types — the SCP-side gitm BASE concept (#639)
 *
 * Canonical home for GitmJsonShape (moved here from scsBridge.type.ts · the clean
 * import-graph decision · scsBridge.type.ts now re-exports it for its retained
 * gitmPendingAction action-pipe consumers). The gitm concept owns the gitm.json
 * file-watch relay; the scsBridge concept retains the orthogonal MCP action-pipe
 * (gitmPendingAction / scsBridgeGitmActionPrinciple).
 *
 * TQNI invariant — the Base quality type string 'Gitm Set Gitm Json Huirth Base'
 * is DISTINCT from the relay's 'Gitm Set Gitm Json' and MUST be ABSENT from
 * gitm.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
 * The relay 'Gitm Set Gitm Json' IS in actionExchange.serverToClient.
 *
 * Explicit Quality type maps — NEVER typeof (STRATIMUX-REFERENCE.md "🧩 Quality
 * Creation Patterns" anti-pattern guard).
 *
 * Citation: cadmium.type.ts (CadmiumHuirthQualities / CadmiumClientQualities explicit maps).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W1 gitm.type.ts.
 */
import type { Concept, MuxiumDeck, Quality } from 'stratimux';
// GITM Staging-Update (D-U4.2) — the HEAVY diff/resolved bodies ride their OWN watcher
// (gitmUpdateWatcher) OFF gitm.json. The shapes + dual-deploy payload types live in the
// sibling gitmUpdate.type.ts (kept separate so the gitm.json TQNI surface stays focused).
import type {
  UpdateDiffShape,
  UpdateResolvedShape,
  GitmSetUpdateDiffPayload,
  GitmSetUpdateResolvedPayload,
} from './gitmUpdate.type';

// GITM A↔B (#641) — the abMode state machine position. MUST byte-match the bridge-side
// GitmABMode union (gitm.types.ts) — both feed GitmJsonShape / GitmStatusSnapshot (TQNI).
export type GitmABMode = 'idle' | 'candidate-created' | 'turned-over' | 'success' | 'merged';

// GITM 3LOC — the three color-coded git locations (the nested-git architecture). RE-DECLARED
// here (the SCP cannot import from bridge src/ — same duplication discipline as GitmABMode /
// PendingConfirm). MUST byte-match the bridge GitmLocationKey union (gitm.types.ts) · TQNI.
// 'base' = root repo (YELLOW) · 'cascade' = Cascades/ repo (BLUE) · 'scp' = active SCP (RED).
export type GitmLocationKey = 'base' | 'cascade' | 'scp';

// GITM Dev Epoch (MD-C · THE DAG) — one parsed graph commit. RE-DECLARED here (the SCP cannot
// import from bridge src/ — same duplication discipline as GitmABMode / GitmLocationSubState).
// MUST byte-match the bridge GitmCommitGraphEntry (qualities/types.ts) field-for-field · TQNI.
// The GitmCommitGraph.vue SVG DAG renders lanes off parents, branch/tag chips off refs, and the
// luminous HEAD (a 'HEAD' entry in refs). parents = TRUE parents ([] root · ≥2 merge).
export type GitmCommitGraphEntry = {
  hash: string;
  parents: string[];
  refs: string[];
  author: string;
  subject: string;
};

// GITM 3LOC — the per-location status sub-state. RE-DECLARED here · MUST byte-match the bridge
// GitmLocationSubState (gitm.types.ts) field-for-field — the badge reads this off gitm.json.
// changeCount = staged+unstaged+conflicts (the per-location "number goes up") · lastChangedAt =
// the rotation stamp (Date.now() when THIS location's watcher fired). TQNI byte-match invariant.
export type GitmLocationSubState = {
  cwd: string;
  isRepo: boolean;
  currentBranch: string;
  dirty: boolean;
  changeCount: number;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  untrackedFiles: string[];
  conflicts: string[];
  lastChangedAt: number;
};

// GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts the update tool
// rides on gitm.json. RE-DECLARED here (the SCP cannot import from bridge src/ — same
// duplication discipline as GitmABMode / GitmLocationSubState). MUST byte-match the bridge
// UpdateStatusShape (gitm.types.ts) field-for-field · TQNI. NO optionals (KeyedSelector law) ·
// summary nests concrete numbers (not optionals) for the same reason.
export type UpdateStatusShape = {
  stage: 'idle' | 'cloning' | 'diffing' | 'reviewing' | 'resolving' | 'applying' | 'error';
  stageError: string;
  scpName: string;
  cloneMode: string;
  summary: { apply: number; preserve: number; conference: number; collisionZones: string[] };
  resolvedPending: number;
  diffPresent: boolean;
  generatedAt: string;
  // GITM SCP-UPD · gitm_update_progress — the resolver session's live progress note (the Update
  // view renders "<what the session is doing now>"). '' = no note. TQNI byte-match with the bridge
  // UpdateStatusShape (gitm.types.ts).
  note: string;
};

// GITM SCP-UPD · APPLY-SUCCESS SIGNAL — the exact note the bridge stamps on auto-apply success
// (bridge C293: updateStatus = { stage: 'idle', note: <this string> }). The Update view keys its
// Apply Success screen off `stage === 'idle' && note === UPDATE_APPLIED_NOTE`. TQNI byte-match with
// the bridge-side stamp — a single exported source so the success condition is never a loose literal.
export const UPDATE_APPLIED_NOTE = 'update applied · Turn Over B to finalize';

// GITM Dev Menu (#644) — the WATCHKEY pending-confirm token, mirrored from the bridge
// PendingConfirm (gitm/qualities/types.ts). The bridge surfaces this on gitm.json so the
// SAFEGUARD chips run the call-1 → call-2 handshake: call 1 mints (the chip arms off
// pendingConfirm.tool); call 2 carries pendingConfirm.token back to execute. The SCP only
// reads it (the bridge mints + validates via the canonical confirm-token model) — the SCP
// reads .tool to key the ARMED chip and .token to send back on the executing click.
// TQNI: this shape MUST byte-match the bridge PendingConfirm field-for-field.
export type PendingConfirm = {
  action: string; // qualityName that issued the token, e.g. 'gitmDiscardAll' — keys the ARMED chip
  token: string; // crypto nonce (randomUUID) — sent back as confirmToken on call 2
  paramsHash: string; // canonical concat of the sealed params (PARAMSEAL) — bridge-validated only
  issuedAt: number; // Date.now() — BURNTIME expiry gate origin
};

// GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) — the four sides of one conflicted file, RE-DECLARED
// here (the SCP cannot import from bridge src/ — same duplication discipline as PendingConfirm).
// MUST byte-match the bridge ActiveConflict (gitm/qualities/types.ts) field-for-field · TQNI. The
// conflict editor renders ours=LOCAL(:2:)·base=BASE(:1:)·theirs=REMOTE(:3:)·merged=OUTPUT(worktree).
export type ActiveConflict = {
  path: string;
  ours: string;
  base: string;
  theirs: string;
  merged: string;
};

// GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the live long-running-op strip surface, RE-DECLARED here
// (the SCP cannot import from bridge src/ — same duplication discipline as ActiveConflict). MUST
// byte-match the bridge GitmProgress (gitm/model/gitmExec.model.ts) field-for-field · TQNI. { message,
// command } · null = idle. The bridge stamps it from the module-scope currentOp latch around the long-
// running execs (pull/push/fetch/merge/turn-over); it rides gitm.json whole-file. The island renders a
// slim top strip when non-null. NO cancel for these sync ops (execFileSync cannot abort mid-flight —
// the never-silent rule is met by VISIBILITY, not abortability).
export type GitmProgress = {
  message: string;
  command: string;
};

// The JSON-serializable projection of gitm state the bridge gitmEndpoint.principle.ts
// writes to <userCwd>/Cascades/Bridge/gitm.json. This shape MUST byte-match the bridge
// GitmStatusSnapshot type (gitmEndpoint.principle.ts) — if these diverge the relay
// carries a null parse. Canonical here; scsBridge.type.ts re-exports for the action-pipe.
export type GitmJsonShape = {
  isRepo: boolean;
  currentBranch: string;
  // C837 · THE REMOTE ORIGIN ('' = none) — TQNI mirror of the bridge GitmStatusSnapshot.
  remoteOrigin: string;
  // C844 · THE HEAD COMMIT MESSAGE ('' = none) — the amend seed. TQNI mirror.
  headCommitMessage: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  // GITM SCP-Sovereign — untracked (NEW) file PATHS. The Untracked panel section reads
  // gitmJson.untrackedFiles. TQNI byte-match with the bridge GitmStatusSnapshot.untrackedFiles.
  untrackedFiles: string[];
  // GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts (INERT until
  // D-U4.3). TQNI byte-match with the bridge GitmStatusSnapshot.updateStatus field-for-field.
  updateStatus: UpdateStatusShape;
  // THE VERSIONING MUXAMETER — the CLI self-update surface. TQNI byte-match with the bridge
  // GitmStatusSnapshot.cliUpdate: 'restart-required' = a newer CLI sits on disk awaiting the
  // relaunch the user conducts (installedOnDisk vs runningVersion — the honest derivation).
  // Optional for backward-compat with pre-Muxameter bridges (absent ⇒ the idle treatment).
  cliUpdate?: { status: string; installedOnDisk: string; runningVersion: string; error: string; at: number };
  detachedHead: boolean;
  conflicts: string[];
  lastReadAt: number;
  // GITM Dev Menu (#644) — STASHCOUNT: stash-entry count (Pop-chip enablement · DEVBAR).
  // Non-optional · TQNI byte-match with the bridge GitmStatusSnapshot.stashCount.
  stashCount: number;
  // GITM Dev Epoch (MD-B) — THE LABELED STASH ROSTER: one `<gitref>|<subject>` line per stash entry
  // (the Stash Browser panel renders label|subject). Populated by the gitm_stash_list tool; rides
  // gitm.json whole-file (the STCP parse is unfiltered). TQNI byte-match with the bridge
  // GitmStatusSnapshot.stashList (gitmEndpoint.principle.ts).
  stashList: string[];
  // GITM Dev Menu (#644) — the WATCHKEY token surface that drives the SAFEGUARD ARMED
  // state (null = no pending confirm). TQNI byte-match with the bridge snapshot field.
  pendingConfirm: PendingConfirm | null;
  // GITM A↔B (#641) — A/B reserve-mechanism fields (TQNI field-for-field with the bridge).
  stableBranch: string;
  workingBranch: string;
  // D-BN · THE branchRoles SWEEP — the canonical A/B role truth the bridge writes in LOCKSTEP with
  // stableBranch/workingBranch (GitmStatusSnapshot.branchRoles). `branchRoles: { a, b }` is the ONLY
  // A/B role signal; the `b/` name prefix is PURE LINEAGE NAMING and NEVER decides role semantics.
  // OPTIONAL at the SCP type level because LEGACY gitm.json written by a pre-sweep bridge lacks it —
  // isWorkingBranchPer() below falls back to the legacy `b/`-prefix inference when it is absent.
  branchRoles?: { a: string; b: string };
  // D-BN-2 · THE turnOver RELOCATION — the turn-over restart signal, moved from the per-SCP
  // bridge.json onto gitm.json (branch business belongs on the git manifold file · user design).
  // The scsBridgeTurnOverFieldWatcher observes turnOver.at ADVANCE here and writes the local
  // .bridge-restart.json. OPTIONAL at the SCP type level — a LEGACY gitm.json written by a
  // pre-relocation bridge lacks it (the watcher's `parsed.turnOver?.at` guards its absence).
  turnOver?: { at: number; source: string; hard: boolean };
  // C785 · THE TURN-OVER ALERT (scp_alert_turn_over) — the bridge-requested USER Turn Over A
  // directive. File-held (the GITEP ALERT HOLD carries it write-to-write); SELF-RETIRES once a
  // turnOver stamp NEWER than requestedAt lands. IslandWrapper renders the banner. TQNI: mirror
  // of the bridge GitmStatusSnapshot field (gitmEndpoint.principle.ts). OPTIONAL — legacy files lack it.
  turnOverAlert?: { requestedAt: number; source: string; purpose: string } | null;
  abMode: GitmABMode;
  lastTurnOverResult: string;
  bMergeable: boolean;
  // GITM A↔B Refinement (#641-R) — CHANGEDIAL live STARC dirty-file count on B (LOCKED Q2)
  // + the direction the last turn-over took (S1 prune — abMode is direction-agnostic).
  // TQNI: these two fields complete the 20-field byte-match with the bridge GitmStatusSnapshot.
  changesPrimedOnB: number;
  turnedOverTo: 'A' | 'B' | '';
  // GITM color-cascade (W2 · Counter B) — commits-between divergence (rev-list <A>..<B> = commits
  // on B not yet on A · the "total changes between the two branches" the Turn-Over A badge shows).
  // TQNI byte-match with the bridge GitmStatusSnapshot.commitsDivergenceCount.
  commitsDivergenceCount: number;
  // GITM Branch-Flow (#644) — the transient action-error surface. TQNI: mirror in SCP GitmJsonShape.
  errorCode: string;
  errorMessage: string;
  // GITM Dev Epoch (MD-A) — THE COMMAND LOG: the bounded gitmExec ring (cap 200 · newest-last)
  // the bridge copies onto gitm.json. The SCP reads it whole-file (the STCP parse is unfiltered ·
  // gitmRelay.config.ts:38 `JSON.parse(raw) as GitmJsonShape`), so the field rides free once
  // declared here. The command-log panel renders it newest-first. TQNI byte-match with the bridge
  // GitmStatusSnapshot.commandLog (gitmEndpoint.principle.ts).
  commandLog: string[];
  // GITM Dev Epoch (MD-D) — THE REFLOG roster (gitmLoadReflog result · `<hash>|<selector>|<subject>`
  // lines) the Universal-Undo picker renders. Rides gitm.json whole-file (the STCP parse is
  // unfiltered). TQNI byte-match with the bridge GitmStatusSnapshot.reflogEntries.
  reflogEntries: string[];
  // GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) — the four sides of the file the conflict editor is
  // editing (gitmLoadConflict result · null = none · cleared by gitm_resolve_conflict). The
  // GitmConflictEditor.vue reads gitmJson.activeConflict. TQNI byte-match with the bridge
  // GitmStatusSnapshot.activeConflict (the leaner state-field relay over an un-relayed mean result).
  activeConflict: ActiveConflict | null;
  // GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the live long-running-op strip ({ message, command } |
  // null · null = idle). The island renders a slim top strip while non-null. Rides gitm.json whole-file
  // (the STCP parse is unfiltered). TQNI byte-match with the bridge GitmStatusSnapshot.progress.
  progress: GitmProgress | null;
  // GITM Dev Epoch (MD-C · THE DAG) — the graph-log surface (gitmLoadLogGraph result · TRUE parents
  // + refs). The GitmCommitGraph.vue tab reads gitmJson.commitGraph. Rides gitm.json whole-file (the
  // STCP parse is unfiltered). TQNI byte-match with the bridge GitmStatusSnapshot.commitGraph.
  commitGraph: GitmCommitGraphEntry[];
  // GITM Dev Epoch (MD-C · fold #4 · THE DIFF RELAY) — the raw unified diff (gitmLoadDiff result ·
  // capped ~400 lines with a truncation marker by the bridge). The Diff panel + the per-hunk
  // stage-from-diff surface parse hunks client-side. Absent from the relay through MD-B; MD-C adds
  // it. TQNI byte-match with the bridge GitmStatusSnapshot.activeDiff.
  activeDiff: string;
  // GITM 3LOC — the three-location nested block + rotation pointer + schema version. The bridge
  // writer assembles this from its flat GitmState sub-states; the SCP badge reads
  // gitmJson.locations[gitmJson.mostRecentLocation].changeCount + the location color. TQNI:
  // byte-match the bridge GitmStatusSnapshot (gitmEndpoint.principle.ts) field-for-field.
  schemaVersion: number;
  mostRecentLocation: GitmLocationKey | '';
  locations: {
    base: GitmLocationSubState;
    cascade: GitmLocationSubState;
    scp: GitmLocationSubState;
  };
};

// ============================================
// THE ROLE-DECIDING PROBE (D-BN · THE branchRoles SWEEP)
// ============================================
//
// The SCP-side mirror of the bridge's isWorkingBranchFor (gitmBranchRoot.model.ts). True when
// `branch` is the working B for the given gitmJson. When `gitmJson.branchRoles` is PRESENT, the
// decision is strict ROLES EQUALITY (branch === branchRoles.b · plus a non-empty guard so an
// absent/unread branch never matches an unassigned '' seat). ONLY when the field is ABSENT — a
// LEGACY gitm.json written by a pre-sweep bridge — does it fall back to the legacy `b/`-prefix
// inference. Every component role decision (Sword-gating · door two-state read) routes through
// THIS chokepoint; the bare `startsWith('b/')` survives only here (the legacy fallback) and in
// GitmCommitGraph.vue's DISPLAY chip coloring. Pure · browser-safe · no node imports.
export function isWorkingBranchPer(
  branch: string,
  gitmJson: GitmJsonShape | null | undefined,
): boolean {
  const roles = gitmJson?.branchRoles;
  if (roles) return branch === roles.b && branch !== '';
  return branch.startsWith('b/');
}

// ============================================
// STATE SHAPES
// ============================================

// Huirth (server) source of truth. NON-OPTIONAL sentinel (KeyedSelector discipline ·
// STRATIMUX-REFERENCE.md "State Design Best Practices #4"). Seeded all-zeros via
// GITM_JSON_EMPTY_SENTINEL (gitm.state.huirth.ts); the gitmJsonWatcher populates real
// values; the SMRP boot-skip gate is gitmJson.lastReadAt === 0.
export type GitmHuirthState = {
  gitmJson: GitmJsonShape;
  // GITM Staging-Update (D-U4.2) — the HEAVY diff/resolved bodies the gitmUpdateWatcher relays
  // OFF gitm.json. null until the watcher reads a real scp-update-diff/-resolved.<name>.json
  // (D-U4.3+ writes them · INERT until then). null IS the Base sentinel here (NOT a typed empty
  // shape · the STCP emptyPayload:null path) — mirrors the client null seed for a uniform relay.
  updateDiff: UpdateDiffShape | null;
  updateResolved: UpdateResolvedShape | null;
};

// Client state. gitmJson is null until the relay arrives (no Base seed on the client).
export type GitmClientState = {
  gitmJson: GitmJsonShape | null;
  // GITM Staging-Update (D-U4.2) — null until the relay arrives (mirrors gitmJson · the
  // watcher's ENOENT → null path covers absence · no non-null sentinel needed).
  updateDiff: UpdateDiffShape | null;
  updateResolved: UpdateResolvedShape | null;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

// SBIS Base payload (Huirth-only · local reducer · ABSENT from actionExchange). PACP:
// payload property `gitmJson` carries the parsed snapshot (or null on absent/parse-fail).
export type GitmSetGitmJsonHuirthBasePayload = {
  gitmJson: GitmJsonShape | null;
};

// Relay payload (actionExchange.serverToClient + client reception). Same shape — the
// dual-deploy relay quality reduces on BOTH Huirth and Client.
export type GitmSetGitmJsonRelayPayload = {
  gitmJson: GitmJsonShape | null;
};

// ============================================
// QUALITY TYPE MAPS (explicit — NEVER typeof)
// ============================================

// Huirth concept holds BOTH the Base quality AND the Relay quality (dual-deploy: the
// Base writes the Huirth source of truth; the Relay reducer also runs on Huirth so the
// SMRP selector observes the same gitmJson the Base wrote).
export type GitmHuirthQualities = {
  gitmSetGitmJsonHuirthBase: Quality<GitmHuirthState, GitmSetGitmJsonHuirthBasePayload>;
  gitmSetGitmJson: Quality<GitmHuirthState, GitmSetGitmJsonRelayPayload>;
  // GITM Staging-Update (D-U4.2) — the diff/resolved dual-deploy pairs (Base + Relay · TQNI:
  // the '...Huirth Base' variants are ABSENT from gitm.muxonomy.ts actionExchange + the client).
  gitmSetUpdateDiffHuirthBase: Quality<GitmHuirthState, GitmSetUpdateDiffPayload>;
  gitmSetUpdateDiff: Quality<GitmHuirthState, GitmSetUpdateDiffPayload>;
  gitmSetUpdateResolvedHuirthBase: Quality<GitmHuirthState, GitmSetUpdateResolvedPayload>;
  gitmSetUpdateResolved: Quality<GitmHuirthState, GitmSetUpdateResolvedPayload>;
};

// Client concept holds ONLY the relay-reception qualities (NO Base quality on the client ·
// TQNI invariant).
export type GitmClientQualities = {
  gitmSetGitmJson: Quality<GitmClientState, GitmSetGitmJsonRelayPayload>;
  // GITM Staging-Update (D-U4.2) — the diff/resolved Relay-reception qualities (Relay-only on
  // the client · the Base variants stay Huirth-only · TQNI invariant).
  gitmSetUpdateDiff: Quality<GitmClientState, GitmSetUpdateDiffPayload>;
  gitmSetUpdateResolved: Quality<GitmClientState, GitmSetUpdateResolvedPayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export const gitmHuirthName = 'gitm';
export const gitmClientName = 'gitm';

export type GitmHuirthConcept = Concept<GitmHuirthState, GitmHuirthQualities>;
export type GitmClientConcept = Concept<GitmClientState, GitmClientQualities>;

export type GitmDeck = {
  gitm: GitmClientConcept;
};

export type GitmClientDeck = MuxiumDeck & GitmDeck;

export type GitmHuirthDeck = MuxiumDeck & {
  gitm: GitmHuirthConcept;
};
