/**
 * FrontierCircuitTest Concept Type Definitions
 *
 * Universal Designation Carrier. Each Suite 8 designation (Conductor · domain
 * Suite 8 · spawned ClaudeCode instance) maintains its OWN Renewable
 * Intelligence Pairing — Diamond + Onyx + BoundCascade.json. The frontierCircuitTest
 * Concept holds these as STATE for the active designation being viewed/managed.
 *
 * The Page surface (FrontierCircuitTestPage.vue) renders three tabs:
 *   - Info Sheet (default) — FS Read of the Suite 8 directory
 *   - D-O Viewer — Diamond + Onyx markdown render
 *   - Settings (default when muxified elsewhere) — per-muxification config
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 * Citation: CLAUDE.md C5 Renewable Intelligence (D-O Muxified Read)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';
// A-1 SCBM · Tier-2 muxified member types — FrontierCircuitTest muxifies SuiteCascade, so the
// Deck carries `d.suiteCascade` (the ONE shared instance · Scholar §1/§2). Type-only
// import — the runtime muxification lives in frontierCircuitTest.concept.client.ts.
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
export const FRONTIERCIRCUITTEST_CONCEPT_NAME = 'frontierCircuitTest';

// Backward-compat alias — the existing 30+ importers reference `frontierCircuitTestName`. Keep it pointing at
// the constant so nothing breaks; the rename edits FRONTIERCIRCUITTEST_CONCEPT_NAME and the alias follows.
export const frontierCircuitTestName = FRONTIERCIRCUITTEST_CONCEPT_NAME;

// VERBOSE · Verbose Split Naming derivation. 'frontierCircuitTest' + 'SetMenuStage' → 'FrontierCircuitTest Set Menu Stage'.
// Title-cases the concept token, space-splits the PascalCase verb. The Stratimux action dispatch
// matches by THIS string — derive it, never hand-type it, so the rename can never drift (TQNI).
const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const splitPascal = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
export const VERBOSE = (verb: string): string =>
  `${titleCase(FRONTIERCIRCUITTEST_CONCEPT_NAME)} ${splitPascal(verb)}`;
// e.g. VERBOSE('SetMenuStage') === 'FrontierCircuitTest Set Menu Stage'
//      VERBOSE('SetMenuStageHuirthBase') === 'FrontierCircuitTest Set Menu Stage Huirth Base'
// NOTE (VERBOSE resolution · Blue W2): the 2 menu qualities + the muxonomy use the LITERAL form
// of these derived strings (cadmium precedent · createQualityCardWithPayload `type` is always a
// literal in this codebase). VERBOSE() is the canonical reference + the rename anchor; the literals
// carry a `// = VERBOSE('...')` comment so the cascading-constant edit + the TQNI-RT zero-grep
// Concluder cover the relay-critical surface.

// ============================================
// DESIGNATION + TAB TYPES
// ============================================

export type FrontierCircuitTestDesignation = {
  name: string;
  diamondPath: string;
  onyxPath: string;
  cascadeJsonPath: string;
  directoryPath: string;
  description?: string;
  color?: string;
};

// ============================================
// A-1 SPSR · Shared-Plurality-FrontierCircuitTest-Record ENTRY
// ============================================
// One entry per Suite 8, keyed in the `frontierCircuitTests` Record by its NDEP Name (the literal
// `Cascades/8_SUITES/<Name>/` directory entry). NO optional props — KeyedSelector
// requirement (S13 §4). The minimal identity+routing surface; A-2 MPRF registers
// entries from the directory substrate, A-6 HCD renders the roster.
export type FrontierCircuitTestEntry = {
  name: string;            // NDEP — directory-entry Name; uniquely resolves Instance.md
  directoryPath: string;   // Cascades/8_SUITES/<Name>/
  description: string;     // never optional (KeyedSelector)
  color: string;           // never optional (KeyedSelector)
};

export type FrontierCircuitTestTab = 'info' | 'doviewer' | 'settings';

// ============================================
// A-6 HCD SUBPAGE TRIAD — Home · Component · Documentation
// ============================================
//
// The FrontierCircuitTest Landing renders a SubPage triad (HCD), mirroring the SuiteCascade
// (B-6) + scsBridge SubPage precedent. `activeSubPage` is a pure-UI, local-only
// selector (never synced — NOT in `sync.filterKeys`): a single v-if/v-else-if
// chain in the Landing keys off it. 'home' is the default (the Suite 8 roster).
//
// Citation: suiteCascade.type.ts SuiteCascadeSubPage union (DIRECT bearing · B-6).
// Citation: MASTER-DIAMOND-FRONTIERCIRCUITTEST-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
export type FrontierCircuitTestSubPage = 'home' | 'component' | 'documentation';

// ============================================
// STATE DEFINITION (Client-Side · InductionState included)
// ============================================

export type FrontierCircuitTestClientState = {
  // InductionState (for future Diametric routing in D4)
  actionQue: AnyAction[];
  filterKeys: string[];

  // A-1 SPSR · the new sole-aspiration property — one Record keyed by NDEP Name.
  // Shared without overload (Scholar §1). A-2 MPRF populates from `Cascades/8_SUITES/`.
  // Coexists with the legacy `designations` array (see reconciliation note below); the
  // future migration folds `designations` consumers (3 qualities + Vue) onto this Record.
  frontierCircuitTests: Record<string, FrontierCircuitTestEntry>;

  // LEGACY (A-1 reconciliation) · Designation registry — the existing array surface the
  // 8 qualities + FrontierCircuitTestPage/FrontierCircuitTestLanding still read. Retained to keep the live concept
  // compiling in one Band; A-2/A-6 migrate consumers to `frontierCircuitTests`.
  designations: FrontierCircuitTestDesignation[];

  // Active designation being viewed/managed
  activeDesignationName: string;

  // Active tab on the Suite 8 Page
  activeTab: FrontierCircuitTestTab;

  // A-6 HCD — the active SubPage of the FrontierCircuitTest Landing triad (Home · Component ·
  // Documentation). Pure-UI, local-only (never synced); DEFAULT = 'home'.
  activeSubPage: FrontierCircuitTestSubPage;

  // Loaded content for the active designation (populated by D4 Diametric file reads)
  loadedDiamondContent: string;
  loadedOnyxContent: string;
  loadedBoundCascade: Record<string, unknown> | null;
  loadedFileSystemSheet: string;

  // GTMS8C · the current agent-authored Shatterite Menu stage (FKIS · IAJW relay drives it).
  // KeyedSelector discipline · NON-OPTIONAL · seeded to EMPTY_MENU_STAGE in createFrontierCircuitTestClientState.
  // LEGACY (scalar · the single-designation pipe). Retained alongside the keyed Record during the
  // PRE-EPOCH refinement; the keyed `shatteriteMenus` is the N-designation surface (BSSM).
  menuStage: MenuStage;

  // PRE-EPOCH · BSSM keyed Record — one MenuStage per Suite 8 designation (keyed by NDEP Name).
  // The N-watcher principle (WPS) writes a per-designation stage via the keyed Base quality; the
  // SMRP relay broadcasts the keyed relay; this page reads shatteriteMenus[frontierCircuitTestName]. Always {}
  // at boot — never optional (KeyedSelector · BSSM-Type non-optional discipline).
  shatteriteMenus: Record<string, MenuDocument>;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

// A-2 MPRF · SPSR Record registration payload (keyed by NDEP Name).
export type FrontierCircuitTestRegisterFrontierCircuitTestPayload = {
  name: string;
  entry: FrontierCircuitTestEntry;
};

export type FrontierCircuitTestRegisterDesignationPayload = {
  designation: FrontierCircuitTestDesignation;
};

export type FrontierCircuitTestSetActiveDesignationPayload = {
  designationName: string;
};

export type FrontierCircuitTestSetActiveTabPayload = {
  tab: FrontierCircuitTestTab;
};

// A-6 HCD — set the active SubPage (Home · Component · Documentation). Local-only UI.
export type FrontierCircuitTestSetActiveSubPagePayload = {
  activeSubPage: FrontierCircuitTestSubPage;
};

export type FrontierCircuitTestSetDiamondContentPayload = {
  diamondContent: string;
};

export type FrontierCircuitTestSetOnyxContentPayload = {
  onyxContent: string;
};

export type FrontierCircuitTestSetBoundCascadePayload = {
  boundCascade: Record<string, unknown> | null;
};

export type FrontierCircuitTestSetFileSystemSheetPayload = {
  fileSystemSheet: string;
};

// GTMS8C · MenuStage relay-reception payload (FKIS · the Anchor-authored Shatterite stage).
export type FrontierCircuitTestSetMenuStagePayload = {
  menuStage: MenuStage;
};
// GTMS8C · Huirth-side Base payload (DISTINCT type string · VERBOSE('SetMenuStageHuirthBase') ·
// Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type FrontierCircuitTestSetMenuStageHuirthBasePayload = {
  menuStage: MenuStage;
};

// PRE-EPOCH · BSSM keyed relay-reception payload (designation + stage · keyed merge on client state).
export type FrontierCircuitTestSetDesignationMenuStagePayload = {
  designation: string;
  // C766 · the staged conversion: the keyed circuit carries the WHOLE MenuDocument (all stages +
  // currentStageIndex) under the historical field name — the wire/action shape is unchanged.
  menuStage: MenuDocument;
};
// PRE-EPOCH · BSSM keyed Huirth-side Base payload (DISTINCT type · VERBOSE('SetDesignationMenuStageHuirthBase')
// · Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type FrontierCircuitTestSetDesignationMenuStageHuirthBasePayload = {
  designation: string;
  menuStage: MenuDocument;
};

// ============================================
// QUALITY TYPE DEFINITIONS
// ============================================

export type FrontierCircuitTestClientQualities = {
  frontierCircuitTestRegisterFrontierCircuitTest: Quality<FrontierCircuitTestClientState, FrontierCircuitTestRegisterFrontierCircuitTestPayload>;
  frontierCircuitTestRegisterDesignation: Quality<FrontierCircuitTestClientState, FrontierCircuitTestRegisterDesignationPayload>;
  frontierCircuitTestRegisterSampleDesignations: Quality<FrontierCircuitTestClientState, void>;
  frontierCircuitTestSetActiveDesignation: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetActiveDesignationPayload>;
  frontierCircuitTestSetActiveTab: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetActiveTabPayload>;
  // A-6 HCD · local SubPage selector — Home · Component · Documentation triad.
  frontierCircuitTestSetActiveSubPage: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetActiveSubPagePayload>;
  frontierCircuitTestSetDiamondContent: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetDiamondContentPayload>;
  frontierCircuitTestSetOnyxContent: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetOnyxContentPayload>;
  frontierCircuitTestSetBoundCascade: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetBoundCascadePayload>;
  frontierCircuitTestSetFileSystemSheet: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetFileSystemSheetPayload>;
  // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
  frontierCircuitTestSetMenuStage: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetMenuStagePayload>;
  // PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
  frontierCircuitTestSetDesignationMenuStage: Quality<FrontierCircuitTestClientState, FrontierCircuitTestSetDesignationMenuStagePayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type FrontierCircuitTestClientConcept = Concept<FrontierCircuitTestClientState, FrontierCircuitTestClientQualities>;

// ============================================================
// GTMS8C · HUIRTH FACE (thin server-Base home for menuStage + the STCP relay)
// ============================================================
export type FrontierCircuitTestHuirthState = {
  menuStage: MenuStage;
  // PRE-EPOCH · BSSM keyed Record mirror on the Huirth (Base) side. The N-watcher dir-watch writes
  // a per-designation stage here via the keyed Base quality (Base-maintenance · Seam 2); the SMRP
  // relay reads this Record selector + broadcasts the keyed relay. Always {} at boot (KeyedSelector).
  shatteriteMenus: Record<string, MenuDocument>;
};
export type FrontierCircuitTestHuirthQualities = {
  frontierCircuitTestSetMenuStageHuirthBase: Quality<FrontierCircuitTestHuirthState, FrontierCircuitTestSetMenuStageHuirthBasePayload>;
  // PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
  frontierCircuitTestSetDesignationMenuStageHuirthBase: Quality<
    FrontierCircuitTestHuirthState,
    FrontierCircuitTestSetDesignationMenuStageHuirthBasePayload
  >;
};
export type FrontierCircuitTestHuirthConcept = Concept<FrontierCircuitTestHuirthState, FrontierCircuitTestHuirthQualities>;

// A-1 SCBM · FrontierCircuitTest muxifies SuiteCascade → the Deck carries `suiteCascade` at Tier 2
// (flat, ONE shared instance · Scholar §2). DECK K reach:
//   d.frontierCircuitTest.k.frontierCircuitTests.select()                    — Tier 1 (own Record)
//   d.suiteCascade.k.cascades.select()    — Tier 2 (shared Record)
// NEVER Tier 3 — SuiteCascade muxifies nothing further (ECK ceiling satisfied by design).
export type FrontierCircuitTestDeck = {
  frontierCircuitTest: FrontierCircuitTestClientConcept & {
    d: {
      suiteCascade: Concept<SuiteCascadeState, SuiteCascadeQualities>;
    };
  };
};

export type FrontierCircuitTestClientDeck = MuxiumDeck & FrontierCircuitTestDeck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type FrontierCircuitTestPrinciple = PrincipleFunction<
  FrontierCircuitTestClientQualities,
  MuxiumDeck & FrontierCircuitTestDeck,
  FrontierCircuitTestClientState
>;

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_FRONTIERCIRCUITTEST_ACTIVE_TAB: FrontierCircuitTestTab = 'info';

// A-6 HCD — the default SubPage the Landing opens on (the Suite 8 roster).
export const DEFAULT_FRONTIERCIRCUITTEST_SUB_PAGE: FrontierCircuitTestSubPage = 'home';
export const FRONTIERCIRCUITTEST_TABS: { value: FrontierCircuitTestTab; label: string }[] = [
  { value: 'info', label: 'Info Sheet' },
  { value: 'doviewer', label: 'D-O Viewer' },
  { value: 'settings', label: 'Settings' },
];

// GTMS8C · the Suite 8 designation display name — the RI dir basename under Cascades/Extended/
// AND the frontierCircuitTestName the menu-watch principle + PAOLRP match in sessionsList. The install Opus
// sets this to the user's domain (one of the non-derivable surfaces · see W5 rename list).
export const DEFAULT_FRONTIERCIRCUITTEST_DESIGNATION_NAME = 'FrontierCircuitTest';
// GTMS8C · the menu.json basename the Anchor writes + the menu-watch dir-watch monitors.
export const FRONTIERCIRCUITTEST_MENU_JSON_BASENAME = 'menu.json';
