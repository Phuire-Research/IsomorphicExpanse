/**
 * scpRegisterToolsWithMetadata - Tool Registry Quality with Metadata
 *
 * Registers tools AND their metadata for SCP Manifold execution.
 * This is used by the SCP principle when registering from Muxonomy.
 *
 * The metadata registry enables:
 * - handlerType lookup (quality vs strategy)
 * - conceptName for deck access (selectStratiDECK)
 * - qualityName/strategyName for dynamic dispatch
 *
 * Citation: POC-3-MUXONOMIC-SCP-BRIDGE-TOGGLE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 *
 * Type: 'I C P Register Tools With Metadata' (Verbose Split)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { SCPState, SCPToolDefinition, SCPQualityMetadataRegistered } from '../scp.types';

export type SCPRegisterToolsWithMetadataPayload = {
  tools: SCPToolDefinition[];
  metadataRegistry: Record<string, SCPQualityMetadataRegistered>;
};

export type SCPRegisterToolsWithMetadata = import('stratimux').Quality<
  SCPState,
  SCPRegisterToolsWithMetadataPayload
>;

export const scpRegisterToolsWithMetadata = createQualityCardWithPayload<
  SCPState,
  SCPRegisterToolsWithMetadataPayload
>({
  type: 'I C P Register Tools With Metadata',
  reducer: (state, action) => {
    const { tools, metadataRegistry } = selectPayload<SCPRegisterToolsWithMetadataPayload>(action);

    const newTools: Record<string, SCPToolDefinition> = { ...state.tools };
    const newMetadataRegistry: Record<string, SCPQualityMetadataRegistered> = {
      ...state.toolMetadataRegistry,
    };
    let addedCount = 0;

    for (const tool of tools) {
      if (newTools[tool.name]) {
        console.warn(`[SCP] Tool already registered: ${tool.name}`);
        continue;
      }

      console.log('[SCP] Registering tool with metadata:', tool.name);
      newTools[tool.name] = tool;

      if (metadataRegistry[tool.name]) {
        newMetadataRegistry[tool.name] = metadataRegistry[tool.name];
      }

      addedCount++;
    }

    if (addedCount === 0) {
      return {};
    }

    console.log(`[SCP] Registered ${addedCount} tools from Muxonomy`);

    return {
      tools: newTools,
      toolMetadataRegistry: newMetadataRegistry,
      toolCount: state.toolCount + addedCount,
      lastActivityAt: Date.now(),
    };
  },
});
