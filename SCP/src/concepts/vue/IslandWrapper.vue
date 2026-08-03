<script setup lang="ts">
/**
 * Island Wrapper - Tier 2 Client Application
 *
 * Root Vue app that wraps concept landings (islands).
 * Provides global component hooks that ClientMuxium can inject.
 *
 * 3-Tier Architecture:
 * - Tier 1: Base SSR Shell (static HTML)
 * - Tier 2: Island Wrapper (THIS - client Vue root)
 * - Tier 3: Concept Landings (hotloaded children)
 *
 * Responsibilities:
 * - Create and provide notification controller
 * - Mount NotificationPopup (global, persists across page turns)
 * - Dynamically load concept landings
 * - Maintain global component state across island changes
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: 3-Tier Application Architecture Discovery
 */
import {
  nextTick,
  provide,
  ref,
  shallowRef,
  computed,
  watch,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  type Component,
} from 'vue';
import NotificationPopup from '../notification/vue/NotificationPopup.vue';
import {
  createNotificationController,
  setGlobalNotificationController,
  clearGlobalNotificationController,
  NOTIFICATION_CONTROLLER_KEY,
  type NotificationController,
} from '../notification/notificationController';
// Cycle 159 D1 · GRGL dual registration · CSCM Client Muxium adoption (IUPA)
import {
  createScsBridgeController,
  setGlobalScsBridgeController,
  clearGlobalScsBridgeController,
  SCS_BRIDGE_CONTROLLER_KEY,
  type ScsBridgeController,
} from '../scsBridge/scsBridgeController';
// D-T-MUX · Default-Muxium Fallback. IslandWrapper arms a DEFAULT client muxium
// (BASE_CONCEPTS only · [] page concepts → scsBridge + gitm base deck) so Hard-
// Turn-Over dispatch resolves on pages whose Landing never binds (e.g.
// SuiteCascadeLanding). Precedent: GitmLanding.vue createClientMuxiumInstance.
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../client/client.muxonomy';
import type { Muxium } from 'stratimux';
// GITM A↔B Refinement (#641-R) · W4 — the global read-only gitm controller (reactive gitmJson).
import {
  createGitmController,
  setGlobalGitmController,
  clearGlobalGitmController,
  GITM_CONTROLLER_KEY,
} from '../gitm/gitmController';
import { isWorkingBranchPer } from '../gitm/gitm.type';
// STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · C637) — the SPARKS register (RED · the
// Compromise) mounted at the hard-turn-over trigger so the standby wears its honest color from the
// click (the Sword-B button mounts SWORD at ITS click the same way).
import { showBridgeStandby } from '../webSocketClient/model/bridgeStandbyOverlay.model';
import { writeGitmTurnoverProgress, GITM_TURNOVER_DEADLINE_MS } from '../../model/gitmTurnover.model';
// E13 fix · Cycle 160 R3 · TaskBar + popup hosted here (client-hydrated tree)
// Shell.vue is SSR-only; all interactive Vue bindings dead there per R7 Rose diagnosis
import TaskBar from './shell/components/TaskBar.vue';
import ScsBridgeSessionsPopup from '../scsBridge/vue/components/ScsBridgeSessionsPopup.vue';
// THE-TURN-OVER-A-GUARD — the intrusive center-vision confirmation modal (Teleports to body ·
// opened by the turn-over-a branch when working changes exist · runs the two-call safeguard).
import GitmTurnOverAConfirmModal from '../scsBridge/vue/components/GitmTurnOverAConfirmModal.vue';
// RESTORED — the proven sole-fuchsia ScsBridgeTurnOverButton (plain SCP hard-restart · pre-#641).
import ScsBridgeTurnOverButton from '../scsBridge/vue/components/ScsBridgeTurnOverButton.vue';
// MD-8 D-NM-2 · THE CREATE OVERLAY — mounted in the ONLY client-hydrated tree (E13 law). Opened by
// a delegated document-level click on the sidebar's synthetic [data-concept="suite8-mint"] entry.
import Suite8CreateOverlay from '../suite8/vue/components/Suite8CreateOverlay.vue';
// D-RB · THE NAVBAR ROTARY BARREL — the client barrel island. Teleported into the SSR-static
// .sidebar-nav on hydration (that container exists before hydration, so the Teleport target is
// live). It reproduces the SSR row markup so the delegated mint/collapse listeners still fire.
import SidebarBarrel from './SidebarBarrel.vue';
import ScsBridgeSessionsButton from '../scsBridge/vue/components/ScsBridgeSessionsButton.vue';
// GITM A↔B-R (#641-R) — the DUALTURN custom A/B button components + the Sword B-setter.
// FREEHOP standalone is REMOVED (Sword epoch) — its branch-hop panel is subsumed into the
// Sword's Mode 2 (Prismatic Free-Hop). The GitmFreehopButton.vue file is retained as the
// Mode-2 panel donor but is no longer registered as a standalone dock button.
import GitmStableAButton from '../scsBridge/vue/components/GitmStableAButton.vue';
import GitmTurnOverAButton from '../scsBridge/vue/components/GitmTurnOverAButton.vue';
import GitmTurnOverBButton from '../scsBridge/vue/components/GitmTurnOverBButton.vue';
import GitmMergeBAButton from '../scsBridge/vue/components/GitmMergeBAButton.vue';
import GitmSwordBButton from '../scsBridge/vue/components/GitmSwordBButton.vue';
import type { ToolbarButtonRegistration } from '../scsBridge/scsBridge.type';
import {
  TOOLBAR_BUTTON_BRIDGE_SESSIONS,
  TOOLBAR_BUTTON_SEND_MESSAGE,
  // RESTORED — the proven sole-fuchsia TOOLBAR_BUTTON_TURN_OVER (additive to the A/B group).
  TOOLBAR_BUTTON_TURN_OVER,
  // GITM A↔B-R (#641-R) — the DUALTURN A/B reserve-mechanism group + the Sword B-setter.
  // FREEHOP standalone (TOOLBAR_BUTTON_BRANCH_HOP) is REMOVED — subsumed into the Sword Mode 2.
  TOOLBAR_BUTTON_STABLE_A,
  TOOLBAR_BUTTON_TURN_OVER_A,
  TOOLBAR_BUTTON_SWORD_B,
  TOOLBAR_BUTTON_TURN_OVER_B,
  TOOLBAR_BUTTON_MERGE_B_A,
} from '../../model/defaultToolbarButtons.model';
import { sortToolbarButtonsForRender } from '../../model/toolbarRegistration.model';
import {
  applySuiteColorOverrides,
  loadSuiteColorOverrides,
} from '../../model/suiteColorOverride.model';
import {
  applySuitePatternOverrides,
  loadSuitePatternOverrides,
} from '../../model/suitePatternOverride.model';
import { loadHifiConfig, applyHifiConfigUnderOverrides } from '../../model/hifiConfig.model';

