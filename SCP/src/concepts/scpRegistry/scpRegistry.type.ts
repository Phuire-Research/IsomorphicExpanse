/**
 * SCP Registry Concept Type Definitions
 *
 * Server-side concept managing Cascades/SCPs.json as the single source of truth
 * for user-installed SCP instances. Distinct from Session Manager (which manages
 * general/UI sessions); SCPs.json sessions are SCP-scoped (lifecycle bound to
 * Managing Instance + Bridge Point).
 *
 * Higher-Order Composition: this concept stands as a base concept. The huirth
 * concept muxifies it (read access via d.huirth.d.scpRegistry.k.scps.select()).
 * No 3rd tier.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-P2
 * Citation: SUITE-3-YELLOW-MACRO-2-ARCHITECTURE.md (R3 grounding)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 * Citation: scsBridge.type.ts (sibling concept pattern)
 *
 * Macro 3 FSDCS reserved slots: cadmiumComponents + hyperPersonalizationConfig
 * fields on ScpRegistryEntry are forward-state-declared but unused in Macro 2.
 */
import type { AnyAction } from 'stratimux';

// ============================================
// SCP REGISTRY NAME CONSTANT
// ============================================

export const scpRegistryName = 'scpRegistry';

// ============================================
// CORE REGISTRY TYPES (mirror SCPs.json wire format)
// ============================================

export type ScpStatus =
  | 'template'    // template entry (the template/SCP itself; not in SCPs.json normally)
  | 'installed'   // cloned + renamed, not yet primed
  | 'primed'      // npm install + build:client complete
  | 'launching'   // child_process.spawn in progress
  | 'launched';   // Managing Instance active, Bridge Point bound

export type ScpSessionEntry = {
  sessionId: string;
  spawnedAt: string;             // ISO timestamp
  managingInstancePid: number;   // OS PID of spawned ts-node process
  boundBridgePort: number;       // dynamic port via get-port
  terminatedAt: string | null;   // null = still alive
};

export type ScpRegistryEntry = {
  name: string;                  // PascalCase user-chosen designation e.g. "MyResearch"
  conceptName: string;           // camelCase Stratimux ident e.g. "myResearch"
  path: string;                  // relative from SuiteCascadeSystem root e.g. "Cascades/scps/MyResearch/SCP"
  templateVersion: string;       // from template-version.json at clone time
  installedAt: string;           // ISO timestamp
  status: ScpStatus;
  managingInstancePid: number | null;
  boundBridgePort: number | null;
  sessions: ScpSessionEntry[];

  // FSDCS reserved slots (Macro 3 Cadmium Researcher hyper-personalization)
  cadmiumComponents?: string[];
  hyperPersonalizationConfig?: Record<string, unknown>;
};

export type ScpRegistry = {
  scps: ScpRegistryEntry[];
};

// ============================================
// CONCEPT STATE (server-side)
// ============================================

export type ScpRegistryState = {
  // InductionState (Diametric Quality routing)
  actionQue: AnyAction[];
  filterKeys: string[];

  // Registry state
  scpRegistryPath: string;       // abs path to Cascades/SCPs.json
  scps: ScpRegistryEntry[];      // hydrated from file
  lastSyncTimestamp: number;     // last successful read/write
};

// ============================================
// QUALITY PAYLOAD TYPES (Verbose Split Naming)
// ============================================

export type ScpRegistryReadPayload = {
  scpRegistryPath: string;
};

export type ScpRegistryRegisterScpPayload = {
  entry: ScpRegistryEntry;
};

export type ScpRegistryUpdateStatusPayload = {
  name: string;
  status: ScpStatus;
  pid?: number;
  port?: number;
};

export type ScpRegistryAppendSessionPayload = {
  name: string;
  session: ScpSessionEntry;
};

export type ScpRegistryTerminateSessionPayload = {
  name: string;
  sessionId: string;
  terminatedAt: string;
};

// ============================================
// DEFAULT CONSTANTS
// ============================================

export const DEFAULT_SCP_REGISTRY_FILENAME = 'SCPs.json';
export const DEFAULT_SCP_REGISTRY_RELATIVE_PATH = 'Cascades/SCPs.json';

// ============================================
// AJMI (Adjusted-Join-Menu-Interchange) — User-Facing 3-State Status
// ============================================
//
// User mid-M2-P3 architectural addendum: SCS-Bridge surface + Main Menu mirror
// observe a 3-state user-facing status distinct from the granular 5-state
// ScpStatus pipeline. The 3-state collapses pipeline transitions into
// human-meaningful gates for Conference rendering.
//
// Mapping:
//   undefined / 'template'                                  → 'Not Installed'
//   'installed' / 'primed' / 'launching'                    → 'Installing'
//   'launched'                                              → 'Installed'
//
// Citation: User AJMI addendum (Cycle 76 mid-M2-P3)
// Citation: DIAMOND-TIER-MACRO-2.md §AJMI

export type ScpUserFacingStatus = 'Not Installed' | 'Installing' | 'Installed';

export function deriveUserFacingStatus(status: ScpStatus | undefined): ScpUserFacingStatus {
  if (status === undefined || status === 'template') return 'Not Installed';
  if (status === 'launched') return 'Installed';
  return 'Installing'; // installed | primed | launching
}

// Main Menu mirror entry derivation — Conference renderer consumes this
// SCS-Bridge install menu IS mirrored to Shatterite SM-Main as one of two states:
//   - 'Show SCP-{name}' when registry has any installed entry
//   - 'Install Personalized SCP' when registry empty (follows Bridge Menu Pathing)
//
// After 'Install Personalized SCP' completes, Cadmium Researcher Tutorial
// JOIN point fires (Macro 3 territory · FSDCS slot present below).

export type MainMenuMirrorEntry =
  | { kind: 'install'; label: 'Install Personalized SCP' }
  | { kind: 'show'; label: string; scpName: string };

export function deriveMainMenuMirrorEntry(registry: ScpRegistry): MainMenuMirrorEntry {
  // First installed (status === 'launched') entry takes priority
  const installed = registry.scps.find((s) => s.status === 'launched');
  if (installed) {
    return { kind: 'show', label: `Show SCP-${installed.name}`, scpName: installed.name };
  }
  // Fallback to first registered (any status) entry — covers Installing state
  const anyRegistered = registry.scps[0];
  if (anyRegistered) {
    return { kind: 'show', label: `Show SCP-${anyRegistered.name}`, scpName: anyRegistered.name };
  }
  return { kind: 'install', label: 'Install Personalized SCP' };
}
