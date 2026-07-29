/**
 * scsBridgeSessionTranscriptWatcher Principle — Huirth Deployment
 *
 * D3F Diamond B · Cycle 164 R3 · Wave-1 Server Substrate
 *
 * Per-session JSONL transcript watcher — monitors Claude Code's ~/.claude/projects/
 * directory for each active session and dispatches transcript data updates when
 * the session's .jsonl file changes.
 *
 * Architecture decisions locked (R3 Yellow):
 *   D1: Path B — ~/.claude/projects/<encoded-cwd>/<claudeSessionId>.jsonl
 *       Encoding: cwd.replace(/\//g, '-')
 *       Guard: arm only when session.claudeSessionId AND session.cwd are both set
 *   D2: Direct Relay — Base + Relay fired immediately from AQSD Quality
 *       (not EARV) for real-time Client updates
 *
 * Patterns:
 *   WDLS (Watcher-Dictionary-Local-Scope): Map<string, FSWatcher> in closure
 *   PSWO (Per-Session-Watcher-Orchestration): arm/teardown per session ULID
 *   SLSF (Stage-Level-Selector-Fire): Stage-2 is selector-reactive on sessionsList
 *   GCWP (Graceful-Cleanup-Watcher-Pattern): teardown timers then watchers on removal
 *   NCEC (Never-Concludes-Except-Cleanup): plan is permanent sentinel, no Stage-3
 *
 * DIAGNOSTIC-REENGAGED R2 (S6 §B): the extraction triggers no longer dispatch the
 * SCP-local AQSD quality. Instead a closure roll-up buffer (pendingExtractionIds)
 * coalesces session IDs and a debounced flush fires ONE batched POST to the CLI
 * scs_persist_last_turn MCP tool. The fetch is an HTTP side-effect OUTSIDE the
 * muxium — NOT a Stratimux dispatch — so the prior NAQA discipline is moot for the
 * extraction path (no action-queue dispatch remains) and scheduling the flush from
 * the selector-reactive Stage 2 cannot trigger DELETED-PLAN halting protection.
 *
 * NCEC discipline (R4 Green HAZARD P2):
 *   Stage-2 MUST use { selectors: [d_.scsBridge.k.sessionsList], beat: 100 }
 *   Stage-2 MUST NOT dispatch() — DELETED PLAN risk (the flush fires a FETCH, not a dispatch)
 *
 * Citation: scsBridgeJsonWatcher.principle.huirth.ts (NAQA+MSAO+MKAS+SPCS pattern)
 * Citation: scsBridgeStateMirror.principle.huirth.ts (d_ selector pattern)
 * Citation: D3F-AUDIT-R4-GREEN-11-ANGLES.md (NCEC Angle 5, GCWP Angle 6, Path Angle 7)
 */
import { resolveBridgeRoot } from '../bridgeRoot.model';
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthQualities,
} from '../scsBridge.type';

const TRANSCRIPT_DEBOUNCE_MS = 200;
// DIAGNOSTIC-REENGAGED R2 · cross-session roll-up flush debounce (coarser than the
// 200ms per-session layer). N per-session triggers within this window coalesce into
// ONE batched POST to the CLI scs_persist_last_turn MCP tool.
const EXTRACTION_FLUSH_DEBOUNCE_MS = 250;

// DIAGNOSTIC-REENGAGED R2 · BRIDGE_ROOT resolution — mirror scsBridgeJsonWatcher.principle.huirth.ts:54-57.
// dev:self: SCS_BRIDGE_ROOT_OVERRIDE points at the SCS root where the CLI writes bridge.json + sessions.json.
// install: falls back to process.cwd()/Cascades/Bridge. The transcript-watcher's POST endpoint
// MUST resolve to the SAME live CLI the json-watcher reads (RISK-3 alignment).
const BRIDGE_ROOT = resolveBridgeRoot();
const BRIDGE_JSON_PATH = path.join(BRIDGE_ROOT, 'bridge.json');

export type ScsBridgeSessionTranscriptWatcherDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
};

export type ScsBridgeSessionTranscriptWatcherPrincipleType = PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeSessionTranscriptWatcherDeck,
  ScsBridgeHuirthState
>;

