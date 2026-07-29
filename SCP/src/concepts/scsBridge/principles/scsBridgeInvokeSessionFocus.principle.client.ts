/**
 * scsBridgeInvokeSessionFocus Principle — Client Deployment (CMIA-Focus)
 *
 * Sibling to scsBridgeInvokeSessionEngage (CMIA family). Watches the
 * pendingFocusSessionId trigger field — Vue dispatches with the user-selected
 * session.id when a Focus button is clicked; this principle fires the MCP
 * fetch tools/call('scp_focus_session', { sessionId }).
 *
 * Architectural alignment (D3RM-E):
 *   Client UI Focus → MCP scp_focus_session → Server quality scsBridgeFocusSession
 *     → focusTerminalWindow (ASFP) → osascript window-id targeting
 *   Future TUI hotkey path (Diamond F) → calls SAME focusTerminalWindow helper
 *   SFDS (Shared-Function-Discipline-Satisfied) preserved across MCP + TUI.
 *
 * NO SAES MUTATION: Focus is side-effect-only. The engaged session remains
 * engaged after a focus operation. No activeEngagedSessionId transition.
 *
 * ACK-ONLY DISCIPLINE: like CMIA-Engage, no parsing of ack body. Focus
 * completion is observable via Terminal.app window-front state (user Lambda).
 *
 * Citation: D3RM-E-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 3
 * Citation: scsBridgeInvokeSessionEngage.principle.client.ts (sibling template)
 */
import { ref, type Ref } from 'vue';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

export type ScsBridgeInvokeSessionFocusPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// Focus transient in-flight guard · M58-safe (Vue ref object stable).
// Exported for Vue component :disabled binding consistency with isEngaging.
export const isFocusing: Ref<boolean> = ref<boolean>(false);

export const scsBridgeInvokeSessionFocusPrinciple: ScsBridgeInvokeSessionFocusPrinciple = ({
  e_,
  k_,
  nextA,
  plan,
}) => {
  console.log('[SCS-Bridge CMIA-Focus] Principle started · trigger-field watcher');

  const focusPlan = plan('SCS-Bridge InvokeFocus (Client)', ({ stage }) => [
    stage(
      () => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const pendingSessionId = k_.pendingFocusSessionId.select();

        console.log(
          '[SCS-Bridge CMIA-Focus] Gate check · connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· pendingSessionId=',
          pendingSessionId,
          '· isFocusing=',
          isFocusing.value,
        );

        if (!connectionEstablished || !bridgeJson || !pendingSessionId) {
          // Honest silence — no pending focus trigger.
          return;
        }
        if (isFocusing.value) {
          console.log('[SCS-Bridge CMIA-Focus] BLOCKED · isFocusing in-flight');
          return;
        }

        isFocusing.value = true;
        const firedSessionId = pendingSessionId;
        console.log('[SCS-Bridge CMIA-Focus] Firing fetch · sessionId=', firedSessionId);

        // ACPF (AbortController-Per-Fetch) — D3RM-E Bug B · R7 Path E Composed.
        // Per-fetch AbortController allows DSAB watchdog to actively cancel a hung
        // fetch (releasing its connection slot back to the browser HTTP/1.1 pool),
        // and the .finally() abort serves as a safe no-op cleanup.
        const controller = new AbortController();

        // HAZARD-V analog · 10000ms timeout fallback for orphan reset.
        // WSVN fix (D3RM-E Bug A · R7 Path D Composed) — DSAB MUST clear trigger field
        // in muxium state so next click on same session produces null→sessionId value
        // transition (selector refires). Without this clear, identical sessionId write
        // is a no-op at the selector layer → watch silent → fetch never fires.
        // D3RM-E Bug B · controller.abort() added — releases hung fetch connection slot.
        // D3RM-E Bug C · R7 Path F · DSAB extended 5000→10000ms · accounts for Chrome
        // background-tab timer throttling that can delay the watchdog firing.
        const timeoutId = setTimeout(() => {
          if (isFocusing.value) {
            isFocusing.value = false;
            controller.abort();
            console.warn('[SCS-Bridge CMIA-Focus] DSAB timeout — forcing isFocusing reset · fetch aborted');
            nextA(e_.scsBridgeSetPendingFocusSessionId({ sessionId: null }));
          }
        }, 10000);

        const url = `${bridgeJson.endpoint}/mcp`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: 'scp_focus_session',
            arguments: { sessionId: firedSessionId },
          },
        };

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
          // keepalive fetches use a separate 64KB budget. Survives tab
          // backgrounding triggered by Terminal.app foreground-steal after focus.
          keepalive: true,
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge CMIA-Focus] Ack · status=',
              res.status,
              '· content-type=',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            // RBDOS (Response-Body-Drain-On-Success) — D3RM-E Bug B · R7 Path E.
            // Drain response body stream to release HTTP keep-alive connection slot
            // back to the browser per-origin pool. Undrained bodies hold connection
            // slots indefinitely on HTTP/1.1 keep-alive → pool exhaustion after ~3
            // successive successes → 4th fetch hangs at connection acquisition.
            // ACK-ONLY discipline preserved: result discarded, body never parsed.
            await res.text();
            console.log(
              '[SCS-Bridge CMIA-Focus] Ack received · Terminal.app window-front side-effect dispatched · sessionId=',
              firedSessionId,
            );
          })
          .catch((err: Error) => {
            if (err.name === 'AbortError') {
              console.warn('[SCS-Bridge CMIA-Focus] Fetch aborted via DSAB');
            } else {
              console.error('[SCS-Bridge CMIA-Focus] Fetch failed:', err.message);
            }
          })
          .finally(() => {
            controller.abort();
            clearTimeout(timeoutId);
            isFocusing.value = false;
            // Clear trigger field after fetch resolves (success or failure).
            nextA(e_.scsBridgeSetPendingFocusSessionId({ sessionId: null }));
          });
      },
      {
        selectors: [
          k_.bridgeJson,
          k_.connectionEstablished,
          k_.pendingFocusSessionId,
        ],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge CMIA-Focus] Principle cleanup');
    focusPlan.conclude();
  };
};
