/**
 * setOnyxContent Quality — Local Reducer
 *
 * Sets the loaded Onyx.md content for the active designation.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  FrontierCircuitTestClientState,
  FrontierCircuitTestSetOnyxContentPayload,
} from '../frontierCircuitTest.type';

export type { FrontierCircuitTestSetOnyxContentPayload };

export const frontierCircuitTestSetOnyxContent = createQualityCardWithPayload<
  FrontierCircuitTestClientState,
  FrontierCircuitTestSetOnyxContentPayload
>({
  type: 'Suite 8 Set Onyx Content',
  reducer: (state, action) => {
    return { loadedOnyxContent: action.payload.onyxContent };
  },
  methodCreator: defaultMethodCreator,
});
