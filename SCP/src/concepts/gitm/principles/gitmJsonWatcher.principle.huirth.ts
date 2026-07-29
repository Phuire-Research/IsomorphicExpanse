/**
 * gitmJsonWatcher Principle — Huirth Deployment (STCP · FT-006 dir-watch arm + C1 first-load)
 *
 * The gitm concept's STCP dir-watch arm — a clone of the cadmium topics watcher arm
 * (NOT the bolt-on hand-rolled chokidar). Uses createStcpComponentRelay(GITM_RELAY_CONFIG)
 * closures:
 *   - readAndDispatchSbis(nextA) → C1 first-load hydration (the armDirectoryWatch helper
 *     hardcodes ignoreInitial:true, so an ALREADY-PRESENT gitm.json on bridge-restart is
 *     NOT hydrated by the arm alone · the one-shot read covers it · ENOENT → null).
 *   - armDirectoryWatch(nextA) → FT-006 STCP arm; chokidar on dirname(jsonPath);
 *     basename-filtered (inode-swap-safe); add/change → SBIS Base→Relay; unlink → JDIS Idle.
 *
 * This principle's OWN helper instance (independent lastIdentity + own FSWatcher handle).
 * The gitmStcpRelay principle builds a SEPARATE instance from the same config (independent
 * identity guard · SMRP/BOCR never watch the disk).
 *
 * HAZARD-A cleanup order on conclude: watcher → plan.conclude() (no timer in the STCP arm ·
 * the helper owns its own debounce internally via awaitWriteFinish).
 *
 * Citation: cadmiumOkMonitor.principle.huirth.ts:660-670 (topics arm + readAndDispatchSbis).
 * Citation: stcpComponentRelay.model.ts (armDirectoryWatch / readAndDispatchSbis closures).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W2 gitmJsonWatcher.
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { type FSWatcher } from 'chokidar';
import type {
  GitmHuirthState,
  GitmHuirthQualities,
  GitmJsonShape,
} from '../gitm.type';
import { createStcpComponentRelay } from '../../../model/stcpComponentRelay.model';
import { GITM_RELAY_CONFIG } from '../gitmRelay.config';

export type GitmJsonWatcherDeck = MuxiumDeck & {
  gitm: Concept<GitmHuirthState, GitmHuirthQualities>;
};

export type GitmJsonWatcherPrincipleType = PrincipleFunction<
  GitmHuirthQualities,
  GitmJsonWatcherDeck,
  GitmHuirthState
>;

export const gitmJsonWatcherPrinciple: GitmJsonWatcherPrincipleType = ({ plan, nextA }) => {
  console.log('[GITM JSON Watcher] Principle started');

  // This principle's OWN helper instance (independent lastIdentity + own FSWatcher).
  const gitmRelay = createStcpComponentRelay<GitmJsonShape | null>(GITM_RELAY_CONFIG);
  let gitmWatcher: FSWatcher | null = null;

  const watcherPlan = plan('GITM JSON Watcher (Huirth · STCP arm + C1)', ({ stage }) => [
    // Stage 1 · C1 first-load hydration — read gitm.json now and dispatch SBIS Base→Relay
    // (no-op if absent · ENOENT → null). Covers the ALREADY-PRESENT-on-restart gap the
    // arm's ignoreInitial:true leaves. BOCR then backfills late-joining clients.
    stage(({ d, dispatch }) => {
      void gitmRelay.readAndDispatchSbis(nextA);
      dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
    }, { beat: 1 }),
    // Stage 2 · FT-006 STCP arm — chokidar on dirname(jsonPath) · basename-filtered ·
    // add/change → SBIS · unlink → JDIS Idle. Idempotent guard: arm only once.
    stage(({ d, dispatch }) => {
      if (!gitmWatcher) {
        gitmWatcher = gitmRelay.armDirectoryWatch(nextA);
      }
      dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
    }, {}),
    stage(({ stagePlanner }) => { stagePlanner.conclude(); }, {}),
  ]);

  // Cleanup return — HAZARD-A mitigation: watcher → plan.conclude().
  return () => {
    console.log('[GITM JSON Watcher] Principle cleanup');
    if (gitmWatcher) {
      try {
        gitmWatcher.close();
      } catch {
        /* watcher already closed */
      }
    }
    watcherPlan.conclude();
  };
};
