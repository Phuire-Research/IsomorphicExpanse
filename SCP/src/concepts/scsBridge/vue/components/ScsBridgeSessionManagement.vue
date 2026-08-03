<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch, getCurrentInstance } from 'vue';
import {
  type AnchorConfig,
  BRIDGE_STATUS_COLORS,
  type BridgeJsonShape,
  type ScsBridgeSessionEntry,
  type Suite8PickerEntry,
} from '../../scsBridge.type';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
// THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL) — the reactive gitm controller (gitmJson only)
// carries pendingConfirm back to the client so the WATCHKEY two-call remove round closes here (call-1
// mints the token → gitmJson.pendingConfirm.token → call-2). Same inject-with-getGlobal-fallback
// pattern GitmSwordBButton.vue proves (getGlobal is null/stale in the TaskBar render context).
import { GITM_CONTROLLER_KEY, getGlobalGitmController } from '../../../gitm/gitmController';
// D3D Wave-2 · CMIA-Spawn + CMIA-Engage SIGR refs (module-level exports from principles)
// Single source of truth — component reads these refs for :disabled binding.
// SSP · D-SSP.3 · isSpawningSuite8 = the SBST lane's independent SIGR guard
// (mirrors Suite8OnDemand.vue:39). Gates the picker Spawn button :disabled +
// .spawning class during an identified Suite-8 spawn in flight.
import { isSpawning, isSpawningSuite8 } from '../../principles/scsBridgeInvokeSessionSpawn.principle.client';
import { isEngaging } from '../../principles/scsBridgeInvokeSessionEngage.principle.client';
// D3RM-E · CMIA-Focus SIGR ref · gates Focus button :disabled during in-flight fetch
import { isFocusing } from '../../principles/scsBridgeInvokeSessionFocus.principle.client';
// D3RM-G · CBSE chat SIGR refs + status writer registration
// isChatSending gates Send button :disabled · pendingChatSessionId scopes button label
// setChatStatusWriter wires component status map into principle status writeback
import {
  isChatSending,
  pendingChatSessionId,
  setChatStatusWriter,
  type ChatStatusKind,
} from '../../principles/scsBridgeInvokeSessionChat.principle.client';
// RM-D2 · SMFT · SORD envelope shape delegated to the SCP-local Model File copy
// (byte-identical to bridge-side src/lib/bridge/sordEnvelope.model.ts · OV-2(b)).
import { buildSordEnvelope } from '../../../../model/sordEnvelope.model';
// MD-9 · D-MC-3 · Per-Instance Model Control · the template-side catalog mirror (labels/tiers
// for the dropdown + scsModelLabel for the recorded-model session-row tag).
import {
  SCS_AVAILABLE_MODELS,
  SCS_DEFAULT_MODEL,
  scsModelLabel,
} from '../../model/scsModelCatalog.model';
import ScsInput from '../../../vue/components/ScsInput.vue';
// MD-9 · THE DROPDOWN COMPONENT · the extracted in-DOM dropdown (offscreen-safe · replaces
// the just-landed inline model-picker drawer). Native <select> popups are OS-anchored and can
// never open on the offscreen SCP surface; ScsDropdown renders wholly in-DOM.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

// PP-D5 · Ochre-C §6 · Surface 2 · controller bridgeActive binding
const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);
// THE SCP COMMAND MENU (W3/W4) — the gitm controller for the reactive pendingConfirm read (the
// remove round). inject-first with the getGlobal fallback (GitmSwordBButton pattern).
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();

interface Props {
  bridgeJson: BridgeJsonShape | null;
  sessionsList: ScsBridgeSessionEntry[];
  mode?: 'general' | 'specific';
  suite8Name?: string;
  // BO-1 · the RENAME-PROOF designation alias (the C373 s8 law). `scs suite8:page` token-rewrites
  // `:suite8-name=` in COPIED landings into `:{domain}-name=` — a prop this SHARED component never
  // declares, so specific-mode binding dies silently on every mint. `:s8-name` carries no
  // suite8/Suite8 token → survives the rewrite. Takes precedence over suite8Name when both bind.
  s8Name?: string;
  // SMSR · Split Recomposition · the two-column (menu | sessions) layout toggle. Boolean-prop law:
  // an absent boolean prop coerces to `false`, NEVER undefined. Here that coercion IS the intended
  // default — `false` maps to today's single-column stack, so NO negative/opt-out prop is needed
  // (the safe direction). The popup passes `:wide="true"` to opt INTO the split; the page passes
  // nothing → stack. See the .smgmt-col display:contents identity element in the scoped CSS.
  wide?: boolean;
}

const props = defineProps<Props>();

// C821 D1 → C825 · the direct link to the SCP Management sub-page. THE DUAL PATH (the
// field caught the emit dying on alternative tabs): a parent that bound the listener (the
// scsBridge landing) gets the in-place sub-page switch; ANY OTHER host travels via the D1
// URL tag (?island=scsBridge&sub=scp-management) — the deep link built for exactly this.
const emit = defineEmits<{ (e: 'navigate-sub-page', subPage: 'installation'): void }>();
const smInstance = getCurrentInstance();
function goScpManagement(): void {
  const hasListener = !!(smInstance?.vnode.props && 'onNavigateSubPage' in (smInstance.vnode.props as object));
  if (hasListener) {
    emit('navigate-sub-page', 'installation');
    return;
  }
  const params = new URLSearchParams(window.location.search);
  params.set('island', 'scsBridge');
  params.set('sub', 'scp-management');
  window.location.search = params.toString();
}

// R-D1 SCSE · GSRM · General/Specific mode derived helper.
// false when mode prop is absent (undefined !== 'specific') — General mode by construction.
const isSpecificMode = computed(() => props.mode === 'specific');
// BO-1 · the single designation read — every prop consumer goes through this (alias-first).
const s8Designation = computed(() => props.s8Name ?? props.suite8Name);

// D3A · SCPP Filter Pills · activeScpFilter null = "All Sessions"
const activeScpFilter = ref<string | null>(null);

// A-5 PFGD · GMSF (General-Manager-Suite8-Filter) · activeSuite8Filter null = "All Suite 8s"
// Parallel to activeScpFilter — independent filter lane; both can be active simultaneously.
const activeSuite8Filter = ref<string | null>(null);

// MD-9 · D-MC-3 · Per-Instance Model Control · the model DROPDOWN selection. Seeded to the
// default (Opus 4.8); on change we push it to the controller (→ pendingSpawnModel state) so the
// NEXT spawn (general anor Suite 8) pins it. The dropdown OWNS this selection — persistent, not
// a per-click trigger. On mount we sync the initial default into state so the first spawn threads it.
const modelOptions = SCS_AVAILABLE_MODELS;
const selectedModel = ref<string>(SCS_DEFAULT_MODEL);
const selectedModelLabel = computed<string>(
  () => scsModelLabel(selectedModel.value) ?? selectedModel.value,
);
// MD-9 · THE DROPDOWN COMPONENT · the model picker is now the extracted ScsDropdown (the
// in-DOM, offscreen-safe selection control). The SCP page renders OFFSCREEN (electronWindow ·
// offscreen:true), so a native <select> popup — OS-drawn chrome with no window handle to
// anchor to — can NEVER open. ScsDropdown renders its trigger + drawer wholly in-DOM.
// The catalog entries map to the dropdown option shape (label=friendly label, hint=tier,
// title=blurb). selectedModel OWNS the selection (persistent, not a per-click trigger).
const modelDropdownOptions = computed(() =>
  modelOptions.map((m) => ({ value: m.id, label: m.label, hint: m.tier, title: m.blurb })),
);
function handleModelChange(): void {
  console.log('[SCS-Bridge MD-9] model change · model=', selectedModel.value);
  controller?.setSpawnModel(selectedModel.value);
}
// MD-9 DIAGNOSTIC PROBE · re-pointed at the ScsDropdown wrapper. isTrusted=false ⇒ synthesized
// input (sendInputEvent-class); a trusted mousedown here confirms the in-DOM trigger is live.
// Ground-truth telemetry stays available for the ShotGun read.
function logModelTriggerProbe(kind: string, e: Event): void {
  const ui = e as MouseEvent;
  console.log(
    `[SCS-Bridge MD-9 PROBE] model-trigger ${kind} · isTrusted=${e.isTrusted}` +
      ` · defaultPrevented=${e.defaultPrevented}` +
      (typeof ui.button === 'number' ? ` · button=${ui.button}` : '') +
      ` · options=${modelOptions.length}`,
  );
}
onMounted(() => {
  // Seed pendingSpawnModel with the picker's initial default so the first spawn threads it.
  controller?.setSpawnModel(selectedModel.value);
});

// D3D Wave-2 · SREX expand state (only one row expanded at a time).
const expandedSessionId = ref<string | null>(null);

// D3D Wave-2 · SAES mirror from controller (activeEngagedSessionId).
// Null = no engagement; string = currently engaged session.id.
// Cite: R3-C §S1+S7 · R3-D §S3 SAES-engaged-border styling.
const activeEngagedSessionId = computed<string | null>(
  () => controller?.activeEngagedSessionId.value ?? null,
);

// D3D Hotfix-1 · NSESF Vue fallback · activeScpFilter requirement dropped.
// Template SCP = All SCP default per user clarification 2026-05-23.
// SCP-specific affordances deferred to Macro 3 wrap-up (Cycle 164+).
// Cite: D3D-HOTFIX-1-R7-FUCHSIA-CLINICAL.md §C C1.
// SDEB · Spawn-Decoupling-Engage-Boundary (Diagnostic Macro DM-D2 · S2 §C.3)
// Spawn-eligibility decoupled from engagement state. FKIS (D3 PoC) handles
// per-session input with per-window isolation; spawning a new session does NOT
// contend for the engaged terminal's keystroke focus. SAES retained as
// INFORMATIONAL ref (focus-target styling); LOSES gate role. SAES-V2 ⊃ PSEB + SDEB.
const canSpawn = computed<boolean>(
  () =>
    props.bridgeJson !== null &&
    (controller?.connectionEstablished.value ?? false) === true &&
    !isSpawning.value,
);

// D3D Hotfix-1 · NSESF Vue fallback per TUI M132 RPCD (animatedTui.ts:L1116-1140).
// Precedence: activeScpFilter > first boundScps key > undefined.
// Undefined scpName: controller normalizes to null; principle gates on !pendingScpName.
// With a live bridge, boundScps will have at least one key — fallback produces a real scpName.
// Cite: D3D-HOTFIX-1-R7-FUCHSIA-CLINICAL.md §C C1.
function handleSpawn(): void {
  if (!canSpawn.value || isSpawning.value) return;
  // R-D1 SCSE · CFSAS: Specific mode routes to triggerSpawnSuite8Session.
  // Uses existing controller?. optional-chain form — inject is NOT migrated.
  if (isSpecificMode.value && s8Designation.value) {
    console.log('[SCS-Bridge CFSAS] Specific-mode spawn · suite8Name=', s8Designation.value);
    controller?.triggerSpawnSuite8Session(s8Designation.value);
    return;
  }
  // General mode: existing NSESF fallback chain (unchanged).
  const fallbackScpName =
    activeScpFilter.value ??
    Object.keys(props.bridgeJson?.boundScps ?? {})[0] ??
    undefined;
  console.log(
    '[SCS-Bridge CMIA-Spawn] Click · scpName=',
    fallbackScpName,
    '· (filter=',
    activeScpFilter.value,
    '· fallback-source=',
    activeScpFilter.value ? 'filter' : (fallbackScpName ? 'first-boundScp' : 'undefined'),
    ') · canSpawn=',
    canSpawn.value,
    '· isSpawning=',
    isSpawning.value,
  );
  controller?.triggerSpawnSession(fallbackScpName);
}

// D3D Wave-2 · Engage row affordance click handler.
// SAESV2 · activeEngagedSessionId is informational only — marks the current
// focus-target via the row border (.session-row-container.saes-engaged). The
// non-active Engage buttons render at full opacity and stay interactive (the
// saes-blocked de-emphasis class was pruned); click dispatch is NOT blocked;
// principle-side per-flight isEngaging guard prevents double-fire. Concurrent
// engagement (CSME) permitted.
function handleEngage(sessionId: string): void {
  // ERAU-W1 capture log — DM-D3 Wave-1 capture-first instrument (Ochre-B §B.1)
  // Surfaces DOM-row → handleEngage(sessionId) correspondence so RDUE
  // (Row-Dispatch-Ulid-Equivalence · S2 §B.3) is Lambda-falsifiable.
  // Cross-reference with the subsequent scsbridge.engage.dispatched event
  // in debug.json yields the EMSR (Break-B) verdict. Wave-2 sort fix is
  // EVIDENCE-GATED — NOT applied here (M-CLPRC).
  const rowIndex = displayedSessions.value.findIndex((s) => s.id === sessionId);
  const clickedSession = displayedSessions.value[rowIndex];
  console.log('[SCS-Bridge ERAU-W1] handleEngage entry', {
    clickedSessionId: sessionId,
    clickedSessionSpawnedAt: clickedSession?.spawnedAt,
    clickedRowIndex: rowIndex,
    // THE TWO-SECTION SPLIT · per-section sort state replaces the retired scalars.
    onlineSort: `${onlineSortColumn.value}/${onlineSortDir.value}`,
    offlineSort: `${offlineSortColumn.value}/${offlineSortDir.value}`,
    displayedCount: displayedSessions.value.length,
    topThreeIds: displayedSessions.value.slice(0, 3).map((s) => s.id),
    topThreeSpawnedAt: displayedSessions.value.slice(0, 3).map((s) => s.spawnedAt),
  });
  console.log(
    '[SCS-Bridge CMIA-Engage] Click · sessionId=',
    sessionId,
    '· activeEngaged=',
    activeEngagedSessionId.value,
    '· isEngaging=',
    isEngaging.value,
  );
  if (isEngaging.value) return;
  controller?.triggerEngageSession(sessionId);
}

// D3RM-E · CMIA-Focus button click handler. Fires only when DD-2 gate is
// satisfied at template level (session.status === 'launched' && terminalWindowId
// !== undefined). Side-effect-only: brings Terminal.app window to front via
// MCP scp_focus_session → focusTerminalWindow (ASFP). Does NOT mutate SAES.
function handleFocus(sessionId: string): void {
  console.log(
    '[SCS-Bridge CMIA-Focus] Click · sessionId=',
    sessionId,
    '· isFocusing=',
    isFocusing.value,
  );
  if (isFocusing.value) return;
  controller?.triggerFocusSession(sessionId);
}

// D3D Wave-2 · SREX expand toggle. Row click toggles drawer.
function toggleExpand(sessionId: string): void {
  if (expandedSessionId.value === sessionId) {
    expandedSessionId.value = null;
  } else {
    expandedSessionId.value = sessionId;
  }
  console.log('[SCS-Bridge SREX] toggleExpand · id=', sessionId, '· expanded=', expandedSessionId.value);
}

// D3D Wave-2 · HAZARD-Z three-value SWIO discrimination helper.
// NEVER use v-if="session.isProcessing" — implicit boolean coercion would
// render OPEN for pre-D3D sessions where isProcessing === undefined.
// Cite: D3D-MANIFOLD-RECALL-R0-OBSIDIAN.md §B BLOCKING-1.
function getSwioState(session: ScsBridgeSessionEntry): 'unknown' | 'working' | 'open' {
  if (session.isProcessing === undefined) return 'unknown';
  if (session.isProcessing === true) return 'working';
  return 'open';
}

// ============================================================================
// RM-D3 · PRMX/ATID/DPOB/FSSF · Permission Panel phase + handlers.
// ============================================================================
// The reactive `session` entry IS the state machine (no new Vue-local machine).
// Phase priority (HAZARD-Z `=== true` discipline, mirrors getSwioState):
//   permissionPending (DPOB) > askUserQuestionPending (FSSF) > activeTool (ATID) > idle.
function getPanelPhase(s: ScsBridgeSessionEntry): 'permission' | 'focus' | 'active' | 'idle' {
  if (s.permissionPending === true) return 'permission';
  if (s.askUserQuestionPending === true) return 'focus';
  if (s.activeTool !== undefined) return 'active';
  return 'idle';
}

// PSTK · a permission button now carries persistRule (the "Allow & don't ask" flag) so the
// click threads it through to Direction C's persistRule path.
type PermButton = { label: string; behavior: 'allow' | 'deny'; persistRule: boolean };

// PSTK · THE HEAD READER. The pane always answers the HEAD of the FIFO queue. Prefer the
// queue's index-0 item (the authoritative source); fall back to the legacy PRMX scalars
// (a session mirrored before PSTK, or the head-mirror on a scalar-only relay). Returns the
// { requestId, tool, input, suggestions } shape the pane + buttons read.
function getPermissionHead(s: ScsBridgeSessionEntry): {
  requestId: string; tool: string; input: string; suggestions?: string;
} {
  const head = s.pendingPermissions?.[0];
  if (head) {
    return { requestId: head.requestId, tool: head.tool, input: head.input, suggestions: head.suggestions };
  }
  return {
    requestId: s.pendingPermissionRequestId ?? '',
    tool: s.pendingPermissionTool ?? '—',
    input: s.pendingPermissionInput ?? '',
    suggestions: s.permissionSuggestions,
  };
}

// PSTK · the QUEUED STRIP source · items 1..N-1 (everything behind the head). Empty when
// the queue is absent or a lone head pends.
function getQueuedItems(s: ScsBridgeSessionEntry): Array<{ requestId: string; tool: string; input: string }> {
  const q = s.pendingPermissions;
  if (!q || q.length <= 1) return [];
  return q.slice(1).map((it) => ({ requestId: it.requestId, tool: it.tool, input: it.input }));
}

// PSTK · the stack depth (queue length · falls back to 1 when only the legacy scalars pend).
function getQueueDepth(s: ScsBridgeSessionEntry): number {
  const q = s.pendingPermissions;
  if (q && q.length > 0) return q.length;
  return s.permissionPending === true ? 1 : 0;
}

// DPOB · parse the HEAD's compact suggestions string back to buttons (fallback default set).
// The Bridge always offers Deny; suggestions are allows. PSTK · every allow button carries a
// persistRule flag — the LAST allow (the "always" slot) persists; the plain Allow does not.
function getPermissionButtons(s: ScsBridgeSessionEntry): PermButton[] {
  const head = getPermissionHead(s);
  if (head.suggestions) {
    try {
      const parsed = JSON.parse(head.suggestions) as Array<{ label: string; behavior: 'allow' | 'deny' }>;
      if (Array.isArray(parsed) && parsed.length) {
        const cleaned = parsed
          .filter((b) => b && typeof b.label === 'string')
          .map((b) => ({ label: b.label, behavior: b.behavior === 'deny' ? 'deny' as const : 'allow' as const }));
        if (cleaned.length) {
          // Suggestion-derived allows do not carry persistRule (the "Allow & don't ask"
          // semantics live in the default set below). Deny is always appended.
          return [
            ...cleaned.map((b) => ({ ...b, persistRule: false })),
            { label: 'Deny', behavior: 'deny' as const, persistRule: false },
          ];
        }
      }
    } catch { /* fall through to default set */ }
  }
  return [
    { label: 'Allow', behavior: 'allow', persistRule: false },
    { label: "Allow & don't ask", behavior: 'allow', persistRule: true },
    { label: 'Deny', behavior: 'deny', persistRule: false },
  ];
}

// RM-D3 · E.5 · decision handler + in-flight guard. The panel clears via the
// relay (Direction B): the Bridge clears the entry → sessions.json change →
// relay re-pushes → getPanelPhase → 'idle'. No optimistic local mutation.
//
// PSTK · THE DECIDING-SEAM DIES. The old component-wide `ref<boolean>` gated EVERY row's
// buttons during ANY session's in-flight decision — a second blocked session could not be
// answered while the first was deciding. The guard is now PER-SESSION (keyed by sessionId),
// so each row's buttons gate on THEIR session alone.
const isDecidingPermission = ref<Record<string, boolean>>({});
async function handlePermissionDecision(
  sessionId: string,
  behavior: 'allow' | 'deny',
  requestId: string,
  persistRule = false,
): Promise<void> {
  if (isDecidingPermission.value[sessionId]) return;
  isDecidingPermission.value = { ...isDecidingPermission.value, [sessionId]: true };
  console.log('[SCS-Bridge PRMX] handlePermissionDecision · sessionId=', sessionId, '· behavior=', behavior, '· persistRule=', persistRule);
  try {
    await controller?.triggerPermissionDecision(sessionId, behavior, requestId, persistRule);
  } finally {
    const next = { ...isDecidingPermission.value };
    delete next[sessionId];
    isDecidingPermission.value = next;
  }
}

// RM-D3 · E.6 · auto-expand on permission (V4 · conditional · note: badge always
// shows on the collapsed row via the SWIO-style PERMISSION badge in the template).
// Forced expand ONLY when no other row is focused (expandedSessionId === null),
// so it never fights a user reading another row.
watch(
  () => props.sessionsList,
  (newList) => {
    if (expandedSessionId.value !== null) return; // do not steal focus from an open row
    const pending = newList.find((s) => s.permissionPending === true);
    if (pending) {
      expandedSessionId.value = pending.id;
      console.log('[SCS-Bridge PRMX] auto-expand on permission · id=', pending.id);
    }
  },
  { deep: false },
);

// D3D Wave-2 · SIGR isSpawning auto-reset watcher.
// When DSAB FBB relay arrives with a new session row (sessionsList grows),
// release the SIGR transient guard. Backup release: 5000ms timeout inside
// the principle itself (HAZARD-V).
watch(
  () => props.sessionsList.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && isSpawning.value) {
      isSpawning.value = false;
      console.log('[SCS-Bridge SIGR] isSpawning reset · DSAB arrival confirmed · count=', newLength);
    }
  },
);

// D3D Wave-2 · SAES auto-clear watcher (R3-C §S7).
// D3H Bug B fix · R7 Path C · §2 architectural lock (Cycle 165 R0+):
// removed `status === 'offline'` trigger. Post-Bug-A-Recurse, ALL sessions
// boot as OFFLINE (markAllSessionsOffline preserves claudeSessionId · status
// transitions OFFLINE→LAUNCHED only AFTER launchInformative completes). The
// previous 'offline' trigger fired during the spawn-resume window (~100-500ms
// pre-hook), prematurely clearing SAES before the engagement could resolve.
// SAES now clears only on 'archived' (semantically terminal) OR session-not-found.
watch(
  () => props.sessionsList,
  (newList) => {
    const engagedId = activeEngagedSessionId.value;
    if (engagedId === null) return;
    const engagedSession = newList.find((s) => s.id === engagedId);
    if (!engagedSession || engagedSession.status === 'archived') {
      console.log(
        '[SCS-Bridge SAES] auto-clear · engaged session completed · id=',
        engagedId,
        '· status=',
        engagedSession?.status ?? 'NOT_FOUND',
      );
      controller?.clearActiveEngagedSession();
    }
  },
  { deep: false },
);

// D3D Wave-2 · Esc keydown collapses SREX drawer.
function handleKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return;
  // MD-9 · THE DROPDOWN COMPONENT · the model picker's Escape/outside-close is now owned
  // internally by ScsDropdown (its own document listener), so no branch is needed here.
  // SAC.4 · Esc dismisses an open Anchor System panel first (the popover idiom · §4.1).
  if (anchorPanelOpenPage.value !== null) {
    console.log('[SCS-Bridge SAC.4] Esc · closing Anchor System panel');
    anchorPanelOpenPage.value = null;
    return;
  }
  // SAC.2 · §2.3 · Esc reverts an armed un-anchor confirm first (before collapsing
  // SREX) — the release window closes without committing.
  if (unanchorArmingId.value !== null) {
    console.log('[SCS-Bridge SAC.2] Esc · disarming un-anchor confirm');
    unanchorArmingId.value = null;
    return;
  }
  if (expandedSessionId.value !== null) {
    console.log('[SCS-Bridge SREX] Esc · collapsing expanded row');
    expandedSessionId.value = null;
  }
}

// ============================================================================
// SSP · D-SSP.3 · Suite-8 Spawn Picker (Pewter drawer/roster · SSP-PEWTER-DESIGN.md)
// ============================================================================
// The collapsed "Spawn a Suite 8" drawer in the header. Reads the D-SSP.2 roster
// ref (controller.availableSuite8s · Suite8PickerEntry[]), fetched on mount + on
// drawer-open (so a newly-added Suite 8 under Cascades/8_SUITES/ appears next open).
// Single-select roster; spawn reuses the SBST (triggerSpawnSuite8Session) gated by
// the isSpawningSuite8 SIGR. Page-less Suite 8s render FIRST-CLASS — hasPage is NOT
// in the data (D-SSP.1 omitted it), so per Pewter's degrade-graceful contract the
// page-less DOT/caption is OFF in v1; every hasInstance:true entry is spawnable.

// Single-select choice (suite8 name · null = no selection). Mirrors the
// component's expandedSessionId / relayTargetSessionId single-select discipline.
const selectedSpawnSuite8Name = ref<string | null>(null);

// Roster from the D-SSP.2 controller ref (full-replaced by fetchAvailableSuite8s).
const availableSuite8s = computed<Suite8PickerEntry[]>(
  () => controller?.availableSuite8s.value ?? [],
);

// Loading = bridge connected but roster not yet populated (the connect window).
const s8PickerLoading = computed<boolean>(
  () =>
    (controller?.connectionEstablished.value ?? false) === true &&
    availableSuite8s.value.length === 0,
);

// Dynamic Spawn-button label echoes the selection (mirrors spawnButtonLabel).
const s8SpawnButtonLabel = computed<string>(() => {
  if (isSpawningSuite8.value) return 'Spawning…';
  // MD-9 · D-MC-3 · the S8 spawn button NOTES the selected model too (e.g. "Spawn Foo · Opus 4.8").
  const modelNote = ` · ${selectedModelLabel.value}`;
  if (selectedSpawnSuite8Name.value) return `Spawn ${selectedSpawnSuite8Name.value}${modelNote}`;
  return `Spawn Suite 8${modelNote}`;
});

// Spawnable filter: only hasInstance:true entries can spawn (Teal Claude · no
// Instance.md → not spawnable).
function isSuite8Spawnable(entry: Suite8PickerEntry): boolean {
  return entry.hasInstance === true;
}

// THE SUITE 8 DROPDOWN (Pewter · the ScsDropdown idiom the Model row proved — in-DOM,
// offscreen-safe; the SSP drawer roster is RETIRED in its favor). Spawnable entries
// only; the snippet rides as the row title (hover blurb). Selecting ENABLES the
// Spawn Suite 8 button below — selection and spawn are two deliberate steps.
const suite8DropdownOptions = computed(() =>
  availableSuite8s.value
    .filter(isSuite8Spawnable)
    .map((e) => ({ value: e.name, label: e.name, title: e.snippet || undefined })),
);

// Dropdown change → single-select state (the emit is string | undefined per the
// ScsDropdown contract; rows carry real names — the placeholder is the no-selection
// rendering, so empty/undefined both resolve to null).
function onSuite8DropdownChange(name: string | undefined): void {
  if (isSpawningSuite8.value) return;
  selectedSpawnSuite8Name.value = name !== undefined && name.length > 0 ? name : null;
  console.log('[SCS-Bridge SSP] select · name=', selectedSpawnSuite8Name.value);
}

// Roster freshness — the retired drawer refreshed on open; the dropdown row refreshes
// on interaction intent (mousedown on the wrapper) so a newly-added Suite 8 appears.
function refreshS8Roster(): void {
  void controller?.fetchAvailableSuite8s();
}

// Spawn handler · THE SPAWN-LANE CONTRACT (the TestingAFrontier field catch): the Session
// Manager's default Suite 8 spawn is the PLAIN lane — onboard:false (the seed is specific
// to the point of calling: the page/Shatterite Menu anchor + the Gitm Resolver keep it) +
// anchor:false (anchoring belongs to the Shatterite Menu system FIRST — an SM spawn never
// claims a page's anchor; a future SM anchor-toggle may opt in on its own terms). scpName
// omitted → the controller's Sovereign Spawn Binding resolves the OWN citizen, so the
// C857 first-found probe never mis-binds under a designation collision.
function handleSpawnSuite8(): void {
  if (isSpawningSuite8.value) return;
  const name = selectedSpawnSuite8Name.value;
  if (!name) return;
  console.log('[SCS-Bridge SSP] handleSpawnSuite8 · name=', name, '· lane=plain (onboard:false · anchor:false)');
  controller?.triggerSpawnSuite8Session(name, undefined, false, false, false, undefined, false, false);
}

// SSP · SIGR-reset watcher · mirrors Suite8OnDemand.vue's spawning→idle transition.
// When the new session row arrives (sessionsList grows), the existing SIGR watcher
// at line ~261 releases isSpawning (the general lane). For the Suite-8 lane we clear
// the selection on isSpawningSuite8 falling back to idle, so the dropdown returns to
// its placeholder and the spawned session lands in the list below.
watch(
  () => isSpawningSuite8.value,
  (nowSpawning, wasSpawning) => {
    if (wasSpawning && !nowSpawning) {
      console.log('[SCS-Bridge SSP] SIGR reset · spawn complete · clearing selection');
      selectedSpawnSuite8Name.value = null;
    }
  },
);

onMounted(() => {
  // R-D1 SCSE · GSRM: pre-commit Suite 8 filter in Specific mode — reuses existing
  // setSuite8Filter machinery; no new filter logic. suite8FilterOptions already computed.
  if (isSpecificMode.value && s8Designation.value) {
    setSuite8Filter(s8Designation.value);
  }
  // SSP · D-SSP.3 · fetch the roster on Session-Manager mount (degrade-graceful —
  // a no-op log if the bridge endpoint is not yet available · ACK-safe in .2).
  void controller?.fetchAvailableSuite8s();
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
  // MD-9 · THE DROPDOWN COMPONENT · the model-picker outside-click listener is now owned
  // internally by ScsDropdown (attached-while-open, detached on close/unmount) — nothing to
  // tear down here.
});

const scpFilterOptions = computed((): Array<{ value: string | null; label: string; count: number }> => {
  // Cycle 161 R3 · DSPP · Daemon-SCPs-Pills-Pattern.
  // Pills derive from daemon-authoritative bridgeJson.boundScps (live SCP
  // registry) instead of sessionsList.scpName (historical session derivation,
  // SPDD anti-pattern). HAZARD-δ null guard mandatory: bridgeJson may be null
  // pre-BOCR-S connect window. Pill count still derives from sessionsList
  // filter — honest 0 count until D3C daemon writes scpName into sessions.json.
  // Citation: D3B-WIRE-THROUGH-FOUNDATION-R7-FUCHSIA-CLINICAL.md §Q4 DSPP
  // Citation: D3B-WIRE-THROUGH-FOUNDATION-R4-VIRIDIAN-AUDIT.md §Angle 3 + HAZARD-δ
  const boundScps = Object.keys(props.bridgeJson?.boundScps ?? {});
  const options: Array<{ value: string | null; label: string; count: number }> = [
    { value: null, label: 'All Sessions', count: props.sessionsList.length },
  ];
  for (const scpName of boundScps) {
    options.push({
      value: scpName,
      label: scpName,
      count: props.sessionsList.filter((s) => s.scpName === scpName).length,
    });
  }
  console.log(
    '[SCS-Bridge D3B] DSPP pills computed · boundScps count=',
    boundScps.length,
    '· total sessions=',
    props.sessionsList.length,
  );
  return options;
});

