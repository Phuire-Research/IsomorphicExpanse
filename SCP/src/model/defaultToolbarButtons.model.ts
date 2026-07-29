/**
 * Default Toolbar Buttons — Reserved Button Configurations (M2-A2-D2)
 *
 * Canonical configuration for the 4 reserved toolbar buttons that ship
 * with every SCS-Bridge bar. Bridge boot dispatches these via the
 * `bootDefaultToolbar` quality.
 *
 *   turn-over   — Pewter Hard Turn Over (refolded from M1-A1-D6 standalone)
 *   send-message — Cobalt Send Message PoC (M2-A2-D3 target)
 *   install-scp — Pewter Install Personalized SCP (AJMI Main Menu mirror anchor)
 *   log-dump    — Fuchsia Log Dump UI (M2-P3 consumer surface)
 *
 * Higher-Order Composition: pure data — no state, no I/O. The toolbar
 * registration quality consumes this constant; the Vue surface renders
 * what the state contains.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D2 (refold)
 * Citation: M1-A1-D6 (original standalone scsBridgeTriggerHardTurnOver quality)
 * Citation: toolbarRegistration.model.ts RESERVED_TOOLBAR_BUTTON_IDS (M2-A2-D1)
 */
import type { ToolbarButtonRegistration } from '../concepts/scsBridge/scsBridge.type';

// GITM A↔B Refinement (Sword epoch) — the generic 'turn-over' default button
// (TOOLBAR_BUTTON_TURN_OVER · plain SCP hard-restart via scsBridgeTriggerHardTurnOver) is
// REMOVED. The A/B reserve-mechanism setters (Shield · Sword) + their turn-overs supersede it
// for gitm users. Removed from BOTH DEFAULT_TOOLBAR_BUTTONS and RESERVED_TOOLBAR_BUTTON_IDS.

/**
 * Bridge Sessions button — Cycle 157 Wave 4 (TaskBar Pewter Pass).
 *
 * Opens the ScsBridgeSessionsPopup overlay (DUPP) which embeds
 * ScsBridgeSessionManagement.vue (the same surface as the Sessions
 * SubPage, surfaced as quick-access).
 *
 * `kind: 'static'` — single click toggles popup-open; no ARMED/FIRE
 * 2-step confirmation. `componentName: 'ScsBridgeSessionsButton'`
 * resolves via Shell.vue taskBarComponentMap by id (no override needed
 * since map key matches id — declared for forward-compat with overrides).
 *
 * actionQualityName is reserved as a future routing target; Cycle 157
 * Wave 4 wires Shell-level popup state directly (Quality dispatch
 * deferred to a follow-up wave when popup ownership migrates into
 * scsBridge state).
 */
export const TOOLBAR_BUTTON_BRIDGE_SESSIONS: ToolbarButtonRegistration = {
  id: 'bridge-sessions',
  label: 'Session Management',
  icon: 'fa-solid fa-terminal',
  kind: 'static',
  suiteColor: 'cobalt',
  actionQualityName: 'Scs Bridge Open Sessions Popup',
  enabled: true,
  componentName: 'ScsBridgeSessionsButton',
  // Session Management onto the Bridge Dock — the Session Manager rides beside the SCS-Bridge
  // controls (the GitM dock group). position 'left' → 'right', and the DEFAULT_TOOLBAR_BUTTONS
  // order below leads the FINAL DOCK GROUP with it (immediately before 'stable-a').
  position: 'right',
};

/**
 * Install SCP button — AJMI Main Menu mirror anchor (Conference-side it's
 * shown via deriveMainMenuMirrorEntry; bridge-side it's a permanent toolbar
 * presence).
 *
 * On click, dispatches `scsBridgeSetInstallMenuOpen({ installMenuOpen: true })`.
 */
export const TOOLBAR_BUTTON_INSTALL_SCP: ToolbarButtonRegistration = {
  id: 'install-scp',
  label: 'Install SCP',
  icon: 'fa-solid fa-plus',
  kind: 'static',
  suiteColor: 'pewter',
  actionQualityName: 'Scs Bridge Set Install Menu Open',
  enabled: true,
  position: 'left',
};

/**
 * Log Dump button — surfaces the M2-P3 rotation port for user inspection.
 *
 * On click, dispatches a future `scsBridgeOpenLogDump` quality (M2-Final or
 * follow-up) that flips a UI sub-page. For M2-A2-D2 the button registers
 * pointing at the placeholder — UI handler wired post-cycle.
 */
