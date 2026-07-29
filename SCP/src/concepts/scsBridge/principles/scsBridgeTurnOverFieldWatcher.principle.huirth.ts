/**
 * scsBridgeTurnOverFieldWatcher Principle — Huirth Deployment
 *
 * BO-2-G (C446) · D-BN-2 · THE FIELD-TRIGGERED TURN OVER — the layered watcher's SCP-side half.
 *
 * The bridge writes THE SPECIFIED FIELD `turnOver: { at, source, hard }` into the WORKSPACE
 * gitm.json (D-BN-2 · THE turnOver RELOCATION — branch business belongs on the git manifold
 * file · user design · the gitm turn-over legs are the only writers that ADVANCE it, threaded
 * through the reducer → the GITEP snapshot). This principle watches THAT file and, when
 * turnOver.at ADVANCES beyond the boot-time baseline, writes the local `.bridge-restart.json` —
 * the blunt trigger nodemon already watches. The SIGNAL is field-based on gitm.json; the
 * RESTART mechanic stays the proven one.
 *
 * Guard telemetry (the *.skip{reason} law): absent file · malformed JSON · absent field ·
 * non-advancing at — each logs its reason and does nothing. A restart can never fire from
 * noise; only a strictly-advancing numeric turnOver.at.
 *
 * Pattern source: scsBridgeJsonWatcher.principle.huirth.ts (chokidar on the Bridge dir ·
 * ENOENT-safe reads · cleanup order watcher → conclude). This principle dispatches NOTHING —
 * pure fs observation → fs write (the one principle whose output is a file, by design).
 *
 * Citation: DIAMOND-BREAKOUT-SEQUENCE.md §BO-2-G (the layered watcher design).
 */
import { resolveScpLocalBridgeDir } from '../bridgeRoot.model';
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ScsBridgeHuirthState, ScsBridgeHuirthQualities } from '../scsBridge.type';

export type ScsBridgeTurnOverFieldWatcherDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
};

type TurnOverField = { at?: unknown; source?: unknown; hard?: unknown };

export const scsBridgeTurnOverFieldWatcherPrinciple: PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeTurnOverFieldWatcherDeck,
  ScsBridgeHuirthState
> = () => {
  // D-BN-2 · THE turnOver RELOCATION — the signal rides gitm.json (the same file the gitm
  // STCP relay watches · gitmRelay.config.ts). MD-A D2 · SCP BRIDGE SOVEREIGNTY: the watch
  // moves to the SCP's OWN Cascades/Bridge/gitm.json (resolveScpLocalBridgeDir · cwd-local)
  // — the bridge's GITEP writer lands the snapshot on the CALLING SCP's rail, closing the
  // turn-over circuit fully per-SCP: own gitm.json → this watcher → own .bridge-restart.json.
  const bridgeJsonPath = path.join(resolveScpLocalBridgeDir(), 'gitm.json');
  // The boot baseline: a turnOver already present at startup was CONSUMED by a prior life
  // (anor predates this boot) — only an ADVANCE beyond it triggers.
  let baselineAt = 0;
  let watcher: FSWatcher | null = null;

  const readTurnOverAt = async (): Promise<number | null> => {
    try {
      const raw = await readFile(bridgeJsonPath, 'utf8');
      const parsed = JSON.parse(raw) as { turnOver?: TurnOverField | null };
      const at = parsed.turnOver?.at;
      return typeof at === 'number' ? at : null;
    } catch {
      return null;
    }
  };

  void (async () => {
    baselineAt = (await readTurnOverAt()) ?? 0;
    console.log(
      '[SCS-Bridge TurnOverFieldWatcher] armed · path=',
      bridgeJsonPath,
      '· baselineAt=',
      baselineAt,
    );
    watcher = chokidarWatch(bridgeJsonPath, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
    });
    watcher.on('add', () => void onChange());
    watcher.on('change', () => void onChange());
  })();

  const onChange = async (): Promise<void> => {
    const at = await readTurnOverAt();
    if (at === null) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=absent-or-malformed-field');
      return;
    }
    if (at <= baselineAt) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=not-advancing · at=', at, '· baseline=', baselineAt);
      return;
    }
    baselineAt = at;
    try {
      writeFileSync(
        path.resolve(process.cwd(), '.bridge-restart.json'),
        JSON.stringify({ hardTurnOver: true, timestamp: Date.now(), source: 'turnOver-field', fieldAt: at }, null, 2),
        'utf-8',
      );
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.fired · fieldAt=', at);
    } catch (err) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=restart-write-failed ·', String(err));
    }
  };
};
