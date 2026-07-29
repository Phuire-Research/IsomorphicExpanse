/**
 * cadmiumTopicsStcpRelay Principle (Diamond RFI · 2nd STCP · SMRP + BOCR · Huirth)
 *
 * The 2nd STCP instance — the SAME proven live-relay stack as the menu relay, applied to the
 * Cadmium topics via the STCP helper. Decoupled from the menu instance: topics.json is the only
 * coupling surface (TSSL). The PRODUCER is rebuilt on the helper; the CONSUMER (the existing
 * CadmiumBulletin Research Frontier zone, driven by cadmium.k.topics on the CLIENT) is reused
 * untouched — the relay action (cadmiumSetTopics · 'Cadmium Set Topics') reduces into the client
 * topics slot exactly as the legacy direct-broadcast did.
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.cadmium.k.topics (the HUIRTH
 *     Base). On every Base change (the dir-watch dispatches cadmiumSetTopicsHuirthBase FIRST),
 *     broadcast the relay action (cadmiumSetTopics) to ALL connected clients. { throttle: 0 }
 *     (DTBP) — selector-persistent low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a
 *     count INCREASE (new client joined), read the authoritative Huirth topics and backfill EACH
 *     newly-joined connectionId via targetConnectionId (no broadcast to existing clients).
 *
 * Deck: MuxiumDeck & { cadmium: CadmiumHuirthConcept-shape; webSocketServer }. BOCR reads
 * d.webSocketServer.k.webSocketClients + d.cadmium.k.topics (both flat Tier-1 in the Huirth
 * muxium · the same cross-concept co-muxified access the OkMonitor + menu relay prove).
 *
 * PrincipleFunction generics bind the HUIRTH variants (CadmiumHuirthQualities /
 * CadmiumHuirthState) — NOT the client variants (mirrors cadmiumMenuStcpRelay · tsc verifies).
 *
 * Boot-skip: current.length === 0 (EMPTY_TOPICS) → no Idle re-broadcast storm on boot (replaces
 * the menu relay's stageIndex === -1 skip · an array has no -1 sentinel · empty = the Idle seed).
 *
 * Citation: cadmiumMenuStcpRelay.principle.huirth.ts (the 1st STCP instance · byte-for-byte mirror).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: RFI-DIAMOND-WGB.md §PART B (RFSCI · TRIBS · TSSL · boot-skip length===0).
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumHuirthQualities,
  CadmiumTopic,
} from '../cadmium.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import {
  createStcpComponentRelay,
  type StcpBroadcastFn,
} from '../../../model/stcpComponentRelay.model';
import { CADMIUM_TOPICS_RELAY_CONFIG } from '../cadmiumTopicsRelay.config';

export type CadmiumTopicsStcpRelayDeck = MuxiumDeck & {
  cadmium: Concept<CadmiumHuirthState, CadmiumHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type CadmiumTopicsStcpRelayPrincipleType = PrincipleFunction<
  CadmiumHuirthQualities,
  CadmiumTopicsStcpRelayDeck,
  CadmiumHuirthState
>;

export const cadmiumTopicsStcpRelayPrinciple: CadmiumTopicsStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Cadmium Topics STCP Relay] Principle started · SMRP + BOCR (Huirth)');

  // This principle's OWN helper instance (independent lastIdentity + no FSWatcher — SMRP/BOCR
  // never watch the disk; the OkMonitor owns the dir-watch). Config single-source.
  const topicsRelay = createStcpComponentRelay<CadmiumTopic[]>(CADMIUM_TOPICS_RELAY_CONFIG);

  // BOCR closure var — last observed WebSocket pool count (mirrors the menu relay).
  let lastKnownCount = 0;

  const relayPlan = plan('Cadmium Topics STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on cadmium.k.topics → broadcast the relay to all clients.
    stage(
      ({ d, dispatch }) => {
        const current = d.cadmium.k.topics.select() as CadmiumTopic[];
        if (current.length === 0) {
          // Boot-skip · EMPTY_TOPICS · no Idle re-broadcast storm.
          return;
        }
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
        // topics change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            { throttle: 0 },
          );
        topicsRelay.broadcastToAll(broadcast, current);
        console.log('[Cadmium Topics STCP Relay] SMRP · topics broadcast · count=', current.length);
      },
      {
        selectors: [d_.cadmium.k.topics],
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
        const current = d.cadmium.k.topics.select() as CadmiumTopic[];
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        topicsRelay.backfillToClients(broadcast, current, newIds);
        console.log(
          '[Cadmium Topics STCP Relay] BOCR · backfilled', newIds.length, 'client(s) · count=',
          current.length,
        );
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[Cadmium Topics STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
