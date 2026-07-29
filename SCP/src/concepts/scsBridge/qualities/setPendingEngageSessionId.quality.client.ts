/**
 * setPendingEngageSessionId Quality — Client UI Reducer (Local)
 *
 * CMIA-Engage trigger field setter. Vue dispatches with sessionId when user
 * clicks Engage row affordance; scsBridgeInvokeSessionEngage principle
 * watches this selector and fires the MCP fetch. Cleared (set to null)
 * after fetch resolves to prevent re-fire.
 *
 * Citation: D3D-ARCHITECTURE-R3C-YELLOW-CLIENT-PRINCIPLE.md §S3
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetPendingEngageSessionIdPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetPendingEngageSessionIdPayload };

export const scsBridgeSetPendingEngageSessionId = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetPendingEngageSessionIdPayload
>({
  type: 'Scs Bridge Set Pending Engage Session Id',
  reducer: (_state, action) => {
    // LSSD · CMIA-Engage trigger transition.
    console.log(
      '[SCS-Bridge CMIA-Engage] setPendingEngageSessionId · id=',
      action.payload.sessionId,
    );
    return {
      pendingEngageSessionId: action.payload.sessionId,
    };
  },
  methodCreator: defaultMethodCreator,
});
