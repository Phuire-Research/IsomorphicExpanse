/*<$
For the graph programming framework Stratimux and a Server Concept, generate a principle that will listen on the port passed in its initial state.
$>*/
/*<#*/
import { ServerPrinciple, ServerState } from './server.concept';
import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { resolveBridgeRoot } from '../scsBridge/bridgeRoot.model';

// THE BRANCH SELF-REPORT (C300 · the Observed Seat Return · CLAUSE 6). Every boot the SCP server
// mirrors its OWN active branch into the shared Bridge dir so the bridge's ONE-SHOT seat-return
// watcher can OBSERVE that A booted (activeBranch === master) and checkout-return the seat to B.
// The report is the SCP-server's own Muxistration: it KNOWS its repo (walk UP to the .git holder)
// and its name (scp.config.json), writes { scpName, activeBranch, bootedAt }. Failure = log-only,
// NEVER throws — a non-repo / read failure must never break server boot.
function writeScpBootReport(): void {
  try {
    const bridgeDir = resolveBridgeRoot();
    // Resolve the SCP REPO ROOT — walk UP from cwd until a `.git` dir exists (bounded ~4 levels ·
    // NOT a hardcoded ../../..). The installed SCP's package dir sits inside the parent RED work-tree.
    let repoRoot = '';
    let probe = process.cwd();
    for (let i = 0; i < 4; i += 1) {
      if (fs.existsSync(path.join(probe, '.git'))) {
        repoRoot = probe;
        break;
      }
      const parent = path.dirname(probe);
      if (parent === probe) break; // filesystem root
      probe = parent;
    }
    // Read THIS SCP's own name from scp.config.json @ process.cwd() (the SCP PACKAGE ROOT · the
    // existing /scp-config read idiom). Absent/malformed → '' (the report still writes, no name).
    let scpName = '';
    try {
      const cfgRaw = fs.readFileSync(path.resolve(process.cwd(), 'scp.config.json'), 'utf-8');
      const cfg = JSON.parse(cfgRaw) as { scpName?: unknown };
      if (typeof cfg?.scpName === 'string') scpName = cfg.scpName;
    } catch {
      /* no scp.config.json (dev:self / pre-install) — report writes with an empty scpName */
    }
    let activeBranch = '';
    if (repoRoot !== '') {
      try {
        activeBranch = execFileSync('git', ['-C', repoRoot, 'branch', '--show-current'], {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
      } catch {
        /* not a repo / detached HEAD / git absent — leave activeBranch '' (never break boot) */
      }
    }
    // BO-2-J (C451) · THE BOOT FINGERPRINT: the boot report carries WHAT restarted this SCP —
    // the local .bridge-restart.json content + mtime at boot + this process identity. The
    // cross-turn-over diagnosis reads this from BOTH workspaces' Bridge dirs after a press.
    let restartTrigger: Record<string, unknown> | null = null;
    try {
      const trigPath = path.join(process.cwd(), '.bridge-restart.json');
      const trigStat = fs.statSync(trigPath);
      restartTrigger = {
        ...JSON.parse(fs.readFileSync(trigPath, 'utf-8')),
        triggerMtime: trigStat.mtimeMs,
        triggerAgeMsAtBoot: Date.now() - trigStat.mtimeMs,
      };
    } catch {
      restartTrigger = null; /* no trigger file — a non-BRTF boot */
    }
    const reportPath = path.join(bridgeDir, `scp-boot-report.${scpName}.json`);
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        { scpName, activeBranch, bootedAt: Date.now(), pid: process.pid, cwd: process.cwd(), restartTrigger },
        null,
        2,
      ),
      'utf-8',
    );
    console.log(`[SCP Boot Report] wrote ${reportPath} · activeBranch=${activeBranch || '(none)'}`);
  } catch (err) {
    console.error('[SCP Boot Report] non-fatal write failure (boot continues):', err);
  }
}

export const serverPrinciple: ServerPrinciple = ({ concepts_, k_, plan, nextA }) => {
  // C667 · S0b THE LOOPBACK BIND: the SCP's primary server (main port + reflected port+1)
  // binds loopback — its /stateSync + /files surface serves only the same-machine Electron
  // client. Loopback-safe: the SCP is reached via http://localhost:${port}.
  const HOST = '127.0.0.1';
  const initialServerState = k_.getState(concepts_) as ServerState;
  const server = initialServerState.server;
  let newClientState: undefined | unknown = undefined;
  if (server) {
    server.use(cors());
    server.use('/files', express.static(path.join(__dirname, '../../../static')));

    setTimeout(() => {
      server.listen(initialServerState.port, HOST, () => {
        console.log(`Running on http://${HOST}:${initialServerState.port}}`);
        console.log(`Static files available at http://${HOST}:${initialServerState.port}/files`);
        // THE BRANCH SELF-REPORT — boot-settled (inside the .listen callback · every boot, every run).
        writeScpBootReport();
      });
    }, 1000);
    if (initialServerState.syncClientState) {
      const syncStatePlan = plan('sync state plan', ({ stageO, stage }) => [
        stageO(), // Waits for ownership initialization (auto-registers)
        stage(({ k }) => {
          newClientState = k.clientState.select();
        }),
      ]);
      server.get('/stateSync', (__, res) => {
        // console.log('HIT, newState: ', JSON.stringify(newState));
        res.json(newClientState);
      });
    }
    const reflectedServer = express();
    const reflectedPort = initialServerState.port + 1;
    reflectedServer.use(cors());
    reflectedServer.use('/files', express.static(path.join(__dirname, '../../../static')));

    initialServerState.servers.push({
      port: reflectedPort,
      server: reflectedServer,
    });
    setTimeout(() => {
      reflectedServer.listen(reflectedPort, HOST, () => {
        console.log(`Running on http://${HOST}:${reflectedPort}}`);
        console.log(`Static files available at http://${HOST}:${reflectedPort}/files`);
      });
    }, 1000);
    if (initialServerState.syncClientState) {
      reflectedServer.get('/stateSync', (__, res) => {
        // console.log('HIT, newState: ', JSON.stringify(newState));
        res.json(newClientState);
      });
    }
  }
};
/*#>*/
