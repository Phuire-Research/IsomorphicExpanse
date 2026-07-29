/**
 * Muxonomy Model
 *
 * Central type definitions and enums for the Muxonomy pattern.
 * This concept contains ONLY the model file - no qualities, principles, or concept.ts.
 *
 * Purpose: Ensure alignment across all concept muxonomy implementations.
 *
 * The Uniform Three-File Pattern:
 * - conceptName.concept.ts        = BASE (changes CASCADE across projects)
 * - conceptName.individualized.ts = INDIVIDUALIZED: Returns MuxonomicConcept (do NOT cascade)
 * - conceptName.muxonomy.ts       = Composition creator (composes Base + Individualized)
 *
 * CRITICAL SCAFFOLDING PATTERN:
 * The .individualized.ts file returns a MuxonomicConcept, NOT raw concept parts.
 * This enforces awareness: when adding properties, you MUST consider:
 * - Can this property be dehydrated (serialized for WebSocket)?
 * - Should this property be part of the sync process?
 * - If NO to either: add to filterKeys
 *
 * MuxonomicConcept: Union Pairing of Concept + Muxonomy
 * - FilterKeys: Single point of configuration for synchronization limits
 * - Novel Change Detection: Awareness of what properties trigger updates
 * - Muxium Creators (Client/Huirth) auto-wire these at utilization time
 */

import {
  createQualityCard,
  createQualityCardWithPayload,
  strategyDetermine,
  type Concept,
  type KeyedSelector,
  type AnyConcept,
  type AnyAction,
} from 'stratimux';

import type { SCPQualityMetadata } from '../scp/scp.types';

// ============================================
// TIER ACCESS (Reserved for Future Enhancement)
// ============================================

export enum TierAccess {
  Public = 'public',
  Authenticated = 'authenticated',
  Premium = 'premium',
  Admin = 'admin',
}

// ============================================
// DEPLOYMENT TARGET (Quality/Principle Targeting)
// ============================================

/**
 * DeploymentTarget: Where a Quality or Principle runs
 *
 * Used to determine what code ships to which compilation target:
 * - All: Runs on BOTH Huirth (server) and Client
 * - Huirth: Server-only (NEVER ships to client bundle)
 * - Client: Client-only (isolated in client pages)
 *
 * When DeploymentTarget is Huirth or Client (not All):
 * - Full implementation exists on the target side
 * - Dummy implementation exists on the opposite side
 * - Dummy throws error if engaged (error boundary)
 * - Deck types remain consistent (same quality names)
 *
 * Citation: SUITE-1-5-DEPLOYMENT-TARGET-PIVOT-CASCADE.md
 */
export enum DeploymentTarget {
  All = 'all',
  Huirth = 'huirth',
  Client = 'client',
}

// ============================================
// FILE PATTERN ENUMS
// ============================================

export enum ConceptFileType {
  Base = 'concept',
  Individualized = 'individualized',
  Muxonomy = 'muxonomy',
}

export enum CascadeBehavior {
  Cascades = 'cascades',
  DoesNotCascade = 'does_not_cascade',
}

export const FILE_CASCADE_MAP: Record<ConceptFileType, CascadeBehavior> = {
  [ConceptFileType.Base]: CascadeBehavior.Cascades,
  [ConceptFileType.Individualized]: CascadeBehavior.DoesNotCascade,
  [ConceptFileType.Muxonomy]: CascadeBehavior.DoesNotCascade,
};

// ============================================
// CONCEPT ROLE ENUMS
// ============================================

export enum ConceptRole {
  BaseServer = 'baseServer',
  InformantClient = 'informantClient',
  Bidirectional = 'bidirectional',
}

export enum MuxiumCapability {
  Standard = 'standard',
  MuxiumCreator = 'muxiumCreator',
}

// ============================================
// MUXONOMY METADATA TYPES
// ============================================

export type ConceptInstance = {
  projectPath: string;
  conceptPath: string;
  role: ConceptRole;
};

// ============================================
// DEMOMETER TYPES (File-Name-Driven Deployment)
// ============================================

