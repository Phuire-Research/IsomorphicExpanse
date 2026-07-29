/**
 * strativerseSCPRegisterInfo - Returns SCPToolRegistrationSpecification documentation with field definitions, enhanceable template, handler type matrix, and related tools
 *
 * 
 *
 * Type: 'Strativerse I C P Register Info' (Verbose Split)
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


export type StrativerseSCPRegisterInfo = Quality<StrativerseState>;

export const strativerseSCPRegisterInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse I C P Register Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 2: SCP Tool Registration Specification',
        citation: 'CLAUDE.md: SCP Tool patterns',
        fieldDefinitions: [
          { field: 'qualityName', type: 'string', required: true, description: 'camelCase quality name to register' },
          { field: 'toolName', type: 'string', required: true, description: 'snake_case MCP tool name (e.g., strativerse_my_tool)' },
          { field: 'conceptName', type: 'string', required: true, description: 'Target concept for muxonomy' },
          { field: 'description', type: 'string', required: true, description: 'Tool description for AI clients' },
          { field: 'inputSchema', type: 'object', required: true, description: 'JSON Schema for parameters' },
          { field: 'inputSchema.type', type: 'string', required: true, description: 'Always "object"' },
          { field: 'inputSchema.properties', type: 'object', required: true, description: 'Property definitions' },
          { field: 'inputSchema.required', type: 'string[]', required: true, description: 'Required property names' },
          { field: 'toolType', type: "'informative' | 'actionable'", required: true, description: 'Tool classification' },
          { field: 'handlerType', type: "'quality' | 'strategy'", required: true, description: 'Handler implementation' },
          { field: 'strategyName', type: 'string', required: true, description: 'Strategy name (empty string if quality-based)' },
          { field: 'strategyFilePath', type: 'string', required: false, description: 'Strategy file path (strategy-based only)' },
          { field: 'strategyCreatorName', type: 'string', required: false, description: 'Strategy creator function (strategy-based only)' },
          { field: 'relatedActionables', type: 'string[]', required: true, description: 'Related actionable tools' },
        ],
        enhanceableTemplate: {
          qualityName: '',
          toolName: 'strativerse_',
          conceptName: 'strativerse',
          description: '',
          inputSchema: {
            type: 'object',
            properties: {
              section: {
                type: 'string',
                description: 'Specific section to retrieve',
              },
            },
            required: [],
          },
          toolType: 'informative',
          handlerType: 'quality',
          strategyName: '',
          relatedActionables: [],
        },
        toolTypeMatrix: [
          { toolType: 'informative', handlerType: 'quality', useCase: 'Documentation/guidance tools' },
          { toolType: 'informative', handlerType: 'strategy', useCase: 'Complex multi-step documentation' },
          { toolType: 'actionable', handlerType: 'quality', useCase: 'Simple state modifications' },
          { toolType: 'actionable', handlerType: 'strategy', useCase: 'Complex operations (file creation, etc.)' },
        ],
        relatedTools: [
          { tool: 'strativerse_quality_create_info', purpose: 'Need quality specification first' },
          { tool: 'strativerse_oneshot_info', purpose: 'Want combined creation + registration' },
        ],
        pairedActionable: 'strativerse_scp_tool_register',
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
