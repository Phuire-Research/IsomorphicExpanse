/**
 * strativerseOneShotInfo - Returns OneShotQualitySCPSpecification documentation with unified template, when-to-use guidance, and related tools
 *
 * 
 *
 * Type: 'Strativerse One Shot Info' (Verbose Split)
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


export type StrativerseOneShotInfo = Quality<StrativerseState>;

export const strativerseOneShotInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse One Shot Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 3: OneShot Quality + SCP Specification',
        citation: 'SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md',
        description: 'Combines Means 1 (Quality Create) + Means 2 (SCP Register) in single operation. Supports qualityFileContent for complete TypeScript file passthrough.',
        simplifiedApproach: {
          description: 'Use quality.qualityFileContent to pass complete TypeScript quality file directly',
          benefit: 'True OneShot: AI generates complete quality code, tool handles all file hookups (quality file, index.ts, muxonomy, concept.ts, SCP metadata)',
          criticalNote: 'When using qualityFileContent, other template fields (hasPayload, methodLogic, etc.) are IGNORED',
        },
        trueOneShotPattern: {
          description: 'TRUE OneShot: Direct curl execution without intermediate file',
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
            problem: 'Template literals ${...} in qualityFileContent or strategyFileContent BREAK heredoc',
            cause: 'Bash "$(cat <<JSONEOF ...)" command substitution interprets ${...} as parameter expansion',
            errorExample: 'Bad substitution: new (from ${new Date().toISOString()} in file content)',
            fix: 'Use string concatenation instead of template literals in any file content passed via heredoc',
            rules: [
              'BREAKS: console.log(`${LOG_PREFIX} message`) - bash reads ${LOG_PREFIX}',
              'WORKS: console.log(LOG_PREFIX + \' message\') - no ${} for bash to interpret',
            ],
            safePattern: 'Quality files typically use single-quoted strings (safe). Strategy files with template literal logging MUST be converted.',
          },
        },
        selfReferentialCurrying: {
          description: 'A-to-B pipe: file content flows from working context through jq into curl with zero temp files',
          insight: 'File content exists in LLM context once when generated for approval. cat heredoc pipes directly to jq -Rs which JSON-encodes and builds the spec. curl -d @- reads from stdin. No temp file, no context replication.',
          pipePattern: "cat << 'TSEOF' | jq -Rs '{ jsonrpc: \"2.0\", id: 1, method: \"tools/call\", params: { name: \"strativerse_oneshot_quality_scp\", arguments: { specification: { quality: { qualityName: \"...\", qualityFileContent: ., ... }, scp: { toolName: \"...\", inputSchema: { type: \"object\", properties: {}, required: [] }, ... } } } } }' | curl -s http://localhost:7111/mcp -H \"Content-Type: application/json\" -d @-\n// ... quality file content ...\nTSEOF",
          keyMechanism: 'jq -Rs reads ALL stdin as a single raw string. The dot (.) in the jq filter references that string. curl -d @- reads the jq output from stdin.',
          workflow: [
            'Step 1: LLM generates quality file content in conversation (approval artifact - exists in working context)',
            'Step 2: cat heredoc pipes content to jq -Rs (quoted TSEOF prevents bash interpretation)',
            'Step 3: jq -Rs JSON-encodes the content and builds full OneShot spec with dot (.) as qualityFileContent value',
            'Step 4: curl -d @- reads completed JSON spec from stdin pipe (no temp file, no shell interpretation)',
          ],
          contextBenefit: 'File content appears once in working context as the approval artifact. The pipe reuses it directly - zero replication, zero temp files.',
          approvalWorkflow: 'LLM outputs file content for user approval. User approves. LLM executes A-to-B pipe. Approval artifact IS the file content - curl spec is mechanical scaffolding built by jq.',
        },
        curlExecutionTemplate: [
          'curl -s http://localhost:7111/mcp -H "Content-Type: application/json" -d "$(cat <<\'JSONEOF\'',
          '{',
          '  "jsonrpc": "2.0", "id": 1, "method": "tools/call",',
          '  "params": {',
          '    "name": "strativerse_oneshot_quality_scp",',
          '    "arguments": { "specification": { "quality": { ... }, "scp": { ... } } }',
          '  }',
          '}',
          'JSONEOF',
          ')"',
        ],
        verifiedExample: 'strativerseTrueOneShotTest - created via direct curl with heredoc pattern',
        fieldDefinitions: [
          { field: 'quality', type: 'QualityCreationSpecification', required: true, description: 'Quality spec with optional qualityFileContent for direct file passthrough' },
          { field: 'quality.qualityFileContent', type: 'string', required: false, description: 'SIMPLIFIED: Complete TypeScript file. When provided, bypasses template generation.' },
          { field: 'scp', type: "Omit<SCPToolRegistrationSpec, 'qualityName' | 'conceptName'>", required: true, description: 'SCP spec (qualityName/conceptName derived from quality)' },
          { field: 'scp.toolName', type: 'string', required: true, description: 'SCP tool name (e.g., strativerse_my_tool)' },
          { field: 'scp.description', type: 'string', required: true, description: 'Tool description for MCP clients' },
          { field: 'scp.inputSchema', type: 'JSONSchema', required: true, description: 'REQUIRED even for informatives. Use { type: "object", properties: {}, required: [] } for no-argument tools. Omitting causes TypeError in generateSCPMetadataEntry.' },
          { field: 'scp.toolType', type: "'informative' | 'actionable'", required: true, description: 'Tool classification' },
          { field: 'scp.handlerType', type: "'quality' | 'strategy'", required: true, description: 'quality = quality-based handler, strategy = strategyCreator handler' },
          { field: 'scp.strategyName', type: 'string', required: false, description: 'Empty string for quality-based tools' },
          { field: 'scp.relatedActionables', type: 'string[]', required: true, description: 'Related actionable tool names (empty array if none)' },
        ],
        inputSchemaRequired: {
          severity: 'CRITICAL',
          rule: 'inputSchema MUST be provided for ALL SCP registrations including informatives',
          reason: 'generateSCPMetadataEntry calls JSON.stringify(spec.inputSchema).split() - undefined inputSchema causes TypeError: Cannot read properties of undefined (reading split)',
          minimumValue: '{ type: "object", properties: {}, required: [] }',
          applies: 'Every scp object in OneShot, SCP Register, and SCP Strategy Create specifications',
        },
        simplifiedTemplate: {
          specification: {
            quality: {
              qualityName: 'myInformativeQuality',
              typeString: 'My Informative Quality',
              conceptName: 'strativerse',
              location: 'huirth',
              diameter: false,
              qualityFileContent: 'COMPLETE_TYPESCRIPT_FILE_AS_JSON_ESCAPED_STRING (see jsonFormattingGuidance)',
              description: 'Description for muxonomy entry',
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
            scp: {
              toolName: 'strativerse_my_informative_quality',
              description: 'Tool description for MCP clients',
              inputSchema: { type: 'object', properties: {}, required: [] },
              toolType: 'informative',
              handlerType: 'quality',
              strategyName: '',
              relatedActionables: [],
            },
          },
        },
        legacyTemplate: {
          note: 'Template mode: methodLogic becomes a COMMENT only - NOT actual code. Use qualityFileContent for real embedded content.',
          specification: {
            quality: {
              qualityName: '',
              typeString: '',
              conceptName: 'strativerse',
              location: 'huirth',
              diameter: false,
              hasPayload: false,
              payloadTypeName: '',
              payloadFields: [],
              reducerModifies: [],
              reducerLogic: 'Returns {} - no state modification',
              methodType: 'withConcepts',
              usesStrategy: true,
              methodLogic: 'CAUTION: Becomes COMMENT only in generated file',
              description: '',
              citations: [],
            },
            scp: {
              toolName: 'strativerse_',
              description: '',
              inputSchema: { type: 'object', properties: {}, required: [] },
              toolType: 'informative',
              handlerType: 'quality',
              strategyName: '',
              relatedActionables: [],
            },
          },
        },
        whenToUse: [
          { scenario: 'New informative tool with embedded content', recommendation: 'OneShot with qualityFileContent (TRUE OneShot)' },
          { scenario: 'New actionable tool', recommendation: 'OneShot with qualityFileContent' },
          { scenario: 'Simple quality with minimal logic', recommendation: 'OneShot with legacy template (no qualityFileContent)' },
          { scenario: 'Existing quality needs SCP registration', recommendation: 'Means 2 only (strativerse_scp_tool_register)' },
          { scenario: 'Complex strategy-based tool', recommendation: 'Means 1 + Means 2 separately for debugging' },
        ],
        fileHookups: {
          description: 'OneShot handles all file modifications automatically:',
          operations: [
            '1. Write quality file to qualities/{qualityName}.quality.{location}.ts',
            '2. Add export to qualities/index.ts',
            '3. Add type to qualities/types.ts',
            '4. Add demometer entry to {concept}.muxonomy.ts',
            '5. Add import to {concept}.concept.ts',
            '6. Add type export to {concept}.concept.ts',
            '7. Add to ConceptQualities type',
            '8. Add to conceptQualities object',
            '9. Add scpToolMetadata entry for MCP registration',
          ],
        },
        relatedTools: [
          { tool: 'strativerse_quality_create_info', purpose: 'Detailed quality spec and method patterns' },
          { tool: 'strativerse_scp_register_info', purpose: 'SCP registration details' },
        ],
        pairedActionable: 'strativerse_oneshot_quality_scp',
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
