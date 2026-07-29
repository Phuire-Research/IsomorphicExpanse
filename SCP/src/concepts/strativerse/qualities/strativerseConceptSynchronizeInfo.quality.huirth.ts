import {
  createQualityCard,
  createMethodWithConcepts,
  strategySuccess,
  strategyData_muxifyData,
  muxiumConclude,
  defaultReducer,
  type Quality,
} from 'stratimux';
import type { StrativerseState } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';

export type StrativerseConceptSynchronizeInfo = Quality<StrativerseState>;

export const strativerseConceptSynchronizeInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Concept Synchronize Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Concept Synchronization System',
        citation: 'BREAKOUT-POC4-PHASE5-CONCEPT-SYNCHRONIZATION-LIBRARY.md — Phase 5C',
        description: 'Synchronizes concepts between projects with dependency validation and version-based halting to prevent infinite retrigger loops.',
        syncProcess: [
          '1. Validate source concept exists with muxonomy file',
          '2. Build dependency map for source project',
          '3. Validate all dependencies exist in target project',
          '4. Read current syncVersion from source muxonomy',
          '5. Copy concept directory recursively (source -> target)',
          '6. Increment syncVersion in BOTH source and target muxonomy files',
        ],
        versionHalting: {
          description: 'syncVersion prevents infinite sync loops between projects',
          mechanism: 'After sync, both source and target have syncVersion N+1. When Chokidar detects the file change in target, the watcher reads syncVersion and compares to lastSyncedVersion. If equal, the change was sync-written — HALT (no retrigger).',
          flow: 'User edits concept -> Chokidar detects -> version differs -> trigger sync OUT -> increment version -> Chokidar detects sync-written -> version matches -> HALT',
        },
        inputParams: {
          conceptName: { type: 'string', required: true, description: 'Name of the concept to synchronize' },
          sourceProjectPath: { type: 'string', required: true, description: 'Root path of the source project' },
          targetProjectPath: { type: 'string', required: true, description: 'Root path of the target project' },
        },
        outputFields: ['conceptName', 'sourceProjectPath', 'targetProjectPath', 'syncVersion', 'importedFrom', 'importedBy'],
        dependencyValidation: {
          description: 'Before copying, validates that all concepts the source concept imports from exist in the target project. Prevents broken imports in target.',
          failureMessage: 'Missing dependencies in target: [list of missing concept names]',
        },
        integrationPoints: [
          'Phase 5B: Dependency map provides import analysis for validation',
          'Phase 5D: SyncWatcher principle triggers this strategy on file changes',
          'Phase 5A: syncManaged toggle controls which concepts participate in sync',
        ],
        relatedTools: [
          { tool: 'strativerse_concept_synchronize', purpose: 'Execute concept synchronization' },
          { tool: 'strativerse_build_dependency_map', purpose: 'Analyze concept dependencies' },
          { tool: 'strativerse_toggle_sync_managed', purpose: 'Toggle sync participation per concept' },
        ],
      };

      if (action.strategy) {
        return strategySuccess(
          action.strategy,
          strategyData_muxifyData(action.strategy, informativeContent)
        );
      }
      return muxiumConclude();
    }),
});
