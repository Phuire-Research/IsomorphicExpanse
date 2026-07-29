/**
 * cadmiumSetDesignationName Quality — Local Reducer
 *
 * Sets the Cadmium-as-Suite-8 designation name pointer. Used to bind this
 * Cadmium instance to a specific Suite 8 designation registered in suite8
 * concept (sister-concept Tier-2 access pattern · SBASC).
 *
 * Citation: DIAMOND-TIER-M1-A2-D1.md · Wave F
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetDesignationNamePayload,
} from '../cadmium.type';

export type { CadmiumSetDesignationNamePayload };

export const cadmiumSetDesignationName = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetDesignationNamePayload
>({
  type: 'Cadmium Set Designation Name',
  reducer: (state, action) => {
    return { cadmiumDesignationName: action.payload.designationName };
  },
  methodCreator: defaultMethodCreator,
});
