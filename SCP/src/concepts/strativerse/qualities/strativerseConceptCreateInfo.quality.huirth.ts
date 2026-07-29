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

export type StrativerseConceptCreateInfo = Quality<StrativerseState>;

export const strativerseConceptCreateInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Concept Create Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 11: Concept Create in Managed Project',
        citation: 'POC-4-STRATIVERSE-PROJECT-MANAGEMENT-WORKGAMEBOARD.md Phase 3 C.2',
        purpose: 'Scaffolds a new concept in a target managed project: creates concept directory with all files (including Vue landing page), hooks into huirth.concept.ts, vue.principle.ts, and IslandWrapper.vue. All 11 nodes always execute — Vue artifacts are always created. Visibility is controlled by NavigationConfig.enabled toggle in the generated muxonomy.',
        pairedActionable: 'strativerse_concept_create',
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
            description: 'Name of the new concept (camelCase, e.g., "myFeature"). Used for directory name and file names.',
          },
          {
            field: 'specification.stateName',
            type: 'string',
            required: true,
            description: 'TypeScript type name for the concept state (PascalCase, e.g., "MyFeatureState").',
          },
          {
            field: 'specification.location',
            type: "'huirth' | 'client' | 'all'",
            required: true,
            description: 'Quality location tag. huirth = server-only, client = client-only, all = both.',
          },
          {
            field: 'specification.stateFields',
            type: 'Array<{ name: string, type: string, defaultValue: string }>',
            required: true,
            description: 'State fields for the concept. Each entry defines a property on the concept state.',
          },
          {
            field: 'specification.landingPageEnabled',
            type: 'boolean',
            required: false,
            description: 'Controls the enabled VALUE in the generated NavigationConfig. Default: false (landing page exists but hidden from routing/sidebar). Set true to make visible immediately. Can be toggled later by editing the muxonomy file.',
          },
          {
            field: 'specification.navigationConfig',
            type: '{ label: string, icon: string, color: string, order: number }',
            required: false,
            description: 'Vue navigation configuration. Optional — defaults: label=PascalName, icon="box", color="cobalt", order=99.',
          },
        ],
        nodeChain: {
          description: '11-node strategy chain (all always execute, no conditional branching)',
          nodes: [
            { node: 1, quality: 'fileSystemCreateTargetDirectory', purpose: 'Create concept + qualities directory: projectPath/src/concepts/{conceptName}/qualities/' },
            { node: 2, quality: 'fileSystemCreateTargetDirectory', purpose: 'Create vue subdirectory: projectPath/src/concepts/{conceptName}/vue/' },
            { node: 3, quality: 'fileSystemCreateFileWithContentsIndex', purpose: 'Generate {conceptName}.concept.ts (arrow function pattern, no explicit return type)' },
            { node: 4, quality: 'fileSystemCreateFileWithContentsIndex', purpose: 'Generate qualities/types.ts (state type export)' },
            { node: 5, quality: 'fileSystemCreateFileWithContentsIndex', purpose: 'Generate {conceptName}.muxonomy.ts (MuxonomicConfig with NavigationConfig.enabled from landingPageEnabled)' },
            { node: 6, quality: 'fileSystemCreateFileWithContentsIndex', purpose: 'Generate vue/{PascalName}Landing.vue (Vue SFC with ClientMuxium pattern)' },
            { node: 7, quality: 'grepReplaceInFiles', purpose: 'Add import to huirth.concept.ts (anchor: createSCPConcept import)' },
            { node: 8, quality: 'grepReplaceInFiles', purpose: 'Add to muxifyConcepts array in huirth.concept.ts (anchor: createSCPConcept())' },
            { node: 9, quality: 'grepReplaceInFiles', purpose: 'Add muxonomy import to vue.principle.ts (anchor: muxonomy.model import)' },
            { node: 10, quality: 'grepReplaceInFiles', purpose: 'Add to REGISTERED_MUXONOMICS in vue.principle.ts (anchor: DEFAULT_LANDING_MUXONOMIC)' },
            { node: 11, quality: 'grepReplaceInFiles', purpose: 'Add island registry entry in IslandWrapper.vue (anchor: default island entry)' },
          ],
        },
        architectureNotes: {
          pathPattern: 'Co-Located: path.join(projectPath, "src", "concepts", conceptName) — NO server/ subdirectory',
          filesCreated: [
            'projectPath/src/concepts/{conceptName}/qualities/ (directory)',
            'projectPath/src/concepts/{conceptName}/vue/ (directory)',
            'projectPath/src/concepts/{conceptName}/{conceptName}.concept.ts',
            'projectPath/src/concepts/{conceptName}/qualities/types.ts',
            'projectPath/src/concepts/{conceptName}/{conceptName}.muxonomy.ts',
            'projectPath/src/concepts/{conceptName}/vue/{PascalName}Landing.vue',
          ],
          filesModified: [
            'projectPath/src/concepts/huirth/huirth.concept.ts (import + muxifyConcepts)',
            'projectPath/src/concepts/vue/vue.principle.ts (muxonomy import + REGISTERED_MUXONOMICS)',
            'projectPath/src/concepts/vue/IslandWrapper.vue (island registry)',
          ],
          vueLandingPageToggle: 'Vue artifacts are ALWAYS created. NavigationConfig.enabled controls visibility: false = landing page exists but hidden from sidebar/routing. true or undefined = visible. Toggle by editing the muxonomy file and restarting.',
        },
        stateFieldExample: {
          description: 'Example stateFields for a counter concept',
          example: [
            { name: 'counter', type: 'number', defaultValue: '0' },
            { name: 'label', type: 'string', defaultValue: "'My Counter'" },
            { name: 'active', type: 'boolean', defaultValue: 'true' },
          ],
        },
        relatedTools: [
          { tool: 'strativerse_project_create_info', purpose: 'Create the managed project first' },
          { tool: 'strativerse_concept_remove_info', purpose: 'Remove concepts from project (reverse of this tool)' },
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
