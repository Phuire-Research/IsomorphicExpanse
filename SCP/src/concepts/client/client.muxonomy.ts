/**
 * Client Muxonomy File
 *
 * Exports createClientMuxium creator function that:
 * - Takes MuxonomicConcepts (union of AnyConcept + MuxonomicConfig)
 * - Auto-extracts and aggregates filterKeys from all concepts
 * - Wires novel change detection automatically
 * - Returns Muxified Client Concept with base + page concepts
 *
 * CRITICAL TYPESCRIPT CONSTRAINT:
 * Due to TypeScript limitations, Muxium accepts AnyConcept.
 * Type safety is recovered through StratiDeck, NOT at concept-passing.
 *
 * Uniform Three-File Pattern:
 * - client.concept.ts        = BASE (changes CASCADE)
 * - client.individualized.ts = INDIVIDUALIZED: Returns MuxonomicConcept (do NOT cascade)
 * - client.muxonomy.ts       = createClientMuxium() (ADDITIONAL capability)
 *
 * Client has Muxium Creator capability as part of its cascaded base,
 * allowing concepts to be loaded per-page for SSR tier-gating.
 */

import { muxifyConcepts, createConcept, muxification } from 'stratimux';
// M2-Final R7 fix: LoadConcepts not exported by stratimux (internal type) · re-declare locally
import type { AnyConcept, Muxium, Concept } from 'stratimux';
type LoadConcepts = Record<string, Concept<any, any, any>>;
import {
  createWebSocketClientConcept,
  type WebSocketClientState,
} from '../webSocketClient/webSocketClient.concept';
import createLocalStorageConcept from '../localStorage/localStorage.concept';
import { createNotificationConcept } from '../notification/notification.concept';
import { createScsBridgeClientConcept } from '../scsBridge/scsBridge.concept.client';
// D-UP6 · THE STRANDED-FILTER CURE (the spawn-storm Rose diagnosis): these lists declared
// their fields local-only, but the wire's filter set is aggregated HERE — extractFilterKeys
// reads only MuxonomicConcepts, and scsBridge/gitm compose as BASE concepts, so the
// declarations were wired to NOTHING. The client's pendingSpawnScpName ascended to the
// server, the clear-to-undefined could not cross JSON, and every reconnect flush re-armed
// the spawn trigger ("a session on every page selection"). Importing them into the base
// filter set IS the enforcement the declarations always claimed.
import { SCSBRIDGE_FILTER_KEYS } from '../scsBridge/scsBridge.state';
import { GITM_FILTER_KEYS } from '../gitm/gitm.state';
// GITM #639 · the gitm client BASE concept — gitmJson relay reception. BASE (two-surface
// fact · GitmLanding + ScsBridgeLanding both require it) · migrated off scsBridge.
import { createGitmClientConcept } from '../gitm/gitm.concept.client';
// IUPA Adoption · Cycle 159 D1 · suite8 + cadmium REMOVED from BASE_CONCEPTS_CREATORS.
// Their landings now muxify per-page via createClientMuxiumInstance(muxonomicConcepts).
// Following ADMIN_ICP pattern · BASE = universal-bridge concepts only.
import { clientSetDarkMode, type ClientSetDarkMode } from './qualities/setDarkMode.quality';
import { clientInitializationPrinciple } from './initialization.principle';

// Re-export deck types for consumers
export type { ClientMuxiumDeck, ExtendedClientDeck, ClientDeck } from './client.concept';
import type {
  MuxonomicConcept,
  ConceptCreator,
  CreateMuxiumOptions,
} from '../muxonomy/muxonomy.model';
import { extractFilterKeys } from '../muxonomy/muxonomy.model';

// ============================================
// BASE CONCEPTS (Always Loaded - Bare Minimum)
// ============================================

/**
 * Base concepts loaded with every ClientMuxium instance.
 *
 * MTRR (Muxonomy Trim · Reason Retained) per remaining entry:
 *   - webSocketClient: MTRR · server communication transport · universal
 *   - localStorage:    MTRR · client persistence · universal
 *   - notification:    MTRR · ZKHB pattern · global toast/notification surface · universal
 *   - scsBridge:       MTRR · CSCM pattern · universal Client Muxium bridge to scs runtime
 *                      · drives TaskBar Turn Over from ANY page · Cycle 159 D1
 *
 * Cycle 159 D1 IUPA Removals (suite8 + cadmium):
 *   - Per-landing muxified via createClientMuxiumInstance(muxonomicConcepts)
 *   - Following ADMIN_ICP precedent · BASE = bridge-universal concepts ONLY
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: CLIENT-MUXIUM-ADOPTION-WAVE2-OCHRE-A-FOUNDATION-BLUEPRINT.md
 * Citation: 3-Tier Application Architecture Discovery
 */
