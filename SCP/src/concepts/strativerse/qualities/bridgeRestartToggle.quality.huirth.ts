/**
 * bridgeRestartToggle Quality - Huirth-only (DeploymentTarget.Huirth)
 *
 * Triggers server restart by toggling the .bridge-restart.json file.
 * This is the FINAL step of the Demometric Interchange Manifold.
 *
 * The Bridge Restart Pattern:
 * 1. Toggle file value (0↔1) in /.bridge-restart.json
 * 2. Nodemon detects change and restarts server
 * 3. Client detects connection close
 * 4. Client pings /mcp until server responds
 * 5. Client executes window.location.reload()
 * 6. Client reconnects with stored clientStateId
 *
 * CRITICAL: Nodemon watches ONLY .bridge-restart.json (NOT src directory)
 * This allows the interchange manifold to complete all file modifications
 * before triggering restart.
 *
 * CRITICAL: Uses notifyClient from notificationBridge.model.ts with concepts_
 * to dispatch notifications via muxiumTimeOut. This avoids closing the
 * ActionController prematurely, allowing strategySuccess to fire correctly.
 *
 * Citation: BRIDGE-RESTART-MANIFOLD-SPECIFICATION.md
 * Citation: POC-2-6-FORWARD-PASS-SUITE-7.md
 * Citation: notification/model/notificationBridge.model.ts - muxiumTimeOut pattern
 *
 * Type: 'Strativerse Bridge Restart Toggle' (Verbose Split of strativerseBridgeRestartToggle)
 */
import {
  createQualityCard,
  nullReducer,
  strategyData_muxifyData,
  strategySuccess,
  createAsyncMethodWithConcepts,
  muxiumConclude,
} from 'stratimux';
import type {
  StrativerseState,
  StrativerseDeck,
} from '../strativerse.type';
import { notifyClient, type NotificationHuirthDeck } from '../../notification/model/notificationBridge.model';
import * as fs from 'fs/promises';
import * as path from 'path';

export type StrativerseBridgeRestartToggleDataField = {
  bridgeRestart: {
    triggered: boolean;
    timestamp: number;
    previousValue: number;
    newValue: number;
  };
};

export const strativerseBridgeRestartToggle = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Bridge Restart Toggle',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(async ({ controller, action, deck, concepts_ }) => {
      console.log('[Bridge Restart] Quality method entered!', {
        hasStrategy: !!action.strategy,
        actionType: action.type,
      });

      // Path to toggle file at server root (NOT in src/)
      const togglePath = path.join(process.cwd(), '.bridge-restart.json');

      // Get clientStateKey for routing notifications back to client
      const clientStateKey = action.strategy?.data?.clientStateKey as string | undefined;

      // Cast deck for notification helpers (deck includes notification and webSocketServer)
      const huirthDeck = deck as unknown as NotificationHuirthDeck;

      try {
        // Read current value
        const content = await fs.readFile(togglePath, 'utf-8');
        const current = JSON.parse(content);
        const previousValue = current.restart;

        // Toggle value
        const newValue = previousValue === 0 ? 1 : 0;

        // Write new value
        await fs.writeFile(
          togglePath,
          JSON.stringify({ restart: newValue }, null, 2),
          'utf-8'
        );

        console.log('[Bridge Restart] Toggle written:', {
          previous: previousValue,
          new: newValue,
        });

        // Notify client that restart is imminent (uses muxiumTimeOut, does NOT close controller)
        if (clientStateKey) {
          notifyClient(concepts_, huirthDeck, {
            message: '🔄 Server restarting... Please wait.',
            priority: 'amethyst',
          }, clientStateKey);
        }

        console.log('[Bridge Restart] Server will restart momentarily...');

        // Strategy succeeds (though server will restart before next step executes)
        if (action.strategy) {
          const dataField: StrativerseBridgeRestartToggleDataField = {
            bridgeRestart: {
              triggered: true,
              timestamp: Date.now(),
              previousValue,
              newValue,
            },
          };

          // ONLY controller.fire() call - reserves controller for strategy continuation
          controller.fire(
            strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, dataField)
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }
      } catch (error) {
        console.error('[Bridge Restart] Failed to toggle:', error);

        // Notify client of failure (uses muxiumTimeOut, does NOT close controller)
        if (clientStateKey) {
          notifyClient(concepts_, huirthDeck, {
            message: `❌ Bridge restart failed: ${String(error)}`,
            priority: 'maroon',
          }, clientStateKey);
        }

        // Strategy succeeds anyway - we don't want to block the entire interchange
        // The file write failure shouldn't prevent the rest of the system from working
        if (action.strategy) {
          controller.fire(strategySuccess(action.strategy));
        } else {
          controller.fire(muxiumConclude());
        }
      }
    }),
});
