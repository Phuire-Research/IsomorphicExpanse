<script setup lang="ts">
/**
 * SCS-Bridge Git Sub-Page (GITM PAGE · Pewter HiFi · Quality Bar T1 layout)
 *
 * T1 read surface + T2 first actions for the bridge git manager. Receives the
 * relayed gitm.json snapshot as a prop (passed from ScsBridgeLanding.vue · populated
 * by the sibling gitmJsonWatcher → relay path). Emits a `gitm-action` event carrying
 * a { tool, arguments } MCP-tool payload; the Landing dispatches scsBridgeSetGitmPendingAction
 * on its held Muxium (parity with the selectSubPage / sendMessage event pattern). The
 * scsBridgeGitmActionPrinciple then fires the MCP JSON-RPC fetch and state returns via
 * the gitm.json watcher relay (ACK-ONLY).
 *
 * Warnings (detached HEAD / conflicts / behind) are reconstructed from the snapshot
 * fields at render time — gitm.json does NOT carry the derived activeWarnings field.
 *
 * Pattern: pure presentational sub-page · emits events upward (no Muxium ownership).
 * Citation: ScsBridgeSettingsSubPage.vue (sub-page component exemplar)
 * Citation: STRATIMUX-VUE-REFERENCE.md "Proper State Subscription Pattern"
 */
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue';
import type { GitmJsonShape, GitmPendingAction } from '../../scsBridge.type';
// GITM Staging-Update (D-U4.4) · the heavy diff/resolved body shapes the Update view renders.
import type { UpdateDiffShape, UpdateResolvedShape } from '../../../gitm/gitmUpdate.type';
// GITM SCP-UPD · APPLY-SUCCESS · the exact bridge-stamped success note (bridge C293) — the Apply
// Success screen keys off it (single exported source · never a loose literal).
import { UPDATE_APPLIED_NOTE, isWorkingBranchPer } from '../../../gitm/gitm.type';
// GITM SCP-UPD · APPLY-SUCCESS · the AUTHENTIC dock Turn-Over B control, replicated as the finalize
// step. Self-wiring (resolves the global scsBridge + gitm controllers via the same inject/global path
// the dock uses) → its press fires the SAME triggerGitmTurnOver('B') leg the dock button fires. No
// new endpoint, no prop wiring — mounting it here reuses the dock's turn-over trigger verbatim.
import GitmTurnOverBButton from './GitmTurnOverBButton.vue';
// In-flight guard ref · module-level export from the action principle · gates buttons.
import { isGitmActing } from '../../principles/scsBridgeGitmAction.principle.client';
// GITM Staging-Update (D-U4.4) · the spawn lane (ODSS) reuses the global controller's
// triggerSpawnSuite8Session + triggerDeliverVermillion + the isSpawningSuite8 SIGR guard.
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { isSpawningSuite8 } from '../../principles/scsBridgeInvokeSessionSpawn.principle.client';
import type { ScsBridgeSessionEntry } from '../../scsBridge.type';
import { buildGitmResolverVermillion } from '../../../gitm/gitmResolverVermillion.model';
// SCS-Enabled input (#646) — replaces raw <input> so the `|` end-marker is present
// at render. class/disabled/@keyup.enter flow through $attrs.
import ScsInput from '../../../vue/components/ScsInput.vue';
// GITM Dev Epoch (MD-C · THE DAG) — the commit-graph SVG DAG tab + the pure hunk parser.
import GitmCommitGraph from '../../../gitm/vue/GitmCommitGraph.vue';
import { parseUnifiedDiff, type DiffFile, type DiffHunk } from '../../../gitm/gitmDiffHunk.model';
// GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) — the four-pane conflict editor.
import GitmConflictEditor from '../../../gitm/vue/GitmConflictEditor.vue';
// GITM Dev Epoch (MD-E · part 3 · THE COMMAND PALETTE) — Cmd/Ctrl+K fuzzy-find over the action roster.
import GitmCommandPalette from '../../../gitm/vue/GitmCommandPalette.vue';

interface Props {
  gitmJson: GitmJsonShape | null;
  // GITM Staging-Update (D-U4.4) · the heavy diff/resolved bodies (relayed off the OWN
  // watcher · null until the staging-update engine writes the JSON · guard every access).
  updateDiff?: UpdateDiffShape | null;
  updateResolved?: UpdateResolvedShape | null;
  // THE VERSIONING MUXAMETER · the ?sub=update deep-link seed (the TaskBar label's click
  // lands the Update tab directly) + the SCP server's counter verdict (/scs-bridge-version).
  initialTab?: 'workflow' | 'graph' | 'update' | null;
  versionCheck?: {
    updateClass?: string;
    npmLatestVersion?: string | null;
    installedVersion?: string | null;
    // D-RD1 · the Red Discipline fields: what THIS app has landed + whether a global
    // sync is available (the install button's key — independent of the class).
    appliedScpMuxameter?: number | null;
    syncAvailable?: boolean;
    installedMuxameter?: { cli: number; scp: number } | null;
    remoteMuxameter?: { cli: number; scp: number } | null;
  } | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'gitm-action', action: GitmPendingAction): void;
}>();

// Local commit-message input · cleared by the parent re-render after the staged list empties.
const commitMessage = ref<string>('');

// ──────────────────────────────────────────────────────────────────────────
// GITM SUB-NAV (Portion 1) — a LOCAL two-tab nav WITHIN this gitm sub-page (NOT the
// scsBridge subPageRegistry). 'workflow' = the git developer surface (Developer / Branches
// / Changes / Untracked / Commit); 'update' = the always-visible Staging Update lane.
// Default 'workflow' so the page still opens on the git workflow.
// ──────────────────────────────────────────────────────────────────────────
// GITM Dev Epoch (MD-C) — 'graph' adds the SVG commit-DAG tab (off gitmJson.commitGraph).
type GitmTab = 'workflow' | 'graph' | 'update';
const activeGitmTab = ref<GitmTab>('workflow');
// THE VERSIONING MUXAMETER · the deep-link seed — WATCHED, not setup-read: the child's setup
// runs BEFORE the parent's onMounted sets initialTab (the ?sub=update reader), so a plain
// `props.initialTab ?? 'workflow'` seed always missed. The immediate watch covers both
// orders and applies the tab the moment the parent's URL read lands (the PlayTester field
// catch: the click reached the GitM page but rested on 'workflow').
watch(
  () => props.initialTab,
  (t) => {
    if (t) activeGitmTab.value = t;
  },
  { immediate: true },
);

// THE MUXAMETER GATES — the classed verdict + the CLI self-update surface.
const updateClass = computed<string>(() => props.versionCheck?.updateClass ?? 'none');
const cliUpdateNeeded = computed<boolean>(
  () => updateClass.value === 'cli' || updateClass.value === 'both' || updateClass.value === 'unknown',
);
const scpUpdateNeeded = computed<boolean>(
  () => updateClass.value === 'scp' || updateClass.value === 'both' || updateClass.value === 'unknown',
);
// cli-only → the SAVED-RESOLVER note: no template changes ride this release — the Update
// circuit (and its resolver) is not needed.
const resolverSaved = computed<boolean>(() => updateClass.value === 'cli');
// D-RD1 · the double-bind cure: the install button keys on SYNC-AVAILABLE (the remote
// version is newer than the global install), never on the class — red can persist on the
// scp leg while the button has already done its work anor still awaits its press.
const syncAvailable = computed<boolean>(() => props.versionCheck?.syncAvailable === true);
// The scp-leg split: does the GLOBAL install already carry the pending payload on disk?
// (yes → Run Update below, no install needed · no → install first, then Run Update).
const scpPayloadOnDisk = computed<boolean>(() => {
  const im = props.versionCheck?.installedMuxameter;
  const rm = props.versionCheck?.remoteMuxameter;
  if (!im || !rm) return false;
  return im.scp >= rm.scp;
});
const cliUpdateState = computed(() => props.gitmJson?.cliUpdate ?? null);
const cliUpdateBusy = computed<boolean>(() => cliUpdateState.value?.status === 'installing');
function runCliUpdate(): void {
  if (cliUpdateBusy.value) return;
  fireAction('gitm_run_cli_update', {});
}

function selectGitmTab(tab: GitmTab): void {
  activeGitmTab.value = tab;
}

function fireAction(tool: string, args: Record<string, unknown>): void {
  if (isGitmActing.value) return;
  emit('gitm-action', { tool, arguments: args });
}

function switchBranch(branch: string): void {
  if (!props.gitmJson || branch === props.gitmJson.currentBranch) return;
  fireAction('gitm_branch_switch', { name: branch });
}

function stageFile(file: string): void {
  fireAction('gitm_stage_file', { path: file });
}

function unstageFile(file: string): void {
  fireAction('gitm_unstage_file', { path: file });
}

function commit(): void {
  const message = commitMessage.value.trim();
  if (!props.gitmJson || message === '' || props.gitmJson.stagedFiles.length === 0) return;
  fireAction('gitm_commit', { message });
  commitMessage.value = '';
}

// C844 S3 · THE AMEND SEED — the Commit widget EDITS THE CURRENT COMMIT'S MESSAGE (the
// user's law). The input seeds from the relayed HEAD subject (gitm.json headCommitMessage ·
// the C844 STARC field) and RE-SEEDS when HEAD moves — unless the draft has diverged (the
// user's typing is never fought). Amend rides the EXISTING guarded quality
// (gitm_commit_amend · WATCHKEY two-click · staged files fold in per git semantics).
let lastSeededHead = '';
watch(
  () => props.gitmJson?.headCommitMessage ?? '',
  (head) => {
    if (head && (commitMessage.value.trim() === '' || commitMessage.value === lastSeededHead)) {
      commitMessage.value = head;
      lastSeededHead = head;
    }
  },
  { immediate: true },
);

function amendMessage(): void {
  const message = commitMessage.value.trim();
  if (message === '') return;
  fireSafeguard('gitm_commit_amend', { message });
}

// ──────────────────────────────────────────────────────────────────────────
// DEVBAR (#644) — the developer command menu above the Branches tab. Every chip
// fires fireAction(tool, args) through the existing emit pipe; enablement reads
// the relayed gitmJson snapshot. No host-wiring change (onGitmAction passes through).
// ──────────────────────────────────────────────────────────────────────────

// STASH — a small message input (default applied when empty · git stash needs no message).
const stashMessage = ref<string>('');

function stashPush(): void {
  if (!props.gitmJson || !props.gitmJson.dirty) return;
  const message = stashMessage.value.trim();
  fireAction('gitm_stash_push', message === '' ? {} : { message });
  stashMessage.value = '';
}

// ──────────────────────────────────────────────────────────────────────────
// BRANCHKEY (#644) — inline branch-create surface in the Branches group.
// validateBranchName runs as-you-type (git check-ref-format rules); a "Switch to
// new branch" checkbox (default true) maps to the CHECKOUT-TOGGLE (checkout flag).
// ──────────────────────────────────────────────────────────────────────────

const newBranchName = ref<string>('');
const switchToNew = ref<boolean>(true);

type BranchNameValidation = { valid: boolean; error: string };

function validateBranchName(name: string): BranchNameValidation {
  if (!name || name.trim() === '') return { valid: false, error: '' };
  if (name.includes(' ')) return { valid: false, error: 'No spaces — use hyphens or slashes' };
  if (name.includes('..')) return { valid: false, error: 'No double dots (..)' };
  if (name.includes('@{')) return { valid: false, error: 'Invalid sequence @{' };
  if (name.startsWith('-')) return { valid: false, error: 'Cannot start with a hyphen' };
  if (name.startsWith('/') || name.endsWith('/')) return { valid: false, error: 'Cannot start or end with a slash' };
  if (name.endsWith('.')) return { valid: false, error: 'Cannot end with a dot' };
  if (name.endsWith('.lock')) return { valid: false, error: 'Cannot end with .lock' };
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f~^:?*\\[]/.test(name)) return { valid: false, error: 'Invalid character' };
  if (name.includes('//')) return { valid: false, error: 'No consecutive slashes' };
  return { valid: true, error: '' };
}

const branchValidation = computed<BranchNameValidation>(() => validateBranchName(newBranchName.value));

// Collision guard — a name already in the branch list is not creatable.
const branchNameCollides = computed<boolean>(
  () => props.gitmJson?.branches.includes(newBranchName.value.trim()) ?? false,
);

const canCreateBranch = computed<boolean>(
  () =>
    !!props.gitmJson &&
    !props.gitmJson.detachedHead &&
    branchValidation.value.valid &&
    !branchNameCollides.value &&
    !isGitmActing.value,
);

function createBranch(): void {
  if (!canCreateBranch.value) return;
  fireAction('gitm_branch_create', {
    name: newBranchName.value.trim(),
    checkout: switchToNew.value,
  });
  newBranchName.value = '';
}

// C928 · THE RELEASE DOOR — remote origin management + push. The push of a release-ready SCP
// to its origin IS the release. Set/Modify rides gitm_set_remote (PARAMSEAL'd bridge-side);
// Push rides gitm_push (C928 first-push ease: no upstream + origin present → -u origin <branch>
// automatic). The current origin displays from the relayed gitmJson.remoteOrigin (C837).
const remoteUrlDraft = ref<string>('');
const remoteUrlLooksValid = computed<boolean>(() =>
  /^(https:\/\/[\w.-]+(:\d+)?\/[\w./~-]+|git@[\w.-]+:[\w./~-]+|ssh:\/\/[\w.@-]+(:\d+)?\/[\w./~-]+)$/.test(
    remoteUrlDraft.value.trim(),
  ),
);

function setRemoteOrigin(): void {
  if (!remoteUrlLooksValid.value || isGitmActing.value) return;
  fireAction('gitm_set_remote', { url: remoteUrlDraft.value.trim() });
  remoteUrlDraft.value = '';
}

// D-RD2 · THE SCP MANAGEMENT DOOR — the dual-rail deep link (the goUpdatePage exemplar):
// the release path continues in the SCS-Bridge island's SCP Management sub-page, where the
// Configuration JSON is assembled + copied.
function goScpManagement(): void {
  const params = new URLSearchParams(window.location.search);
  params.set('island', 'scsBridge');
  params.set('sub', 'scp-management');
  window.location.search = params.toString();
}
function pushToRemote(): void {
  if (isGitmActing.value) return;
  fireAction('gitm_push', {});
}

// GITM Dev Epoch (MD-A) — THE COMMAND LOG (newest-first). The bridge writes the ring newest-LAST
// (append/shift · cap 200) onto gitmJson.commandLog; the panel reverses for display so the most
// recent invocation sits at the top. Guarded (?? []) so a pre-MD-A gitm.json (no commandLog field)
// renders an empty pane rather than throwing.
const commandLogEntries = computed<string[]>(() =>
  [...(props.gitmJson?.commandLog ?? [])].reverse(),
);

// GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the live long-running-op strip. Non-null while the
// bridge has a currentOp latched (pull/push/fetch/merge/turn-over · surfaced via gitm.json.progress).
// Guarded (?? null) so a pre-MD-E gitm.json renders no strip. NO cancel is shown for these sync ops —
// execFileSync cannot abort mid-flight (the never-silent rule is met by VISIBILITY, not abortability).
const progress = computed<{ message: string; command: string } | null>(
  () => props.gitmJson?.progress ?? null,
);

// GITM Dev Epoch (MD-E · part 3 · THE COMMAND PALETTE) — Cmd/Ctrl+K opens the fuzzy-find over the
// action roster. The listener lives here (the island owns the keydown scope); the palette component
// handles up/down/enter/esc while open. focus-panel rows route to the relevant tab/section.
const isPaletteOpen = ref<boolean>(false);

