/**
 * setFileSystemSheet Quality — Local Reducer
 *
 * Sets the loaded file-system info-sheet rendering for the active designation
 * (e.g., concatenated Instance.md + Skill.md + auxiliary files).
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeSetFileSystemSheetPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetFileSystemSheetPayload };

export const graphiteScribeSetFileSystemSheet = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetFileSystemSheetPayload
>({
  type: 'Suite 8 Set File System Sheet',
  reducer: (state, action) => {
    return { loadedFileSystemSheet: action.payload.fileSystemSheet };
  },
  methodCreator: defaultMethodCreator,
});
