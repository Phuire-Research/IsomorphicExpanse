/**
 * scpResponseSent - Message Quality
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: Payload Quality for queue management
 *
 * Purpose:
 * - Remove first response from responseQueue after transport sends it
 * - Called by principle after writing to stdout
 */

import { createQualityCard } from 'stratimux';
import type { SCPState } from '../scp.types';
import type { SCPResponseSent } from './types';

export type { SCPResponseSent };

export const scpResponseSent = createQualityCard<SCPState>({
  type: 'I C P Response Sent',
  reducer: (state) => {
    if (state.responseQueue.length === 0) {
      return {};
    }

    console.error(
      '[SCP] Response sent, removing from queue. Remaining:',
      state.responseQueue.length - 1,
    );

    return {
      responseQueue: state.responseQueue.slice(1),
      lastActivityAt: Date.now(),
    };
  },
});