function setScpFilter(value: string | null): void {
  activeScpFilter.value = value;
  console.log('[SCS-Bridge D3A] SCP filter set ·', value);
}

// A-5 PFGD · GMSF · Suite8 filter options derived from sessionsList.suite8Name values.
// Unlike SCP pills (DSPP — derived from daemon-authoritative bridgeJson.boundScps), Suite8
// names are read from the sessionsList directly (A-3 SAPR populates suite8Name at spawn;
// no daemon-side equivalent of boundScps for Suite 8s). The "All Suite 8s" entry always
// appears; per-name pills render for every unique suite8Name seen in the sessionsList.
// Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §2 Band A-5 PFGD
const suite8FilterOptions = computed((): Array<{ value: string | null; label: string; count: number }> => {
  const names = new Set(
    props.sessionsList
      .map((s) => s.suite8Name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0),
  );
  const options: Array<{ value: string | null; label: string; count: number }> = [
    { value: null, label: 'All Suite 8s', count: props.sessionsList.length },
  ];
  for (const name of names) {
    options.push({
      value: name,
      label: name,
      count: props.sessionsList.filter((s) => s.suite8Name === name).length,
    });
  }
  return options;
});

function setSuite8Filter(value: string | null): void {
  activeSuite8Filter.value = value;
  console.log('[SCS-Bridge A-5 PFGD GMSF] Suite8 filter set ·', value);
}

// D3A · SCST + SISR · Sortable Column State
// R-D1 SCSE · S8CR: 'suite8Name' added to sort union for the new Suite 8 column.
// -------------------------------------------------------------------------
// THE TWO-SECTION SPLIT (re-landed C543 · the C535 law in the SAFE shape): the list
// partitions into an ONLINE section (status === 'launched' · the live sessions) and
// an OFFLINE section (everything else). Each section owns its OWN sort state, so
// clicking a column header in one section never disturbs the other. Both default
// to spawnedAt / ASC — first-spawned on TOP, latest at the BOTTOM.
// NO discriminated render union (the C536 de-twin is retired): the template's single
// v-for walks REAL sessions only (sectionedList), so every :key is a defined
// session.id; the section labels/headers inject at the boundaries.
type SessionSortColumn = 'id' | 'scpName' | 'spawnedAt' | 'status' | 'suite8Name';
type SessionSortDir = 'asc' | 'desc';
type SessionSection = 'online' | 'offline';

const onlineSortColumn = ref<SessionSortColumn>('spawnedAt');
const onlineSortDir = ref<SessionSortDir>('asc');
const offlineSortColumn = ref<SessionSortColumn>('spawnedAt');
const offlineSortDir = ref<SessionSortDir>('asc');

// One setSort factory parametrized by section — clicking a column toggles direction
// when it is already active, else adopts the column at ascending.
function setSort(section: SessionSection, col: SessionSortColumn): void {
  const colRef = section === 'online' ? onlineSortColumn : offlineSortColumn;
  const dirRef = section === 'online' ? onlineSortDir : offlineSortDir;
  if (colRef.value === col) {
    dirRef.value = dirRef.value === 'asc' ? 'desc' : 'asc';
  } else {
    colRef.value = col;
    dirRef.value = 'asc';
  }
  console.log('[SCS-Bridge D3A] Sort set · section=', section, '· col=', col, '· dir=', dirRef.value);
}

// One comparator shared by both sections. spawnedAt sorts numerically (string
// coercion loses ordering on epoch ms); all other columns sort lexically.
function sortSessions(
  list: ScsBridgeSessionEntry[],
  col: SessionSortColumn,
  dir: SessionSortDir,
): ScsBridgeSessionEntry[] {
  return [...list].sort((a, b) => {
    const av = (a as Record<string, unknown>)[col] ?? '';
    const bv = (b as Record<string, unknown>)[col] ?? '';
    let cmp: number;
    if (col === 'spawnedAt') {
      cmp = Number(av) - Number(bv);
    } else {
      cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

// The ONE header markup drives either section's sort state through these resolvers.
function sortColumnFor(section: SessionSection): SessionSortColumn {
  return section === 'online' ? onlineSortColumn.value : offlineSortColumn.value;
}
function sortDirFor(section: SessionSection): SessionSortDir {
  return section === 'online' ? onlineSortDir.value : offlineSortDir.value;
}

// displayedSessions is the shared FILTERED base (SCP + Suite8 lanes, unsorted).
// Both sections partition and independently sort this base; the handleEngage
// diagnostic and the auto-expand watcher continue to read it.
const displayedSessions = computed((): ScsBridgeSessionEntry[] => {
  // A-5 PFGD · GMSF · Both filter lanes are independent; apply sequentially.
  // SCP filter first (existing lane), Suite8 filter second (new PFGD lane).
  const scpFiltered = activeScpFilter.value
    ? props.sessionsList.filter((s) => s.scpName === activeScpFilter.value)
    : props.sessionsList;
  const filtered = activeSuite8Filter.value
    ? scpFiltered.filter((s) => s.suite8Name === activeSuite8Filter.value)
    : scpFiltered;
  return filtered;
});

// ONLINE = the live sessions (status === 'launched'), independently sorted.
const onlineSessions = computed((): ScsBridgeSessionEntry[] =>
  sortSessions(
    displayedSessions.value.filter((s) => s.status === 'launched'),
    onlineSortColumn.value,
    onlineSortDir.value,
  ),
);

// OFFLINE = everything else the filtered list shows (allocated · archived · offline).
const offlineSessions = computed((): ScsBridgeSessionEntry[] =>
  sortSessions(
    displayedSessions.value.filter((s) => s.status !== 'launched'),
    offlineSortColumn.value,
    offlineSortDir.value,
  ),
);

// D-SJP · OFFLINE PAGINATION — the render was unbounded with the registry. ONLINE is
// inherently bounded (live windows — a handful); OFFLINE grows without bound, so the
// page window applies to the OFFLINE section ONLY. The section label keeps showing the
// TOTAL offline count; the pager (‹ · Page N / M · ›) renders in the label row when
// more than one page exists. The clamp-watch pulls the page back in range when the
// list shrinks (filter switch · prune · archive).
const OFFLINE_PAGE_SIZE = 15;
const offlinePage = ref(0);
const offlinePageCount = computed((): number =>
  Math.max(1, Math.ceil(offlineSessions.value.length / OFFLINE_PAGE_SIZE)),
);
watch(offlinePageCount, (count) => {
  if (offlinePage.value >= count) offlinePage.value = Math.max(0, count - 1);
});
const pagedOfflineSessions = computed((): ScsBridgeSessionEntry[] =>
  offlineSessions.value.slice(
    offlinePage.value * OFFLINE_PAGE_SIZE,
    (offlinePage.value + 1) * OFFLINE_PAGE_SIZE,
  ),
);

// THE SAFE INTERLEAVE — real sessions only, online first then offline (the OFFLINE
// section paged · D-SJP). The single template v-for walks THIS list; the section
// boundaries derive from the counts, never from union items, so no render item can
// lack a session.
const sectionedList = computed((): ScsBridgeSessionEntry[] => [
  ...onlineSessions.value,
  ...pagedOfflineSessions.value,
]);

// True at the first OFFLINE row — the template injects the OFFLINE label + header
// before it (C535 visibility law: OFFLINE chrome renders ONLY when it holds rows;
// ONLINE chrome always renders whenever anything is shown).
function isFirstOfflineRow(index: number): boolean {
  return offlineSessions.value.length > 0 && index === onlineSessions.value.length;
}

function shortId(id: string): string {
  return id.slice(-8);
}

function formatTime(timestamp: string | number | undefined): string {
  if (!timestamp) return '—';
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '—';
  }
}

const lastUpdate = computed((): string => {
  if (!props.bridgeJson?.writtenAt) return '—';
  return new Date(props.bridgeJson.writtenAt).toLocaleTimeString();
});

const bridgeStatusDisplay = computed((): string => {
  return props.bridgeJson?.bridgeVersion ?? 'disconnected';
});

// D3D Hotfix-1 · Bug A B1 Single-Source Collapse · PPLD ↔ Connection unification.
// connectionEstablished is the authoritative Connection truth (SF-2 sticky-up gate).
// bridgeActive remains on controller for future debug · demoted from primary display.
// Label semantics aligned with Connection Status card ("Pending" / "Connected").
// Cite: D3D-HOTFIX-1-R7-FUCHSIA-CLINICAL.md §B B1.
const bridgeActiveDisplay = computed((): string =>
  (controller?.connectionEstablished.value ?? false) ? 'Connected' : 'Pending',
);

// D3D Wave-2 · Dynamic Spawn Button label.
// Mirrors R3-D §S2 spec: prefix + scpName when filter selected.
// R-D1 SCSE · GSRM: Specific mode branch fires first — produces "+ Spawn {suite8Name}".
const spawnButtonLabel = computed<string>(() => {
  if (isSpawning.value) return 'Spawning...';
  // MD-9 · D-MC-3 · the spawn button NOTES the selected model (e.g. "+ Spawn Session · Opus 4.8").
  const modelNote = ` · ${selectedModelLabel.value}`;
  if (isSpecificMode.value && s8Designation.value) return `+ Spawn ${s8Designation.value}${modelNote}`;
  if (activeScpFilter.value !== null) return `+ Spawn for ${activeScpFilter.value}${modelNote}`;
  // THE SPAWN SPLIT · "General" names the lane explicitly — the Suite 8 dropdown + its
  // spawn button sit directly below; this button is the identity-less general session.
  return `+ Spawn General Session${modelNote}`;
});

// D3E Diamond A · SRCR container state helper.
// Maps session state to container class suffix via getSwioState (HAZARD-Z safe).
function getContainerState(session: ScsBridgeSessionEntry): string {
  if (session.status === 'allocated') return 'allocated';
  if (session.status === 'offline' || session.status === 'archived') return 'offline';
  const swio = getSwioState(session);
  if (swio === 'working') return 'working';
  if (swio === 'open') return 'open';
  return 'open';
}

// D3F Diamond B Wave-2 micro-pass · TSEC (Transcript-Snippet-Editorial-Computed)
// Priority chain: transcriptSnippet (real from per-session JSONL watcher · Diamond B) →
// finalTurnSummary (legacy JTCH 200-char slice) → per-state mock fallbacks (Diamond A).
// Cite: D3F-ARCHITECTURE-R3-YELLOW-WIRING.md §S9 · D3F-BUG-F-R7-FUCHSIA-CLINICAL.md
// PMA-NR · Claude Code writes a SYNTHETIC assistant turn ("model":"<synthetic>")
// with this EXACT content when a turn completes with no real model response.
// lastTurnExtraction.model.ts surfaces it as transcriptSnippet (it is the JSONL's
// last assistant text). We do NOT treat it as a real snippet — it IS the model
// working/awaiting state → render the animated 'Model Processing' placeholder
// (shimmer + animated dot-dot-dot), independent of the SWIO working-container.
const SYNTHETIC_NO_RESPONSE = 'No response requested.';
function isModelProcessingPlaceholder(session: ScsBridgeSessionEntry): boolean {
  return session.transcriptSnippet?.trim() === SYNTHETIC_NO_RESPONSE;
}

function getMockSnippet(session: ScsBridgeSessionEntry): string {
  // PMA-NR priority · the synthetic no-response default → animated Model Processing
  if (isModelProcessingPlaceholder(session)) return 'Model Processing';
  // TSEC priority 1 · real transcript snippet from per-session JSONL watcher (Diamond B)
  if (session.transcriptSnippet && session.transcriptSnippet.length > 0) {
    return session.transcriptSnippet;
  }
  // Diamond A · per-state mock fallbacks (Diamond 3G AFLU: offline/archived mock pruned —
  // status badge + border already signal offline; mock string was Abstraction-Flu).
  if (session.status === 'allocated') return '— No final turn yet';
  if (session.isProcessing === undefined) return '— No turn data';
  if (session.isProcessing === true) return 'Processing turn...';
  // Diamond 3G AFLU: legacy JTCH finalTurnSummary slice removed (dead code in D3G).
  // Final fallback is honest: awaiting the TRBL/AQSD read result.
  return '— Awaiting transcript read';
}

// D3E Diamond A · HFEB disabled gate · true = button enabled.
// D3F Diamond B Wave-2: also enabled when transcriptSnippet present (real watcher data).
function hasSnippetContent(session: ScsBridgeSessionEntry): boolean {
  if (session.transcriptSnippet && session.transcriptSnippet.length > 0) return true;
  return session.status === 'launched' && session.isProcessing !== undefined;
}

// D3E Diamond A · HFEB click handler (placeholder · Diamond B implements full view).
// HFEB REPURPOSED (user · Pewter flair): the chip opens the drawer AND hands the caret to the
// chat input, scrolled into view — the user begins typing immediately. Only ONE drawer renders
// at a time (v-if on expandedSessionId), so the post-open query finds exactly the fresh input.
function handleExpandClick(sessionId: string): void {
  expandedSessionId.value = sessionId;
  void nextTick(() => {
    // One extra beat — the drawer's expand animation (0.15s) starts on the same frame; the
    // focus+scroll lands cleanly once the input exists in layout.
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.session-srex-zone .srex-chat-input');
      if (!input) return;
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }, 60);
  });
}

// ============================================================================
// D3RM-G · CBSE · Chat Bar SREX Extension · Component State + Handlers
// ============================================================================
// Per-session chat drafts (UX-local · NOT Stratimux state). HAZARD-G8 accepted:
// re-render clears draft if the row remounts; preservation across SREX
// collapse-reopen within same row lifetime is provided by Vue ref scope.
const chatDrafts = ref<Record<string, string>>({});

// R-D2 · CBSRTS · Communication Bar Session-Scoped Relay Target Selector.
// Single-select relay target (parallel to expandedSessionId single-select).
// null = no relay target → next message is a normal message to the open session.
// Cleared on send-initialize (OSSCSI · handleChatSubmit). Scoped to the open SREX row.
// LD-16/V-3: declared in R-D2 so the envelope transform compiles standalone;
// R-D1 wires the Communication Bar UI to this same ref.
const relayTargetSessionId = ref<string | null>(null);

// Per-session status map · written by the principle's chatStatusWriter callback.
// Template reads via getChatStatus(sessionId) / getChatStatusText(sessionId).
const chatStatusMap = ref<Record<string, ChatStatusKind>>({});

// D3RM-G · Register the status writer with the principle once on mount.
// Principle calls writer on send-success/error/timeout transitions; component
// reactively updates the per-row status hint without coupling status into the
// Stratimux store. Idempotent: re-registering is safe (last writer wins).
setChatStatusWriter((sessionId: string, status: ChatStatusKind) => {
  chatStatusMap.value = { ...chatStatusMap.value, [sessionId]: status };
});

function setChatStatus(sessionId: string, status: ChatStatusKind): void {
  chatStatusMap.value = { ...chatStatusMap.value, [sessionId]: status };
}

function getChatStatus(sessionId: string): ChatStatusKind {
  return chatStatusMap.value[sessionId] ?? '';
}

function getChatStatusText(sessionId: string): string {
  const status = getChatStatus(sessionId);
  // Pre-render honest "queue" hint when SWIO is working (Pewter §2.8 · §5.8).
  // We do not surface 'mid-turn' here because the per-row session reference is
  // not in scope at this helper level; the template can override via :class.
  switch (status) {
    case 'sending': return 'Sending…';
    case 'queued':  return 'Message queued · awaiting Claude turn';
    case 'sent':    return 'Delivered';
    case 'error':   return 'Send failed · try again';
    default:        return '';
  }
}

// RM-D2 · buildRelayEnvelope now delegates SORD shape to the SMFT Model File.
// Tag = tool name (TNST → 《send_message》, not the prior 《RELAY》 alias);
// ENDPOINT = endpoint + "/mcp" (authoritative · the prior bare `mcp:` field is fixed).
// Transport UNCHANGED: this string still becomes the `text` arg to triggerSendMessage
// (OIROTF · SBERP); only the produced shape changes (proven relay 256da6a + 13928ac
// preserved — same call signature, same FORF→FKIS path). The informational `scp:`
// field is dropped (no code consumer — routing is ULID-only via targetUlid · OV-1).
function buildRelayEnvelope(
  target: ScsBridgeSessionEntry,
  bridgeEndpoint: string,
  messageBody: string,
): string {
  return buildSordEnvelope({
    tool: 'send_message',
    bridgeConfig: { endpoint: bridgeEndpoint },
    params: { targetUlid: target.id },
    body: { kind: 'message', text: messageBody },
  });
}

// D3 FKIS · VSMW · Vue chat-bar submit handler routes to FKIS keystream
// (live focus + per-char stream + Return + focus-return) instead of UIMJ
// queue. Replaces D3RM-G CBSE triggerChatMessage path per Conference round 2.
function handleChatSubmit(sessionId: string): void {
  if (isChatSending.value) {
    console.log('[SCS-Bridge FKIS] handleChatSubmit · BLOCKED · in-flight');
    return;
  }
  const draft = (chatDrafts.value[sessionId] ?? '').trim();
  if (draft === '') {
    console.log('[SCS-Bridge FKIS] handleChatSubmit · empty draft · ignoring');
    return;
  }
  console.log(
    '[SCS-Bridge FKIS] handleChatSubmit · sessionId=',
    sessionId,
    '· textLength=',
    draft.length,
  );

  // RM-D2 · SORD transform · if a relay target is selected, reshape the draft
  // into the 《send_message》 SORD envelope (TNST · via buildSordEnvelope). sessionId
  // stays the OPEN session A — transport unchanged; only the text shape changes
  // (OIROTF). Envelope is captured into outboundText BEFORE the OSSCSI clear below
  // — no race (S4 §4 confirmed).
  const relayTarget = relayTargetSessionId.value
    ? props.sessionsList.find((s) => s.id === relayTargetSessionId.value) ?? null
    : null;
  const outboundText = relayTarget
    ? buildRelayEnvelope(relayTarget, props.bridgeJson?.endpoint ?? '', draft)
    : draft;

  // Optimistic clear · input drains immediately for UX clarity.
  chatDrafts.value = { ...chatDrafts.value, [sessionId]: '' };
  // OSSCSI · One-Shot Selection-Clear on Send-Initialize · clear the relay
  // target on the SAME event that clears the draft (L428 precedent). Next
  // message reverts to a normal send unless the user re-selects a target.
  relayTargetSessionId.value = null;
  // FKIS path · MCP send_message tool → FORF manifold in Electron main.
  isChatSending.value = true;
  pendingChatSessionId.value = sessionId;
  setChatStatus(sessionId, 'sending');
  void controller
    ?.triggerSendMessage(sessionId, outboundText)
    .then((result) => {
      if (result.ok) {
        setChatStatus(sessionId, 'sent');
        setTimeout(() => setChatStatus(sessionId, ''), 3000);
      } else {
        console.error('[SCS-Bridge FKIS] send failed:', result.error);
        setChatStatus(sessionId, 'error');
        setTimeout(() => setChatStatus(sessionId, ''), 5000);
      }
    })
    .finally(() => {
      isChatSending.value = false;
      pendingChatSessionId.value = null;
    });
}

// R-D1 · CBSRTS · live relay-target candidates for the open row.
// LIVE = status 'launched' (matches the chat-bar enable gate at the SEND button).
// Self-exclude (CP-5 · LD-9 · V-1 RESOLVED): the open/engaged row's own
// session.id is the FKIS origin of THIS chat bar's send — excluding it prevents
// the FKIS self-loop. NOT activeEngagedSessionId (which would wrongly exclude a
// valid relay target under SAES-V2 multi-engage).
function relayCandidates(openSessionId: string): ScsBridgeSessionEntry[] {
  return props.sessionsList.filter(
    (s) => s.status === 'launched' && s.id !== openSessionId,
  );
}

// R-D1 · CBSRTS · single-select toggle. Click a candidate to set it as the
// relay target; click the selected one again to deselect (back to normal send).
// Parallel to expandedSessionId single-select discipline. Cleared on send (OSSCSI).
function toggleRelayTarget(candidateId: string): void {
  relayTargetSessionId.value =
    relayTargetSessionId.value === candidateId ? null : candidateId;
}

// ===========================================================================
// RM-D4 · Session Rename + Communication Identity (SNDF/DSRF/THOV)
// Canonical Seam Contract: RM-D4-R6-PURPLE-VALIDATION.md §0.
// ===========================================================================

// RM-D4 · THOV · Toggle-Hover-Full-Identity-Overlay gate (Seam §0.1). One ref,
// global across ALL relay buttons. Component-local view preference, NOT persisted
// (resets to false on reload). Gates the relay-button :title binding (Seam §0.3).
const showFullId = ref<boolean>(false);

// RM-D4 · DSRF · Inline rename edit state (Seam §0.2). renameEditingId = which
// session row is in edit mode (null = none); renameBuffer = live input text.
// Parallel to expandedSessionId / relayTargetSessionId single-select discipline.
const renameEditingId = ref<string | null>(null);
const renameBuffer = ref<string>('');

// RM-D4 · AFEI · template ref to the inline rename input for programmatic focus.
// The input is v-if'd, so focus must wait for nextTick (the DOM insertion).
// SCS-Input migration: ref now points to the ScsInput component instance, which
// exposes focus()/select() via defineExpose (drop-in for the .focus()/.select() caller).
const renameInputRef = ref<InstanceType<typeof ScsInput> | null>(null);

// RM-D4 · Pencil click → enter edit mode. Seeds the buffer with the current
// effective label (scsLabel preferred per DPCO, then displayName, then empty so
// the placeholder shortId shows through). AFEI: auto-focuses + selects the input
// so the user can type immediately without a second click.
async function beginRename(sessionId: string, currentName?: string): Promise<void> {
  renameBuffer.value = currentName?.trim() ?? '';
  renameEditingId.value = sessionId;
  // RM-D4 · AFEI · nextTick lands the input in the DOM, but a slight delay is
  // needed before it is focusable (insertion + transition settle). Focusing on
  // the same tick can land before the element is active, leaving no live cursor;
  // the short setTimeout makes the field active, THEN focuses + selects so the
  // user can switch straight to typing.
  await nextTick();
  setTimeout(() => {
    const el = Array.isArray(renameInputRef.value) ? renameInputRef.value[0] : renameInputRef.value;
    if (el && typeof el.focus === 'function') {
      el.focus();
      el.select();
    }
  }, 50);
}

// RM-D4 · Escape → exit edit mode without writing. Clears both refs.
function cancelRename(): void {
  renameEditingId.value = null;
  renameBuffer.value = '';
}

// RM-D4 · Enter / blur → write the buffer, then exit edit mode. confirmRename
// awaits handleRename then always clears (cancelRename) so the row exits edit
// mode regardless of write outcome — the json-watcher relay carries the new
// displayName back through sessionsList → the DSRF label re-renders (no local echo).
async function confirmRename(sessionId: string): Promise<void> {
  // RM-D4 · double-fire guard (THE BUG FIX). Enter fires confirmRename →
  // cancelRename() sets renameEditingId = null → the v-if'd input is destroyed →
  // input destruction triggers @blur → confirmRename fires a SECOND time with the
  // already-cleared (empty) renameBuffer → the empty name would delete the label.
  // This guard exits the blur-triggered 2nd call before it can dispatch.
  if (!renameEditingId.value) return;
  await handleRename(sessionId, renameBuffer.value);
  cancelRename();
}

// RM-D4 · DUAL Vue write leg · the seam function the input/button calls. Pewter
// owns WHAT calls this (enter/blur/pencil); this owns the body. Uses controller?.
// optional chain to match the component's established inject convention (Green N7).
async function handleRename(sessionId: string, name: string): Promise<void> {
  const res = await controller?.triggerRenameSession(sessionId, name);
  if (res && !res.ok) {
    console.error('[ScsBridgeSessionManagement] rename failed:', res.error);
  }
}

// A-D3b · ARFSP · "Set as Anchor" reassignment. The anchor-cell button (Specific
// mode, non-anchor sessions only) calls this. Gated on !isSpawning to avoid
// contending during a spawn (mirrors the spawn button's isSpawning guard). Uses
// the controller?. optional-chain inject convention established in this component.
async function handleSetAnchor(sessionId: string): Promise<void> {
  if (isSpawning.value) return;
  const res = await controller?.triggerSetAnchor(sessionId);
  if (res && !res.ok) {
    console.error('[ScsBridgeSessionManagement] set-anchor failed:', res.error);
  }
}

// SAC.2 · Un-anchor affordance (Pewter SAC-PEWTER-DESIGN.md §2). Releases the page
// anchor on an anchored session. Two-step inline confirm (no modal · §2.3) gated by
// a single component-local arming ref (mirrors the renameEditingId single-select
// discipline) — first click arms the button, second commits within the same hover
// lifetime; pointer-leave / Esc reverts. Both placements (the collapsed anchor-cell
// "Release ⚓" reveal AND the SREX bar "Un-anchor" button) call handleUnsetAnchor —
// ONE source of truth. The leg → controller.triggerUnsetAnchor (SAC.1 · mirrors the
// set-anchor /mcp tools/call fetch shape). In-flight guard prevents double-fire.
const unanchorArmingId = ref<string | null>(null);
const isUnanchoring = ref(false);

// Arm-or-commit. First click on an un-armed row arms it; second click (while armed)
// commits the release. Per-row single-select — arming a new row disarms any prior.
async function handleUnsetAnchor(sessionId: string): Promise<void> {
  if (unanchorArmingId.value !== sessionId) {
    unanchorArmingId.value = sessionId;
    console.log('[ScsBridgeSessionManagement] un-anchor armed · sessionId=', sessionId);
    return;
  }
  if (isUnanchoring.value) return;
  isUnanchoring.value = true;
  console.log('[ScsBridgeSessionManagement] handleUnsetAnchor commit · sessionId=', sessionId);
  try {
    const res = await controller?.triggerUnsetAnchor(sessionId);
    if (res && !res.ok) {
      console.error('[ScsBridgeSessionManagement] un-anchor failed:', res.error);
    }
  } finally {
    isUnanchoring.value = false;
    unanchorArmingId.value = null;
  }
}

// Disarm on pointer-leave (the confirm window closes when the hover lifetime ends · §2.3).
function disarmUnsetAnchor(): void {
  if (unanchorArmingId.value !== null) {
    unanchorArmingId.value = null;
  }
}

// ============================================================================
// SAC.4 · Anchor System — per-page Auto-anchor control (Pewter SAC-PEWTER-ANCHOR-SYSTEM.md)
// ============================================================================
// The `⚓ Anchor [⚙] [Auto ○──]` row control + the cog-spawned Anchor System panel.
// Consumes the SAC.3 backend (controller.fetchAnchorConfig / triggerSetAnchorConfig /
// triggerResetAnchorConfig — all keyed by suite8Name). The config shape is
// { autoAnchor, default } (AnchorConfig); isOverridden is DERIVED (autoAnchor !== default)
// per the RD §0.1 storage-agnostic contract. No Muxium, no plan — every write is an
// external controller trigger from a normal event handler (DFSR discipline).

// Per-suite8Name resolved config map (full-replaced per fetch). null = bridge-down /
// not-yet-fetched → the control degrades to disabled (RD §6) and the pill reads OFF.
const anchorConfigByPage = ref<Record<string, AnchorConfig | null>>({});
// Per-suite8Name in-flight fetch guard (avoids duplicate fetches on the same render).
const anchorConfigFetching = ref<Record<string, boolean>>({});
// Per-suite8Name in-flight write/reset guard (disables the pill + Reset while resolving).
const anchorConfigWriting = ref<Record<string, boolean>>({});
// Which suite8Name's Anchor System panel is open (null = none). Single-select, mirrors
// the expandedSessionId / unanchorArmingId single-select discipline.
const anchorPanelOpenPage = ref<string | null>(null);

// Resolve the live config for a page (null when absent → degrade-graceful · §6).
function getAnchorConfig(suite8Name: string | undefined): AnchorConfig | null {
  if (!suite8Name) return null;
  return anchorConfigByPage.value[suite8Name] ?? null;
}

// The effective Auto value (knob position). False when no config (degraded OFF).
function getAutoAnchor(suite8Name: string | undefined): boolean {
  return getAnchorConfig(suite8Name)?.autoAnchor === true;
}

// The menu-creator default (the value the user overrides · read-only).
function getAnchorDefault(suite8Name: string | undefined): boolean {
  return getAnchorConfig(suite8Name)?.default === true;
}

// isOverridden = the live value diverges from the page default (RD §3 · §0.1).
function isAnchorOverridden(suite8Name: string | undefined): boolean {
  const cfg = getAnchorConfig(suite8Name);
  if (!cfg) return false;
  return cfg.autoAnchor !== cfg.default;
}

// True while this page's config is mid-write/reset (disables the pill + Reset).
function isAnchorConfigBusy(suite8Name: string | undefined): boolean {
  if (!suite8Name) return false;
  return anchorConfigWriting.value[suite8Name] === true;
}

// The pill's native title (RD §3.1 · §7) — spoken fallback for the compact dot.
function anchorPillTitle(suite8Name: string | undefined): string {
  if (!getAnchorConfig(suite8Name)) return 'Anchor settings are not available in this build.';
  const on = getAutoAnchor(suite8Name) ? 'ON' : 'OFF';
  const tail = isAnchorOverridden(suite8Name)
    ? 'overridden (you changed this)'
    : 'using page default';
  return `Auto-anchor: ${on} · ${tail}`;
}

// Fetch (or refresh) a page's anchor config via the SAC.3 read leg. Degrade-graceful:
// on null (bridge-down / endpoint absent) the entry holds null → the control disables.
async function loadAnchorConfig(suite8Name: string | undefined): Promise<void> {
  if (!suite8Name) return;
  if (anchorConfigFetching.value[suite8Name]) return;
  anchorConfigFetching.value = { ...anchorConfigFetching.value, [suite8Name]: true };
  try {
    const cfg = (await controller?.fetchAnchorConfig(suite8Name)) ?? null;
    anchorConfigByPage.value = { ...anchorConfigByPage.value, [suite8Name]: cfg };
    console.log(
      '[ScsBridgeSessionManagement SAC.4] loadAnchorConfig · page=', suite8Name,
      '· autoAnchor=', cfg?.autoAnchor, '· default=', cfg?.default,
    );
  } finally {
    anchorConfigFetching.value = { ...anchorConfigFetching.value, [suite8Name]: false };
  }
}

// Ensure a config is loaded once for a page (idempotent — the in-flight +
// already-loaded guards make repeat calls cheap). Driven by the watcher below.
function ensureAnchorConfig(suite8Name: string | undefined): void {
  if (!suite8Name) return;
  if (suite8Name in anchorConfigByPage.value) return; // already fetched (even if null)
  if (anchorConfigFetching.value[suite8Name]) return;
  void loadAnchorConfig(suite8Name);
}

// SAC.4 · fetch the anchor config for every anchored page when the list changes, so the
// row pill reflects the live { autoAnchor, default } on first paint (and on a new anchor
// arriving). ensureAnchorConfig is idempotent — re-runs are cheap (already-fetched skip).
watch(
  () => props.sessionsList,
  (list) => {
    for (const s of list) {
      if (s.isAnchor === true && s.suite8Name) {
        ensureAnchorConfig(s.suite8Name);
      }
    }
  },
  { immediate: true, deep: false },
);

// The Auto pill writes the override → SAC.3 triggerSetAnchorConfig (ACK-only), then
// re-fetch so the resolved { autoAnchor, default } (and isOverridden) re-reads.
async function handleToggleAutoAnchor(suite8Name: string | undefined): Promise<void> {
  if (!suite8Name) return;
  if (!getAnchorConfig(suite8Name)) return; // degraded — no write leg target
  if (isAnchorConfigBusy(suite8Name)) return;
  const next = !getAutoAnchor(suite8Name);
  anchorConfigWriting.value = { ...anchorConfigWriting.value, [suite8Name]: true };
  console.log('[ScsBridgeSessionManagement SAC.4] toggle Auto · page=', suite8Name, '· next=', next);
  try {
    const res = await controller?.triggerSetAnchorConfig(suite8Name, next);
    if (res && !res.ok) {
      console.error('[ScsBridgeSessionManagement SAC.4] set-anchor-config failed:', res.error);
    }
    await loadAnchorConfig(suite8Name);
  } finally {
    anchorConfigWriting.value = { ...anchorConfigWriting.value, [suite8Name]: false };
  }
}

// Reset-to-page-default deletes the override → SAC.3 triggerResetAnchorConfig (ACK-only),
// then re-fetch so the pill snaps back to the menu-creator default (isOverridden → false).
async function handleResetAnchorConfig(suite8Name: string | undefined): Promise<void> {
  if (!suite8Name) return;
  if (!getAnchorConfig(suite8Name)) return;
  if (isAnchorConfigBusy(suite8Name)) return;
  anchorConfigWriting.value = { ...anchorConfigWriting.value, [suite8Name]: true };
  console.log('[ScsBridgeSessionManagement SAC.4] reset Auto · page=', suite8Name);
  try {
    const res = await controller?.triggerResetAnchorConfig(suite8Name);
    if (res && !res.ok) {
      console.error('[ScsBridgeSessionManagement SAC.4] reset-anchor-config failed:', res.error);
    }
    await loadAnchorConfig(suite8Name);
  } finally {
    anchorConfigWriting.value = { ...anchorConfigWriting.value, [suite8Name]: false };
  }
}

// Cog → spawn/dismiss the Anchor System panel for this page (popover · click-outside /
// Esc / cog re-click dismiss). On open, refresh the config so the readout is current.
function toggleAnchorPanel(suite8Name: string | undefined): void {
  if (!suite8Name) return;
  anchorPanelOpenPage.value = anchorPanelOpenPage.value === suite8Name ? null : suite8Name;
  if (anchorPanelOpenPage.value === suite8Name) {
    console.log('[ScsBridgeSessionManagement SAC.4] panel open · page=', suite8Name);
    void loadAnchorConfig(suite8Name);
  }
}

function closeAnchorPanel(): void {
  if (anchorPanelOpenPage.value !== null) {
    anchorPanelOpenPage.value = null;
  }
}

// PDAB · Dissipate / Archive · Pewter session-teardown buttons (Dissolution + Archival
// Diamond). DAST: Dissipate removes the row AND deletes the real ClaudeCode session.
// ARST: Archive moves the real session into Cascades/Archive/YYYY/MM/DD/ then removes the
// row. Both are anchor-guarded server-side (AGTD — the bridge Quality no-ops on the
// page Anchor) and resilient (RSAR — absent real session → registry-only removal). Per-
// op in-flight refs prevent double-fire; the json-watcher relay drops the row on success.
const isDissipating = ref(false);
const isArchiving = ref(false);

// MD-ARC+C · Wave 7 · SessionManager Delete confirm discipline (Pewter RD §2.3).
// The Delete (renamed Dissipate) verb now opens a compact Y/N confirm below the row
// before firing handleDissipate. deleteConfirmFor = the session.id whose confirm is
// open; simple Y/N (no typed-name — a session is a process record, not a directory
// tree) · Cancel = default focus (the Pewter destructive default-N invariant).
const deleteConfirmFor = ref<string>('');
function openSessionDeleteConfirm(sessionId: string): void {
  deleteConfirmFor.value = sessionId;
}
function cancelDeleteConfirm(): void {
  deleteConfirmFor.value = '';
}
// Fire the delete from the confirm, then close the confirm (handleDissipate owns the guard).
function confirmSessionDelete(sessionId: string): void {
  cancelDeleteConfirm();
  void handleDissipate(sessionId);
}

async function handleDissipate(sessionId: string): Promise<void> {
  if (isDissipating.value) return;
  isDissipating.value = true;
  console.log('[ScsBridgeSessionManagement] handleDissipate · sessionId=', sessionId);
  try {
    const res = await controller?.triggerDissipate(sessionId);
    if (res && !res.ok) {
      console.error('[ScsBridgeSessionManagement] dissipate failed:', res.error);
    }
  } finally {
    isDissipating.value = false;
  }
}

async function handleArchive(sessionId: string): Promise<void> {
  if (isArchiving.value) return;
  isArchiving.value = true;
  console.log('[ScsBridgeSessionManagement] handleArchive · sessionId=', sessionId);
  try {
    const res = await controller?.triggerArchive(sessionId);
    if (res && !res.ok) {
      console.error('[ScsBridgeSessionManagement] archive failed:', res.error);
    }
  } finally {
    isArchiving.value = false;
  }
}

// D3RM-G · Esc-blur scoped to input · does NOT collapse SREX
// (the SREX-level Escape collapse is the existing window keydown listener).
function handleChatBlur(event: KeyboardEvent): void {
  (event.target as HTMLElement | null)?.blur();
}

// ═══════════════════════════════════════════════════════════════════════════
// SCP COMMAND (W1 footer roster source + W2 management section) · SCP-COMMAND-MENU
// ───────────────────────────────────────────────────────────────────────────
// LAW · REUSE ONLY, INVENT NO TRANSPORT. The Installation sub-page (MD-B ·
// ScsBridgeInstallationSubPage.vue) already proved the roster rail: the three
// SCP-server proxy routes (vue.principle.ts) talk to THE BRIDGE only —
//   GET  /bridge-roster  → { bridgeUp, installedScps[], boundScps{}, writtenAt }
//   POST /bridge-boot    → SPAWN an offline SCP  (scpName in body)
//   POST /bridge-focus   → FOCUS a live SCP      (scpName in body)
// This helm SURFACES those same rails; nothing new is minted. installedScps =
// the SCPs.json registry broadcast · boundScps = the live spawnsByScp projection.
// LAW · a row is LIVE when its name is a key of boundScps (present = live);
// offline → SPAWN (/bridge-boot) · live → FOCUS (/bridge-focus). BRIDGE_STATUS_COLORS
// tokens carry the badge (connected=live · idle=offline) per the Suite-color map.
// ═══════════════════════════════════════════════════════════════════════════
type ScpCommandBoundEntry = { port: number; status: string; browserUrl: string };
type ScpCommandRosterShape = {
  bridgeUp: boolean;
  installedScps: string[];
  boundScps: Record<string, ScpCommandBoundEntry>;
  // W6a · THE LIFECYCLE PROJECTION (SCM W6) · scpName → FSM-state-string (pending/idle/booting/live).
  // The booting-signal source the simulated loading bar + focus-on-open ride (W6b/W6c).
  scpLifecycle: Record<string, string>;
  // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION · scpName → visible Electron windowId. The
  // TRUE window-open signal — bound by cli-handler AFTER FSM 'live', so a name here means its OS window
  // actually exists (not merely that the server answered). The phase engine gates its ONE focus round
  // on THIS (not on 'live'), closing the moments gap the user observed. Empty on a pre-refinement bridge.
  scpWindows: Record<string, number>;
  // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms. One step past
  // scpWindows (BOUND): a name here means the OS window truly PAINTED (electronWindow's M1
  // show-on-rendered moment), not merely that cli-handler bound its windowId at construction. The
  // phase engine gates its ONE focus round on THIS — so /bridge-focus never lands on a bound-but-blank
  // window (the exact blank the user saw focused). Empty on a pre-rendered-refinement bridge.
  scpWindowsRendered: Record<string, number>;
  // C653 · THE STATUS PROJECTION (MEND C) · scpName → PSSM status string ('live' | 'pending' |
  // 'installing'). A fresh MULTIPLY worktree instance is registered 'installing' (its tree carries
  // package.json but NO node_modules) and flips to 'pending' when its async npm install exits. The
  // MULTIPLY staged bar holds the INSTALL tick + the instance-row Spawn stays disabled while a name
  // reads 'installing' here. Empty on a pre-C653 bridge (⇒ every instance treated install-complete).
  scpStatuses: Record<string, string>;
  writtenAt: number;
};

const scpCommandRoster = ref<ScpCommandRosterShape>({
  bridgeUp: false,
  installedScps: [],
  boundScps: {},
  scpLifecycle: {},
  scpWindows: {},
  scpWindowsRendered: {},
  scpStatuses: {},
  writtenAt: 0,
});
// Per-row in-flight guard (Spawn/Focus) · mirrors InstallationSubPage rowBusy.
const scpCommandRowBusy = ref<Record<string, boolean>>({});
let scpCommandPollTimer: ReturnType<typeof setTimeout> | null = null;

async function refreshScpCommandRoster(): Promise<void> {
  try {
    const res = await fetch('/bridge-roster');
    scpCommandRoster.value = (await res.json()) as ScpCommandRosterShape;
  } catch {
    scpCommandRoster.value = { bridgeUp: false, installedScps: [], boundScps: {}, scpLifecycle: {}, scpWindows: {}, scpWindowsRendered: {}, scpStatuses: {}, writtenAt: 0 };
  }
  // W6b + W6c · every roster read drives the open spawn rounds forward on the fresh signal (phase
  // advance + focus-on-open). Guarded internally to a no-op when no round is open.
  advanceSpawnRounds(scpCommandRoster.value);
  // C652 · every roster read likewise drives the open MULTIPLY rounds forward (create→register→ready
  // on the ${base}--wt-* citizen surfacing). Guarded internally to a no-op when no round is open.
  advanceMultiplyRounds(scpCommandRoster.value);
}

// The helm rows · union of registry inventory + live-bound names, live-badged.
// THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) — the instance-name scheme (D-SCM-W3 §3e):
// `${scpName}--wt-${branchSlug}`. A row is a WORKTREE INSTANCE when its name carries the `--wt-`
// marker → it gets the DELETE (W4) affordance instead of MULTIPLY.
const WT_INSTANCE_MARKER = '--wt-';
const isWorktreeInstanceName = (name: string): boolean => name.includes(WT_INSTANCE_MARKER);

// C629 · THE LIVE-PRESENTATION LAW (the last un-hooked portion · S4∥S7 convergent): the
// LIVE badge + Focus v-if + Spawn v-if all derive from row.live — bare boundScps membership
// flipped them at spawn INITIATION (setStatus 'live' fires 10.6s before scp.window.shown,
// R7 field-proven). During an OPEN spawn round the live presentation holds until the round's
// terminal phase 'done' (post-RENDERED, keeping the badge/Focus synchronized with the bar
// through the DONE_LINGER settle). Steady-state rows (no round in flight — already live at
// page load) keep raw membership.
const rowPresentsLive = (name: string, bound: Record<string, unknown>): boolean => {
  const round = controller?.spawnProgressByScp.value[name];
  if (round) return round.phase === 'done';
  return name in bound;
};

const scpCommandRows = computed(() => {
  const bound = scpCommandRoster.value.boundScps ?? {};
  // C653 · THE STATUS PROJECTION (MEND C) · the per-SCP PSSM status map — a row is 'installing'
  // while its fresh MULTIPLY worktree instance's async npm install runs (registered 'installing' by
  // gitmWorktreeAdd.quality.ts; flips to 'pending' on install exit). The instance-row Spawn button
  // is disabled while installing (its node_modules are absent → a spawn would `sh: vite: command
  // not found`). Only worktree instances (--wt-) ever carry 'installing'; a base SCP never does.
  const statuses = scpCommandRoster.value.scpStatuses ?? {};
  const names = new Set<string>([
    ...(scpCommandRoster.value.installedScps ?? []),
    ...Object.keys(bound),
  ]);
  return [...names].sort().map((name) => ({
    name,
    live: rowPresentsLive(name, bound),
    port: bound[name]?.port ?? null,
    // W3/W4 · a worktree instance row (name carries `--wt-`) → DELETE affordance; else → MULTIPLY.
    isInstance: isWorktreeInstanceName(name),
    // C653 · the instance is still installing dependencies → Spawn disabled (title below).
    installing: statuses[name] === 'installing',
  }));
});

// C655 · THE HELM GROUPING (MEND B) — the SCP COMMAND rows split into an ONLINE
// section (row.live · the running SCPs) leading and an OFFLINE section (the rest)
// following, MIRRORING the sessions list's ONLINE/OFFLINE section-label idiom in
// this same component (isFirstOfflineRow + session-section-label family). The
// grouping is presentational only — scpCommandRows keeps its sort + C621-C653
// row behavior (badges · Spawn/Focus · MULTIPLY · Delete · the bars).
const scpCommandOnlineRows = computed(() => scpCommandRows.value.filter((r) => r.live));
const scpCommandOfflineRows = computed(() => scpCommandRows.value.filter((r) => !r.live));
// THE SAFE INTERLEAVE — online first then offline; a single v-for walks this so the
// OFFLINE label injects at the boundary row (never a standalone/undefined item).
const scpCommandSectionedRows = computed(() => [
  ...scpCommandOnlineRows.value,
  ...scpCommandOfflineRows.value,
]);
// True at the first OFFLINE row — the template injects the OFFLINE label before it
// (mirrors isFirstOfflineRow · C535 visibility law: OFFLINE chrome renders ONLY
// when it holds rows; the ONLINE label always leads whenever anything is shown).
function isFirstScpCommandOfflineRow(index: number): boolean {
  return scpCommandOfflineRows.value.length > 0 && index === scpCommandOnlineRows.value.length;
}

// W2 action · offline → /bridge-boot (SPAWN) · live → /bridge-focus (FOCUS).
// The SAME handler InstallationSubPage proved; the route decides the verb.
async function handleScpCommandAction(
  name: string,
  route: '/bridge-boot' | '/bridge-focus',
): Promise<void> {
  if (scpCommandRowBusy.value[name]) return;
  scpCommandRowBusy.value = { ...scpCommandRowBusy.value, [name]: true };
  // W6b · THE SIMULATED BAR (SCM W6) · a SPAWN press OPENS a spawn-progress round on the controller
  // (phase 'requested'). App-singleton state → the round + its bar survive a page hop mid-boot. A
  // FOCUS press is not a spawn round (no bar).
  if (route === '/bridge-boot') controller?.startSpawnProgress(name);
  try {
    await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scpName: name }),
    });
    void refreshScpCommandRoster();
  } catch {
    // Transport failure is surfaced only by the row settling back to its badge;
    // the roster poll re-establishes truth on the next tick (ACK-only rail).
  } finally {
    const next = { ...scpCommandRowBusy.value };
    delete next[name];
    scpCommandRowBusy.value = next;
  }
}

