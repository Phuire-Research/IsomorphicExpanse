import { createQualityCardWithPayload, selectPayload, Quality } from 'stratimux';
import type { WebSocketServerState } from '../webSocketServer.concept';

export type DeleteStaleClientStatePayload = {
  clientStateKey: string;
};

export const webSocketServerDeleteStaleClientState = createQualityCardWithPayload<
  WebSocketServerState,
  DeleteStaleClientStatePayload
>({
  type: 'Web Socket Server Delete Stale Client State',
  reducer: (state, action) => {
    const { clientStateKey } = selectPayload<DeleteStaleClientStatePayload>(action);

    // Remove from clientStates
    const updatedClientStates = { ...state.clientStates };
    delete updatedClientStates[clientStateKey];

    // Remove from connectionPools
    const updatedConnectionPools = { ...state.connectionPools };
    delete updatedConnectionPools[clientStateKey];

    console.log(`[WebSocketServer] Deleted stale client state: ${clientStateKey}`);

    return {
      clientStates: updatedClientStates,
      connectionPools: updatedConnectionPools,
    };
  },
});

export type WebSocketServerDeleteStaleClientState = Quality<
  WebSocketServerState,
  DeleteStaleClientStatePayload
>;
