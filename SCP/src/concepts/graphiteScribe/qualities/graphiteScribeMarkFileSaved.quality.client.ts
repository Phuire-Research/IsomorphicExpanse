/**
 * graphiteScribeMarkFileSaved Quality — Local Reducer (MD-CE-3 · the holding half)
 *
 * Fires AFTER POST /editor-fs/write returns {ok:true} (MD-CE-2): the savedContent
 * mirror advances to the live buffer and dirty clears. The disk write precedes the
 * mark — never mark on dispatch (Claim-Without-Artifact at the state level).
 *
 * Citation: setActiveTab.quality.client.ts (partial-state reducer precedent)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeMarkFileSavedPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeMarkFileSavedPayload };

export const graphiteScribeMarkFileSaved = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeMarkFileSavedPayload
>({
  type: 'Code Editor Mark File Saved',
  reducer: (state, action) => {
    const { path } = action.payload;
    const held = state.openFiles[path];
    if (!held) {
      return {};
    }
    return {
      openFiles: {
        ...state.openFiles,
        [path]: { ...held, savedContent: held.content, dirty: false },
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
