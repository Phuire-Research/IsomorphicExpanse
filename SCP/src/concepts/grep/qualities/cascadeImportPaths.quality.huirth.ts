/**
 * cascadeImportPaths Quality - Huirth Deployment
 *
 * Specialized quality for updating import paths after deployment target changes.
 * Extracts modificationResult from strategy.data and performs the cascade.
 *
 * STRATEGY DATA DEPENDENCY:
 * Expects strategy.data.modificationResult from prior updateQualityTarget:
 * - conceptName: string
 * - aspectName: string
 * - oldFileName: string (e.g., "helloWorld.quality.client.diameter.ts")
 * - newFileName: string (e.g., "helloWorld.quality.huirth.diameter.ts")
 *
 * Notification Bridge: Uses notifyClient to inform triggering client of cascade progress
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data"
 *
 * Type: 'Grep Cascade Import Paths' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  strategySuccess,
  strategyFailed,
  strategyData_muxifyData,
  strategyData_appendFailure,
  muxiumConclude,
  type Quality,
  type Concept,
  type MuxiumDeck,
} from 'stratimux';
import type {
  GrepState,
  GrepReplaceResult,
} from '../grep.type';
import { replaceInFiles } from '../model/grepWrapper.model';
import {
  notifyClient,
  type NotificationHuirthDeck,
} from '../../notification/notification.concept.huirth';
import type { NotificationState, NotificationQualities } from '../../notification/notification.type';
import type { WebSocketServerState, WebSocketServerQualities } from '../../webSocketServer/webSocketServer.concept';

/**
 * Payload contains the concept path for scoping the search
 */
export type GrepCascadeImportPathsPayload = {
  conceptPath: string;
};

/**
 * Extended Deck for cascadeImportPaths with notification bridge access
 */
type CascadeImportPathsDeck = MuxiumDeck & {
  grep: Concept<GrepState, any>;
  notification: Concept<NotificationState, NotificationQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type GrepCascadeImportPaths = Quality<GrepState, GrepCascadeImportPathsPayload, CascadeImportPathsDeck>;

/**
 * Type for modificationResult expected in strategy.data
 */
type ModificationResult = {
  success: boolean;
  conceptName: string;
  aspectName: string;
  oldFileName: string;
  newFileName: string;
  error?: string;
};

export const grepCascadeImportPaths = createQualityCardWithPayload<
  GrepState,
  GrepCascadeImportPathsPayload,
  CascadeImportPathsDeck
>({
  type: 'Grep Cascade Import Paths',
  reducer: (state) => state,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
      const { conceptPath } = action.payload;

      // Extract clientStateKey for notification routing (added by WebSocket during Induction transit)
      const clientStateKey = action.strategy?.data?.clientStateKey as string | undefined;

      // Extract file paths from strategy data
      // Supports both modificationResult (from updateQualityTarget) and direct paths (from demometric interchange)
      const modificationResult = action.strategy?.data?.modificationResult as ModificationResult | undefined;
      const strategyOldFilePath = action.strategy?.data?.oldFilePath as string | undefined;
      const strategyNewFilePath = action.strategy?.data?.newFilePath as string | undefined;
      const strategyConceptName = action.strategy?.data?.conceptName as string | undefined;

      let oldFileName: string;
      let newFileName: string;
      let conceptName: string;

      if (modificationResult?.success) {
        // Use modificationResult if available (from updateQualityTarget)
        oldFileName = modificationResult.oldFileName;
        newFileName = modificationResult.newFileName;
        conceptName = modificationResult.conceptName;
      } else if (strategyOldFilePath && strategyNewFilePath && strategyConceptName) {
        // Fall back to direct strategy data (from demometric interchange)
        // Extract filename from path (e.g., 'qualities/helloWorld.quality.huirth.diameter.ts' → 'helloWorld.quality.huirth.diameter.ts')
        oldFileName = strategyOldFilePath.split('/').pop() || strategyOldFilePath;
        newFileName = strategyNewFilePath.split('/').pop() || strategyNewFilePath;
        conceptName = strategyConceptName;
        console.log('[Grep] Using direct strategy data for cascade:', { oldFileName, newFileName, conceptName });
      } else {
        console.error('[Grep] No file path data in strategy');
        if (action.strategy) {
          controller.fire(
            strategyFailed(
              action.strategy,
              strategyData_appendFailure(action.strategy, 'No file path data in strategy')
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Derive import paths (strip .ts extension)
      const oldImportPath = oldFileName.replace(/\.ts$/, '');
      const newImportPath = newFileName.replace(/\.ts$/, '');

      // Skip if no actual change
      if (oldImportPath === newImportPath) {
        console.log('[Grep] No import path change needed');
        if (action.strategy) {
          controller.fire(strategySuccess(action.strategy));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Escape special regex characters in the path
      const escapedOldPath = oldImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Build regex pattern that matches import statements
      // Matches variations: './qualities/file', "./qualities/file", '../qualities/file'
      const searchPattern = `(from\\s+['"])(\\.\\.?\\/)?([\\w\\/]*\\/)?(${escapedOldPath})(['"])`;

      // Replacement preserves quote style and path structure
      const replaceWith = `$1$2$3${newImportPath}$5`;

      console.log('[Grep] Cascading import paths:', {
        conceptName,
        conceptPath,
        oldImportPath,
        newImportPath,
        searchPattern,
      });

      // Notify client that cascade is starting
      if (clientStateKey) {
        notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
          message: `Cascading imports: ${oldImportPath} → ${newImportPath}`,
          priority: 'amethyst',
          duration: 3000,
        }, clientStateKey);
      }

      replaceInFiles({
        searchPattern,
        replaceWith,
        targetDirectory: conceptPath,
        fileGlob: '**/*.ts',
        dryRun: false,
      })
        .then((result: GrepReplaceResult) => {
          console.log('[Grep] Import cascade complete:', {
            filesModified: result.filesModified.length,
            totalReplacements: result.totalReplacements,
          });

          // Notify client of cascade completion
          if (clientStateKey && result.totalReplacements > 0) {
            notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
              message: `✓ Updated ${result.totalReplacements} import(s) in ${result.filesModified.length} file(s)`,
              priority: 'viridian',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(
              strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { cascadeResult: result })
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error: Error) => {
          console.error('[Grep] Import cascade failed:', error);

          // Notify client of cascade failure
          if (clientStateKey) {
            notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
              message: `✗ Import cascade failed: ${error.message}`,
              priority: 'maroon',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(
              strategyFailed(
                action.strategy,
                strategyData_appendFailure(action.strategy, `Import cascade failed: ${error.message}`)
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
