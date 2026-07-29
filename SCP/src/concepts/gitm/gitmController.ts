/**
 * GitM Controller Interface (Global · read-only reactive gitmJson)
 *
 * Tier 2 (Island Wrapper) creates and provides this controller.
 * Tier 3 (the A/B button group · Shell) accesses via Vue inject anor global lookup.
 *
 * Pattern: Continuous Sync Client Muxium (CSCM) — structural replica of
 * scsBridgeController.ts scoped to ONE field (gitmJson).
 * - Stratimux MAINTAINS authoritative state (gitm BASE concept relay)
 * - Vue controller MIRRORS via sync()
 * - Vue reads but doesn't own
 *
 * Decision 2 (S3 Yellow Blueprint §W4a): STATE-READ ONLY. NO dispatch method —
 * triggerGitmAction stays on scsBridgeController (the action-pipe lives in
 * ScsBridgeClientState). This controller is the reactive READ of gitmJson only.
 * The button group dispatches via getGlobalScsBridgeController().triggerGitmAction(...).
 *
 * mergeEnabled centralizes the MERGEGATE (LOCKED Q3) so IslandWrapper + the buttons
 * share ONE gate definition: bMergeable && changesPrimedOnB === 0 && lastTurnOverResult === 'success'.
 *
 * GITM A↔B Refinement (#641-R) · S3 Yellow Blueprint §W4 · S5 Blue Wave W4.
 * Citation: scsBridgeController.ts (CSCM template · CCKE InjectionKey-at-top · GRGL).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W4a.
 */
import { shallowRef, computed, type ShallowRef, type ComputedRef, type InjectionKey } from 'vue';
import type { GitmABMode, GitmJsonShape } from './gitm.type';

// ============================================
// CCKE · Controller Key Co-located at TOP (mirrors scsBridgeController.ts)
// ============================================

export const GITM_CONTROLLER_KEY: InjectionKey<GitmController> = Symbol('gitmController');

// ============================================
// SYNC STATE SHAPE
// ============================================
//
// Mirror of GitmClientState the button group consumes (gitmJson only).
// Partial-update semantics: only provided keys overwrite refs.

export type GitmBarSyncState = {
  gitmJson: GitmJsonShape | null;
  // W3c · THE LIVENESS LEG (the Turn-Over Disconnect Guard) — the WS-connection witness carried
  // alongside gitmJson so isLive/isHeld compose from ONE synced source. Fed by gitmDisplayPrinciple
  // from the scsBridge controller's connectionEstablished ref (partial-update · omit → unchanged).
  connectionEstablished: boolean;
};

// ============================================
// CONTROLLER TYPE
// ============================================

export type GitmController = {
  // ----------------------------------------
  // Vue-owned state ref · mirrors Stratimux gitm state (the gitm.json relay).
  // shallowRef per scsBridgeController precedent · replace entire value on change.
  // ----------------------------------------

  gitmJson: ShallowRef<GitmJsonShape | null>;

  // ----------------------------------------
  // Convenience computeds the buttons read (derive from gitmJson — no extra sync surface).
  // ----------------------------------------

  abMode: ComputedRef<GitmABMode>;
  bMergeable: ComputedRef<boolean>;
  changesPrimedOnB: ComputedRef<number>;
  // GITM color-cascade (W2 · Counter B) — commits-between divergence (rev-list A..B). The Turn-Over
  // A badge reads this (UNLIKE the Shield's working-TREE changesPrimedOnB).
  commitsDivergenceCount: ComputedRef<number>;
  // MERGEGATE (LOCKED Q3) — the ONE gate shared by IslandWrapper + the Merge button.
  mergeEnabled: ComputedRef<boolean>;

  // ----------------------------------------
  // W3c · THE LIVENESS GATE (the Turn-Over Disconnect Guard) — ONE derived source the Sword's
  // creation invitation + its action handlers read. The B-creation invite MUST NOT fire while the
  // Bridge is dark: a blank workingBranch during the post-reload MOCH gap (gitmJson still null) or a
  // dropped WS reads as "no B" and would invite a FALSE forge mid-crash. isLive composes both.
  // ----------------------------------------

  // The raw WS witness the display principle syncs from scsBridge.connectionEstablished.
  connectionEstablished: ShallowRef<boolean>;
  // isLive = connected AND a real gitmJson has landed (the last-known-good survived the dark hour).
  isLive: ComputedRef<boolean>;
  // isHeld = the dark hour (NOT isLive) — the Sword renders a HELD state, never the Forge invite.
  isHeld: ComputedRef<boolean>;

  // ----------------------------------------
  // Sync method · called by gitmDisplayPrinciple on every selector fire.
  // ----------------------------------------

  sync: (state: Partial<GitmBarSyncState>) => void;
};

// ============================================
// CONTROLLER FACTORY
// ============================================

