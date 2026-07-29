/**
 * searchPattern Quality - Huirth Deployment
 *
 * Searches for regex pattern in files within target directory.
 * Uses ripgrep (rg) if available, falls back to Node.js fs.
 *
 * ASYNC QUALITY: Fires strategy success/failure on completion.
 * Multiple searches can run concurrently - no shared state.
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns"
 *
 * Type: 'Grep Search Pattern' (Verbose Split)
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
  GrepSearchPatternPayload,
  GrepSearchResult,
} from '../grep.type';
import { searchPattern as grepSearch } from '../model/grepWrapper.model';

export type GrepSearchPattern = Quality<GrepState, GrepSearchPatternPayload, GrepModelDeck>;

export const grepSearchPattern = createQualityCardWithPayload<
  GrepState,
  GrepSearchPatternPayload,
  GrepModelDeck
>({
  type: 'Grep Search Pattern',
  reducer: (state, action) => {
    // Optionally store result in state for debugging/inspection
    // The primary result flows through strategy data
    return state;
  },
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action }) => {
      const { pattern, targetDirectory, fileGlob } = action.payload;

      console.log('[Grep] Searching for pattern:', {
        pattern,
        targetDirectory,
        fileGlob,
      });

      grepSearch(pattern, targetDirectory, fileGlob)
        .then((result: GrepSearchResult) => {
          console.log('[Grep] Search complete:', {
            matchCount: result.matches.length,
            filesSearched: result.filesSearched,
          });

          if (action.strategy) {
            controller.fire(
              strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { searchResult: result })
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error: Error) => {
          console.error('[Grep] Search failed:', error);

          if (action.strategy) {
            controller.fire(
              strategyFailed(
                action.strategy,
                strategyData_appendFailure(action.strategy, `Search failed: ${error.message}`)
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
