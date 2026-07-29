/*<$
For the graph programming framework Stratimux and the Web Socket Server Concept, generate a principle that will establish a connection with a client.
That will notify new client's of its own semaphore, then pass new action added to the state action que.
As well as receive actions from the client, the parse and dispatch them into the server's action stream.
$>*/
/*<#*/
import { ServerState } from '../server/server.concept';
import {
  Action,
  ActionStrategy,
  AnyAction,
  selectSlice,
  strategyData,
  strategyData_select,
  strategyData_muxifyData,
  strategyDetermine,
  isBadAction,
} from 'stratimux';
import _ws from 'express-ws';
import { WebSocketServerPrinciple, WebSocketServerState } from './webSocketServer.concept';
import { dehydrateAction } from './model/actionDehydration.model';
import { PingPongDataField, WEB_SOCKET_SERVER_SYNC_CLIENT_STATE } from './model/webSocket.shared';
import { validateAndRecreateAction } from '../../model/validateAction.model';
import {
  extractClientIP,
  generateConnectionId,
  generateClientStateId,
  generateClientStateKey,
} from './model/webSocketClient.model';
import { webSocketClientAtomicStateUpdate } from './strategies/client/atomicStateUpdate.helper';
// import { webSocketServer_createActionQueSelector } from './webSocketServer.selectors';

