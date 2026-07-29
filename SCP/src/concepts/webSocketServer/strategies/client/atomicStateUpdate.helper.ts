import { createAction } from 'stratimux';
import type { ActionOptions } from 'stratimux';
import { WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE } from '../../model/webSocket.shared';

/**
 * Server-side helper to create atomic state update actions for clients
 * This creates an action that clients will recognize and process
 */
export const webSocketClientAtomicStateUpdate = (
  payload: { state: Record<string, unknown> },
  options?: ActionOptions,
) => createAction(WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE, { payload, ...options });