// ============================================
// PROPS
// ============================================

const props = defineProps<{
  /**
   * Initial island ID to load
   * Comes from window.__APP_STATE__.authorizedIslandIds
   */
  initialIslandId?: string;
}>();

// ============================================
// NOTIFICATION CONTROLLER (Global)
// ============================================

const notificationController = createNotificationController();

// Provide for Vue inject pattern (Tier 3 components)
provide(NOTIFICATION_CONTROLLER_KEY, notificationController);

// Register globally for Stratimux principle hook
// This bridges Vue context with Muxium context
setGlobalNotificationController(notificationController);

// ============================================
// SCS-BRIDGE CONTROLLER (Global · Cycle 159 D1 · CSCM Pattern)
// ============================================
//
// GRGL · Global Registration + Vue Inject Lookup (Cycle 159 D3 verdict).
// Dual registration · provide() for Vue inject in Tier 3 ·
// setGlobalScsBridgeController() for the scsBridgeDisplayPrinciple (SDPS).
// Matches NotificationController pattern; CSCM differs from ZKHB by maintaining
// authoritative Stratimux state (controller mirrors, never owns).

const scsBridgeController = createScsBridgeController();
provide(SCS_BRIDGE_CONTROLLER_KEY, scsBridgeController);
setGlobalScsBridgeController(scsBridgeController);

// ============================================
// D-T-MUX · DEFAULT-MUXIUM FALLBACK (the silent-error fix)
// ============================================
//
// A non-binding Landing (e.g. SuiteCascadeLanding has 0 setMuxium) or a post-
// unmount page leaves the controller's currentMuxium null, so every Hard-Turn-
// Over (sole-fuchsia + A/B) silently no-ops. ensureDefaultMuxium arms a DEFAULT
// client muxium ([] page concepts → scsBridge + gitm BASE deck · the same call
// GitmLanding makes minus page concepts) ONLY when no Landing bound. A real
// Landing's onMounted → setMuxium wins first (close-on-takeover in the
// controller), so this no-ops on binding pages.
function ensureDefaultMuxium(): void {
  if (typeof window === 'undefined') return;
  if (!scsBridgeController.getCurrentMuxium()) {
    console.log('[IslandWrapper] D-T-MUX · no muxium bound · arming default fallback');
    const d: Muxium<ClientMuxiumDeck> = createClientMuxiumInstance<ClientMuxiumDeck>([], {
      title: 'IslandWrapperDefault',
      logging: true,
      storeDialog: true,
    });
    scsBridgeController.setDefaultMuxium(d);
  }
}

// ============================================
// GITM CONTROLLER (Global · read-only reactive gitmJson · #641-R W4)
// ============================================
//
// GRGL dual registration alongside scsBridgeController. The gitm controller mirrors
// the gitm.json relay (gitmJson) so the A/B button group + the Merge gate read a
// reactive source — replacing the per-button /gitm-status polls. Decision 2:
// READ-ONLY — dispatch stays on scsBridgeController.triggerGitmAction.

const gitmController = createGitmController();
provide(GITM_CONTROLLER_KEY, gitmController);
setGlobalGitmController(gitmController);

// C785 · THE TURN-OVER ALERT BANNER (scp_alert_turn_over → gitm.json turnOverAlert). The
// bridge requested a USER Turn Over A on this SCP — render the directive globally (this is
// the only client-hydrated host · the TaskBar precedent). SELF-RETIRES: a turnOver stamp
// NEWER than requestedAt means the user performed it. Dismiss is session-local only.
// C909 · THE DOCK READOUT PORTAL (the Vermillion law: escape the clipping ancestor — the
// fixed dock's containers clip absolute children, why the C878 readouts never rendered).
// ONE fixed tooltip at body level, delegated: any element carrying data-readout teaches its
// label on hover; positioned from getBoundingClientRect, opened ABOVE, right-clamped.
const dockReadout = ref<{ open: boolean; x: number; y: number; text: string }>({
  open: false, x: 0, y: 0, text: '',
});
function onDockHover(e: MouseEvent): void {
  const t = (e.target as HTMLElement | null)?.closest?.('[data-readout]') as HTMLElement | null;
  if (!t) {
    if (dockReadout.value.open) dockReadout.value = { ...dockReadout.value, open: false };
    return;
  }
  const label = t.getAttribute('data-readout') ?? '';
  const r = t.getBoundingClientRect();
  // C910 · MEASURE-THEN-CLAMP: the first pass guessed a max-width position (a short label
  // drifted far left of its control). Open centered over the control, then measure the
  // REAL width next tick and clamp within the viewport.
  dockReadout.value = { open: label.length > 0, x: r.left + r.width / 2, y: Math.max(8, r.top - 34), text: label };
  void nextTick(() => {
    const el = document.querySelector('.dock-readout') as HTMLElement | null;
    if (!el) return;
    const w = el.offsetWidth;
    const centered = r.left + r.width / 2 - w / 2;
    dockReadout.value = {
      ...dockReadout.value,
      x: Math.max(8, Math.min(centered, window.innerWidth - w - 8)),
    };
  });
}
onMounted(() => { window.addEventListener('mouseover', onDockHover, true); });
onUnmounted(() => { window.removeEventListener('mouseover', onDockHover, true); });

