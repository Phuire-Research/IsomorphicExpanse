/*<$
For the graph programming framework Stratimux generate a Web Socket Client Concept, that will create a message stream between the client and server.
This message stream should establish each governing concept's semaphore so that messages are not invalidated.
$>*/
/*<#*/
import { webSocketClientAppendToActionQue } from './qualities/appendActionQue.quality';
import { webSocketClientForceSync } from './qualities/forceSync.quality';
import { webSocketClientSetServerSemaphore } from './qualities/setServerSemaphore.quality';
import { webSocketClientAtomicStateUpdate } from './qualities/atomicStateUpdate.quality';
import { webSocketClientSetClientStateId } from './qualities/setClientStateId.quality';
import { webSocketClientSetIsConnected } from './qualities/setIsConnected.quality';
import { webSocketClientPrinciple } from './webSocketClient.principle';
import { webSocketClientLocalStorageRegistrationPrinciple } from './principles/localStorageRegistration.principle';
import { createConcept } from 'stratimux';
import type { AnyAction, MuxiumDeck, Concept, PrincipleFunction, Quality } from 'stratimux';

// Novel change detection handler type
export type WebSocketClientState = {
  actionQue: AnyAction[];
  filterKeys: string[];
  serverSemaphore: number;
  clientStateId: string | null; // Persisted in localStorage, sent to server on connect
  isConnected: boolean; // WebSocket connection status
};

// Quality Payload Types
export type WebSocketClientAppendToActionQuePayload = {
  actionQue: AnyAction[];
};

export type WebSocketClientSetServerSemaphorePayload = {
  semaphore: number;
};

export type WebSocketClientForceSyncPayload = {
  keys: string[];
};

export type WebSocketClientSetClientStateIdPayload = {
  clientStateId: string | null;
};

export type WebSocketClientSetIsConnectedPayload = {
  isConnected: boolean;
};

// Quality Types
export type WebSocketClientAppendToActionQue = Quality<
  WebSocketClientState,
  WebSocketClientAppendToActionQuePayload
>;
export type WebSocketClientSetServerSemaphore = Quality<
  WebSocketClientState,
  WebSocketClientSetServerSemaphorePayload
>;
export type WebSocketClientForceSync = Quality<
  WebSocketClientState,
  WebSocketClientForceSyncPayload
>;
export type WebSocketClientAtomicStateUpdate = Quality<
  WebSocketClientState,
  { state: Record<string, unknown> }
>;
export type WebSocketClientSetClientStateId = Quality<
  WebSocketClientState,
  WebSocketClientSetClientStateIdPayload
>;
export type WebSocketClientSetIsConnected = Quality<
  WebSocketClientState,
  WebSocketClientSetIsConnectedPayload
>;

export type WebSocketClientQualities = {
  webSocketClientAppendToActionQue: WebSocketClientAppendToActionQue;
  webSocketClientSetServerSemaphore: WebSocketClientSetServerSemaphore;
  webSocketClientForceSync: WebSocketClientForceSync;
  webSocketClientAtomicStateUpdate: WebSocketClientAtomicStateUpdate;
  webSocketClientSetClientStateId: WebSocketClientSetClientStateId;
  webSocketClientSetIsConnected: WebSocketClientSetIsConnected;
};

export const webSocketClientName = 'webSocketClient';

const initialWebSocketClientState = (filterKeys?: string[]): WebSocketClientState => {
  return {
    actionQue: [],
    filterKeys: filterKeys ? filterKeys : [],
    serverSemaphore: -1,
    clientStateId: null, // Will be loaded from localStorage or assigned by server
    isConnected: false, // Updated by WebSocket connection events
  };
};

const webSocketClientQualities: WebSocketClientQualities = {
  webSocketClientAppendToActionQue,
  webSocketClientSetServerSemaphore,
  webSocketClientForceSync,
  webSocketClientAtomicStateUpdate,
  webSocketClientSetClientStateId,
  webSocketClientSetIsConnected,
};

export type WebSocketClientConcept = Concept<WebSocketClientState, WebSocketClientQualities>;
export type WebSocketClientDeck = {
  webSocketClient: Concept<WebSocketClientState, WebSocketClientQualities>;
};

export type WebSocketClientPrinciple = PrincipleFunction<
  WebSocketClientQualities,
  MuxiumDeck & WebSocketClientDeck,
  WebSocketClientState
>;

// Re-export for principles
export type { LocalStorageDeck } from '../localStorage/localStorage.model';

export const createWebSocketClientConcept = (filterKeys?: string[]) => {
  return createConcept<WebSocketClientState, WebSocketClientQualities>(
    webSocketClientName,
    initialWebSocketClientState(filterKeys),
    webSocketClientQualities,
    [webSocketClientPrinciple, webSocketClientLocalStorageRegistrationPrinciple],
  );
};
/*#>*/
