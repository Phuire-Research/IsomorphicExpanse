/**
 * strativerseStrategyDeleteInfo - Returns SCPStrategyDeletionSpecification documentation with field definitions, 5-node chain, and related tools
 *
 * Paired Informative for Means 9: strativerse_scp_strategy_delete
 *
 * Type: 'Strativerse Strategy Delete Info' (Verbose Split)
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


export type StrativerseStrategyDeleteInfo = Quality<StrativerseState>;

export const strativerseStrategyDeleteInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Strategy Delete Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 9: SCP Strategy Deletion Specification',
        citation: 'SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md: Phase 3.1',
        purpose: 'Delete an SCP strategy from the system with cascading removal of all registrations',
        designPrinciple: {
          description: 'Reverse of Means 8 (SCP Strategy Create) - removes everything Means 8 created',
          means8Creates: [
            'Strategy file in strategies/',
            'Demometer entry in muxonomy.ts demometers.strategies',
            'StrategyCreator import in muxonomy.ts',
            'scpToolMetadata entry in muxonomy.ts',
          ],
          means9Removes: [
            'scpToolMetadata entry from muxonomy.ts (Node 1)',
            'StrategyCreator import from muxonomy.ts (Node 2)',
            'Demometer entry from demometers.strategies (Node 3)',
            'Export from strategies/index.ts (Node 4 - no-op safe)',
            'Strategy file deletion (Node 5)',
          ],
        },
        specificationStructure: {
          type: 'SCPStrategyDeletionSpecification',
          fields: [
            { field: 'strategyName', type: 'string', required: true, description: 'camelCase strategy name (e.g., scpStrategyCreate)' },
            { field: 'conceptName', type: 'string', required: true, description: 'Target concept (e.g., strativerse)' },
            { field: 'location', type: 'huirth | client | all', required: true, description: 'Deployment target for file path resolution' },
            { field: 'toolName', type: 'string', required: true, description: 'SCP tool name being removed (e.g., strativerse_scp_strategy_create)' },
          ],
        },
        nodeChain: {
          description: 'Means 9 executes 5 nodes in sequence (reverse of Means 8 creation order)',
          nodes: [
            {
              node: 1,
              action: 'grepReplaceInFiles',
              purpose: 'Remove scpToolMetadata entry from muxonomy.ts',
              pattern: 'Matches qualityName containing conceptName + capitalizedStrategyName within scpToolMetadata array',
              noOpSafe: true,
            },
            {
              node: 2,
              action: 'grepReplaceInFiles',
              purpose: 'Remove strategyCreator import from muxonomy.ts',
              pattern: 'Matches import { creatorFunctionName } from path statement',
              noOpSafe: true,
            },
            {
              node: 3,
              action: 'grepReplaceInFiles',
              purpose: 'Remove demometer entry from demometers.strategies array',
              pattern: 'Matches { name: demometerName, ... } object in strategies array',
              noOpSafe: true,
            },
            {
              node: 4,
              action: 'grepReplaceInFiles',
              purpose: 'Remove export from strategies/index.ts',
              pattern: 'No-op safe - strategies/index.ts does not currently exist',
              noOpSafe: true,
            },
            {
              node: 5,
              action: 'fileSystemRemoveTargetDirectory',
              purpose: 'Delete the strategy file from strategies/ directory',
              noOpSafe: false,
            },
          ],
          buildOrder: 'Reverse order (Node 5 first, then Node 4 with successNode to 5, etc.)',
        },
        noOpSafePattern: {
          description: 'Nodes 1-4 use grepReplaceInFiles which succeeds with 0 replacements when pattern not found',
          benefit: 'No decision branching needed - removal is idempotent',
          applies: 'Node 4 especially (no strategies/index.ts exists)',
        },
        criticalNamingDerivation: {
          description: 'Means 9 derives three names from specification fields to locate removal targets',
          derivations: {
            creatorName: {
              formula: 'create + capitalize(conceptName) + capitalize(strategyName) + Strategy',
              example: 'strategyName: mockTestStrategy → createStrativerseMockTestStrategyStrategy',
              usedBy: 'Node 2 (import removal from muxonomy.ts)',
              note: 'Strategy suffix ALWAYS appended - doubles when strategyName already ends in Strategy',
            },
            qualityName: {
              formula: 'conceptName + capitalize(strategyName)',
              example: 'strategyName: mockTestStrategy → strativerseMockTestStrategy',
              usedBy: 'Node 1 (SCP metadata removal - qualityName field match)',
            },
            demometerName: {
              formula: 'conceptName + capitalize(strategyName) + Strategy',
              example: 'strategyName: mockTestStrategy → strativerseMockTestStrategyStrategy',
              usedBy: 'Node 3 (demometer entry removal - name field match)',
            },
          },
          clinicalVerification: 'Rose R3.2 confirmed all three derivations correctly locate and remove targets from muxonomy.ts',
        },
        comparison: {
          means9VsMeans4: {
            means9: 'SCP Strategy Delete - Removes strategy file + demometer + import + SCP metadata (5 nodes)',
            means4: 'Quality Remove - Removes quality file + exports + types + demometer + concept.ts entries + SCP metadata (9 nodes)',
            difference: 'Strategy files have fewer file hookups (no types.ts, no concept.ts qualities object/type)',
          },
          means8VsMeans9: {
            means8: 'SCP Strategy Create - Creates strategy file + demometer + import + SCP metadata (4 nodes)',
            means9: 'SCP Strategy Delete - Removes all 4 artifacts + deletes file (5 nodes)',
            symmetry: 'Perfect bidirectional parity - creation and deletion mirror each other',
          },
        },
        selfReferentialCurrying: {
          description: 'A-to-B pipe: file content flows from working context through jq into curl with zero temp files',
          insight: 'File content exists in LLM context once when generated for approval. cat heredoc pipes directly to jq -Rs which JSON-encodes and builds the spec. curl -d @- reads from stdin. No temp file, no context replication.',
          note: 'Means 9 invocation does NOT use file content (no strategyFileContent). The specification contains only metadata fields for identifying what to remove.',
          invocationExample: 'curl -s http://localhost:7111/mcp -H "Content-Type: application/json" -d with specification: { strategyName, conceptName, location, toolName }',
        },
        relatedTools: [
          { tool: 'strativerse_scp_strategy_create', purpose: 'Create strategy AND register as SCP tool (Means 8 - reverse of this)' },
          { tool: 'strativerse_strategy_create', purpose: 'Create strategy without SCP registration (Means 7)' },
          { tool: 'strativerse_quality_remove', purpose: 'Remove quality files (Means 4 - quality-side equivalent)' },
          { tool: 'strativerse_oneshot_quality_remove', purpose: 'Remove quality + SCP in one operation (Means 6)' },
        ],
        pairedActionable: 'strativerse_scp_strategy_delete',
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
