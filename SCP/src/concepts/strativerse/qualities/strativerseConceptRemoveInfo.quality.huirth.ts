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

export type StrativerseConceptRemoveInfo = Quality<StrativerseState>;

export const strativerseConceptRemoveInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Concept Remove Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 12: Concept Remove from Managed Project',
        citation: 'POC-4-STRATIVERSE-PROJECT-MANAGEMENT-WORKGAMEBOARD.md Section 2.6',
        purpose: 'Removes a concept from a target managed project: removes file hookups from huirth.concept.ts, vue.principle.ts, IslandWrapper.vue, then deletes the concept directory. Reverse of Means 11.',
        pairedActionable: 'strativerse_concept_remove',
        fieldDefinitions: [
          {
            field: 'specification.projectPath',
            type: 'string',
            required: true,
            description: 'Absolute filesystem path to the target managed project root.',
          },
          {
            field: 'specification.conceptName',
            type: 'string',
            required: true,
            description: 'Name of the concept to remove (camelCase, must match existing concept directory name).',
          },
        ],
        nodeChain: {
          description: '6-node strategy chain (all always execute, no-op safe) — reverse order of Means 11 creation',
          nodes: [
            { node: 1, quality: 'grepReplaceInFiles', purpose: 'Remove island registry entry from IslandWrapper.vue (no-op safe)' },
            { node: 2, quality: 'grepReplaceInFiles', purpose: 'Remove REGISTERED_MUXONOMICS entry from vue.principle.ts (no-op safe)' },
            { node: 3, quality: 'grepReplaceInFiles', purpose: 'Remove muxonomy import from vue.principle.ts (no-op safe)' },
            { node: 4, quality: 'grepReplaceInFiles', purpose: 'Remove muxifyConcepts entry from huirth.concept.ts' },
            { node: 5, quality: 'grepReplaceInFiles', purpose: 'Remove concept import from huirth.concept.ts' },
            { node: 6, quality: 'fileSystemRemoveTargetDirectory', purpose: 'Delete entire concept directory: projectPath/src/concepts/{conceptName}/' },
          ],
        },
        architectureNotes: {
          pathPattern: 'Co-Located: path.join(projectPath, "src", "concepts", conceptName) — NO server/ subdirectory',
          directoryDeleted: 'projectPath/src/concepts/{conceptName}/ (entire directory tree)',
          filesModified: [
            'projectPath/src/concepts/huirth/huirth.concept.ts (remove import + muxifyConcepts entry)',
            'projectPath/src/concepts/vue/vue.principle.ts (remove muxonomy import + REGISTERED_MUXONOMICS entry, no-op safe)',
            'projectPath/src/concepts/vue/IslandWrapper.vue (remove island registry entry, no-op safe)',
          ],
          noOpSafeRemoval: 'All grep nodes are no-op safe — grepReplaceInFiles succeeds with 0 replacements if pattern not found. Works for pre-existing concepts that lack Vue artifacts.',
          pathProtection: 'fileSystemRemoveTargetDirectory includes path protection — refuses to delete protected system directories.',
        },
        removalImpact: {
          description: 'What happens when a concept is removed',
          effects: [
            'All quality files in the concept directory are deleted',
            'All strategy files in the concept directory are deleted',
            'All principle files in the concept directory are deleted',
            'The concept import is removed from huirth.concept.ts',
            'The concept is removed from muxifyConcepts array',
            'Vue navigation entries are removed (if they existed)',
            'The concept state is no longer available in the muxium',
          ],
          doesNotAffect: [
            'Other concepts in the project',
            'ADMIN_SCP state (managedProjects entry persists)',
            'Project package.json or index.ts',
            'node_modules or dist directories',
          ],
        },
        preRemovalChecklist: [
          'Verify no other concepts import from the concept being removed',
          'Check for cross-concept quality references',
          'Ensure no strategies reference the concept qualities',
          'Consider running a grep for the concept name across the project first',
        ],
        relatedTools: [
          { tool: 'strativerse_concept_create_info', purpose: 'Create concepts in project (reverse of this tool)' },
          { tool: 'strativerse_project_create_info', purpose: 'Create the managed project' },
          { tool: 'strativerse_lifecycle_patterns_info', purpose: 'Complete SCP lifecycle reference' },
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
