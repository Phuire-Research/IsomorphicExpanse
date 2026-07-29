/*<$
For the graph programming framework Stratimux generate a Web Socket Server Concept, that will create a message stream between the server and client.
This message stream should establish each governing concept's semaphore so that messages are not invalidated.
$>*/
/*<#*/
import { ServerState } from '../server/server.concept';
import {
  WebSocketServerAppendToActionQue,
  webSocketServerAppendToActionQue,
} from './qualities/appendActionQue.quality';
import {
  WebSocketServerSetClientSemaphore,
  webSocketServerSetClientSemaphore,
} from './qualities/setClientSemaphore.quality';
import {
  WebSocketServerSyncClientState,
  webSocketServerSyncClientState,
} from './qualities/syncClientState.quality';
import {
  WebSocketServerRegisterClient,
  webSocketServerRegisterClient,
} from './qualities/registerClient.quality';
import {
  WebSocketServerUnregisterClient,
  webSocketServerUnregisterClient,
} from './qualities/unregisterClient.quality';
import {
  WebSocketServerClearStateUpdates,
  webSocketServerClearStateUpdates,
} from './qualities/clearStateUpdates.quality';
import {
  WebSocketServerUpdateClientStateData,
  webSocketServerUpdateClientStateData,
} from './qualities/updateClientStateData.quality';
import {
  WebSocketServerDeleteStaleClientState,
  webSocketServerDeleteStaleClientState,
} from './qualities/deleteStaleClientState.quality';
import { webSocketServerPrinciple } from './webSocketServer.principle';
import { webSocketServerStateBroadcastPrinciple } from './principles/stateBroadcast.principle';
import { webSocketServerStateCleanupPrinciple } from './principles/stateCleanup.principle';
import { vpnProxyPrinciple } from './principles/vpnProxy.principle';
import { Action, MuxiumDeck, Concept, createConcept, PrincipleFunction } from 'stratimux';
import type {
  WebSocketClientConnection,
  StateUpdate,
  PersistedClientState,
  ConnectionPool,
  ConnectionPoolInfo,
} from './model/webSocketClient.model';

export type TargetedAction = {
  action: Action;
  destinationClientId: string;
};

export type WebSocketServerState = {
  actionQue: Action[];
  specificQue: TargetedAction[]; // Client-specific routing
  clientSemaphore: number;
  webSocketClients: WebSocketClientConnection[];
  clientStates: Record<string, PersistedClientState>; // Keyed by IP:clientStateId
  stateUpdates: StateUpdate[];
  filterKeys: string[]; // Properties to exclude from sync entirely
  // Pool management - Server handles differentiation, Client is BLIND
  connectionPools: Record<string, ConnectionPool>; // Keyed by clientStateKey (IP:clientStateId)
  connectionToPool: Record<string, ConnectionPoolInfo>; // connectionId -> pool lookup
} & ServerState;

export const webSocketServerName = 'webSocketServer';

const initialWebSocketServerState = (
  port?: number,
  filterKeys?: string[],
): WebSocketServerState => {
  return {
    port: port ? port : 7637,
    clientState: {},
    servers: [],
    syncClientState: true,
    actionQue: [],
    specificQue: [],
    clientSemaphore: -1,
    webSocketClients: [],
    clientStates: {}, // IP:clientStateId keyed ClientState storage
    stateUpdates: [],
    filterKeys: filterKeys || [],
    // Pool management initialization
    connectionPools: {}, // clientStateKey -> ConnectionPool
    connectionToPool: {}, // connectionId -> { clientStateKey, poolIndex }
  };
};

export const webSocketServerQualities = {
  webSocketServerAppendToActionQue,
  webSocketServerSyncClientState,
  webSocketServerSetClientSemaphore,
  webSocketServerRegisterClient,
  webSocketServerUnregisterClient,
  webSocketServerClearStateUpdates,
  webSocketServerUpdateClientStateData,
  webSocketServerDeleteStaleClientState,
};
export type WebSocketServerQualities = {
  webSocketServerAppendToActionQue: WebSocketServerAppendToActionQue;
  webSocketServerSyncClientState: WebSocketServerSyncClientState;
  webSocketServerSetClientSemaphore: WebSocketServerSetClientSemaphore;
  webSocketServerRegisterClient: WebSocketServerRegisterClient;
  webSocketServerUnregisterClient: WebSocketServerUnregisterClient;
  webSocketServerClearStateUpdates: WebSocketServerClearStateUpdates;
  webSocketServerUpdateClientStateData: WebSocketServerUpdateClientStateData;
  webSocketServerDeleteStaleClientState: WebSocketServerDeleteStaleClientState;
};
export type WebSocketServerConcept = Concept<WebSocketServerState, WebSocketServerQualities>;
export type WebSocketServerDeck = {
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};
export type WebSocketServerPrinciple = PrincipleFunction<
  typeof webSocketServerQualities,
  MuxiumDeck & WebSocketServerDeck,
  WebSocketServerState
>;

export const createWebSocketServerConcept = (port?: number, filterKeys?: string[]) => {
  return createConcept<WebSocketServerState, typeof webSocketServerQualities>(
    webSocketServerName,
    initialWebSocketServerState(port, filterKeys),
    webSocketServerQualities,
    [
      webSocketServerPrinciple,
      webSocketServerStateBroadcastPrinciple,
      webSocketServerStateCleanupPrinciple,
      vpnProxyPrinciple,
    ],
  );
};
