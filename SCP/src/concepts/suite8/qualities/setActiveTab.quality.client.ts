/**
 * setActiveTab Quality — Local Reducer
 *
 * Toggles between the 3 Suite 8 Page tabs (info · doviewer · settings).
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  Suite8ClientState,
  Suite8SetActiveTabPayload,
} from '../suite8.type';

export type { Suite8SetActiveTabPayload };

export const suite8SetActiveTab = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetActiveTabPayload
>({
  type: 'Suite 8 Set Active Tab',
  reducer: (state, action) => {
    return { activeTab: action.payload.tab };
  },
  methodCreator: defaultMethodCreator,
});
