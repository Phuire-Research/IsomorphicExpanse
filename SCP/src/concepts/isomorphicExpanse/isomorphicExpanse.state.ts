/**
 * IsomorphicExpanse Concept State Factory
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave A
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management"
 */
import type { IsomorphicExpanseClientState } from './isomorphicExpanse.type';
import { DEFAULT_ISOMORPHICEXPANSE_ACTIVE_TAB, DEFAULT_ISOMORPHICEXPANSE_SUB_PAGE } from './isomorphicExpanse.type';
import { EMPTY_MENU_STAGE } from '../../model/shatteriteMenu.model';

export function createIsomorphicExpanseClientState(): IsomorphicExpanseClientState {
  return {
    // InductionState (required for future Diametric routing)
    actionQue: [],
    filterKeys: ISOMORPHICEXPANSE_FILTER_KEYS,

    // A-1 SPSR · always {} at boot — never optional (KeyedSelector · Scholar §3).
    isomorphicExpanses: {},

    // LEGACY · Designation registry — empty at boot · A2-D1 + future user actions populate
    designations: [],

    // No active designation at boot
    activeDesignationName: '',

    // Default tab: Info Sheet
    activeTab: DEFAULT_ISOMORPHICEXPANSE_ACTIVE_TAB,

    // A-6 HCD · default SubPage: Home (the Suite 8 roster). Local-only UI.
    activeSubPage: DEFAULT_ISOMORPHICEXPANSE_SUB_PAGE,

    // Loaded content slots — populated by D4 Diametric reads
    loadedDiamondContent: '',
    loadedOnyxContent: '',
    loadedBoundCascade: null,
    loadedFileSystemSheet: '',

    // GTMS8C · always present — never optional (KeyedSelector). The menu-watch relay populates a
    // real stage; an unlink resets it to EMPTY_MENU_STAGE.
    menuStage: EMPTY_MENU_STAGE,

    // PRE-EPOCH · BSSM keyed Record — one MenuStage per designation. Always {} at boot
    // (KeyedSelector · the N-watcher SMRP relay populates per-designation keys at runtime).
    shatteriteMenus: {},
  };
}

export const ISOMORPHICEXPANSE_FILTER_KEYS: string[] = [
  'actionQue',
  'filterKeys',
  // A-1 SPSR · the new shared Record key.
  'isomorphicExpanses',
  // LEGACY designation slots.
  'designations',
  'activeDesignationName',
  'activeTab',
  // A-6 HCD · the SubPage selector key (local-only UI; never synced).
  'activeSubPage',
  'loadedDiamondContent',
  'loadedOnyxContent',
  'loadedBoundCascade',
  'loadedFileSystemSheet',
  // GTMS8C · the Anchor-authored Shatterite Menu stage (local-only · driven by the IAJW relay).
  'menuStage',
  // PRE-EPOCH · BSSM keyed Record of per-designation Shatterite Menu stages.
  'shatteriteMenus',
];