/**
 * FILE NAMING CONVENTION FOR DEPLOYMENT TARGETING
 *
 * Pattern: conceptName.part.location.diameter.ts
 *
 * - location: 'huirth' | 'client' | omitted (= 'all')
 * - diameter: presence = true, absence = false
 *
 * Examples:
 *   setConceptList.quality.ts                  → All, diameter: false
 *   scanConcepts.quality.huirth.ts             → Huirth, diameter: false (isolated)
 *   scanConcepts.quality.huirth.diameter.ts    → Huirth, diameter: true (junction)
 *   hydrate.quality.client.diameter.ts         → Client, diameter: true (junction)
 *   scanPrinciple.principle.huirth.ts          → Huirth (principles have no diameter)
 *
 * Workflow:
 * 1. StratiVERSE scans concept directories
 * 2. Parses file names → extracts location, diameter
 * 3. Registers to Muxonomy automatically
 * 4. UI allows override (rename via StratiVERSE interface)
 * 5. AI generation sets naming based on context
 *
 * Citation: SUITE-1-5-DEPLOYMENT-TARGET-PIVOT-CASCADE.md
 */

/**
 * QualityDemometer: Measurement unit for a quality
 *
 * Deployment is PARSED from file name, not manually configured.
 *
 * Diameter (Qualities Only):
 * - diameter: true → Quality is a "junction" between Huirth/Client
 *   - Full implementation on target side
 *   - Dummy implementation on opposite side (maintains Deck consistency)
 * - diameter: false → Quality is completely isolated
 *   - Full implementation on target side
 *   - NOT present on opposite side (no Deck entry)
 */
export type QualityDemometer = {
  name: string;
  type: string; // Action type string (verbose split naming)
  filePath: string; // Path for StratiVERSE reference
  location: DeploymentTarget; // Parsed from file name
  diameter: boolean; // Parsed from file name (presence = true)
};

/**
 * StrategyDemometer: Measurement unit for a strategy
 *
 * Strategies do NOT have explicit deployment targeting.
 * Their deployment is DERIVED from usage via code splitting:
 * - If imported by deployed quality/principle → included in that build
 * - If not imported → excluded by tree-shaking
 *
 * We only track name and path for StratiVERSE indexing.
 */
export type StrategyDemometer = {
  name: string;
  filePath: string; // Path for StratiVERSE reference
  // NO location - derived from usage via code splitting
  // NO diameter - not applicable to strategies
};

/**
 * PrincipleDemometer: Measurement unit for a principle
 *
 * Principles have deployment targeting but NO diameter:
 * - Principles are behavioral (they DO things at startup)
 * - A "dummy principle" would be meaningless
 * - Principles are simply INCLUDED or EXCLUDED, no junction concept
 *
 * File naming: conceptName.principle.location.ts (no diameter option)
 */
export type PrincipleDemometer = {
  name: string;
  filePath: string; // Path for StratiVERSE reference
  location: DeploymentTarget; // Parsed from file name
  // NO diameter - principles are included or excluded, never dummied
};

/**
 * ConceptDemometers: All demometer groupings for a concept
 *
 * Populated by StratiVERSE scan of concept directory.
 * File names determine deployment targeting automatically.
 */
export type ConceptDemometers = {
  qualities: QualityDemometer[];
  strategies: StrategyDemometer[];
  principles: PrincipleDemometer[];
};

export type MuxonomyMetadata<
  ConceptName extends string = string,
  BaseConceptNames extends string = string,
> = {
  conceptName: ConceptName;

  instances: {
    baseServer: ConceptInstance[];
    informantClient: ConceptInstance[];
  };

  demometers: ConceptDemometers;

  baseConcepts: BaseConceptNames[];

  capability: MuxiumCapability;
};

// ============================================
// CONCEPT CREATOR TYPES
// ============================================

/**
 * ConceptCreator: Function that creates an AnyConcept
 *
 * Due to TypeScript constraints, all concept creators return AnyConcept.
 * Type safety is recovered through StratiDeck declarations.
 */
