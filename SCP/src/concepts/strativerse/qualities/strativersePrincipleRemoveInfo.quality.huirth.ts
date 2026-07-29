/**
 * strativersePrincipleRemoveInfo - Means 11 Informative
 *
 * Documents the specification for removing principles.
 * Paired with strativerse_oneshot_principle_remove (Means 12).
 *
 * Citation: Crystraline 6 Diamond Plan - Means 11
 */
import {
  createQualityCard,
  defaultReducer,
  createMethodWithConcepts,
  strategyData_muxifyData,
  strategySuccess,
  type Quality,
} from 'stratimux';
import type { StrativerseState } from '../strativerse.type';

const LOG = '[StratiVERSE] PrincipleRemoveInfo:';

export const strativersePrincipleRemoveInfo = createQualityCard<StrativerseState>({
  type: 'Strativerse Principle Remove Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      console.log(LOG, 'Returning Means 11 specification');

      const informativeContent = {
        title: 'Means 11: Principle Remove Specification',
        citation: 'Crystraline 6 Diamond Plan - Means 11',
        description: 'Documents how to remove a principle from a concept. Paired with strativerse_oneshot_principle_remove (Means 12).',

        fieldDefinitions: [
          {
            field: 'specification.principleName',
            type: 'string',
            required: true,
            description: 'camelCase variable name of principle to remove (e.g., strativerseSyncWatcher)',
          },
          {
            field: 'specification.conceptName',
            type: 'string',
            required: true,
            description: 'Target concept (e.g., strativerse)',
          },
          {
            field: 'specification.location',
            type: "'huirth' | 'client' | 'all'",
            required: true,
            description: 'Deployment location suffix for file naming',
          },
          {
            field: 'specification.projectName',
            type: 'string',
            required: false,
            description: 'Target project name (defaults to first managed project)',
          },
          {
            field: 'specification.projectPath',
            type: 'string',
            required: false,
            description: 'Alternative: direct path to project root',
          },
        ],

        fileOperations: {
          description: 'Means 12 removes all file modifications created by Means 10:',
          operations: [
            '1. Delete principle file from principles/{name}.principle.{location}.ts',
            '2. Remove import statement from {concept}.concept.ts',
            '3. Remove from principles[] array in createConcept',
            '4. Remove demometer entry from {concept}.muxonomy.ts',
          ],
        },

        reverseOfMeans10: {
          description: 'Means 12 performs the inverse of Means 10 (OneShot Principle Create)',
          means10Operations: [
            'Means 10 Step 1: Create principle file -> Means 12: Delete principle file',
            'Means 10 Step 2: Add import -> Means 12: Remove import',
            'Means 10 Step 3: Add to principles array -> Means 12: Remove from array',
            'Means 10 Step 4: Add demometer -> Means 12: Remove demometer',
          ],
        },

        specificationTemplate: {
          specification: {
            principleName: 'myPrincipleToRemove',
            conceptName: 'strativerse',
            location: 'huirth',
            projectName: 'optional - target project',
          },
        },

        pairedActionable: 'strativerse_oneshot_principle_remove',

        relatedTools: [
          { tool: 'strativerse_oneshot_principle_info', purpose: 'Means 10 Info - principle creation spec' },
          { tool: 'strativerse_oneshot_principle', purpose: 'Means 10 - creates principles (inverse operation)' },
        ],

        whenToUse: [
          { scenario: 'Remove a principle that was created via Means 10', recommendation: 'Use Means 12' },
          { scenario: 'Remove a manually created principle', recommendation: 'Use Means 12' },
          { scenario: 'Clean up after failed principle creation', recommendation: 'Use Means 12' },
        ],
      };

      if (action.strategy) {
        return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, informativeContent));
      }
      return action;
    }),
});

export type StrativersePrincipleRemoveInfoQuality = Quality<StrativerseState>;
