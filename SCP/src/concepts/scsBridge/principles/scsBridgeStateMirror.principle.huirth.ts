/**
 * scsBridgeStateMirror Principle (SMRP) · Cycle 163 R5 · Bug D PushFix Architectural Addition
 *
 * Selector-driven state mirror — observes the SCS-Bridge's OWN state (bridgeJson + sessionsList)
 * and emits explicit broadcast to all connected clients on every state change.
 *
 * WHY: The watcher principle (scsBridgeJsonWatcher) correctly updates server-side state via
 * setBridgeJsonRelay/setSessionsListRelay reducers (post-DTBP fix) but the documented
 * actionExchange.serverToClient mechanism (scsBridge.muxonomy.ts:81) does NOT reliably broadcast
 * to existing connections on every reducer fire. Evidence: log shows reducer fires at 17:16:58
 * with count=18 (new session added to state) but no corresponding WebSocket broadcast within
 * 47 seconds. Force-refresh restores state (BOCR-S backfill works) confirming the issue is
 * scoped to ongoing change propagation, not initial connect.
 *
 * HOW: This principle selects on the state directly. When state changes, dispatches
 * webSocketServerAppendToActionQue with broadcast target (no targetConnectionId) — the same
 * proven broadcast path BOCR-S uses successfully for connect-time backfill. The two paths
 * converge on identical broadcast Quality, ensuring same delivery semantic.
 *
 * Pattern: SMRP — State-Mirror-Reactive-Principle — canonical "keep manifold synced" pattern
 * for Stratimux scenarios where reducer-only state updates need broadcast propagation.
 *
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md · scsBridgeBackfillOnConnect.principle.huirth.ts
 */
import type { PrincipleFunction, MuxiumDeck, Concept, Action, AnyAction } from 'stratimux';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthQualities,
  BridgeJsonShape,
  ScsBridgeSessionEntry,
  ScsBridgeSetBridgeJsonRelayPayload,
  ScsBridgeSetSessionsListRelayPayload,
} from '../scsBridge.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';

type ScsBridgeStateMirrorDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

type ScsBridgeStateMirrorInternalDeck = {
  scsBridge: {
    e: {
      scsBridgeSetBridgeJsonRelay: (payload: ScsBridgeSetBridgeJsonRelayPayload) => Action;
      scsBridgeSetSessionsListRelay: (payload: ScsBridgeSetSessionsListRelayPayload) => Action;
    };
  };
  webSocketServer: {
    e: {
      webSocketServerAppendToActionQue: (payload: {
        actionQue: AnyAction[];
        targetClientStateKey?: string;
        targetConnectionId?: string;
      }) => Action;
    };
  };
};

export type ScsBridgeStateMirrorPrincipleType = PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeStateMirrorDeck,
  ScsBridgeHuirthState
>;

export const scsBridgeStateMirrorPrinciple: ScsBridgeStateMirrorPrincipleType = ({
  d_,
  plan,
}) => {
  console.log('[SCS-Bridge SMRP] Principle started · State-Mirror-Reactive-Principle');

  const mirrorPlan = plan('ScsBridge State Mirror (SMRP · Huirth)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        const bridgeJson = d.scsBridge.k.bridgeJson.select() as BridgeJsonShape | null;
        const sessionsList = d.scsBridge.k.sessionsList.select() as ScsBridgeSessionEntry[];

        // Boot skip · log shows bridgeJson is null-initialized (NOT undefined) at boot ·
        // need to detect actual empty-shape · skip when neither state field has meaningful content.
        // Citation: Cycle 163 R5 SMRP-DTBP fix · debug.json L426 evidence (fired with endpoint=undefined sessionsList.length=0).
        const hasState =
          (bridgeJson !== null && bridgeJson !== undefined) ||
          (Array.isArray(sessionsList) && sessionsList.length > 0);
        if (!hasState) {
          console.log('[SCS-Bridge SMRP] Skipping boot fire · no state yet · bridgeJson=', bridgeJson, '· sessionsList=', sessionsList);
          return;
        }

        console.log(
          '[SCS-Bridge SMRP] State change detected · broadcasting · bridgeJson.endpoint=',
          (bridgeJson as BridgeJsonShape | null)?.endpoint,
          '· sessionsList.length=',
          Array.isArray(sessionsList) ? sessionsList.length : 0,
        );

        const serverStartupTime = d.scsBridge.k.serverStartupTime.select() as number | null;
        const internalDeck = d as unknown as ScsBridgeStateMirrorInternalDeck;

        const relayAction = internalDeck.scsBridge.e.scsBridgeSetBridgeJsonRelay({
          scsBridgeBridgeJson: bridgeJson,
          serverStartupTime: serverStartupTime ?? null,
        });
        const sessionsAction = internalDeck.scsBridge.e.scsBridgeSetSessionsListRelay({
          scsBridgeSessionsList: Array.isArray(sessionsList) ? sessionsList : [],
        });

        // DTBP · Dispatch-Throttle-Bypass-Protocol · Cycle 163 R5 SMRP-DTBP fix
        // This plan is selector-driven with { beat: 1 } intentionally persistent — must re-fire
        // on every bridgeJson/sessionsList state change. Default dispatch({}) triggers Stratimux's
        // halting protection (DELETED PLAN) after first fire · evidence: debug.json L426 SMRP
        // fired ONCE at 17:28:59.815 then went silent across multiple subsequent state changes.
        // { throttle: 0 } explicitly opts out of recursion-overflow check for low-beat plans.
        // Cite: feedback_stratimux_dispatch_throttle_discipline.md
        dispatch(
          internalDeck.webSocketServer.e.webSocketServerAppendToActionQue({
            actionQue: [relayAction, sessionsAction],
          }),
          { throttle: 0 },
        );
      },
      {
        selectors: [d_.scsBridge.k.bridgeJson, d_.scsBridge.k.sessionsList],
        // MD-4 P3 · raised 1 → 100 (defense-in-depth): at beat:1 the M17 write storm drove this
        // plan faster than Stratimux allows — halting protection culled it (DELETED PLAN) and the
        // SCP silently lost its reactive broadcast. P2 removes the storm; this bounds the rate.
        beat: 100,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge SMRP] Principle cleanup');
    mirrorPlan.conclude();
  };
};
