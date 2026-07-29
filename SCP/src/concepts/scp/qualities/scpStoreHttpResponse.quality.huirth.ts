/**
 * scpStoreHttpResponse - Join Quality for SCP Strategy Manifolds
 *
 * The "Join" quality that stores httpResponse in pendingHttpResponses Map
 * BEFORE the tool strategy executes. This ensures scpExtractAndSendResponse
 * can retrieve the Express Response object in the final node.
 *
 * Part 1 of 3-part strategy sequence: Join → Tool → Return
 *
 * This quality decouples state storage from manifold creation, enabling
 * the principle to directly orchestrate strategy-based tools via
 * strategySequence without going through scpExecuteTool.
 *
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 *
 * Type: 'I C P Store Http Response' (Verbose Split)
 */

import {
  createQualityCardWithPayload,
  selectPayload,
  createMethodWithConcepts,
  strategySuccess,
} from 'stratimux';
import type { SCPState } from '../scp.types';
import type { SCPDeck } from '../scp.concept';
import type { SCPStoreHttpResponsePayload, SCPStoreHttpResponse } from './types';

export type { SCPStoreHttpResponse };

export const scpStoreHttpResponse = createQualityCardWithPayload<
  SCPState,
  SCPStoreHttpResponsePayload,
  SCPDeck
>({
  type: 'I C P Store Http Response',
  reducer: (state, action) => {
    const { requestId, connectionId, toolName, httpResponse } =
      selectPayload<SCPStoreHttpResponsePayload>(action);

    console.log('[SCP Join] Storing httpResponse for requestId:', requestId);

    // Store Express Response in pendingHttpResponses Map for manifold closure
    // Same logic as scpExecuteTool reducer
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
    createMethodWithConcepts<SCPState, SCPStoreHttpResponsePayload, SCPDeck>(({ action }) => {
      // Join quality simply continues the strategy chain
      // The reducer has already stored the httpResponse
      // Tool strategy will execute next, then return strategy
      if (action.strategy) {
        return strategySuccess(action.strategy);
      }
      return action;
    }),
});
