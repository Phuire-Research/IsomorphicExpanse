/**
 * Cadmium Concept State Factory
 *
 * Citation: DIAMOND-TIER-M1-A2-D1.md · Wave B
 */
import type { CadmiumClientState, DiamondScale } from './cadmium.type';
import { DEFAULT_CADMIUM_DESIGNATION_NAME, EMPTY_MENU_STAGE } from './cadmium.type';

export function createCadmiumClientState(): CadmiumClientState {
  return {
    actionQue: [],
    filterKeys: CADMIUM_FILTER_KEYS,

    cadmiumDesignationName: DEFAULT_CADMIUM_DESIGNATION_NAME,

    // C3-D2 · PlannedQuery list (PQCR) — empty at boot
    plannedQueries: [],
    // C3-D1 · DiamondScale toggle (DSTS) — default 'initial' (single-query sprint)
    diamondScale: 'initial' as DiamondScale,

    // C4-D1 · WNPM articles + TLCR topics — empty at boot (OkMonitor relay populates)
    articles: [],
    topics: [],

    // Diamond RAR · 3rd STCP · targeted ResearchBulletin — empty at boot (OkMonitor
    // targeted/researchBulletin.json relay populates).
    researchBulletin: [],

    // Topic Live Bulletin · merged Topic Bulletin — empty at boot (OkMonitor frontier/
    // folder-tree merge relay populates).
    topicBulletin: [],

    // Macro SM · SMSP · agent-authored Shatterite Menu stage — empty at boot (stageIndex -1).
    // The IAJW menu.json watcher relay populates this as the agent advances stages.
    menuStage: EMPTY_MENU_STAGE,

    // Diamond TRP · 4th STCP · Anchor-authored targeted-research menu stage — empty at boot
    // (stageIndex -1). The targeted/targeted-menu.json watcher relay populates this as the Anchor
    // advances targeted-research stages.
    targetedMenuStage: EMPTY_MENU_STAGE,
  };
}

export const CADMIUM_FILTER_KEYS: string[] = [
  'actionQue',
  'filterKeys',
  'cadmiumDesignationName',
  // C3-D2 + C3-D1 filter keys
  'plannedQueries',
  'diamondScale',
  // C4-D1 WNPM + TLCR filter keys
  'articles',
  'topics',
  // Diamond RAR · 3rd STCP filter key
  'researchBulletin',
  // Topic Live Bulletin · topicBulletin filter key (DECK-K selector tracks it · H1)
  'topicBulletin',
  // Macro SM · SMSP menuStage filter key
  'menuStage',
  // Diamond TRP · 4th STCP targetedMenuStage filter key
  'targetedMenuStage',
];
