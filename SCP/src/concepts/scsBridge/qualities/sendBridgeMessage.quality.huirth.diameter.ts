/**
 * sendBridgeMessage Quality — Huirth Real (Diametric counterpart of client Induction)
 *
 * E11 fix · Cycle 160 R7 Rose Clinical · completes Diametric Pattern for
 * sendBridgeMessage junction. Client Induction (sendBridgeMessage.quality.client.diameter.ts)
 * dispatches '__scs_bridge_status_request__' sentinel (Cycle 155 BJDP relay infrastructure
 * already broadcasts via Huirth Diametric SET on file watcher · this Real receives via
 * WebSocket Diameter (actionExchange.clientToServer at scsBridge.muxonomy.ts:279-283) and
 * logs receipt · the JSON Watcher principle handles the actual bridge-status relay.
 *
 * Without this Huirth Real, every 'Scs Bridge Send Bridge Message' action arriving server-side
 * was silently dropped (no matching quality in HuirthQualities · WebSocket type-string lookup
 * found no receptor · E11 Partial-Diametric-Pattern).
 *
 * ============================================================================
 * Cycle 160 R16 · Cobalt-SCRR (Sentinel-Client-Request-Response) — ACTIVATED
 * ============================================================================
 *
 * The sentinel branch is no longer a NO-OP. It now reads bridge.json directly
 * from the filesystem (FSGT pattern · same junction path as BOCR + JsonWatcher)
 * and dispatches a setBridgeJsonRelay BROADCAST through
 * webSocketServerAppendToActionQue so the requesting Client (and any other
 * connected Clients) receives current bridgeJson state.
 *
 * SCRR is the COMPLEMENT of BOCR (Cycle 160 R13/R14):
 *   - BOCR fires on WebSocket pool count INCREASE (eager · works for hard
 *     restart timing where server beats Client subscribers into the pool).
 *   - SCRR fires on Client EXPLICIT REQUEST sentinel (lazy · works for the
 *     refresh / late-init timing case where BOCR's eager push arrives BEFORE
 *     Client principles have armed their subscribers, so the dispatched
 *     setBridgeJsonRelay evaporates into a not-yet-listening Client).
 *
 * Both converge on the SAME destination (Client setBridgeJsonRelay reducer
 * flips connectionEstablished true via SF-2 sticky-up gate · Ping gate then
 * passes). SF-2 makes the two paths idempotent — if BOCR already landed, SCRR
 * is a structural no-op; if BOCR missed, SCRR self-heals the refresh case
 * without requiring a manual Turn Over.
 *
 * Routing decision: BROADCAST (not targeted). The sentinel arrives as a plain
 * Induction action without strategy wrap (per createInductionQualityCardWithPayload
 * shape · see sendBridgeMessage.quality.client.diameter.ts), so neither
 * action.strategy.data.clientStateKey nor a targetConnectionId is available in
 * the reducer/method scope. Broadcasting via webSocketServerAppendToActionQue
 * with no routing key relies on SF-2 sticky-up idempotency in existing
 * Clients — the structural cost is one extra setBridgeJsonRelay dispatch per
 * already-connected Client per refresh event (no state change, no visible
 * effect). Pattern mirrors notificationBridge.model.ts notifyAllClients.
 *
 * Pattern: Diametric Real (createQualityCardWithPayload + createMethodWithConcepts)
 *   — converted from createAsyncMethod to gain access to concepts_/deck for
 *   the muxiumTimeOut cross-concept dispatch pattern (notificationBridge.model
 *   exemplar · controller.fire would close the controller prematurely).
 * Type-string source of truth: 'Scs Bridge Send Bridge Message' (Verbose Split · exact match
 *   to Client Induction + actionExchange.clientToServer entry · per AESR pattern).
 *
 * Citation: DIAMETRIC-PATCH-WAVE1-R7-ROSE-CLINICAL.md · Diagnosis 2 + L2
 * Citation: notification/qualities/helloWorld.quality.huirth.diameter.ts (canonical exemplar)
 * Citation: notification/model/notificationBridge.model.ts (muxiumTimeOut cross-concept dispatch · notifyAllClients pattern)
 * Citation: scsBridgeBackfillOnConnect.principle.huirth.ts (BOCR · FSGT + targeted dispatch · complement)
 * Citation: sendBridgeMessage.quality.client.diameter.ts (Client Induction half · sentinel emit)
 * Citation: scsBridgeConnection.principle.client.ts (sentinel firing trigger · L54)
 */
