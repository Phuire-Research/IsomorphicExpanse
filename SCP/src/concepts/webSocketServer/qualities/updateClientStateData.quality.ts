import { createQualityCardWithPayload, selectPayload, Quality } from 'stratimux';
import type { WebSocketServerState } from '../webSocketServer.concept';
import type { PersistedClientState } from '../model/webSocketClient.model';

export type UpdateClientStateDataPayload = {
  clientStateKey: string;
  stateUpdate: Record<string, unknown>;
};

export const webSocketServerUpdateClientStateData = createQualityCardWithPayload<
  WebSocketServerState,
  UpdateClientStateDataPayload
>({
  type: 'Web Socket Server Update Client State Data',
  reducer: (state, action) => {
    const { clientStateKey, stateUpdate } = selectPayload<UpdateClientStateDataPayload>(action);
    const timestamp = Date.now();

    const existingClientState = state.clientStates[clientStateKey];

    if (!existingClientState) {
      console.log(
        `[WebSocketServer] Cannot update state for unknown clientStateKey: ${clientStateKey}`,
      );
      return {};
    }

    // Merge the state update into the existing client state
    const updatedClientState: PersistedClientState = {
      ...existingClientState,
      state: {
        ...existingClientState.state,
        ...stateUpdate,
      },
      lastUpdatedAt: timestamp,
    };

    console.log(`[WebSocketServer] Updated state for ${clientStateKey}:`, Object.keys(stateUpdate));

    return {
      clientStates: {
        ...state.clientStates,
        [clientStateKey]: updatedClientState,
      },
    };
  },
});

export type WebSocketServerUpdateClientStateData = Quality<
  WebSocketServerState,
  UpdateClientStateDataPayload
>;
