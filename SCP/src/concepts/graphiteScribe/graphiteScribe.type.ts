/**
 * GraphiteScribe Concept Type Definitions
 *
 * Universal Designation Carrier. Each Suite 8 designation (Conductor · domain
 * Suite 8 · spawned ClaudeCode instance) maintains its OWN Renewable
 * Intelligence Pairing — Diamond + Onyx + BoundCascade.json. The graphiteScribe
 * Concept holds these as STATE for the active designation being viewed/managed.
 *
 * The Page surface (GraphiteScribePage.vue) renders three tabs:
 *   - Info Sheet (default) — FS Read of the Suite 8 directory
 *   - D-O Viewer — Diamond + Onyx markdown render
 *   - Settings (default when muxified elsewhere) — per-muxification config
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 * Citation: CLAUDE.md C5 Renewable Intelligence (D-O Muxified Read)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';
// A-1 SCBM · Tier-2 muxified member types — GraphiteScribe muxifies SuiteCascade, so the
// Deck carries `d.suiteCascade` (the ONE shared instance · Scholar §1/§2). Type-only
// import — the runtime muxification lives in graphiteScribe.concept.client.ts.
import type { SuiteCascadeState, SuiteCascadeQualities } from '../suiteCascade/suiteCascade.type';
// GTMS8C · the shared Shatterite Menu stage contract (W1 · model/shatteriteMenu.model.ts).
import type { MenuStage, MenuDocument } from '../../model/shatteriteMenu.model';

// ============================================================
// GTMS8C · THE CASCADING CONSTANT (TQNI-RT single edit site)
// ============================================================
// The ONE rename target. The install Opus edits this string + mv's the dir/files + the
// non-derivable surfaces (muxonomy registration key, islandRegistry key, imports, componentPath).
// Every Verbose Split Naming type string derives from it via VERBOSE() below — so a rename of the
// constant REGENERATES all quality type strings (no missed-string silent dead receptor · S4 verdict).
export const GRAPHITESCRIBE_CONCEPT_NAME = 'graphiteScribe';

// Backward-compat alias — the existing 30+ importers reference `graphiteScribeName`. Keep it pointing at
// the constant so nothing breaks; the rename edits GRAPHITESCRIBE_CONCEPT_NAME and the alias follows.
export const graphiteScribeName = GRAPHITESCRIBE_CONCEPT_NAME;

// VERBOSE · Verbose Split Naming derivation. 'graphiteScribe' + 'SetMenuStage' → 'GraphiteScribe Set Menu Stage'.
// Title-cases the concept token, space-splits the PascalCase verb. The Stratimux action dispatch
// matches by THIS string — derive it, never hand-type it, so the rename can never drift (TQNI).
const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const splitPascal = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
export const VERBOSE = (verb: string): string =>
  `${titleCase(GRAPHITESCRIBE_CONCEPT_NAME)} ${splitPascal(verb)}`;
// e.g. VERBOSE('SetMenuStage') === 'GraphiteScribe Set Menu Stage'
//      VERBOSE('SetMenuStageHuirthBase') === 'GraphiteScribe Set Menu Stage Huirth Base'
// NOTE (VERBOSE resolution · Blue W2): the 2 menu qualities + the muxonomy use the LITERAL form
// of these derived strings (cadmium precedent · createQualityCardWithPayload `type` is always a
// literal in this codebase). VERBOSE() is the canonical reference + the rename anchor; the literals
// carry a `// = VERBOSE('...')` comment so the cascading-constant edit + the TQNI-RT zero-grep
// Concluder cover the relay-critical surface.

// ============================================
// DESIGNATION + TAB TYPES
// ============================================

export type GraphiteScribeDesignation = {
  name: string;
  diamondPath: string;
  onyxPath: string;
  cascadeJsonPath: string;
  directoryPath: string;
  description?: string;
  color?: string;
};

// ============================================
// A-1 SPSR · Shared-Plurality-GraphiteScribe-Record ENTRY
// ============================================
// One entry per Suite 8, keyed in the `graphiteScribes` Record by its NDEP Name (the literal
// `Cascades/8_SUITES/<Name>/` directory entry). NO optional props — KeyedSelector
// requirement (S13 §4). The minimal identity+routing surface; A-2 MPRF registers
// entries from the directory substrate, A-6 HCD renders the roster.
export type GraphiteScribeEntry = {
  name: string;            // NDEP — directory-entry Name; uniquely resolves Instance.md
  directoryPath: string;   // Cascades/8_SUITES/<Name>/
  description: string;     // never optional (KeyedSelector)
  color: string;           // never optional (KeyedSelector)
};

export type GraphiteScribeTab = 'info' | 'doviewer' | 'settings';

// ============================================
// A-6 HCD SUBPAGE TRIAD — Home · Component · Documentation
// ============================================
//
// The GraphiteScribe Landing renders a SubPage triad (HCD), mirroring the SuiteCascade
// (B-6) + scsBridge SubPage precedent. `activeSubPage` is a pure-UI, local-only
// selector (never synced — NOT in `sync.filterKeys`): a single v-if/v-else-if
// chain in the Landing keys off it. 'home' is the default (the Suite 8 roster).
//
// Citation: suiteCascade.type.ts SuiteCascadeSubPage union (DIRECT bearing · B-6).
// Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
// MD-CE-4 · 'editor' joins the triad — the CM6+vim surface SubPage (the Epoch's actual editor).
export type GraphiteScribeSubPage = 'home' | 'component' | 'documentation' | 'editor';

// ============================================
// STATE DEFINITION (Client-Side · InductionState included)
// ============================================

export type GraphiteScribeClientState = {
  // InductionState (for future Diametric routing in D4)
  actionQue: AnyAction[];
  filterKeys: string[];

  // A-1 SPSR · the new sole-aspiration property — one Record keyed by NDEP Name.
  // Shared without overload (Scholar §1). A-2 MPRF populates from `Cascades/8_SUITES/`.
  // Coexists with the legacy `designations` array (see reconciliation note below); the
  // future migration folds `designations` consumers (3 qualities + Vue) onto this Record.
  graphiteScribes: Record<string, GraphiteScribeEntry>;

  // LEGACY (A-1 reconciliation) · Designation registry — the existing array surface the
  // 8 qualities + GraphiteScribePage/GraphiteScribeLanding still read. Retained to keep the live concept
  // compiling in one Band; A-2/A-6 migrate consumers to `graphiteScribes`.
  designations: GraphiteScribeDesignation[];

  // Active designation being viewed/managed
  activeDesignationName: string;

  // Active tab on the Suite 8 Page
  activeTab: GraphiteScribeTab;

  // A-6 HCD — the active SubPage of the GraphiteScribe Landing triad (Home · Component ·
  // Documentation). Pure-UI, local-only (never synced); DEFAULT = 'home'.
  activeSubPage: GraphiteScribeSubPage;

  // Loaded content for the active designation (populated by D4 Diametric file reads)
  loadedDiamondContent: string;
  loadedOnyxContent: string;
  loadedBoundCascade: Record<string, unknown> | null;
  loadedFileSystemSheet: string;

  // GTMS8C · the current agent-authored Shatterite Menu stage (FKIS · IAJW relay drives it).
  // KeyedSelector discipline · NON-OPTIONAL · seeded to EMPTY_MENU_STAGE in createGraphiteScribeClientState.
  // LEGACY (scalar · the single-designation pipe). Retained alongside the keyed Record during the
  // PRE-EPOCH refinement; the keyed `shatteriteMenus` is the N-designation surface (BSSM).
  menuStage: MenuStage;

  // PRE-EPOCH · BSSM keyed Record — one MenuStage per Suite 8 designation (keyed by NDEP Name).
  // The N-watcher principle (WPS) writes a per-designation stage via the keyed Base quality; the
  // SMRP relay broadcasts the keyed relay; this page reads shatteriteMenus[graphiteScribeName]. Always {}
  // at boot — never optional (KeyedSelector · BSSM-Type non-optional discipline).
  shatteriteMenus: Record<string, MenuDocument>;

  // MD-CE-3 · THE EPOCH LAW'S HOLDING HALF (STRATIMUX HOLDS · HTTP TRANSFERS IN).
  // The editor's open-file buffers live HERE — the /editor-fs endpoints (MD-CE-2) are the
  // transfer surface; this state is the single holder. Local-only (never synced); the
  // savedContent mirror is the dirty Concluder (dirty = content !== savedContent).
  // KeyedSelector discipline: all four NON-OPTIONAL, seeded in createGraphiteScribeClientState.
  openFiles: Record<string, GraphiteScribeOpenFile>;
  tabOrder: string[];
  activeFilePath: string;
  editorSettings: GraphiteScribeSettings;
};

// MD-CE-3 · one held buffer per open file (keyed by SCP-root-relative path).
export type GraphiteScribeOpenFile = {
  path: string;
  content: string;
  savedContent: string;
  dirty: boolean;
};

// MD-CE-3 · the held editor settings (the C418 MUSTs: vim first-class · autosave · editable).
// MD-CE-6 binds these to editorConfig.json (the hifiConfig precedent); the state holds them.
export type GraphiteScribeSettings = {
  vimEnabled: boolean;
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  tabSize: number;
  fontSize: number;
  wordWrap: boolean;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

// A-2 MPRF · SPSR Record registration payload (keyed by NDEP Name).
export type GraphiteScribeRegisterGraphiteScribePayload = {
  name: string;
  entry: GraphiteScribeEntry;
};

export type GraphiteScribeRegisterDesignationPayload = {
  designation: GraphiteScribeDesignation;
};

export type GraphiteScribeSetActiveDesignationPayload = {
  designationName: string;
};

export type GraphiteScribeSetActiveTabPayload = {
  tab: GraphiteScribeTab;
};

// A-6 HCD — set the active SubPage (Home · Component · Documentation). Local-only UI.
export type GraphiteScribeSetActiveSubPagePayload = {
  activeSubPage: GraphiteScribeSubPage;
};

export type GraphiteScribeSetDiamondContentPayload = {
  diamondContent: string;
};

export type GraphiteScribeSetOnyxContentPayload = {
  onyxContent: string;
};

export type GraphiteScribeSetBoundCascadePayload = {
  boundCascade: Record<string, unknown> | null;
};

export type GraphiteScribeSetFileSystemSheetPayload = {
  fileSystemSheet: string;
};

// GTMS8C · MenuStage relay-reception payload (FKIS · the Anchor-authored Shatterite stage).
export type GraphiteScribeSetMenuStagePayload = {
  menuStage: MenuStage;
};
// GTMS8C · Huirth-side Base payload (DISTINCT type string · VERBOSE('SetMenuStageHuirthBase') ·
// Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type GraphiteScribeSetMenuStageHuirthBasePayload = {
  menuStage: MenuStage;
};

// PRE-EPOCH · BSSM keyed relay-reception payload (designation + stage · keyed merge on client state).
export type GraphiteScribeSetDesignationMenuStagePayload = {
  designation: string;
  menuStage: MenuDocument;
};
// PRE-EPOCH · BSSM keyed Huirth-side Base payload (DISTINCT type · VERBOSE('SetDesignationMenuStageHuirthBase')
// · Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type GraphiteScribeSetDesignationMenuStageHuirthBasePayload = {
  designation: string;
  menuStage: MenuDocument;
};

// MD-CE-3 · THE EDITOR-HOLDING PAYLOADS (the six mutations over openFiles/tabOrder/
// activeFilePath/editorSettings — every one a partial-state reducer return).
export type GraphiteScribeOpenFilePayload = {
  path: string;
  content: string;
};
export type GraphiteScribeCloseFilePayload = {
  path: string;
};
export type GraphiteScribeSetActiveFilePayload = {
  path: string;
};
export type GraphiteScribeUpdateBufferPayload = {
  path: string;
  content: string;
};
export type GraphiteScribeMarkFileSavedPayload = {
  path: string;
};
export type GraphiteScribeSetEditorSettingsPayload = {
  settings: Partial<GraphiteScribeSettings>;
};

// ============================================
// QUALITY TYPE DEFINITIONS
// ============================================

export type GraphiteScribeClientQualities = {
  graphiteScribeRegisterGraphiteScribe: Quality<GraphiteScribeClientState, GraphiteScribeRegisterGraphiteScribePayload>;
  graphiteScribeRegisterDesignation: Quality<GraphiteScribeClientState, GraphiteScribeRegisterDesignationPayload>;
  graphiteScribeRegisterSampleDesignations: Quality<GraphiteScribeClientState, void>;
  graphiteScribeSetActiveDesignation: Quality<GraphiteScribeClientState, GraphiteScribeSetActiveDesignationPayload>;
  graphiteScribeSetActiveTab: Quality<GraphiteScribeClientState, GraphiteScribeSetActiveTabPayload>;
  // A-6 HCD · local SubPage selector — Home · Component · Documentation triad.
  graphiteScribeSetActiveSubPage: Quality<GraphiteScribeClientState, GraphiteScribeSetActiveSubPagePayload>;
  graphiteScribeSetDiamondContent: Quality<GraphiteScribeClientState, GraphiteScribeSetDiamondContentPayload>;
  graphiteScribeSetOnyxContent: Quality<GraphiteScribeClientState, GraphiteScribeSetOnyxContentPayload>;
  graphiteScribeSetBoundCascade: Quality<GraphiteScribeClientState, GraphiteScribeSetBoundCascadePayload>;
  graphiteScribeSetFileSystemSheet: Quality<GraphiteScribeClientState, GraphiteScribeSetFileSystemSheetPayload>;
  // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
  graphiteScribeSetMenuStage: Quality<GraphiteScribeClientState, GraphiteScribeSetMenuStagePayload>;
  // PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
  graphiteScribeSetDesignationMenuStage: Quality<GraphiteScribeClientState, GraphiteScribeSetDesignationMenuStagePayload>;
  // MD-CE-3 · the editor-holding six (STRATIMUX HOLDS — the buffers live in this concept).
  graphiteScribeOpenFile: Quality<GraphiteScribeClientState, GraphiteScribeOpenFilePayload>;
  graphiteScribeCloseFile: Quality<GraphiteScribeClientState, GraphiteScribeCloseFilePayload>;
  graphiteScribeSetActiveFile: Quality<GraphiteScribeClientState, GraphiteScribeSetActiveFilePayload>;
  graphiteScribeUpdateBuffer: Quality<GraphiteScribeClientState, GraphiteScribeUpdateBufferPayload>;
  graphiteScribeMarkFileSaved: Quality<GraphiteScribeClientState, GraphiteScribeMarkFileSavedPayload>;
  graphiteScribeSetEditorSettings: Quality<GraphiteScribeClientState, GraphiteScribeSetEditorSettingsPayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type GraphiteScribeClientConcept = Concept<GraphiteScribeClientState, GraphiteScribeClientQualities>;

// ============================================================
// GTMS8C · HUIRTH FACE (thin server-Base home for menuStage + the STCP relay)
// ============================================================
export type GraphiteScribeHuirthState = {
  menuStage: MenuStage;
  // PRE-EPOCH · BSSM keyed Record mirror on the Huirth (Base) side. The N-watcher dir-watch writes
  // a per-designation stage here via the keyed Base quality (Base-maintenance · Seam 2); the SMRP
  // relay reads this Record selector + broadcasts the keyed relay. Always {} at boot (KeyedSelector).
  shatteriteMenus: Record<string, MenuDocument>;
};
export type GraphiteScribeHuirthQualities = {
  graphiteScribeSetMenuStageHuirthBase: Quality<GraphiteScribeHuirthState, GraphiteScribeSetMenuStageHuirthBasePayload>;
  // PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
  graphiteScribeSetDesignationMenuStageHuirthBase: Quality<
    GraphiteScribeHuirthState,
    GraphiteScribeSetDesignationMenuStageHuirthBasePayload
  >;
};
export type GraphiteScribeHuirthConcept = Concept<GraphiteScribeHuirthState, GraphiteScribeHuirthQualities>;

// A-1 SCBM · GraphiteScribe muxifies SuiteCascade → the Deck carries `suiteCascade` at Tier 2
// (flat, ONE shared instance · Scholar §2). DECK K reach:
//   d.graphiteScribe.k.graphiteScribes.select()                    — Tier 1 (own Record)
//   d.suiteCascade.k.cascades.select()    — Tier 2 (shared Record)
// NEVER Tier 3 — SuiteCascade muxifies nothing further (ECK ceiling satisfied by design).
export type GraphiteScribeDeck = {
  graphiteScribe: GraphiteScribeClientConcept & {
    d: {
      suiteCascade: Concept<SuiteCascadeState, SuiteCascadeQualities>;
    };
  };
};

export type GraphiteScribeClientDeck = MuxiumDeck & GraphiteScribeDeck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type GraphiteScribePrinciple = PrincipleFunction<
  GraphiteScribeClientQualities,
  MuxiumDeck & GraphiteScribeDeck,
  GraphiteScribeClientState
>;

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_GRAPHITESCRIBE_ACTIVE_TAB: GraphiteScribeTab = 'info';

// A-6 HCD — the default SubPage the Landing opens on (the Suite 8 roster).
export const DEFAULT_GRAPHITESCRIBE_SUB_PAGE: GraphiteScribeSubPage = 'home';
export const GRAPHITESCRIBE_TABS: { value: GraphiteScribeTab; label: string }[] = [
  { value: 'info', label: 'Info Sheet' },
  { value: 'doviewer', label: 'D-O Viewer' },
  { value: 'settings', label: 'Settings' },
];

// GTMS8C · the Suite 8 designation display name — the RI dir basename under Cascades/Extended/
// AND the graphiteScribeName the menu-watch principle + PAOLRP match in sessionsList. The install Opus
// sets this to the user's domain (one of the non-derivable surfaces · see W5 rename list).
export const DEFAULT_GRAPHITESCRIBE_DESIGNATION_NAME = 'GraphiteScribe';
// GTMS8C · the menu.json basename the Anchor writes + the menu-watch dir-watch monitors.
export const GRAPHITESCRIBE_MENU_JSON_BASENAME = 'menu.json';
