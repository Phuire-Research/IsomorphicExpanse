import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { StrativerseConcept } from '../strativerse.concept';

/**
 * StratiVERSE Initialization Strategy - 7-Node Manifold Circuit
 *
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data - Universal Transformer Pattern"
 * Citation: FORWARD-PASS-POC4-PHASE4-MANAGED-PROJECTS-PERSISTENCE.md Phase 4B.4
 *
 * Strategy Flow (7-Node Chain):
 * 1. readManagedProjectsFile → muxifies { managedProjects } to StrategyData
 * 2. setManagedProjects → reducer extracts from StrategyData, populates state
 * 3. scanConcepts (PRODUCER) → muxifies { concepts, lastScan, scanPath }
 * 4. setConceptList (CONSUMER) → reducer extracts, updates ADMIN_SCP concept state
 * 5. scanManagedProjects → iterates managedProjects, muxifies { scannedProjects }
 * 6. updateManagedProjectEntries → reducer merges scan results into ProjectEntry
 * 7. broadcastConceptList (Z RETURN) → broadcasts updated state to clients
 */
export function createStrativerseInitializationStrategy(
  deck: unknown,
  scanPath?: string
): ActionStrategy | undefined {

  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!strativerseDeck) {
    console.error('[StratiVERSE] Failed to access strativerse deck');
    return undefined;
  }

  console.log('[StratiVERSE] Creating initialization strategy (7-Node Manifold)');

  // Node 7 (Z RETURN): Broadcast updated state to all connected clients
  const broadcastNode = createActionNode(
    strativerseDeck.e.strativerseBroadcastConceptList({}),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'concept list broadcast to connected clients.'
      }
    }
  );

  // Node 6: Merge scanned conceptEntries into each managed ProjectEntry
  const updateManagedProjectEntriesNode = createActionNode(
    strativerseDeck.e.strativerseUpdateManagedProjectEntries({}),
    {
      successNode: broadcastNode,
      successNotes: {
        preposition: 'then',
        denoter: 'managed project entries updated with scan results;'
      }
    }
  );

  // Node 5: Scan each managed project's src/concepts/ directory
  const scanManagedProjectsNode = createActionNode(
    strativerseDeck.e.strativerseScanManagedProjects({}),
    {
      successNode: updateManagedProjectEntriesNode,
      successNotes: {
        preposition: 'then',
        denoter: 'managed projects scanned;'
      }
    }
  );

  // Node 4: setConceptList extracts from StrategyData in its reducer
  const setConceptListNode = createActionNode(
    strativerseDeck.e.strativerseSetConceptList({}),
    {
      successNode: scanManagedProjectsNode,
      successNotes: {
        preposition: 'then',
        denoter: 'concept list state updated;'
      }
    }
  );

  // Node 3: scanConcepts appends ADMIN_SCP concept data to StrategyData
  const scanConceptsNode = createActionNode(
    strativerseDeck.e.strativerseScanConcepts({
      scanPath
    }),
    {
      successNode: setConceptListNode,
      successNotes: {
        preposition: 'then',
        denoter: 'ADMIN_SCP concepts directory scanned;'
      }
    }
  );

  // Node 2: Set managedProjects state from file data
  const setManagedProjectsNode = createActionNode(
    strativerseDeck.e.strativerseSetManagedProjects({}),
    {
      successNode: scanConceptsNode,
      successNotes: {
        preposition: 'then',
        denoter: 'managed projects state populated from file;'
      }
    }
  );

  // Node 1: Read .managed-projects.json persistence file
  const readManagedProjectsFileNode = createActionNode(
    strativerseDeck.e.strativerseReadManagedProjectsFile({}),
    {
      successNode: setManagedProjectsNode,
      successNotes: {
        preposition: 'First',
        denoter: 'managed projects file read;'
      }
    }
  );

  return createStrategy({
    topic: 'StratiVERSE Manifold - Initialize, Scan, and Broadcast',
    initialNode: readManagedProjectsFileNode,
    data: {
      scanPath,
      initTimestamp: Date.now()
    }
  });
}