export const webSocketServerPrinciple: WebSocketServerPrinciple = ({
  d_,
  k_,
  plan,
  concepts_,
  observer,
  conceptSemaphore,
}) => {
  console.log('HITTING WEB SOCKET SET UP');
  const initialServerState = k_.getState(concepts_) as unknown as ServerState &
    WebSocketServerState;
  const server = initialServerState.server;
  if (server) {
    const baseSocket = _ws(server);
    const sockets = [baseSocket, ...initialServerState.servers.map((some) => _ws(some.server))];
    console.log('HITTING WEB SOCKET SET UP', sockets.length);
    const intervals: (NodeJS.Timer | undefined)[] = [];
    sockets.forEach((socket, socketIndex) => {
      socket.app.ws('/muxium', (ws, req) => {
        // Extract client IP for multi-client state management
        const clientIP = extractClientIP(req);

        // DEFERRED REGISTRATION: Don't register until we receive client's first message
        // This allows client to send stored clientStateId for reconnection
        let clientStateId: string | null = null;
        let clientStateKey: string | null = null;
        let isRegistered = false;

        // Helper to complete registration once we know the final clientStateId
        const completeRegistration = (finalClientStateId: string, isReconnect: boolean) => {
          if (isRegistered) return;
          isRegistered = true;

          clientStateId = finalClientStateId;
          clientStateKey = generateClientStateKey(clientIP, finalClientStateId);

          console.log(
            `[WebSocketServer] Completing registration: clientStateKey=${clientStateKey}, isReconnect=${isReconnect}`,
          );

          // Check for stored state BEFORE dispatching registration (current state snapshot)
          const currentState = k_.getState(concepts_) as WebSocketServerState;
          const storedClientState = currentState.clientStates?.[clientStateKey];

          // Register the client with final ID
          observer.next(
            d_.webSocketServer.e.webSocketServerRegisterClient({
              ws,
              clientIP,
              clientStateId: finalClientStateId,
            }) as AnyAction,
          );

          // Send clientStateId back to client for localStorage persistence
          ws.send(
            JSON.stringify({
              type: 'Web Socket Client Assign Client State Id',
              payload: { clientStateId: finalClientStateId },
            }),
          );
          console.log(
            `[WebSocketServer] Sent clientStateId ${
              isReconnect ? 'confirmation' : 'assignment'
            }: ${finalClientStateId}`,
          );

          // CRITICAL: On reconnect the client gates its initial sync on receiving an
          // atomic state update (hasReceivedServerState) — it will loop forever if this
          // handshake leg never arrives. So ALWAYS send the atomic state update on
          // reconnect: the stored state when we have it, otherwise an empty state that
          // still completes the handshake and unblocks the client's initial sync.
          // This must arrive BEFORE the client sends its default state.
          if (isReconnect) {
            const restoreState =
              storedClientState && Object.keys(storedClientState.state).length > 0
                ? storedClientState.state
                : {};
            const hasStored = Object.keys(restoreState).length > 0;
            const restoreAction = webSocketClientAtomicStateUpdate({
              state: restoreState,
            });
            ws.send(JSON.stringify(restoreAction));
            console.log(
              `[WebSocketServer] Reconnect handshake completed — atomic state update sent (${
                hasStored ? 'stored state' : 'empty state, no stored snapshot'
              }): clientStateKey=${clientStateKey}`,
            );
          }
        };

        console.log(
          `[WebSocketServer] New connection from IP ${clientIP}, awaiting client identity...`,
        );

        intervals.push(
          setInterval(() => {
            ws.send('ping');
          }, 3000),
        );
        console.log('Setting Up Web Socket Send', socketIndex, socketIndex === sockets.length - 1);

        if (socketIndex === 0) {
          console.log('Setting Up Web Socket Send!', socketIndex);
          const webSocketServerPlan = plan(
            'Web Socket Server Message Que Planner',
            ({ stage, k__, stageO }) => [
              stageO(),
              stage(
                ({ concepts, k, stagePlanner }) => {
                  const state = k.getState(concepts) as WebSocketServerState;
                  k_ = k;
                  concepts_ = concepts;
                  // console.log('WebSocket HITTING 2');
                  if (state) {
                    // Handle specificQue first (targeted delivery priority)
                    if (state.specificQue && state.specificQue.length > 0) {
                      const specificQue = state.specificQue;

                      const emptySpecificQue = () => {
                        if (specificQue.length !== 0) {
                          const targeted = specificQue.shift(); // DIRECT DEPLETION
                          if (targeted) {
                            const { action, destinationClientId } = targeted;

                            // Find specific connection by connectionId
                            const targetClient = state.webSocketClients.find(
                              (c) => c.connectionId === destinationClientId,
                            );

                            if (targetClient && targetClient.ws.readyState === 1) {
                              action.conceptSemaphore = state.clientSemaphore;
                              const dehydratedAction = dehydrateAction(action);
                              targetClient.ws.send(JSON.stringify(dehydratedAction));
                              console.log(
                                `[WebSocket] Sent to connectionId: ${destinationClientId}`,
                              );
                            } else {
                              console.warn(
                                `[WebSocket] Client ${destinationClientId} not found or disconnected`,
                              );
                            }

                            emptySpecificQue(); // Recursive depletion
                          }
                        }
                      };
                      emptySpecificQue();
                    }

                    // Handle actionQue (route by clientStateKey from strategy.data)
                    if (state.actionQue.length > 0) {
                      const que = state.actionQue;
                      console.log('[WebSocketServer] Processing actionQue:', que.length, 'actions');
                      const emptyQue = () => {
                        if (que.length !== 0) {
                          const action = que.shift(); // DIRECT DEPLETION
                          if (action) {
                            action.conceptSemaphore = state.clientSemaphore;
                            const dehydratedAction = dehydrateAction(action);
                            const actionJson = JSON.stringify(dehydratedAction);

                            // Get clientStateKey from strategy.data (primary) or fallback property
                            let targetKey: string | undefined;
                            if (action.strategy?.data?.clientStateKey) {
                              targetKey = action.strategy.data.clientStateKey as string;
                            } else if ((action as any)._targetClientStateKey) {
                              targetKey = (action as any)._targetClientStateKey;
                            }

                            if (targetKey) {
                              // Route to all connections with matching clientStateKey
                              const targetClients = state.webSocketClients.filter(
                                (client) => client.clientStateKey === targetKey,
                              );
                              console.log(
                                `[WebSocketServer] Routing to clientStateKey=${targetKey}, ${targetClients.length} connections`,
                              );

                              targetClients.forEach((client) => {
                                if (client.ws.readyState === 1) {
                                  client.ws.send(actionJson);
                                }
                              });
                            } else {
                              // No routing key - global broadcast (exceptional case)
                              console.warn(
                                '[WebSocketServer] No clientStateKey - global broadcast (exceptional)',
                              );
                              state.webSocketClients.forEach((client) => {
                                if (client.ws.readyState === 1) {
                                  client.ws.send(actionJson);
                                }
                              });
                            }

                            emptyQue();
                          }
                        }
                      };
                      emptyQue();
                    }
                  } else {
                    console.log("SHOUDN'T CONCLUDE");
                    stagePlanner.conclude();
                  }
                },
                {
                  priority: 2000,
                  // selectors: [k__.actionQue, k__.specificQue]
                }, // BOTH selectors - triggers on either change
              ),
            ],
          );
          console.log('Done Setting Up Web Socket Send!', webSocketServerPlan);
        }
        ws.addEventListener('close', () => {
          if (intervals[socketIndex]) {
            const interval = intervals[socketIndex];
            clearInterval(interval as NodeJS.Timeout);
            intervals[socketIndex] = undefined;
          }
          // Unregister the client when connection closes
          observer.next(d_.webSocketServer.e.webSocketServerUnregisterClient({ ws }) as AnyAction);
          // webSocketServerPlan.conclude();
        });
        ws.on('message', (message: any) => {
          if (message.data !== 'ping') {
            const act = JSON.parse(`${message}`);

            // DEFERRED REGISTRATION: Complete registration on first message
            if (!isRegistered) {
              // Check if client is sending a stored clientStateId for reconnection
              if (
                act.type === 'Web Socket Client Reconnect With State Id' &&
                act.payload?.clientStateId
              ) {
                console.log(
                  `[WebSocketServer] Client reconnecting with stored clientStateId: ${act.payload.clientStateId}`,
                );
                completeRegistration(act.payload.clientStateId, true);
                return; // Reconnect message consumed, don't process further
              } else {
                // First message from new client - generate fresh clientStateId
                console.log(
                  `[WebSocketServer] First message from new client, generating clientStateId`,
                );
                completeRegistration(generateClientStateId(), false);
              }
            }

            let isStrategy = act.strategy !== undefined;

            if (isStrategy) {
              const data = strategyData_select<PingPongDataField>(act.strategy as ActionStrategy);

              if (data?.pingPong) {
                const state = k_.getState(concepts_) as WebSocketServerState;

                // PingPong: Route to OTHER connections with same clientStateKey (multi-window sync)
                const targetClients = state.webSocketClients.filter(
                  (client) => client.clientStateKey === clientStateKey && client.ws !== ws,
                );

                console.log(
                  `[WebSocketServer:PingPong] Relaying to ${targetClients.length} other windows with clientStateKey=${clientStateKey}`,
                );

                targetClients.forEach((client) => {
                  if (client.ws.readyState === 1) {
                    client.ws.send(message);
                  }
                });
                return;
              }
            }

            // Add clientStateKey and poolIndex as originId/originPoolIndex to state sync actions
            if (act.type === WEB_SOCKET_SERVER_SYNC_CLIENT_STATE) {
              const currentState = k_.getState(concepts_) as WebSocketServerState;
              // Find connection by WebSocket reference to get poolIndex
              const connection = currentState.webSocketClients.find((c) => c.ws === ws);

              if (!act.payload) {
                act.payload = {};
              }
              act.payload.originId = clientStateKey;
              act.payload.originPoolIndex = connection?.poolIndex ?? 0;
            }

            let strategyClone;
            if (isStrategy) {
              strategyClone = structuredClone(act.strategy);
              // CRITICAL: Muxify clientStateKey into strategy.data for manifold routing
              strategyClone.data = strategyData_muxifyData(strategyClone, { clientStateKey });
            }

            if (Object.keys(act).includes('type')) {
              // Determine which deck to validate against based on action type
              let validatedAction: any;

              if (act.type) {
                validatedAction = validateAndRecreateAction(concepts_, d_.webSocketServer, act);
              }

              if (isBadAction(validatedAction)) {
                console.error('[WebSocketServer] ❌ BadAction:', validatedAction.payload);
                console.error('[WebSocketServer] Original action type:', act.type);
                ws.send(
                  JSON.stringify({
                    error: 'Invalid action',
                    actionType: act.type,
                  }),
                );
              } else {
                // Attach strategy with clientStateKey in data field
                if (isStrategy && strategyClone) {
                  validatedAction.strategy = strategyClone;
                }
                observer.next(validatedAction);
              }
            }
          }
        });
      });
    });
  }
};
/*#>*/
