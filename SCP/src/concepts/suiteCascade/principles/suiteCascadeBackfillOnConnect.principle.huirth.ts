/**
 * suiteCascadeBackfillOnConnect Principle (BOCR) · Refining Cascade D2 · Option C
 *
 * Backfill-On-Connect-Replay — closes the EBOA (Empty-Broadcast-Outcome-Acceptance)
 * failure mode where the watcher's initial relay dispatch fires before any WebSocket
 * client has connected. Without BOCR, a page that mounts AFTER boot never receives
 * the cascade data the watcher already loaded.
 *
 * Mechanism (mirrors scsBridgeBackfillOnConnect.principle.huirth.ts WPES+TSPB pattern):
 *   1. Observe d_.webSocketServer.k.webSocketClients selector (array length
 *      change re-fires the stage).
 *   2. On count INCREASE (new client joined), iterate from lastKnownCount to
 *      currentCount and backfill EACH newly-joined client.
 *   3. Read current d.suiteCascade.k.cascades (Huirth authoritative state).
 *   4. Dispatch d.webSocketServer.e.webSocketServerAppendToActionQue with
 *      targetConnectionId = newClient.connectionId → TSPB targeted delivery
 *      to ONLY that socket (no broadcast to existing clients).
 *   5. On count DECREASE (disconnect), skip.
 *
 * This is what makes the SuiteCascade island show the General cascade ON MOUNT:
 * the watcher fires at boot before the IUPA muxium's WebSocket connects; BOCR
 * replays the current Huirth cascades state the moment that connection registers.
 *
 * Citation: scsBridgeBackfillOnConnect.principle.huirth.ts (BOCR/WPES/TSPB source)
 * Citation: REFINE-D2-S1-RED-CASCADEJSON.md §3 (root cause — no BOCR)
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeHuirthQualities,
  Cascade,
} from '../suiteCascade.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';

export type SuiteCascadeBackfillDeck = MuxiumDeck & {
  suiteCascade: Concept<SuiteCascadeHuirthState, SuiteCascadeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type SuiteCascadeBackfillOnConnectPrincipleType = PrincipleFunction<
  SuiteCascadeHuirthQualities,
  SuiteCascadeBackfillDeck,
  SuiteCascadeHuirthState
>;

export const suiteCascadeBackfillOnConnectPrinciple: SuiteCascadeBackfillOnConnectPrincipleType = ({
  d_,
  plan,
}) => {
  console.log('[SuiteCascade BOCR] Principle started · Backfill-On-Connect-Replay');

  let lastKnownCount = 0;

  const backfillPlan = plan('SuiteCascade Backfill-On-Connect (Huirth)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        const clients = d.webSocketServer.k.webSocketClients.select();
        const currentCount = clients?.length ?? 0;

        if (currentCount !== lastKnownCount) {
          console.log(
            '[SuiteCascade BOCR] WebSocket pool count change · prev=',
            lastKnownCount,
            '· current=',
            currentCount,
          );
        }

        if (currentCount <= lastKnownCount) {
          lastKnownCount = currentCount;
          return;
        }

        const newClientsToBackfill: Array<{ connectionId: string; index: number }> = [];
        for (let i = lastKnownCount; i < currentCount; i++) {
          const newClient = clients[i];
          if (!newClient?.connectionId) {
            console.warn(
              '[SuiteCascade BOCR] Skip · client at index',
              i,
              'has no connectionId',
            );
            continue;
          }
          newClientsToBackfill.push({ connectionId: newClient.connectionId, index: i });
        }
        lastKnownCount = currentCount;

        if (newClientsToBackfill.length === 0) {
          return;
        }

        const cascades = (d.suiteCascade.k.cascades.select() ?? {}) as Record<string, Cascade>;
        if (Object.keys(cascades).length === 0) {
          console.log('[SuiteCascade BOCR] Skip backfill · cascades empty on Huirth');
          return;
        }

        const relayActions = [];
        for (const cascade of Object.values(cascades)) {
          if (!cascade) {
            continue;
          }
          relayActions.push(
            d.suiteCascade.e.suiteCascadeSetCascadeRelay({
              name: cascade.name,
              cascade,
            }),
          );
          relayActions.push(
            d.suiteCascade.e.suiteCascadeSetActiveCascadeFilesRelay({
              name: cascade.name,
              activeCascadeFiles: cascade.activeCascadeFiles ?? [],
            }),
          );
        }

        if (relayActions.length === 0) {
          return;
        }

        for (const { connectionId, index } of newClientsToBackfill) {
          console.log(
            '[SuiteCascade BOCR] Backfill dispatch · targetConnectionId=',
            connectionId,
            '· clientIndex=',
            index,
            '· cascadeCount=',
            Object.keys(cascades).length,
          );
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue({
              actionQue: relayActions,
              targetConnectionId: connectionId,
            }),
            {},
          );
        }
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[SuiteCascade BOCR] Principle cleanup');
    backfillPlan.conclude();
  };
};
