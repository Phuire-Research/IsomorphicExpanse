/**
 * setActiveEngagedSessionId Quality — Client UI Reducer (Local)
 *
 * SAES (Single-Active-Engagement-Sentinel) state setter.
 * One active engaged session per UI — null clears engagement; string locks it.
 *
 * Dispatched by:
 *  - scsBridgeInvokeSessionEngage principle on MCP ack success → set to sessionId
 *  - SAES auto-clear watcher in ScsBridgeSessionManagement.vue on session
 *    status transition to 'archived' or 'offline' → set to null
 *  - Explicit user disengage (future Cobalt-Wave-N) → set to null
 *
 * Citation: D3D-ARCHITECTURE-R3C-YELLOW-CLIENT-PRINCIPLE.md §S1
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetActiveEngagedSessionIdPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetActiveEngagedSessionIdPayload };

export const scsBridgeSetActiveEngagedSessionId = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetActiveEngagedSessionIdPayload
>({
  type: 'Scs Bridge Set Active Engaged Session Id',
  reducer: (_state, action) => {
    // LSSD · SAES transition log fires on every transition.
    console.log(
      '[SCS-Bridge SAES] setActiveEngagedSessionId · id=',
      action.payload.sessionId,
    );
    return {
      activeEngagedSessionId: action.payload.sessionId,
    };
  },
  methodCreator: defaultMethodCreator,
});
