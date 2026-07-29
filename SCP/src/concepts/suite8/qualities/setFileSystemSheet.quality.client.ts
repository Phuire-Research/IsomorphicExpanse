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
  Suite8ClientState,
  Suite8SetFileSystemSheetPayload,
} from '../suite8.type';

export type { Suite8SetFileSystemSheetPayload };

export const suite8SetFileSystemSheet = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetFileSystemSheetPayload
>({
  type: 'Suite 8 Set File System Sheet',
  reducer: (state, action) => {
    return { loadedFileSystemSheet: action.payload.fileSystemSheet };
  },
  methodCreator: defaultMethodCreator,
});
