/**
 * graphiteScribeUpdateBuffer Quality — Local Reducer (MD-CE-3 · the holding half)
 *
 * The CM6 updateListener's landing: holds the live buffer text and derives dirty
 * against the savedContent mirror (dirty = content !== savedContent — typing back
 * to the saved text un-dirties without a save).
 *
 * Citation: setActiveTab.quality.client.ts (partial-state reducer precedent)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeUpdateBufferPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeUpdateBufferPayload };

export const graphiteScribeUpdateBuffer = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeUpdateBufferPayload
>({
  type: 'Code Editor Update Buffer',
  reducer: (state, action) => {
    const { path, content } = action.payload;
    const held = state.openFiles[path];
    if (!held) {
      return {};
    }
    return {
      openFiles: {
        ...state.openFiles,
        [path]: { ...held, content, dirty: content !== held.savedContent },
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
