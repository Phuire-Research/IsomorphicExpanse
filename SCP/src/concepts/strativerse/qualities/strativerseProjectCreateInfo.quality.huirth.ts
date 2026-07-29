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

export type StrativerseProjectCreateInfo = Quality<StrativerseState>;

export const strativerseProjectCreateInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Project Create Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 10: Project Create from SCP Template',
        citation: 'POC-4-STRATIVERSE-PROJECT-MANAGEMENT-WORKGAMEBOARD.md Section 2.4',
        purpose: 'Creates a new managed project by copying the SCP Template directory, configuring package.json/index.ts, and registering the project in ADMIN_SCP state',
        pairedActionable: 'strativerse_project_create',
        fieldDefinitions: [
          {
            field: 'specification.projectName',
            type: 'string',
            required: true,
            description: 'Project name (e.g., "phuire-scp"). Used for package.json name and muxium title.',
          },
          {
            field: 'specification.targetPath',
            type: 'string',
            required: true,
            description: 'Absolute filesystem path for the new project directory. Must not already exist.',
          },
          {
            field: 'specification.port',
            type: 'number',
            required: true,
            description: 'Express server port for the new project. Must be unique across all managed projects.',
          },
        ],
        nodeChain: {
          description: '6-node strategy chain (built reverse, executed forward)',
          nodes: [
            { node: 1, quality: 'fileSystemCopyMoveTargetDirectory', purpose: 'Copy SCP Template directory to targetPath' },
            { node: 2, quality: 'grepReplaceInFiles', purpose: 'Update package.json name field' },
            { node: 3, quality: 'grepReplaceInFiles', purpose: 'Update default port in index.ts' },
            { node: 4, quality: 'grepReplaceInFiles', purpose: 'Update muxium name in index.ts' },
            { node: 5, quality: 'strativerseAddManagedProject', purpose: 'Add ProjectEntry to ADMIN_SCP managedProjects state' },
            { node: 6, quality: 'strategySuccess', purpose: 'Return ProjectEntry as DataField' },
          ],
        },
        templateInfo: {
          source: 'SCP Template directory (Co-Located architecture)',
          architecture: 'Co-Located: src/concepts/ (NO server/ subdirectory)',
          defaultPort: 7637,
          defaultName: 'huirth-scp-template',
          excludedFromCopy: ['node_modules/', 'dist/', '.git/', 'package-lock.json'],
          postCreateSteps: [
            'cd targetPath && npm install',
            'npm run bridge (or PORT=XXXX npm run bridge)',
            'Verify tools/list returns empty array',
          ],
        },
        portAllocationGuidance: {
          adminPort: 7111,
          templateDefaultPort: 7637,
          recommendation: 'Use ports 8000-9999 for managed projects to avoid conflicts',
          rule: 'Each managed project must have a unique port',
        },
        projectEntryFields: {
          description: 'ProjectEntry created in ADMIN_SCP state after successful project creation',
          fields: [
            'name: string (from projectName)',
            'path: string (from targetPath)',
            'templateVersion: string (from SCP Template package.json)',
            'exists: boolean (true after creation)',
            'port: number (from specification)',
            'concepts: string[] (empty initially)',
            'conceptEntries: ConceptEntry[] (empty initially)',
            'hasMuxonomy: boolean (false initially)',
            'registeredTools: string[] (empty initially)',
            'registeredNavigation: string[] (empty initially)',
            'createdAt: number (Date.now())',
            'lastScanned: number (0 initially)',
            'lastModified: number (Date.now())',
            'status: active',
          ],
        },
        relatedTools: [
          { tool: 'strativerse_concept_create_info', purpose: 'Add concepts to created project' },
          { tool: 'strativerse_concept_remove_info', purpose: 'Remove concepts from project' },
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
