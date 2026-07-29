/**
 * SCS-Bridge Controller Interface
 *
 * Tier 2 (Island Wrapper) creates and provides this controller.
 * Tier 3 (Concept Landings · Shell) accesses via Vue inject anor global lookup.
 *
 * Pattern: Continuous Sync Client Muxium (CSCM)
 * - Stratimux MAINTAINS authoritative state (scsBridge concept)
 * - Vue controller MIRRORS via sync()
 * - Vue reads but doesn't own
 * - Bidirectional: TaskBar events → controller.triggerHardTurnOver()
 *
 * Cycle 159 Diamond 1 · IUPA Adoption · ADMIN_ICP Foundation pattern.
 *
 * Citation: CLIENT-MUXIUM-ADOPTION-WAVE2-OCHRE-B-CONTROLLER-BLUEPRINT.md
 * Citation: ADMIN_ICP claudeBridgeBarController.ts (CSCM template)
 * Citation: notificationController.ts (Global Vue Component Pattern · ZKHB sibling)
 */
import { shallowRef, computed, type ShallowRef, type ComputedRef, type InjectionKey } from 'vue';
import type { AnyAction, Muxium } from 'stratimux';
import type {
  AnchorConfig,
  BridgeJsonShape,
  ScsBridgePongReceipt,
  ScsBridgeSessionEntry,
  Suite8PickerEntry,
  ToolbarButtonRegistration,
} from './scsBridge.type';
// SE · Epoch Extension · ATMS · the reactive archive-manifest row shape + the on-demand
// contents shape (fetched from the bridge GET /sessionArchive/:id endpoint · W2 · SEAP).
import type { ArchiveManifestEntry, ArchiveContents } from './archiveManifest.types';
// Per-SCP-Identity-Config · FKIS Origin · the SCP's OWN name (loaded same-origin from
// GET /scp-config · vue.principle.ts) → carried as originScpName on every send_message POST.
import { loadScpConfig } from '../../model/scpConfig.model';

// ============================================
// CCKE · Controller Key Co-located at TOP (Cycle 159 D2 verdict)
// ============================================
//
// Per ADMIN_ICP Foundation: InjectionKey lives at TOP of controller file,
// NOT in a separate keys file. Co-location reduces import surface and
// keeps key+controller bound at module level.

export const SCS_BRIDGE_CONTROLLER_KEY: InjectionKey<ScsBridgeController> = Symbol(
  'scsBridgeController',
);

// ============================================
// SYNC STATE SHAPE
// ============================================
//
// Mirror of ScsBridgeClientState fields the Shell + TaskBar consume.
// Partial-update semantics: only provided keys overwrite refs.

export type ScsBridgeBarSyncState = {
  toolbarButtons: ToolbarButtonRegistration[];
  bridgeJson: BridgeJsonShape | null;
  bridgeStatus: string;
  sessionsList: ScsBridgeSessionEntry[];
  // SE · Epoch Extension · ASMQ/UFRT · archive-manifest reactive mirror (full-replace from relay)
  archiveManifest: ArchiveManifestEntry[];
  connectionEstablished: boolean;
  // PP-D4 · Stale-Pong Baseline · Ochre-C §4
  pongReceipt: ScsBridgePongReceipt | null;
  serverStartupTime: number | null;
  // D3D Wave-2 · SAES mirror — display principle reads scsBridge state and syncs.
  activeEngagedSessionId: string | null;
  // GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight target the
  // display principle mirrors so the Turn-Over buttons can pulse the matching control.
  highlightTarget: string | null;
};

// ============================================
// CONTROLLER TYPE
// ============================================

// MRQ-B · the JSON-safe relay spec the batch enqueue tool accepts (mirror of the bridge
// ScsBridgeRelaySpec — kept local so the SCP client has no bridge import). kind ∈
// {'focus','send','resize'}; text? send only; scalePct? resize only.
export type ScsBridgeRelaySpec = {
  kind: 'focus' | 'send' | 'resize' | 'spawn';
  // C407 · SQRK: 'spawn' creates its own session — sessionId is '' for spawn (the ULID
  // is born inside the bridge relay body); suite8Name addresses it; text is the priming
  // delivered after the launched gate ({{SCS_WORKER_ULID}} substituted at prime time).
  sessionId: string;
  text?: string;
  scalePct?: number;
  suite8Name?: string; // spawn only
  asWorker?: boolean;  // spawn only · defaults TRUE bridge-side
  model?: string;      // spawn only
};

// W6d · THE CONTROLLER SPAWN-PROGRESS STATE (SCM W6 · Spawn Window Focus + Simulated Loading Bar).
// The per-SCP spawn-round phase. Held on the controller (an app-singleton) so the state SURVIVES page
// navigation — the user law: navigating pages mid-boot keeps the loading bar AND the focus hand-off
// alive. Phases: 'requested' (Spawn pressed · pre-FSM) → 'booting' (FSM shows a booting-class state,
// AND — SWFB · W6 REFINEMENT — the post-live pre-window gap: FSM 'live' but the OS window not yet bound;
// 'booting' is REUSED for that gap so the bar keeps sweeping, no new phase) → 'focusing' (the SCP's OS
// WINDOW is truly open · scpWindows[name] bound · focus-on-open fires ONCE via didFocus — NOT on FSM
// 'live', which precedes the window) → 'done' (cleared after a short linger so the bar resolves) ·
// 'failed' reserved for an explicit failure branch. didFocus guards the ONE /bridge-focus per spawn
// round (never a timer · rides the WINDOW-BOUND signal, not the earlier FSM-live signal).
export type ScsBridgeSpawnPhase = 'requested' | 'booting' | 'focusing' | 'done' | 'failed';
export type ScsBridgeSpawnProgressEntry = {
  phase: ScsBridgeSpawnPhase;
  startedAt: number;
  // The one-focus guard for this spawn round — set true the moment focus-on-open fires so a re-poll
  // (or a page-hop-and-return re-render) never re-fires /bridge-focus. NEVER a timer (the user law).
  didFocus: boolean;
};

