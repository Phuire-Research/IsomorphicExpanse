/**
 * StratiVERSE Type Definitions - INFORMATIVE ONLY
 *
 * All type definitions for the strativerse concept.
 * NO active code - only type exports.
 *
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2 Concept Detail Expansion
 */

import type { Concept, Quality } from 'stratimux';
import { DeploymentTarget } from '../muxonomy/muxonomy.model';
import type { SCPQualityMetadata } from '../scp/scp.types';

// Re-export for convenience
export { DeploymentTarget };
export type { SCPQualityMetadata };

// ============================================
// STATE FIELD ENTRY (Property Type as String)
// ============================================

/**
 * StateFieldEntry - State property with type as STRING
 *
 * Type is stored as string to enable:
 * - Deep inspection later (expand defined types)
 * - Crystraline Pearl compression (type string = Conceptual Set)
 * - Property collision detection across concepts
 *
 * Base types: 'string', 'number', 'boolean', 'null', 'undefined'
 * Defined types: 'Map<string, PageConfig>', 'ConceptEntry[]', etc.
 *
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2
 */
export type StateFieldEntry = {
  name: string;
  typeString: string;  // Type as STRING for deep inspection
  isBaseType: boolean; // true if string|number|boolean|null|undefined
  isArray: boolean;    // true if type ends with []
  isOptional: boolean; // true if property has ? modifier
  defaultValue?: string; // String representation of default if found
};

// ============================================
// QUALITY ENTRY (DeploymentTarget + Diameter)
// ============================================

/**
 * QualityEntry - Quality with DeploymentTarget enum + diameter boolean
 *
 * Parsed from file name convention:
 * - qualityName.quality.ts → All, diameter: false
 * - qualityName.quality.huirth.ts → Huirth, diameter: false
 * - qualityName.quality.huirth.diameter.ts → Huirth, diameter: true
 * - qualityName.quality.client.diameter.ts → Client, diameter: true
 *
 * Citation: muxonomy.model.ts - QualityDemometer pattern
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2
 */
export type QualityEntry = {
  name: string;           // Variable name (e.g., 'strativerseScanConcepts')
  typeString: string;     // Action type string (e.g., 'Strativerse Scan Concepts')
  filePath: string;       // Full path for reference
  fileName: string;       // Just the filename for display
  deploymentTarget: DeploymentTarget;  // Parsed from filename
  diameter: boolean;      // Parsed from filename (.diameter. present)
  hasPayload: boolean;    // createQualityCardWithPayload vs createQualityCard
  payloadTypeString?: string;  // Type as STRING if hasPayload
};

// ============================================
// PRINCIPLE ENTRY (DeploymentTarget only)
// ============================================

/**
 * PrincipleEntry - Principle with DeploymentTarget enum (NO diameter)
 *
 * Principles are behavioral - they DO things at startup.
 * A "dummy principle" would be meaningless.
 * Principles are simply INCLUDED or EXCLUDED, no junction concept.
 *
 * Parsed from file name convention:
 * - conceptName.principle.ts → All
 * - conceptName.principle.huirth.ts → Huirth
 * - conceptName.principle.client.ts → Client
 *
 * Citation: muxonomy.model.ts - PrincipleDemometer pattern
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2
 */
export type PrincipleEntry = {
  name: string;           // Variable name (e.g., 'strativersePrinciple')
  filePath: string;       // Full path for reference
  fileName: string;       // Just the filename for display
  deploymentTarget: DeploymentTarget;  // Parsed from filename
  // NO diameter - principles don't have junction concept
};

// ============================================
// STRATEGY ENTRY (NO deployment targeting)
// ============================================

/**
 * StrategyEntry - Strategy file reference
 *
 * Strategies do NOT have explicit deployment targeting.
 * Their deployment is DERIVED from usage via code splitting:
 * - If imported by deployed quality/principle → included in that build
 * - If not imported → excluded by tree-shaking
 *
 * Citation: muxonomy.model.ts - StrategyDemometer pattern
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2
 */
export type StrategyEntry = {
  name: string;           // Variable name (e.g., 'createStrativerseInitializationStrategy')
  filePath: string;       // Full path for reference
  fileName: string;       // Just the filename for display
  // NO deploymentTarget - derived from usage via code splitting
  // NO diameter - not applicable to strategies
};

