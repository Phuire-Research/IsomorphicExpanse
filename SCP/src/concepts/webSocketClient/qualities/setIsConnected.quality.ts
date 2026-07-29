/*<$
For the graph programming framework Stratimux and the Web Socket Client Concept, generate a quality that will set the isConnected status.
This tracks the WebSocket connection state for UI reactivity.
$>*/
/*<#*/
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { WebSocketClientState } from '../webSocketClient.concept';

export type WebSocketClientSetIsConnectedPayload = {
  isConnected: boolean;
};

export const webSocketClientSetIsConnected = createQualityCardWithPayload<
  WebSocketClientState,
  WebSocketClientSetIsConnectedPayload
>({
  type: 'Web Socket Client Set Is Connected',
  reducer: (state, action) => {
    return {
      isConnected: action.payload.isConnected,
    };
  },
  methodCreator: defaultMethodCreator,
});
/*#>*/
