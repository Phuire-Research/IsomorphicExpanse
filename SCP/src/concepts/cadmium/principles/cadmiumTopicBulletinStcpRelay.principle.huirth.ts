/**
 * cadmiumTopicBulletinStcpRelay Principle (Topic Live Bulletin · folder-tree · SMRP + BOCR · Huirth)
 *
 * The FIRST folder-tree STCP relay — the SAME proven live-relay stack as the menu/topics/
 * researchBulletin relays, applied to the Cadmium Topic Bulletin via createLiveBulletin. Decoupled
 * from the other instances: frontier/ is the only coupling surface. The PRODUCER is built on the
 * factory; the CONSUMER (the LiveBulletin renderer, driven by cadmium.k.topicBulletin on the
 * CLIENT) re-renders when the relay action (cadmiumSetTopicBulletin · 'Cadmium Set Topic Bulletin')
 * reduces into the client slot.
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.cadmium.k.topicBulletin (the
 *     HUIRTH Base). On every Base change (the folder-tree merge dispatches cadmiumSetTopicBulletinHuirthBase
 *     FIRST), broadcast the relay action (cadmiumSetTopicBulletin) to ALL connected clients.
 *     { throttle: 0 } (DTBP) — selector-persistent low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a
 *     count INCREASE (new client joined), read the authoritative Huirth topicBulletin and backfill
 *     EACH newly-joined connectionId via targetConnectionId (no broadcast to existing clients).
 *
 * Deck: MuxiumDeck & { cadmium: CadmiumHuirthConcept-shape; webSocketServer }. BOCR reads
 * d.webSocketServer.k.webSocketClients + d.cadmium.k.topicBulletin (both flat Tier-1 in the
 * Huirth muxium · the same cross-concept co-muxified access the OkMonitor + other relays prove).
 *
 * PrincipleFunction generics bind the HUIRTH variants (CadmiumHuirthQualities /
 * CadmiumHuirthState) — NOT the client variants (mirrors cadmiumResearchBulletinStcpRelay · tsc verifies).
 *
 * Boot-skip: current.length === 0 (EMPTY_TOPIC_BULLETIN) → no Idle re-broadcast storm on boot
 * (mirrors the researchBulletin relay's length===0 skip · an array has no -1 sentinel · empty = the Idle seed).
 *
 * Citation: cadmiumResearchBulletinStcpRelay.principle.huirth.ts (the 3rd STCP instance · byte-for-byte mirror).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §W3 (selector topicBulletin · boot-skip length===0 · BOCR · cleanup).
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumHuirthQualities,
  CadmiumArticle,
} from '../cadmium.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import { type StcpBroadcastFn } from '../../../model/stcpComponentRelay.model';
import { cadmiumTopicBulletinStcpRelayPrincipleFactory } from '../cadmiumTopicBulletinRelay.config';

export type CadmiumTopicBulletinStcpRelayDeck = MuxiumDeck & {
  cadmium: Concept<CadmiumHuirthState, CadmiumHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type CadmiumTopicBulletinStcpRelayPrincipleType = PrincipleFunction<
  CadmiumHuirthQualities,
  CadmiumTopicBulletinStcpRelayDeck,
  CadmiumHuirthState
>;

export const cadmiumTopicBulletinStcpRelayPrinciple: CadmiumTopicBulletinStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Cadmium TopicBulletin STCP Relay] Principle started · SMRP + BOCR (Huirth)');

  // This principle's OWN helper instance (independent lastIdentity + no FSWatcher — SMRP/BOCR
  // never watch the disk; the OkMonitor owns the folder-tree watch). CLBF · sourced from the
  // factory's stcpRelayPrincipleFactory (single-source config · per-call fresh closure bundle).
  const topicBulletinRelay = cadmiumTopicBulletinStcpRelayPrincipleFactory();

  // BOCR closure var — last observed WebSocket pool count (mirrors the researchBulletin relay).
  let lastKnownCount = 0;

  const relayPlan = plan('Cadmium TopicBulletin STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on cadmium.k.topicBulletin → broadcast the relay to all clients.
    stage(
      ({ d, dispatch }) => {
        const current = d.cadmium.k.topicBulletin.select() as CadmiumArticle[];
        if (current.length === 0) {
          // Boot-skip · EMPTY_TOPIC_BULLETIN · no Idle re-broadcast storm.
          return;
        }
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
        // topicBulletin change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            { throttle: 0 },
          );
        topicBulletinRelay.broadcastToAll(broadcast, current);
        console.log('[Cadmium TopicBulletin STCP Relay] SMRP · topicBulletin broadcast · count=', current.length);
      },
      {
        selectors: [d_.cadmium.k.topicBulletin],
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
        const current = d.cadmium.k.topicBulletin.select() as CadmiumArticle[];
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        topicBulletinRelay.backfillToClients(broadcast, current, newIds);
        console.log(
          '[Cadmium TopicBulletin STCP Relay] BOCR · backfilled', newIds.length, 'client(s) · count=',
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
    console.log('[Cadmium TopicBulletin STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
