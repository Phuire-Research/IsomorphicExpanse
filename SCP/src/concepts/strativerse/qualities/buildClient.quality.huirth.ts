/**
 * buildClient Quality - Huirth-only (DeploymentTarget.Huirth)
 *
 * Builds the client after Demometric Interchange completes.
 * This is Step 6 of the Demometric Interchange Manifold.
 *
 * Sends notifications back to triggering client via WebSocket:
 * - Success: "✅ Build complete" (viridian priority)
 * - Failure: "❌ Build failed" (maroon priority)
 *
 * CRITICAL: Uses notifyClient from notificationBridge.model.ts with concepts_
 * to dispatch notifications via muxiumTimeOut. This avoids closing the
 * ActionController prematurely, allowing strategySuccess to continue the chain.
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 * Citation: notification/model/notificationBridge.model.ts - muxiumTimeOut pattern
 *
 * Strategy Mode Only:
 * - Called as part of Demometric Interchange ActionStrategy
 * - Uses strategySuccess/strategyFailed for continuation
 * - strategyData carries build result and clientStateKey for routing
 *
 * Type: 'Strativerse Build Client' (Verbose Split of strativerseBuildClient)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  strategyData_appendFailure,
  strategyData_muxifyData,
  strategyFailed,
  strategySuccess,
  createAsyncMethodWithConcepts,
  muxiumConclude,
} from 'stratimux';
import type { StrativerseState, StrativerseDeck } from '../strativerse.type';
import { buildClient, getServerRootFromConceptPath, type BuildClientResult } from '../model/buildWrapper.model';
import { notifyClient, type NotificationHuirthDeck } from '../../notification/model/notificationBridge.model';

export type StrativerseBuildClientPayload = {
  conceptPath?: string; // Optional: override concept path for server root derivation
};

export type StrativerseBuildClientDataField = {
  buildResult: BuildClientResult;
};

export const strativerseBuildClient = createQualityCardWithPayload<
  StrativerseState,
  StrativerseBuildClientPayload,
  StrativerseDeck
>({
  type: 'Strativerse Build Client',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, deck, concepts_ }) => {
      // Get concept path from strategy data or payload
      // Note: strategy.data.conceptPath is set by triggerUpdateTarget
      const strategyConceptPath = action.strategy?.data?.conceptPath;
      const conceptPath: string | undefined = action.payload?.conceptPath ??
        (typeof strategyConceptPath === 'string' ? strategyConceptPath : undefined);

      // Get clientStateKey for routing notifications back to client
      const clientStateKey = action.strategy?.data?.clientStateKey as string | undefined;

      // Cast deck for notification helpers (deck includes notification and webSocketServer)
      const huirthDeck = deck as unknown as NotificationHuirthDeck;

      if (!conceptPath) {
        console.error('[StratiVERSE] Build Client: No concept path available');
        if (clientStateKey) {
          notifyClient(concepts_, huirthDeck, {
            message: '❌ Build failed: No concept path',
            priority: 'maroon',
          }, clientStateKey);
        }
        if (action.strategy) {
          controller.fire(
            strategyFailed(
              action.strategy,
              strategyData_appendFailure(action.strategy, 'No concept path available')
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      const serverRoot = getServerRootFromConceptPath(conceptPath);

      console.log('[StratiVERSE] Build Client: Starting build', {
        conceptPath,
        serverRoot,
        hasStrategy: !!action.strategy,
        hasClientStateKey: !!clientStateKey,
      });

      // Notify client that build is starting (uses muxiumTimeOut, does NOT close controller)
      if (clientStateKey) {
        notifyClient(concepts_, huirthDeck, {
          message: '🔨 Building client...',
          priority: 'cobalt',
        }, clientStateKey);
      }

      buildClient(serverRoot)
        .then((buildResult) => {
          if (action.strategy) {
            const strategy = action.strategy;

            if (buildResult.success) {
              const dataField: StrativerseBuildClientDataField = { buildResult };
              console.log('[StratiVERSE] Build Client: Success, continuing strategy', {
                duration: buildResult.duration,
              });

              // Notify client of success (uses muxiumTimeOut, does NOT close controller)
              if (clientStateKey) {
                notifyClient(concepts_, huirthDeck, {
                  message: `✅ Build complete (${Math.round(buildResult.duration / 1000)}s)`,
                  priority: 'viridian',
                }, clientStateKey);
              }

              const successAction = strategySuccess(
                strategy,
                strategyData_muxifyData(strategy, dataField)
              );
              console.log('[StratiVERSE] Build Client: Firing strategySuccess', {
                nextActionType: successAction.strategy?.currentNode?.action?.type,
                hasNextNode: !!successAction.strategy?.currentNode,
              });
              // ONLY controller.fire() call in success path - reserves controller for strategy continuation
              controller.fire(successAction);
            } else {
              console.error('[StratiVERSE] Build Client: Build failed', {
                error: buildResult.error,
                stderr: buildResult.stderr.slice(0, 500),
              });

              // Notify client of failure (uses muxiumTimeOut, does NOT close controller)
              if (clientStateKey) {
                notifyClient(concepts_, huirthDeck, {
                  message: `❌ Build failed: ${buildResult.error || 'Unknown error'}`,
                  priority: 'maroon',
                }, clientStateKey);
              }

              controller.fire(
                strategyFailed(
                  strategy,
                  strategyData_appendFailure(strategy, buildResult.error || 'Build failed')
                )
              );
            }
          } else {
            console.log('[StratiVERSE] Build Client: Standalone mode complete', {
              success: buildResult.success,
              duration: buildResult.duration,
            });
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[StratiVERSE] Build Client: Unexpected error', error);

          // Notify client of error (uses muxiumTimeOut, does NOT close controller)
          if (clientStateKey) {
            notifyClient(concepts_, huirthDeck, {
              message: `❌ Build error: ${String(error)}`,
              priority: 'maroon',
            }, clientStateKey);
          }

          if (action.strategy) {
            controller.fire(
              strategyFailed(
                action.strategy,
                strategyData_appendFailure(action.strategy, String(error))
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