// SES · THE STOP RAIL (C632 · the EXIT ability) · live → /bridge-stop (STOP).
// The honest full-stop: the bridge closes the SCP window, SIGTERMs its dedicated
// server, drives the lifecycle FSM dying→gone, and writes status 'pending'. Busy-
// guarded like handleScpCommandAction. RECOVERABLE — Spawn re-boots; NO confirm
// modal (the typed-name round stays reserved for the destructive worktree DELETE).
// Composes with the spawn-round state: clearSpawnProgress(name) tears down any
// in-flight bar for this row (a stop mid-boot must not leave a phantom sweep). The
// roster poll flips the row offline naturally once the FSM settles.
async function handleScpCommandExit(name: string): Promise<void> {
  if (scpCommandRowBusy.value[name]) return;
  scpCommandRowBusy.value = { ...scpCommandRowBusy.value, [name]: true };
  // Compose with the spawn-round state — tear down any live spawn bar for this row.
  controller?.clearSpawnProgress(name);
  try {
    await fetch('/bridge-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scpName: name }),
    });
    void refreshScpCommandRoster();
  } catch {
    // Transport failure surfaces only by the row not settling offline; the roster
    // poll re-establishes truth on the next tick (ACK-only rail · same as W2).
  } finally {
    const next = { ...scpCommandRowBusy.value };
    delete next[name];
    scpCommandRowBusy.value = next;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// W6b + W6c · THE SIMULATED LOADING BAR + FOCUS-ON-OPEN (SCM W6 · lifecycle-signal driven)
// ───────────────────────────────────────────────────────────────────────────
// THE SIGNAL (never a timer): the roster's scpLifecycle projection carries each SCP's FSM state
// ('pending' | 'idle' | 'booting' | 'live'). The booting-class = every pre-live state.
//
// SWFB · W6 REFINEMENT · THE WINDOW-BOUND GATE. Previously a row landed 'focusing' the moment FSM
// 'live' fired — but the OS WINDOW spawns MOMENTS LATER (the server answers first, the window loads
// second, THEN cli-handler binds windowId). Focusing on 'live' fired /bridge-focus into a window that
// did not yet exist. The refined signal: hold the bar sweeping through 'booting' until FSM-live AND
// window presence (scpWindows[name]) — the TRUE window-open moment. Only THEN advance to 'focusing'
// (the ONE /bridge-focus lands on a window that actually exists) → 'done'. 'booting' is REUSED for the
// post-live pre-window gap (no new phase · smallest surface); the bar keeps its indeterminate sweep.
// Focus-on-open fires ONCE per spawn round (the didFocus guard · never a timer). The bar reads ONLY the
// controller ref → a page hop + return re-renders it mid-boot (W6d law).
const BOOTING_CLASS = new Set<string>(['pending', 'idle', 'booting']);

// The controller-held spawn-progress map (app-singleton · survives navigation). The template's bar
// reads THIS (via spawnPhaseFor) so it is agnostic to whether this component just mounted.
const spawnProgress = computed<Record<string, import('../../scsBridgeController').ScsBridgeSpawnProgressEntry>>(
  () => controller?.spawnProgressByScp.value ?? {},
);
const spawnPhaseFor = (name: string): string | null => spawnProgress.value[name]?.phase ?? null;
// The bar renders while the round is pre-live (requested anor booting) — it resolves/fills on live.
const spawnBarActiveFor = (name: string): boolean => {
  const phase = spawnPhaseFor(name);
  return phase === 'requested' || phase === 'booting';
};

// WHILE any spawn round is in flight (requested/booting/focusing) the poll tightens to 1s so the
// booting→live signal is caught promptly; with none in flight it relaxes to 5s (the original idiom).
const anySpawnInFlight = computed<boolean>(() =>
  Object.values(spawnProgress.value).some(
    (e) => e.phase === 'requested' || e.phase === 'booting' || e.phase === 'focusing',
  ),
);

// THE PHASE-ADVANCE ENGINE · reads the roster's scpLifecycle + boundScps and drives each open
// spawn round forward on the SIGNAL. Fires focus-on-open exactly ONCE (didFocus guard), then lingers
// on 'done' briefly so the bar visually resolves before clearing. NEVER a timer for the WHEN — the
// linger is only the visual settle after the live signal already arrived.
const DONE_LINGER_MS = 900;
function advanceSpawnRounds(roster: ScpCommandRosterShape): void {
  const progress = spawnProgress.value;
  const openNames = Object.keys(progress);
  if (openNames.length === 0) return;
  const bound = roster.boundScps ?? {};
  const lifecycle = roster.scpLifecycle ?? {};
  // M2 · WINDOW-RENDERED (D-WR C628) · the window-RENDERED map · a name here = its OS window truly
  // PAINTED (electronWindow's M1 show-on-rendered did-finish-load moment). This SUPERSEDES scpWindows
  // (BOUND) as the focus gate — a windowId lands at construction, MOMENTS before paint, so gating on
  // it (the prior windowBound) still fired /bridge-focus into a bound-but-blank window (the exact
  // blank the user saw focused). Gating on RENDERED closes that residual gap.
  const rendered = roster.scpWindowsRendered ?? {};
  for (const name of openNames) {
    const entry = progress[name];
    if (!entry || entry.phase === 'done' || entry.phase === 'failed') continue;
    const fsm = lifecycle[name];
    const boundEntry = bound[name];
    const isLiveBound = name in bound && typeof boundEntry?.browserUrl === 'string' && boundEntry.browserUrl.length > 0;
    // M2 · THE WINDOW-RENDERED SIGNAL — a numeric windowRenderedAt under this name means the OS
    // window's FIRST successful did-finish-load fired (electronWindow showed it · truly painted). This,
    // NOT windowId presence (BOUND) and NOT FSM 'live', gates focus.
    // C630 · THE ROUND-FRESHNESS LAW (the re-spawn regression): windowRenderedAt PERSISTS in
    // SCPs.json from the PREVIOUS round — bare presence short-circuited a re-spawn to 'done' in one
    // poll beat (no bar · instant Live/Focus via the C629 phase predicate). A spawn-round gate
    // compares the signal's TIMESTAMP against the round's startedAt — only a render that happened
    // AFTER this round's Spawn press counts. First-spawn behavior unchanged (no prior key).
    const renderedAt = rendered[name];
    const windowRendered = typeof renderedAt === 'number' && renderedAt > entry.startedAt;
    const isLive = isLiveBound || fsm === 'live';
    if (windowRendered) {
      // WINDOW TRULY RENDERED → focus-on-open. Fire /bridge-focus ONCE for this round (didFocus guard).
      // The window is painted, so the focus lands on real content (the blank-focus fix — no more focusing
      // into a bound-but-blank window).
      if (!entry.didFocus) {
        controller?.advanceSpawnProgress(name, 'focusing', true);
        void fetch('/bridge-focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scpName: name }),
        }).catch(() => {
          // Focus is best-effort (ACK-only rail) — the window is open regardless; the bar still resolves.
        });
      }
      // Resolve the bar: move to 'done' + clear after a short linger (visual settle only).
      controller?.advanceSpawnProgress(name, 'done');
      const settleName = name;
      window.setTimeout(() => controller?.clearSpawnProgress(settleName), DONE_LINGER_MS);
    } else if (isLive || (fsm !== undefined && BOOTING_CLASS.has(fsm))) {
      // M2 · FSM live-or-booting (may even be window-BOUND) BUT NOT yet RENDERED → hold 'booting' so the
      // bar keeps sweeping through the post-live/post-bound pre-RENDERED gap. The user sees continuous
      // loading until the OS window actually PAINTS (windowRendered above), NOT a premature 'Launched'
      // resolve into a blank window.
      controller?.advanceSpawnProgress(name, 'booting');
    }
    // else: no FSM entry yet (pre-registration) → stay 'requested' (the bar keeps its indeterminate run).
  }
}

// ───────────────────────────────────────────────────────────────────────────
// THE SCP COMMAND MENU (W3 · MULTIPLY · the worktree rail) + (W4 · TYPED-NAME DELETE)
// ───────────────────────────────────────────────────────────────────────────
// TRANSPORT (REUSED · NOT invented) — the SAME rail GitmSwordBButton.vue proves:
// controller.triggerGitmAction('gitm_*', args) dispatches a gitm_* MCP tool (the void
// same-origin setter · scsBridgeController.ts:1828). The remove ROUND needs the minted
// confirmToken back — it rides the reactive gitmController.gitmJson.pendingConfirm (the
// gitm.json relay · the exact channel GitmTurnOverAConfirmModal's two-call handshake uses).
// If the scsBridge controller is unreachable (null inject) the affordances degrade HONESTLY
// (disabled + a title naming the missing rail · never a silent dispatch into the void).
const worktreeRailReachable = computed<boolean>(() => controller != null && typeof controller.triggerGitmAction === 'function');

// W3 · MULTIPLY — a compact per-row branch prompt (default = the SCP's own working branch anor a
// fresh slug). Kept minimal: one open row at a time, the input seeds a branch, FIRE dispatches
// gitm_worktree_add for that SCP. The bridge derives the instance name (${scpName}--wt-${slug}).
const multiplyOpenFor = ref<string>(''); // the scpName whose MULTIPLY prompt is open ('' = none)
const multiplyBranch = ref<string>('');

function openMultiply(name: string): void {
  multiplyOpenFor.value = name;
  // Default seed = a timestamped working slug (the SCP's live branch is not carried in this roster;
  // the bridge's own existence-guard rejects a non-existent branch honestly, so the user edits it).
  multiplyBranch.value = `b/${name}-${Date.now()}`;
}
function cancelMultiply(): void {
  multiplyOpenFor.value = '';
  multiplyBranch.value = '';
}
function fireMultiply(name: string): void {
  const branch = multiplyBranch.value.trim();
  if (branch.length === 0 || !worktreeRailReachable.value) return;
  // C652 · THE STAGED MULTIPLY ROUND — open a create-round on THIS base SCP (stage 'create') BEFORE
  // the dispatch. The bar rides OBSERVABLE signals only (never a timer for the WHEN): the roster poll
  // advances 'register' when the ${name}--wt-* citizen lands, then 'ready' + a short linger on the row
  // rendered. A relayed errorCode (the gitmController watch below) resolves it to an honest failure line.
  startMultiplyRound(name);
  // originScpName = the row's SCP so the bridge resolves ITS OWN repo (the FKIS origin thread).
  controller?.triggerGitmAction('gitm_worktree_add', { originScpName: name, branch });
  cancelMultiply();
  // Tighten the poll immediately (anyMultiplyInFlight flips the cadence to 1s · W6 idiom) so the new
  // ${name}--wt-* citizen is caught promptly. The new instance appears as a fresh SCPs.json citizen.
  window.setTimeout(() => void refreshScpCommandRoster(), 700);
}

// ───────────────────────────────────────────────────────────────────────────
// C652 · THE STAGED MULTIPLY BAR (MEND B · the SCP's birth-from-the-worktree readout)
// ───────────────────────────────────────────────────────────────────────────
// THE SMALLER HONEST SHAPE (the W6d cross-page law WEIGHED, then declined): a multiply round is
// SHORT-LIVED — create→register lands in a poll tick or two and RESOLVES before the user Spawns (the
// W6 boot bar takes over from there). It does NOT need the app-singleton controller survival the
// spawn-progress rounds require (10s+ boot spanning a page hop). So this is LOCAL component state (a
// plain ref), driven by the ALREADY-component-local roster poll — the smaller honest shape.
//
// THE STAGES (three labeled ticks · the panel renders a segmented mini-bar):
//   1 CREATE   — from FIRE until the ${base}--wt-* citizen appears (the void create rail · no positive
//                ack channel exists — lastActionResult is a bridge WITNESS, not a relayed field — so
//                stage 1 holds on the sweep until stage 2's OBSERVABLE roster signal, OR resolves to a
//                failure line on a relayed errorCode).
//   2 REGISTER — the instance name is in the roster (installed anor bound). The row is materializing.
//   3 INSTALL  — C653 · THE SKIPPED STEP. A `git worktree add` tree carries only TRACKED files
//                (package.json but NO node_modules) — the instance cannot boot (`sh: vite: command
//                not found`) until its async `npm install` (spawned by gitmWorktreeAdd.quality.ts)
//                lands. This tick holds WHILE scpStatuses[instanceName]==='installing'; it clears the
//                instant the status flips off 'installing' (the bridge stamps 'pending' on install exit).
//   4 READY    — the instance ROW is rendered with Spawn enabled → resolve + a short linger, then clear.
type MultiplyStage = 'create' | 'register' | 'install' | 'ready' | 'failed';
type MultiplyRoundEntry = {
  stage: MultiplyStage;
  startedAt: number;
  // The ${base}--wt- prefix this round watches for in the roster (the register signal · the instance
  // name is bridge-derived, so we match the PREFIX, resolving the concrete name on first sight).
  instancePrefix: string;
  // Resolved once stage 2 lands — the concrete ${base}--wt-${slug} name (for the ready-row check).
  instanceName: string;
  // An honest failure line (a relayed errorCode/errorMessage) — non-empty → the bar reads 'failed'.
  failure: string;
};
// Keyed by the BASE scpName that was multiplied (one open round per base row at a time · matches the
// one-open-panel discipline). Local ref (NOT controller state · the smaller honest shape above).
const multiplyRoundByScp = ref<Record<string, MultiplyRoundEntry>>({});

function startMultiplyRound(baseName: string): void {
  multiplyRoundByScp.value = {
    ...multiplyRoundByScp.value,
    [baseName]: {
      stage: 'create',
      startedAt: Date.now(),
      instancePrefix: `${baseName}${WT_INSTANCE_MARKER}`,
      instanceName: '',
      failure: '',
    },
  };
}
function clearMultiplyRound(baseName: string): void {
  if (!multiplyRoundByScp.value[baseName]) return;
  const next = { ...multiplyRoundByScp.value };
  delete next[baseName];
  multiplyRoundByScp.value = next;
}

// The template reads these (per-base-row): is a round open, its stage, and the ordered tick states.
const multiplyRoundFor = (baseName: string): MultiplyRoundEntry | null =>
  multiplyRoundByScp.value[baseName] ?? null;
const multiplyStageOrder: MultiplyStage[] = ['create', 'register', 'install', 'ready'];
// A tick is 'done' when the round is PAST it, 'active' on the current sweep, else 'pending'. On a
// 'failed' round every not-yet-done tick reads 'failed' (the honest inline stop · never a stuck bar).
const multiplyTickState = (baseName: string, tick: MultiplyStage): 'done' | 'active' | 'pending' | 'failed' => {
  const round = multiplyRoundByScp.value[baseName];
  if (!round) return 'pending';
  if (round.stage === 'failed') {
    // The honest-failure watch fires ONLY on a create/register-stage round (the worktree-add exec/guard
    // failed BEFORE the instance registered → instanceName === ''), so in practice every tick reads
    // 'failed'. Guard defensively: a pre-'ready' tick whose stage was genuinely reached (instanceName
    // latched) reads 'done'; the rest read 'failed' (the honest inline stop · never a stuck bar).
    return multiplyStageOrder.indexOf(tick) < multiplyStageOrder.indexOf('ready') && round.instanceName !== ''
      ? 'done'
      : 'failed';
  }
  const cur = multiplyStageOrder.indexOf(round.stage);
  const idx = multiplyStageOrder.indexOf(tick);
  if (idx < cur) return 'done';
  if (idx === cur) return 'active';
  return 'pending';
};

// WHILE any multiply round is pre-ready the poll tightens to 1s (catch the register signal promptly ·
// the W6 anySpawnInFlight idiom). A 'ready'/'failed' round is resolving (its linger clears it) — it
// does not hold the fast cadence.
const anyMultiplyInFlight = computed<boolean>(() =>
  Object.values(multiplyRoundByScp.value).some(
    (r) => r.stage === 'create' || r.stage === 'register' || r.stage === 'install',
  ),
);

