/**
 * scsBridgeJsonWatcher Principle — Huirth Deployment
 *
 * Cycle 155 · BJDP (Bridge-Json Discovery Path) · Foundation A Wave 2
 *
 * Huirth-side principle that watches `./Cascades/Bridge/bridge.json` and
 * `./Cascades/Bridge/sessions.json` via node:fs.watch (no chokidar dependency).
 * On startup AND on any filesystem change, reads the file, parses the JSON
 * with try/catch (ENOENT-safe, parse-error-safe), and dispatches the
 * corresponding relay setter quality. The dispatched action propagates to all
 * connected clients via the Path B explicit actionExchange.serverToClient
 * declarations in scsBridge.muxonomy.ts.
 *
 * Pattern source: notificationBroadcast.principle.huirth.ts (M63 Copy-Paste-Plus).
 *   Input substitution: KeyedSelector observation → filesystem watch.
 *   Output structure preserved: stage dispatch · cleanup return · no controller.fire.
 *
 * Invariants honored (FOUNDATION-A consolidated RD §7):
 *   - TOBM: dispatch(...) NEVER controller.fire(...). No ActionStrategy context.
 *   - FNES: .principle.huirth.ts encoding · Huirth deployment · no Diameter.
 *   - BJDP: project-local path ./Cascades/Bridge/ (NEVER home-dir).
 *   - Cleanup order: timers → watchers → plan.conclude() (HAZARD-A mitigation).
 *   - JSON parse safety: try/catch returns null/[] on any failure.
 *
 * Citation: FOUNDATION-A consolidated RD §3 Q1/Q2 · §6 File 1
 * Citation: notification/principles/notificationBroadcast.principle.huirth.ts
 * Citation: Stratimuxian Scholar S15 §6 MSDT · §8 TOBM
 * Citation: SCP-Researcher SCP-S13 §4.2 Broadcast Principle Pattern
 */
import { resolveBridgeRoot } from '../bridgeRoot.model';
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthQualities,
  BridgeJsonShape,
  ScsBridgeSessionEntry,
} from '../scsBridge.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
// SBIS (Stratidian-Base-Informative-State) · Cycle 163 R6
// Base = Huirth state (server source of truth). Informative = Client state (derived).
// Watcher dispatches Base actions FIRST (Huirth-local reducer runs → SMRP selectors fire)
// then Relay actions (actionExchange.serverToClient routes to Client for broadcast).
// Citation: ~/.claude/projects/<project-slug>/memory/feedback_stratidian_base_informative_state.md

// Cobalt-RBA · Cycle 160 R10 · SCS_BRIDGE_ROOT_OVERRIDE honors dev:self alignment.
// In dev:self mode the SCS orchestrator stays at SCS root cwd and writes
// bridge.json to SCS_root/Cascades/Bridge/. The template SCP huirth runs with
// cwd=templateScpPath (its own root) — so resolving against process.cwd() would
// miss the bridge.json the orchestrator wrote. SCS_BRIDGE_ROOT_OVERRIDE points
// this watcher at the SCS root where the bridge.json actually lives.
// In production (scs --debug, e.g. Test-045 install) the env var is unset →
// watcher falls back to process.cwd() = install directory · zero regression.
const BRIDGE_ROOT = resolveBridgeRoot();
const BRIDGE_JSON_PATH = path.join(BRIDGE_ROOT, 'bridge.json');
const SESSIONS_JSON_PATH = path.join(BRIDGE_ROOT, 'sessions.json');
const DEBOUNCE_MS = 100;

export type ScsBridgeJsonWatcherDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
  // SLRB · Sessions-Live-Relay-Broadcast · the webSocketServer slot lets the
  // sessions.json change event reach ALREADY-CONNECTED clients directly (mirrors
  // AMWP / SMRP Deck shape). Without this the change-event relay only lands in
  // Huirth's own action stream and depends on SMRP's throttled selector re-fire.
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type ScsBridgeJsonWatcherPrincipleType = PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeJsonWatcherDeck,
  ScsBridgeHuirthState
>;

