/**
 * cadmiumMenuStcpRelay Principle (STCP · SMRP + BOCR · Huirth) · W4
 *
 * The two halves of the proven live-relay stack the SessionManager (scsBridge / suiteCascade)
 * already has, now applied to the Cadmium menu via the STCP helper:
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.cadmium.k.menuStage. On
 *     every Base change (the IAJW dir-watch dispatches cadmiumSetMenuStageHuirthBase FIRST),
 *     broadcast the relay action (cadmiumSetMenuStage) to ALL connected clients. { throttle: 0 }
 *     (DTBP) — selector-persistent low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a
 *     count INCREASE (new client joined), read the authoritative Huirth menuStage and backfill
 *     EACH newly-joined connectionId via targetConnectionId (no broadcast to existing clients).
 *
 * Deck: MuxiumDeck & { cadmium: CadmiumHuirthConcept; webSocketServer }. scsBridge NOT needed —
 * BOCR reads d.webSocketServer.k.webSocketClients + d.cadmium.k.menuStage (both flat Tier-1 in
 * the Huirth muxium · the same cross-concept co-muxified access the OkMonitor proves).
 *
 * PrincipleFunction generics bind the HUIRTH variants (CadmiumHuirthQualities /
 * CadmiumHuirthState) — NOT the client variants (S4 REFINEMENT NOTE · tsc Gate W2 verifies).
 *
 * Boot-skip: stageIndex === -1 (EMPTY_MENU_STAGE) → no Idle re-broadcast storm on boot (mirrors
 * the scsBridge/suiteCascade SMRP empty-state skip).
 *
 * Citation: suiteCascadeStateMirror.principle.huirth.ts (SMRP/DTBP pattern source).
 * Citation: suiteCascadeBackfillOnConnect.principle.huirth.ts (BOCR/WPES/TSPB pattern source).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.4 · STCP-S4-VIRIDIAN-VERIFY.md D2 (Huirth generics).
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumHuirthQualities,
  MenuStage,
} from '../cadmium.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import {
  createStcpComponentRelay,
  type StcpBroadcastFn,
} from '../../../model/stcpComponentRelay.model';
import { CADMIUM_MENU_RELAY_CONFIG } from '../cadmiumMenuRelay.config';

export type CadmiumMenuStcpRelayDeck = MuxiumDeck & {
  cadmium: Concept<CadmiumHuirthState, CadmiumHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type CadmiumMenuStcpRelayPrincipleType = PrincipleFunction<
  CadmiumHuirthQualities,
  CadmiumMenuStcpRelayDeck,
  CadmiumHuirthState
>;

export const cadmiumMenuStcpRelayPrinciple: CadmiumMenuStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Cadmium STCP Relay] Principle started · SMRP + BOCR (Huirth)');

  // This principle's OWN helper instance (independent lastIdentity + no FSWatcher — SMRP/BOCR
  // never watch the disk; the OkMonitor owns the dir-watch). Config single-source via SD-6.
  const menuRelay = createStcpComponentRelay<MenuStage>(CADMIUM_MENU_RELAY_CONFIG);

  // BOCR closure var — last observed WebSocket pool count (mirrors scsBridgeBackfillOnConnect).
  let lastKnownCount = 0;

  const relayPlan = plan('Cadmium Menu STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on cadmium.k.menuStage → broadcast the relay to all clients.
    stage(
      ({ d, dispatch }) => {
        const current = d.cadmium.k.menuStage.select() as MenuStage;
        if (current.stageIndex === -1) {
          // Boot-skip · EMPTY_MENU_STAGE · no Idle re-broadcast storm.
          return;
        }
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
        // menuStage change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            { throttle: 0 },
          );
        menuRelay.broadcastToAll(broadcast, current);
        console.log('[Cadmium STCP Relay] SMRP · menuStage broadcast · stageIndex=', current.stageIndex);
      },
      {
        selectors: [d_.cadmium.k.menuStage],
        beat: 1,
      },
    ),

    // BOCR — selector-reactive on webSocketClients pool count INCREASE → targeted backfill.
    stage(
      ({ d, dispatch }) => {
        const clients = d.webSocketServer.k.webSocketClients.select();
        const currentCount = clients?.length ?? 0;

        if (currentCount <= lastKnownCount) {
          lastKnownCount = currentCount;
          return;
        }

        const newIds: string[] = [];
        for (let i = lastKnownCount; i < currentCount; i++) {
          const c = clients[i];
          if (c?.connectionId) newIds.push(c.connectionId);
        }
        lastKnownCount = currentCount;
        if (newIds.length === 0) return;

        // Huirth state (SBSF · authoritative after the Base dispatch keeps it current).
        const current = d.cadmium.k.menuStage.select() as MenuStage;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        menuRelay.backfillToClients(broadcast, current, newIds);
        console.log(
          '[Cadmium STCP Relay] BOCR · backfilled', newIds.length, 'client(s) · stageIndex=',
          current.stageIndex,
        );
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[Cadmium STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