import { resolveBridgeRoot } from '../bridgeRoot.model';
import { isScsAvailableModel } from '../model/scsModelCatalog.model';
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumTimeOut,
  nullReducer,
  selectPayload,
  strategySuccess,
  type Concepts,
  type Action,
  type AnyAction,
} from 'stratimux';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  ScsBridgeHuirthState,
  ScsBridgeSendBridgeMessagePayload,
  ScsBridgeSetBridgeJsonRelayPayload,
  ScsBridgeSetSessionsListRelayPayload,
  BridgeJsonShape,
  ScsBridgeSessionEntry,
} from '../scsBridge.type';

const STATUS_REQUEST_SENTINEL = '__scs_bridge_status_request__';

// Cobalt-FSGT · Cycle 160 R14 · Filesystem-Ground-Truth (SCRR adoption · R16).
// SCRR reads bridge.json DIRECTLY from disk on each sentinel response rather
// than from huirth state · same rationale as BOCR: Path B
// actionExchange.serverToClient may consume setBridgeJsonRelay dispatches as
// outbound-only (huirth state never updates), leaving state.bridgeJson=null.
// The filesystem (watcher write-target) is the canonical source — junction
// path matches BOCR + JsonWatcher · SCS_BRIDGE_ROOT_OVERRIDE env var threads
// dev:self alignment.
// Citation: scsBridgeBackfillOnConnect.principle.huirth.ts:71-74 (BRIDGE_ROOT pattern)
// Citation: scsBridgeJsonWatcher.principle.huirth.ts:49-52 (BRIDGE_ROOT pattern)
const BRIDGE_ROOT = resolveBridgeRoot();
const BRIDGE_JSON_PATH = path.join(BRIDGE_ROOT, 'bridge.json');
const SESSIONS_JSON_PATH = path.join(BRIDGE_ROOT, 'sessions.json');

// SWRM · D4 W3 · the render-mode write set (mirror of the bridge's 12-mode catalog · the SCP
// cannot import across the codebase boundary). Guards the disk write against junk values.
const VALID_RENDER_MODES = new Set<string>([
  'muxon', 'crtcurve', 'fishbowl', 'chroma', 'crtflat',
  'lcd', 'dmg', 'cga', 'vhs', 'vfd', 'eink', 'off',
]);

// SWRM · D4 W3 · atomic read-modify-write of bridge.json.renderMode (mirrors bridgePingPong's
// pongReceipt RMW). The bridge's D3 chokidar watcher fires on this write → live-swaps the running
// terminals (the D4-proves-D3 path). Preserves every other field (read → spread → write tmp → rename).
async function applyTerminalRenderMode(mode: string): Promise<void> {
  if (!VALID_RENDER_MODES.has(mode)) {
    console.warn('[SCS-Bridge Huirth] renderMode write rejected · invalid mode=', mode);
    return;
  }
  const tmpPath = `${BRIDGE_JSON_PATH}.rendermode.tmp`;
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    const existing = JSON.parse(raw) as BridgeJsonShape;
    const updated = { ...existing, renderMode: mode };
    await mkdir(path.dirname(BRIDGE_JSON_PATH), { recursive: true });
    await writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
    await rename(tmpPath, BRIDGE_JSON_PATH);
    console.log('[SCS-Bridge Huirth] renderMode written to bridge.json · mode=', mode);
  } catch (err) {
    console.error('[SCS-Bridge Huirth] renderMode write failed:', err);
  }
}

// C919 · THE FRAME GOVERNOR write · atomic RMW of bridge.json.shaderFps (the
// applyTerminalRenderMode idiom). Clamped 8-60 (the shared governor bounds · mirrored here —
// the SCP cannot import across the codebase boundary). The bridge's renderModeWatch fires on
// this write → re-gates EVERY presenter (terminal + SCP · one cadence · default 24 Like Animation).
async function applyShaderFps(fps: number): Promise<void> {
  if (!Number.isFinite(fps)) {
    console.warn('[SCS-Bridge Huirth] shaderFps write rejected · not a number:', fps);
    return;
  }
  const clamped = Math.min(60, Math.max(8, Math.round(fps)));
  const tmpPath = `${BRIDGE_JSON_PATH}.shaderfps.tmp`;
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    const existing = JSON.parse(raw) as BridgeJsonShape;
    const updated = { ...existing, shaderFps: clamped };
    await mkdir(path.dirname(BRIDGE_JSON_PATH), { recursive: true });
    await writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
    await rename(tmpPath, BRIDGE_JSON_PATH);
    console.log('[SCS-Bridge Huirth] shaderFps written to bridge.json · fps=', clamped);
  } catch (err) {
    console.error('[SCS-Bridge Huirth] shaderFps write failed:', err);
  }
}