// THE DISMISS PERSISTS (the user's law): the ✕ is a decision — a reload (the turn-over
// restart itself!) must not resurrect a dismissed alert. The dismissed requestedAt rides
// localStorage; a NEWER request (later requestedAt) still renders — the banner remains
// the helpful reminder for every FRESH directive, silent for the one already answered.
const TOAB_DISMISS_KEY = 'scs-toab-dismissed-at';
const turnOverAlertDismissedAt = ref<number>(
  typeof localStorage !== 'undefined'
    ? Number(localStorage.getItem(TOAB_DISMISS_KEY) ?? 0) || 0
    : 0,
);
function dismissTurnOverAlert(at: number): void {
  turnOverAlertDismissedAt.value = at;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOAB_DISMISS_KEY, String(at));
  } catch {
    // storage unavailable — the session-scoped dismiss still holds
  }
}
const activeTurnOverAlert = computed<{ requestedAt: number; source: string; purpose: string } | null>(() => {
  const gj = gitmController.gitmJson.value;
  const alert = gj?.turnOverAlert;
  if (!alert) return null;
  if (turnOverAlertDismissedAt.value >= alert.requestedAt) return null;
  const stampAt = gj?.turnOver?.at ?? 0;
  return stampAt > alert.requestedAt ? null : alert;
});

// ============================================
// RENDER-MODE ROOT ATTRIBUTE (the chromatic shader hook)
// ============================================
//
// Reflect the active bridge render mode (bridgeJson.scpRenderMode) onto the
// document root as data-render-mode="<mode>". This gives style.css a global
// selector hook — e.g. [data-render-mode="muxon"] applies the white legibility
// shadow under the chromatic Muxon shader. Rides the existing bridgeJson
// shallowRef subscription; defaults to 'off' when null/absent.

watch(
  () => scsBridgeController.bridgeJson.value?.scpRenderMode,
  (mode) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-render-mode', mode || 'off');
  },
  { immediate: true },
);

// ============================================
// TASKBAR + POPUP STATE (E13 fix · Cycle 160 R3)
// ============================================
//
// TaskBar moved from Shell.vue (SSR-dead) into IslandWrapper (client-hydrated).
// Shell.vue's <script setup> only executes server-side; Vue event bindings in
// Shell template have no client-side handlers attached. Hosting TaskBar +
// click handler + Sessions popup here means the bindings live in the only
// client-hydrated Vue tree. TBBM refactor (per-button modules with direct
// controller injection) is Wave 2C — Wave 2A preserves the existing
// emit-based chain and props-driven popup.

const bridgeSessionsPopupOpen = ref<boolean>(false);

// ============================================
// MD-8 D-NM-2 · THE CREATE OVERLAY — open-state + delegated sidebar click (E13 law)
// ============================================
//
// The sidebar's synthetic "Create S8" entry (getNavItems · vue.principle.ts) is SSR-static markup
// inside Shell.vue — Shell has NO client hydration, so a click handler bound there would be dead
// (the same E13 diagnosis that moved TaskBar here). Instead, IslandWrapper (the only client-
// hydrated tree) attaches ONE document-level click listener that matches
// `closest('[data-concept="suite8-mint"]')` and opens the overlay. Works from EVERY page because
// the sidebar is always present. Detached on unmount (below · symmetric with the other globals).

const suite8CreateOverlayOpen = ref<boolean>(false);

function handleDocumentClickForMint(evt: MouseEvent): void {
  const target = evt.target as Element | null;
  const mintEntry = target?.closest?.('[data-concept="suite8-mint"]');
  if (mintEntry) {
    // Prevent the graceful-degrade navigation (the href is the no-JS fallback to /suite8); with JS
    // live, the click opens the overlay in place instead.
    evt.preventDefault();
    suite8CreateOverlayOpen.value = true;
  }
}

// ============================================
// D-RB · THE NAVBAR ROTARY BARREL — mount gate (client-hydrated · the E13 law)
// ============================================
//
// The barrel island Teleports into the SSR-static .sidebar-nav. Two things must happen when it
// activates: (1) the container flips to .barrel-active (endless-scroll surface + hidden scrollbar)
// and (2) the static SSR <a> rows are HIDDEN via .barrel-static-hidden (NOT innerHTML-wiped — the
// source stays as the no-JS fallback). Both are gated on navItems being present in __APP_STATE__;
// absent → skip entirely, leaving the plain SSR column live.
const barrelReady = ref<boolean>(false);

function activateSidebarBarrel(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const navItems = window.__APP_STATE__?.navItems;
  // Guard: no ring → do not mount the barrel; the static SSR column remains the live nav.
  if (!Array.isArray(navItems) || navItems.length === 0) return;
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  nav.classList.add('barrel-active');
  // Hide the static SSR <a data-concept> rows (the barrel renders the ring in their place). They
  // remain in the DOM — the no-JS fallback source is never destroyed.
  nav.querySelectorAll('a.nav-item').forEach((a) => a.classList.add('barrel-static-hidden'));
  barrelReady.value = true;
}

function deactivateSidebarBarrel(): void {
  if (typeof document === 'undefined') return;
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  nav.classList.remove('barrel-active');
  nav.querySelectorAll('a.nav-item').forEach((a) => a.classList.remove('barrel-static-hidden'));
  barrelReady.value = false;
}

// THE-TURN-OVER-A-GUARD — the intrusive center-vision confirmation state. The turn-over-a branch
// (below) checks client-visible gitm.json (dirty ANOR on a b/* branch · a working B present) and
// opens this modal INSTEAD of dispatching; Confirm runs the two-call safeguard handshake.
const turnOverAConfirmOpen = ref<boolean>(false);
// In-flight latch — TRUE while the confirm handshake owns the token round, so the fallback watcher
// (which also sees the call-1 minted token) does NOT re-open the modal mid-handshake.
let turnOverAConfirmInFlight = false;

const taskBarComponentMap: Record<string, Component> = {
  'bridge-sessions': ScsBridgeSessionsButton,
  // RESTORED — the proven sole-fuchsia button (resolved by id 'turn-over' · no componentName).
  'turn-over': ScsBridgeTurnOverButton,
  // GITM A↔B-R (#641-R) — the DUALTURN custom A/B button components (resolved by componentName).
  GitmStableAButton: GitmStableAButton,
  GitmTurnOverAButton: GitmTurnOverAButton,
  GitmSwordBButton: GitmSwordBButton,
  GitmTurnOverBButton: GitmTurnOverBButton,
  // Cycle 278 — the fifth dock component: Merge B→A (HiFi Purple pop · MERGEGATE-owned).
  GitmMergeBAButton: GitmMergeBAButton,
};

// GITM A↔B Refinement (#641-R) · W4 MERGEGATE → Cycle 278: the Merge B→A is now the fifth
// dock COMPONENT (GitmMergeBAButton) owning its own gate (gitmController.mergeEnabled ·
// bMergeable && changesPrimedOnB === 0 && lastTurnOverResult === 'success') + CGDA + the
// ?-badge explainer link — the registration-level enabled patch is retired with it.