// THE ROUND-ADVANCE ENGINE (mirror advanceSpawnRounds) — reads the roster's installed+bound names and
// drives each open multiply round forward on the OBSERVABLE signal. NEVER a timer for the WHEN; the
// MULTIPLY_READY_LINGER is only the visual settle after the row already rendered.
const MULTIPLY_READY_LINGER_MS = 1100;
function advanceMultiplyRounds(roster: ScpCommandRosterShape): void {
  const open = multiplyRoundByScp.value;
  const baseNames = Object.keys(open);
  if (baseNames.length === 0) return;
  const bound = roster.boundScps ?? {};
  const names = new Set<string>([...(roster.installedScps ?? []), ...Object.keys(bound)]);
  // C653 · THE STATUS PROJECTION (MEND C) · the per-SCP PSSM status map — the install-transient rail.
  const statuses = roster.scpStatuses ?? {};
  for (const baseName of baseNames) {
    const round = open[baseName];
    if (!round || round.stage === 'ready' || round.stage === 'failed') continue;
    // STAGE 2 REGISTER — the ${base}--wt-* citizen appeared in the roster (installed anor bound). Match
    // the prefix, latch the concrete instance name (the register signal · resolves stage 'create'→'register').
    const found = round.instanceName !== ''
      ? round.instanceName
      : [...names].find((n) => n.startsWith(round.instancePrefix)) ?? '';
    if (found === '') continue; // stage 1 holds until the citizen lands (no positive create ack rail).
    if (round.stage === 'create') {
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'register', instanceName: found },
      };
      continue; // one advance per poll beat (the install-status check runs on the NEXT tick).
    }
    // STAGE 3 INSTALL (C653 · THE SKIPPED STEP) — the citizen is registered; now its node_modules
    // must land. gitmWorktreeAdd.quality.ts registered it 'installing' and spawned `npm install`.
    // Advance register→install unconditionally on the tick AFTER register (the instance IS registered),
    // so the INSTALL tick shows while scpStatuses[found]==='installing'. One advance per beat.
    if (round.stage === 'register') {
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'install', instanceName: found },
      };
      continue;
    }
    // STAGE 4 READY — install complete (scpStatuses[found] is NO LONGER 'installing' — the bridge
    // stamped 'pending' when the async npm install exited) AND the instance ROW is materialized
    // (present in the sorted names → scpCommandRows renders it, Spawn now enabled). Resolve + a short
    // linger, then clear (the user Spawns from here). The install tick holds until the status flips.
    const installing = statuses[found] === 'installing';
    if (round.stage === 'install' && !installing && names.has(found)) {
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'ready', instanceName: found },
      };
      const settleName = baseName;
      window.setTimeout(() => clearMultiplyRound(settleName), MULTIPLY_READY_LINGER_MS);
    }
  }
}

// THE HONEST-FAILURE WATCH (mirror the W4 pendingConfirm watch idiom) — a relayed errorCode from the
// create leg (gitm_worktree_add's guard/exec failure lands errorCode/errorMessage · the ONLY relayed
// reveal channel · lastActionResult is a WITNESS, not relayed) resolves the newest open round to a
// 'failed' inline line rather than a stuck bar. Scoped to the worktree-add error codes so an unrelated
// gitm error never trips a multiply round.
const WORKTREE_ADD_ERROR_CODES = new Set(['GITM_WORKTREE_ADD_FAILED', 'GITM_WORKTREE_ADD_GUARD']);
if (gitmController) {
  watch(
    () => {
      const j = gitmController.gitmJson.value;
      return j ? { code: j.errorCode, msg: j.errorMessage } : null;
    },
    (err) => {
      if (err == null || !WORKTREE_ADD_ERROR_CODES.has(err.code)) return;
      // Resolve the NEWEST open create/register round (the one that just fired) to failed.
      const open = multiplyRoundByScp.value;
      const candidates = Object.entries(open).filter(([, r]) => r.stage === 'create' || r.stage === 'register');
      if (candidates.length === 0) return;
      candidates.sort((a, b) => b[1].startedAt - a[1].startedAt);
      const [baseName, round] = candidates[0];
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'failed', failure: err.msg || err.code },
      };
    },
  );
}

// W4 · TYPED-NAME DELETE — the ARMED→FIRE pattern strengthened to typed-match. The user must type
// the EXACT instanceName; mismatch = disarmed. FIRE runs the two-call remove: call-1 (no token) mints
// pendingConfirm → the reactive gitmJson relay surfaces pendingConfirm.token → call-2 with the token.
const deleteOpenFor = ref<string>(''); // the instanceName whose DELETE panel is open ('' = none)
const deleteTyped = ref<string>(''); // the user's typed confirmation
const deletePhase = ref<'idle' | 'awaiting-token'>('idle'); // call-1 dispatched → awaiting the minted token

// The ARM gate — FIRE is armed ONLY when the typed name EXACTLY matches the open instanceName.
const deleteArmed = computed<boolean>(
  // C656 · THE TYPED-DELETE ARM (user law: instance names are unreasonable to type — the
  // consent word is `Delete`, CASE-INSENSITIVE). The bridge PARAMSEAL still binds the token
  // to the instanceName server-side; only the USER'S consent gesture changes.
  () => deleteOpenFor.value !== '' && deleteTyped.value.trim().toLowerCase() === 'delete' && worktreeRailReachable.value,
);

function openDelete(name: string): void {
  deleteOpenFor.value = name;
  deleteTyped.value = '';
  deletePhase.value = 'idle';
}
function cancelDelete(): void {
  deleteOpenFor.value = '';
  deleteTyped.value = '';
  deletePhase.value = 'idle';
}
function fireDelete(): void {
  if (!deleteArmed.value) return; // disarmed on any mismatch — never fires the wrong instance.
  const name = deleteOpenFor.value;
  // MD-ARC+C W7b · THE STUCK-REMOVE CURE (the AmberlightStudio--wt field break): the prior
  // WATCHKEY two-call awaited pendingConfirm on THIS surface's relayed gitmJson — but a
  // NON-pointer origin's token lands on the ORIGIN's OWN rail (MD-C M7), which an OFFLINE
  // instance never relays here → 'Removing…' forever. The delete now rides the Wave-7
  // scp_delete: ONE ack call — WAPF H2 runs `git worktree remove --force` from the PARENT
  // (git functionality maintained) + registry removal + slice/watcher teardown. The
  // typed-name arm above IS the destructive confirmation; no token round, no stuck channel.
  controller?.triggerGitmAction('scp_delete', { scpName: name });
  cancelDelete();
  window.setTimeout(() => void refreshScpCommandRoster(), 1200);
}

// W6b · THE DYNAMIC POLL (SCM W6) · the poll idiom kept, the interval made dynamic. 1s WHILE any
// spawn round is in flight (catch the booting→live signal promptly) · 5s when idle (the original
// InstallationSubPage cadence · no needless traffic). A self-scheduling setTimeout re-reads
// anySpawnInFlight each tick so the cadence flips the instant a Spawn opens a round (anor the last
// round resolves). scpCommandPollTimer holds the pending timeout so unmount clears it cleanly.
const SCP_POLL_INTERVAL_ACTIVE_MS = 1000;
const SCP_POLL_INTERVAL_IDLE_MS = 5000;
function scheduleScpCommandPoll(): void {
  // C652 · a multiply round in flight ALSO tightens the cadence to 1s (catch the register signal
  // promptly · the W6 idiom extended to the create rail).
  const delay = anySpawnInFlight.value || anyMultiplyInFlight.value ? SCP_POLL_INTERVAL_ACTIVE_MS : SCP_POLL_INTERVAL_IDLE_MS;
  scpCommandPollTimer = setTimeout(() => {
    void refreshScpCommandRoster().finally(() => scheduleScpCommandPoll());
  }, delay);
}

onMounted(() => {
  void refreshScpCommandRoster();
  // The bridge registers/spawns async — a light poll keeps the helm honest (dynamic-cadence variant
  // of the InstallationSubPage roster poll · W6b).
  scheduleScpCommandPoll();
});
onBeforeUnmount(() => {
  if (scpCommandPollTimer !== null) clearTimeout(scpCommandPollTimer);
});
</script>