// Resilient JSON read helpers — ENOENT-safe, parse-error-safe.
// Return null/[] on any failure; never throw out of the helper.
const readBridgeJson = async (): Promise<BridgeJsonShape | null> => {
  // Cobalt-FSGT · Cycle 160 R14 · log every bridge.json read site.
  console.log('[SCS-Bridge Watcher] read · bridge.json access · path=', BRIDGE_JSON_PATH);
  try {
    const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
    return JSON.parse(raw) as BridgeJsonShape;
  } catch (err) {
    // ENOENT (file absent) is the expected pre-bridge-startup case.
    // Parse failures (partial writes) are also tolerated — defaults stand.
    return null;
  }
};

const readSessionsList = async (): Promise<ScsBridgeSessionEntry[]> => {
  try {
    const raw = await readFile(SESSIONS_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // sessions.json may be either an array directly or wrapped in an object;
    // try array-first, then look for a `sessions` field.
    if (Array.isArray(parsed)) {
      return parsed as ScsBridgeSessionEntry[];
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sessions)) {
      return parsed.sessions as ScsBridgeSessionEntry[];
    }
    return [];
  } catch (err) {
    return [];
  }
};

export const scsBridgeJsonWatcherPrinciple: ScsBridgeJsonWatcherPrincipleType = ({ plan, nextA }) => {
  console.log('[ScsBridge JSON Watcher] Principle started');
  let bridgeJsonWatcher: FSWatcher | null = null;
  let sessionsJsonWatcher: FSWatcher | null = null;
  let bridgeDebounceTimer: NodeJS.Timeout | null = null;
  let sessionsDebounceTimer: NodeJS.Timeout | null = null;

  // PP-D4 · Stale-Pong Baseline · capture huirth boot timestamp ONCE here.
  // Closure-scoped so every relay dispatch threads the SAME value across the
  // principle lifetime. Any pre-existing pongReceipt in bridge.json with
  // respondedAt < this serverStartupTime reads as stale (Pending) on Client.
  // Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2
  const serverStartupTime = Date.now();
  console.log('[ScsBridge JSON Watcher] serverStartupTime captured:', serverStartupTime);

  const watcherPlan = plan('ScsBridge JSON Watcher (Huirth)', ({ stage, stageO, conclude }) => [
    stage(({ d, dispatch}) => {
      // §B.0 · PP-D4 · Stale-Pong Baseline dispatch (FIRST · before bridge.json read).
      // Sets huirth state.serverStartupTime so subsequent relay dispatches can
      // (a) read it back if needed and (b) the value is available for any
      // future broadcast cycle.
      dispatch(
        d.scsBridge.e.scsBridgeSetServerStartupTime({ timestamp: serverStartupTime }),
        {
          iterateStage: true
        },
      );
    }, {
      beat: 33
    }),
    stage(({ d, dispatch }) => {
        // DTBP · Dispatch-Throttle-Bypass-Protocol · Cycle 163 R4
        // This plan has { beat: 1 } intentionally low-beat persistent — re-fires on each
        // chokidar event via the watcher arming below. The default dispatch(action, {})
        // triggers Stratimux's halting protection (recursion-overflow check) which
        // invalidates the plan after one fire (DELETED PLAN log evidence at line:889
        // of stratimux/dist/index.js). `{ throttle: 0 }` explicitly opts out for these
        // specific async dispatches the plan author knows should re-fire each beat.
        // Cite: feedback_stratimux_dispatch_throttle_discipline.md

        // §B.1 Initial read with 3-try backoff (Cycle 160 R11 · race-window
        // resolution). If bridge.json doesn't exist at template SCP huirth
        // boot (daemon hasn't written it yet OR daemon writes slightly later
        // due to setTimeout in server.principle.ts), retry with backoff before
        // giving up. chokidar watcher (B.2 below) will pick up subsequent
        // writes anyway · but backoff ensures Client gets initial state ASAP.
        // PP-D4 · serverStartupTime threaded into relay payload (closure value).
        const initialReadBackoff = async (): Promise<void> => {
          const delays = [0, 500, 1000];
          for (let attempt = 0; attempt < delays.length; attempt++) {
            if (delays[attempt] > 0) {
              await new Promise((r) => setTimeout(r, delays[attempt]));
            }
            const shape = await readBridgeJson();
            console.log(
              '[SCS-Bridge Watcher] Initial read attempt',
              attempt + 1,
              'of',
              delays.length,
              '· shape=',
              shape ? `port=${shape.port}` : 'null',
            );
            if (shape) {
              console.log(
                '[SCS-Bridge Watcher] Initial read SUCCESS · dispatching setBridgeJsonRelay',
              );
              // SBIS Base first — Huirth-local reducer runs, SMRP selectors observe change
              nextA(
                d.scsBridge.e.scsBridgeSetBridgeJsonHuirthBase({
                  scsBridgeBridgeJson: shape,
                  serverStartupTime,
                }),
              );
              nextA(
                d.scsBridge.e.scsBridgeSetBridgeJsonRelay({
                  scsBridgeBridgeJson: shape,
                  serverStartupTime,
                }),
              );
              return;
            }
          }
          // All 3 tries returned null · dispatch null (chokidar will pick up
          // file when it appears · Client stays in pending state until then).
          console.warn(
            '[SCS-Bridge Watcher] Initial read · 3 tries exhausted · file absent · chokidar will arm and pick up on add event',
          );
          // SBIS Base first — Huirth-local reducer runs even on null
          nextA(
            d.scsBridge.e.scsBridgeSetBridgeJsonHuirthBase({
              scsBridgeBridgeJson: null,
              serverStartupTime,
            }),
          );
          nextA(
            d.scsBridge.e.scsBridgeSetBridgeJsonRelay({
              scsBridgeBridgeJson: null,
              serverStartupTime,
            }),
          );
        };
        initialReadBackoff();

        console.log('[SCS-Bridge SLSR] Initial sessions.json read · starting');
        readSessionsList().then((list) => {
          // SBIS Base first — Huirth-local reducer runs, SMRP selectors observe change
          nextA(
            d.scsBridge.e.scsBridgeSetSessionsListHuirthBase({ scsBridgeSessionsList: list }),
          );
          nextA(
            d.scsBridge.e.scsBridgeSetSessionsListRelay({ scsBridgeSessionsList: list }),
          );
        });
        dispatch(d.muxium.e.muxiumKick(), {
          iterateStage: true
        });
        // §B.2 Watcher arm · bridge.json (Cycle 160 R11 · chokidar replaces
        // node:fs.watch · handles non-existent files via parent-dir watching ·
        // fires 'add' when file appears · fires 'change' on subsequent writes ·
        // awaitWriteFinish prevents partial-write reads · usePolling fallback
        // for filesystems where native events are unreliable).
    }, {
      // FT-004 crash conformance (Concluding Stage Pattern): this stage ran with NO
      // stage-options — an async iterateStage:true from a .then() walked the plan index
      // out of bounds and assemblePriorityQue read .priority of undefined (boot crash).
      // The DTBP comment above always INTENDED beat:1; now attached.
      beat: 1
    }),
    stage(({ d, dispatch }) => {
      try {
        bridgeJsonWatcher = chokidarWatch(BRIDGE_JSON_PATH, {
          persistent: true,
          ignoreInitial: false,
          awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
        });
        const handleBridgeJsonEvent = (eventTag: string): void => {
          if (bridgeDebounceTimer) clearTimeout(bridgeDebounceTimer);
          bridgeDebounceTimer = setTimeout(() => {
            console.log(
              '[SCS-Bridge Watcher] bridge.json',
              eventTag,
              '· re-reading from path',
            );
            readBridgeJson().then((shape) => {
              console.log(
                '[SCS-Bridge Watcher] Read bridge.json · port=',
                shape?.port,
                '· endpoint=',
                shape?.endpoint,
                '· pongReceipt=',
                shape?.pongReceipt?.respondedAt,
              );
              console.log('[SCS-Bridge SLSR] Dispatching on change · file=bridge.json · throttle=0');
              // SBIS Base first — Huirth-local reducer runs, SMRP selectors observe change
              nextA(
                d.scsBridge.e.scsBridgeSetBridgeJsonHuirthBase({
                  scsBridgeBridgeJson: shape,
                  serverStartupTime,
                }),
              );
              nextA(
                d.scsBridge.e.scsBridgeSetBridgeJsonRelay({
                  scsBridgeBridgeJson: shape,
                  serverStartupTime,
                }),
              );
            });
          }, DEBOUNCE_MS);
        };
        bridgeJsonWatcher.on('add', () => handleBridgeJsonEvent('add'));
        bridgeJsonWatcher.on('change', () => handleBridgeJsonEvent('change'));
        bridgeJsonWatcher.on('error', (err) => {
          console.warn('[SCS-Bridge Watcher] chokidar error:', err);
        });
        console.log('[SCS-Bridge Watcher] chokidar armed on', BRIDGE_JSON_PATH);
      } catch (err) {
        console.warn(
          '[ScsBridge JSON Watcher] bridge.json chokidar arm failed:',
          err,
        );
      }

      // §B.3 Watcher arm · sessions.json (Cycle 160 R11 · chokidar parity).
      try {
        sessionsJsonWatcher = chokidarWatch(SESSIONS_JSON_PATH, {
          persistent: true,
          ignoreInitial: false,
          awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
        });
        const handleSessionsEvent = (): void => {
          if (sessionsDebounceTimer) clearTimeout(sessionsDebounceTimer);
          sessionsDebounceTimer = setTimeout(() => {
            console.log('[SCS-Bridge SLSR] handleSessionsEvent · event detected');
            console.log('[SCS-Bridge SLSR] sessions.json event · debounce fired · dispatching read');
            readSessionsList().then((list) => {
              console.log('[SCS-Bridge SLSR] Dispatching on change · file=sessions.json · throttle=0');
              // SBIS Base first — Huirth-local reducer runs, SMRP selectors observe change
              nextA(
                d.scsBridge.e.scsBridgeSetSessionsListHuirthBase({ scsBridgeSessionsList: list }),
              );
              nextA(
                d.scsBridge.e.scsBridgeSetSessionsListRelay({ scsBridgeSessionsList: list }),
              );
              // SLRB · Sessions-Live-Relay-Broadcast · the SEAT FIX. The nextA relay above only
              // lands in Huirth's OWN action stream — it never enters the webSocketServer actionQue,
              // so already-connected clients depend entirely on SMRP's throttled (beat:100) selector
              // re-fire to receive the fresh list. A row that flips to `launched` AFTER a client
              // connects lands in that throttle window and starves (the Shatterite anchor-alive
              // detection never sees it). Fix: append the SAME relay action to the webSocketServer
              // actionQue with NO targetConnectionId / targetClientStateKey = GLOBAL BROADCAST to
              // every connected client — the proven explicit-broadcast idiom AMWP + connection-establish
              // (sendBridgeMessage SCRR-S) both use. NCEC-safe: dispatched from the async debounce
              // callback (outside the stage body), same as AMWP L109-112.
              // Debounce (DEBOUNCE_MS) is already applied by the enclosing setTimeout — bursts collapse.
              const sessionsRelayAction = d.scsBridge.e.scsBridgeSetSessionsListRelay({
                scsBridgeSessionsList: list,
              }) as AnyAction;
              d.webSocketServer.e.webSocketServerAppendToActionQue({ actionQue: [sessionsRelayAction] });
              console.log('[SCS-Bridge SLSR] sessions.json relay broadcast · count=', list.length);
            });
          }, DEBOUNCE_MS);
        };
        sessionsJsonWatcher.on('add', handleSessionsEvent);
        sessionsJsonWatcher.on('change', handleSessionsEvent);
        sessionsJsonWatcher.on('error', (err) => {
          console.warn('[SCS-Bridge Watcher] sessions chokidar error:', err);
        });
      } catch (err) {
        console.warn(
          '[ScsBridge JSON Watcher] sessions.json chokidar arm failed:',
          err,
        );
      }
      dispatch(d.muxium.e.muxiumKick(), {
        iterateStage: true
      })
    }, {}),
    stage(({stagePlanner}) => {stagePlanner.conclude()}, {})
  ]);

  // Cleanup return — HAZARD-A mitigation: timers → watchers → plan.conclude().
  // Closing the watcher before the plan concludes ensures any in-flight event
  // does not fire into a torn-down dispatcher.
  return () => {
    console.log('[ScsBridge JSON Watcher] Principle cleanup');
    if (bridgeDebounceTimer) clearTimeout(bridgeDebounceTimer);
    if (sessionsDebounceTimer) clearTimeout(sessionsDebounceTimer);
    if (bridgeJsonWatcher) {
      try {
        bridgeJsonWatcher.close();
      } catch {
        /* watcher already closed */
      }
    }
    if (sessionsJsonWatcher) {
      try {
        sessionsJsonWatcher.close();
      } catch {
        /* watcher already closed */
      }
    }
  };
};
