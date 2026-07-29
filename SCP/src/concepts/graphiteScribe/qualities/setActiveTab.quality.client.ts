/**
 * setActiveTab Quality — Local Reducer
 *
 * Toggles between the 3 Suite 8 Page tabs (info · doviewer · settings).
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeSetActiveTabPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetActiveTabPayload };

export const graphiteScribeSetActiveTab = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetActiveTabPayload
>({
  type: 'Suite 8 Set Active Tab',
  reducer: (state, action) => {
    return { activeTab: action.payload.tab };
  },
  methodCreator: defaultMethodCreator,
});