// ============================================
// MUXONOMY CONFIG SUMMARY
// ============================================

/**
 * MuxonomyConfigSummary - Summary of muxonomy configuration
 *
 * Extracted from *.muxonomy.ts file if present.
 * Used for display in StratiVERSE UI without full config parsing.
 *
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2
 */
export type MuxonomyConfigSummary = {
  filterKeys: string[];
  syncDirection: string;  // 'toServer' | 'toClient' | 'bidirectional'
  hasNavigation: boolean;
  syncVersion: number;
  syncManaged: boolean;
  demometerCounts: {
    qualityCount: number;
    principleCount: number;
    strategyCount: number;
  };
};

// ============================================
// CONCEPT ENTRY (Extended for POC 2.2)
// ============================================

/**
 * ConceptEntry - Full concept information for StratiVERSE display
 *
 * Extended from basic {name, path, exists} to include:
 * - State fields with type strings
 * - Qualities with DeploymentTarget + diameter
 * - Principles with DeploymentTarget
 * - Strategies (no deployment targeting)
 * - Muxonomy configuration summary
 *
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2 Concept Detail Expansion
 */
export type ConceptEntry = {
  // Basic identity (POC 1)
  name: string;
  path: string;
  exists: boolean;

  // State details (POC 2.2)
  stateFields: StateFieldEntry[];
  stateTypeName: string;  // e.g., 'StrativerseState'

  // Qualities with deployment info (POC 2.2)
  qualities: QualityEntry[];

  // Principles with deployment info (POC 2.2)
  principles: PrincipleEntry[];

  // Strategies (POC 2.2)
  strategies: StrategyEntry[];

  // Muxonomy info (POC 2.2)
  hasMuxonomy: boolean;
  muxonomyConfig?: MuxonomyConfigSummary;

  // SCP Tool Metadata (POC 2.3b-SCP: StratiVERSE Quality Registration)
  // Extracted from *.muxonomy.ts scpToolMetadata[] array
  // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Means 1
  scpToolMetadata: SCPQualityMetadata[];

  // Scan metadata
  scanTimestamp: number;
};

// ============================================
// STRATIVERSE STATE TYPE
// ============================================

export type StrativerseConceptList = {
  concepts: ConceptEntry[];
  lastScan: number;
  scanPath: string;
};

// ============================================
// PROJECT ENTRY (Managed Project Tracking)
// ============================================

/**
 * ProjectEntry - Managed project information for StratiVERSE
 *
 * Tracks projects created from SCP Template via Means 10.
 * ADMIN_SCP operates EXTERNALLY on managed projects —
 * this entry reflects the operator's knowledge of each scaffold.
 *
 * Citation: BREAKOUT-POC4-PHASE3-MVP-CONCEPT-LIBRARY-MANAGEMENT.md
 */
export type ProjectEntry = {
  name: string;
  path: string;
  templateVersion: string;
  exists: boolean;
  port: number;
  concepts: string[];
  conceptEntries: ConceptEntry[];
  hasMuxonomy: boolean;
  registeredTools: string[];
  registeredNavigation: string[];
  createdAt: number;
  lastScanned: number;
  lastModified: number;
  status: 'active' | 'archived' | 'error';
  conceptSyncMetadata: Record<string, {
    lastSyncedFrom: string;
    lastSyncedAt: number;
    syncVersion: number;
  }>;
};

export type StrativerseState = {
  conceptList: StrativerseConceptList;
  managedProjects: ProjectEntry[];
  templatePath: string;
  lastProjectScan: number;
};

// ============================================
// DATA FIELD TYPES (ActionStrategy Interplay)
// ============================================

/**
 * StrategyData field type for scanConcepts → setConceptList data flow
 * Used by ActionStrategy to curry data between qualities
 */
export type StrativerseScanConceptsDataField = {
  concepts: ConceptEntry[];
  lastScan: number;
  scanPath: string;
};

// ============================================
// MUXONOMY REGISTRY TYPES
// ============================================

/**
 * Muxonomy Registry Types
 * Used by generateMuxonomyRegistry quality
 */
export type IslandEntry = {
  key: string;
  componentPath: string;
};

