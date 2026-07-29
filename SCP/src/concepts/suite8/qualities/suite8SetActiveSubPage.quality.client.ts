/**
 * suite8SetActiveSubPage Quality — Local Reducer (Client) · Band A-6 HCD
 *
 * Local-only UI reducer for the Suite8 Landing's SubPage triad selector
 * (Home · Component · Documentation). The SubPage registry lives at
 * suite8.subPageRegistry.ts; the v-if/v-else-if routing lives in
 * Suite8Landing.vue. DEFAULT = 'home'.
 *
 * SHORTEST PATH: return ONLY the changed property.
 *
 * Citation: suiteCascade/qualities/suiteCascadeSetActiveSubPage.quality.client.ts
 *           (DIRECT bearing · B-6 local UI selector).
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  Suite8ClientState,
  Suite8SetActiveSubPagePayload,
} from '../suite8.type';

export type { Suite8SetActiveSubPagePayload };

export const suite8SetActiveSubPage = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetActiveSubPagePayload
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
