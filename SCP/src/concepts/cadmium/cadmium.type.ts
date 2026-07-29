/**
 * Cadmium Researcher Concept Type Definitions
 *
 * Generalized research instance carrying the Vermillion Crystraline. Atomic ·
 * lightfast · holds across cycles. CdTe photovoltaic + NiCd rechargeable
 * storage chemistry parallels Renewable Intelligence accumulation.
 *
 * A2-D1 ESTABLISHES THE FOUNDATION:
 *   - 1 live quality (cadmiumSetDesignationName)
 *   - 5 forward-declared skeleton interfaces for A2-D2 thru A2-D6 territories
 *   - State slots reserved · qualities/principles arrive in subsequent cycles
 *
 * Sister-concept Tier-2 access pattern (SBASC): cadmium reads suite8 state
 * via `d.client.d.suite8.k.*` · NOT muxified-into (ECK Tier-3 blocked).
 *
 * Citation: DIAMOND-TIER-M1-A2-D1.md · Wave A
 * Citation: Cadmium Researcher Instance.md (Cascades/8_SUITES/Cadmium Researcher/)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';

export const cadmiumName = 'cadmium';

// ============================================
// C3-D2 · PLANNED QUERY (PQCR)
// ============================================
//
// PlannedQuery is the multi-stage research-execution structure. Each stage carries a
// searchIntent + status + accumulated resultMarkdown.
// Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D2.

export type PlannedQueryStageStatus = 'pending' | 'running' | 'complete' | 'failed';

export type PlannedQueryStage = {
  stageIndex: number;
  label: string;
  searchIntent: string;
  status: PlannedQueryStageStatus;
  resultMarkdown: string;
}

export type PlannedQuery = {
  queryId: string;
  name: string;
  designation: string;
  stages: PlannedQueryStage[];
  overallStatus: PlannedQueryStageStatus;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// C3-D1 · DIAMOND SCALE (DSTS) — research-depth toggle owned by Cadmium
// ============================================
//
// DiamondScale is a Cadmium-specific research-depth concept (suiteCascade has no such
// notion). The value rides on the SCS:Diamond FKIS body as a text parameter (Scale: <value>),
// NOT a suiteCascade quality. Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §5 D2 decision.

export type DiamondScale = 'initial' | 'macro' | 'epoch';

// ============================================
// C4-D1 · CADMIUM ARTICLE (WNPM) — assembled Markdown research artifact (CadmiumBulletin)
// ============================================
//
// The Cadmium instance writes a Markdown article to Cascades/Extended/Cadmium Researcher/{slug}-{ts}.md
// after a SCS:Research / SCS:Vermillion cycle.
// The cadmiumOkMonitor extension reads the file + dispatches cadmiumRegisterArticle (relayed
// serverToClient). The CadmiumBulletin renders markdownContent via `marked`. A SEPARATE Demometer
// from PlannedQuery (PlannedQuery = research-execution structure; CadmiumArticle = the rendered
// output artifact).
// Citation: CADMIUM-C4-OCHRE-BLUEPRINT.md §AD-3.
//
// Macro AB · ARJP/AWCR extension: the optional fields below carry the PAIRED JSON
// (ResearchArticleMeta) preview metadata for an article produced by a PRPL research arc. They
// are OPTIONAL so the prior WNPM Markdown-only path (no sibling JSON) keeps building a valid
// CadmiumArticle. When AWCR detects the paired `<slug>-<ts>.json`, it reads it as
// ResearchArticleMeta (cadmiumResearchVermillion.model.ts) and threads preview/topic/slug/
// sourceCount through so the Bulletin card shows the stored preview WITHOUT re-reading the body.

export type CadmiumArticle = {
  articleId: string;
  title: string;
  filePath: string;
  markdownContent: string;
  createdAt: number;
  // Macro AB · ARJP — stored card preview (from the paired JSON's `preview`). Optional: the
  // prior Markdown-only WNPM path leaves it undefined and the Bulletin falls back to the body.
  preview?: string;
  // Macro AB · ARJP — the research topic this article answers (from the paired JSON's `topic`).
  topic?: string;
  // Macro AB · ARJP — the URL-safe slug shared by the .md/.json pair (from the JSON's `slug`).
  slug?: string;
  // Macro AB · ARJP — count of distinct sources cited (from the JSON's optional `sourceCount`).
  sourceCount?: number;
}

// ============================================
// C4-D1 · CADMIUM TOPIC (TLCR · PQJT) — topics.json tabulation source
// ============================================
//
// topics.json in Cascades/Extended/Cadmium Researcher/ is the TLCR source. The cadmiumOkMonitor extension watches
// topics.json and dispatches cadmiumSetTopics (relayed serverToClient). Rendered as a Pewter
// table in the CadmiumBulletin Planned Query zone. Citation: CADMIUM-C4-OCHRE-BLUEPRINT.md §AD-5.

export type CadmiumTopic = {
  id: string;
  label: string;
  query: string;
  active: boolean;
}

// ============================================
// Macro SM · SHATTERITE MENU STAGE (SMSP · IAJW · AMAF)
// ============================================
//
// A Shatterite Menu whose stages are AUTHORED BY THE AGENT (the page's Anchor instance)
// and progress over time. The agent writes the current stage to menu.json in the page's
// RI dir (`Cascades/Extended/<suite8Name>/menu.json` · the DPASL Cascade Registry
// substrate). The IAJW watcher (cadmiumOkMonitor extension) relays the parsed MenuStage
// to the client menu state so the ShatteriteMenu re-renders on each agent-authored advance.
//
// SMSP: each stage = { stageIndex, title, prompt?, options[] }. The options curry as SCS
//   Commands the Suite 8 uses (kind 'scs' · scsCommand sent via triggerSendMessage).
// AMAF: "Ask More" (kind 'askMore') is MERELY a Focus — on click → triggerFocusSession AND
//   triggerSendMessage(assistPrompt) → the agent writes the next stage → IAJW relays → advance.
// Citation: EPOCH-SR-S2-ORANGE-NAMING.md §Macro SM (SMSP/IAJW/AMAF)
// Citation: EPOCH-SR-S4-GREEN-SCULPT.md H5 (NCEC nextA) + S6 anchor-alive guard

// Macro SM · the Shatterite Menu types now live in the SHARED module (W1 · GTMS8C retrofit).
// Re-exported here so existing cadmium importers (cadmiumMenuRelay.config.ts, the STCP relay
// principles, CadmiumLanding.vue, CadmiumTargetedResearch.vue) keep importing from './cadmium.type'.
// The JSDoc orientation blocks above (Macro SM / Diamond RFI) document the cadmium-side bearing;
// only the type/const definitions moved to model/shatteriteMenu.model.ts.
export type {
  MenuOptionKind,
  MenuOptionInputKind,
  MenuOptionInputConfig,
  MenuOption,
  MenuStage,
} from '../../model/shatteriteMenu.model';
// Local import — the re-export above only re-publishes the names; cadmium.type.ts's OWN
// payload/state/const definitions below reference MenuStage directly, so bring it into scope.
import type { MenuStage } from '../../model/shatteriteMenu.model';

// ============================================
// PAYLOAD TYPES (D1 live)
// ============================================

export type CadmiumSetDesignationNamePayload = {
  designationName: string;
}

// C3-D2 · PlannedQuery payload types
export type CadmiumRegisterPlannedQueryPayload = {
  query: PlannedQuery;
}

export type CadmiumUpdatePlannedQueryStagePayload = {
  queryId: string;
  stageIndex: number;
  status: PlannedQueryStageStatus;
  resultMarkdown: string;
}

// C3-D1 · DiamondScale payload type
export type CadmiumSetDiamondScalePayload = {
  scale: DiamondScale;
}

// C4-D1 · CadmiumArticle payload types (WNPM)
export type CadmiumRegisterArticlePayload = {
  article: CadmiumArticle;
}

// C4-D1 · CadmiumTopic payload type (TLCR · PQJT) — full topics replace
export type CadmiumSetTopicsPayload = {
  topics: CadmiumTopic[];
}

// Diamond RAR · 3rd STCP · ResearchBulletin payload (RELAY reception side · type string
// 'Cadmium Set Research Bulletin' · IS in actionExchange). REUSES CadmiumArticle (no new entry
// type). Full-replace accumulating list written to targeted/researchBulletin.json.
export type CadmiumSetResearchBulletinPayload = {
  researchBulletin: CadmiumArticle[];
}

// Macro SM · MenuStage payload (IAJW relay reception side · agent-authored stage advance)
export type CadmiumSetMenuStagePayload = {
  menuStage: MenuStage;
}

// Diamond TRP · 4th STCP · TargetedMenuStage payload (relay reception side · type string
// 'Cadmium Set Targeted Menu Stage' · IS in actionExchange). Mirrors CadmiumSetMenuStagePayload —
// the Anchor-authored targeted-research live menu stream (targeted/targeted-menu.json).
export type CadmiumSetTargetedMenuStagePayload = {
  targetedMenuStage: MenuStage;
}

// ============================================
// STCP · CADMIUM HUIRTH-SIDE (Base) TYPES — the cadmium Demometer's own server state
// ============================================
//
// Cadmium is client-only today; STCP introduces a THIN Huirth concept holding menuStage as
// Base (server source of truth) so the SBIS+SMRP+BOCR stack the SessionManager has can apply
// to the menu relay. The Huirth-Base quality (cadmiumSetMenuStageHuirthBase · TQNI
// 'Cadmium Set Menu Stage Huirth Base') is Huirth-ONLY (local reducer · NOT in actionExchange);
// the existing relay quality (cadmiumSetMenuStage · 'Cadmium Set Menu Stage') broadcasts to
// clients. Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.0/§2.1.

// Huirth-side (Base) state — the cadmium Demometer's own server source of truth for menuStage
// AND (Diamond RFI · 2nd STCP instance) topics. The Huirth `topics` slot is the SERVER-side
// source of truth the topics STCP relay reads (DISTINCT from the CLIENT `topics` on
// CadmiumClientState · the relay's cadmiumSetTopics reduces into the client slot). KeyedSelector
// discipline: NON-OPTIONAL · seeded to [] in createCadmiumHuirthState. Citation: RFI-DIAMOND-WGB.md §PART B.
export type CadmiumHuirthState = {
  menuStage: MenuStage;
  // Diamond TRP · 4th STCP · the SERVER-side source of truth for the Anchor-authored targeted
  // research live menu (targeted/targeted-menu.json). The targeted-menu STCP relay reads this
  // Huirth slot; the dir-watch SBIS-dispatches cadmiumSetTargetedMenuStageHuirthBase into it FIRST,
  // then the relay (cadmiumSetTargetedMenuStage · 'Cadmium Set Targeted Menu Stage') broadcasts to
  // clients. KeyedSelector discipline: NON-OPTIONAL · seeded to EMPTY_MENU_STAGE in createCadmiumHuirthState.
  targetedMenuStage: MenuStage;
  topics: CadmiumTopic[];
  // Diamond RAR · 3rd STCP · the SERVER-side source of truth for the targeted ResearchBulletin
  // (CadmiumArticle[]). The researchBulletin STCP relay reads this Huirth slot; the dir-watch
  // SBIS-dispatches cadmiumSetResearchBulletinHuirthBase into it FIRST, then the relay
  // (cadmiumSetResearchBulletin · 'Cadmium Set Research Bulletin') broadcasts to clients.
  // KeyedSelector discipline: NON-OPTIONAL · seeded to [] in createCadmiumHuirthState.
  researchBulletin: CadmiumArticle[];
  // Topic Live Bulletin · the SERVER-side source of truth for the merged Topic Bulletin
  // (CadmiumArticle[]). The folder-tree watcher (armFolderTreeWatch) merges every
  // frontier/<slug>/<slug>-<ts>.json into this slot; it SBIS-dispatches
  // cadmiumSetTopicBulletinHuirthBase into it FIRST, then the relay (cadmiumSetTopicBulletin ·
  // 'Cadmium Set Topic Bulletin') broadcasts to clients. KeyedSelector discipline: NON-OPTIONAL ·
  // seeded to [] in createCadmiumHuirthState.
  topicBulletin: CadmiumArticle[];
};

// STCP · W2 Base payload (DISTINCT type string · Huirth-only · NOT in actionExchange).
export type CadmiumSetMenuStageHuirthBasePayload = {
  menuStage: MenuStage;
};

// Diamond TRP · 4th STCP Base payload (DISTINCT type string 'Cadmium Set Targeted Menu Stage
// Huirth Base' · Huirth-only · NOT in actionExchange). The targeted-menu STCP helper SBIS-dispatches
// this Base FIRST (writes the Huirth `targetedMenuStage`), then the relay (cadmiumSetTargetedMenuStage
// · 'Cadmium Set Targeted Menu Stage') broadcasts to clients. Mirrors CadmiumSetMenuStageHuirthBasePayload.
export type CadmiumSetTargetedMenuStageHuirthBasePayload = {
  targetedMenuStage: MenuStage;
};

// Diamond RFI · 2nd STCP Base payload (DISTINCT type string 'Cadmium Set Topics Huirth Base' ·
// Huirth-only · NOT in actionExchange). The topics STCP helper SBIS-dispatches this Base FIRST
// (writes the Huirth `topics`), then the EXISTING relay (cadmiumSetTopics · 'Cadmium Set Topics')
// broadcasts to clients. Citation: RFI-DIAMOND-WGB.md §PART B + §TQNI 6-Site.
export type CadmiumSetTopicsHuirthBasePayload = {
  topics: CadmiumTopic[];
};

// Diamond RAR · 3rd STCP Base payload (DISTINCT type string 'Cadmium Set Research Bulletin Huirth
// Base' · Huirth-only · NOT in actionExchange). The researchBulletin STCP helper SBIS-dispatches
// this Base FIRST (writes the Huirth `researchBulletin`), then the relay (cadmiumSetResearchBulletin
// · 'Cadmium Set Research Bulletin') broadcasts to clients. Mirrors CadmiumSetTopicsHuirthBasePayload.
export type CadmiumSetResearchBulletinHuirthBasePayload = {
  researchBulletin: CadmiumArticle[];
};

// Topic Live Bulletin · RELAY reception payload (type string 'Cadmium Set Topic Bulletin' · IS in
// actionExchange). REUSES CadmiumArticle (no new entry type). The folder-tree merge dispatches the
// merged CadmiumArticle[] (deduped by articleId, newest-first) over the relay → reduces into the
// CLIENT `topicBulletin` slot. Mirrors CadmiumSetResearchBulletinPayload.
export type CadmiumSetTopicBulletinPayload = {
  topicBulletin: CadmiumArticle[];
};

// Topic Live Bulletin · BASE payload (DISTINCT type string 'Cadmium Set Topic Bulletin Huirth Base'
// · Huirth-only · NOT in actionExchange). The folder-tree merge SBIS-dispatches this Base FIRST
// (writes the Huirth `topicBulletin`), then the relay (cadmiumSetTopicBulletin · 'Cadmium Set Topic
// Bulletin') broadcasts to clients. Mirrors CadmiumSetResearchBulletinHuirthBasePayload.
export type CadmiumSetTopicBulletinHuirthBasePayload = {
  topicBulletin: CadmiumArticle[];
};

// ============================================
// STATE DEFINITION
// ============================================

export type CadmiumClientState = {
  // InductionState (for future Diametric routing in A2-D2+)
  actionQue: AnyAction[];
  filterKeys: string[];

  // Cadmium's own designation reference (managed via suite8 concept's registry · this is the pointer)
  cadmiumDesignationName: string;

  // C3-D2 · PlannedQuery list (PQCR)
  plannedQueries: PlannedQuery[];

  // C3-D1 · DiamondScale toggle (DSTS) — research depth · rides on the SCS:Diamond FKIS body
  diamondScale: DiamondScale;

  // C4-D1 · Assembled Markdown research artifacts (WNPM) — populated by the OkMonitor relay
  articles: CadmiumArticle[];

  // C4-D1 · TLCR topics tabulation (PQJT) — populated by the OkMonitor topics.json relay
  topics: CadmiumTopic[];

  // Diamond RAR · 3rd STCP · the targeted ResearchBulletin (CadmiumArticle[]) — populated by the
  // OkMonitor targeted/researchBulletin.json relay (cadmiumSetResearchBulletin). KeyedSelector
  // discipline: NON-OPTIONAL · seeded to [] in createCadmiumClientState.
  researchBulletin: CadmiumArticle[];

  // Topic Live Bulletin · the merged Topic Bulletin (CadmiumArticle[]) — populated by the
  // OkMonitor frontier/ folder-tree merge relay (cadmiumSetTopicBulletin). KeyedSelector
  // discipline: NON-OPTIONAL · seeded to [] in createCadmiumClientState.
  topicBulletin: CadmiumArticle[];

  // Macro SM · SMSP · the current agent-authored Shatterite Menu stage. Populated by the
  // IAJW menu.json watcher relay. KeyedSelector discipline: NON-OPTIONAL · seeded to an
  // empty stage (stageIndex -1 · no options) so the ShatteriteMenu renders its waiting state.
  menuStage: MenuStage;

  // Diamond TRP · 4th STCP · the current Anchor-authored TARGETED-research menu stage. Populated
  // by the targeted/targeted-menu.json watcher relay (cadmiumSetTargetedMenuStage). KeyedSelector
  // discipline: NON-OPTIONAL · seeded to EMPTY_MENU_STAGE (stageIndex -1) so the targeted-research
  // inner ShatteriteMenu renders its waiting/static state until a live stage lands.
  targetedMenuStage: MenuStage;
};

// ============================================
// QUALITY TYPE DEFINITIONS (D1 · 1 live · D2-D6 extend)
// ============================================

export type CadmiumClientQualities = {
  cadmiumSetDesignationName: Quality<CadmiumClientState, CadmiumSetDesignationNamePayload>;
  // C3-D2 · PlannedQuery qualities (PQCR)
  cadmiumRegisterPlannedQuery: Quality<CadmiumClientState, CadmiumRegisterPlannedQueryPayload>;
  cadmiumUpdatePlannedQueryStage: Quality<CadmiumClientState, CadmiumUpdatePlannedQueryStagePayload>;
  // C3-D1 · DiamondScale quality (DSTS)
  cadmiumSetDiamondScale: Quality<CadmiumClientState, CadmiumSetDiamondScalePayload>;
  // C4-D1 · Article qualities (WNPM) — relay reception side (type-matched to the OkMonitor broadcast)
  cadmiumRegisterArticle: Quality<CadmiumClientState, CadmiumRegisterArticlePayload>;
  cadmiumClearArticles: Quality<CadmiumClientState, void>;
  // C4-D1 · Topics quality (TLCR · PQJT) — relay reception side
  cadmiumSetTopics: Quality<CadmiumClientState, CadmiumSetTopicsPayload>;
  // Diamond RAR · 3rd STCP · ResearchBulletin quality (relay reception side · type-matched to the
  // OkMonitor targeted/researchBulletin.json broadcast 'Cadmium Set Research Bulletin').
  cadmiumSetResearchBulletin: Quality<CadmiumClientState, CadmiumSetResearchBulletinPayload>;
  // Topic Live Bulletin · TopicBulletin quality (relay reception side · type-matched to the
  // OkMonitor frontier/ folder-tree merge broadcast 'Cadmium Set Topic Bulletin').
  cadmiumSetTopicBulletin: Quality<CadmiumClientState, CadmiumSetTopicBulletinPayload>;
  // Macro SM · MenuStage quality (SMSP · IAJW) — relay reception side (type-matched to the
  // OkMonitor menu.json broadcast). Reduces the agent-authored stage into the page muxium.
  cadmiumSetMenuStage: Quality<CadmiumClientState, CadmiumSetMenuStagePayload>;
  // Diamond TRP · 4th STCP · TargetedMenuStage quality (relay reception side · type-matched to the
  // OkMonitor targeted/targeted-menu.json broadcast 'Cadmium Set Targeted Menu Stage').
  cadmiumSetTargetedMenuStage: Quality<CadmiumClientState, CadmiumSetTargetedMenuStagePayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type CadmiumClientConcept = Concept<CadmiumClientState, CadmiumClientQualities>;

// STCP · Cadmium Huirth-side qualities + concept (the thin server-Base home for menuStage +
// topics). Two Base qualities, BOTH Huirth-only (local reducer · absent from
// cadmium.muxonomy.ts actionExchange): cadmiumSetMenuStageHuirthBase ('Cadmium Set Menu Stage
// Huirth Base') and (Diamond RFI · 2nd STCP) cadmiumSetTopicsHuirthBase ('Cadmium Set Topics
// Huirth Base'). TQNI byte-match: site (3) of 6 for the topics Base quality.
export type CadmiumHuirthQualities = {
  cadmiumSetMenuStageHuirthBase: Quality<CadmiumHuirthState, CadmiumSetMenuStageHuirthBasePayload>;
  cadmiumSetTopicsHuirthBase: Quality<CadmiumHuirthState, CadmiumSetTopicsHuirthBasePayload>;
  // Diamond RAR · 3rd STCP · Huirth-only Base ('Cadmium Set Research Bulletin Huirth Base' ·
  // ABSENT from cadmium.muxonomy.ts actionExchange · the TQNI invariant).
  cadmiumSetResearchBulletinHuirthBase: Quality<CadmiumHuirthState, CadmiumSetResearchBulletinHuirthBasePayload>;
  // Topic Live Bulletin · Huirth-only Base ('Cadmium Set Topic Bulletin Huirth Base' · ABSENT
  // from cadmium.muxonomy.ts actionExchange · the TQNI invariant).
  cadmiumSetTopicBulletinHuirthBase: Quality<CadmiumHuirthState, CadmiumSetTopicBulletinHuirthBasePayload>;
  // Diamond TRP · 4th STCP · Huirth-only Base ('Cadmium Set Targeted Menu Stage Huirth Base' ·
  // ABSENT from cadmium.muxonomy.ts actionExchange · the TQNI invariant).
  cadmiumSetTargetedMenuStageHuirthBase: Quality<CadmiumHuirthState, CadmiumSetTargetedMenuStageHuirthBasePayload>;
};

export type CadmiumHuirthConcept = Concept<CadmiumHuirthState, CadmiumHuirthQualities>;

export type CadmiumDeck = {
  cadmium: CadmiumClientConcept;
};

export type CadmiumClientDeck = MuxiumDeck & CadmiumDeck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type CadmiumPrinciple = PrincipleFunction<
  CadmiumClientQualities,
  MuxiumDeck & CadmiumDeck,
  CadmiumClientState
>;

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_CADMIUM_DESIGNATION_NAME = 'Cadmium Researcher';

// Macro SM · the empty Shatterite Menu stage seeded at boot (KeyedSelector discipline · the
// menuStage slot is always present). stageIndex -1 signals "no agent-authored stage yet" →
// the ShatteriteMenu renders its disabled/waiting state until the IAJW relay supplies a real one.
// W1 · GTMS8C — re-exported from the SHARED module (lifted out so the Template + the generic
// menu component never depend on cadmium); existing cadmium importers keep importing from here.
export { EMPTY_MENU_STAGE } from '../../model/shatteriteMenu.model';

// Macro SM · the menu.json basename the agent writes + the IAJW watcher monitors, in the
// page's RI dir (`Cascades/Extended/<suite8Name>/menu.json` · DPASL Cascade Registry substrate).
export const CADMIUM_MENU_JSON_BASENAME = 'menu.json';

// Diamond RAR · SDSD · the Diamond-research-paradigm STATIC explainer stage (DMSE/LTIP). Passed
// CadmiumLanding → CadmiumTargetedResearch → ShatteriteMenu `:default-stage` (Cobalt-B). It is a
// pure explainer: Diamond = a single research wave · Macro = a series · Epoch = a series-of-series,
// expanding. The three scale rows are plain `scs`-kind rows tied to the existing DiamondScale
// ('initial'|'macro'|'epoch') — picking a scale asks the Anchor to formalize the Diamond (C866 · askMore per C860). Each row carries the Length meaning
// as a `tooltip`. Rows DISPATCH only when the
// anchor is alive (the existing optionsEnabled gate · S4 H3); a static default never pings (SMUP
// watch untouched). Citation: RAR-DIAMOND-WGB.md §CADMIUM_DIAMOND_STATIC_STAGE CONTENT SPEC.
export const CADMIUM_DIAMOND_STATIC_STAGE: MenuStage = {
  stageIndex: 0,
  title: 'Diamond Research Scale',
  prompt:
    'Your topics feed the Research Frontier \u2014 each active topic\u2019s sweep writes an '
    + 'article to the Topic Bulletin, and Targeted Research builds on those articles: pick a '
    + 'scale below and the Anchor formalizes a research Diamond from them. Every wave is '
    + 'recorded as a cycle on the active Diamond tier (the plan) and diagnosed onto its Onyx '
    + '(what was learned). When a tier fills, a fresh tier forks and the prior is kept, never '
    + 'deleted \u2014 that is the Cascade Memory above. The wave\u2019s cited output lands in '
    + 'the Research Bulletin below, and this menu advances as the Anchor rewrites it to '
    + 'reflect the current Diamond.',
  // Diamond TRP-D · each scale row is an input+pairing option: a text input paired with the
  // bound `pairDirective` (the scale directive). On Submit the row FOCUSES the Anchor + sends
  // `<pairDirective> <user input>` (empty input → the scale directive alone). The Anchor's live
  // targeted-menu.json overrides this static default whenever it authors one (effectiveStage).
  options: [
    {
      label: 'Diamond — Initial (one wave)',
      kind: 'askMore',
      scsCommand: 'SCS:Diamond Scale: initial',
      tooltip: 'Initial — one wave: a single targeted arc, one cited article into the Research Bulletin.',
      inputConfig: {
        kind: 'text',
        pairDirective: 'SCS:Diamond Scale: initial',
        placeholder: 'Describe the research focus…',
      },
    },
    {
      label: 'Macro — Series (multi-wave campaign)',
      kind: 'askMore',
      scsCommand: 'SCS:Diamond Scale: macro',
      tooltip: 'Macro — a series of waves on one subject, breadth-then-depth, cycles accumulating on the same Diamond tier.',
      inputConfig: {
        kind: 'text',
        pairDirective: 'SCS:Diamond Scale: macro',
        placeholder: 'Describe the campaign subject…',
      },
    },
    {
      label: 'Epoch — Series-of-Series (expanding)',
      kind: 'askMore',
      scsCommand: 'SCS:Diamond Scale: epoch',
      tooltip: 'Epoch — a series-of-series relaying forward from the prior wave; the expanding arc that tiers the Cascade Memory.',
      inputConfig: {
        kind: 'text',
        pairDirective: 'SCS:Diamond Scale: epoch',
        placeholder: 'Describe the expanding research arc…',
      },
    },
  ],
};

// Diamond RFI · the topics.json basename the Anchor upserts (CEWT extract-and-write) + the 2nd
// STCP instance (topics relay) monitors, in the SAME RI dir
// (`Cascades/Extended/<suite8Name>/topics.json`). The topics STCP dir-watch SBIS-dispatches the
// parsed CadmiumTopic[] (Base FIRST, then the relay cadmiumSetTopics). Citation: RFI-DIAMOND-WGB.md §PART B.
export const CADMIUM_TOPICS_JSON_BASENAME = 'topics.json';

// Diamond RAR · 3rd STCP · the researchBulletin.json basename the worker writes (DEFERRED) + the
// researchBulletin STCP dir-watch monitors, in the `targeted/` SUBDIR of the Cadmium RI dir
// (`Cascades/Extended/<Cadmium Researcher>/targeted/researchBulletin.json`). Option B subdir →
// the AWCR research watcher (depth:0 · cadmiumOkMonitor) already excludes the subdir; NO
// CADMIUM_NON_RESEARCH_JSON_BASENAMES change. Citation: RAR-DIAMOND-WGB.md §LOCKED 2.
export const CADMIUM_RESEARCH_BULLETIN_JSON_BASENAME = 'researchBulletin.json';

// Diamond TRP · 4th STCP · the targeted-menu.json basename the Anchor authors (the targeted-research
// live menu) + the targeted-menu STCP dir-watch monitors, in the `targeted/` SUBDIR of the Cadmium
// RI dir (`Cascades/Extended/<Cadmium Researcher>/targeted/targeted-menu.json`). The `targeted/`
// subdir already sits BELOW the AWCR depth:0 research watch → NOT added to
// CADMIUM_NON_RESEARCH_JSON_BASENAMES (the subdir exclusion already covers it). Citation: TRP-DIAMOND-WGB.md §R4.
export const CADMIUM_TARGETED_MENU_JSON_BASENAME = 'targeted-menu.json';

// Diamond RAR · the `targeted/` subdir basename under the Cadmium RI dir — the accumulating
// targeted-research store lives one level below the flat (depth:0) research-JSON watch, so the
// 3rd STCP owns it without cross-fire. Citation: RAR-DIAMOND-WGB.md §LOCKED 2.
export const CADMIUM_TARGETED_SUBDIR_BASENAME = 'targeted';

// Topic Live Bulletin · CLBF/FATW · the `frontier/` subdir basename under the Cadmium RI dir —
// the per-session topic-research store. Each worker writes its `<slug>-<ts>.json` into its OWN
// per-slug folder `frontier/<topic-slug>/<slug>-<ts>.json` (W4). The folder-tree watcher
// (armFolderTreeWatch · the FIRST folder-tree STCP instance) watches this dir RECURSIVELY and
// merges every child JSON into one CadmiumArticle[]. Like `targeted/`, `frontier/` sits one level
// below the flat (depth:0) AWCR research-JSON watch, so the legacy AWCR watcher NEVER fires on it
// (no cross-fire · no CADMIUM_NON_RESEARCH_JSON_BASENAMES change). Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §W3.
export const CADMIUM_FRONTIER_SUBDIR_BASENAME = 'frontier';

// Topic Live Bulletin · AMFJ · the materialised aggregate basename the folder-tree merge writes
// (atomic rename) after each dispatch, inside the `frontier/` dir. The BSE LIST endpoint + the C1
// first-load read this ONE consistent file (Option A · no change to registerBulletinEndpoints).
// EXCLUDED from the folder-tree merge (excludeBasenames) so the aggregate never re-folds itself.
// Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §The BSE Aggregating-LIST Extension (Option A).
export const CADMIUM_TOPIC_BULLETIN_JSON_BASENAME = 'topicBulletin.json';

// Macro AB · ARJP/AWCR — the Cadmium RI directory basename under `Cascades/Extended/`. The
// PRPL research worker writes its `<slug>-<ts>.md` + paired `<slug>-<ts>.json` here; the AWCR
// watcher (cadmiumOkMonitor extension) watches this dir for the JSON-completion signal. This is
// the ONE RI dir the new pipeline (Extended) and the converged legacy directives both target
// (the deferred DPASL-D2 SCSNM convergence — supersedes the old `Cascades/Cadmium/`).
export const CADMIUM_RI_DIR_BASENAME = DEFAULT_CADMIUM_DESIGNATION_NAME;

// Macro AB · ARJP — the menu.json basename is excluded from the research-JSON detection so the
// SM IAJW menu watcher and the AB AWCR research watcher never cross-fire on the same `.json`.
// Diamond RFI · L7 — topics.json is ALSO excluded (the 2nd STCP instance owns it via its own
// dir-watch · the AB AWCR research watcher must not cross-fire on it, mirroring the menu.json
// exclusion). Citation: RFI-DIAMOND-WGB.md §L7 (AWCR exclusion).
export const CADMIUM_NON_RESEARCH_JSON_BASENAMES: readonly string[] = [
  CADMIUM_MENU_JSON_BASENAME,
  CADMIUM_TOPICS_JSON_BASENAME,
];
