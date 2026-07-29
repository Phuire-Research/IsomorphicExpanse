/**
 * Self-Owned Shutdown · THE SERVER CONTROLS ITS OWN ACTIVE STATE THROUGH THE CONNECTION
 *
 * The structural directive: a SPAWNED SCP server exits itself when its window closes,
 * rather than lingering as an orphaned process. The signal is the WebSocket connection —
 * the server that once served ≥1 client and now serves 0 arms a grace timer; on expiry
 * (no reconnect within the grace window) it exits gracefully. A window REFRESH reconnects
 * within the window, canceling the timer, so the server survives an intentional refresh.
 *
 * Three guards keep this from misfiring:
 *   (1) THE SPAWN-ENV MARKER — only a SPAWNED SCP server carries SCS_SPAWNED_SCP=1 (set
 *       spawn-side in scpSpawn.model.ts, the sole spawn call site, deliberately not sourced
 *       from parentEnv). A dev `npm run bridge` (nodemon, no marker) NEVER self-kills.
 *   (2) THE HAD-CONNECTIONS PREDICATE — a server that never received a window does not exit
 *       (armSelfShutdownTimer is a no-op until noteClientRegistered has fired at least once).
 *   (3) THE GRACE CANCELS ON RECONNECT — registerClient calls cancelSelfShutdownTimer, so a
 *       window refresh (disconnect → reconnect within the grace window) survives.
 *
 * Timer + hadConnections are MODULE-SCOPE (matches the concept's convention — the reducers
 * are the arm/cancel sites; the durable flags live at module scope alongside them).
 *
 * Citation: scpSpawn.model.ts (SCS_SPAWNED_SCP=1 spawn-env marker · the spawn-only guard).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveBridgeRoot } from '../../scsBridge/bridgeRoot.model';

// ~8s grace window. Long enough to survive a window refresh (disconnect → reconnect),
// short enough that a genuinely-closed window frees the process promptly.
const SELF_SHUTDOWN_GRACE_MS = 8000;

// PSSM · W2 · THE SERVER PRE-EXIT STATUS WRITE (template side · SYNC MIRROR of the
// bridge setScpStatus writer). Just before process.exit(0) this spawned SCP server
// marks its OWN persisted status → 'pending' in the WORKSPACE SCPs.json, so the daemon's
// parent-dir status watch fires the live → pending lifecycle transition and the TUI row
// follows. The process is EXITING, so the write is SYNCHRONOUS (atomic tmp + renameSync)
// and fully try/catch-wrapped — a failure here must NEVER block or delay the exit.
//
// scpName source: process.env.SCP_NAME (scpSpawn.model.ts injects it AFTER the parentEnv
// spread — authoritative). workspace SCPs.json: resolveBridgeRoot() returns
// <junction>/Cascades/Bridge, so its parent dir + 'SCPs.json' is the registry file the
// bridge writer and the daemon watcher both agree on. The SHAPE ({name, status,
// statusUpdatedAt}) is byte-identical to scpSessionRegistry.setScpStatus (W1).
function writeOwnStatusPendingSync(): void {
  try {
    const scpName = process.env.SCP_NAME;
    if (typeof scpName !== 'string' || scpName.length === 0) return; // dev / no designation → skip
    // resolveBridgeRoot() = <junction>/Cascades/Bridge → SCPs.json is a sibling of Bridge.
    const scpsJsonPath = path.join(path.dirname(resolveBridgeRoot()), 'SCPs.json');
    let data: { scps?: Array<Record<string, unknown>> } = {};
    try {
      data = JSON.parse(fs.readFileSync(scpsJsonPath, 'utf8')) as typeof data;
    } catch {
      data = {}; // absent / unparsable → UPSERT into a fresh shape (mirror of the bridge writer)
    }
    const scps = Array.isArray(data.scps) ? data.scps : [];
    const statusUpdatedAt = Date.now();
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, status: 'pending', statusUpdatedAt });
    } else {
      scps[idx] = { ...scps[idx], status: 'pending', statusUpdatedAt };
    }
    const payload = JSON.stringify({ ...data, scps }, null, 2);
    const tmp = scpsJsonPath + '.tmp';
    fs.writeFileSync(tmp, payload, 'utf8');
    fs.renameSync(tmp, scpsJsonPath); // atomic REPLACE — the daemon's dir-watch surfaces this
    console.log('[SCP Server] pre-exit status → pending written:', scpName);
  } catch (err) {
    // Never block the exit — best-effort only.
    console.error('[SCP Server] pre-exit status write failed (non-blocking):', err);
  }
}

// THE HAD-CONNECTIONS PREDICATE · guard (2). Latches true the first time a client registers.
// A server that never received a window will never arm the timer.
let hadConnections = false;

// Module-scope grace timer handle. Non-null ⇒ a shutdown is pending (cancelable by reconnect).
let selfShutdownTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * THE SPAWN-ENV MARKER · guard (1). True ONLY when this process was spawned by the bridge
 * (SCS_SPAWNED_SCP=1 in the spawn descriptor env). A dev `npm run bridge` never carries it.
 * Read live (not cached) so tests can toggle process.env deterministically.
 */
