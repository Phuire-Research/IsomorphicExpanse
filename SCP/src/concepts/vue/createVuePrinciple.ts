/**
 * Vue Principle Creator Factory
 *
 * Factory function that concepts import to register their navigation with Vue SSR.
 * Each concept supplies its muxonomy config → gets a principle that registers its pages.
 *
 * Pattern: Factory returns PrincipleFunction with VueDeck access
 * Purpose: Enable concepts to self-register navigation via Deck-based Vue access
 *
 * Citation: FORWARD-PASS-STRATIVERSE-VUE-SSR-ARCHITECTURE.md
 * Pattern: createVuePrinciple(muxonomyConfig) → principle that registers navigation
 *
 * Reference: localStorageRegistration.principle.ts
 * Pattern: PrincipleFunction<Qualities, Deck, State> with proper Deck typing
 *
 * Usage in concept:
 * ```typescript
 * import { createVuePrinciple } from '../vue/createVuePrinciple';
 * import { strativerseMuxonomic } from './strativerse.muxonomy';
 *
 * export const createStrativerseConcept = () => createConcept(
 *   strativerseName,
 *   createStrativerseState(),
 *   strativerseQualities,
 *   [
 *     strativersePrinciple,
 *     createVuePrinciple(strativerseMuxonomic),  // Registers navigation
 *   ]
 * );
 * ```
 */

import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type { MuxonomicConfig } from '../muxonomy/muxonomy.model';
import type { VueDeck } from './vue.concept';

// ============================================
// PRINCIPLE TYPE DEFINITION
// ============================================

/**
 * VueNavigationRegistrationPrinciple - Principle type for navigation registration
 *
 * Citation: localStorageRegistration.principle.ts (lines 14-18)
 * Pattern: PrincipleFunction<Qualities, Deck, State>
 *
 * - Qualities: unknown (any concept can use this)
 * - Deck: MuxiumDeck & VueDeck (requires Vue in composition)
 * - State: unknown (any concept state)
 */
export type VueNavigationRegistrationPrinciple = PrincipleFunction<
  unknown,
  MuxiumDeck & VueDeck,
  unknown
>;

// ============================================
// PRINCIPLE CREATOR FACTORY
// ============================================

/**
 * createVuePrinciple - Factory that creates a navigation registration principle
 *
 * Takes a MuxonomicConfig and returns a PrincipleFunction.
 * When the concept loads, the principle accesses Vue via Deck and registers navigation.
 *
 * @param muxonomyConfig - The concept's MuxonomicConfig (must have navigation property)
 * @returns PrincipleFunction that registers navigation on concept load
 *
 * @example
 * // In strativerse.concept.ts
 * export const createStrativerseConcept = () => createConcept(
 *   strativerseName,
 *   createStrativerseState(),
 *   strativerseQualities,
 *   [
 *     strativersePrinciple,
 *     createVuePrinciple(strativerseMuxonomic),
 *   ]
 * );
 */
export function createVuePrinciple<ConceptName extends string>(
  muxonomyConfig: MuxonomicConfig<ConceptName>,
): VueNavigationRegistrationPrinciple {
  const { conceptName, navigation } = muxonomyConfig;

  // Return properly typed principle function
  const principle: VueNavigationRegistrationPrinciple = ({ d_ }) => {
    // Validate navigation config exists
    if (!navigation) {
      console.log(
        `[Vue Principle] Concept "${conceptName}" has no navigation config - skipping registration`,
      );
      return;
    }

    // Validate navigation has pages
    if (!navigation.pages || navigation.pages.length === 0) {
      console.warn(
        `[Vue Principle] Concept "${conceptName}" has empty navigation.pages - skipping registration`,
      );
      return;
    }

    // Access Vue registry via Deck
    const vueRegistry = d_.vue.k.registry.select();

    if (!vueRegistry) {
      console.error(
        `[Vue Principle] Vue registry not available in Deck - ` +
          `ensure Vue concept is muxified before "${conceptName}"`,
      );
      return;
    }

    // Register navigation with Vue registry
    vueRegistry.registerNavigation(conceptName, navigation);

    console.log(
      `[Vue Principle] Registered "${conceptName}" navigation with Vue SSR ` +
        `(${navigation.isMainLanding ? 'MAIN LANDING, ' : ''}` +
        `${navigation.pages.length} pages)`,
    );
  };

  return principle;
}

// ============================================
// UTILITY: Check if concept has navigation
// ============================================

/**
 * hasNavigation - Check if a MuxonomicConfig has valid navigation
 *
 * Useful for conditional logic before creating principle.
 */
export function hasNavigation<ConceptName extends string>(
  muxonomyConfig: MuxonomicConfig<ConceptName>,
): boolean {
  return (
    !!muxonomyConfig.navigation &&
    !!muxonomyConfig.navigation.pages &&
    muxonomyConfig.navigation.pages.length > 0
  );
}
