/**
 * suite8MenuWatch.principle.huirth.ts — the N-designation menu.json dir-watch (PRE-EPOCH · WPS)
 *
 * GENERALIZED from the scalar single-watcher: the Template needs ONE menu dir-watch arm PER
 * registered Suite 8 designation (WPS · Watcher-Per-Suite-8). Each designation's Anchor writes its
 * own menu.json under Cascades/Extended/{name}/; this principle arms ONE FSWatcher per designation,
 * held in a Map<designation, FSWatcher> for teardown (S4 Seam 4 · the no-leak invariant).
 *
 * Designation source: KNOWN_SUITE8_ENTRIES (the MPRF seed · the SAME authoritative list that seeds
 * the client `suite8s` Record at boot). The Huirth suite8 concept carries NO `suite8s` Record (it is
 * client-only registration), so the server-side N-watcher reads the pure-model seed directly — zero
 * Stratimux imports, importable into this Huirth principle.
 *
 * IE-D4 · CREATE-S8 DYNAMIC LINKAGE — the former STATIC-AT-BOOT LIMITATION is now closed. The boot
 * set is STILL seeded from KNOWN_SUITE8_ENTRIES (the MPRF seed), but a chokidar depth-0 `addDir` watch
 * on Cascades/Extended/ now ARMS a menu watcher for any designation dir forged AFTER boot (a runtime
 * mint/forge). This mirrors the proven extendedCascadeAutoRegistration addDir pattern (:182-201) —
 * idempotent (never re-arms a designation already in the Map), never-throws (arm failure = skip +
 * telemetry), depth 0 (only the immediate Extended/<name> designations). The designation source is
 * therefore the FILE SYSTEM (the dirs actually present) UNION the boot seed — not the un-relayed
 * Huirth `suite8s` Record. A dir with no menu.json arms a watcher that hydrates the moment one lands.
 *
 * Each watcher's helper (createStcpComponentRelay<MenuDocument>(createSuite8DesignationRelayConfig(name)))
 * owns add/change→SBIS Base→Relay + unlink→JDIS Idle internally; the SBIS dispatch carries the
 * designation key (the keyed Base suite8SetDesignationMenuStageHuirthBase FIRST, then the keyed relay
 * suite8SetDesignationMenuStage). Dispatch is via `nextA` (async-safe action-queue append).
 *
 * FT-006 CONCLUDING STAGE PATTERN (MANDATORY · stratimux 0.3.295): the bootstrap plan's iterateStage
 * MUST land on a concluding stage — advancing past a single-stage plan crashes boot (plan.stages[1]
 * undefined → notification read .firstRun of undefined). The arm loop runs in Stage 1; the iterate
 * lands on the concluding Stage 2; the chokidar watchers + nextA pipes persist in the closure.
 *
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 4 (Map<string,FSWatcher> teardown · FT-006).
 * Citation: PRE-EPOCH-S6-PURPLE-COMPOSITION.md §Wave 2 (the N-watcher Map + designation source).
 * Citation: suite8Registration.model.ts KNOWN_SUITE8_ENTRIES (the boot designation seed).
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { appendFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type {
  Suite8HuirthState,
  Suite8HuirthQualities,
} from '../suite8.type';
import type { MenuDocument } from '../../../model/shatteriteMenu.model';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import { createStcpComponentRelay } from '../../../model/stcpComponentRelay.model';
import { createSuite8DesignationRelayConfig } from '../suite8MenuRelay.config';
import { KNOWN_SUITE8_ENTRIES } from '../model/suite8Registration.model';

export type Suite8MenuWatchDeck = MuxiumDeck & {
  suite8: Concept<Suite8HuirthState, Suite8HuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type Suite8MenuWatchPrincipleType = PrincipleFunction<
  Suite8HuirthQualities,
  Suite8MenuWatchDeck,
  Suite8HuirthState
>;

// IE-D4 · path resolution for the live addDir watch (mirrors the extendedCascadeAutoRegistration
// SCS_ROOT discipline · resolve Cascades/Extended against process.cwd() = the SCP package dir). The
// live watch arms menu watchers for designations forged AFTER boot.
const EXTENDED_ROOT_ABS = path.resolve(process.cwd(), 'Cascades', 'Extended');
// Light debounce (ms) so a burst of Forge writes into Extended/ (mkdir then seed) settles into one
// arm sweep rather than re-firing per intermediate event.
const MENU_ADDDIR_DEBOUNCE_MS = 250;

// 3A (C756) · FILE-SUNK TELEMETRY — the console.logs below pipe into nodemon and are LOST to any
// drive (the C738 class: the menu circuit's arm state was UNOBSERVABLE in the Frontier Hello World
// diagnostic). Every seat ALSO appends a JSONL line to the SCP-local Bridge rail so a drive can
// Conclude (grep) whether the principle booted, armed, swept, and hydrated. ADDITIVE — the
// console.logs stay. Never-throw + the 2MB skip-guard (the C740 suitecascade-watcher idiom,
// mirrored verbatim).
const MENU_WATCH_SINK_MAX_BYTES = 2 * 1024 * 1024;
const MENU_WATCH_SINK_PATH = path.resolve(
  process.cwd(),
  'Cascades',
  'Bridge',
  'suite8-menu-watch.json',
);
const sinkMenuWatchTelemetry = (seat: string, detail: Record<string, unknown> = {}): void => {
  try {
    mkdirSync(path.dirname(MENU_WATCH_SINK_PATH), { recursive: true });
    try {
      if (statSync(MENU_WATCH_SINK_PATH).size > MENU_WATCH_SINK_MAX_BYTES) {
        return; // sink over the 2MB cap · skip{sink-cap} · never rotate here, never throw.
      }
    } catch {
      /* sink absent · the first append creates it */
    }
    appendFileSync(
      MENU_WATCH_SINK_PATH,
      JSON.stringify({ ts: new Date().toISOString(), seat, ...detail }) + '\n',
      'utf8',
    );
  } catch {
    /* telemetry must never harm the watcher · skip */
  }
};

