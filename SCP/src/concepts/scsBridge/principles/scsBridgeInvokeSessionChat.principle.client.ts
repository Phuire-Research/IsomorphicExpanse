/**
 * scsBridgeInvokeSessionChat Principle — Client Deployment (D3RM-G · CBSE)
 *
 * Sibling to scsBridgeInvokeSessionFocus / scsBridgeInvokeSessionEngage.
 * Watches the pendingChatMessage trigger field (compound { sessionId, message }
 * | null) — Vue dispatches with the compound payload when the user submits
 * the CBSE chat bar; this principle fires the MCP fetch tools/call
 * ('scp_chat_session', { sessionId, message }). Server Quality writes to the
 * UIMJ queue file; CHMH Stop hook + asyncRewake delivers the message to
 * Claude at the target session's next turn-end.
 *
 * CCDR Discipline (Mandatory · inherited from Diamond E bug fixes):
 *   - WSVN  · clear pendingChatMessage to null in .finally() + DSAB so the
 *             next submit produces a null→object transition that re-fires
 *             the selector (R7 §5 Wave 4; Pewter §6.2)
 *   - RBDOS · await res.text() in .then() drains response body to release
 *             the HTTP/1.1 keep-alive connection slot back to the pool
 *             (Pewter §6.3 · chat is higher-frequency than focus, so RBDOS
 *             prevents pool exhaustion faster than focus path)
 *   - ACPF  · new AbortController() per-stage handler call so DSAB can
 *             actively cancel a hung fetch (Pewter §6.3)
 *   - KFAF  · keepalive: true on fetch options bypasses the browser
 *             per-origin HTTP/1.1 pool; uses the 64KB keepalive budget
 *             (Pewter §6.4 · chat does NOT trigger Terminal.app
 *             foreground-steal, but KFAF is preserved for parity + future
 *             window-switch resilience)
 *   - IGPAFP · isChatSending guard at top of stage; defense-in-depth (UI
 *             also gates via :disabled binding) (Pewter §6.4)
 *   - DSAB · 10000ms timeout fallback for orphan reset; matches focus
 *             principle calibration (Pewter §6.5)
 *
 * Status writeback: chatStatus is a per-session Vue ref maintained by the
 * Vue component. The principle exposes a `chatStatusWriter` callback that the
 * component sets at mount time — principle calls it on send-success/error
 * to update the per-session status state. This avoids cross-coupling state
 * into the Stratimux store for what is fundamentally a transient UX hint.
 *
 * ACK-ONLY: like CMIA-Focus, no parsing of ack body. Chat delivery is
 * observable via the target session's transcript update (Diamond F watcher).
 *
 * Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 4
 * Citation: D3RM-G-FOUNDATION-TEAL-CLAUDE-PEWTER-DESIGN.md §6 (CCDR spec)
 * Citation: scsBridgeInvokeSessionFocus.principle.client.ts (CCDR template)
 */
import { ref, type Ref } from 'vue';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

export type ScsBridgeInvokeSessionChatPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// IGPAFP · in-flight guard ref. Exported for Vue :disabled binding consistency
// with isFocusing / isEngaging / isSpawning sibling SIGR refs.
export const isChatSending: Ref<boolean> = ref<boolean>(false);

// Per-session in-flight scoping. Exported for Vue button-label scoping —
// only the row currently in flight renders 'SENDING…' (Pewter PWT-G12).
export const pendingChatSessionId: Ref<string | null> = ref<string | null>(null);

// Status writeback callback · Vue component registers a setter at mount.
// Principle calls this to publish per-session status transitions
// ('sending' | 'queued' | 'sent' | 'error' | '') to the component without
// coupling status into the Stratimux store. Component default = noop.
export type ChatStatusKind = '' | 'sending' | 'queued' | 'sent' | 'error';
type ChatStatusWriter = (sessionId: string, status: ChatStatusKind) => void;
let chatStatusWriter: ChatStatusWriter = () => {};
export function setChatStatusWriter(writer: ChatStatusWriter): void {
  chatStatusWriter = writer;
}

