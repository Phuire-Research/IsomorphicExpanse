/**
 * Vue SSR Concept
 *
 * Server-side Vue concept for SSR route management.
 * Muxified into Huirth - accesses Express server from state.
 *
 * Citation: STRATIMUX-REFERENCE.md - Essential Principles (lines 153-196)
 * Pattern: Explicit Quality mapping (NEVER typeof), Deck type definition
 *
 * Purpose:
 * - Manage SSR route registration
 * - Provide createPageMuxium() for per-request Muxium creation
 * - Register Express SSR handlers via principle
 */

import { createConcept, type Concept } from 'stratimux';
import { vueName, createVueState, type VueState } from './vue.model';

import { vueRegisterRoute, type VueRegisterRoute } from './qualities/vueRegisterRoute.quality';

import { vueSSRPrinciple } from './vue.principle';

// ============================================
// QUALITY TYPE MAPPING (Explicit - NEVER typeof)
// ============================================

/**
 * VueQualities - Explicit quality type mapping
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: v0.3.2+ explicit mapping (typeof causes compilation failure)
 */
export type VueQualities = {
  vueRegisterRoute: VueRegisterRoute;
};

// ============================================
// DECK TYPE
// ============================================

/**
 * VueDeck - Deck type for Vue concept access
 *
 * Citation: STRATIMUX-REFERENCE.md - StratiDECK System
 * Pattern: Concept<State, Qualities>
 */
export type VueDeck = {
  vue: Concept<VueState, VueQualities>;
};

// ============================================
// CONCEPT FACTORY
// ============================================

/**
 * createVueConcept - Factory function for Vue SSR concept
 *
 * Citation: STRATIMUX-REFERENCE.md - Concept Composition
 * Pattern: createConcept<State, Qualities>
 */
export const createVueConcept = () =>
  createConcept(
    vueName,
    createVueState(),
    {
      vueRegisterRoute,
    },
    [vueSSRPrinciple],
  );
