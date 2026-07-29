/*<$
For the graph programming framework Stratimux and File System Concept, generate a quality the will create the target directory if it does not exist.
$>*/
/*<#*/
import { ActionStrategy, muxiumConclude, createAsyncMethod, createQualityCardWithPayload, nullReducer, strategySuccess } from 'stratimux';
import fs from 'fs';
import { FileSystemState } from '../fileSystem.concept';

export type CreateTargetDirectoryPayload = {
  path: string;
};

export const fileSystemCreateTargetDirectory = createQualityCardWithPayload<FileSystemState, CreateTargetDirectoryPayload>({
  type: 'File System Create Target Directory',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethod(({ controller, action }) => {
      const { path } = action.payload;
      if (action.strategy) {
        if (!fs.existsSync(path)) {
          // Create directory recursively to handle nested paths
          fs.mkdirSync(path, { recursive: true });
        }
        const newStrategy = strategySuccess(action.strategy as ActionStrategy);
        controller.fire(newStrategy);
      } else {
        controller.fire(muxiumConclude());
      }
    }),
});
/*#>*/
