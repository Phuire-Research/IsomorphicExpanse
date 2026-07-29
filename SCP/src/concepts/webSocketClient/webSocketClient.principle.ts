/*<$
For the graph programming framework Stratimux and the Web Socket Client Concept, generate a principle that will establish a connection with a server, and pass its semaphore.
Then create a plan to notify the server of state changes, while ignoring values that would disallow this process from being halting complete.
As well as receive actions from the server, the parse and dispatch them into the client's action stream.

Multi-Client Infrastructure:
- Waits for localStorage to be primed before connecting (clientStateId may be loaded)
- Sends clientStateId to server on connect (if exists from localStorage)
- Handles server's clientStateId assignment for new clients
$>*/
/*<#*/
import { selectMuxifiedState } from 'stratimux';
import type { Action } from 'stratimux';
import type {
  WebSocketClientPrinciple,
  WebSocketClientState,
  LocalStorageDeck,
} from './webSocketClient.concept';
import { webSocketClientSetClientSemaphore } from './strategies/server/setClientSemaphore.helper';
import { webSocketServerSyncClientState } from './strategies/server/syncServerState.helper';
import { dehydrateAction } from './model/actionDehydration.model';
import { showBridgeStandby } from './model/bridgeStandbyOverlay.model';
import { validateAndRecreateAction } from '../../model/validateAction.model';
// GITM A↔B Refinement (#641-R) · W6 — the failsafe turn-over contract is now the SINGLE
// shared source (gitmTurnover.model). The B button (GitmTurnOverBButton.vue) writes the
// SAME GITM_TURNOVER_KEY this close handler reads — byte-identical, never two defs (HAZARD-5).
import {
  GITM_TURNOVER_KEY,
  readGitmTurnoverProgress,
} from '../../model/gitmTurnover.model';

// Action type constants for messages from server
const WEB_SOCKET_CLIENT_ASSIGN_CLIENT_STATE_ID = 'Web Socket Client Assign Client State Id';
const WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE = 'Web Socket Client Atomic State Update';

// ============================================
// GITM A↔B Refinement (#641-R) · W6 — THE FAILSAFE DEADLINE MECHANISM (shared contract)
// ============================================
//
// When the user turns over to B, GitmTurnOverBButton.vue writes GITM_TURNOVER_KEY (the
// shared gitmTurnover.model contract) BEFORE dispatching the MCP turn-over. This close
// handler reads it to distinguish an A↔B turn-over (deadline-armed) from a normal restart
// (unbounded ping). If B never boots within the deadline, the deadline timer fires the
// FAILSAFE-RETURN 3-step: it clears the ping loop FIRST (D1 conflict prevention · S4 Green
// seam 5c), swaps the standby to 'b-failed-reverting', and fires gitm_revert_to_stable over
// the OUTER bridge /mcp (alive during SCP-down) → checkout A → boot on A → client reloads.
// GITM_TURNOVER_KEY + readGitmTurnoverProgress are imported above from gitmTurnover.model
// (the single byte-match source · GitmTurnoverProgress flows through the reader's inference ·
// HAZARD-5 fully closed).