<template>
  <div class="session-mgmt-root hifi-pane-base" :class="{ 'session-mgmt-specific': isSpecificMode, 'session-mgmt-split': wide === true }">
    <!-- SMSR · MENU COLUMN · display:contents identity wrapper. In stack mode (wide absent/false)
         this <div> vanishes structurally and the page renders byte-identical to today. In split
         mode it becomes the 1/3 sticky left column (title · model selector · Spawn · Suite-8 picker
         · status-summary-bar) — everything ABOVE the filter pills. -->
    <div class="smgmt-col smgmt-col-menu">
    <header class="session-mgmt-header">
      <h1 class="hifi-heading session-mgmt-title">Session Management</h1>
      <p class="session-mgmt-subtitle">Live session registry · filter by SCP · sortable columns</p>
      <!-- C832 · SEAT 2 (Pewter) · the footnote becomes ITS OWN HIFI BUTTON — cobalt/blue,
           the sub-page's suite color; its own row directly under the subtitle so the menu
           column's standing order (title · model · Spawn · picker · status) is undisturbed.
           The C825 dual-path travel carries unchanged beneath. -->
      <div class="smgmt-scpm-row">
        <button type="button" class="hifi-btn hifi-btn-blue smgmt-scpm-btn" @click="goScpManagement()">SCP MANAGEMENT →</button>
      </div>
      <!-- MD-9 · D-MC-3 · Per-Instance Model Control · the model dropdown. Defaults to Opus 4.8;
           the chosen model is pinned to the NEXT spawn (general anor Suite 8) and NOTED on both
           spawn buttons + the resulting session row. Pewter-neutral chrome (D9 pewter tooling). -->
      <!-- MD-9 · THE DROPDOWN COMPONENT · the in-DOM model picker is now the extracted ScsDropdown
           (offscreen-safe · sibling to ScsInput). A native <select> popup can NEVER open on the
           offscreen SCP surface (OS-drawn chrome, no window to anchor to). ScsDropdown owns its
           trigger + drawer + Escape/outside-close in-DOM; a row click emits the new value. The
           MD-9 diagnostic probe rides the wrapper @mousedown. -->
      <div class="spawn-model-row" @mousedown="logModelTriggerProbe('mousedown', $event)">
        <label class="spawn-model-label">Model</label>
        <ScsDropdown
          :options="modelDropdownOptions"
          :model-value="selectedModel"
          class="spawn-model-dropdown"
          @update:model-value="(v) => { selectedModel = v; handleModelChange(); }"
        />
      </div>

      <!-- D3D Wave-2 · Spawn Button · R3-D §S2 Pewter D7 cobalt primary variant -->
      <div class="spawn-session-row">
        <button
          class="spawn-session-btn"
          :class="{ spawning: isSpawning }"
          :disabled="!canSpawn || isSpawning"
          @click="handleSpawn"
        >
          {{ spawnButtonLabel }}
        </button>
      </div>

      <!-- SSP · THE SUITE 8 DROPDOWN (Pewter · the ScsDropdown idiom the Model row proved —
           in-DOM, offscreen-safe; the D-SSP.3 drawer roster is RETIRED in its favor).
           Two deliberate steps: select a Suite 8 from the dropdown → the Spawn Suite 8
           button ENABLES. Sits BELOW the general spawn ("+ Spawn General Session"). -->
      <div v-if="!isSpecificMode" class="s8-spawn-block">
        <div class="spawn-model-row" @mousedown="refreshS8Roster">
          <label class="spawn-model-label">Suite 8</label>
          <ScsDropdown
            :options="suite8DropdownOptions"
            :model-value="selectedSpawnSuite8Name ?? ''"
            :placeholder="s8PickerLoading ? 'Loading Suite 8s…' : 'Select a Suite 8…'"
            class="spawn-model-dropdown"
            @update:model-value="onSuite8DropdownChange"
          />
        </div>

        <div class="spawn-session-row s8-spawn-row">
          <button
            class="spawn-session-btn"
            :class="{ spawning: isSpawningSuite8 }"
            :disabled="!selectedSpawnSuite8Name || isSpawningSuite8"
            @click="handleSpawnSuite8"
          >
            {{ s8SpawnButtonLabel }}
          </button>
        </div>

        <p class="session-mgmt-subtitle s8-helper">
          <template v-if="isSpawningSuite8 && selectedSpawnSuite8Name">
            Starting {{ selectedSpawnSuite8Name }} — it will appear in the list below.
          </template>
          <template v-else-if="selectedSpawnSuite8Name">
            Spawns {{ selectedSpawnSuite8Name }} as a plain instance — the page's
            Shatterite Menu anchors first.
          </template>
          <template v-else>
            Select a Suite 8 to enable its spawn. General sessions spawn above.
          </template>
        </p>
      </div>
    </header>

    <!-- ═══ SCP COMMAND · W2 · the helm section (SPAWN offline · FOCUS live) ═══
         LAW · this section SHARES the menu column with the spawn-session controls
         above and the compact footer below. Every row rides the EXISTING bridge
         proxy rails (/bridge-boot = SPAWN · /bridge-focus = FOCUS), the same rails
         the Installation sub-page (MD-B) proved — NO transport is invented here.
         A row is LIVE iff its name keys boundScps (present = live). -->
    <section class="scp-command-section hifi-pane-base">
      <div class="scp-command-head">
        <span class="scp-command-title">SCP COMMAND</span>
        <span class="scp-command-count">{{ scpCommandRows.length }}</span>
      </div>
      <p v-if="scpCommandRows.length === 0" class="scp-command-empty">
        No SCPs installed — install one from the Installation page.
      </p>
      <!-- C655 · MEND B · ONLINE section label — always leads whenever any row is shown
           (mirrors the sessions list · session-section-label idiom). -->
      <div
        v-if="scpCommandRows.length > 0"
        class="scp-command-section-label scp-command-section-label-online"
        role="heading"
        aria-level="3"
      >
        <span class="scp-command-section-label-text">ONLINE ·</span>
        <span class="scp-command-section-label-count">{{ scpCommandOnlineRows.length }}</span>
      </div>
      <template v-for="(row, index) in scpCommandSectionedRows" :key="row.name">
      <!-- C655 · MEND B · THE OFFLINE BOUNDARY · label injects before the first offline row
           (C535 law: OFFLINE chrome only when it holds rows). Anchored to a real, keyed row
           fragment — never a standalone item (mirrors isFirstOfflineRow at the sessions list). -->
      <div
        v-if="isFirstScpCommandOfflineRow(index)"
        class="scp-command-section-label scp-command-section-label-offline"
        role="heading"
        aria-level="3"
      >
        <span class="scp-command-section-label-text">OFFLINE ·</span>
        <span class="scp-command-section-label-count">{{ scpCommandOfflineRows.length }}</span>
      </div>
      <!-- C621 · THE TWO-ROW CARD (user Pewter critique): the round pill badge wrapped into a
           ring under the OSR and OFFSET the row. Row 1 = identity (name + SQUARED status+port
           chip, nowrap, same line); Row 2 = the per-SCP controls on their own line. -->
      <div class="scp-command-card">
      <div class="scp-command-row-id">
        <span class="scp-command-name">{{ row.name }}</span>
        <span class="scp-command-spacer"></span>
        <span
          class="scp-command-badge"
          :style="{
            color: row.live ? BRIDGE_STATUS_COLORS.connected : BRIDGE_STATUS_COLORS.idle,
            borderColor: row.live ? BRIDGE_STATUS_COLORS.connected : BRIDGE_STATUS_COLORS.idle,
          }"
        >{{ row.live ? `LIVE · :${row.port}` : 'OFFLINE' }}</span>
      </div>
      <!-- W6b · THE SIMULATED LOADING BAR (SCM W6) · rides ONLY the controller spawn-progress state
           (survives a page hop mid-boot). Renders under the identity row while the round is pre-live
           (requested anor booting); the indeterminate CSS animation is SIMULATED — it resolves/fills
           when the SCP lands live (the round advances to focusing→done and the bar unmounts). -->
      <div v-if="spawnBarActiveFor(row.name)" class="scp-command-bootbar" aria-hidden="true">
        <div class="scp-command-bootbar-fill"></div>
      </div>
      <div class="scp-command-row-controls">
        <button
          v-if="!row.live"
          class="scp-command-btn scp-command-btn-spawn"
          type="button"
          :disabled="!!scpCommandRowBusy[row.name] || spawnBarActiveFor(row.name) || !scpCommandRoster.bridgeUp || row.installing"
          :title="row.installing ? 'installing dependencies…' : ''"
          @click="handleScpCommandAction(row.name, '/bridge-boot')"
        >{{ row.installing ? 'Installing…' : (scpCommandRowBusy[row.name] || spawnBarActiveFor(row.name) ? 'Spawning…' : 'Spawn') }}</button>
        <button
          v-if="row.live"
          class="scp-command-btn scp-command-btn-focus"
          type="button"
          :disabled="!!scpCommandRowBusy[row.name]"
          @click="handleScpCommandAction(row.name, '/bridge-focus')"
        >{{ scpCommandRowBusy[row.name] ? 'Focusing…' : 'Focus' }}</button>
        <!-- W3 · MULTIPLY — a base SCP row spawns a worktree INSTANCE (gitm_worktree_add). Degrades
             HONESTLY when the gitm rail is unreachable (disabled + a title naming the missing rail).
             C632 · restyled HiFi YELLOW + the copy-and-paste glyph (fa-copy · the duplicate icon) — the
             honest "make another of this" mark, freeing × for the new EXIT ability. -->
        <button
          v-if="!row.isInstance"
          class="scp-command-btn scp-command-btn-multiply"
          type="button"
          :disabled="!worktreeRailReachable"
          :title="worktreeRailReachable ? 'Multiply — spawn a worktree instance of this SCP' : 'Worktree rail unavailable (gitm controller not injected)'"
          @click="multiplyOpenFor === row.name ? cancelMultiply() : openMultiply(row.name)"
        ><i class="fa-solid fa-copy" aria-hidden="true"></i></button>
        <!-- SES · THE STOP RAIL (C632 · the EXIT ability) — a LIVE SCP row STOPS the running SCP.
             The × (fa-xmark) now HONESTLY means exit/close (was the misleading multiply mark). HiFi
             Base glass, transitioning to HiFi Red on hover. RECOVERABLE (Spawn re-boots) — no confirm
             modal; the typed-name round stays reserved for the destructive worktree DELETE. -->
        <button
          v-if="row.live"
          class="scp-command-btn scp-command-btn-exit"
          type="button"
          :disabled="!!scpCommandRowBusy[row.name] || !scpCommandRoster.bridgeUp"
          title="Exit — stop this running SCP (recoverable · Spawn re-boots)"
          @click="handleScpCommandExit(row.name)"
        ><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <!-- W4 · DELETE — a worktree instance row opens the typed-name confirm. -->
        <button
          v-if="row.isInstance"
          class="scp-command-btn scp-command-btn-delete"
          type="button"
          :disabled="!worktreeRailReachable"
          :title="worktreeRailReachable ? 'Delete this worktree instance (type the exact name to arm)' : 'Worktree rail unavailable (gitm controller not injected)'"
          @click="deleteOpenFor === row.name ? cancelDelete() : openDelete(row.name)"
        >Delete</button>
      </div>
      </div>

      <!-- W3 · MULTIPLY PROMPT — a compact inline branch entry (default = a fresh working slug).
           ScsInput sized by a wrapping div (the attrs-sizing law — never a class on ScsInput). -->
      <div v-if="multiplyOpenFor === row.name" class="scp-command-panel scp-command-panel-multiply">
        <span class="scp-command-panel-label">Worktree branch</span>
        <div class="scp-command-panel-input">
          <ScsInput v-model="multiplyBranch" type="text" placeholder="branch to check out" />
        </div>
        <div class="scp-command-panel-actions">
          <button class="scp-command-panel-cancel" type="button" @click="cancelMultiply">Cancel</button>
          <button
            class="scp-command-panel-fire scp-command-panel-fire-multiply"
            type="button"
            :disabled="multiplyBranch.trim().length === 0 || !worktreeRailReachable"
            @click="fireMultiply(row.name)"
          >Multiply</button>
        </div>
      </div>

      <!-- C652 · THE STAGED MULTIPLY BAR — the SCP's birth-from-the-worktree readout. Rides OBSERVABLE
           signals only (create → the ${base}--wt-* citizen surfacing → the row rendered). Three labeled
           ticks as a segmented mini-bar (Pewter · the .scp-command-bootbar family). A relayed errorCode
           resolves it to an honest inline failure line rather than a stuck bar. Local round state (the
           smaller honest shape · a multiply round resolves before the user Spawns). -->
      <div
        v-if="multiplyRoundFor(row.name)"
        class="scp-command-panel scp-command-panel-multiply-progress"
        :class="{ 'is-failed': multiplyRoundFor(row.name)?.stage === 'failed' }"
      >
        <span class="scp-command-panel-label">Creating instance</span>
        <div class="scp-command-mstages">
          <div
            v-for="tick in (['create', 'register', 'install', 'ready'] as const)"
            :key="tick"
            class="scp-command-mstage"
            :class="`is-${multiplyTickState(row.name, tick)}`"
          >
            <span class="scp-command-mstage-fill"></span>
            <span class="scp-command-mstage-label">{{
              tick === 'create' ? 'Create' : tick === 'register' ? 'Register' : tick === 'install' ? 'Install' : 'Ready'
            }}</span>
          </div>
        </div>
        <span
          v-if="multiplyRoundFor(row.name)?.stage === 'failed'"
          class="scp-command-mstage-failline"
        >{{ multiplyRoundFor(row.name)?.failure }}</span>
      </div>

      <!-- W4 · TYPED-NAME DELETE PANEL — the ARMED→FIRE red register. FIRE arms ONLY on an exact
           typed match of the instanceName (mismatch = disarmed · the Ghost Measurer caret serves it). -->
      <div v-if="deleteOpenFor === row.name" class="scp-command-panel scp-command-panel-delete">
        <span class="scp-command-panel-warn">
          Type <strong>{{ row.name }}</strong> to arm the delete
        </span>
        <div class="scp-command-panel-input">
          <ScsInput v-model="deleteTyped" type="text" placeholder="Delete" />
        </div>
        <div class="scp-command-panel-actions">
          <button class="scp-command-panel-cancel" type="button" @click="cancelDelete">Cancel</button>
          <button
            class="scp-command-panel-fire scp-command-panel-fire-delete"
            :class="{ 'is-armed': deleteArmed }"
            type="button"
            :disabled="!deleteArmed || deletePhase === 'awaiting-token'"
            @click="fireDelete"
          >{{ deletePhase === 'awaiting-token' ? 'Removing…' : 'Delete Instance' }}</button>
        </div>
      </div>
      </template>
    </section>

    <!-- ═══ THE COMPACT FOOTER · W1 · details collapse ═══
         LAW · the old three-card status-summary-bar (Last Update · Bridge · PPLD)
         collapses into ONE footer strip of small Pewter metric chips at the base of
         the menu column. EVERY datum stays alive — lastUpdate, bridge version, and
         the connection label are preserved as inline chips. -->
    <footer class="scp-command-footer">
      <span class="scp-command-chip">
        <span class="scp-command-chip-label">Update</span>
        <span class="scp-command-chip-value">{{ lastUpdate }}</span>
      </span>
      <span class="scp-command-chip">
        <span class="scp-command-chip-label">Bridge</span>
        <span class="scp-command-chip-value">{{ bridgeStatusDisplay }}</span>
      </span>
      <span class="scp-command-chip">
        <span class="scp-command-chip-label">PPLD</span>
        <span
          class="scp-command-chip-value"
          :style="{
            color: (controller?.connectionEstablished.value ?? false)
              ? BRIDGE_STATUS_COLORS.connected
              : BRIDGE_STATUS_COLORS.error,
          }"
        >{{ bridgeActiveDisplay }}</span>
      </span>
    </footer>
    </div>
    <!-- /SMSR MENU COLUMN -->

    <!-- SMSR · SESSIONS COLUMN · display:contents identity wrapper. In stack mode this <div>
         vanishes structurally (byte-identical render). In split mode it becomes the 2/3 right
         column (SCP filter pills · Suite-8 filter pills · the full session list incl. SREX). -->
    <div class="smgmt-col smgmt-col-sessions">
    <!-- D3A · SCPP · SCP Filter Pills -->
    <div class="scp-filter-pills" role="toolbar" aria-label="Filter sessions by SCP">
      <button
        v-for="scp in scpFilterOptions"
        :key="scp.value ?? '__all__'"
        :class="['scp-filter-pill', { active: activeScpFilter === scp.value }]"
        @click="setScpFilter(scp.value)"
      >
        <span class="scp-filter-pill-label">{{ scp.label }}</span>
        <span v-if="scp.count > 0" class="scp-filter-pill-count">{{ scp.count }}</span>
      </button>
    </div>

    <!-- A-5 PFGD · GMSF · Suite8 Filter Pills — parallel to SCP filter; renders only when
         at least one session carries a suite8Name (pills are session-derived, not daemon-authoritative).
         Hidden entirely when no suite8Name values exist in sessionsList.
         R-D1 SCSE · GSRM: suppressed in Specific mode (activeSuite8Filter pre-committed at mount). -->
    <div
      v-if="!isSpecificMode && suite8FilterOptions.length > 1"
      class="scp-filter-pills"
      role="toolbar"
      aria-label="Filter sessions by Suite 8"
    >
      <button
        v-for="s8 in suite8FilterOptions"
        :key="s8.value ?? '__all_s8__'"
        :class="['scp-filter-pill', { active: activeSuite8Filter === s8.value }]"
        @click="setSuite8Filter(s8.value)"
      >
        <span class="scp-filter-pill-label">{{ s8.label }}</span>
        <span v-if="s8.count > 0" class="scp-filter-pill-count">{{ s8.count }}</span>
      </button>
    </div>

    <!-- D3A · SLRP + SCST + SISR + FJTC · Session List with Sortable Headers -->
    <!-- THE TWO-SECTION SPLIT (re-landed C543 · the SAFE shape): ONLINE (viridian) leads,
         OFFLINE (maroon) follows. The single v-for below walks sectionedList — REAL
         sessions only (online-sorted then offline-sorted) — so every :key is a defined
         session.id. The OFFLINE label + header inject at the boundary row via
         isFirstOfflineRow(index); no discriminated union, no alias, no undefined item. -->
    <div class="session-list">
      <div v-if="displayedSessions.length === 0" class="session-list-empty">
        <p>{{
          isSpecificMode
            ? `No sessions for ${s8Designation ?? 'this Suite 8'}`
            : activeScpFilter && activeSuite8Filter
              ? `No sessions for SCP "${activeScpFilter}" and Suite 8 "${activeSuite8Filter}"`
              : activeScpFilter
                ? `No sessions for selected SCP "${activeScpFilter}"`
                : activeSuite8Filter
                  ? `No sessions for Suite 8 "${activeSuite8Filter}"`
                  : 'No Active Sessions · Spawn a Session to begin monitoring'
        }}</p>
      </div>
      <div v-else class="session-list-rows" role="rowgroup">
        <!-- ONLINE section label — always leads whenever anything is shown (C535 law). -->
        <div class="session-section-label session-section-label-online" role="heading" aria-level="3">
          <span class="session-section-label-text">ONLINE ·</span>
          <span class="session-section-label-count">{{ onlineSessions.length }}</span>
        </div>
        <!-- PVSR · Pinned-Verb Scroll Row · the ONLINE header mirrors the row's 3 zones:
             pinned-left (Engagement + Session ID) · scrollable middle · pinned-right (toggle).
             The primary-verb column moves to FIRST — it must survive every row width. -->
        <div class="session-list-header" role="row">
          <span class="session-col-header session-col-header-static session-col-header-actions">Engagement</span>
          <button class="session-col-header session-col-header-id" @click="setSort('online', 'id')">
            <span>Session ID</span>
            <span v-if="sortColumnFor('online') === 'id'" class="sort-arrow">{{ sortDirFor('online') === 'asc' ? '▲' : '▼' }}</span>
          </button>
          <div class="session-header-scroll">
            <!-- A-D2 · DACM · Anchor column header · visible in BOTH modes (the actionable column) -->
            <span class="session-col-header session-col-header-static session-col-header-anchor" title="Anchor — the session bound to this page">⚓</span>
            <!-- R-D1 SCSE · S8CR · Suite 8 column header · sortable · hidden in Specific mode -->
            <button
              v-if="!isSpecificMode"
              class="session-col-header"
              @click="setSort('online', 'suite8Name')"
            >
              <span>Suite 8</span>
              <span v-if="sortColumnFor('online') === 'suite8Name'" class="sort-arrow">{{ sortDirFor('online') === 'asc' ? '▲' : '▼' }}</span>
            </button>
            <button class="session-col-header" @click="setSort('online', 'scpName')">
              <span>SCP</span>
              <span v-if="sortColumnFor('online') === 'scpName'" class="sort-arrow">{{ sortDirFor('online') === 'asc' ? '▲' : '▼' }}</span>
            </button>
            <button class="session-col-header" @click="setSort('online', 'spawnedAt')">
              <span>Spawned At</span>
              <span v-if="sortColumnFor('online') === 'spawnedAt'" class="sort-arrow">{{ sortDirFor('online') === 'asc' ? '▲' : '▼' }}</span>
            </button>
            <button class="session-col-header" @click="setSort('online', 'status')">
              <span>Status</span>
              <span v-if="sortColumnFor('online') === 'status'" class="sort-arrow">{{ sortDirFor('online') === 'asc' ? '▲' : '▼' }}</span>
            </button>
          </div>
          <!-- D3RM-G · PATC · toggle column static header · empty by design (Pewter §1.6) -->
          <span class="session-col-header session-col-header-static session-col-header-toggle" aria-hidden="true"></span>
        </div>
        <!-- Per-section empty notice — ONLINE · 0 (every session is offline). -->
        <div v-if="onlineSessions.length === 0" class="session-list-empty session-list-empty-section">
          <p>No live sessions · every session is offline</p>
        </div>
        <template v-for="(session, index) in sectionedList" :key="session.id">
          <!-- THE OFFLINE BOUNDARY · label + header inject before the first offline row
               (C535 law: OFFLINE chrome only when it holds rows). Anchored to a real,
               keyed session fragment — never a standalone union item. -->
          <template v-if="isFirstOfflineRow(index)">
            <div class="session-section-label session-section-label-offline" role="heading" aria-level="3">
              <span class="session-section-label-text">OFFLINE ·</span>
              <span class="session-section-label-count">{{ offlineSessions.length }}</span>
              <!-- D-SJP · the OFFLINE pager — renders only when the section spans pages;
                   the count above stays the TOTAL so paging never hides the true size. -->
              <span v-if="offlinePageCount > 1" class="session-pager">
                <button
                  class="session-pager-btn"
                  :disabled="offlinePage === 0"
                  aria-label="Previous page"
                  @click="offlinePage -= 1"
                >‹</button>
                <span class="session-pager-info">{{ offlinePage + 1 }} / {{ offlinePageCount }}</span>
                <button
                  class="session-pager-btn"
                  :disabled="offlinePage >= offlinePageCount - 1"
                  aria-label="Next page"
                  @click="offlinePage += 1"
                >›</button>
              </span>
            </div>
            <div class="session-list-header" role="row">
              <span class="session-col-header session-col-header-static session-col-header-actions">Engagement</span>
              <button class="session-col-header session-col-header-id" @click="setSort('offline', 'id')">
                <span>Session ID</span>
                <span v-if="sortColumnFor('offline') === 'id'" class="sort-arrow">{{ sortDirFor('offline') === 'asc' ? '▲' : '▼' }}</span>
              </button>
              <div class="session-header-scroll">
                <span class="session-col-header session-col-header-static session-col-header-anchor" title="Anchor — the session bound to this page">⚓</span>
                <button
                  v-if="!isSpecificMode"
                  class="session-col-header"
                  @click="setSort('offline', 'suite8Name')"
                >
                  <span>Suite 8</span>
                  <span v-if="sortColumnFor('offline') === 'suite8Name'" class="sort-arrow">{{ sortDirFor('offline') === 'asc' ? '▲' : '▼' }}</span>
                </button>
                <button class="session-col-header" @click="setSort('offline', 'scpName')">
                  <span>SCP</span>
                  <span v-if="sortColumnFor('offline') === 'scpName'" class="sort-arrow">{{ sortDirFor('offline') === 'asc' ? '▲' : '▼' }}</span>
                </button>
                <button class="session-col-header" @click="setSort('offline', 'spawnedAt')">
                  <span>Spawned At</span>
                  <span v-if="sortColumnFor('offline') === 'spawnedAt'" class="sort-arrow">{{ sortDirFor('offline') === 'asc' ? '▲' : '▼' }}</span>
                </button>
                <button class="session-col-header" @click="setSort('offline', 'status')">
                  <span>Status</span>
                  <span v-if="sortColumnFor('offline') === 'status'" class="sort-arrow">{{ sortDirFor('offline') === 'asc' ? '▲' : '▼' }}</span>
                </button>
              </div>
              <span class="session-col-header session-col-header-static session-col-header-toggle" aria-hidden="true"></span>
            </div>
          </template>
          <!-- D3E Diamond A · SRCR container — wraps SRTR top row + SRBR bottom row. -->
          <div
            class="session-row-container"
            :class="[
              `session-row-container-${getContainerState(session)}`,
              { 'saes-engaged': session.id === activeEngagedSessionId },
              { 'srex-expanded': expandedSessionId === session.id },
            ]"
          >
            <!-- D3RM-G · SRTR: 6-column top row · PTRD prune complete (no @click toggle).
                 PATC button is the SOLE expand affordance (last cell · Pewter §1.6+§1.7). -->
            <div
              class="session-row-top"
              role="row"
            >
              <!-- PVSR · the primary verbs pinned FIRST (SGEF status-gating unchanged ·
                   handlers unchanged). The verb must survive every row width and state —
                   it can never again be squeezed out by the anchor cell anor clipped by a
                   narrow container. Archive/Dissipate stay in the scrollable middle
                   (deliberate friction on destructive verbs). -->
              <span class="session-cell session-cell-actions">
                <button
                  v-if="session.status === 'launched'"
                  class="focus-session-btn"
                  :disabled="isFocusing"
                  @click.stop="handleFocus(session.id)"
                >Focus</button>
                <button
                  v-else-if="session.status === 'allocated' || session.status === 'offline'"
                  class="engage-session-btn"
                  :disabled="isEngaging"
                  @click.stop="handleEngage(session.id)"
                >Engage</button>
                <span
                  v-else
                  class="engage-session-btn engage-session-btn-engaged"
                >Archived</span>
              </span>
              <!-- RM-D4 · Element 1 · Inline rename in the ID cell (Pewter §1).
                   Display mode = resolved label (displayName?.trim() || shortId) +
                   hover-revealed pencil; edit mode = inline text input in place. -->
              <span class="session-cell session-cell-id">
                <template v-if="renameEditingId !== session.id">
                  <span
                    class="session-id-label"
                    :class="{ 'session-id-label-named': !!(session.scsLabel?.trim() || session.displayName?.trim()) }"
                  >{{ session.scsLabel?.trim() || session.displayName?.trim() || shortId(session.id) }}</span>
                  <button
                    class="session-rename-btn"
                    type="button"
                    aria-label="Rename session"
                    title="Rename session"
                    @click.stop="beginRename(session.id, session.scsLabel ?? session.displayName)"
                  >✎</button>
                  <!-- MD-9 · D-MC-3 · recorded per-instance model tag (small · muted · only when
                       the entry pinned a model · scsModelLabel resolves the friendly label). -->
                  <span
                    v-if="session.model"
                    class="session-model-tag"
                    :title="`Model · ${scsModelLabel(session.model)}`"
                  >{{ scsModelLabel(session.model) }}</span>
                </template>
                <ScsInput
                  v-else
                  ref="renameInputRef"
                  class="session-rename-input"
                  type="text"
                  maxlength="32"
                  :placeholder="shortId(session.id)"
                  v-model="renameBuffer"
                  @click.stop
                  @keydown.enter.prevent="confirmRename(session.id)"
                  @keydown.escape="cancelRename()"
                  @blur="confirmRename(session.id)"
                />
              </span>
              <!-- PVSR · the scrollable middle — every remaining cell rides intrinsic width
                   inside an overflow-x zone; nothing squeezes, nothing clips off-screen.
                   The zone scrolls UNDER the pinned toggle (the fade edge on the toggle cell). -->
              <div class="session-row-scroll">
              <!-- A-D2 · DACM · Anchor body cell · visible in BOTH modes -->
              <!-- A-D3b · ARFSP · Specific-mode non-anchor sessions get a "Set as Anchor" button. -->
              <!-- SAC.2 · §3 no-hover fallback: :title resolves to the dynamic "Anchored to: <page>" string. -->
              <span
                class="session-cell session-cell-anchor"
                :title="session.isAnchor
                  ? `Anchored to: ${session.suite8Name ?? 'this page'}`
                  : 'Not anchored'"
                @mouseleave="disarmUnsetAnchor"
              >
                <template v-if="session.isAnchor">
                  <!-- SAC.2 · §4 · resting anchor chip (viridian · .swio-badge-open idiom) -->
                  <span class="anchor-state-chip">
                    <span class="anchor-glyph">⚓</span>
                    <span class="anchor-state-chip-label">Anchor</span>
                  </span>
                  <!-- SAC.4 · §1.1 · the row Anchor System control: cog [⚙] + Auto pill.
                       Fetches the page config on render (ensureAnchorConfig · idempotent).
                       Cog → spawns the Anchor System panel (§4). Pill → the rounded-pill
                       Auto toggle (§2 · sliding knob · viridian-on · zero new color). At
                       rest muted (opacity 0.6 · hover-reveal · §2.5), full on row-hover. -->
                  <span class="anchor-system-control">
                    <button
                      type="button"
                      class="anchor-cog-btn"
                      title="Anchor settings — control auto-anchor for this page"
                      :disabled="!getAnchorConfig(session.suite8Name)"
                      @click.stop="toggleAnchorPanel(session.suite8Name)"
                    >⚙</button>
                    <span class="anchor-auto-label">Auto</span>
                    <button
                      type="button"
                      class="anchor-auto-pill"
                      role="switch"
                      :class="{ 'anchor-auto-pill--on': getAutoAnchor(session.suite8Name) }"
                      :aria-checked="getAutoAnchor(session.suite8Name) ? 'true' : 'false'"
                      :aria-label="`Auto-anchor for ${session.suite8Name ?? 'this page'}`"
                      :title="anchorPillTitle(session.suite8Name)"
                      :disabled="!getAnchorConfig(session.suite8Name) || isAnchorConfigBusy(session.suite8Name)"
                      @click.stop="handleToggleAutoAnchor(session.suite8Name)"
                    >
                      <span class="anchor-auto-pill__track">
                        <span class="anchor-auto-pill__knob"></span>
                      </span>
                      <span
                        v-if="isAnchorOverridden(session.suite8Name)"
                        class="anchor-auto-override-dot"
                        aria-hidden="true"
                      ></span>
                    </button>

                    <!-- SAC.4 · §4 · the Anchor System panel (cog-spawned popover · NOT a modal).
                         Sibling surface of ShatteriteMenu (same Pewter palette) · keyed by
                         suite8Name. @click.stop keeps clicks inside from bubbling to the cog. -->
                    <div
                      v-if="anchorPanelOpenPage === session.suite8Name"
                      class="anchor-system-panel"
                      role="dialog"
                      aria-label="Anchor settings"
                      @click.stop
                    >
                      <div class="anchor-system-panel__header">
                        <span class="anchor-system-panel__title">⚙ Anchor Settings</span>
                        <button
                          type="button"
                          class="anchor-system-panel__close"
                          aria-label="Close"
                          @click.stop="closeAnchorPanel"
                        >×</button>
                      </div>
                      <p class="anchor-system-panel__page">Page · {{ session.suite8Name ?? 'this page' }}</p>
                      <div class="anchor-system-panel__divider"></div>

                      <div class="anchor-system-row">
                        <span class="anchor-system-row-label">Auto-anchor</span>
                        <button
                          type="button"
                          class="anchor-auto-pill"
                          role="switch"
                          :class="{ 'anchor-auto-pill--on': getAutoAnchor(session.suite8Name) }"
                          :aria-checked="getAutoAnchor(session.suite8Name) ? 'true' : 'false'"
                          :aria-label="`Auto-anchor for ${session.suite8Name ?? 'this page'}`"
                          :title="anchorPillTitle(session.suite8Name)"
                          :disabled="!getAnchorConfig(session.suite8Name) || isAnchorConfigBusy(session.suite8Name)"
                          @click.stop="handleToggleAutoAnchor(session.suite8Name)"
                        >
                          <span class="anchor-auto-pill__track">
                            <span class="anchor-auto-pill__knob"></span>
                          </span>
                        </button>
                        <span class="anchor-system-state-word">{{ getAutoAnchor(session.suite8Name) ? 'ON' : 'OFF' }}</span>
                      </div>

                      <div class="anchor-default-readout">
                        <span class="anchor-system-row-label">Page default</span>
                        <span class="anchor-system-value">{{ getAnchorDefault(session.suite8Name) ? 'ON' : 'OFF' }}</span>
                      </div>
                      <div class="anchor-override-status">
                        <span class="anchor-system-row-label">Status</span>
                        <span
                          class="anchor-system-value"
                          :class="{ 'anchor-system-value--overridden': isAnchorOverridden(session.suite8Name) }"
                        >{{ isAnchorOverridden(session.suite8Name) ? 'Overridden' : 'Using page default' }}</span>
                      </div>

                      <button
                        v-if="isAnchorOverridden(session.suite8Name)"
                        type="button"
                        class="anchor-reset-btn"
                        :disabled="isAnchorConfigBusy(session.suite8Name)"
                        @click.stop="handleResetAnchorConfig(session.suite8Name)"
                      >Reset to page default</button>

                      <p class="anchor-system-panel__hint">
                        When on, this page re-opens its anchor automatically on load.
                      </p>
                    </div>
                  </span>
                  <!-- SAC.2 · §2.1 · collapsed-cell un-anchor reveal (hover/focus) · two-step confirm -->
                  <button
                    type="button"
                    class="session-unanchor-btn"
                    :class="{ 'is-arming': unanchorArmingId === session.id }"
                    title="Release this anchor — the page unbinds from this session (recoverable; a fresh anchor opens on next load)"
                    :disabled="isUnanchoring"
                    @click.stop="handleUnsetAnchor(session.id)"
                  >{{ unanchorArmingId === session.id ? 'Release? ✓' : 'Release ⚓' }}</button>
                  <!-- SAC.2 · §3 · pure-CSS anchor hover popover (what the anchor binds to) -->
                  <span class="anchor-hover-indicator" role="tooltip">
                    <span class="anchor-hover-label">Anchored to:</span>
                    <span class="anchor-hover-value">{{ session.suite8Name ?? 'this page' }}</span>
                    <span v-if="session.scpName" class="anchor-hover-context">{{ session.scpName }}</span>
                  </span>
                </template>
                <!-- SAC.5 · the inactive OUTLINE ⚓ — every page session can DROP ANCHOR (singleton per
                     page: handleSetAnchor → setSessionAnchor clears the page's prior anchor). Always
                     present (hollow/inactive); becomes the filled chip (above) once dropped. The Auto
                     toggle appears only on the anchored row (the v-if branch). -->
                <button
                  v-else-if="session.suite8Name"
                  type="button"
                  class="session-drop-anchor-btn"
                  :title="`Drop anchor — make this session the anchor for ${session.suite8Name} (replaces the current anchor)`"
                  :disabled="isSpawning"
                  @click.stop="handleSetAnchor(session.id)"
                >
                  <span class="anchor-glyph anchor-glyph--outline" aria-hidden="true">⚓</span>
                </button>
                <span v-else class="anchor-dot" aria-hidden="true">·</span>
              </span>
              <!-- R-D1 SCSE · S8CR · Suite 8 body cell · position 3 · hidden in Specific mode -->
              <span v-if="!isSpecificMode" class="session-cell session-cell-suite8">
                {{ session.suite8Name ?? '—' }}
              </span>
              <span class="session-cell session-cell-scp">
                <span>{{ session.scpName ?? '—' }}</span>
                <!-- R-D1 SCSE · S8CR: chip suppressed in Specific mode (suite8Name already anchored) -->
                <span v-if="session.suite8Name && !isSpecificMode" class="suite8-calling-chip">{{ session.suite8Name }}</span>
              </span>
              <span class="session-cell session-cell-time">{{ formatTime(session.spawnedAt) }}</span>
              <span class="session-cell session-cell-status">
                <span
                  :class="['session-status-badge', `session-status-badge-${session.status}`]"
                >{{ session.status.toUpperCase() }}</span>
                <!-- D3D Wave-2 · SWIO badge · HAZARD-Z three-value discrimination via getSwioState helper.
                     Helper returns 'unknown' | 'working' | 'open' — string equality eliminates truthy coercion risk. -->
                <template v-if="getSwioState(session) === 'working'">
                  <span
                    class="swio-badge swio-badge-working"
                    :style="{ color: BRIDGE_STATUS_COLORS.working.color }"
                  >{{ BRIDGE_STATUS_COLORS.working.label }}</span>
                </template>
                <template v-else-if="getSwioState(session) === 'open'">
                  <span
                    class="swio-badge swio-badge-open"
                    :style="{ color: BRIDGE_STATUS_COLORS.open.color }"
                  >{{ BRIDGE_STATUS_COLORS.open.label }}</span>
                </template>
                <!-- getSwioState === 'unknown' → render nothing (honest pre-D3D silence) -->
                <!-- RM-D3 · PRMX/FSSF badges · visible on the collapsed row (V4 badge-on-row).
                     PERMISSION (fuchsia) when a held decision waits; ANSWER (amber) for FSSF. -->
                <!-- PSTK · when the stack holds >1 held permission, the badge shows the
                     depth (PERMISSION ×N) — the collapsed row signals a queue, not a lone gate. -->
                <span
                  v-if="session.permissionPending === true"
                  class="swio-badge swio-badge-permission"
                >PERMISSION<template v-if="getQueueDepth(session) > 1"> &times;{{ getQueueDepth(session) }}</template></span>
                <span
                  v-else-if="session.askUserQuestionPending === true"
                  class="swio-badge swio-badge-answer"
                >ANSWER</span>
              </span>
              <!-- PVSR · teardown cell — the destructive verbs stay in the scrollable
                   middle (deliberate friction). Focus/Engage moved to the pinned
                   session-cell-actions (SGEF gating rides with them · TPCR companion). -->
              <span class="session-cell session-cell-final-turn">
                <!-- PDAB · Dissolution + Archival Diamond · per-row teardown buttons.
                     Dissipate = remove row + DELETE real session · Archive = move real
                     session → Cascades/Archive then remove row. Resilient server-side.
                     ASDR Testing-Refinement #4 · the Anchor row now EXPOSES Archive (the
                     safe, recoverable teardown) so the user can CLEAR the page anchor via
                     the UI without manually resetting sessions.json — a fresh anchor then
                     spawns on the next page load. Dissipate (permanent delete) STAYS
                     Anchor-protected. @click.stop prevents the row-click toggleExpand. -->
                <button
                  type="button"
                  class="session-archive-btn"
                  :title="session.isAnchor
                    ? 'Archive the Anchor — clears the page anchor (recoverable move into Cascades/Archive); a fresh anchor spawns on next load'
                    : 'Archive — move the real ClaudeCode session into Cascades/Archive then remove from the registry'"
                  :disabled="isArchiving"
                  @click.stop="handleArchive(session.id)"
                >{{ session.isAnchor ? 'Archive Anchor' : 'Archive' }}</button>
                <!-- MD-ARC+C · Wave 7 · Delete (renamed Dissipate · Pewter RD §2.2) —
                     opens a compact Y/N confirm below the row before firing (§2.3). -->
                <button
                  v-if="!session.isAnchor"
                  type="button"
                  class="session-dissipate-btn"
                  title="Delete — remove from the registry and delete the ClaudeCode session (permanent)"
                  :disabled="isDissipating"
                  @click.stop="openSessionDeleteConfirm(session.id)"
                >Delete</button>
              </span>

              </div>
              <!-- MD-ARC+C · Wave 7 · SESSION DELETE CONFIRM (Pewter RD §2.3) · compact
                   Y/N below session-row-top · Cancel = default focus (destructive default-N). -->
              <div
                v-if="deleteConfirmFor === session.id"
                class="session-delete-confirm"
                @click.stop
              >
                <span class="session-delete-confirm-warn">
                  Delete is permanent — removes from registry + deletes session data.
                </span>
                <div class="session-delete-confirm-actions">
                  <button class="session-confirm-cancel" type="button" autofocus @click.stop="cancelDeleteConfirm">Cancel</button>
                  <button class="session-confirm-fire" type="button" :disabled="isDissipating" @click.stop="confirmSessionDelete(session.id)">Delete</button>
                </div>
              </div>
              <!-- D3RM-G · PATC · Pewter Arrow Toggle Button — PVSR: PINNED at the right
                   edge over a fade; the scroll zone slides UNDER it, so every row stays
                   expandable in EVERY state and at EVERY width.
                   ⌄ = expand · ⌃ = collapse (Pewter §1.1 carets · distinct from sort-arrows).
                   @click.stop prevents bubble · row no longer expandable via click. -->
              <span class="session-cell session-cell-toggle">
                <button
                  class="session-toggle-btn"
                  :class="{ 'session-toggle-btn-expanded': expandedSessionId === session.id }"
                  :aria-label="expandedSessionId === session.id ? 'Collapse session details' : 'Expand session details'"
                  :aria-expanded="expandedSessionId === session.id ? 'true' : 'false'"
                  @click.stop="toggleExpand(session.id)"
                >{{ expandedSessionId === session.id ? '⌃' : '⌄' }}</button>
              </span>
            </div>
            <!-- SRBR: always-visible bottom Informative row · MFTS mock snippet + HFEB expand button -->
            <div class="session-row-bottom">
              <span
                class="final-turn-snippet"
                :class="{ 'final-turn-snippet--processing': isModelProcessingPlaceholder(session) }"
              >{{ getMockSnippet(session) }}</span>
              <button
                class="hifi-expand-btn"
                :class="{ disabled: !hasSnippetContent(session) }"
                :disabled="!hasSnippetContent(session)"
                @click.stop="handleExpandClick(session.id)"
              >⤢</button>
            </div>
          </div>
          <!-- D3D Wave-2 · SREX drawer · expanded-only · R3-D §S6 inset-D5 secondary surface.
               Preserved from D3D Wave-2 — different surface from SRBR. -->
          <div
            v-if="expandedSessionId === session.id"
            class="session-srex-zone"
            @click.stop
          >
            <!-- SAC.2 · §1 · SREX Engagement parity bar · the FIRST child of the SREX zone.
                 MIRRORS (does not duplicate) the collapsed top-row engagement controls:
                 the SAME button classes + the SAME handlers — ONE source of truth. Two
                 clusters: primary (Focus/Engage, Rename) left-anchored; teardown
                 (Un-anchor/Set ⚓, Archive, Dissipate) pushed right via .srex-teardown-lead
                 (margin-left:auto). Status gates are identical to the top row. -->
            <div class="srex-engagement-bar" @mouseleave="disarmUnsetAnchor">
              <span class="srex-engagement-label">Engagement</span>
              <!-- PRIMARY cluster -->
              <button
                v-if="session.status === 'launched'"
                class="focus-session-btn"
                :disabled="isFocusing"
                @click.stop="handleFocus(session.id)"
              >Focus</button>
              <button
                v-else-if="session.status === 'allocated' || session.status === 'offline'"
                class="engage-session-btn"
                :disabled="isEngaging"
                @click.stop="handleEngage(session.id)"
              >Engage</button>
              <span
                v-else
                class="engage-session-btn engage-session-btn-engaged"
              >Archived</span>
              <button
                type="button"
                class="session-rename-btn"
                aria-label="Rename session"
                title="Rename session"
                @click.stop="beginRename(session.id, session.scsLabel ?? session.displayName)"
              >Rename</button>
              <!-- SAC.4 · §1.1.2 · the SAME Anchor System control mirrored into the SREX bar
                   (full opacity here · §8.3) · ONLY for the anchor row. Same handlers + the
                   SAME .anchor-system-control / .anchor-auto-pill classes — one source of truth. -->
              <span
                v-if="session.isAnchor"
                class="anchor-system-control anchor-system-control--srex"
              >
                <button
                  type="button"
                  class="anchor-cog-btn"
                  title="Anchor settings — control auto-anchor for this page"
                  :disabled="!getAnchorConfig(session.suite8Name)"
                  @click.stop="toggleAnchorPanel(session.suite8Name)"
                >⚙</button>
                <span class="anchor-auto-label">Auto</span>
                <button
                  type="button"
                  class="anchor-auto-pill"
                  role="switch"
                  :class="{ 'anchor-auto-pill--on': getAutoAnchor(session.suite8Name) }"
                  :aria-checked="getAutoAnchor(session.suite8Name) ? 'true' : 'false'"
                  :aria-label="`Auto-anchor for ${session.suite8Name ?? 'this page'}`"
                  :title="anchorPillTitle(session.suite8Name)"
                  :disabled="!getAnchorConfig(session.suite8Name) || isAnchorConfigBusy(session.suite8Name)"
                  @click.stop="handleToggleAutoAnchor(session.suite8Name)"
                >
                  <span class="anchor-auto-pill__track">
                    <span class="anchor-auto-pill__knob"></span>
                  </span>
                  <span
                    v-if="isAnchorOverridden(session.suite8Name)"
                    class="anchor-auto-override-dot"
                    aria-hidden="true"
                  ></span>
                </button>

                <!-- The SAME Anchor System panel (cog-spawned popover · keyed by suite8Name). -->
                <div
                  v-if="anchorPanelOpenPage === session.suite8Name"
                  class="anchor-system-panel"
                  role="dialog"
                  aria-label="Anchor settings"
                  @click.stop
                >
                  <div class="anchor-system-panel__header">
                    <span class="anchor-system-panel__title">⚙ Anchor Settings</span>
                    <button
                      type="button"
                      class="anchor-system-panel__close"
                      aria-label="Close"
                      @click.stop="closeAnchorPanel"
                    >×</button>
                  </div>
                  <p class="anchor-system-panel__page">Page · {{ session.suite8Name ?? 'this page' }}</p>
                  <div class="anchor-system-panel__divider"></div>

                  <div class="anchor-system-row">
                    <span class="anchor-system-row-label">Auto-anchor</span>
                    <button
                      type="button"
                      class="anchor-auto-pill"
                      role="switch"
                      :class="{ 'anchor-auto-pill--on': getAutoAnchor(session.suite8Name) }"
                      :aria-checked="getAutoAnchor(session.suite8Name) ? 'true' : 'false'"
                      :aria-label="`Auto-anchor for ${session.suite8Name ?? 'this page'}`"
                      :title="anchorPillTitle(session.suite8Name)"
                      :disabled="!getAnchorConfig(session.suite8Name) || isAnchorConfigBusy(session.suite8Name)"
                      @click.stop="handleToggleAutoAnchor(session.suite8Name)"
                    >
                      <span class="anchor-auto-pill__track">
                        <span class="anchor-auto-pill__knob"></span>
                      </span>
                    </button>
                    <span class="anchor-system-state-word">{{ getAutoAnchor(session.suite8Name) ? 'ON' : 'OFF' }}</span>
                  </div>

                  <div class="anchor-default-readout">
                    <span class="anchor-system-row-label">Page default</span>
                    <span class="anchor-system-value">{{ getAnchorDefault(session.suite8Name) ? 'ON' : 'OFF' }}</span>
                  </div>
                  <div class="anchor-override-status">
                    <span class="anchor-system-row-label">Status</span>
                    <span
                      class="anchor-system-value"
                      :class="{ 'anchor-system-value--overridden': isAnchorOverridden(session.suite8Name) }"
                    >{{ isAnchorOverridden(session.suite8Name) ? 'Overridden' : 'Using page default' }}</span>
                  </div>

                  <button
                    v-if="isAnchorOverridden(session.suite8Name)"
                    type="button"
                    class="anchor-reset-btn"
                    :disabled="isAnchorConfigBusy(session.suite8Name)"
                    @click.stop="handleResetAnchorConfig(session.suite8Name)"
                  >Reset to page default</button>

                  <p class="anchor-system-panel__hint">
                    When on, this page re-opens its anchor automatically on load.
                  </p>
                </div>
              </span>
              <!-- TEARDOWN cluster (floats right · .srex-teardown-lead = margin-left:auto) -->
              <button
                v-if="session.isAnchor"
                type="button"
                class="session-unanchor-btn srex-teardown-lead"
                :class="{ 'is-arming': unanchorArmingId === session.id }"
                title="Release this anchor — the page unbinds from this session (recoverable; a fresh anchor opens on next load)"
                :disabled="isUnanchoring"
                @click.stop="handleUnsetAnchor(session.id)"
              >{{ unanchorArmingId === session.id ? 'Release? ✓' : 'Un-anchor' }}</button>
              <button
                v-else-if="session.suite8Name"
                type="button"
                class="session-drop-anchor-btn session-drop-anchor-btn--srex srex-teardown-lead"
                :title="`Drop anchor — make this session the anchor for ${session.suite8Name} (replaces the current anchor)`"
                :disabled="isSpawning"
                @click.stop="handleSetAnchor(session.id)"
              ><span class="anchor-glyph anchor-glyph--outline" aria-hidden="true">⚓</span><span class="session-drop-anchor-label">Drop Anchor</span></button>
              <button
                type="button"
                class="session-archive-btn"
                :class="{ 'srex-teardown-lead': !session.isAnchor && !session.suite8Name }"
                :title="session.isAnchor
                  ? 'Archive the Anchor — clears the page anchor (recoverable move into Cascades/Archive); a fresh anchor spawns on next load'
                  : 'Archive — move the real ClaudeCode session into Cascades/Archive then remove from the registry'"
                :disabled="isArchiving"
                @click.stop="handleArchive(session.id)"
              >{{ session.isAnchor ? 'Archive Anchor' : 'Archive' }}</button>
              <!-- MD-ARC+C · Wave 7 · Delete (renamed Dissipate · Pewter RD §2.2) —
                   opens a compact Y/N confirm below the row before firing (§2.3). -->
              <button
                v-if="!session.isAnchor"
                type="button"
                class="session-dissipate-btn"
                title="Delete — remove from the registry and delete the ClaudeCode session (permanent)"
                :disabled="isDissipating"
                @click.stop="openSessionDeleteConfirm(session.id)"
              >Delete</button>
            </div>

            <!-- MD-ARC+C · Wave 7 · SESSION DELETE CONFIRM (Pewter RD §2.3) · compact Y/N ·
                 Cancel = default focus (destructive default-N). Shared with the collapsed cluster
                 via deleteConfirmFor (only one confirm can be open at a time · keyed by session.id). -->
            <div
              v-if="deleteConfirmFor === session.id"
              class="session-delete-confirm"
              @click.stop
            >
              <span class="session-delete-confirm-warn">
                Delete is permanent — removes from registry + deletes session data.
              </span>
              <div class="session-delete-confirm-actions">
                <button class="session-confirm-cancel" type="button" autofocus @click.stop="cancelDeleteConfirm">Cancel</button>
                <button class="session-confirm-fire" type="button" :disabled="isDissipating" @click.stop="confirmSessionDelete(session.id)">Delete</button>
              </div>
            </div>

            <!-- D3G Refinement Wave · Chat-Style HiFi Pewter Render of Last Exchange.
                 SSTE-driven (transcriptLastUserInput + transcriptLastModelOutput).
                 Replaces the prior JTCH `finalTurnSummary` plain-text render.
                 User-locked: "a Literal HiFi Functionally Designed Render via our Pewter
                 to be the User Model Turn. As if we are Chatting with the Model." -->
            <div
              v-if="session.transcriptLastUserInput || session.transcriptLastModelOutput || isModelProcessingPlaceholder(session)"
              class="srex-chat-exchange"
            >
              <!-- RM-D3 · PLTH · hide the USER echo while any panel phase is active;
                   the MODEL turn below stays as context for what's being asked. -->
              <div
                v-if="session.transcriptLastUserInput && getPanelPhase(session) === 'idle'"
                class="srex-chat-turn srex-chat-turn-user"
              >
                <span class="srex-chat-role">User</span>
                <span class="srex-chat-content">{{ session.transcriptLastUserInput }}</span>
              </div>
              <!-- RM-D4 · PMA-NR (SREX) · when the synthetic 'No response requested.' marks
                   the model as still working, the Last-Exchange MODEL turn renders the SAME
                   animated 'Model Processing' placeholder (shimmer + dots) the SRBR snippet
                   uses — the Specific Animation now occurs in the model turn of the last turn
                   section, not only the snippet. Real output renders unchanged otherwise. -->
              <div
                v-if="session.transcriptLastModelOutput || isModelProcessingPlaceholder(session)"
                class="srex-chat-turn srex-chat-turn-model"
              >
                <span class="srex-chat-role">Model</span>
                <span
                  class="srex-chat-content"
                  :class="{ 'srex-chat-content--processing': isModelProcessingPlaceholder(session) }"
                >{{ isModelProcessingPlaceholder(session) ? 'Model Processing' : session.transcriptLastModelOutput }}</span>
              </div>
            </div>
            <div v-else class="srex-row">
              <span class="srex-zone-label">Last Exchange</span>
              <span class="srex-empty">— Awaiting transcript read</span>
            </div>

            <!-- ====================================================================
                 RM-D3 · PRMX/DPOB · Permission panel · phase 'permission'.
                 Replaces the input when a gated tool waits. MODEL turn above is
                 the context (PLTH). XSS: v-text ONLY on tool-derived content. -->
            <!-- PSTK · THE PANE STACK. The HEAD pane renders as today (buttons via the
                 HEAD's suggestions · reads getPermissionHead so it works whether the queue
                 or the legacy scalars carry the head). BENEATH it, when the queue holds
                 >1 item, the QUEUED STRIP lists items 1..N-1 (no buttons — the head answers
                 first · the CLI's landing order is authoritative). -->
            <div
              v-if="getPanelPhase(session) === 'permission'"
              class="perm-panel"
            >
              <div class="perm-panel-head">
                <span class="perm-blocking-dot"></span>
                <span class="perm-lock-glyph">&#128274;</span>
                <span class="perm-panel-title">Permission Required</span>
                <span class="perm-mode-chip">Blocking</span>
              </div>
              <div class="perm-tool-chip">
                <div class="perm-tool-name-row">
                  <span class="perm-tool-label">Tool</span>
                  <span class="perm-tool-name" v-text="getPermissionHead(session).tool"></span>
                </div>
                <!-- XSS guard: v-text, NEVER v-html — tool_input is tool-derived (note 7). -->
                <div class="perm-tool-input" v-text="getPermissionHead(session).input"></div>
              </div>
              <div class="perm-options">
                <button
                  v-for="(btn, i) in getPermissionButtons(session)"
                  :key="i"
                  class="perm-btn"
                  :class="btn.behavior === 'deny' ? 'perm-btn-deny' : (i === 0 ? 'perm-btn-allow' : 'perm-btn-always')"
                  :disabled="isDecidingPermission[session.id] === true"
                  @click.stop="handlePermissionDecision(session.id, btn.behavior, getPermissionHead(session).requestId, btn.persistRule)"
                >{{ btn.label }}</button>
              </div>
              <!-- PSTK · THE QUEUED STRIP · items 1..N-1 in landing order, no buttons. -->
              <div v-if="getQueuedItems(session).length > 0" class="perm-queue-strip">
                <div class="perm-queue-strip-head">
                  {{ getQueuedItems(session).length }} more &middot; in landing order
                </div>
                <div
                  v-for="q in getQueuedItems(session)"
                  :key="q.requestId"
                  class="perm-queue-row"
                >
                  <span class="perm-queue-tool" v-text="q.tool"></span>
                  <span class="perm-queue-input" v-text="q.input"></span>
                </div>
              </div>
            </div>

            <!-- ====================================================================
                 RM-D3 · ATID/AAFV · active-tool informative flash · phase 'active'.
                 Auto-clears when PostToolUse fires (activeTool deleted → 'idle').
                 AAFV linger is CSS-only (animation-delay · note 4) — no JS linger.
                 Live-Lambda refinement: full viridian pane — tool-chip block for
                 visibility (mirrors perm-tool-chip inset surface). Fires for every
                 tool (auto-approved or not) during its PreTool→PostTool window. -->
            <div
              v-if="getPanelPhase(session) === 'active'"
              class="auto-flash"
            >
              <span class="auto-flash-glyph">&#10003;</span>
              <div class="auto-flash-body">
                <span class="auto-flash-line1">Active Tool</span>
                <div class="auto-flash-tool-chip">
                  <span class="auto-flash-tool-name" v-text="session.activeTool ?? ''"></span>
                  <div v-if="session.activeToolInput" class="auto-flash-tool-input" v-text="session.activeToolInput"></div>
                </div>
              </div>
              <span class="auto-flash-tag">Running</span>
            </div>

            <!-- ====================================================================
                 RM-D3 · FSSF · AskUserQuestion / unknown-tool Focus-card · phase
                 'focus'. ONE card for both (note 5). Routes to the EXISTING Focus
                 means (handleFocus → triggerFocusSession) — no new mechanism.
                 Live-Lambda refinement: entire bar is clickable (role=button +
                 cursor:pointer); inner Focus button is RED (--color-red token,
                 mirrors .focus-session-btn) as the visual cue. -->
            <div
              v-if="getPanelPhase(session) === 'focus'"
              class="focus-flash focus-flash-ask focus-flash-clickable"
              role="button"
              tabindex="0"
              @click.stop="handleFocus(session.id)"
              @keydown.enter.stop="handleFocus(session.id)"
              @keydown.space.stop.prevent="handleFocus(session.id)"
            >
              <span class="focus-flash-glyph">?</span>
              <div class="focus-flash-body">
                <span class="focus-flash-line1">Answer Required</span>
                <span class="focus-flash-line2">
                  <span class="tname" v-text="session.activeTool ?? 'Question'"></span> · focus the session to answer
                </span>
              </div>
              <button class="focus-flash-tag focus-flash-tag-red" @click.stop="handleFocus(session.id)">Focus</button>
            </div>

            <!-- ====================================================================
                 R-D1 · CBSRTS · Communication Bar · relay-target selector strip.
                 Horizontal overflow-x button strip · one button per LIVE session ·
                 single-select · self-excludes the open row (CP-5 · LD-9) · clears
                 on send (OSSCSI). Pewter: per-button suite accent, viridian
                 selected-state highlight, D4 complement text-shadow. Renders only
                 when at least one OTHER live session exists. grid-column: 1/-1. -->
            <div
              v-if="relayCandidates(session.id).length > 0 && getPanelPhase(session) === 'idle'"
              class="srex-relay-bar"
            >
              <span class="srex-relay-label">Relay to:</span>

              <!-- RM-D4 · Element 3 · Full-identity toggle (Pewter §3.2 · Seam §0.1).
                   Governs the :title on every relay button below. showFullId is one
                   global, component-local, non-persisted ref. -->
              <button
                class="srex-fullid-toggle"
                type="button"
                :class="{ 'srex-fullid-toggle-on': showFullId }"
                :aria-pressed="showFullId ? 'true' : 'false'"
                aria-label="Toggle full session identity on hover"
                title="Show full ID + name on hover"
                @click.stop="showFullId = !showFullId"
              >⊙ ID</button>

              <div class="srex-relay-scroll">
                <button
                  v-for="cand in relayCandidates(session.id)"
                  :key="cand.id"
                  class="srex-relay-btn"
                  :class="{ 'srex-relay-btn-selected': relayTargetSessionId === cand.id }"
                  @click.stop="toggleRelayTarget(cand.id)"
                  :title="showFullId ? `${(cand.scsLabel?.trim() || cand.displayName?.trim()) ?? ''}\n${cand.id}` : null"
                >
                  <!-- RM-D4 · Element 2 · Communication label (DPCO · Seam §0.3).
                       scsLabel?.trim() || displayName?.trim() || shortId(id) replaces
                       the lossy 'session'. Named = body face; unnamed = mono + #
                       marker (CSS-driven). -->
                  <span
                    class="srex-relay-name"
                    :class="{ 'srex-relay-name-id': !(cand.scsLabel?.trim() || cand.displayName?.trim()) }"
                  >{{ cand.scsLabel?.trim() || cand.displayName?.trim() || shortId(cand.id) }}</span>
                </button>
              </div>
            </div>

            <!-- ====================================================================
                 D3RM-G · CBSE · Chat Bar SREX Extension · Pewter spec §3.2
                 Cobalt-tinted input (User direction) · Viridian send button (Model
                 handoff). SIGR-guarded · SWIO-gated · status-honest UX.
                 grid-column: 1/-1 spans full SREX width (consistent with CSHF).
                 RM-D3 · PLTH: hidden while any panel phase active; reverts on 'idle'.
                 ==================================================================== -->
            <div v-if="getPanelPhase(session) === 'idle'" class="srex-chat-bar">
              <div class="srex-chat-input-row">
                <ScsInput
                  type="text"
                  class="srex-chat-input"
                  v-model="chatDrafts[session.id]"
                  placeholder="Send a message to this session..."
                  :disabled="isChatSending || session.status !== 'launched'"
                  @keydown.enter.prevent="handleChatSubmit(session.id)"
                  @keydown.escape="handleChatBlur($event)"
                />
                <button
                  class="srex-chat-send-btn"
                  :disabled="
                    isChatSending ||
                    (chatDrafts[session.id] || '').trim() === '' ||
                    getSwioState(session) === 'working' ||
                    session.status !== 'launched'
                  "
                  @click="handleChatSubmit(session.id)"
                >{{ isChatSending && pendingChatSessionId === session.id ? 'SENDING…' : 'SEND' }}</button>
              </div>
              <div
                v-if="getChatStatusText(session.id)"
                class="srex-chat-status"
                :class="`srex-chat-status-${getChatStatus(session.id)}`"
              >{{ getChatStatusText(session.id) }}</div>
            </div>
            <!-- ============ END CBSE INSERTION ============ -->

            <div class="srex-row">
              <span class="srex-zone-label">Turn Phase</span>
              <span class="srex-zone-value">
                <template v-if="getSwioState(session) === 'working'">
                  <span class="swio-badge swio-badge-working">{{ BRIDGE_STATUS_COLORS.working.label }}</span>
                </template>
                <template v-else-if="getSwioState(session) === 'open'">
                  <span class="swio-badge swio-badge-open">{{ BRIDGE_STATUS_COLORS.open.label }}</span>
                </template>
                <template v-else>
                  <span class="srex-empty">—</span>
                </template>
              </span>
            </div>
            <div v-if="session.lastTool" class="srex-row">
              <span class="srex-zone-label">Last Tool Use</span>
              <span class="srex-zone-value">
                <span v-text="session.lastTool"></span>
                <span class="srex-ltut-ts"> · {{ formatTime(session.lastToolAt) }}</span>
              </span>
            </div>
            <div class="srex-row">
              <span class="srex-zone-label">Last Activity</span>
              <span class="srex-zone-value">{{ formatTime(session.lastActivityAt) }}</span>
            </div>
            <div class="srex-row">
              <span class="srex-zone-label">Last Submit</span>
              <span class="srex-zone-value">{{ formatTime(session.lastUserSubmitAt) }}</span>
            </div>
            <div class="srex-row">
              <span class="srex-zone-label">Session ID</span>
              <span class="srex-zone-value srex-session-id">{{ session.id }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
    </div>
    <!-- /SMSR SESSIONS COLUMN -->
  </div>
</template>

<style scoped>
/* THE PEWTER BRIGHTNESS PASS · the ONE tuning dial. All neutral/informational TEXT in
   the Manager reads WHITE with this high-mid brightness glow (was dim gray/low-alpha white).
   Semantic colored chips keep their hue but reference the same alpha range for their own
   hue-matched glow. Adjust the alpha here to re-tune the whole Manager's text luminance. */
.session-mgmt-root { display: flex; flex-direction: column; gap: 16px; padding: 16px; --pewter-text-glow: 1px 1px 2px rgba(255, 255, 255, 0.45); /* the slight-offset white shadow — the glance POP (user C-refine) */ --pewter-text-recede: rgba(255, 255, 255, 0.42); }
.session-mgmt-header { display: flex; flex-direction: column; gap: 4px; }
.session-mgmt-title {
  font-family: var(--font-heading); font-size: 18px; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase; margin: 0;
  /* STRATIDIAN MUXONOMY · THE RECEDE — chrome yields; the rows carry the glance. */
  color: var(--pewter-text-recede);
}
/* THE PEWTER BRIGHTNESS PASS · 'Live session registry' subtitle → white + high-mid glow. */
.session-mgmt-subtitle {
  font-family: var(--font-body); font-size: 13px; margin: 0;
  /* STRATIDIAN MUXONOMY · THE RECEDE — chrome yields; the rows carry the glance. */
  color: var(--pewter-text-recede);
}

/* SMSR · Split Recomposition · the display:contents identity element.
   In stack mode (no .session-mgmt-split) the two .smgmt-col wrappers render as
   display:contents — they vanish from the box tree entirely, so the header,
   status bar, pills and list sit as DIRECT flex children of .session-mgmt-root
   exactly as before the wrap. The page usage passes no `wide` prop → this is the
   default → byte-identical to the pre-split render. */
.smgmt-col { display: contents; }

/* Split mode (wide === true · popup usage): the root becomes a horizontal flex,
   the wrappers become real blocks and split 1/3 menu · 2/3 sessions. */
/* THE SCROLL INDEPENDENCE (wide mode) · Pewter · the split root fills the popup body's
   remaining height (the body is overflow:hidden + a definite height chain up to the panel's
   max-height 600px). height:100% + min-height:0 lets the two columns below own the scroll —
   each scrolls INDEPENDENTLY, so dragging the sessions list no longer drags the menu column. */
.session-mgmt-split {
  flex-direction: row;
  gap: 1.25rem;
  align-items: stretch;
  height: 100%;
  min-height: 0;
}
.session-mgmt-split .smgmt-col { display: block; }
/* The menu column no longer needs position:sticky (it does not scroll WITH the body any more).
   It gets its OWN overflow-y:auto (min-height:0) so a short viewport can still reach its lower
   controls — scrolling here is independent of the sessions column. */
.session-mgmt-split .smgmt-col-menu {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
/* The sessions column owns its OWN scroll (the columns own it, not the body). Thin Pewter
   scrollbar mirrors the popup's existing translucent-white thumb idiom (ScsBridgeSessionsPopup
   .sessions-popup-body::-webkit-scrollbar). */
.session-mgmt-split .smgmt-col-sessions {
  flex: 2 1 0;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.session-mgmt-split .smgmt-col-menu::-webkit-scrollbar,
.session-mgmt-split .smgmt-col-sessions::-webkit-scrollbar {
  width: 4px;
}
.session-mgmt-split .smgmt-col-menu::-webkit-scrollbar-track,
.session-mgmt-split .smgmt-col-sessions::-webkit-scrollbar-track {
  background: transparent;
}
.session-mgmt-split .smgmt-col-menu::-webkit-scrollbar-thumb,
.session-mgmt-split .smgmt-col-sessions::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.session-mgmt-split .smgmt-col-menu::-webkit-scrollbar-thumb:hover,
.session-mgmt-split .smgmt-col-sessions::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* ═══ SCP COMMAND · W2 · the helm management section ═══
   LAW · shares the menu column with the spawn controls; matches the Installation
   sub-page roster idioms (dir-keyed live badge · per-row Spawn/Focus) rendered in
   the SESSION MANAGEMENT Pewter idiom (dark glass · mono names · recede chrome). */
.scp-command-section {
  display: flex; flex-direction: column; gap: 0.5rem;
  padding: 0.75rem 0.9rem; border-radius: 6px;
}
.scp-command-head {
  display: flex; align-items: baseline; gap: 0.5rem;
}
.scp-command-title {
  font-family: var(--font-heading, 'Orbitron'); font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #ffffff; text-shadow: var(--pewter-text-glow);
}
.scp-command-count {
  font-family: var(--font-mono); font-size: 0.68rem;
  color: var(--pewter-text-recede);
}
.scp-command-empty {
  margin: 0; font-size: 0.7rem; color: var(--pewter-text-recede);
}
/* C621 · the two-row card — identity line (name + squared status chip) over a controls line.
   The 999px pill wrapped into a RING under the OSR (the offset the user flagged); the chip is
   SQUARED + nowrap so LIVE · :port holds one line beside the name. */
.scp-command-card {
  padding: 0.4rem 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.scp-command-row-id {
  display: flex; align-items: center; gap: 0.55rem;
}
.scp-command-row-controls {
  display: flex; align-items: center; gap: 0.45rem;
  padding-top: 0.35rem;
}
.scp-command-name {
  font-family: var(--font-mono); font-size: 0.76rem;
  color: #ffffff; text-shadow: var(--pewter-text-glow);
}
.scp-command-badge {
  border: 1px solid; border-radius: 0.25rem;
  font-family: var(--font-mono); font-size: 0.6rem;
  padding: 0.12rem 0.45rem;
  white-space: nowrap; line-height: 1.2;
}
.scp-command-spacer { flex: 1; }
.scp-command-btn {
  border: 1px solid; border-radius: 0.375rem;
  color: #ffffff; cursor: pointer;
  font-size: 0.68rem; padding: 0.28rem 0.8rem;
  transition: all 0.15s ease;
}
.scp-command-btn-spawn {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--color-cobalt, #3b82f6);
}
.scp-command-btn-focus {
  background: rgba(47, 158, 119, 0.12);
  border-color: var(--color-viridian, #2f9e77);
}
.scp-command-btn:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}
.scp-command-btn:disabled {
  opacity: 0.45; cursor: not-allowed;
}

/* ═══ W6b · THE SIMULATED LOADING BAR (SCM W6 · Spawn Window Focus + Simulated Loading Bar) ═══
   A compact dark-glass Pewter track with an indeterminate cobalt sweep — SIMULATED (it animates
   through the booting phase and unmounts when the SCP lands live). Sits under the identity row,
   above the controls. Matches the .scp-command-* dark-glass idioms (thin recessed track · cobalt
   accent · low-contrast base). Reads ONLY the controller spawn-progress state (survives page nav). */
.scp-command-bootbar {
  position: relative;
  height: 3px;
  margin: 0.3rem 0 0.1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.scp-command-bootbar-fill {
  position: absolute;
  top: 0; left: 0; height: 100%;
  width: 38%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0) 0%,
    var(--color-cobalt, #3b82f6) 50%,
    rgba(59, 130, 246, 0) 100%
  );
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
  animation: scp-command-bootbar-sweep 1.15s ease-in-out infinite;
}
@keyframes scp-command-bootbar-sweep {
  0%   { left: -40%; }
  100% { left: 100%; }
}

/* ═══ C652 · THE STAGED MULTIPLY BAR (the SCP's birth-from-the-worktree readout) ═══
   A compact three-tick segmented mini-bar sharing the .scp-command-bootbar dark-glass idiom (thin
   recessed track · cobalt accent). Ticks: pending (dim) · active (cobalt sweep) · done (solid cobalt) ·
   failed (maroon). The panel carries the MULTIPLY amethyst edge; the failed variant reddens honestly. */
.scp-command-panel-multiply-progress {
  flex-direction: column; align-items: stretch; gap: 6px;
  border-color: color-mix(in srgb, var(--color-amethyst, #8b5cf6) 40%, var(--color-board-light));
}
.scp-command-panel-multiply-progress.is-failed {
  border-color: color-mix(in srgb, var(--color-maroon, #be3c46) 50%, var(--color-board-light));
}
.scp-command-mstages {
  display: flex; align-items: center; gap: 6px; width: 100%;
}
.scp-command-mstage {
  position: relative; flex: 1 1 0;
  display: flex; flex-direction: column; gap: 3px;
}
.scp-command-mstage-fill {
  position: relative; overflow: hidden;
  height: 3px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}
/* DONE — solid cobalt track (the stage passed · the register/create beats confirmed observably). */
.scp-command-mstage.is-done .scp-command-mstage-fill {
  background: var(--color-cobalt, #3b82f6);
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.45);
}
/* ACTIVE — the indeterminate cobalt sweep (this stage is in flight · the same bootbar sweep). */
.scp-command-mstage.is-active .scp-command-mstage-fill::after {
  content: ''; position: absolute; top: 0; left: -40%; height: 100%; width: 38%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0) 0%,
    var(--color-cobalt, #3b82f6) 50%,
    rgba(59, 130, 246, 0) 100%
  );
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
  animation: scp-command-bootbar-sweep 1.15s ease-in-out infinite;
}
/* FAILED — maroon track (the honest inline stop · the failure line names the reason below). */
.scp-command-mstage.is-failed .scp-command-mstage-fill {
  background: var(--color-maroon, #be3c46);
  box-shadow: 0 0 5px rgba(190, 60, 70, 0.4);
}
.scp-command-mstage-label {
  font-family: var(--font-body); font-size: 9px;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--pewter-text-recede);
}
.scp-command-mstage.is-active .scp-command-mstage-label,
.scp-command-mstage.is-done .scp-command-mstage-label {
  color: var(--color-cobalt, #3b82f6);
}
.scp-command-mstage.is-failed .scp-command-mstage-label {
  color: var(--color-maroon, #be3c46);
}
.scp-command-mstage-failline {
  font-family: var(--font-mono, monospace); font-size: 10px;
  color: var(--color-maroon, #be3c46);
  word-break: break-word;
}

/* ═══ THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL · C632 restyle) ═══
   MULTIPLY = the additive HiFi YELLOW mark (the copy-and-paste glyph · "make another of this");
   EXIT = the HiFi BASE glass mark that transitions to HiFi RED on hover (the × now honestly means
   stop/close, not multiply); DELETE = the destructive maroon typed-name register. All ride the
   shared .scp-command-btn base. Spectrum tokens (var(--color-*)) per the Pewter idiom — no raw hex
   where a token exists (the rgba fills carry the token's rgb literal for the low-alpha glass). */
.scp-command-btn-multiply {
  background: rgba(234, 179, 8, 0.12);
  border-color: var(--color-yellow, #eab308);
  font-weight: 700; min-width: 1.9rem;
}
.scp-command-btn-multiply:hover:not(:disabled) {
  background: rgba(234, 179, 8, 0.22);
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.35);
}
/* SES · THE STOP RAIL (C632 · the EXIT ability). HiFi Base glass at rest → HiFi Red on hover —
   the × reads as a live exit affordance that reddens as a stop signal on approach. */
.scp-command-btn-exit {
  background: rgba(26, 26, 26, 0.55);
  border-color: var(--color-base-light, #1e1e1e);
  color: rgba(255, 255, 255, 0.82);
  font-weight: 700; min-width: 1.9rem;
  transition: all 0.15s ease;
}
.scp-command-btn-exit:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.18);
  border-color: var(--color-red, #ef4444);
  color: var(--color-red-light, #ff4e4e);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}
.scp-command-btn-delete {
  background: rgba(190, 60, 70, 0.12);
  border-color: var(--color-maroon, #be3c46);
}

/* THE INLINE PANEL — a compact drop below the row (MULTIPLY prompt · DELETE typed-name confirm).
   Pewter recessed field; the DELETE variant carries the destructive maroon edge. */
.scp-command-panel {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin: 2px 0 6px; padding: 8px 10px; border-radius: 6px;
  background: var(--color-board-elevated);
  border: 1px solid var(--color-board-light);
}
.scp-command-panel-delete {
  border-color: color-mix(in srgb, var(--color-maroon, #be3c46) 55%, var(--color-board-light));
  background: radial-gradient(ellipse at 20% 0%, rgba(190, 60, 70, 0.1) 0%, rgba(0, 0, 0, 0) 70%), var(--color-board-elevated);
}
.scp-command-panel-label,
.scp-command-panel-warn {
  font-family: var(--font-body); font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--pewter-text-recede);
}
.scp-command-panel-warn strong {
  color: var(--color-maroon, #be3c46);
  font-family: var(--font-mono, monospace); text-transform: none; letter-spacing: 0;
}
/* THE ATTRS-SIZING LAW — the wrapping div sizes ScsInput; NEVER a class on the component. */
.scp-command-panel-input {
  flex: 1 1 160px; min-width: 140px;
}
.scp-command-panel-actions {
  display: flex; align-items: center; gap: 6px; margin-left: auto;
}
.scp-command-panel-cancel,
.scp-command-panel-fire {
  border: 1px solid; border-radius: 0.375rem;
  color: #ffffff; cursor: pointer;
  font-size: 0.68rem; padding: 0.28rem 0.8rem;
  transition: all 0.15s ease;
}
.scp-command-panel-cancel {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-board-light);
  color: var(--pewter-text-recede);
}
.scp-command-panel-fire-multiply {
  background: rgba(139, 92, 246, 0.16);
  border-color: var(--color-amethyst, #8b5cf6);
}
/* THE ARMED→FIRE RED REGISTER — dim/disarmed until the typed name matches, then the maroon lights. */
.scp-command-panel-fire-delete {
  background: rgba(190, 60, 70, 0.1);
  border-color: color-mix(in srgb, var(--color-maroon, #be3c46) 45%, transparent);
  opacity: 0.7;
}
.scp-command-panel-fire-delete.is-armed {
  background: rgba(190, 60, 70, 0.28);
  border-color: var(--color-maroon, #be3c46);
  box-shadow: 0 0 10px rgba(190, 60, 70, 0.45);
  opacity: 1;
}
.scp-command-panel-fire:disabled,
.scp-command-panel-cancel:disabled {
  opacity: 0.4; cursor: not-allowed;
}
.scp-command-panel-fire:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

/* ═══ THE COMPACT FOOTER · W1 · details collapse ═══
   LAW · the three status cards become one row of small Pewter chips; every datum
   (Update · Bridge version · PPLD) survives as an inline label→value chip. */
.scp-command-footer {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 6px; flex-wrap: wrap;
  background: var(--color-board-elevated);
  border: 1px solid var(--color-board-light);
}
.scp-command-chip {
  display: inline-flex; align-items: baseline; gap: 0.35rem;
}
/* THE PEWTER BRIGHTNESS PASS · footer chips → recede label, mono value. */
.scp-command-chip-label {
  font-family: var(--font-body); font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  /* STRATIDIAN MUXONOMY · THE RECEDE — chrome yields; the rows carry the glance. */
  color: var(--pewter-text-recede);
}
.scp-command-chip-value {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.02em;
  color: var(--pewter-text-recede);
}

/* D3A · SCPP · SCP Filter Pills */
.scp-filter-pills {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}
.scp-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  /* THE PEWTER BRIGHTNESS PASS · pill label at rest → white + high-mid glow (hover + .active
     keep their cobalt affordance states below). */
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  cursor: pointer;
  transition: all 0.2s ease;
}
.scp-filter-pill:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--color-white-conductor, #f0f0f0);
}
.scp-filter-pill.active {
  background: rgba(var(--color-cobalt-rgb, 59, 130, 246), 0.15);
  border-color: rgba(var(--color-cobalt-rgb, 59, 130, 246), 0.4);
  color: var(--color-cobalt, #3b82f6);
}
.scp-filter-pill-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 0 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
}

/* D3A · SLRP + SCST + SISR + FJTC · Session List */
.session-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0.5rem;
}
/* D3E Diamond A · S7 vertical rhythm — gap between session-row-container entries */
.session-list-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.session-list-header {
  /* PVSR · grid retired — 3-zone flex mirrors the row: pinned actions+ID · scrollable
     middle · pinned toggle. fr-columns compressed under intrinsic content (the anchor
     row squeezed Engage to nothing; narrow panels clipped it off-screen entirely). */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-right: 2.5rem; /* the pinned-toggle reserve (matches the row) */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.session-col-header-actions {
  flex: 0 0 5.75rem;
}
.session-col-header-id {
  flex: 0 0 9rem;
}
.session-header-scroll {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden; /* header labels never scroll — the rows do */
}
.session-col-header {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  /* STRATIDIAN MUXONOMY · THE RECEDE — headers are wayfinding, not the glance. */
  color: var(--pewter-text-recede);
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: color 0.15s ease;
}
.session-col-header:hover {
  color: var(--color-white-conductor, #f0f0f0);
}
.session-col-header.session-col-header-static {
  cursor: default;
}
.sort-arrow {
  font-size: 0.55rem;
  opacity: 0.7;
}
/* D3E Diamond A · SRCR session row container.
   Outer boundary for each session entry. D5 1px secondary surface border.
   State-derived left-border color. */
.session-row-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-base-dark, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}
.session-row-container-working { border-left: 2px solid var(--color-cobalt); }
.session-row-container-open    { border-left: 2px solid var(--color-viridian); }
.session-row-container-allocated { border-left: 2px solid var(--color-amethyst, rgba(159,122,234,0.7)); }
.session-row-container-offline { border-left: 2px solid var(--color-maroon); opacity: 0.7; }
.session-row-container.saes-engaged { border-left: 2px solid var(--color-cobalt); }

/* R-D1 SCSE · S8CR · SRTR top row · 7-column grid (General) · PATC last cell.
   PTRD prune: cursor changed from zoom-in → default (row no longer click-target).
   HAZARD-G5: grid template atomic update mirrors .session-list-header above. */
.session-row-top {
  /* PVSR · 3-zone flex: [actions · id] pinned left — [scroll zone] — [toggle] pinned
     right over the fade. position:relative anchors the absolute toggle. */
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-right: 2.5rem; /* the pinned-toggle reserve — the scroll zone ends under it */
  font-size: 0.8rem;
  transition: background 0.15s ease;
  cursor: default;
}
/* PVSR · the pinned primary-verb cell — fixed width matching its header. */
.session-cell-actions {
  flex: 0 0 5.75rem;
}
.session-cell-id {
  flex: 0 0 9rem;
  min-width: 0;
  overflow: hidden;
}
/* PVSR · the scrollable middle — intrinsic-width cells, nothing squeezes anor clips.
   D8 thin scrollbar; the zone slides UNDER the pinned toggle's fade. */
.session-row-scroll {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}
.session-row-scroll::-webkit-scrollbar {
  height: 4px;
}
.session-row-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
}
.session-row-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.session-row-scroll > .session-cell {
  flex: 0 0 auto;
  white-space: nowrap;
}
/* R-D1 SCSE · GSRM · Specific mode: the Suite-8 cell is v-if'd out — flex needs no
   column-count mirror (the retired grid variant's sole purpose). */
/* A-D2 · DACM · Anchor column (visible in both modes). ⚓ = page-bound anchor · · = not. */
.session-cell-anchor {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
}
.session-cell-anchor .anchor-glyph {
  color: var(--color-viridian, #4fd1c5);
  font-size: 0.8rem;
  line-height: 1;
}
.session-cell-anchor .anchor-dot {
  color: rgba(255, 255, 255, 0.18);
}
/* A-D3b · ARFSP · "Set as Anchor" micro-button (Specific mode, non-anchor rows).
   Mirrors .session-rename-btn embossed micro-button styling; viridian hover signals
   anchor-capability. Hidden until the row is hovered. */
.session-set-anchor-btn {
  font-size: 0.6rem;
  line-height: 1;
  padding: 0.05rem 0.25rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.session-row-top:hover .session-set-anchor-btn,
.session-set-anchor-btn:focus-visible {
  opacity: 1;
}
.session-set-anchor-btn:hover:not(:disabled) {
  border-top:    1px solid var(--color-viridian-dark);
  border-right:  1px solid var(--color-viridian-dark);
  border-bottom: 1px solid var(--color-viridian-light);
  border-left:   1px solid var(--color-viridian-light);
  color: var(--color-viridian);
}
.session-set-anchor-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
.session-col-header-anchor {
  font-size: 0.8rem;
}
/* PDAB · Dissolution + Archival Diamond · per-row teardown micro-buttons.
   Embossed micro-button base (mirrors .session-set-anchor-btn). Visible at a muted
   baseline (these are the teardown affordance under test); full on row-hover. Archive
   = amber accent (recoverable move) · Dissipate = danger-red accent (deletes the real
   session). */
.session-archive-btn,
.session-dissipate-btn {
  font-size: 0.65rem;
  line-height: 1;
  margin-left: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.session-row-top:hover .session-archive-btn,
.session-row-top:hover .session-dissipate-btn,
.session-archive-btn:focus-visible,
.session-dissipate-btn:focus-visible {
  opacity: 1;
}
.session-archive-btn:hover:not(:disabled) {
  border-color: rgba(217, 164, 65, 0.6);
  color: #d9a441;
}
.session-dissipate-btn:hover:not(:disabled) {
  border-color: rgba(220, 90, 90, 0.6);
  color: #dc5a5a;
}
.session-archive-btn:disabled,
.session-dissipate-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
/* MD-ARC+C · Wave 7 · SESSION DELETE CONFIRM — compact inline expansion (Pewter RD §2.3). */
.session-delete-confirm {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 10px;
  background: radial-gradient(ellipse at 20% 0%, rgba(190, 60, 70, 0.1) 0%, rgba(0, 0, 0, 0) 70%),
              var(--color-board-elevated, #222228);
  border-top: 1px solid color-mix(in srgb, var(--color-maroon, #be3c46) 45%, transparent);
}
.session-delete-confirm-warn {
  font-family: var(--font-body, sans-serif);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.55);
  flex: 1;
}
.session-delete-confirm-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.session-confirm-cancel {
  border: 1px solid var(--color-board-light, #16161a);
  border-radius: 0.3rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.65rem;
  padding: 0.22rem 0.7rem;
  cursor: pointer;
}
.session-confirm-cancel:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.3);
}
.session-confirm-fire {
  border: 1px solid var(--color-maroon, #be3c46);
  border-radius: 0.3rem;
  background: rgba(190, 60, 70, 0.22);
  color: var(--color-red-light, #ff4e4e);
  font-size: 0.65rem;
  padding: 0.22rem 0.7rem;
  cursor: pointer;
}
.session-confirm-fire:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(190, 60, 70, 0.4);
}
.session-confirm-fire:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.session-row-top:hover {
  background: rgba(255, 255, 255, 0.02);
}
.session-row-container.saes-engaged .session-row-top {
  background: rgba(59, 130, 246, 0.04);
}
/* D3RM-G · PTRD prune · zoom-out cursor removed · row is no longer the click target */
.session-row-container.srex-expanded .session-row-top {
  background: rgba(255, 255, 255, 0.03);
}

/* D3E Diamond A · SRBR bottom Informative row (Option B: muted bg + border-top).
   Always visible — NOT toggled. Flex row: snippet fills, expand button right-anchors. */
.session-row-bottom {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.12);
  border-top: 1px solid var(--color-base-dark, rgba(0, 0, 0, 0.2));
  min-height: 1.5rem;
}

/* D3E Diamond A · MFTS mock final turn snippet.
   Diamond B will replace mock string with real session.finalTurnSummary slice. */
.final-turn-snippet {
  flex: 1;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.8125rem; /* +25% (0.65 × 1.25) — the model output reads at a glance (user) */
  /* THE PEWTER BRIGHTNESS PASS · the transcript-preview line → white + high-mid glow. */
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: var(--pewter-text-glow);
}

/* D3E Diamond A · HFEB expand button · D7 ghost variant.
   Diamond B wires real expand behavior. */
.hifi-expand-btn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.65rem;
  padding: 0.0625rem 0.3rem;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-left: 0.5rem;
}
/* HFEB · the Pewter flair — the chip is the open-and-type affordance: pewter warmth at rest,
   full pewter glow on hover (the caret is one click away). */
.hifi-expand-btn:not(.disabled) {
  border-color: rgba(200, 170, 120, 0.35);
  color: rgba(200, 170, 120, 0.75);
  text-shadow: 0 0 5px rgba(200, 170, 120, 0.3);
}
.hifi-expand-btn:not(.disabled):hover {
  border-color: rgba(200, 170, 120, 0.8);
  color: rgba(230, 205, 160, 1);
  background: rgba(200, 170, 120, 0.12);
  box-shadow: 0 0 8px rgba(200, 170, 120, 0.35);
}
.hifi-expand-btn:hover:not(.disabled) {
  border-color: var(--color-cobalt);
  color: var(--color-cobalt);
  box-shadow: 0 0 4px var(--shadow-cobalt, rgba(0, 0, 0, 0.4));
}
.hifi-expand-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
/* THE PEWTER BRIGHTNESS PASS · generic informational row cell → white + high-mid glow. */
.session-cell {
  display: flex;
  align-items: center;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
/* THE PEWTER BRIGHTNESS PASS · the session-id → white + high-mid glow. */
.session-cell-id {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.75rem;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
/* R-D1 SCSE · S8CR · Suite 8 column cell — mirrors session-cell-scp compact style.
   THE PEWTER BRIGHTNESS PASS · SEMANTIC ochre KEEPS its hue — raised to full saturation
   with a matching-hue (ochre) glow at the high-mid alpha. */
.session-cell-suite8 {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(204, 119, 34);
  text-shadow: 0 0 7px rgba(204, 119, 34, 0.38);
}
/* THE PEWTER BRIGHTNESS PASS · the timestamp / final-turn column → white + high-mid glow. */
.session-cell-final-turn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.65rem;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-status-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-family: var(--font-heading, 'Orbitron');
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
/* THE PEWTER BRIGHTNESS PASS · SEMANTIC status chips KEEP their hue — raised to the
   full-saturation light variant with a matching-hue glow at the high-mid alpha (0.38),
   so OPEN/green · allocated/cobalt · archived/amethyst · OFFLINE/maroon all read bright. */
.session-status-badge-launched {
  background: rgba(94, 165, 73, 0.15);
  color: #7ed15f;
  border: 1px solid rgba(94, 165, 73, 0.3);
  text-shadow: 0 0 7px rgba(94, 165, 73, 0.38);
}
.session-status-badge-allocated {
  background: rgba(59, 130, 246, 0.15);
  color: #5b9dff;
  border: 1px solid rgba(59, 130, 246, 0.3);
  text-shadow: 0 0 7px rgba(59, 130, 246, 0.38);
}
.session-status-badge-archived {
  background: rgba(159, 122, 234, 0.15);
  color: #b79bf5;
  border: 1px solid rgba(159, 122, 234, 0.3);
  text-shadow: 0 0 7px rgba(159, 122, 234, 0.38);
}
.session-status-badge-offline {
  background: rgba(180, 83, 99, 0.15);
  color: #d97182;
  border: 1px solid rgba(180, 83, 99, 0.3);
  text-shadow: 0 0 7px rgba(180, 83, 99, 0.38);
}
/* C2 SLSA · Suite 8 "Calling" chip (Ochre) — rendered INSIDE the scp cell so the
   6-column session-row grid stays intact (no new grid cell). */
.suite8-calling-chip {
  display: inline-block;
  margin-left: 6px;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-family: var(--font-heading, 'Orbitron');
  letter-spacing: 0.04em;
  background: rgba(204, 119, 34, 0.18);
  /* THE PEWTER BRIGHTNESS PASS · SEMANTIC ochre "Calling" chip KEEPS its hue —
     full-saturation + matching-hue glow at the high-mid alpha. */
  color: #e08c33;
  border: 1px solid rgba(204, 119, 34, 0.35);
  text-shadow: 0 0 7px rgba(204, 119, 34, 0.38);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}
/* THE PEWTER BRIGHTNESS PASS · empty-list notice → white + high-mid glow. */
.session-list-empty {
  text-align: center;
  padding: 2rem;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  font-size: 0.75rem;
}

/* THE TWO-SECTION SPLIT (re-landed C543) · slim section rule above each section's
   header row. ONLINE = viridian accent (the live sessions) · OFFLINE = maroon accent
   (the rest). The offline label row IS the divider — an extra top margin visually
   separates the offline section from the online one above it. Pewter voice: Orbitron
   uppercase, RECEDE-toned count with a hue-keyed accent bar. */
.session-section-label {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem 0.25rem;
  margin-top: 0.25rem;
  border-left: 3px solid transparent;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.session-section-label-text {
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.session-section-label-count {
  /* STRATIDIAN MUXONOMY · THE RECEDE — the count is wayfinding, not the glance. */
  color: var(--pewter-text-recede);
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
}
/* D-SJP · the OFFLINE pager — lives in the label row, RECEDE-toned like the count
   (wayfinding, not the glance); the arrows brighten on hover, dim when pinned at
   either end. */
.session-pager {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-left: auto;
  flex-shrink: 0;
}
.session-pager-btn {
  background: transparent;
  border: 1px solid var(--pewter-text-recede);
  border-radius: 3px;
  color: var(--pewter-text-recede);
  font-family: var(--font-mono, monospace);
  font-size: 0.68rem;
  line-height: 1;
  padding: 0.1rem 0.4rem;
  cursor: pointer;
}
.session-pager-btn:hover:not(:disabled) {
  color: #ffffff;
  border-color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.session-pager-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.session-pager-info {
  color: var(--pewter-text-recede);
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
}
.session-section-label-online {
  border-left-color: var(--color-viridian);
}
.session-section-label-online .session-section-label-text {
  color: var(--color-viridian);
}
.session-section-label-offline {
  border-left-color: var(--color-maroon);
  /* THE DIVIDER GAP · the offline label row separates OFFLINE from ONLINE above. */
  margin-top: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.session-section-label-offline .session-section-label-text {
  color: var(--color-maroon);
}
/* Per-section empty notice (ONLINE · 0 when every session is offline) — softer
   than the whole-list empty (smaller · less pad). */
.session-list-empty-section {
  padding: 0.75rem;
  font-size: 0.7rem;
  opacity: 0.85;
}

/* C655 · MEND B · THE HELM GROUPING — the SCP COMMAND section labels MIRROR the
   sessions .session-section-label family (small caps · Orbitron uppercase · the
   colored left tick · RECEDE-toned count). ONLINE = viridian · OFFLINE = maroon.
   Slimmer horizontal padding suits the narrower helm column. */
.scp-command-section-label {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem 0.25rem;
  margin-top: 0.25rem;
  border-left: 3px solid transparent;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.scp-command-section-label-text {
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.scp-command-section-label-count {
  /* STRATIDIAN MUXONOMY · THE RECEDE — the count is wayfinding, not the glance. */
  color: var(--pewter-text-recede);
  font-family: var(--font-mono, monospace);
  font-size: 0.6rem;
}
.scp-command-section-label-online {
  border-left-color: var(--color-viridian);
}
.scp-command-section-label-online .scp-command-section-label-text {
  color: var(--color-viridian);
}
.scp-command-section-label-offline {
  border-left-color: var(--color-maroon);
  /* THE DIVIDER GAP · the offline label row separates OFFLINE from ONLINE above. */
  margin-top: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.scp-command-section-label-offline .scp-command-section-label-text {
  color: var(--color-maroon);
}

/* THE PEWTER BRIGHTNESS PASS · wire-in informational label → white + high-mid glow. */
.wire-in-label {
  font-family: var(--font-mono); font-size: 9px; margin-left: 4px;
  /* STRATIDIAN MUXONOMY · THE RECEDE — chrome yields; the rows carry the glance. */
  color: var(--pewter-text-recede);
}

/* ===========================================================================
 * D3D Wave-2 · Pewter Tessera Design Tokens · R3-D §S2-S6+S9
 * All colors via var(--color-*) tokens or BRIDGE_STATUS_COLORS access pattern.
 * Zero new hex literals · component-scoped CSS only.
 * =========================================================================== */

/* R3-D §S2 · Spawn Button · D7 cobalt primary variant.
   Header-level placement (R7 B1). Sticky in popup wrapper (R3-D §S7). */
/* MD-9 · D-MC-3 · Per-Instance Model Control · the model dropdown (Pewter-neutral tooling
   chrome — the model picker is system tooling, not a suite-keyed action, so it wears the
   neutral pewter/muted treatment rather than a suite color). */
/* THE ENLARGED SELECTION ROW · the Model + Suite 8 dropdowns each own a FULL row,
   scaled up by 2/3 (trigger 0.75rem→1.25rem · padding 0.4/0.6rem→0.67/1rem); the
   former inline "Model"/"Suite 8" text becomes the LABEL TO that row (stacked above,
   unchanged small-caps pewter). Shared classes — one rule set covers both rows. */
.spawn-model-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  margin-top: 8px;
  position: relative; /* MD-9 · anchor for the absolutely-positioned in-DOM drawer */
}
.spawn-model-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-pewter, rgba(255, 255, 255, 0.55));
}
/* MD-9 · THE DROPDOWN COMPONENT · the model picker now delegates its trigger/drawer/row chrome
   to ScsDropdown (offscreen-safe · unscoped-inline CSS travels with the component). The prior
   inline .spawn-model-trigger / .spawn-model-drawer / .spawn-model-row-btn styles are retired.
   The dropdown fills its OWN row (the enlarged selection row). */
.spawn-model-dropdown {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
}
/* The 2/3 scale rides :deep onto the component's unscoped chrome — trigger + drawer rows
   grow together so the open drawer matches its enlarged trigger; the drawer viewport
   widens its cap so the larger rows still show several options. */
.spawn-model-dropdown :deep(.scs-dropdown-trigger) {
  font-size: 1.25rem;
  padding: 0.67rem 1rem;
  width: 100%;
}
.spawn-model-dropdown :deep(.scs-dropdown-row) {
  padding: 0.67rem 1rem;
}
.spawn-model-dropdown :deep(.scs-dropdown-row-label) {
  font-size: 1.2rem;
}
.spawn-model-dropdown :deep(.scs-dropdown-row-hint) {
  font-size: 0.97rem;
}
.spawn-model-dropdown :deep(.scs-dropdown-drawer) {
  max-height: 300px;
}

/* MD-9 · D-MC-3 · the recorded per-instance model tag on a session row (small · muted · pewter). */
.session-model-tag {
  display: inline-block;
  margin-left: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  padding: 1px 5px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 3px;
  vertical-align: middle;
  opacity: 0.75;
}

.spawn-session-row {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 4px 0;
}
.spawn-session-btn {
  font-family: var(--font-heading, 'Orbitron');
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.6rem 1.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  background: var(--color-cobalt);
  border-top: 2px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-right: 2px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 2px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  border-left: 2px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  box-shadow: -2px 2px 6px var(--shadow-cobalt, rgba(0, 0, 0, 0.4));
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7); /* D4 amber-orange complement of cobalt */
  cursor: pointer;
}
.spawn-session-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}
.spawn-session-btn:active:not(:disabled) {
  border-top: 2px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  border-right: 2px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  border-bottom: 2px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-left: 2px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.3);
}
.spawn-session-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.spawn-session-btn.spawning {
  opacity: 0.7;
}

/* ===========================================================================
 * SSP · D-SSP.3 · Suite-8 Spawn Picker drawer (Pewter · SSP-PEWTER-DESIGN.md §3).
 * Composed entirely from existing tokens — zero new hex literals, zero new
 * --color-* tokens. Pane = .hifi-pane-base (template class). Head/rows reuse the
 * .scp-filter-pill geometry + .active state + .scp-filter-pill-count chip.
 * =========================================================================== */
.s8-picker-drawer {
  margin-top: 8px;
  border-radius: 6px;
  padding: 6px;
}
.s8-picker-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}
.s8-picker-head:hover:not(.is-disabled) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--color-white-conductor, #f0f0f0);
}
.s8-picker-head.is-open {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.85);
}
.s8-picker-head.is-disabled,
.s8-picker-head:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.s8-picker-chevron {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.7rem;
}
.s8-picker-chevron.is-open {
  transform: rotate(90deg);
}
.s8-picker-head-label {
  flex: 1;
  text-align: left;
}
.s8-picker-count {
  text-transform: none;
  letter-spacing: 0;
}
.s8-picker-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 4px 4px;
}
.s8-roster {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
}
/* Self-contained scroll cosmetics (the design-system .custom-scrollbar class is
   not present in this SCP) — uses the same translucent-white idiom as the pills. */
.s8-roster::-webkit-scrollbar {
  width: 4px;
}
.s8-roster::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
.s8-roster-inflight {
  opacity: 0.45;
  pointer-events: none;
}
.s8-roster-row {
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-transform: none;
  letter-spacing: 0;
  text-align: left;
}
.s8-roster-row-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.s8-roster-name {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.04em;
}
/* THE PEWTER BRIGHTNESS PASS · roster snippet (informational) → white + high-mid glow. */
.s8-roster-snippet {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  white-space: normal;
  line-height: 1.3;
}
.s8-selected-echo {
  margin: 0;
}
.s8-spawn-row {
  position: static;
  margin-top: 0;
  padding: 0;
}
.s8-helper {
  margin: 0;
}

/* R3-D §S3 · Engage Row Affordance · D7 secondary transparent variant.
   Non-active Engage buttons render at full opacity, interactive — the
   saes-blocked de-emphasis class was pruned (it dimmed interactive buttons
   so they read as "blocked"). Focus-target cue lives on the row border
   (.session-row-container.saes-engaged) instead. */
.engage-session-btn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.4rem 0.75rem;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  /* STRATIDIAN MUXONOMY · the ENGAGE label IS the glance. */
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: 0.5rem;
  white-space: nowrap;
}
.engage-session-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-cobalt);
  color: var(--color-cobalt);
}
.engage-session-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.engage-session-btn-engaged {
  background: var(--color-cobalt);
  border-color: var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
  pointer-events: none;
  cursor: default;
}

/* D3RM-E · FBSR · Focus Button Session Row · red HiFi variant (Pewter D7
   Button Variant System + D4 Complementary Text Shadow).
   Mirrors .engage-session-btn geometry (D6 mono font · D7 ghost transparent).
   The FOCUS action is the priority affordance on a launched/engaged row, so
   the button carries a RED accent at rest to DRAW THE EYE (functional red,
   NOT error-red): D7 token consumption via --color-red / --color-red-light,
   D4 text-shadow uses the color-wheel complement of red (0deg) → cyan (180deg)
   at 0.7 alpha. Resting border+text in suite red; hover brightens to the
   light variant with a transparent red wash. All colors via var() tokens or
   the D4 cyan complement rgba. */
.focus-session-btn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.4rem 0.75rem;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid var(--color-red);
  color: var(--color-red);
  text-shadow: 0.5px 0.5px 0 rgba(59, 217, 246, 0.7); /* D4 cyan complement of red */
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: 0.5rem;
  white-space: nowrap;
}
.focus-session-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
  border-color: var(--color-red-light);
  color: var(--color-red-light);
  text-shadow: 0.5px 0.5px 0 rgba(59, 217, 246, 0.7);
}
.focus-session-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* R3-D §S3 · SAES-engaged visual now on .session-row-container.saes-engaged (D3E Diamond A).
   Engagement border + top-row tint moved to SRCR container selectors above. */

/* R3-D §S3 · The focus-target signal is carried solely by the row border
   (.session-row-container.saes-engaged). Other rows are NOT dimmed — the
   engage button .saes-blocked de-emphasis was pruned so non-active Engage
   buttons stay full-opacity and interactive. */

/* R3-D §S4-S5 · SWIO Badge · HAZARD-Z three-value discriminated.
   D5 embossed borders · D6 mono font · D4 complement text-shadow.
   Pulse animation OPACITY-ONLY for WORKING (R3-D §S4 + CD-5 SWIO-working-pulse). */
.swio-badge {
  display: inline-block;
  margin-left: 0.375rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  vertical-align: baseline;
}
.swio-badge-working {
  background: rgba(59, 130, 246, 0.18); /* cobalt tint — established alpha-tint precedent */
  border-top: 1px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-right: 1px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  border-left: 1px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7); /* D4 amber complement */
  animation: swio-pulse 1.5s ease-in-out infinite;
}
.swio-badge-open {
  background: rgba(94, 165, 73, 0.15); /* viridian tint */
  border-top: 1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-right: 1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  border-left: 1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.7); /* D4 magenta complement */
}
@keyframes swio-pulse {
  0%, 100% { opacity: 0.85; }
  50%      { opacity: 1.0; }
}

/* R3-D §S6 · SREX drawer · inset D5 secondary surface (hifi-pane-base inlined).
   Pressed/recessed appearance signals subordinate information zone.
   D3E: .srex-expanded cursor now on .session-row-container.srex-expanded .session-row-top. */
.session-srex-zone {
  display: grid;
  grid-template-columns: minmax(120px, 0.6fr) 1fr;
  row-gap: 0.5rem;
  column-gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-base-dark, rgba(0, 0, 0, 0.2));
  border-right: 1px solid var(--color-base-dark, rgba(0, 0, 0, 0.2));
  border-bottom: 1px solid var(--color-base-light, rgba(255, 255, 255, 0.1));
  border-left: 1px solid var(--color-base-light, rgba(255, 255, 255, 0.1));
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.18);
  text-shadow: 0.5px 0.5px 0 rgba(200, 170, 120, 0.4);
  /* THE FULL EXPANSION (user · the tight Y-cutoff dies): the drawer grows to its CONTENT and
     DISPLACES the rows below — no max-height, no internal scroll. The inner zones (chat · perm
     input · roster) keep their own bounded scrolls; the drawer itself is fully visible. */
  animation: srex-expand 0.15s ease-out;
}
.srex-row {
  display: contents;
}
/* THE PEWTER BRIGHTNESS PASS · SREX zone label → white + high-mid glow. */
.srex-zone-label {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  align-self: start;
  padding-top: 2px;
}
.srex-zone-value {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}
.srex-summary-text {
  white-space: pre-wrap;
  line-height: 1.4;
}
.srex-session-id {
  opacity: 0.55;
  font-size: 0.6rem;
  word-break: break-all;
}
.srex-empty {
  font-style: italic;
  opacity: 0.45;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.6rem;
}

/* D3G Refinement · Chat-Style HiFi Pewter Render of Last Exchange.
   Spans full SREX width (grid-column 1/-1) · stacked User+Model chat bubbles.
   D5 embossed borders · D4 complement text-shadow on role labels.
   User accent = cobalt · Model accent = viridian. */
.srex-chat-exchange {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.srex-chat-turn {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.25);
  border-top: 1px solid var(--color-base-dark, rgba(0, 0, 0, 0.25));
  border-right: 1px solid var(--color-base-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-base-light, rgba(255, 255, 255, 0.08));
  border-left: 3px solid transparent;
  max-height: 7rem;
  overflow-y: auto;
}
.srex-chat-turn-user {
  border-left-color: var(--color-cobalt);
}
.srex-chat-turn-model {
  border-left-color: var(--color-viridian);
}
/* THE PEWTER BRIGHTNESS PASS · neutral chat-role label → white + high-mid glow (the
   user/model variants below override to their cobalt/viridian suite accents). */
.srex-chat-role {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.srex-chat-turn-user .srex-chat-role {
  color: var(--color-cobalt);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.5);
}
.srex-chat-turn-model .srex-chat-role {
  color: var(--color-viridian);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.5);
}
.srex-chat-content {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.75rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  white-space: pre-wrap;
  word-break: break-word;
}
.srex-chat-turn::-webkit-scrollbar {
  width: 3px;
}
.srex-chat-turn::-webkit-scrollbar-track {
  background: transparent;
}
.srex-chat-turn::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}
.session-srex-zone::-webkit-scrollbar {
  width: 4px;
}
.session-srex-zone::-webkit-scrollbar-track {
  background: transparent;
}
.session-srex-zone::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
@keyframes srex-expand {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===========================================================================
 * D3RM-G · Diamond G Enhancement Set · Pewter Tessera Spec
 * PATC: Pewter Arrow Toggle Column · 6th-column expand affordance
 * CBSE: Chat Bar SREX Extension · cobalt-tinted user input + viridian-send
 * SRRX: SREX Render Extension · vertical stack with CSHF unchanged
 * Zero new hex literals · all values via var() tokens or established rgba precedents.
 * Citation: D3RM-G-FOUNDATION-TEAL-CLAUDE-PEWTER-DESIGN.md §§1-3 + §7.3
 * =========================================================================== */

/* PATC · Toggle button cell + button */
.session-cell-toggle {
  /* PVSR · PINNED over the right edge — the scroll zone slides UNDER this cell.
     The fade edge keeps the caret readable while the passing content stays visible
     beneath it; every row is expandable in every state at every width. */
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.5rem 0 1.5rem;
  background: linear-gradient(to right, rgba(20, 20, 20, 0) 0%, rgba(20, 20, 20, 0.88) 55%);
  pointer-events: none; /* the fade never blocks the scroll zone... */
}
.session-cell-toggle .session-toggle-btn {
  pointer-events: auto; /* ...the button itself always takes the press */
}
.session-toggle-btn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.4);
}
.session-toggle-btn:hover:not(:disabled) {
  border-top:    1px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  color: var(--color-cobalt);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}
.session-toggle-btn-expanded {
  border-top:    1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  color: var(--color-viridian);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.7);
}
.session-toggle-btn-expanded:hover {
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.85);
  box-shadow: 0 0 4px rgba(94, 165, 73, 0.3);
}
.session-toggle-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* CBSE · Chat Bar SREX Extension */
.srex-chat-bar {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.srex-chat-input-row {
  display: flex;
  align-items: stretch;
  gap: 0;
}
.srex-chat-input {
  flex: 1;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.65rem;
  line-height: 1.5;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.25);
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-left:   3px solid var(--color-cobalt);
  color: rgba(255, 255, 255, 0.85);
  outline: none;
  transition: box-shadow 0.15s ease;
}
.srex-chat-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}
.srex-chat-input:focus {
  box-shadow:
    inset 3px 0 0 var(--color-cobalt),
    0 0 6px rgba(59, 130, 246, 0.25);
}
.srex-chat-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.srex-chat-send-btn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  margin-left: 0.5rem;
  flex-shrink: 0;
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.4);
}
.srex-chat-send-btn:hover:not(:disabled) {
  border-top:    1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  color: var(--color-viridian);
  background: rgba(94, 165, 73, 0.06);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.7);
}
.srex-chat-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
/* THE PEWTER BRIGHTNESS PASS · neutral chat-status hint → white + high-mid glow (the
   queued/sending/sent/error variants below keep their suite hues). */
