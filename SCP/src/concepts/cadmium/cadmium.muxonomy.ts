/**
 * Cadmium Muxonomy Configuration
 *
 * Citation: DIAMOND-TIER-M1-A2-D1.md · Wave C
 * Citation: M1-P1 actionExchange API
 *
 * D1: 1 quality (cadmiumSetDesignationName local reducer) · empty
 * actionExchange · navigation entry. A2-D2 thru A2-D6 fill the rest.
 */
import {
  type MuxonomicConfig,
  type NavigationConfig,
  type PageEntry,
  ChangeDetectionMode,
  DeploymentTarget,
  ExchangeDirection,
} from '../muxonomy/muxonomy.model';

const cadmiumLandingPage: PageEntry = {
  path: '/cadmium',
  label: 'Cadmium Researcher',
  order: 0,
  componentPath: 'cadmium/vue/CadmiumLanding',
  isMain: true,
};

export const cadmiumNavigation: NavigationConfig = {
  // C4-D3 · PHBA — Cadmium is THE site landing (/). The CadmiumBulletin is the Epoch homepage:
  // getLandingIsland() resolves to this island, so `/` routes to /cadmium. Other nav items still
  // render; only the `/` fallback changes. Citation: CADMIUM-C4-OCHRE-BLUEPRINT.md §AD-4.
  // FT-009 correction (user): cadmium is NOT a main landing in the template — the DEFAULT
  // Home owns the landing until a user domain page claims it (scs suite8:page --home).
  isMainLanding: false,
  icon: '🧪',
  color: 'orange',
  label: 'Cadmium Researcher',
  order: 4,
  pages: [cadmiumLandingPage],
};