export const TOOLBAR_BUTTON_LOG_DUMP: ToolbarButtonRegistration = {
  id: 'log-dump',
  label: 'Log Dump',
  icon: 'fa-solid fa-file-lines',
  kind: 'static',
  suiteColor: 'fuchsia',
  actionQualityName: 'Scs Bridge Set Active Sub Page',
  enabled: true,
  position: 'right',
};

/**
 * Send Message button — M2-A2-D3 target. Registers as DISABLED in the
 * default boot so users see the button exists but cannot fire until D3
 * wires the dispatch path.
 */
export const TOOLBAR_BUTTON_SEND_MESSAGE: ToolbarButtonRegistration = {
  id: 'send-message',
  label: 'Send Message',
  icon: 'fa-solid fa-paper-plane',
  kind: 'interactive',
  suiteColor: 'cobalt',
  actionQualityName: 'Scs Bridge Send Bridge Message',
  enabled: false, // M2-A2-D3 wires the dispatch path · flips enabled=true then
  position: 'center',
};

/**
 * Turn Over button — the PROVEN sole-fuchsia hard SCP restart (RESTORED · the pre-#641 blind
 * mechanism the user references). CGDA 2-click → emit 'turn-over-triggered' → TaskBar
 * buttonClicked('turn-over') → IslandWrapper → controller.triggerHardTurnOver() → huirth writes
 * .bridge-restart.json → nodemon respawn → the standby overlay on the WebSocket close. Resolved by
 * id 'turn-over' in the componentMap (no componentName). ADDITIVE alongside the A/B group — the
 * proven base the two-step A/B methodology composes upon.
 */
export const TOOLBAR_BUTTON_TURN_OVER: ToolbarButtonRegistration = {
  id: 'turn-over',
  label: 'Turn Over',
  icon: 'fa-solid fa-rotate',
  kind: 'interactive',
  suiteColor: 'fuchsia',
  actionQualityName: 'Scs Bridge Trigger Hard Turn Over',
  enabled: true,
  position: 'right',
};

// ============================================
// GITM A↔B-R (#641-R) — THE DUALTURN A/B RESERVE-MECHANISM GROUP
// ============================================
//
// A distinct group for the Stable A / Turn Over A / Turn Over B / Merge B→A flow. The
// existing 'turn-over' button (plain SCP restart) is NOT replaced — these are additive.
// #641-R DUALTURN: the combined 'turn-over-ab' is SPLIT into 'turn-over-a' (return to A)
// + 'turn-over-b' (turn over to B + confirm-success + CHANGEDIAL badge); 'create-b' is
// RETIRED (B auto-populates via the bridge BSEED auto-advance — no manual create path).
// 'stable-a', 'turn-over-a', and 'turn-over-b' route to custom Vue components (componentName).

/**
 * Stable A button — branch selector + commit-message input (custom component).
 * The component dispatches gitm_stage_all_and_commit then gitm_register_stable (sequential).
 */
export const TOOLBAR_BUTTON_STABLE_A: ToolbarButtonRegistration = {
  id: 'stable-a',
  label: 'Stable A',
  icon: 'fa-solid fa-shield-halved',
  kind: 'static',
  suiteColor: 'viridian',
  actionQualityName: 'Gitm Register Stable',
  enabled: true,
  componentName: 'GitmStableAButton',
  position: 'right',
};

/**
 * Turn Over A button — #641-R DUALTURN A-side (return to stable A · custom component).
 * Source is always 'A'; CGDA 2-click → gitm_turn_over_with_source { source: 'A' }. NO
 * localStorage write (A is the known-good baseline). Enabled when abMode !== 'idle'.
 */
export const TOOLBAR_BUTTON_TURN_OVER_A: ToolbarButtonRegistration = {
  id: 'turn-over-a',
  label: 'Turn Over A',
  icon: 'fa-solid fa-arrow-right-from-bracket',
  kind: 'interactive',
  suiteColor: 'viridian',
  actionQualityName: 'Gitm Turn Over With Source',
  enabled: true,
  componentName: 'GitmTurnOverAButton',
  position: 'right',
};

/**
 * Sword B button — GITM A↔B Refinement (Sword epoch) · the B SETTER (custom component),
 * symmetric mirror of the Shield A-setter. DUAL-MODE keyed on whether the Shield/Origin is
 * fully committed:
 *   - Mode 1 (A DIRTY): a commit-message panel → gitm_branch_create { checkout: true }
 *     (carries the drift onto a new B) → gitm_stage_all_and_commit { message } →
 *     gitm_register_stable {} (registers the from-branch A as stableBranch · the deadlock guard).
 *   - Mode 2 (A CLEAN): PRISMATIC — a branch-selector hop (the subsumed Freehop · Mode 2 donor
 *     panel lifted from GitmFreehopButton). The standalone Freehop is removed in favor of this.
 * Carries the dedicated-enumeration badge: changesPrimedOnB only when currentBranch===workingBranch.
 * Icon: fa-khanda (the closest free blade glyph in the FA7 free set — fa-sword/swords are Pro-only).
 * Ochre/B palette (matching the Turn-Over B precedent).
 */