.srex-chat-status {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.55rem;
  color: #ffffff;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
  letter-spacing: 0.05em;
  text-shadow: var(--pewter-text-glow);
  min-height: 0.85rem;
  transition: opacity 0.2s ease;
}
.srex-chat-status-queued  { color: var(--color-cobalt); }
.srex-chat-status-sending {
  color: var(--color-cobalt);
  animation: swio-pulse 1.5s ease-in-out infinite;
}
.srex-chat-status-sent    { color: var(--color-viridian); }
.srex-chat-status-error   {
  color: var(--color-maroon);
  text-shadow: 0.5px 0.5px 0 rgba(94, 165, 73, 0.4);
}

/* ===========================================================================
 * R-D1 · CBSRTS · Communication Bar (relay-target selector)
 * Pewter: per-button accent, selected-state viridian highlight, D5 emboss,
 * D4 magenta-complement text-shadow. overflow-x scroll. grid-column 1/-1.
 * Reuses the established in-component viridian-tint literal (94, 165, 73) via
 * --color-viridian-rgb fallback (V-2) + the D4 magenta complement (200, 68, 168).
 * Zero new hex beyond approved tokens/fallback.
 * =========================================================================== */
.srex-relay-bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
/* THE PEWTER BRIGHTNESS PASS · Communication-bar relay label → white + high-mid glow. */
.srex-relay-label {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  white-space: nowrap;
  flex-shrink: 0;
  text-shadow: var(--pewter-text-glow);
}
.srex-relay-scroll {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 0.125rem;
}
.srex-relay-scroll::-webkit-scrollbar { height: 3px; }
.srex-relay-scroll::-webkit-scrollbar-track { background: transparent; }
.srex-relay-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
.srex-relay-btn {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem;
  border-radius: 0.25rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.4);
}
.srex-relay-btn:hover:not(.srex-relay-btn-selected) {
  border-top:    1px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-cobalt-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-cobalt-light, rgba(255, 255, 255, 0.25));
  color: var(--color-cobalt);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}
