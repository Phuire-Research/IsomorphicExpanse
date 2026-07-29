/*<$
For the graph programming framework Stratimux and File System Concept, generate a quality that will remove a target directory.
$>*/
/*<#*/
import {
  ActionStrategy,
  muxiumConclude,
  createAsyncMethod,
  createQualityCardWithPayload,
  nullReducer,
  strategyData_appendFailure,
  strategyFailed,
  strategySuccess,
} from 'stratimux';
import { rimraf } from 'rimraf';
import { FileSystemState } from '../fileSystem.concept';
import { checkPathProtection, createProtectionErrorMessage } from '../pathProtection.shared';

export type RemoveTargetDirectoryPayload = {
  path: string;
};

export const fileSystemRemoveTargetDirectory = createQualityCardWithPayload<FileSystemState, RemoveTargetDirectoryPayload>({
  type: 'File System Remove Target Directory',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethod(({ controller, action }) => {
      const { path } = action.payload;
      
      if (action.strategy) {
        // Use centralized path protection model
        const protectionResult = checkPathProtection(path);
        
        if (protectionResult.isProtected) {
          const errorMessage = createProtectionErrorMessage(path, protectionResult);
          console.error('[FileSystem] BLOCKED:', errorMessage);
          controller.fire(strategyFailed(
            action.strategy, 
            strategyData_appendFailure(action.strategy, errorMessage)
          ));
        } else {
          // Safe to delete - use corrected rimraf promise handling
          rimraf(path)
            .then(() => {
              console.log('[FileSystem] Successfully removed directory:', path);
              const newStrategy = strategySuccess(action.strategy as ActionStrategy);
              controller.fire(newStrategy);
            })
            .catch((error) => {
              console.error('[FileSystem] Failed to remove directory:', path, error);
              if (action.strategy) {
                controller.fire(strategyFailed(
                  action.strategy, 
                  strategyData_appendFailure(action.strategy, `Failed to remove directory: ${error.message}`)
                ));
              } else {
                controller.fire(muxiumConclude());
              }
            });
        }
      } else {
        controller.fire(muxiumConclude());
      }
    }),
});
/*#>*/
