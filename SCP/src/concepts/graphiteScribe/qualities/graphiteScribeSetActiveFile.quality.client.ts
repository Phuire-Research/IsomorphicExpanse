/**
 * graphiteScribeSetActiveFile Quality — Local Reducer (MD-CE-3 · the holding half)
 *
 * Tab activation. Guarded: only a HELD path activates (an unknown path is a
 * no-op {} — the shortest-path return).
 *
 * Citation: setActiveTab.quality.client.ts (partial-state reducer precedent)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeSetActiveFilePayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetActiveFilePayload };

export const graphiteScribeSetActiveFile = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetActiveFilePayload
>({
  type: 'Code Editor Set Active File',
  reducer: (state, action) => {
    const { path } = action.payload;
    if (!state.openFiles[path]) {
      return {};
    }
    return { activeFilePath: path };
  },
  methodCreator: defaultMethodCreator,
});
