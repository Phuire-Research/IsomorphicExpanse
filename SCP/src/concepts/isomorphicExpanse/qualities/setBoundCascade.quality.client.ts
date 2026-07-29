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
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetBoundCascadePayload,
} from '../isomorphicExpanse.type';

export type { IsomorphicExpanseSetBoundCascadePayload };

export const isomorphicExpanseSetBoundCascade = createQualityCardWithPayload<
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetBoundCascadePayload
>({
  type: 'Suite 8 Set Bound Cascade',
  reducer: (state, action) => {
    return { loadedBoundCascade: action.payload.boundCascade };
  },
  methodCreator: defaultMethodCreator,
});