function onPaletteHotkey(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    isPaletteOpen.value = !isPaletteOpen.value;
  }
}

function onPaletteAction(action: GitmPendingAction): void {
  // Re-emit through the SAME pipe the buttons use (the palette dispatch IS the button dispatch).
  emit('gitm-action', action);
}

function onPaletteFocusPanel(panel: 'branches' | 'graph' | 'changes' | 'commit' | 'stash'): void {
  // Route the focus row to the surface it names. Graph has its own tab; the rest live on the
  // workflow tab — switch there, then scroll the section into view on the next frame.
  if (panel === 'graph') {
    selectGitmTab('graph');
    return;
  }
  selectGitmTab('workflow');
  requestAnimationFrame(() => {
    const id =
      panel === 'branches' ? 'gitm-section-branches'
        : panel === 'commit' ? 'gitm-section-commit'
        : panel === 'stash' ? 'gitm-section-stash'
        : 'gitm-section-changes';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

onMounted(() => window.addEventListener('keydown', onPaletteHotkey));
onUnmounted(() => window.removeEventListener('keydown', onPaletteHotkey));

// GITM Dev Epoch (MD-C · fold #4 · STAGE-FROM-DIFF) — parse the relayed raw diff (gitmJson.activeDiff ·
// capped ~400 lines by the bridge) into per-file/per-hunk blocks client-side (the pure parser). Each
// hunk carries its own re-appliable patch for the per-hunk Stage button. Guarded (?? '') so a pre-MD-C
// gitm.json (no activeDiff field) renders an empty diff surface.
const diffFiles = computed<DiffFile[]>(() => parseUnifiedDiff(props.gitmJson?.activeDiff ?? ''));

// Stage ONE hunk — send its slice (file header + the single @@ hunk) to gitm_stage_hunk
// (git apply --cached - via the MD-A stdin seam). After staging, refresh the diff so the panel
// reflects the new staged/unstaged split.
function stageHunk(hunk: DiffHunk): void {
  if (isGitmActing.value) return;
  fireAction('gitm_stage_hunk', { patch: hunk.patch });
}

// Refresh the diff surface (re-read the unstaged working diff → activeDiff → relay).
function refreshDiff(): void {
  fireAction('gitm_load_diff', {});
}

// ──────────────────────────────────────────────────────────────────────────
// GITM Dev Epoch (MD-B · THE BRANCH LIST · THE BRANCH-SET LAW) — a fuzzy-find over the branch
// roster + Sword-marking of b/* rows + a per-row Set Active control routing through the Law.
// Set Active fires gitm_select_branch (the Shield-Gated Turn Over Routing Law); a b/* row's Set
// Active is DISABLED with the guard tooltip (the Law made visible — a Sword can never be a Shield).
// ──────────────────────────────────────────────────────────────────────────

const branchFilter = ref<string>('');

// ── D2 M9 W2 · THE TACTICAL BRIDGE ROLE SURFACES ─────────────────────────────────────────
// THE USER LAW (C596): any branch can be A anor B — the roles are EXPLICIT and decoupled from
// the checkout. Set A / Set B fire gitm_assign_role (the bridge guards existence · collision ·
// the foreign-sword seat); Rename fires gitm_rename_branch (the role-following rename — every
// pointer naming the old branch moves with it).
function assignRole(role: 'A' | 'B', branch: string): void {
  fireAction('gitm_assign_role', { role, branch });
}
const renamingBranch = ref<string>('');
const renameDraft = ref<string>('');
function beginRename(branch: string): void {
  renamingBranch.value = branch;
  renameDraft.value = branch;
}
function cancelRename(): void {
  renamingBranch.value = '';
  renameDraft.value = '';
}
function commitRename(): void {
  const src = renamingBranch.value;
  const dst = renameDraft.value.trim();
  if (src === '' || dst === '' || dst === src) {
    cancelRename();
    return;
  }
  fireAction('gitm_rename_branch', { branch: src, newName: dst });
  cancelRename();
}
// The role identity per row — canonical roles equality (never the b/ prefix).
function roleOf(branch: string): 'A' | 'B' | '' {
  const r = props.gitmJson?.branchRoles;
  if (r?.a === branch && branch !== '') return 'A';
  if (r?.b === branch && branch !== '') return 'B';
  return '';
}
// THE SEAT-LAW INDICATOR — seat on B while A stays the guarded ground (the designed state
// post Turn-Over A; informative, never alarming).
const seatOnWorkingB = computed<boolean>(() => {
  const g = props.gitmJson;
  return !!g && g.branchRoles?.b !== undefined && g.branchRoles.b !== '' &&
    g.currentBranch === g.branchRoles.b && (g.branchRoles.a ?? '') !== '';
});

// A Sword (the working namespace) — visually marked, and never Shield-settable. D-BN · THE
// branchRoles SWEEP — role identity is the canonical roles.b (isWorkingBranchPer), NOT the `b/`
// prefix; the prefix is the legacy fallback only when a pre-sweep gitm.json lacks branchRoles.
function isSword(branch: string): boolean {
  return isWorkingBranchPer(branch, props.gitmJson);
}

// Case-insensitive substring fuzzy-find over the branch roster (empty filter = the full list).
const filteredBranches = computed<string[]>(() => {
  const all = props.gitmJson?.branches ?? [];
  const q = branchFilter.value.trim().toLowerCase();
  if (q === '') return all;
  return all.filter((b) => b.toLowerCase().includes(q));
});

// THE BRANCH-SET LAW · Set a branch ACTIVE through the Law (gitm_select_branch). The bridge routes:
// b/ → guard (nothing moves); Shield with no Sword → plain-ground turnover; Shield with Swords →
// equip the newest Sword + re-pair. A b/* branch is NEVER Shield-settable (the guard-disabled row).
function setActiveBranch(branch: string): void {
  if (!props.gitmJson || branch === props.gitmJson.currentBranch) return;
  if (isSword(branch)) return; // the Law: a Sword can never be a Shield (the row is disabled too)
  fireAction('gitm_select_branch', { branchName: branch });
}

// ──────────────────────────────────────────────────────────────────────────
// GITM Dev Epoch (MD-B · THE LABELED STASH BROWSER) — the stash roster off gitmJson.stashList
// (`<gitref>|<subject>` per entry). Refresh fires gitm_stash_list; each row shows label|subject.
// Push (with the label prompt above) + Pop reuse the existing stash devgroup controls.
// ──────────────────────────────────────────────────────────────────────────

type StashEntry = { ref: string; subject: string };

// Parse each `<gitref>|<subject>` roster line into { ref, subject } for the browser rows.
const stashEntries = computed<StashEntry[]>(() =>
  (props.gitmJson?.stashList ?? []).map((line) => {
    const bar = line.indexOf('|');
    if (bar === -1) return { ref: line, subject: '' };
    return { ref: line.slice(0, bar), subject: line.slice(bar + 1) };
  }),
);

function refreshStashList(): void {
  fireAction('gitm_stash_list', {});
}

// ──────────────────────────────────────────────────────────────────────────
// GITM 3LOC ROTATING CHANGE-COUNT PILL — the "number goes up" pill on the status bar.
// Decision B · TWO orthogonal signals at once:
//   FILL   = the most-recently-changed location's color (Yellow=Base · Blue=Cascade ·
//            Red=SCP · from gitmJson.mostRecentLocation). The count is
//            locations[mostRecentLocation].changeCount (recency picks the location;
//            the location supplies the count — NOT argmax over count).
//   BORDER = the A/B protection state (maroon=EXPOSED on A · viridian=PROTECTED on B ·
//            none otherwise) — overlays ONLY when the rotation rests on the Base.
// Graceful fallback (be3019b · pre-3LOC gitm.json with no `locations`): the baseline
// Yellow count from changesPrimedOnB, so an old bridge's gitm.json still renders.
// ──────────────────────────────────────────────────────────────────────────

type LocationColor = 'yellow' | 'blue' | 'red';
type AbBorder = 'exposed' | 'protected' | 'none';

const locationPill = computed<{
  color: LocationColor;
  count: number;
  abBorder: AbBorder;
  label: string;
  title: string;
}>(() => {
  const g = props.gitmJson;
  if (!g) {
    return { color: 'yellow', count: 0, abBorder: 'none', label: '', title: '' };
  }
  const mr = g.mostRecentLocation ?? '';
  // Back-compat: pre-3LOC gitm.json (no locations key / no rotation) → baseline Yellow.
  if (mr === '' || !g.locations) {
    const count = g.changesPrimedOnB;
    const onA = g.stableBranch !== '' && g.currentBranch === g.stableBranch;
    const onB = g.workingBranch !== '' && g.currentBranch === g.workingBranch;
    const abBorder: AbBorder = onA ? 'exposed' : onB ? 'protected' : 'none';
    return {
      color: 'yellow',
      count,
      abBorder,
      label: 'Base',
      title:
        abBorder === 'exposed'
          ? 'Base · working on A (the anchor) — changes are NOT protected.'
          : abBorder === 'protected'
            ? 'Base · working on B — A is protected. ' + count + ' change(s) primed.'
            : count + ' uncommitted change(s) in the Base project.',
    };
  }
  const sub = g.locations[mr];
  const count = sub ? sub.changeCount : 0;
  const color: LocationColor = mr === 'base' ? 'yellow' : mr === 'cascade' ? 'blue' : 'red';
  const label = mr === 'base' ? 'Base' : mr === 'cascade' ? 'Cascade' : 'SCP';
  // A/B border ONLY when the rotation rests on the Base AND an A/B branch is live.
  const onA = mr === 'base' && g.stableBranch !== '' && g.currentBranch === g.stableBranch;
  const onB = mr === 'base' && g.workingBranch !== '' && g.currentBranch === g.workingBranch;
  const abBorder: AbBorder = onA ? 'exposed' : onB ? 'protected' : 'none';
  const protNote =
    abBorder === 'exposed'
      ? ' · on A (the anchor) — changes NOT protected'
      : abBorder === 'protected'
        ? ' · on B — A is protected'
        : '';
  return {
    color,
    count,
    abBorder,
    label,
    title: `${label} · ${count} change(s)${protNote}`,
  };
});

// ──────────────────────────────────────────────────────────────────────────
// SAFEGUARD (#644) — the T3 chips run the WATCHKEY 2-click = 2-call handshake.
// Click 1 → fireAction(tool, {}) (call-1, no token); the bridge returns guardFired +
// confirmToken → it arrives via gitmJson.pendingConfirm (the relay) → the chip arms
// (keyed off pendingConfirm.action === <quality>). Click 2 (while armed) →
// fireAction(tool, { confirmToken, ...args }) (call-2) → executes; pendingConfirm clears.
// The bridge mints + validates the token (canonical confirm-token model); the SCP only
// reads pendingConfirm.action (to key the ARMED chip) and pendingConfirm.token (to send back).
// ──────────────────────────────────────────────────────────────────────────

// The pendingConfirm.action quality-name each T3 tool string maps to (the bridge seals the
// token under the qualityName, surfaced on pendingConfirm.action — the ARMED key).
const SAFEGUARD_QUALITY: Record<string, string> = {
  gitm_commit_amend: 'gitmCommitAmend',
  gitm_discard_all: 'gitmDiscardAll',
  gitm_branch_delete: 'gitmBranchDelete',
  gitm_force_push: 'gitmForcePush',
};

// Which SAFEGUARD tool is currently ARMED (its quality matches the relayed pendingConfirm).
function isArmed(tool: string): boolean {
  const pending = props.gitmJson?.pendingConfirm;
  return !!pending && pending.action === SAFEGUARD_QUALITY[tool];
}

// The 2-click SAFEGUARD handshake. Click 1 fires call-1 (no token → bridge mints +
// relays pendingConfirm). Click 2 (when this tool is armed) fires call-2 with the relayed
// confirmToken → the bridge validates + executes + clears pendingConfirm.
function fireSafeguard(tool: string, args: Record<string, unknown> = {}): void {
  if (isGitmActing.value) return;
  const pending = props.gitmJson?.pendingConfirm;
  if (pending && pending.action === SAFEGUARD_QUALITY[tool]) {
    // Click 2 — armed: carry the relayed token back for the executing call.
    fireAction(tool, { ...args, confirmToken: pending.token });
    return;
  }
  // Click 1 — mint: a no-token call surfaces the WATCHKEY warning + token.
  fireAction(tool, args);
}

// ──────────────────────────────────────────────────────────────────────────
// GITM Dev Epoch (MD-D · CONFLICT CHROME + THE THREE-WAY SURFACE) — when conflicts>0 the whole
// island flips to a persistent red luminous MODE (a computed class on the root · NOT a toast); a
// conflicted-files list becomes primary + an ABORT control is always visible (gitm_merge_abort).
// Selecting a file loads its four sides (gitm_load_conflict → gitmJson.activeConflict) into the
// three-way editor (GitmConflictEditor.vue). Save & Mark Resolved → gitm_resolve_conflict.
// ──────────────────────────────────────────────────────────────────────────

// The persistent red MODE — true whenever the relayed snapshot carries unresolved conflicts.
const inConflictMode = computed<boolean>(() => (props.gitmJson?.conflicts.length ?? 0) > 0);

// The four-side surface the editor renders (the bridge loads it via gitm_load_conflict).
const activeConflict = computed(() => props.gitmJson?.activeConflict ?? null);

// Load a conflicted file's four sides into the editor (call fires gitm_load_conflict).
function openConflict(path: string): void {
  fireAction('gitm_load_conflict', { path });
}

// Save the resolved OUTPUT → write + git add (mark-resolved). The editor emits the content.
function resolveConflict(payload: { path: string; content: string }): void {
  fireAction('gitm_resolve_conflict', { path: payload.path, content: payload.content });
}

// Abort the whole conflicting merge — the always-visible recovery control.
function abortMerge(): void {
  fireAction('gitm_merge_abort', {});
}

// ──────────────────────────────────────────────────────────────────────────
// STAGING UPDATE VIEW (D-U4.4) — the user-facing Update surface. Read-only PREVIEW:
// it renders the live stage rail (off gitmJson.updateStatus · D-U4.1), the change list
// + collision diff (off updateDiff · D-U4.2), runs the staging-update engine (gitm_run_update
// · D-U4.3), and spawns the Gitm Resolver session with a dedicated directive. Apply is a
// disabled stub (lands in the next portion). Every updateDiff access is null-guarded — the
// stage rail + empty states render even before the engine has run.
// ──────────────────────────────────────────────────────────────────────────

// The ordered stages — the rail walks left-to-right; the live stage comes off
// gitmJson.updateStatus.stage. The 'error' stage is handled separately (it freezes the rail
// at the last real position and surfaces stageError). 'idle' = pre-run (rail collapsed).
const UPDATE_STAGES = ['cloning', 'diffing', 'reviewing', 'resolving', 'applying'] as const;
type UpdateStage = (typeof UPDATE_STAGES)[number];

// The human-facing chip labels (plain copy · no framework vocabulary in the shipped strings).
const STAGE_LABELS: Record<UpdateStage, string> = {
  cloning: 'Clone',
  diffing: 'Compare',
  reviewing: 'Review',
  resolving: 'Resolve',
  applying: 'Apply',
};

type StageChipState = 'done' | 'active' | 'pending' | 'error';

// One rail chip: ordinal-derive each chip's state from the live stage.
// done if its ordinal < current · active if == current · pending if > current ·
// error replaces the active chip when the engine reports a stage error.
const stageRail = computed<{ key: UpdateStage; label: string; state: StageChipState }[]>(() => {
  const status = props.gitmJson?.updateStatus;
  const live = status?.stage ?? 'idle';
  const isError = live === 'error';
  // MD-UFS · THE POSITION DERIVATION (no new schema — the rail already tells where):
  // cloneMode never stamped → the CLONE leg died · no diff present → COMPARE ·
  // an apply-prefixed stageError → APPLY · else the failure sat at/after REVIEW.
  // The pills BEFORE the failed position read done; the failed one alone reads error.
  const failedOrdinal = !isError
    ? -1
    : (status?.cloneMode ?? '') === ''
      ? 0
      : status?.diffPresent !== true
        ? 1
        : (status?.stageError ?? '').startsWith('apply')
          ? 4
          : 2;
  // On 'idle' the rail is not shown (the empty-state CTA renders instead). The current ordinal
  // is the live stage's index; 'idle'/'error' both resolve to -1 (no active chip on the rail).
  const currentOrdinal = UPDATE_STAGES.indexOf(live as UpdateStage);
  return UPDATE_STAGES.map((key, ordinal) => {
    let state: StageChipState;
    if (isError) {
      // The engine halted — the FAILED position reads error; the reached legs read done.
      state = ordinal < failedOrdinal ? 'done' : ordinal === failedOrdinal ? 'error' : 'pending';
    } else if (ordinal < currentOrdinal) {
      state = 'done';
    } else if (ordinal === currentOrdinal) {
      state = 'active';
    } else {
      state = 'pending';
    }
    return { key, label: STAGE_LABELS[key], state };
  });
});

// The live stage error message (empty when no error).
// MD-UFS · THE NON-EMPTY GUARANTEE (view-side): the rail can carry the failure voice in
// stageError ANOR note (the failure-node/expiry class leaves stageError '') — surface
// WHATEVER it carries; an error stage must NEVER render as silent all-red.
const stageErrorMessage = computed<string>(() => {
  const status = props.gitmJson?.updateStatus;
  if (!status || status.stage !== 'error') return '';
  if (status.stageError !== '') return status.stageError;
  if ((status.note ?? '') !== '') return status.note;
  return 'the update engine halted without a message — Run Update again (a first run may have been refreshing the source)';
});

// Whether the engine is mid-flight (any non-terminal active stage). Gates the Run Update button.
const isUpdating = computed<boolean>(() => {
  const stage = props.gitmJson?.updateStatus?.stage ?? 'idle';
  return stage === 'cloning' || stage === 'diffing' || stage === 'resolving' || stage === 'applying';
});

// The pre-update / empty state: no diff present AND the engine is idle → collapse to a single CTA.
const isPreUpdate = computed<boolean>(() => {
  const status = props.gitmJson?.updateStatus;
  if (!status) return true;
  return status.diffPresent === false && status.stage === 'idle';
});

// Whether the whole Update section renders at all (diff present OR the engine has moved off idle).
const showUpdateSection = computed<boolean>(() => {
  const status = props.gitmJson?.updateStatus;
  if (!status) return false;
  return status.diffPresent || status.stage !== 'idle';
});

// APPLY-SUCCESS SIGNAL (bridge C293) — the update has LANDED and the bridge is inviting the finalize
// gesture. The bridge stamps updateStatus = { stage: 'idle', note: UPDATE_APPLIED_NOTE } after an
// auto-apply. When both hold, the Apply Success screen renders INSTEAD of the (now stale) stage rail +
// buckets + collision diff — which also supersedes any RESOLVE-ghost (re-hydrated old diff/resolved
// artifacts): the applied state is terminal, so the finalize motion is the only thing left to show.
const isApplied = computed<boolean>(() => {
  const status = props.gitmJson?.updateStatus;
  if (!status) return false;
  return status.stage === 'idle' && status.note === UPDATE_APPLIED_NOTE;
});

// F4 · THE NO-SWORD FINALIZE — whether a working B exists to turn over. The standard finalize is
// GitmTurnOverBButton (it turns over the existing B). But when NO working B exists (workingBranch
// empty AND not currently on a b/* branch), that button is inert — so the Apply Success panel offers
// the HARD Turn-Over control instead (the dock 'turn-over' hard leg · triggerHardTurnOver). The
// reboot onto the applied code IS the proof, exactly as the soft path.
const hasWorkingB = computed<boolean>(() => {
  const g = props.gitmJson;
  if (!g) return false;
  const wb = g.workingBranch ?? '';
  const cur = g.currentBranch ?? '';
  // D-BN · THE branchRoles SWEEP — the current-branch leg is a ROLE check (is `cur` the working B?),
  // decided by the canonical roles.b (isWorkingBranchPer), with the `b/` prefix as the legacy fallback.
  return wb !== '' || isWorkingBranchPer(cur, g);
});

// MD-ATC-F · THE TRACKED A FINALIZE (the disjointed-extra-step cure): the prior hard leg
// restarted WITHOUT the turn-over protocol — no turnOver stamp (the alert overlay
// re-appeared on resume) and no boot-proof reset (the panel never yielded). The finalize
// now rides the SAME tracked pipe as every turn-over (gitm_turn_over_with_source ·
// source 'A' — the clean post-apply tree passes the bridge guard plainly): the stamp
// retires the alert, the reboot proves the update, and the boot-report reset yields
// this panel so the Update workflow can run again. Bridge guards stay authoritative.
function finalizeTurnOverA(): void {
  fireAction('gitm_turn_over_with_source', { source: 'A' });
}

// The summary conference count (true overlaps surfaced from the diff · 0 when no diff).
const conferenceCount = computed<number>(() => props.updateDiff?.summary.conference ?? 0);

// Run Update — fires the staging-update engine through the existing gitm-action emit pipe.
function runUpdate(): void {
  if (isUpdating.value || isGitmActing.value) return;
  fireAction('gitm_run_update', {});
}

// SCP-UPD D-U5 — the Apply gate. Enabled only when a resolved manifest has landed AND every
// conference decision is resolved (pending === 0) — the same HALT gate the bridge apply quality
// enforces. The 'apply'/'preserve' buckets carry NO standalone gate here; the resolver's manifest
// is the totality the bridge lands. When there are NO collisions, the resolver still emits a
// pending=0 manifest (every apply/preserve decision recorded), so apply enables the same way.
const canApply = computed<boolean>(() => {
  const resolved = props.updateResolved ?? null;
  if (resolved === null) return false;
  return (resolved.pending ?? 0) === 0 && !isUpdating.value && !isGitmActing.value;
});

// Whether the engine is mid-apply (the rail stamped 'applying' · drives the button label).
const isApplying = computed<boolean>(
  () => (props.gitmJson?.updateStatus?.stage ?? 'idle') === 'applying',
);

// F2 · THE RUN-UPDATE LABEL surfaces the truth, not a stuck 'Updating…'. Three cases:
//   error → the red error message (the stageError · the stall is now visible)
//   idle + applied-note → 'Update Applied' (terminal · NOT busy · the button is done)
//   otherwise → the mid-flight / entry label.
// This kills the silent 'Updating…' stall the STAMP RACE left on the rail.
const runUpdateLabel = computed<string>(() => {
  const status = props.gitmJson?.updateStatus;
  if (status && status.stage === 'error' && status.stageError !== '') {
    return status.stageError;
  }
  if (status && status.stage === 'idle' && status.note === UPDATE_APPLIED_NOTE) {
    return 'Update Applied';
  }
  return isUpdating.value ? 'Updating…' : 'Run Update';
});

// Apply — lands the resolved staging update through the existing gitm-action emit pipe
// (mirror runUpdate · the bridge gitm_run_apply quality reads the resolved manifest, HALTs on
// pending, writes/patches/preserves into the SCP tree, then stages+commits).
function applyUpdate(): void {
  if (!canApply.value) return;
  fireAction('gitm_run_apply', {});
}

// ──────────────────────────────────────────────────────────────────────────
// SPAWN RESOLVER (ODSS · D-U4.4) — clone of Suite8OnDemand's phase machine. Spawns a
// "Gitm Resolver" session, watches the session list for the new row, then delivers the
// dedicated resolution directive (the act = deliver the directive · NOT send a message).
// ──────────────────────────────────────────────────────────────────────────

type ResolverPhase = 'idle' | 'spawning' | 'waiting' | 'delivering' | 'done' | 'error';
const resolverPhase = ref<ResolverPhase>('idle');
const resolverError = ref<string>('');
const resolverSessionId = ref<string | null>(null);
// Snapshot the session count at spawn so the new-row detection is precise.
const sessionCountAtSpawn = ref<number>(0);

// SORD Shield/Sword FIX (053 diagnosis · swept from c823c40) — resolve the controller via inject
// (the proven send_message accessor · Vue runtime-singleton) with the getGlobal fallback. getGlobal
// is null/stale in the TaskBar render context (cached at setup · cleared on IslandWrapper unmount),
// so the spawn-resolver lane (controller.value below) read null. inject resolves once at setup; the
// computed wraps the resolved const to preserve the existing controller.value access shape.
const resolvedController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();
const controller = computed(() => resolvedController);

const sessionsList = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// D-UP2 · the shared diff-entry count (apply + preserve + conference) both resolver states key on.
const diffEntryCount = computed<number>(() => {
  const d = props.updateDiff ?? null;
  return d
    ? (d.summary?.apply ?? 0) + (d.summary?.preserve ?? 0) + (d.summary?.conference ?? 0)
    : 0;
});

// The Spawn Resolver's THREE states (D-UP2 · the optional-resolver refinement):
//   REQUIRED (solid)  — a diff awaits resolution: no resolution body yet, anor one exists but
//     carries pending conference decisions. C285 (the 078 clean-update deadlock): the prior
//     conference-only gate locked out the ZERO-collision case — the most common one — where the
//     resolver's trivial auto-path pass is still REQUIRED to write the manifest APPLY consumes
//     (and to fire the Concluding Sequence). Conferences gate the QUESTIONS, not the spawn.
//   OPTIONAL (dotted) — a COMPLETE resolution already landed (pending 0 · Apply is live). The
//     resolver may be re-spawned to review anor redo the decisions before applying — the button
//     stays alive with a dotted border marking optionality instead of the prior hard-disable.
//   DIMMED            — no diff entries yet (run the update first) anor a spawn is in flight.
// D-UP3 · THE RUN-GATE (the stale-artifact wound · S2 trace): the resolver states exist
// only within a LIVE update cycle — the compare has run THIS round and the rail rests at
// 'reviewing' anor 'resolving'. Diff/resolved artifacts hydrated from a PRIOR cycle land
// with stage 'idle' and no longer enable the resolver — Run Update is the door every cycle.
// (Bridge-side, the apply now clears its cycle's artifacts — this gate is the page's belt.)
const updateCycleLive = computed<boolean>(() => {
  const stage = props.gitmJson?.updateStatus?.stage ?? 'idle';
  return stage === 'reviewing' || stage === 'resolving';
});
const resolverRequired = computed<boolean>(() => {
  const resolved = props.updateResolved ?? null;
  return (
    updateCycleLive.value &&
    diffEntryCount.value > 0 &&
    (resolved === null || (resolved.pending ?? 0) > 0)
  );
});
const resolverOptional = computed<boolean>(() => {
  const resolved = props.updateResolved ?? null;
  return (
    updateCycleLive.value &&
    diffEntryCount.value > 0 &&
    resolved !== null &&
    (resolved.pending ?? 0) === 0
  );
});
const canSpawnResolver = computed<boolean>(() => {
  return (
    (resolverRequired.value || resolverOptional.value) &&
    !isSpawningSuite8.value &&
    resolverPhase.value === 'idle'
  );
});

const resolverStatusText = computed<string>(() => {
  switch (resolverPhase.value) {
    case 'spawning':   return 'Starting resolver session…';
    case 'done':       return 'Resolver session started — instructions ride the first entry.';
    case 'error':      return `Error: ${resolverError.value}`;
    default:           return '';
  }
});

// RS.2b · THE COMBINED INITIAL ENTRY — the post-spawn delivery watcher is RETIRED.
// The field capture proved the C285 interleave class re-entered through the Onboard seed:
// the 6s backoff gated the APP BOOT, but the Onboard turn was new work between boot and
// delivery — the typed delivery landed on a mid-turn input and fragmented. Every anchor
// parameter derives from scpName at SPAWN time, so the anchor now rides the spawn itself
// (triggerSpawnSuite8Session 6th arg → registry entry → cli-handler composes Onboard +
// anchor as ONE initial positional prompt). No delivery → no race → no backoff → the
// standBy overlay arm is skipped bridge-side. triggerDeliverVermillion remains for
// genuine mid-session directives only.

function spawnResolver(): void {
  if (!canSpawnResolver.value) return;
  const ctrl = controller.value;
  if (!ctrl) {
    resolverPhase.value = 'error';
    resolverError.value = 'No bridge connection available.';
    return;
  }

  const scpName = props.gitmJson?.updateStatus.scpName ?? '';
  const diffJsonPath = `Cascades/Bridge/scp-update-diff.${scpName}.json`;
  // The intent anchor is built HERE — frozen at spawn time from the same rail read the
  // spawn itself uses (no delivery-time re-read to drift against).
  const directive = buildGitmResolverVermillion(scpName, diffJsonPath);
  sessionCountAtSpawn.value = sessionsList.value.length;
  resolverPhase.value = 'spawning';

  // D-UP · asWorker=true (fresh worker · anti-flood skipped so repeat updates always spawn) +
  // manualMode=true (NO auto-permission — the update is user-controlled; Claude Code's approval
  // gate stays intact). RS.2b · the anchor rides as the 6th arg — one initial entry.
  ctrl.triggerSpawnSuite8Session('Gitm Resolver', scpName, true, false, true, directive);

  // SIGR auto-clear — once the spawn ack lands (isSpawningSuite8 → false) the hand-off is
  // complete: the bridge carries the composed initial entry; nothing further to deliver.
  const sigRWatcher = watch(
    () => isSpawningSuite8.value,
    (nowSpawning) => {
      if (!nowSpawning && resolverPhase.value === 'spawning') {
        resolverPhase.value = 'done';
        sigRWatcher();
      }
    },
  );
}
</script>

<template>
  <section class="gitm-subpage" :class="{ 'gitm-conflict-mode': inConflictMode }">
    <!-- GITM Dev Epoch (MD-E · part 2 · PROGRESS STRIP) — a slim top strip shown while the bridge has
         a long-running op in flight (gitm.json.progress non-null · pull/push/fetch/merge/turn-over).
         The message + the live git command · a soft pulse. NO cancel (execFileSync can't abort a sync
         op mid-flight — the never-silent rule is met by VISIBILITY, not abortability). Yellow register
         = in-progress (matches the command-log + update in-progress borders). -->
    <div v-if="progress" class="gitm-progress-strip" role="status" aria-live="polite">
      <span class="gitm-progress-spinner" aria-hidden="true"></span>
      <span class="gitm-progress-message">{{ progress.message }}</span>
      <code class="gitm-progress-command">{{ progress.command }}</code>
    </div>

    <!-- Empty state · no gitm.json relayed yet -->
    <div v-if="gitmJson === null" class="gitm-empty hifi-pane-base">
      <h2 class="hifi-heading">Git</h2>
      <p class="gitm-empty-text">
        No git status available yet. The bridge writes
        <code>Cascades/Bridge/gitm.json</code> on boot — confirm the bridge is running and the
        working directory is a git repository.
      </p>
    </div>

    <!-- Non-repo state · gitm.json present but isRepo false -->
    <div v-else-if="!gitmJson.isRepo" class="gitm-nonrepo hifi-pane-base">
      <h2 class="hifi-heading">Git</h2>
      <p class="gitm-empty-text">The working directory is not a git repository.</p>
    </div>

    <template v-else>
      <!-- T1 · Status header -->
      <header class="gitm-status hifi-pane-green">
        <div class="gitm-status-row">
          <h2 class="gitm-branch hifi-heading">
            {{ gitmJson.detachedHead ? 'detached HEAD' : gitmJson.currentBranch || 'detached' }}
          </h2>
          <span
            class="gitm-chip"
            :class="gitmJson.dirty ? 'gitm-chip-dirty' : 'gitm-chip-clean'"
          >
            {{ gitmJson.dirty ? 'Dirty' : 'Clean' }}
          </span>
          <span
            v-if="gitmJson.ahead !== 0 || gitmJson.behind !== 0"
            class="gitm-aheadbehind"
          >
            +{{ gitmJson.ahead }} / -{{ gitmJson.behind }}
          </span>
          <!-- GITM 3LOC ROTATING TICKER BADGE — the change count of the MOST-RECENTLY-CHANGED
               location (Decision B). FILL = location color (Yellow=Base · Blue=Cascade · Red=SCP).
               BORDER = A/B protection (maroon=exposed on A · viridian=protected on B). Both at once.
               Absent at zero. Graceful fallback to the Yellow baseline on a pre-3LOC gitm.json. -->
          <span
            v-if="locationPill.count > 0"
            class="gitm-ab-pill"
            :class="[
              locationPill.color === 'yellow' ? 'gitm-loc-pill-yellow'
                : locationPill.color === 'blue' ? 'gitm-loc-pill-blue'
                : 'gitm-loc-pill-red',
              locationPill.abBorder === 'exposed' ? 'gitm-loc-pill-ab-exposed'
                : locationPill.abBorder === 'protected' ? 'gitm-loc-pill-ab-protected'
                : '',
            ]"
            :title="locationPill.title"
          >
            <template v-if="locationPill.label">{{ locationPill.label }} · </template>{{ locationPill.count }}
          </span>
          <span v-if="isGitmActing" class="gitm-spinner" aria-label="working">…</span>
        </div>
        <!-- Detached / conflict warning banner reconstructed from snapshot fields -->
        <div v-if="gitmJson.detachedHead" class="gitm-banner gitm-banner-danger">
          Detached HEAD state — commits may be lost on checkout.
        </div>
        <div
          v-if="gitmJson.conflicts.length > 0"
          class="gitm-banner gitm-banner-danger"
        >
          Merge conflicts in {{ gitmJson.conflicts.length }}
          {{ gitmJson.conflicts.length === 1 ? 'file' : 'files' }}.
        </div>
        <!-- ACTION-ERROR BANNER (#644 · Front 1) — the transient action-error surface. Set on a
             failed git op (the captured git stderr · e.g. index.lock / git-not-found); cleared on
             a real user-tree change (CHANGEDIAL outside Cascades/Bridge/) + on the next .git STARC
             read. Reuses the danger register; absent when errorCode is empty. -->
        <div
          v-if="gitmJson.errorCode !== ''"
          class="gitm-banner gitm-banner-danger gitm-banner-error"
        >
          <strong>{{ gitmJson.errorCode }}</strong>
          <span v-if="gitmJson.errorMessage !== ''"> — {{ gitmJson.errorMessage }}</span>
        </div>
      </header>

      <!-- GITM Dev Epoch (MD-D · CONFLICT CHROME) — the primary conflict surface. When conflicts>0
           this becomes the dominant panel: the conflicted-files list + the always-visible ABORT +
           the four-pane three-way editor for the file currently loaded (gitmJson.activeConflict). -->
      <section v-if="inConflictMode" class="gitm-conflict-panel">
        <div class="gitm-conflict-panel-head">
          <span class="gitm-conflict-panel-title">
            <i class="fa-solid fa-code-merge" aria-hidden="true"></i>
            Merge Conflicts — {{ gitmJson.conflicts.length }}
            {{ gitmJson.conflicts.length === 1 ? 'file' : 'files' }}
          </span>
          <button
            class="gitm-conflict-abort"
            type="button"
            :disabled="isGitmActing"
            title="Abort the merge and restore the pre-merge state"
            @click="abortMerge"
          >
            <i class="fa-solid fa-ban" aria-hidden="true"></i>
            Abort Merge
          </button>
        </div>
        <ul class="gitm-conflict-files">
          <li
            v-for="cf in gitmJson.conflicts"
            :key="cf"
            class="gitm-conflict-file"
            :class="{ active: activeConflict?.path === cf }"
          >
            <button
              class="gitm-conflict-file-open"
              type="button"
              :disabled="isGitmActing"
              @click="openConflict(cf)"
            >
              <i class="fa-solid fa-file-code" aria-hidden="true"></i>
              {{ cf }}
            </button>
          </li>
        </ul>

        <!-- THE THREE-WAY SURFACE — LOCAL/BASE/REMOTE/OUTPUT · per-block take-ours/theirs/both. -->
        <GitmConflictEditor
          v-if="activeConflict"
          :conflict="activeConflict"
          :busy="isGitmActing"
          @resolve="resolveConflict"
        />
        <p v-else class="gitm-conflict-hint">
          Select a conflicted file above to open the three-way editor.
        </p>
      </section>

      <!-- GITM SUB-NAV (Portion 1) — a local two-tab nav within the gitm sub-page. Workflow =
           the base/neutral git surface; Update = the purple closing-action lane (always visible).
           The conference-count badge surfaces on the Update tab when there are collisions. -->
      <nav class="gitm-subnav hifi-pane-base">
        <button
          type="button"
          class="gitm-subnav-tab gitm-subnav-workflow"
          :class="{ active: activeGitmTab === 'workflow' }"
          :aria-pressed="activeGitmTab === 'workflow'"
          @click="selectGitmTab('workflow')"
        >
          GitM Workflow
        </button>
        <!-- GITM Dev Epoch (MD-C · THE DAG) — the commit-graph tab. -->
        <button
          type="button"
          class="gitm-subnav-tab gitm-subnav-graph"
          :class="{ active: activeGitmTab === 'graph' }"
          :aria-pressed="activeGitmTab === 'graph'"
          @click="selectGitmTab('graph')"
        >
          Graph
        </button>
        <button
          type="button"
          class="gitm-subnav-tab gitm-subnav-update"
          :class="{ active: activeGitmTab === 'update' }"
          :aria-pressed="activeGitmTab === 'update'"
          @click="selectGitmTab('update')"
        >
          Update
          <span v-if="conferenceCount > 0" class="gitm-subnav-badge">{{ conferenceCount }}</span>
        </button>
      </nav>

      <!-- ══ UPDATE TAB ══ The Staging Update lane. ALWAYS renders when its tab is active —
           even when idle: showUpdateSection switches the idle-entry CTA vs the live stage rail +
           buckets + collision diff WITHIN the always-rendered tab. -->
      <template v-if="activeGitmTab === 'update'">
        <!-- ═ THE VERSIONING MUXAMETER PANEL ═ — the classed verdict heads the Update tab.
             The install action is offered for EVERY class (cli/scp/both/unknown): the npm
             package carries the app template, so even an scp-only release needs the install
             on disk before the circuit below can deliver it (the retained clone refreshes
             from the installed tree). The distinctions are downstream of the install:
             cli-only → the SAVED-RESOLVER note (the circuit below is not needed) + restart
             required; scp-only → install then Run Update (no relaunch needed — the running
             bridge reads the new template payload from disk); both → install + relaunch +
             Run Update. Renders above every update state (idle · staging · apply success). -->
        <section
          v-if="cliUpdateNeeded || scpUpdateNeeded || resolverSaved || syncAvailable || cliUpdateState?.status === 'restart-required'"
          class="gitm-muxameter hifi-pane-purple"
        >
          <div class="gitm-muxameter-row">
            <span class="gitm-muxameter-label hifi-mono">SCS-BRIDGE CLI</span>
            <span v-if="versionCheck?.npmLatestVersion" class="gitm-muxameter-versions hifi-mono">
              installed v{{ versionCheck?.installedVersion ?? '—' }} · npm v{{ versionCheck?.npmLatestVersion }}
            </span>
            <!-- RESTART REQUIRED — the install landed a newer CLI on disk; the relaunch is yours. -->
            <span
              v-if="cliUpdateState?.status === 'restart-required'"
              class="gitm-muxameter-restart hifi-mono"
            >
              RESTART REQUIRED · v{{ cliUpdateState?.installedOnDisk }} installed — quit and relaunch <code>scs</code>
            </span>
            <button
              v-else-if="syncAvailable"
              class="hifi-btn hifi-btn-purple"
              :disabled="cliUpdateBusy || isGitmActing"
              @click="runCliUpdate"
            >
              {{ cliUpdateBusy ? 'Updating CLI…' : 'Update SCS-Bridge CLI' }}
            </button>
            <span
              v-if="cliUpdateState?.status === 'failed'"
              class="gitm-muxameter-failed hifi-mono"
            >
              CLI update failed — run <code>npm install -g scs-bridge</code> from a terminal.
            </span>
          </div>
          <p v-if="resolverSaved" class="gitm-muxameter-saved">
            This release changes the CLI only — <span class="hifi-hl-green">your app needs no
            changes</span>, and the update circuit below is not needed this time.
          </p>
          <p v-else-if="updateClass === 'both'" class="gitm-muxameter-saved">
            Both aspects updated: run the CLI update above (then relaunch), and carry your app
            current with Run Update below.
          </p>
          <p v-else-if="updateClass === 'scp' && !scpPayloadOnDisk" class="gitm-muxameter-saved">
            This release updates your app's template only — press the update above to bring the
            new payload onto disk (<span class="hifi-hl-green">no relaunch needed</span> for
            this kind), then carry your app current with Run Update below.
          </p>
          <p v-else-if="updateClass === 'scp' && scpPayloadOnDisk" class="gitm-muxameter-saved">
            The global install already carries this app's pending payload — the label stays
            <span class="hifi-hl-red">red</span> until it lands here:
            <span class="hifi-hl-green">Run Update below</span>, and purple returns.
          </p>
          <p v-else-if="updateClass === 'none' && syncAvailable" class="gitm-muxameter-saved">
            A newer publish exists with <span class="hifi-hl-green">nothing of value for this
            app anor the CLI</span> — the sync above is optional, offered only to keep the
            versions aligned.
          </p>
        </section>

        <!-- APPLY SUCCESS SCREEN — the update has landed (bridge C293 · stage idle + applied note).
             Renders INSTEAD of the stage rail + buckets + collision diff: the applied state is
             terminal, so the finalize motion is the only thing left to show (this also supersedes any
             stale re-hydrated diff/resolved artifacts). A heading marks the applied update, a short
             teaching line explains what the finalize does (boots the updated branch as proof), then the
             AUTHENTIC dock Turn-Over B control — pressed to boot + prove the just-applied changes. -->
        <section
          v-if="isApplied"
          class="gitm-update gitm-apply-success hifi-pane-green"
        >
          <h3 class="hifi-heading gitm-apply-success-title">Update Applied</h3>
          <p class="gitm-apply-success-lead">
            The update landed onto this project. One step remains: turn the app over onto its updated
            branch. That restarts the app on the new code — and if it boots, the update is proven,
            automatically. If it does not, the app comes back to your prior stable ground on its own.
          </p>
          <div class="gitm-apply-success-finalize">
            <p class="gitm-apply-success-finalize-label">Finalize · Turn Over to Test Your Work</p>
            <!-- F4 · NO-SWORD FINALIZE — a working B exists → the standard soft Turn-Over B button;
                 NO working B → the HARD Turn-Over control (the reboot onto the applied code IS the
                 proof · the same finalize meaning, minus the B-branch prerequisite). -->
            <template v-if="hasWorkingB">
              <GitmTurnOverBButton />
            </template>
            <template v-else>
              <!-- MD-ATC-F · the TRACKED Turn Over A (the A-family green · honest label) —
                   rides the same protocol as B: stamp → reboot-proof → the panel yields. -->
              <button
                class="gitm-apply-success-hard-turnover"
                :disabled="isGitmActing"
                @click="finalizeTurnOverA"
              >
                <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
                Turn Over A &amp; Restart to Prove the Update
              </button>
              <p class="gitm-apply-success-hard-note">
                Restarting the app on the updated code is the proof — if it boots, the update holds.
              </p>
            </template>
          </div>
        </section>

        <!-- IDLE ENTRY — engine idle + no diff → a short explainer + the Run Update button.
             This is the always-visible entry state (present even on the template SCP). -->
        <section
          v-else-if="!showUpdateSection"
          class="gitm-update hifi-pane-base"
        >
          <h3 class="hifi-heading">Update</h3>
          <div class="gitm-update-cta">
            <p class="gitm-update-explainer">
              Check this project against the latest template. Run Update to compare and stage
              changes — the review rail, change buckets, and any collisions appear here.
            </p>
            <button
              class="hifi-btn hifi-btn-blue"
              :disabled="isUpdating || isGitmActing"
              @click="runUpdate"
            >
              Run Update
            </button>
          </div>
        </section>

        <!-- STAGING UPDATE VIEW (D-U4.4) — the user-facing Update surface. Renders when a diff
             is present OR the engine has moved off idle; otherwise the idle-entry above shows.
             Read-only PREVIEW: Run Update fires the engine, Spawn Resolver hands a session the
             resolution directive, Apply is a disabled stub. Every updateDiff access is guarded. -->
        <section
          v-else
          class="gitm-update hifi-pane-base"
        >
        <h3 class="hifi-heading">Update</h3>

        <!-- (a) STAGE RAIL — ordinal-derived chips off updateStatus.stage. -->
        <div class="gitm-update-rail">
          <template v-for="(chip, i) in stageRail" :key="chip.key">
            <span
              class="gitm-stage-chip"
              :class="[
                chip.state === 'done' ? 'gitm-stage-done'
                  : chip.state === 'active' ? 'gitm-stage-active'
                  : chip.state === 'error' ? 'gitm-stage-error'
                  : 'gitm-stage-pending',
              ]"
            >
              {{ chip.label }}
            </span>
            <span v-if="i < stageRail.length - 1" class="gitm-stage-sep">→</span>
          </template>
        </div>
        <p v-if="stageErrorMessage !== ''" class="gitm-update-stage-error">
          {{ stageErrorMessage }}
        </p>
        <p v-if="stageErrorMessage !== ''" class="gitm-update-explainer">
          Run Update again — the comparison restarts from the top; the red pill marks where this run stopped.
        </p>

        <!-- PRE-UPDATE STATE — no diff yet + engine idle → a single CTA + one-line explainer. -->
        <div v-if="isPreUpdate" class="gitm-update-cta">
          <p class="gitm-update-explainer">
            Check this project against the latest template.
          </p>
          <button
            class="hifi-btn hifi-btn-blue"
            :disabled="isUpdating || isGitmActing"
            @click="runUpdate"
          >
            Run Update
          </button>
        </div>

        <!-- DIFF PRESENT — the change list + collision diff + the button row. -->
        <template v-else>
          <!-- (b) CHANGE LIST — Apply (blue) + Preserve (yellow), read-only rows. -->
          <div class="gitm-update-lists">
            <div class="gitm-update-bucket hifi-pane-blue">
              <h4 class="hifi-heading gitm-update-bucket-head">
                Apply ({{ updateDiff?.buckets.apply.length ?? 0 }})
              </h4>
              <p class="gitm-update-bucket-note">Template moved · auto-applies.</p>
              <ul class="gitm-file-list">
                <li
                  v-for="entry in (updateDiff?.buckets.apply ?? [])"
                  :key="entry.path"
                  class="gitm-file-row"
                >
                  <span class="gitm-file-name">{{ entry.path }}</span>
                </li>
                <li v-if="(updateDiff?.buckets.apply.length ?? 0) === 0" class="gitm-file-empty">
                  No files to apply.
                </li>
              </ul>
            </div>

            <div class="gitm-update-bucket hifi-pane-yellow">
              <h4 class="hifi-heading gitm-update-bucket-head">
                Preserve ({{ updateDiff?.buckets.preserve.length ?? 0 }})
              </h4>
              <p class="gitm-update-bucket-note">Your expansions · untouched.</p>
              <ul class="gitm-file-list">
                <li
                  v-for="entry in (updateDiff?.buckets.preserve ?? [])"
                  :key="entry.path"
                  class="gitm-file-row"
                >
                  <span class="gitm-file-name">{{ entry.path }}</span>
                </li>
                <li v-if="(updateDiff?.buckets.preserve.length ?? 0) === 0" class="gitm-file-empty">
                  Nothing to preserve.
                </li>
              </ul>
            </div>
          </div>

          <!-- (c) COLLISION DIFF — conference bucket. Union zones get an informational badge;
               true overlaps show the path + a "needs resolution" tag. Markers themselves are
               deferred to the resolver — only the path + count surface here. -->
          <div class="gitm-update-collisions">
            <h4 class="hifi-heading gitm-update-bucket-head">
              Collisions ({{ conferenceCount }})
            </h4>
            <ul class="gitm-file-list">
              <li
                v-for="entry in (updateDiff?.buckets.conference ?? [])"
                :key="entry.path"
                class="gitm-file-row gitm-collision-row"
              >
                <span class="gitm-file-name">{{ entry.path }}</span>
                <span
                  v-if="entry.collisionZone"
                  class="gitm-chip gitm-collision-union"
                  title="Both sides kept — these merge automatically."
                >
                  auto-union · both kept
                </span>
                <span v-else class="gitm-chip gitm-collision-overlap">
                  needs resolution
                </span>
              </li>
              <li v-if="conferenceCount === 0" class="gitm-file-empty">
                No collisions — nothing needs review.
              </li>
            </ul>
          </div>

          <!-- (d) BUTTONS — Run Update · Spawn Resolver (dotted when optional · D-UP2) · Apply,
               with the state legend riding the SAME container so every possible state is named. -->
          <div class="gitm-update-actions hifi-pane-green">
            <button
              class="hifi-btn hifi-btn-blue"
              :class="{ 'gitm-run-update-error': stageErrorMessage !== '' }"
              :disabled="isUpdating || isGitmActing"
              @click="runUpdate"
            >
              {{ runUpdateLabel }}
            </button>
            <button
              class="hifi-btn hifi-btn-blue"
              :class="{ 'gitm-resolver-optional': resolverOptional && resolverPhase === 'idle' }"
              :disabled="!canSpawnResolver"
              :title="
                resolverOptional
                  ? 'Optional — a complete resolution already exists and Apply is ready. Spawn again only to review anor redo the decisions.'
                  : resolverRequired
                    ? 'Required — the resolver session records the decisions Apply consumes.'
                    : 'Run the update first — nothing to resolve yet.'
              "
              @click="spawnResolver"
            >
              <span v-if="resolverPhase === 'idle'">Spawn Resolver</span>
              <span v-else-if="resolverPhase === 'spawning'">Starting…</span>
              <span v-else-if="resolverPhase === 'waiting'">Waiting…</span>
              <span v-else-if="resolverPhase === 'delivering'">Delivering…</span>
              <span v-else-if="resolverPhase === 'done'">Resolver Started</span>
              <span v-else>Retry Resolver</span>
            </button>
            <button
              class="hifi-btn hifi-btn-blue"
              :disabled="!canApply"
              :title="
                canApply
                  ? 'Land the resolved update onto this project (writes + commits the changes).'
                  : 'Resolve all collisions first — Apply enables once the resolution is complete.'
              "
              @click="applyUpdate"
            >
              {{ isApplying ? 'Applying…' : 'Apply' }}
            </button>
            <!-- D-UP2 · THE STATE LEGEND — every possible state of the three buttons, named in
                 place. The row matching the live next step carries the emphasis class. -->
            <div class="gitm-update-legend">
              <p :class="{ 'gitm-legend-active': diffEntryCount === 0 }">
                <strong>Run Update</strong> — compares this app three ways: as it was installed,
                as you have changed it, and the template as it is now. Always the entry point;
                run it again any time to refresh the comparison.
              </p>
              <p :class="{ 'gitm-legend-active': resolverRequired || resolverOptional }">
                <strong>Spawn Resolver</strong> — <em>solid</em>: required — this cycle's
                comparison awaits resolution, and the resolver session records the decisions
                Apply consumes. <em>dotted</em>: optional — a complete resolution already exists
                for this cycle; spawn again only to review anor redo it. <em>dimmed</em>: no live
                cycle — run the update first (each cycle opens with Run Update), anor a resolver
                is already in flight.
              </p>
              <p :class="{ 'gitm-legend-active': canApply }">
                <strong>Apply</strong> — dimmed until every decision is resolved; once complete,
                it lands the update into this app and commits it. Your work is preserved and the
                app's identity is kept by rule.
              </p>
            </div>
          </div>
          <p v-if="resolverStatusText !== ''" class="gitm-update-resolver-status">
            {{ resolverStatusText }}
          </p>
        </template>
        </section>
      </template>

      <!-- ══ GRAPH TAB ══ (MD-C · THE DAG) The SVG commit-DAG off gitmJson.commitGraph. Refresh
           dispatches gitm_load_log_graph; per-node action row routes Set Active through the Law. -->
      <template v-if="activeGitmTab === 'graph'">
        <GitmCommitGraph
          :commit-graph="gitmJson.commitGraph ?? []"
          :current-branch="gitmJson.currentBranch"
          :gitm-json="gitmJson"
          :is-gitm-acting="isGitmActing"
          @gitm-action="(a) => emit('gitm-action', a)"
        />
      </template>

      <!-- ══ WORKFLOW TAB ══ The git developer surface — Developer / Branches / Changes /
           Untracked / Commit / Warnings. Default-active so the page opens on the git workflow. -->
      <template v-if="activeGitmTab === 'workflow'">
<!-- C844 S3 · the Developer widget MOVED under the Commit (above the Diff) -->

      <!-- ═ D-RD2 · THE RELEASE PANE ═ — the streamlined SCP release surface, FIRST-CLASS just
           above the Branches (the Developer chips' Remote group remains the dev-tool twin).
           Origin read-back + set/modify + Push (first-push -u handled bridge-side) + the door
           to SCP Management, where the Configuration JSON (the paste-install manifest) is
           assembled + copied for listing on SCP-Origin. Release = set origin → Push → copy. -->
      <section id="gitm-section-release" class="gitm-release hifi-pane-fuchsia">
        <h3 class="hifi-heading">Release</h3>
        <p class="gitm-release-lede">
          Ship this app: set its remote origin, push, then copy its
          <span class="hifi-hl-fuchsia">Configuration JSON</span> from SCP Management — the
          manifest others paste to install it.
        </p>
        <div class="gitm-release-origin-row">
          <span class="gitm-release-label hifi-mono">ORIGIN</span>
          <span class="gitm-remote-origin hifi-mono">{{ gitmJson.remoteOrigin || '· no origin ·' }}</span>
          <span v-if="gitmJson.remoteOrigin" class="gitm-release-sync hifi-mono">
            ↑{{ gitmJson.ahead }} ↓{{ gitmJson.behind }}
          </span>
        </div>
        <div class="gitm-release-actions">
          <input
            v-model="remoteUrlDraft"
            class="gitm-input gitm-release-input"
            :class="{ 'gitm-input-invalid': remoteUrlDraft.trim() !== '' && !remoteUrlLooksValid }"
            type="text"
            placeholder="https://… anor git@… — the remote this app ships to"
            spellcheck="false"
            @keyup.enter="setRemoteOrigin"
          />
          <button
            class="hifi-btn hifi-btn-fuchsia"
            :disabled="isGitmActing || remoteUrlDraft.trim() === '' || !remoteUrlLooksValid"
            @click="setRemoteOrigin"
          >
            {{ gitmJson.remoteOrigin ? 'Modify Origin' : 'Set Origin' }}
          </button>
          <button
            class="hifi-btn hifi-btn-fuchsia"
            :disabled="isGitmActing || !gitmJson.remoteOrigin"
            @click="pushToRemote"
          >
            Push
          </button>
          <button class="hifi-btn hifi-btn-purple" @click="goScpManagement">
            SCP Management →
          </button>
        </div>
      </section>

      <!-- Branches list · MD-B THE BRANCH LIST — fuzzy-find + Sword-marked b/* rows + Set Active
           (the Branch-Set Law). Each non-current row carries a Set Active control that fires
           gitm_select_branch (the Shield-Gated Turn Over Routing Law); a b/* Sword row's Set
           Active is DISABLED with the guard tooltip — the Law made visible (a Sword can never be
           a Shield). The current row shows the ahead/behind badges from the snapshot. -->
      <section id="gitm-section-branches" class="gitm-branches hifi-pane-yellow">
        <h3 class="hifi-heading">Branches</h3>
        <!-- D2 M9 W2 · the Tactical Bridge role legend + the seat-law indicator. -->
        <p class="gitm-role-legend hifi-mono">
          <span class="gitm-tactical-bridge-mark">the Tactical Bridge</span> ·
          <span class="gitm-role-chip gitm-role-a">A</span> guarded stable ·
          <span class="gitm-role-chip gitm-role-b">B</span> working ·
          <span class="gitm-role-chip gitm-role-seat">⌖</span> seat (checkout)
        </p>
        <p v-if="seatOnWorkingB" class="gitm-seatlaw hifi-mono">
          ⌖ seat on B — A ({{ gitmJson.branchRoles?.a }}) stays the guarded ground
        </p>
        <!-- Fuzzy-find over the roster (SCS owned-caret input · no auto-attach race). -->
        <ScsInput
          v-model="branchFilter"
          type="text"
          placeholder="Filter branches…"
          class="gitm-branch-filter"
          :disabled="isGitmActing"
        />
        <ul class="gitm-branch-list">
          <li
            v-for="branch in filteredBranches"
            :key="branch"
            class="gitm-branch-row"
            :class="{ current: branch === gitmJson.currentBranch, 'gitm-branch-sword': isSword(branch) }"
          >
            <!-- C603 · THE LAZY CLICK AREA — the sizing class rode $attrs onto the INNER input
                 (the wrap never took the flex slot; the real input sat at intrinsic width — the
                 click had to land exactly on the text). The slot div takes the row's flex; the
                 wrap (width:100%) and the inner input fill it — any click within the area focuses. -->
            <div v-if="renamingBranch === branch" class="gitm-rename-slot">
              <ScsInput
                v-model="renameDraft"
                type="text"
                autofocus
                :disabled="isGitmActing"
                @keyup.enter="commitRename()"
                @keyup.esc="cancelRename()"
              />
            </div>
            <button
              v-else
              class="gitm-branch-btn"
              :disabled="branch === gitmJson.currentBranch || isGitmActing"
              @click="switchBranch(branch)"
            >
              <span class="gitm-branch-name">
                <!-- Sword-mark — a blade glyph tints b/* rows (the working namespace). -->
                <span v-if="isSword(branch)" class="gitm-branch-blade" title="Sword — a working branch (b/…)">⚔</span>
                <!-- D2 M9 W2 · the role badges — canonical roles equality, never the prefix. -->
                <span v-if="roleOf(branch) === 'A'" class="gitm-role-chip gitm-role-a" title="Registered A — the guarded stable">A</span>
                <span v-if="roleOf(branch) === 'B'" class="gitm-role-chip gitm-role-b" title="Registered B — the working branch">B</span>
                <span v-if="branch === gitmJson.currentBranch" class="gitm-role-chip gitm-role-seat" title="The seat — the live checkout">⌖</span>
                {{ branch }}
              </span>
              <span v-if="branch === gitmJson.currentBranch" class="gitm-branch-tag">current</span>
              <!-- Ahead/behind badges surface on the CURRENT row (the snapshot carries them for HEAD). -->
              <span
                v-if="branch === gitmJson.currentBranch && (gitmJson.ahead !== 0 || gitmJson.behind !== 0)"
                class="gitm-branch-ab"
              >
                +{{ gitmJson.ahead }} / -{{ gitmJson.behind }}
              </span>
            </button>
            <span
              v-if="gitmJson.dirty && branch !== gitmJson.currentBranch"
              class="gitm-chip gitm-chip-caution"
              title="Working tree is dirty — switch may be guarded"
            >
              dirty
            </span>
            <!-- SET ACTIVE (THE BRANCH-SET LAW) — routes through the Bridge Turn Over System.
                 A b/* Sword row is DISABLED with the guard tooltip (the Law: a Sword can never be
                 a Shield A). Hidden on the current row (already active). -->
            <button
              v-if="branch !== gitmJson.currentBranch"
              class="hifi-btn gitm-btn-small gitm-branch-setactive"
              :class="{ 'gitm-branch-setactive-guarded': isSword(branch) }"
              :disabled="isSword(branch) || isGitmActing"
              :title="
                isSword(branch)
                  ? 'A working branch (b/…) can never be set active as a Shield — select its Shield instead.'
                  : 'Set this branch active through the Tactical Bridge (turns over onto its newest working branch, or onto the branch itself).'
              "
              @click="setActiveBranch(branch)"
            >
              Set Active
            </button>
            <!-- D2 M9 W2 · the explicit role controls (decoupled from the checkout — the bridge
                 guards existence · collision · the foreign-sword seat honestly). -->
            <button
              v-if="roleOf(branch) !== 'A'"
              class="hifi-btn gitm-btn-small gitm-branch-setrole"
              :disabled="isGitmActing"
              title="Assign THIS branch as A (the guarded stable) — no checkout, no turn-over."
              @click="assignRole('A', branch)"
            >
              Set A
            </button>
            <button
              v-if="roleOf(branch) !== 'B'"
              class="hifi-btn gitm-btn-small gitm-branch-setrole"
              :disabled="isGitmActing"
              title="Assign THIS branch as B (the working branch) — no checkout, no mint."
              @click="assignRole('B', branch)"
            >
              Set B
            </button>
            <button
              v-if="renamingBranch !== branch"
              class="hifi-btn gitm-btn-small gitm-branch-setrole"
              :disabled="isGitmActing"
              title="Rename this branch — its role positioning (A anor B anor the seat) follows the new name."
              @click="beginRename(branch)"
            >
              Rename
            </button>
            <template v-else>
              <button class="hifi-btn gitm-btn-small gitm-branch-setrole" :disabled="isGitmActing" title="Commit the rename" @click="commitRename()">✓</button>
              <button class="hifi-btn gitm-btn-small gitm-branch-setrole" title="Cancel" @click="cancelRename()">✕</button>
            </template>
          </li>
          <li v-if="filteredBranches.length === 0" class="gitm-file-empty">
            No branches match "{{ branchFilter }}".
          </li>
        </ul>
      </section>

      <!-- STASH BROWSER (MD-B · THE LABELED STASH BROWSER) — the stash roster off gitmJson.stashList
           (label|subject per entry). Refresh fires gitm_stash_list; the label prompt + Push + Pop
           are the existing Stash devgroup controls (above) — this panel is the read surface. -->
      <section id="gitm-section-stash" class="gitm-stashbrowser hifi-pane-blue">
        <div class="gitm-stashbrowser-head">
          <h3 class="hifi-heading">Stashes ({{ stashEntries.length }})</h3>
          <button
            class="hifi-btn gitm-btn-small"
            :disabled="isGitmActing"
            title="Reload the stash roster (git stash list)."
            @click="refreshStashList"
          >
            Refresh
          </button>
        </div>
        <ul class="gitm-file-list">
          <li v-for="entry in stashEntries" :key="entry.ref" class="gitm-file-row gitm-stash-row">
            <span class="gitm-stash-ref">{{ entry.ref }}</span>
            <span class="gitm-stash-subject">{{ entry.subject }}</span>
          </li>
          <li v-if="stashEntries.length === 0" class="gitm-file-empty">
            No stashes. Use Refresh to reload, or Stash (above) to save your working changes.
          </li>
        </ul>
      </section>

      <!-- Changes panel · staged / unstaged -->
      <section id="gitm-section-changes" class="gitm-changes hifi-pane-blue">
        <div class="gitm-changes-cols">
          <div class="gitm-changes-col">
            <h3 class="hifi-heading">Staged ({{ gitmJson.stagedFiles.length }})</h3>
            <ul class="gitm-file-list">
              <li v-for="file in gitmJson.stagedFiles" :key="file" class="gitm-file-row">
                <span class="gitm-file-name">{{ file }}</span>
                <button
                  class="hifi-btn gitm-btn-small"
                  :disabled="isGitmActing"
                  @click="unstageFile(file)"
                >
                  Unstage
                </button>
              </li>
              <li v-if="gitmJson.stagedFiles.length === 0" class="gitm-file-empty">
                No staged changes.
              </li>
            </ul>
          </div>
          <div class="gitm-changes-col">
            <h3 class="hifi-heading">Unstaged ({{ gitmJson.unstagedFiles.length }})</h3>
            <ul class="gitm-file-list">
              <li v-for="file in gitmJson.unstagedFiles" :key="file" class="gitm-file-row">
                <span class="gitm-file-name">{{ file }}</span>
                <button
                  class="hifi-btn gitm-btn-small"
                  :disabled="isGitmActing"
                  @click="stageFile(file)"
                >
                  Stage
                </button>
              </li>
              <li v-if="gitmJson.unstagedFiles.length === 0" class="gitm-file-empty">
                No unstaged changes.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Untracked panel · NEW (never-added) files — git status shows them but the Staged/
           Unstaged panels do not (those are tracked paths). This surfaces what changed: the
           badge already counts untrackedFiles; this lists them. Clone of the Unstaged block
           (blue register · same file-row + Stage button + empty state). gitm_stage_file = git
           add, which stages an untracked file too. -->
      <section class="gitm-changes hifi-pane-blue">
        <h3 class="hifi-heading">Untracked ({{ gitmJson.untrackedFiles.length }})</h3>
        <ul class="gitm-file-list">
          <li v-for="file in gitmJson.untrackedFiles" :key="file" class="gitm-file-row">
            <span class="gitm-file-name">{{ file }}</span>
            <button
              class="hifi-btn gitm-btn-small"
              :disabled="isGitmActing"
              @click="stageFile(file)"
            >
              Stage
            </button>
          </li>
          <li v-if="gitmJson.untrackedFiles.length === 0" class="gitm-file-empty">
            No untracked files.
          </li>
        </ul>
      </section>

      <!-- Commit row · C844 S3 — the widget EDITS THE CURRENT COMMIT'S MESSAGE (amend ·
           seeded from HEAD); Commit Staged remains for new work. -->
      <section id="gitm-section-commit" class="gitm-commit hifi-pane-green">
        <h3 class="hifi-heading">Commit</h3>
        <p class="gitm-commit-subline">
          The current commit's message — edit and Amend (staged files fold in), anor stage
          files and Commit Staged as new work.
        </p>
        <div class="gitm-commit-form">
          <!-- SCS owned-caret input (#646) — caret present at render, no auto-attach race -->
          <ScsInput
            v-model="commitMessage"
            type="text"
            placeholder="The current commit's message…"
            class="gitm-commit-input"
            :disabled="isGitmActing"
            @keyup.enter="commit"
          />
          <button
            class="hifi-btn hifi-btn-green"
            :class="{ armed: isArmed('gitm_commit_amend') }"
            :disabled="commitMessage.trim() === '' || isGitmActing"
            @click="amendMessage"
          >
            {{ isArmed('gitm_commit_amend') ? '⚠ Confirm Amend?' : 'Amend Message' }}
          </button>
          <button
            class="hifi-btn hifi-btn-blue"
            :disabled="
              commitMessage.trim() === '' ||
              gitmJson.stagedFiles.length === 0 ||
              isGitmActing
            "
            @click="commit"
          >
            Commit Staged
          </button>
        </div>
        <p
          v-if="gitmJson.stagedFiles.length === 0"
          class="gitm-commit-guard"
        >
          Nothing staged — Amend edits the current commit; stage a file to Commit Staged.
        </p>
      </section>

      <!-- Warnings strip -->
      <section
        v-if="gitmJson.behind > 0"
        class="gitm-warnings"
      >
        <div class="gitm-banner gitm-banner-caution">
          {{ gitmJson.behind }} {{ gitmJson.behind === 1 ? 'commit' : 'commits' }} behind remote.
        </div>
      </section>

      <!-- DEVBAR (#644) · the developer command menu · grouped command chips -->
      <section class="gitm-devmenu hifi-pane-base">
        <h3 class="hifi-heading">Developer</h3>
        <div class="gitm-devbar">
          <!-- Group: Remote (C928 · THE RELEASE DOOR) — origin display + set/modify + push -->
          <div class="gitm-devgroup">
            <span class="gitm-devgroup-label">Remote</span>
            <div class="gitm-devgroup-chips gitm-remote-row">
              <span class="gitm-remote-origin" :title="gitmJson.remoteOrigin || 'no remote origin set'">
                {{ gitmJson.remoteOrigin || '· no origin ·' }}
              </span>
              <ScsInput
                v-model="remoteUrlDraft"
                type="text"
                placeholder="https://… anor git@host:path…"
                class="gitm-commit-input gitm-remote-input"
                :class="{
                  'gitm-input-valid': remoteUrlLooksValid,
                  'gitm-input-invalid': remoteUrlDraft.trim() !== '' && !remoteUrlLooksValid,
                }"
                :disabled="isGitmActing"
                @keyup.enter="setRemoteOrigin"
              />
              <button
                class="gitm-devchip"
                :disabled="!remoteUrlLooksValid || isGitmActing"
                @click="setRemoteOrigin"
              >
                {{ gitmJson.remoteOrigin ? 'Modify Origin' : 'Set Origin' }}
              </button>
              <button
                class="gitm-devchip"
                :disabled="!gitmJson.remoteOrigin || isGitmActing"
                @click="pushToRemote"
              >
                Push
              </button>
            </div>
          </div>

          <!-- Group: Changes -->
          <div class="gitm-devgroup">
            <span class="gitm-devgroup-label">Changes</span>
            <div class="gitm-devgroup-chips">
              <button
                class="gitm-devchip"
                :disabled="gitmJson.unstagedFiles.length === 0 || isGitmActing"
                @click="fireAction('gitm_stage_all', {})"
              >
                Stage All
              </button>
              <button
                class="gitm-devchip"
                :disabled="gitmJson.stagedFiles.length === 0 || isGitmActing"
                @click="fireAction('gitm_unstage_all', {})"
              >
                Unstage All
              </button>
              <button
                class="gitm-devchip gitm-devchip-danger"
                :class="{ armed: isArmed('gitm_discard_all') }"
                :disabled="!gitmJson.dirty || isGitmActing"
                @click="fireSafeguard('gitm_discard_all')"
              >
                {{ isArmed('gitm_discard_all') ? '⚠ Confirm Discard All?' : '⚠ Discard All' }}
              </button>
            </div>
          </div>

          <!-- Group: Commit -->
          <div class="gitm-devgroup">
            <span class="gitm-devgroup-label">Commit</span>
            <div class="gitm-devgroup-chips">
              <button
                class="gitm-devchip gitm-devchip-danger"
                :class="{ armed: isArmed('gitm_commit_amend') }"
                :disabled="isGitmActing"
                @click="fireSafeguard('gitm_commit_amend')"
              >
                {{ isArmed('gitm_commit_amend') ? '⚠ Confirm Amend?' : '⚠ Amend' }}
              </button>
            </div>
          </div>

          <!-- Group: Remote -->
          <div class="gitm-devgroup">
            <span class="gitm-devgroup-label">Remote</span>
            <div class="gitm-devgroup-chips">
              <button
                class="gitm-devchip"
                :disabled="isGitmActing"
                @click="fireAction('gitm_fetch', {})"
              >
                Fetch
              </button>
              <button
                class="gitm-devchip"
                :disabled="isGitmActing"
                @click="fireAction('gitm_pull', {})"
              >
                Pull
              </button>
              <button
                class="gitm-devchip"
                :disabled="gitmJson.ahead === 0 || gitmJson.conflicts.length > 0 || isGitmActing"
                @click="fireAction('gitm_push', {})"
              >
                Push
              </button>
              <button
                class="gitm-devchip gitm-devchip-danger"
                :class="{ armed: isArmed('gitm_force_push') }"
                :disabled="gitmJson.ahead === 0 || isGitmActing"
                @click="fireSafeguard('gitm_force_push')"
              >
                {{ isArmed('gitm_force_push') ? '⚠ Confirm Force Push?' : '⚠ Force Push' }}
              </button>
            </div>
          </div>

          <!-- Group: Stash -->
          <div class="gitm-devgroup">
            <span class="gitm-devgroup-label">Stash</span>
            <div class="gitm-devgroup-chips">
              <!-- SCS owned-caret input (#646) — caret present at render, no auto-attach race -->
              <ScsInput
                v-model="stashMessage"
                type="text"
                placeholder="Stash message (optional)…"
                class="gitm-devchip-input"
                :disabled="!gitmJson.dirty || isGitmActing"
                @keyup.enter="stashPush"
              />
              <button
                class="gitm-devchip"
                :disabled="!gitmJson.dirty || isGitmActing"
                @click="stashPush"
              >
                Stash
              </button>
              <button
                class="gitm-devchip"
                :disabled="gitmJson.stashCount === 0 || isGitmActing"
                @click="fireAction('gitm_stash_pop', {})"
              >
                Pop ({{ gitmJson.stashCount }})
              </button>
            </div>
          </div>

          <!-- Group: Inspect -->
          <!-- MD-C STAGE-FROM-DIFF (fold #4 · RESOLVED) — activeDiff now RELAYS through gitmJson
               (added to GitmJsonShape · capped ~400 lines), so the Diff Surface panel (below the
               Warnings) parses it into per-hunk blocks with per-hunk Stage buttons firing
               gitm_stage_hunk. The Diff chip here loads the surface (gitm_load_diff → activeDiff). -->
          <div class="gitm-devgroup">
            <span class="gitm-devgroup-label">Inspect</span>
            <div class="gitm-devgroup-chips">
              <button
                class="gitm-devchip"
                :disabled="isGitmActing"
                @click="fireAction('gitm_load_log', {})"
              >
                Log
              </button>
              <button
                class="gitm-devchip"
                :disabled="isGitmActing"
                @click="fireAction('gitm_load_diff', {})"
              >
                Diff
              </button>
            </div>
          </div>
        </div>

        <!-- BRANCHKEY (#644) · inline branch-create surface -->
        <div class="gitm-branchkey">
          <span class="gitm-devgroup-label">Create Branch</span>
          <div class="gitm-branchkey-form">
            <!-- SCS owned-caret input (#646) — caret present at render, no auto-attach race -->
            <ScsInput
              v-model="newBranchName"
              type="text"
              placeholder="new-branch-name…"
              class="gitm-commit-input"
              :class="{
                'gitm-input-valid': branchValidation.valid && !branchNameCollides,
                'gitm-input-invalid':
                  (newBranchName.trim() !== '' && !branchValidation.valid) || branchNameCollides,
              }"
              :disabled="gitmJson.detachedHead || isGitmActing"
              @keyup.enter="createBranch"
            />
            <label class="gitm-branchkey-toggle">
              <input
                v-model="switchToNew"
                type="checkbox"
                :disabled="gitmJson.detachedHead || isGitmActing"
              />
              Switch to new branch
            </label>
            <button
              class="hifi-btn hifi-btn-blue"
              :disabled="!canCreateBranch"
              @click="createBranch"
            >
              Create
            </button>
          </div>
          <p v-if="newBranchName.trim() !== '' && !branchValidation.valid" class="gitm-branchkey-error">
            {{ branchValidation.error }}
          </p>
          <p v-else-if="branchNameCollides" class="gitm-branchkey-error">
            A branch named "{{ newBranchName.trim() }}" already exists.
          </p>
          <p v-else-if="gitmJson.detachedHead" class="gitm-commit-guard">
            Detached HEAD — re-attach to a branch before creating.
          </p>
        </div>
      </section>

      <!-- GITM DIFF SURFACE (MD-C · fold #4 · STAGE-FROM-DIFF) — the relayed raw diff
           (gitmJson.activeDiff · capped ~400 lines) parsed into per-file/per-hunk blocks. Each
           hunk carries a per-hunk Stage button firing gitm_stage_hunk { patch }. Diff (in the
           Inspect group above) loads it; Refresh re-reads. Empty until the Diff chip fires. -->
      <section class="gitm-diffpanel hifi-pane-blue">
        <div class="gitm-diffpanel-head">
          <h3 class="hifi-heading">Diff ({{ diffFiles.length }} file{{ diffFiles.length === 1 ? '' : 's' }})</h3>
          <button
            class="hifi-btn gitm-btn-small"
            :disabled="isGitmActing"
            title="Re-read the working diff (git diff)."
            @click="refreshDiff"
          >
            Refresh
          </button>
        </div>
        <p v-if="diffFiles.length === 0" class="gitm-file-empty">
          No diff loaded. Use Diff (in the Developer · Inspect group above) to load the working diff,
          then stage individual hunks here.
        </p>
        <div v-for="file in diffFiles" :key="file.path" class="gitm-difffile">
          <h4 class="gitm-difffile-path"><code>{{ file.path }}</code></h4>
          <div v-for="(hunk, hi) in file.hunks" :key="hi" class="gitm-diffhunk">
            <div class="gitm-diffhunk-head">
              <code class="gitm-diffhunk-header">{{ hunk.header }}</code>
              <button
                class="hifi-btn gitm-btn-small hifi-btn-blue"
                :disabled="isGitmActing"
                title="Stage this hunk (git apply --cached)."
                @click="stageHunk(hunk)"
              >
                Stage hunk
              </button>
            </div>
            <pre class="gitm-diffhunk-body"><code
              v-for="(line, li) in hunk.lines"
              :key="li"
              class="gitm-diffline"
              :class="{
                'gitm-diffline-add': line.startsWith('+'),
                'gitm-diffline-del': line.startsWith('-'),
              }"
            >{{ line }}
</code></pre>
          </div>
          <p v-if="file.hunks.length === 0" class="gitm-file-empty">
            (binary or mode-only change — no hunks to stage individually)
          </p>
        </div>
      </section>

      <!-- GITM COMMAND LOG (MD-A · the yellow register · Output Firewall · read-only).
           Every gitmExec invocation the bridge ran, newest-first, off gitmJson.commandLog.
           Scrollable mono pane · dim · capped height. The developer's "what did git actually
           do" surface — never lies about state (the Epoch thesis). -->
      <section class="gitm-cmdlog hifi-pane-yellow">
        <h3 class="hifi-heading">Command Log ({{ commandLogEntries.length }})</h3>
        <div class="gitm-cmdlog-pane">
          <div
            v-for="(entry, i) in commandLogEntries"
            :key="`${i}-${entry}`"
            class="gitm-cmdlog-line"
          >
            {{ entry }}
          </div>
          <div v-if="commandLogEntries.length === 0" class="gitm-cmdlog-empty">
            No git commands run yet.
          </div>
        </div>
      </section>
      </template>
    </template>

    <!-- GITM Dev Epoch (MD-E · part 3 · THE COMMAND PALETTE) — Cmd/Ctrl+K over the island. Teleports
         to body (escapes the island stacking context); the roster rows re-emit through the SAME
         gitm-action pipe the buttons use, ANOR focus the relevant panel. -->
    <GitmCommandPalette
      :is-open="isPaletteOpen"
      :gitm-json="gitmJson"
      :is-gitm-acting="isGitmActing"
      @close="isPaletteOpen = false"
      @gitm-action="onPaletteAction"
      @focus-panel="onPaletteFocusPanel"
    />
  </section>
</template>

<style scoped>
.gitm-subpage {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* GITM Dev Epoch (MD-E · part 2 · PROGRESS STRIP) — the slim in-progress top strip. Yellow register
   (the in-progress language · tokens only so the HiFi cascade re-tints). A soft pulse signals live
   work; the mono command reads exactly what git is running. No cancel affordance (sync ops can't
   abort — the visibility IS the honesty). */
.gitm-progress-strip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  background: var(--fade-yellow, rgba(30, 26, 6, 0.9));
  border: 1px solid var(--color-yellow-dark, rgba(200, 170, 40, 0.5));
  box-shadow: inset 0 0 10px 0 var(--shadow-yellow, rgba(200, 170, 40, 0.2));
  animation: gitm-progress-pulse 1.4s ease-in-out infinite;
}

.gitm-progress-spinner {
  flex: 0 0 auto;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  border: 2px solid var(--color-yellow-light, rgba(240, 210, 90, 0.8));
  border-top-color: transparent;
  animation: gitm-progress-spin 0.8s linear infinite;
}

.gitm-progress-message {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-yellow-light, rgba(245, 220, 130, 0.95));
}

.gitm-progress-command {
  margin-left: auto;
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.68rem;
  color: rgba(230, 220, 180, 0.7);
}

@keyframes gitm-progress-spin {
  to { transform: rotate(360deg); }
}

@keyframes gitm-progress-pulse {
  0%, 100% { box-shadow: inset 0 0 8px 0 var(--shadow-yellow, rgba(200, 170, 40, 0.15)); }
  50% { box-shadow: inset 0 0 14px 0 var(--shadow-yellow, rgba(200, 170, 40, 0.32)); }
}

/* GITM SUB-NAV (Portion 1) — the local two-tab nav. Tokens only (no hardcoded hex) so the
   HiFi color cascade re-tints them. Workflow = base/neutral accent; Update = purple closing
   action accent. The active tab carries the accent border + a soft inset wash. */
.gitm-subnav {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  border-radius: 8px;
  padding: 0.5rem;
}

.gitm-subnav-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.125rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-bottom-width: 2px;
  border-radius: 6px;
  color: var(--color-white-muted, #9ca3af);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

/* Workflow tab — base/neutral register (the default git surface). */
.gitm-subnav-workflow:hover:not(.active) {
  border-color: var(--color-base, #6b7280);
  color: var(--color-white-conductor, #e5e5e5);
}

.gitm-subnav-workflow.active {
  border-color: var(--color-base, #6b7280);
  border-bottom-color: var(--color-white-conductor, #e5e5e5);
  background: var(--color-pane-base, #16161f);
  color: var(--color-white-conductor, #f3f4f6);
}

/* Update tab — purple register (the closing-action lane). */
.gitm-subnav-update:hover:not(.active) {
  border-color: var(--color-purple, #a78bfa);
  color: var(--color-white-conductor, #e5e5e5);
}

.gitm-subnav-update.active {
  border-color: var(--color-purple, #a78bfa);
  border-bottom-color: var(--color-purple, #a78bfa);
  background: var(--color-purple-inset, rgba(167, 139, 250, 0.12));
  color: var(--color-white-conductor, #f3f4f6);
}

/* GITM Dev Epoch (MD-C · THE DAG) — the Graph tab (blue-tinted, mirrors the workflow tab idiom). */
.gitm-subnav-graph:hover:not(.active) {
  border-color: var(--color-blue, #3b82f6);
  color: var(--color-white-conductor, #e5e5e5);
}
.gitm-subnav-graph.active {
  border-color: var(--color-blue, #3b82f6);
  border-bottom-color: var(--color-blue, #3b82f6);
  background: rgba(59, 130, 246, 0.12);
  color: var(--color-white-conductor, #f3f4f6);
}

/* GITM Dev Epoch (MD-C · fold #4) — the Diff surface panel with per-hunk stage buttons. */
.gitm-diffpanel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.gitm-difffile {
  margin-bottom: 1rem;
}
.gitm-difffile-path {
  font-size: 0.82rem;
  margin: 0 0 0.35rem;
  color: var(--color-blue-light, #4496ff);
}
.gitm-diffhunk {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}
.gitm-diffhunk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: rgba(255, 255, 255, 0.04);
}
.gitm-diffhunk-header {
  font-family: monospace;
  font-size: 0.72rem;
  color: var(--color-white-muted, #a0a0a8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gitm-diffhunk-body {
  margin: 0;
  padding: 0.25rem 0.5rem;
  overflow-x: auto;
  max-height: 320px;
  overflow-y: auto;
  font-size: 0.72rem;
  line-height: 1.35;
}
.gitm-diffline {
  display: block;
  font-family: monospace;
  white-space: pre;
  color: var(--color-white-muted, #c0c0c8);
}
.gitm-diffline-add {
  color: var(--color-green, rgb(34, 197, 94));
  background: rgba(34, 197, 94, 0.08);
}
.gitm-diffline-del {
  color: rgb(248, 113, 113);
  background: rgba(248, 113, 113, 0.08);
}

/* The conference-count badge on the Update tab — purple pill, mirrors the chip idiom. */
.gitm-subnav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--color-purple, #a78bfa);
  color: #1a1a1a;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
}

.gitm-empty,
.gitm-nonrepo {
  border-radius: 8px;
  padding: 1.5rem;
}

.gitm-empty-text {
  color: var(--color-white-muted, #9ca3af);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0.5rem 0 0;
}

.gitm-empty-text code {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.8125rem;
  color: var(--color-white-conductor, #e5e5e5);
}

.gitm-status,
.gitm-branches,
.gitm-changes,
.gitm-commit {
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.gitm-status-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gitm-branch {
  font-size: 1.5rem;
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
}

.gitm-aheadbehind {
  font-size: 0.8125rem;
  font-family: var(--font-mono, 'Space Mono', monospace);
  color: var(--color-white-muted, #9ca3af);
}

.gitm-spinner {
  margin-left: auto;
  font-size: 1.25rem;
  color: var(--color-viridian, #4ade80);
  animation: gitm-pulse 1s ease-in-out infinite;
}

@keyframes gitm-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.gitm-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.gitm-chip-dirty {
  background: var(--color-maroon, #b91c1c);
  color: #fff;
}

.gitm-chip-clean {
  background: var(--color-viridian, #166534);
  color: #fff;
}

.gitm-chip-caution {
  background: var(--color-yellow, #ca8a04);
  color: #1a1a1a;
}

/* A/B CHANGE-COUNT PILL (#644 · Front 4) — numeric · anchored upper-right of the status bar.
   The register teaches protection: exposed=maroon on A (changes unguarded) · protected=viridian
   on B (the anchor is safe). margin-left:auto pushes it right; the spinner follows inline. */
.gitm-ab-pill {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.6875rem;
  border-radius: 999px;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.gitm-ab-pill-exposed {
  background: var(--color-maroon, #b91c1c);
  color: #fff;
  box-shadow: 0 0 6px 0 rgba(239, 68, 68, 0.4);
}

.gitm-ab-pill-protected {
  background: var(--color-viridian, #166534);
  color: #fff;
}

/* BASELINE · Base project (YELLOW · the first of the three change-locations — Base=Yellow,
 * Cascade=Blue, SCPs=Red). The change-count ticker badge when not in an A/B cycle. */
.gitm-ab-pill-base {
  background: var(--color-yellow, #eab308);
  color: #1a1a1a;
  box-shadow: 0 0 6px 0 rgba(234, 179, 8, 0.35);
}

/* GITM 3LOC ROTATING PILL · Decision B — the FILL = the most-recently-changed location's
 * color. Base=Yellow (the user's root repo) · Cascade=Blue (the Cascades/ workspace repo) ·
 * SCP=Red (the active SCP repo). A transparent border sits under the A/B modifier so the
 * location fill + the protection border render simultaneously. */
.gitm-loc-pill-yellow {
  background: var(--color-yellow, #eab308);
  color: #1a1a1a;
  box-shadow: 0 0 6px 0 rgba(234, 179, 8, 0.35);
  border: 2px solid transparent;
}

.gitm-loc-pill-blue {
  background: var(--color-blue, #1e6091);
  color: #fff;
  box-shadow: 0 0 6px 0 rgba(30, 96, 145, 0.4);
  border: 2px solid transparent;
}

.gitm-loc-pill-red {
  background: var(--color-red, #8b1a1a);
  color: #fff;
  box-shadow: 0 0 6px 0 rgba(139, 26, 26, 0.4);
  border: 2px solid transparent;
}

/* GITM 3LOC A/B BORDER · Decision B — the BORDER = the Base anchor's protection state,
 * overlaid on the location fill. exposed=maroon (on A · changes unguarded) ·
 * protected=viridian (on B · the anchor is safe). Only set when the rotation rests on Base. */
.gitm-loc-pill-ab-exposed {
  border-color: var(--color-maroon, #b91c1c);
}

.gitm-loc-pill-ab-protected {
  border-color: var(--color-viridian, #166534);
}

.gitm-banner {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.gitm-banner-danger {
  background: var(--color-maroon, #b91c1c);
  color: #fff;
}

.gitm-banner-caution {
  background: var(--color-yellow, #ca8a04);
  color: #1a1a1a;
}

/* ACTION-ERROR BANNER (#644 · Front 1) — a subtle mono accent over the shared danger register;
   git stderr is multi-line so it wraps. The errorCode reads as a heading; the message follows. */
.gitm-banner-error {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.78125rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.gitm-banner-error strong {
  letter-spacing: 0.04em;
}

.gitm-branch-list,
.gitm-file-list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.gitm-branch-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gitm-branch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
  color: var(--color-white-conductor, #f3f4f6);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  text-align: left;
}

.gitm-branch-btn:hover:not(:disabled) {
  border-color: var(--color-viridian, #4ade80);
}

.gitm-branch-btn:disabled {
  cursor: default;
  opacity: 0.85;
}

.gitm-branch-row.current .gitm-branch-btn {
  background: var(--color-viridian-inset, #14321f);
  border-color: var(--color-viridian, #166534);
}

.gitm-branch-name {
  font-family: var(--font-mono, 'Space Mono', monospace);
}

.gitm-branch-tag {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-viridian, #4ade80);
}

/* MD-B THE BRANCH LIST — the fuzzy-find input over the roster. Mono field, muted inset. */
.gitm-branch-filter {
  width: 100%;
  margin: 0.5rem 0 0;
  padding: 0.4375rem 0.75rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
  color: var(--color-white-conductor, #f3f4f6);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.8125rem;
}

/* MD-B THE BRANCH LIST — ahead/behind badge on the current row (mono · muted). */
.gitm-branch-ab {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.75rem;
  color: var(--color-white-muted, #9ca3af);
}

/* MD-B THE SWORD-MARK — a b/* row is a Sword (the working namespace). A blade glyph tints it
   (the red change-location register — SCPs=Red; working branches carry that working-motion hue). */
.gitm-branch-blade {
  color: var(--color-red, #f87171);
  margin-right: 0.25rem;
  font-size: 0.9375rem;
}

.gitm-branch-sword .gitm-branch-btn {
  border-color: var(--color-red, #8b1a1a);
  background: var(--color-red-inset, rgba(139, 26, 26, 0.12));
}

/* MD-B SET ACTIVE (THE BRANCH-SET LAW) — the per-row Law control. The guarded (Sword) variant is
   visibly inert with the Law's tooltip — a Sword can never be a Shield. */
.gitm-branch-setactive {
  white-space: nowrap;
}

.gitm-branch-setactive-guarded {
  cursor: not-allowed;
  opacity: 0.4;
}

/* MD-B THE LABELED STASH BROWSER — the roster panel. Head row carries the count + Refresh. */
.gitm-stashbrowser {
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.gitm-stashbrowser-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.gitm-stash-row {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
}

.gitm-stash-ref {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-blue, #60a5fa);
  flex-shrink: 0;
}

.gitm-stash-subject {
  font-size: 0.8125rem;
  color: var(--color-white-conductor, #e5e5e5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gitm-changes-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.gitm-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
}

.gitm-file-name {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.8125rem;
  color: var(--color-white-conductor, #e5e5e5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gitm-file-empty {
  color: var(--color-white-muted, #6b7280);
  font-style: italic;
  font-size: 0.8125rem;
  padding: 0.375rem 0.625rem;
}

.gitm-btn-small {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  flex-shrink: 0;
  /* C598 · THE PEWTER CHIP (the white-pill cure · full treatment — never variant-reliant):
     dark glass ground · warm-white text · subtle edge · the hover glow carries the info. */
  appearance: none;
  -webkit-appearance: none;
  background-color: rgba(12, 16, 26, 0.9);
  background-image: none;
  border: 1px solid rgba(230, 226, 218, 0.3);
  color: #e6e2da;
}

.gitm-btn-small:hover:not(:disabled) {
  border-color: rgba(251, 191, 36, 0.65);
  color: #fbbf24;
  background-color: rgba(20, 24, 34, 0.95);
}

.gitm-commit-form {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.gitm-commit-input {
  flex: 1;
  min-width: 200px;
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.875rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
  color: var(--color-white-conductor, #e5e5e5);
  font-size: 0.875rem;
}

/* SCS input migration (#646) — the .gitm-commit-input class now lands on the inner
   <input> inside the ScsInput wrapper; the wrapper itself must carry the flex-grow
   so the field fills the row exactly as the bare <input> did. :deep() reaches the
   component-internal wrapper. */
.gitm-commit-form :deep(.scs-input-wrap),
.gitm-branchkey-form :deep(.scs-input-wrap) {
  flex: 1;
  min-width: 200px;
}

.gitm-commit-input:focus {
  /* Focus outline is the global OSR default (style.css); border-color is the component cue. */
  outline: none;
  border-color: var(--color-viridian, #4ade80);
}

.gitm-commit-subline {
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
}
.gitm-commit-guard {
  margin: 0.5rem 0 0;
  color: var(--color-white-muted, #9ca3af);
  font-size: 0.8125rem;
  font-style: italic;
}

/* STAGING UPDATE VIEW (D-U4.4) — the user-facing Update surface over the base pane.
   A Yellow hairline (mirrors the DEVBAR's amethyst hairline) marks it as the update lane. */
.gitm-update {
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-left: 2px solid var(--color-yellow, #eab308);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* APPLY SUCCESS SCREEN — the terminal "update landed · finalize" surface. A calm viridian success
   register (the proven-ground color) framing the replicated dock Turn-Over control. The green left
   border marks it as a settled, positive state (vs the yellow in-progress update border above). */
.gitm-apply-success {
  border-left-color: var(--color-viridian, #22c55e);
  gap: 1.25rem;
}

.gitm-apply-success-title {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-viridian, #4ade80);
}

.gitm-apply-success-lead {
  margin: 0;
  max-width: 60ch;
  line-height: 1.6;
  font-size: 0.875rem;
  color: var(--color-white-conductor, #d1d5db);
}

/* FINALIZE ROW — the teaching label above the replicated Turn-Over control. Centered so the single
   authentic dock button reads as the one decisive gesture that closes the update. */
.gitm-apply-success-finalize {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem 0.75rem;
  border-top: 1px solid rgba(34, 197, 94, 0.18);
}

.gitm-apply-success-finalize-label {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-viridian, #4ade80);
  text-align: center;
}

/* MD-ATC-F2 · PEWTER TESSERA · THE TACTICAL A REGISTER (the blend-in cure): the finalize
   takes the Tactical Bridge StratiPUNK voice — the GitmTurnOverAButton construction at
   label width: a deep near-black chamfered body whose viridian identity reads through the
   thin glowing edge (the color informs via the glow, NEVER a flooded fill that sinks into
   the green pane). Mirrors the 44px dock register's field/edge/chamfer/glow verbatim. */
.gitm-apply-success-hard-turnover {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.6rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  background:
    radial-gradient(ellipse at 38% 30%, rgba(19, 213, 148, 0.15) 0%, rgba(8, 14, 12, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(19, 213, 148, 0.09) 0%, rgba(7, 12, 10, 0) 70%),
    rgb(9, 14, 12);
  border: 1px solid rgba(19, 213, 148, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(19, 213, 148, 0.28),
    inset 0 0 10px 0 rgba(19, 213, 148, 0.10);
  color: rgb(19, 213, 148);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.6);
}

.gitm-apply-success-hard-turnover:hover:not(:disabled) {
  border-color: rgba(19, 213, 148, 0.9);
  color: rgb(110, 245, 200);
  box-shadow:
    0 0 14px 1px rgba(19, 213, 148, 0.5),
    inset 0 0 14px 0 rgba(19, 213, 148, 0.18);
}

.gitm-apply-success-hard-turnover:active:not(:disabled) {
  box-shadow: inset 0 0 12px 1px rgba(19, 213, 148, 0.35);
}

.gitm-apply-success-hard-turnover:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* STAGE RAIL — the ordinal chips + arrow separators. */
.gitm-update-rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.gitm-stage-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid var(--color-border-muted, #2d2d44);
  background: var(--color-pane-inset, #0f0f1a);
  color: var(--color-white-muted, #9ca3af);
}

.gitm-stage-done {
  border-color: var(--color-viridian, #166534);
  color: var(--color-viridian, #4ade80);
}

.gitm-stage-active {
  border-color: var(--color-yellow, #eab308);
  background: rgba(234, 179, 8, 0.12);
  color: var(--color-yellow, #eab308);
  /* Reuse the existing status-spinner pulse keyframe for the live stage. */
  animation: gitm-pulse 1s ease-in-out infinite;
}

.gitm-stage-error {
  border-color: var(--color-maroon, #b91c1c);
  background: rgba(185, 28, 28, 0.16);
  color: var(--color-maroon-bright, #f87171);
}

.gitm-stage-pending {
  opacity: 0.5;
}

.gitm-stage-sep {
  color: var(--color-white-muted, #6b7280);
  font-size: 0.8125rem;
}

.gitm-update-stage-error {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: var(--color-maroon, #b91c1c);
  color: #fff;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-word;
}

/* PRE-UPDATE CTA — the single Run Update call when nothing has run yet. */
.gitm-update-cta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.gitm-update-explainer {
  margin: 0;
  color: var(--color-white-muted, #9ca3af);
  font-size: 0.8125rem;
  flex: 1;
  min-width: 200px;
}

/* CHANGE LIST — the Apply + Preserve buckets side-by-side. */
.gitm-update-lists {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.gitm-update-bucket {
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.gitm-update-bucket-head {
  margin: 0;
}

.gitm-update-bucket-note {
  margin: 0.25rem 0 0;
  color: var(--color-white-muted, #9ca3af);
  font-size: 0.75rem;
  font-style: italic;
}

/* COLLISION DIFF — the conference list + per-row badges. */
.gitm-update-collisions {
  border-top: 1px solid var(--color-border-muted, #2d2d44);
  padding-top: 0.75rem;
}

.gitm-collision-row {
  border-left: 2px solid var(--color-maroon, #b91c1c);
}

.gitm-collision-union {
  background: var(--color-viridian, #166534);
  color: #fff;
  flex-shrink: 0;
}

.gitm-collision-overlap {
  background: var(--color-maroon, #b91c1c);
  color: #fff;
  flex-shrink: 0;
}

/* BUTTONS — the action row. */
.gitm-update-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.gitm-update-actions .hifi-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* THE VERSIONING MUXAMETER PANEL — the classed verdict at the Update tab's head. */
.gitm-muxameter {
  border-radius: 8px;
  padding: 0.9rem 1.15rem;
  margin-bottom: 1rem;
}
.gitm-muxameter-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}
.gitm-muxameter-label {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-purple, #a78bfa);
}
.gitm-muxameter-versions {
  color: rgba(255, 255, 255, 0.65);
}
.gitm-muxameter-restart {
  padding: 0.2rem 0.7rem;
  border-radius: 6px;
  border: 1px solid rgba(74, 222, 128, 0.6);
  color: rgba(74, 222, 128, 0.95);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.gitm-muxameter-failed {
  color: rgba(248, 113, 113, 0.9);
  font-size: 0.76rem;
}
.gitm-muxameter-saved {
  margin: 0.55rem 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}
.gitm-muxameter code {
  color: rgba(74, 222, 128, 0.9);
  background: rgba(0, 0, 0, 0.35);
  padding: 0.08rem 0.35rem;
  border-radius: 4px;
}

/* D-UP2 · THE OPTIONAL RESOLVER — a complete resolution exists (Apply is live); the resolver
   stays spawnable for review anor redo. The dotted border IS the optionality mark. */
.gitm-update-actions .gitm-resolver-optional {
  border: 2px dotted rgba(147, 197, 253, 0.75);
  opacity: 0.9;
}

/* D-UP2 · THE STATE LEGEND — rides the same container (full-width wrap row under the buttons);
   the row matching the live next step carries the emphasis. */
.gitm-update-legend {
  flex-basis: 100%;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.gitm-update-legend p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--color-white-muted, #9ca3af);
  opacity: 0.75;
}
.gitm-update-legend p strong {
  color: var(--color-white, #e5e7eb);
  letter-spacing: 0.03em;
}
.gitm-update-legend p em {
  font-style: normal;
  color: rgba(147, 197, 253, 0.9);
}
.gitm-update-legend .gitm-legend-active {
  opacity: 1;
}

.gitm-update-resolver-status {
  margin: 0;
  color: var(--color-white-muted, #9ca3af);
  font-size: 0.8125rem;
  font-style: italic;
}

/* DEVBAR (#644) — the developer command menu · grouped command chips. A distinct
   dev-tier accent (amethyst hairline) over the base pane reads as developer tooling. */
.gitm-devmenu {
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-left: 2px solid var(--color-amethyst, #a78bfa);
}

/* C928 · REMOTE — the release door row: origin readout (mono · ellipsized) + URL input + chips. */
.gitm-remote-row {
  align-items: center;
  flex-wrap: wrap;
}
.gitm-remote-origin {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.55);
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gitm-remote-input {
  min-width: 16rem;
}

/* D-RD2 · THE RELEASE PANE — the first-class release surface above the Branches. */
.gitm-release {
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
}
.gitm-release-lede {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}
.gitm-release-origin-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.gitm-release-label {
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.4);
}
.gitm-release-sync {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
}
.gitm-release-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.gitm-release-input {
  flex: 1 1 16rem;
  min-width: 14rem;
}

.gitm-devbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-top: 0.75rem;
}

.gitm-devgroup {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.gitm-devgroup-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-white-muted, #6b7280);
}

.gitm-devgroup-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

/* DEVCHIP — the atomic command unit · dark inset · viridian hover edge (StratiPUNK register). */
.gitm-devchip {
  padding: 0.3125rem 0.75rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
  color: var(--color-white-conductor, #e5e5e5);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.4);
}

.gitm-devchip:hover:not(:disabled) {
  border-color: var(--color-viridian, #4ade80);
}

.gitm-devchip:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* SAFEGUARD — the T3 danger-tint chip · maroon edge teaches the guard; ARMED pulses. */
.gitm-devchip-danger {
  border-color: var(--color-maroon, #b91c1c);
  background: rgba(185, 28, 28, 0.12);
  color: var(--color-maroon-bright, #f87171);
}

.gitm-devchip-danger:hover:not(:disabled) {
  border-color: var(--color-maroon, #ef4444);
  background: rgba(185, 28, 28, 0.2);
}

.gitm-devchip-danger.armed {
  border-color: var(--color-maroon, #ef4444);
  background: rgba(185, 28, 28, 0.32);
  color: #fff;
  box-shadow: 0 0 8px 0 rgba(239, 68, 68, 0.5);
  animation: gitm-armed-pulse 1.4s ease-in-out infinite;
}

@keyframes gitm-armed-pulse {
  0%, 100% { box-shadow: 0 0 6px 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 14px 1px rgba(239, 68, 68, 0.75); }
}

/* DEVCHIP inline input — the stash message · same dark-inset register, chip height. */
.gitm-devchip-input {
  min-width: 140px;
  width: 100%;
  box-sizing: border-box;
  padding: 0.3125rem 0.625rem;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
  color: var(--color-white-conductor, #e5e5e5);
  font-size: 0.75rem;
}

/* SCS input migration (#646) — the stash .gitm-devchip-input lands on the inner
   <input>; the ScsInput wrapper carries the chip-row min-width so it sizes as the
   bare <input> did within .gitm-devgroup-chips. */
.gitm-devgroup-chips :deep(.scs-input-wrap) {
  min-width: 140px;
  width: auto;
}

.gitm-devchip-input:focus {
  /* Focus outline is the global OSR default (style.css); border-color is the component cue. */
  outline: none;
  border-color: var(--color-amethyst, #a78bfa);
}

.gitm-devchip-input:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* BRANCHKEY — inline branch-create surface · validation borders + checkout toggle. */
.gitm-branchkey {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-muted, #2d2d44);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gitm-branchkey-form {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gitm-branchkey-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-white-muted, #9ca3af);
  cursor: pointer;
  white-space: nowrap;
}

.gitm-input-valid {
  border-color: var(--color-viridian, #4ade80) !important;
}

.gitm-input-invalid {
  border-color: var(--color-maroon, #ef4444) !important;
}

.gitm-branchkey-error {
  margin: 0;
  color: var(--color-maroon-bright, #f87171);
  font-size: 0.75rem;
  font-style: italic;
}

@media (max-width: 600px) {
  .gitm-commit-form {
    flex-direction: column;
  }
  .gitm-commit-input {
    min-width: auto;
  }
}

/* GITM COMMAND LOG (MD-A · the yellow register · Output Firewall). A scrollable mono pane —
   dim, capped height, newest-first. The developer's git-truth surface (never lies about state). */
.gitm-cmdlog {
  border-radius: 8px;
  padding: 1rem;
}

.gitm-cmdlog-pane {
  margin-top: 0.5rem;
  max-height: 14rem;
  overflow-y: auto;
  background: var(--color-pane-inset, #0f0f1a);
  border: 1px solid var(--color-border-muted, #2d2d44);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.gitm-cmdlog-line {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-white-muted, #9ca3af);
  white-space: pre-wrap;
  word-break: break-all;
}

.gitm-cmdlog-empty {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.75rem;
  color: var(--color-white-muted, #6b7280);
  font-style: italic;
}

/* ══════════════════════════════════════════════════════════════════════════
   GITM Dev Epoch (MD-D · CONFLICT CHROME) — the persistent red luminous MODE.
   When conflicts>0 the whole island's OUTER frame flips red (a mode, not a toast) so the
   conflict is unmistakable. Pewter red register · luminous edge + glow, never a flooded fill.
   ══════════════════════════════════════════════════════════════════════════ */
.gitm-conflict-mode {
  position: relative;
  border-radius: 12px;
  border: 1.5px solid rgba(220, 38, 38, 0.62);
  box-shadow:
    0 0 22px 0 rgba(220, 38, 38, 0.32),
    inset 0 0 26px 0 rgba(220, 38, 38, 0.08);
  animation: gitm-conflict-pulse 2.4s ease-in-out infinite;
}

@keyframes gitm-conflict-pulse {
  0%, 100% { box-shadow: 0 0 22px 0 rgba(220, 38, 38, 0.32), inset 0 0 26px 0 rgba(220, 38, 38, 0.08); }
  50% { box-shadow: 0 0 30px 2px rgba(220, 38, 38, 0.5), inset 0 0 30px 0 rgba(220, 38, 38, 0.14); }
}

.gitm-conflict-panel {
  margin: 0.75rem 0;
  padding: 0.85rem 0.95rem;
  border-radius: 10px;
  background:
    radial-gradient(ellipse at 30% 6%, rgba(220, 38, 38, 0.12) 0%, rgba(12, 6, 6, 0) 60%),
    linear-gradient(170deg, rgba(24, 10, 10, 0.96) 0%, rgba(10, 5, 5, 0.98) 100%);
  border: 1px solid rgba(220, 38, 38, 0.45);
}

.gitm-conflict-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.gitm-conflict-panel-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(255, 170, 170);
  text-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
}

.gitm-conflict-abort {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 7px;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  background:
    radial-gradient(ellipse at 40% 20%, rgba(220, 38, 38, 0.26) 0%, rgba(16, 8, 8, 0) 70%),
    rgb(18, 9, 9);
  border: 1px solid rgba(220, 38, 38, 0.7);
  color: rgb(255, 180, 180);
  box-shadow: 0 0 10px 0 rgba(220, 38, 38, 0.35);
  transition: all 0.16s ease;
}
.gitm-conflict-abort:hover:not(:disabled) {
  border-color: rgba(220, 38, 38, 0.95);
  color: rgb(255, 210, 210);
  box-shadow: 0 0 16px 1px rgba(220, 38, 38, 0.55);
}
.gitm-conflict-abort:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gitm-conflict-files {
  list-style: none;
  margin: 0 0 0.7rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.gitm-conflict-file-open {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: rgba(240, 210, 210, 0.9);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.76rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.14s ease;
}
.gitm-conflict-file-open:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.5);
}
.gitm-conflict-file.active .gitm-conflict-file-open {
  background: rgba(220, 38, 38, 0.16);
  border-color: rgba(220, 38, 38, 0.7);
  color: rgb(255, 220, 220);
}
.gitm-conflict-file-open:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gitm-conflict-hint {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.74rem;
  color: rgba(220, 180, 180, 0.7);
  font-style: italic;
}
/* D2 M9 W2 · the Tactical Bridge role surfaces. */
.gitm-tactical-bridge-mark {
  /* W3 · THE TACTICAL BRIDGE designation — the system's name leads the surface. */
  color: #fbbf24;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
}
.gitm-role-legend {
  margin: 0 0 8px;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  color: rgba(230, 226, 218, 0.55);
}
.gitm-role-chip {
  display: inline-block;
  min-width: 1.1em;
  padding: 0 4px;
  margin-right: 4px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
}
.gitm-role-a {
  color: #13d594;
  border: 1px solid rgba(19, 213, 148, 0.55);
  background: rgba(19, 213, 148, 0.08);
}
.gitm-role-b {
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.55);
  background: rgba(251, 191, 36, 0.08);
}
.gitm-role-seat {
  color: #93c5fd;
  border: 1px solid rgba(147, 197, 253, 0.5);
  background: rgba(147, 197, 253, 0.08);
}
.gitm-seatlaw {
  margin: 0 0 8px;
  font-size: 0.68rem;
  color: rgba(147, 197, 253, 0.75);
}
.gitm-branch-setrole {
  margin-left: 4px;
  white-space: nowrap;
}
.gitm-rename-slot {
  /* C603 — the SLOT takes the switch-button's flex share; the ScsInput wrap (width:100%)
     and its inner input fill it entirely — the whole area is the click target. */
  flex: 1;
  min-width: 220px;
}
</style>
