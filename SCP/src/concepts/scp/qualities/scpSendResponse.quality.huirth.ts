/**
 * scpSendResponse - Message Quality
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: Payload Quality with response queue management
 *
 * Purpose:
 * - Queue response for transport layer
 * - Transport principle watches responseQueue and writes to stdout
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { SCPState } from '../scp.types';
import type { SCPSendResponsePayload, SCPSendResponse } from './types';

export type { SCPSendResponse };

export const scpSendResponse = createQualityCardWithPayload<SCPState, SCPSendResponsePayload>({
  type: 'I C P Send Response',
  reducer: (state, action) => {
    const { response } = selectPayload<SCPSendResponsePayload>(action);

    console.error('[SCP] Queueing response for id:', response.id);

    return {
      responseQueue: [...state.responseQueue, response],
      lastActivityAt: Date.now(),
    };
  },
});
