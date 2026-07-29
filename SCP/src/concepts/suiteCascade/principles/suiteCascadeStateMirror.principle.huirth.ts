/**
 * suiteCascadeStateMirror Principle (SMRP) · Refining Cascade D2 · Option C
 *
 * Selector-driven state mirror — observes the SuiteCascade huirth `cascades` Record
 * and emits an explicit WebSocket broadcast to all connected clients on every state
 * change.
 *
 * WHY: The watcher principle (suiteCascadeJsonWatcher) dispatches relay actions via
 * nextA but the actionExchange.serverToClient mechanism does NOT reliably broadcast
 * to existing connections on every reducer fire. Without SMRP, the relay reducer
 * fires on Huirth but goes nowhere — no client ever receives the populated cascades.
 *
 * HOW: Selects on d_.suiteCascade.k.cascades. On state change, iterates over every
 * cascade entry and dispatches webSocketServerAppendToActionQue with a [cascadeRelay,
 * filesRelay] pair for each registered cascade — no targetConnectionId (broadcast to
 * all). { throttle: 0 } opts out of halting protection for this selector-persistent
 * plan (mirrors the scsBridge SMRP-DTBP discipline).
 *
 * Pattern: SMRP — State-Mirror-Reactive-Principle — mirrors
 * scsBridgeStateMirror.principle.huirth.ts 1:1 with suiteCascade state shape.
 *
 * Citation: scsBridgeStateMirror.principle.huirth.ts (SMRP/DTBP pattern source)
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 })
 * Citation: REFINE-D2-S1-RED-CASCADEJSON.md §3 (root cause analysis)
 */
import type { PrincipleFunction, MuxiumDeck, Concept, Action, AnyAction } from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeHuirthQualities,
  SuiteCascadeSetCascadeRelayPayload,
  SuiteCascadeSetActiveCascadeFilesRelayPayload,
} from '../suiteCascade.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';

type SuiteCascadeStateMirrorDeck = MuxiumDeck & {
  suiteCascade: Concept<SuiteCascadeHuirthState, SuiteCascadeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

type SuiteCascadeStateMirrorInternalDeck = {
  suiteCascade: {
    e: {
      suiteCascadeSetCascadeRelay: (payload: SuiteCascadeSetCascadeRelayPayload) => Action;
      suiteCascadeSetActiveCascadeFilesRelay: (payload: SuiteCascadeSetActiveCascadeFilesRelayPayload) => Action;
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

export type SuiteCascadeStateMirrorPrincipleType = PrincipleFunction<
  SuiteCascadeHuirthQualities,
  SuiteCascadeStateMirrorDeck,
  SuiteCascadeHuirthState
>;

export const suiteCascadeStateMirrorPrinciple: SuiteCascadeStateMirrorPrincipleType = ({
  d_,
  plan,
}) => {
  console.log('[SuiteCascade SMRP] Principle started · State-Mirror-Reactive-Principle');

  const mirrorPlan = plan('SuiteCascade State Mirror (SMRP · Huirth)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        const cascades = d.suiteCascade.k.cascades.select();

        if (!cascades || Object.keys(cascades).length === 0) {
          console.log('[SuiteCascade SMRP] Skipping boot fire · cascades empty');
          return;
        }

        const internalDeck = d as unknown as SuiteCascadeStateMirrorInternalDeck;
        const relayActions: AnyAction[] = [];

        for (const cascade of Object.values(cascades)) {
          if (!cascade) {
            continue;
          }

          console.log(
            '[SuiteCascade SMRP] Broadcasting cascade · name=',
            cascade.name,
            '· cascadeJson=',
            cascade.cascadeJson ? 'present' : 'null',
            '· activeCascadeFiles=',
            cascade.activeCascadeFiles?.length ?? 0,
          );

          relayActions.push(
            internalDeck.suiteCascade.e.suiteCascadeSetCascadeRelay({
              name: cascade.name,
              cascade,
            }),
          );
          relayActions.push(
            internalDeck.suiteCascade.e.suiteCascadeSetActiveCascadeFilesRelay({
              name: cascade.name,
              activeCascadeFiles: cascade.activeCascadeFiles ?? [],
            }),
          );
        }

        if (relayActions.length === 0) {
          return;
        }

        // DTBP · Dispatch-Throttle-Bypass-Protocol · selector-persistent plan must
        // re-fire on every cascades state change. { throttle: 0 } opts out of the
        // halting protection recursion-overflow check for low-beat plans.
        // Citation: feedback_stratimux_dispatch_throttle_discipline.md
        dispatch(
          internalDeck.webSocketServer.e.webSocketServerAppendToActionQue({
            actionQue: relayActions,
          }),
          { throttle: 0 },
        );
      },
      {
        selectors: [d_.suiteCascade.k.cascades],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[SuiteCascade SMRP] Principle cleanup');
    mirrorPlan.conclude();
  };
};
