/**
 * triggerScan Quality - Server Side of Trigger Scan Diameter
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 *
 * Diametric Pattern (Server Side):
 * - Client sends this action wrapped in strategyDetermine (via Induction)
 * - WebSocket server adds clientStateKey to strategy.data during transit
 * - This quality receives action WITH strategy containing clientStateKey
 * - Creates full initialization strategy with clientStateKey transferred
 * - Dispatches strategy to complete manifold: scanConcepts → setConceptList → broadcastConceptList
 *
 * The clientStateKey in strategy.data enables proper routing back to originating client.
 *
 * Type: 'Strativerse Trigger Scan' (Verbose Split - matches client Induction quality)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  createMethodWithState,
  strategyBegin,
  muxiumConclude,
} from 'stratimux';
// Direct import from type file (NO barrel exports for tree-shaking)
import { type StrativerseState, type StrativerseModelDeck } from '../strativerse.type';
import { createStrativerseInitializationStrategy } from '../strategies/initialization.strategy.huirth';

export type StrativerseTriggerScanPayload = {
  scanPath?: string;
};

export const strativerseTriggerScan = createQualityCardWithPayload<
  StrativerseState,
  StrativerseTriggerScanPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Trigger Scan',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithState(({ action, state, deck }) => {
      // Extract clientStateKey from incoming strategy (added by WebSocket server during transit)
      const clientStateKey = action.strategy?.data?.clientStateKey;

      console.log('[StratiVERSE] Trigger Scan: Server received', {
        hasStrategy: !!action.strategy,
        clientStateKey: clientStateKey || 'none',
        scanPath: action.payload?.scanPath || state.conceptList.scanPath
      });

      // Create the full initialization strategy (A→B→Y→Z Manifold)
      const scanPath = action.payload?.scanPath ?? state.conceptList.scanPath;
      const strategy = createStrativerseInitializationStrategy(deck, scanPath);

      if (!strategy) {
        console.error('[StratiVERSE] Trigger Scan: Failed to create initialization strategy');
        return muxiumConclude();
      }

      // Transfer clientStateKey from incoming strategy to new strategy for routing
      if (clientStateKey) {
        strategy.data = {
          ...strategy.data,
          clientStateKey
        };
        console.log('[StratiVERSE] Trigger Scan: Strategy created with clientStateKey for routing back to client');
      }

      // Activate the strategy with strategyBegin to start the manifold chain
      // This triggers: scanConcepts → setConceptList → broadcastConceptList
      console.log('[StratiVERSE] Trigger Scan: Activating initialization strategy');
      return strategyBegin(strategy);
    }),
});
