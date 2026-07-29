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
  Suite8ClientState,
  Suite8SetActiveDesignationPayload,
} from '../suite8.type';

export type { Suite8SetActiveDesignationPayload };

export const suite8SetActiveDesignation = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetActiveDesignationPayload
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