export type ConceptCreator = (...args: unknown[]) => AnyConcept;

export type BaseConceptCreators = Record<string, ConceptCreator>;

// ============================================
// MUXIUM CREATOR TYPES (Client/Huirth Only)
// ============================================

export type CreateMuxiumOptions = {
  filterKeys?: string[];
  initialState?: Record<string, unknown>;
};

/**
 * MuxiumCreatorFunction: Creates a muxified concept from concept creators
 *
 * Used by Client and Huirth for backward compatibility with plain ConceptCreators.
 */
export type MuxiumCreatorFunction = (
  pageConceptCreators?: ConceptCreator[],
  options?: CreateMuxiumOptions,
) => AnyConcept;

// ============================================
// RENDER MODE (SSR Future Enhancement)
// ============================================

export enum RenderMode {
  SPA = 'spa',
  SSR = 'ssr',
  Hybrid = 'hybrid',
}

// ============================================
// NOVEL CHANGE DETECTION
// ============================================

export enum ChangeDetectionMode {
  Deep = 'deep',
  Shallow = 'shallow',
  KeyedSelector = 'keyedSelector',
}

export type NovelChangeConfig = {
  mode: ChangeDetectionMode;
  trackedSelectors?: KeyedSelector[];
  ignoreProperties?: string[];
};

// ============================================
// SYNCHRONIZATION CONFIGURATION
// ============================================

export type SyncDirection = 'toServer' | 'toClient' | 'bidirectional';

export type SyncConfig = {
  direction: SyncDirection;
  filterKeys: string[];
  novelChange: NovelChangeConfig;
};

// ============================================
// ACTION EXCHANGE REGISTRATION (M1-P1)
// ============================================

/**
 * ExchangeDirection: Direction of cross-side action routing.
 *
 * Semantically distinct from SyncDirection (which governs state-diff frequency).
 * ExchangeDirection governs ACTION ROUTING INTENT across the server/client
 * Diameter junction.
 *
 * - ServerToClient: server dispatches, client receives (broadcast pattern;
 *   e.g., notificationHelloWorld real on Huirth → induction on Client)
 * - ClientToServer: client dispatches, server receives (reverse Diameter;
 *   client dispatches induction, server executes the real Quality)
 * - Bidirectional: declared as two separate routes (one per direction)
 *   for codegen clarity. Reserved; declare each leg explicitly.
 *
 * Citation: M1-P1 Muxonomy Client/Server Split Upgrade · CD candidate AESR
 * (Action-Exchange-Semantic-Registration)
 */
export enum ExchangeDirection {
  ServerToClient = 'serverToClient',
  ClientToServer = 'clientToServer',
  Bidirectional = 'bidirectional',
}

/**
 * ActionExchangeRoute: Declarative routing entry for a Diameter-junction action.
 *
 * Each Diameter Quality (one with `diameter: true` in QualityDemometer) has
 * ONE corresponding ActionExchangeRoute declaration that makes the routing
 * semantic explicit (rather than implicit in file-name suffixes).
 *
 * FNDR vs ActionExchangeRoute:
 *   FNDR controls WHAT SHIPS WHERE at build time (.huirth.ts vs .client.ts).
 *   ActionExchangeRoute declares the SEMANTIC CONTRACT of which actions cross
 *   which boundary at runtime. Both must be consistent; ActionExchangeRoute
 *   does NOT replace FNDR.
 *
 * The `targetConceptName` optional field is the LOAD-BEARING resolution for
 * the icp-dependency anti-pattern: instead of qualities hardcoding a sibling
 * concept name (e.g., `d.icp`), declarations can name the receiving concept
 * explicitly. When absent, defaults to self-routing within this concept.
 * CD candidate: CNDR (Concept-Name-Decouple-Routing).
 *
 * Citation: M1-P1 · resolves DIAMOND-TIER-MACRO-1.md icp-dependency finding
 */