// SWRM · atomic read-modify-write of bridge.json.scpRenderMode (mirrors applyTerminalRenderMode for
// the SCP surface · user-directed "set such via the bridge"). The bridge's renderModeWatch fires on
// this write → swaps EVERY SCP offscreen presenter (applies to all SCPs). Preserves every field.
async function applyScpRenderMode(mode: string): Promise<void> {
  if (!VALID_RENDER_MODES.has(mode)) {
    console.warn('[SCS-Bridge Huirth] scpRenderMode write rejected · invalid mode=', mode);
    return;
  }
  const tmpPath = `${BRIDGE_JSON_PATH}.scprendermode.tmp`;
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    const existing = JSON.parse(raw) as BridgeJsonShape;
    const updated = { ...existing, scpRenderMode: mode };
    await mkdir(path.dirname(BRIDGE_JSON_PATH), { recursive: true });
    await writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
    await rename(tmpPath, BRIDGE_JSON_PATH);
    console.log('[SCS-Bridge Huirth] scpRenderMode written to bridge.json · mode=', mode);
  } catch (err) {
    console.error('[SCS-Bridge Huirth] scpRenderMode write failed:', err);
  }
}

// MD-9 · D-MC-6 · atomic read-modify-write of bridge.json.defaultModel (mirrors applyScpRenderMode
// · TEMPLATE-ONLY Settings leg). The bridge's renderModeWatch ALREADY applies bridge.json.defaultModel
// → activeDefaultModel → every subsequent spawn/resume WITHOUT a per-instance record (D-MC-6 §MD-9).
// Validated against the template catalog mirror (isScsAvailableModel · the four pinned IDs) — invalid
// → warn + no write, so the receiver never writes garbage into bridge.json. Preserves every field.
async function applyDefaultModel(model: string): Promise<void> {
  if (!isScsAvailableModel(model)) {
    console.warn('[SCS-Bridge Huirth] defaultModel write rejected · invalid model=', model);
    return;
  }
  const tmpPath = `${BRIDGE_JSON_PATH}.defaultmodel.tmp`;
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    const existing = JSON.parse(raw) as BridgeJsonShape;
    const updated = { ...existing, defaultModel: model };
    await mkdir(path.dirname(BRIDGE_JSON_PATH), { recursive: true });
    await writeFile(tmpPath, JSON.stringify(updated, null, 2), 'utf-8');
    await rename(tmpPath, BRIDGE_JSON_PATH);
    console.log('[SCS-Bridge Huirth] defaultModel written to bridge.json · model=', model);
  } catch (err) {
    console.error('[SCS-Bridge Huirth] defaultModel write failed:', err);
  }
}

