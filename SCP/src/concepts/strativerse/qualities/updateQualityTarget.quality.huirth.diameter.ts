/**
 * updateQualityTarget Quality - Huirth Diameter (Server-side Executor)
 *
 * Performs the actual file rename to change DeploymentTarget of a quality or principle.
 * Renames file per Muxonomic naming convention to reflect new target.
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 *
 * File Naming Convention:
 * - qualityName.quality.ts                    → DeploymentTarget.All
 * - qualityName.quality.huirth.ts             → DeploymentTarget.Huirth
 * - qualityName.quality.huirth.diameter.ts    → DeploymentTarget.Huirth + Induction
 * - qualityName.quality.client.ts             → DeploymentTarget.Client
 * - qualityName.quality.client.diameter.ts    → DeploymentTarget.Client + Induction
 *
 * - principleName.principle.ts                → DeploymentTarget.All
 * - principleName.principle.huirth.ts         → DeploymentTarget.Huirth
 * - principleName.principle.client.ts         → DeploymentTarget.Client
 *
 * SCOPE: Only Managed Concepts (hasMuxonomy: true)
 *
 * Notification Bridge: Uses notifyClient to inform triggering client of file changes
 *
 * Type: 'Strativerse Update Quality Target' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  createAsyncMethodWithConcepts,
  strategySuccess,
  strategyFailed,
  strategyData_appendFailure,
  strategyData_muxifyData,
  muxiumConclude,
  type Concept,
  type MuxiumDeck,
} from 'stratimux';
import fs from 'fs/promises';
import path from 'path';
import {
  type StrativerseState,
  type TriggerUpdateTargetPayload,
  type MuxonomyModificationResult,
} from '../strativerse.type';
import {
  parseQualityFileName,
  parsePrincipleFileName,
  generateQualityFileName,
  generatePrincipleFileName,
} from '../model/fileNaming.model';
import {
  notifyClient,
  type NotificationHuirthDeck,
} from '../../notification/notification.concept.huirth';
import type { NotificationState, NotificationQualities } from '../../notification/notification.type';
import type { WebSocketServerState, WebSocketServerQualities } from '../../webSocketServer/webSocketServer.concept';
import type { StrativerseQualities } from '../strativerse.type';

/**
 * Extended Deck for updateQualityTarget with notification bridge access
 */
type UpdateQualityTargetDeck = MuxiumDeck & {
  strativerse: Concept<StrativerseState, StrativerseQualities>;
  notification: Concept<NotificationState, NotificationQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export const strativerseUpdateQualityTarget = createQualityCardWithPayload<
  StrativerseState,
  TriggerUpdateTargetPayload,
  UpdateQualityTargetDeck
>({
  type: 'Strativerse Update Quality Target',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
      const { conceptName, aspectType, aspectName, newTarget } = action.payload;

      // Extract clientStateKey for notification routing (added by WebSocket during Induction transit)
      const clientStateKey = action.strategy?.data?.clientStateKey as string | undefined;

      // Access state via deck (concepts pattern)
      const state = deck.strativerse.k.conceptList.select();

      console.log('[StratiVERSE] Update Quality Target: Executing', {
        conceptName,
        aspectType,
        aspectName,
        newTarget,
        hasClientStateKey: !!clientStateKey,
      });

      // Find concept in state
      const concept = state.concepts.find(c => c.name === conceptName);
      if (!concept) {
        const error = `Concept not found: ${conceptName}`;
        console.error('[StratiVERSE] Update Quality Target:', error);

        // Notify client of error if clientStateKey available
        if (clientStateKey) {
          notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
            message: `Error: ${error}`,
            priority: 'maroon',
          }, clientStateKey);
        }

        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Find the aspect (quality or principle)
      let currentFilePath: string;
      let currentFileName: string;
      let newFileName: string;
      let aspectDir: string;

      if (aspectType === 'quality') {
        const quality = concept.qualities.find(q => q.name === aspectName);
        if (!quality) {
          const error = `Quality not found: ${aspectName}`;
          console.error('[StratiVERSE] Update Quality Target:', error);

          // Notify client of error
          if (clientStateKey) {
            notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
              message: `Error: ${error}`,
              priority: 'maroon',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
          } else {
            controller.fire(muxiumConclude());
          }
          return;
        }

        currentFilePath = quality.filePath;
        currentFileName = quality.fileName;
        aspectDir = path.join(concept.path, 'qualities');

        // Parse current filename and generate new one
        const parsed = parseQualityFileName(currentFileName);
        newFileName = generateQualityFileName(parsed.qualityName, newTarget, parsed.diameter);

      } else {
        // Principle
        const principle = concept.principles.find(p => p.name === aspectName);
        if (!principle) {
          const error = `Principle not found: ${aspectName}`;
          console.error('[StratiVERSE] Update Quality Target:', error);

          // Notify client of error
          if (clientStateKey) {
            notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
              message: `Error: ${error}`,
              priority: 'maroon',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
          } else {
            controller.fire(muxiumConclude());
          }
          return;
        }

        currentFilePath = principle.filePath;
        currentFileName = principle.fileName;
        aspectDir = path.join(concept.path, 'principles');

        // Parse current filename and generate new one
        const parsed = parsePrincipleFileName(currentFileName);
        newFileName = generatePrincipleFileName(parsed.principleName, newTarget);
      }

      // Check if rename is needed
      if (currentFileName === newFileName) {
        console.log('[StratiVERSE] Update Quality Target: No rename needed, target unchanged');
        if (action.strategy) {
          const result: MuxonomyModificationResult = {
            success: true,
            conceptName,
            aspectName,
            oldFileName: currentFileName,
            newFileName,
          };
          controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { modificationResult: result })));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Perform the file rename
      const newFilePath = path.join(aspectDir, newFileName);

      console.log('[StratiVERSE] Update Quality Target: Renaming', {
        from: currentFilePath,
        to: newFilePath,
      });

      // Notify client that file rename is starting
      if (clientStateKey) {
        notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
          message: `Renaming ${aspectType}: ${currentFileName} → ${newFileName}`,
          priority: 'ochre',
          duration: 3000,
        }, clientStateKey);
      }

      fs.rename(currentFilePath, newFilePath)
        .then(() => {
          console.log('[StratiVERSE] Update Quality Target: Rename successful');

          const result: MuxonomyModificationResult = {
            success: true,
            conceptName,
            aspectName,
            oldFileName: currentFileName,
            newFileName,
          };

          // Notify client of success
          if (clientStateKey) {
            notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
              message: `✓ ${aspectType} target updated: ${aspectName}`,
              priority: 'viridian',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { modificationResult: result })
            ));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[StratiVERSE] Update Quality Target: Rename failed', error);

          const result: MuxonomyModificationResult = {
            success: false,
            conceptName,
            aspectName,
            oldFileName: currentFileName,
            newFileName,
            error: error.message,
          };

          // Notify client of failure
          if (clientStateKey) {
            notifyClient(concepts_, deck as unknown as NotificationHuirthDeck, {
              message: `✗ Rename failed: ${error.message}`,
              priority: 'maroon',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(strategyFailed(
              action.strategy,
              strategyData_appendFailure(action.strategy, `Update quality target failed: ${error.message}`)
            ));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
