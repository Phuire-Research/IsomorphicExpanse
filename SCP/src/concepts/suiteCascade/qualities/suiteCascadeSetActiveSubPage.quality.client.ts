/**
 * suiteCascadeSetActiveSubPage Quality — Local Reducer (Client) · Band B-6 HCD
 *
 * Local-only UI reducer for the SuiteCascade Landing's SubPage triad selector
 * (Home · Component · Documentation). The SubPage registry lives at
 * suiteCascade.subPageRegistry.ts; the v-if/v-else-if routing lives in
 * SuiteCascadeLanding.vue. DEFAULT = 'home'.
 *
 * SHORTEST PATH: return ONLY the changed property.
 *
 * Citation: scsBridge/qualities/setActiveSubPage.quality.client.ts (local UI selector bearing).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeState,
  SuiteCascadeSetActiveSubPagePayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetActiveSubPagePayload };

export const suiteCascadeSetActiveSubPage = createQualityCardWithPayload<
  SuiteCascadeState,
  SuiteCascadeSetActiveSubPagePayload
>({
  type: 'Suite Cascade Set Active Sub Page',
  reducer: (state, action) => {
    // SHORTEST PATH — return ONLY the changed property.
    return {
      activeSubPage: action.payload.activeSubPage,
    };
  },
  methodCreator: defaultMethodCreator,
});
