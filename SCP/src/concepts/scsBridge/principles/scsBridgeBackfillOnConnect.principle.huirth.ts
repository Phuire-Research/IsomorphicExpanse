/**
 * scsBridgeBackfillOnConnect Principle — Huirth Deployment
 *
 * Cycle 160 R13 · BOCR (Backfill-On-Connect-Replay) · Option Epsilon Land
 *
 * Closes the EBOA (Empty-Broadcast-Outcome-Acceptance) failure mode where
 * Watcher's initial setBridgeJsonRelay dispatch fires before any WebSocket
 * client has connected (T+3.66s vs T+5.11s in PPLD-EVIDENCE-TRACE) and the
 * broadcast evaporates into an empty pool.
 *
 * Mechanism (WPES + TSPB · per R2 Rust Frontier 2):
 *   1. Observe d_.webSocketServer.k.webSocketClients selector (array length
 *      change re-fires the stage).
 *   2. On count INCREASE (new client joined), iterate from lastKnownCount to
 *      currentCount and backfill EACH newly-joined client (multi-client safe
 *      per R4 Viridian §6).
 *   3. Read current d.scsBridge.k.bridgeJson + d.scsBridge.k.serverStartupTime
 *      (snapshot of Huirth authoritative state).
 *   4. Dispatch d.webSocketServer.e.webSocketServerAppendToActionQue with
 *      targetConnectionId = newClient.connectionId → routes through specificQue
 *      → TSPB targeted delivery to ONLY that socket. RDID is therefore N/A
 *      (no broadcast to existing clients).
 *   5. On count DECREASE (disconnect), skip — no backfill needed.
 *
 * Pattern source: scsBridgeJsonWatcher.principle.huirth.ts (M63 Copy-Paste-Plus).
 *   Input substitution: filesystem watch → KeyedSelector observation.
 *   Output structure preserved: stage dispatch · cleanup return · no controller.fire.
 *
 * Idempotency:
 *   - SF-2 sticky-up gate in setBridgeJsonRelay.quality.ts:97-103 ensures
 *     connectionEstablished only flips false→true once.
 *   - HAZARD-α CLEAR · selector domain isolation prevents any loop (replay
 *     mutates scsBridge state, NOT webSocketServer.webSocketClients).
 *   - HAZARD-β ACCEPTABLE · chokidar + pool-join race produces two identical
 *     dispatches; second is functionally a no-op via SF-2.
 *   - HAZARD-γ MITIGATED · cross-concept DECK explicitly declared
 *     (ScsBridgeBackfillDeck includes webSocketServer concept).
 *   - HAZARD-δ SAFE · WebSocket readyState=1 by the time the selector re-fires
 *     in the next beat after registerClient reducer commits.
 *
 * Citation: EPSILON-BACKFILL-ON-CONNECT-WAVE1-R4-VIRIDIAN-AUDIT.md §HAZARD-γ
 * Citation: EPSILON-BACKFILL-ON-CONNECT-WAVE1-R2-RUST-PROSPECTING.md (BOCR/WPES/TSPB)
 * Citation: EPSILON-BACKFILL-ON-CONNECT-WAVE1-R1-MAROON-CURATION.md (file:line citations)
 * Citation: scsBridgeJsonWatcher.principle.huirth.ts (M63 source · structure)
 * Citation: webSocketClient/principles/localStorageRegistration.principle.ts
 *           (cross-concept d_.X.k.Y selector pattern precedent)
 */
import { resolveBridgeRoot } from '../bridgeRoot.model';
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthQualities,
  BridgeJsonShape,
  ScsBridgeSessionEntry,
} from '../scsBridge.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';

// Cobalt-FSGT · Cycle 160 R14 · Filesystem-Ground-Truth.
// BOCR reads bridge.json DIRECTLY from disk on each backfill decision rather
// than from Stratimux state. Rationale: Path B actionExchange.serverToClient
// may consume setBridgeJsonRelay dispatches as outbound-only (huirth state
// never updates), leaving state.bridgeJson=null. The filesystem (watcher
// write-target) is the canonical source — junction path is the same the
// watcher reads, and the SCS_BRIDGE_ROOT_OVERRIDE env var threads dev:self
// alignment per Cycle 160 R10 RBJP.
// Citation: scsBridgeJsonWatcher.principle.huirth.ts:49-52 (BRIDGE_ROOT pattern)
// Citation: BOCR-FSGT-DIRECTIVE-2026-05-23 (USER DIRECTIVE this cycle)
const BRIDGE_ROOT = resolveBridgeRoot();
const BRIDGE_JSON_PATH = path.join(BRIDGE_ROOT, 'bridge.json');
const SESSIONS_JSON_PATH = path.join(BRIDGE_ROOT, 'sessions.json');

