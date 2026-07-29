/**
 * graphiteScribeSetActiveSubPage Quality — Local Reducer (Client) · Band A-6 HCD
 *
 * Local-only UI reducer for the GraphiteScribe Landing's SubPage triad selector
 * (Home · Component · Documentation). The SubPage registry lives at
 * graphiteScribe.subPageRegistry.ts; the v-if/v-else-if routing lives in
 * GraphiteScribeLanding.vue. DEFAULT = 'home'.
 *
 * SHORTEST PATH: return ONLY the changed property.
 *
 * Citation: suiteCascade/qualities/suiteCascadeSetActiveSubPage.quality.client.ts
 *           (DIRECT bearing · B-6 local UI selector).
 * Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeSetActiveSubPagePayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetActiveSubPagePayload };

export const graphiteScribeSetActiveSubPage = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetActiveSubPagePayload
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
