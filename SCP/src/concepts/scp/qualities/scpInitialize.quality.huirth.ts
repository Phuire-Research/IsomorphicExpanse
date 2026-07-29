/**
 * scpInitialize - Lifecycle Quality
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: Payload Quality with state initialization
 *
 * Purpose:
 * - Initialize SCP server with transport configuration
 * - Set server to running state
 * - Configure transport mode for downstream ActionStrategies
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { SCPState } from '../scp.types';
import type { SCPInitializePayload, SCPInitialize } from './types';

export type { SCPInitialize };

export const scpInitialize = createQualityCardWithPayload<SCPState, SCPInitializePayload>({
  type: 'I C P Initialize',
  reducer: (state, action) => {
    const { transportConfiguration } = selectPayload<SCPInitializePayload>(action);

    console.error('[SCP] Initializing with transport:', transportConfiguration.mode);

    return {
      transportMode: transportConfiguration.mode,
      transportStatus: 'active',
      transportConfiguration,
      initialized: true,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };
  },
});
