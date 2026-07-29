/**
 * setPendingSpawnScpName Quality — Client UI Reducer (Local)
 *
 * CMIA-Spawn trigger field setter. Vue dispatches with scpName when user
 * clicks Spawn button; scsBridgeInvokeSessionSpawn principle watches this
 * selector and fires the MCP fetch. Cleared (set to null) after fetch
 * resolves (success or failure) to prevent re-fire.
 *
 * Citation: D3D-ARCHITECTURE-R3C-YELLOW-CLIENT-PRINCIPLE.md §S2
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetPendingSpawnScpNamePayload,
} from '../scsBridge.type';

export type { ScsBridgeSetPendingSpawnScpNamePayload };

export const scsBridgeSetPendingSpawnScpName = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetPendingSpawnScpNamePayload
>({
  type: 'Scs Bridge Set Pending Spawn Scp Name',
  reducer: (_state, action) => {
    // LSSD · CMIA-Spawn trigger transition.
    console.log(
      '[SCS-Bridge CMIA-Spawn] setPendingSpawnScpName · scpName=',
      action.payload.scpName,
    );
    return {
      pendingSpawnScpName: action.payload.scpName,
    };
  },
  methodCreator: defaultMethodCreator,
});
