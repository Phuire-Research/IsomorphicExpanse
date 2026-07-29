/**
 * Vue SSR Model
 *
 * Type definitions for Vue Server-Side Rendering concept.
 * Vue concept lives on SERVER (Huirth) - manages Express SSR routes.
 *
 * Pattern: Same as SCP Express Transport - access Express from Huirth state
 *
 * Citation: STRATIMUX-REFERENCE.md - State Design Best Practices
 * Pattern: Normalize data, separate concerns, design for reactivity
 */

import type { NavigationConfig, PageEntry } from '../muxonomy/muxonomy.model';

import { vueRegistry } from './vueRegistry';

// Re-export for convenience
export type { NavigationConfig, PageEntry };

// ============================================
// TIER ACCESS (Imported pattern from Muxonomy)
// ============================================

/**
 * TierAccess - User authorization levels for route access
 *
 * Aligns with client muxonomy.model.ts TierAccess enum
 * Kept as type here to avoid circular dependencies
 */
export type TierAccess = 'public' | 'authenticated' | 'premium' | 'admin';

/**
 * Tier hierarchy for comparison operations
 */
export const TIER_HIERARCHY: Record<TierAccess, number> = {
  public: 0,
  authenticated: 1,
  premium: 2,
  admin: 3,
};

/**
 * Check if user tier meets required tier
 */
export function meetsMinimumTier(userTier: TierAccess, requiredTier: TierAccess): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

// ============================================
// RENDER MODE
// ============================================

/**
 * RenderMode - How the route should be rendered
 *
 * - ssr: Server-side rendered (premium code protection)
 * - spa: Single-page app (client-side only)
 * - hybrid: SSR with client hydration
 */
export type RenderMode = 'ssr' | 'spa' | 'hybrid';

// ============================================
// LAYOUT CONFIGURATION
// ============================================

/**
 * LayoutVisibility - Per-route layout configuration
 *
 * Controls sidebar/navbar visibility and items
 * Injected into HTML via data attributes for client hydration
 */
export type LayoutVisibility = {
  showSidebar: boolean;
  showNavbar: boolean;
  sidebarItems?: string[];
  navbarItems?: string[];
};

/**
 * Default layout for unspecified routes
 */
export const DEFAULT_LAYOUT: LayoutVisibility = {
  showSidebar: true,
  showNavbar: true,
  sidebarItems: [],
  navbarItems: [],
};

// ============================================
// CONCEPT TIER CONFIGURATION
// ============================================

/**
 * ConceptTierConfig - Which concepts a page requires and their tier
 *
 * Used by createPageMuxium() to filter concepts by user tier
 */
export type ConceptTierConfig = {
  conceptName: string;
  requiredTier: TierAccess;
  maxTier?: TierAccess;
};

// ============================================
// PAGE CONFIGURATION
// ============================================

/**
 * PageConfig - Complete configuration for a tier-gated SSR route
 *
 * Each page declares:
 * - Route identity (path, landing status)
 * - Access control (minimum tier, render mode)
 * - Concept requirements (which concepts to load)
 * - Layout configuration (sidebar/navbar visibility)
 * - Component path (for SSR rendering)
 *
 * @example
 * const landingPage: PageConfig = {
 *   path: '/',
 *   isLanding: true,
 *   minimumTier: 'public',
 *   renderMode: 'ssr',
 *   requiredConcepts: [],  // Base only
 *   layout: { showSidebar: false, showNavbar: true },
 *   componentPath: 'strativerse/Landing.vue',
 *   meta: { title: 'StratiVERSE' },
 * };
 */
export type PageConfig = {
  path: string;
  isLanding: boolean;

  minimumTier: TierAccess;
  renderMode: RenderMode;

  requiredConcepts: ConceptTierConfig[];

  layout: LayoutVisibility;

  componentPath: string;

  meta?: {
    title?: string;
    description?: string;
  };
};

// ============================================
// ROUTE REGISTRATION
// ============================================

/**
 * RouteRegistration - Registration payload for dynamic route addition
 *
 * Used by vueRegisterRoute quality
 */
export type RouteRegistration = {
  pageConfig: PageConfig;
  registeredAt: number;
};

// ============================================
// VUE REGISTRY INTERFACE
// ============================================

/**
 * VueRegistryInterface - Interface for concept navigation registration
 *
 * Provided in Vue state for concepts to access via Deck.
 * Pattern: Object interface in state enables Deck-based registration.
 */
export type VueRegistryInterface = typeof vueRegistry;

// ============================================
// VUE STATE
// ============================================

/**
 * VueState - State for Vue SSR concept
 *
 * Manages registered routes and SSR configuration
 * Provides registry interface for concept navigation registration
 *
 * Citation: STRATIMUX-REFERENCE.md - Avoid Optional Properties
 * Pattern: All properties have default values, no undefined
 */
export type VueState = {
  registeredRoutes: Map<string, PageConfig>;
  routeCount: number;
  initialized: boolean;
  ssrEnabled: boolean;
  registry: VueRegistryInterface;
};

/**
 * Initial Vue state factory
 */
export const createVueState = (): VueState => ({
  registeredRoutes: new Map(),
  routeCount: 0,
  initialized: false,
  ssrEnabled: true,
  registry: vueRegistry,
});

export const vueName = 'vue';

// ============================================
// SSR CONTEXT
// ============================================

/**
 * SSRContext - Context passed to Vue SSR rendering
 *
 * Contains all information needed to render a page server-side
 */
export type SSRContext = {
  path: string;
  userTier: TierAccess;
  pageConfig: PageConfig;
  layout: LayoutVisibility;
};

// ============================================
// HTML BUILDER TYPES
// ============================================

/**
 * HTMLBuildOptions - Options for building SSR HTML response
 */
export type HTMLBuildOptions = {
  appHtml: string;
  layout: LayoutVisibility;
  meta?: {
    title?: string;
    description?: string;
  };
  headTags?: string;
  bodyAttrs?: string;
};