const DEFAULT_TOOLBAR_BUTTONS: ToolbarButtonRegistration[] = [
  TOOLBAR_BUTTON_BRIDGE_SESSIONS,
  TOOLBAR_BUTTON_SEND_MESSAGE,
  // RESTORED — the proven sole-fuchsia Turn Over (the de-risk base; additive to the A/B group).
  TOOLBAR_BUTTON_TURN_OVER,
  // GITM A↔B Refinement Sword epoch — the A/B DOCK GROUP (right cluster, in order):
  //   Shield (A-set) · Turn-Over A · Sword (B-set · dual-mode) · Turn-Over B · Merge B→A.
  TOOLBAR_BUTTON_STABLE_A,
  TOOLBAR_BUTTON_TURN_OVER_A,
  TOOLBAR_BUTTON_SWORD_B,
  TOOLBAR_BUTTON_TURN_OVER_B,
  TOOLBAR_BUTTON_MERGE_B_A,
];

const toolbarButtonsForRender = computed<ToolbarButtonRegistration[]>(() => {
  const buttons =
    scsBridgeController.toolbarButtons.value.length > 0
      ? scsBridgeController.toolbarButtons.value
      : DEFAULT_TOOLBAR_BUTTONS;
  return sortToolbarButtonsForRender(buttons);
});

function handleTaskBarButtonClicked(id: string): void {
  console.log('[IslandWrapper] handleTaskBarButtonClicked · id:', id);
  if (id === 'bridge-sessions') {
    // Toggle behavior · Cycle 160 R3 Wave 2A+ · click again to close
    bridgeSessionsPopupOpen.value = !bridgeSessionsPopupOpen.value;
    console.log('[IslandWrapper] Sessions popup toggled →', bridgeSessionsPopupOpen.value ? 'OPEN' : 'CLOSED');
    return;
  }
  // RESTORED — the proven sole-fuchsia turn-over: TaskBar maps the button's 'turn-over-triggered'
  // emit → buttonClicked('turn-over'); the controller dispatches the blind hard-restart (no args →
  // huirth writes .bridge-restart.json → nodemon respawn → standby overlay). The de-risk base for A/B.
  if (id === 'turn-over') {
    // SPARKS (C637) — the hard turn-over wears the RED register. Mount the standby at the click
    // (mode 'turn-over' · class 'sparks'); the blind hard-restart tears the WS down and the
    // close-handler re-shows the plain 'turn-over' overlay (SHIELD-derived) across the respawn.
    showBridgeStandby('turn-over', null, 'sparks');
    scsBridgeController.triggerHardTurnOver();
    return;
  }
  // GITM A↔B-R (#641-R) — the DUALTURN custom buttons (stable-a / turn-over-a / turn-over-b)
  // carry their own components + dispatch. Create-B is RETIRED (B auto-populates via the
  // bridge BSEED auto-advance). The Merge B→A fallback dispatches via the generic gitm pipe,
  // gated by the reactive MERGEGATE (enabled). The gitm.json relay drives state — no poll.
  if (id === 'merge-b-a') {
    scsBridgeController.triggerGitmAction('gitm_merge_working', {});
    return;
  }
  // C298 (085 observed logging): the A/B buttons' handleClick ends at the TaskBar emit and
  // triggerGitmTurnOver is the LEGACY hard leg despite its A|B signature — the specific
  // turn-overs dispatch through the generic gitm pipe (the proven merge-b-a shape).
  if (id === 'turn-over-a') {
    // THE-TURN-OVER-A-GUARD (THE LAW · the working seat is B · THE C302 CONSOLIDATION · Cycle 312).
    // This modal is now the SOLE confirmation surface — the retired button-anchored panel (and its
    // legacy gitm/b-<ts> mint) is gone. Read client-visible gitm.json: if the tree is dirty (working
    // drift on the stable A · the C311 FIRST-CARRY case — even with NO B yet) ANOR the checkout is on
    // a b/* branch (the working seat), do NOT dispatch — open the intrusive center-vision modal so the
    // user chooses Carry-into-B (the two-call confirmToken handshake · the ONE canonical carry) or
    // Hard Turn Over (ground reset). GATE WIDENED (C312): (dirty ANOR on-b/*) alone warrants the
    // confirm round — the bridge guard was widened to match so the first-carry (dirty·no-B) case mints
    // b/<stable>-<ts> through the canonical carry instead of the retired a-dirty-spin-to-b halt. A
    // clean A on master (no drift, no b/*) falls through to the plain dispatch. The bridge-side guard
    // remains the AUTHORITATIVE rail — a guardFired 'a-turnover-needs-confirmation' arriving via
    // gitm.json (the fallback watcher below) re-opens the modal if the dispatch reached the bridge first.
    const gj = gitmController.gitmJson.value;
    // D-BN-5 · MEANINGFUL DRIFT (the user's law: no changes -> turn over to A safely, NO overlay).
    // The trigger is the user-visible change count ALONE (the same changesPrimedOnB the modal
    // displays) — never the telemetry-tainted dirty flag, never being-on-B (the seat's location
    // does not warrant the confirm round; the bridge D-BN-5 gate mirrors this exactly).
    const hasWorkingChanges = (gj?.changesPrimedOnB ?? 0) > 0;
    if (hasWorkingChanges) {
      turnOverAConfirmOpen.value = true;
      return;
    }
    // C641 · the A leg mounts SHIELD explicitly at click (the recovery expression arrives at the
    // gesture, not only on the WS-close fallback — the C637-carded shield-a mount closes here).
    showBridgeStandby('shield-a', null, 'shield');
    writeGitmTurnoverProgress({
      source: 'A',
      overlayVariant: 'shield-a',
      turnClass: 'shield',
      deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
      stableA: gitmController.gitmJson.value?.stableBranch ?? '',
      bridgeEndpoint: scsBridgeController.bridgeJson.value?.endpoint ?? '',
    });
    scsBridgeController.triggerGitmAction('gitm_turn_over_with_source', { source: 'A' });
    return;
  }
  if (id === 'turn-over-b') {
    // C641 · THE DOCK LEG DECLARES (the NP live round): the TaskBar custom-component fallthrough
    // makes THIS leg fire on every click — the ARM click already restarts the server here, before
    // the component's armed→fire (where C637-C640 live) can run. EVERY server-restarting writer
    // mounts its expression + writes the carrier (mirrors the Sparks leg at :348 — the working
    // asymmetry the salvo isolated). scpName omitted (async-only here · boot-stream tail degrades).
    showBridgeStandby('sword-b', null, 'sword');
    writeGitmTurnoverProgress({
      source: 'B',
      overlayVariant: 'sword-b',
      turnClass: 'sword',
      deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
      stableA: gitmController.gitmJson.value?.stableBranch ?? '',
      bridgeEndpoint: scsBridgeController.bridgeJson.value?.endpoint ?? '',
    });
    scsBridgeController.triggerGitmAction('gitm_turn_over_with_source', { source: 'B' });
    return;
  }
  console.warn('[IslandWrapper] UNROUTED dock id (no dispatch branch):', id);
}

