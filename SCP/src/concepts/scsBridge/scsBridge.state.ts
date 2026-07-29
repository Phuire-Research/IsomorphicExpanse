/**
 * SCS-Bridge Concept State Factory
 *
 * Unified state factory for the client-side scsBridge concept.
 * Foundation only (D1) — D2+ extends with mirror data + spawned-instance tracker.
 *
 * Citation: DIAMOND-TIER-M1-A1-D1.md (this sub-Diamond)
 * Citation: claudeBridge.state.ts (ADMIN_ICP origin — relay-shape subset)
 * Citation: notification.state.ts (Island Architecture exemplar)
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management"
 */
import type { ScsBridgeClientState, ScsBridgeHuirthState } from './scsBridge.type';
// MD-9 · D-MC-3 · seed the model-selection state to the catalog default (Opus 4.8).
import { SCS_DEFAULT_MODEL } from './model/scsModelCatalog.model';
import {
  DEFAULT_SCS_BRIDGE_BAR_VISIBLE,
  DEFAULT_SCS_BRIDGE_BAR_EXPANDED,
  DEFAULT_SCS_BRIDGE_ACTIVE_SUB_PAGE,
  DEFAULT_SCS_BRIDGE_INSTALL_MENU_OPEN,
  DEFAULT_SCS_BRIDGE_INSTALL_WIZARD_OPEN,
  DEFAULT_SCS_BRIDGE_INSTALL_WIZARD_STEP,
  DEFAULT_SCS_BRIDGE_WIZARD_NAME_DRAFT,
  DEFAULT_SCS_BRIDGE_WIZARD_NAME_VALID,
  DEFAULT_SCS_BRIDGE_WIZARD_NAME_ERROR,
  DEFAULT_SCS_BRIDGE_LOG_QUERY_SOURCE,
  DEFAULT_SCS_BRIDGE_SCPS_JSON_WATCHER_ACTIVE,
  DEFAULT_SCS_BRIDGE_MAIN_MENU_MIRROR_ENTRY,
  DEFAULT_SCS_BRIDGE_CADMIUM_TUTORIAL_JOIN,
} from './scsBridge.type';

// ============================================
// STATE FACTORY
// ============================================

