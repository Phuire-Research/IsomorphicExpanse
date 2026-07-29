/**
 * strativerseQualityCreateInfo - Returns QualityCreationSpecification documentation with field definitions, enhanceable template, method/reducer patterns, and related tools
 *
 * 
 *
 * Type: 'Strativerse Quality Create Info' (Verbose Split)
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


export type StrativerseQualityCreateInfo = Quality<StrativerseState>;

export const strativerseQualityCreateInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Quality Create Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 1: Quality Creation Specification',
        citation: 'STRATIMUX-REFERENCE.md: Quality Creation Patterns (2905-3191)',
        simplifiedApproach: {
          description: 'Use qualityFileContent to pass complete TypeScript quality file directly, bypassing template generation',
          benefit: 'Full control over quality implementation - AI generates complete code, tool handles file hookups only',
          whenToUse: 'Informative qualities with embedded content, complex method logic, any case where template is insufficient',
        },
        fieldDefinitions: [
          { field: 'qualityName', type: 'string', required: true, description: 'camelCase name (e.g., myNewAction)' },
          { field: 'typeString', type: 'string', required: true, description: 'Verbose Split of qualityName (e.g., My New Action)' },
          { field: 'conceptName', type: 'string', required: true, description: 'Target concept (e.g., strativerse)' },
          { field: 'location', type: "'huirth' | 'client' | 'all'", required: true, description: 'Deployment target' },
          { field: 'diameter', type: 'boolean', required: true, description: 'Whether this is a diameter quality' },
          { field: 'qualityFileContent', type: 'string', required: false, description: 'SIMPLIFIED: Complete TypeScript quality file as string. When provided, bypasses ALL template fields below and writes file directly.' },
          { field: 'hasPayload', type: 'boolean', required: 'only if no qualityFileContent', description: 'Whether quality has payload parameters' },
          { field: 'payloadTypeName', type: 'string', required: false, description: 'Payload type name if hasPayload' },
          { field: 'payloadFields', type: 'Array<{name, type, documentation, required}>', required: false, description: 'Field definitions if hasPayload' },
          { field: 'reducerModifies', type: 'string[]', required: false, description: 'State properties modified (empty for informative)' },
          { field: 'reducerLogic', type: 'string', required: false, description: 'Description of reducer logic' },
          { field: 'methodType', type: "'simple' | 'withConcepts' | 'none'", required: 'only if no qualityFileContent', description: 'Method creator type' },
          { field: 'usesStrategy', type: 'boolean', required: false, description: 'Whether method uses ActionStrategy' },
          { field: 'methodLogic', type: 'string', required: false, description: 'Description of method logic (placed as COMMENT only in template mode)' },
          { field: 'description', type: 'string', required: true, description: 'Quality description for muxonomy' },
          { field: 'citations', type: 'string[]', required: false, description: 'Reference citations' },
        ],
        trueOneShotPattern: {
          description: 'TRUE OneShot: Direct curl execution without intermediate file using heredoc',
          keyInsight: 'TypeScript uses single quotes, JSON uses double quotes - NO CONFLICT',
          bashPattern: 'curl -s URL -H "Content-Type: application/json" -d "$(cat <<\'JSONEOF\' ... JSONEOF)"',
          quotedHeredoc: 'The quoted delimiter <<\'JSONEOF\' prevents bash from interpreting escapes',
          escapingRules: [
            'Newlines in TypeScript -> backslash-n in JSON string',
            'Single quotes in TypeScript -> NO escaping needed (JSON uses double quotes)',
            'Double quotes (rare in TS) -> backslash-quote if needed',
          ],
          templateLiteralWarning: {
            severity: 'CRITICAL',
            problem: 'Template literals ${...} in qualityFileContent BREAK heredoc - bash interprets as parameter expansion',
            errorExample: 'Bad substitution: new (from ${new Date().toISOString()} in file content)',
            fix: 'Use string concatenation: LOG_PREFIX + \' message\' instead of `${LOG_PREFIX} message`',
            safePattern: 'Quality files typically use single-quoted strings (safe). Strategy-style logging with template literals MUST be converted.',
          },
          verifiedExample: 'strativerseMeans1TestInfo and strativerseTrueOneShotTest both created via direct heredoc curl',
        },
        selfReferentialCurrying: {
          description: 'A-to-B pipe: file content flows from working context through jq into curl with zero temp files',
          insight: 'File content exists in LLM context once when generated for approval. cat heredoc pipes directly to jq -Rs which JSON-encodes and builds the spec. curl -d @- reads from stdin. No temp file, no context replication.',
          pipePattern: "cat << 'TSEOF' | jq -Rs '{ jsonrpc: \"2.0\", id: 1, method: \"tools/call\", params: { name: \"strativerse_quality_create\", arguments: { specification: { qualityName: \"...\", qualityFileContent: ., ... } } } }' | curl -s http://localhost:7111/mcp -H \"Content-Type: application/json\" -d @-\n// ... quality file content ...\nTSEOF",
          keyMechanism: 'jq -Rs reads ALL stdin as a single raw string. The dot (.) in the jq filter references that string. curl -d @- reads the jq output from stdin.',
          workflow: [
            'Step 1: LLM generates quality file content in conversation (approval artifact - exists in working context)',
            'Step 2: cat heredoc pipes content to jq -Rs (quoted TSEOF prevents bash interpretation)',
            'Step 3: jq -Rs JSON-encodes the content and builds full spec with dot (.) as qualityFileContent value',
            'Step 4: curl -d @- reads completed JSON spec from stdin pipe (no temp file, no shell interpretation)',
          ],
          contextBenefit: 'File content appears once in working context as the approval artifact. The pipe reuses it directly - zero replication, zero temp files.',
        },
        simplifiedTemplate: {
          specification: {
            qualityName: '',
            typeString: '',
            conceptName: 'strativerse',
            location: 'huirth',
            diameter: false,
            qualityFileContent: '/* Complete TypeScript file content here */',
            description: '',
            citations: [],
            hasPayload: false,
            payloadTypeName: '',
            payloadFields: [],
            reducerModifies: [],
            reducerLogic: '',
            methodType: 'withConcepts',
            usesStrategy: true,
            methodLogic: '',
          },
        },
        legacyTemplate: {
          note: 'Use when qualityFileContent is NOT provided - template generates file with methodLogic as COMMENT only',
          qualityName: '',
          typeString: '',
          conceptName: 'strativerse',
          location: 'huirth',
          diameter: false,
          hasPayload: false,
          payloadTypeName: '',
          payloadFields: [],
          reducerModifies: [],
          reducerLogic: 'Returns {} - no state modification for informative quality',
          methodType: 'withConcepts',
          usesStrategy: true,
          methodLogic: 'CAUTION: This becomes a COMMENT only - use qualityFileContent for actual embedded logic',
          description: '',
          citations: [],
        },
        methodPatterns: {
          informativeWithEmbeddedContent: `// Use qualityFileContent with this pattern for informatives:
methodCreator: () => createMethodWithConcepts(({ action }) => {
  const content = {
    title: 'Your Informative Title',
    // ... all embedded documentation here
  };
  if (action.strategy) {
    return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, content));
  }
  return muxiumConclude();
})`,
          stateAccess: `methodCreator: () => createMethodWithConcepts(({ action, deck, concepts_ }) => {
  const state = deck.strativerse.k.getState(concepts_) as StrativerseState;
  const someValue = state.someProperty;
  // NEVER use k__ in methods — use deck.conceptName.k.getState(concepts_)
})`,
        },
        reducerPattern: {
          noStateChange: 'reducer: defaultReducer  // Most common for informatives',
          customReducer: 'reducer: (state) => ({ changedProp: newValue })  // Shortest Path Principle',
          strategyChainConsumer: {
            critical: 'MUST include methodCreator: defaultMethodCreator when quality participates in an ActionStrategy chain',
            reason: 'Without a methodCreator, the reducer runs but strategySuccess is never called — the strategy HALTS at this node and subsequent nodes never execute',
            pattern: 'reducer: (state, action) => { /* extract from strategyData */ }, methodCreator: defaultMethodCreator',
            reference: 'setConceptList.quality.ts, setManagedProjects.quality.huirth.ts, updateManagedProjectEntries.quality.huirth.ts',
          },
        },
        projectRouting: {
          description: 'All Means 1-9 actionable tools now accept optional projectName and projectPath top-level parameters for cross-project routing.',
          defaultBehavior: 'When NEITHER projectName NOR projectPath is provided, the tool operates on ADMIN_SCP (process.cwd()). ADMIN_SCP is the implicit default and is NOT listed in managed projects.',
          projectNameUsage: 'Provide projectName to route to a registered managed project (looked up from managedProjects state). Example: { "specification": {...}, "projectName": "PhuirE_SCP" }',
          projectPathUsage: 'Provide projectPath for direct path resolution without managed project lookup. Example: { "specification": {...}, "projectPath": "/path/to/project" }',
          adminSCPSpecialCase: 'ADMIN_SCP is never in the managed projects list. It is always the default when no routing parameters are provided. To explicitly target ADMIN_SCP, simply omit both projectName and projectPath.',
        },
        relatedTools: [
          { tool: 'strativerse_quality_patterns_info', purpose: 'Need payload/method pattern guidance' },
          { tool: 'strativerse_reducer_patterns_info', purpose: 'Need reducer implementation guidance' },
          { tool: 'strativerse_method_patterns_info', purpose: 'Need DECK K / strategy integration' },
          { tool: 'strativerse_list_managed_projects', purpose: 'List registered managed projects for projectName routing' },
        ],
        pairedActionable: 'strativerse_quality_create',
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
