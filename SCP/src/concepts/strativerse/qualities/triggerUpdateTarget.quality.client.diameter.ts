/**
 * triggerUpdateTarget Quality - Server Side of Update Target Diameter
 *
 * Handles client requests to change DeploymentTarget of a quality or principle.
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 *
 * Diametric Pattern (Server Side):
 * - Client sends this action wrapped in strategyDetermine (via Induction)
 * - WebSocket server adds clientStateKey to strategy.data during transit
 * - This quality receives action WITH strategy containing clientStateKey
 * - Creates Demometric Interchange strategy for full orchestration
 * - Dispatches strategy to complete manifold
 *
 * SCOPE CONSTRAINT: Only Managed Concepts (hasMuxonomy: true)
 *
 * Type: 'Strativerse Trigger Update Target' (Verbose Split)
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
  type TriggerUpdateTargetPayload,
  type QualityEntry,
} from '../strativerse.type';
import { createDemometricInterchangeStrategy } from '../strategies/demometricInterchange.strategy.huirth';
import { DeploymentTarget } from '../../muxonomy/muxonomy.model';

export type { TriggerUpdateTargetPayload };

/**
 * Derive deck type name from concept name
 * Convention: conceptName → ConceptNameModelDeck
 */
function deriveDeckTypeName(conceptName: string): string {
  const pascalCase = conceptName.charAt(0).toUpperCase() + conceptName.slice(1);
  return `${pascalCase}ModelDeck`;
}

export const strativerseTriggerUpdateTarget = createQualityCardWithPayload<
  StrativerseState,
  TriggerUpdateTargetPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Trigger Update Target',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithState(({ action, state, deck }) => {
      // Extract clientStateKey from incoming strategy (added by WebSocket server during transit)
      const clientStateKey = action.strategy?.data?.clientStateKey;
      const payload = action.payload;

      console.log('[StratiVERSE] Trigger Update Target: Server received', {
        hasStrategy: !!action.strategy,
        clientStateKey: clientStateKey || 'none',
        conceptName: payload.conceptName,
        aspectType: payload.aspectType,
        aspectName: payload.aspectName,
        newTarget: payload.newTarget,
      });

      // Validate: Only Managed Concepts can be modified
      const concept = state.conceptList.concepts.find(c => c.name === payload.conceptName);
      if (!concept) {
        console.error('[StratiVERSE] Trigger Update Target: Concept not found:', payload.conceptName);
        return muxiumConclude();
      }

      if (!concept.hasMuxonomy) {
        console.error('[StratiVERSE] Trigger Update Target: Concept is not managed (hasMuxonomy: false):', payload.conceptName);
        return muxiumConclude();
      }

      // Currently only qualities support Demometric Interchange
      if (payload.aspectType !== 'quality') {
        console.error('[StratiVERSE] Trigger Update Target: Only qualities support Demometric Interchange, not:', payload.aspectType);
        return muxiumConclude();
      }

      // Find the quality entry
      const qualityEntry = concept.qualities.find(
        (q: QualityEntry) => q.name === payload.aspectName
      );
      if (!qualityEntry) {
        console.error('[StratiVERSE] Trigger Update Target: Quality not found:', payload.aspectName);
        return muxiumConclude();
      }

      // Resolve toggle mode: null means flip between Client ↔ Huirth for diameter qualities
      // For non-diameter, toggle behavior not yet defined (could go Client ↔ All or similar)
      let resolvedNewTarget = payload.newTarget;
      if (resolvedNewTarget === null) {
        const oldTarget = qualityEntry.deploymentTarget;
        if (qualityEntry.diameter) {
          // Diameter qualities toggle between Client and Huirth (the two demometers)
          resolvedNewTarget = oldTarget === DeploymentTarget.Client ? DeploymentTarget.Huirth : DeploymentTarget.Client;
        } else {
          // Non-diameter toggle not yet supported - default to opposite or All
          resolvedNewTarget = oldTarget === DeploymentTarget.Client ? DeploymentTarget.Huirth : DeploymentTarget.Client;
        }
        console.log('[StratiVERSE] Trigger Update Target: Toggle mode resolved', {
          oldTarget,
          resolvedNewTarget,
          diameter: qualityEntry.diameter,
        });
      }

      // Build DemometricInterchangePayload from TriggerUpdateTargetPayload + ConceptEntry data
      const demometricPayload = {
        conceptName: payload.conceptName,
        conceptPath: concept.path,
        qualityName: qualityEntry.name,
        qualityTypeString: qualityEntry.typeString,
        oldTarget: qualityEntry.deploymentTarget,
        newTarget: resolvedNewTarget,
        diameter: qualityEntry.diameter,
        stateTypeName: concept.stateTypeName,
        deckTypeName: deriveDeckTypeName(payload.conceptName),
        // Payload detection for asymmetric Induction creation
        hasPayload: qualityEntry.hasPayload,
        payloadTypeName: qualityEntry.payloadTypeString,
      };

      console.log('[StratiVERSE] Trigger Update Target: Building Demometric Interchange payload', demometricPayload);

      // Create the Demometric Interchange strategy (8-step orchestration)
      const strategy = createDemometricInterchangeStrategy(deck, demometricPayload);

      if (!strategy) {
        console.error('[StratiVERSE] Trigger Update Target: Failed to create Demometric Interchange strategy');
        return muxiumConclude();
      }

      // Transfer clientStateKey from incoming strategy to new strategy for routing
      if (clientStateKey) {
        strategy.data = {
          ...strategy.data,
          clientStateKey
        };
        console.log('[StratiVERSE] Trigger Update Target: Strategy created with clientStateKey for routing back to client');
      }

      // Activate the strategy with strategyBegin to start the manifold chain
      console.log('[StratiVERSE] Trigger Update Target: Activating Demometric Interchange strategy');
      return strategyBegin(strategy);
    }),
});
