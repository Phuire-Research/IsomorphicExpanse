/*<$
For the graph programming framework Stratimux and File System Concept, generate a quality that will create a file at a target location with the specified contents.
$>*/
/*<#*/
import { ActionStrategy, muxiumConclude, createAsyncMethod, createQualityCardWithPayload, nullReducer, strategySuccess } from 'stratimux';
import fs from 'fs/promises';
import { FileSystemState } from '../fileSystem.concept';
import type { CreateContextIndexPayload } from './types';

export const fileSystemCreateFileWithContentsIndex = createQualityCardWithPayload<FileSystemState, CreateContextIndexPayload>({
  type: 'File System create File with Contents',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethod(({ controller, action }) => {
      const { path, content } = action.payload;
      if (action.strategy) {
        fs.writeFile(path, content).then(() => {
          const newStrategy = strategySuccess(action.strategy as ActionStrategy);
          controller.fire(newStrategy);
        });
      } else {
        controller.fire(muxiumConclude());
      }
    }),
});
/*#>*/