// ============================================
// THE-TURN-OVER-A-GUARD — the center-vision confirmation handlers
// ============================================

// The change count + on-working-branch flags the modal displays (client-visible gitm.json only).
const turnOverAChangesCount = computed<number>(
  () => gitmController.gitmJson.value?.changesPrimedOnB ?? 0,
);
// D-BN · THE branchRoles SWEEP — on-working-branch is decided by the canonical roles.b
// (isWorkingBranchPer), with the `b/` prefix as the legacy fallback inside the helper.
const turnOverAOnWorkingBranch = computed<boolean>(() =>
  isWorkingBranchPer(
    gitmController.gitmJson.value?.currentBranch ?? '',
    gitmController.gitmJson.value,
  ),
);

// Cancel — the Bridge Turn Over is CANCELED; nothing moves (backdrop · ESC · Cancel all land here).
function handleTurnOverAConfirmCancel(): void {
  turnOverAConfirmOpen.value = false;
  console.log('[IslandWrapper] Turn Over A confirmation CANCELED — nothing dispatched');
}

// Hard Turn Over — THE C302 CONSOLIDATION (Cycle 312) · the modal's ground-reset fork. The blind
// hard-restart (triggerHardTurnOver · BRTF · no branch switch, no carry) — the app reboots as-is;
// working changes stay put, NOT carried onto B. Absorbs the retired panel's Hard Turn Over action.
function handleTurnOverAConfirmHard(): void {
  turnOverAConfirmOpen.value = false;
  console.log('[IslandWrapper] Turn Over A · HARD — blind hard-restart (ground reset · no carry)');
  // SPARKS (C637) — the modal's ground-reset fork IS a hard turn-over; wear the RED register.
  showBridgeStandby('turn-over', null, 'sparks');
  scsBridgeController.triggerHardTurnOver();
}

// Confirm — carry the working changes into B THEN turn over to A. Runs the two-call WATCHKEY
// safeguard: call 1 (no token) holds the switch bridge-side + relays a one-time confirmToken via
// gitmJson.pendingConfirm; a bounded poll reads it back; call 2 carries it to execute the carry +
// switch. The C300 Seat-Law auto-return then brings the seat home to B once the boot settles.
async function handleTurnOverAConfirmConfirm(): Promise<void> {
  turnOverAConfirmOpen.value = false;
  turnOverAConfirmInFlight = true;
  try {
  // C314 TOKEN-CONSUMPTION FIX — Confirm CONSUMES a HELD pendingConfirm token rather than always
  // re-minting. When the fallback watcher surfaced this modal because the bridge ALREADY held the
  // switch (call-1 ran bridge-first · a token is already relayed on gitmJson.pendingConfirm), a
  // second call-1 mints a FRESH token and invalidates the held one (wasteful · a needless round).
  // If a valid held token is present, skip call-1 and go DIRECT to call-2 (consume-the-held-token).
  const held = gitmController.gitmJson.value?.pendingConfirm;
  let token =
    held && held.action === 'gitmTurnOverWithSource' && held.token.length > 0 ? held.token : '';

  if (token.length === 0) {
    // No held token — mint: a no-token turn-over surfaces the guard + confirmToken (pendingConfirm).
    const ack1 = await scsBridgeController.triggerGitmMean('gitm_turn_over_with_source', { source: 'A' });
    if (!ack1.ok) {
      console.error('[IslandWrapper] Turn Over A call-1 ACK failed:', ack1.error);
      return;
    }
    // Await the relayed token (the gitm.json watcher populates pendingConfirm · bounded ~3s).
    token = await new Promise<string>((resolveToken) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const pending = gitmController.gitmJson.value?.pendingConfirm;
        if (pending && pending.action === 'gitmTurnOverWithSource') {
          clearInterval(timer);
          resolveToken(pending.token);
        } else if (Date.now() - started > 3000) {
          clearInterval(timer);
          resolveToken('');
        }
      }, 120);
    });
  } else {
    console.log('[IslandWrapper] Turn Over A · consuming HELD pendingConfirm token (C314 · call-2 direct)');
  }
  if (token.length === 0) {
    console.error('[IslandWrapper] Turn Over A confirmToken never relayed — aborting call-2');
    return;
  }
  // Call 2 — execute: carry the working changes into B, then turn over to A.
  const ack2 = await scsBridgeController.triggerGitmMean('gitm_turn_over_with_source', {
    source: 'A',
    confirmToken: token,
  });
  if (!ack2.ok) {
    console.error('[IslandWrapper] Turn Over A call-2 ACK failed:', ack2.error);
  }
  } finally {
    turnOverAConfirmInFlight = false;
  }
}

// FALLBACK TRIGGER — if a plain turn-over-a dispatch reached the bridge FIRST (client-visible state
// lagged) the bridge holds it and relays guardFired 'a-turnover-needs-confirmation' via gitm.json.
// Re-open the modal so the user still confirms (idempotent — the confirm re-runs the handshake).
watch(
  () => gitmController.gitmJson.value?.pendingConfirm,
  (pending) => {
    if (
      pending &&
      pending.action === 'gitmTurnOverWithSource' &&
      !turnOverAConfirmOpen.value &&
      !turnOverAConfirmInFlight
    ) {
      // Only surface the modal if we did not already initiate the confirm flow this cycle (the
      // handshake's own call-1 also mints this token — guard against a self-retrigger loop by
      // checking the modal is closed AND no confirm is in flight). The confirm handler closes the
      // modal before call-1, so a token appearing while the modal is closed = a bridge-first hold.
      console.log('[IslandWrapper] bridge held Turn Over A — surfacing confirmation modal (fallback)');
      turnOverAConfirmOpen.value = true;
    }
  },
);

