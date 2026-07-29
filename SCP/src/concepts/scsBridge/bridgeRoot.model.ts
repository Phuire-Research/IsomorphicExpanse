// Install Epoch recurse (Blank-Test-003 · RBJP hardening) · the SHARED bridge-junction resolver.
//
// The old per-site pattern (`SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd()`) assumed the SCP server's
// cwd was the project root — but a spawned SCP runs with cwd = the SCP PACKAGE dir
// (<project>/Cascades/scps/<name>/SCP), so the fallback probed INSIDE the SCP and the bridge
// connection never resolved for installed SCPs. Self-verifying chain (mirrors the bridge's
// resolveScsRoot philosophy) — resolves cleanly in BOTH locations:
//   1. SCS_BRIDGE_ROOT_OVERRIDE (dev:self sets it; the bridge spawn now injects it · RBJP)
//   2. WALK-UP probe: ascend from cwd until a dir contains Cascades/Bridge/bridge.json —
//      an installed SCP ascends SCP → <name> → scps → Cascades → <project> (HIT);
//      the template-in-repo ascends to the repo root (HIT).
//   3. cwd (the legacy fallback · a standalone boot at the project root).

import * as path from 'node:path';
import { existsSync } from 'node:fs';

const WALK_UP_LIMIT = 8;

/** the resolved `<junction>/Cascades/Bridge` directory (bridge.json + sessions.json live here). */
export function resolveBridgeRoot(): string {
  const override = process.env.SCS_BRIDGE_ROOT_OVERRIDE;
  if (override && override.length > 0) {
    return path.resolve(override, 'Cascades', 'Bridge');
  }
  // BO-2-I (C450) · THE OWN-PACKAGE SKIP: the per-SCP bridge.json (BO-2-G) lives INSIDE the
  // SCP package at cwd/Cascades/Bridge — WITHOUT this skip the walk-up is captured by the
  // SCP's OWN rail and every WORKSPACE rendezvous starves (gitm.json reads blank · the
  // boot-report never reaches the daemon's watch → the 45s failsafe fires phantom reverts —
  // the C449 regression). The walk-up now PREFERS an ANCESTOR hit (the workspace) and accepts
  // the cwd-level hit only when nothing above matches (a true standalone install). The SCP's
  // OWN rail is addressed EXPLICITLY via resolveScpLocalBridgeDir().
  const cwd = process.cwd();
  const cwdHit = existsSync(path.join(cwd, 'Cascades', 'Bridge', 'bridge.json'));
  let probe = path.dirname(cwd);
  for (let i = 0; i < WALK_UP_LIMIT; i += 1) {
    if (existsSync(path.join(probe, 'Cascades', 'Bridge', 'bridge.json'))) {
      return path.join(probe, 'Cascades', 'Bridge');
    }
    const parent = path.dirname(probe);
    if (parent === probe) break; // filesystem root
    probe = parent;
  }
  if (cwdHit) {
    return path.join(cwd, 'Cascades', 'Bridge');
  }
  return path.resolve(cwd, 'Cascades', 'Bridge');
}

/**
 * BO-2-I · the SCP's OWN per-SCP bridge rail (cwd/Cascades/Bridge) — the file the bridge's
 * per-SCP writer maintains (bridge.json + the turnOver field). NEVER walked-up: this is the
 * one resolver that must land INSIDE the package. The turn-over field watcher rides THIS.
 */
export function resolveScpLocalBridgeDir(): string {
  return path.resolve(process.cwd(), 'Cascades', 'Bridge');
}

/**
 * C465 · THE EXTENDED RELOCATION — the SCP's OWN Cascades/Extended/ (Cadmium Researcher ·
 * Pewter Tessera · every Suite 8 RI substrate). Extended moved from the WORKSPACE Cascades/
 * into the SCP package (the per-SCP Cascades/ is primary — Template Citizenship). Like the
 * bridge rail above, NEVER walked-up and NEVER env-diverted: the workspace override
 * (SCS_BRIDGE_ROOT_OVERRIDE) is the BRIDGE rendezvous root, not the Extended base.
 */
export function resolveScpLocalExtendedDir(): string {
  return path.resolve(process.cwd(), 'Cascades', 'Extended');
}