/**
 * Creates a GitM controller instance with Continuous Sync semantics (read-only).
 *
 * Usage in IslandWrapper.vue:
 * ```typescript
 * const gitmController = createGitmController();
 * provide(GITM_CONTROLLER_KEY, gitmController);  // GRGL provide
 * setGlobalGitmController(gitmController);        // GRGL global
 * ```
 *
 * CSCM Flow:
 * 1. Island mounts → ClientMuxium created → gitmDisplayPrinciple starts
 * 2. Principle gets controller via getGlobalGitmController()
 * 3. Principle monitors gitm state via DECK K selector (gitmJson)
 * 4. On state change → principle calls controller.sync({ gitmJson })
 * 5. Vue refs update → the A/B button group + Merge gate re-render
 * 6. Island unmounts → principle cleanup
 */
export function createGitmController(): GitmController {
  // Vue-owned ref · mirror of Stratimux gitm state (the relay payload).
  const gitmJson = shallowRef<GitmJsonShape | null>(null);

  // W3c · THE LIVENESS WITNESS (the Turn-Over Disconnect Guard) — the WS-connection state synced
  // from the scsBridge controller. Boots false: a fresh muxium is dark until the socket opens, so
  // the Sword is HELD (not falsely inviting) through the pre-connect window too.
  const connectionEstablished = shallowRef<boolean>(false);

  const abMode = computed<GitmABMode>(() => gitmJson.value?.abMode ?? 'idle');
  const bMergeable = computed<boolean>(() => gitmJson.value?.bMergeable ?? false);
  const changesPrimedOnB = computed<number>(() => gitmJson.value?.changesPrimedOnB ?? 0);
  // GITM color-cascade (W2 · Counter B) — commits-between divergence (default 0 · the Turn-Over A badge).
  const commitsDivergenceCount = computed<number>(() => gitmJson.value?.commitsDivergenceCount ?? 0);
  // MERGEGATE (LOCKED Q3 · D-BN-3 refinement) — B must be mergeable, with zero uncommitted
  // changes, the last turn-over confirmed success, REAL divergence to merge (commits on B not
  // yet on A — no changes, no active Merge), AND the seat verifiably ON the working B
  // (roles-first, pointer fallback). One gate definition shared across IslandWrapper + buttons.
  const mergeEnabled = computed<boolean>(() => {
    const j = gitmJson.value;
    if (!j) return false;
    const bBranch = j.branchRoles?.b ?? j.workingBranch;
    return (
      j.bMergeable &&
      j.changesPrimedOnB === 0 &&
      j.lastTurnOverResult === 'success' &&
      j.commitsDivergenceCount > 0 &&
      bBranch !== '' &&
      j.currentBranch === bBranch
    );
  });

  // W3c · THE LIVENESS GATE — isLive holds ONLY when the socket is up AND a real gitmJson has
  // landed. The dark hour (WS dropped) OR the post-reload MOCH gap (gitmJson still null) reads as
  // NOT live, so the Sword's B-creation invite (which derives "no B" from a blank workingBranch)
  // renders HELD instead of falsely forging.
  const isLive = computed<boolean>(() => connectionEstablished.value && gitmJson.value !== null);
  const isHeld = computed<boolean>(() => !isLive.value);

  /**
   * Sync state from the Stratimux gitm concept · only updates provided keys.
   */
  const sync = (state: Partial<GitmBarSyncState>): void => {
    if (state.gitmJson !== undefined) {
      gitmJson.value = state.gitmJson;
    }
    // W3c · THE LIVENESS LEG — the connection witness rides the same partial-update contract.
    if (state.connectionEstablished !== undefined) {
      connectionEstablished.value = state.connectionEstablished;
    }
  };

  return {
    gitmJson,
    abMode,
    bMergeable,
    changesPrimedOnB,
    commitsDivergenceCount,
    mergeEnabled,
    connectionEstablished,
    isLive,
    isHeld,
    sync,
  };
}

// ============================================
// TYPE GUARD
// ============================================

export function isGitmController(obj: unknown): obj is GitmController {
  if (!obj || typeof obj !== 'object') return false;
  const controller = obj as GitmController;
  return 'gitmJson' in controller && typeof controller.sync === 'function';
}

// ============================================
// GRGL · GLOBAL CONTROLLER REFERENCE
// ============================================
//
// Bridges Stratimux muxium context with Vue provide/inject context.
// Two registration paths · BOTH wired in IslandWrapper:
//   - provide(GITM_CONTROLLER_KEY, controller)  → Vue inject in Tier 3
//   - setGlobalGitmController(controller)        → principle lookup
//
// Pattern matches scsBridgeController.ts GRGL.

let globalGitmController: GitmController | null = null;

export function setGlobalGitmController(controller: GitmController | null): void {
  globalGitmController = controller;
  console.log('[GitmController] Global controller', controller ? 'registered' : 'cleared');
}

export function getGlobalGitmController(): GitmController | null {
  return globalGitmController;
}

export function clearGlobalGitmController(): void {
  globalGitmController = null;
  console.log('[GitmController] Global controller cleared');
}