export const cadmiumMuxonomic: MuxonomicConfig<'cadmium'> = {
  conceptName: 'cadmium',

  filterKeys: [
    'actionQue',
    'filterKeys',
    'cadmiumDesignationName',
    // C3-D2 + C3-D1
    'plannedQueries',
    'diamondScale',
    // C4-D1 WNPM + TLCR
    'articles',
    'topics',
    // Diamond RAR · 3rd STCP researchBulletin
    'researchBulletin',
    // Topic Live Bulletin · folder-tree topicBulletin
    'topicBulletin',
    // Macro SM · SMSP menuStage
    'menuStage',
    // Diamond TRP · 4th STCP targetedMenuStage
    'targetedMenuStage',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: ['cadmiumDesignationName'],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'cadmiumSetDesignationName',
        type: 'Cadmium Set Designation Name',
        filePath: 'qualities/setDesignationName.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // C3-D2 · PlannedQuery qualities (PQCR)
      {
        name: 'cadmiumRegisterPlannedQuery',
        type: 'Cadmium Register Planned Query',
        filePath: 'qualities/cadmiumRegisterPlannedQuery.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'cadmiumUpdatePlannedQueryStage',
        type: 'Cadmium Update Planned Query Stage',
        filePath: 'qualities/cadmiumUpdatePlannedQueryStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // C3-D1 · DiamondScale quality (DSTS)
      {
        name: 'cadmiumSetDiamondScale',
        type: 'Cadmium Set Diamond Scale',
        filePath: 'qualities/cadmiumSetDiamondScale.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // C4-D1 · WNPM Article qualities (relay reception side · type-matched to OkMonitor broadcast)
      {
        name: 'cadmiumRegisterArticle',
        type: 'Cadmium Register Article',
        filePath: 'qualities/cadmiumRegisterArticle.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'cadmiumClearArticles',
        type: 'Cadmium Clear Articles',
        filePath: 'qualities/cadmiumClearArticles.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // C4-D1 · TLCR Topics quality (PQJT · relay reception side)
      {
        name: 'cadmiumSetTopics',
        type: 'Cadmium Set Topics',
        filePath: 'qualities/cadmiumSetTopics.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // Diamond RAR · 3rd STCP · ResearchBulletin quality (relay reception side · type-matched to
      // the OkMonitor targeted/researchBulletin.json broadcast). TQNI byte-match: 'Cadmium Set
      // Research Bulletin'. The Huirth Base ('...Huirth Base') is ABSENT here (Huirth-only invariant).
      {
        name: 'cadmiumSetResearchBulletin',
        type: 'Cadmium Set Research Bulletin',
        filePath: 'qualities/cadmiumSetResearchBulletin.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // Topic Live Bulletin · TopicBulletin quality (relay reception side · type-matched to the
      // OkMonitor frontier/ folder-tree merge broadcast). TQNI byte-match: 'Cadmium Set Topic
      // Bulletin'. The Huirth Base ('...Huirth Base') is ABSENT here (Huirth-only invariant).
      {
        name: 'cadmiumSetTopicBulletin',
        type: 'Cadmium Set Topic Bulletin',
        filePath: 'qualities/cadmiumSetTopicBulletin.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // Macro SM · SMSP · MenuStage quality (IAJW relay reception side · type-matched to the
      // OkMonitor menu.json broadcast). TQNI byte-match: 'Cadmium Set Menu Stage'.
      {
        name: 'cadmiumSetMenuStage',
        type: 'Cadmium Set Menu Stage',
        filePath: 'qualities/cadmiumSetMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // Diamond TRP · 4th STCP · TargetedMenuStage quality (relay reception side · type-matched to
      // the OkMonitor targeted/targeted-menu.json broadcast). TQNI byte-match: 'Cadmium Set Targeted
      // Menu Stage'. The Huirth Base ('...Huirth Base') is ABSENT here (Huirth-only invariant · H-INV).
      {
        name: 'cadmiumSetTargetedMenuStage',
        type: 'Cadmium Set Targeted Menu Stage',
        filePath: 'qualities/cadmiumSetTargetedMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'CadmiumHuirthDeck',
    client: 'CadmiumClientDeck',
  },

  navigation: cadmiumNavigation,

  // C4-D1 WNPM/TLCR · serverToClient relay routes — the cadmiumOkMonitor reads the written
  // Markdown article / topics.json and broadcasts these action types to all clients via
  // webSocketServerAppendToActionQue (explicit broadcast · mirrors the suiteCascade SMRP relay
  // precedent). The matching-type CLIENT qualities (cadmiumRegisterArticle / cadmiumSetTopics)
  // reduce the broadcast into CadmiumLanding's page-muxium state.
  actionExchange: {
    clientToServer: [],
    serverToClient: [
      {
        qualityName: 'cadmiumRegisterArticle',
        actionType: 'Cadmium Register Article',
        direction: ExchangeDirection.ServerToClient,
      },
      {
        qualityName: 'cadmiumSetTopics',
        actionType: 'Cadmium Set Topics',
        direction: ExchangeDirection.ServerToClient,
      },
      // Diamond RAR · 3rd STCP · targeted/researchBulletin.json relay route — the cadmiumOkMonitor
      // researchBulletin watcher reads the written file and broadcasts this type via
      // webSocketServerAppendToActionQue. TQNI byte-match: qualityName 'cadmiumSetResearchBulletin'
      // · actionType 'Cadmium Set Research Bulletin'. The Huirth Base is NOT routed here (Huirth-only).
      {
        qualityName: 'cadmiumSetResearchBulletin',
        actionType: 'Cadmium Set Research Bulletin',
        direction: ExchangeDirection.ServerToClient,
      },
      // Topic Live Bulletin · frontier/ folder-tree merge relay route — the cadmiumOkMonitor
      // folder-tree watcher merges every frontier/<slug>/<slug>-<ts>.json and broadcasts this type
      // via webSocketServerAppendToActionQue. TQNI byte-match: qualityName 'cadmiumSetTopicBulletin'
      // · actionType 'Cadmium Set Topic Bulletin'. The Huirth Base is NOT routed here (Huirth-only).
      {
        qualityName: 'cadmiumSetTopicBulletin',
        actionType: 'Cadmium Set Topic Bulletin',
        direction: ExchangeDirection.ServerToClient,
      },
      // Macro SM · SMSP · IAJW menu.json relay route — the cadmiumOkMonitor menu watcher reads
      // the agent-written menu.json and broadcasts this type via webSocketServerAppendToActionQue.
      // TQNI byte-match: qualityName 'cadmiumSetMenuStage' · actionType 'Cadmium Set Menu Stage'.
      {
        qualityName: 'cadmiumSetMenuStage',
        actionType: 'Cadmium Set Menu Stage',
        direction: ExchangeDirection.ServerToClient,
      },
      // Diamond TRP · 4th STCP · targeted/targeted-menu.json relay route — the cadmiumOkMonitor
      // targeted-menu watcher reads the Anchor-written file and broadcasts this type via
      // webSocketServerAppendToActionQue. TQNI byte-match: qualityName 'cadmiumSetTargetedMenuStage'
      // · actionType 'Cadmium Set Targeted Menu Stage'. The Huirth Base is NOT routed here (Huirth-only · H-INV).
      {
        qualityName: 'cadmiumSetTargetedMenuStage',
        actionType: 'Cadmium Set Targeted Menu Stage',
        direction: ExchangeDirection.ServerToClient,
      },
    ],
  },
};