export function createScsBridgeClientState(): ScsBridgeClientState {
  return {
    // InductionState (required for Diametric Quality routing)
    actionQue: [],
    filterKeys: SCSBRIDGE_FILTER_KEYS,

    // Bar state
    barVisible: DEFAULT_SCS_BRIDGE_BAR_VISIBLE,
    barExpanded: DEFAULT_SCS_BRIDGE_BAR_EXPANDED,
    activeSubPage: DEFAULT_SCS_BRIDGE_ACTIVE_SUB_PAGE,

    // SWRM · D4 · render-settings UI defaults. Target opens on Terminal (the D3-wired surface);
    // SCP-self (D5) + the optimistic terminal echo start null (the deck reflects bridge.json).
    settingsTarget: 'terminal',
    selfRenderMode: null,
    selectedTerminalMode: null,

    // Mirror status (server pushes via ServerToClient Diameter)
    bridgeStatus: '',
    bridgeStatusLastUpdate: 0,

    // Cycle 155 · JSON Relay (received via actionExchange.serverToClient · Path B)
    bridgeJson: null,
    sessionsList: [],

    // SE · Epoch Extension · ASMQ/UFRT · archive-manifest reactive list (full-replaced by AMWP watcher)
    archiveManifest: [],

    // CESA — gate for initial-connection principle (false until first non-empty status)
    connectionEstablished: false,

    // PP-D4 · null until relay broadcast carries huirth's captured boot timestamp
    serverStartupTime: null,

    // ============================================
    // MACRO 2 EXTENSIONS (M2-P2 default initialization)
    // ============================================
    // Wired by M2-A1-D1..D5 (install wizard) + M2-A1-D4 (log dump) + M2-A2-D1..D3 (toolbar).
    // Empty arrays/false/idle = no install in progress, no SCPs known, no toolbar buttons,
    // no log query yet.

    installedScps: [],
    installMenuOpen: DEFAULT_SCS_BRIDGE_INSTALL_MENU_OPEN,
    installWizardOpen: DEFAULT_SCS_BRIDGE_INSTALL_WIZARD_OPEN,
    installWizardStep: DEFAULT_SCS_BRIDGE_INSTALL_WIZARD_STEP,
    wizardConceptNameDraft: DEFAULT_SCS_BRIDGE_WIZARD_NAME_DRAFT,
    wizardConceptNameValid: DEFAULT_SCS_BRIDGE_WIZARD_NAME_VALID,
    wizardConceptNameError: DEFAULT_SCS_BRIDGE_WIZARD_NAME_ERROR,
    toolbarButtons: [],
    logQueryResult: null,
    logQuerySource: DEFAULT_SCS_BRIDGE_LOG_QUERY_SOURCE,

    // AJMI extensions (Cycle 76 user addendum)
    scpsJsonWatcherActive: DEFAULT_SCS_BRIDGE_SCPS_JSON_WATCHER_ACTIVE,
    mainMenuMirrorEntry: DEFAULT_SCS_BRIDGE_MAIN_MENU_MIRROR_ENTRY,
    cadmiumTutorialJoin: DEFAULT_SCS_BRIDGE_CADMIUM_TUTORIAL_JOIN,

    // Diamond 3D Wave-2 · SAES + CMIA trigger fields (Cite: R3-C §S1-S3)
    activeEngagedSessionId: null,
    // TTVS initial · undefined = no trigger pending. Principle gates on === undefined.
    pendingSpawnScpName: undefined,
    // C1-D2 · SBST initial · undefined = no Suite 8 spawn pending. Principle gates on === undefined.
    pendingSpawnSuite8Name: undefined,
    // SBST asWorker companion · undefined = anchor/PPOL path (anti-flood + auto-anchor preserved).
    pendingSpawnSuite8AsWorker: undefined,
    // C373 · THE SCP THREAD · undefined = bridge resolves the SCP dir (prior behaviour). A string
    // pins the Forge anchor to the CALLER's SCP (threaded into scs_spawn_suite8_session MCP args).
    pendingSpawnSuite8ScpName: undefined,
    // C386 · THE FRESH FLAG · undefined/false = ordinary offline→re-engage anchor behaviour. true =
    // the Forge's Per-Actualization Engage (threaded into scs_spawn_suite8_session MCP args → the
    // bridge creates a NEW session + re-claims the anchor on an OFFLINE anchor rather than resuming it).
    pendingSpawnSuite8Fresh: undefined,
    // D-UP · THE MANUAL-MODE SEVER · undefined/false = ordinary worker auto-accept. true = the
    // fresh-worker spawn WITHOUT the auto-permission marker (approval gate intact + Stand By overlay).
    pendingSpawnSuite8ManualMode: undefined,
    // MD-9 · D-MC-3 · Per-Instance Model Control · seeded to the default model so the dropdown
    // opens on Opus 4.8 and every spawn threads a model unless the user chooses otherwise.
    pendingSpawnModel: SCS_DEFAULT_MODEL,
    pendingEngageSessionId: null,
    // D3RM-E · CMIA-Focus trigger · null = no focus pending. Principle gates on string.
    pendingFocusSessionId: null,
    // D3RM-G · CBSE chat trigger · null = no chat pending. Compound object set
    // by Vue submit; principle clears to null after fetch resolves (WSVN).
    pendingChatMessage: null,

    // GITM #639 · gitmJson MIGRATED → the gitm BASE concept. Only the action-pipe trigger
    // (client-local · orthogonal MCP dispatch) STAYS here.
    gitmPendingAction: null,

    // GITM color-cascade (W4 · Vermillion Focus+Highlight) — the transient UI highlight target.
    // null = no highlight; a string (e.g. 'turn-over') pulses the matching control. Set by the
    // scs:highlight relay (the Pewter Skill POSTs it after writing colors); auto-reset to null
    // after ~2s by a Vue watch. Client-LOCAL (filterKey · never bidirectionally synced).
    highlightTarget: null,
  };
}

// ============================================
// FILTER KEYS (local-only state — does not sync to server)
// ============================================

