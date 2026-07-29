/**
 * Shared WebSocket action type constants
 * These must match the quality type strings exactly
 */

// Client-side action types (actions the client can receive)
export const WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE = 'Web Socket Client Atomic State Update';

// Server-side action types (actions the server can receive)
export const WEB_SOCKET_SERVER_SYNC_CLIENT_STATE = 'Web Socket Server Sync Client State';
export const WEB_SOCKET_SERVER_SET_CLIENT_SEMAPHORE = 'Web Socket Server Set Client Semaphore';
export const WEB_SOCKET_SERVER_APPEND_TO_ACTION_QUE = 'Web Socket Server Append To Action Que';

export type PingPongDataField = {
  pingPong: true;
};
