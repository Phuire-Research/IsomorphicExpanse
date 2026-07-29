/*<$
For the graph programming framework Stratimux and the Web Socket Client Concept, generate a quality that will append a series of actions to that state's action que.
This action que will later be dispatch by the Web Socket Client Principle to the server.
$>*/
/*<#*/
import {
  createQualityCardWithPayload,
  defaultMethodCreator,
  refreshAction,
  selectPayload,
} from 'stratimux';
import type { AnyAction } from 'stratimux';
import type { WebSocketClientState } from '../webSocketClient.concept';

export type WebSocketClientAppendToActionQuePayload = {
  actionQue: AnyAction[];
};

export const webSocketClientAppendToActionQue = createQualityCardWithPayload<
  WebSocketClientState,
  WebSocketClientAppendToActionQuePayload
>({
  type: 'Web Socket Client Append To Action Que',
  reducer: (state, action) => {
    const payload = action.payload;
    console.log('[DualDispatch] WebSocketClient: APPENDING TO QUEUE');
    console.log(
      '[DualDispatch] WebSocketClient: Actions to append:',
      payload.actionQue.map((a) => a.type),
    );
    console.log('[DualDispatch] WebSocketClient: Current queue length:', state.actionQue.length);
    const actionQue = state.actionQue;
    payload.actionQue.forEach((act) => {
      console.log('[DualDispatch] WebSocketClient: Appending action:', act.type);
      if (act.type === 'buildPlatform Universal CRUD Trigger') {
        console.log('[DualDispatch] WebSocketClient: Universal CRUD payload:', act.payload);
      }
      actionQue.push(refreshAction(act));
    });
    console.log('[DualDispatch] WebSocketClient: New queue length:', actionQue.length);
    return {
      actionQue: [...actionQue],
    };
  },
  methodCreator: defaultMethodCreator,
});
/*#>*/