export const scsBridgeSessionTranscriptWatcherPrinciple: ScsBridgeSessionTranscriptWatcherPrincipleType =
  ({ d_, plan }) => {
    console.log(
      '[SCS-Bridge TranscriptWatcher] Principle started · NCEC watcher',
    );

    // WDLS · Watcher-Dictionary-Local-Scope
    // FSWatcher objects are not JSON-safe — MUST live in closure, never in state.
    const sessionWatchers = new Map<string, FSWatcher>();
    const sessionDebounceTimers = new Map<string, NodeJS.Timeout>();

    // DIAGNOSTIC-REENGAGED R2 · WDLS roll-up buffer (S6 §B.1).
    // pendingExtractionIds accumulates session IDs to extract; the flush timer
    // coalesces them into ONE batched POST. NOT JSON-safe — closure-only.
    const pendingExtractionIds = new Set<string>();
    let extractionFlushTimer: NodeJS.Timeout | null = null;

    // DIAGNOSTIC-REENGAGED R2 · the batched inline trigger (S6 §B.3).
    // Reads bridge.json (BRIDGE_ROOT mirror) → endpoint → ONE POST /mcp carrying
    // the rolled-up sessionIds array. NCEC keystone: this is a FETCH (HTTP side-effect
    // outside the muxium), NOT a Stratimux dispatch — it cannot trigger DELETED-PLAN
    // halting protection, so it is legal to schedule from the selector-reactive Stage 2.
    // RISK-1 non-fatal: try/catch logs + skips on any failure, never throws into the watcher.
    async function triggerPersistLastTurnBatch(sessionIds: string[]): Promise<void> {
      if (sessionIds.length === 0) return;
      try {
        const raw = await readFile(BRIDGE_JSON_PATH, 'utf-8');
        const shape = JSON.parse(raw) as { endpoint?: string };
        if (!shape?.endpoint) {
          console.warn('[TranscriptWatcher] no bridge endpoint · skip persist');
          return;
        }
        await fetch(`${shape.endpoint}/mcp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name: 'scs_persist_last_turn', arguments: { sessionIds } },
          }),
          keepalive: true,
        });
        // Salvo-fix Muxistration Proof: ONE batched POST per debounce window (NOT N calls).
        console.log('[TranscriptWatcher] batch persist POST sent · count=', sessionIds.length);
      } catch (err) {
        console.warn('[TranscriptWatcher] batch persist POST failed · count=', sessionIds.length, '· err=', String(err));
      }
    }

    // DIAGNOSTIC-REENGAGED R2 · single shared debounce-flush (S6 §B.2).
    // Drain-before-await: snapshot ids + clear() SYNCHRONOUSLY before the async POST.
    // Any chokidar event arriving during the in-flight POST re-fills the Set and
    // re-schedules — no lost IDs, no double-send of the same window.
    function scheduleExtractionFlush(): void {
      if (extractionFlushTimer) clearTimeout(extractionFlushTimer);
      extractionFlushTimer = setTimeout(() => {
        extractionFlushTimer = null;
        if (pendingExtractionIds.size === 0) return;
        const ids = Array.from(pendingExtractionIds); // snapshot
        pendingExtractionIds.clear(); // drain BEFORE the await
        void triggerPersistLastTurnBatch(ids); // ONE batched POST (fire-and-forget side-effect · NOT a dispatch)
      }, EXTRACTION_FLUSH_DEBOUNCE_MS);
    }

    // PSWO · Per-Session-Watcher-Orchestration
    // Arms a chokidar watcher for the given session's Claude project directory.
    // Guards on both claudeSessionId AND cwd being present (Angle 7 discipline).
    // Only adds to sessionWatchers Map on SUCCESSFUL arm (not on early-skip).
    function armSessionWatcher(
      sessionId: string,
      cwd: string,
      claudeSessionId: string,
    ): void {
      // D1 · Path B encoding: replace every / with - to match Claude Code project dir naming
      // Confirmed by ls ~/.claude/projects/ — e.g. <project-slug>
      const encodedCwd = cwd.replace(/\//g, '-');
      const transcriptDir = path.join(
        os.homedir(),
        '.claude',
        'projects',
        encodedCwd,
      );

      console.log(
        '[SCS-Bridge TranscriptWatcher] Arming · sessionId=',
        sessionId,
        '· encodedCwd=',
        encodedCwd,
        '· dir=',
        transcriptDir,
      );

      try {
        const watcher = chokidarWatch(transcriptDir, {
          persistent: true,
          ignoreInitial: false,
          awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
          depth: 0,
        });

        // PCAD · Path-Carried-Action-Dispatch
        // Only react to the specific claudeSessionId .jsonl file for this session.
        const targetFile = `${claudeSessionId}.jsonl`;

        const handleEvent = (filePath: string): void => {
          if (!path.basename(filePath).endsWith(targetFile)) return;

          // Per-session debounce — keyed to sessionId (GCWP-safe: timer removed on teardown)
          const existing = sessionDebounceTimers.get(sessionId);
          if (existing) clearTimeout(existing);

          sessionDebounceTimers.set(
            sessionId,
            setTimeout(() => {
              sessionDebounceTimers.delete(sessionId);
              console.log(
                '[SCS-Bridge TranscriptWatcher] Event · sessionId=',
                sessionId,
                '· file=',
                filePath,
              );
              // DIAGNOSTIC-REENGAGED R2 (S6 §B.1 · change roll-up): no longer dispatch
              // the SCP-local AQSD quality. Instead roll this sessionId into the buffer
              // and schedule the cross-session flush → ONE batched POST to the CLI
              // scs_persist_last_turn MCP tool. NCEC-safe: the flush fires a fetch, not
              // a dispatch — no muxium action enters the queue (NAQA moot here).
              pendingExtractionIds.add(sessionId);
              scheduleExtractionFlush();
            }, TRANSCRIPT_DEBOUNCE_MS),
          );
        };

        watcher.on('add', handleEvent);
        watcher.on('change', handleEvent);
        watcher.on('error', (err) => {
          console.warn(
            '[SCS-Bridge TranscriptWatcher] chokidar error · sessionId=',
            sessionId,
            err,
          );
        });

        // Only add to Map on successful arm (Angle 7: not on early-skip due to missing fields)
        sessionWatchers.set(sessionId, watcher);
        console.log(
          '[SCS-Bridge TranscriptWatcher] Armed · sessionId=',
          sessionId,
        );

        // DIAGNOSTIC-REENGAGED R2 (S6 §B.1 · bootstrap roll-up): TRBL cold-start
        // extraction is no longer a per-arm muxium dispatch. Roll this freshly-armed
        // sessionId into the buffer; the CALLER (Stage 1 after its arm loop, or Stage 2
        // under the armedAny guard) calls scheduleExtractionFlush() ONCE — so N arms
        // collapse to ONE batched POST (the salvo fix). NO flush here.
        pendingExtractionIds.add(sessionId);
      } catch (err) {
        console.warn(
          '[SCS-Bridge TranscriptWatcher] arm failed · sessionId=',
          sessionId,
          err,
        );
        // Do NOT add to sessionWatchers — arm failed, no watcher to track
      }
    }

    // GCWP · Graceful-Cleanup-Watcher-Pattern
    // Called from Stage-2 when a session disappears from sessionsList.
    // Cleanup order: timer cancel → debounce delete → try watcher.close catch → map delete
    function tearDownSessionWatcher(sessionId: string): void {
      const timer = sessionDebounceTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        sessionDebounceTimers.delete(sessionId);
      }
      // DIAGNOSTIC-REENGAGED R2 (S6 §B.5 Check 3): a torn-down session's JSONL is no
      // longer relevant — drop it from the roll-up buffer. NOT a correctness blocker
      // (the CLI handler skips not-found/no-claudeSessionId ids) but the GCWP-faithful move.
      pendingExtractionIds.delete(sessionId);
      const watcher = sessionWatchers.get(sessionId);
      if (watcher) {
        try {
          watcher.close();
        } catch {
          // HAZARD-GR: already closed — safe no-op (template L332-342 discipline)
        }
        sessionWatchers.delete(sessionId);
      }
      console.log(
        '[SCS-Bridge TranscriptWatcher] Torn down · sessionId=',
        sessionId,
      );
    }

    const transcriptPlan = plan(
      'ScsBridge Session Transcript Watcher (Huirth · NCEC)',
      ({ stage }) => [
        // Stage 1 · MKAS initial arm · read current sessionsList and advance to Stage 2
        stage(
          ({ d, dispatch }) => {
            console.log(
              '[SCS-Bridge TranscriptWatcher] Stage 1 · MKAS initial arm',
            );
            const list = d.scsBridge.k.sessionsList.select() ?? [];
            for (const session of list) {
              if (
                session.claudeSessionId &&
                session.cwd &&
                !sessionWatchers.has(session.id)
              ) {
                armSessionWatcher(
                  session.id,
                  session.cwd,
                  session.claudeSessionId,
                );
              }
            }
            // DIAGNOSTIC-REENGAGED R2 (S6 §B.4): ONE flush AFTER the arm loop coalesces
            // all N bootstrap .add()s into a single batched POST (salvo fix). The
            // muxiumKick dispatch below stays a synchronous-stage-body dispatch with
            // iterateStage — the only surviving muxium dispatch in this watcher.
            scheduleExtractionFlush();
            dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
          },
          { beat: 33 },
        ),

        // Stage 2 · SLSF selector-reactive · NCEC — NO dispatch, NO conclude, NO Stage 3
        // Re-fires whenever sessionsList reference changes (new array object from reducer).
        // PSWO: arms watchers for sessions not yet in dict.
        // GCWP: tears down watchers for sessions removed from list.
        // beat: 100 debounces transcript-update refires (Angle 9: bounded reentrancy).
        // R4 HIGH HAZARD: MUST NOT call dispatch() here — DELETED PLAN risk.
        stage(
          ({ d }) => {
            const list = d.scsBridge.k.sessionsList.select() ?? [];
            const currentIds = new Set(list.map((s) => s.id));

            // DIAGNOSTIC-REENGAGED R2 (S6 §B.5 Check 4): armedAny gate makes the
            // convergence obvious-by-construction. A snippet-write-triggered re-fire
            // (no NEW session) arms nothing → armedAny stays false → no flush → no POST.
            // Bounded reentrancy without relying solely on the empty-Set guard.
            let armedAny = false;

            // PSWO — arm new sessions that have both required fields
            for (const session of list) {
              if (
                session.claudeSessionId &&
                session.cwd &&
                !sessionWatchers.has(session.id)
              ) {
                armSessionWatcher(
                  session.id,
                  session.cwd,
                  session.claudeSessionId,
                );
                armedAny = true;
              }
            }

            // GCWP — tear down watchers for ULIDs no longer in sessionsList
            for (const watchedId of Array.from(sessionWatchers.keys())) {
              if (!currentIds.has(watchedId)) {
                tearDownSessionWatcher(watchedId);
              }
            }

            // DIAGNOSTIC-REENGAGED R2: only flush if PSWO armed a NEW session this fire.
            // armSessionWatcher already .add()'d each new id to pendingExtractionIds.
            if (armedAny) scheduleExtractionFlush();

            console.log(
              '[SCS-Bridge TranscriptWatcher] SLSF fire · activeWatchers=',
              sessionWatchers.size,
            );
            // NO dispatch · NO iterateStage · NO conclude — NCEC by construction
            // (scheduleExtractionFlush fires a FETCH, not a dispatch — keystone safe)
            // This stage re-fires only on sessionsList selector change
          },
          { selectors: [d_.scsBridge.k.sessionsList], beat: 100 },
        ),

        // NCEC: there is intentionally no Stage 3 with conclude().
        // The plan is the permanent sentinel for the principle lifetime.
      ],
    );

    // HAZARD-A + Angle 1 cleanup: timers first → watchers second (Map.forEach both)
    // No plan.conclude() needed — NCEC design (the plan never concludes on its own)
    return () => {
      console.log(
        '[SCS-Bridge TranscriptWatcher] Principle cleanup · clearing all watchers',
      );
      // DIAGNOSTIC-REENGAGED R2 (S6 §B.5 Check 3 · GCWP timers-first): clear the
      // roll-up flush timer + drain the buffer BEFORE closing watchers — prevents a
      // post-teardown batched POST (Detached-Lambda leak).
      if (extractionFlushTimer) clearTimeout(extractionFlushTimer);
      extractionFlushTimer = null;
      pendingExtractionIds.clear();
      // Timers first — prevent any post-teardown dispatches
      sessionDebounceTimers.forEach((timer) => clearTimeout(timer));
      sessionDebounceTimers.clear();
      // Watchers second — close all chokidar watchers
      sessionWatchers.forEach((watcher) => {
        try {
          watcher.close();
        } catch {
          // already closed — safe no-op
        }
      });
      sessionWatchers.clear();
      transcriptPlan.conclude();
    };
  };
