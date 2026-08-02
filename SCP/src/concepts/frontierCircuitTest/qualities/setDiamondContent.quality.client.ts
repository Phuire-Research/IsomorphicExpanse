/**
 * setDiamondContent Quality — Local Reducer
 *
 * Sets the loaded Diamond.md content for the active designation. D4 will wire
 * the corresponding Diametric Induction to trigger a file-system read on the
 * server.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  FrontierCircuitTestClientState,
  FrontierCircuitTestSetDiamondContentPayload,
} from '../frontierCircuitTest.type';

export type { FrontierCircuitTestSetDiamondContentPayload };

export const frontierCircuitTestSetDiamondContent = createQualityCardWithPayload<
  FrontierCircuitTestClientState,
  FrontierCircuitTestSetDiamondContentPayload
>({
  type: 'Suite 8 Set Diamond Content',
  reducer: (state, action) => {
    return { loadedDiamondContent: action.payload.diamondContent };
  },
  methodCreator: defaultMethodCreator,
});