// ============================================
// ISLAND LOADING
// ============================================

/**
 * Island registry - maps islandId to async component loader
 * Add new islands here as they are created
 */
const islandRegistry: Record<string, () => Promise<Component>> = {
  default: () => import('../vue/vue/DefaultLanding.vue'),
  notification: () => import('../notification/vue/NotificationLanding.vue'),
  scsBridge: () => import('../scsBridge/vue/ScsBridgeLanding.vue'),
  suite8: () => import('../suite8/vue/Suite8Landing.vue'),
  // DSSLS · the Template Suite 8 Page (Suite8HomeLanding.vue) — the install Opus adapts
  // this into the user's domain Suite 8 as the SCP HOME PAGE (S9-DomainPageCreate +
  // S10-HomePageAdapt). Registered here so getLandingPage() → islandId resolves once the
  // SAMLS swap flips suite8HomeNavigation.isMainLanding: true.
  suite8Home: () => import('../suite8/vue/Suite8HomeLanding.vue'),
  graphiteScribe: () => import('../graphiteScribe/vue/GraphiteScribeHomeLanding.vue'),
  cadmium: () => import('../cadmium/vue/CadmiumLanding.vue'),
  // Band B-6 HCD · the SuiteCascade Landing island (IUPA per-page muxified · the
  // deferred B-4 client face — serverToClient relays now land here).
  suiteCascade: () => import('../suiteCascade/vue/SuiteCascadeLanding.vue'),
  // GITM PAGE · the REGISTERED GitM page island. Renders ScsBridgeGitmSubPage.vue against
  // the universal scsBridge base deck (gitmJson relay + the action-pipe — no page concept).
  gitm: () => import('../gitm/vue/GitmLanding.vue'),
  // HIFI.3 · the Pewter Tessera page island (Suite Color Selection · nav-only · no page
  // concept). islandId 'pewter' resolves from pewterMuxonomic.conceptName (vue.principle.ts).
  pewter: () => import('../pewter/vue/PewterLanding.vue'),
};

/**
 * Currently loaded island component
 */
// W3.5 (C781) · THE DEEP-LINK FLOOR — scp_focus_suite8_page navigates the window to
// ?island=<islandId>; honor it at boot when the key exists in the registry (compiled Forge
// pages own their islandIds). Absent anor unknown → the SSR-provided initial island stands.
const deepLinkIslandId = ((): string | null => {
  try {
    const key = new URLSearchParams(window.location.search).get('island');
    return key && key in islandRegistry ? key : null;
  } catch {
    return null;
  }
})();

const currentIsland = shallowRef<Component | null>(null);
const currentIslandId = shallowRef<string | null>(null);
const isLoading = shallowRef<boolean>(true);
const loadError = shallowRef<string | null>(null);

/**
 * Load an island by ID
 */
async function loadIsland(islandId: string): Promise<void> {
  const loader = islandRegistry[islandId];

  if (!loader) {
    console.warn(`[IslandWrapper] Island "${islandId}" not in registry`);
    loadError.value = `Island "${islandId}" not found`;
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    loadError.value = null;
    console.log(`[IslandWrapper] Loading island: ${islandId}`);

    const module = await loader();
    currentIsland.value = module.default || module;
    currentIslandId.value = islandId;

    console.log(`[IslandWrapper] Island loaded: ${islandId}`);
  } catch (error) {
    console.error(`[IslandWrapper] Failed to load island "${islandId}":`, error);
    loadError.value = `Failed to load island: ${error}`;
    currentIsland.value = null;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Unload current island (for page transitions)
 */
function unloadIsland(): void {
  if (currentIslandId.value) {
    console.log(`[IslandWrapper] Unloading island: ${currentIslandId.value}`);
    currentIsland.value = null;
    currentIslandId.value = null;
  }
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  console.log('[IslandWrapper] Mounted - Tier 2 active');

  // HIFI.1 boot hook — re-apply the persisted per-suite color palette onto the
  // documentElement :root so every island re-reads the user's chosen spectrum
  // tokens at runtime. Runs once on client mount; SSR-safe guards inside.
  applySuiteColorOverrides(loadSuiteColorOverrides());

  // HIFI.3 boot hook — re-apply the persisted per-suite pattern map onto the documentElement
  // :root so every island re-tiles the user's chosen SVG textures at runtime. Independent of the
  // color hook above (different documentElement properties); order-free. SSR-safe guards inside.
  applySuitePatternOverrides(loadSuitePatternOverrides());

  // P4 boot hook — apply the SCP's controlling hifiConfig.json (the agent-authored SCP HiFi design)
  // UNDER the user's localStorage clicks (precedence: factory :root < hifiConfig.json < localStorage).
  // Async server fetch; fills ONLY spectra the user has NOT overridden → click wins, no flicker.
  void loadHifiConfig().then((cfg) => {
    if (cfg) applyHifiConfigUnderOverrides(cfg);
  });

  // Load initial island if specified
  if ((deepLinkIslandId ?? props.initialIslandId)) {
    loadIsland((deepLinkIslandId ?? props.initialIslandId));
  }
  // #641-R W4 — the bMergeable poll is RETIRED; the gitm.json relay drives the
  // gitm controller (gitmDisplayPrinciple → gitmController.mergeEnabled).

  // D-T-MUX · arm the default fallback after a 300ms window. The delay is LOAD-
  // BEARING: it lets a real Landing's onMounted → setMuxium win first; by the
  // time ensureDefaultMuxium runs, currentMuxium is non-null on a binding page
  // and the arm no-ops. A non-binding page (e.g. SuiteCascadeLanding) gets the
  // default — Hard-Turn-Over dispatch now resolves there.
  setTimeout(ensureDefaultMuxium, 300);

  // MD-8 D-NM-2 · attach the delegated document-level click listener for the sidebar's synthetic
  // "Create S8" entry (the E13-safe way to wire a click into SSR-static Shell markup).
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClickForMint);
    // BO-5 (C454) · THE CLIENT-LIVE SIDEBAR COLLAPSE — the Shell's @click is SSR-dead; the
    // SAME delegated idiom wires the collapse: toggle .sidebar-collapsed on .shell + swap the
    // chevron + persist. The persisted state re-applies on every island load (this mount).
    document.addEventListener('click', handleSidebarCollapseClick);
    applyPersistedSidebarState();
    // D-RB · flip .sidebar-nav into the barrel surface + hide the static rows, THEN the Teleport
    // (barrelReady-gated) mounts SidebarBarrel into it. Ordered after the collapse wiring so the
    // static rows the barrel replaces are already in the DOM to be measured/hidden.
    activateSidebarBarrel();
  }
});

