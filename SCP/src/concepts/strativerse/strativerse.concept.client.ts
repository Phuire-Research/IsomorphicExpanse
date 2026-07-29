/**
 * StratiVERSE Client Concept - Tree-Shaking Separation with Induction Pattern
 *
 * This file provides the CLIENT-SIDE strativerse concept with:
 * - REAL qualities for DeploymentTarget.All (setConceptList)
 * - INDUCTION qualities for DeploymentTarget.Huirth (scanConcepts, broadcastConceptList, generateMuxonomyRegistry)
 *
 * The Induction Diametric Quality Pattern:
 * - Induction qualities have the SAME type string as server qualities (Diameter)
 * - Instead of throwing errors, they route actions to WebSocket actionQue
 * - webSocketClient.principle monitors actionQue and sends via WebSocket
 * - Server executes REAL quality by TYPE STRING lookup
 * - Strategies are preserved across the WebSocket boundary
 *
 * This enables:
 * - Direct dispatch of Huirth-only actions from client code
 * - Automatic WebSocket routing without manual appendToActionQue wrapping
 * - Vite/Rollup tree-shaking to exclude server-only code (fs, path, etc.)
 * - Full StratiDECK type compatibility
 *
 * Citation: muxonomy.model.ts - createInductionQualityCard, createInductionQualityCardWithPayload
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 * Citation: FORWARD-PASS-MUXONOMY-ISLANDS.md - Phase 6 Muxonomic Build Separation
 */

import { createConcept, type Quality, type AnyConcept } from 'stratimux';
import {
  type MuxonomicConcept,
  type InductionState,
  createInductionQualityCard,
  createInductionQualityCardWithPayload,
} from '../muxonomy/muxonomy.model';
// Direct imports from type + state files (NO barrel exports for tree-shaking)
import type { StrativerseState, StrativerseConceptList } from './strativerse.type';
import { strativerseName } from './strativerse.type';
import { createStrativerseState } from './strativerse.state';
import { strativerseMuxonomic } from './strativerse.muxonomy';

// Import REAL quality for DeploymentTarget.All
import { strativerseSetConceptList, type StrativerseSetConceptListPayload } from './qualities/setConceptList.quality';

// Import payload types for induction qualities (types only - no implementation code)
import type { StrativerseScanConceptsPayload } from './qualities/scanConcepts.quality.huirth.diameter';
import type { StrativerseGenerateMuxonomyRegistryPayload } from './qualities/generateMuxonomyRegistry.quality.huirth.diameter';
import type { StrativerseTriggerScanPayload } from './qualities/triggerScan.quality.client.diameter';
// POC 2.3b: Muxonomy Modification payload types
import type { TriggerUpdateTargetPayload, TriggerToggleDiameterPayload, TriggerToggleSyncManagedPayload } from './strativerse.type';

// Broadcast has no payload - define empty type
type StrativerseBroadcastConceptListPayload = Record<string, never>;

// ============================================
// CLIENT STATE TYPE (Includes actionQue for Induction)
// ============================================