export type ActionExchangeRoute = {
  /**
   * qualityName: The property key on the concept's qualities object.
   * MUST match the `name` on the corresponding QualityDemometer entry.
   */
  qualityName: string;

  /**
   * actionType: The Verbose Split type string shared across the Diameter.
   * MUST match the type string in the corresponding QualityDemometer entry
   * AND the Real Quality's createQualityCard({type}) call.
   */
  actionType: string;

  /**
   * direction: Which side initiates the exchange.
   */
  direction: ExchangeDirection;

  /**
   * targetConceptName: Concept name on the RECEIVING side.
   * When absent: defaults to this MuxonomicConfig's `conceptName` (self-route).
   * When present: enables cross-concept routing (resolves icp-dep anti-pattern).
   */
  targetConceptName?: string;

  /**
   * payloadType: Optional TypeScript type-name reference for the action payload.
   * Used by StratiVerse codegen + scan output labels for documentation.
   */
  payloadType?: string;
};

/**
 * ActionExchangeRegistration: Wrapper grouping routes by direction.
 *
 * Separating `serverToClient` and `clientToServer` as named arrays (rather
 * than a flat list filtered by direction) makes the shape StratiVerse-scan-
 * friendly: a simple `muxonomy.actionExchange.serverToClient` read extracts
 * server-to-client routes without a filter pass. Also makes the registration
 * visually auditable in the concept's *.muxonomy.ts file.
 *
 * Bidirectional patterns are NOT a separate array — declare each leg as its
 * own route under the appropriate direction's array, for codegen clarity.
 *
 * CD candidate: BCEM (Backward-Compatible-Extension-of-Muxonomy)
 */
export type ActionExchangeRegistration = {
  /**
   * serverToClient: Actions the server dispatches that the client receives.
   * Each entry: a Real Quality on Huirth whose Induction on Client routes
   * via WebSocket. Example: `notificationHelloWorld` (huirth.diameter.ts).
   */
  serverToClient: ActionExchangeRoute[];

  /**
   * clientToServer: Actions the client dispatches that the server receives.
   * Each entry: a Real Quality on Client whose Induction on Huirth routes
   * via WebSocket. Example: future client-initiated server-side operations.
   */
  clientToServer: ActionExchangeRoute[];
};

// ============================================
// MUXONOMIC CONCEPT - Union Pairing
// ============================================

/**
 * DeckReferences: Type name references for Huirth and Client decks
 *
 * Note: Actual types are defined in the concept's muxonomy.ts file.
 * These are string references for metadata/documentation purposes.
 * StratiVERSE manages these based on scanned demometers.
 */
export type DeckReferences = {
  huirth: string;
  client: string;
};

/**
 * MuxonomicConfig: The Muxonomy portion of a MuxonomicConcept
 *
 * Contains all configuration that Muxium Creators (Client/Huirth)
 * will discover and auto-wire at utilization time.
 *
 * DEPLOYMENT TARGETING IS FILE-NAME-DRIVEN:
 * - Quality/Principle deployment parsed from file names
 * - StratiVERSE scans and populates demometers automatically
 * - No manual qualityTargets/principleTargets configuration needed
 *
 * File Naming Pattern: conceptName.part.location.diameter.ts
 * - location: 'huirth' | 'client' | omitted (= 'all')
 * - diameter: presence = true (qualities only)
 *
 * Citation: SUITE-1-5-DEPLOYMENT-TARGET-PIVOT-CASCADE.md
 */
