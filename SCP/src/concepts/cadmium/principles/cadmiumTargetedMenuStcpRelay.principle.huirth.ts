/**
 * cadmiumTargetedMenuStcpRelay Principle (Diamond TRP · 4th STCP · SMRP + BOCR · Huirth)
 *
 * The two halves of the proven live-relay stack the SessionManager (scsBridge / suiteCascade)
 * already has, now applied to the Cadmium TARGETED-research menu via the STCP helper (byte-mirror
 * of cadmiumMenuStcpRelay · all menuStage → targetedMenuStage):
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.cadmium.k.targetedMenuStage. On
 *     every Base change (the targeted-menu dir-watch dispatches cadmiumSetTargetedMenuStageHuirthBase
 *     FIRST), broadcast the relay action (cadmiumSetTargetedMenuStage) to ALL connected clients.
 *     { throttle: 0 } (DTBP) — selector-persistent low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a
 *     count INCREASE (new client joined), read the authoritative Huirth targetedMenuStage and backfill
 *     EACH newly-joined connectionId via targetConnectionId (no broadcast to existing clients).
 *
 * Deck: MuxiumDeck & { cadmium: CadmiumHuirthConcept; webSocketServer }. scsBridge NOT needed —
 * BOCR reads d.webSocketServer.k.webSocketClients + d.cadmium.k.targetedMenuStage (both flat Tier-1
 * in the Huirth muxium · the same cross-concept co-muxified access the OkMonitor proves).
 *
 * PrincipleFunction generics bind the HUIRTH variants (CadmiumHuirthQualities / CadmiumHuirthState) —
 * NOT the client variants (mirrors cadmiumMenuStcpRelay · tsc Gate verifies).
 *
 * Boot-skip: stageIndex === -1 (EMPTY_MENU_STAGE) → no Idle re-broadcast storm on boot (mirrors
 * the menu SMRP empty-state skip).
 *
 * Citation: cadmiumMenuStcpRelay.principle.huirth.ts (byte-mirror · SMRP/BOCR pattern source).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: TRP-DIAMOND-WGB.md §1 A11 (byte-mirror · menuStage → targetedMenuStage).
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
import { CADMIUM_TARGETED_MENU_RELAY_CONFIG } from '../cadmiumTargetedMenuRelay.config';

export type CadmiumTargetedMenuStcpRelayDeck = MuxiumDeck & {
  cadmium: Concept<CadmiumHuirthState, CadmiumHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type CadmiumTargetedMenuStcpRelayPrincipleType = PrincipleFunction<
  CadmiumHuirthQualities,
  CadmiumTargetedMenuStcpRelayDeck,
  CadmiumHuirthState
>;

export const cadmiumTargetedMenuStcpRelayPrinciple: CadmiumTargetedMenuStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Cadmium STCP TargetedMenu Relay] Principle started · SMRP + BOCR (Huirth)');

  // This principle's OWN helper instance (independent lastIdentity + no FSWatcher — SMRP/BOCR
  // never watch the disk; the OkMonitor owns the dir-watch). Config single-source.
  const targetedMenuRelay = createStcpComponentRelay<MenuStage>(CADMIUM_TARGETED_MENU_RELAY_CONFIG);

  // BOCR closure var — last observed WebSocket pool count (mirrors cadmiumMenuStcpRelay).
  let lastKnownCount = 0;

  const relayPlan = plan('Cadmium Targeted Menu STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on cadmium.k.targetedMenuStage → broadcast the relay to all clients.
    stage(
      ({ d, dispatch }) => {
        const current = d.cadmium.k.targetedMenuStage.select() as MenuStage;
        if (current.stageIndex === -1) {
          // Boot-skip · EMPTY_MENU_STAGE · no Idle re-broadcast storm.
          return;
        }
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
        // targetedMenuStage change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            { throttle: 0 },
          );
        targetedMenuRelay.broadcastToAll(broadcast, current);
        console.log('[Cadmium STCP TargetedMenu Relay] SMRP · targetedMenuStage broadcast · stageIndex=', current.stageIndex);
      },
      {
        selectors: [d_.cadmium.k.targetedMenuStage],
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
        const current = d.cadmium.k.targetedMenuStage.select() as MenuStage;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        targetedMenuRelay.backfillToClients(broadcast, current, newIds);
        console.log(
          '[Cadmium STCP TargetedMenu Relay] BOCR · backfilled', newIds.length, 'client(s) · stageIndex=',
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
    console.log('[Cadmium STCP TargetedMenu Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