// BO-5 · the sidebar collapse wiring (SSR-static Shell · delegated + persisted).
const SIDEBAR_COLLAPSE_KEY = 'scsSidebarCollapsed';
function setSidebarCollapsed(collapsed: boolean): void {
  const shell = document.querySelector('.shell');
  if (!shell) return;
  shell.classList.toggle('sidebar-collapsed', collapsed);
  // The SSR renders --sidebar-width INLINE on .shell (the dead Vue binding) — an inline
  // style beats any class rule, so the live toggle sets the var inline too.
  (shell as HTMLElement).style.setProperty('--sidebar-width', collapsed ? '60px' : '240px');
  document.querySelectorAll('.sidebar-collapse-btn i').forEach((icon) => {
    icon.className = collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
  });
  try {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0');
  } catch {
    /* storage unavailable — session-only toggle */
  }
}
function applyPersistedSidebarState(): void {
  try {
    if (localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1') setSidebarCollapsed(true);
  } catch {
    /* ignore */
  }
}
function handleSidebarCollapseClick(ev: MouseEvent): void {
  const target = ev.target as HTMLElement | null;
  if (!target) return;
  const btn = target.closest('.sidebar-collapse-btn');
  if (!btn) return;
  const shell = document.querySelector('.shell');
  if (!shell) return;
  setSidebarCollapsed(!shell.classList.contains('sidebar-collapsed'));
}

// D-T-MUX · re-check on island change. A non-binding island that just loaded
// gets a default after the 300ms window; a binding Landing's setMuxium will have
// populated currentMuxium first, so ensureDefaultMuxium no-ops. Same load-bearing
// delay rationale as the onMounted arm.
watch(currentIslandId, () => {
  setTimeout(ensureDefaultMuxium, 300);
});

onUnmounted(() => {
  console.log('[IslandWrapper] Unmounted');
  unloadIsland();
  // D-T-MUX · tear down the default fallback muxium if armed (close-on-takeover
  // already cleared it whenever a real Landing bound, so this only fires when the
  // default was still acting as current). Guards double-close internally.
  scsBridgeController.closeDefaultMuxium();
  // Clear global controller references when wrapper unmounts
  clearGlobalNotificationController();
  clearGlobalScsBridgeController();
  // GITM A↔B Refinement (#641-R) · W4 — clear the global gitm controller.
  clearGlobalGitmController();
  // MD-8 D-NM-2 · detach the delegated "Create S8" click listener (symmetric with onMounted).
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClickForMint);
    document.removeEventListener('click', handleSidebarCollapseClick);
  }
  // D-RB · restore the static SSR column (unhide rows · drop .barrel-active) symmetric with mount.
  deactivateSidebarBarrel();
});

// ============================================
// EXPOSE FOR PARENT/NAVIGATION
// ============================================

defineExpose({
  loadIsland,
  unloadIsland,
  currentIslandId,
  notificationController,
  scsBridgeController,
});
</script>

<template>
  <div class="island-wrapper">
    <!-- Global: Notification Popup (persists across island changes) -->
    <NotificationPopup :controller="notificationController" />

    <!-- C909 · the dock readout portal — fixed at body level (never clipped). -->
    <div
      v-if="dockReadout.open"
      class="dock-readout mono"
      :style="{ left: dockReadout.x + 'px', top: dockReadout.y + 'px' }"
      aria-hidden="true"
    >{{ dockReadout.text }}</div>

    <!-- C785 · THE TURN-OVER ALERT BANNER (scp_alert_turn_over) — the user's Turn Over directive (side from the live gitm state · C872) -->
    <div v-if="activeTurnOverAlert" class="turn-over-alert-banner">
      <span class="toab-title">TURN OVER {{ activeTurnOverAlert.source ?? 'A' }} REQUESTED</span>
      <!-- C794/C876 · THE PROXY PAIR — BOTH Turn Over controls represented (A · B), the
           DIRECTED one focused with the pulse ring, the other dimmed: the mechanism teaches
           the WHOLE A/B system while pointing at the one to press. The REAL buttons in the
           TaskBar remain the sole actuators. -->
      <span class="toab-proxy-pair" aria-hidden="true">
        <span :class="['toab-proxy', 'toab-proxy--a', (activeTurnOverAlert.source ?? 'A') === 'A' ? 'toab-proxy--directed' : 'toab-proxy--dim']">
          <span v-if="(activeTurnOverAlert.source ?? 'A') === 'A'" class="toab-proxy-ring"></span>
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span class="toab-proxy-tag">A</span>
        </span>
        <span :class="['toab-proxy', 'toab-proxy--b', (activeTurnOverAlert.source ?? 'A') === 'B' ? 'toab-proxy--directed' : 'toab-proxy--dim']">
          <span v-if="(activeTurnOverAlert.source ?? 'A') === 'B'" class="toab-proxy-ring"></span>
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
          <span class="toab-proxy-tag">B</span>
        </span>
      </span>
      <span class="toab-body">
        <span class="toab-purpose">{{ activeTurnOverAlert.purpose }}</span>
        <span class="toab-directive">This button lives in the TaskBar — track it down and press it. The bridge rebuilds and re-serves this SCP under you.</span>
      </span>
      <button class="toab-dismiss" @click="dismissTurnOverAlert(activeTurnOverAlert.requestedAt)" title="Hide (stays hidden — the alert clears itself when you Turn Over)">✕</button>
    </div>

    <!-- Island Loading Area -->
    <div class="island-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="island-loading">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="island-error">
        <p class="error-icon">⚠️</p>
        <p class="error-message">{{ loadError }}</p>
      </div>

      <!-- Loaded Island -->
      <component v-else-if="currentIsland" :is="currentIsland" :key="currentIslandId" />

      <!-- No Island -->
      <div v-else class="island-empty">
        <p>No island loaded</p>
      </div>
    </div>

    <!-- E13 fix · Cycle 160 R3 · TaskBar lives in client-hydrated tree (NOT in Shell.vue) -->
    <TaskBar
      :buttons="toolbarButtonsForRender"
      :component-map="taskBarComponentMap"
      @button-clicked="handleTaskBarButtonClicked"
    />

    <!-- E13 fix · Sessions popup · client-hydrated · Teleports to body for z-stacking -->
    <!-- D3A HAZARD-σ fix · bind real controller values (was hardcoded null/[]) -->
    <ScsBridgeSessionsPopup
      v-if="bridgeSessionsPopupOpen"
      :is-open="bridgeSessionsPopupOpen"
      :bridge-json="scsBridgeController.bridgeJson.value"
      :sessions-list="scsBridgeController.sessionsList.value"
      @close="bridgeSessionsPopupOpen = false"
    />

    <!-- THE-TURN-OVER-A-GUARD (THE C302 CONSOLIDATION · the SOLE confirmation surface) — the intrusive
         center-vision confirmation · Teleports to body · dims the viewport · Carry into B runs the
         two-call confirmToken handshake (the one canonical carry) · Hard Turn Over = blind ground
         reset · Cancel = nothing moves. -->
    <GitmTurnOverAConfirmModal
      :is-open="turnOverAConfirmOpen"
      :changes-count="turnOverAChangesCount"
      :on-working-branch="turnOverAOnWorkingBranch"
      @confirm="handleTurnOverAConfirmConfirm"
      @hard="handleTurnOverAConfirmHard"
      @cancel="handleTurnOverAConfirmCancel"
    />

    <!-- MD-8 D-NM-2 · THE CREATE OVERLAY — opened by the delegated click on the sidebar's synthetic
         "Create S8" entry (data-concept="suite8-mint"). Mounted here (the only client-hydrated
         tree · the E13 law) so it works from every page. -->
    <Suite8CreateOverlay
      v-if="suite8CreateOverlayOpen"
      @close="suite8CreateOverlayOpen = false"
    />

    <!-- D-RB · THE NAVBAR ROTARY BARREL — teleported INTO the SSR-static .sidebar-nav (that
         container is present before hydration, so the Teleport target is live at mount). Gated by
         barrelReady, which activateSidebarBarrel() flips true only when navItems are in
         __APP_STATE__ AND the nav element exists — so a no-JS / no-navItems load keeps the plain
         static column. The barrel renders the ring in place of the (now .barrel-static-hidden) SSR
         rows, reproducing their exact markup so the mint/collapse delegated listeners still fire. -->
    <Teleport v-if="barrelReady" to=".sidebar-nav">
      <SidebarBarrel />
    </Teleport>
  </div>
