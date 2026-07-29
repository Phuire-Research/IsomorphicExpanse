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

export type StrativerseDependencyMapInfo = Quality<StrativerseState>;

export const strativerseDependencyMapInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Dependency Map Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Concept Dependency Map System',
        citation: 'BREAKOUT-POC4-PHASE5-CONCEPT-SYNCHRONIZATION-LIBRARY.md — Phase 5B',
        description: 'Analyzes TypeScript import relationships between concepts to build a dependency graph. Used by concept synchronization (Phase 5C) to validate dependencies exist in target project before transferring concepts.',
        types: {
          ConceptDependency: {
            fields: [
              { name: 'conceptName', type: 'string', description: 'Name of the concept' },
              { name: 'importedFrom', type: 'string[]', description: 'Other concepts this concept imports from' },
              { name: 'importedBy', type: 'string[]', description: 'Other concepts that import from this concept' },
              { name: 'sharedTypes', type: 'string[]', description: 'Named exports imported from other concepts' },
              { name: 'stratimuxImports', type: 'string[]', description: 'Framework imports from stratimux' },
            ],
          },
          ConceptDependencyMap: {
            fields: [
              { name: 'projectPath', type: 'string', description: 'Root path of the analyzed project' },
              { name: 'dependencies', type: 'Record<string, ConceptDependency>', description: 'Map of concept names to their dependency entries' },
              { name: 'generatedAt', type: 'number', description: 'Timestamp when the map was generated' },
            ],
          },
        },
        usage: {
          pairedActionable: 'strativerse_build_dependency_map',
          inputSchema: {
            projectPath: { type: 'string', required: false, description: 'Project root path (defaults to ADMIN_SCP)' },
          },
          outputFields: ['projectPath', 'dependencies', 'generatedAt'],
        },
        algorithm: [
          '1. List all concept directories under src/concepts/',
          '2. For each concept, gather all .ts files (excluding test/ and node_modules/)',
          '3. Parse import statements from each file',
          '4. Classify imports: stratimux (framework) vs cross-concept (relative paths)',
          '5. Resolve relative import paths to determine referenced concept',
          '6. Build forward mapping (importedFrom) and reverse mapping (importedBy)',
          '7. Collect shared type names from cross-concept imports',
        ],
        integrationPoints: [
          'Phase 5C: Sync validation — verify dependencies exist in target before transfer',
          'Phase 5E: Vue UI — dependencies tab showing concept relationships',
        ],
        relatedTools: [
          { tool: 'strativerse_build_dependency_map', purpose: 'Build dependency map for a project' },
          { tool: 'strativerse_concept_list', purpose: 'List all concepts with full metadata' },
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
