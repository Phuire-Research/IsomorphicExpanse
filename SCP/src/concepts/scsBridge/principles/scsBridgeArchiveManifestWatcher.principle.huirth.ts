/**
 * scsBridgeArchiveManifestWatcher Principle — Huirth Deployment (SE · Epoch Extension · AMWP)
 *
 * Archive-Manifest-Watcher-Principle (AMWP) — the SCP-side Huirth chokidar watcher on
 * Cascades/Archive/ that scans the dated tree for *.entry.json files, builds the full-replace
 * ArchiveManifestEntry[] (UFRT), and broadcasts it into Stratimux CLIENT state via the ASMQ
 * quality pair (Base + Relay). This is the archive-domain parallel of the cadmiumOkMonitor
 * AWCR watcher (chokidar → webSocketServerAppendToActionQue broadcast).
 *
 * TWO-MUXIUM SPLIT (S4 Angle 1 · BLOCKING · resolved): the bridge muxium has NO webSocketServer
 * concept → a bridge-side watcher cannot reach client state. This watcher lives in the SCP Huirth
 * muxium (the same process that owns webSocketServer), exactly as cadmiumOkMonitor does. The
 * bridge owns the GET /sessionArchive/ endpoints (SEAP · W2 · already built · pure FS reads).
 *
 * NCEC discipline: the broadcast fires from the async chokidar/debounce callback (OUTSIDE the
 * stage body). The Relay is appended to the webSocketServer actionQue via
 * d.webSocketServer.e.webSocketServerAppendToActionQue (the proven explicit-broadcast relay the
 * cadmium article/topics/menu broadcasts use). The Base (Huirth-local reducer) is dispatched via
 * nextA (the async-safe action-queue append the scsBridgeJsonWatcher uses from its .then callbacks).
 * This principle's OWN plan is non-NCEC by construction — it never touches the transcript watcher.
 *
 * Hazards addressed (S4 must-fix):
 *   - Angle 1 (placement): SCP-Huirth-ONLY · never bridge-side (the bridge has no webSocketServer).
 *   - Angle 2b (two-file race): awaitWriteFinish stabilityThreshold 300 + a ~300ms debounce timer
 *     collapse the .jsonl + .entry.json TWO-write pair into ONE scan + ONE broadcast (the manifest
 *     is built from *.entry.json only, so a mid-pair fire could otherwise miss the new entry).
 *   - Angle 2c (SSEB/PPOL): idempotent `if (archiveWatchArmed) return;` arm-guard · the sentinel
 *     stage dispatches nothing once armed (permanent monitor · no iterateStage/conclude).
 *   - G1 (SCS_ROOT): resolves Cascades/Archive/ against SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd()
 *     (identical to cadmiumOkMonitor) · NOT claudeArchiveRoot() (bridge-cwd-relative · not vendored).
 *
 * Citation: cadmiumOkMonitor.principle.huirth.ts (AWCR arm · awaitWriteFinish · NCEC broadcast).
 * Citation: scsBridgeStateMirror.principle.huirth.ts (Deck shape · scsBridge + webSocketServer slots).
 * Citation: scsBridgeJsonWatcher.principle.huirth.ts (nextA Base→Relay dispatch order · SBIS).
 * Citation: EPOCH-EXT-SE-S1-RED-CURATION.md Card 3 · EPOCH-EXT-SE-S4-GREEN-SCULPT.md Angle 1/2b.
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import path from 'node:path';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthQualities,
} from '../scsBridge.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import { buildArchiveManifest } from '../archiveManifest.model';
// ASMQ · the Base (Huirth-local reducer) + Relay (broadcast) action-creators. The Relay carries
// the shared 'Scs Bridge Set Archive Manifest Relay' type (TQNI byte-match · actionExchange route).
import { scsBridgeSetArchiveManifestHuirthBase } from '../qualities/setArchiveManifestHuirthBase.quality';
import { scsBridgeSetArchiveManifestRelay } from '../qualities/setArchiveManifestRelay.quality';

// G1 · SCS_ROOT override — the SCP huirth may run from a different cwd than the bridge. Resolves
// Cascades/Archive/ against the SAME SCS_BRIDGE_ROOT_OVERRIDE discipline cadmiumOkMonitor +
// scsBridgeJsonWatcher use (dev:self → SCS root; production → install cwd). NOT claudeArchiveRoot()
// (bridge-cwd-relative · paths.ts is not vendored SCP-side).
const SCS_ROOT = process.env.SCS_BRIDGE_ROOT_OVERRIDE
  ? path.resolve(process.env.SCS_BRIDGE_ROOT_OVERRIDE)
  : path.resolve(process.cwd());
const ARCHIVE_ROOT = path.join(SCS_ROOT, 'Cascades', 'Archive');

// Angle 2b · debounce collapses the .jsonl + .entry.json two-write pair into one scan. Longer
// than AWCR's 200ms because a session .jsonl can be large (hundreds of KB) and the two writes
// land in sequence — the manifest must rebuild only after BOTH settle.
const ARCHIVE_MANIFEST_DEBOUNCE_MS = 300;

// ============================================
// DECK TYPE — scsBridge Base dispatch + webSocketServer broadcast (mirror SMRP / cadmiumOkMonitor)
// ============================================
export type ScsBridgeArchiveManifestWatcherDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type ScsBridgeArchiveManifestWatcherPrincipleType = PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeArchiveManifestWatcherDeck,
  ScsBridgeHuirthState
>;

export const scsBridgeArchiveManifestWatcherPrinciple: ScsBridgeArchiveManifestWatcherPrincipleType = ({
  plan,
  nextA,
}) => {
  console.log('[SCS-Bridge AMWP] Principle started · archive-manifest watcher · root=', ARCHIVE_ROOT);

  // WDLS · single watcher + timer in closure (FSWatcher is not JSON-safe · never in state).
  let archiveWatcher: FSWatcher | null = null;
  let archiveDebounceTimer: NodeJS.Timeout | null = null;
  // SSEB/PPOL · idempotent arm-guard — the sentinel stage re-enters every beat; arm exactly once.
  let archiveWatchArmed = false;

  // Scan Cascades/Archive/ → full-replace manifest → SBIS Base (Huirth-local reducer via nextA)
  // then Relay (broadcast to all clients via webSocketServerAppendToActionQue). UFRT full-replace.
  // `d` is the stage-supplied runtime deck (typed `any` · the JsonWatcher / cadmiumOkMonitor idiom
  // for read-then-dispatch from an async/chokidar callback outside the stage body).
  const scanAndBroadcast = async (d: any): Promise<void> => {
    try {
      const manifest = await buildArchiveManifest(ARCHIVE_ROOT);
      // SBIS Base first — runs the local Huirth reducer so server state.archiveManifest is real.
      nextA(
        scsBridgeSetArchiveManifestHuirthBase.actionCreator({
          scsBridgeArchiveManifest: manifest,
        }) as AnyAction,
      );
      // Relay — explicit broadcast to all connected clients (NCEC-safe · same path as the cadmium
      // article/topics/menu broadcasts · NOT a stage-body dispatch).
      const relayAction = scsBridgeSetArchiveManifestRelay.actionCreator({
        scsBridgeArchiveManifest: manifest,
      }) as AnyAction;
      d.webSocketServer.e.webSocketServerAppendToActionQue({ actionQue: [relayAction] });
      console.log('[SCS-Bridge AMWP] manifest broadcast · count=', manifest.length);
    } catch (err) {
      console.warn('[SCS-Bridge AMWP] scanAndBroadcast failed · err=', String(err));
    }
  };

  // Arm the archive watcher once (idempotent · SSEB). chokidar on Cascades/Archive/ at depth:3
  // (the dated YYYY/MM/DD tree) · ignoreInitial:false so an already-populated archive hydrates the
  // manifest on arm (page sub-page load) · awaitWriteFinish so a mid-write .entry.json is not parsed
  // half-formed and the .jsonl+.entry.json pair settles before the scan fires.
  const armArchiveWatcher = (d: any): void => {
    if (archiveWatchArmed) return; // idempotent — already armed (SSEB/PPOL).
    try {
      archiveWatcher = chokidarWatch(ARCHIVE_ROOT, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 50 },
        depth: 3,
      });
      const handleArchiveEvent = (changedPath: string): void => {
        // Only react to the *.entry.json completion files (the manifest is built from these).
        if (!/\.entry\.json$/i.test(path.resolve(changedPath))) return;
        if (archiveDebounceTimer) clearTimeout(archiveDebounceTimer);
        archiveDebounceTimer = setTimeout(() => {
          void scanAndBroadcast(d);
        }, ARCHIVE_MANIFEST_DEBOUNCE_MS);
      };
      archiveWatcher.on('add', handleArchiveEvent);
      archiveWatcher.on('change', handleArchiveEvent);
      archiveWatcher.on('unlink', handleArchiveEvent); // a removed entry.json shrinks the manifest.
      archiveWatcher.on('error', (err) => {
        console.warn('[SCS-Bridge AMWP] archive chokidar error · err=', err);
      });
      // Arm-hydration: ignoreInitial:false fires `add` per existing entry; the debounce collapses
      // the burst into one scan. Also kick an explicit scan so an EMPTY archive still broadcasts []
      // (no add events fire on an empty/absent dir · the Vue list needs the [] hydration on arm).
      void scanAndBroadcast(d);
      archiveWatchArmed = true;
      console.log('[SCS-Bridge AMWP] archive watcher armed on', ARCHIVE_ROOT);
    } catch (err) {
      console.warn('[SCS-Bridge AMWP] archive arm failed · root=', ARCHIVE_ROOT, '· err=', err);
    }
  };

  // This principle's OWN plan — two stages, fully independent (NCEC-safe by construction).
  const archiveManifestPlan = plan('ScsBridge Archive Manifest Watcher (AMWP · Huirth)', ({ stage }) => [
    // Stage 1 · one-shot bootstrap: arm the archive watcher, advance.
    stage(
      ({ d, dispatch }) => {
        console.log('[SCS-Bridge AMWP] Stage 1 · bootstrap arm');
        armArchiveWatcher(d);
        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 33 },
    ),

    // Stage 2 · permanent sentinel. Re-arm idempotently (SSEB guard makes this a no-op once armed).
    // No iterateStage / conclude — this is the permanent monitoring stage; the chokidar callback
    // in the closure does the scan + broadcast (legal here · this is THIS principle's own plan).
    stage(
      ({ d }) => {
        armArchiveWatcher(d);
        // No dispatch / iterateStage / conclude — permanent sentinel.
      },
      { beat: 200 },
    ),
  ]);

  // Cleanup — timer first, then watcher, then conclude this principle's own plan (HAZARD-A order).
  return () => {
    console.log('[SCS-Bridge AMWP] Principle cleanup');
    if (archiveDebounceTimer) clearTimeout(archiveDebounceTimer);
    if (archiveWatcher) {
      try {
        archiveWatcher.close();
      } catch {
        /* already closed */
      }
    }
    archiveManifestPlan.conclude();
  };
};