export const BASE_CONCEPTS_CREATORS = {
  // MTRR · universal transport
  webSocketClient: createWebSocketClientConcept,
  // MTRR · universal persistence
  localStorage: createLocalStorageConcept,
  // MTRR · ZKHB · global notification surface
  notification: createNotificationConcept,
  // MTRR · CSCM · universal SCS-Bridge for TaskBar + Sessions popup from any landing
  scsBridge: createScsBridgeClientConcept,
  // GITM #639 · BASE · two-surface fact (GitmLanding + ScsBridgeLanding both read gitmJson)
  gitm: createGitmClientConcept,
} as const;

export type BaseConceptNames = keyof typeof BASE_CONCEPTS_CREATORS;

// ============================================
// Base State & Qualities
// ============================================

export type BaseClientState = {
  darkMode: boolean;
} & WebSocketClientState;

export const baseClientQualities = {
  clientSetDarkMode,
};

export type BaseClientQualities = {
  clientSetDarkMode: ClientSetDarkMode;
};

export const clientName = 'client';

// ============================================
// Base FilterKeys (Client-specific, not synced)
// ============================================

export const BASE_CLIENT_FILTER_KEYS: string[] = [
  'actionQue',
  'filterKeys',
  'serverSemaphore',
  'clientStateId',
  'isConnected',
  // D-UP6 · the BASE-concept filter declarations, finally wired to the transport (the
  // spawn-storm cure): every pending* trigger + client-local UI field these lists name
  // now truly stays client-side — nothing here ascends to the server state again.
  ...SCSBRIDGE_FILTER_KEYS,
  ...GITM_FILTER_KEYS,
];

// ============================================
// createClientMuxium Creator Function
// ============================================

const createInitialBaseState = (
  filterKeys: string[],
  initialState: Record<string, unknown>,
): BaseClientState => ({
  darkMode: false,
  actionQue: [],
  filterKeys,
  serverSemaphore: -1,
  clientStateId: null,
  isConnected: false,
  ...initialState,
});

/**
 * Creates a muxified client concept with base concepts + MuxonomicConcepts
 *
 * AUTO-WIRING:
 * - FilterKeys are extracted from each MuxonomicConcept and aggregated
 * - Base client filterKeys are always included
 * - Novel change detection configs are collected (for future wiring)
 *
 * @param muxonomicConcepts - Array of MuxonomicConcepts (concept + muxonomy config)
 * @param options - Configuration options (additional filterKeys, initialState)
 * @returns Muxified client concept (AnyConcept due to TypeScript constraints)
 *
 * @example
 * // Dashboard page with MuxonomicConcept
 * import { createMuxonomicStrativerse } from '../strativerse/strativerse.muxonomy';
 * const clientConcept = createClientMuxiumWithMuxonomy([createMuxonomicStrativerse()]);
 * // FilterKeys auto-extracted from strativerse's muxonomy config
 */
export function createClientMuxiumWithMuxonomy(
  muxonomicConcepts: MuxonomicConcept[] = [],
  options: CreateMuxiumOptions = {},
): AnyConcept {
  const { filterKeys: additionalFilterKeys = [], initialState = {} } = options;

  const conceptFilterKeys = extractFilterKeys(muxonomicConcepts);

  const allFilterKeys = [...BASE_CLIENT_FILTER_KEYS, ...conceptFilterKeys, ...additionalFilterKeys];
  const uniqueFilterKeys = [...new Set(allFilterKeys)];

  // IUPA · suite8 + cadmium REMOVED · landings supply them via muxonomicConcepts
  const baseConcepts = [
    BASE_CONCEPTS_CREATORS.webSocketClient(uniqueFilterKeys),
    BASE_CONCEPTS_CREATORS.localStorage(),
    BASE_CONCEPTS_CREATORS.notification(),
    BASE_CONCEPTS_CREATORS.scsBridge(),
    // GITM #639 · BASE · gitmJson relay reception (two-surface fact)
    BASE_CONCEPTS_CREATORS.gitm(),
  ];

  const pageConcepts = muxonomicConcepts.map((mc) => mc.concept);

  return muxifyConcepts(
    [...baseConcepts, ...pageConcepts],
    createConcept<BaseClientState, typeof baseClientQualities>(
      clientName,
      createInitialBaseState(uniqueFilterKeys, initialState),
      baseClientQualities,
      [clientInitializationPrinciple],
    ),
  );
}

