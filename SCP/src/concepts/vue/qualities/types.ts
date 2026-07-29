/**
 * Vue SSR Quality Types
 *
 * Type definitions for Vue SSR concept qualities.
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Type Definition Pattern
 * Pattern: Explicit types for payload and quality exports
 */

import type { Quality } from 'stratimux';
import type { VueState, PageConfig } from '../vue.model';

// ============================================
// vueRegisterRoute
// ============================================

/**
 * VueRegisterRoutePayload - Payload for route registration
 *
 * Can register single route or batch of routes
 * Sets initialized: true when routes are registered
 */
export type VueRegisterRoutePayload = {
  routes: PageConfig[];
};

export type VueRegisterRoute = Quality<VueState, VueRegisterRoutePayload>;