export const scsBridgeInvokeSessionChatPrinciple: ScsBridgeInvokeSessionChatPrinciple = ({
  e_,
  k_,
  nextA,
  plan,
}) => {
  console.log('[SCS-Bridge CBSE] Principle started · pendingChatMessage trigger watcher');

  const chatPlan = plan('SCS-Bridge InvokeChat (Client)', ({ stage }) => [
    stage(
      () => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const pending = k_.pendingChatMessage.select();

        console.log(
          '[SCS-Bridge CBSE] Gate check · connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· pending=',
          pending !== null,
          '· isChatSending=',
          isChatSending.value,
        );

        if (!connectionEstablished || !bridgeJson || pending === null) {
          // Honest silence — no pending chat trigger.
          return;
        }
        // IGPAFP · defense-in-depth. UI also disables button when this is true.
        if (isChatSending.value) {
          console.log('[SCS-Bridge CBSE] BLOCKED · isChatSending in-flight');
          return;
        }

        const { sessionId, message } = pending;
        isChatSending.value = true;
        pendingChatSessionId.value = sessionId;
        chatStatusWriter(sessionId, 'sending');
        console.log(
          '[SCS-Bridge CBSE] Firing fetch · sessionId=',
          sessionId,
          '· messageLength=',
          message.length,
        );

        // ACPF · per-fetch AbortController allows DSAB to actively cancel.
        const controller = new AbortController();

        // DSAB · 10000ms watchdog · matches CMIA-Focus calibration (Pewter §6.5).
        // WSVN clear MUST fire here too so a hung fetch does not strand the
        // selector in non-null state and block subsequent submits.
        const timeoutId = setTimeout(() => {
          if (isChatSending.value && pendingChatSessionId.value === sessionId) {
            isChatSending.value = false;
            pendingChatSessionId.value = null;
            controller.abort();
            chatStatusWriter(sessionId, 'error');
            console.warn(
              '[SCS-Bridge CBSE] DSAB timeout · forcing isChatSending reset · fetch aborted',
            );
            nextA(e_.scsBridgeSetPendingChatMessage({ payload: null }));
          }
        }, 10000);

        const url = `${bridgeJson.endpoint}/mcp`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: 'scp_chat_session',
            arguments: { sessionId, message },
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
          // KFAF · keepalive: true bypasses HTTP/1.1 per-origin pool via
          // separate 64KB keepalive budget. Preserved for parity with focus
          // principle even though chat does not trigger Terminal.app
          // foreground-steal (Pewter §6.4).
          keepalive: true,
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge CBSE] Ack · status=',
              res.status,
              '· content-type=',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            // RBDOS · drain response body to release HTTP/1.1 keep-alive
            // connection slot. Chat is higher-frequency than focus —
            // pool exhaustion would occur faster without this drain.
            // ACK-ONLY discipline preserved: result discarded, body never parsed.
            await res.text();
            chatStatusWriter(sessionId, 'queued');
            // Pewter §5.6 · 'queued' fades to '' after 3000ms.
            setTimeout(() => {
              chatStatusWriter(sessionId, '');
            }, 3000);
            console.log(
              '[SCS-Bridge CBSE] Ack received · message queued in UIMJ · sessionId=',
              sessionId,
              '· awaiting CHMH asyncRewake delivery',
            );
          })
          .catch((err: Error) => {
            if (err.name === 'AbortError') {
              console.warn('[SCS-Bridge CBSE] Fetch aborted via DSAB');
            } else {
              console.error('[SCS-Bridge CBSE] Fetch failed:', err.message);
              chatStatusWriter(sessionId, 'error');
              // Pewter §5.6 · 'error' fades after 5000ms.
              setTimeout(() => {
                chatStatusWriter(sessionId, '');
              }, 5000);
            }
          })
          .finally(() => {
            controller.abort();
            clearTimeout(timeoutId);
            isChatSending.value = false;
            pendingChatSessionId.value = null;
            // WSVN · clear trigger field after fetch resolves (success or failure).
            // Next submit produces null→object transition; selector re-fires.
            nextA(e_.scsBridgeSetPendingChatMessage({ payload: null }));
          });
      },
      {
        selectors: [
          k_.bridgeJson,
          k_.connectionEstablished,
          k_.pendingChatMessage,
        ],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge CBSE] Principle cleanup');
    chatPlan.conclude();
  };
};
