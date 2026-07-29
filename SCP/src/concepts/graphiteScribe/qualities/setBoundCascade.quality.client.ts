/**
 * setBoundCascade Quality — Local Reducer
 *
 * Sets the loaded BoundCascade.json content (per-designation Cascade.json) for
 * the active designation.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeSetBoundCascadePayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetBoundCascadePayload };

export const graphiteScribeSetBoundCascade = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetBoundCascadePayload
>({
  type: 'Suite 8 Set Bound Cascade',
  reducer: (state, action) => {
    return { loadedBoundCascade: action.payload.boundCascade };
  },
  methodCreator: defaultMethodCreator,
});