async function readSessionsListFromDisk(): Promise<ScsBridgeSessionEntry[]> {
  console.log(
    '[SCS-Bridge BOCR-S] Reading sessions.json from JUNCTION · path=',
    SESSIONS_JSON_PATH,
  );
  try {
    const raw = await readFile(SESSIONS_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // sessions.json shape: { sessions: [...] } OR direct array (FSGT-S parsing discipline)
    const list = Array.isArray(parsed) ? parsed : (parsed?.sessions ?? []);
    console.log(
      '[SCS-Bridge BOCR-S] Read · sessionsList length=',
      Array.isArray(list) ? list.length : 0,
    );
    return list as ScsBridgeSessionEntry[];
  } catch (err) {
    console.warn(
      '[SCS-Bridge BOCR-S] Read failed · path=',
      SESSIONS_JSON_PATH,
      '· err=',
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function readBridgeJsonFromDisk(): Promise<BridgeJsonShape | null> {
  console.log(
    '[SCS-Bridge BOCR] read · bridge.json access · JUNCTION path=',
    BRIDGE_JSON_PATH,
  );
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as BridgeJsonShape;
    console.log(
      '[SCS-Bridge BOCR] read · parsed · port=',
      parsed.port,
      '· endpoint=',
      parsed.endpoint,
      '· pongReceipt.respondedAt=',
      parsed.pongReceipt?.respondedAt,
    );
    return parsed;
  } catch (err) {
    console.warn(
      '[SCS-Bridge BOCR] read · FAILED · path=',
      BRIDGE_JSON_PATH,
      '· err=',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// HAZARD-γ · Cross-concept DECK · intra-Huirth Diameter
// (NOT actionExchange · this is local cross-concept dispatch within huirth Muxium).
// Citation: EPSILON-BACKFILL-ON-CONNECT-WAVE1-R4-VIRIDIAN-AUDIT.md §HAZARD-γ
export type ScsBridgeBackfillDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type ScsBridgeBackfillOnConnectPrincipleType = PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeBackfillDeck,
  ScsBridgeHuirthState
>;

export const scsBridgeBackfillOnConnectPrinciple: ScsBridgeBackfillOnConnectPrincipleType = ({
  d_,
  plan,
}) => {
  console.log('[SCS-Bridge BOCR] Principle started · Backfill-On-Connect-Replay');

  // Closure-scoped count tracker · multi-client race safety (R4 Viridian §6).
  // The stage selector may re-fire with multiple new clients within one beat;
  // we iterate the delta (lastKnownCount → currentCount) so every new client
  // receives a TSPB backfill.
  let lastKnownCount = 0;

  const backfillPlan = plan('ScsBridge Backfill-On-Connect (Huirth)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        const clients = d.webSocketServer.k.webSocketClients.select();
        const currentCount = clients?.length ?? 0;

        // LSSD · pool-event detected · log every transition (R4 Viridian §11).
        if (currentCount !== lastKnownCount) {
          console.log(
            '[SCS-Bridge BOCR] WebSocket pool count change · prev=',
            lastKnownCount,
            '· current=',
            currentCount,
          );
        }

        // Skip path · count decreased (disconnect) OR unchanged (no-op).
        // No backfill needed — Huirth state is already canonical for any
        // future connection.
        if (currentCount <= lastKnownCount) {
          lastKnownCount = currentCount;
          return;
        }

        // Cobalt-FSGT · Cycle 160 R14 · read bridge.json DIRECTLY from disk
        // (filesystem-ground-truth) rather than from huirth state. Path B
        // actionExchange.serverToClient consumes setBridgeJsonRelay dispatches
        // as outbound-only · local reducer never runs · state.bridgeJson stays
        // null. Filesystem is canonical (watcher writes there; we read same
        // junction path · respects SCS_BRIDGE_ROOT_OVERRIDE).
        // serverStartupTime still sourced from state (set on huirth boot by
        // watcher's §B.0 dispatch · not subject to Path B consumption since
        // setServerStartupTime is NOT in actionExchange).
        const serverStartupTime = d.scsBridge.k.serverStartupTime.select();
        const newClientsToBackfill: Array<{ connectionId: string; index: number }> = [];
        for (let i = lastKnownCount; i < currentCount; i++) {
          const newClient = clients[i];
          if (!newClient?.connectionId) {
            console.warn(
              '[SCS-Bridge BOCR] Skip · client at index',
              i,
              'has no connectionId',
            );
            continue;
          }
          newClientsToBackfill.push({
            connectionId: newClient.connectionId,
            index: i,
          });
        }
        lastKnownCount = currentCount;

        if (newClientsToBackfill.length === 0) {
          return;
        }

        // D3H · Wave 2 · BOCR-Refine (Huirth-state read · NOT disk).
        // SBSF (Server-Barrier-to-Source-of-Filesystem): Huirth state is the
        // authoritative source. After Wave 1 HBSU, sessionsList in Huirth state
        // carries the SSTE-enriched (Session-State-Transcript-Enriched) entries
        // — transcriptSnippet + transcriptLastUserInput + transcriptLastModelOutput
        // + transcriptLastReadAt + transcriptPath fields populated by the
        // transcript watcher's AQSD reducer.
        //
        // Pre-Wave-2: readSessionsListFromDisk() returned raw sessions.json fields
        // (status + cwd + ULID + claudeSessionId) with NO transcript enrichment →
        // BOCR replay overwrote Client's transient (steady-state) transcript data
        // with stale disk fields on every reconnect/refresh.
        //
        // Post-Wave-2: d.scsBridge.k.sessionsList.select() returns the Huirth
        // state — which the JsonWatcher (sessions.json mutations · HuirthBase
        // dispatch L210-215) AND the TranscriptWatcher (per-session JSONL
        // mutations · HuirthBase dispatch · this Wave 1) keep current. BOCR
        // therefore replays SSTE-included state to reconnecting clients.
        //
        // bridge.json read remains disk-direct (Cobalt-FSGT discipline · the
        // bridge.json Path B legacy consumption issue at L182-190 above) until
        // a future cycle wires a parallel HBSU for bridgeJson on the
        // setBridgeJsonHuirthBase path.
        //
        // Cite: D3H-FOUNDATION-R7-FUCHSIA-CLINICAL.md (BOCR-S SBSF violation)
        // Cite: D3H-FOUNDATION-R6-PURPLE-ORCHESTRATION.md (Huirth-state-read fix)
        const sessionsListFromHuirthState =
          (d.scsBridge.k.sessionsList.select() ?? []) as ScsBridgeSessionEntry[];
        console.log(
          '[SCS-Bridge BOCR-S] Huirth state read · sessionsList length=',
          sessionsListFromHuirthState.length,
        );

        // Cycle 161 R3 · BOCR-S + DBPL · Dual-Backfill-Pair-Locked.
        // Promise.all batches one filesystem read (bridge.json) and uses the
        // Huirth-state sessionsList directly. setBridgeJsonRelay AND
        // setSessionsListRelay still land in the SAME actionQue array per
        // target client (single WebSocket frame · atomic delivery). DBPL
        // invariant: never one without the other.
        // Citation: D3B-WIRE-THROUGH-FOUNDATION-R7-FUCHSIA-CLINICAL.md §Q3
        // Citation: D3B-WIRE-THROUGH-FOUNDATION-R4-VIRIDIAN-AUDIT.md §Angle 1
        Promise.all([
          readBridgeJsonFromDisk(),
          Promise.resolve(sessionsListFromHuirthState),
        ]).then(([bridgeJson, sessionsList]) => {
          console.log(
            '[SCS-Bridge BOCR-S] DBPL batch · bridgeJson.endpoint=',
            bridgeJson?.endpoint,
            '· sessionsList length=',
            sessionsList.length,
            '· serverStartupTime=',
            serverStartupTime,
          );

          for (const { connectionId, index } of newClientsToBackfill) {
            console.log(
              '[SCS-Bridge BOCR-S] DBPL batch dispatch · targetConnectionId=',
              connectionId,
              '· clientIndex=',
              index,
            );
            dispatch(
              d.webSocketServer.e.webSocketServerAppendToActionQue({
                actionQue: [
                  d.scsBridge.e.scsBridgeSetBridgeJsonRelay({
                    scsBridgeBridgeJson: bridgeJson,
                    serverStartupTime,
                  }),
                  d.scsBridge.e.scsBridgeSetSessionsListRelay({
                    scsBridgeSessionsList: sessionsList,
                  }),
                ],
                targetConnectionId: connectionId,
              }),
              {},
            );
          }
        });
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge BOCR] Principle cleanup');
    backfillPlan.conclude();
  };
};
