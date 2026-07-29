/**
 * triggerToggleDiameter Quality - Server Side of Toggle Diameter
 *
 * Handles client requests to enable/disable Induction pattern (diameter) on a quality.
 * Note: Principles do NOT have diameter - they are behavioral, simply included/excluded.
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 *
 * Diametric Pattern (Server Side):
 * - Client sends this action wrapped in strategyDetermine (via Induction)
 * - WebSocket server adds clientStateKey to strategy.data during transit
 * - This quality receives action WITH strategy containing clientStateKey
 * - Creates strategy to execute file rename and muxonomy update
 * - Dispatches strategy to complete manifold
 *
 * SCOPE CONSTRAINT: Only Managed Concepts (hasMuxonomy: true)
 * ASPECT CONSTRAINT: Only Qualities (principles don't have diameter)
 *
 * Type: 'Strativerse Trigger Toggle Diameter' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  createMethodWithState,
  strategyBegin,
  muxiumConclude,
} from 'stratimux';
// Direct import from type file (NO barrel exports for tree-shaking)
import {
  type StrativerseState,
  type StrativerseModelDeck,
  type TriggerToggleDiameterPayload,
} from '../strativerse.type';
import { createToggleDiameterStrategy } from '../strategies/toggleDiameter.strategy.huirth';

export type { TriggerToggleDiameterPayload };

export const strativerseTriggerToggleDiameter = createQualityCardWithPayload<
  StrativerseState,
  TriggerToggleDiameterPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Trigger Toggle Diameter',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithState(({ action, state, deck }) => {
      // Extract clientStateKey from incoming strategy (added by WebSocket server during transit)
      const clientStateKey = action.strategy?.data?.clientStateKey;
      const payload = action.payload;

      console.log('[StratiVERSE] Trigger Toggle Diameter: Server received', {
        hasStrategy: !!action.strategy,
        clientStateKey: clientStateKey || 'none',
        conceptName: payload.conceptName,
        qualityName: payload.qualityName,
        enableDiameter: payload.enableDiameter,
      });

      // Validate: Only Managed Concepts can be modified
      const concept = state.conceptList.concepts.find(c => c.name === payload.conceptName);
      if (!concept) {
        console.error('[StratiVERSE] Trigger Toggle Diameter: Concept not found:', payload.conceptName);
        return muxiumConclude();
      }

      if (!concept.hasMuxonomy) {
        console.error('[StratiVERSE] Trigger Toggle Diameter: Concept is not managed (hasMuxonomy: false):', payload.conceptName);
        return muxiumConclude();
      }

      // Validate: Quality exists
      const quality = concept.qualities.find(q => q.name === payload.qualityName);
      if (!quality) {
        console.error('[StratiVERSE] Trigger Toggle Diameter: Quality not found:', payload.qualityName);
        return muxiumConclude();
      }

      // Create the toggle diameter strategy
      const strategy = createToggleDiameterStrategy(deck, payload);

      if (!strategy) {
        console.error('[StratiVERSE] Trigger Toggle Diameter: Failed to create toggle strategy');
        return muxiumConclude();
      }

      // Transfer clientStateKey from incoming strategy to new strategy for routing
      if (clientStateKey) {
        strategy.data = {
          ...strategy.data,
          clientStateKey
        };
        console.log('[StratiVERSE] Trigger Toggle Diameter: Strategy created with clientStateKey for routing back to client');
      }

      // Activate the strategy with strategyBegin to start the manifold chain
      console.log('[StratiVERSE] Trigger Toggle Diameter: Activating toggle diameter strategy');
      return strategyBegin(strategy);
    }),
});