.srex-relay-btn-selected {
  background: rgba(var(--color-viridian-rgb, 94, 165, 73), 0.18);
  border-top:    1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  color: var(--color-viridian);
  font-weight: 700;
  box-shadow: 0 0 4px rgba(94, 165, 73, 0.3);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.7); /* D4 magenta complement of viridian */
}

/* ===========================================================================
 * RM-D3 · Permission Panel + ATID flash + FSSF Focus-card.
 * Ported from the Pewter mock-up (RM-D3-PERMISSION-PANEL-MOCKUP.html), adapted
 * to the SREX 2-column grid: each panel root spans grid-column 1 / -1.
 * Suite-coherent: viridian=allow/go · cobalt=persistent-allow · maroon=deny ·
 * fuchsia=blocking-panel · yellow=answer-focus. Tokens via var(--color-*).
 * AAFV linger = CSS-only animation (note 4 · no JS linger Map · no HAZARD-Z drift).
 * =========================================================================== */

/* --- PRMX badges on the collapsed row header --- */
.swio-badge-permission {
  background: rgba(236, 72, 153, 0.18); /* fuchsia tint */
  border-top:    1px solid var(--color-fuchsia-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-fuchsia-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-fuchsia-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-fuchsia-light, rgba(255, 255, 255, 0.25));
  color: var(--color-fuchsia-light, #ff53b0);
  text-shadow: 0.5px 0.5px 0 rgba(72, 236, 155, 0.7); /* spring-green complement */
  animation: swio-pulse 1.4s ease-in-out infinite;
}
.swio-badge-answer {
  background: rgba(234, 179, 8, 0.18); /* yellow tint */
  border-top:    1px solid var(--color-yellow-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-yellow-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-yellow-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-yellow-light, rgba(255, 255, 255, 0.25));
  color: var(--color-yellow-light, #ffce09);
  text-shadow: 0.5px 0.5px 0 rgba(8, 63, 234, 0.6);
  animation: swio-pulse 1.4s ease-in-out infinite;
}

/* --- The blocking permission panel (fuchsia-cast embossed pane) --- */
.perm-panel {
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem 0.95rem 0.95rem;
  border-radius: 5px;
  background-image:
    radial-gradient(ellipse at 87.5% 12.5%, var(--color-fuchsia) 0%, var(--fade-fuchsia) 88%);
  border-top: 2px solid var(--color-fuchsia-dark);
  border-right: 2px solid var(--color-fuchsia-dark);
  border-bottom: 2px solid var(--color-fuchsia-light);
  border-left: 2px solid var(--color-fuchsia-light);
  box-shadow: -3px 3px 0 var(--shadow-fuchsia), 0 0 0 1px rgba(0, 0, 0, 0.3);
  text-shadow: 0.5px 0.5px 0 rgba(72, 236, 155, 0.7);
  animation: srex-expand 0.15s ease-out;
}
.perm-panel-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.perm-blocking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-fuchsia-light);
  box-shadow: 0 0 6px var(--color-fuchsia-light);
  flex-shrink: 0;
  animation: perm-block-pulse 1.4s ease-in-out infinite;
}
@keyframes perm-block-pulse {
  0%, 100% { opacity: 0.65; box-shadow: 0 0 4px var(--color-fuchsia-light); }
  50%      { opacity: 1; box-shadow: 0 0 10px var(--color-fuchsia-light); }
}
.perm-panel-title {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
}
.perm-lock-glyph {
  font-size: 0.7rem;
  color: #fff;
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.4));
}
.perm-mode-chip {
  margin-left: auto;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.8);
  text-shadow: none;
}
.perm-tool-chip {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.55rem 0.65rem;
  border-radius: 4px;
  background: rgba(13, 13, 15, 0.82);
  border-top: 2px solid rgba(255, 255, 255, 0.08);
  border-right: 2px solid rgba(255, 255, 255, 0.08);
  border-bottom: 2px solid rgba(0, 0, 0, 0.5);
  border-left: 2px solid rgba(0, 0, 0, 0.5);
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.45);
  text-shadow: none;
}
.perm-tool-name-row { display: flex; align-items: center; gap: 0.5rem; }
/* THE PEWTER BRIGHTNESS PASS · permission tool label → white + high-mid glow. */
.perm-tool-label {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.perm-tool-name {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-fuchsia-light);
  text-shadow: 0.5px 0.5px 0 rgba(72, 236, 155, 0.6);
}
.perm-tool-input {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.62rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  padding: 0.4rem 0.55rem;
  border-left: 2px solid var(--color-fuchsia);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 7rem;
  overflow-y: auto;
}
.perm-tool-input::-webkit-scrollbar { width: 4px; }
.perm-tool-input::-webkit-scrollbar-track { background: transparent; }
.perm-tool-input::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }
.perm-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.perm-btn {
  font-family: var(--font-heading, 'Orbitron');
  font-weight: 600;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.45rem 0.9rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #fff;
}
.perm-btn:hover:not(:disabled) { transform: scale(0.97); }
.perm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
/* PSTK · THE QUEUED STRIP · items 1..N-1 beneath the head pane · no buttons, landing order.
 * Muted fuchsia (behind the active head) — the head answers first, the strip is the backlog. */
