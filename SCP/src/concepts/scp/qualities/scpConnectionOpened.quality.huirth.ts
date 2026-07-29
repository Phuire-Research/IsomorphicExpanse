/**
 * scpConnectionOpened - Connection Quality
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: Payload Quality with flat list management
 *
 * Purpose:
 * - Add new connection to flat list
 * - Track connection count
 * - Store client info from MCP initialize handshake
 * - Queue initialize response for transport layer
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { SCPState } from '../scp.types';
import { createSCPConnectionInstance } from '../scp.types';
import type { SCPConnectionOpenedPayload, SCPConnectionOpened } from './types';

export type { SCPConnectionOpened };

export const scpConnectionOpened = createQualityCardWithPayload<
  SCPState,
  SCPConnectionOpenedPayload
>({
  type: 'I C P Connection Opened',
  reducer: (state, action) => {
    const { connectionId, clientName, clientVersion, protocolVersion, initResponse } =
      selectPayload<SCPConnectionOpenedPayload>(action);

    if (state.connections[connectionId]) {
      console.warn(`[SCP] Connection already exists: ${connectionId}`);
      return {};
    }

    const newConnection = createSCPConnectionInstance(
      connectionId,
      state.nextConnectionIndex,
      clientName,
      clientVersion,
      protocolVersion,
      state.transportMode,
    );

    console.error('[SCP] Connection opened:', {
      connectionId,
      clientName,
      clientVersion,
      protocolVersion,
    });

    return {
      connections: {
        ...state.connections,
        [connectionId]: newConnection,
      },
      connectionCount: state.connectionCount + 1,
      nextConnectionIndex: state.nextConnectionIndex + 1,
      lastActivityAt: Date.now(),
      responseQueue: [...state.responseQueue, initResponse],
    };
  },
});