export const suite8MenuWatchPrinciple: Suite8MenuWatchPrincipleType = ({ plan, nextA }) => {
  console.log('[Suite8 MenuWatch] Principle started · N-designation menu.json dir-watch (WPS)');
  sinkMenuWatchTelemetry('principle-start', { extendedRoot: EXTENDED_ROOT_ABS });

  // WPS · one FSWatcher per registered designation, keyed by Name (NDEP). The Map is the teardown
  // ledger — the cleanup function closes EVERY handle (S4 Seam 4 · no-leak invariant).
  const watcherMap = new Map<string, FSWatcher>();
  // IE-D4 · the live Extended dir-watch handle + its debounce timer (Principle-scope · closed in cleanup).
  let extendedDirWatcher: FSWatcher | null = null;
  let addDirDebounceTimer: NodeJS.Timeout | null = null;

  // Arm ONE designation's menu.json watch (idempotent · skips a designation already in the Map).
  // Reusable by the boot seed, the FS sweep, and the live addDir handler. NEVER throws (arm failure
  // = skip + telemetry). The keyed relay config carries the SBIS Base→Relay dispatch internally.
  const armDesignation = (designation: string): void => {
    const trimmed = designation.trim();
    if (trimmed.length === 0) return;
    if (watcherMap.has(trimmed)) return; // idempotent — already armed.
    try {
      const menuRelay = createStcpComponentRelay<MenuDocument>(
        createSuite8DesignationRelayConfig(trimmed),
      );
      const watcher = menuRelay.armDirectoryWatch(nextA);
      if (watcher) {
        watcherMap.set(trimmed, watcher);
        void menuRelay.readAndDispatchSbis(nextA); // FIRST-LOAD hydration for this designation.
        console.log('[Suite8 MenuWatch] armed designation ·', trimmed);
        sinkMenuWatchTelemetry('arm-designation', { designation: trimmed });
      }
    } catch (err) {
      console.log('[Suite8 MenuWatch] arm.skip · reason=arm-failed · designation=', trimmed, '·', err);
      sinkMenuWatchTelemetry('arm-designation.skip', { designation: trimmed, reason: 'arm-failed', error: String(err) });
    }
  };

  // IE-D4 · enumerate the immediate Cascades/Extended/<name> subdirectory names (ENOENT-safe · never
  // throws — absence = [] + skip telemetry). Used by both the boot sweep and the live addDir re-sweep.
  const readExtendedSubdirectoryNames = (): string[] => {
    try {
      return readdirSync(EXTENDED_ROOT_ABS, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch (err) {
      const isEnoent = (err as NodeJS.ErrnoException)?.code === 'ENOENT';
      console.log(
        '[Suite8 MenuWatch] extended.enumerate.skip · reason=',
        isEnoent ? 'absent' : 'unreadable',
        '· path=',
        EXTENDED_ROOT_ABS,
      );
      return [];
    }
  };

  const menuWatchPlan = plan('Suite8 MenuWatch (Huirth · N-designation dir-watch · WPS)', ({ stage }) => [
    // Stage 1 · one-shot bootstrap (idempotent guard) — arm ONE menu.json DIRECTORY watch per
    // registered designation via that designation's keyed relay config. Each helper hardcodes
    // ignoreInitial:true, so readAndDispatchSbis covers the FIRST-LOAD hydration path (no-op if
    // absent · ENOENT → null).
    stage(
      ({ d, dispatch }) => {
        console.log('[Suite8 MenuWatch] Stage 1 · arm N menu.json dir-watches');
        // Boot seed — the MPRF authoritative list.
        for (const entry of KNOWN_SUITE8_ENTRIES) {
          armDesignation(entry.name);
        }
        // IE-D4 · FS sweep — arm any Extended designation dir ALREADY present that the boot seed
        // did not cover (a runtime-forged Suite 8 present before this boot).
        for (const name of readExtendedSubdirectoryNames()) {
          armDesignation(name);
        }
        console.log('[Suite8 MenuWatch] armed', watcherMap.size, 'designation watcher(s)');
        sinkMenuWatchTelemetry('boot-sweep', { armedCount: watcherMap.size, designations: [...watcherMap.keys()] });

        // IE-D4 · LIVE — chokidar-watch Cascades/Extended/ at depth 0 for `addDir`. A NEWLY forged
        // designation (the Forge/mint built the dir mid-session) arms its menu watcher IMMEDIATELY.
        // Debounced lightly; NEVER throws (arm failure = skip + telemetry). Mirrors the proven
        // extendedCascadeAutoRegistration addDir pattern (:182-201).
        try {
          extendedDirWatcher = chokidarWatch(EXTENDED_ROOT_ABS, {
            persistent: true,
            // ignoreInitial:true — the boot sweep already armed the existing dirs; the live watch
            // only reacts to NEW dirs forged after boot (no double-arm of the initial set).
            ignoreInitial: true,
            // depth 0 — only the immediate Cascades/Extended/<name> designations, not their contents.
            depth: 0,
          });
          const handleAddDir = (): void => {
            if (addDirDebounceTimer) clearTimeout(addDirDebounceTimer);
            addDirDebounceTimer = setTimeout(() => {
              console.log('[Suite8 MenuWatch] addDir · re-sweeping Extended for new designations');
              sinkMenuWatchTelemetry('adddir-resweep', { armedBefore: watcherMap.size });
              for (const name of readExtendedSubdirectoryNames()) {
                armDesignation(name); // idempotent — only NEW designations actually arm.
              }
              sinkMenuWatchTelemetry('adddir-resweep.done', { armedAfter: watcherMap.size, designations: [...watcherMap.keys()] });
            }, MENU_ADDDIR_DEBOUNCE_MS);
          };
          extendedDirWatcher.on('addDir', handleAddDir);
          extendedDirWatcher.on('error', (err) => {
            console.log('[Suite8 MenuWatch] watch.skip · reason=chokidar-error ·', err);
          });
          console.log('[Suite8 MenuWatch] chokidar armed on', EXTENDED_ROOT_ABS, '· depth=0 · addDir');
          sinkMenuWatchTelemetry('live-adddir-armed', { extendedRoot: EXTENDED_ROOT_ABS });
        } catch (err) {
          console.log('[Suite8 MenuWatch] watch.skip · reason=arm-failed ·', err);
          sinkMenuWatchTelemetry('live-adddir.skip', { reason: 'arm-failed', error: String(err) });
        }

        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 33 },
    ),
    // FT-006 Concluding Stage Pattern — the iterateStage above LANDS HERE; the plan concludes cleanly
    // while the N chokidar watchers + nextA pipes + the live addDir watch persist independently in the
    // closure (the plan's only job was the one-shot bootstrap).
    stage(({ stagePlanner }) => {
      stagePlanner.conclude();
    }, {}),
  ]);

  return () => {
    console.log('[Suite8 MenuWatch] Principle cleanup · closing', watcherMap.size, 'watcher(s)');
    sinkMenuWatchTelemetry('cleanup', { closingCount: watcherMap.size });
    // IE-D4 · HAZARD-A order: timer → live watcher → per-designation watchers → plan.conclude().
    if (addDirDebounceTimer) {
      clearTimeout(addDirDebounceTimer);
      addDirDebounceTimer = null;
    }
    if (extendedDirWatcher) {
      try {
        extendedDirWatcher.close();
      } catch {
        /* already closed */
      }
      extendedDirWatcher = null;
    }
    for (const watcher of watcherMap.values()) {
      try {
        watcher.close();
      } catch {
        /* already closed */
      }
    }
    watcherMap.clear();
    menuWatchPlan.conclude();
  };
};