/**
 * StrativerseClientState - Client-side state type
 *
 * Extends StrativerseState with InductionState to enable Induction qualities.
 * The actionQue is provided at runtime through muxified webSocketClient.
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
type StrativerseClientState = StrativerseState & InductionState;

// ============================================
// INDUCTION QUALITIES (Huirth-only → Client routes to actionQue)
// ============================================

/**
 * scanConcepts INDUCTION - Huirth-only quality
 *
 * Real implementation lives on server (uses fs/promises, path).
 * Client dispatches this action directly - Induction pattern routes to actionQue.
 * webSocketClient.principle sends to server where REAL quality executes.
 *
 * Type: 'Strativerse Scan Concepts' (Verbose Split - matches server quality)
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export const strativerseScanConceptsClient = createInductionQualityCardWithPayload<
  StrativerseClientState,
  StrativerseScanConceptsPayload
>(
  'Strativerse Scan Concepts'
);

/**
 * broadcastConceptList INDUCTION - Huirth-only quality
 *
 * Real implementation lives on server (broadcasts via WebSocket).
 * Client dispatches this action directly - Induction pattern routes to actionQue.
 * webSocketClient.principle sends to server where REAL quality executes.
 *
 * Type: 'Strativerse Broadcast Concept List' (Verbose Split - matches server quality)
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export const strativerseBroadcastConceptListClient = createInductionQualityCard<
  StrativerseClientState
>(
  'Strativerse Broadcast Concept List'
);

/**
 * generateMuxonomyRegistry INDUCTION - Huirth-only quality (diameter junction)
 *
 * Real implementation lives on server (writes muxonomyRegistry.generated.ts).
 * Client dispatches this action directly - Induction pattern routes to actionQue.
 * webSocketClient.principle sends to server where REAL quality executes.
 *
 * Type: 'Strativerse Generate Muxonomy Registry' (Verbose Split - matches server quality)
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export const strativerseGenerateMuxonomyRegistryClient = createInductionQualityCardWithPayload<
  StrativerseClientState,
  StrativerseGenerateMuxonomyRegistryPayload
>(
  'Strativerse Generate Muxonomy Registry'
);

/**
 * triggerScan INDUCTION - Trigger quality for server-side strategy creation
 *
 * Sends trigger to server which creates full initialization strategy.
 * The strategyDetermine wrapper (auto-added by Induction) enables:
 * - WebSocket server adds clientStateKey to strategy.data
 * - Server extracts clientStateKey and embeds in full manifold strategy
 * - Response routes back to originating client
 *
 * Type: 'Strativerse Trigger Scan' (Verbose Split - matches server quality)
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export const strativerseTriggerScanClient = createInductionQualityCardWithPayload<
  StrativerseClientState,
  StrativerseTriggerScanPayload
>(
  'Strativerse Trigger Scan'
);

// ============================================
// POC 2.3b: MUXONOMY MODIFICATION INDUCTION QUALITIES
// ============================================

/**
 * triggerUpdateTarget INDUCTION - Client trigger for DeploymentTarget modification
 *
 * Sends request to server to change DeploymentTarget of a quality or principle.
 * Server-side quality renames file and updates muxonomy configuration.
 *
 * ClientStateKey Manifold:
 * - Induction wraps with strategyDetermine
 * - WebSocket server adds clientStateKey to strategy.data
 * - Server extracts clientStateKey, creates manifold strategy
 * - Z Return broadcasts updated conceptList to ALL clients
 *
 * Type: 'Strativerse Trigger Update Target' (Verbose Split - matches server quality)
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 */
export const strativerseTriggerUpdateTargetClient = createInductionQualityCardWithPayload<
  StrativerseClientState,
  TriggerUpdateTargetPayload
>(
  'Strativerse Trigger Update Target'
);

/**
 * triggerToggleDiameter INDUCTION - Client trigger for Diameter toggle
 *
 * Sends request to server to enable/disable Induction pattern for a quality.
 * Note: Principles do NOT have diameter - they are behavioral.
 *
 * Type: 'Strativerse Trigger Toggle Diameter' (Verbose Split - matches server quality)
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 */
export const strativerseTriggerToggleDiameterClient = createInductionQualityCardWithPayload<
  StrativerseClientState,
  TriggerToggleDiameterPayload
>(
  'Strativerse Trigger Toggle Diameter'
);

// ============================================
// Phase 5E: SYNC MANAGED TOGGLE INDUCTION
// ============================================

/**
 * triggerToggleSyncManaged INDUCTION - Client trigger for SyncManaged toggle
 *
 * Sends request to server to add/remove concept from the Concept Library.
 * Server calls strativerse_toggle_sync_managed SCP tool which modifies muxonomy.ts.
 *
 * Type: 'Strativerse Trigger Toggle Sync Managed' (Verbose Split - matches server quality)
 *
 * Citation: SUITE-5-6-STRATIVERSE-LANDING-PAGE-ENHANCEMENT-ROADMAP.md Phase E
 */
export const strativerseTriggerToggleSyncManagedClient = createInductionQualityCardWithPayload<
  StrativerseClientState,
  TriggerToggleSyncManagedPayload
>(
  'Strativerse Trigger Toggle Sync Managed'
);

// ============================================
// CLIENT QUALITIES COLLECTION
// ============================================

