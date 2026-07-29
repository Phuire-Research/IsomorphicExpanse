/**
 * graphiteScribeCloseFile Quality — Local Reducer (MD-CE-3 · the holding half)
 *
 * Releases a held buffer: drops openFiles[path] + its tab. When the closed file
 * was active, activation falls to the tab neighbor (the tab that now occupies the
 * closed tab's index, else the new last tab, else '' when no tabs remain).
 *
 * Citation: setActiveTab.quality.client.ts (partial-state reducer precedent)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeCloseFilePayload,
  GraphiteScribeOpenFile,
} from '../graphiteScribe.type';

export type { GraphiteScribeCloseFilePayload };

export const graphiteScribeCloseFile = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeCloseFilePayload
>({
  type: 'Code Editor Close File',
  reducer: (state, action) => {
    const { path } = action.payload;
    if (!state.openFiles[path]) {
      return {};
    }
    const openFiles: Record<string, GraphiteScribeOpenFile> = {};
    for (const key of Object.keys(state.openFiles)) {
      if (key !== path) openFiles[key] = state.openFiles[key];
    }
    const closedIndex = state.tabOrder.indexOf(path);
    const tabOrder = state.tabOrder.filter((p) => p !== path);
    if (state.activeFilePath !== path) {
      return { openFiles, tabOrder };
    }
    const activeFilePath =
      tabOrder[Math.min(closedIndex, tabOrder.length - 1)] ?? '';
    return { openFiles, tabOrder, activeFilePath };
  },
  methodCreator: defaultMethodCreator,
});
