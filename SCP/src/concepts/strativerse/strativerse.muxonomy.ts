/**
 * StratiVERSE Muxonomy Configuration
 *
 * This file declares StratiVERSE's participation in the Muxonomy pattern.
 * KEY: StratiVERSE declares itself as the main landing page (isMainLanding: true).
 *
 * Pattern: Concept = Nav Group
 * - Each concept with navigation config becomes a sidebar nav group
 * - The concept's main page is the group landing
 * - Subpages appear as children in the accordion
 *
 * Citation: muxonomy.model.ts - NavigationConfig, PageEntry
 */

import {
  type MuxonomicConfig,
  type NavigationConfig,
  type PageEntry,
  ChangeDetectionMode,
  DeploymentTarget,
} from '../muxonomy/muxonomy.model';
import { createStrativerseQualityRemoveStrategy } from './strategies/qualityRemove.strategy.huirth';
import { createStrativerseOneShotQualityRemoveStrategy } from './strategies/oneShotQualityRemove.strategy.huirth';
import { createStrativerseScpStrategyDeleteStrategy } from './strategies/scpStrategyDelete.strategy.huirth';
import { createStrativerseProjectCreateStrategy } from './strategies/projectCreate.strategy.huirth';
import { createStrativerseConceptCreateStrategy } from './strategies/conceptCreate.strategy.huirth';
import { createStrativerseConceptRemoveStrategy } from './strategies/conceptRemove.strategy.huirth';
import { createStrativerseConceptSynchronizeStrategy } from './strategies/conceptSynchronize.strategy.huirth';
import { createStrativerseOneShotPrincipleStrategy } from './strategies/oneShotPrinciple.strategy.huirth';
import { createStrativerseOneShotPrincipleRemoveStrategy } from './strategies/oneShotPrincipleRemove.strategy.huirth';
import type { SCPQualityMetadata } from '../scp/scp.types';
import { createStrativerseQualityCreateStrategy } from './strategies/qualityCreate.strategy.huirth';
import { createStrativerseSCPToolRegisterStrategy } from './strategies/scpToolRegister.strategy.huirth';
import { createStrativerseOneShotQualitySCPStrategy } from './strategies/oneShotQualitySCP.strategy.huirth';
import { createStrativerseStrategyCreateStrategy } from './strategies/strategyCreate.strategy.huirth';
import { createStrativerseSCPStrategyCreateStrategy } from './strategies/scpStrategyCreate.strategy.huirth';

// ============================================
// STRATIVERSE PAGES
// ============================================

/**
 * StratiVERSE Main Landing Page
 *
 * This is the site's main landing page (/).
 * Rendered via Vue SSR, component lives in strativerse/vue/Landing.ts
 */
const strativerseLandingPage: PageEntry = {
  path: '/',
  label: 'StratiVERSE',
  order: 0,
  componentPath: 'strativerse/vue/Landing',
  isMain: true,
};

/**
 * Future: StratiVERSE Concepts Browser
 * Subpage showing all scanned concepts
 */
// const strativerseConceptsPage: PageEntry = {
//   path: '/strativerse/concepts',
//   label: 'Concepts',
//   order: 1,
//   componentPath: 'strativerse/vue/Concepts',
//   isMain: false,
// };

// ============================================
// STRATIVERSE NAVIGATION CONFIG
// ============================================

/**
 * StratiVERSE Navigation Configuration
 *
 * isMainLanding: true - This concept's main page IS the site landing (/)
 * icon: ◈ - Represents the central hub
 * color: viridian - Sculptor (Suite 4) - establishes structure
 * order: 0 - First in sidebar
 */
export const strativerseNavigation: NavigationConfig = {
  // FT-004 S10 Concluder fix: strativerse is NOT in REGISTERED_MUXONOMICS — its true here
  // made the one-main-landing tree-scan read 2 after the SAMLS swap (spurious failure).
  isMainLanding: false,
  icon: '◈',
  color: 'viridian',
  label: 'StratiVERSE',
  order: 0,
  pages: [
    strativerseLandingPage,
    // strativerseConceptsPage,  // Future
  ],
};

// ============================================
// STRATIVERSE MUXONOMIC CONFIG
// ============================================

/**
 * StratiVERSE Muxonomy Configuration
 *
 * This is the core configuration that:
 * - Declares filterKeys for sync
 * - Specifies navigation (making it a sidebar nav group)
 * - Sets isMainLanding: true (claiming the / route)
 */
