/**
 * Suite8 Concept Type Definitions
 *
 * Universal Designation Carrier. Each Suite 8 designation (Conductor · domain
 * Suite 8 · spawned ClaudeCode instance) maintains its OWN Renewable
 * Intelligence Pairing — Diamond + Onyx + BoundCascade.json. The suite8
 * Concept holds these as STATE for the active designation being viewed/managed.
 *
 * The Page surface (Suite8Page.vue) renders three tabs:
 *   - Info Sheet (default) — FS Read of the Suite 8 directory
 *   - D-O Viewer — Diamond + Onyx markdown render
 *   - Settings (default when muxified elsewhere) — per-muxification config
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 * Citation: CLAUDE.md C5 Renewable Intelligence (D-O Muxified Read)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';
// A-1 SCBM · Tier-2 muxified member types — Suite8 muxifies SuiteCascade, so the
// Deck carries `d.suiteCascade` (the ONE shared instance · Scholar §1/§2). Type-only
// import — the runtime muxification lives in suite8.concept.client.ts.
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
export const SUITE8_CONCEPT_NAME = 'suite8';

// Backward-compat alias — the existing 30+ importers reference `suite8Name`. Keep it pointing at
// the constant so nothing breaks; the rename edits SUITE8_CONCEPT_NAME and the alias follows.
export const suite8Name = SUITE8_CONCEPT_NAME;

// VERBOSE · Verbose Split Naming derivation. 'suite8' + 'SetMenuStage' → 'Suite8 Set Menu Stage'.
// Title-cases the concept token, space-splits the PascalCase verb. The Stratimux action dispatch
// matches by THIS string — derive it, never hand-type it, so the rename can never drift (TQNI).
const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const splitPascal = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
export const VERBOSE = (verb: string): string =>
  `${titleCase(SUITE8_CONCEPT_NAME)} ${splitPascal(verb)}`;
// e.g. VERBOSE('SetMenuStage') === 'Suite8 Set Menu Stage'
//      VERBOSE('SetMenuStageHuirthBase') === 'Suite8 Set Menu Stage Huirth Base'
// NOTE (VERBOSE resolution · Blue W2): the 2 menu qualities + the muxonomy use the LITERAL form
// of these derived strings (cadmium precedent · createQualityCardWithPayload `type` is always a
// literal in this codebase). VERBOSE() is the canonical reference + the rename anchor; the literals
// carry a `// = VERBOSE('...')` comment so the cascading-constant edit + the TQNI-RT zero-grep
// Concluder cover the relay-critical surface.

// ============================================
// DESIGNATION + TAB TYPES
// ============================================

export type Suite8Designation = {
  name: string;
  diamondPath: string;
  onyxPath: string;
  cascadeJsonPath: string;
  directoryPath: string;
  description?: string;
  color?: string;
};

// ============================================
// A-1 SPSR · Shared-Plurality-Suite8-Record ENTRY
// ============================================
// One entry per Suite 8, keyed in the `suite8s` Record by its NDEP Name (the literal
// `Cascades/8_SUITES/<Name>/` directory entry). NO optional props — KeyedSelector
// requirement (S13 §4). The minimal identity+routing surface; A-2 MPRF registers
// entries from the directory substrate, A-6 HCD renders the roster.
export type Suite8Entry = {
  name: string;            // NDEP — directory-entry Name; uniquely resolves Instance.md
  directoryPath: string;   // Cascades/8_SUITES/<Name>/
  description: string;     // never optional (KeyedSelector)
  color: string;           // never optional (KeyedSelector)
};

export type Suite8Tab = 'info' | 'doviewer' | 'settings';

// ============================================
// A-6 HCD SUBPAGE TRIAD — Home · Component · Documentation
// ============================================
//
// The Suite8 Landing renders a SubPage triad (HCD), mirroring the SuiteCascade
// (B-6) + scsBridge SubPage precedent. `activeSubPage` is a pure-UI, local-only
// selector (never synced — NOT in `sync.filterKeys`): a single v-if/v-else-if
// chain in the Landing keys off it. 'home' is the default (the Suite 8 roster).
//
// Citation: suiteCascade.type.ts SuiteCascadeSubPage union (DIRECT bearing · B-6).
// Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
export type Suite8SubPage = 'home' | 'component' | 'documentation';

// ============================================
// STATE DEFINITION (Client-Side · InductionState included)
// ============================================

export type Suite8ClientState = {
  // InductionState (for future Diametric routing in D4)
  actionQue: AnyAction[];
  filterKeys: string[];

  // A-1 SPSR · the new sole-aspiration property — one Record keyed by NDEP Name.
  // Shared without overload (Scholar §1). A-2 MPRF populates from `Cascades/8_SUITES/`.
  // Coexists with the legacy `designations` array (see reconciliation note below); the
  // future migration folds `designations` consumers (3 qualities + Vue) onto this Record.
  suite8s: Record<string, Suite8Entry>;

  // LEGACY (A-1 reconciliation) · Designation registry — the existing array surface the
  // 8 qualities + Suite8Page/Suite8Landing still read. Retained to keep the live concept
  // compiling in one Band; A-2/A-6 migrate consumers to `suite8s`.
  designations: Suite8Designation[];

  // Active designation being viewed/managed
  activeDesignationName: string;

  // Active tab on the Suite 8 Page
  activeTab: Suite8Tab;

  // A-6 HCD — the active SubPage of the Suite8 Landing triad (Home · Component ·
  // Documentation). Pure-UI, local-only (never synced); DEFAULT = 'home'.
  activeSubPage: Suite8SubPage;

  // Loaded content for the active designation (populated by D4 Diametric file reads)
  loadedDiamondContent: string;
  loadedOnyxContent: string;
  loadedBoundCascade: Record<string, unknown> | null;
  loadedFileSystemSheet: string;

  // GTMS8C · the current agent-authored Shatterite Menu stage (FKIS · IAJW relay drives it).
  // KeyedSelector discipline · NON-OPTIONAL · seeded to EMPTY_MENU_STAGE in createSuite8ClientState.
  // LEGACY (scalar · the single-designation pipe). Retained alongside the keyed Record during the
  // PRE-EPOCH refinement; the keyed `shatteriteMenus` is the N-designation surface (BSSM).
  menuStage: MenuStage;

  // PRE-EPOCH · BSSM keyed Record — one MenuStage per Suite 8 designation (keyed by NDEP Name).
  // The N-watcher principle (WPS) writes a per-designation stage via the keyed Base quality; the
  // SMRP relay broadcasts the keyed relay; this page reads shatteriteMenus[suite8Name]. Always {}
  // at boot — never optional (KeyedSelector · BSSM-Type non-optional discipline).
  shatteriteMenus: Record<string, MenuDocument>;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

// A-2 MPRF · SPSR Record registration payload (keyed by NDEP Name).
export type Suite8RegisterSuite8Payload = {
  name: string;
  entry: Suite8Entry;
};

export type Suite8RegisterDesignationPayload = {
  designation: Suite8Designation;
};

export type Suite8SetActiveDesignationPayload = {
  designationName: string;
};

export type Suite8SetActiveTabPayload = {
  tab: Suite8Tab;
};

// A-6 HCD — set the active SubPage (Home · Component · Documentation). Local-only UI.
export type Suite8SetActiveSubPagePayload = {
  activeSubPage: Suite8SubPage;
};

export type Suite8SetDiamondContentPayload = {
  diamondContent: string;
};

export type Suite8SetOnyxContentPayload = {
  onyxContent: string;
};

export type Suite8SetBoundCascadePayload = {
  boundCascade: Record<string, unknown> | null;
};

export type Suite8SetFileSystemSheetPayload = {
  fileSystemSheet: string;
};

// GTMS8C · MenuStage relay-reception payload (FKIS · the Anchor-authored Shatterite stage).
export type Suite8SetMenuStagePayload = {
  menuStage: MenuStage;
};
// GTMS8C · Huirth-side Base payload (DISTINCT type string · VERBOSE('SetMenuStageHuirthBase') ·
// Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type Suite8SetMenuStageHuirthBasePayload = {
  menuStage: MenuStage;
};

// PRE-EPOCH · BSSM keyed relay-reception payload (designation + stage · keyed merge on client state).
export type Suite8SetDesignationMenuStagePayload = {
  designation: string;
  // C766 · the staged conversion: the keyed circuit carries the WHOLE MenuDocument (all stages +
  // currentStageIndex) under the historical field name — the wire/action shape is unchanged.
  menuStage: MenuDocument;
};
// PRE-EPOCH · BSSM keyed Huirth-side Base payload (DISTINCT type · VERBOSE('SetDesignationMenuStageHuirthBase')
// · Huirth-only · NOT in actionExchange · TQNI byte-match discipline).
export type Suite8SetDesignationMenuStageHuirthBasePayload = {
  designation: string;
  menuStage: MenuDocument;
};

// ============================================
// QUALITY TYPE DEFINITIONS
// ============================================

export type Suite8ClientQualities = {
  suite8RegisterSuite8: Quality<Suite8ClientState, Suite8RegisterSuite8Payload>;
  suite8RegisterDesignation: Quality<Suite8ClientState, Suite8RegisterDesignationPayload>;
  suite8RegisterSampleDesignations: Quality<Suite8ClientState, void>;
  suite8SetActiveDesignation: Quality<Suite8ClientState, Suite8SetActiveDesignationPayload>;
  suite8SetActiveTab: Quality<Suite8ClientState, Suite8SetActiveTabPayload>;
  // A-6 HCD · local SubPage selector — Home · Component · Documentation triad.
  suite8SetActiveSubPage: Quality<Suite8ClientState, Suite8SetActiveSubPagePayload>;
  suite8SetDiamondContent: Quality<Suite8ClientState, Suite8SetDiamondContentPayload>;
  suite8SetOnyxContent: Quality<Suite8ClientState, Suite8SetOnyxContentPayload>;
  suite8SetBoundCascade: Quality<Suite8ClientState, Suite8SetBoundCascadePayload>;
  suite8SetFileSystemSheet: Quality<Suite8ClientState, Suite8SetFileSystemSheetPayload>;
  // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
  suite8SetMenuStage: Quality<Suite8ClientState, Suite8SetMenuStagePayload>;
  // PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
  suite8SetDesignationMenuStage: Quality<Suite8ClientState, Suite8SetDesignationMenuStagePayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type Suite8ClientConcept = Concept<Suite8ClientState, Suite8ClientQualities>;

// ============================================================
// GTMS8C · HUIRTH FACE (thin server-Base home for menuStage + the STCP relay)
// ============================================================
export type Suite8HuirthState = {
  menuStage: MenuStage;
  // PRE-EPOCH · BSSM keyed Record mirror on the Huirth (Base) side. The N-watcher dir-watch writes
  // a per-designation stage here via the keyed Base quality (Base-maintenance · Seam 2); the SMRP
  // relay reads this Record selector + broadcasts the keyed relay. Always {} at boot (KeyedSelector).
  shatteriteMenus: Record<string, MenuDocument>;
};
export type Suite8HuirthQualities = {
  suite8SetMenuStageHuirthBase: Quality<Suite8HuirthState, Suite8SetMenuStageHuirthBasePayload>;
  // PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
  suite8SetDesignationMenuStageHuirthBase: Quality<
    Suite8HuirthState,
    Suite8SetDesignationMenuStageHuirthBasePayload
  >;
};
export type Suite8HuirthConcept = Concept<Suite8HuirthState, Suite8HuirthQualities>;

// A-1 SCBM · Suite8 muxifies SuiteCascade → the Deck carries `suiteCascade` at Tier 2
// (flat, ONE shared instance · Scholar §2). DECK K reach:
//   d.suite8.k.suite8s.select()                    — Tier 1 (own Record)
//   d.suiteCascade.k.cascades.select()    — Tier 2 (shared Record)
// NEVER Tier 3 — SuiteCascade muxifies nothing further (ECK ceiling satisfied by design).
export type Suite8Deck = {
  suite8: Suite8ClientConcept & {
    d: {
      suiteCascade: Concept<SuiteCascadeState, SuiteCascadeQualities>;
    };
  };
};

export type Suite8ClientDeck = MuxiumDeck & Suite8Deck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type Suite8Principle = PrincipleFunction<
  Suite8ClientQualities,
  MuxiumDeck & Suite8Deck,
  Suite8ClientState
>;

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_SUITE8_ACTIVE_TAB: Suite8Tab = 'info';

// A-6 HCD — the default SubPage the Landing opens on (the Suite 8 roster).
export const DEFAULT_SUITE8_SUB_PAGE: Suite8SubPage = 'home';
export const SUITE8_TABS: { value: Suite8Tab; label: string }[] = [
  { value: 'info', label: 'Info Sheet' },
  { value: 'doviewer', label: 'D-O Viewer' },
  { value: 'settings', label: 'Settings' },
];

// GTMS8C · the Suite 8 designation display name — the RI dir basename under Cascades/Extended/
// AND the suite8Name the menu-watch principle + PAOLRP match in sessionsList. The install Opus
// sets this to the user's domain (one of the non-derivable surfaces · see W5 rename list).
export const DEFAULT_SUITE8_DESIGNATION_NAME = 'Template Suite 8';
// GTMS8C · the menu.json basename the Anchor writes + the menu-watch dir-watch monitors.
export const SUITE8_MENU_JSON_BASENAME = 'menu.json';
