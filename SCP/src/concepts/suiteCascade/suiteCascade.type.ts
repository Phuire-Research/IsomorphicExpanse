/**
 * SuiteCascade Concept Type Definitions
 *
 * The PRIOR base of the Dual-Macro composition (Macro B). Models the always-
 * existing General Cascade context: it always assumes a General `Cascade.json`
 * on the file system (the GRID — General-RI-Directory). It can stand alone as a
 * base concept (Individuation Principle) — it does NOT require `Suite8` to
 * function. In Macro A, `Suite8` muxifies `SuiteCascade` → the shared `cascades`
 * Record is reached at Tier 2 (`d.suite8.d.suiteCascade.k.cascades.select()`).
 *
 * Sole state surface: `cascades: Record<string, Cascade>` keyed by Name
 * ('General' for the GRID, or a Suite8 directory basename for a named cascade).
 *
 * Citation: S8SC-SCHOLAR-COMPOSITION-GROUNDING.md §1 (flat Tier-2 shared deck) ·
 *           §3 (shared Record state shape · no optional properties) ·
 *           §4 (Two-Principle Decomposition).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §0/§1 + Band B-1 TPDF.
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern" ·
 *           "🧠 Strategic State Management" (no optional state — KeyedSelector).
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../webSocketServer/webSocketServer.concept';

export const suiteCascadeName = 'suiteCascade';

// ============================================
// HCD SUBPAGE TRIAD (Band B-6) — Home · Component · Documentation
// ============================================
//
// The SuiteCascade Landing renders a SubPage triad (HCD), mirroring the scsBridge
// SubPage precedent. `activeSubPage` is a pure-UI, local-only selector (never synced
// — NOT in the `sync.filterKeys`): a single v-if/v-else-if chain in the Landing keys
// off it. 'home' is the default (the General cascade summary surface).
//
// Citation: scsBridge.type.ts ScsBridgeSubPage union (local UI selector pattern).
// Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
export type SuiteCascadeSubPage = 'home' | 'component' | 'documentation';

// ============================================
// CASCADE + FILE-ENTRY TYPES
// ============================================

// One CascadeFile entry — a finite, Component-declared active document.
// `markdown` holds live content, updated by the WCJF watcher (B-4).
export type CascadeFileEntry = {
  filePath: string;
  markdown: string;
};

// One cascade context — the GRID 'General' case, or a named Suite8 cascade.
// No optional properties (KeyedSelector requirement): cascadeJson is `| null`,
// never `?`; arrays initialize to [].
export type Cascade = {
  name: string;                                 // NDEP — the directory-entry Name (or 'General')
  cascadeDirectory: string;                     // GRID path or SDCR-scoped Suite8 path
  cascadeJson: Record<string, unknown> | null;  // parsed Cascade.json (Diamond/Onyx pairing source)
  activeCascadeFiles: CascadeFileEntry[];        // ACFR — finite, Component-dictated
  // C1-D5 CWSD · discriminant distinguishing a legitimately-absent Cascade.json
  // (true · the dir was just scaffolded, no manifest yet) from a present-but-empty
  // one (false · cascadeJson parsed but carries no manifest keys). Non-optional per
  // KeyedSelector discipline (no `?`); defaults false.
  missingCascadeJson: boolean;
};

// ============================================
// STATE DEFINITION (Client-Side)
// ============================================

export type SuiteCascadeState = {
  cascades: Record<string, Cascade>;            // keyed by Name; 'General' always present
  // B-5 SDCR + GRID — the single active watched Cascade directory. DEFAULT = GRID
  // (`GENERAL_CASCADE_DIRECTORY`, the General RI, always the assumed default). When
  // a Suite8 docks, this re-points to `Cascades/8_SUITES/<Name>/Cascades/`; on
  // un-dock it returns to GRID. Re-scope = single-active-switchable (MWFW build-out:
  // one active watched dir at a time, switchable by docking).
  activeCascadeDirectory: string;
  // B-6 HCD — the active SubPage of the SuiteCascade Landing triad (Home · Component ·
  // Documentation). Pure-UI, local-only (never synced); DEFAULT = 'home'.
  activeSubPage: SuiteCascadeSubPage;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

export type SuiteCascadeRegisterNamedCascadePayload = {
  name: string;
  cascade: Cascade;
};

export type SuiteCascadeSetCascadeJsonPayload = {
  name: string;
  cascadeJson: Record<string, unknown> | null;
};

export type SuiteCascadeSetActiveCascadeFilesPayload = {
  name: string;
  activeCascadeFiles: CascadeFileEntry[];
};

// B-5 SDCR + GRID — re-scope the single active watched Cascade directory.
// `activeCascadeDirectory` = a directory (repository-relative) whose `Cascade.json`
// the watcher re-arms on. `name` = the registered cascade Name that directory belongs
// to ('General' = GRID, or a Suite8 directory basename). The watcher principle reads
// the resulting selector and TEARS DOWN + RE-ARMS chokidar on the new dir (setStage
// serialization). Un-dock = dispatch with directory = GENERAL_CASCADE_DIRECTORY.
export type SuiteCascadeSetActiveCascadeDirectoryPayload = {
  name: string;
  activeCascadeDirectory: string;
};

// B-6 HCD — set the active SubPage (Home · Component · Documentation). Local-only UI.
export type SuiteCascadeSetActiveSubPagePayload = {
  activeSubPage: SuiteCascadeSubPage;
};

// ============================================
// QUALITY TYPE DEFINITIONS (explicit mapping — never typeof)
// ============================================

export type SuiteCascadeQualities = {
  suiteCascadeRegisterNamedCascade: Quality<SuiteCascadeState, SuiteCascadeRegisterNamedCascadePayload>;
  suiteCascadeSetCascadeJson: Quality<SuiteCascadeState, SuiteCascadeSetCascadeJsonPayload>;
  suiteCascadeSetActiveCascadeFiles: Quality<SuiteCascadeState, SuiteCascadeSetActiveCascadeFilesPayload>;
  // B-5 SDCR + GRID · local re-scope setter — sets the single active watched dir.
  // Dispatched into the shared Record selector the watcher reads; GRID is the default,
  // restored when docking clears (directory = GENERAL_CASCADE_DIRECTORY).
  suiteCascadeSetActiveCascadeDirectory: Quality<SuiteCascadeState, SuiteCascadeSetActiveCascadeDirectoryPayload>;
  // B-6 HCD · local SubPage selector — Home · Component · Documentation triad.
  suiteCascadeSetActiveSubPage: Quality<SuiteCascadeState, SuiteCascadeSetActiveSubPagePayload>;
  // B-4 WCJF · Relay receivers (Informative) — the Huirth watcher broadcasts these
  // via actionExchange.serverToClient; the Client face registers them so the relay
  // lands in the Client `cascades` Record for Vue rendering (ACFR B-2 · DOPR B-3).
  suiteCascadeSetCascadeRelay: Quality<SuiteCascadeState, SuiteCascadeSetCascadeRelayPayload>;
  suiteCascadeSetActiveCascadeFilesRelay: Quality<SuiteCascadeState, SuiteCascadeSetActiveCascadeFilesRelayPayload>;
  // B-5 SDCR + GRID · Relay receiver (Informative) — the Huirth watcher broadcasts the
  // active dir so the Client knows which cascade context is currently watched (GRID
  // vs a docked Suite8). The Client face registers it for the HCD Home context selector.
  suiteCascadeSetActiveCascadeDirectoryRelay: Quality<SuiteCascadeState, SuiteCascadeSetActiveCascadeDirectoryRelayPayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type SuiteCascadeConcept = Concept<SuiteCascadeState, SuiteCascadeQualities>;

// Standalone (individuated) General SuiteCascade page deck — Tier 1.
export type SuiteCascadeDeck = {
  suiteCascade: SuiteCascadeConcept;
};

export type SuiteCascadeClientDeck = MuxiumDeck & SuiteCascadeDeck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type SuiteCascadePrinciple = PrincipleFunction<
  SuiteCascadeQualities,
  MuxiumDeck & SuiteCascadeDeck,
  SuiteCascadeState
>;

// ============================================
// HUIRTH FACE (B-4 WCJF) — server-side watcher deployment
// ============================================
//
// SBIS (Stratidian-Base-Informative-State): Base = Huirth state (server source of
// truth, maintained by the chokidar Cascade.json watcher Lambda); Informative =
// Client state (derived, broadcast-synchronized via actionExchange.serverToClient).
// The Huirth state mirrors the Client state shape EXACTLY — one `cascades` Record.
// The watcher dispatches a Base action (runs the local Huirth reducer so the entry
// actually exists server-side) THEN a Relay action (routes to Client via the
// Path B actionExchange broadcast). Both fire together at every dispatch site.
//
// Citation: scsBridge.type.ts (ScsBridgeHuirthState + SBIS Base/Relay split).
// Citation: feedback_stratidian_base_informative_state.md (SBIS discipline).
// Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-4 WCJF.

export type SuiteCascadeHuirthState = {
  cascades: Record<string, Cascade>;            // keyed by Name; 'General' (GRID) always present
  // B-5 SDCR + GRID — the single active watched Cascade directory (server-side Base).
  // The WCJF watcher reads THIS selector; on change it tears down + re-arms chokidar
  // on the new dir's Cascade.json (setStage serialization). DEFAULT = GRID
  // (GENERAL_CASCADE_DIRECTORY). Mirrors the Client state shape exactly (SBIS).
  activeCascadeDirectory: string;
};

// --- Relay payloads (cross the WS boundary · registered in actionExchange.serverToClient)

export type SuiteCascadeSetCascadeRelayPayload = {
  name: string;
  cascade: Cascade;
};

export type SuiteCascadeSetActiveCascadeFilesRelayPayload = {
  name: string;
  activeCascadeFiles: CascadeFileEntry[];
};

// B-5 SDCR + GRID · Relay payload — the active dir broadcast to the Client.
export type SuiteCascadeSetActiveCascadeDirectoryRelayPayload = {
  name: string;
  activeCascadeDirectory: string;
};

// --- Base payloads (Huirth-only · distinct type strings · NOT in actionExchange)

export type SuiteCascadeSetCascadeHuirthBasePayload = {
  name: string;
  cascade: Cascade;
};

export type SuiteCascadeSetActiveCascadeFilesHuirthBasePayload = {
  name: string;
  activeCascadeFiles: CascadeFileEntry[];
};

// B-5 SDCR + GRID · Base payload — Huirth-only re-scope setter. This is the action
// the watcher principle reads via selector to re-arm. It runs the local Huirth reducer
// so the server-side `activeCascadeDirectory` is real (the selector observes the change).
export type SuiteCascadeSetActiveCascadeDirectoryHuirthBasePayload = {
  name: string;
  activeCascadeDirectory: string;
};

export type SuiteCascadeHuirthQualities = {
  // Base (Huirth-only · runs local reducer so server state is real for SMRP/relay)
  suiteCascadeSetCascadeHuirthBase: Quality<SuiteCascadeHuirthState, SuiteCascadeSetCascadeHuirthBasePayload>;
  suiteCascadeSetActiveCascadeFilesHuirthBase: Quality<SuiteCascadeHuirthState, SuiteCascadeSetActiveCascadeFilesHuirthBasePayload>;
  // B-5 SDCR + GRID · Base re-scope setter (Huirth-only) — the watcher reads its
  // resulting selector to tear down + re-arm on the new dir.
  suiteCascadeSetActiveCascadeDirectoryHuirthBase: Quality<SuiteCascadeHuirthState, SuiteCascadeSetActiveCascadeDirectoryHuirthBasePayload>;
  // Relay (dual-deployment · broadcast via actionExchange.serverToClient · Path B)
  suiteCascadeSetCascadeRelay: Quality<SuiteCascadeHuirthState, SuiteCascadeSetCascadeRelayPayload>;
  suiteCascadeSetActiveCascadeFilesRelay: Quality<SuiteCascadeHuirthState, SuiteCascadeSetActiveCascadeFilesRelayPayload>;
  // B-5 SDCR + GRID · Relay (broadcast the active dir to the Client).
  suiteCascadeSetActiveCascadeDirectoryRelay: Quality<SuiteCascadeHuirthState, SuiteCascadeSetActiveCascadeDirectoryRelayPayload>;
  // SCRR · Diametric Real — receives the client sentinel request and responds
  // with the current Huirth cascades state (Backfill-On-Request).
  suiteCascadeSendCascadeRequest: Quality<SuiteCascadeHuirthState, { sentinel?: string }>;
};

export type SuiteCascadeHuirthDeck = MuxiumDeck & {
  suiteCascade: Concept<SuiteCascadeHuirthState, SuiteCascadeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type SuiteCascadeHuirthPrinciple = PrincipleFunction<
  SuiteCascadeHuirthQualities,
  SuiteCascadeHuirthDeck,
  SuiteCascadeHuirthState
>;

// ============================================
// CONSTANTS
// ============================================

// The GRID key — the General-RI-Directory cascade is always present.
export const GENERAL_CASCADE_NAME = 'General';

// B-6 HCD — the default SubPage the Landing opens on (the General cascade summary).
export const DEFAULT_SUITE_CASCADE_SUB_PAGE: SuiteCascadeSubPage = 'home';

// The GRID cascade directory — the always-present General RI Directory.
export const GENERAL_CASCADE_DIRECTORY = 'Cascades';

// The GRID Cascade.json basename — the watcher manifest the WCJF watcher arms on.
export const GENERAL_CASCADE_JSON_BASENAME = 'Cascade.json';

// DPASL-D1 · the Extended cascade registry root. A registered Extra (per-registrant)
// cascade RI directory lives at `Cascades/Extended/<name>/` — separation of concerns:
// `Cascades/8_SUITES/` holds Suite-8 *definitions*; `Cascades/Extended/` holds registered
// cascade *RI* dirs. Each registrant's `cascadeDirectory` = this dir + `/<name>` (the LAST
// path segment round-trips through deriveCascadeName back to `<name>` · §NDEP). GRID/General
// stays at `Cascades` (GENERAL_CASCADE_DIRECTORY). The watcher arms one chokidar watch per
// registered Extra (additive · idempotent) alongside the always-watched GRID/General base.
export const EXTENDED_CASCADE_DIR = 'Cascades/Extended';

// WCJF watcher debounce window (ms) — matches the scsBridgeJsonWatcher bearing.
export const SUITE_CASCADE_WATCHER_DEBOUNCE_MS = 100;

// The Cascade.json keys whose values are file paths the General Watcher streams
// into cascades['General'].activeCascadeFiles (ACFR Load Rule · §0.5). Each is a
// repository-relative markdown path (the Diamond/Onyx pairing source + priors).
export const GENERAL_CASCADE_FILE_MANIFEST_KEYS: readonly string[] = [
  'activeDiamond',
  'activeOnyx',
  'priorDiamond',
  'priorOnyx',
  'masterDiamond',
];
