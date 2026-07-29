/**
 * Vue Navigation Registry
 *
 * Central registry for concept navigation configurations.
 * Concepts register their NavigationConfig via createVuePrinciple factory.
 *
 * Pattern: Singleton module - accessible before Muxium initialization
 * Purpose: Aggregate all concept navigations for sidebar building
 *
 * Citation: WORKGAMEBOARD-VUE-SSR-STRATIVERSE-ARCHITECTURE.md
 * Pattern: Concept = Nav Group - each concept with navigation becomes sidebar group
 */

import type { NavigationConfig, PageEntry } from '../muxonomy/muxonomy.model';

// ============================================
// REGISTRY TYPES
// ============================================

/**
 * RegisteredNavigation - Navigation with concept name association
 */
export type RegisteredNavigation = {
  conceptName: string;
  navigation: NavigationConfig;
  registeredAt: number;
};

/**
 * NavGroup - Computed sidebar navigation group
 *
 * Derived from NavigationConfig for rendering.
 * Includes all pages and computed properties.
 */
export type NavGroup = {
  id: string; // conceptName
  label: string; // NavigationConfig.label
  icon: string; // NavigationConfig.icon
  color: string; // NavigationConfig.color
  order: number; // NavigationConfig.order
  landingPath: string; // Path of the main page (isMain: true)
  children: Array<{
    // Subpages (isMain: false)
    path: string;
    label: string;
    order: number;
  }>;
};

// ============================================
// REGISTRY STATE
// ============================================

/**
 * Registry storage - singleton pattern
 *
 * Maps conceptName → RegisteredNavigation
 */
const navigationRegistry = new Map<string, RegisteredNavigation>();

/**
 * Landing page cache - cleared on registration
 */
let cachedLandingPage: PageEntry | null = null;
let cachedLandingConcept: string | null = null;

// ============================================
// REGISTRY METHODS
// ============================================

/**
 * registerNavigation - Register a concept's navigation config
 *
 * Called by createVuePrinciple when concept loads.
 * Overwrites previous registration for same concept.
 *
 * @param conceptName - Name of the registering concept
 * @param navigation - NavigationConfig from concept's muxonomy
 */
export function registerNavigation(conceptName: string, navigation: NavigationConfig): void {
  navigationRegistry.set(conceptName, {
    conceptName,
    navigation,
    registeredAt: Date.now(),
  });

  // Clear cache when new navigation registered
  cachedLandingPage = null;
  cachedLandingConcept = null;

  console.log(
    `[Vue Registry] Registered navigation: ${conceptName} ` +
      `(${navigation.pages.length} pages, order: ${navigation.order}` +
      `${navigation.isMainLanding ? ', isMainLanding' : ''})`,
  );
}

/**
 * unregisterNavigation - Remove a concept's navigation
 *
 * Called when concept is removed from Muxium.
 */
export function unregisterNavigation(conceptName: string): boolean {
  const removed = navigationRegistry.delete(conceptName);
  if (removed) {
    cachedLandingPage = null;
    cachedLandingConcept = null;
    console.log(`[Vue Registry] Unregistered navigation: ${conceptName}`);
  }
  return removed;
}

/**
 * getNavGroups - Get all registered navigations as NavGroups
 *
 * Returns sorted by order (ascending).
 * Used by SideNav component for rendering.
 */
export function getNavGroups(): NavGroup[] {
  const groups: NavGroup[] = [];

  for (const [conceptName, registered] of navigationRegistry) {
    const nav = registered.navigation;

    // Find main page (landing for this concept)
    const mainPage = nav.pages.find((p) => p.isMain);
    const landingPath = mainPage?.path ?? nav.pages[0]?.path ?? `/${conceptName}`;

    // Get subpages (non-main pages)
    const children = nav.pages
      .filter((p) => !p.isMain)
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        path: p.path,
        label: p.label,
        order: p.order,
      }));

    groups.push({
      id: conceptName,
      label: nav.label,
      icon: nav.icon,
      color: nav.color,
      order: nav.order,
      landingPath,
      children,
    });
  }

  // Sort by order ascending
  return groups.sort((a, b) => a.order - b.order);
}

/**
 * getLandingPage - Get the site's main landing page
 *
 * Returns the PageEntry from the concept with isMainLanding: true.
 * If multiple, lowest order wins.
 *
 * @returns { conceptName, page } or null if no landing configured
 */
export function getLandingPage(): { conceptName: string; page: PageEntry } | null {
  // Return cached if available
  if (cachedLandingPage && cachedLandingConcept) {
    return { conceptName: cachedLandingConcept, page: cachedLandingPage };
  }

  // Find concepts with isMainLanding: true
  const landingConcepts: Array<{ conceptName: string; nav: NavigationConfig }> = [];

  for (const [conceptName, registered] of navigationRegistry) {
    if (registered.navigation.isMainLanding) {
      landingConcepts.push({ conceptName, nav: registered.navigation });
    }
  }

  if (landingConcepts.length === 0) {
    return null;
  }

  // If multiple, lowest order wins
  landingConcepts.sort((a, b) => a.nav.order - b.nav.order);
  const winner = landingConcepts[0];

  // Get main page from winning concept
  const mainPage = winner.nav.pages.find((p) => p.isMain) ?? winner.nav.pages[0];
  if (!mainPage) {
    console.warn(`[Vue Registry] Concept ${winner.conceptName} has isMainLanding but no pages`);
    return null;
  }

  // Cache result
  cachedLandingConcept = winner.conceptName;
  cachedLandingPage = mainPage;

  return { conceptName: winner.conceptName, page: mainPage };
}

/**
 * getPageConfig - Get PageEntry for a given path
 *
 * Searches all registered navigations for matching page.
 *
 * @param path - Route path to find
 * @returns { conceptName, page } or null if not found
 */
export function getPageConfig(path: string): { conceptName: string; page: PageEntry } | null {
  for (const [conceptName, registered] of navigationRegistry) {
    const page = registered.navigation.pages.find((p) => p.path === path);
    if (page) {
      return { conceptName, page };
    }
  }
  return null;
}

/**
 * getAllPages - Get all registered pages
 *
 * Returns flat array of all pages from all concepts.
 * Used for route registration.
 */
export function getAllPages(): Array<{ conceptName: string; page: PageEntry }> {
  const pages: Array<{ conceptName: string; page: PageEntry }> = [];

  for (const [conceptName, registered] of navigationRegistry) {
    for (const page of registered.navigation.pages) {
      pages.push({ conceptName, page });
    }
  }

  return pages;
}

/**
 * getRegisteredConcepts - Get list of concept names with navigation
 */
export function getRegisteredConcepts(): string[] {
  return Array.from(navigationRegistry.keys());
}

/**
 * getRegistrationCount - Get number of registered navigations
 */
export function getRegistrationCount(): number {
  return navigationRegistry.size;
}

/**
 * clearRegistry - Clear all registrations (for testing)
 */
export function clearRegistry(): void {
  navigationRegistry.clear();
  cachedLandingPage = null;
  cachedLandingConcept = null;
  console.log('[Vue Registry] Registry cleared');
}

// ============================================
// EXPORT REGISTRY INTERFACE
// ============================================

export const vueRegistry = {
  registerNavigation,
  unregisterNavigation,
  getNavGroups,
  getLandingPage,
  getPageConfig,
  getAllPages,
  getRegisteredConcepts,
  getRegistrationCount,
  clearRegistry,
};