export type MuxonomicConfig<ConceptName extends string = string> = {
  conceptName: ConceptName;

  filterKeys: string[];

  novelChange: NovelChangeConfig;

  sync: SyncConfig;

  /**
   * demometers: Populated by StratiVERSE scan
   *
   * Contains all qualities, strategies, principles with their
   * deployment targeting parsed from file names.
   * StratiVERSE manages this - not manually configured.
   */
  demometers: ConceptDemometers;

  /**
   * decks: Type name references for deck exports
   *
   * StratiVERSE generates appropriate deck types based on
   * demometer deployment targeting.
   */
  decks: DeckReferences;

  /**
   * navigation: Optional sidebar configuration for this concept
   *
   * If present, this concept participates in the sidebar nav.
   * Concepts without navigation config don't appear in sidebar.
   *
   * Each concept with navigation is treated as a nav group:
   * - icon, color, label: Sidebar display
   * - order: Position in sidebar (sorted ascending)
   * - pages: Main page + subpages for this concept
   * - isMainLanding: Whether this concept owns the / route
   */
  navigation?: NavigationConfig;

  /**
   * scpToolMetadata: Optional SCP tool registration for this concept
   *
   * Self-Labeling Pattern: Concept name becomes the category (Demometer).
   * Each quality listed here becomes an SCP tool accessible via MCP.
   *
   * Sub-Types:
   * - informative: Read-only tools that explain related actionables
   * - actionable: Tools that perform mutations/actions
   *
   * Pattern: Quality becomes "middle" of SCP Manifold (Inlet → Quality → Return)
   * DataField becomes the return value for SCP tool responses.
   *
   * StratiSPACE Integration:
   * - Aggregated by StratiVERSE for CLAUDE.md StratiSPACE Entry Area
   * - Interchanged based on connected Huirth's Muxonomy Configuration
   * - Informative tools expand to describe Actionables in responses
   *
   * Citation: POC-3-MUXONOMIC-ICP-BRIDGE-TOGGLE-WORKGAMEBOARD.md (historical · pre-SCP-2 working file in /reference/beginning/)
   */
  scpToolMetadata?: SCPQualityMetadata[];

  /**
   * actionExchange: Explicit server-client action exchange registration (M1-P1).
   *
   * Declares the Diameter-junction qualities that cross the server/client
   * boundary as a semantic contract — distinct from FNDR which controls
   * deployment, this declares ROUTING INTENT.
   *
   * RELATIONSHIP TO FNDR:
   *   FNDR (file-name suffix routing) drives deployment targeting at build
   *   time. actionExchange declares which Diameter qualities cross which
   *   boundary at runtime. Both must be consistent; actionExchange does NOT
   *   replace FNDR.
   *
   * BACKWARD COMPATIBILITY:
   *   Optional. Existing MuxonomicConfig declarations that omit this field
   *   continue to compile and register without modification. StratiVerse
   *   codegen (M1-P2) infers exchange surface from
   *   `demometers.qualities[].diameter` when actionExchange is absent;
   *   when present, actionExchange is AUTHORITATIVE for codegen + runtime.
   *
   * Citation: M1-P1 Muxonomy Client/Server Split Upgrade · CD candidates
   * AESR · CNDR · BCEM · DAFC · RADT (per Suite 2 Rust naming dispatch)
   */
  actionExchange?: ActionExchangeRegistration;
};

/**
 * MuxonomicConcept: Union Pairing of AnyConcept + MuxonomicConfig
 *
 * CRITICAL TYPESCRIPT CONSTRAINT:
 * Due to TypeScript limitations, Muxium accepts AnyConcept (Concept<any, any, any>).
 * Advanced type information is stripped at the Muxium boundary.
 * Type safety is recovered through the StratiDeck type system, NOT at concept-passing.
 *
 * This is the core type for concepts that participate in the Muxonomy pattern.
 * When passed to createClientMuxium or createHuirthMuxium:
 * - FilterKeys are extracted and aggregated
 * - Novel Change Detection is wired automatically
 * - Synchronization limits are enforced
 *
 * @example
 * // In strativerse.muxonomy.ts
 * export const strativerseMuxonomic: MuxonomicConfig<'strativerse'> = {
 *   conceptName: 'strativerse',
 *   filterKeys: ['conceptList', 'activeConceptId'],
 *   novelChange: { mode: ChangeDetectionMode.KeyedSelector },
 *   sync: { direction: 'toClient', filterKeys: ['conceptList'] },
 * };
 *
 * export function createMuxonomicStrativerse(): MuxonomicConcept {
 *   return {
 *     concept: createStrativerseConcept(),
 *     muxonomy: strativerseMuxonomic,
 *   };
 * }
 */
