import { createQualityCardWithPayload, selectPayload, Quality } from 'stratimux';
import type { WebSocketServerState } from '../webSocketServer.concept';
import type { WebSocket } from 'ws';
// THE SELF-OWNED SHUTDOWN · arm the grace timer when the last window closes (guards inside).
import { armSelfShutdownTimer } from '../model/selfOwnedShutdown.model';

export type UnregisterClientPayload = {
  connectionId?: string;
  ws?: WebSocket;
};

export const webSocketServerUnregisterClient = createQualityCardWithPayload<
  WebSocketServerState,
  UnregisterClientPayload
>({
  type: 'Web Socket Server Unregister Client',
  reducer: (state, action) => {
    const { connectionId: providedConnectionId, ws } =
      selectPayload<UnregisterClientPayload>(action);

    let updatedClients;
    let removedClient;
    let connectionId: string | undefined = providedConnectionId;

    if (connectionId) {
      // Unregister by connectionId
      updatedClients = (state.webSocketClients || []).filter(
        (client) => client.connectionId !== connectionId,
      );
      removedClient = (state.webSocketClients || []).find(
        (client) => client.connectionId === connectionId,
      );
    } else if (ws) {
      // Unregister by WebSocket reference
      updatedClients = (state.webSocketClients || []).filter((client) => client.ws !== ws);
      removedClient = (state.webSocketClients || []).find((client) => client.ws === ws);
      connectionId = removedClient?.connectionId;
    } else {
      // No valid identifier provided
      console.log(`[WebSocketServer] Unregister failed: no connectionId or ws provided`);
      return {};
    }

    // POOL CLEANUP: Remove from pool connections (stable indices - no shuffle)
    let updatedConnectionPools = state.connectionPools;
    let updatedConnectionToPool = state.connectionToPool;

    if (connectionId && state.connectionToPool?.[connectionId]) {
      const poolInfo = state.connectionToPool[connectionId];
      const { clientStateKey, poolIndex } = poolInfo;
      const pool = state.connectionPools?.[clientStateKey];

      if (pool) {
        // Remove this connection from pool (delete entry, don't shuffle others)
        const updatedConnections = { ...pool.connections };
        delete updatedConnections[poolIndex];

        const remainingInPool = Object.keys(updatedConnections).length;
        const isPoolEmpty = remainingInPool === 0;

        // Update pool with TTL tracking for cleanup
        updatedConnectionPools = {
          ...state.connectionPools,
          [clientStateKey]: {
            ...pool,
            connections: updatedConnections,
            // Set disconnectedAt when pool becomes empty (starts TTL clock)
            disconnectedAt: isPoolEmpty ? Date.now() : pool.disconnectedAt,
          },
        };

        console.log(
          `[WebSocketServer] Removed poolIndex=${poolIndex} from pool, ${remainingInPool} connections remaining${
            isPoolEmpty ? ' (TTL clock started)' : ''
          }`,
        );
      }

      // Remove from connectionToPool lookup
      updatedConnectionToPool = { ...state.connectionToPool };
      delete updatedConnectionToPool[connectionId];
    }

    if (removedClient) {
      console.log(
        `[WebSocketServer] Connection closed: connectionId=${removedClient.connectionId}, clientStateKey=${removedClient.clientStateKey}, poolIndex=${removedClient.poolIndex}`,
      );
    } else {
      console.log(`[WebSocketServer] Attempted to unregister unknown connection`);
    }

    console.log(`[WebSocketServer] Total connections remaining: ${updatedClients.length}`);

    // THE SELF-OWNED SHUTDOWN · a SPAWNED SCP server with zero remaining connections (having
    // once served ≥1) arms an ~8s grace timer that self-exits on expiry. All three guards
    // (spawn-env marker · had-connections · reconnect-cancels) live inside armSelfShutdownTimer,
    // so a dev `npm run bridge` (no SCS_SPAWNED_SCP marker) is an unconditional no-op here.
    armSelfShutdownTimer(updatedClients.length);

    // Note: We do NOT remove the clientStates entry - that persists for reconnection
    return {
      webSocketClients: updatedClients,
      connectionPools: updatedConnectionPools,
      connectionToPool: updatedConnectionToPool,
    };
  },
});

export type WebSocketServerUnregisterClient = Quality<
  WebSocketServerState,
  UnregisterClientPayload
>;
