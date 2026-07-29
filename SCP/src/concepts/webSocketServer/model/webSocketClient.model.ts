import type { WebSocket } from 'ws';
import type { Request } from 'express';

export interface WebSocketClientConnection {
  connectionId: string;
  clientStateKey: string;
  clientStateId: string;
  clientIP: string;
  poolIndex: number; // Stable index within pool - never shuffles on disconnect
  ws: WebSocket;
  connectedAt: number;
  lastActivity: number;
}

export type ClientOriginIndex = string;

export interface StateUpdate {
  originId: ClientOriginIndex; // clientStateKey of originating connection
  originPoolIndex: number; // Pool index of originating connection (for broadcast exclusion)
  state: Record<string, unknown>;
  timestamp: number;
}

// Pool connection record - stable indices, no shuffling on disconnect
export type PoolConnections = Record<number, string>; // poolIndex -> connectionId

// Connection pool structure
export interface ConnectionPool {
  clientStateKey: string; // IP:ClientID
  connections: PoolConnections; // Stable index mapping
  nextIndex: number; // Next available index (monotonic, never decrements)
  state: Record<string, unknown>; // Pool state cache
  disconnectedAt: number | null; // Timestamp when pool became empty (null if has connections)
}

// Lookup from connectionId to pool info
export interface ConnectionPoolInfo {
  clientStateKey: string;
  poolIndex: number;
}

export interface PersistedClientState {
  clientStateId: string;
  clientIP: string;
  state: Record<string, unknown>;
  createdAt: number;
  lastUpdatedAt: number;
  connectionCount: number;
}

export const generateConnectionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `conn-${timestamp}-${randomPart}`;
};

export const generateClientStateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `state-${timestamp}-${randomPart}`;
};

export const generateClientStateKey = (clientIP: string, clientStateId: string): string => {
  return `${clientIP}:${clientStateId}`;
};

export const extractClientIP = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips.trim();
  }
  return req.socket.remoteAddress || 'unknown';
};