async function readSessionsListFromDisk(): Promise<ScsBridgeSessionEntry[]> {
  console.log(
    '[SCS-Bridge SCRR-S] Sentinel response · reading sessions.json from junction · path=',
    SESSIONS_JSON_PATH,
  );
  try {
    const raw = await readFile(SESSIONS_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : (parsed?.sessions ?? []);
    console.log(
      '[SCS-Bridge SCRR-S] Sentinel response · parsed sessions.json · length=',
      Array.isArray(list) ? list.length : 0,
    );
    return list as ScsBridgeSessionEntry[];
  } catch (err) {
    console.warn(
      '[SCS-Bridge SCRR-S] Sentinel response · sessions.json read FAILED · path=',
      SESSIONS_JSON_PATH,
      '· err=',
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function readBridgeJsonFromDisk(): Promise<BridgeJsonShape | null> {
  console.log(
    '[SCS-Bridge SCRR] Sentinel response · reading bridge.json from junction · path=',
    BRIDGE_JSON_PATH,
  );
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as BridgeJsonShape;
    console.log(
      '[SCS-Bridge SCRR] Sentinel response · parsed bridge.json · port=',
      parsed.port,
      '· endpoint=',
      parsed.endpoint,
      '· pongReceipt.respondedAt=',
      parsed.pongReceipt?.respondedAt,
    );
    return parsed;
  } catch (err) {
    console.warn(
      '[SCS-Bridge SCRR] Sentinel response · bridge.json read FAILED · path=',
      BRIDGE_JSON_PATH,
      '· err=',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// Deck shape required for muxiumTimeOut cross-concept dispatch · mirrors
// NotificationHuirthDeck inline-emitter pattern from notificationBridge.model.ts.
// Both concepts (scsBridge huirth · webSocketServer) are loaded into the Huirth
// Muxium · this local-typed view exposes the .e action emitters directly so
// the method body can call them without invoking the full ConceptDECK type graph
// (which is opaque to createMethodWithConcepts' default void C generic).
type ScsBridgeSendBridgeMessageHuirthDeck = {
  scsBridge: {
    e: {
      scsBridgeSetBridgeJsonRelay: (payload: ScsBridgeSetBridgeJsonRelayPayload) => Action;
      scsBridgeSetSessionsListRelay: (payload: ScsBridgeSetSessionsListRelayPayload) => Action;
      // GITM color-cascade (W4) · Vermillion Focus+Highlight — the highlight relay emitter (the
      // scs:highlight branch broadcasts this to the client to pulse the matching control).
      scsBridgeSetHighlightTarget: (payload: { target: string | null }) => Action;
    };
  };
  webSocketServer: {
    e: {
      webSocketServerAppendToActionQue: (payload: {
        actionQue: AnyAction[];
        targetClientStateKey?: string;
        targetConnectionId?: string;
      }) => Action;
    };
  };
};

export const scsBridgeSendBridgeMessageHuirth = createQualityCardWithPayload<
  ScsBridgeHuirthState,
  ScsBridgeSendBridgeMessagePayload
>({
  type: 'Scs Bridge Send Bridge Message',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      const huirthDeck = deck as unknown as ScsBridgeSendBridgeMessageHuirthDeck;
      const payload = (selectPayload<ScsBridgeSendBridgeMessagePayload>(action) ??
        { message: '' }) as ScsBridgeSendBridgeMessagePayload;
      const message = payload.message ?? '';

      if (message === STATUS_REQUEST_SENTINEL) {
        console.log(
          '[SCS-Bridge SCRR] Sentinel __scs_bridge_status_request__ received · initiating Backfill-On-Request',
        );
        // Cycle 160 R16 · Cobalt-SCRR · Server responds to Client's explicit
        // status request with current bridgeJson state. Two paths converge:
        // BOCR (eager on connect · pool-count delta) + SCRR (lazy on request ·
        // this branch). SF-2 sticky-up gate in setBridgeJsonRelay.quality.ts
        // makes duplicate dispatches idempotent · safe to fire twice.
        //
        // Targeting verdict: BROADCAST. The sentinel arrives as plain
        // Induction (no strategy wrap · createInductionQualityCardWithPayload
        // shape) so action.strategy.data.clientStateKey is absent and no
        // targetConnectionId is threaded through Path B clientToServer. The
        // appendActionQue Quality's no-routing branch broadcasts to ALL
        // connected clients (appendActionQue.quality.ts L68-79);
        // already-established Clients no-op via SF-2 sticky-up.
        //
        // muxiumTimeOut (NOT controller.fire) — controller.fire is single-use
        // scope and would close the controller; muxiumTimeOut schedules the
        // dispatch through the Muxium plan stream safely. Pattern from
        // notificationBridge.model.ts notifyAllClients (L197-223).
        // Cycle 161 R3 · SCRR-S + DBPL · Dual-Backfill-Pair-Locked broadcast.
        // Promise.all parallelizes bridge.json + sessions.json reads; both
        // relay actions land in the SAME actionQue array for atomic burst
        // delivery to all connected Clients (no targetConnectionId =
        // broadcast). DBPL invariant: never one without the other.
        // Citation: D3B-WIRE-THROUGH-FOUNDATION-R7-FUCHSIA-CLINICAL.md §Q3
        // Citation: D3B-WIRE-THROUGH-FOUNDATION-R4-VIRIDIAN-AUDIT.md §Angle 2
        Promise.all([
          readBridgeJsonFromDisk(),
          readSessionsListFromDisk(),
        ])
          .then(([bridgeJson, sessionsList]) => {
            console.log(
              '[SCS-Bridge SCRR-S] DBPL batch · target=BROADCAST · bridgeJson.endpoint=',
              bridgeJson?.endpoint,
              '· sessionsList length=',
              sessionsList.length,
            );
            const relayAction = huirthDeck.scsBridge.e.scsBridgeSetBridgeJsonRelay({
              scsBridgeBridgeJson: bridgeJson,
              // serverStartupTime: null is intentional · the JsonWatcher's
              // §B.0 boot dispatch has already populated the Client's mirror
              // and SF-2 sticky-up ignores null overrides. The primary
              // purpose of THIS dispatch is to trigger connectionEstablished
              // flip via the sticky-up gate's endpoint-presence detection in
              // the freshly-mounted Client subscriber.
              serverStartupTime: null,
            });
            const sessionsAction = huirthDeck.scsBridge.e.scsBridgeSetSessionsListRelay({
              scsBridgeSessionsList: sessionsList,
            });
            muxiumTimeOut(
              concepts_ as Concepts,
              () =>
                huirthDeck.webSocketServer.e.webSocketServerAppendToActionQue({
                  actionQue: [relayAction, sessionsAction],
                }),
              30,
            );
          })
          .catch((err: Error) => {
            console.error(
              '[SCS-Bridge SCRR-S] Sentinel response · DBPL batch chain failed:',
              err.message,
            );
          });
      } else {
        // SWRM · D4 W3 · a {kind:'scs:renderMode',renderMode} envelope from the Settings panel →
        // write bridge.json.renderMode → the bridge's D3 watcher live-swaps the running terminals.
        let handledRenderMode = false;
        try {
          const parsed = JSON.parse(message) as {
            kind?: string; renderMode?: string; target?: string; model?: string; fps?: number;
          };
          if (parsed && parsed.kind === 'scs:renderMode' && typeof parsed.renderMode === 'string') {
            handledRenderMode = true;
            void applyTerminalRenderMode(parsed.renderMode);
          } else if (
            parsed && parsed.kind === 'scs:scpRenderMode' && typeof parsed.renderMode === 'string'
          ) {
            // SWRM · SCP render mode → write bridge.json.scpRenderMode → the watcher swaps all SCPs.
            handledRenderMode = true;
            void applyScpRenderMode(parsed.renderMode);
          } else if (
            parsed && parsed.kind === 'scs:shaderFps' && typeof parsed.fps === 'number'
          ) {
            // C919 · a {kind:'scs:shaderFps',fps} envelope from the Settings slider → write
            // bridge.json.shaderFps → the bridge's renderModeWatch re-gates every presenter.
            handledRenderMode = true;
            void applyShaderFps(parsed.fps);
          } else if (
            parsed && parsed.kind === 'scs:defaultModel' && typeof parsed.model === 'string'
          ) {
            // MD-9 · D-MC-6 · a {kind:'scs:defaultModel',model} envelope from the Settings panel →
            // write bridge.json.defaultModel → the bridge's renderModeWatch (already stehed) applies
            // it → activeDefaultModel → every subsequent spawn/resume without a per-instance record.
            handledRenderMode = true;
            void applyDefaultModel(parsed.model);
          } else if (
            parsed && parsed.kind === 'scs:highlight' && typeof parsed.target === 'string'
          ) {
            // GITM color-cascade (W4) · Vermillion Focus+Highlight — the Pewter Skill POSTs this after
            // a hifiConfig.json color write. BROADCAST a scsBridgeSetHighlightTarget relay to the client
            // (no disk write · UI-only) → the Turn-Over button pulses; a Vue watch auto-resets ~2s later.
            // Mirrors the SCRR broadcast (muxiumTimeOut → webSocketServerAppendToActionQue · no routing
            // key = broadcast). The client reducer is local-only (filterKey · not bidirectionally synced).
            handledRenderMode = true;
            const highlightTarget = parsed.target;
            const highlightAction = huirthDeck.scsBridge.e.scsBridgeSetHighlightTarget({
              target: highlightTarget,
            });
            muxiumTimeOut(
              concepts_ as Concepts,
              () =>
                huirthDeck.webSocketServer.e.webSocketServerAppendToActionQue({
                  actionQue: [highlightAction],
                }),
              30,
            );
          }
        } catch {
          /* not JSON · fall through to the default log */
        }
        if (!handledRenderMode) {
          console.log('[SCS-Bridge Huirth] sendBridgeMessage received:', message);
        }
      }

      // Strategy continuation (if invoked within a strategy chain) — preserved
      // from prior createAsyncMethod muxiumConclude semantics. Plain action
      // arrivals pass through unchanged.
      if (action.strategy) {
        return strategySuccess(action.strategy);
      }
      return action as unknown as Action;
    }),
});
