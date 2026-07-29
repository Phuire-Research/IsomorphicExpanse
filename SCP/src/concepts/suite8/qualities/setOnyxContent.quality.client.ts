/**
 * setOnyxContent Quality — Local Reducer
 *
 * Sets the loaded Onyx.md content for the active designation.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  Suite8ClientState,
  Suite8SetOnyxContentPayload,
} from '../suite8.type';

export type { Suite8SetOnyxContentPayload };

export const suite8SetOnyxContent = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetOnyxContentPayload
>({
  type: 'Suite 8 Set Onyx Content',
  reducer: (state, action) => {
    return { loadedOnyxContent: action.payload.onyxContent };
  },
  methodCreator: defaultMethodCreator,
});