export const webSocketClientPrinciple: WebSocketClientPrinciple = ({
  plan,
  conceptSemaphore,
  observer,
  k_,
  d_,
  concepts_,
}) => {
  let ws: WebSocket | null = null;
  const syncState: Record<string, unknown> = {};
  const filterKeys = k_.filterKeys.select();
  const notKeys = (key: string) => {
    return !filterKeys.includes(key);
  };

  // Track if we're reconnecting (has stored clientStateId) - affects sync timing
  let isReconnecting = false;
  let hasReceivedServerState = false;

  // Helper to set up WebSocket event handlers and plans after connection
  const setupWebSocketHandlers = (websocket: WebSocket, dispatch: any, d: any, k: any) => {
    // Queue processing plan
    plan('Web Socket Planner', ({ stage, d__, k__ }) => [
      stage(({ concepts, dispatch, stagePlanner, k }) => {
        const name = k.getName(concepts);
        if (name) {
          dispatch(d__.muxium.e.muxiumRegisterStagePlanner({ conceptName: name, stagePlanner }), {
            iterateStage: true,
          });
        } else {
          stagePlanner.conclude();
        }
      }),
      stage(
        ({ concepts, stagePlanner }) => {
          const state = selectMuxifiedState<WebSocketClientState>(concepts, conceptSemaphore);
          if (state) {
            if (state.actionQue.length > 0) {
              const que = state.actionQue;
              console.log(
                '[DualDispatch] WebSocketClient: Processing action queue, length:',
                que.length,
              );
              const emptyQue = () => {
                if (que.length) {
                  const action = que.shift();
                  if (action) {
                    console.log(
                      '[DualDispatch] WebSocketClient: SENDING action to server:',
                      action.type,
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    action.conceptSemaphore = (state as any).clientSemaphore;

                    if (websocket.readyState !== WebSocket.OPEN) {
                      console.warn(
                        '[WebSocket] Cannot send - connection not open:',
                        websocket.readyState,
                      );
                      return;
                    }

                    const dehydratedAction = dehydrateAction(action);
                    websocket.send(JSON.stringify(dehydratedAction));
                    emptyQue();
                  }
                }
              };
              emptyQue();
            }
          } else {
            stagePlanner.conclude();
          }
        },
        { beat: 3, selectors: [k__.actionQue] },
      ),
    ]);

    // State sync plan
    const onChangePlan = plan('Web Socket Server On Change', ({ stage }) => [
      stage(({ concepts, dispatch, stagePlanner, d, k }) => {
        const name = k.getName(concepts);
        if (name) {
          dispatch(d.muxium.e.muxiumRegisterStagePlanner({ conceptName: name, stagePlanner }), {
            iterateStage: true,
          });
        } else {
          stagePlanner.conclude();
        }
      }),
      stage(
        ({ concepts, stagePlanner, k, d }) => {
          k_ = k;
          d_ = d;
          concepts_ = concepts;
          const state: Record<string, unknown> = {};
          const newState = k.getState(concepts) as Record<string, unknown>;
          if (newState) {
            const stateKeys = Object.keys(newState);
            if (Object.keys(syncState).length === 0) {
              // CRITICAL: If reconnecting, wait for server to send restored state first
              // This prevents overwriting server's stored state with client defaults
              if (isReconnecting && !hasReceivedServerState) {
                console.log(
                  '[WebSocket Sync] Reconnecting - waiting for server state before initial sync',
                );
                return; // Don't sync yet, wait for server state
              }

              console.log(
                '[WebSocket Sync] Initial state sync' +
                  (isReconnecting ? ' (after receiving server state)' : ' (new client)'),
              );
              for (const key of stateKeys) {
                if (notKeys(key)) {
                  syncState[key] = newState[key];
                  state[key] = newState[key];
                }
              }
              websocket.send(JSON.stringify(webSocketServerSyncClientState({ state })));
            } else {
              let changed = false;
              for (const key of stateKeys) {
                if (notKeys(key)) {
                  const hasChanged =
                    typeof newState[key] !== 'object'
                      ? newState[key] !== syncState[key]
                      : !Object.is(newState[key], syncState[key]);

                  if (hasChanged) {
                    syncState[key] = newState[key];
                    state[key] = newState[key];
                    changed = true;
                  }
                }
              }

              if (changed) {
                const sync = webSocketServerSyncClientState({ state });
                sync.conceptSemaphore = (newState as WebSocketClientState).serverSemaphore;
                websocket.send(JSON.stringify(sync));
              }
            }
          } else {
            stagePlanner.conclude();
          }
        },
        {
          priority: 2000,
          beat: 333,
        },
      ),
    ]);

    // Close handler
    websocket.addEventListener('close', () => {
      onChangePlan.conclude();
      dispatch(d.webSocketClient.e.webSocketClientSetIsConnected({ isConnected: false }), {});

      // Notify the operator to cease activity while the connection turns over.
      // Idempotent: a no-op if already shown. The page reload on reconnection
      // clears it automatically.
      //
      // SORD Shield/Sword (D5/TVOS) — re-show the SAME overlay variant the turn-over button
      // wrote to the in-progress key, so the visual continues across the respawn gap (the
      // button mounted it client-side at click; this re-asserts it on the WS-close). Absent ⇒
      // the plain 'turn-over' overlay (a normal restart).
      const turnoverProgress = readGitmTurnoverProgress();
      // BOOT-STREAM — pass the carrier so the re-shown overlay can tail /scp-boot-log/:scpName
      // (bridgeEndpoint + scpName) across the respawn gap. Absent ⇒ overlay shows without the tail.
      //
      // THE SPARKS DEFAULT (D-2) — a DISCONNECTION-EVENT-driven turn-over (the WS drops and the
      // server restarts) with NO click-site carrier declaring a register defaults to SPARKS (the RED
      // hard-turn-over register), NOT the derived SHIELD. The moment must READ as a hard turn-over so
      // it steers the user toward the Tactical Bridge system. A click-site register still wins: the
      // A/B legs write `turnClass` into the carrier (shield/sword), and a click-mounted overlay is
      // protected by showBridgeStandby's sticky-explicit guard (a derived default never downgrades a
      // declared expression). Only the register default flips — the mode fallback stays 'turn-over'.
      showBridgeStandby(turnoverProgress?.overlayVariant ?? 'turn-over', turnoverProgress, turnoverProgress?.turnClass ?? 'sparks');

      console.log('[WebSocket] Connection lost. Starting reconnection ping...');

      // Shared abort flag — mutual cancellation of the ping loop and the deadline timer.
      // Whichever fires FIRST flips `aborted`; the other silently returns.
      let aborted = false;
      let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

      const pingServer = async () => {
        if (aborted) return;
        try {
          const response = await fetch('/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 0,
              method: 'ping',
            }),
          });

          if (response.ok && !aborted) {
            console.log('[WebSocket] Server detected. Refreshing page...');
            aborted = true;
            clearInterval(pingInterval);
            // Cancel the A↔B deadline (B booted in time) + clear the flag.
            if (deadlineTimer !== undefined) clearTimeout(deadlineTimer);
            if (turnoverProgress) {
              // AUTO-CONFIRM B (Cycle 268 · the CORRECT seam): the ping succeeding DURING a
              // source-B turn-over IS the proof B booted — no revert fired, the server answers
              // on B's code. Confirm over the OUTER bridge BEFORE the reload; the Stage-1
              // fallback can never see the carrier because it is removed right here (the
              // Cycle-267 misplacement — 071 witnessed the carrier already null at boot).
              if (turnoverProgress.source === 'B' && turnoverProgress.bridgeEndpoint) {
                try {
                  const confirmRes = await fetch(`${turnoverProgress.bridgeEndpoint}/mcp`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json, text/event-stream',
                    },
                    body: JSON.stringify({
                      jsonrpc: '2.0',
                      id: Date.now(),
                      method: 'tools/call',
                      // MD-C M2 · THE ORIGIN STAMP — the auto-confirm routes to THE CALLER's
                      // slice/rail (the progress carrier already holds this SCP's name).
                      params: {
                        name: 'gitm_confirm_success',
                        arguments: turnoverProgress.scpName
                          ? { originScpName: turnoverProgress.scpName }
                          : {},
                      },
                    }),
                    keepalive: true,
                  });
                  void confirmRes.text(); // ACK-only
                  console.log('[WebSocket] AUTO-CONFIRM B · B booted · ACK', confirmRes.status);
                } catch (e) {
                  console.warn('[WebSocket] AUTO-CONFIRM B failed:', e);
                }
              }
              // D-T-REVERT RESUME (Cycle 270 · user semantics): an A turn-over FROM the working
              // B (the revert) resumes the WORKING TREE on B once A is up — the changes were
              // committed to B (PRECOMMIT-B); A keeps RUNNING (nodemon watches only
              // .bridge-restart.json, so this switch does NOT restart the server). The ToolBar
              // keeps tracking the A↔B difference until the merge on B's success.
              if (turnoverProgress.source === 'A' && turnoverProgress.resumeToB) {
                try {
                  const resumeRes = await fetch(`${turnoverProgress.bridgeEndpoint}/mcp`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json, text/event-stream',
                    },
                    body: JSON.stringify({
                      jsonrpc: '2.0',
                      id: Date.now(),
                      method: 'tools/call',
                      params: {
                        name: 'gitm_branch_switch',
                        // MD-C M2 · THE ORIGIN STAMP — the revert-resume switches THE CALLER's repo.
                        arguments: turnoverProgress.scpName
                          ? { name: turnoverProgress.resumeToB, originScpName: turnoverProgress.scpName }
                          : { name: turnoverProgress.resumeToB },
                      },
                    }),
                    keepalive: true,
                  });
                  void resumeRes.text(); // ACK-only
                  console.log(
                    '[WebSocket] REVERT-RESUME · A running · tree back on B ·',
                    turnoverProgress.resumeToB,
                    '· ACK',
                    resumeRes.status,
                  );
                } catch (e) {
                  console.warn('[WebSocket] REVERT-RESUME switch failed:', e);
                }
              }
              // C640 · THE SURVIVING MARKER (the Shield-on-B field round): the FIRST server-detect
              // can be a nodemon blip — consuming the marker here left the fresh page's REAL rebuild
              // gap markerless → the :221 re-show derived SHIELD on a B turn-over. The marker now
              // RIDES THROUGH the reload; the boot-time self-heal (expired anor healthy-live clear)
              // remains the sole consumer, so a stale marker still cannot leak past a clean boot.
            }
            window.location.reload();
          }
        } catch (e) {
          console.log('[WebSocket] Server not ready, retrying...');
        }
      };

      const pingInterval = setInterval(pingServer, 2000);
      pingServer();

      // GITM A↔B (#641) — arm the deadline ONLY for an A↔B turn-over to B.
      if (turnoverProgress) {
        const deadlineMs = Math.max(turnoverProgress.deadline - Date.now(), 0);
        console.log('[WebSocket] A↔B turn-over in progress · deadline armed · ms=', deadlineMs);

        deadlineTimer = setTimeout(async () => {
          if (aborted) return; // ping already succeeded — B booted
          aborted = true;

          // D1 conflict prevention (S4 Green seam 5c): stop the ping loop BEFORE the
          // revert fetch so the renderer ping + the revert do not double-navigate.
          clearInterval(pingInterval);
          localStorage.removeItem(GITM_TURNOVER_KEY);

          // Swap the standby to the failsafe message (inner-text swap · single overlay).
          showBridgeStandby('b-failed-reverting');
          console.warn('[WebSocket] A↔B deadline fired · B never booted · reverting to stable A');

          // Fire the revert over the OUTER SCS-Bridge /mcp (separate process · alive while
          // the SCP server is down). The endpoint was captured by the turn-over button.
          const bridgeEndpoint = turnoverProgress.bridgeEndpoint;
          if (bridgeEndpoint) {
            try {
              await fetch(`${bridgeEndpoint}/mcp`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json, text/event-stream',
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: Date.now(),
                  method: 'tools/call',
                  params: { name: 'gitm_revert_to_stable', arguments: {} },
                }),
              });
              console.log('[WebSocket] gitm_revert_to_stable dispatched to outer bridge');
            } catch (e) {
              console.error('[WebSocket] Revert MCP call failed:', e);
            }
          } else {
            console.error('[WebSocket] No bridge endpoint captured · cannot fire revert');
          }

          // Arm a FRESH ping loop to wait for A to come back after the revert restart.
          const aRecoveryInterval = setInterval(async () => {
            try {
              const res = await fetch('/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'ping' }),
              });
              if (res.ok) {
                console.log('[WebSocket] Stable A detected after revert · refreshing page...');
                clearInterval(aRecoveryInterval);
                window.location.reload();
              }
            } catch {
              /* A not ready yet — keep waiting */
            }
          }, 2000);
        }, deadlineMs);
      }
    });
  };

  // Message handler (set up once)
  const setupMessageHandler = (websocket: WebSocket, dispatch: any, d: any) => {
    websocket.addEventListener('message', (message: any) => {
      if (message.data !== 'ping') {
        const act = JSON.parse(message.data) as Action;
        if (Object.keys(act).includes('type')) {
          console.log(`[WebSocket] Received Action: ${act.type}`);

          // Handle server's clientStateId assignment
          // M2-Final R7 fix: act.payload is typed `never` here; cast to known shape
          const assignPayload = act.payload as { clientStateId?: string } | undefined;
          if (act.type === WEB_SOCKET_CLIENT_ASSIGN_CLIENT_STATE_ID && assignPayload?.clientStateId) {
            console.log(
              '[WebSocket] Received clientStateId from server:',
              assignPayload.clientStateId,
            );
            dispatch(
              d.webSocketClient.e.webSocketClientSetClientStateId({
                clientStateId: assignPayload.clientStateId,
              }),
              {},
            );
            return;
          }

          // Track when we receive state restoration from server (for reconnecting clients)
          if (act.type === WEB_SOCKET_CLIENT_ATOMIC_STATE_UPDATE) {
            console.log(
              '[WebSocket Sync] Reconnect handshake completed - server state received, initial sync unblocked',
            );
            hasReceivedServerState = true;
          }

          const validatedAction = validateAndRecreateAction(concepts_, (d_ as any).client, act);
          act.semaphore = [-1, -1, -1, -1];
          observer.next(validatedAction);
        }
      }
    });
  };

  // Initialization plan - waits for localStorage then opens connection
  plan('WebSocket Client Initialization', ({ stage, stageO, conclude, d__, k__ }) => [
    stageO(),

    // Stage 1: Wait for localStorage to be primed (or proceed without it)
    stage(
      ({ d, dispatch }) => {
        // GITM A↔B (#641) — session-init self-heal: clear an EXPIRED turn-over flag left
        // by a crashed tab (deadline already passed) so a fresh session starts clean. A
        // still-live flag is preserved (a genuine in-progress turn-over after a reload).
        // Uses the global Web Storage (window.localStorage) — distinct from the Stratimux
        // localStorage concept deck declared just below.
        if (typeof window !== 'undefined' && window.localStorage) {
          const staleProgress = readGitmTurnoverProgress();
          if (staleProgress && staleProgress.deadline < Date.now()) {
            window.localStorage.removeItem(GITM_TURNOVER_KEY);
            console.log('[WebSocket] Cleared stale gitm_turnover_in_progress flag (expired)');
          } else if (staleProgress) {
            // AUTO-CONFIRM B (Cycle 267 · user design — the Confirm gesture is UNNECESSARY):
            // this page BOOTING with a still-live turn-over carrier IS the proof the turn-over
            // completed — the restarted SCP is serving this very page (the reload only fires
            // after the reconnection ping succeeds). A B-source turn-over that boots WITHOUT a
            // revert to A means B is PROVEN → fire gitm_confirm_success automatically (SORD ·
            // ACK-only · the carrier holds the outer-bridge endpoint). Then clear the carrier
            // for BOTH sources — a completed turn-over must not re-arm the WS-close failsafe.
            if (staleProgress.source === 'B' && staleProgress.bridgeEndpoint) {
              void fetch(`${staleProgress.bridgeEndpoint}/mcp`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json, text/event-stream',
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: Date.now(),
                  method: 'tools/call',
                  params: { name: 'gitm_confirm_success', arguments: {} },
                }),
                keepalive: true,
              })
                .then((res) => {
                  void res.text(); // ACK-only — drain, never parse for state
                  console.log('[WebSocket] AUTO-CONFIRM B · booted on B · ACK', res.status);
                })
                .catch((err) => console.warn('[WebSocket] AUTO-CONFIRM B failed:', err));
            }
            window.localStorage.removeItem(GITM_TURNOVER_KEY);
            console.log(
              '[WebSocket] Turn-over carrier cleared on successful boot · source=',
              staleProgress.source,
            );
          }
        }

        const localStorage = (d as unknown as LocalStorageDeck).localStorage;

        if (!localStorage) {
          console.log(
            '[WebSocket] localStorage not available, proceeding without clientStateId persistence',
          );
          dispatch(d__.muxium.e.muxiumKick(), { setStage: 2 });
          return;
        }

        // M2-Final R7 fix: LocalStorageDeck.localStorage typed as raw Concept · cast to Deck entry shape
        const isPrimed = (localStorage as unknown as { k: { isLocalStoragePrimed: { select: () => boolean } } }).k.isLocalStoragePrimed.select();
        if (isPrimed) {
          console.log('[WebSocket] ✓ localStorage primed, proceeding with connection');
          dispatch(d__.muxium.e.muxiumKick(), { setStage: 2 });
        }
      },
      {
        beat: 100,
        // M2-Final R7 fix: localStorage.k accessor needs Deck-entry shape cast
        selectors: [
          ((d__ as unknown as LocalStorageDeck).localStorage as unknown as { k?: { isLocalStoragePrimed?: unknown } } | undefined)?.k?.isLocalStoragePrimed,
        ].filter(Boolean) as any[],
      },
    ),

    // Stage 2: Open WebSocket connection
    stage(
      ({ k, d, dispatch }) => {
        const clientStateId = k.clientStateId.select();
        const url = 'ws://' + window.location.host + '/muxium';

        console.log('[WebSocket] Opening connection', { url, clientStateId });
        ws = new WebSocket(url);

        ws.addEventListener('open', () => {
          console.log(
            '[WebSocket] Connected' +
              (clientStateId ? `, clientStateId: ${clientStateId}` : ' (new client)'),
          );

          // Track reconnection state for sync timing
          isReconnecting = !!clientStateId;
          hasReceivedServerState = false;

          // CRITICAL: Send reconnect message FIRST if we have stored clientStateId
          // This must arrive before any other message to trigger deferred registration
          // with the stored ID (server triggers registration on FIRST message received)
          if (clientStateId) {
            console.log(
              '[WebSocket] Reconnecting client - will wait for server state before syncing',
            );
            ws!.send(
              JSON.stringify({
                type: 'Web Socket Client Reconnect With State Id',
                payload: { clientStateId },
              }),
            );
          }

          // Send semaphore AFTER reconnect (or as first message for new clients)
          ws!.send(
            JSON.stringify(webSocketClientSetClientSemaphore({ semaphore: conceptSemaphore })),
          );

          // Update isConnected state
          dispatch(d.webSocketClient.e.webSocketClientSetIsConnected({ isConnected: true }), {});

          // Set up handlers after connection is open
          setupWebSocketHandlers(ws!, dispatch, d, k);
          setupMessageHandler(ws!, dispatch, d);
        });

        // Conclude initialization plan - WebSocket event handlers will manage from here
        dispatch(d__.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 50 },
    ),

    conclude(),
  ]);
};
/*#>*/