export const strativerseMuxonomic: MuxonomicConfig<'strativerse'> = {
  conceptName: 'strativerse',

  filterKeys: [
    'conceptList',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    // syncManaged: true,  // ADMIN_ICP-specific extension; not yet in SCP's SyncConfig.
    // Restore if/when SyncConfig gains the multi-project management field in a future
    // sub-Diamond (likely paired with managedProjects.model.ts activation in SCP).
    filterKeys: ['conceptList'],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'strativersePrincipleRemoveInfo',
        type: 'Strativerse Principle Remove Info',
        filePath: 'qualities/strativersePrincipleRemoveInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseOneShotPrincipleInfo',
        type: 'Strativerse One Shot Principle Info',
        filePath: 'qualities/strativerseOneShotPrincipleInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseDetectConceptChanges',
        type: 'Strativerse Detect Concept Changes',
        filePath: 'qualities/strativerseDetectConceptChanges.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseConceptSynchronizeInfo',
        type: 'Strativerse Concept Synchronize Info',
        filePath: 'qualities/strativerseConceptSynchronizeInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseConceptSynchronize',
        type: 'Strativerse Concept Synchronize',
        filePath: 'qualities/strativerseConceptSynchronize.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseDependencyMapInfo',
        type: 'Strativerse Dependency Map Info',
        filePath: 'qualities/strativerseDependencyMapInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseBuildDependencyMap',
        type: 'Strativerse Build Dependency Map',
        filePath: 'qualities/strativerseBuildDependencyMap.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseToggleSyncManaged',
        type: 'Strativerse Toggle Sync Managed',
        filePath: 'qualities/strativerseToggleSyncManaged.quality.huirth.diameter.ts',
        location: DeploymentTarget.Huirth,
        diameter: true,
      },
      {
        name: 'strativerseUpdateManagedProjectEntries',
        type: 'Strativerse Update Managed Project Entries',
        filePath: 'qualities/strativerseUpdateManagedProjectEntries.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseUpdateManagedProject',
        type: 'Strativerse Update Managed Project',
        filePath: 'qualities/strativerseUpdateManagedProject.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseScanManagedProjects',
        type: 'Strativerse Scan Managed Projects',
        filePath: 'qualities/strativerseScanManagedProjects.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseListManagedProjects',
        type: 'Strativerse List Managed Projects',
        filePath: 'qualities/strativerseListManagedProjects.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseSetManagedProjects',
        type: 'Strativerse Set Managed Projects',
        filePath: 'qualities/strativerseSetManagedProjects.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseWriteManagedProjectsFile',
        type: 'Strativerse Write Managed Projects File',
        filePath: 'qualities/strativerseWriteManagedProjectsFile.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseReadManagedProjectsFile',
        type: 'Strativerse Read Managed Projects File',
        filePath: 'qualities/strativerseReadManagedProjectsFile.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseConceptRemoveInfo',
        type: 'Strativerse Concept Remove Info',
        filePath: 'qualities/strativerseConceptRemoveInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseConceptCreateInfo',
        type: 'Strativerse Concept Create Info',
        filePath: 'qualities/strativerseConceptCreateInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseProjectCreateInfo',
        type: 'Strativerse Project Create Info',
        filePath: 'qualities/strativerseProjectCreateInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseUpdateManagedProject',
        type: 'Strativerse Update Managed Project',
        filePath: 'qualities/strativerseUpdateManagedProject.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseAddManagedProject',
        type: 'Strativerse Add Managed Project',
        filePath: 'qualities/strativerseAddManagedProject.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseLifecyclePatternsInfo',
        type: 'Strativerse Lifecycle Patterns Info',
        filePath: 'qualities/strativerseLifecyclePatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseStrategyDeleteInfo',
        type: 'Strativerse Strategy Delete Info',
        filePath: 'qualities/strativerseStrategyDeleteInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseSCPUnregisterInfo',
        type: 'Strativerse SCP Unregister Info',
        filePath: 'qualities/strativerseSCPUnregisterInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseOneShotRemoveInfo',
        type: 'Strativerse One Shot Remove Info',
        filePath: 'qualities/strativerseOneShotRemoveInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseQualityRemoveInfo',
        type: 'Strativerse Quality Remove Info',
        filePath: 'qualities/strativerseQualityRemoveInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseStrategyCreateInfo',
        type: 'Strativerse Strategy Create Info',
        filePath: 'qualities/strativerseStrategyCreateInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseTestingPatternsInfo',
        type: 'Strativerse Testing Patterns Info',
        filePath: 'qualities/strativerseTestingPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseMuxifiedPatternsInfo',
        type: 'Strativerse Muxified Patterns Info',
        filePath: 'qualities/strativerseMuxifiedPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseOwnershipPatternsInfo',
        type: 'Strativerse Ownership Patterns Info',
        filePath: 'qualities/strativerseOwnershipPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativersePlanningPatternsInfo',
        type: 'Strativerse Planning Patterns Info',
        filePath: 'qualities/strativersePlanningPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseStrategyPatternsInfo',
        type: 'Strativerse Strategy Patterns Info',
        filePath: 'qualities/strativerseStrategyPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseMethodPatternsInfo',
        type: 'Strativerse Method Patterns Info',
        filePath: 'qualities/strativerseMethodPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseReducerPatternsInfo',
        type: 'Strativerse Reducer Patterns Info',
        filePath: 'qualities/strativerseReducerPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseQualityPatternsInfo',
        type: 'Strativerse Quality Patterns Info',
        filePath: 'qualities/strativerseQualityPatternsInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseOneShotInfo',
        type: 'Strativerse One Shot Info',
        filePath: 'qualities/strativerseOneShotInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseSCPRegisterInfo',
        type: 'Strativerse I C P Register Info',
        filePath: 'qualities/strativerseSCPRegisterInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseQualityCreateInfo',
        type: 'Strativerse Quality Create Info',
        filePath: 'qualities/strativerseQualityCreateInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseThreeMeansInfo',
        type: 'Strativerse Three Means Info',
        filePath: 'qualities/strativerseThreeMeansInfo.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseTestQuality',
        type: 'Strativerse Test Quality',
        filePath: 'qualities/strativerseTestQuality.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseSetConceptList',
        type: 'Strativerse Set Concept List',
        filePath: 'qualities/setConceptList.quality.ts',
        location: DeploymentTarget.All,
        diameter: false,
      },
      {
        name: 'strativerseScanConcepts',
        type: 'Strativerse Scan Concepts',
        filePath: 'qualities/scanConcepts.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseBroadcastConceptList',
        type: 'Strativerse Broadcast Concept List',
        filePath: 'qualities/broadcastConceptList.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'strativerseGenerateMuxonomyRegistry',
        type: 'Strativerse Generate Muxonomy Registry',
        filePath: 'qualities/generateMuxonomyRegistry.quality.huirth.diameter.ts',
        location: DeploymentTarget.Huirth,
        diameter: true,
      },
      // POC 2.6: Bridge Restart Manifold
      {
        name: 'strativerseBridgeRestartToggle',
        type: 'Strativerse Bridge Restart Toggle',
        filePath: 'qualities/bridgeRestartToggle.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      // POC 3: Muxonomic SCP Bridge Toggle
      {
        name: 'strativerseBridgeStateRead',
        type: 'Strativerse Bridge State Read',
        filePath: 'qualities/bridgeStateRead.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [
      {
        name: 'strativerseOneShotPrincipleRemoveStrategy',
        filePath: 'strategies/oneShotPrincipleRemove.strategy.huirth.ts',
      },
      {
        name: 'strativerseOneShotPrincipleStrategy',
        filePath: 'strategies/oneShotPrinciple.strategy.huirth.ts',
      },
      {
        name: 'strativerseConceptSynchronizeStrategy',
        filePath: 'strategies/conceptSynchronize.strategy.huirth.ts',
      },
      {
        name: 'strativerseConceptRemoveStrategy',
        filePath: 'strategies/conceptRemove.strategy.huirth.ts',
      },
      {
        name: 'strativerseConceptCreateStrategy',
        filePath: 'strategies/conceptCreate.strategy.huirth.ts',
      },
      {
        name: 'strativerseProjectCreateStrategy',
        filePath: 'strategies/projectCreate.strategy.huirth.ts',
      },
      {
        name: 'strativerseScpStrategyDeleteStrategy',
        filePath: 'strategies/scpStrategyDelete.strategy.huirth.ts',
      },
      {
        name: 'strativerseOneShotQualityRemoveStrategy',
        filePath: 'strategies/oneShotQualityRemove.strategy.huirth.ts',
      },
      {
        name: 'strativerseQualityRemoveStrategy',
        filePath: 'strategies/qualityRemove.strategy.huirth.ts',
      },
      {
        name: 'strativerseInitialization',
        filePath: 'strategies/initialization.strategy.ts',
      },
      {
        name: 'strativerseGenerateRegistry',
        filePath: 'strategies/generateRegistry.strategy.ts',
      },
      // POC 2.3b Tier 2.0: Quality Creation SCP Strategy
      {
        name: 'strativerseQualityCreateStrategy',
        filePath: 'strategies/qualityCreate.strategy.huirth.ts',
      },
      // POC 2.3b Tier 2.0 Means 2: SCP Tool Registration Strategy
      {
        name: 'strativerseSCPToolRegisterStrategy',
        filePath: 'strategies/scpToolRegister.strategy.huirth.ts',
      },
      // POC 2.3b Tier 2.0 Means 3: OneShot Quality + SCP Composition Strategy
      {
        name: 'strativerseOneShotQualitySCPStrategy',
        filePath: 'strategies/oneShotQualitySCP.strategy.huirth.ts',
      },
      // SCP Management Manifold Means 7: Strategy Create
      {
        name: 'strativerseStrategyCreateStrategy',
        filePath: 'strategies/strategyCreate.strategy.huirth.ts',
      },
      // SCP Management Manifold Means 8: SCP Strategy Create
      {
        name: 'strativerseSCPStrategyCreateStrategy',
        filePath: 'strategies/scpStrategyCreate.strategy.huirth.ts',
      },
    ],
    principles: [
      {
        name: 'strativerseSyncWatcher',
        filePath: 'principles/strativerseSyncWatcher.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
      {
        name: 'strativersePrinciple',
        filePath: 'strativerse.principle.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: 'StrativerseHuirthDeck',
    client: 'StrativerseClientDeck',
  },

  navigation: strativerseNavigation,

  // ============================================
  // SCP TOOL METADATA (POC 3: Muxonomic SCP)
  // ============================================
  //
  // Self-Labeling Pattern: Concept name (strativerse) becomes the category.
  // Sub-Types: informative (read + explain) vs actionable (mutate)
  //
  // Citation: POC-3-MUXONOMIC-SCP-BRIDGE-TOGGLE-WORKGAMEBOARD.md
  // Citation: scp.types.ts - SCPQualityMetadata, SCPToolType
  //
  scpToolMetadata: [
    // SCP Strategy: strativerse_oneshot_principle_remove (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseOneShotPrincipleRemove',
      toolName: 'strativerse_oneshot_principle_remove',
      description: 'Means 12 Actionable: Remove a principle file and all hookups. Use strativerse_principle_remove_info first.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "properties": {
                              "principleName": {
                                    "type": "string",
                                    "description": "camelCase principle variable name to remove"
                              },
                              "conceptName": {
                                    "type": "string",
                                    "description": "Target concept (e.g., strativerse)"
                              },
                              "location": {
                                    "type": "string",
                                    "enum": [
                                          "huirth",
                                          "client",
                                          "all"
                                    ],
                                    "description": "Deployment target"
                              }
                        },
                        "required": [
                              "principleName",
                              "conceptName",
                              "location"
                        ]
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseOneShotPrincipleRemoveStrategy',
      strategyCreator: createStrativerseOneShotPrincipleRemoveStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_principle_remove_info
    {
      qualityName: 'strativersePrincipleRemoveInfo',
      toolName: 'strativerse_principle_remove_info',
      description: 'Means 11: Documents the specification for removing a principle. Call before strativerse_oneshot_principle_remove.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_oneshot_principle_remove'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_oneshot_principle (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseOneShotPrinciple',
      toolName: 'strativerse_oneshot_principle',
      description: 'Means 10 Actionable: Create a principle file with all hookups. Use strativerse_oneshot_principle_info first.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "properties": {
                              "principleName": {
                                    "type": "string"
                              },
                              "principleFileContent": {
                                    "type": "string"
                              },
                              "conceptName": {
                                    "type": "string"
                              },
                              "location": {
                                    "type": "string",
                                    "enum": [
                                          "huirth",
                                          "client",
                                          "all"
                                    ]
                              },
                              "description": {
                                    "type": "string"
                              }
                        },
                        "required": [
                              "principleName",
                              "principleFileContent",
                              "conceptName",
                              "location",
                              "description"
                        ]
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseOneShotPrincipleStrategy',
      strategyCreator: createStrativerseOneShotPrincipleStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_oneshot_principle_info
    {
      qualityName: 'strativerseOneShotPrincipleInfo',
      toolName: 'strativerse_oneshot_principle_info',
      description: 'Informative tool documenting Means 10: OneShot Principle Creation. Returns field definitions for principle creation specification, file hookup operations, and usage patterns. Call this before using strativerse_oneshot_principle to understand the required specification structure.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_oneshot_principle'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_detect_concept_changes
    {
      qualityName: 'strativerseDetectConceptChanges',
      toolName: 'strativerse_detect_concept_changes',
      description: 'Detect concept sync status and version conflicts across managed projects. Returns sync status for each concept including disk syncVersion, stored metadata, and any version conflicts. Optionally filter by conceptName or projectName.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "conceptName": {
                        "type": "string",
                        "description": "Optional: filter results to a specific concept name"
                  },
                  "projectName": {
                        "type": "string",
                        "description": "Optional: filter results to a specific managed project name"
                  }
            },
            "required": []
      },
      toolType: 'actionable',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_concept_synchronize', 'strativerse_toggle_sync_managed'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_concept_synchronize_info
    {
      qualityName: 'strativerseConceptSynchronizeInfo',
      toolName: 'strativerse_concept_synchronize_info',
      description: 'Returns documentation about the concept synchronization system including sync process steps, version halting mechanism, dependency validation, input parameters, and integration points with other Phase 5 components.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_concept_synchronize'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_concept_synchronize (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseConceptSynchronize',
      toolName: 'strativerse_concept_synchronize',
      description: 'Synchronize a concept from source project to target project. Validates dependencies exist in target, copies concept directory recursively, and increments syncVersion in both source and target muxonomy files to prevent retrigger loops.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "conceptName": {
                        "type": "string",
                        "description": "Name of the concept to synchronize"
                  },
                  "sourceProjectPath": {
                        "type": "string",
                        "description": "Root path of the source project"
                  },
                  "targetProjectPath": {
                        "type": "string",
                        "description": "Root path of the target project"
                  }
            },
            "required": [
                  "conceptName",
                  "sourceProjectPath",
                  "targetProjectPath"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseConceptSynchronizeStrategy',
      strategyCreator: createStrativerseConceptSynchronizeStrategy,
      relatedActionables: ['strativerse_concept_synchronize_info', 'strativerse_build_dependency_map'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_dependency_map_info
    {
      qualityName: 'strativerseDependencyMapInfo',
      toolName: 'strativerse_dependency_map_info',
      description: 'Returns documentation about the concept dependency map system including type definitions, algorithm description, integration points, and usage patterns. Paired with strativerse_build_dependency_map actionable tool.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_build_dependency_map'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_build_dependency_map
    {
      qualityName: 'strativerseBuildDependencyMap',
      toolName: 'strativerse_build_dependency_map',
      description: 'Build a concept dependency map by analyzing TypeScript imports across all concepts in a project. Returns cross-concept import relationships, shared types, and stratimux framework imports for each concept.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "projectPath": {
                        "type": "string",
                        "description": "Project root path to analyze (defaults to ADMIN_SCP)"
                  }
            },
            "required": []
      },
      toolType: 'actionable',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_dependency_map_info'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_toggle_sync_managed
    {
      qualityName: 'strativerseToggleSyncManaged',
      toolName: 'strativerse_toggle_sync_managed',
      description: 'Toggle syncManaged flag on a concept\'s muxonomy configuration. Reads the concept\'s .muxonomy.ts file, toggles the syncManaged value, and writes it back. Supports optional projectName for cross-project routing (defaults to ADMIN_SCP).',
      inputSchema: {
            "type": "object",
            "properties": {
                  "conceptName": {
                        "type": "string",
                        "description": "Name of the concept whose syncManaged flag to toggle"
                  },
                  "projectName": {
                        "type": "string",
                        "description": "Target project name. Defaults to ADMIN_SCP if not specified."
                  }
            },
            "required": [
                  "conceptName"
            ]
      },
      toolType: 'actionable',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: [],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_list_managed_projects
    {
      qualityName: 'strativerseListManagedProjects',
      toolName: 'strativerse_list_managed_projects',
      description: 'Lists all managed projects in the persistent registry with their current state, concept entries, and tool registrations',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_project_create'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_concept_remove (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseConceptRemove',
      toolName: 'strativerse_concept_remove',
      description: 'Remove a concept from a managed project: removes island registry entry, Vue navigation registration, huirth.concept.ts imports, then deletes concept directory. All operations no-op safe.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "properties": {
                              "projectPath": {
                                    "type": "string",
                                    "description": "Absolute path to target managed project"
                              },
                              "conceptName": {
                                    "type": "string",
                                    "description": "Concept name (camelCase) to remove"
                              }
                        },
                        "required": [
                              "projectPath",
                              "conceptName"
                        ]
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseConceptRemoveStrategy',
      strategyCreator: createStrativerseConceptRemoveStrategy,
      relatedActionables: ['strativerse_concept_create'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_concept_create (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseConceptCreate',
      toolName: 'strativerse_concept_create',
      description: 'Scaffold a new concept in a managed project: creates concept directory with files and Vue landing page, hooks into huirth.concept.ts, registers Vue navigation with enabled toggle',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "properties": {
                              "projectPath": {
                                    "type": "string",
                                    "description": "Absolute path to target managed project"
                              },
                              "conceptName": {
                                    "type": "string",
                                    "description": "Concept name (camelCase)"
                              },
                              "stateName": {
                                    "type": "string",
                                    "description": "State type name (PascalCase)"
                              },
                              "location": {
                                    "type": "string",
                                    "enum": [
                                          "huirth",
                                          "client",
                                          "all"
                                    ]
                              },
                              "stateFields": {
                                    "type": "array",
                                    "items": {
                                          "type": "object",
                                          "properties": {
                                                "name": {
                                                      "type": "string"
                                                },
                                                "type": {
                                                      "type": "string"
                                                },
                                                "defaultValue": {
                                                      "type": "string"
                                                }
                                          },
                                          "required": [
                                                "name",
                                                "type",
                                                "defaultValue"
                                          ]
                                    }
                              },
                              "landingPageEnabled": {
                                    "type": "boolean",
                                    "description": "Whether landing page is enabled in navigation (default: false)"
                              },
                              "navigationConfig": {
                                    "type": "object",
                                    "properties": {
                                          "label": {
                                                "type": "string"
                                          },
                                          "icon": {
                                                "type": "string"
                                          },
                                          "color": {
                                                "type": "string"
                                          },
                                          "order": {
                                                "type": "number"
                                          }
                                    }
                              }
                        },
                        "required": [
                              "projectPath",
                              "conceptName",
                              "stateName",
                              "location",
                              "stateFields"
                        ]
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseConceptCreateStrategy',
      strategyCreator: createStrativerseConceptCreateStrategy,
      relatedActionables: ['strativerse_concept_remove'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_project_create (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseProjectCreate',
      toolName: 'strativerse_project_create',
      description: 'Create a new project from SCP Template. Copies template directory, removes node_modules/dist/.git/package-lock.json, updates package.json name, index.ts port and muxium name, then adds ProjectEntry to ADMIN_SCP managed projects state.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "description": "ProjectCreateSpecification for the new project",
                        "properties": {
                              "projectName": {
                                    "type": "string",
                                    "description": "Project name (used in package.json and muxium title)"
                              },
                              "targetPath": {
                                    "type": "string",
                                    "description": "Absolute filesystem path for the new project directory"
                              },
                              "port": {
                                    "type": "number",
                                    "description": "Express server port for the new project"
                              },
                              "templatePath": {
                                    "type": "string",
                                    "description": "Optional: absolute path to SCP Template. Defaults to sibling SCP directory."
                              }
                        },
                        "required": [
                              "projectName",
                              "targetPath",
                              "port"
                        ]
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseProjectCreateStrategy',
      strategyCreator: createStrativerseProjectCreateStrategy,
      relatedActionables: ['strativerse_project_create_info'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_concept_remove_info
    {
      qualityName: 'strativerseConceptRemoveInfo',
      toolName: 'strativerse_concept_remove_info',
      description: 'Returns field definitions, removal impact analysis, and guidance for strativerse_concept_remove (Means 12: Concept Remove from managed project)',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_concept_remove'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_concept_create_info
    {
      qualityName: 'strativerseConceptCreateInfo',
      toolName: 'strativerse_concept_create_info',
      description: 'Returns field definitions, concept scaffold template, and existing concept list guidance for strativerse_concept_create (Means 11: Concept Create in managed project)',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_concept_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_project_create_info
    {
      qualityName: 'strativerseProjectCreateInfo',
      toolName: 'strativerse_project_create_info',
      description: 'Returns field definitions, template path guidance, and port allocation guidance for strativerse_project_create (Means 10: Project Create from SCP Template)',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_project_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_lifecycle_patterns_info
    {
      qualityName: 'strativerseLifecyclePatternsInfo',
      toolName: 'strativerse_lifecycle_patterns_info',
      description: 'Returns complete SCP Management Manifold documentation: all 9 means with decision matrix, bidirectional creation/removal parity, bootstrap sequence, and tool selection guidance for quality and strategy lifecycle management.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create', 'strativerse_scp_tool_register', 'strativerse_oneshot_quality_scp', 'strativerse_quality_remove', 'strativerse_oneshot_quality_remove', 'strativerse_strategy_create', 'strativerse_scp_strategy_create', 'strativerse_scp_strategy_delete'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_strategy_delete_info
    {
      qualityName: 'strativerseStrategyDeleteInfo',
      toolName: 'strativerse_strategy_delete_info',
      description: 'Returns SCPStrategyDeletionSpecification documentation: field definitions, 5-node removal chain (reverse of Means 8), no-op safe patterns, and related tools. Paired informative for strativerse_scp_strategy_delete.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_scp_strategy_delete'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_scp_strategy_delete (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseScpStrategyDelete',
      toolName: 'strativerse_scp_strategy_delete',
      description: 'Delete an SCP strategy: removes scpToolMetadata, strategyCreator import, demometer entry, index export, and strategy file (reverse of strativerse_scp_strategy_create)',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "properties": {
                              "strategyName": {
                                    "type": "string",
                                    "description": "camelCase strategy name to delete"
                              },
                              "conceptName": {
                                    "type": "string",
                                    "description": "Concept the strategy belongs to"
                              },
                              "location": {
                                    "type": "string",
                                    "enum": [
                                          "huirth",
                                          "client",
                                          "all"
                                    ],
                                    "description": "Strategy location suffix"
                              },
                              "toolName": {
                                    "type": "string",
                                    "description": "SCP tool name to unregister"
                              }
                        },
                        "required": [
                              "strategyName",
                              "conceptName",
                              "location",
                              "toolName"
                        ]
                  },
                  "projectName": {
                        "type": "string",
                        "description": "Managed project name for routing. If omitted, operates on ADMIN_SCP."
                  },
                  "projectPath": {
                        "type": "string",
                        "description": "Direct project path. Alternative to projectName lookup."
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseScpStrategyDeleteStrategy',
      strategyCreator: createStrativerseScpStrategyDeleteStrategy,
      relatedActionables: ['strativerse_scp_strategy_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_scp_unregister_info
    {
      qualityName: 'strativerseSCPUnregisterInfo',
      toolName: 'strativerse_scp_unregister_info',
      description: 'Documentation for Means 5 (SCP Unregister inline): regex pattern, no-op safe mechanism, invocation contexts in Means 4 and Means 6',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_remove', 'strativerse_oneshot_quality_remove'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_oneshot_remove_info
    {
      qualityName: 'strativerseOneShotRemoveInfo',
      toolName: 'strativerse_oneshot_remove_info',
      description: 'Documentation for strativerse_oneshot_quality_remove (Means 6): unified removal spec mirroring Means 3, 9-node chain, bidirectional parity',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_oneshot_quality_remove'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_quality_remove_info
    {
      qualityName: 'strativerseQualityRemoveInfo',
      toolName: 'strativerse_quality_remove_info',
      description: 'Documentation for strativerse_quality_remove (Means 4): specification, 9-node removal chain, no-op safe SCP pattern, regex patterns',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_remove'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_oneshot_quality_remove (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseOneShotQualityRemove',
      toolName: 'strativerse_oneshot_quality_remove',
      description: 'Remove a quality AND its SCP registration in one operation. Reverse of strativerse_oneshot_quality_scp (Means 3). Accepts quality + SCP spec mirroring Means 3 input structure.',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "description": "OneShotRemovalSpecification with quality and SCP fields",
                        "properties": {
                              "quality": {
                                    "type": "object",
                                    "description": "Quality identity for removal",
                                    "properties": {
                                          "qualityName": {
                                                "type": "string",
                                                "description": "camelCase quality name to remove"
                                          },
                                          "conceptName": {
                                                "type": "string",
                                                "description": "Target concept name"
                                          },
                                          "location": {
                                                "type": "string",
                                                "enum": [
                                                      "huirth",
                                                      "client",
                                                      "all"
                                                ]
                                          },
                                          "diameter": {
                                                "type": "boolean",
                                                "description": "Whether this is a diameter quality"
                                          }
                                    },
                                    "required": [
                                          "qualityName",
                                          "conceptName",
                                          "location",
                                          "diameter"
                                    ]
                              },
                              "scp": {
                                    "type": "object",
                                    "description": "SCP tool identity for removal",
                                    "properties": {
                                          "toolName": {
                                                "type": "string",
                                                "description": "SCP tool name to remove (e.g. strativerse_my_tool)"
                                          }
                                    },
                                    "required": [
                                          "toolName"
                                    ]
                              }
                        },
                        "required": [
                              "quality",
                              "scp"
                        ]
                  },
                  "projectName": {
                        "type": "string",
                        "description": "Managed project name for routing. If omitted, operates on ADMIN_SCP."
                  },
                  "projectPath": {
                        "type": "string",
                        "description": "Direct project path. Alternative to projectName lookup."
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseOneShotQualityRemoveStrategy',
      strategyCreator: createStrativerseOneShotQualityRemoveStrategy,
      relatedActionables: ['strativerse_quality_remove'],
    } as SCPQualityMetadata,
    // SCP Strategy: strativerse_quality_remove (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: 'strativerseQualityRemove',
      toolName: 'strativerse_quality_remove',
      description: 'Remove a Stratimux quality with all file modifications reversed. Deletes quality file, removes type definitions, exports, demometer entry, and concept references. Reverse of Means 1. Includes inline SCP unregister (Means 5).',
      inputSchema: {
            "type": "object",
            "properties": {
                  "specification": {
                        "type": "object",
                        "description": "QualityRemovalSpecification for the quality to remove",
                        "properties": {
                              "qualityName": {
                                    "type": "string",
                                    "description": "camelCase quality name to remove"
                              },
                              "conceptName": {
                                    "type": "string",
                                    "description": "Target concept name"
                              },
                              "location": {
                                    "type": "string",
                                    "enum": [
                                          "huirth",
                                          "client",
                                          "all"
                                    ]
                              },
                              "diameter": {
                                    "type": "boolean",
                                    "description": "Whether this is a diameter quality"
                              }
                        },
                        "required": [
                              "qualityName",
                              "conceptName",
                              "location",
                              "diameter"
                        ]
                  },
                  "projectName": {
                        "type": "string",
                        "description": "Managed project name for routing. If omitted, operates on ADMIN_SCP."
                  },
                  "projectPath": {
                        "type": "string",
                        "description": "Direct project path. Alternative to projectName lookup."
                  }
            },
            "required": [
                  "specification"
            ]
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseQualityRemoveStrategy',
      strategyCreator: createStrativerseQualityRemoveStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_strategy_create_info
    {
      qualityName: 'strativerseStrategyCreateInfo',
      toolName: 'strativerse_strategy_create_info',
      description: 'Returns StrategyCreationSpecification documentation with field definitions, node chain patterns, and related tools for Means 7 (strativerse_strategy_create)',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: 'undefined',
      relatedActionables: ['strativerse_strategy_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_testing_patterns_info
    {
      qualityName: 'strativerseTestingPatternsInfo',
      toolName: 'strativerse_testing_patterns_info',
      description: 'Get Stratimux testing patterns - done() callback, stage separation (dispatch N validate N+1), 100ms reactive timing, DECK K access, anti-patterns, checklist.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_muxified_patterns_info
    {
      qualityName: 'strativerseMuxifiedPatternsInfo',
      toolName: 'strativerse_muxified_patterns_info',
      description: 'Get muxified concept access patterns - base vs muxified, ECK Tier 2 limit, TypeScript limitations, access patterns, flatten composition.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_ownership_patterns_info
    {
      qualityName: 'strativerseOwnershipPatternsInfo',
      toolName: 'strativerse_ownership_patterns_info',
      description: 'Get ownership coordination patterns - bi-directional blocking, KeyedSelector attachment, stageO pattern, strategy cascading, off-premise actions.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_planning_patterns_info
    {
      qualityName: 'strativersePlanningPatternsInfo',
      toolName: 'strativerse_planning_patterns_info',
      description: 'Get planning scope patterns - outer vs principle context, single dispatch rule, stage options (iterateStage/setStage/throttle), selector-driven stages.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_strategy_patterns_info
    {
      qualityName: 'strativerseStrategyPatternsInfo',
      toolName: 'strativerse_strategy_patterns_info',
      description: 'Get ActionStrategy architecture - createStrategy, nodes (success/failure/decision), selectStratiDECK guard, strategyData patterns, temporal expansion with muxiumTimeOut.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_method_patterns_info
    {
      qualityName: 'strativerseMethodPatternsInfo',
      toolName: 'strativerse_method_patterns_info',
      description: 'Get method creator patterns - DECK K (k__.select() for selective, deck.k.getState() for total), muxiumTimeOut for deferred actions, strategy integration, async methods.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_reducer_patterns_info
    {
      qualityName: 'strativerseReducerPatternsInfo',
      toolName: 'strativerse_reducer_patterns_info',
      description: 'Get Shortest Path Principle for reducers - partial state returns only. Includes decision matrix, complex update patterns (arrays, nested objects), anti-patterns.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_quality_patterns_info
    {
      qualityName: 'strativerseQualityPatternsInfo',
      toolName: 'strativerse_quality_patterns_info',
      description: 'Get 6 quality patterns with working code - Simple, Payload, Informative, Strategy-Enabled, Async, Deferred.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_oneshot_info
    {
      qualityName: 'strativerseOneShotInfo',
      toolName: 'strativerse_oneshot_info',
      description: 'Get Means 3 OneShot documentation - combined quality+SCP template, when-to-use guidance. Related: strativerse_quality_create_info, strativerse_scp_register_info',
      inputSchema: {
            "type": "object",
            "properties": {
                  "section": {
                        "type": "string",
                        "description": "Specific section: fields | template | when_to_use | related_tools"
                  }
            },
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_oneshot_quality_scp'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_scp_register_info
    {
      qualityName: 'strativerseSCPRegisterInfo',
      toolName: 'strativerse_scp_register_info',
      description: 'Get Means 2 SCP Tool Registration documentation - field definitions, enhanceable template, handler type matrix. Related: strativerse_quality_create_info, strativerse_oneshot_info',
      inputSchema: {
            "type": "object",
            "properties": {
                  "section": {
                        "type": "string",
                        "description": "Specific section: fields | template | handler_matrix | related_tools"
                  }
            },
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_scp_tool_register'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_quality_create_info
    {
      qualityName: 'strativerseQualityCreateInfo',
      toolName: 'strativerse_quality_create_info',
      description: 'Get Means 1 Quality Creation documentation - field definitions, enhanceable template, method/reducer patterns. Related: strativerse_quality_patterns_info, strativerse_reducer_patterns_info, strativerse_method_patterns_info',
      inputSchema: {
            "type": "object",
            "properties": {
                  "section": {
                        "type": "string",
                        "description": "Specific section: fields | template | method_pattern | reducer_pattern | related_tools"
                  }
            },
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_three_means_info
    {
      qualityName: 'strativerseThreeMeansInfo',
      toolName: 'strativerse_three_means_info',
      description: 'Get Three Means SCP Tool Automation documentation - Quality Create, SCP Register, OneShot',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_quality_create', 'strativerse_scp_tool_register', 'strativerse_oneshot_quality_scp'],
    } as SCPQualityMetadata,
    // SCP Tool: strativerse_test_hello_world
    {
      qualityName: 'strativerseTestQuality',
      toolName: 'strativerse_test_hello_world',
      description: 'Hello World test tool - Returns greeting and verification data from Three Means testing.',
      inputSchema: {
            "type": "object",
            "properties": {},
            "required": []
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: [],
    } as SCPQualityMetadata,
    // INFORMATIVE: Reads bridge state AND explains the toggle actionable
    {
      qualityName: 'strativerseBridgeStateRead',
      toolName: 'strativerse_bridge_state',
      description: 'Read current bridge restart state. Returns the current toggle value (0 or 1) ' +
        'and explains how to use the strativerse_bridge_toggle actionable tool.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      toolType: 'informative',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: ['strativerse_bridge_toggle'],
    } as SCPQualityMetadata,

    // ACTIONABLE: Toggles bridge restart file
    {
      qualityName: 'strativerseBridgeRestartToggle',
      toolName: 'strativerse_bridge_toggle',
      description: 'Toggle the bridge restart file (.bridge-restart.json). ' +
        'Flips the value (0→1 or 1→0), causing nodemon to restart the server. ' +
        'Client auto-refreshes on connection loss.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      toolType: 'actionable',
      handlerType: 'quality',
      strategyName: '',
      relatedActionables: [],
    } as SCPQualityMetadata,

    // ACTIONABLE: Quality Creation (Strategy-Based SCP Tool)
    // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 2.0
    // Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md
    {
      qualityName: 'strativerseQualityCreate',
      toolName: 'strativerse_quality_create',
      description: 'Create a new Stratimux quality with all required file modifications. ' +
        'Creates quality file, inserts type definitions, updates index exports, ' +
        'adds demometer entry to muxonomy, and updates concept file. ' +
        'Requires a complete QualityCreationSpecification object.',
      inputSchema: {
        type: 'object',
        properties: {
          specification: {
            type: 'object',
            description: 'Complete QualityCreationSpecification for the new quality',
            properties: {
              qualityName: { type: 'string', description: 'camelCase quality name (e.g., myNewAction)' },
              typeString: { type: 'string', description: 'Verbose Split type string (e.g., My New Action)' },
              conceptName: { type: 'string', description: 'Target concept name (e.g., strativerse)' },
              location: { type: 'string', enum: ['huirth', 'client', 'all'], description: 'Deployment target' },
              diameter: { type: 'boolean', description: 'Whether this is a diameter quality' },
              qualityFileContent: { type: 'string', description: 'Complete TypeScript quality file as code block. When provided, bypasses template generation and writes file directly. Enables AI to generate complete quality files using informative patterns.' },
              hasPayload: { type: 'boolean', description: 'Whether quality has payload parameters' },
              payloadTypeName: { type: 'string', description: 'Payload type name if hasPayload (e.g., MyActionPayload)' },
              payloadFields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    documentation: { type: 'string' },
                    required: { type: 'boolean' },
                  },
                },
                description: 'Payload field definitions if hasPayload',
              },
              reducerModifies: { type: 'array', items: { type: 'string' }, description: 'State properties modified by reducer' },
              reducerLogic: { type: 'string', description: 'Description of reducer logic' },
              methodType: { type: 'string', enum: ['simple', 'withConcepts', 'none'], description: 'Method creator type' },
              usesStrategy: { type: 'boolean', description: 'Whether method uses ActionStrategy' },
              methodLogic: { type: 'string', description: 'Description of method logic' },
              description: { type: 'string', description: 'Quality description for documentation' },
              citations: { type: 'array', items: { type: 'string' }, description: 'Reference document citations' },
            },
            required: ['qualityName', 'typeString', 'conceptName', 'location', 'diameter', 'hasPayload', 'methodType', 'description'],
          },
          projectName: { type: 'string', description: 'Managed project name for routing. If omitted, operates on ADMIN_SCP.' },
          projectPath: { type: 'string', description: 'Direct project path. Alternative to projectName lookup.' },
        },
        required: ['specification'],
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseQualityCreateStrategy',
      strategyCreator: createStrativerseQualityCreateStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,

    // ACTIONABLE: SCP Tool Registration (Strategy-Based - Means 2)
    // Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
    {
      qualityName: 'strativerseSCPToolRegister',
      toolName: 'strativerse_scp_tool_register',
      description: 'Register a quality as an SCP tool in a concept muxonomy. ' +
        'Adds scpToolMetadata entry and strategyCreator import (if strategy-based). ' +
        'Requires a complete SCPToolRegistrationSpecification object.',
      inputSchema: {
        type: 'object',
        properties: {
          specification: {
            type: 'object',
            description: 'Complete SCPToolRegistrationSpecification for the tool',
            properties: {
              qualityName: { type: 'string', description: 'camelCase quality name to register' },
              toolName: { type: 'string', description: 'snake_case MCP tool name (e.g., concept_my_tool)' },
              conceptName: { type: 'string', description: 'Target concept name for muxonomy modification' },
              description: { type: 'string', description: 'Tool description for AI clients' },
              inputSchema: { type: 'object', description: 'JSON Schema for tool input parameters' },
              toolType: { type: 'string', enum: ['informative', 'actionable'], description: 'Tool sub-type' },
              handlerType: { type: 'string', enum: ['quality', 'strategy'], description: 'Handler type' },
              strategyName: { type: 'string', description: 'Strategy name if handlerType === strategy' },
              strategyFilePath: { type: 'string', description: 'Strategy file path for import (strategy-based only)' },
              strategyCreatorName: { type: 'string', description: 'Strategy creator function name (strategy-based only)' },
              relatedActionables: { type: 'array', items: { type: 'string' }, description: 'Related actionable tools (for informative)' },
            },
            required: ['qualityName', 'toolName', 'conceptName', 'description', 'inputSchema', 'toolType', 'handlerType', 'strategyName', 'relatedActionables'],
          },
          projectName: { type: 'string', description: 'Managed project name for routing. If omitted, operates on ADMIN_SCP.' },
          projectPath: { type: 'string', description: 'Direct project path. Alternative to projectName lookup.' },
        },
        required: ['specification'],
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseSCPToolRegisterStrategy',
      strategyCreator: createStrativerseSCPToolRegisterStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,

    // ACTIONABLE: OneShot Quality + SCP Registration (Strategy-Based - Means 3)
    // Higher-Order Functional Composition: Composes Means 1 + Means 2
    // Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
    {
      qualityName: 'strativerseOneShotQualitySCP',
      toolName: 'strativerse_oneshot_quality_scp',
      description: 'Create a quality AND register it as an SCP tool in one operation. ' +
        'Composes Means 1 (Quality Creation) + Means 2 (SCP Registration) via strategySequence. ' +
        'Requires OneShotQualitySCPSpecification with quality and scp sub-objects.',
      inputSchema: {
        type: 'object',
        properties: {
          specification: {
            type: 'object',
            description: 'OneShotQualitySCPSpecification combining quality and scp specs',
            properties: {
              quality: {
                type: 'object',
                description: 'QualityCreationSpecification (see strativerse_quality_create). Supports qualityFileContent field for complete TypeScript file as code block.',
              },
              scp: {
                type: 'object',
                description: 'SCPToolRegistrationSpecification without qualityName/conceptName (derived from quality)',
                properties: {
                  toolName: { type: 'string', description: 'snake_case MCP tool name' },
                  description: { type: 'string', description: 'Tool description for AI clients' },
                  inputSchema: { type: 'object', description: 'JSON Schema for tool input parameters' },
                  toolType: { type: 'string', enum: ['informative', 'actionable'] },
                  handlerType: { type: 'string', enum: ['quality', 'strategy'] },
                  strategyName: { type: 'string', description: 'Strategy name if strategy-based' },
                  strategyFilePath: { type: 'string', description: 'Strategy file path for import' },
                  strategyCreatorName: { type: 'string', description: 'Strategy creator function name' },
                  relatedActionables: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            required: ['quality', 'scp'],
          },
          projectName: { type: 'string', description: 'Managed project name for routing. If omitted, operates on ADMIN_SCP.' },
          projectPath: { type: 'string', description: 'Direct project path. Alternative to projectName lookup.' },
        },
        required: ['specification'],
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseOneShotQualitySCPStrategy',
      strategyCreator: createStrativerseOneShotQualitySCPStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,

    // ACTIONABLE: Strategy Creation (Strategy-Based - Means 7)
    // SCP Management Manifold: Creates strategy files for concept
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 1.1
    {
      qualityName: 'strativerseStrategyCreate',
      toolName: 'strativerse_strategy_create',
      description: 'Create a new Stratimux strategy file with all required file modifications. ' +
        'Creates strategy file in strategies/ directory and adds demometer entry to muxonomy. ' +
        'Use strategyFileContent field for complete file as code block (like qualityFileContent).',
      inputSchema: {
        type: 'object',
        properties: {
          specification: {
            type: 'object',
            description: 'Complete StrategyCreationSpecification for the new strategy',
            properties: {
              strategyName: { type: 'string', description: 'camelCase strategy name (e.g., myNewStrategy)' },
              conceptName: { type: 'string', description: 'Target concept name (e.g., strativerse)' },
              location: { type: 'string', enum: ['huirth', 'client', 'all'], description: 'Deployment target' },
              topic: { type: 'string', description: 'Strategy topic for ActionStrategy' },
              description: { type: 'string', description: 'Strategy description for documentation' },
              citations: { type: 'array', items: { type: 'string' }, description: 'Reference document citations' },
              strategyFileContent: {
                type: 'string',
                description: 'Complete TypeScript strategy file as code block. When provided, bypasses template generation and writes file directly.',
              },
              deckRequirements: { type: 'array', items: { type: 'string' }, description: 'Required deck names (template mode only)' },
              inputSpecType: { type: 'string', description: 'Input specification type name (template mode only)' },
              nodeCount: { type: 'number', description: 'Number of nodes in strategy (template mode only)' },
            },
            required: ['strategyName', 'conceptName', 'location', 'topic', 'description'],
          },
          projectName: { type: 'string', description: 'Managed project name for routing. If omitted, operates on ADMIN_SCP.' },
          projectPath: { type: 'string', description: 'Direct project path. Alternative to projectName lookup.' },
        },
        required: ['specification'],
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseStrategyCreateStrategy',
      strategyCreator: createStrativerseStrategyCreateStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,

    // ACTIONABLE: SCP Strategy Creation (Strategy-Based - Means 8)
    // Composition: Means 7 (Strategy Create) + Means 2 (SCP Register)
    // CRITICAL: Ensures SCPStrategyCreator params align with inputSchema
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 1.2
    {
      qualityName: 'strativerseSCPStrategyCreate',
      toolName: 'strativerse_scp_strategy_create',
      description: 'Create a new Stratimux strategy file AND register it as an SCP tool. ' +
        'Composes Means 7 (Strategy Create) + Means 2 (SCP Register). ' +
        'Use strategyFileContent field for complete file as code block. ' +
        'CRITICAL: Ensures strategyCreator params align with inputSchema for type safety.',
      inputSchema: {
        type: 'object',
        properties: {
          specification: {
            type: 'object',
            description: 'SCPStrategyCreationSpecification combining strategy and scp specs',
            properties: {
              strategy: {
                type: 'object',
                description: 'Strategy creation specification (see strativerse_strategy_create)',
                properties: {
                  strategyName: { type: 'string', description: 'camelCase strategy name' },
                  conceptName: { type: 'string', description: 'Target concept name' },
                  location: { type: 'string', enum: ['huirth', 'client', 'all'] },
                  topic: { type: 'string', description: 'Strategy topic' },
                  description: { type: 'string', description: 'Strategy description' },
                  citations: { type: 'array', items: { type: 'string' } },
                  strategyFileContent: { type: 'string', description: 'Complete TypeScript file as code block' },
                },
                required: ['strategyName', 'conceptName', 'location', 'topic', 'description'],
              },
              scp: {
                type: 'object',
                description: 'SCP tool registration specification',
                properties: {
                  toolName: { type: 'string', description: 'snake_case MCP tool name' },
                  description: { type: 'string', description: 'Tool description for AI clients' },
                  inputSchema: { type: 'object', description: 'JSON Schema for tool input parameters' },
                  toolType: { type: 'string', enum: ['informative', 'actionable'] },
                  relatedActionables: { type: 'array', items: { type: 'string' } },
                },
                required: ['toolName', 'description', 'inputSchema', 'toolType'],
              },
              paramsTypeName: { type: 'string', description: 'TypeScript type name for params (documentation)' },
            },
            required: ['strategy', 'scp'],
          },
          projectName: { type: 'string', description: 'Managed project name for routing. If omitted, operates on ADMIN_SCP.' },
          projectPath: { type: 'string', description: 'Direct project path. Alternative to projectName lookup.' },
        },
        required: ['specification'],
      },
      toolType: 'actionable',
      handlerType: 'strategy',
      strategyName: 'strativerseSCPStrategyCreateStrategy',
      strategyCreator: createStrativerseSCPStrategyCreateStrategy,
      relatedActionables: [],
    } as SCPQualityMetadata,
  ],
};

// ============================================
// MUXONOMIC CONCEPT CREATORS
// ============================================
//
// Creator functions are defined in their respective concept files:
// - strativerse.concept.ts → createMuxonomicStrativerse() (SERVER)
// - strativerse.concept.client.ts → createMuxonomicStrativerseClient() (CLIENT)
//
// This separation ensures tree-shaking excludes server code from client bundles.
// The muxonomy configuration (strativerseMuxonomic) is imported by both.
