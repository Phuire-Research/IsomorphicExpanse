/**
 * strativerseStrategyCreateInfo - Returns StrategyCreationSpecification documentation with field definitions, node chain patterns, and related tools
 *
 * Paired Informative for Means 7: strativerse_strategy_create
 *
 * Type: 'Strativerse Strategy Create Info' (Verbose Split)
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


export type StrativerseStrategyCreateInfo = Quality<StrativerseState>;

export const strativerseStrategyCreateInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Strategy Create Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 7: Strategy Creation Specification',
        citation: 'SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md: Phase 1.1',
        purpose: 'Create strategy files for Stratimux concepts without SCP registration',
        simplifiedApproach: {
          description: 'Use strategyFileContent to pass complete TypeScript strategy file directly, bypassing template generation',
          benefit: 'Full control over strategy implementation - AI generates complete code, tool handles file hookups only',
          whenToUse: 'Strategy creators with complex node chains, custom validation, specialized deck access patterns',
        },
        fieldDefinitions: [
          { field: 'strategyName', type: 'string', required: true, description: 'camelCase strategy name (e.g., qualityRemove)' },
          { field: 'conceptName', type: 'string', required: true, description: 'Target concept (e.g., strativerse)' },
          { field: 'location', type: "'huirth' | 'client' | 'all'", required: true, description: 'Deployment target' },
          { field: 'topic', type: 'string', required: true, description: 'Strategy topic for ActionStrategy creation' },
          { field: 'description', type: 'string', required: true, description: 'Strategy description for documentation' },
          { field: 'citations', type: 'string[]', required: false, description: 'Reference document citations' },
          { field: 'strategyFileContent', type: 'string', required: false, description: 'SIMPLIFIED: Complete TypeScript strategy file as string. When provided, bypasses template and writes file directly.' },
          { field: 'deckRequirements', type: 'string[]', required: false, description: 'Required deck names for template mode (e.g., ["grep", "fileSystem"])' },
          { field: 'inputSpecType', type: 'string', required: false, description: 'Input specification type name for template mode' },
          { field: 'nodeCount', type: 'number', required: false, description: 'Number of nodes in strategy for template mode' },
        ],
        nodeChainPattern: {
          description: 'Means 7 creates a 2-node strategy for general strategy creation',
          nodes: [
            { node: 1, action: 'fileSystemCreateFileWithContentsIndex', purpose: 'Create strategy file in strategies/ directory' },
            { node: 2, action: 'grepReplaceInFiles', purpose: 'Add demometer entry to muxonomy.ts demometers.strategies array' },
          ],
          buildOrder: 'Reverse order (Node 2 first, then Node 1 with successNode pointing to Node 2)',
        },
        strategyCreatorPattern: {
          signature: 'export const create{Concept}{StrategyName}Strategy: SCPStrategyCreator = (concepts_, deck, params) => ActionStrategy | undefined',
          steps: [
            '1. Validate params against expected specification',
            '2. Access decks via selectStratiDECK<ConceptType>(deck, conceptName)',
            '3. Generate file content (or use strategyFileContent)',
            '4. Build nodes in reverse order (final -> initial)',
            '5. Return createStrategy({ topic, initialNode, data })',
          ],
          logPrefix: 'Use LOG_PREFIX = [StrategyName] for consistent logging',
        },
        criticalNamingConvention: {
          severity: 'CRITICAL',
          rule: 'Strategy creator export name MUST follow: create + capitalize(conceptName) + capitalize(strategyName) + Strategy',
          derivation: 'generateStrategyCreatorName(conceptName, strategyName) in Means 8',
          examples: [
            { strategyName: 'qualityRemove', conceptName: 'strativerse', exportName: 'createStrativerseQualityRemoveStrategy' },
            { strategyName: 'mockTestStrategy', conceptName: 'strativerse', exportName: 'createStrativerseMockTestStrategyStrategy', note: 'Strategy suffix DOUBLES when strategyName already ends in Strategy' },
            { strategyName: 'scpStrategyCreate', conceptName: 'strativerse', exportName: 'createStrativerseScpStrategyCreateStrategy' },
          ],
          threeNameDerivations: {
            creatorName: 'create + Concept + StrategyName + Strategy (export function name in strategy file)',
            qualityName: 'concept + capitalize(strategyName) (SCP metadata qualityName key in muxonomy.ts)',
            demometerName: 'concept + capitalize(strategyName) + Strategy (demometers.strategies name in muxonomy.ts)',
          },
          compilationError: 'TS2724 - muxonomy.ts import expects the derived creatorName. If strategyFileContent exports a different name, TypeScript compilation fails on bridge toggle.',
          appliesTo: 'Means 7 (strategy_create) and Means 8 (scp_strategy_create) - both use this naming convention for file hookup',
        },
        trueOneShotTemplateLiteralWarning: {
          severity: 'CRITICAL',
          problem: 'Template literals ${...} in strategyFileContent BREAK TRUE OneShot heredoc pattern',
          cause: 'Bash interprets ${...} as parameter expansion inside "$(cat <<JSONEOF ...)" command substitution',
          errorExample: 'Bad substitution: new (from ${new Date().toISOString()} in strategy file)',
          fix: 'Use string concatenation instead of template literals in strategyFileContent',
          rules: [
            'BREAKS: console.log(`${LOG_PREFIX} message`) - bash reads ${LOG_PREFIX}',
            'WORKS: console.log(LOG_PREFIX + \' message\') - no ${} for bash to interpret',
            'BREAKS: `${new Date().toISOString()}` - bash reads ${new Date()...}',
            'WORKS: new Date().toISOString() + \' message\' - pure expression',
          ],
          applies: 'All file content (strategyFileContent, qualityFileContent) passed via TRUE OneShot heredoc curl',
          qualityFilesSafe: 'Quality files typically use single-quoted strings (safe). Strategy files commonly use template literals (MUST convert).',
        },
        selfReferentialCurrying: {
          description: 'A-to-B pipe: file content flows from working context through jq into curl with zero temp files',
          insight: 'Strategy file content exists in LLM context once when generated for approval. cat heredoc pipes directly to jq -Rs which JSON-encodes and builds the spec. curl -d @- reads from stdin. No temp file, no context replication.',
          pipePattern: "cat << 'TSEOF' | jq -Rs '{ jsonrpc: \"2.0\", id: 1, method: \"tools/call\", params: { name: \"strativerse_strategy_create\", arguments: { specification: { strategyName: \"...\", strategyFileContent: ., ... } } } }' | curl -s http://localhost:7111/mcp -H \"Content-Type: application/json\" -d @-\n// ... strategy file content ...\nTSEOF",
          keyMechanism: 'jq -Rs reads ALL stdin as a single raw string. The dot (.) in the jq filter references that string. curl -d @- reads the jq output from stdin.',
          workflow: [
            'Step 1: LLM generates strategy file content in conversation (approval artifact - exists in working context)',
            'Step 2: cat heredoc pipes content to jq -Rs (quoted TSEOF prevents bash interpretation)',
            'Step 3: jq -Rs JSON-encodes the content and builds spec with dot (.) as strategyFileContent value',
            'Step 4: curl -d @- reads completed JSON spec from stdin pipe (no temp file, no shell interpretation)',
          ],
          contextBenefit: 'File content appears once in working context as the approval artifact. The pipe reuses it directly - zero replication, zero temp files.',
          strategyTemplateLiterals: 'Strategy files commonly use template literals for logging. The cat heredoc with quoted TSEOF prevents bash interpretation, and jq -Rs handles all escaping. Template literals are safe in this pipe pattern.',
        },
        comparison: {
          means7VsMeans8: {
            means7: 'Strategy Create - Creates strategy file + demometer (2 nodes)',
            means8: 'SCP Strategy Create - Creates strategy file + demometer + SCP registration (4 nodes)',
            useCase: 'Use Means 7 for internal strategies not exposed as SCP tools. Use Means 8 when strategy should be callable via MCP.',
          },
        },
        relatedTools: [
          { tool: 'strativerse_scp_strategy_create', purpose: 'Create strategy AND register as SCP tool (Means 8)' },
          { tool: 'strativerse_quality_create', purpose: 'Create quality files (Means 1)' },
          { tool: 'strativerse_strategy_patterns_info', purpose: 'ActionStrategy patterns and node chain guidance' },
        ],
        pairedActionable: 'strativerse_strategy_create',
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
