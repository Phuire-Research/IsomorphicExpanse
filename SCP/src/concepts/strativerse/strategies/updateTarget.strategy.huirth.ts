import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { StrativerseConcept } from '../strativerse.concept';
import type { TriggerUpdateTargetPayload } from '../strativerse.type';
import type { GrepConcept } from '../../grep/grep.concept';

/**
 * Update Target Strategy - Muxonomy Modification Manifold
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 *
 * ClientStateKey Routing Manifold (A→B→Y→Z):
 *
 * CLIENT                          WEBSOCKET SERVER                    MUXIUM
 * ──────                          ────────────────                    ──────
 * 1. Dispatch triggerUpdateTarget
 *    (Induction wraps with        2. Receive message
 *    strategyDetermine)           3. Clone strategy
 *                                 4. strategyData_muxifyData({ clientStateKey })
 *                                 5. Dispatch to muxium ─────────────────►
 *                                                                     6. triggerUpdateTarget receives
 *                                                                        - Extracts clientStateKey from strategy.data
 *                                                                        - Creates THIS strategy
 *                                                                        - Transfers clientStateKey to strategy.data
 *                                                                     7. updateQualityTarget (B) → renames file
 *                                                                     8. scanConcepts (Y) → rescans directory
 *                                                                     9. setConceptList → updates state
 *                                                                     10. broadcastConceptList (Z) → ALL clients
 * ◄───────────────────────────────────────────────────────────────────
 * ALL clients receive updated conceptList (broadcast pattern)
 *
 * CRITICAL: clientStateKey is transferred in triggerUpdateTarget via:
 *   strategy.data = { ...strategy.data, clientStateKey }
 * This enables response routing if targeted delivery is needed.
 *
 * Strategy Flow:
 * 1. updateQualityTarget (EXECUTOR) → renames file per naming convention
 * 2. cascadeImportPaths (GREP) → updates import paths in concept files
 * 3. scanConcepts (REFRESH) → rescans to pick up renamed file
 * 4. setConceptList (STATE) → updates concept list with new data
 * 5. broadcastConceptList (Z RETURN) → broadcasts to ALL clients
 *
 * POC 2.5: Grep concept accessed via selectStratiDECK - isolated to Huirth
 */
export function createUpdateTargetStrategy(
  deck: unknown,
  payload: TriggerUpdateTargetPayload
): ActionStrategy | undefined {

  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');

  if (!strativerseDeck) {
    console.error('[StratiVERSE] Failed to access strativerse deck');
    return undefined;
  }

  if (!grepDeck) {
    console.error('[StratiVERSE] Failed to access grep deck - import cascading disabled');
    // Continue without grep - will just skip import cascading
  }

  // Look up concept path from state
  const conceptList = strativerseDeck.k.conceptList.select();
  const concept = conceptList.concepts.find(c => c.name === payload.conceptName);
  const conceptPath = concept?.path ?? '';

  console.log('[StratiVERSE] Creating update target strategy', {
    conceptName: payload.conceptName,
    conceptPath,
    aspectType: payload.aspectType,
    aspectName: payload.aspectName,
    newTarget: payload.newTarget,
  });

  // Z RETURN Node: Broadcast updated conceptList to all connected clients
  const broadcastNode = createActionNode(
    strativerseDeck.e.strativerseBroadcastConceptList({}),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'updated concept list broadcast to clients.'
      }
    }
  );

  // STATE Node: setConceptList extracts from StrategyData
  const setConceptListNode = createActionNode(
    strativerseDeck.e.strativerseSetConceptList({}),
    {
      successNode: broadcastNode,
      successNotes: {
        preposition: 'then',
        denoter: 'concept list state updated;'
      }
    }
  );

  // REFRESH Node: Rescan to pick up the renamed file
  const rescanNode = createActionNode(
    strativerseDeck.e.strativerseScanConcepts({}),
    {
      successNode: setConceptListNode,
      successNotes: {
        preposition: 'then',
        denoter: 'concepts directory rescanned;'
      }
    }
  );

  // CASCADE Node: Update import paths in concept files (POC 2.5)
  // Only included if grep deck available and concept path found
  let cascadeNode = rescanNode; // Default: skip cascade, go directly to rescan
  if (grepDeck && conceptPath) {
    cascadeNode = createActionNode(
      grepDeck.e.grepCascadeImportPaths({ conceptPath }),
      {
        successNode: rescanNode,
        successNotes: {
          preposition: 'then',
          denoter: 'import paths cascaded;'
        }
      }
    );
  }

  // EXECUTOR Node: updateQualityTarget performs the file rename
  const updateTargetNode = createActionNode(
    strativerseDeck.e.strativerseUpdateQualityTarget(payload),
    {
      successNode: cascadeNode,
      successNotes: {
        preposition: 'First',
        denoter: `${payload.aspectType} deployment target updated;`
      }
    }
  );

  return createStrategy({
    topic: 'StratiVERSE Manifold - Update Deployment Target',
    initialNode: updateTargetNode,
    data: {
      ...payload,
      conceptPath,
      initTimestamp: Date.now()
    }
  });
}