export function isSpawnedScpServer(): boolean {
  return process.env.SCS_SPAWNED_SCP === '1';
}

/**
 * Records that a client has registered. Latches the had-connections predicate and cancels
 * any pending self-shutdown (a reconnect within the grace window survives). Called from the
 * registerClient reducer.
 */
export function noteClientRegistered(): void {
  hadConnections = true;
  cancelSelfShutdownTimer();
}

/**
 * Cancels a pending self-shutdown grace timer, if armed. Idempotent. Called from
 * registerClient (reconnect survives) and available for explicit teardown.
 */
export function cancelSelfShutdownTimer(): void {
  if (selfShutdownTimer !== null) {
    clearTimeout(selfShutdownTimer);
    selfShutdownTimer = null;
    console.log('[SCP Server] self-shutdown grace canceled — client reconnected');
  }
}

/**
 * Arms the self-shutdown grace timer when the last client connection has closed.
 * No-op unless ALL THREE guards pass:
 *   (1) isSpawnedScpServer() — spawn-env marker present
 *   (2) hadConnections — a window was once served
 *   (3) remainingConnections === 0 — the last one just closed
 * An already-armed timer is left in place (a second 0-remaining event does not restart it).
 * Called from the unregisterClient reducer with the post-removal connection count.
 */
export function armSelfShutdownTimer(remainingConnections: number): void {
  if (remainingConnections !== 0) return; // still-connected clients — nothing to do
  if (!isSpawnedScpServer()) return; // guard (1) — dev bridge never self-kills
  if (!hadConnections) return; // guard (2) — never received a window
  if (selfShutdownTimer !== null) return; // already pending — do not restart the clock

  console.log(
    `[SCP Server] zero client connections — arming self-shutdown grace (${SELF_SHUTDOWN_GRACE_MS}ms)`,
  );
  selfShutdownTimer = setTimeout(() => {
    selfShutdownTimer = null;
    console.log('[SCP Server] zero client connections — self-shutdown');
    // PSSM · W2 · SYNC-mark own persisted status → 'pending' JUST PRIOR to exit, so the
    // daemon's SCPs.json dir-watch fires the live → pending transition. try/catch inside
    // the helper — never blocks the graceful exit.
    writeOwnStatusPendingSync();
    // Graceful exit — detached spawned process releases its port + resources.
    process.exit(0);
  }, SELF_SHUTDOWN_GRACE_MS);
  // Do not keep the event loop alive solely for this timer — if the process is otherwise
  // idle it may exit on its own; if not, the timer still fires at the deadline.
  if (typeof selfShutdownTimer.unref === 'function') {
    selfShutdownTimer.unref();
  }
}