export type MuxonomicConcept<ConceptName extends string = string> = {
  concept: AnyConcept;
  muxonomy: MuxonomicConfig<ConceptName>;
};

// ============================================
// INDIVIDUALIZED MUXONOMIC PATTERN
// ============================================

/**
 * IndividualizedState: State additions from .individualized.ts
 *
 * When adding properties here, you MUST also update filterKeys
 * for any property that:
 * - Cannot be serialized (functions, symbols, circular refs)
 * - Should not be synced (client-only UI state, transient values)
 */
export type IndividualizedState<S = Record<string, unknown>> = S;

/**
 * IndividualizedQualities: Quality additions from .individualized.ts
 */
export type IndividualizedQualities<Q = Record<string, unknown>> = Q;

/**
 * IndividualizedMuxonomic: What .individualized.ts returns
 *
 * This is the SCAFFOLDING CHECKPOINT - you cannot add properties
 * without declaring their filterKeys status.
 *
 * @example
 * // In strativerse.individualized.ts
 * export const strativerseIndividualized: IndividualizedMuxonomic<
 *   StrativerseIndividualizedState,
 *   StrativerseIndividualizedQualities,
 *   'strativerse'
 * > = {
 *   state: {
 *     // Project-specific state additions
 *     localViewMode: 'grid',
 *     pendingOperations: [],
 *   },
 *   qualities: {
 *     // Project-specific qualities
 *   },
 *   principles: [],
 *   muxonomy: {
 *     filterKeys: [
 *       'localViewMode',      // Client-only UI preference
 *       'pendingOperations',  // Transient operation queue
 *     ],
 *     novelChange: {
 *       mode: ChangeDetectionMode.KeyedSelector,
 *     },
 *     sync: {
 *       direction: 'toClient',
 *       filterKeys: ['localViewMode', 'pendingOperations'],
 *       novelChange: { mode: ChangeDetectionMode.KeyedSelector },
 *     },
 *   },
 * };
 */
export type IndividualizedMuxonomic<
  State = Record<string, unknown>,
  Qualities = Record<string, unknown>,
  ConceptName extends string = string,
> = {
  state: IndividualizedState<State>;
  qualities: IndividualizedQualities<Qualities>;
  principles: unknown[];
  muxonomy: Omit<MuxonomicConfig<ConceptName>, 'conceptName'>;
};

/**
 * IndividualizedCreator: Function signature for .individualized.ts exports
 *
 * Returns IndividualizedMuxonomic so the muxonomy file can compose it
 * with the base concept and extract all filterKeys.
 */
export type IndividualizedCreator<
  State = Record<string, unknown>,
  Qualities = Record<string, unknown>,
  ConceptName extends string = string,
> = () => IndividualizedMuxonomic<State, Qualities, ConceptName>;

// ============================================
// MUXONOMIC CREATOR TYPES
// ============================================

/**
 * MuxonomicConceptCreator: Function that creates a MuxonomicConcept
 *
 * This is what .individualized.ts and .muxonomy.ts files export.
 * Returns the union pairing of AnyConcept + MuxonomicConfig.
 */
export type MuxonomicConceptCreator<ConceptName extends string = string> =
  () => MuxonomicConcept<ConceptName>;

/**
 * MuxiumCreatorWithMuxonomy: Enhanced Muxium creator that handles MuxonomicConcepts
 *
 * Used by Client and Huirth to:
 * - Accept MuxonomicConcept[] as page concepts
 * - Extract and aggregate filterKeys from all concepts
 * - Wire novel change detection automatically
 * - Enforce synchronization configurations
 *
 * Returns AnyConcept due to TypeScript constraints.
 * Type safety recovered via StratiDeck.
 */
export type MuxiumCreatorWithMuxonomy = (
  muxonomicConcepts?: MuxonomicConcept[],
  options?: CreateMuxiumOptions,
) => AnyConcept;

// ============================================
// UTILITY: Extract FilterKeys from MuxonomicConcepts
// ============================================

