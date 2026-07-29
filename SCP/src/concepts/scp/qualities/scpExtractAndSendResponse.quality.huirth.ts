/**
 * scpExtractAndSendResponse - SCP Manifold Return Node
 *
 * Extracts DataField from strategy.data and sends as MCPResponse via HTTP.
 * This is the TAIL of every SCP Manifold (Quality or Strategy variant).
 *
 * State-Based Response Storage Pattern:
 * - Access pendingHttpResponses from SCP State via deck.scp.k.getState(concepts_)
 * - Get Express Response object by requestId
 * - Send response directly via httpRes.json()
 * - Clean up pendingHttpResponses Map in reducer (same quality handles send + cleanup)
 *
 * The Complete Data Principle:
 * - Strategy.data contains the accumulated DataField from quality/strategy execution
 * - We send the COMPLETE structured data (minus SCP routing metadata)
 * - AI receives the full DataField as structured response
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 *
 * Type: 'I C P Extract And Send Response' (Verbose Split)
 */

import {
  createQualityCardWithPayload,
  selectPayload,
  createMethodWithConcepts,
  strategySuccess,
} from 'stratimux';
import type { SCPState, MCPResponse } from '../scp.types';
import type { SCPDeck } from '../scp.concept';

export type SCPExtractAndSendResponsePayload = {
  requestId: string | number;
  connectionId: string;
};

export type SCPExtractAndSendResponse = import('stratimux').Quality<
  SCPState,
  SCPExtractAndSendResponsePayload
>;

const SCP_ROUTING_KEYS = [
  'requestId',
  'connectionId',
  'toolName',
  'qualityName',
  'conceptName',
  'strategyName',
  'initTimestamp',
  'params',
];

export const scpExtractAndSendResponse = createQualityCardWithPayload<
  SCPState,
  SCPExtractAndSendResponsePayload,
  SCPDeck
>({
  type: 'I C P Extract And Send Response',
  reducer: (state, action) => {
    const { requestId } = selectPayload<SCPExtractAndSendResponsePayload>(action);

    // Clean up pendingHttpResponses Map
    state.pendingHttpResponses.delete(requestId);

    // Clean up pendingResponses record
    const { [String(requestId)]: _removed, ...remainingResponses } = state.pendingResponses;

    console.log('[SCP Extract] Cleared pending response for requestId:', requestId);

    return {
      pendingResponses: remainingResponses,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts<SCPState, SCPExtractAndSendResponsePayload, SCPDeck>(
      ({ action, deck, concepts_ }) => {
        const { requestId } = selectPayload<SCPExtractAndSendResponsePayload>(action);

        // Access state via deck.scp.k.getState(concepts_) pattern
        // Citation: STRATIMUX-REFERENCE.md "createMethodWithConcepts Deck K Usage Pattern"
        const state = deck.scp.k.getState(concepts_);

        if (!state) {
          console.error('[SCP Extract] State not available');
          return strategySuccess(action.strategy!);
        }

        // Get Express Response from pendingHttpResponses Map
        const httpRes = state.pendingHttpResponses.get(requestId);

        if (!httpRes) {
          console.error('[SCP Extract] No httpResponse found for requestId:', requestId);
          return strategySuccess(action.strategy!);
        }

        // Extract DataField from strategy.data (minus routing keys)
        const strategyData = action.strategy?.data || {};
        const dataField: Record<string, unknown> = {};
        for (const key of Object.keys(strategyData)) {
          if (!SCP_ROUTING_KEYS.includes(key)) {
            dataField[key] = strategyData[key];
          }
        }

        console.log('[SCP Extract] Sending response for requestId:', requestId, {
          dataFieldKeys: Object.keys(dataField),
        });

        // Format MCP Response
        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(dataField, null, 2),
              },
            ],
          },
        };

        // Send response directly via Express Response object
        // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
        httpRes.json(response);

        // Manifold complete - return strategySuccess
        return strategySuccess(action.strategy!);
      },
    ),
});