/**
 * Client-side qualities object
 *
 * - setConceptList: REAL (DeploymentTarget.All)
 * - scanConcepts: INDUCTION (routes to actionQue → server)
 * - broadcastConceptList: INDUCTION (routes to actionQue → server)
 * - generateMuxonomyRegistry: INDUCTION (routes to actionQue → server)
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export const strativerseClientQualities = {
  strativerseSetConceptList,
  strativerseScanConcepts: strativerseScanConceptsClient,
  strativerseBroadcastConceptList: strativerseBroadcastConceptListClient,
  strativerseGenerateMuxonomyRegistry: strativerseGenerateMuxonomyRegistryClient,
  strativerseTriggerScan: strativerseTriggerScanClient,
  // POC 2.3b: Muxonomy Modification
  strativerseTriggerUpdateTarget: strativerseTriggerUpdateTargetClient,
  strativerseTriggerToggleDiameter: strativerseTriggerToggleDiameterClient,
  // Phase 5E: SyncManaged Toggle
  strativerseTriggerToggleSyncManaged: strativerseTriggerToggleSyncManagedClient,
};

// ============================================
// QUALITY TYPES (Same as server for StratiDECK consistency)
// ============================================

export type StrativerseSetConceptList = Quality<StrativerseState, StrativerseSetConceptListPayload>;
export type StrativerseScanConcepts = Quality<StrativerseState, StrativerseScanConceptsPayload>;
export type StrativerseBroadcastConceptList = Quality<StrativerseState>;
export type StrativerseGenerateMuxonomyRegistry = Quality<StrativerseState, StrativerseGenerateMuxonomyRegistryPayload>;
export type StrativerseTriggerScan = Quality<StrativerseState, StrativerseTriggerScanPayload>;
// POC 2.3b: Muxonomy Modification Quality Types
export type StrativerseTriggerUpdateTarget = Quality<StrativerseState, TriggerUpdateTargetPayload>;
export type StrativerseTriggerToggleDiameter = Quality<StrativerseState, TriggerToggleDiameterPayload>;
// Phase 5E: SyncManaged Toggle Quality Type
export type StrativerseTriggerToggleSyncManaged = Quality<StrativerseState, TriggerToggleSyncManagedPayload>;

export type StrativerseClientQualities = {
  strativerseSetConceptList: StrativerseSetConceptList;
  strativerseScanConcepts: StrativerseScanConcepts;
  strativerseBroadcastConceptList: StrativerseBroadcastConceptList;
  strativerseGenerateMuxonomyRegistry: StrativerseGenerateMuxonomyRegistry;
  strativerseTriggerScan: StrativerseTriggerScan;
  // POC 2.3b: Muxonomy Modification
  strativerseTriggerUpdateTarget: StrativerseTriggerUpdateTarget;
  strativerseTriggerToggleDiameter: StrativerseTriggerToggleDiameter;
  // Phase 5E: SyncManaged Toggle
  strativerseTriggerToggleSyncManaged: StrativerseTriggerToggleSyncManaged;
};

// ============================================
// CLIENT CONCEPT & DECK
// ============================================

export type StrativerseClientConcept = typeof strativerseClientConcept;

export type StrativerseClientDeck = {
  strativerse: StrativerseClientConcept;
};

/**
 * Client-side strativerse concept
 *
 * NO principles - the strativersePrinciple is server-only (DeploymentTarget.Huirth).
 * Client receives state updates via WebSocket sync, not via principle scanning.
 */
const strativerseClientConcept = createConcept(
  strativerseName,
  createStrativerseState(),
  strativerseClientQualities,
  [] // No principles on client
);

// ============================================
// CLIENT CONCEPT CREATOR
// ============================================

/**
 * createStrativerseConceptClient - Client-side concept creator
 *
 * Returns strativerse concept configured for CLIENT deployment:
 * - Real setConceptList quality (DeploymentTarget.All)
 * - Dummy qualities for Huirth-only qualities
 * - No principles (server-only)
 */
export const createStrativerseConceptClient = () => strativerseClientConcept;

// ============================================
// MUXONOMIC CONCEPT CREATOR (CLIENT)
// ============================================

/**
 * createMuxonomicStrativerseClient - Create MuxonomicConcept for StratiVERSE (CLIENT)
 *
 * Returns the union pairing of AnyConcept + MuxonomicConfig for use with
 * createClientMuxiumWithMuxonomy(). This enables:
 * - FilterKeys auto-extraction and aggregation
 * - Novel change detection wiring
 * - Synchronization configuration
 *
 * CLIENT-SPECIFIC:
 * - Real qualities for DeploymentTarget.All (setConceptList)
 * - INDUCTION qualities for DeploymentTarget.Huirth (scanConcepts, broadcastConceptList, generateMuxonomyRegistry)
 * - No principles (server-only)
 *
 * Induction qualities enable client to DISPATCH actions directly.
 * The Induction pattern routes actions to WebSocket actionQue,
 * where webSocketClient.principle sends them to server for execution.
 * This enables tree-shaking to exclude server-only code (fs, path) from client bundles.
 *
 * Citation: muxonomy.model.ts - MuxonomicConcept pattern, createInductionQualityCard
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 * Citation: FORWARD-PASS-MUXONOMY-ISLANDS.md - Phase 6 Muxonomic Build Separation
 */
export function createMuxonomicStrativerseClient(): MuxonomicConcept<'strativerse'> {
  return {
    concept: createStrativerseConceptClient() as AnyConcept,
    muxonomy: strativerseMuxonomic,
  };
}

// Re-export for convenience
export { strativerseName };
export type { StrativerseState, StrativerseConceptList };