/**
 * Creates a muxified client concept with base concepts + plain concept creators
 *
 * BACKWARD COMPATIBILITY:
 * For concepts that haven't migrated to MuxonomicConcept pattern yet.
 * FilterKeys must be passed manually via options.
 *
 * @param pageConceptCreators - Array of plain concept creator functions
 * @param options - Configuration options (filterKeys REQUIRED for non-syncable properties)
 * @returns Muxified client concept (AnyConcept due to TypeScript constraints)
 *
 * @example
 * // Legacy usage with plain creators
 * import { createStrativerseConcept } from '../strativerse/strativerse.concept';
 * const clientConcept = createClientMuxium(
 *   [createStrativerseConcept],
 *   { filterKeys: ['localViewMode', 'pendingOps'] }
 * );
 */
export function createClientMuxium(
  pageConceptCreators: ConceptCreator[] = [],
  options: CreateMuxiumOptions = {},
): AnyConcept {
  const { filterKeys: additionalFilterKeys = [], initialState = {} } = options;

  const allFilterKeys = [...BASE_CLIENT_FILTER_KEYS, ...additionalFilterKeys];
  const uniqueFilterKeys = [...new Set(allFilterKeys)];

  // IUPA · suite8 + cadmium REMOVED · landings supply them via pageConceptCreators
  const baseConcepts = [
    BASE_CONCEPTS_CREATORS.webSocketClient(uniqueFilterKeys),
    BASE_CONCEPTS_CREATORS.localStorage(),
    BASE_CONCEPTS_CREATORS.notification(),
    BASE_CONCEPTS_CREATORS.scsBridge(),
    // GITM #639 · BASE · gitmJson relay reception (two-surface fact)
    BASE_CONCEPTS_CREATORS.gitm(),
  ];

  const pageConcepts = pageConceptCreators.map((creator) => creator());

  return muxifyConcepts(
    [...baseConcepts, ...pageConcepts],
    createConcept<BaseClientState, typeof baseClientQualities>(
      clientName,
      createInitialBaseState(uniqueFilterKeys, initialState),
      baseClientQualities,
      [clientInitializationPrinciple],
    ),
  );
}

// ============================================
// Muxium Instance Creator (Full Workflow)
// ============================================

export type ClientMuxiumOptions = CreateMuxiumOptions & {
  title?: string;
  logging?: boolean;
  storeDialog?: boolean;
};

/**
 * Creates a complete Client Muxium instance with MuxonomicConcepts
 *
 * FULL WORKFLOW:
 * 1. Creates muxified client concept with base + page concepts
 * 2. Creates Muxium via muxification()
 * 3. Returns ready-to-use Muxium instance with proper deck typing
 *
 * This is the PRIMARY entry point for Vue islands - no direct
 * createMuxium import needed in components.
 *
 * TYPE SYSTEM:
 * - Base deck: ClientMuxiumDeck (d.client.d.webSocketClient, d.client.d.localStorage)
 * - Extended deck: Generic type parameter for additional muxified concepts
 * - Access pattern: d.client.d.{muxifiedConcept}.k.property.select()
 *
 * Citation: STRATIMUX-REFERENCE.md "🏗️ Muxified Concept Access Patterns (CRITICAL)"
 *
 * @template ExtendedDeck - Additional concept decks muxified into client (e.g., StrativerseDeck)
 * @param muxonomicConcepts - Array of MuxonomicConcepts for this page
 * @param options - Configuration options (title, logging, filterKeys, etc.)
 * @returns Complete Muxium instance ready for subscription
 *
 * @example
 * // In Landing.vue onMounted():
 * import { createClientMuxiumInstance, ExtendedClientDeck } from '../../client/client.muxonomy';
 * import { createMuxonomicStrativerse, type StrativerseDeck } from '../strativerse.muxonomy';
 *
 * type LandingDeck = ExtendedClientDeck<StrativerseDeck>;
 *
 * const muxium = createClientMuxiumInstance<StrativerseDeck>(
 *   [createMuxonomicStrativerse()],
 *   { title: 'StrativerseLanding', logging: true }
 * );
 *
 * // Type-safe access:
 * muxium.plan<LandingDeck>('subscription', ({ d }) => {
 *   d.client.d.strativerse.k.conceptList.select();
 *   d.client.d.webSocketClient.k.isConnected.select();
 * });
 */
export function createClientMuxiumInstance<ExtendedDeck extends LoadConcepts = {}>(
  muxonomicConcepts: MuxonomicConcept[] = [],
  options: ClientMuxiumOptions = {},
): Muxium<ExtendedDeck> {
  const {
    title = 'ClientMuxium',
    logging = false,
    storeDialog = false,
    ...createOptions
  } = options;

  const clientConcept = createClientMuxiumWithMuxonomy(muxonomicConcepts, createOptions);

  // muxification expects object with concept names as keys, not array
  return muxification(
    title,
    {
      [clientName]: clientConcept,
    },
    {
      logging,
      storeDialog,
    },
  ) as unknown as Muxium<ExtendedDeck>;
}
