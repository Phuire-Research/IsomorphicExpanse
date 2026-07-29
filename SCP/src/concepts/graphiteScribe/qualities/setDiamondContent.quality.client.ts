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
  GraphiteScribeClientState,
  GraphiteScribeSetDiamondContentPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetDiamondContentPayload };

export const graphiteScribeSetDiamondContent = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetDiamondContentPayload
>({
  type: 'Suite 8 Set Diamond Content',
  reducer: (state, action) => {
    return { loadedDiamondContent: action.payload.diamondContent };
  },
  methodCreator: defaultMethodCreator,
});
