/**
 * vueRegisterRoute - Route Registration Quality
 *
 * Vue SSR Concept - Server-Side Route Management
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: Payload Quality with Map management
 *
 * Purpose:
 * - Register SSR routes with tier configuration
 * - Track registered route count
 * - Routes become available for Express SSR handler
 *
 * Naming Convention: vueRegisterRoute → 'Vue Register Route'
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { VueState, PageConfig } from '../vue.model';
import type { VueRegisterRoutePayload, VueRegisterRoute } from './types';

export type { VueRegisterRoute };

export const vueRegisterRoute = createQualityCardWithPayload<VueState, VueRegisterRoutePayload>({
  type: 'Vue Register Route',
  reducer: (state, action) => {
    const { routes } = selectPayload<VueRegisterRoutePayload>(action);

    const newRoutes = new Map(state.registeredRoutes);
    let addedCount = 0;

    for (const pageConfig of routes) {
      if (newRoutes.has(pageConfig.path)) {
        console.warn(`[Vue SSR] Route already registered: ${pageConfig.path}`);
        continue;
      }

      console.log(`[Vue SSR] Registering route: ${pageConfig.path} (${pageConfig.minimumTier})`);
      newRoutes.set(pageConfig.path, pageConfig);
      addedCount++;
    }

    if (addedCount === 0) {
      return {};
    }

    return {
      registeredRoutes: newRoutes,
      routeCount: state.routeCount + addedCount,
      initialized: true,
    };
  },
});
