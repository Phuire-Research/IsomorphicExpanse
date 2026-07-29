import { createQualityCardWithPayload, selectPayload, Quality } from 'stratimux';
import type { WebSocketServerState } from '../webSocketServer.concept';
import {
  generateConnectionId,
  generateClientStateId,
  generateClientStateKey,
  type WebSocketClientConnection,
  type PersistedClientState,
  type ConnectionPool,
} from '../model/webSocketClient.model';
import type { WebSocket } from 'ws';
// THE SELF-OWNED SHUTDOWN · latch had-connections + cancel any pending grace on register.
import { noteClientRegistered } from '../model/selfOwnedShutdown.model';

export type RegisterClientPayload = {
  ws: WebSocket;
  clientIP: string;
  clientStateId?: string; // Optional - server generates if not provided
};

export type RegisterClientResult = {
  connectionId: string;
  clientStateId: string;
  clientStateKey: string;
  poolIndex: number;
  isNewClientState: boolean;
};

export const webSocketServerRegisterClient = createQualityCardWithPayload<
  WebSocketServerState,
  RegisterClientPayload
>({
  type: 'Web Socket Server Register Client',
  reducer: (state, action) => {
    const {
      ws,
      clientIP,
      clientStateId: providedClientStateId,
    } = selectPayload<RegisterClientPayload>(action);
    const timestamp = Date.now();

    // SERVER-SIDE POOL MANAGEMENT: Check for existing pool from same IP if no clientStateId provided
    let clientStateId: string;
    if (providedClientStateId) {
      // Client provided stored clientStateId - use it
      clientStateId = providedClientStateId;
    } else {
      // No clientStateId provided - check for existing pool from same IP
      const existingPoolKey = Object.keys(state.connectionPools || {}).find((key) =>
        key.startsWith(clientIP + ':'),
      );
      if (existingPoolKey) {
        // Join existing pool - extract clientStateId from key
        clientStateId = existingPoolKey.split(':')[1];
        console.log(
          `[WebSocketServer] Joining existing pool for IP ${clientIP}, clientStateId=${clientStateId}`,
        );
      } else {
        // Create new pool
        clientStateId = generateClientStateId();
        console.log(
          `[WebSocketServer] Creating new pool for IP ${clientIP}, clientStateId=${clientStateId}`,
        );
      }
    }

    const clientStateKey = generateClientStateKey(clientIP, clientStateId);
    const connectionId = generateConnectionId();

    // POOL MANAGEMENT: Find or create pool, assign stable poolIndex
    const existingPool = state.connectionPools?.[clientStateKey];
    let pool: ConnectionPool;
    let poolIndex: number;

    if (existingPool) {
      // Join existing pool - get next index (monotonic, never decrements)
      poolIndex = existingPool.nextIndex;
      pool = {
        ...existingPool,
        connections: {
          ...existingPool.connections,
          [poolIndex]: connectionId,
        },
        nextIndex: existingPool.nextIndex + 1,
        disconnectedAt: null, // Clear TTL - pool has active connection
      };
      console.log(
        `[WebSocketServer] Connection joining pool: poolIndex=${poolIndex}, total in pool=${
          Object.keys(pool.connections).length
        }`,
      );
    } else {
      // Create new pool
      poolIndex = 0;
      pool = {
        clientStateKey,
        connections: { [poolIndex]: connectionId },
        nextIndex: 1,
        state: {},
        disconnectedAt: null, // New pool has active connection
      };
      console.log(`[WebSocketServer] New pool created: poolIndex=${poolIndex}`);
    }

    // Check if this clientStateKey already exists in clientStates
    const existingClientState = state.clientStates?.[clientStateKey];
    const isNewClientState = !existingClientState;

    // Create or update PersistedClientState
    const clientState: PersistedClientState = existingClientState
      ? {
          ...existingClientState,
          lastUpdatedAt: timestamp,
          connectionCount: existingClientState.connectionCount + 1,
        }
      : {
          clientStateId,
          clientIP,
          state: {}, // Will be populated by Counter/other concepts
          createdAt: timestamp,
          lastUpdatedAt: timestamp,
          connectionCount: 1,
        };

    // Create WebSocketClientConnection with poolIndex
    const newClient: WebSocketClientConnection = {
      connectionId,
      clientStateKey,
      clientStateId,
      clientIP,
      poolIndex, // Stable index within pool
      ws,
      connectedAt: timestamp,
      lastActivity: timestamp,
    };

    const updatedClients = [...(state.webSocketClients || []), newClient];
    const updatedClientStates = {
      ...state.clientStates,
      [clientStateKey]: clientState,
    };
    const updatedConnectionPools = {
      ...state.connectionPools,
      [clientStateKey]: pool,
    };
    const updatedConnectionToPool = {
      ...state.connectionToPool,
      [connectionId]: { clientStateKey, poolIndex },
    };

    console.log(
      `[WebSocketServer] Client registered: connectionId=${connectionId}, clientStateKey=${clientStateKey}, poolIndex=${poolIndex}`,
    );
    console.log(
      `[WebSocketServer] isNewClientState: ${isNewClientState}, connectionCount: ${clientState.connectionCount}`,
    );
    console.log(
      `[WebSocketServer] Total connections: ${updatedClients.length}, Pool members: ${
        Object.keys(pool.connections).length
      }`,
    );

    // THE SELF-OWNED SHUTDOWN · a window landed. Latch the had-connections predicate (so a
    // later 0-remaining CAN self-shutdown) AND cancel any pending grace timer (a window
    // refresh — disconnect → reconnect within the grace window — survives).
    noteClientRegistered();

    return {
      webSocketClients: updatedClients,
      clientStates: updatedClientStates,
      connectionPools: updatedConnectionPools,
      connectionToPool: updatedConnectionToPool,
    };
  },
});

export type WebSocketServerRegisterClient = Quality<WebSocketServerState, RegisterClientPayload>;