</template>

<style scoped>
.island-wrapper {
  min-height: 100vh;
  position: relative;
}

.island-content {
  min-height: 100vh;
  /* W4 · ISLAND-TOOLBAR CLEARANCE — the fixed-bottom TaskBar (position: fixed · height 68px ·
     z-index 110) overlays the last of every island's content with no further scroll. This ONE
     container (the shared scroll surface every island mounts into) gains bottom clearance equal
     to the TaskBar height so EVERY page scrolls fully clear of the bar. Applied at the single
     container (never per-page) — no double-scrollbar (this is padding, not a nested overflow). */
  padding-bottom: 68px;
  box-sizing: border-box;
}

.island-loading,
.island-error,
.island-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2d2d44;
  border-top-color: #4ade80;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.island-error {
  color: #ef4444;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.error-message {
  font-family: monospace;
  font-size: 0.875rem;
}

/* C785 · THE TURN-OVER ALERT BANNER (scp_alert_turn_over) */
.turn-over-alert-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9500;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(760px, calc(100vw - 32px));
  padding: 10px 16px;
  border: 1px solid var(--color-yellow, #eab308);
  border-radius: 8px;
  background: rgba(14, 13, 8, 0.94);
  box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.18), 0 6px 22px rgba(0, 0, 0, 0.5);
  color: var(--color-text, #e8e8e8);
  font-size: 0.85rem;
}
.toab-title {
  font-weight: 700;
  letter-spacing: 0.07em;
  color: var(--color-yellow, #eab308);
  white-space: nowrap;
}
.toab-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.toab-purpose { opacity: 0.95; }
.toab-directive { opacity: 0.7; font-size: 0.76rem; }
.toab-dismiss {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.55;
  font-size: 0.9rem;
  padding: 2px 4px;
  align-self: flex-start;
}
.toab-dismiss:hover { opacity: 1; }

/* C794 · THE PROXY — the Turn Over A control replicated at banner scale (the viridian field ·
   the 8px chamfer · the exit glyph) but INERT: pointer-events none, no cursor, no handler.
   The pulse ring rhymes with the real button's toab-ring so the user pattern-matches. */
.toab-proxy {
  position: relative;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  pointer-events: none;
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
  color: rgb(19, 213, 148);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.6);
}
.toab-proxy-ring {
  position: absolute;
  inset: 2px;
  border: 2px solid var(--color-yellow, #eab308);
  pointer-events: none;
  animation: toabProxyPulse 1.1s ease-in-out infinite;
}
@keyframes toabProxyPulse {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.95; }
}
/* C876 · the proxy PAIR — both controls taught; the directed one focused, the other dimmed. */
.toab-proxy-pair {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}
.toab-proxy--dim {
  opacity: 0.32;
  filter: saturate(0.4);
}
/* C877 · the COLOR is half the identity — each proxy replicates ITS real control's scheme
   (GitmTurnOverAButton = the green · GitmTurnOverBButton = the yellow). The base .toab-proxy
   green stands as the A scheme; --b overrides to the B button's yellow. */
.toab-proxy--b {
  background:
    radial-gradient(ellipse at 38% 30%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 13, 5, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(234, 179, 8, 0.09) 0%, rgba(14, 11, 4, 0) 70%),
    rgb(15, 12, 6);
  border-color: rgba(234, 179, 8, 0.55);
  color: rgb(234, 179, 8);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.6);
}
.toab-proxy--directed {
  opacity: 1;
}
.toab-proxy-tag {
  position: absolute;
  right: 3px;
  bottom: 1px;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-yellow, #eab308);
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

/* C909 · the dock readout — StratiPUNK label, fixed, above everything. */
.dock-readout {
  position: fixed;
  z-index: 2000;
  max-width: 320px;
  padding: 4px 8px;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-yellow, #eab308);
  background: rgb(12, 10, 5);
  border: 1px solid rgba(234, 179, 8, 0.5);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
  pointer-events: none;
}
</style>
