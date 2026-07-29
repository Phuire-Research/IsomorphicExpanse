/**
 * SCP Registry Concept State Factory — Server-Side (M2-A1-D4)
 *
 * Server-side concept state for the SCPs.json registry. Resolves abs path
 * at construction; hydrates `scps` from file content via the watcher
 * principle (NOT in the factory — keeps construction synchronous/cheap).
 *
 * Higher-Order Composition: standalone base concept. Muxified into huirth
 * (Tier 1 → 2 access: d.huirth.d.scpRegistry.k.scps.select()).
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D4
 * Citation: scpRegistry.type.ts (M2-P2 type substrate)
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management"
 */
import path from 'node:path';
import type { ScpRegistryState } from './scpRegistry.type';
import { DEFAULT_SCP_REGISTRY_RELATIVE_PATH } from './scpRegistry.type';

// ============================================
// STATE FACTORY
// ============================================

export function createScpRegistryState(projectRoot: string = process.cwd()): ScpRegistryState {
  return {
    // InductionState (Diametric Quality routing)
    actionQue: [],
    filterKeys: SCP_REGISTRY_FILTER_KEYS,

    // Registry path (abs)
    scpRegistryPath: path.resolve(projectRoot, DEFAULT_SCP_REGISTRY_RELATIVE_PATH),

    // Hydrated by watcher principle on first fs.watch event AND on startup
    scps: [],

    // Last successful read/write
    lastSyncTimestamp: 0,
  };
}

// ============================================
// FILTER KEYS (server-only state · does not sync to client)
// ============================================

export const SCP_REGISTRY_FILTER_KEYS: string[] = [
  // InductionState
  'actionQue',
  'filterKeys',

  // Server-internal path (not relevant to client)
  'scpRegistryPath',

  // Internal accounting (not observable to client)
  'lastSyncTimestamp',

  // `scps` IS NOT in filterKeys — clients NEED this synced via
  // scsBridgeSetInstalledScps dispatch when scpRegistry pushes updates.
  // Wiring lives in scpRegistryWatcher.principle.ts.
];
