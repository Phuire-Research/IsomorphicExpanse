/**
 * strativerseLifecyclePatternsInfo - Returns complete SCP Management Manifold documentation
 *
 * Unified lifecycle informative: creation, removal, strategy management
 *
 * Type: 'Strativerse Lifecycle Patterns Info' (Verbose Split)
 */
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


export type StrativerseLifecyclePatternsInfo = Quality<StrativerseState>;

export const strativerseLifecyclePatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Lifecycle Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'SCP Management Manifold: Complete Lifecycle Patterns',
        citation: 'SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md',
        purpose: 'Unified reference for all SCP tool lifecycle operations: creation, removal, and strategy management',
        meansNetwork: {
          description: 'Nine means provide complete lifecycle management for qualities and strategies',
          creation: [
            { means: 1, name: 'Quality Create', tool: 'strativerse_quality_create', nodes: 8, purpose: 'Create quality file with all file hookups (exports, types, muxonomy, concept.ts)' },
            { means: 2, name: 'SCP Register', tool: 'strativerse_scp_tool_register', nodes: 2, purpose: 'Register existing quality as SCP tool (quality-based tools ONLY)' },
            { means: 3, name: 'OneShot Quality+SCP', tool: 'strativerse_oneshot_quality_scp', nodes: 10, purpose: 'Combined quality creation + SCP registration in single operation' },
            { means: 7, name: 'Strategy Create', tool: 'strativerse_strategy_create', nodes: 2, purpose: 'Create strategy file + demometer entry (no SCP registration)' },
            { means: 8, name: 'SCP Strategy Create', tool: 'strativerse_scp_strategy_create', nodes: 4, purpose: 'Create strategy file + demometer + import + SCP metadata' },
          ],
          removal: [
            { means: 4, name: 'Quality Remove', tool: 'strativerse_quality_remove', nodes: 9, purpose: 'Remove quality with no-op safe SCP metadata removal' },
            { means: 5, name: 'SCP Unregister', tool: 'none (inline)', nodes: 0, purpose: 'Inline with Means 4 Node 1 - not a standalone tool' },
            { means: 6, name: 'OneShot Remove', tool: 'strativerse_oneshot_quality_remove', nodes: 9, purpose: 'Combined quality + SCP removal (reverse of Means 3)' },
            { means: 9, name: 'SCP Strategy Delete', tool: 'strativerse_scp_strategy_delete', nodes: 5, purpose: 'Delete strategy + demometer + import + SCP metadata (reverse of Means 8)' },
          ],
        },
        decisionMatrix: {
          description: 'Choose the correct means based on what you need to do',
          qualityOperations: [
            { scenario: 'Create new quality WITHOUT SCP tool', use: 'Means 1 (strativerse_quality_create)', reason: 'Quality file hookups only, no MCP registration' },
            { scenario: 'Create new quality WITH SCP tool', use: 'Means 3 (strativerse_oneshot_quality_scp)', reason: 'OneShot handles both quality creation and SCP registration' },
            { scenario: 'Register EXISTING quality as SCP tool', use: 'Means 2 (strativerse_scp_tool_register)', reason: 'Quality already exists, only need SCP metadata' },
            { scenario: 'Remove quality (may or may not have SCP)', use: 'Means 4 (strativerse_quality_remove)', reason: 'No-op safe SCP removal handles both cases' },
            { scenario: 'Remove quality that definitely has SCP', use: 'Means 6 (strativerse_oneshot_quality_remove)', reason: 'Explicit removal mirrors Means 3 spec structure' },
          ],
          strategyOperations: [
            { scenario: 'Create internal strategy (not SCP tool)', use: 'Means 7 (strativerse_strategy_create)', reason: 'Strategy file + demometer only' },
            { scenario: 'Create strategy exposed as SCP tool', use: 'Means 8 (strativerse_scp_strategy_create)', reason: 'Ensures params/inputSchema type alignment' },
            { scenario: 'Delete SCP strategy', use: 'Means 9 (strativerse_scp_strategy_delete)', reason: 'Cascading removal of all Means 8 artifacts' },
          ],
          criticalRules: [
            { rule: 'Strategy-based SCP tools MUST use Means 8', reason: 'Means 2 cannot ensure params/inputSchema alignment' },
            { rule: 'Quality-based SCP tools can use Means 2 or Means 3', reason: 'No params alignment needed for quality handlers' },
            { rule: 'Means 5 is NEVER called standalone', reason: 'SCP unregister is inline with Means 4 Node 1 (no-op safe)' },
            { rule: 'inputSchema is REQUIRED for all SCP registrations', reason: 'generateSCPMetadataEntry calls JSON.stringify(spec.inputSchema).split() - undefined causes TypeError' },
            { rule: 'strategyFileContent export MUST match naming convention', reason: 'Means 7/8 generate import using: create + Concept + StrategyName + Strategy. Mismatch causes TS2724 compilation error on bridge toggle.' },
          ],
        },
        bidirectionalParity: {
          description: 'Every creation means has a corresponding removal means',
          pairs: [
            { creation: 'Means 1 (Quality Create)', removal: 'Means 4 (Quality Remove)', nodes: '8 create / 9 remove' },
            { creation: 'Means 2 (SCP Register)', removal: 'Means 5 (SCP Unregister inline)', nodes: '2 create / 0 standalone (inline)' },
            { creation: 'Means 3 (OneShot Create)', removal: 'Means 6 (OneShot Remove)', nodes: '10 create / 9 remove' },
            { creation: 'Means 7 (Strategy Create)', removal: '(no dedicated removal)', nodes: '2 create / manual' },
            { creation: 'Means 8 (SCP Strategy Create)', removal: 'Means 9 (SCP Strategy Delete)', nodes: '4 create / 5 remove' },
          ],
        },
        bootstrapSequence: {
          description: 'Recursive self-improvement: tools create tools',
          sequence: [
            { step: 1, uses: 'Means 3', creates: 'Means 7 (Strategy Create)', validates: 'Means 3 works' },
            { step: 2, uses: 'Means 3', creates: 'Means 8 (SCP Strategy Create)', validates: 'Means 3 works' },
            { step: 3, uses: 'Means 8', creates: 'Means 4 (Quality Remove)', validates: 'Means 8 works' },
            { step: 4, uses: 'Means 8', creates: 'Means 6 (OneShot Remove)', validates: 'Means 8 works' },
            { step: 5, uses: 'Means 8', creates: 'Means 9 (SCP Strategy Delete)', validates: 'Means 8 works' },
          ],
          insight: 'Each means was created using previously created means (except initial bootstrap via Means 3)',
        },
        keyPatterns: {
          noOpSafeRemoval: {
            description: 'grepReplaceInFiles with 0 matches succeeds with 0 replacements',
            benefit: 'Eliminates decision branching for SCP detection in removal strategies',
            usedBy: ['Means 4 (Node 1)', 'Means 6 (Node 1)', 'Means 9 (Nodes 1-4)'],
          },
          qualityFileContent: {
            description: 'Pass complete TypeScript file as string, bypassing template generation',
            benefit: 'Full control over quality implementation - tool handles file hookups only',
            usedBy: ['Means 1', 'Means 3'],
          },
          strategyFileContent: {
            description: 'Pass complete TypeScript strategy file as string, bypassing template generation',
            benefit: 'Full control over strategy implementation - tool handles file + SCP hookups only',
            usedBy: ['Means 7', 'Means 8'],
          },
          aToBPipe: {
            description: 'cat heredoc | jq -Rs | curl -d @- for zero-temp-file SCP tool invocation',
            benefit: 'File content flows from working context through jq into curl without replication',
            mechanism: 'jq -Rs reads ALL stdin as single raw string. Dot (.) references it in filter. curl -d @- reads from stdin.',
          },
          strategyCreatorNamingConvention: {
            description: 'Strategy creator export name MUST follow: create + capitalize(conceptName) + capitalize(strategyName) + Strategy',
            derivation: 'generateStrategyCreatorName() in Means 8 and Means 9',
            threeNames: {
              creatorName: 'create + Concept + StrategyName + Strategy (function export in strategy file, import in muxonomy.ts)',
              qualityName: 'concept + capitalize(strategyName) (SCP metadata qualityName in muxonomy.ts)',
              demometerName: 'concept + capitalize(strategyName) + Strategy (demometers.strategies name in muxonomy.ts)',
            },
            warning: 'When strategyName already ends in Strategy (e.g., mockTestStrategy), the suffix DOUBLES (createStrativerseMockTestStrategyStrategy). This is by design.',
            failureMode: 'TS2724 compilation error on bridge toggle if strategyFileContent exports wrong name',
            usedBy: ['Means 7 (demometer hookup)', 'Means 8 (all 4 nodes)', 'Means 9 (all 5 removal nodes)'],
          },
        },
        projectRouting: {
          description: 'All Means 1-9 actionable tools accept optional projectName and projectPath top-level parameters for cross-project operations.',
          parameters: {
            projectName: 'Managed project name (looked up from managedProjects state). If omitted along with projectPath, operates on ADMIN_SCP.',
            projectPath: 'Direct project path. Alternative to projectName lookup. Takes precedence if both provided.',
          },
          adminSCPBehavior: {
            rule: 'ADMIN_SCP is the IMPLICIT DEFAULT — it is never listed in managed projects.',
            defaultCase: 'Omit both projectName and projectPath to target ADMIN_SCP.',
            explanation: 'ADMIN_SCP is the server itself (process.cwd()). It does not appear in strativerse_list_managed_projects. All Means 1-9 default to ADMIN_SCP when no routing is specified.',
          },
          examples: [
            { scenario: 'Create quality in ADMIN_SCP (default)', params: '{ "specification": {...} }' },
            { scenario: 'Create quality in managed project', params: '{ "specification": {...}, "projectName": "PhuirE_SCP" }' },
            { scenario: 'Create quality at explicit path', params: '{ "specification": {...}, "projectPath": "/path/to/project" }' },
          ],
          appliesTo: ['Means 1', 'Means 2', 'Means 3', 'Means 4', 'Means 6', 'Means 7', 'Means 8', 'Means 9'],
        },
        pairedInformatives: {
          description: 'Every actionable means has a paired informative for documentation',
          pairs: [
            { actionable: 'strativerse_quality_create', informative: 'strativerse_quality_create_info' },
            { actionable: 'strativerse_scp_tool_register', informative: 'strativerse_scp_register_info' },
            { actionable: 'strativerse_oneshot_quality_scp', informative: 'strativerse_oneshot_info' },
            { actionable: 'strativerse_quality_remove', informative: 'strativerse_quality_remove_info' },
            { actionable: '(Means 5 inline)', informative: 'strativerse_scp_unregister_info' },
            { actionable: 'strativerse_oneshot_quality_remove', informative: 'strativerse_oneshot_remove_info' },
            { actionable: 'strativerse_strategy_create', informative: 'strativerse_strategy_create_info' },
            { actionable: 'strativerse_scp_strategy_delete', informative: 'strativerse_strategy_delete_info' },
            { actionable: '(all means)', informative: 'strativerse_lifecycle_patterns_info (this tool)' },
          ],
        },
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
