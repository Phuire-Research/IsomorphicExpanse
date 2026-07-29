import type { WebSocketServerPrinciple, WebSocketServerState } from '../webSocketServer.concept';
import { webSocketClientAtomicStateUpdate } from '../strategies/client/atomicStateUpdate.helper';

/**
 * Server-side state broadcast principle
 * Routes state updates to all connections sharing the same clientStateKey (multi-window sync)
 * This implements the clientStateKey-based routing for multi-client state synchronization
 *
 * CRITICAL: This principle depletes the stateUpdates array as it processes to prevent recursion
 *
 * Routing Pattern:
 * - update.originId contains the clientStateKey of the originating connection
 * - Broadcasts to ALL connections with matching clientStateKey (multi-window pooling)
 * - knownClientStates tracks state per clientStateKey to prevent redundant broadcasts
 */
export const webSocketServerStateBroadcastPrinciple: WebSocketServerPrinciple = ({ plan, k_ }) => {
  // Singleton to track known state per clientStateKey to prevent redundant broadcasts
  // Structure: { clientStateKey: { stateKey: value } }
  const knownClientStates: Record<string, Record<string, unknown>> = {};

  const stateBroadcastPlan = plan('WebSocket Server State Broadcast', ({ stage, k__, stageO }) => [
    stageO(),
    stage(
      ({ concepts, k, d, dispatch }) => {
        const state = k.getState(concepts) as WebSocketServerState;
        const filterKeys = state.filterKeys || [];
        const notKeys = (key: string) => !filterKeys.includes(key);

        if (state && state.stateUpdates && state.stateUpdates.length > 0) {
          // Process ALL updates in the queue
          const updates = [...state.stateUpdates]; // Copy array to avoid mutation during iteration

          // TEMPORARY: Commented to reduce log cycling
          // console.log(`[WebSocketServer StateBroadcast] Processing ${updates.length} state updates`);

          // Process each update and check for changes
          updates.forEach((update) => {
            // Initialize known state for origin client if needed
            if (!knownClientStates[update.originId]) {
              knownClientStates[update.originId] = {};
            }

            // Check if this update contains actual changes
            let hasChanges = false;
            const changedState: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(update.state)) {
              // Skip filtered keys entirely
              if (!notKeys(key)) {
                // TEMPORARY: Commented to reduce log cycling
                // console.log(`[WebSocketServer StateBroadcast] Skipping filtered key '${key}'`);
                continue;
              }

              const knownValue = knownClientStates[update.originId][key];

              // Check if this property has a novel change handler
              // No handler - use default JSON comparison
              const currentValueStr = JSON.stringify(value);
              const knownValueStr = JSON.stringify(knownValue);

              if (currentValueStr !== knownValueStr) {
                // TEMPORARY: Commented to reduce log cycling
                // console.log(`[WebSocketServer StateBroadcast] State change detected for key '${key}' from client ${update.originId}`);
                knownClientStates[update.originId][key] = value;
                changedState[key] = value;
                hasChanges = true;
              }
            }

            // Only broadcast if there are actual changes
            if (hasChanges && Object.keys(changedState).length > 0) {
              // Route to OTHER connections with matching clientStateKey (multi-window pooling)
              // update.originId contains the clientStateKey from the originating connection
              // update.originPoolIndex identifies the specific connection to EXCLUDE (sender)
              const targetClients = state.webSocketClients.filter(
                (client) =>
                  client.clientStateKey === update.originId &&
                  client.poolIndex !== update.originPoolIndex,
              );

              // Build a summary of what's being broadcast
              const changesSummary = Object.entries(changedState)
                .map(([key, value]) => {
                  if (key === 'muxTapeBuffer' && Array.isArray(value)) {
                    return `${key}(${value.length} tapes)`;
                  } else if (key === 'sessions' && typeof value === 'object') {
                    const sessionCount = Object.keys(value as Record<string, unknown>).length;
                    return `${key}(${sessionCount} sessions)`;
                  } else if (key === 'projects' && typeof value === 'object') {
                    const projectCount = Object.keys(value as Record<string, unknown>).length;
                    return `${key}(${projectCount} projects)`;
                  } else if (key === 'projectCategories' && Array.isArray(value)) {
                    return `${key}(${value.length} categories)`;
                  } else if (key === 'sessionOrder' && Array.isArray(value)) {
                    return `${key}(${value.length} items)`;
                  } else if (typeof value === 'string') {
                    return `${key}='${value}'`;
                  } else if (typeof value === 'number') {
                    return `${key}=${value}`;
                  } else if (typeof value === 'boolean') {
                    return `${key}=${value}`;
                  } else {
                    return key;
                  }
                })
                .join(', ');

              // TEMPORARY: Commented to reduce log cycling
              // console.log(`[WebSocketServer StateBroadcast] Broadcasting [${changesSummary}] to ${targetClients.length} clients (excluding origin: ${update.originId}`);

              // Create the atomic state update action with only changed properties
              const updateAction = webSocketClientAtomicStateUpdate({
                state: changedState,
              });

              // Send to each target client (all windows sharing same clientStateKey)
              targetClients.forEach((client) => {
                try {
                  client.ws.send(JSON.stringify(updateAction));
                  // TEMPORARY: Commented to reduce log cycling
                  // console.log(`[WebSocketServer StateBroadcast] ✓ Sent to clientStateKey: ${client.clientStateKey}, connectionId: ${client.connectionId}`);
                } catch (error) {
                  console.error(
                    `[WebSocketServer StateBroadcast] ✗ Failed to send to ${client.clientStateKey} (${client.connectionId}):`,
                    error,
                  );
                }
              });
            } else {
              // console.log(`[WebSocketServer StateBroadcast] No novel changes to broadcast from ${update.originId} - skipping dispatch entirely`);
            }
          });

          // CRITICAL: Clear processed updates from state to prevent reprocessing
          // Dispatch action to clear the stateUpdates array
          // console.log(Object.keys(d));
          dispatch(
            d.webSocketServer.e.webSocketServerClearStateUpdates({
              priority: 5000,
            }),
            {
              throttle: 25,
            },
          );
        }
      },
      {
        priority: 2000,
        beat: 50, // Fast response for state sync
        selectors: [k__.stateUpdates], // Only trigger when stateUpdates changes
      },
    ),
  ]);
};
