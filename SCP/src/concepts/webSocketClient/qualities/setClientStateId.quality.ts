/*<$
For the graph programming framework Stratimux and the Web Socket Client Concept, generate a quality that will set the clientStateId.
This ID is persisted in localStorage and sent to the server on connection to maintain client identity across sessions.
$>*/
/*<#*/
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { WebSocketClientState } from '../webSocketClient.concept';

export type WebSocketClientSetClientStateIdPayload = {
  clientStateId: string | null;
};

export const webSocketClientSetClientStateId = createQualityCardWithPayload<
  WebSocketClientState,
  WebSocketClientSetClientStateIdPayload
>({
  type: 'Web Socket Client Set Client State Id',
  reducer: (state, action) => {
    return {
      clientStateId: action.payload.clientStateId,
    };
  },
  methodCreator: defaultMethodCreator,
});
/*#>*/
