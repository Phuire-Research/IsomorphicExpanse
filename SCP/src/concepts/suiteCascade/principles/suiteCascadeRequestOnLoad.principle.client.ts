/**
 * suiteCascadeRequestOnLoad Principle — Client Deployment
 *
 * SCRR (Sentinel-Client-Request-Response) client leg — mirrors the proven
 * scsBridgeConnection.principle.client.ts SCRR mechanism exactly.
 *
 * WHY: The Huirth WCJF watcher fires SMRP + BOCR at boot, before the IUPA
 * island mounts and connects its WebSocket. By the time the SuiteCascade
 * island is live and its principle runs, SMRP has already broadcast and BOCR
 * has already backfilled any client that was in the pool at connect-time.
 * BUT the IUPA WebSocket may connect AFTER BOCR fires (or BOCR may target the
 * wrong connectionId on rapid reconnects). The server log confirms:
 *   - Huirth side HEALTHY · cascadeJson present · activeCascadeFiles= 5
 *   - Client never receives 'Suite Cascade Set Cascade Relay'
 *
 * SCRR closes this by having the client EXPLICITLY REQUEST the current cascade
 * on boot — the server's SCRR handler reads Huirth state and responds directly
 * to the requesting connection (or broadcasts, matching the scsBridge SCRR
 * broadcast decision).
 *
 * Mechanism:
 *   1. On principle boot, dispatch webSocketClientAppendToActionQue with the
 *      SCRR sentinel action ('Suite Cascade Send Cascade Request') into the
 *      webSocketClient's queue.
 *   2. webSocketClient.principle drains the queue over WebSocket.
 *   3. Server receives the sentinel · suiteCascadeSendCascadeRequest quality
 *      detects the type string · reads Huirth cascades state · dispatches
 *      suiteCascadeSetCascadeRelay + suiteCascadeSetActiveCascadeFilesRelay
 *      for every cascade entry via webSocketServerAppendToActionQue (BROADCAST).
 *   4. Client receives 'Suite Cascade Set Cascade Relay' → cascades populated →
 *      subscription fires → DOPR/ACFR render the General Diamond/Onyx + files.
 *
 * PrincipleFunction-void idiom: fire-once plan (two-stage: dispatch + conclude).
 * No selectors — this is a boot-time one-shot, not a reactive loop.
 *
 * Citation: scsBridgeConnection.principle.client.ts (SCRR client leg · sentinel pattern)
 * Citation: suiteCascadeBackfillOnConnect.principle.huirth.ts (BOCR · complementary)
 * Citation: scp.protocol.ts §a_trigger (webSocketClientAppendToActionQue dispatch)
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 */
import { createAction } from 'stratimux';
import type { PrincipleFunction, MuxiumDeck, Action } from 'stratimux';
import type {
  SuiteCascadeState,
  SuiteCascadeQualities,
  SuiteCascadeDeck,
} from '../suiteCascade.type';

export const SUITE_CASCADE_REQUEST_SENTINEL = '__suite_cascade_cascade_request__';

export const SUITE_CASCADE_REQUEST_ACTION_TYPE = 'Suite Cascade Send Cascade Request';

export type SuiteCascadeRequestOnLoadPrinciple = PrincipleFunction<
  SuiteCascadeQualities,
  MuxiumDeck & SuiteCascadeDeck,
  SuiteCascadeState
>;

export const suiteCascadeRequestOnLoadPrinciple: SuiteCascadeRequestOnLoadPrinciple = ({ plan }) => {
  console.log('[SuiteCascade SCRR] Request-On-Load principle started');

  const requestPlan = plan('SuiteCascade Request On Load (Client SCRR)', ({ stage, conclude }) => [
    stage(({ d, dispatch }) => {
      console.log('[SuiteCascade SCRR] Dispatching cascade request sentinel to webSocketClient queue');
      const sentinelAction = createAction(SUITE_CASCADE_REQUEST_ACTION_TYPE, {
        payload: { sentinel: SUITE_CASCADE_REQUEST_SENTINEL },
      });
      dispatch(
        (d as any).client.d.webSocketClient.e.webSocketClientAppendToActionQue({
          actionQue: [sentinelAction as unknown as Action],
        }),
        { iterateStage: true },
      );
    }),
    conclude(),
  ]);

  return () => {
    console.log('[SuiteCascade SCRR] Request-On-Load principle cleanup');
    requestPlan.conclude();
  };
};
