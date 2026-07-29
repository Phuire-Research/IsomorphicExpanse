/**
 * SCSER · SCP-Caller-Session-Enacting-Registration · SAWSR-D2.B Cycle 153
 *
 * Fires at SCP runtime startup (before muxification in index.ts). Reads
 * env vars SCS_BRIDGE_CALLER_SESSION + SCS_BRIDGE_MCP_ENDPOINT injected by
 * Bridge's BMTI Activate Quality (scsBridgeActivateScpSession · CSEP pattern
 * Cycle 153). If both present, HTTP POSTs back to Bridge MCP tool
 * scs_bridge_bind_caller_session → Bridge's debounced intake Quality
 * (scsBridgeBindCallerSessionToScp · 500ms debounce per user-author Stratimux
 * guidance) → registry.updateSessionScpName atomic write → TUI PSM
 * Sessions-for-SCP filter picks up the agent's session row.
 *
 * Fire-and-forget · non-blocking · SCP startup proceeds regardless of callback
 * outcome. Logging on each Stage for flow tracing (per user direction Cycle 153
 * "in Each Quality of the Strategy. We will Place Logging to Determine the Exact
 * Flow"):
 *
 *   scser.stage1.env-read        env vars detected (or skipped if absent)
 *   scser.stage2.build-payload   payload constructed
 *   scser.stage3.post-dispatched HTTP POST sent
 *   scser.stage4.response        HTTP response received (status + body excerpt)
 *   scser.stage5.conclude        terminal stage · success or failure
 *   scser.error                  any catch-block failure
 *
 * This is a pure runtime callback module · NOT a Stratimux ActionStrategy
 * (no scp-side Concept context required at this stage). The user-author named
 * it "Strategy" doctrinally · the implementation IS a 5-stage sequence with
 * per-stage logging matching the Strategy semantic.
 *
 * Citation: ONYX-TIER-15.md Cycle 153 SCSER + IAUCW · Backward Arc
 * Citation: Bridge-side scsBridgeBindCallerSessionToScp.quality.huirth.ts (intake)
 */

const SCSER_LOG_PREFIX = '[SCSER]';

interface ScserLogPayload {
  event: string;
  callerSessionUlid?: string;
  scpName?: string;
  mcpEndpoint?: string;
  httpStatus?: number;
  responseExcerpt?: string;
  message?: string;
  stage?: string;
  reason?: string;
}

function scserLog(payload: ScserLogPayload): void {
  // Bridge debug.log integration is via the Bridge process (not SCP runtime).
  // SCP runtime logs to its own stdout/stderr · captured by Bridge's child stream.
  // Bridge then surfaces in Cascades/Bridge/debug.log via scpspawnmgr.child.stderr.
  // eslint-disable-next-line no-console
  console.log(`${SCSER_LOG_PREFIX} ${JSON.stringify(payload)}`);
}

export async function registerCallerSessionWithBridge(): Promise<void> {
  // Stage 1 · read env vars
  const callerSessionUlid = process.env.SCS_BRIDGE_CALLER_SESSION;
  const mcpEndpoint = process.env.SCS_BRIDGE_MCP_ENDPOINT;
  const scpName = process.env.SCP_NAME;

  if (!callerSessionUlid || !mcpEndpoint || !scpName) {
    scserLog({
      event: 'scser.stage1.env-read.skipped',
      stage: '1',
      reason: 'env-vars-absent',
      callerSessionUlid: callerSessionUlid ?? 'undefined',
      mcpEndpoint: mcpEndpoint ?? 'undefined',
      scpName: scpName ?? 'undefined',
    });
    return; // no env vars · not invoked via BMTI Activate path · skip silently
  }

  scserLog({
    event: 'scser.stage1.env-read',
    stage: '1',
    callerSessionUlid,
    mcpEndpoint,
    scpName,
  });

  // Stage 2 · build payload
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'scs_bridge_bind_caller_session',
      arguments: { callerSessionUlid, scpName },
    },
  });

  scserLog({
    event: 'scser.stage2.build-payload',
    stage: '2',
    callerSessionUlid,
    scpName,
  });

  // Stage 3 · HTTP POST dispatch (fire-and-forget with await for stage logging)
  try {
    scserLog({
      event: 'scser.stage3.post-dispatched',
      stage: '3',
      mcpEndpoint,
    });

    // Node 18+ has global fetch · works in SCP runtime (Node 20+)
    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // Stage 4 · response handling
    const responseText = await response.text();
    scserLog({
      event: 'scser.stage4.response',
      stage: '4',
      httpStatus: response.status,
      responseExcerpt: responseText.slice(0, 200),
    });

    // Stage 5 · conclude
    if (response.status >= 200 && response.status < 300) {
      scserLog({
        event: 'scser.stage5.conclude',
        stage: '5',
        reason: 'success',
        callerSessionUlid,
        scpName,
      });
    } else {
      scserLog({
        event: 'scser.stage5.conclude',
        stage: '5',
        reason: 'http-non-2xx',
        httpStatus: response.status,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    scserLog({
      event: 'scser.error',
      stage: '3-or-4',
      message,
    });
  }
}
