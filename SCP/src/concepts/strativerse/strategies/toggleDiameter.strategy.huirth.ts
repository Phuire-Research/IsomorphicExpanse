import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { StrativerseConcept } from '../strativerse.concept';
import type { TriggerToggleDiameterPayload } from '../strativerse.type';

/**
 * Toggle Diameter Strategy - Muxonomy Modification Manifold
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 *
 * ClientStateKey Routing Manifold (A→B→Y→Z):
 *
 * CLIENT                          WEBSOCKET SERVER                    MUXIUM
 * ──────                          ────────────────                    ──────
 * 1. Dispatch triggerToggleDiameter
 *    (Induction wraps with        2. Receive message
 *    strategyDetermine)           3. Clone strategy
 *                                 4. strategyData_muxifyData({ clientStateKey })
 *                                 5. Dispatch to muxium ─────────────────►
 *                                                                     6. triggerToggleDiameter receives
 *                                                                        - Extracts clientStateKey from strategy.data
 *                                                                        - Creates THIS strategy
 *                                                                        - Transfers clientStateKey to strategy.data
 *                                                                     7. toggleDiameter (B) → renames file
 *                                                                     8. scanConcepts (Y) → rescans directory
 *                                                                     9. setConceptList → updates state
 *                                                                     10. broadcastConceptList (Z) → ALL clients
 * ◄───────────────────────────────────────────────────────────────────
 * ALL clients receive updated conceptList (broadcast pattern)
 *
 * CRITICAL: clientStateKey is transferred in triggerToggleDiameter via:
 *   strategy.data = { ...strategy.data, clientStateKey }
 * This enables response routing if targeted delivery is needed.
 *
 * Strategy Flow:
 * 1. toggleDiameter (EXECUTOR) → renames file to add/remove .diameter. segment
 * 2. scanConcepts (REFRESH) → rescans to pick up renamed file
 * 3. setConceptList (STATE) → updates concept list with new data
 * 4. broadcastConceptList (Z RETURN) → broadcasts to ALL clients
 */
export function createToggleDiameterStrategy(
  deck: unknown,
  payload: TriggerToggleDiameterPayload
): ActionStrategy | undefined {

  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!strativerseDeck) {
    console.error('[StratiVERSE] Failed to access strativerse deck');
    return undefined;
  }

  console.log('[StratiVERSE] Creating toggle diameter strategy', {
    conceptName: payload.conceptName,
    qualityName: payload.qualityName,
    enableDiameter: payload.enableDiameter,
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

  // EXECUTOR Node: toggleDiameter performs the file rename
  // Note: This quality will be created in step 1.6.4
  const toggleDiameterNode = createActionNode(
    strativerseDeck.e.strativerseToggleDiameter(payload),
    {
      successNode: rescanNode,
      successNotes: {
        preposition: 'First',
        denoter: `quality diameter ${payload.enableDiameter ? 'enabled' : 'disabled'};`
      }
    }
  );

  return createStrategy({
    topic: 'StratiVERSE Manifold - Toggle Quality Diameter',
    initialNode: toggleDiameterNode,
    data: {
      ...payload,
      initTimestamp: Date.now()
    }
  });
}
