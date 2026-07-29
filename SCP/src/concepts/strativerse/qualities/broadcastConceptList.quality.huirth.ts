import {
  createQualityCard,
  createMethodWithConcepts,
  strategySuccess,
  strategyData_muxifyData,
  muxiumConclude,
  Concept,
} from 'stratimux';
// Direct import from type file (NO barrel exports for tree-shaking)
import { type StrativerseState } from '../strativerse.type';
import { webSocketClientAtomicStateUpdate } from '../../webSocketServer/strategies/client/atomicStateUpdate.helper';
import type { WebSocketServerState, WebSocketServerQualities } from '../../webSocketServer/webSocketServer.concept';
import type { WebSocketClientConnection } from '../../webSocketServer/model/webSocketClient.model';
import type { StrativerseQualities } from '../strativerse.concept';

/**
 * broadcastConceptList Quality - Z RETURN in A→B→Y→Z Manifold
 *
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data - Universal Transformer Pattern"
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern - Reactive State Access"
 * Citation: Suite7Rose TIER-1-ACTIONSTRATEGY-MANIFOLD-CIRCUIT.md
 *
 * This quality broadcasts the strativerse conceptList to all connected clients
 * by sending atomicStateUpdate messages directly via WebSocket.
 *
 * Manifold Pattern:
 * - A Trigger: Client sends request via WebSocket
 * - B Processing: Server receives, creates strategy
 * - Y Anchor: scanConcepts → setConceptList
 * - Z Return: THIS QUALITY → broadcasts to all clients
 *
 * Uses createMethodWithConcepts with deck.k.getState(concepts_) pattern
 * for proper Higher-Order Composition state access.
 */

export const STRATIVERSE_BROADCAST_CONCEPT_LIST_TYPE = 'Strativerse Broadcast Concept List';

export type StrativerseBroadcastDeck = {
  strativerse: Concept<StrativerseState, StrativerseQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export const strativerseBroadcastConceptList = createQualityCard<
  StrativerseState,
  StrativerseBroadcastDeck
>({
  type: STRATIVERSE_BROADCAST_CONCEPT_LIST_TYPE,
  reducer: () => {
    // No state change - this quality triggers broadcast via method
    return {};
  },
  methodCreator: () =>
    createMethodWithConcepts<StrativerseState, void, StrativerseBroadcastDeck>(({ action, concepts_, deck }) => {
      // console.log('[StratiVERSE] broadcastConceptList: Method entered', {
      //   actionType: action.type,
      //   hasStrategy: !!action.strategy,
      //   hasConcepts: !!concepts_
      // });

      // Access state via DECK K pattern: deck.conceptName.k.getState(concepts_)
      const strativerseState = deck.strativerse.k.getState(concepts_) as StrativerseState;
      const wsState = deck.webSocketServer.k.getState(concepts_) as WebSocketServerState;

      const conceptList = strativerseState.conceptList;
      const managedProjects = strativerseState.managedProjects;
      const clients: WebSocketClientConnection[] = wsState?.webSocketClients || [];

      // console.log('[StratiVERSE] Broadcasting conceptList to clients:', {
      //   conceptCount: conceptList.concepts.length,
      //   lastScan: conceptList.lastScan,
      //   scanPath: conceptList.scanPath
      // });

      if (clients.length === 0) {
        console.log('[StratiVERSE] No clients connected, skipping broadcast');
        if (action.strategy) {
          return strategySuccess(action.strategy);
        }
        return muxiumConclude();
      }

      // Create atomicStateUpdate action with conceptList AND managedProjects
      // Phase 6 Fix: Include managedProjects for Vue UI dual-view
      const updateAction = webSocketClientAtomicStateUpdate({
        state: { conceptList, managedProjects }
      });

      // Broadcast to ALL connected clients directly via WebSocket
      let broadcastCount = 0;
      clients.forEach(client => {
        try {
          client.ws.send(JSON.stringify(updateAction));
          broadcastCount++;
        } catch (error) {
          console.error(`[StratiVERSE] Failed to broadcast to ${client.connectionId}:`, error);
        }
      });

      console.log(`[StratiVERSE] Broadcast complete: sent to ${broadcastCount}/${clients.length} clients`);

      if (action.strategy) {
        return strategySuccess(
          action.strategy,
          strategyData_muxifyData(action.strategy, {
            broadcastedTo: broadcastCount,
            conceptCount: conceptList.concepts.length
          })
        );
      }
      return muxiumConclude();
    }),
});
