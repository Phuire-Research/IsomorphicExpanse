/**
 * WebSocket Server State Cleanup Principle
 *
 * Citation: STRATIMUX-REFERENCE.md - "🎯 Critical Planning Context Patterns"
 * Citation: STRATIMUX-REFERENCE.md - "🔄 Synchronizing Principle Pattern with setStage"
 *
 * Purpose:
 * - Watch connectionPools for empty pools (0 connections)
 * - After 15 minutes of being empty, dispatch deletion of stale client state
 * - Reactive plan triggered by connectionPools selector changes
 *
 * TTL Logic:
 * - Pool has disconnectedAt timestamp set when last connection leaves
 * - If disconnectedAt + TTL_MS < Date.now(), state is stale and should be deleted
 */

import type { WebSocketServerPrinciple, WebSocketServerState } from '../webSocketServer.concept';

const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export const webSocketServerStateCleanupPrinciple: WebSocketServerPrinciple = ({ plan, k_ }) => {
  console.log('[WebSocketServer] State Cleanup Principle initialized (TTL: 15 minutes)');

  return plan('WebSocket Server State Cleanup', ({ stage, stageO, d__ }) => [
    stageO(),

    stage(
      ({ d, k, dispatch }) => {
        const connectionPools = k.connectionPools.select();
        const now = Date.now();

        // Find pools that are empty and past TTL
        const stalePools: string[] = [];

        for (const [clientStateKey, pool] of Object.entries(connectionPools)) {
          const connectionCount = Object.keys(pool.connections).length;
          const isPoolEmpty = connectionCount === 0;
          const isPastTTL =
            pool.disconnectedAt !== null && now - pool.disconnectedAt > STATE_TTL_MS;

          if (isPoolEmpty && isPastTTL) {
            stalePools.push(clientStateKey);
            const minutesEmpty = Math.round((now - pool.disconnectedAt!) / 60000);
            console.log(
              `[WebSocketServer Cleanup] Stale pool detected: ${clientStateKey} (empty for ${minutesEmpty} minutes)`,
            );
          }
        }

        // Dispatch deletion for each stale pool
        if (stalePools.length > 0) {
          const keyToDelete = stalePools[0];
          console.log(`[WebSocketServer Cleanup] Deleting stale client state: ${keyToDelete}`);
          dispatch(
            d.webSocketServer.e.webSocketServerDeleteStaleClientState({
              clientStateKey: keyToDelete,
            }),
            { throttle: 0 },
          );
        } else {
          dispatch(d__.muxium.e.muxiumKick(), { throttle: 0 });
        }
      },
      {
        beat: 60000,
        selectors: [k_.connectionPools],
      },
    ),
  ]);
};