.perm-queue-strip {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.15rem;
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  background: rgba(13, 13, 15, 0.55);
  border-top: 1px solid rgba(236, 72, 153, 0.22);
  border-left: 2px solid var(--color-fuchsia-dark, rgba(236, 72, 153, 0.4));
  text-shadow: none;
}
.perm-queue-strip-head {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.5rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
}
.perm-queue-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.2rem 0.35rem;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.32);
}
.perm-queue-tool {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--color-fuchsia-light, #ff53b0);
  flex-shrink: 0;
}
.perm-queue-input {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.56rem;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.perm-btn-allow {
  background-image: radial-gradient(ellipse at 87.5% 12.5%, var(--color-viridian) 0%, var(--fade-viridian) 88%);
  border-top: 2px solid var(--color-viridian-dark);
  border-right: 2px solid var(--color-viridian-dark);
  border-bottom: 2px solid var(--color-viridian-light);
  border-left: 2px solid var(--color-viridian-light);
  box-shadow: -2px 2px 6px var(--shadow-viridian);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.6);
}
.perm-btn-always {
  background-image: radial-gradient(ellipse at 87.5% 12.5%, var(--color-cobalt) 0%, var(--fade-cobalt) 88%);
  border-top: 2px solid var(--color-cobalt-dark);
  border-right: 2px solid var(--color-cobalt-dark);
  border-bottom: 2px solid var(--color-cobalt-light);
  border-left: 2px solid var(--color-cobalt-light);
  box-shadow: -2px 2px 6px var(--shadow-cobalt);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.6);
}
.perm-btn-deny {
  background-image: radial-gradient(ellipse at 87.5% 12.5%, var(--color-maroon) 0%, var(--fade-maroon) 88%);
  border-top: 2px solid var(--color-maroon-dark);
  border-right: 2px solid var(--color-maroon-dark);
  border-bottom: 2px solid var(--color-maroon-light);
  border-left: 2px solid var(--color-maroon-light);
  box-shadow: -2px 2px 6px var(--shadow-maroon);
  text-shadow: 0.5px 0.5px 0 rgba(96, 237, 219, 0.6);
}

/* --- AAFV · auto-approved / active-tool flash (green pulse + ring sweep) --- */
.auto-flash {
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  /* The working graphic stands at 16/9 of its prior ~3rem content height — the 8/3 doubling-
     plus-a-third, then minus a third (user-tuned · the tool-call card reads at a glance). */
  min-height: 5.333rem;
  border-radius: 5px;
  background-image: radial-gradient(ellipse at 87.5% 12.5%, var(--color-viridian) 0%, var(--fade-viridian) 88%);
  border-top: 2px solid var(--color-viridian-dark);
  border-right: 2px solid var(--color-viridian-dark);
  border-bottom: 2px solid var(--color-viridian-light);
  border-left: 2px solid var(--color-viridian-light);
  box-shadow: -3px 3px 0 var(--shadow-viridian);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.6);
  overflow: hidden;
  /* AAFV min-visibility (note 4): the entry animation runs once for a perceptible
     flash even when PreTool→PostTool is sub-frame; the glow loops while active. */
  animation: srex-expand 0.15s ease-out, auto-flash-glow 1.6s ease-in-out infinite;
}
@keyframes auto-flash-glow {
  0%, 100% { box-shadow: -3px 3px 0 var(--shadow-viridian); }
  50%      { box-shadow: -3px 3px 14px rgba(19, 213, 148, 0.7); }
}
.auto-flash::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 16px;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  border-radius: 50%;
  border: 2px solid var(--color-viridian-light);
  transform: scale(0.4);
  opacity: 0.9;
  animation: auto-ring 1.6s ease-out infinite;
  pointer-events: none;
}
@keyframes auto-ring {
  0%   { transform: scale(0.4); opacity: 0.9; }
  70%  { transform: scale(2.6); opacity: 0; }
  100% { transform: scale(2.6); opacity: 0; }
}
.auto-flash-glyph {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(13, 13, 15, 0.8);
  border: 1.5px solid var(--color-viridian-light);
  color: var(--color-viridian-light);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  text-shadow: none;
}
.auto-flash-body { display: flex; flex-direction: column; gap: 1px; line-height: 1.2; min-width: 0; }
.auto-flash-line1 {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
}
.auto-flash-tool {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.auto-flash-tool .tname { color: var(--color-viridian-light); font-weight: 700; }
.auto-flash-tag {
  margin-left: auto;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.8);
  text-shadow: none;
  flex-shrink: 0;
}

/* --- FSSF · Focus-card (amber answer-required ring) --- */
.focus-flash {
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 5px;
  background: rgba(13, 13, 15, 0.85);
  animation: srex-expand 0.15s ease-out;
}
.focus-flash-glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.45);
}
.focus-flash-body { display: flex; flex-direction: column; gap: 2px; line-height: 1.25; }
.focus-flash-line1 {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.focus-flash-line2 {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.7);
}
.focus-flash-line2 .tname { font-weight: 700; }
.focus-flash-ask {
  border: 2px solid var(--color-yellow-dark);
  animation: srex-expand 0.15s ease-out, focus-ring-yellow 1.2s ease-in-out infinite;
}
.focus-flash-ask .focus-flash-glyph { border: 1.5px solid var(--color-yellow-light); color: var(--color-yellow-light); }
.focus-flash-ask .focus-flash-line1 { color: var(--color-yellow-light); text-shadow: 0.5px 0.5px 0 rgba(8, 63, 234, 0.6); }
.focus-flash-ask .focus-flash-line2 .tname { color: var(--color-yellow-light); }
@keyframes focus-ring-yellow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.5); border-color: var(--color-yellow-dark); }
  50%      { box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.08), 0 0 12px rgba(234, 179, 8, 0.5); border-color: var(--color-yellow-light); }
}
.focus-flash-tag {
  margin-left: auto;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.15s ease;
}
.focus-flash-tag:hover {
  border-color: var(--color-yellow-light);
  color: var(--color-yellow-light);
}

/* Live-Lambda refinements ·  Change 2: Focus button RED (mirrors .focus-session-btn) */
.focus-flash-tag-red {
  border-color: var(--color-red);
  color: var(--color-red);
  text-shadow: 0.5px 0.5px 0 rgba(59, 217, 246, 0.7);
}
.focus-flash-tag-red:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: var(--color-red-light);
  color: var(--color-red-light);
  text-shadow: 0.5px 0.5px 0 rgba(59, 217, 246, 0.7);
}

/* Change 3: Whole focus-card bar is clickable */
.focus-flash-clickable {
  cursor: pointer;
}
.focus-flash-clickable:hover {
  background: rgba(20, 17, 12, 0.9);
  box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.2);
}

/* Change 1: ATID viridian pane — tool-chip inset block for full visibility */
.auto-flash-tool-chip {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.2rem;
  padding: 0.3rem 0.45rem;
  border-radius: 3px;
  background: rgba(13, 13, 15, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  border-left: 2px solid var(--color-viridian);
  text-shadow: none;
}
.auto-flash-tool-name {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-viridian-light);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.5);
}
.auto-flash-tool-input {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.58rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.82);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 3.5rem;
  overflow-y: auto;
}

/* ===========================================================================
 * RM-D4 · Session Rename + Communication Identity (Pewter HiFi · §1-§3).
 * Element 1 = inline pencil-edit in the ID cell; Element 2 = relay-button
 * communication label (DSRF); Element 3 = full-identity toggle. All consume
 * existing tokens (--color-cobalt*, --color-yellow*, --font-body, --font-mono)
 * and the existing border-pair / emboss-inversion / complementary text-shadow
 * conventions. Citation: RM-D4-R3-PEWTER-ARCHITECTURE.md §1.2/§2.2/§3.3.
 * =========================================================================== */

/* --- Element 1 · ID cell lays label + glyph on one line, glyph on row hover. --- */
.session-cell-id {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Named label reads in the body face (human name); unnamed fallback stays in
   the mono ID grammar with a dimmed # marker (named-vs-unnamed orthogonality). */
.session-id-label {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 14ch;
}
.session-id-label-named {
  font-family: var(--font-body, 'Inter', sans-serif);
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 0.01em;
}
.session-id-label:not(.session-id-label-named)::before {
  content: '#';
  opacity: 0.4;
  margin-right: 1px;
}

/* The pencil glyph — embossed micro-button, hidden until the row is hovered. */
.session-rename-btn {
  font-size: 0.6rem;
  line-height: 1;
  padding: 0.05rem 0.25rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease,
              border-color 0.15s ease, text-shadow 0.15s ease;
  /* RM-D4 · GPAH · viridian (green) complement, hover-reveal only — NOT a focus
     target; hover signals rename-capability constructively. */
  text-shadow: 0.5px 0.5px 0 rgba(225, 70, 146, 0.3); /* magenta complement of viridian */
}
/* Reveal on row hover; full reveal on focus for keyboard users. */
.session-row-top:hover .session-rename-btn,
.session-rename-btn:focus-visible {
  opacity: 1;
}
.session-rename-btn:hover {
  border-top:    1px solid var(--color-viridian-dark);
  border-right:  1px solid var(--color-viridian-dark);
  border-bottom: 1px solid var(--color-viridian-light);
  border-left:   1px solid var(--color-viridian-light);
  color: var(--color-viridian);
  text-shadow: 0.5px 0.5px 0 rgba(225, 70, 146, 0.7); /* magenta complement of viridian */
}
.session-rename-btn:active {
  border-top:    1px solid var(--color-viridian-light);
  border-right:  1px solid var(--color-viridian-light);
  border-bottom: 1px solid var(--color-viridian-dark);
  border-left:   1px solid var(--color-viridian-dark);
}

/* The inline edit input — mirrors the chat input's cobalt left-accent. */
.session-rename-input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 0.65rem;
  line-height: 1.4;
  padding: 0.15rem 0.35rem;
  border-radius: 0.2rem;
  background: rgba(0, 0, 0, 0.3);
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-left:   3px solid var(--color-cobalt);
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  transition: box-shadow 0.15s ease;
}
.session-rename-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
}
.session-rename-input:focus {
  box-shadow:
    inset 3px 0 0 var(--color-cobalt),
    0 0 6px rgba(59, 130, 246, 0.25);
}

/* --- Element 2 · Communication label — name-else-short-ID, truncated. --- */
.srex-relay-name {
  display: inline-block;
  max-width: 14ch;            /* ~16 glyphs incl. ellipsis at 0.58rem mono */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  /* Override-form (N4 · :has() avoided): named branch defaults to body face;
     the unnamed branch overrides to mono below. Universally supported. */
  font-family: var(--font-body, 'Inter', sans-serif);
}
/* Unnamed branch: monospace ID grammar + quiet # marker, slightly dimmed. */
.srex-relay-name-id {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  opacity: 0.85;
}
.srex-relay-name-id::before {
  content: '#';
  opacity: 0.45;
  margin-right: 1px;
}

/* --- Element 3 · Full-identity toggle — micro-button in the relay bar header. --- */
.srex-fullid-toggle {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.1rem 0.4rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.3);
}
.srex-fullid-toggle:hover {
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  border-left:   1px solid rgba(255, 255, 255, 0.3);
}
/* ON state = pressed-in emboss inversion + amber accent. */
.srex-fullid-toggle-on {
  background: rgba(234, 179, 8, 0.12);
  border-top:    1px solid var(--color-yellow-dark);
  border-right:  1px solid var(--color-yellow-dark);
  border-bottom: 1px solid var(--color-yellow-light);
  border-left:   1px solid var(--color-yellow-light);
  color: var(--color-yellow);
  text-shadow: 0.5px 0.5px 0 rgba(8, 63, 234, 0.6); /* blue-violet complement of yellow */
}

/* ===========================================================================
 * PMA · Pending-Model Working-Animation (Sub-Diamond #596)
 * Variant: SHIMMER-SWEEP — gradient sweeps L→R through glyph fill (background-clip: text).
 * Seam: (.session-row-container-working .final-turn-snippet) — zero template change.
 * Secondary: .srex-chat-status-queued — same keyframe, dimmer highlight, passive read.
 * =========================================================================== */

@keyframes pma-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* --- Primary: 'Processing turn...' shimmer while session is working --- */
.session-row-container-working .final-turn-snippet {
  opacity: 0.9;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.55) 0%,
    rgba(200, 220, 255, 0.95) 50%,
    rgba(59, 130, 246, 0.55) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: pma-shimmer 1.4s linear infinite;
}

/* --- Secondary: 'Message queued · awaiting Claude turn' — passive wait, dimmer --- */
.srex-chat-status-queued {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.35) 0%,
    rgba(150, 185, 255, 0.75) 50%,
    rgba(59, 130, 246, 0.35) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: pma-shimmer 1.4s linear infinite;
}

/* --- prefers-reduced-motion: static dimmed cobalt indicator, no motion --- */
@media (prefers-reduced-motion: reduce) {
  .session-row-container-working .final-turn-snippet {
    animation: none;
    background: none;
    color: rgba(59, 130, 246, 0.75);
    -webkit-text-fill-color: rgba(59, 130, 246, 0.75);
    opacity: 0.85;
  }
  .srex-chat-status-queued {
    animation: none;
    background: none;
    color: rgba(59, 130, 246, 0.5);
    -webkit-text-fill-color: rgba(59, 130, 246, 0.5);
  }
}

/* ===========================================================================
 * PMA-NR · Synthetic 'No response requested.' → animated 'Model Processing'
 * Origin: Claude Code synthetic assistant turn ("model":"<synthetic>") in the
 * JSONL · surfaced via lastTurnExtraction → transcriptSnippet · detected in
 * getMockSnippet (isModelProcessingPlaceholder). This placeholder gets BOTH the
 * shimmer sweep AND an animated dot-dot-dot — independent of the working state.
 * =========================================================================== */
@keyframes pma-dots {
  0%   { content: ''; }
  25%  { content: '.'; }
  50%  { content: '..'; }
  75%  { content: '...'; }
}

.final-turn-snippet--processing {
  opacity: 0.9;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.55) 0%,
    rgba(200, 220, 255, 0.95) 50%,
    rgba(59, 130, 246, 0.55) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: pma-shimmer 1.4s linear infinite;
}

/* Animated trailing dots · own cobalt fill (parent text is gradient-clipped). */
.final-turn-snippet--processing::after {
  content: '...';
  color: rgba(120, 170, 255, 0.95);
  -webkit-text-fill-color: rgba(120, 170, 255, 0.95);
  animation: pma-dots 1.4s steps(1, end) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .final-turn-snippet--processing {
    animation: none;
    background: none;
    color: rgba(59, 130, 246, 0.75);
    -webkit-text-fill-color: rgba(59, 130, 246, 0.75);
  }
  .final-turn-snippet--processing::after {
    animation: none;
    content: '…';
  }
}

/* ===========================================================================
 * PMA-NR (SREX) · the SAME Model-Processing animation inside the expanded
 * Last-Exchange MODEL turn. RM-D4: user-requested — the Specific Animation
 * occurs in the model turn of the last turn section, not only the SRBR snippet.
 * Reuses the pma-shimmer sweep + pma-dots cycle; overrides the base
 * .srex-chat-content color so the gradient text-clip shows through.
 * =========================================================================== */
.srex-chat-content--processing {
  opacity: 0.9;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.55) 0%,
    rgba(200, 220, 255, 0.95) 50%,
    rgba(59, 130, 246, 0.55) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: pma-shimmer 1.4s linear infinite;
}

/* Animated trailing dots · own cobalt fill (parent text is gradient-clipped). */
.srex-chat-content--processing::after {
  content: '...';
  color: rgba(120, 170, 255, 0.95);
  -webkit-text-fill-color: rgba(120, 170, 255, 0.95);
  animation: pma-dots 1.4s steps(1, end) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .srex-chat-content--processing {
    animation: none;
    background: none;
    color: rgba(59, 130, 246, 0.75);
    -webkit-text-fill-color: rgba(59, 130, 246, 0.75);
  }
  .srex-chat-content--processing::after {
    animation: none;
    content: '…';
  }
}

/* ==========================================================================
   SAC.2 · Session Anchor Control trio (Pewter · SAC-PEWTER-DESIGN.md).
   Expanded-section button parity + un-anchor + anchor hover + resting chip.
   Zero new color — every value maps to an existing token or an already-in-
   component approved rgba literal (the D4 complement / alpha-tint set · §5).
   ========================================================================== */

/* SAC · §1.3 · SREX Engagement parity bar · full-width action row at the top of
   the SREX zone. Layout-only wrapper — every button inside reuses its existing
   top-row class, so no new color/emboss is introduced here. */
.srex-engagement-bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-base-light, rgba(255, 255, 255, 0.1));
}
/* THE PEWTER BRIGHTNESS PASS · SREX engagement-bar label → white + high-mid glow. */
.srex-engagement-label {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  margin-right: 0.25rem;
  flex-shrink: 0;
}
/* In the expanded bar the teardown cluster floats right of the primary cluster. */
.srex-engagement-bar .srex-teardown-lead { margin-left: auto; }
/* The mirrored buttons are full-opacity at rest here (they are NOT hover-revealed
   like the dense top-row micro-buttons — the expanded zone is the deliberate
   action surface). Override the row-hover opacity gating for this context only. */
.srex-engagement-bar .session-archive-btn,
.srex-engagement-bar .session-dissipate-btn,
.srex-engagement-bar .session-set-anchor-btn,
.srex-engagement-bar .session-rename-btn,
.srex-engagement-bar .session-unanchor-btn { opacity: 1; }

/* SAC · §2.2 · Un-anchor micro-button · embossed (mirrors .session-set-anchor-btn
   geometry), maroon accent = release/withdraw the page binding (recoverable ·
   distinct from the red-danger Dissipate). In the collapsed anchor cell it is
   hover-revealed; in the SREX engagement bar it is full-opacity (overridden above). */
.session-unanchor-btn {
  font-size: 0.6rem;
  line-height: 1;
  padding: 0.05rem 0.3rem;
  margin-left: 0.25rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  opacity: 0;                       /* collapsed-cell resting state */
  transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  text-shadow: 0.5px 0.5px 0 rgba(96, 237, 219, 0.4); /* D4 cyan complement of maroon (perm-btn-deny precedent) */
}
.session-cell-anchor:hover .session-unanchor-btn,
.session-unanchor-btn:focus-visible { opacity: 1; }
.session-unanchor-btn:hover:not(:disabled) {
  border-top:    1px solid var(--color-maroon-dark);
  border-right:  1px solid var(--color-maroon-dark);
  border-bottom: 1px solid var(--color-maroon-light);
  border-left:   1px solid var(--color-maroon-light);
  color: var(--color-maroon-light);
  text-shadow: 0.5px 0.5px 0 rgba(96, 237, 219, 0.7);
}
.session-unanchor-btn:active:not(:disabled) {
  border-top:    1px solid var(--color-maroon-light);
  border-right:  1px solid var(--color-maroon-light);
  border-bottom: 1px solid var(--color-maroon-dark);
  border-left:   1px solid var(--color-maroon-dark);
}
.session-unanchor-btn:disabled { cursor: not-allowed; opacity: 0.3; }
/* SAC · §2.3 · Armed (awaiting confirm) state — visible maroon fill so the user sees it is primed. */
.session-unanchor-btn.is-arming {
  opacity: 1;
  background: rgba(159, 18, 57, 0.18);  /* maroon tint · matches the established alpha-tint precedent */
  border-top:    1px solid var(--color-maroon-dark);
  border-right:  1px solid var(--color-maroon-dark);
  border-bottom: 1px solid var(--color-maroon-light);
  border-left:   1px solid var(--color-maroon-light);
  color: var(--color-maroon-light);
}

/* SAC · §3.2 · Anchor hover indicator · embossed base-pane tooltip on the ⚓ marker.
   Pure-CSS hover popover (no JS) — appears on anchor-cell hover/focus-within.
   Reuses the base emboss border-pair + the established near-black surface; no new color. */
.session-cell-anchor { position: relative; }   /* positioning context for the popover */
.anchor-hover-indicator {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  z-index: 5;
  min-width: 9rem;
  max-width: 16rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0.4rem 0.55rem;
  border-radius: 4px;
  background: rgba(13, 13, 15, 0.92);
  border-top:    1px solid var(--color-base-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-base-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-base-light, rgba(255, 255, 255, 0.1));
  border-left:   2px solid var(--color-viridian);  /* viridian = the anchor's own accent (matches .anchor-glyph) */
  box-shadow: -2px 2px 6px rgba(0, 0, 0, 0.5);
  text-shadow: 0.5px 0.5px 0 rgba(200, 170, 120, 0.4);
  opacity: 0;
  transform: translateY(2px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.session-cell-anchor:hover .anchor-hover-indicator,
.session-cell-anchor:focus-within .anchor-hover-indicator {
  opacity: 1;
  transform: translateY(0);
}
/* THE PEWTER BRIGHTNESS PASS · anchor hover-popover label → white + high-mid glow. */
.anchor-hover-label {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.55rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.anchor-hover-value {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.7rem;
  color: var(--color-viridian-light);
  word-break: break-word;
}
/* THE PEWTER BRIGHTNESS PASS · anchor hover-popover context → white + high-mid glow. */
.anchor-hover-context {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.6rem;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}

/* SAC · §4.1 · Anchor-state resting chip · viridian (matches the anchor glyph) ·
   the auto-anchor "this row is the anchor" signal. Reuses the established chip
   geometry + alpha-tint idiom (cf. .suite8-calling-chip / .swio-badge-open) with
   viridian tokens — no new color. */
.anchor-state-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(16, 185, 129, 0.15);            /* viridian tint · same alpha-tint precedent as .swio-badge-open */
  border-top:    1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-right:  1px solid var(--color-viridian-dark, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  border-left:   1px solid var(--color-viridian-light, rgba(255, 255, 255, 0.25));
  color: var(--color-viridian-light);
  text-shadow: 0.5px 0.5px 0 rgba(200, 68, 168, 0.5); /* D4 magenta complement of viridian (already used in-component) */
  white-space: nowrap;
}
.anchor-state-chip .anchor-glyph { font-size: 0.75rem; line-height: 1; }

/* SAC.5 · the inactive OUTLINE ⚓ drop-anchor — present on every page session that is NOT the
   anchor. Always visible (hollow stroke = inactive); click drops anchor (singleton reassignment).
   Zero new color: the stroke is the existing white emboss, brightening to viridian on hover. */
.session-drop-anchor-btn {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0.1rem 0.3rem;
  cursor: pointer;
  line-height: 1;
}
.anchor-glyph--outline {
  font-size: 0.85rem;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.42);
  opacity: 0.7;
  transition: -webkit-text-stroke-color 0.12s ease, opacity 0.12s ease;
}
.session-drop-anchor-btn:hover:not(:disabled) .anchor-glyph--outline,
.session-drop-anchor-btn:focus-visible .anchor-glyph--outline {
  -webkit-text-stroke-color: rgba(16, 185, 129, 0.85);
  opacity: 1;
}
.session-drop-anchor-btn:disabled { cursor: not-allowed; opacity: 0.4; }
.session-drop-anchor-label {
  margin-left: 0.32rem;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: var(--color-white-conductor, #b5ad9f);
  opacity: 0.72;
}
.session-drop-anchor-btn:hover:not(:disabled) .session-drop-anchor-label { opacity: 1; }

/* ===========================================================================
 * SAC.4 · Anchor System control + the rounded-pill Auto toggle + the panel.
 * (Pewter · SAC-PEWTER-ANCHOR-SYSTEM.md · zero new color — every value is an
 *  existing Pewter component-local hex, a --color-viridian* token, the
 *  established viridian tint, or the in-component amber #d9a441.)
 * =========================================================================== */

/* §1.1 · the row control cluster — positioning context for the panel popover. */
.anchor-system-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.3rem;
  /* §2.5 · hover-reveal discipline — muted at rest in the collapsed cell, full on row-hover. */
  opacity: 0.6;
  transition: opacity 0.15s ease;
}
.session-row-top:hover .anchor-system-control,
.anchor-system-control:focus-within {
  opacity: 1;
}
/* §8.3 · in the SREX engagement bar the cluster is full-opacity (deliberate action surface). */
.srex-engagement-bar .anchor-system-control--srex { opacity: 1; }

/* §2.6 · the cog button — geometry-clone of .session-set-anchor-btn · viridian hover. */
.anchor-cog-btn {
  font-size: 0.6rem;
  line-height: 1;
  padding: 0.05rem 0.25rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.anchor-cog-btn:hover:not(:disabled) {
  border-top:    1px solid var(--color-viridian-dark);
  border-right:  1px solid var(--color-viridian-dark);
  border-bottom: 1px solid var(--color-viridian-light);
  border-left:   1px solid var(--color-viridian-light);
  color: var(--color-viridian);
}
.anchor-cog-btn:disabled { cursor: not-allowed; opacity: 0.3; }

/* §1.2 · the short flanking "Auto" label (D6 mono · matches the image's RB/DEC flanks). */
/* THE PEWTER BRIGHTNESS PASS · Anchor "Auto" flank label → white + high-mid glow. */
.anchor-auto-label {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  flex-shrink: 0;
}

/* §2 · the rounded-pill Auto toggle — white knob slides on a dark recessed groove
 *  (the "Round8 Calculators" sliding idiom). <button role="switch">; the knob slides
 *  via translateX; ON = viridian-tinted track + viridian emboss pair (the anchor accent).
 *  Every value is an existing Pewter hex or the viridian token/tint — zero new color. */
.anchor-auto-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 0;
}
/* §2.1 · the recessed groove track (deep Pewter base #0e0c08 + the recess emboss pair). */
.anchor-auto-pill__track {
  position: relative;
  display: inline-block;
  width: 1.85rem;      /* §2.2 · ~30px · calculator-scale */
  height: 0.95rem;     /* §2.2 · ~15px */
  border-radius: 999px;
  background: #0e0c08;  /* the menu deep base · .menu-stub / .menu-option-kind background */
  border-top:    1px solid #4a4338;  /* recess pair · pressed-in groove */
  border-right:  1px solid #4a4338;
  border-bottom: 1px solid #8a8276;
  border-left:   1px solid #8a8276;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.45);
  transition: background 0.18s ease, border-color 0.18s ease;
}
/* §2.1 · the raised white knob (#efe2bb · INVERTED emboss pair = raised disc · D5). */
.anchor-auto-pill__knob {
  position: absolute;
  top: 0.125rem;        /* §2.2 · inset */
  left: 0.125rem;
  width: 0.7rem;        /* §2.2 · ~11px */
  height: 0.7rem;
  border-radius: 50%;
  background: #efe2bb;   /* the menu badge light highlight · warm white (the image's knob) */
  border-top:    1px solid #efe2bb;  /* INVERTED (raised) pair · light top/left */
  border-left:   1px solid #efe2bb;
  border-bottom: 1px solid #a8975e;  /* dark bottom/right */
  border-right:  1px solid #a8975e;
  box-shadow: -1px 1px 2px rgba(0, 0, 0, 0.45);
  /* §2.1 · the slide · travel = track − knob − (2 × inset). */
  transform: translateX(0);
  transition: transform 0.18s ease;
}
/* §2.3 · ON state — knob slides right · track gets the viridian tint + viridian emboss
 *  pair (the .srex-fullid-toggle-on inversion idiom, recolored to the anchor's viridian).
 *  The knob stays #efe2bb (the image's knob never changes color — only its position). */
.anchor-auto-pill--on .anchor-auto-pill__track {
  background: rgba(16, 185, 129, 0.22);  /* viridian tint · the .swio-badge-open / anchor-chip precedent */
  border-top:    1px solid var(--color-viridian-dark);
  border-right:  1px solid var(--color-viridian-dark);
  border-bottom: 1px solid var(--color-viridian-light);
  border-left:   1px solid var(--color-viridian-light);
}
.anchor-auto-pill--on .anchor-auto-pill__knob {
  /* travel = 1.85rem − 0.7rem − (2 × 0.125rem) = 0.9rem */
  transform: translateX(0.9rem);
}
.anchor-auto-pill:disabled { opacity: 0.4; cursor: not-allowed; }
.anchor-auto-pill:focus-visible { outline: 1px solid var(--color-viridian); outline-offset: 2px; }

/* §3.1 · the override dot — amber #d9a441 (the in-component Archive/recoverable accent),
 *  top-right of the pill · ONLY when isOverridden ("a user value, distinct from the default"). */
.anchor-auto-override-dot {
  position: absolute;
  top: -0.1rem;
  right: -0.25rem;
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
  background: #d9a441;   /* amber · the existing in-component recoverable accent */
  box-shadow: 0 0 2px rgba(217, 164, 65, 0.6);
  pointer-events: none;
}

/* §4 · the Anchor System panel — a Pewter popover (sibling surface of ShatteriteMenu ·
 *  the SAME near-black embossed palette · viridian left-accent matching the anchor glyph). */
.anchor-system-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 10;
  min-width: 15rem;
  max-width: 20rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: 6px;
  background: #14110c;   /* the menu surface */
  border-top:    2px solid #5b5347;  /* the menu emboss pair */
  border-right:  2px solid #5b5347;
  border-bottom: 2px solid #a9a196;
  border-left:   2px solid var(--color-viridian);  /* viridian left-accent · the anchor's own accent */
  box-shadow: -3px 3px 0 rgba(91, 83, 71, 0.4), -2px 2px 8px rgba(0, 0, 0, 0.5);
  cursor: default;
}
.anchor-system-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.anchor-system-panel__title {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #d8c79a;   /* the menu gold header accent */
  text-shadow: 0.5px 0.5px 0 rgba(60, 70, 90, 0.7);
}
.anchor-system-panel__close {
  font-size: 0.85rem;
  line-height: 1;
  padding: 0 0.2rem;
  background: transparent;
  border: none;
  color: #b5ad9f;
  cursor: pointer;
  transition: color 0.15s ease;
}
.anchor-system-panel__close:hover { color: #ece6da; }
.anchor-system-panel__page {
  margin: 0;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.68rem;
  color: #b5ad9f;
}
.anchor-system-panel__divider {
  height: 1px;
  background: #5b5347;
  margin: 0.1rem 0;
}
/* The Auto-anchor / readout / status rows — label-value grammar (SREX style · D6 mono). */
.anchor-system-row,
.anchor-default-readout,
.anchor-override-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.anchor-system-row-label {
  flex-shrink: 0;
  min-width: 6rem;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #b5ad9f;
}
.anchor-system-state-word,
.anchor-system-value {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 0.72rem;
  font-weight: 700;
  color: #ece6da;
}
/* §3.2 · amber when the user has overridden (matches the dot + Reset accent). */
.anchor-system-value--overridden { color: #d9a441; }

/* §4 · Reset-to-page-default — embossed micro-button · amber accent (clears the override). */
.anchor-reset-btn {
  align-self: flex-start;
  font-size: 0.65rem;
  line-height: 1;
  padding: 0.3rem 0.55rem;
  border-radius: 0.2rem;
  background: transparent;
  border-top:    1px solid rgba(0, 0, 0, 0.25);
  border-right:  1px solid rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  color: #d9a441;   /* amber · the resettable / recoverable accent */
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.anchor-reset-btn:hover:not(:disabled) {
  border-color: rgba(217, 164, 65, 0.6);
  color: #d9a441;   /* amber · matches the .session-archive-btn hover precedent (zero new color) */
}
.anchor-reset-btn:disabled { cursor: not-allowed; opacity: 0.4; }
.anchor-system-panel__hint {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.7rem;
  line-height: 1.5;
  color: #b5ad9f;
}

/* C832 · SEAT 2 (Pewter) · the SCP Management button — its own row, the column order held. */
.smgmt-scpm-row {
  margin: 0.55rem 0 0.2rem;
  display: flex;
}
.smgmt-scpm-btn {
  font-size: 0.72rem;
  padding: 0.4rem 0.95rem;
}
</style>
