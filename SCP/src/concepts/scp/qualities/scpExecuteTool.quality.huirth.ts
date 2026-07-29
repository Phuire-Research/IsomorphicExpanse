/**
 * scpExecuteTool - Tool Execution Quality (SCP Manifold Pattern)
 *
 * Executes SCP tools via ActionStrategy manifolds that actualize Stratimux.
 * Tools registered with metadata use manifold-based execution (deck dispatch).
 * Legacy tools without metadata use direct handler execution (fallback).
 *
 * SCP Manifold Principle:
 * - Quality-based: Quality as initial node → Return tail
 * - Strategy-based: Strategy sequence → Return tail
 * - Same tools accessible by User (UI) and AI (SCP)
 *
 * Citation: POC-3-MUXONOMIC-SCP-BRIDGE-TOGGLE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 *
 * Type: 'I C P Execute Tool' (Verbose Split)
 */

import {
  createQualityCardWithPayload,
  selectPayload,
  createMethodWithConcepts,
  strategyDetermine,
  strategyBegin,
} from 'stratimux';
import type { SCPState, MCPResponse } from '../scp.types';
import type { SCPDeck } from '../scp.concept';
import type { SCPExecuteToolPayload, SCPExecuteTool } from './types';
import {
  createSCPQualityManifold,
  createSCPStrategyManifold,
} from '../strategies/scpToolManifold.strategy';

export type { SCPExecuteTool };

type HuirthDeck = SCPDeck;

export const scpExecuteTool = createQualityCardWithPayload<
  SCPState,
  SCPExecuteToolPayload,
  HuirthDeck
>({
  type: 'I C P Execute Tool',
  reducer: (state, action) => {
    const { requestId, connectionId, toolName, httpResponse } =
      selectPayload<SCPExecuteToolPayload>(action);

    console.log('[SCP Execute] Storing httpResponse for requestId:', requestId);

    // Store Express Response in pendingHttpResponses Map for manifold closure
    // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
    state.pendingHttpResponses.set(requestId, httpResponse);

    return {
      pendingResponses: {
        ...state.pendingResponses,
        [String(requestId)]: {
          requestId,
          connectionId,
          toolName,
          receivedAt: Date.now(),
          response: null,
          ready: false,
        },
      },
      lastActivityAt: Date.now(),
    };
  },
  methodCreator: () =>
    createMethodWithConcepts<SCPState, SCPExecuteToolPayload, HuirthDeck>(
      ({ action, deck, concepts_ }) => {
        const { requestId, connectionId, toolName, params, httpResponse } =
          selectPayload<SCPExecuteToolPayload>(action);

        // Access state via deck.k.getState(concepts_) pattern
        const state = deck.scp.k.getState(concepts_);

        if (!state) {
          console.error('[SCP] State not available');
          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32603,
              message: 'SCP state not available',
            },
          };
          return strategyDetermine(
            deck.scp.e.scpSendResponse({
              connectionId,
              response: errorResponse,
            }),
          );
        }

        const tool = state.tools[toolName];

        if (!tool) {
          console.error('[SCP] Tool not found:', toolName);
          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32601,
              message: `Tool not found: ${toolName}`,
            },
          };

          return strategyDetermine(
            deck.scp.e.scpSendResponse({
              connectionId,
              response: errorResponse,
            }),
          );
        }

        // Check for metadata-registered tool (Muxonomy pattern)
        const toolMeta = state.toolMetadataRegistry[toolName];

        if (toolMeta) {
          // SCP MANIFOLD EXECUTION
          console.error('[SCP] Using manifold execution for:', toolName, {
            handlerType: toolMeta.handlerType,
            conceptName: toolMeta.conceptName,
            qualityName: toolMeta.qualityName,
          });

          let manifold;

          if (toolMeta.handlerType === 'quality') {
            // Quality-based: Quality as initial node → Return tail
            manifold = createSCPQualityManifold(deck, toolMeta, params, requestId, connectionId);
          } else if (toolMeta.strategyCreator) {
            // Strategy-based: Head → Body → Tail sequence
            // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
            manifold = createSCPStrategyManifold(
              concepts_,
              deck,
              toolMeta,
              params,
              requestId,
              connectionId,
              httpResponse,
            );
          } else {
            // Strategy handlerType but no strategyCreator - configuration error
            console.error('[SCP] Strategy tool missing strategyCreator:', toolName);
            const errorResponse: MCPResponse = {
              jsonrpc: '2.0',
              id: requestId,
              error: {
                code: -32603,
                message: `Strategy tool ${toolName} missing strategyCreator`,
              },
            };
            return strategyDetermine(
              deck.scp.e.scpSendResponse({
                connectionId,
                response: errorResponse,
              }),
            );
          }

          if (!manifold) {
            console.error('[SCP] Failed to create manifold for:', toolName);
            const errorResponse: MCPResponse = {
              jsonrpc: '2.0',
              id: requestId,
              error: {
                code: -32603,
                message: `Failed to create manifold for tool: ${toolName}`,
              },
            };

            return strategyDetermine(
              deck.scp.e.scpSendResponse({
                connectionId,
                response: errorResponse,
              }),
            );
          }

          // Begin the manifold strategy
          return strategyBegin(manifold);
        }

        // LEGACY FALLBACK: Direct handler execution (no metadata)
        console.error('[SCP] Using legacy handler for:', toolName);

        try {
          const result = tool.handler(params);

          console.error('[SCP] Tool executed successfully:', toolName);

          const successResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: requestId,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result),
                },
              ],
            },
          };

          return strategyDetermine(
            deck.scp.e.scpSendResponse({
              connectionId,
              response: successResponse,
            }),
          );
        } catch (err) {
          console.error('[SCP] Tool execution error:', err);

          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32603,
              message: err instanceof Error ? err.message : 'Tool execution failed',
            },
          };

          return strategyDetermine(
            deck.scp.e.scpSendResponse({
              connectionId,
              response: errorResponse,
            }),
          );
        }
      },
    ),
});
