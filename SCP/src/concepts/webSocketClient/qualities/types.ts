import type { Quality } from 'stratimux';
import type { WebSocketClientState } from '../webSocketClient.concept';
import type { WebSocketClientAppendToActionQuePayload } from './appendActionQue.quality';
import type { WebSocketClientSetServerSemaphorePayload } from './setServerSemaphore.quality';
import type { WebSocketClientForceSyncPayload } from './forceSync.quality';

// Individual Quality Types with their specific payloads
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

// Combined Qualities Type
export type WebSocketClientQualities = {
  webSocketClientAppendToActionQue: WebSocketClientAppendToActionQue;
  webSocketClientSetServerSemaphore: WebSocketClientSetServerSemaphore;
  webSocketClientForceSync: WebSocketClientForceSync;
};
