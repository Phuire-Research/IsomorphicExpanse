/*<$
For the graph programming framework Stratimux and the Web Socket Server Concept, generate a quality will synchronize the state while excluding
properties that would prevent provable termination or should be defined only by the client.
$>*/
/*<#*/
import {
  createQualityCardWithPayload,
  defaultMethodCreator,
  Quality,
  selectPayload,
} from 'stratimux';
import { WebSocketServerState } from '../webSocketServer.concept';
import { WEB_SOCKET_SERVER_SYNC_CLIENT_STATE } from '../model/webSocket.shared';
import { setClientState } from '../../scp/model/clientStateCache';

export type WebSocketServerSyncClientStatePayload = {
  state: Record<string, unknown>;
  originId: string; // Required - clientStateKey of originating connection
  originPoolIndex: number; // Required - poolIndex for broadcast exclusion
};

export type WebSocketServerSyncClientState = Quality<
  WebSocketServerState,
  WebSocketServerSyncClientStatePayload
>;
export const webSocketServerSyncClientState = createQualityCardWithPayload<
  WebSocketServerState,
  WebSocketServerSyncClientStatePayload
>({
  type: WEB_SOCKET_SERVER_SYNC_CLIENT_STATE,
  reducer: (state, action) => {
    const {
      state: stateUpdate,
      originId,
      originPoolIndex,
    } = selectPayload<WebSocketServerSyncClientStatePayload>(action);

    // Create new state update entry for broadcasting (includes poolIndex for exclusion)
    const newStateUpdate = {
      originId,
      originPoolIndex,
      state: stateUpdate,
      timestamp: Date.now(),
    };

    // Get existing per-client state or create placeholder
    const existingClientState = state.clientStates?.[originId];
    const timestamp = Date.now();

    // Merge state update into THIS CLIENT'S state (not shared)
    const updatedPerClientState = existingClientState
      ? {
          ...existingClientState,
          state: {
            ...existingClientState.state,
            ...stateUpdate,
          },
          lastUpdatedAt: timestamp,
        }
      : {
          clientStateId: originId.split(':')[1] || originId,
          clientIP: originId.split(':')[0] || 'unknown',
          state: stateUpdate,
          createdAt: timestamp,
          lastUpdatedAt: timestamp,
          connectionCount: 1,
        };

    // Update per-client state storage
    const updatedClientStates = {
      ...state.clientStates,
      [originId]: updatedPerClientState,
    };

    // Update SCP cache with this client's merged state (for tool access)
    setClientState(updatedPerClientState.state);

    console.log(
      `[WebSocketServer] State sync for clientStateKey=${originId}, keys: ${Object.keys(
        stateUpdate,
      ).join(', ')}`,
    );

    return {
      // Update per-clientStateKey state storage (NOT shared clientState)
      clientStates: updatedClientStates,
      // Add to stateUpdates array for broadcast principle to process
      stateUpdates: [...(state.stateUpdates || []), newStateUpdate],
    };
  },
  methodCreator: defaultMethodCreator,
});
/*#>*/
