/**
 * SCP Muxonomy Registry - Bridge File
 *
 * This file is the SINGLE POINT OF CHANGE for SCP tool registration.
 * StratiVERSE's Actionable Tool (Means 1) manages imports in this file.
 *
 * BUILD-BASED APPROACH:
 * - StratiVERSE modifies this file to add/remove concept muxonomy imports
 * - Server restart activates new registrations (Means 3 Bridge Restart)
 * - SCP principle imports from this file and iterates the registry
 *
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Bridge Muxonomic File Pattern
 * Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
 */

import type { MuxonomicConfig } from '../muxonomy/muxonomy.model';
import type { SCPStrategyRegistry } from './scp.types';

// ============================================
// MUXONOMY IMPORTS (Managed by StratiVERSE)
// ============================================

console.log('[SCPMuxonomyRegistry] Module loading...');

// SCP Template: No muxonomic imports — empty registry
// Future: ADMIN_SCP StratiVERSE will manage entries in this file
console.log('[SCPMuxonomyRegistry] scpToolMetadata length: 0');

// ============================================
// REGISTRY ENTRY TYPE
// ============================================

/**
 * SCPMuxonomyRegistryEntry - Entry in the SCP Muxonomy Registry
 *
 * Each entry pairs a concept's MuxonomicConfig with its conceptName.
 * The conceptName is used for deck access during manifold execution.
 */
export type SCPMuxonomyRegistryEntry = {
  muxonomic: MuxonomicConfig<string>;
  conceptName: string;
};

// ============================================
// SCP MUXONOMY REGISTRY (Managed by StratiVERSE)
// ============================================

/**
 * scpMuxonomyRegistry - Array of all concept muxonomies with SCP tools
 *
 * The SCP principle iterates this array on startup to register tools.
 * StratiVERSE's Actionable Tool adds/removes entries as concepts
 * gain or lose SCP tool definitions.
 *
 * Pattern:
 * 1. StratiVERSE scans concepts for scpToolMetadata[]
 * 2. StratiVERSE updates imports and registry array in this file
 * 3. Server restart (Means 3) activates changes
 * 4. SCP principle reads registry and registers tools
 */
export const scpMuxonomyRegistry: SCPMuxonomyRegistryEntry[] = [];
