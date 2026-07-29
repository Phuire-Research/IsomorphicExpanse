/**
 * graphiteScribeMenuStcpRelay Principle (PRE-EPOCH · BSSM keyed · STCP · SMRP + BOCR · Huirth)
 *
 * The keyed-Record generalization of the scalar live-relay stack. The two halves of the proven
 * live-relay pattern, now applied to the graphiteScribe keyed `shatteriteMenus` Record:
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.graphiteScribe.k.shatteriteMenus (the
 *     WHOLE Record · any-key change fires). On every Base change (the N-watcher dir-watch dispatches
 *     graphiteScribeSetDesignationMenuStageHuirthBase FIRST), diff the Record against the last-known snapshot
 *     to find WHICH designation(s) changed, then broadcast the keyed relay (graphiteScribeSetDesignationMenuStage)
 *     for each changed designation to ALL connected clients. { throttle: 0 } (DTBP) — selector-persistent
 *     low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a count
 *     INCREASE (new client joined), read the authoritative Huirth shatteriteMenus Record and backfill
 *     EACH newly-joined connectionId with the keyed relay for EVERY non-empty designation stage (no
 *     broadcast to existing clients).
 *
 * Deck: MuxiumDeck & { graphiteScribe: GraphiteScribeHuirthConcept; webSocketServer }. Reads d.graphiteScribe.k.shatteriteMenus
 * + d.webSocketServer.k.webSocketClients (both flat Tier-1 in the Huirth muxium).
 *
 * Boot-skip: per-designation stageIndex === -1 (EMPTY_MENU_STAGE) → no Idle re-broadcast storm.
 *
 * Citation: PRE-EPOCH-S6-PURPLE-COMPOSITION.md §Wave 2 (the keyed-Record SMRP · designation-diff broadcast).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  GraphiteScribeHuirthState,
  GraphiteScribeHuirthQualities,
} from '../graphiteScribe.type';
import type { MenuDocument } from '../../../model/shatteriteMenu.model';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import {
  createStcpComponentRelay,
  type StcpBroadcastFn,
} from '../../../model/stcpComponentRelay.model';
import { createGraphiteScribeDesignationRelayConfig, menuStageContentIdentity } from '../graphiteScribeMenuRelay.config';

export type GraphiteScribeMenuStcpRelayDeck = MuxiumDeck & {
  graphiteScribe: Concept<GraphiteScribeHuirthState, GraphiteScribeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type GraphiteScribeMenuStcpRelayPrincipleType = PrincipleFunction<
  GraphiteScribeHuirthQualities,
  GraphiteScribeMenuStcpRelayDeck,
  GraphiteScribeHuirthState
>;

export const graphiteScribeMenuStcpRelayPrinciple: GraphiteScribeMenuStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[GraphiteScribe STCP Relay] Principle started · keyed SMRP + BOCR (Huirth)');

  // Per-designation helper instances are built on demand (the keyed relay config carries the
  // designation-bound action creators). Cache them so the broadcast/backfill arms reuse one instance
  // per designation (independent lastIdentity is irrelevant here — SMRP/BOCR never watch the disk).
  const relayCache = new Map<string, ReturnType<typeof createStcpComponentRelay<MenuDocument>>>();
  const relayFor = (designation: string) => {
    let r = relayCache.get(designation);
    if (!r) {
      r = createStcpComponentRelay<MenuDocument>(createGraphiteScribeDesignationRelayConfig(designation));
      relayCache.set(designation, r);
    }
    return r;
  };

  // SMRP diff snapshot — last broadcast CONTENT identity per designation (C761 · the S4 finding:
  // the prior bare-stageIndex compare suppressed every in-place edit even after the watcher's
  // content-hash fix — this Map was the second, unreformed gate).
  const lastBroadcastIdentity = new Map<string, string>();
  // BOCR closure var — last observed WebSocket pool count (mirrors the scalar precedent).
  let lastKnownCount = 0;

  const relayPlan = plan('GraphiteScribe Menu STCP Relay (keyed SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on graphiteScribe.k.shatteriteMenus (whole Record) → diff → broadcast changed.
    stage(
      ({ d, dispatch }) => {
        const record = d.graphiteScribe.k.shatteriteMenus.select() as Record<string, MenuDocument>;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
            // shatteriteMenus change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
            { throttle: 0 },
          );
        for (const [designation, stageVal] of Object.entries(record)) {
          if (!stageVal || stageVal.stages.length === 0) {
            // Boot-skip · EMPTY_MENU_STAGE · no Idle re-broadcast storm.
            continue;
          }
          const contentIdentity = menuStageContentIdentity(stageVal);
          if (lastBroadcastIdentity.get(designation) === contentIdentity) {
            continue; // unchanged CONTENT for this designation — suppress (C761 · hash, not index).
          }
          lastBroadcastIdentity.set(designation, contentIdentity);
          relayFor(designation).broadcastToAll(broadcast, stageVal);
          console.log(
            '[GraphiteScribe STCP Relay] SMRP · broadcast', designation, '· currentStageIndex=', stageVal.currentStageIndex,
          );
        }
      },
      {
        selectors: [d_.graphiteScribe.k.shatteriteMenus],
        beat: 1,
      },
    ),

    // BOCR — selector-reactive on webSocketClients pool count INCREASE → targeted backfill of EVERY
    // non-empty designation stage to each newly-joined connectionId.
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

        const record = d.graphiteScribe.k.shatteriteMenus.select() as Record<string, MenuDocument>;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        for (const [designation, stageVal] of Object.entries(record)) {
          if (!stageVal || stageVal.stages.length === 0) continue; // skip empty stages.
          relayFor(designation).backfillToClients(broadcast, stageVal, newIds);
        }
        console.log(
          '[GraphiteScribe STCP Relay] BOCR · backfilled', newIds.length, 'client(s) ·',
          Object.keys(record).length, 'designation(s)',
        );
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[GraphiteScribe STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
