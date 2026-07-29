/**
 * triggerHardTurnOver Quality — Huirth Real (Diametric counterpart of client Induction)
 *
 * Server-side handler for the 'Scs Bridge Trigger Hard Turn Over' action
 * dispatched by D6 Pewter Fuchsia Turn Over Button (client Induction routes
 * via actionQue → webSocketServer → here).
 *
 * Touches `.bridge-restart.json` in SCP root with `{ hardTurnOver: true }`
 * flag. Nodemon watches this file → SIGKILL → fresh spawn. Server startup
 * reads flag · resets to `{}` · sets internal startup-Hard-Turn-Over marker
 * (M1-Refinement consumer).
 *
 * Pattern: SSHQDRE · NRHTJT · PGRSA (5th member of swap-gate Diameter family)
 * Spec: Refine-Macro Cycle 58 SCP-S11 + Pattern G (ClientState-Preservation +
 *       Hard Turn Over Escape)
 *
 * Real client-side state preservation / regeneration (WSBBCCD broadcast +
 * IndexedDB clear + ClientState regeneration on reconnect) DEFERRED to
 * Macro Diamond 2+ refinement Macro (full Pattern G realization).
 *
 * Citation: DIAMOND-TIER-M1-FINAL.md · Wave A
 * Citation: notification/qualities/helloWorld.quality.huirth.diameter.ts (exemplar)
 */
import {
  createQualityCardWithPayload,
  createAsyncMethod,
  nullReducer,
  muxiumConclude,
  selectPayload,
} from 'stratimux';
import { promises as fs } from 'fs';
import path from 'path';
import { spawnSync } from 'node:child_process';
import type { ScsBridgeTriggerHardTurnOverPayload } from '../scsBridge.type';

const BRIDGE_RESTART_FILE = '.bridge-restart.json';

export const scsBridgeTriggerHardTurnOverHuirth = createQualityCardWithPayload<
  Record<string, never>,
  ScsBridgeTriggerHardTurnOverPayload
>({
  type: 'Scs Bridge Trigger Hard Turn Over',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethod(({ controller, action }) => {
      const payload = (selectPayload<ScsBridgeTriggerHardTurnOverPayload>(action) ??
        {}) as ScsBridgeTriggerHardTurnOverPayload;
      const source = payload.source;
      const targetBranch = payload.targetBranch;
      const createBranch = payload.createBranch === true;

      // A/B branch switch BEFORE the restart marker. The SCP package dir is nodemon's
      // watch root — process.cwd() resolves up to the SCP's RED .git, the same cwd the
      // restart-file write uses. Synchronous so the switch completes before nodemon respawns.
      //
      // PCGT+ABCS · createBranch === true → `git switch -c <targetBranch>` — the `-c` CREATES
      // the branch from HEAD, lands on it, and CARRIES the dirty working tree onto it. This IS
      // the "create-then-turn-over" sequence collapsed into ONE synchronous local op: the Pewter
      // confirmation menu confirmed, so a fresh B is forged here and the same restart-respawn
      // overlay engages the turn-over. Else the existing plain switch to an already-existing
      // branch (the A-return path · unchanged · zero-regression for the proven base).
      if (typeof targetBranch === 'string' && targetBranch.length > 0) {
        const gitArgs = createBranch
          ? ['switch', '-c', targetBranch]
          : ['switch', targetBranch];
        const verb = createBranch ? 'switch -c' : 'switch';
        try {
          const result = spawnSync('git', gitArgs, {
            cwd: process.cwd(),
            encoding: 'utf-8',
          });
          if (result.status === 0) {
            console.log(
              `[SCS-Bridge Huirth] git ${verb} ${targetBranch} · ok (source ${source ?? '?'}${createBranch ? ' · branch CREATED + drift carried' : ''})`,
            );
          } else {
            console.error(
              `[SCS-Bridge Huirth] git ${verb} ${targetBranch} · FAILED (status ${result.status}) · proceeding to restart anyway ·`,
              (result.stderr || result.error?.message || '').toString().trim(),
            );
          }
        } catch (err) {
          console.error(
            `[SCS-Bridge Huirth] git ${verb} ${targetBranch} · threw · proceeding to restart anyway ·`,
            (err as Error).message,
          );
        }
      }

      const filePath = path.resolve(process.cwd(), BRIDGE_RESTART_FILE);
      const restartPayload = {
        hardTurnOver: true,
        timestamp: Date.now(),
        source,
        targetBranch,
        createBranch,
        // BO-2-J (C451) · writer identity — the cross-turn-over diagnosis reads WHO wrote this.
        writerLeg: 'freehop-triggerHardTurnOver',
        writerPid: process.pid,
        writerCwd: process.cwd(),
      };

      console.log('[SCS-Bridge Huirth] Hard Turn Over triggered · writing', filePath);

      fs.writeFile(filePath, JSON.stringify(restartPayload, null, 2), 'utf-8')
        .then(() => {
          console.log('[SCS-Bridge Huirth] .bridge-restart.json written · nodemon should restart');
          controller.fire(muxiumConclude());
        })
        .catch((err: Error) => {
          console.error('[SCS-Bridge Huirth] Hard Turn Over write failed:', err.message);
          controller.fire(muxiumConclude());
        });
    }),
});
