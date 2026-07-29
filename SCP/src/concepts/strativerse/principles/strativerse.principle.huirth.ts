import { strategyBegin } from 'stratimux';
import type { StrativersePrinciple } from '../strativerse.concept';
import { createStrativerseInitializationStrategy } from '../strategies/initialization.strategy.huirth';
import { findRoot } from '../../fileSystem/model/findRoot';

/**
 * StratiVERSE Principle - Recurrent Concept Scanning
 *
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 * Citation: CLAUDE.md "Throttle vs SetStage Stage Options Pattern"
 *
 * Stage Flow:
 * - Stage 0: Initial scan dispatch → setStage: 1 to move to monitoring
 * - Stage 1: Beat-based monitoring, re-scan when interval exceeded
 *
 * A→B→Y→Z Manifold (NO FILE WRITES):
 * 1. scanConcepts → muxifies { concepts, lastScan, scanPath } to StrategyData
 * 2. setConceptList → extracts from StrategyData, updates state (MEMORY ONLY)
 * 3. broadcastConceptList → sends to all clients via WebSocket
 *
 * CRITICAL: Registry generation (muxonomyRegistry.generated.ts) is CLIENT-TRIGGERED
 * via button press, NOT part of this automatic flow. File writes would trigger
 * Nodemon restart loops. Client reconnects and resyncs after server restart.
 *
 * Safety: Stage 1 uses beat: 30000 (30 seconds) with throttle: 0 for recurrence
 *
 * Phase 5 Fix: scanPath is determined at SERVER initialization time using findRoot()
 * The Node.js dependency (findRoot) stays in the principle which is server-only.
 */

const SCAN_INTERVAL_MS = 60000; // Re-scan every 60 seconds

export const strativersePrinciple: StrativersePrinciple = ({ d_, k_, plan }) => {
  console.log('[StratiVERSE] Principle started');

  // Phase 5 Fix: Determine scanPath at SERVER initialization time
  // This keeps Node.js dependencies (findRoot uses process/path) in the principle
  // which is server-only and never bundled into client islands
  const root = findRoot();
  const scanPath = `${root}/src/concepts`;
  console.log('[StratiVERSE] Computed scanPath:', scanPath);

  return plan('StratiVERSE Recurrent Scan', ({ stage, conclude }) => [
    // Stage 0: Initial scan
    stage(({ d, dispatch }) => {
      console.log('[StratiVERSE] Stage 0: Beginning initial concept scan');

      const initStrategy = createStrativerseInitializationStrategy(d, scanPath);

      if (initStrategy) {
        console.log('[StratiVERSE] Dispatching initialization strategy');
        dispatch(strategyBegin(initStrategy), { setStage: 1 });
      } else {
        console.error('[StratiVERSE] Failed to create initialization strategy');
        dispatch(d_.muxium.e.muxiumKick(), { setStage: 1 });
      }
    }),

    // Stage 1: Recurrent monitoring with beat
    stage(({ d, dispatch }) => {
      const conceptList = k_.conceptList.select();
      const lastScan = conceptList.lastScan;
      const timeSinceScan = Date.now() - lastScan;

      if (timeSinceScan > SCAN_INTERVAL_MS) {
        console.log('[StratiVERSE] Stage 1: Re-scanning concepts (interval exceeded)');

        const rescanStrategy = createStrativerseInitializationStrategy(d, scanPath);

        if (rescanStrategy) {
          dispatch(strategyBegin(rescanStrategy), { throttle: 0 });
        } else {
          dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
        }
      } else {
        // Keep monitoring, recur in same stage
        dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
      }
    }, { beat: 30000 }), // Check every 30 seconds (beat provides safety for throttle: 0)

    conclude()
  ]);
};
