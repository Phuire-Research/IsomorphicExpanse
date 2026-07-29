/**
 * setBarVisible Quality — Client UI Reducer (Local)
 *
 * Local-only UI reducer toggling the SCS-Bridge bar visibility. No Diameter
 * routing — purely client-side UI state.
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave B
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetBarVisiblePayload,
} from '../scsBridge.type';

export type { ScsBridgeSetBarVisiblePayload };

export const scsBridgeSetBarVisible = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetBarVisiblePayload
>({
  type: 'Scs Bridge Set Bar Visible',
  reducer: (state, action) => {
    return {
      barVisible: action.payload.barVisible,
    };
  },
  methodCreator: defaultMethodCreator,
});
