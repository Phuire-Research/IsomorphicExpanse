/**
 * setActiveDesignation Quality — Local Reducer
 *
 * Sets which designation is currently being viewed/managed. Clearing previously
 * loaded content slots since they correspond to the prior active designation.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetActiveDesignationPayload,
} from '../isomorphicExpanse.type';

export type { IsomorphicExpanseSetActiveDesignationPayload };

export const isomorphicExpanseSetActiveDesignation = createQualityCardWithPayload<
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetActiveDesignationPayload
>({
  type: 'Suite 8 Set Active Designation',
  reducer: (state, action) => {
    if (state.activeDesignationName === action.payload.designationName) {
      return {};
    }
    return {
      activeDesignationName: action.payload.designationName,
      loadedDiamondContent: '',
      loadedOnyxContent: '',
      loadedBoundCascade: null,
      loadedFileSystemSheet: '',
    };
  },
  methodCreator: defaultMethodCreator,
});
