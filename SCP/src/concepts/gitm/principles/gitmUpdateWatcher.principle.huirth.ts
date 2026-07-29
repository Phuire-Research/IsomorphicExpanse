/**
 * gitmUpdateWatcher Principle — Huirth Deployment (STCP · dir-watch arm + C1 · D-U4.2 · Fork A·β)
 *
 * The gitm concept's SECOND STCP dir-watch arm — a faithful clone of gitmJsonWatcher, but for
 * the HEAVY scp-update-diff/-resolved.<name>.json bodies (OFF gitm.json's per-change broadcast).
 * Arms TWO createStcpComponentRelay instances (one per basename · diff + resolved) — the SAME
 * single-watcher arming gitmJsonWatcher uses, doubled. Each instance:
 *   - readAndDispatchSbis(nextA) → C1 first-load hydration (the arm hardcodes ignoreInitial:true,
 *     so an ALREADY-PRESENT body on bridge-restart is covered by the one-shot read · ENOENT → null).
 *   - armDirectoryWatch(nextA) → STCP arm; chokidar on dirname(jsonPath); basename-filtered
 *     (inode-swap-safe); add/change → SBIS Base→Relay; unlink → JDIS Idle.
 *
 * This principle's OWN helper instances (independent lastIdentity + own FSWatcher handles · the
 * gitmStcpRelay principle builds SEPARATE instances; SMRP/BOCR never watch the disk). Until
 * D-U4.3 writes the diff/resolved files, both arms find nothing → null state → INERT (zero
 * visible change · the watcher stays armed for the first write).
 *
 * HAZARD-A cleanup order on conclude: watchers → plan.conclude() (no timer in the STCP arm ·
 * the helper owns its own debounce internally via awaitWriteFinish).
 *
 * Citation: gitmJsonWatcher.principle.huirth.ts (the topics arm + readAndDispatchSbis · clone).
 * Citation: stcpComponentRelay.model.ts (armDirectoryWatch / readAndDispatchSbis closures).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.2 gitmUpdateWatcher.
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { type FSWatcher } from 'chokidar';
import type {
  GitmHuirthState,
  GitmHuirthQualities,
} from '../gitm.type';
import type { UpdateDiffShape, UpdateResolvedShape } from '../gitmUpdate.type';
import { createStcpComponentRelay } from '../../../model/stcpComponentRelay.model';
import {
  GITM_UPDATE_DIFF_RELAY_CONFIG,
  GITM_UPDATE_RESOLVED_RELAY_CONFIG,
} from '../gitmUpdateRelay.config';

export type GitmUpdateWatcherDeck = MuxiumDeck & {
  gitm: Concept<GitmHuirthState, GitmHuirthQualities>;
};

export type GitmUpdateWatcherPrincipleType = PrincipleFunction<
  GitmHuirthQualities,
  GitmUpdateWatcherDeck,
  GitmHuirthState
>;

export const gitmUpdateWatcherPrinciple: GitmUpdateWatcherPrincipleType = ({ plan, nextA }) => {
  console.log('[GITM Update Watcher] Principle started');

  // This principle's OWN helper instances (independent lastIdentity + own FSWatchers · one per
  // basename · diff + resolved). Configs single-source from gitmUpdateRelay.config.ts.
  const diffRelay = createStcpComponentRelay<UpdateDiffShape | null>(GITM_UPDATE_DIFF_RELAY_CONFIG);
  const resolvedRelay = createStcpComponentRelay<UpdateResolvedShape | null>(
    GITM_UPDATE_RESOLVED_RELAY_CONFIG,
  );
  let diffWatcher: FSWatcher | null = null;
  let resolvedWatcher: FSWatcher | null = null;

  const watcherPlan = plan('GITM Update Watcher (Huirth · STCP arm + C1)', ({ stage }) => [
    // Stage 1 · C1 first-load hydration — read BOTH bodies now and dispatch SBIS Base→Relay
    // (no-op if absent · ENOENT → null). Covers the ALREADY-PRESENT-on-restart gap the arms'
    // ignoreInitial:true leave. BOCR (gitmStcpRelay) backfills late-joining clients.
    stage(({ d, dispatch }) => {
      void diffRelay.readAndDispatchSbis(nextA);
      void resolvedRelay.readAndDispatchSbis(nextA);
      dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
    }, { beat: 1 }),
    // Stage 2 · STCP arm — chokidar on dirname(jsonPath) · basename-filtered · add/change →
    // SBIS · unlink → JDIS Idle. Idempotent guard: arm each only once.
    stage(({ d, dispatch }) => {
      if (!diffWatcher) {
        diffWatcher = diffRelay.armDirectoryWatch(nextA);
      }
      if (!resolvedWatcher) {
        resolvedWatcher = resolvedRelay.armDirectoryWatch(nextA);
      }
      dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
    }, {}),
    stage(({ stagePlanner }) => { stagePlanner.conclude(); }, {}),
  ]);

  // Cleanup return — HAZARD-A mitigation: watchers → plan.conclude().
  return () => {
    console.log('[GITM Update Watcher] Principle cleanup');
    if (diffWatcher) {
      try {
        diffWatcher.close();
      } catch {
        /* watcher already closed */
      }
    }
    if (resolvedWatcher) {
      try {
        resolvedWatcher.close();
      } catch {
        /* watcher already closed */
      }
    }
    watcherPlan.conclude();
  };
};
