/**
 * scsBridgeGitmAction Principle — Client Deployment (GITM PAGE action pipe)
 *
 * Sibling to scsBridgeInvokeSessionFocus (the CMIA family). Watches the
 * gitmPendingAction trigger field — Vue dispatches a { tool, arguments } object when
 * the user stages/unstages a file, commits, or switches a branch on the Git sub-page;
 * this principle fires the MCP fetch tools/call(action.tool, action.arguments).
 *
 * Architectural alignment:
 *   Client UI Git action → MCP gitm_* tool → bridge gitm quality → git operation
 *   State update returns via gitm.json file change → scsBridgeGitmJsonWatcherPrinciple
 *     → relay → Vue re-renders. The SCP NEVER parses the fetch ack body for state
 *     (ACK-ONLY discipline · state arrives via the gitm.json watcher path).
 *
 * The MCP tool name is carried by action.tool (gitm_stage_file | gitm_unstage_file |
 * gitm_commit | gitm_branch_switch | ...); the JSON-RPC params.arguments is action.arguments.
 *
 * Template: scsBridgeInvokeSessionFocus.principle.client.ts
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { ref, type Ref } from 'vue';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

export type ScsBridgeGitmActionPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// Git-action transient in-flight guard · M58-safe (Vue ref object stable).
// Exported for Vue component :disabled binding consistency.
export const isGitmActing: Ref<boolean> = ref<boolean>(false);

export const scsBridgeGitmActionPrinciple: ScsBridgeGitmActionPrinciple = ({
  e_,
  k_,
  nextA,
  plan,
}) => {
  console.log('[SCS-Bridge GITM] Action principle started · trigger-field watcher');

  const gitmActionPlan = plan('SCS-Bridge GitmAction (Client)', ({ stage }) => [
    stage(
      () => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const pendingAction = k_.gitmPendingAction.select();

        console.log(
          '[SCS-Bridge GITM] Gate check · connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· pendingAction=',
          pendingAction?.tool,
          '· isGitmActing=',
          isGitmActing.value,
        );

        if (!connectionEstablished || !bridgeJson || !pendingAction) {
          // Honest silence — no pending git action trigger.
          return;
        }
        if (isGitmActing.value) {
          console.log('[SCS-Bridge GITM] BLOCKED · isGitmActing in-flight');
          return;
        }

        isGitmActing.value = true;
        const firedAction = pendingAction;
        console.log('[SCS-Bridge GITM] Firing fetch · tool=', firedAction.tool);

        // ACPF (AbortController-Per-Fetch) — per-fetch controller lets the DSAB
        // watchdog actively cancel a hung fetch (releasing its connection slot).
        const controller = new AbortController();

        // DSAB watchdog · 5000ms timeout fallback for orphan reset. WSVN — MUST clear the
        // trigger field so the next identical action produces a null→object transition
        // (selector refires). Without this clear an identical write is a no-op at the
        // selector layer → watch silent → fetch never fires.
        const timeoutId = setTimeout(() => {
          if (isGitmActing.value) {
            isGitmActing.value = false;
            controller.abort();
            console.warn('[SCS-Bridge GITM] DSAB timeout — forcing isGitmActing reset · fetch aborted');
            nextA(e_.scsBridgeSetGitmPendingAction({ gitmPendingAction: null }));
          }
        }, 5000);

        const url = `${bridgeJson.endpoint}/mcp`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: firedAction.tool,
            arguments: firedAction.arguments,
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
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge GITM] Ack · status=',
              res.status,
              '· content-type=',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            // RBDOS (Response-Body-Drain-On-Success) — drain the body stream to release
            // the HTTP keep-alive connection slot back to the per-origin pool. ACK-ONLY
            // discipline preserved: result discarded, body never parsed for state.
            await res.text();
            console.log(
              '[SCS-Bridge GITM] Ack received · state arrives via gitm.json watcher · tool=',
              firedAction.tool,
            );
          })
          .catch((err: Error) => {
            if (err.name === 'AbortError') {
              console.warn('[SCS-Bridge GITM] Fetch aborted via DSAB');
            } else {
              console.error('[SCS-Bridge GITM] Fetch failed:', err.message);
            }
          })
          .finally(() => {
            controller.abort();
            clearTimeout(timeoutId);
            isGitmActing.value = false;
            // WSVN — clear trigger field after fetch resolves (success or failure).
            nextA(e_.scsBridgeSetGitmPendingAction({ gitmPendingAction: null }));
          });
      },
      {
        selectors: [
          k_.bridgeJson,
          k_.connectionEstablished,
          k_.gitmPendingAction,
        ],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge GITM] Action principle cleanup');
    gitmActionPlan.conclude();
  };
};
