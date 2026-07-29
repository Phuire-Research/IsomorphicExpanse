/**
 * scpRegisterTool - Tool Registry Quality
 *
 * Huirth HiFi Design Suite - SCP Pattern Stenciling
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: Payload Quality with flat list management
 *
 * Purpose:
 * - Add tool definitions to registry (accepts array)
 * - Track tool count
 * - Tools become available for tools/list and tools/call
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { SCPState, SCPToolDefinition } from '../scp.types';
import type { SCPRegisterToolPayload, SCPRegisterTool } from './types';

export type { SCPRegisterTool };

export const scpRegisterTool = createQualityCardWithPayload<SCPState, SCPRegisterToolPayload>({
  type: 'I C P Register Tool',
  reducer: (state, action) => {
    const { tools } = selectPayload<SCPRegisterToolPayload>(action);

    const newTools: Record<string, SCPToolDefinition> = { ...state.tools };
    let addedCount = 0;

    for (const tool of tools) {
      if (newTools[tool.name]) {
        console.warn(`[SCP] Tool already registered: ${tool.name}`);
        continue;
      }

      console.log('[SCP] Registering tool:', tool.name);
      newTools[tool.name] = tool;
      addedCount++;
    }

    if (addedCount === 0) {
      return {};
    }

    return {
      tools: newTools,
      toolCount: state.toolCount + addedCount,
      lastActivityAt: Date.now(),
    };
  },
});