export type MuxonomyRegistryEntry = {
  conceptName: string;
  muxonomyPath: string;
  muxonomicConfigExport: string;
  createMuxonomicExport: string;
  hasNavigation: boolean;
  islandEntries: IslandEntry[];
};

export type MuxonomyRegistryResult = {
  entries: MuxonomyRegistryEntry[];
  generatedAt: string;
  outputPath: string;
};

// ============================================
// MUXONOMY MODIFICATION TYPES (POC 2.3b)
// ============================================

/**
 * Payload for triggering DeploymentTarget update on a quality or principle
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.3b
 */
export type TriggerUpdateTargetPayload = {
  conceptName: string;
  aspectType: 'quality' | 'principle';
  aspectName: string;
  newTarget: DeploymentTarget;
};

/**
 * Payload for triggering Diameter toggle on a quality
 * Note: Principles do NOT have diameter - they are behavioral
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.3b
 */
export type TriggerToggleDiameterPayload = {
  conceptName: string;
  qualityName: string;
  enableDiameter: boolean;
};

/**
 * Payload for triggering SyncManaged toggle on a concept
 * Phase 5E: Vue UI toggle for adding/removing concepts from Library
 * Citation: SUITE-5-6-STRATIVERSE-LANDING-PAGE-ENHANCEMENT-ROADMAP.md
 */
export type TriggerToggleSyncManagedPayload = {
  conceptName: string;
  projectName: string;
  enableSync: boolean;
};

/**
 * Result of a Muxonomy modification operation
 */
export type MuxonomyModificationResult = {
  success: boolean;
  conceptName: string;
  aspectName: string;
  oldFileName: string;
  newFileName: string;
  error?: string;
};

// ============================================
// CONCEPT NAME CONSTANT
// ============================================

export const strativerseName = 'strativerse';

// ============================================
// QUALITY TYPES (Aggregate)
// ============================================

/**
 * StrativerseQualities - Quality type mapping for deck access
 *
 * Defined here to avoid circular imports between qualities and concept.
 * Uses Quality type with appropriate state/payload types.
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export type StrativerseQualities = {
  strativerseSetConceptList: Quality<StrativerseState, Partial<StrativerseConceptList>>;
  strativerseScanConcepts: Quality<StrativerseState, { scanPath?: string }>;
  strativerseBroadcastConceptList: Quality<StrativerseState>;
  strativerseGenerateMuxonomyRegistry: Quality<StrativerseState, { scanPath?: string; outputPath?: string; dryRun?: boolean }>;
  strativerseTriggerScan: Quality<StrativerseState, { scanPath?: string }>;
  // POC 2.3b: Muxonomy Modification Qualities
  strativerseTriggerUpdateTarget: Quality<StrativerseState, TriggerUpdateTargetPayload>;
  strativerseTriggerToggleDiameter: Quality<StrativerseState, TriggerToggleDiameterPayload>;
  strativerseUpdateQualityTarget: Quality<StrativerseState, TriggerUpdateTargetPayload>;
  strativerseToggleDiameter: Quality<StrativerseState, TriggerToggleDiameterPayload>;
  strativerseRegenerateMuxonomy: Quality<StrativerseState, { conceptName: string }>;
  // POC 2.6: Demometric Interchange Build Step
  strativerseBuildClient: Quality<StrativerseState, { conceptPath?: string }>;
  // POC 2.6: Bridge Restart Manifold
  strativerseBridgeRestartToggle: Quality<StrativerseState>;
  // POC 3: Muxonomic SCP Bridge Toggle
  strativerseBridgeStateRead: Quality<StrativerseState>;
};

// ============================================
// DECK TYPES
// ============================================

/**
 * StrativerseConcept - Concept type for deck composition
 */
export type StrativerseConcept = Concept<StrativerseState, StrativerseQualities>;

/**
 * StrativerseDeck - Deck type for quality deck access
 *
 * Used by qualities that need to fire other strativerse actions
 * (e.g., scanConcepts Induction Mode fires setConceptList and broadcastConceptList)
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export type StrativerseDeck = {
  strativerse: StrativerseConcept;
};

// Legacy alias for backward compatibility
export type StrativerseModelQualities = StrativerseQualities;
export type StrativerseModelDeck = StrativerseDeck;
