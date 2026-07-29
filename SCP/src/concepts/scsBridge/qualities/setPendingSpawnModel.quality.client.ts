/**
 * setPendingSpawnModel Quality — Client UI Reducer (Local)
 *
 * MD-9 · D-MC-3 · Per-Instance Model Control · the model-selection setter. Vue dispatches
 * with the chosen model id when the Session Management model dropdown changes; BOTH spawn
 * principles (CMIA-Spawn + CMIA-Spawn-Suite8) read pendingSpawnModel at fire-time and thread
 * it into the MCP `arguments` (field-agnostic → payload.model → the bridge quality → registry).
 *
 * DISTINCT from the pending-NAME triggers: this is NOT a one-shot fire-then-clear trigger —
 * it is a PERSISTENT selection the dropdown owns (re-read fresh on each spawn, never cleared
 * on TFCD). undefined = no per-instance pin (the spawn omits model → the bridge global default).
 *
 * Sibling to setPendingSpawnSuite8Name.quality.client.ts (client-local reducer pattern).
 *
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization" (shortest-path return)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetPendingSpawnModelPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetPendingSpawnModelPayload };

export const scsBridgeSetPendingSpawnModel = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetPendingSpawnModelPayload
>({
  type: 'Scs Bridge Set Pending Spawn Model',
  reducer: (_state, action) => {
    console.log(
      '[SCS-Bridge MD-9] setPendingSpawnModel · model=',
      action.payload.model ?? null,
    );
    return {
      pendingSpawnModel: action.payload.model,
    };
  },
  methodCreator: defaultMethodCreator,
});
