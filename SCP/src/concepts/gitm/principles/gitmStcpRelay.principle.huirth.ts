/**
 * gitmStcpRelay Principle (STCP · SMRP + BOCR · Huirth)
 *
 * The two halves of the proven live-relay stack, applied to the gitm.json snapshot via
 * the STCP helper (clone of cadmiumMenuStcpRelay.principle.huirth.ts):
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.gitm.k.gitmJson. On
 *     every Base change (the gitmJsonWatcher dir-watch dispatches gitmSetGitmJsonHuirthBase
 *     FIRST), broadcast the relay action (gitmSetGitmJson) to ALL connected clients.
 *     { throttle: 0 } (DTBP) — selector-persistent low-beat plan opts out of halting overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count.
 *     On a count INCREASE (new client joined), read the authoritative Huirth gitmJson and
 *     backfill EACH newly-joined connectionId via targetConnectionId.
 *
 * This principle's OWN helper instance (independent lastIdentity from the watcher's
 * instance · SMRP/BOCR never watch the disk; the gitmJsonWatcher owns the dir-watch).
 *
 * PrincipleFunction generics bind the HUIRTH variants (GitmHuirthQualities /
 * GitmHuirthState) — NOT the client variants (S4 REFINEMENT NOTE · cadmium precedent).
 *
 * Boot-skip: gitmJson.lastReadAt === 0 (the GITM_JSON_EMPTY_SENTINEL · no Idle re-broadcast
 * storm on boot · mirrors the cadmium stageIndex === -1 boot-skip).
 *
 * Citation: cadmiumMenuStcpRelay.principle.huirth.ts (SMRP+BOCR pattern source · Huirth generics).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W2 gitmStcpRelay.
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  GitmHuirthState,
  GitmHuirthQualities,
  GitmJsonShape,
} from '../gitm.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import {
  createStcpComponentRelay,
  type StcpBroadcastFn,
} from '../../../model/stcpComponentRelay.model';
import { GITM_RELAY_CONFIG } from '../gitmRelay.config';

export type GitmStcpRelayDeck = MuxiumDeck & {
  gitm: Concept<GitmHuirthState, GitmHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type GitmStcpRelayPrincipleType = PrincipleFunction<
  GitmHuirthQualities,
  GitmStcpRelayDeck,
  GitmHuirthState
>;

export const gitmStcpRelayPrinciple: GitmStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[GITM STCP Relay] Principle started · SMRP + BOCR (Huirth)');

  // This principle's OWN helper instance (independent lastIdentity + no FSWatcher — SMRP/BOCR
  // never watch the disk; the gitmJsonWatcher owns the dir-watch). Config single-source.
  const gitmRelay = createStcpComponentRelay<GitmJsonShape | null>(GITM_RELAY_CONFIG);

  // BOCR closure var — last observed WebSocket pool count.
  let lastKnownCount = 0;

  const relayPlan = plan('GITM STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on gitm.k.gitmJson → broadcast the relay to all clients.
    stage(
      ({ d, dispatch }) => {
        const current = d.gitm.k.gitmJson.select() as GitmJsonShape;
        if (!current || current.lastReadAt === 0) {
          // Boot-skip · GITM_JSON_EMPTY_SENTINEL · no Idle re-broadcast storm.
          return;
        }
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
        // gitmJson change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            { throttle: 0 },
          );
        gitmRelay.broadcastToAll(broadcast, current);
        // NO per-broadcast stdout log — it floods the Template SCP's stdout (the relay can fire
        // ~1×/s), which STARVES the dev:self TSID auto-spawn idle-detector (dev.ts waits for 3s of
        // SCP-stdout silence before spawning the Electron window). The flood = the window never
        // opens. The broadcast itself is the functional Lambda; the log was pure debug noise.
      },
      {
        selectors: [d_.gitm.k.gitmJson],
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

        // Huirth state (authoritative after the Base dispatch keeps it current).
        const current = d.gitm.k.gitmJson.select() as GitmJsonShape;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        gitmRelay.backfillToClients(broadcast, current, newIds);
        console.log(
          '[GITM STCP Relay] BOCR · backfilled', newIds.length, 'client(s) · lastReadAt=',
          current.lastReadAt,
        );
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[GITM STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
