/**
 * SCS-Bridge Concept Type Definitions
 *
 * Foundation: single-message-to-bridge relay · NOT a chatbot.
 *
 * SCS-Bridge IS a Diameter to a bridge process — a UI mirror of state owned
 * by the SCP bridge runtime, with a single send-message junction that routes
 * to the bridge via WebSocket. Distinct in shape from ClaudeBridge (ADMIN_ICP),
 * which is a full interactive chatbot Island.
 *
 * Citation: DIAMOND-TIER-M1-A1-D1.md (this sub-Diamond)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 * Citation: notification.type.ts (Island Architecture exemplar)
 * Citation: ADMIN_ICP claudeBridge.type.ts (origin study target — relay-shape subset)
 *
 * Foundation scope (D1):
 *   - State shape: bar visibility + active sub-page + InductionState for Diametric routing
 *   - Qualities: 1 ClientToServer (send) + 1 ServerToClient (set status) — placeholders for D2 impl
 *
 * Out of scope (D2-D5):
 *   - CommandLine UI Mirror data (D2)
 *   - Navigation Toolbar / spawned-instance tracker (D3)
 *   - Area selection / screenshot capture (D4)
 *   - Pewter Turn Over Button (D5)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';
import type { ScpRegistryEntry, MainMenuMirrorEntry } from '../scpRegistry/scpRegistry.type';
import type { ScpLogEntry, ScpLogSource } from '../scpLog/scpLog.type';
// SE · Epoch Extension · ATMS · the archive-manifest row shape (UFRT-in-state · the reactive
// list the AMWP watcher full-replaces · mirrors sessionsList). Imported from the SMFT types copy.
import type { ArchiveManifestEntry } from './archiveManifest.types';
// MD-9 · D-MC-6 · the template-side model catalog mirror shape (BridgeJsonShape.availableModels).
import type { ScsModelCatalogEntry } from './model/scsModelCatalog.model';
// CadmiumTutorialJoinState is declared later in this file (TypeScript hoists module types)

// ============================================
// SCS-BRIDGE NAME CONSTANT
// ============================================

export const scsBridgeName = 'scsBridge';

// ============================================
// SCS-BRIDGE BAR / SUB-PAGE TYPES (Foundation)
// ============================================

export type ScsBridgeSubPage = 'components' | 'sessions' | 'archive' | 'settings' | 'documentation' | 'installation' | 'card';

// ============================================
// STATE DEFINITION (Client-Side · InductionState included)
// ============================================

export type ScsBridgeClientState = {
  // InductionState (Diametric Quality routing — required for actionExchange Diameter junctions)
  actionQue: AnyAction[];
  filterKeys: string[];

  // Foundation bar state
  barVisible: boolean;
  barExpanded: boolean;
  activeSubPage: ScsBridgeSubPage;

  // SWRM · D4 · render-settings UI state (local · the Settings sub-page). settingsTarget picks
  // which surface the mode deck controls: the Terminal render (bridge.json.renderMode · D3 pipe)
  // vs the SCP-self render (selfRenderMode · D5). selectedTerminalMode = optimistic UI echo of
  // bridge.json.renderMode. The mode vocabulary always comes from bridgeJson.availableRenderModes.
  settingsTarget: 'scp' | 'terminal';
  selfRenderMode: ShaderRenderMode | null;
  selectedTerminalMode: ShaderRenderMode | null;

  // Mirror status — set by ServerToClient Diameter
  bridgeStatus: string;
  bridgeStatusLastUpdate: number;

  // ============================================
  // CYCLE 155 · JSON RELAY (BJDP · Path B explicit broadcast)
  // ============================================
  // Populated by Huirth scsBridgeJsonWatcherPrinciple via actionExchange.serverToClient.
  // bridgeJson defaults to null until the first read or watch event resolves.
  // sessionsList defaults to [] for M60 State-or-Payload Anor compliance.
  bridgeJson: BridgeJsonShape | null;
  sessionsList: ScsBridgeSessionEntry[];

  // SE · Epoch Extension · ASMQ/UFRT · the archive-manifest reactive list. Full-replaced by
  // the AMWP watcher broadcast (scsBridgeSetArchiveManifestRelay via actionExchange.serverToClient).
  // Defaults to [] for M60 State-or-Payload Anor compliance. The Vue Archive view (Macro AV ·
  // next) reads this reactively and fetches bodies on-demand from the bridge GET endpoint.
  archiveManifest: ArchiveManifestEntry[];

  // Connection-Established-Selector-Anchor (CESA · D2)
  // Set true ONLY on first non-empty bridgeStatus payload — gates initial-connection
  // principle from re-firing. bridgeStatus remains the observable string content;
  // connectionEstablished is the structural gate.
  connectionEstablished: boolean;

  // PP-D4 · Stale-Pong Baseline · serverStartupTime
  // Captured at huirth boot via scsBridgeSetServerStartupTime Quality dispatch
  // from scsBridgeJsonWatcherPrinciple. Relayed to Client inside the extended
  // setBridgeJsonRelay payload (single broadcast carries both bridgeJson and
  // serverStartupTime). Client uses this to compute bridgeActive:
  //   bridgeActive = pongReceipt.respondedAt > serverStartupTime
  // Stale pong from prior session → respondedAt < serverStartupTime → Pending.
  // Fresh pong from current session → respondedAt > serverStartupTime → Active.
  // Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2 + §7
  serverStartupTime: number | null;

  // ============================================
  // MACRO 2 EXTENSIONS (M2-P2 forward-state declarations)
  // ============================================
  // Wired by M2-A1-D1..D5 (install wizard) + M2-A1-D4 (log dump UI) + M2-A2-D1..D3 (toolbar)
  // ScpRegistryEntry / ScpLogEntry / ScpLogSource / ScsBridgeInstallWizardStep /
  // ToolbarButtonRegistration types declared in Macro 2 Extensions section below.

  // Install wizard state
  installedScps: ScpRegistryEntry[];
  installMenuOpen: boolean;
  installWizardOpen: boolean;
  installWizardStep: ScsBridgeInstallWizardStep;
  wizardConceptNameDraft: string;
  wizardConceptNameValid: boolean;
  wizardConceptNameError: string;

  // Toolbar registration (M2-A2-D1)
  toolbarButtons: ToolbarButtonRegistration[];

  // Log dump UI (M2-A1-D4)
  logQueryResult: ScpLogEntry | null;
  logQuerySource: ScpLogSource;

  // AJMI extensions (Cycle 76 user addendum) — FSDCS slots
  scpsJsonWatcherActive: boolean;            // M2-A1-D4 toggles when fs.watch armed
  mainMenuMirrorEntry: MainMenuMirrorEntry;  // M2-A1-D1 derives from installedScps
  cadmiumTutorialJoin: CadmiumTutorialJoinState;  // Macro 3 fills semantics

  // ============================================
  // DIAMOND 3D · WAVE-2 · SAES + CMIA-Spawn/Engage Trigger Fields
  // ============================================
  // SAES (Single-Active-Engagement-Sentinel) · One active engaged session per UI.
  // null = no engagement; string = session.id of the currently engaged session.
  // Set by setActiveEngagedSessionId Quality; auto-cleared by watcher on
  // session status transition to archived/offline. Citation: R3-C §S1+S7.
  activeEngagedSessionId: string | null;

  // Transient trigger fields — Vue dispatches with payload; principles watch + fire fetch.
  // Cleared after principle ack (success or failure). Citation: R3-C §S2-S3.
  // TTVS Three-Value Trigger Semantic · undefined=no-trigger · null=trigger-fire-without-SCP-binding · string=trigger-fire-named-SCP. Cite: D3D-HOTFIX-2-R7-FUCHSIA-CLINICAL.md §B.
  pendingSpawnScpName: string | null | undefined;
  // C1-D2 · SBST · CMIA-Spawn-Suite8 trigger · undefined=no-trigger · string=trigger-fire-named-Suite8.
  // Vue (Suite8OnDemand / CadmiumLanding PPOL) dispatches with suite8Name; principle watches +
  // fires MCP scs_spawn_suite8_session. Cleared to undefined after fetch resolves (TFCD).
  pendingSpawnSuite8Name: string | undefined;
  // SBST asWorker · companion to pendingSpawnSuite8Name read at fire time. true = the spawn is a
  // NON-anchor research worker (CadmiumLanding runResearchSweep) → the bridge quality SKIPS the
  // existingAnchor anti-flood guard AND claimAnchorIfUnclaimed (always a fresh worker). The trigger
  // gate stays keyed on pendingSpawnSuite8Name (TTVS); this flag is the dispatch-axis companion.
  // false/undefined = anchor/PPOL path (anti-flood + auto-anchor preserved). Cleared alongside name.
  pendingSpawnSuite8AsWorker: boolean | undefined;
  // C373 · THE SCP THREAD · companion to pendingSpawnSuite8Name read at fire time. A string pins the
  // Forge anchor to the CALLER's SCP (threaded into scs_spawn_suite8_session MCP args); undefined =
  // the bridge resolves the SCP dir (prior behaviour). Cleared alongside the name (TFCD).
  pendingSpawnSuite8ScpName: string | undefined;
  // C386 · THE FRESH FLAG · companion to pendingSpawnSuite8Name read at fire time. true = the Forge's
  // Per-Actualization Engage (a NEW conduction · threaded into scs_spawn_suite8_session MCP args as
  // fresh:true → the bridge quality, on an OFFLINE anchor, creates a NEW session + re-claims the anchor
  // rather than re-engaging the dead one); undefined/false = the ordinary offline→re-engage behaviour.
  // Cleared alongside the name (TFCD).
  pendingSpawnSuite8Fresh: boolean | undefined;
  // D-UP · THE MANUAL-MODE SEVER · companion to pendingSpawnSuite8Name read at fire time. true =
  // a fresh-worker spawn WITHOUT the bridge's auto-permission marker (threaded into
  // scs_spawn_suite8_session MCP args as manualMode:true → the session boots with Claude Code's
  // approval gate INTACT + the Stand By overlay while its directive delivery is pending — the
  // Gitm Resolver's user-controlled update law). undefined/false = the ordinary worker auto-accept.
  // Cleared alongside the name (TFCD).
  pendingSpawnSuite8ManualMode: boolean | undefined;
  // RS.2b · THE COMBINED INITIAL ENTRY · companion to pendingSpawnSuite8Name read at fire
  // time. The per-run SCS:Vermillion directive threaded into the MCP args as
  // initialDirective → the bridge persists it on the registry entry → cli-handler appends
  // it to the Onboard seed as ONE initial positional prompt (no post-boot typed delivery).
  // Cleared alongside the name (TFCD).
  pendingSpawnSuite8InitialDirective: string | undefined;
  // THE ONBOARD OPTION · companion read at fire time. undefined = default (Onboard rides per
  // the anchor predicate); false = suppress (threaded as MCP onboard:false). Cleared (TFCD).
  pendingSpawnSuite8Onboard: boolean | undefined;
  // THE PLAIN-SPAWN LANE · companion read at fire time. undefined = default (anchor lane);
  // false = plain instance (threaded as MCP anchor:false). Cleared (TFCD).
  pendingSpawnSuite8Anchor: boolean | undefined;
  // MD-9 · D-MC-3 · Per-Instance Model Control · the selected model id (a full
  // AVAILABLE_MODELS id) read at spawn fire-time by BOTH the CMIA-Spawn and CMIA-Spawn-Suite8
  // principles and threaded into the MCP `arguments` (field-agnostic → payload.model → the
  // bridge quality). Companion to the pending-name triggers (the gate stays keyed on the name);
  // undefined ⇒ the spawn omits model → the bridge global default. NOT cleared on TFCD — it is a
  // persistent selection the dropdown owns (re-read fresh on each spawn), not a one-shot trigger.
  pendingSpawnModel: string | undefined;
  // pendingEngageSessionId: null = no engage requested; string = session.id to engage.
  pendingEngageSessionId: string | null;
  // D3RM-E · CMIA-Focus trigger · null = no focus requested; string = session.id to focus.
  // Sibling to pendingEngageSessionId; principle watches + fires MCP scp_focus_session.
  pendingFocusSessionId: string | null;

  // D3RM-G · CHAT trigger · compound object { sessionId, message } | null.
  // Vue dispatches with { sessionId, message } when user submits CBSE chat bar.
  // Principle watches + fires MCP scp_chat_session via CCDR-disciplined fetch.
  // WSVN: cleared to null after fetch resolves (success or failure) so the next
  // submit produces a null→object transition that re-fires the selector.
  // Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 1
  // Citation: D3RM-G-FOUNDATION-TEAL-CLAUDE-PEWTER-DESIGN.md §6.7 (compound trigger)
  pendingChatMessage: { sessionId: string; message: string } | null;

  // ============================================
  // GITM PAGE · action-pipe trigger (the Git sub-page) · #639 migrate-and-remove
  // ============================================
  // gitmJson MIGRATED → the gitm BASE concept (d.client.d.gitm.k.gitmJson · #639). Only
  // the action-pipe trigger STAYS here (orthogonal MCP dispatch · NOT the file-watch relay).
  // gitmPendingAction: the client-local action-pipe trigger field. Vue dispatches a
  // { tool, arguments } object when the user stages/unstages/commits/switches; the
  // scsBridgeGitmActionPrinciple watches this selector and fires the MCP JSON-RPC
  // fetch (mirrors the pendingFocusSessionId handshake). Cleared to null after the
  // fetch resolves (WSVN). MUST appear in SCSBRIDGE_FILTER_KEYS — client-local UI.
  gitmPendingAction: GitmPendingAction | null;

  // ============================================
  // GITM color-cascade (W4) · VERMILLION FOCUS+HIGHLIGHT — transient highlight target
  // ============================================
  // null = no highlight active; a string ('turn-over') pulses the matching control. Set by the
  // scs:highlight relay (scsBridgeSetHighlightTarget · the Pewter Skill POSTs scs:highlight after
  // a color write); auto-reset to null by a Vue watch ~2s later. Client-LOCAL (filterKey · never
  // bidirectionally synced). MUST appear in SCSBRIDGE_FILTER_KEYS.
  highlightTarget: string | null;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

export type ScsBridgeSendBridgeMessagePayload = {
  message: string;
};

export type ScsBridgeSetBridgeStatusPayload = {
  bridgeStatus: string;
};

export type ScsBridgeSetBarVisiblePayload = {
  barVisible: boolean;
};

export type ScsBridgeSetBarExpandedPayload = {
  barExpanded: boolean;
};

export type ScsBridgeSetActiveSubPagePayload = {
  activeSubPage: ScsBridgeSubPage;
};

// GITM color-cascade (W4 · Vermillion Focus+Highlight) — the highlight-target relay payload.
// target = the control to pulse ('turn-over') or null to clear. Carried by the scs:highlight relay
// broadcast AND the Vue auto-reset dispatch (same quality both ways · set + clear).
export type ScsBridgeSetHighlightTargetPayload = {
  target: string | null;
};

// SWRM · D4 · consolidated local reducer payload for the Settings sub-page UI state. Each field
// is optional; the reducer updates only those present (one quality for target + both mode echoes).
export type ScsBridgeSetRenderSettingsPayload = {
  settingsTarget?: 'scp' | 'terminal';
  selfRenderMode?: ShaderRenderMode | null;
  selectedTerminalMode?: ShaderRenderMode | null;
};

// ============================================
// MACRO 2 M2-A1-D1 — INSTALL MENU FOUNDATION + AJMI MIRROR PAYLOAD TYPES
// ============================================

export type ScsBridgeSetInstallMenuOpenPayload = {
  installMenuOpen: boolean;
};

export type ScsBridgeAdvanceInstallWizardStepPayload = {
  nextStep: ScsBridgeInstallWizardStep;
};

// AJMI consumer payloads — installed SCPs synced from server (scpRegistry source of truth)
// then mirror entry derived locally on every change.
export type ScsBridgeSetInstalledScpsPayload = {
  installedScps: ScpRegistryEntry[];
};

// No payload — reducer reads current installedScps and recomputes mainMenuMirrorEntry
export type ScsBridgeRecomputeMainMenuMirrorPayload = Record<string, never>;

// M2-A1-D2 Naming Wizard payload — single-dispatch validates + updates draft + valid + error
export type ScsBridgeSetWizardConceptNameDraftPayload = {
  draft: string;       // user-typed designation (live input on every keystroke)
};

// M2-A1-D5 · AJMI Extension 3 — Cadmium Tutorial Join state transition payload
// Replaces full state machine slot; reducer accepts state directly.
export type ScsBridgeSetCadmiumTutorialJoinPayload = {
  joinState:
    | { kind: 'inactive' }
    | { kind: 'pending'; scpName: string }
    | { kind: 'active'; scpName: string; loopedMacroId: string };
};

// M2-A2-D1 · Toolbar registration payloads (upsert + remove + enable-toggle)
export type ScsBridgeRegisterToolbarButtonPayload = {
  button: ToolbarButtonRegistration;
};

export type ScsBridgeUnregisterToolbarButtonPayload = {
  id: string;
};

export type ScsBridgeSetToolbarButtonEnabledPayload = {
  id: string;
  enabled: boolean;
};

// M2-A2-D2 · Boot default toolbar (registers all 4 reserved buttons in one dispatch)
export type ScsBridgeBootDefaultToolbarPayload = Record<string, never>;

// ============================================
// DIAMOND 3D · WAVE-2 · SAES + CMIA-Spawn/Engage Quality Payload Types
// ============================================

// SAES setter — engage transitions activeEngagedSessionId null↔string
// Cite: R3-C §S1 setActiveEngagedSessionId Quality
export type ScsBridgeSetActiveEngagedSessionIdPayload = {
  sessionId: string | null;
};

// CMIA-Spawn trigger — Vue dispatches with scpName when user clicks Spawn
// Principle watches; clears after fetch resolves. Cite: R3-C §S2.
// TTVS Three-Value Trigger Semantic · undefined=no-trigger · null=trigger-fire-without-SCP-binding · string=trigger-fire-named-SCP. Cite: D3D-HOTFIX-2-R7-FUCHSIA-CLINICAL.md §B.
export type ScsBridgeSetPendingSpawnScpNamePayload = {
  scpName: string | null | undefined;
};

// C1-D2 · SBST · CMIA-Spawn-Suite8 trigger — Vue dispatches with suite8Name when
// user clicks Suite 8 Spawn (Suite8OnDemand) or on Cadmium page-load (PPOL).
// Principle watches; clears after fetch resolves. Sibling to ScsBridgeSetPendingSpawnScpNamePayload.
export type ScsBridgeSetPendingSpawnSuite8NamePayload = {
  suite8Name: string | undefined;
  // SBST asWorker · optional companion flag. true = NON-anchor research worker spawn (skip
  // anti-flood guard + auto-anchor in the bridge quality). Omitted/false = anchor/PPOL path.
  asWorker?: boolean;
  // C373 · THE SCP THREAD · optional companion. A string pins the Forge anchor to the caller's SCP
  // (→ pendingSpawnSuite8ScpName → the InvokeSpawnSuite8 principle → MCP scpName arg). Omitted =
  // the bridge resolves the SCP dir (prior behaviour).
  scpName?: string;
  // C386 · THE FRESH FLAG · optional companion. true = the Forge's Per-Actualization Engage (a NEW
  // conduction that never resumes a prior one). Threaded (→ pendingSpawnSuite8Fresh → the
  // InvokeSpawnSuite8 principle → MCP fresh arg) so the bridge quality, on an OFFLINE anchor,
  // CREATES a new session + re-claims the anchor instead of re-engaging the dead one. Omitted/false
  // = the ordinary offline→re-engage anchor behaviour.
  fresh?: boolean;
  // D-UP · THE MANUAL-MODE SEVER · optional companion. true = fresh-worker spawn WITHOUT the
  // auto-permission marker (→ pendingSpawnSuite8ManualMode → the InvokeSpawnSuite8 principle →
  // MCP manualMode arg) — approval gate INTACT + the Stand By overlay on the primed session.
  // The Gitm Resolver's flag. Omitted/false = the ordinary worker auto-accept.
  manualMode?: boolean;
  // RS.2b · THE COMBINED INITIAL ENTRY · optional companion. A per-run SCS:Vermillion
  // directive composed at spawn time (→ pendingSpawnSuite8InitialDirective → the
  // InvokeSpawnSuite8 principle → MCP initialDirective arg) — the bridge appends it to the
  // Onboard seed as ONE initial positional prompt, retiring the post-boot typed delivery
  // (the C285 interleave class). When present, the bridge skips the standBy overlay arm.
  initialDirective?: string;
  // THE ONBOARD OPTION · optional companion. true by DEFAULT (omit = the Onboard seed rides
  // per the anchor predicate — the current behavior; the Session Manager spawns this way).
  // false = suppress the Onboard placement for THIS spawn (→ pendingSpawnSuite8Onboard →
  // the InvokeSpawnSuite8 principle → MCP onboard:false) — for callers supplying their own seed.
  onboard?: boolean;
  // THE PLAIN-SPAWN LANE · optional companion. true by DEFAULT (omit = the anchor lane —
  // the page/Shatterite Menu door). false = a PLAIN instance (→ pendingSpawnSuite8Anchor →
  // MCP anchor:false): the bridge skips the whole anchor machinery. The Session Manager's
  // default Suite 8 spawn is this lane (anchor:false + onboard:false).
  anchor?: boolean;
};

// MD-9 · D-MC-3 · Per-Instance Model Control · the model-selection setter payload. Vue
// dispatches with the chosen model id when the Session Management dropdown changes; both
// spawn principles read pendingSpawnModel at fire-time. undefined = no per-instance pin
// (the spawn omits model → the bridge global default). NOT a one-shot trigger — a persistent
// selection the dropdown owns.
export type ScsBridgeSetPendingSpawnModelPayload = {
  model: string | undefined;
};

// CMIA-Engage trigger — Vue dispatches with sessionId when user clicks Engage row affordance
// Principle watches; clears after fetch resolves. Cite: R3-C §S3.
export type ScsBridgeSetPendingEngageSessionIdPayload = {
  sessionId: string | null;
};

// D3RM-E · CMIA-Focus trigger — Vue dispatches with sessionId when user clicks
// the Focus button (post-launch, terminalWindowId present). Principle watches +
// fires MCP scp_focus_session; clears trigger after fetch resolves.
// Citation: D3RM-E-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 3
export type ScsBridgeSetPendingFocusSessionIdPayload = {
  sessionId: string | null;
};

// D3RM-G · CHAT trigger payload — wraps a compound { sessionId, message } | null
// under a `payload` field so the action factory call shape is uniformly
// `e_.scsBridgeSetPendingChatMessage({ payload: { sessionId, message } })`
// for a send and `{ payload: null }` for the WSVN clear. The reducer mirrors
// payload into state.pendingChatMessage verbatim.
// Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 1
// Citation: D3RM-G-FOUNDATION-TEAL-CLAUDE-PEWTER-DESIGN.md §6.2 (WSVN clear)
export type ScsBridgeSetPendingChatMessagePayload = {
  payload: { sessionId: string; message: string } | null;
};

// A/B Hard Turn Over payload — carries the turn-over direction (A = stable baseline,
// B = working candidate) + the git branch to switch the SCP server to BEFORE the
// .bridge-restart.json marker write. Shared by the client Induction + the huirth Real
// (byte-parity across the WebSocket Diametric relay · TQNI-safe).
//
// PCGT+ABCS · createBranch — when true AND targetBranch is non-empty, the huirth runs
// `git switch -c <targetBranch>` (the `-c` CREATES the branch from HEAD, lands on it, and
// CARRIES the dirty working tree) instead of the plain `git switch <targetBranch>`. This is
// the "create-then-turn-over" sequence collapsed into ONE synchronous local huirth op — a
// Pewter confirmation menu confirms, then a B branch is created + the turn-over engaged in one
// pass. Omitted/false = the existing plain switch to an already-existing branch (A-return path).
export type ScsBridgeTriggerHardTurnOverPayload = {
  source?: 'A' | 'B';
  targetBranch?: string;
  createBranch?: boolean;
};

// ============================================
// QUALITY TYPE DEFINITIONS (D2 · 5 qualities live)
// ============================================

export type ScsBridgeClientQualities = {
  // Diametric Induction (ClientToServer) — single-message-send to bridge runtime
  scsBridgeSendBridgeMessage: Quality<ScsBridgeClientState, ScsBridgeSendBridgeMessagePayload>;

  // Diametric Induction (ClientToServer · D6) — Hard Turn Over signal (Pattern G · SCP-S11)
  // A/B-aware: carries source + targetBranch so the huirth switches the SCP branch then restarts.
  scsBridgeTriggerHardTurnOver: Quality<ScsBridgeClientState, ScsBridgeTriggerHardTurnOverPayload>;

  // Reducer (set from ServerToClient sync) — bridge runtime pushes status updates
  scsBridgeSetBridgeStatus: Quality<ScsBridgeClientState, ScsBridgeSetBridgeStatusPayload>;

  // UI Reducers (local-only · bar/page selectors)
  scsBridgeSetBarVisible: Quality<ScsBridgeClientState, ScsBridgeSetBarVisiblePayload>;
  scsBridgeSetBarExpanded: Quality<ScsBridgeClientState, ScsBridgeSetBarExpandedPayload>;
  scsBridgeSetActiveSubPage: Quality<ScsBridgeClientState, ScsBridgeSetActiveSubPagePayload>;
  scsBridgeSetRenderSettings: Quality<ScsBridgeClientState, ScsBridgeSetRenderSettingsPayload>;

  // GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight-target reducer
  // (set via the scs:highlight relay · cleared via the Vue auto-reset · both use this quality).
  scsBridgeSetHighlightTarget: Quality<ScsBridgeClientState, ScsBridgeSetHighlightTargetPayload>;

  // M2-A1-D1 · Install Menu Foundation (local-only UI reducers)
  scsBridgeSetInstallMenuOpen: Quality<ScsBridgeClientState, ScsBridgeSetInstallMenuOpenPayload>;
  scsBridgeAdvanceInstallWizardStep: Quality<ScsBridgeClientState, ScsBridgeAdvanceInstallWizardStepPayload>;

  // M2-A1-D1 · AJMI Main Menu Mirror consumers
  // setInstalledScps fires when scpRegistry pushes a registry update (server → client sync)
  // recomputeMainMenuMirror fires reactively after setInstalledScps via principle composition
  scsBridgeSetInstalledScps: Quality<ScsBridgeClientState, ScsBridgeSetInstalledScpsPayload>;
  scsBridgeRecomputeMainMenuMirror: Quality<ScsBridgeClientState, ScsBridgeRecomputeMainMenuMirrorPayload>;

  // M2-A1-D2 · Naming Wizard live validation (every-keystroke single-dispatch tri-field update)
  scsBridgeSetWizardConceptNameDraft: Quality<ScsBridgeClientState, ScsBridgeSetWizardConceptNameDraftPayload>;

  // M2-A1-D5 · AJMI Extension 3 — Cadmium Tutorial Join state transition
  scsBridgeSetCadmiumTutorialJoin: Quality<ScsBridgeClientState, ScsBridgeSetCadmiumTutorialJoinPayload>;

  // M2-A2-D1 · Toolbar registration (TaskBar pattern port)
  scsBridgeRegisterToolbarButton: Quality<ScsBridgeClientState, ScsBridgeRegisterToolbarButtonPayload>;
  scsBridgeUnregisterToolbarButton: Quality<ScsBridgeClientState, ScsBridgeUnregisterToolbarButtonPayload>;
  scsBridgeSetToolbarButtonEnabled: Quality<ScsBridgeClientState, ScsBridgeSetToolbarButtonEnabledPayload>;

  // M2-A2-D2 · Boot default toolbar (Turn Over refold + 3 other reserved buttons)
  scsBridgeBootDefaultToolbar: Quality<ScsBridgeClientState, ScsBridgeBootDefaultToolbarPayload>;

  // M2-A2-D3 · Enable send-message toolbar entry (post-Managing-Instance-Contact handshake)
  scsBridgeEnableSendMessageToolbar: Quality<ScsBridgeClientState, ScsBridgeBootDefaultToolbarPayload>;

  // Cycle 155 · JSON Relay setters (received via actionExchange.serverToClient · Path B)
  scsBridgeSetBridgeJsonRelay: Quality<ScsBridgeClientState, ScsBridgeSetBridgeJsonRelayPayload>;
  scsBridgeSetSessionsListRelay: Quality<ScsBridgeClientState, ScsBridgeSetSessionsListRelayPayload>;

  // SE · Epoch Extension · ASMQ relay (received via actionExchange.serverToClient · UFRT full-replace)
  scsBridgeSetArchiveManifestRelay: Quality<ScsBridgeClientState, ScsBridgeSetArchiveManifestRelayPayload>;

  // D3F Diamond B · transcript data relay (crosses WS boundary · actionExchange.serverToClient)
  scsBridgeSetSessionTranscriptDataRelay: Quality<ScsBridgeClientState, ScsBridgeSetSessionTranscriptDataPayload>;

  // ============================================
  // DIAMOND 3D · WAVE-2 · SAES + CMIA-Spawn/Engage Quality Type Map
  // ============================================
  // SAES setter — one active engagement per UI. Cite: R3-C §S1.
  scsBridgeSetActiveEngagedSessionId: Quality<ScsBridgeClientState, ScsBridgeSetActiveEngagedSessionIdPayload>;
  // CMIA-Spawn trigger reducer — Vue→state→principle handshake. Cite: R3-C §S2.
  scsBridgeSetPendingSpawnScpName: Quality<ScsBridgeClientState, ScsBridgeSetPendingSpawnScpNamePayload>;
  // C1-D2 · SBST · CMIA-Spawn-Suite8 trigger reducer — Vue→state→principle handshake.
  scsBridgeSetPendingSpawnSuite8Name: Quality<ScsBridgeClientState, ScsBridgeSetPendingSpawnSuite8NamePayload>;
  // MD-9 · D-MC-3 · Per-Instance Model Control · model-selection reducer (dropdown → state).
  scsBridgeSetPendingSpawnModel: Quality<ScsBridgeClientState, ScsBridgeSetPendingSpawnModelPayload>;
  // CMIA-Engage trigger reducer — Vue→state→principle handshake. Cite: R3-C §S3.
  scsBridgeSetPendingEngageSessionId: Quality<ScsBridgeClientState, ScsBridgeSetPendingEngageSessionIdPayload>;
  // D3RM-E · CMIA-Focus trigger reducer · Vue→state→principle handshake.
  scsBridgeSetPendingFocusSessionId: Quality<ScsBridgeClientState, ScsBridgeSetPendingFocusSessionIdPayload>;
  // D3RM-G · CHAT trigger reducer · compound { sessionId, message } | null payload.
  // Vue→state→principle handshake for the CBSE chat-bar send affordance.
  scsBridgeSetPendingChatMessage: Quality<ScsBridgeClientState, ScsBridgeSetPendingChatMessagePayload>;
  // GITM PAGE · action-pipe trigger reducer · { tool, arguments } | null payload.
  // Vue→state→principle handshake for the Git sub-page stage/unstage/commit/switch.
  scsBridgeSetGitmPendingAction: Quality<ScsBridgeClientState, ScsBridgeSetGitmPendingActionPayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type ScsBridgeClientConcept = Concept<ScsBridgeClientState, ScsBridgeClientQualities>;

export type ScsBridgeDeck = {
  scsBridge: ScsBridgeClientConcept;
};

export type ScsBridgeClientDeck = MuxiumDeck & ScsBridgeDeck;

// ============================================
// PRINCIPLE TYPE
// ============================================

export type ScsBridgePrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_SCS_BRIDGE_BAR_VISIBLE = true;
export const DEFAULT_SCS_BRIDGE_BAR_EXPANDED = false;
export const DEFAULT_SCS_BRIDGE_ACTIVE_SUB_PAGE: ScsBridgeSubPage = 'sessions';

// ============================================
// MACRO 2 EXTENSIONS — Install Wizard + Toolbar Registration
// ============================================
//
// Foundation grounded by Macro 2 R3 Yellow Architecture. Types declared here;
// state fields initialized in scsBridge.state.ts; consuming qualities + Vue
// components land in M2-A1-D1..D5 + M2-A2-D1..D3.
//
// Cross-concept reference: ScpRegistryEntry lives in scpRegistry.type.ts;
// imported here for installedScps field shape. ScpLogEntry/ScpLogSource live in
// scpLog.type.ts; imported for logQueryResult/logQuerySource state fields.
//
// Citation: SUITE-3-YELLOW-MACRO-2-ARCHITECTURE.md (R3 grounding · scsBridge State Extension)
// Citation: DIAMOND-TIER-MACRO-2.md M2-P2

// Install wizard step machine (M2-A1-D1 + M2-A1-D2)
export type ScsBridgeInstallWizardStep =
  | 'idle'
  | 'naming'
  | 'validating'
  | 'cloning'
  | 'priming'
  | 'launching'
  | 'complete';

// Toolbar registration types (M2-A2-D1 port from SCP-Origin TaskBar.vue)
export type ToolbarButtonKind = 'static' | 'interactive';

export type ToolbarButtonRegistration = {
  id: string;
  label: string;
  icon: string;
  kind: ToolbarButtonKind;
  suiteColor: string;            // e.g. "pewter" · drives HiFi badge styling
  actionQualityName: string;     // Stratimux quality dispatched on click
  enabled: boolean;
  // WAVE 3 Cobalt-Shell additive fields (TaskBar Pewter Pass · Cycle 157)
  badgeCount?: number;           // Optional pill count — badge renders when > 0
  componentName?: string;        // Optional override for componentMap lookup (defaults to by-id)
  // Cycle 158 R6 · Zone partition field · per Ochre-Shell TBFL pattern
  position?: 'left' | 'center' | 'right';
};

// Re-export for downstream consumers (avoids deep import paths in Vue components)
export type { ScpRegistryEntry, ScpLogEntry, ScpLogSource };

// Default constants for M2-P2 state initialization
export const DEFAULT_SCS_BRIDGE_INSTALL_MENU_OPEN = false;
export const DEFAULT_SCS_BRIDGE_INSTALL_WIZARD_OPEN = false;
export const DEFAULT_SCS_BRIDGE_INSTALL_WIZARD_STEP: ScsBridgeInstallWizardStep = 'idle';
export const DEFAULT_SCS_BRIDGE_WIZARD_NAME_DRAFT = '';
export const DEFAULT_SCS_BRIDGE_WIZARD_NAME_VALID = false;
export const DEFAULT_SCS_BRIDGE_WIZARD_NAME_ERROR = '';
export const DEFAULT_SCS_BRIDGE_LOG_QUERY_SOURCE = 'bridge' as const;

// ============================================
// AJMI Extensions (User-Facing Reactivity + Main Menu Mirror + Cadmium Join)
// ============================================
//
// User mid-M2-P3 architectural addendum. Three FSDCS slots:
//   1. SCPs.json file-watcher gate (M2-A1-D4 wires fs.watch)
//   2. Main Menu mirror entry cache (M2-A1-D1 wires derivation)
//   3. Cadmium Tutorial join point (Macro 3 · slot only)
//
// Citation: User AJMI addendum (Cycle 76 mid-M2-P3)

// MainMenuMirrorEntry already imported at top of file; re-export for downstream consumers
export type { MainMenuMirrorEntry } from '../scpRegistry/scpRegistry.type';

// Cadmium join state — Macro 3 fills semantics; Macro 2 reserves the slot
export type CadmiumTutorialJoinState =
  | { kind: 'inactive' }
  | { kind: 'pending'; scpName: string }      // post-install handshake armed
  | { kind: 'active'; scpName: string; loopedMacroId: string };

export const DEFAULT_SCS_BRIDGE_SCPS_JSON_WATCHER_ACTIVE = false;
export const DEFAULT_SCS_BRIDGE_MAIN_MENU_MIRROR_ENTRY: MainMenuMirrorEntry = {
  kind: 'install',
  label: 'Install Personalized SCP',
};
export const DEFAULT_SCS_BRIDGE_CADMIUM_TUTORIAL_JOIN: CadmiumTutorialJoinState = { kind: 'inactive' };

// ============================================
// CYCLE 155 · BRIDGE JSON RELAY (BJDP)
// ============================================
//
// Local mirror types — the canonical bridge lib types live in a separate
// package and are not exported via path alias from the SCP template. If a
// future refactor exposes them, replace these declarations with shared imports.
//
// Citation: FOUNDATION-A consolidated RD §6 File 4
// Citation: src/lib/bridge/bridgeMetadata.ts (origin shape) · src/lib/bridge/registry.ts

export type BridgeJsonBoundScpEntry = {
  port: number;
  status: string;
  browserUrl: string;
  // MD-1 · D-SB-1 · THE DIR FIELD mirror. The SCP's absolute install root (written by
  // the bridge from SCPs.json). Optional for backward-compat; the SCP tolerates its
  // absence (whole-object relay · field-agnostic watcher). Mirror of BoundScpEntry.dir
  // in src/lib/bridge/bridgeMetadata.ts.
  dir?: string;
};

// PP-D2 · Ping Pong Liveness Diameter · pongReceipt receipt shape (Option β)
// WRITTEN by SCS-Bridge bridgePingPong.quality.huirth.ts on Pong handler fire
// READ by SCP huirth scsBridgeJsonWatcher.principle.huirth.ts on file change
// RELAYED to Client via setBridgeJsonRelay (actionExchange.serverToClient)
// RENDERED across 3 surfaces that consume BridgeJsonShape via DECK K
// Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-A-SCS-BRIDGE-BLUEPRINT.md §3
export type ScsBridgePongReceipt = {
  clientId: string;       // PPSO echo — which SCP Client initiated the Ping
  respondedAt: number;    // Bridge-side Date.now() at Pong write
  bridgeVersion: string;  // PPBV — Bridge self-reports version for parity check
};

// SWRM · D3 · render-mode mirror types. The bridge owns the canonical catalog
// (src/shared/renderModeCatalog.model.ts · the shared model); the SCP cannot import across the
// codebase boundary, so it mirrors the TYPES here while the DATA always arrives at runtime from
// bridge.json.availableRenderModes (published from the one model — so the SCP and the Terminal
// render can never offer different modes). Keep this union in lockstep with the bridge model.
export type ShaderRenderMode =
  | 'muxon' | 'crtcurve' | 'fishbowl' | 'chroma' | 'crtflat'
  | 'lcd' | 'dmg' | 'cga' | 'vhs' | 'vfd' | 'eink' | 'off';
export type RenderModeTier = 'geometric' | 'color' | 'temporal' | 'off';
export type RenderModeCatalogEntry = {
  id: ShaderRenderMode;
  label: string;
  tier: RenderModeTier;
  blurb: string;
};

export type BridgeJsonShape = {
  schemaVersion: number;
  bridgeVersion: string;
  writtenAt: number;
  port: number;
  endpoint: string;
  userCwd: string;
  boundScps: Record<string, BridgeJsonBoundScpEntry>;
  installedScps: string[];
  installState?: string;
  // D3C · Route A · TUI-active SCP focus (BJAS) · mirrors CLI BridgeMetadata.activeScp
  activeScp?: string | null;
  // PP-D2 · Option β · NEW field · null = no Pong yet
  pongReceipt?: ScsBridgePongReceipt | null;
  // SWRM · D3 · the current Terminal render mode + the published shared catalog. The SCP becomes
  // aware via the field-agnostic scsBridgeJsonWatcher relay; D4 lists from availableRenderModes,
  // D5 drives the SCP self-render from the same vocabulary.
  renderMode?: ShaderRenderMode;
  // SWRM · the active SCP render mode — applies to ALL shaded SCPs (the bridge swaps every SCP
  // offscreen presenter · mirrors renderMode). The Settings SCP-self target writes it via the
  // huirth RMW; the panel reads it back here to show the current selection.
  scpRenderMode?: ShaderRenderMode;
  // C919 · THE FRAME GOVERNOR · the shader output fps for EVERY presenter (terminal + SCP).
  // Absent ⇒ 24 (Like Animation). The Settings slider writes it via the huirth RMW; the panel
  // reads it back here to show the current cadence.
  shaderFps?: number;
  availableRenderModes?: RenderModeCatalogEntry[];
  // MD-9 · D-MC-6 · the global default spawn model + the published model catalog. Published by the
  // bridge (field-agnostic scsBridgeJsonWatcher relay · mirrors availableRenderModes); the Settings
  // Default Model section reads the live default from defaultModel and the catalog from availableModels,
  // falling back to the template catalog mirror (scsModelCatalog.model.ts) before the bridge relays.
  defaultModel?: string;
  availableModels?: ScsModelCatalogEntry[];
  // D-UP7 · THE UPDATE INDICATOR mirror — the bridge's npm registry check (published on every
  // bridge.json write + an immediate RMW on check completion; carried FREE by the field-agnostic
  // scsBridgeJsonWatcher relay). npmLatestVersion null = no successful check yet this bridge run;
  // updateAvailable = the latest npm publish is numerically newer than bridgeVersion. The
  // installation sub-page renders installed-vs-latest; the landing chip routes there.
  npmLatestVersion?: string | null;
  updateAvailable?: boolean;
  versionCheckedAt?: number;
  // W6a · THE LIFECYCLE PROJECTION mirror (SCM W6 · Spawn Window Focus + Simulated Loading Bar).
  // scpName → FSM-state-string ('pending' | 'idle' | 'booting' | 'live'). Written by the bridge from
  // the SAME lifecycleByScp FSM the TUI badges ride; carried FREE by the field-agnostic
  // scsBridgeJsonWatcher relay. The helm reads the booting-class states (pending/idle/booting) to
  // drive the simulated loading bar + fire focus-on-open when a spawn lands live. Optional for
  // backward-compat; absent ⇒ the helm has no booting signal (falls back to boundScps live/offline).
  scpLifecycle?: Record<string, string>;
  // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION mirror (SCM W6). scpName → visible Electron
  // windowId, written by the bridge (bounded · mtime-memoized from SCPs.json `windowId`, bound by
  // cli-handler setScpWindowId at open-url — which fires AFTER the SCP server's FSM 'live', the
  // "moments" gap before the OS window appears). Carried FREE by the field-agnostic
  // scsBridgeJsonWatcher relay (mirrors scpLifecycle). The helm gates its ONE focus round on THIS
  // field — a name present here means its window truly exists. Optional for backward-compat; absent
  // ⇒ the helm falls back to firing focus on FSM 'live' (the pre-W6-refinement behaviour).
  scpWindows?: Record<string, number>;
  // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms, written by the bridge
  // (bounded · mtime-memoized from SCPs.json `windowRenderedAt`, stamped by electronWindow's M1
  // show-on-rendered moment — the window truly PAINTED, one step past scpWindows' BOUND). Carried FREE
  // by the field-agnostic scsBridgeJsonWatcher relay (mirrors scpWindows). The helm gates its focus
  // round on THIS field — a name present means the window is rendered (not merely bound), so
  // /bridge-focus never lands on a bound-but-blank window. Optional; absent ⇒ the helm falls back to
  // scpWindows (BOUND) presence (the pre-rendered-refinement behaviour).
  scpWindowsRendered?: Record<string, number>;
  // C653 · THE STATUS PROJECTION (MEND C) · scpName → PSSM status string ('live' | 'pending' |
  // 'installing'), written by the bridge (bounded · mtime-memoized from SCPs.json `status`). A fresh
  // MULTIPLY worktree instance is registered 'installing' (its tree carries package.json but NO
  // node_modules) and flips to 'pending' when its async `npm install` exits. Carried FREE by the
  // field-agnostic scsBridgeJsonWatcher relay (mirrors scpWindowsRendered). The helm reads THIS to
  // hold the MULTIPLY staged bar's INSTALL tick + disable the instance-row Spawn button while
  // dependencies land. Optional for backward-compat; absent ⇒ the helm treats every instance as
  // install-complete (the pre-C653 behaviour).
  scpStatuses?: Record<string, string>;
};

// ============================================
// GITM PAGE · gitm.json shape (mirrors GitmStatusSnapshot in the bridge)
// ============================================
// GITM #639 · GitmJsonShape is canonical in gitm.type.ts (the clean import-graph decision ·
// the gitm concept owns the gitm.json file-watch relay). Re-exported here for the RETAINED
// gitmPendingAction action-pipe consumers (ScsBridgeGitmSubPage prop + the action-pipe
// principle) that import it from '../scsBridge.type'. The gitm relay state/qualities/watcher
// migrated OUT to src/concepts/gitm/ (migrate-and-remove · #639).
export type { GitmJsonShape } from '../gitm/gitm.type';

// GITM PAGE · the action-pipe trigger payload. tool = the MCP tool name
// (gitm_stage_file | gitm_unstage_file | gitm_commit | gitm_branch_switch | ...);
// arguments = the JSON-RPC params.arguments object passed to the bridge tool.
export type GitmPendingAction = {
  tool: string;
  arguments: Record<string, unknown>;
};

export type ScsBridgeSessionEntry = {
  id: string;
  claudeSessionId?: string;
  claudePid?: number;
  spawnedAt: number;
  status: 'allocated' | 'launched' | 'archived' | 'offline';
  cwd: string;
  synthesizedAt?: number;
  displayName?: string;
  // RM-D4 · SCSLA · SCS-Label-Assured-Field (mirror of RegistryEntry.scsLabel).
  // SCS-Bridge-only rename label; DPCO display priority scsLabel > displayName >
  // shortId. Carried through the SLSR relay alongside displayName.
  scsLabel?: string;
  scpName?: string;
  // A-5 PFGD · Suite8 Name field — NDEP (literal directory entry) matching
  // Cascades/8_SUITES/<suite8Name>/ assignment. Carried FREE by the field-agnostic
  // full-entry relay (readSessionsList cast · scsBridgeJsonWatcher). Gates the
  // activeSuite8Filter computed in ScsBridgeSessionManagement + Suite8SessionList.
  suite8Name?: string;
  // A-D2 · ARF (Anchor Registry Field) mirror — true iff this session is the
  // page-bound Anchor for its suite8Name. Carried FREE by the field-agnostic
  // full-entry relay (same path as suite8Name). Drives the DACM Anchor column.
  isAnchor?: boolean;
  // MD-9 · D-MC-3 · Per-Instance Model Control mirror (of RegistryEntry.model). The
  // per-session model id the bridge recorded at spawn (a full AVAILABLE_MODELS id).
  // Carried FREE by the field-agnostic full-entry relay (scsBridgeJsonWatcher casts
  // the whole sessions.json entry — no explicit mapping). Rendered small/muted on the
  // session row via scsModelLabel when present. Undefined ⇒ the session rode the global.
  model?: string;
  // D3C readiness · SSRT tier · populated by JTCH hook in Diamond 3C
  finalTurnIndex?: number;       // D3C · live · index of last JSONL turn
  finalTurnTimestamp?: string;   // D3C · live · ISO timestamp
  finalTurnSummary?: string;     // D3C · live · text snippet
  // Cycle 161 R3 · SLAT pre-declaration · D3C-tier
  // True last activity timestamp populated by JTCH-S hook (daemon writes on
  // every turn/status change). D3B pre-adds the optional field so D3C can
  // populate without a type-system change. Zero D3B runtime impact.
  // Citation: D3B-WIRE-THROUGH-FOUNDATION-R2-RUST-PROSPECTING.md §SLAT
  lastActivityAt?: number;       // D3C · live · timestamp of most recent activity (feeds from JTCH-S)
  // D3D · TPCT flip-flop · mirrors RegistryEntry (SSRT parallel declaration)
  // HAZARD-Z: three-value (undefined | true | false). Vue templates MUST use === discrimination. NEVER truthy coercion.
  // undefined = pre-D3D (no badge); false = OPEN (viridian); true = WORKING (cobalt)
  isProcessing?: boolean;
  lastUserSubmitAt?: number;     // ms timestamp · LSUB display in SREX expanded zone
  // D3RM-E · WIPS · macOS Terminal.app window-id (captured at spawn via Method C).
  // Gates the FOCUS button render in ScsBridgeSessionManagement.vue (DD-2 Option X).
  // Undefined on non-macOS sessions + pre-D3RM-E sessions.
  terminalWindowId?: number;
  // D3F Diamond B · SSTE (Session-State-Transcript-Extension) · Cycle 164 R3
  // Populated by scsBridgeSessionTranscriptWatcherPrinciple via AQSD chained dispatch.
  // All fields optional — undefined until watcher reads first .jsonl turn.
  transcriptSnippet?: string;          // TSTR · 120-char truncated model output · SRBR display
  transcriptLastUserInput?: string;    // FTUR · full user prompt of last turn · HFEB expand view
  transcriptLastModelOutput?: string;  // FTUR · full model response of last turn · HFEB expand view
  transcriptLastReadAt?: number;       // ms epoch of most recent successful LJDR read · staleness guard
  transcriptPath?: string;             // ~/.claude/projects/<encoded>/<uuid>.jsonl · debugging + watcher key
  // RM-D3 · ATID/PRMX/DPOB/FSSF · mirror of RegistryEntry RM-D3 fields.
  // Carried FREE by scsBridgeSetSessionsListRelay (field-agnostic full-entry relay).
  // pendingPermissionRequestId is display-only — the held-res Map key is the ulid
  // alone (canary: tool_use_id absent on PermissionRequest).
  activeTool?: string;
  activeToolInput?: string;
  permissionPending?: boolean;
  pendingPermissionTool?: string;
  pendingPermissionInput?: string;
  pendingPermissionRequestId?: string;
  permissionSuggestions?: string;
  // PSTK · Permission Stack · the FIFO landing-order queue of held PermissionRequests.
  // The HEAD (index 0) mirrors the legacy PRMX scalars above; items 1..N-1 render as the
  // queued strip beneath the head pane. Carried FREE by scsBridgeSetSessionsListRelay
  // (field-agnostic full-entry relay) — no relay change, the new field rides for free.
  // requestId = the Bridge-minted perm-<ulid-suffix>-<counter> (the head-res key stays the
  // ulid alone; requestId selects the queue ITEM at decision time).
  pendingPermissions?: Array<{
    requestId: string;
    tool: string;
    input: string;
    suggestions?: string;
    landedAt: number;
  }>;
  askUserQuestionPending?: boolean;
  lastTool?: string;                    // LTUT · tool_name of most recent PreToolUse · persists across PostToolUse + restart
  lastToolAt?: number;                  // LTUT · Date.now() ms epoch when lastTool was recorded
};

// ============================================
// SSP · Suite-8 Spawn Picker · roster entry shape (D-SSP.2)
// ============================================
// TQNI byte-match with the bridge's exported Suite8PickerEntry (the bare-array
// shape returned by GET /suite8/available · D-SSP.1). Kept local — the SCP
// template has no path alias into the bridge lib (same decision as BridgeJsonShape
// above). name = the Cascades/8_SUITES/<name> directory entry; snippet = a bounded
// Instance.md slice; hasInstance = an Instance.md exists (all true entries spawnable).
export type Suite8PickerEntry = {
  name: string;
  snippet: string;
  hasInstance: boolean;
};

// ============================================
// SAC.3 · Per-page Anchor Config · resolved shape (the read endpoint return)
// ============================================
// TQNI byte-match with the bridge's ResolvedAnchorConfig (the { autoAnchor, default }
// shape returned by GET /suite8/anchor-config?name=<suite8Name> · SAC.3). Kept local —
// the SCP template has no path alias into the bridge lib (same decision as Suite8PickerEntry
// + BridgeJsonShape above). autoAnchor = the RESOLVED effective value (override ?? menu-creator
// default ?? system default true); default = the menu-creator default the Pewter panel reads.
export type AnchorConfig = {
  autoAnchor: boolean;
  default: boolean;
};

// ============================================
// HUIRTH STATE (Cycle 155 · Foundation A Wave 2)
// ============================================
//
// Huirth-side state holds the parsed bridge.json + sessions.json content.
// The Watcher Principle dispatches the relay setters to populate; Path B
// actionExchange.serverToClient broadcasts the same actions to all clients.

export type ScsBridgeHuirthState = {
  bridgeJson: BridgeJsonShape | null;
  sessionsList: ScsBridgeSessionEntry[];
  // GITM #639 · gitmJson MIGRATED → the gitm Huirth BASE concept (GitmHuirthState).
  // SE · Epoch Extension · ASMQ/UFRT · the archive-manifest snapshot. The AMWP watcher
  // dispatches the Huirth-Base setter (runs the local reducer so SMRP-style propagation
  // works) then the Relay (actionExchange.serverToClient → all clients). Full-replace.
  archiveManifest: ArchiveManifestEntry[];
  // PP-D4 · Stale-Pong Baseline · captured at huirth boot via
  // scsBridgeSetServerStartupTime Quality dispatch (before first bridge.json read).
  // Relayed to Client inside extended setBridgeJsonRelay payload.
  // Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2
  serverStartupTime: number | null;
};

// ============================================
// HUIRTH QUALITY PAYLOAD TYPES (Path B · dual-deployment)
// ============================================

export type ScsBridgeSetBridgeJsonRelayPayload = {
  scsBridgeBridgeJson: BridgeJsonShape | null;
  // PP-D4 · Stale-Pong Baseline relay · single broadcast carries both facts atomically.
  // Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2
  serverStartupTime: number | null;
};

export type ScsBridgeSetSessionsListRelayPayload = {
  scsBridgeSessionsList: ScsBridgeSessionEntry[];
};

// SE · Epoch Extension · ASMQ Relay payload (dual-deployment · Huirth dispatch + Client receive
// via actionExchange.serverToClient). UFRT full-replace — carries the entire current manifest.
// PACP: payload property `scsBridgeArchiveManifest` carries the concept-name prefix.
export type ScsBridgeSetArchiveManifestRelayPayload = {
  scsBridgeArchiveManifest: ArchiveManifestEntry[];
};

// PP-D4 · Set Server Startup Time Quality payload (huirth-only)
// Dispatched once on huirth boot from scsBridgeJsonWatcherPrinciple.
// Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2 Amendment
export type ScsBridgeSetServerStartupTimePayload = {
  timestamp: number;
};

// ============================================
// SBIS HUIRTH BASE PAYLOAD TYPES (Cycle 163 R6 · Base-only · NOT in actionExchange)
// ============================================
//
// SBIS (Stratidian-Base-Informative-State): Base = Huirth; Informative = Client.
// These Base actions update Huirth state directly so SMRP selectors fire on change.
// INVARIANT: MUST NOT appear in actionExchange.serverToClient.
// Citation: feedback_stratidian_base_informative_state.md

export type ScsBridgeSetBridgeJsonHuirthBasePayload = {
  scsBridgeBridgeJson: BridgeJsonShape | null;
  serverStartupTime: number | null;
};

export type ScsBridgeSetSessionsListHuirthBasePayload = {
  scsBridgeSessionsList: ScsBridgeSessionEntry[];
};

// SE · Epoch Extension · ASMQ Huirth-Base payload (Huirth-only · NOT in actionExchange).
// Companion Base action to the relay — runs the local Huirth reducer so the manifest lands
// in server state before the Relay broadcasts. UFRT full-replace.
export type ScsBridgeSetArchiveManifestHuirthBasePayload = {
  scsBridgeArchiveManifest: ArchiveManifestEntry[];
};

// ============================================
// GITM PAGE · action-pipe payload type · #639 migrate-and-remove
// ============================================
// The SBIS gitm.json relay payloads (ScsBridgeSetGitmJsonHuirthBasePayload +
// ScsBridgeSetGitmJsonRelayPayload) MIGRATED → gitm.type.ts (GitmSetGitmJsonHuirthBasePayload
// + GitmSetGitmJsonRelayPayload · #639). Only the action-pipe trigger payload STAYS here.
// GITM PAGE · client-local action-pipe trigger reducer payload (NOT in actionExchange).
// Vue dispatches { gitmPendingAction }; the principle clears it to null after the
// MCP fetch resolves (WSVN). MUST appear in SCSBRIDGE_FILTER_KEYS.
export type ScsBridgeSetGitmPendingActionPayload = {
  gitmPendingAction: GitmPendingAction | null;
};

// D3F Diamond B · PCAD payload (Path-Carried-Action-Dispatch)
export type ScsBridgeReadSessionTranscriptPayload = {
  sessionId: string;          // ULID key to merge into sessionsList
  sessionDir: string;         // ~/.claude/projects/<encoded-cwd>/ directory to scan
  claudeSessionId: string;    // PUTR · per-ulid JSONL resolver key (S2 A.1)
};

// D3F Diamond B · SSTE set-state payload (shared by Base + Relay)
export type ScsBridgeSetSessionTranscriptDataPayload = {
  sessionId: string;
  transcriptSnippet: string;
  transcriptLastUserInput: string;
  transcriptLastModelOutput: string;
  transcriptLastReadAt: number;
  transcriptPath: string;
};

// ============================================
// HUIRTH QUALITIES + DECK + PRINCIPLE TYPE
// ============================================

export type ScsBridgeHuirthQualities = {
  scsBridgeTriggerHardTurnOver: Quality<Record<string, never>, ScsBridgeTriggerHardTurnOverPayload>;
  scsBridgeSetBridgeJsonRelay: Quality<ScsBridgeHuirthState, ScsBridgeSetBridgeJsonRelayPayload>;
  scsBridgeSetSessionsListRelay: Quality<ScsBridgeHuirthState, ScsBridgeSetSessionsListRelayPayload>;
  scsBridgeSendBridgeMessage: Quality<ScsBridgeHuirthState, ScsBridgeSendBridgeMessagePayload>; // E11 fix · Cycle 160 · Huirth Real registration
  // PP-D4 · setServerStartupTime · captures huirth boot timestamp · stale-pong baseline
  scsBridgeSetServerStartupTime: Quality<ScsBridgeHuirthState, ScsBridgeSetServerStartupTimePayload>;
  // SBIS Base maintenance qualities (Cycle 163 R6 · Huirth-only · NOT in actionExchange)
  // Companion Base actions for the relay setters above. Run local Huirth reducer directly
  // so SMRP selectors fire on state change and broadcast follows.
  scsBridgeSetBridgeJsonHuirthBase: Quality<ScsBridgeHuirthState, ScsBridgeSetBridgeJsonHuirthBasePayload>;
  scsBridgeSetSessionsListHuirthBase: Quality<ScsBridgeHuirthState, ScsBridgeSetSessionsListHuirthBasePayload>;
  // SE · Epoch Extension · ASMQ Base+Relay (the AMWP watcher dispatches both · Base = Huirth-only,
  // Relay = actionExchange.serverToClient). UFRT full-replace manifest-in-state.
  scsBridgeSetArchiveManifestHuirthBase: Quality<ScsBridgeHuirthState, ScsBridgeSetArchiveManifestHuirthBasePayload>;
  scsBridgeSetArchiveManifestRelay: Quality<ScsBridgeHuirthState, ScsBridgeSetArchiveManifestRelayPayload>;
  // D3F Diamond B · transcript watcher qualities (Huirth-only read + Base; Relay crosses WS boundary)
  scsBridgeReadSessionTranscript: Quality<ScsBridgeHuirthState, ScsBridgeReadSessionTranscriptPayload>;
  scsBridgeSetSessionTranscriptDataHuirthBase: Quality<ScsBridgeHuirthState, ScsBridgeSetSessionTranscriptDataPayload>;
  scsBridgeSetSessionTranscriptDataRelay: Quality<ScsBridgeHuirthState, ScsBridgeSetSessionTranscriptDataPayload>;
  // GITM #639 · the gitm.json SBIS pair (scsBridgeSetGitmJsonHuirthBase +
  // scsBridgeSetGitmJsonRelay) MIGRATED → the gitm Huirth BASE concept (GitmHuirthQualities).
};

export type ScsBridgeHuirthDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
};

export type ScsBridgeHuirthPrincipleType = PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeHuirthDeck,
  ScsBridgeHuirthState
>;

// ============================================
// BRIDGE STATUS COLORS (Pewter Tessera D3 · SCST · Cycle 155 · Foundation A Wave 1)
// ============================================
//
// CSS variable strings (NEVER hex). Used by Vue components for status badges.
// Suite-color semantic mapping per Stratimuxian Scholar S16 §8.

export const BRIDGE_STATUS_COLORS = {
  connected: 'var(--color-viridian)',  // Suite 4 · validation confirmed
  syncing:   'var(--color-cobalt)',    // Suite 5 · system active
  error:     'var(--color-maroon)',    // Suite 1 · critical / failed
  idle:      'var(--color-amethyst)',  // Suite 6 · standby / orchestration
  // D3D · SWIO turn-phase plane (TPCT) · distinct from lifecycle-plane entries above
  // Muxonomy plane-separation: `syncing` occupies lifecycle-connectivity plane;
  // `working` occupies turn-phase-computation plane. Same CSS variable, different
  // Demometers — unlike Demometers sharing a color but occupying different planes
  // must remain separate entries. Likewise `connected` (lifecycle) vs `open` (turn-phase).
  // Template: === undefined → no badge; === true → working; v-else → open (HAZARD-Z)
  // Note shape change: entries below are { color, label } objects; existing 4 are bare strings.
  working: { color: 'var(--color-cobalt)',   label: 'WORKING' }, // Suite 5 · active processing
  open:    { color: 'var(--color-viridian)', label: 'OPEN' },    // Suite 4 · awaiting input
} as const;

export type BridgeStatusKey = keyof typeof BRIDGE_STATUS_COLORS;
