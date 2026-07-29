/**
 * setActiveSubPage Quality — Client UI Reducer (Local)
 *
 * Local-only UI reducer for the SCS-Bridge sub-page selector. Active pages (Cycle 157):
 * 'components' (Component Preview Page · portable concept showcase) ·
 * 'sessions' (Session Management · primary default). Sub-page registry lives at
 * scsBridge.subPageRegistry.ts; component v-if routing in ScsBridgeLanding.vue.
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave B
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetActiveSubPagePayload,
} from '../scsBridge.type';

export type { ScsBridgeSetActiveSubPagePayload };

export const scsBridgeSetActiveSubPage = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetActiveSubPagePayload
>({
  type: 'Scs Bridge Set Active Sub Page',
  reducer: (state, action) => {
    return {
      activeSubPage: action.payload.activeSubPage,
    };
  },
  methodCreator: defaultMethodCreator,
});
