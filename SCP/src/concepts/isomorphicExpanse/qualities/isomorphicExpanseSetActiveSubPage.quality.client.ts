/**
 * isomorphicExpanseSetActiveSubPage Quality — Local Reducer (Client) · Band A-6 HCD
 *
 * Local-only UI reducer for the IsomorphicExpanse Landing's SubPage triad selector
 * (Home · Component · Documentation). The SubPage registry lives at
 * isomorphicExpanse.subPageRegistry.ts; the v-if/v-else-if routing lives in
 * IsomorphicExpanseLanding.vue. DEFAULT = 'home'.
 *
 * SHORTEST PATH: return ONLY the changed property.
 *
 * Citation: suiteCascade/qualities/suiteCascadeSetActiveSubPage.quality.client.ts
 *           (DIRECT bearing · B-6 local UI selector).
 * Citation: MASTER-DIAMOND-ISOMORPHICEXPANSE-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetActiveSubPagePayload,
} from '../isomorphicExpanse.type';

export type { IsomorphicExpanseSetActiveSubPagePayload };

export const isomorphicExpanseSetActiveSubPage = createQualityCardWithPayload<
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetActiveSubPagePayload
>({
  type: 'Suite 8 Set Active Sub Page',
  reducer: (state, action) => {
    // SHORTEST PATH — return ONLY the changed property.
    return {
      activeSubPage: action.payload.activeSubPage,
    };
  },
  methodCreator: defaultMethodCreator,
});
