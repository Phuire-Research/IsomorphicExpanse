/**
 * SuiteCascade Concept State Factory
 *
 * The shared `cascades` Record initializes to `{}` — ALWAYS defined, never
 * optional. This satisfies the KeyedSelector requirement: `k.cascades.select()`
 * is always a valid selector. The General Watcher Principle (B-1 TPDF) populates
 * `cascades['General']` at startup from the GRID `Cascade.json`.
 *
 * Citation: S8SC-SCHOLAR-COMPOSITION-GROUNDING.md §3 (createSuiteCascadeState) ·
 *           §3 "No optional properties · both Records initialize as {}".
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §1 (state creator).
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management".
 */
import type { SuiteCascadeState, SuiteCascadeHuirthState } from './suiteCascade.type';
import { GENERAL_CASCADE_DIRECTORY, DEFAULT_SUITE_CASCADE_SUB_PAGE } from './suiteCascade.type';

export function createSuiteCascadeState(): SuiteCascadeState {
  return {
    // Always {} — never optional (Scholar §3; KeyedSelector requirement).
    // General Watcher Principle populates cascades['General'] at boot.
    cascades: {},
    // B-5 SDCR + GRID — DEFAULT = GRID (the General RI, always the assumed default).
    // Re-points to a Suite8's Cascades/ on docking; restored to GRID on un-dock.
    activeCascadeDirectory: GENERAL_CASCADE_DIRECTORY,
    // B-6 HCD — DEFAULT SubPage = 'home' (the General cascade summary surface).
    activeSubPage: DEFAULT_SUITE_CASCADE_SUB_PAGE,
  };
}

// ============================================
// HUIRTH STATE FACTORY (Band B-4 WCJF · SBIS Base)
// ============================================
//
// The server-side (Base) state shares the same `cascades` Record shape as the
// Client (Informative) state. Initializes to {} — the WCJF Cascade.json watcher
// populates cascades['General'] at principle boot (Base dispatch → SMRP/relay).
//
// Citation: scsBridge.state.ts (createScsBridgeHuirthState · Base/Informative split).
// Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state).
export function createSuiteCascadeHuirthState(): SuiteCascadeHuirthState {
  return {
    cascades: {},
    // B-5 SDCR + GRID — server-side Base default = GRID. The WCJF watcher reads this
    // selector to decide which dir's Cascade.json to arm; re-scope dispatch re-points it.
    activeCascadeDirectory: GENERAL_CASCADE_DIRECTORY,
  };
}

export const SUITE_CASCADE_FILTER_KEYS: string[] = [
  'cascades',
  // B-5 SDCR + GRID — the re-scope selector key (watcher reads it; sync broadcasts it).
  'activeCascadeDirectory',
  // B-6 HCD — the SubPage selector key (local-only UI; never synced).
  'activeSubPage',
];
