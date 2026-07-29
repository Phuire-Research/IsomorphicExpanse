/**
 * SCP Spawn Descriptor Builder — SABO Pattern (M2-A1-D5)
 *
 * Pure-function descriptor builder for the Spawn-and-Browser-Open (SABO)
 * pattern. Returns a SerializableSpawnDescriptor that callers materialize
 * via injected spawner + browser-opener — NO direct child_process or `open`
 * import in this module. Keeps the orchestration logic testable in pure
 * isolation; integration with `get-port` + `open` + node:child_process
 * happens at consumer wire-up (M2-Final or post-install Claude Code session).
 *
 * RSSQG (Real Spawn-and-Subprocess Quality Gate) — Macro 1 deferred swap-gate
 * CLOSES here. Pattern locked: detached + stdio=['ignore', out, err] + unref()
 * per R2 Orange WebSearch substrate.
 *
 * Higher-Order Composition: descriptor is the Diameter between intent (what
 * to spawn) and execution (how to spawn). Pure builder → injected executor →
 * Lambda-event. Two faces of one operation.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D5
 * Citation: SUITE-2-ORANGE-MACRO-2-NAMING-AND-WEBSEARCH.md (R2 spawn pattern grounding)
 * Citation: SUITE-1-RED-MACRO-2-CURATION.md (R1 ADMIN_ICP spawn precedent)
 */
import path from 'node:path';
import type { NameDerivation } from './designationValidator.model';

// ============================================
// DESCRIPTOR TYPES
// ============================================

export interface SerializableSpawnDescriptor {
  command: string;                    // e.g. 'npm'
  args: string[];                     // e.g. ['run', 'bridge']
  cwd: string;                        // abs install path
  detached: true;                     // SABO invariant
  stdio: ['ignore', 'pipe' | 'inherit' | 'ignore', 'pipe' | 'inherit' | 'ignore'];
  env: Record<string, string>;        // includes SCP_NAME · SCP_BRIDGE_PORT
  shouldUnref: true;                  // SABO invariant
  browserUrl: string;                 // URL to open post-spawn (http://localhost:{port})
  scpName: string;                    // for Cadmium join state
}

export interface BuildSpawnDescriptorOptions {
  installPath: string;                // abs path to Cascades/scps/{Name}/SCP
  derivation: NameDerivation;
  port: number;                       // resolved by caller via get-port
  parentEnv?: Record<string, string>; // typically process.env (filtered upstream)
}

// ============================================
// DESCRIPTOR BUILDER
// ============================================

/**
 * Builds a SerializableSpawnDescriptor for SABO launch. Caller materializes
 * the spawn via `child_process.spawn` + opens browser via the `open` npm
 * package (both injected at integration time).
 */
export function buildSpawnDescriptor(opts: BuildSpawnDescriptorOptions): SerializableSpawnDescriptor {
  const env: Record<string, string> = {
    ...(opts.parentEnv ?? {}),
    SCP_NAME: opts.derivation.designation,
    SCP_CONCEPT_NAME: opts.derivation.conceptName,
    SCP_BRIDGE_PORT: String(opts.port),
    PORT: String(opts.port),
    // THE SELF-OWNED SHUTDOWN MARKER · spawn-ONLY guard (mirrors the bridge-side
    // scpSpawn.model.ts). The webSocketServer self-shutdown gates on this so a spawned
    // SCP server self-kills when its last window closes, while a dev `npm run bridge`
    // (no marker) never does. Unconditional '1' — deliberately NOT sourced from parentEnv
    // so a stale parent value cannot spoof a dev process (a dev bridge never inherits
    // THIS descriptor's env block).
    SCS_SPAWNED_SCP: '1',
  };

  return {
    command: 'npm',
    args: ['run', 'bridge'],
    cwd: path.resolve(opts.installPath),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    shouldUnref: true,
    browserUrl: `http://localhost:${opts.port}`,
    scpName: opts.derivation.designation,
  };
}

// ============================================
// AJMI CADMIUM JOIN TRANSITION HELPER
// ============================================

export interface CadmiumJoinPendingState {
  kind: 'pending';
  scpName: string;
}

/**
 * Computes the AJMI Extension 3 Cadmium Tutorial Join state transition
 * payload that should fire AFTER successful SABO spawn. Consuming quality
 * (`scsBridgeSetCadmiumTutorialJoin`) takes this as payload and writes to
 * scsBridge.cadmiumTutorialJoin state.
 *
 * Pattern: spawn succeeds → cadmiumTutorialJoin = { kind: 'pending', scpName }
 *          → Macro 3 Cadmium Researcher reads `pending` → guides user
 *          → Cadmium fills `kind: 'active'` with `loopedMacroId`
 */
export function deriveCadmiumJoinPending(scpName: string): CadmiumJoinPendingState {
  return { kind: 'pending', scpName };
}

// ============================================
// PORT RANGE GUIDANCE
// ============================================

export const SCP_PORT_RANGE_START = 7700;
export const SCP_PORT_RANGE_END = 7799;

/**
 * Returns true if `port` is within the recommended SCP bridge port range.
 * `get-port` consumer should be configured with `{ port: portRange }`.
 */
export function isPortInScpRange(port: number): boolean {
  return port >= SCP_PORT_RANGE_START && port <= SCP_PORT_RANGE_END;
}
