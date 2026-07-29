/**
 * GitM Concept State Factory (Huirth Deployment) · STCP Base
 *
 * The server-side (Base) state for the gitm Demometer — holds gitmJson as the Huirth
 * source of truth so the STCP SBIS+SMRP+BOCR stack keeps it authoritative. Seeds to
 * GITM_JSON_EMPTY_SENTINEL (isRepo:false · lastReadAt:0) so the KeyedSelector slot is
 * ALWAYS present (never optional · KeyedSelector discipline) and BOCR reads a valid
 * value on a connect before any gitm.json exists. The gitmJsonWatcher dir-watch writes
 * real snapshots via the Base quality (gitmSetGitmJsonHuirthBase).
 *
 * SMRP boot-skip gate: gitmJson.lastReadAt === 0 (the seeded sentinel · no Idle
 * re-broadcast storm on boot).
 *
 * Citation: cadmium.state.huirth.ts (createCadmiumHuirthState · Base seeds to EMPTY sentinel).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W1 gitm.state.huirth.ts.
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state).
 */
import type { GitmHuirthState, GitmJsonShape, GitmLocationSubState, UpdateStatusShape } from './gitm.type';

// GITM Staging-Update (D-U4.1) — the empty STAGE RAIL seed (INERT · UNREAD + UNWRITTEN until
// D-U4.3). TQNI: mirrors the bridge UPDATE_STATUS_EMPTY (gitm.types.ts) field-for-field.
const UPDATE_STATUS_EMPTY: UpdateStatusShape = {
  stage: 'idle', stageError: '', scpName: '', cloneMode: '',
  summary: { apply: 0, preserve: 0, conference: 0, collisionZones: [] },
  resolvedPending: 0, diffPresent: false, generatedAt: '', note: '',
};

// GITM 3LOC — empty per-location sub-state (the badge falls back to the Yellow baseline
// while mostRecentLocation === ''). TQNI: mirrors the bridge createGitmLocationSubState.
const GITM_EMPTY_LOCATION: GitmLocationSubState = {
  cwd: '',
  isRepo: false,
  currentBranch: '',
  dirty: false,
  changeCount: 0,
  branches: [],
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  conflicts: [],
  lastChangedAt: 0,
};

export const GITM_JSON_EMPTY_SENTINEL: GitmJsonShape = {
  isRepo: false,
  currentBranch: '',
  remoteOrigin: '', // C837 · TQNI mirror
  headCommitMessage: '', // C844 · TQNI mirror
  dirty: false,
  ahead: 0,
  behind: 0,
  branches: [],
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  // GITM Staging-Update (D-U4.1) — the empty STAGE RAIL seed (INERT · TQNI sentinel seed).
  updateStatus: UPDATE_STATUS_EMPTY,
  detachedHead: false,
  conflicts: [],
  lastReadAt: 0,
  // GITM Dev Menu (#644) — STASHCOUNT seed (no stash entries) + WATCHKEY token (none pending).
  stashCount: 0,
  // GITM Dev Epoch (MD-B) — the labeled stash roster seed (empty · populated by gitm_stash_list · TQNI).
  stashList: [],
  pendingConfirm: null,
  // GITM A↔B (#641) — A/B reserve-mechanism defaults (none registered · idle).
  stableBranch: '',
  workingBranch: '',
  abMode: 'idle',
  lastTurnOverResult: '',
  bMergeable: false,
  // GITM A↔B Refinement (#641-R) — CHANGEDIAL count + turn-over direction (TQNI sentinel seed).
  changesPrimedOnB: 0,
  turnedOverTo: '',
  // GITM color-cascade (W2 · Counter B) — commits-between divergence seed (0 · TQNI sentinel seed).
  commitsDivergenceCount: 0,
  // GITM Branch-Flow (#644) — transient action-error surface seed ('' = no error · TQNI).
  errorCode: '',
  errorMessage: '',
  // GITM Dev Epoch (MD-A) — the command-log seed (empty ring · the bridge populates it on gitm.json · TQNI).
  commandLog: [],
  // GITM Dev Epoch (MD-D) — the reflog roster + conflict-surface seeds (empty/null · the bridge
  // populates them on gitm.json when the on-demand reflog/conflict reads fire · TQNI).
  reflogEntries: [],
  activeConflict: null,
  // GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the progress-strip seed (null = idle · the bridge
  // stamps it on gitm.json from the currentOp latch around a long-running exec · TQNI).
  progress: null,
  // GITM Dev Epoch (MD-C · THE DAG · fold #4) — the graph-log + diff seeds (empty · the bridge
  // populates them on gitm.json when the on-demand graph/diff reads fire · TQNI).
  commitGraph: [],
  activeDiff: '',
  // GITM 3LOC — the three-location nested block seed (no rotation yet · all empty). The
  // badge reads the Yellow baseline (changesPrimedOnB) while mostRecentLocation === ''.
  schemaVersion: 2,
  mostRecentLocation: '',
  locations: {
    base: GITM_EMPTY_LOCATION,
    cascade: GITM_EMPTY_LOCATION,
    scp: GITM_EMPTY_LOCATION,
  },
};

export const createGitmHuirthState = (): GitmHuirthState => ({
  // Always present — never optional (KeyedSelector requirement). The gitmJsonWatcher
  // populates a real snapshot via the Base quality; lastReadAt === 0 is the boot-skip gate.
  gitmJson: GITM_JSON_EMPTY_SENTINEL,
  // GITM Staging-Update (D-U4.2) — the HEAVY diff/resolved Base slots. null IS the sentinel
  // here (the STCP emptyPayload:null path · the diff/resolved bodies have no typed empty shape).
  // The KeyedSelector slot is ALWAYS present (UpdateDiffShape|null / UpdateResolvedShape|null);
  // the gitmUpdateWatcher populates real bodies via the Base qualities (D-U4.3+ · INERT until).
  updateDiff: null,
  updateResolved: null,
});
