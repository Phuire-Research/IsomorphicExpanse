/*<$
For the graph programming framework Stratimux and the Web Socket Server Concept, generate a quality will append a series of action to the state's action que.
This will later be dispatched by the Web Socket Server Principle to the client.
$>*/
/*<#*/
import {
  Action,
  AnyAction,
  createQualityCardWithPayload,
  defaultMethodCreator,
  Quality,
  refreshAction,
  selectPayload,
} from 'stratimux';
import { WebSocketServerState, TargetedAction } from '../webSocketServer.concept';

export type RoutedAction = {
  action: AnyAction;
  targetClientStateKey: string; // Route to ALL connections with this key
};

export type WebSocketServerAppendToActionQuePayload = {
  actionQue: AnyAction[];
  targetClientStateKey?: string; // Route to all connections with this clientStateKey
  targetConnectionId?: string; // Route to specific connectionId (single socket)
};

export type WebSocketServerAppendToActionQue = Quality<
  WebSocketServerState,
  WebSocketServerAppendToActionQuePayload
>;
export const webSocketServerAppendToActionQue = createQualityCardWithPayload<
  WebSocketServerState,
  WebSocketServerAppendToActionQuePayload
>({
  type: 'Web Socket Server Append To Action Que',
  reducer: (state, action) => {
    const payload = selectPayload<WebSocketServerAppendToActionQuePayload>(action);
    console.log('[WebSocketServer] AppendToActionQue:', {
      actionCount: payload.actionQue.length,
      targetClientStateKey: payload.targetClientStateKey,
      targetConnectionId: payload.targetConnectionId,
    });

    if (payload.targetConnectionId) {
      // Route to specific connectionId (single socket)
      const targetedActions: TargetedAction[] = payload.actionQue.map((act) => ({
        action: refreshAction(act),
        destinationClientId: payload.targetConnectionId!,
      }));

      return {
        specificQue: [...state.specificQue, ...targetedActions],
      };
    } else if (payload.targetClientStateKey) {
      // Route to all connections with matching clientStateKey (multi-window)
      // Embed the targetClientStateKey in each action for the principle to route
      const routedActions: AnyAction[] = payload.actionQue.map((act) => {
        const refreshed = refreshAction(act);
        // Attach routing info to action for principle processing
        (refreshed as any)._targetClientStateKey = payload.targetClientStateKey;
        return refreshed;
      });

      return {
        actionQue: [...state.actionQue, ...routedActions],
      };
    } else {
      // NO routing specified - log warning, treat as global broadcast (exceptional case)
      console.warn(
        '[WebSocketServer] No routing specified - broadcasting to ALL clients (exceptional case)',
      );
      const actionQue: AnyAction[] = [];
      payload.actionQue.forEach((act) => {
        actionQue.push(refreshAction(act));
      });
      return {
        actionQue: [...state.actionQue, ...actionQue],
      };
    }
  },
  methodCreator: defaultMethodCreator,
});
/*#>*/
