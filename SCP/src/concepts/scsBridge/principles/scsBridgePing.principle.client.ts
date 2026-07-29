/**
 * scsBridgePing Principle — Client Deployment (PP-D4 · Option ζ)
 *
 * One-shot fetch gate Principle. Watches bridgeJson + connectionEstablished +
 * serverStartupTime. When all three prerequisites are live AND no fresh pong
 * yet exists, fires a single POST to `${bridgeJson.endpoint}/mcp/tool/bridge_ping_pong`.
 *
 * Stale-Pong Detection (PP-D4):
 *   isFreshPong = pongReceipt && serverStartupTime && respondedAt > serverStartupTime
 *   - Prior-session pong (respondedAt < serverStartupTime) → still Pending → fire fetch
 *   - Current-session pong (respondedAt > serverStartupTime) → Active → no-op
 *
 * Idempotency: the `isFreshPong` gate IS the stop condition. The stage fires
 * every time its selectors change; once a fresh pongReceipt arrives via BJDP
 * relay updating `bridgeJson`, the gate becomes true and stage returns. No
 * `alreadyPinged` ref needed — pongReceipt state IS the idempotency record.
 *
 * HAZARD-D dissolved (Ochre-A §1): Client does NOT parse the HTTP ack body
 * for state. State flows via filesystem → watcher → BJDP broadcast →
 * setBridgeJsonRelay reducer. The fetch().then() logs only.
 *
 * Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §3
 * Citation: scsBridgeConnection.principle.client.ts (M63 selector + beat pattern)
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 */
import { ref, type Ref } from 'vue';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

export type ScsBridgePingPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// In-flight guard — D3RM-E Bug C · R7 Path F Composed.
// Prevents multiple ping fetches during the pongReceipt wipe-receipt interval
// triggered by each successful focus operation. Same ACPF discipline as
// isFocusing in scsBridgeInvokeSessionFocus.principle.client.ts. The
// `isFreshPong` gate handles long-term idempotency (session-scoped);
// `isPinging` handles short-term in-flight (single-fetch-scoped) — the two
// mechanisms compose without conflict.
export const isPinging: Ref<boolean> = ref<boolean>(false);

export const scsBridgePingPrinciple: ScsBridgePingPrinciple = ({ k_, plan }) => {
  console.log('[SCS-Bridge Ping] Principle started · Option ζ · one-shot fetch gate');

  const pingPlan = plan('SCS-Bridge Ping (Client)', ({ stage }) => [
    stage(
      () => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const serverStartupTime = k_.serverStartupTime.select();
        const pong = bridgeJson?.pongReceipt;
        const isFreshPong =
          !!(pong && serverStartupTime && pong.respondedAt > serverStartupTime);

        // LSSD · Gate evaluation log fires on EVERY selector re-fire.
        // Citation: PING-GATE-BLOCKED-DIAGNOSIS-R7-FUCHSIA-CLINICAL.md §1 L10
        console.log(
          '[SCS-Bridge Ping] Gate check · connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· isFreshPong=',
          isFreshPong,
        );

        // Gate: all three prerequisites live · NOT already fresh-ponged
        if (!connectionEstablished || !bridgeJson || isFreshPong) {
          const reason = !connectionEstablished
            ? 'connectionEstablished=false'
            : !bridgeJson
              ? 'bridgeJson=null'
              : 'already-fresh-ponged';
          console.log('[SCS-Bridge Ping] Gate BLOCKED · reason:', reason);
          return;
        }

        // In-flight guard — D3RM-E Bug C · R7 Path F Composed.
        // Each successful focus triggers a bridge.json pongReceipt wipe → ping
        // selector re-fires. Without this guard, multiple ping fetches accumulate
        // in the browser HTTP/1.1 per-origin pool (6 slots) → focus fetch on 4th
        // click cannot acquire a slot → DSAB timeout. Guard collapses N selector
        // re-fires into 1 in-flight fetch.
        if (isPinging.value) {
          console.log('[SCS-Bridge Ping] Gate BLOCKED · reason: already-pinging');
          return;
        }

        isPinging.value = true;

        // ACPF (AbortController-Per-Fetch) — D3RM-E Bug C · R7 Path F Composed.
        // Per-fetch AbortController allows DSAB watchdog to actively cancel a hung
        // ping fetch (releasing its connection slot back to the browser HTTP/1.1
        // pool), and the .finally() abort serves as a safe no-op cleanup.
        const controller = new AbortController();

        // DSAB watchdog · 3000ms for ping (faster than focus 10000ms — ping
        // should be sub-second on a healthy bridge). Orphan-reset path forces
        // isPinging back to false and aborts the fetch if it never resolves.
        const timeoutId = setTimeout(() => {
          if (isPinging.value) {
            console.warn('[SCS-Bridge Ping] DSAB timeout — aborting and resetting');
            controller.abort();
            isPinging.value = false;
          }
        }, 3000);

        // MCP-Correct-RPC · Cycle 160 R15 · MCP single endpoint at /mcp with JSON-RPC 2.0
        // tools/call envelope · NOT /mcp/tool/{name} (which returns 404 HTML · prior cause
        // of "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"). MCP spec requires
        // both Accept headers (json + SSE). Verified via curl: tools/list returned
        // bridge_ping_pong with full schema (registered by Cobalt-B Cycle 160 R4 Wave 3a
        // at scsBridgeScpToolRegistration.principle.huirth.ts:222 pingPongMetadata).
        const url = `${bridgeJson.endpoint}/mcp`;
        const clientId = `scp-client-${Date.now()}`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: 'bridge_ping_pong',
            arguments: { clientId, timestamp: Date.now() },
          },
        };

        console.log('[SCS-Bridge Ping] Firing fetch · clientId:', clientId, '· url:', url, '· rpcId:', rpcId);

        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          // KFAF (Keepalive-Fire-And-Forget) — D3RM-E Bug C · R7 Path F.
          // Bypasses the browser HTTP/1.1 per-origin connection pool (6 slots);
          // keepalive fetches use a separate 64KB budget. Eliminates pool
          // pressure entirely for this fire-and-forget ping.
          keepalive: true,
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge Ping] Fetch response · status:',
              res.status,
              '· content-type:',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            if (contentType.includes('text/event-stream')) {
              const text = await res.text();
              return { rawStream: text };
            }
            return res.json();
          })
          .then((ack) => {
            console.log(
              '[SCS-Bridge Ping] Ack received · pongReceipt will arrive via BJDP file change · ack=',
              ack,
            );
          })
          .catch((err: Error) => {
            if (err.name === 'AbortError') {
              console.warn('[SCS-Bridge Ping] Fetch aborted via DSAB');
            } else {
              console.error('[SCS-Bridge Ping] Fetch failed · bridge not reachable:', err.message);
            }
          })
          .finally(() => {
            controller.abort();
            clearTimeout(timeoutId);
            isPinging.value = false;
          });
      },
      {
        selectors: [k_.bridgeJson, k_.connectionEstablished, k_.serverStartupTime],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge Ping] Principle cleanup');
    pingPlan.conclude();
  };
};