export type ScsBridgeController = {
  // ----------------------------------------
  // Vue-owned state refs · mirror Stratimux scsBridge state
  // shallowRef per ADMIN_ICP precedent · replace entire value on change
  // ----------------------------------------

  toolbarButtons: ShallowRef<ToolbarButtonRegistration[]>;
  bridgeJson: ShallowRef<BridgeJsonShape | null>;
  bridgeStatus: ShallowRef<string>;
  sessionsList: ShallowRef<ScsBridgeSessionEntry[]>;
  // SE · Epoch Extension · ASMQ/UFRT · archive-manifest reactive ref (mirrors sessionsList shape)
  archiveManifest: ShallowRef<ArchiveManifestEntry[]>;
  connectionEstablished: ShallowRef<boolean>;

  // PP-D4 · Stale-Pong Baseline · Ochre-C §4
  pongReceipt: ShallowRef<ScsBridgePongReceipt | null>;
  serverStartupTime: ShallowRef<number | null>;
  bridgeActive: ComputedRef<boolean>;

  // ----------------------------------------
  // Sync method · called by SDPS principle (Cycle 159 D3 verdict)
  // ----------------------------------------

  sync: (state: Partial<ScsBridgeBarSyncState>) => void;

  // ----------------------------------------
  // Muxium binding · GPIM (Global Principle-Injected Muxium)
  // The display principle sets the live Muxium reference once it mounts
  // so the controller can dispatch directly (no overflow via principle).
  // ----------------------------------------

  setMuxium: (muxium: Muxium<any> | null) => void;

  // ----------------------------------------
  // D-T-MUX · Default-Muxium Fallback (the silent-error fix)
  // ----------------------------------------
  // A non-binding Landing (e.g. SuiteCascadeLanding has 0 setMuxium) or a
  // post-unmount page leaves currentMuxium null, so every Hard-Turn-Over (sole-
  // fuchsia + A/B) silently no-ops. IslandWrapper arms a DEFAULT muxium as a
  // fall-through: the real Landing's setMuxium always supersedes it (close-on-
  // takeover below), the DEFAULT only fills when no Landing bound.
  //
  // getCurrentMuxium · IslandWrapper checks null to decide whether to arm.
  getCurrentMuxium: () => Muxium<any> | null;
  // setDefaultMuxium · the DEFAULT becomes current (the fallback bind).
  setDefaultMuxium: (muxium: Muxium<any>) => void;
  // closeDefaultMuxium · IslandWrapper onUnmounted tears the DEFAULT down.
  closeDefaultMuxium: () => void;

  // ----------------------------------------
  // Public dispatch API · TaskBar Shell calls these
  // ----------------------------------------

  // PCGT+ABCS · createBranch (3rd arg) — when true the huirth runs `git switch -c <targetBranch>`
  // (CREATE the branch + carry the dirty tree) in ONE local op before the restart-respawn overlay.
  // Omitted/false = the proven plain switch to an existing branch (A-return · zero-regression).
  triggerHardTurnOver: (source?: 'A' | 'B', targetBranch?: string, createBranch?: boolean) => void;

  // GITM A↔B (#641) — generic gitm MCP action dispatch. CONFORMANCE (SORD §11 · D1): a thin
  // `void` DELEGATE onto triggerGitmMean (the conforming `${bridgeJson.endpoint}/mcp` tools/call
  // mean). The 4-button A/B group + setters call this unchanged; the prior same-origin /gitm-action
  // route is removed. State returns via the gitm.json watcher relay (ACK-ONLY · SORD §10).
  triggerGitmAction: (tool: string, args: Record<string, unknown>) => void;

  // ----------------------------------------
  // D3D Wave-2 · CMIA-Spawn + CMIA-Engage + SAES dispatch API
  // ScsBridgeSessionManagement.vue calls these from button click handlers.
  // Each constructs the matching action via deck.d.client.d.scsBridge.e
  // and dispatches via the held Muxium reference (GPIM).
  // Cite: D3D-ARCHITECTURE-R3C-YELLOW-CLIENT-PRINCIPLE.md §S2-S3+S7
  // ----------------------------------------

  triggerSpawnSession: (scpName: string | undefined) => void;
  // BOOT-STREAM · public accessor for THIS SCP's own name (lazily resolved once via GET /scp-config ·
  // wraps the private resolveScpName). The GitM turn-over button awaits this to stamp scpName onto
  // the GitmTurnoverProgress carrier so the standby overlay can tail /scp-boot-log/:scpName.
  getScpName: () => Promise<string | null>;
  // C1-D2 · SBST · Suite 8 identified spawn · Vue (Suite8OnDemand) + PPOL (CadmiumLanding)
  // dispatch here; principle fires MCP scs_spawn_suite8_session (sets suite8Name BEFORE spawn).
  // asWorker (default false) · true = NON-anchor research worker spawn (runResearchSweep) → the
  // bridge quality skips the existingAnchor anti-flood guard + claimAnchorIfUnclaimed.
  // C386 · fresh (default false) · true = the Forge's Per-Actualization Engage (a NEW conduction) →
  // threaded to the MCP fresh arg so the bridge creates a NEW session + re-claims the anchor rather
  // than re-engaging an OFFLINE one.
  // D-UP · manualMode (5th arg · default false) · true = fresh-worker spawn WITHOUT the
  // auto-permission marker (approval gate intact + Stand By overlay) — the Gitm Resolver's flag.
  triggerSpawnSuite8Session: (suite8Name: string, scpName?: string | null, asWorker?: boolean, fresh?: boolean, manualMode?: boolean) => void;
  // C373 · THE RENAME-PROOF ALIAS · same signature as triggerSpawnSuite8Session; ONE implementation,
  // two names. The `suite8:page` pipeline recursively find-replaces `Suite8`→`{Domain}` /
  // `suite8`→`{domainLower}` across EVERY .ts/.vue in the copied concept dir (suite8PageCreate.ts
  // replaceInDir · 696 token occurrences / 36 files). So a copied page's `triggerSpawnSuite8Session`
  // call is rewritten to `triggerSpawn{Domain}Session` — a method that DOES NOT EXIST on this SHARED
  // controller → undefined → the Engage dies client-side silently (zero bridge events). The `s8` token
  // has no `Suite8`/`suite8` substring → SURVIVES the rename intact (the proven /s8/ URL-alias idiom).
  // Copied suite8-concept call sites MUST call THIS name; shared surfaces keep triggerSpawnSuite8Session.
  // C386 · fresh (4th arg) rides the same signature — the Forge's Engage passes fresh:true.
  triggerSpawnS8Session: (suite8Name: string, scpName?: string | null, asWorker?: boolean, fresh?: boolean, manualMode?: boolean) => void;
  // MD-9 · D-MC-3 · Per-Instance Model Control · set the model the NEXT spawn (general anor S8)
  // pins. Persistent selection the Session Management dropdown owns; both spawn principles read
  // pendingSpawnModel FRESH at fire-time. undefined = clear the pin (spawn → global default).
  setSpawnModel: (model: string | undefined) => void;
  triggerEngageSession: (sessionId: string) => void;
  // SWRM · D4 W3 · write the Terminal render mode (→ bridge.json.renderMode → D3 watcher swap).
  triggerSetTerminalRenderMode: (mode: string) => void;
  // SWRM · write the SCP render mode (→ bridge.json.scpRenderMode → watcher swaps ALL SCP presenters).
  triggerSetScpRenderMode: (mode: string) => void;
  // C919 · the frame-governor write (Settings slider → bridge.json.shaderFps · 8-60 · default 24).
  triggerSetShaderFps: (fps: number) => void;
  // MD-9 · D-MC-6 · write the default spawn model (→ bridge.json.defaultModel → the bridge's
  // renderModeWatch applies it → activeDefaultModel → every subsequent spawn/resume without a record).
  triggerSetDefaultModel: (model: string) => void;
  // D3RM-E · CMIA-Focus trigger · Vue Focus button click handler dispatches here.
  triggerFocusSession: (sessionId: string) => void;
  // D3RM-G · CBSE chat trigger · Vue chat-bar submit handler dispatches here.
  // Sets compound pendingChatMessage trigger; principle fires MCP scp_chat_session.
  triggerChatMessage: (sessionId: string, message: string) => void;
  // D3 FKIS · VSMW · Vue chat-bar submit handler dispatches here for live
  // keystroke streaming via FORF manifold. Invokes MCP send_message tool
  // directly (NOT UIMJ queue). Real-time delivery + focus round-trip.
  triggerSendMessage: (sessionId: string, text: string, opts?: { inFocus?: boolean }) => Promise<{ ok: boolean; error?: string }>;
  // RM-D4 · RENAME · DUAL Vue-surface write leg. Vue pencil-edit confirm dispatches
  // here. POSTs scp_rename_session via /mcp tools/call → scsBridgeRenameSession Quality
  // → setSessionDisplayName(sessionId, name). IDTND: sessionId is the ULID lookup key.
  triggerRenameSession: (sessionId: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  // SORD Shield/Sword (Macro Diamond · Path B) · the resilient turn-over anchor. Mirrors
  // triggerRenameSession's direct /mcp tools/call fetch (reads bridgeJson.endpoint · same Bridge
  // process). POSTs gitm_turn_over_with_source { source } → the bridge quality git-switches +
  // writes .bridge-restart.json. ACK-only (drain, never parse). Routed to the bridge CLI (NOT the
  // SCP server) so it survives a B that bricked the SCP. The terminal anchor of every sequence.
  triggerGitmTurnOver: (source: 'A' | 'B') => Promise<{ ok: boolean; error?: string }>;
  // SORD Shield/Sword (Macro Diamond · Path B) · the generic ACK-gated SORD mean. Same direct
  // /mcp tools/call shape as triggerGitmTurnOver, with an arbitrary bridge gitm_* tool + args
  // (gitm_branch_create / gitm_stage_all_and_commit / gitm_merge_working …). The awaitable ACK is
  // the step gate for a multi-step time-stepped sequence. triggerGitmAction (the void setter API)
  // now DELEGATES onto this mean (SORD §11 · D1) — this is the single conforming /mcp write path.
  triggerGitmMean: (tool: string, args: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;

  // S8P-SCP-TOOL · the Create Pipeline (Step 3) · suite8_page_create MCP tool. UNLIKE the
  // ACK-only triggerGitmMean, this AWAITS + PARSES the structured tool result (the manifold tail
  // scpExtractAndSendResponse wraps it as result.content[0].text = JSON.stringify({ suite8PageCreate:
  // { ok, conceptName?, gatesPassed?, reason? } })). The bridge runs the concept duplication +
  // AIME wiring + gate chain SYNCHRONOUSLY (execSync tsc · ~10-30s); the caller supplies its own SCP
  // name as `designation` (FKIS payload-supplied · registry-guarded). A 30s client abort mirrors the
  // bridge's /mcp response-timeout guard — on a timeout the files may still have landed on disk.
  triggerSuite8PageCreate: (args: {
    name: string;
    displayName: string;
    designation: string;
    home?: boolean;
    force?: boolean;
  }) => Promise<{
    ok: boolean;
    conceptName?: string;
    gatesPassed?: string[];
    reason?: string;
    timedOut?: boolean;
  }>;
  // A-D3b · ARFSP · "Set as Anchor" write leg. Vue anchor-cell button dispatches
  // here. POSTs scs_set_anchor_session via /mcp tools/call → scsBridgeSetSessionAnchor
  // Quality → setSessionAnchor(sessionId). IDTND: sessionId is the ULID lookup key.
  triggerSetAnchor: (sessionId: string) => Promise<{ ok: boolean; error?: string }>;
  // SAC.1 · ARFSP · "Release Anchor" un-anchor write leg. Faithful mirror of
  // triggerSetAnchor. POSTs scs_unset_anchor_session via /mcp tools/call →
  // scsBridgeUnsetSessionAnchor Quality → unsetSessionAnchor(sessionId). IDTND:
  // sessionId is the ULID lookup key. INERT until SAC.2 wires the UI button.
  triggerUnsetAnchor: (sessionId: string) => Promise<{ ok: boolean; error?: string }>;
  // DAST · Dissipate write leg. The Session Manager Dissipate button dispatches here.
  // POSTs scs_dissipate_session via /mcp tools/call → scsBridgeDissipateSession Quality
  // → dissipateSession(sessionId) (anchor-guarded registry removal + real-session DELETE).
  triggerDissipate: (sessionId: string) => Promise<{ ok: boolean; error?: string }>;
  // ARST · Archive write leg. The Session Manager Archive button dispatches here.
  // POSTs scs_archive_session via /mcp tools/call → scsBridgeArchiveSession Quality
  // → archiveSession(sessionId) (anchor-guarded · MOVE real session → Cascades/Archive then remove).
  triggerArchive: (sessionId: string) => Promise<{ ok: boolean; error?: string }>;
  // SE · Epoch Extension · ODCF · on-demand archive contents fetch (the heavy body channel).
  // The Archive view (Macro AV · next) calls this when a manifest row is expanded. GETs the
  // bridge SEAP endpoint GET /sessionArchive/:id → { entry, lastTurn } (ArchiveContents) into a
  // local Vue ref — NEVER into Stratimux state (the manifest is the light reactive list; bodies
  // stay local). Returns null on a missing entry / fetch failure (the view shows a zero-state).
  triggerFetchArchiveContents: (id: string) => Promise<ArchiveContents | null>;
  // SE · ODCF-for-the-list · on-demand manifest fetch (GET /sessionArchive). The Archive view
  // calls this onMounted as the initial-hydration fallback so the list is NOT solely dependent on
  // the AMWP reactive relay (which only broadcasts after a bridge re-launch arms the watcher).
  triggerFetchArchiveManifest: () => Promise<ArchiveManifestEntry[]>;
  // SSP · D-SSP.2 · Suite-8 Spawn Picker roster ref + fetch. fetchAvailableSuite8s GETs
  // the bridge SEAP endpoint GET /suite8/available (bare array · D-SSP.1) → availableSuite8s
  // ref. INERT this portion — D-SSP.3 (the Pewter picker) calls + renders it (on Session-Manager
  // mount + on picker-open). A failed fetch leaves the prior value (log + swallow · ACK-safe,
  // never throws to the caller). Mirrors triggerFetchArchiveManifest's bridgeJson.endpoint GET.
  availableSuite8s: ShallowRef<Suite8PickerEntry[]>;
  fetchAvailableSuite8s: () => Promise<void>;
  // SAC.3 · per-page Anchor Config legs (the Pewter Anchor System prerequisites · SAC.4 reads).
  // fetchAnchorConfig GETs the bridge SEAP endpoint GET /suite8/anchor-config?name=<suite8Name>
  // → { autoAnchor, default } (mirrors fetchAvailableSuite8s' bridgeJson.endpoint GET). Returns
  // null on a missing endpoint / fetch failure (the panel falls back to the system default).
  fetchAnchorConfig: (suite8Name: string) => Promise<AnchorConfig | null>;
  // triggerSetAnchorConfig POSTs scs_set_anchor_config (writes anchor.override.json {autoAnchor}).
  // triggerResetAnchorConfig POSTs scs_reset_anchor_config (deletes anchor.override.json → back to
  // the menu-creator default). Both mirror triggerUnsetAnchor's /mcp tools/call ACK shape.
  triggerSetAnchorConfig: (suite8Name: string, autoAnchor: boolean) => Promise<{ ok: boolean; error?: string }>;
  triggerResetAnchorConfig: (suite8Name: string) => Promise<{ ok: boolean; error?: string }>;
  // VS · VSDT · Deliver-Vermillion write leg. The CadmiumBulletin orchestrator
  // dispatches here to hand a spawned research worker its Vermillion. POSTs
  // scs_deliver_vermillion via /mcp tools/call → scsBridgeDeliverVermillion Quality
  // → SCS:Vermillion directive over dispatchFkisMessage. sessionId is the ULID.
  triggerDeliverVermillion: (sessionId: string, vermillion: string) => Promise<{ ok: boolean; error?: string }>;
  // MRQ-B · RELAY-ENQUEUE write leg. The Cadmium research sweep dispatches per-topic relay
  // batches here. POSTs scs_relay_enqueue via /mcp tools/call → scsBridgeEnqueueRelayBatch
  // Quality → builds the relay Actions server-side → scsBridgeRelayEnqueue → RQPOAD serializes
  // them one-at-a-time (no OS-focus collision across rapidly spawned workers). ACK-only.
  triggerRelayEnqueue: (specs: ScsBridgeRelaySpec[]) => Promise<{ ok: boolean; error?: string }>;
  // RM-D3 · Direction C · DPOB button click dispatches here. POSTs the user's
  // allow/deny to the held PermissionRequest res on the Bridge. PSTK · requestId now
  // SELECTS the queue item to resolve (the Bridge-minted perm-<ulid-suffix>-<counter>;
  // empty → head, back-compat). persistRule + allow = the "Allow & don't ask" path —
  // the Bridge stores the resolved item's allow-rules so future matches auto-approve.
  triggerPermissionDecision: (
    sessionId: string,
    behavior: 'allow' | 'deny',
    requestId: string,
    persistRule?: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
  clearActiveEngagedSession: () => void;

  // SAES Vue ref · activeEngagedSessionId mirror for component computed reads.
  activeEngagedSessionId: ShallowRef<string | null>;

  // GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight target ref
  // (mirrors scsBridge.highlightTarget via the display principle) the Turn-Over buttons read to
  // pulse, plus the dispatch helper the Vue auto-reset watch calls to clear it (target: null).
  highlightTarget: ShallowRef<string | null>;
  triggerSetHighlightTarget: (target: string | null) => void;

  // ----------------------------------------
  // W6d · THE CONTROLLER SPAWN-PROGRESS STATE (SCM W6 · Spawn Window Focus + Simulated Loading Bar)
  // ----------------------------------------
  // spawnProgressByScp · the per-SCP spawn-round phase map. App-singleton (survives page navigation).
  // The helm reads it to render the simulated loading bar (W6b) + drive focus-on-open (W6c). The bar
  // reads ONLY this ref, so a page hop + return re-renders it mid-boot.
  spawnProgressByScp: ShallowRef<Record<string, ScsBridgeSpawnProgressEntry>>;
  // startSpawnProgress · called when Spawn is pressed → phase 'requested' + startedAt + didFocus:false.
  startSpawnProgress: (scpName: string) => void;
  // advanceSpawnProgress · move ONE entry to a new phase (idempotent — same-phase is a no-op). markFocused
  // sets didFocus true in the SAME transition (the focus-on-open guard · never a timer).
  advanceSpawnProgress: (scpName: string, phase: ScsBridgeSpawnPhase, markFocused?: boolean) => void;
  // clearSpawnProgress · remove one entry (called after the 'done' linger resolves the bar visually).
  clearSpawnProgress: (scpName: string) => void;
};

// ============================================
// CONTROLLER FACTORY
// ============================================

/**
 * Creates a SCS-Bridge controller instance with Continuous Sync semantics.
 *
 * Usage in IslandWrapper.vue:
 * ```typescript
 * const controller = createScsBridgeController();
 * provide(SCS_BRIDGE_CONTROLLER_KEY, controller);  // GRGL provide
 * setGlobalScsBridgeController(controller);        // GRGL global
 * ```
 *
 * CSCM Flow:
 * 1. Island mounts → ClientMuxium created → scsBridgeDisplayPrinciple starts
 * 2. Principle gets controller via getGlobalScsBridgeController()
 * 3. Principle binds Muxium via controller.setMuxium(muxium)
 * 4. Principle monitors scsBridge state via DECK K selectors
 * 5. On state change → principle calls controller.sync(state)
 * 6. Vue refs update → Shell TaskBar re-renders
 * 7. User clicks Turn Over → controller.triggerHardTurnOver()
 *    → controller dispatches via held Muxium reference
 * 8. Island unmounts → principle cleanup → Muxium cleared
 */
export function createScsBridgeController(): ScsBridgeController {
  // Vue-owned refs · mirrors of Stratimux scsBridge state
  const toolbarButtons = shallowRef<ToolbarButtonRegistration[]>([]);
  const bridgeJson = shallowRef<BridgeJsonShape | null>(null);
  const bridgeStatus = shallowRef<string>('');
  const sessionsList = shallowRef<ScsBridgeSessionEntry[]>([]);
  // SE · Epoch Extension · ASMQ/UFRT · archive-manifest reactive ref (full-replaced by the relay)
  const archiveManifest = shallowRef<ArchiveManifestEntry[]>([]);
  const connectionEstablished = shallowRef<boolean>(false);

  // PP-D4 · Stale-Pong Baseline · Ochre-C §4
  // pongReceipt + serverStartupTime drive the bridgeActive ComputedRef.
  // Stale pong (prior session) → respondedAt < serverStartupTime → Pending.
  // Fresh pong (current session) → respondedAt > serverStartupTime → Active.
  const pongReceipt = shallowRef<ScsBridgePongReceipt | null>(null);
  const serverStartupTime = shallowRef<number | null>(null);

  // D3D Wave-2 · SAES mirror
  const activeEngagedSessionId = shallowRef<string | null>(null);

  // GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight mirror.
  const highlightTarget = shallowRef<string | null>(null);

  // SSP · D-SSP.2 · Suite-8 Spawn Picker roster ref. Full-replaced by fetchAvailableSuite8s
  // (the bare-array GET /suite8/available · D-SSP.1). NOT a Stratimux state mirror — this is a
  // controller-local fetch cache the D-SSP.3 Pewter picker reads (no sync() leg · no relay).
  const availableSuite8s = shallowRef<Suite8PickerEntry[]>([]);

  // W6d · THE CONTROLLER SPAWN-PROGRESS STATE (SCM W6 · Spawn Window Focus + Simulated Loading Bar).
  // Controller-local (NOT a Stratimux mirror · no sync() leg · no relay) — the app-singleton lifetime
  // is the whole point: the spawn-round phase SURVIVES page navigation (the user law). The helm's
  // simulated loading bar reads ONLY this ref, so a page hop + return re-renders it mid-boot.
  const spawnProgressByScp = shallowRef<Record<string, ScsBridgeSpawnProgressEntry>>({});

  const bridgeActive = computed<boolean>(() => {
    const p = pongReceipt.value;
    const s = serverStartupTime.value;
    const result = !!(p && s && p.respondedAt > s);
    console.log('[SCS-Bridge Controller] bridgeActive recompute · pongReceipt=', p?.respondedAt, '· serverStartupTime=', s, '· result=', result);
    return result;
  });

  // GPIM · Muxium reference is set by the display principle when it starts.
  // Stored as closure variable to avoid Vue reactivity churn on Muxium internals.
  let currentMuxium: Muxium<any> | null = null;

  // D-T-MUX · Default-Muxium Fallback. The fall-through muxium IslandWrapper arms
  // when no Landing bound (so Hard-Turn-Over dispatch resolves on any page). Held
  // separately from currentMuxium so close-on-takeover (setMuxium) and the unmount
  // teardown (closeDefaultMuxium) target ONLY the default, never a real Landing's.
  let defaultMuxium: Muxium<any> | null = null;

  // Per-SCP-Identity-Config · FKIS Origin · this SCP's OWN name, lazily resolved (once) from the
  // same-origin GET /scp-config (loadScpConfig · mirrors the hifiConfig boot-read). Cached on the
  // controller as a closure variable (no Vue reactivity needed · pure send-time read). Carried as
  // originScpName on every send_message POST so the shared workspace bridge muxium — which boots
  // before any SCP is chosen and has no per-SCP env — receives the origin from the SEND itself.
  let cachedScpName: string | null = null;
  let scpNamePromise: Promise<string | null> | null = null;
  const resolveScpName = async (): Promise<string | null> => {
    if (cachedScpName !== null) return cachedScpName;
    if (scpNamePromise === null) {
      // C375 · THE ENGAGE AWAIT HARDENING (SOURCE) · CLEAR-ON-FAILURE. Prior code cached
      // scpNamePromise on a NULL result too — so a first-failed resolution (server absent /
      // aborted / malformed) poisoned EVERY future call: getScpName forever returned the same
      // null-yielding (or, if loadScpConfig had rejected, permanently-rejected) promise. Now the
      // promise is caught (never a rejected cache) and, on a null result, the cache is CLEARED so
      // the NEXT getScpName re-attempts a fresh fetch (loadScpConfig itself is now 3s-abort-bounded).
      scpNamePromise = loadScpConfig()
        .then((cfg) => {
          cachedScpName = cfg?.scpName ?? null;
          if (cachedScpName === null) scpNamePromise = null; // clear so a later call retries
          return cachedScpName;
        })
        .catch(() => {
          scpNamePromise = null; // never leave a rejected promise cached
          return null;
        });
    }
    return scpNamePromise;
  };

  /**
   * Sync state from Stratimux scsBridge concept · only updates provided keys
   */
  const sync = (state: Partial<ScsBridgeBarSyncState>): void => {
    if (state.toolbarButtons !== undefined) {
      toolbarButtons.value = state.toolbarButtons;
    }
    if (state.bridgeJson !== undefined) {
      bridgeJson.value = state.bridgeJson;
    }
    if (state.bridgeStatus !== undefined) {
      bridgeStatus.value = state.bridgeStatus;
    }
    if (state.sessionsList !== undefined) {
      sessionsList.value = state.sessionsList;
    }
    // SE · Epoch Extension · ASMQ/UFRT · archive-manifest mirror sync (full-replace)
    if (state.archiveManifest !== undefined) {
      archiveManifest.value = state.archiveManifest;
    }
    if (state.connectionEstablished !== undefined) {
      connectionEstablished.value = state.connectionEstablished;
    }
    // PP-D4 · Stale-Pong Baseline · Ochre-C §4
    if (state.pongReceipt !== undefined) {
      pongReceipt.value = state.pongReceipt;
    }
    if (state.serverStartupTime !== undefined) {
      serverStartupTime.value = state.serverStartupTime;
    }
    // D3D Wave-2 · SAES mirror sync
    if (state.activeEngagedSessionId !== undefined) {
      activeEngagedSessionId.value = state.activeEngagedSessionId;
    }
    // GITM color-cascade (W4) · Vermillion Focus+Highlight — the highlight mirror sync.
    if (state.highlightTarget !== undefined) {
      highlightTarget.value = state.highlightTarget;
    }
  };

  const setMuxium = (muxium: Muxium<any> | null): void => {
    // D-T-MUX close-on-takeover · when a REAL Landing muxium takes over and a
    // DEFAULT is currently armed, close the default FIRST (prevents 2 WebSocket
    // connections / duplicate principles). `defaultMuxium = null` after the close
    // guards against closeDefaultMuxium double-closing the same instance.
    if (muxium !== null && defaultMuxium !== null && muxium !== defaultMuxium) {
      console.log('[ScsBridgeController] D-T-MUX · real Landing took over · closing armed default muxium');
      try {
        (defaultMuxium as any).close?.();
      } catch (err) {
        console.warn('[ScsBridgeController] D-T-MUX · default close-on-takeover threw (ignored):', err);
      }
      defaultMuxium = null;
    }
    currentMuxium = muxium;
    console.log(
      '[ScsBridgeController] Muxium',
      muxium ? 'bound' : 'cleared',
      '· triggerHardTurnOver',
      muxium ? 'live' : 'noop',
    );
  };

  // D-T-MUX · the Default-Muxium Fallback lifecycle. Additive fall-through — a
  // real Landing's setMuxium always supersedes (close-on-takeover above).
  const getCurrentMuxium = (): Muxium<any> | null => currentMuxium;

  const setDefaultMuxium = (muxium: Muxium<any>): void => {
    defaultMuxium = muxium;
    currentMuxium = muxium;
    console.log('[ScsBridgeController] D-T-MUX · default muxium armed · triggerHardTurnOver live (fallback)');
  };

  const closeDefaultMuxium = (): void => {
    if (defaultMuxium !== null) {
      console.log('[ScsBridgeController] D-T-MUX · closing default muxium (IslandWrapper unmount)');
      try {
        (defaultMuxium as any).close?.();
      } catch (err) {
        console.warn('[ScsBridgeController] D-T-MUX · default close threw (ignored):', err);
      }
      // If the default is still acting as current, clear current too so a stale
      // closed muxium is never dispatched against.
      if (currentMuxium === defaultMuxium) {
        currentMuxium = null;
      }
      defaultMuxium = null;
    }
  };

  // D3D Hotfix-2 · CMIA-Spawn dispatch helper · TTVS normalization.
  // Vue NSESF fallback may pass undefined (no filter + no boundScps edge case).
  // TTVS: undefined arg → null payload (spawn without SCP binding · principle fires unscoped).
  // string arg → string payload (spawn with named SCP · principle fires with binding).
  // Cite: D3D-HOTFIX-2-R7-FUCHSIA-CLINICAL.md §C.
  const triggerSpawnSession = (scpName: string | undefined): void => {
    console.log('[ScsBridgeController] triggerSpawnSession · scpName=', scpName);
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] triggerSpawnSession called without bound Muxium · CMIA-Spawn will NOT fire',
      );
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetPendingSpawnScpName({
        scpName: scpName !== undefined ? scpName : null,
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSpawnSession dispatched · trigger field set');
    } catch (err) {
      console.error('[ScsBridgeController] triggerSpawnSession dispatch failed:', err);
    }
  };

  // C1-D2 · SBST · CMIA-Spawn-Suite8 dispatch helper. Parallel to triggerSpawnSession.
  // Sets the pendingSpawnSuite8Name trigger field; the InvokeSpawnSuite8 principle
  // watches it and fires MCP scs_spawn_suite8_session (which sets entry.suite8Name
  // BEFORE spawn so cli-handler composes Base→Dock→Instance). The optional scpName
  // is reserved for a future SCP-bound spawn lane (C1 spawns Template SCP default).
  // D-UP · manualMode (5th param) = fresh-worker spawn WITHOUT the auto-permission marker —
  // approval gate intact + the Stand By overlay on the primed session (the Gitm Resolver's flag).
  const triggerSpawnSuite8Session = (suite8Name: string, scpName?: string | null, asWorker = false, fresh = false, manualMode = false): void => {
    console.log('[ScsBridgeController] triggerSpawnSuite8Session · suite8Name=', suite8Name, '· scpName=', scpName ?? null, '· asWorker=', asWorker, '· fresh=', fresh, '· manualMode=', manualMode);
    // C375 · THE ENGAGE AWAIT HARDENING · the S4 prescription — one loud line naming the Muxium state
    // BEFORE the try, so the relay pins whether the Engage reached a LIVE controller or a detached one.
    console.log('[ScsBridgeController] triggerSpawnSuite8Session · currentMuxium=', currentMuxium ? 'LIVE' : 'NULL');
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] triggerSpawnSuite8Session called without bound Muxium · CMIA-Spawn-Suite8 will NOT fire',
      );
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      // C373 · THE SCP THREAD · carry scpName into the trigger payload (was dropped) so the
      // InvokeSpawnSuite8 principle can thread it into the MCP scs_spawn_suite8_session args →
      // the Forge anchor lands on the CALLER's SCP, not the workspace default cwd. Only thread when
      // a non-null scpName is supplied (omit → bridge resolves the SCP dir, prior behaviour).
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetPendingSpawnSuite8Name({
        suite8Name,
        asWorker,
        ...(scpName ? { scpName } : {}),
        // C386 · thread fresh ONLY when true (omit for the ordinary anchor path → the bridge default
        // offline→re-engage). The InvokeSpawnSuite8 principle reads pendingSpawnSuite8Fresh at fire-time.
        ...(fresh ? { fresh: true } : {}),
        // D-UP · thread manualMode ONLY when true (the Gitm Resolver's user-controlled spawn).
        ...(manualMode ? { manualMode: true } : {}),
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSpawnSuite8Session dispatched · trigger field set · asWorker=', asWorker, '· scpName=', scpName ?? null, '· fresh=', fresh);
    } catch (err) {
      console.error('[ScsBridgeController] triggerSpawnSuite8Session dispatch failed:', err);
    }
  };

  // C373 · THE RENAME-PROOF ALIAS · the `s8` token survives the `suite8:page` domain-token rewrite
  // (replaceInDir · Suite8→{Domain} / suite8→{domainLower}). Copied suite8-concept pages call THIS
  // name so the rewrite cannot dangle the reference against the shared controller. ONE implementation
  // (delegates to triggerSpawnSuite8Session); two names on the interface + return object.
  const triggerSpawnS8Session = triggerSpawnSuite8Session;

  // MD-9 · D-MC-3 · Per-Instance Model Control · model-selection dispatch helper. Sets the
  // pendingSpawnModel state field the dropdown owns; BOTH spawn principles read it FRESH at
  // fire-time and thread it into the MCP arguments (field-agnostic → payload.model → the
  // bridge quality → registry entry.model). undefined = clear the pin (spawn omits model →
  // the bridge global default). NOT threaded per-trigger — a persistent selection, not a
  // per-click arg (mirrors how pendingSpawnSuite8AsWorker is read at fire-time).
  const setSpawnModel = (model: string | undefined): void => {
    console.log('[ScsBridgeController] setSpawnModel · model=', model ?? null);
    if (!currentMuxium) {
      console.warn('[ScsBridgeController] setSpawnModel called without bound Muxium · selection NOT set');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetPendingSpawnModel({ model });
      mux.dispatch(action);
      console.log('[ScsBridgeController] setSpawnModel dispatched · selection set');
    } catch (err) {
      console.error('[ScsBridgeController] setSpawnModel dispatch failed:', err);
    }
  };

  // D3D Wave-2 · CMIA-Engage dispatch helper.
  const triggerEngageSession = (sessionId: string): void => {
    console.log('[ScsBridgeController] triggerEngageSession · sessionId=', sessionId);
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] triggerEngageSession called without bound Muxium · CMIA-Engage will NOT fire',
      );
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetPendingEngageSessionId({
        sessionId,
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerEngageSession dispatched · trigger field set');
    } catch (err) {
      console.error('[ScsBridgeController] triggerEngageSession dispatch failed:', err);
    }
  };

  // SWRM · D4 W3 · Terminal render-mode write. Sends a renderMode envelope over the proven
  // sendBridgeMessage Diameter → the huirth receiver writes bridge.json.renderMode → the bridge's
  // D3 watcher live-swaps every running terminal. This is the SCP-tool-call technique D5 reuses
  // locally for the SCP-self render. mode is a ShaderRenderMode string (validated huirth-side).
  const triggerSetTerminalRenderMode = (mode: string): void => {
    if (!currentMuxium) {
      console.warn('[ScsBridgeController] triggerSetTerminalRenderMode called without bound Muxium');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSendBridgeMessage({
        message: JSON.stringify({ kind: 'scs:renderMode', renderMode: mode }),
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSetTerminalRenderMode dispatched · mode=', mode);
    } catch (err) {
      console.error('[ScsBridgeController] triggerSetTerminalRenderMode dispatch failed:', err);
    }
  };

  // SWRM · SCP render-mode write. Sends a scpRenderMode envelope over the same sendBridgeMessage
  // Diameter → the huirth writes bridge.json.scpRenderMode → the bridge's watcher swaps EVERY SCP
  // offscreen presenter (applies to all SCPs · the user-directed bridge-controlled SCP mode).
  const triggerSetScpRenderMode = (mode: string): void => {
    if (!currentMuxium) {
      console.warn('[ScsBridgeController] triggerSetScpRenderMode called without bound Muxium');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSendBridgeMessage({
        message: JSON.stringify({ kind: 'scs:scpRenderMode', renderMode: mode }),
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSetScpRenderMode dispatched · mode=', mode);
    } catch (err) {
      console.error('[ScsBridgeController] triggerSetScpRenderMode dispatch failed:', err);
    }
  };

  // GITM color-cascade (W4) · Vermillion Focus+Highlight — dispatch the local highlight reducer
  // directly (the scs:highlight relay SETS it server-side → client; this helper CLEARS it client-
  // side after the Vue auto-reset timer · target: null). Mirrors the render-mode dispatch shape but
  // targets the client-local scsBridgeSetHighlightTarget reducer (no envelope · no server round-trip).
  const triggerSetHighlightTarget = (target: string | null): void => {
    if (!currentMuxium) {
      console.warn('[ScsBridgeController] triggerSetHighlightTarget called without bound Muxium');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetHighlightTarget({ target });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSetHighlightTarget dispatched · target=', target);
    } catch (err) {
      console.error('[ScsBridgeController] triggerSetHighlightTarget dispatch failed:', err);
    }
  };

  // W6d · THE CONTROLLER SPAWN-PROGRESS STATE (SCM W6) · start/advance/clear helpers. Each replaces the
  // whole record (shallowRef replace-on-change idiom · the same {...prev} pattern the busy guards use)
  // so Vue re-renders. No Muxium dispatch — this is controller-local UI state (survives navigation).
  const startSpawnProgress = (scpName: string): void => {
    console.log('[ScsBridgeController] startSpawnProgress · scpName=', scpName);
    spawnProgressByScp.value = {
      ...spawnProgressByScp.value,
      [scpName]: { phase: 'requested', startedAt: Date.now(), didFocus: false },
    };
  };
  const advanceSpawnProgress = (
    scpName: string,
    phase: ScsBridgeSpawnPhase,
    markFocused = false,
  ): void => {
    const prev = spawnProgressByScp.value[scpName];
    if (!prev) return; // never resurrect a cleared/absent round — only Spawn (startSpawnProgress) opens one.
    // Idempotent no-op: same phase AND no new focus mark → leave the ref untouched (no spurious re-render).
    if (prev.phase === phase && (!markFocused || prev.didFocus)) return;
    console.log('[ScsBridgeController] advanceSpawnProgress · scpName=', scpName, '· phase=', phase, '· markFocused=', markFocused);
    spawnProgressByScp.value = {
      ...spawnProgressByScp.value,
      [scpName]: { ...prev, phase, didFocus: prev.didFocus || markFocused },
    };
  };
  const clearSpawnProgress = (scpName: string): void => {
    if (!spawnProgressByScp.value[scpName]) return;
    console.log('[ScsBridgeController] clearSpawnProgress · scpName=', scpName);
    const next = { ...spawnProgressByScp.value };
    delete next[scpName];
    spawnProgressByScp.value = next;
  };

  // MD-9 · D-MC-6 · default-model write. Sends a defaultModel envelope over the same sendBridgeMessage
  // Diameter → the huirth writes bridge.json.defaultModel → the bridge's renderModeWatch (already
  // stehed) applies it → activeDefaultModel → every subsequent spawn/resume WITHOUT a per-instance
  // record. Zero bridge-repo edits (the circuit closes client-side). model = a validated catalog id.
  // C919 · THE FRAME GOVERNOR write. Sends a shaderFps envelope over the SAME sendBridgeMessage
  // Diameter → the huirth RMW writes bridge.json.shaderFps → the bridge's renderModeWatch
  // re-gates EVERY presenter (terminal + SCP · one cadence · default 24 Like Animation).
  const triggerSetShaderFps = (fps: number): void => {
    if (!currentMuxium) {
      console.warn('[ScsBridgeController] triggerSetShaderFps called without bound Muxium');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSendBridgeMessage({
        message: JSON.stringify({ kind: 'scs:shaderFps', fps }),
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSetShaderFps dispatched · fps=', fps);
    } catch (err) {
      console.error('[ScsBridgeController] triggerSetShaderFps dispatch failed:', err);
    }
  };

  const triggerSetDefaultModel = (model: string): void => {
    if (!currentMuxium) {
      console.warn('[ScsBridgeController] triggerSetDefaultModel called without bound Muxium');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSendBridgeMessage({
        message: JSON.stringify({ kind: 'scs:defaultModel', model }),
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerSetDefaultModel dispatched · model=', model);
    } catch (err) {
      console.error('[ScsBridgeController] triggerSetDefaultModel dispatch failed:', err);
    }
  };

  // D3RM-E · CMIA-Focus dispatch helper. Sets pendingFocusSessionId trigger;
  // scsBridgeInvokeSessionFocusPrinciple watches and fires MCP fetch.
  // Side-effect-only — does NOT mutate activeEngagedSessionId (SAES untouched).
  const triggerFocusSession = (sessionId: string): void => {
    console.log('[ScsBridgeController] triggerFocusSession · sessionId=', sessionId);
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] triggerFocusSession called without bound Muxium · CMIA-Focus will NOT fire',
      );
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetPendingFocusSessionId({
        sessionId,
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerFocusSession dispatched · trigger field set');
    } catch (err) {
      console.error('[ScsBridgeController] triggerFocusSession dispatch failed:', err);
    }
  };

  // D3RM-G · CBSE chat dispatch helper. Sets pendingChatMessage compound trigger;
  // scsBridgeInvokeSessionChatPrinciple watches and fires MCP fetch with
  // CCDR discipline. Side-effect-only via UIMJ queue write + asyncRewake.
  const triggerChatMessage = (sessionId: string, message: string): void => {
    console.log(
      '[ScsBridgeController] triggerChatMessage · sessionId=',
      sessionId,
      '· messageLength=',
      message.length,
    );
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] triggerChatMessage called without bound Muxium · CBSE will NOT fire',
      );
      return;
    }
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      console.warn('[ScsBridgeController] triggerChatMessage · empty sessionId · ignoring');
      return;
    }
    if (typeof message !== 'string' || message.trim().length === 0) {
      console.warn('[ScsBridgeController] triggerChatMessage · empty message · ignoring');
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetPendingChatMessage({
        payload: { sessionId, message },
      });
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerChatMessage dispatched · trigger field set');
    } catch (err) {
      console.error('[ScsBridgeController] triggerChatMessage dispatch failed:', err);
    }
  };

  // D3 FKIS · VSMW · live keystroke streaming via MCP send_message tool.
  // Direct fetch (no Stratimux trigger field) since FKIS has no state-driven
  // semantics — Vue calls controller; controller fires MCP tool; result
  // returns. Mirror of the chat principle's fetch shape (KFAF + ACPF) without
  // the trigger-field watcher.
  const triggerSendMessage = async (
    sessionId: string,
    text: string,
    // C768 · the focus discipline: In Focus (true) keeps the terminal focused — the bridge
    // suppresses the final refocus. Absent = Pass Through (traditional background relay).
    opts?: { inFocus?: boolean },
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge FKIS-Vue] triggerSendMessage entry · sessionId=',
      sessionId,
      '· textLength=',
      text.length,
    );
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    if (typeof text !== 'string' || text.trim().length === 0) {
      return { ok: false, error: 'empty text' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }

    const controller = new AbortController();
    // PRIME-STALL FIX B · ARM the AbortController. Prior code wired `signal` to the
    // fetch but NEVER called controller.abort() — a hung bridge POST (mid-restart,
    // socket open but unanswered) would never settle, the caller's `await` would hang,
    // and handleOption's `finally` would never clear `dispatchingLabel` → the menu
    // locked through the rest of the session. An 8s timeout now aborts the fetch →
    // the catch below returns { ok:false } → the menu re-enables and offers a retry.
    const SEND_TIMEOUT_MS = 8000;
    const timeoutId = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    const url = `${bj.endpoint}/mcp`;
    // Per-SCP-Identity-Config · FKIS Origin · resolve THIS SCP's name (cached after first read) and
    // carry it as originScpName. The bridge guard is env-FIRST (agents/dev:self stay server-authoritative
    // & unspoofable) — this payload field only fills the UI-send gap where the shared workspace bridge
    // muxium has no per-SCP env. Both the normal send and the SMSP/relay-prime send reshape only `text`
    // (buildRelayEnvelope · handleChatSubmit) and call THIS single method, so both inherit the origin.
    const originScpName = await resolveScpName();
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'send_message',
        arguments: {
          targetUlid: sessionId,
          text,
          originScpName: originScpName ?? undefined,
          ...(opts?.inFocus === true ? { inFocus: true } : {}),
        },
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        console.log(
          '[SCS-Bridge FKIS-Vue] triggerSendMessage result · status=',
          res.status,
          '· ok=',
          res.ok,
          '· bodyPreview=',
          errText.slice(0, 120),
        );
        return {
          ok: false,
          error: `HTTP ${res.status} · ${errText.slice(0, 200)}`,
        };
      }
      const bodyText = await res.text();
      console.log(
        '[SCS-Bridge FKIS-Vue] triggerSendMessage result · status=',
        res.status,
        '· ok=',
        res.ok,
        '· bodyLen=',
        bodyText.length,
      );
      return { ok: true };
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? `send timed out after ${SEND_TIMEOUT_MS}ms`
          : err instanceof Error
            ? err.message
            : String(err);
      console.error(
        '[SCS-Bridge FKIS-Vue] triggerSendMessage failed:',
        message,
      );
      return { ok: false, error: message };
    } finally {
      // PRIME-STALL FIX B · always clear the abort-timer so a fast success/failure
      // does not leave a dangling timeout that fires after the request settled.
      clearTimeout(timeoutId);
    }
  };

  // RM-D4 · RENAME · DUAL Vue-surface write leg. Mirrors triggerSendMessage's
  // /mcp tools/call fetch shape (same Bridge process · reads bridgeJson.endpoint).
  // IDTND: sessionId is the ULID lookup key (passed verbatim, never name-derived).
  // Empty/whitespace name is forwarded — the bridge Quality clears displayName.
  const triggerRenameSession = async (
    sessionId: string,
    name: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge RENAME-Vue] triggerRenameSession entry · sessionId=',
      sessionId, '· nameLength=', typeof name === 'string' ? name.length : 0,
    );
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scp_rename_session',
        arguments: { sessionId, name: typeof name === 'string' ? name : '' },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge RENAME-Vue] triggerRenameSession failed:', message);
      return { ok: false, error: message };
    }
  };

  // SORD Shield/Sword (Macro Diamond · Path B) · the resilient turn-over anchor. Mirrors
  // triggerRenameSession's direct /mcp tools/call fetch shape (same Bridge process · reads
  // bridgeJson.endpoint). POSTs gitm_turn_over_with_source { source } → the bridge quality
  // does `git switch` + writes .bridge-restart.json → nodemon respawn. ACK-only: the fetch body
  // is drained, never parsed for state (state arrives via the gitm.json watcher relay). Routed to
  // the bridge CLI — survives a B that bricked the SCP server.
  const triggerGitmTurnOver = async (
    source: 'A' | 'B',
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log('[SORD-TRACE] triggerGitmTurnOver ENTRY · source=', source);
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      console.warn('[SORD-TRACE] triggerGitmTurnOver BLOCKED · bridgeJson null/no-endpoint · bj=', bj);
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    console.log('[SORD-TRACE] triggerGitmTurnOver FETCHING', url, '· source=', source);
    // MD-C M2 · THE ORIGIN STAMP (see triggerGitmMean) — the turn-over routes to THE CALLER.
    const turnOverOrigin = (await resolveScpName()) ?? undefined;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'gitm_turn_over_with_source',
        arguments: turnOverOrigin !== undefined ? { source, originScpName: turnOverOrigin } : { source },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      await res.text(); // ACK-only — drain, never parse for state.
      console.log('[SORD-TRACE] triggerGitmTurnOver ACK · status=', res.status);
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SORD-TRACE] triggerGitmTurnOver FETCH-THREW:', message);
      return { ok: false, error: message };
    }
  };

  // SORD Shield/Sword (Macro Diamond · Path B) · the generic ACK-gated SORD mean. Same direct
  // /mcp tools/call shape as triggerGitmTurnOver, with an arbitrary bridge gitm_* tool + args.
  // The awaited ACK is the step gate for a time-stepped multi-step sequence (e.g. branch-create
  // →ACK → turn-over). DISTINCT from the void same-origin triggerGitmAction — this is awaitable.
  const triggerGitmMean = async (
    tool: string,
    args: Record<string, unknown>,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log('[SCS-Bridge SORD] triggerGitmMean entry · tool=', tool);
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    // MD-C M2 · THE ORIGIN STAMP — every gitm action carries THIS SCP's identity so the
    // bridge's resolveGitmTargetCwd routes the op (and its slice/rail writes) to THE CALLER,
    // never the active pointer (the FKIS originScpName precedent · the cached /scp-config name).
    // Null-resolve (config unreachable) → unstamped → the bridge degrades to the pointer as before.
    const originScpName = (args.originScpName as string | undefined) ?? (await resolveScpName()) ?? undefined;
    const stampedArgs = originScpName !== undefined ? { ...args, originScpName } : args;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: tool,
        arguments: stampedArgs,
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      await res.text(); // ACK-only — drain, never parse for state.
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge SORD] triggerGitmMean failed · tool=', tool, '·', message);
      return { ok: false, error: message };
    }
  };

  // S8P-SCP-TOOL · the Create Pipeline Step-3 mean · suite8_page_create. Rides triggerSendMessage's
  // /mcp tools/call + AbortController shape, but PARSES the structured result out of the JSON-RPC
  // envelope (result.content[0].text = JSON.stringify({ suite8PageCreate: <structured> })). The
  // bridge runs the duplication + gate chain SYNCHRONOUSLY (execSync tsc); a 30s client abort mirrors
  // the /mcp response-timeout guard — a timeout does NOT mean the files failed to land.
  const triggerSuite8PageCreate = async (args: {
    name: string;
    displayName: string;
    designation: string;
    home?: boolean;
    force?: boolean;
  }): Promise<{
    ok: boolean;
    conceptName?: string;
    gatesPassed?: string[];
    reason?: string;
    timedOut?: boolean;
  }> => {
    console.log('[SCS-Bridge S8P-Vue] triggerSuite8PageCreate entry · name=', args.name, '· designation=', args.designation);
    if (!args.name || !args.displayName || !args.designation) {
      return { ok: false, reason: 'name, displayName, and designation are all required.' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, reason: 'bridge endpoint not available — is the Bridge running?' };
    }

    // 30s abort — mirrors the bridge /mcp response-timeout guard. On abort the concept files may
    // still have landed (the tsc gate is the slow leg); the caller re-verifies after the turn-over.
    const abort = new AbortController();
    const PAGE_CREATE_TIMEOUT_MS = 30000;
    const timeoutId = setTimeout(() => abort.abort(), PAGE_CREATE_TIMEOUT_MS);
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'suite8_page_create',
        arguments: {
          name: args.name,
          displayName: args.displayName,
          designation: args.designation,
          home: args.home === true,
          force: args.force === true,
        },
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        signal: abort.signal,
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, reason: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      // The SCP manifold tail returns a JSON-RPC envelope: result.content[0].text carries the
      // JSON.stringify'd data field (scpExtractAndSendResponse). Parse the inner suite8PageCreate.
      const envelope = (await res.json().catch(() => null)) as {
        result?: { content?: Array<{ type?: string; text?: string }> };
        error?: { message?: string };
      } | null;
      if (!envelope) {
        return { ok: false, reason: 'Could not parse the bridge response.' };
      }
      if (envelope.error) {
        return { ok: false, reason: envelope.error.message ?? 'The bridge returned an error.' };
      }
      const text = envelope.result?.content?.[0]?.text ?? '';
      let dataField: { suite8PageCreate?: { ok?: boolean; conceptName?: string; gatesPassed?: string[]; reason?: string } } = {};
      try {
        dataField = JSON.parse(text);
      } catch {
        return { ok: false, reason: 'The bridge response was not valid JSON.' };
      }
      const s8 = dataField.suite8PageCreate ?? {};
      console.log('[SCS-Bridge S8P-Vue] triggerSuite8PageCreate result · ok=', s8.ok, '· conceptName=', s8.conceptName);
      return {
        ok: s8.ok === true,
        conceptName: s8.conceptName,
        gatesPassed: Array.isArray(s8.gatesPassed) ? s8.gatesPassed : undefined,
        reason: s8.reason,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // The 30s window elapsed. The tsc gate is the slow leg; the concept files may already be
        // on disk. The caller surfaces the honest "may still have landed — verify after turn-over".
        console.warn('[SCS-Bridge S8P-Vue] triggerSuite8PageCreate timed out after', PAGE_CREATE_TIMEOUT_MS, 'ms');
        return { ok: false, timedOut: true, reason: `The page build exceeded ${PAGE_CREATE_TIMEOUT_MS / 1000}s.` };
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge S8P-Vue] triggerSuite8PageCreate failed:', message);
      return { ok: false, reason: message };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // A-D3b · ARFSP · "Set as Anchor" write leg. Mirrors triggerRenameSession's
  // /mcp tools/call fetch shape (same Bridge process · reads bridgeJson.endpoint).
  // IDTND: sessionId is the ULID lookup key (passed verbatim, never derived). The
  // bridge Quality calls setSessionAnchor → reassigns the page Anchor (clears every
  // other isAnchor of the same suite8Name); no-ops if the session has no suite8Name.
  const triggerSetAnchor = async (
    sessionId: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge SET-ANCHOR-Vue] triggerSetAnchor entry · sessionId=',
      sessionId,
    );
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_set_anchor_session',
        arguments: { sessionId },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge SET-ANCHOR-Vue] triggerSetAnchor failed:', message);
      return { ok: false, error: message };
    }
  };

  // SAC.1 · ARFSP · "Release Anchor" un-anchor write leg. Faithful mirror of
  // triggerSetAnchor's /mcp tools/call fetch shape (same Bridge process · reads
  // bridgeJson.endpoint). IDTND: sessionId is the ULID lookup key (passed verbatim,
  // never derived). The bridge Quality calls unsetSessionAnchor → releases the page
  // Anchor on ONLY this entry (no scope sweep); no-ops if the session is not anchored.
  // INERT until SAC.2 wires the UI button.
  const triggerUnsetAnchor = async (
    sessionId: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge UNSET-ANCHOR-Vue] triggerUnsetAnchor entry · sessionId=',
      sessionId,
    );
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_unset_anchor_session',
        arguments: { sessionId },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge UNSET-ANCHOR-Vue] triggerUnsetAnchor failed:', message);
      return { ok: false, error: message };
    }
  };

  // DAST · Dissipate write leg. Mirrors triggerSetAnchor's /mcp tools/call fetch
  // shape (same Bridge process · reads bridgeJson.endpoint). The Session Manager
  // Dissipate button calls this; the bridge Quality calls dissipateSession →
  // anchor-guarded registry removal + DELETE of the real ClaudeCode session.
  // IDTND: sessionId is the ULID lookup key (passed verbatim, never derived).
  const triggerDissipate = async (
    sessionId: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log('[SCS-Bridge DISSIPATE-Vue] triggerDissipate entry · sessionId=', sessionId);
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_dissipate_session',
        arguments: { sessionId },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge DISSIPATE-Vue] triggerDissipate failed:', message);
      return { ok: false, error: message };
    }
  };

  // ARST · Archive write leg. Mirrors triggerDissipate's /mcp tools/call fetch shape.
  // The Session Manager Archive button calls this; the bridge Quality calls
  // archiveSession → anchor-guarded MOVE of the real ClaudeCode session into
  // Cascades/Archive/YYYY/MM/DD/ then registry removal. IDTND: sessionId is the ULID.
  const triggerArchive = async (
    sessionId: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log('[SCS-Bridge ARCHIVE-Vue] triggerArchive entry · sessionId=', sessionId);
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_archive_session',
        arguments: { sessionId },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge ARCHIVE-Vue] triggerArchive failed:', message);
      return { ok: false, error: message };
    }
  };

  // SE · Epoch Extension · ODCF · on-demand archive contents fetch (the heavy body channel).
  // Mirrors triggerArchive's bridgeJson.endpoint resolution, but GETs the SEAP read endpoint
  // GET /sessionArchive/:id (no body · no tools/call envelope · pure FS-read handler · W2). The
  // Archive view (Macro AV) calls this on row-expand → local Vue ref (NEVER Stratimux state). The
  // light reactive manifest list rides the relay; the heavy { entry, lastTurn } body rides this GET.
  const triggerFetchArchiveContents = async (
    id: string,
  ): Promise<ArchiveContents | null> => {
    console.log('[SCS-Bridge ODCF-Vue] triggerFetchArchiveContents entry · id=', id);
    if (typeof id !== 'string' || id.length === 0) {
      console.warn('[SCS-Bridge ODCF-Vue] triggerFetchArchiveContents · empty id · ignoring');
      return null;
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      console.warn('[SCS-Bridge ODCF-Vue] triggerFetchArchiveContents · bridge endpoint not available');
      return null;
    }
    const url = `${bj.endpoint}/sessionArchive/${encodeURIComponent(id)}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(
          '[SCS-Bridge ODCF-Vue] triggerFetchArchiveContents · status=',
          res.status, '· bodyPreview=', errText.slice(0, 120),
        );
        return null; // 404 (no entry.json for id) / 500 → zero-state in the view.
      }
      const data = (await res.json()) as ArchiveContents;
      console.log(
        '[SCS-Bridge ODCF-Vue] triggerFetchArchiveContents · ok · id=', id,
        '· lastTurn=', data?.lastTurn ? 'present' : 'null',
      );
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge ODCF-Vue] triggerFetchArchiveContents failed:', message);
      return null;
    }
  };

  // SE · ODCF-for-the-list · GET /sessionArchive (the manifest endpoint · W2 SEAP · pure FS-read).
  // The Archive view calls this onMounted so the list hydrates immediately from the endpoint rather
  // than waiting on the AMWP reactive relay (which is dormant until a bridge re-launch arms the
  // watcher). Returns [] on any failure → empty-state in the view.
  const triggerFetchArchiveManifest = async (): Promise<ArchiveManifestEntry[]> => {
    console.log('[SCS-Bridge ODCF-Vue] triggerFetchArchiveManifest entry');
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      console.warn('[SCS-Bridge ODCF-Vue] triggerFetchArchiveManifest · bridge endpoint not available');
      return [];
    }
    const url = `${bj.endpoint}/sessionArchive`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        keepalive: true,
      });
      if (!res.ok) {
        console.warn('[SCS-Bridge ODCF-Vue] triggerFetchArchiveManifest · status=', res.status);
        return [];
      }
      const data = (await res.json()) as { manifest?: ArchiveManifestEntry[] };
      const manifest = Array.isArray(data?.manifest) ? data.manifest : [];
      console.log('[SCS-Bridge ODCF-Vue] triggerFetchArchiveManifest · ok · count=', manifest.length);
      return manifest;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge ODCF-Vue] triggerFetchArchiveManifest failed:', message);
      return [];
    }
  };

  // SSP · D-SSP.2 · Suite-8 Spawn Picker roster fetch. Mirrors triggerFetchArchiveManifest's
  // bridgeJson.endpoint GET (no /mcp tools/call envelope · pure FS-read handler · D-SSP.1 SEAP).
  // GETs GET /suite8/available → a BARE array [{ name, snippet, hasInstance }] (NOT wrapped) →
  // availableSuite8s ref (full-replace). ACK-safe — a failed fetch leaves the prior value (log +
  // swallow · never throws to the caller). INERT this portion: NOT called yet (D-SSP.3 wires the
  // Session-Manager mount + picker-open invocations + renders the Pewter roster).
  const fetchAvailableSuite8s = async (): Promise<void> => {
    console.log('[SCS-Bridge SSP-Vue] fetchAvailableSuite8s entry');
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      console.warn('[SCS-Bridge SSP-Vue] fetchAvailableSuite8s · bridge endpoint not available');
      return;
    }
    const url = `${bj.endpoint}/suite8/available`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        keepalive: true,
      });
      if (!res.ok) {
        console.warn('[SCS-Bridge SSP-Vue] fetchAvailableSuite8s · status=', res.status);
        return;
      }
      const data = (await res.json()) as Suite8PickerEntry[];
      const roster = Array.isArray(data) ? data : [];
      availableSuite8s.value = roster;
      console.log('[SCS-Bridge SSP-Vue] fetchAvailableSuite8s · ok · count=', roster.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge SSP-Vue] fetchAvailableSuite8s failed:', message);
    }
  };

  // SAC.3 · ANCHOR-CONFIG READ leg. Mirrors fetchAvailableSuite8s' bridgeJson.endpoint GET (no
  // /mcp tools/call envelope · pure FS-read handler · SAC.3 SEAP). GETs
  // GET /suite8/anchor-config?name=<suite8Name> → { autoAnchor, default } (the RESOLVED per-page
  // config). Returns null on a missing endpoint / fetch failure (the SAC.4 Pewter panel falls
  // back to the system default). (Pewter's getAnchorConfig.)
  const fetchAnchorConfig = async (suite8Name: string): Promise<AnchorConfig | null> => {
    console.log('[SCS-Bridge SAC-Vue] fetchAnchorConfig entry · suite8Name=', suite8Name);
    if (typeof suite8Name !== 'string' || suite8Name.length === 0) {
      console.warn('[SCS-Bridge SAC-Vue] fetchAnchorConfig · empty suite8Name · ignoring');
      return null;
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      console.warn('[SCS-Bridge SAC-Vue] fetchAnchorConfig · bridge endpoint not available');
      return null;
    }
    const url = `${bj.endpoint}/suite8/anchor-config?name=${encodeURIComponent(suite8Name)}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        keepalive: true,
      });
      if (!res.ok) {
        console.warn('[SCS-Bridge SAC-Vue] fetchAnchorConfig · status=', res.status);
        return null;
      }
      const data = (await res.json()) as AnchorConfig;
      console.log('[SCS-Bridge SAC-Vue] fetchAnchorConfig · ok · autoAnchor=', data?.autoAnchor, '· default=', data?.default);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge SAC-Vue] fetchAnchorConfig failed:', message);
      return null;
    }
  };

  // SAC.3 · ANCHOR-CONFIG SET write leg. Mirrors triggerUnsetAnchor's /mcp tools/call fetch shape
  // (same Bridge process · reads bridgeJson.endpoint). POSTs scs_set_anchor_config → the bridge
  // Quality writes Cascades/Extended/<suite8Name>/anchor.override.json = { autoAnchor }. ACK-only.
  // (Pewter's triggerSetAnchorConfig.)
  const triggerSetAnchorConfig = async (
    suite8Name: string,
    autoAnchor: boolean,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge SAC-Vue] triggerSetAnchorConfig entry · suite8Name=',
      suite8Name, '· autoAnchor=', autoAnchor,
    );
    if (typeof suite8Name !== 'string' || suite8Name.length === 0) {
      return { ok: false, error: 'empty suite8Name' };
    }
    if (typeof autoAnchor !== 'boolean') {
      return { ok: false, error: 'autoAnchor must be boolean' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_set_anchor_config',
        arguments: { suite8Name, autoAnchor },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge SAC-Vue] triggerSetAnchorConfig failed:', message);
      return { ok: false, error: message };
    }
  };

  // SAC.3 · ANCHOR-CONFIG RESET write leg. Mirrors triggerSetAnchorConfig's /mcp tools/call shape.
  // POSTs scs_reset_anchor_config → the bridge Quality DELETES the anchor.override.json so the
  // page falls back to the menu-creator default. ACK-only. (Pewter's triggerResetAnchorConfig.)
  const triggerResetAnchorConfig = async (
    suite8Name: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log('[SCS-Bridge SAC-Vue] triggerResetAnchorConfig entry · suite8Name=', suite8Name);
    if (typeof suite8Name !== 'string' || suite8Name.length === 0) {
      return { ok: false, error: 'empty suite8Name' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_reset_anchor_config',
        arguments: { suite8Name },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge SAC-Vue] triggerResetAnchorConfig failed:', message);
      return { ok: false, error: message };
    }
  };

  // VS · VSDT · Deliver-Vermillion write leg. Mirrors triggerSetAnchor's /mcp
  // tools/call fetch shape (same Bridge process · reads bridgeJson.endpoint). The
  // CadmiumBulletin orchestrator calls this to hand a spawned worker its Vermillion;
  // the bridge Quality prefixes a SCS:Vermillion directive line and types it into the
  // target session. IDTND: sessionId is the ULID lookup key (passed verbatim).
  const triggerDeliverVermillion = async (
    sessionId: string,
    vermillion: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge VERMILLION-Vue] triggerDeliverVermillion entry · sessionId=',
      sessionId, '· vermillionLength=', typeof vermillion === 'string' ? vermillion.length : 0,
    );
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    if (typeof vermillion !== 'string' || vermillion.trim().length === 0) {
      return { ok: false, error: 'empty vermillion' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    // Per-SCP-Identity-Config · FKIS Origin · carry THIS SCP's name (cached · GET /scp-config). The
    // bridge guard is env-FIRST; this fills the UI-send gap where the shared workspace bridge muxium
    // has no per-SCP env. Mirrors triggerSendMessage's origin carry.
    const originScpName = await resolveScpName();
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_deliver_vermillion',
        arguments: { sessionId, vermillion, originScpName: originScpName ?? undefined },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge VERMILLION-Vue] triggerDeliverVermillion failed:', message);
      return { ok: false, error: message };
    }
  };

  // MRQ-B · RELAY-ENQUEUE write leg. Mirrors triggerDeliverVermillion's /mcp tools/call
  // fetch shape (same Bridge process · reads bridgeJson.endpoint). Posts the relay specs;
  // the bridge Quality builds the Actions + enqueues them. ACK-only (ok=true once the
  // enqueue dispatch is scheduled · the relays drain asynchronously via RQPOAD).
  const triggerRelayEnqueue = async (
    specs: ScsBridgeRelaySpec[],
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log('[SCS-Bridge RELAY-ENQUEUE-Vue] triggerRelayEnqueue entry · specCount=', specs?.length ?? 0);
    if (!Array.isArray(specs) || specs.length === 0) {
      return { ok: false, error: 'empty specs' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/mcp`;
    // C404 · the origin lane at the source. The Cadmium sweep PREDATES the inducted SCP name
    // (scp.config.json arrived later) — the enqueue never threaded it, so every relayed send
    // arrived at the bridge origin-less (dropped before the C403/C404 downgrades; now
    // deliver-without-focus-return at worst). Same resolveScpName idiom as the send/vermillion
    // legs; a null resolve (config fetch failed) degrades gracefully — the batch still delivers.
    const originScpName = await resolveScpName();
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'scs_relay_enqueue',
        arguments: originScpName ? { specs, originScpName } : { specs },
      },
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      // C408 · THE HONEST ACK (best-effort read): the bridge now threads
      // {specCount, actionCount, missCount} through the strategy data. When readable and
      // short-built, report FAILURE with the counts — "N dispatched" must mean N BUILT,
      // never merely N received. Unreadable data (older bridge / different serialization)
      // degrades to the prior ok-on-HTTP behavior.
      const json = (await res.json().catch(() => null)) as
        | { result?: { data?: { actionCount?: number; specCount?: number }; structuredContent?: { actionCount?: number; specCount?: number } } }
        | null;
      const ackData = json?.result?.data ?? json?.result?.structuredContent ?? null;
      if (ackData && typeof ackData.actionCount === 'number' && ackData.actionCount < specs.length) {
        console.error(
          '[SCS-Bridge RELAY-ENQUEUE-Vue] short-built batch · built=', ackData.actionCount,
          'of', specs.length,
        );
        return { ok: false, error: `built ${ackData.actionCount}/${specs.length} relays — see spec-miss telemetry` };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge RELAY-ENQUEUE-Vue] triggerRelayEnqueue failed:', message);
      return { ok: false, error: message };
    }
  };

  // RM-D3 · Direction C · DPOB button click → POST the user's allow/deny to the
  // held PermissionRequest res on the Bridge. Mirror of triggerSendMessage's
  // fetch shape (reads bridgeJson.endpoint · same Bridge process as /mcp). The
  // permission decision is the UNLIKE Demometer to send_message — a one-shot
  // allow/deny resolving a held connection vs a streamed keystroke injection.
  // requestId is threaded for diagnostic echo (the held-res key is the ulid).
  const triggerPermissionDecision = async (
    sessionId: string,
    behavior: 'allow' | 'deny',
    requestId: string,
    persistRule?: boolean,
  ): Promise<{ ok: boolean; error?: string }> => {
    console.log(
      '[SCS-Bridge PRMX-Vue] triggerPermissionDecision entry · sessionId=',
      sessionId,
      '· behavior=',
      behavior,
      '· requestId=',
      requestId,
      '· persistRule=',
      persistRule === true,
    );
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return { ok: false, error: 'empty sessionId' };
    }
    if (behavior !== 'allow' && behavior !== 'deny') {
      return { ok: false, error: 'behavior must be allow|deny' };
    }
    const bj = bridgeJson.value;
    if (!bj || !bj.endpoint) {
      return { ok: false, error: 'bridge endpoint not available' };
    }
    const url = `${bj.endpoint}/session/${encodeURIComponent(sessionId)}/permission-decision`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ behavior, requestId, persistRule: persistRule === true }),
        keepalive: true,
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(
          '[SCS-Bridge PRMX-Vue] triggerPermissionDecision · status=',
          res.status,
          '· body=',
          errText.slice(0, 120),
        );
        return { ok: false, error: `HTTP ${res.status} · ${errText.slice(0, 200)}` };
      }
      console.log('[SCS-Bridge PRMX-Vue] triggerPermissionDecision · ok · status=', res.status);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SCS-Bridge PRMX-Vue] triggerPermissionDecision failed:', message);
      return { ok: false, error: message };
    }
  };

  // D3D Wave-2 · SAES explicit clear (auto-clear watcher + future disengage button).
  const clearActiveEngagedSession = (): void => {
    console.log('[ScsBridgeController] clearActiveEngagedSession · SAES → null');
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] clearActiveEngagedSession called without bound Muxium · SAES will NOT clear',
      );
      return;
    }
    try {
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeSetActiveEngagedSessionId({
        sessionId: null,
      });
      mux.dispatch(action);
    } catch (err) {
      console.error('[ScsBridgeController] clearActiveEngagedSession dispatch failed:', err);
    }
  };

  const triggerHardTurnOver = (source?: 'A' | 'B', targetBranch?: string, createBranch?: boolean): void => {
    console.log('[ScsBridgeController] triggerHardTurnOver ENTRY · source:', source ?? '(none)', '· targetBranch:', targetBranch ?? '(none)', '· createBranch:', createBranch === true, '· currentMuxium:', currentMuxium ? 'NON-NULL · proceeding' : 'NULL · will warn + return');
    if (!currentMuxium) {
      console.warn(
        '[ScsBridgeController] triggerHardTurnOver called without bound Muxium · BRTF will NOT fire',
      );
      return;
    }
    try {
      // Cast to any · runtime Muxium deck access. Type-safe deck typing is recovered
      // at the Vue landing layer via ClientMuxiumDeck generic. Controller is universal
      // (cross-landing) so cannot enforce specific deck shape at compile time.
      const mux = currentMuxium as Muxium<any>;
      const deck: any = (mux as any).deck;
      console.log('[ScsBridgeController] deck access · client present:', !!deck?.d?.client, '· scsBridge present:', !!deck?.d?.client?.d?.scsBridge);
      // PCGT+ABCS · thread createBranch through the payload so the huirth runs `git switch -c`.
      const action: AnyAction = deck.d.client.d.scsBridge.e.scsBridgeTriggerHardTurnOver({ source, targetBranch, createBranch });
      console.log('[ScsBridgeController] action constructed · type:', (action as any).type, '· dispatching now');
      mux.dispatch(action);
      console.log('[ScsBridgeController] triggerHardTurnOver dispatch() returned · action sent to muxium pipeline');
    } catch (err) {
      console.error('[ScsBridgeController] triggerHardTurnOver dispatch failed:', err);
    }
  };

  // GITM A↔B (#641) — generic gitm MCP action dispatch. SAME-ORIGIN FORWARD (045 fix · GAFP). Every
  // gitm toolbar button (Shield · Sword · Freehop · Turn-Over A/B · Merge) lives in the persistent
  // IslandWrapper TaskBar. CONFORMANCE (SORD §11 · D1/D2): the prior same-origin /gitm-action POST
  // was 404 in dev:self and was NOT the bridge /mcp — so the setters (Register-Stable-A, Sword setter,
  // Merge, sub-page actions) silently failed. This verb is now a thin DELEGATE onto the proven
  // triggerGitmMean (:858), the conforming `${bridgeJson.endpoint}/mcp` tools/call mean (awaitable,
  // ACK-only). Signature stays `void` so every existing caller is unchanged; triggerGitmMean is defined
  // earlier in this closure so the reference resolves. State returns via the gitm.json watcher relay
  // (SORD §10) — never the fetch body.
  const triggerGitmAction = (tool: string, args: Record<string, unknown>): void => {
    void triggerGitmMean(tool, args);
  };

  return {
    toolbarButtons,
    bridgeJson,
    bridgeStatus,
    sessionsList,
    archiveManifest,
    connectionEstablished,
    pongReceipt,
    serverStartupTime,
    bridgeActive,
    activeEngagedSessionId,
    sync,
    setMuxium,
    // D-T-MUX · Default-Muxium Fallback lifecycle.
    getCurrentMuxium,
    setDefaultMuxium,
    closeDefaultMuxium,
    triggerHardTurnOver,
    triggerGitmAction,
    triggerSpawnSession,
    getScpName: resolveScpName,
    triggerSpawnSuite8Session,
    // C373 · rename-proof alias (delegates to triggerSpawnSuite8Session) · copied suite8 pages call this.
    triggerSpawnS8Session,
    // MD-9 · D-MC-3 · Per-Instance Model Control · dropdown → pendingSpawnModel state.
    setSpawnModel,
    triggerEngageSession,
    triggerSetTerminalRenderMode,
    triggerSetScpRenderMode,
    triggerSetShaderFps,
    // MD-9 · D-MC-6 · Settings default-model write (→ bridge.json.defaultModel → renderModeWatch).
    triggerSetDefaultModel,
    triggerFocusSession,
    triggerChatMessage,
    triggerSendMessage,
    triggerRenameSession,
    triggerGitmTurnOver,
    triggerGitmMean,
    triggerSuite8PageCreate,
    triggerSetAnchor,
    triggerUnsetAnchor,
    triggerDissipate,
    triggerArchive,
    triggerFetchArchiveContents,
    triggerFetchArchiveManifest,
    availableSuite8s,
    fetchAvailableSuite8s,
    fetchAnchorConfig,
    triggerSetAnchorConfig,
    triggerResetAnchorConfig,
    triggerDeliverVermillion,
    triggerRelayEnqueue,
    triggerPermissionDecision,
    clearActiveEngagedSession,
    // GITM color-cascade (W4) · Vermillion Focus+Highlight — the highlight mirror + clear helper.
    highlightTarget,
    triggerSetHighlightTarget,
    // W6d · THE CONTROLLER SPAWN-PROGRESS STATE (SCM W6) · app-singleton spawn-round phase (survives nav).
    spawnProgressByScp,
    startSpawnProgress,
    advanceSpawnProgress,
    clearSpawnProgress,
  };
}

// ============================================
// TYPE GUARD
// ============================================

export function isScsBridgeController(obj: unknown): obj is ScsBridgeController {
  if (!obj || typeof obj !== 'object') return false;
  const controller = obj as ScsBridgeController;
  return (
    'toolbarButtons' in controller &&
    'bridgeJson' in controller &&
    typeof controller.sync === 'function' &&
    typeof controller.setMuxium === 'function' &&
    typeof controller.triggerHardTurnOver === 'function'
  );
}

// ============================================
// GRGL · GLOBAL CONTROLLER REFERENCE (Cycle 159 D3 verdict)
// ============================================
//
// Bridges Stratimux muxium context with Vue provide/inject context.
// Two registration paths · BOTH wired in IslandWrapper:
//   - provide(SCS_BRIDGE_CONTROLLER_KEY, controller)  → Vue inject in Tier 3
//   - setGlobalScsBridgeController(controller)        → principle lookup
//
// Pattern matches ADMIN_ICP claudeBridgeBarController.ts L536-549.

let globalController: ScsBridgeController | null = null;

export function setGlobalScsBridgeController(controller: ScsBridgeController | null): void {
  globalController = controller;
  console.log(
    '[ScsBridgeController] Global controller',
    controller ? 'registered' : 'cleared',
  );
}

export function getGlobalScsBridgeController(): ScsBridgeController | null {
  return globalController;
}

export function clearGlobalScsBridgeController(): void {
  globalController = null;
  console.log('[ScsBridgeController] Global controller cleared');
}
