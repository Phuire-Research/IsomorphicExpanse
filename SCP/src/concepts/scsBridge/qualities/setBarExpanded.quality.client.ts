/**
 * setBarExpanded Quality — Client UI Reducer (Local)
 *
 * Local-only UI reducer toggling the SCS-Bridge bar expanded/collapsed state.
 * No Diameter routing.
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave B
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetBarExpandedPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetBarExpandedPayload };

export const scsBridgeSetBarExpanded = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetBarExpandedPayload
>({
  type: 'Scs Bridge Set Bar Expanded',
  reducer: (state, action) => {
    return {
      barExpanded: action.payload.barExpanded,
    };
  },
  methodCreator: defaultMethodCreator,
});
