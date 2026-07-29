/**
 * cadmiumResearchBulletinStcpRelay Principle (Diamond RAR · 3rd STCP · SMRP + BOCR · Huirth)
 *
 * The 3rd STCP instance — the SAME proven live-relay stack as the menu + topics relays, applied to
 * the Cadmium targeted ResearchBulletin via the STCP helper. Decoupled from the menu/topics
 * instances: targeted/researchBulletin.json is the only coupling surface. The PRODUCER is rebuilt
 * on the helper; the CONSUMER (the CadmiumResearchBulletin renderer, driven by
 * cadmium.k.researchBulletin on the CLIENT) re-renders when the relay action
 * (cadmiumSetResearchBulletin · 'Cadmium Set Research Bulletin') reduces into the client slot.
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.cadmium.k.researchBulletin (the
 *     HUIRTH Base). On every Base change (the dir-watch dispatches cadmiumSetResearchBulletinHuirthBase
 *     FIRST), broadcast the relay action (cadmiumSetResearchBulletin) to ALL connected clients.
 *     { throttle: 0 } (DTBP) — selector-persistent low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a
 *     count INCREASE (new client joined), read the authoritative Huirth researchBulletin and backfill
 *     EACH newly-joined connectionId via targetConnectionId (no broadcast to existing clients).
 *
 * Deck: MuxiumDeck & { cadmium: CadmiumHuirthConcept-shape; webSocketServer }. BOCR reads
 * d.webSocketServer.k.webSocketClients + d.cadmium.k.researchBulletin (both flat Tier-1 in the
 * Huirth muxium · the same cross-concept co-muxified access the OkMonitor + menu/topics relays prove).
 *
 * PrincipleFunction generics bind the HUIRTH variants (CadmiumHuirthQualities /
 * CadmiumHuirthState) — NOT the client variants (mirrors cadmiumTopicsStcpRelay · tsc verifies).
 *
 * Boot-skip: current.length === 0 (EMPTY_RESEARCH_BULLETIN) → no Idle re-broadcast storm on boot
 * (mirrors the topics relay's length===0 skip · an array has no -1 sentinel · empty = the Idle seed).
 *
 * Citation: cadmiumTopicsStcpRelay.principle.huirth.ts (the 2nd STCP instance · byte-for-byte mirror).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: RAR-DIAMOND-WGB.md §W2 (selector researchBulletin · boot-skip length===0 · BOCR · cleanup).
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
import { cadmiumResearchBulletinStcpRelayPrincipleFactory } from '../cadmiumResearchBulletinRelay.config';

export type CadmiumResearchBulletinStcpRelayDeck = MuxiumDeck & {
  cadmium: Concept<CadmiumHuirthState, CadmiumHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type CadmiumResearchBulletinStcpRelayPrincipleType = PrincipleFunction<
  CadmiumHuirthQualities,
  CadmiumResearchBulletinStcpRelayDeck,
  CadmiumHuirthState
>;

export const cadmiumResearchBulletinStcpRelayPrinciple: CadmiumResearchBulletinStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Cadmium ResearchBulletin STCP Relay] Principle started · SMRP + BOCR (Huirth)');

  // This principle's OWN helper instance (independent lastIdentity + no FSWatcher — SMRP/BOCR
  // never watch the disk; the OkMonitor owns the dir-watch). CLBF · sourced from the factory's
  // stcpRelayPrincipleFactory (single-source config · per-call fresh closure bundle).
  const researchBulletinRelay = cadmiumResearchBulletinStcpRelayPrincipleFactory();

  // BOCR closure var — last observed WebSocket pool count (mirrors the topics relay).
  let lastKnownCount = 0;

  const relayPlan = plan('Cadmium ResearchBulletin STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on cadmium.k.researchBulletin → broadcast the relay to all clients.
    stage(
      ({ d, dispatch }) => {
        const current = d.cadmium.k.researchBulletin.select() as CadmiumArticle[];
        if (current.length === 0) {
          // Boot-skip · EMPTY_RESEARCH_BULLETIN · no Idle re-broadcast storm.
          return;
        }
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
        // researchBulletin change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            { throttle: 0 },
          );
        researchBulletinRelay.broadcastToAll(broadcast, current);
        console.log('[Cadmium ResearchBulletin STCP Relay] SMRP · researchBulletin broadcast · count=', current.length);
      },
      {
        selectors: [d_.cadmium.k.researchBulletin],
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
        const current = d.cadmium.k.researchBulletin.select() as CadmiumArticle[];
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        researchBulletinRelay.backfillToClients(broadcast, current, newIds);
        console.log(
          '[Cadmium ResearchBulletin STCP Relay] BOCR · backfilled', newIds.length, 'client(s) · count=',
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
    console.log('[Cadmium ResearchBulletin STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
