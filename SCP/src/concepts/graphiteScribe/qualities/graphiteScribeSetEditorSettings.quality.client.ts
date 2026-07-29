/**
 * graphiteScribeSetEditorSettings Quality — Local Reducer (MD-CE-3 · the holding half)
 *
 * Partial-merge over the held settings (vim · autosave · tabSize · fontSize ·
 * wordWrap). MD-CE-6 binds the persistence rail (editorConfig.json · the
 * hifiConfig precedent); the state holds the live values.
 *
 * Citation: setActiveTab.quality.client.ts (partial-state reducer precedent)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeSetEditorSettingsPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetEditorSettingsPayload };

export const graphiteScribeSetEditorSettings = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetEditorSettingsPayload
>({
  type: 'Code Editor Set Editor Settings',
  reducer: (state, action) => {
    return {
      editorSettings: { ...state.editorSettings, ...action.payload.settings },
    };
  },
  methodCreator: defaultMethodCreator,
});