export function extractFilterKeys(muxonomics: MuxonomicConcept[]): string[] {
  const allFilterKeys: string[] = [];

  for (const muxonomic of muxonomics) {
    allFilterKeys.push(...muxonomic.muxonomy.filterKeys);
  }

  return [...new Set(allFilterKeys)];
}

export function extractSyncFilterKeys(
  muxonomics: MuxonomicConcept[],
  direction: SyncDirection,
): string[] {
  const filtered = muxonomics.filter(
    (m) => m.muxonomy.sync.direction === direction || m.muxonomy.sync.direction === 'bidirectional',
  );

  return extractFilterKeys(filtered);
}

// ============================================
// UTILITY: Extract ActionExchangeRoutes (M1-P1)
// ============================================

/**
 * extractActionExchangeRoutes: Collect all ActionExchangeRoute entries in a
 * given direction across a set of MuxonomicConcepts.
 *
 * Concepts that omit `actionExchange` contribute zero routes (backward
 * compatible per BCEM). Used by StratiVerse codegen (M1-P2) to auto-wire
 * Induction qualities on the opposite side of each declared route.
 *
 * Citation: M1-P1 · pairs with extractFilterKeys / extractSyncFilterKeys
 */
export function extractActionExchangeRoutes(
  muxonomics: MuxonomicConcept[],
  direction: 'serverToClient' | 'clientToServer',
): ActionExchangeRoute[] {
  const routes: ActionExchangeRoute[] = [];
  for (const muxonomic of muxonomics) {
    const exchange = muxonomic.muxonomy.actionExchange;
    if (exchange) {
      routes.push(...exchange[direction]);
    }
  }
  return routes;
}

// ============================================
// NAVIGATION CONFIG (Concept = Nav Group)
// ============================================

/**
 * PageEntry: A page within a concept's vue/ directory
 *
 * Each concept can have:
 * - One main page (the concept's landing)
 * - Multiple subpages (children in sidebar)
 *
 * File naming: conceptName/vue/PageName.ts
 * Verbose naming extends to pages: StratiVERSE → strativerse/vue/StrativerseLanding.ts
 */
export type PageEntry = {
  path: string; // Route path (e.g., '/strativerse', '/strativerse/concepts')
  label: string; // Display label in sidebar
  order: number; // Order within concept's pages (0 = main page)
  componentPath: string; // Path to SSR component (e.g., 'strativerse/vue/Landing.ts')
  isMain: boolean; // Is this the concept's main page?
};

/**
 * NavigationConfig: Sidebar configuration for a concept
 *
 * Each concept that participates in navigation declares:
 * - isMainLanding: Whether THIS concept's main page is THE site landing (/)
 * - icon, color, label: Sidebar display properties
 * - order: Position in sidebar (concepts sorted by this)
 * - pages: Vue pages for this concept
 *
 * The vue.principle reads all concept muxonomies to build the nav.
 */
export type NavigationConfig = {
  /** Is this concept's main page THE site's main landing (/)?
   * Only ONE concept should have isMainLanding: true.
   * If multiple, lowest order wins. */
  isMainLanding: boolean;

  /** Sidebar display properties */
  icon: string; // Emoji icon (e.g., '◆')
  color: string; // HiFi color name (e.g., 'viridian')
  label: string; // Display label (e.g., 'StratiVERSE')
  order: number; // Sidebar position (0 = first)

  /** Pages for this concept
   * Each concept has a main page + optional subpages.
   * Main page (isMain: true) becomes the group landing.
   * Subpages appear as children in sidebar accordion. */
  pages: PageEntry[];

  /** Whether this concept is visible in navigation routing and sidebar.
   * undefined or true = enabled (backward compatible).
   * false = landing page exists but hidden from navigation. */
  enabled?: boolean;
};

// ============================================
// DUMMY QUALITY (Singleton for Diameter Junctions)
// ============================================

