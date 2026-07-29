/**
 * scsBridgeInvokeSessionEngage Principle — Client Deployment (CMIA-Engage)
 *
 * Sibling to scsBridgeInvokeSessionSpawn (CMIA family · SAES-guarded).
 * Watches the pendingEngageSessionId trigger field — Vue dispatches with
 * the user-selected session.id when an Engage row affordance is clicked;
 * this principle fires the MCP fetch tools/call('scp_engage_session',
 * { sessionId }).
 *
 * Architectural alignment (User clarification 2026-05-23):
 *   TUI [resume-selected] handleResume → manager.launchInformative('resume')
 *   Client UI Engage → MCP scp_engage_session → SAME manager function
 *   Shared-function discipline — both routes terminate in identical code.
 *
 * SAESV2 (Single-Active-Engagement-Sentinel · V2) — activeEngagedSessionId tracks
 * the focus-target singleton ONLY (which session receives keystroke focus).
 * Concurrent engagement (CSME) is permitted — the SAES setter on ack success
 * re-points the focus-target to the newly engaged session. NO dispatch gate.
 *
 * ACK-ONLY DISCIPLINE: like CMIA-Spawn, no parsing of ack body.
 * On successful ack, dispatches setActiveEngagedSessionId(targetId) to
 * lock SAES; auto-clear is owned by Vue watcher when session status
 * transitions to 'archived' or 'offline'.
 *
 * Citation: D3D-ARCHITECTURE-R3C-YELLOW-CLIENT-PRINCIPLE.md §S3+S7
 * Citation: scsBridgeInvokeSessionSpawn.principle.client.ts (sibling)
 */
import { ref, type Ref } from 'vue';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

export type ScsBridgeInvokeSessionEngagePrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// Engage transient in-flight guard · M58-safe (Vue ref object stable).
// Exported for Vue component :disabled binding consistency with isSpawning.
export const isEngaging: Ref<boolean> = ref<boolean>(false);

export const scsBridgeInvokeSessionEngagePrinciple: ScsBridgeInvokeSessionEngagePrinciple = ({
  e_,
  k_,
  nextA,
  plan,
}) => {
  console.log('[SCS-Bridge CMIA-Engage] Principle started · SAES-guarded · trigger-field watcher');

  const engagePlan = plan('SCS-Bridge InvokeEngage (Client)', ({ stage }) => [
    stage(
      () => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const activeEngagedSessionId = k_.activeEngagedSessionId.select();
        const pendingSessionId = k_.pendingEngageSessionId.select();

        // LSSD · Gate evaluation
        console.log(
          '[SCS-Bridge CMIA-Engage] Gate check · connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· activeEngaged=',
          activeEngagedSessionId,
          '· pendingSessionId=',
          pendingSessionId,
          '· isEngaging=',
          isEngaging.value,
        );

        if (!connectionEstablished || !bridgeJson || !pendingSessionId) {
          // Honest silence — no pending engage trigger.
          return;
        }
        // SAESV2 · activeEngagedSessionId is informational only · NO dispatch gate here.
        // Engaging session-B while session-A is already engaged is permitted (CSME);
        // on ack success, setActiveEngagedSessionId({ sessionId: firedSessionId }) at
        // line ~166 re-points the focus-target marker. The read at line 58 remains for
        // diagnostic logging at line 62-73 (informational role).
        if (isEngaging.value) {
          console.log('[SCS-Bridge CMIA-Engage] BLOCKED · isEngaging in-flight');
          return;
        }

        isEngaging.value = true;
        const firedSessionId = pendingSessionId;
        console.log('[SCS-Bridge CMIA-Engage] Firing fetch · sessionId=', firedSessionId);

        // ACPF (AbortController-Per-Fetch) parity — D3RM-E Bug B · R7 Path E Composed.
        // Closes the latent same structural gap as Focus principle. Engage is currently
        // protected by SAES one-active-engagement guard (prevents accumulation), but
        // the body-drain + abort discipline must be uniform across CMIA siblings.
        const controller = new AbortController();

        // HAZARD-V analog · 10000ms timeout fallback for orphan reset.
        // WSVN parity fix (D3RM-E Bug A · R7 Path D Composed) — DSAB MUST clear trigger
        // field in muxium state. Focus principle exhibits this WSVN bug observably;
        // Engage masks it via SAES one-active-engagement escape path. Explicit clear
        // here removes the structural dependency on SAES and matches Focus parity.
        // D3RM-E Bug B · controller.abort() added — releases hung fetch connection slot.
        // D3RM-E Bug C · R7 Path F · DSAB extended 5000→10000ms · parity with Focus.
        const timeoutId = setTimeout(() => {
          if (isEngaging.value) {
            isEngaging.value = false;
            controller.abort();
            console.warn('[SCS-Bridge CMIA-Engage] DSAB timeout — forcing isEngaging reset · fetch aborted');
            nextA(e_.scsBridgeSetPendingEngageSessionId({ sessionId: null }));
          }
        }, 10000);

        const url = `${bridgeJson.endpoint}/mcp`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: 'scp_engage_session',
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
          // keepalive fetches use a separate 64KB budget. Parity with Focus +
          // Ping principles per CCDR (Composed CMIA Discipline Rule).
          keepalive: true,
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge CMIA-Engage] Ack · status=',
              res.status,
              '· content-type=',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            // RBDOS (Response-Body-Drain-On-Success) parity — D3RM-E Bug B · R7 Path E.
            // Drain body stream BEFORE SAES dispatch to release HTTP keep-alive
            // connection slot back to the per-origin pool. ACK-ONLY discipline
            // preserved: result discarded, body never parsed.
            await res.text();
            // On ack success, set SAES → activeEngagedSessionId = firedSessionId.
            // This locks One-Active-Engagement. Auto-clear via Vue watcher on
            // session status transition to archived/offline (R3-C §S7).
            nextA(e_.scsBridgeSetActiveEngagedSessionId({ sessionId: firedSessionId }));
            console.log(
              '[SCS-Bridge SAES] activeEngagedSessionId set via principle · id=',
              firedSessionId,
            );
          })
          .catch((err: Error) => {
            if (err.name === 'AbortError') {
              console.warn('[SCS-Bridge CMIA-Engage] Fetch aborted via DSAB');
            } else {
              console.error('[SCS-Bridge CMIA-Engage] Fetch failed:', err.message);
            }
          })
          .finally(() => {
            controller.abort();
            clearTimeout(timeoutId);
            isEngaging.value = false;
            // Clear trigger field after fetch resolves.
            nextA(e_.scsBridgeSetPendingEngageSessionId({ sessionId: null }));
          });
      },
      {
        selectors: [
          k_.bridgeJson,
          k_.connectionEstablished,
          k_.activeEngagedSessionId,
          k_.pendingEngageSessionId,
        ],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge CMIA-Engage] Principle cleanup');
    engagePlan.conclude();
  };
};
