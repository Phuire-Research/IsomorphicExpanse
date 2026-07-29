/**
 * graphiteScribeOpenFile Quality — Local Reducer (MD-CE-3 · the holding half)
 *
 * Holds a file fetched via GET /editor-fs/read (MD-CE-2) as an open buffer:
 * upserts openFiles[path], appends the tab once, and activates it. savedContent
 * mirrors content at open (a freshly opened file is never dirty). Re-opening an
 * already-open file re-activates its tab WITHOUT clobbering unsaved edits.
 *
 * Citation: setActiveTab.quality.client.ts (partial-state reducer precedent)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeOpenFilePayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeOpenFilePayload };

export const graphiteScribeOpenFile = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeOpenFilePayload
>({
  type: 'Code Editor Open File',
  reducer: (state, action) => {
    const { path, content } = action.payload;
    const existing = state.openFiles[path];
    if (existing) {
      // Already held — re-activate only; the live buffer (possibly dirty) wins.
      return { activeFilePath: path };
    }
    return {
      openFiles: {
        ...state.openFiles,
        [path]: { path, content, savedContent: content, dirty: false },
      },
      tabOrder: [...state.tabOrder, path],
      activeFilePath: path,
    };
  },
  methodCreator: defaultMethodCreator,
});
