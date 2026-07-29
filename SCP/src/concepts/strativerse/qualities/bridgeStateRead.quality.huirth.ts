/**
 * bridgeStateRead Quality - Huirth-only (DeploymentTarget.Huirth)
 *
 * Reads the current state of .bridge-restart.json for verification.
 * This is an INFORMATIVE tool that also explains how to use the
 * related ACTIONABLE tool (bridgeRestartToggle).
 *
 * SCP Sub-Typing Pattern:
 * - toolType: 'informative' - Provides state AND explains actionables
 * - relatedActionables: ['strativerse_bridge_toggle']
 *
 * The response includes:
 * 1. Current bridge state value
 * 2. Documentation of how to use the toggle actionable
 *
 * Citation: POC-3-MUXONOMIC-SCP-BRIDGE-TOGGLE-WORKGAMEBOARD.md
 * Citation: scp.types.ts - SCPToolType, SCPQualityMetadata
 *
 * Type: 'Strativerse Bridge State Read' (Verbose Split of strativerseBridgeStateRead)
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
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * StrativerseBridgeStateReadDataField - DataField for SCP response
 *
 * Pattern: Informative tools include relatedActionables documentation
 * in their response to enable SCP expansion upon utilization.
 */
export type StrativerseBridgeStateReadDataField = {
  bridgeState: {
    currentValue: number;
    timestamp: number;
    filePath: string;
  };
  /** Documentation for related actionable tools */
  relatedActionables: {
    toolName: string;
    description: string;
    usage: string;
  }[];
};

export const strativerseBridgeStateRead = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Bridge State Read',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(async ({ controller, action }) => {
      console.log('[Bridge State Read] Quality method entered!', {
        hasStrategy: !!action.strategy,
        actionType: action.type,
      });

      // Path to toggle file at server root (NOT in src/)
      const togglePath = path.join(process.cwd(), '.bridge-restart.json');

      try {
        // Read current value
        const content = await fs.readFile(togglePath, 'utf-8');
        const current = JSON.parse(content);
        const currentValue = current.restart;

        console.log('[Bridge State Read] Current state:', {
          value: currentValue,
          path: togglePath,
        });

        // Build DataField with state AND actionable documentation
        const dataField: StrativerseBridgeStateReadDataField = {
          bridgeState: {
            currentValue,
            timestamp: Date.now(),
            filePath: togglePath,
          },
          // SCP Expansion: Explain how to use the related actionable
          relatedActionables: [
            {
              toolName: 'strativerse_bridge_toggle',
              description: 'Triggers server restart via Bridge Restart Manifold. ' +
                'Toggles the bridge state value (0→1 or 1→0), causing nodemon to restart the server. ' +
                'Client auto-refreshes on connection loss.',
              usage: 'Call with no parameters. Returns { bridgeRestart: { triggered, timestamp, previousValue, newValue } }',
            },
          ],
        };

        if (action.strategy) {
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
        console.error('[Bridge State Read] Failed to read:', error);

        // Return error state
        const errorDataField: StrativerseBridgeStateReadDataField = {
          bridgeState: {
            currentValue: -1,
            timestamp: Date.now(),
            filePath: togglePath,
          },
          relatedActionables: [
            {
              toolName: 'strativerse_bridge_toggle',
              description: 'Cannot verify toggle file. Bridge restart may not work.',
              usage: 'Ensure .bridge-restart.json exists at server root.',
            },
          ],
        };

        if (action.strategy) {
          controller.fire(
            strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, errorDataField)
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }
      }
    }),
});
