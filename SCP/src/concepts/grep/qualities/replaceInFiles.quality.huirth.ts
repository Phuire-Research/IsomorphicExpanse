/**
 * replaceInFiles Quality - Huirth Deployment
 *
 * Replaces regex pattern in files within target directory.
 * Performs atomic file updates - read, replace, write.
 *
 * ASYNC QUALITY: Fires strategy success/failure on completion.
 * Multiple replacements can run concurrently - no shared state.
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 *
 * Type: 'Grep Replace In Files' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  createAsyncMethodWithState,
  strategySuccess,
  strategyFailed,
  strategyData_muxifyData,
  strategyData_appendFailure,
  muxiumConclude,
} from 'stratimux';
import type { Quality } from 'stratimux';
import type {
  GrepState,
  GrepModelDeck,
  GrepReplaceInFilesPayload,
  GrepReplaceResult,
} from '../grep.type';
import { replaceInFiles as grepReplace } from '../model/grepWrapper.model';

export type GrepReplaceInFiles = Quality<GrepState, GrepReplaceInFilesPayload, GrepModelDeck>;

export const grepReplaceInFiles = createQualityCardWithPayload<
  GrepState,
  GrepReplaceInFilesPayload,
  GrepModelDeck
>({
  type: 'Grep Replace In Files',
  reducer: (state, action) => {
    // Optionally store result in state for debugging/inspection
    // The primary result flows through strategy data
    return state;
  },
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action }) => {
      const request = action.payload;

      console.log('[Grep] Replacing in files:', {
        searchPattern: request.searchPattern,
        replaceWith: request.replaceWith,
        targetDirectory: request.targetDirectory,
        fileGlob: request.fileGlob,
        dryRun: request.dryRun,
      });

      grepReplace(request)
        .then((result: GrepReplaceResult) => {
          console.log('[Grep] Replace complete:', {
            filesModified: result.filesModified.length,
            totalReplacements: result.totalReplacements,
            errors: result.errors.length,
            dryRun: result.dryRun,
          });

          if (action.strategy) {
            controller.fire(
              strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { replaceResult: result })
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error: Error) => {
          console.error('[Grep] Replace failed:', error);

          if (action.strategy) {
            controller.fire(
              strategyFailed(
                action.strategy,
                strategyData_appendFailure(action.strategy, `Replace failed: ${error.message}`)
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