export const TOOLBAR_BUTTON_SWORD_B: ToolbarButtonRegistration = {
  id: 'sword-b',
  label: 'Sword B',
  icon: 'fa-solid fa-khanda',
  kind: 'static',
  suiteColor: 'ochre',
  actionQualityName: 'Gitm Branch Create',
  enabled: true,
  componentName: 'GitmSwordBButton',
  position: 'right',
};

/**
 * Turn Over B button — #641-R DUALTURN B-side (turn over to B + confirm-success · custom
 * component). Source is always 'B'; CGDA 2-click writes the GITM_TURNOVER_KEY failsafe then
 * dispatches gitm_turn_over_with_source { source: 'B' }. In the 'turned-over' abMode it
 * surfaces the Confirm B Success gesture (gitm_confirm_success). Shows the CHANGEDIAL badge.
 */
export const TOOLBAR_BUTTON_TURN_OVER_B: ToolbarButtonRegistration = {
  id: 'turn-over-b',
  label: 'Turn Over B',
  icon: 'fa-solid fa-arrow-right-to-bracket',
  kind: 'interactive',
  suiteColor: 'ochre',
  actionQualityName: 'Gitm Turn Over With Source',
  enabled: true,
  componentName: 'GitmTurnOverBButton',
  position: 'right',
};

/**
 * Merge B→A button — the fifth dock component (Cycle 278 · HiFi Purple pop). The custom
 * component owns the MERGEGATE (gitmController.mergeEnabled) + CGDA + the ?-badge explainer
 * link — the registration enabled flag is moot on the component path (mirrors the A/B dock
 * siblings).
 */
export const TOOLBAR_BUTTON_MERGE_B_A: ToolbarButtonRegistration = {
  id: 'merge-b-a',
  label: 'Merge B→A',
  icon: 'fa-solid fa-code-merge',
  kind: 'interactive',
  suiteColor: 'amethyst',
  actionQualityName: 'Gitm Merge Working',
  enabled: true,
  componentName: 'GitmMergeBAButton',
  position: 'right',
};

// GITM A↔B Refinement (Sword epoch) — the standalone Freehop button (TOOLBAR_BUTTON_BRANCH_HOP)
// is REMOVED. Its branch-selector panel is SUBSUMED into the Sword's Mode 2 (Prismatic
// Free-Hop). The GitmFreehopButton.vue file is retained only as the Mode-2 panel donor.
// Removed from BOTH DEFAULT_TOOLBAR_BUTTONS and RESERVED_TOOLBAR_BUTTON_IDS.

/**
 * The canonical default toolbar set. Bridge boot dispatches this whole
 * set via `bootDefaultToolbar` quality.
 *
 * Order MATCHES RESERVED_TOOLBAR_BUTTON_IDS for render-stability — the
 * `sortToolbarButtonsForRender` function would yield this order anyway,
 * but defining it explicitly makes the boot output predictable.
 */
export const DEFAULT_TOOLBAR_BUTTONS: readonly ToolbarButtonRegistration[] = [
  TOOLBAR_BUTTON_SEND_MESSAGE,
  TOOLBAR_BUTTON_INSTALL_SCP,
  TOOLBAR_BUTTON_LOG_DUMP,
  // Session Management onto the Bridge Dock — the Session Manager now LEADS the FINAL DOCK
  // GROUP (Sessions | Shield · Turn-Over A · Sword · Turn-Over B · Merge), riding beside the
  // SCS-Bridge (GitM) controls. The array order IS the render order within a zone.
  TOOLBAR_BUTTON_BRIDGE_SESSIONS,
  // GITM A↔B Refinement Sword epoch — the FINAL DOCK GROUP (right cluster, in order):
  //   Shield (A-set) · Turn-Over A · Sword (B-set · dual-mode) · Turn-Over B · Merge B→A.
  // The generic 'turn-over' default + standalone 'branch-hop' (Freehop) are REMOVED.
  TOOLBAR_BUTTON_STABLE_A,
  TOOLBAR_BUTTON_TURN_OVER_A,
  TOOLBAR_BUTTON_SWORD_B,
  TOOLBAR_BUTTON_TURN_OVER_B,
  TOOLBAR_BUTTON_MERGE_B_A,
];