export const SCSBRIDGE_FILTER_KEYS: string[] = [
  // InductionState
  'actionQue',
  'filterKeys',

  // Bar state (client UI)
  'barVisible',
  'barExpanded',
  'activeSubPage',

  // Mirror status fields (server pushes via ServerToClient Diameter; not bidirectionally synced)
  'bridgeStatus',
  'bridgeStatusLastUpdate',

  // Cycle 155 · JSON Relay (Path B explicit broadcast; not bidirectionally synced)
  'bridgeJson',
  'sessionsList',

  // SE · Epoch Extension · ASMQ/UFRT · archive-manifest (broadcast via actionExchange; not bidirectionally synced)
  'archiveManifest',

  // CESA gate field
  'connectionEstablished',

  // Macro 2 extensions (M2-P2) — client-local UI/wizard state, NOT bidirectionally synced
  // installedScps IS synced (server reads SCPs.json and pushes); others are client-local UI.
  'installMenuOpen',
  'installWizardOpen',
  'installWizardStep',
  'wizardConceptNameDraft',
  'wizardConceptNameValid',
  'wizardConceptNameError',
  'toolbarButtons',
  'logQueryResult',
  'logQuerySource',

  // AJMI extensions
  'scpsJsonWatcherActive',     // server-only watcher gate
  'mainMenuMirrorEntry',       // derived client-side; not bidirectionally synced
  'cadmiumTutorialJoin',       // Macro 3 fills; FSDCS-reserved

  // Diamond 3D Wave-2 · SAES + CMIA trigger fields (client-local; not bidirectionally synced)
  'activeEngagedSessionId',
  'pendingSpawnScpName',
  // C1-D2 · SBST trigger field (client-local; not bidirectionally synced)
  'pendingSpawnSuite8Name',
  // SBST asWorker companion (client-local; not bidirectionally synced)
  'pendingSpawnSuite8AsWorker',
  // C373 · SCP-thread companion (client-local; not bidirectionally synced)
  'pendingSpawnSuite8ScpName',
  // C386 · fresh-flag companion (client-local; not bidirectionally synced)
  'pendingSpawnSuite8Fresh',
  // D-UP · manual-mode companion (client-local; not bidirectionally synced)
  'pendingSpawnSuite8ManualMode',
  // MD-9 · D-MC-3 · Per-Instance Model Control selection (client-local; not bidirectionally synced)
  'pendingSpawnModel',
  'pendingEngageSessionId',
  // D3RM-E · CMIA-Focus trigger field (client-local; not bidirectionally synced)
  'pendingFocusSessionId',
  // D3RM-G · CBSE chat trigger field (client-local; not bidirectionally synced)
  'pendingChatMessage',
  // GITM #639 · 'gitmJson' MIGRATED → GITM_FILTER_KEYS (the gitm BASE concept).
  // GITM PAGE · action-pipe trigger field (client-local UI trigger; MUST NOT sync to server)
  'gitmPendingAction',
  // GITM color-cascade (W4) · the transient highlight target (client-local UI; MUST NOT sync to server)
  'highlightTarget',
];

// ============================================
// HUIRTH STATE FACTORY (Cycle 155 · BJDP · Foundation A Wave 2)
// ============================================
//
// Initial defaults: bridgeJson starts null (initial read populates it; ENOENT-safe).
// sessionsList starts [] (M60 State-or-Payload Anor — required, not optional).
//
// Citation: FOUNDATION-A consolidated RD §6 File 5
// Citation: STRATIMUX-REFERENCE.md "🚨 CRITICAL: Avoid Optional Properties in State"

export function createScsBridgeHuirthState(): ScsBridgeHuirthState {
  return {
    bridgeJson: null,
    sessionsList: [],
    // GITM #639 · gitmJson snapshot MIGRATED → the gitm Huirth BASE concept (GitmHuirthState).
    // SE · Epoch Extension · ASMQ/UFRT · archive-manifest snapshot (full-replaced by AMWP watcher)
    archiveManifest: [],
    // PP-D4 · null until first scsBridgeSetServerStartupTime dispatch on principle boot
    serverStartupTime: null,
  };
}