/**
 * createDummyQuality: Singleton factory for diameter junction qualities
 *
 * When a quality has `diameter: true` in its file name, it needs a dummy
 * implementation on the opposite side to maintain Deck consistency.
 *
 * The dummy quality:
 * - Has the SAME type string (action type)
 * - Accepts the SAME payload signature
 * - Throws an error if ever engaged (error boundary)
 * - Ships NO implementation logic (Formation Pattern preserved)
 *
 * Usage:
 * ```typescript
 * // For a Huirth-only quality with diameter (junction)
 * // File: scanConcepts.quality.huirth.diameter.ts
 *
 * // On Client, create dummy:
 * const scanConcepts = createDummyQuality<StrativerseState, ScanPayload>(
 *   'Strativerse Scan Concepts',
 *   DeploymentTarget.Huirth
 * );
 * ```
 *
 * @param type - The quality action type (verbose split naming)
 * @param belongsTo - Where the FULL implementation lives (Huirth or Client)
 */
export function createDummyQuality<
  State extends Record<string, unknown>,
  Payload extends Record<string, unknown> = Record<string, unknown>,
>(type: string, belongsTo: DeploymentTarget.Huirth | DeploymentTarget.Client) {
  const currentSide = belongsTo === DeploymentTarget.Huirth ? 'Client' : 'Huirth';

  return createQualityCardWithPayload<State, Payload>({
    type,
    reducer: () => {
      throw new Error(
        `[Muxonomy] Quality "${type}" is ${belongsTo}-only. ` +
          `Cannot execute on ${currentSide}. ` +
          `This is a diameter junction - full implementation exists on ${belongsTo}.`,
      );
    },
  });
}

// ============================================
// INDUCTION QUALITY (WebSocket ActionQue Routing)
// ============================================

/**
 * InductionState - State constraint for Induction qualities
 *
 * Requires actionQue property which is provided by the muxified
 * webSocketClient in the client context.
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
export type InductionState = {
  actionQue: AnyAction[];
};

/**
 * createInductionQualityCard - No payload variant
 *
 * Creates a quality that automatically routes action to actionQue.
 * The actionQue is provided by muxified webSocketClient in client context.
 * webSocketClient.principle monitors actionQue and sends via WebSocket.
 *
 * This pattern enables the Induction Diametric Quality pattern:
 * - Client dispatches action with SAME type string as server (Diameter)
 * - Induction quality routes to actionQue (no local execution)
 * - webSocketClient.principle sends via WebSocket
 * - Server executes REAL quality by TYPE STRING lookup
 * - Strategy preserved across boundary
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 *
 * @param type - Quality action type (Verbose Split naming)
 */
export function createInductionQualityCard<State extends InductionState>(type: string) {
  return createQualityCard<State>({
    type,
    reducer: (state, action) => {
      // If no strategy, wrap with strategyDetermine for clientStateKey routing
      // If strategy exists, pass through as-is
      const actionToQueue = action.strategy ? action : strategyDetermine(action);
      return {
        actionQue: [...state.actionQue, actionToQueue],
      } as Partial<State>;
    },
  });
}

/**
 * createInductionQualityCardWithPayload - With payload variant
 *
 * Creates a quality with payload that automatically routes action to actionQue.
 * The actionQue is provided by muxified webSocketClient in client context.
 * webSocketClient.principle monitors actionQue and sends via WebSocket.
 *
 * This pattern enables the Induction Diametric Quality pattern:
 * - Client dispatches action with payload using SAME type string as server
 * - Induction quality routes to actionQue (no local execution)
 * - webSocketClient.principle sends via WebSocket
 * - Server executes REAL quality by TYPE STRING lookup (Diameter)
 * - Strategy and payload preserved across boundary
 *
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 *
 * @param type - Quality action type (Verbose Split naming)
 */
export function createInductionQualityCardWithPayload<
  State extends InductionState,
  Payload extends Record<string, unknown>,
>(type: string) {
  return createQualityCardWithPayload<State, Payload>({
    type,
    reducer: (state, action) => {
      // If no strategy, wrap with strategyDetermine for clientStateKey routing
      // If strategy exists, pass through as-is
      const actionToQueue = action.strategy ? action : strategyDetermine(action);
      return {
        actionQue: [...state.actionQue, actionToQueue],
      } as Partial<State>;
    },
  });
}
