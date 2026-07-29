/**
 * @deprecated DIAGNOSTIC-REENGAGED R2 · superseded by the CLI scs_persist_last_turn
 * MCP tool (Single-Writer persistence into sessions.json) + the scsBridgeJsonWatcher
 * carry (the session-list broadcast now carries the persisted transcriptSnippet).
 * Its HBSU Base-state update (:243-250) + WSS Relay broadcast bundle (:256-266) are
 * now REDUNDANT and would RACE the json-watcher's broadcast. After the transcript-
 * watcher rewrite (C4), NOTHING dispatches this quality — it is vestigial dead code,
 * registered on the concept but never fired. RETAINED this cycle (defer-prune): the
 * extraction logic now lives in src/lib/bridge/lastTurnExtraction.model.ts; schedule
 * a Maroon prune cycle (remove this quality + its concept-map entry + the
 * scsBridgeSetSessionTranscriptData* setters) once the MCP path is user-confirmed.
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S3-OCHRE-BLUEPRINT.md §5
 *
 * scsBridgeReadSessionTranscript Quality — Async JSONL Read + Chained Dispatch (AQSD)
 *
 * D3F Diamond B · Cycle 164 R3 · Wave-1 Server Substrate
 *
 * AQSD (Async-Quality-Strategy-Determine): reads the most-recently-modified
 * .jsonl file in a session's Claude project directory, extracts the last
 * user and model turns, then fires Base + Relay setters via controller.fire.
 *
 * Pattern source: strativerseMethodPatternsInfo.quality.huirth.ts:L72-82
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices"
 *
 * LJDR (Last-JSONL-Directory-Read): readdir + stat-sort + readFile
 * LTUM (Last-Turn-User-Model): HAZARD-D line-by-line try/catch parse
 * DASD (Deck-Access-Strategy-Determine): Base first, Relay second (SBIS order)
 * NAQA: uses controller.fire inside async method (NOT nextA — this is Quality scope)
 *
 * INVARIANT: reducer is nullReducer — async method owns all state updates.
 * INVARIANT: dispatched from principle via nextA; may also run inside a strategy.
 */
import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  strategySuccess,
  strategyData_muxifyData,
  muxiumConclude,
  muxiumTimeOut,
  nullReducer,
} from 'stratimux';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthDeck,
  ScsBridgeReadSessionTranscriptPayload,
} from '../scsBridge.type';

// PUTR · Per-Ulid-Transcript-Reader (S2 A.1)
// Resolves the EXACT per-session JSONL via CSJP path construction
// (path.join(sessionDir, `${claudeSessionId}.jsonl`)) — NO readdir, NO mtime-sort.
// Returns null on missing claudeSessionId, ENOENT, or any read failure.
// CRITICAL: NEVER falls back to directory-MRU — RMRA defeated structurally.
function readJsonlForSession(
  sessionDir: string,
  claudeSessionId: string,
): Promise<{ content: string; filePath: string } | null> {
  if (!claudeSessionId) return Promise.resolve(null);
  // CSJP · Claude-Session-JSONL-Path (S2 A.3) — byte-identical to watcher targetFile `:104`
  const filePath = path.join(sessionDir, `${claudeSessionId}.jsonl`);
  return stat(filePath)
    .then(() => readFile(filePath, 'utf-8').then((content) => ({ content, filePath })))
    .catch(() => null);
}

// LTUM helper — handles nested content shapes present in Claude Code JSONL
// Path 4 (Issue 1 fix): Claude Code v2.1.150 format: message.content as typed-block array
// c.type === 'text' filter MANDATORY — skips thinking blocks (prevents garbage bytes)
function extractContentText(entry: Record<string, unknown>): string {
  if (typeof entry?.content === 'string') return entry.content as string;
  if (Array.isArray(entry?.content)) {
    return (entry.content as Array<Record<string, unknown>>)
      .map((c) => (c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string' ? (c.text as string) : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  const msg = entry?.message as Record<string, unknown> | undefined;
  if (typeof msg?.content === 'string') return msg.content as string;
  if (Array.isArray(msg?.content)) {
    return (msg.content as Array<Record<string, unknown>>)
      .map((c) => (c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string' ? (c.text as string) : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  return '';
}

// LTUM · Last-Turn-User-Model
// Parses JSONL content line-by-line with HAZARD-D defensive parse.
// Returns the terminal user message and terminal model message.
function extractLastTurn(jsonlContent: string): {
  lastUser: string;
  lastModel: string;
} {
  const lines = jsonlContent.split('\n').filter((l) => l.trim().length > 0);
  let lastUser = '';
  let lastModel = '';

  for (const line of lines) {
    try {
      // HAZARD-D-Reuse: JSON.parse in try/catch — skip malformed/binary lines
      const obj = JSON.parse(line) as Record<string, unknown>;
      const role = (obj?.role ?? obj?.type) as string | undefined;
      if (!role) continue;

      const content = extractContentText(obj);
      if (!content) continue;

      if (role === 'user') {
        lastUser = content;
      } else if (role === 'assistant') {
        lastModel = content;
      }
    } catch {
      // HAZARD-D: skip silently — never throw out of extractor
    }
  }

  return { lastUser, lastModel };
}

// AQSD Quality — async read + controller.fire chained dispatch
export const scsBridgeReadSessionTranscript = createQualityCardWithPayload<
  ScsBridgeHuirthState,
  ScsBridgeReadSessionTranscriptPayload,
  ScsBridgeHuirthDeck
>({
  type: 'Scs Bridge Read Session Transcript',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, deck, concepts_ }) => {
      const { sessionId, sessionDir, claudeSessionId } = action.payload;

      console.log(
        '[SCS-Bridge ReadTranscript] PUTR start · sessionId=',
        sessionId,
        '· claudeSessionId=',
        claudeSessionId,
        '· dir=',
        sessionDir,
      );

      readJsonlForSession(sessionDir, claudeSessionId)
        .then((result) => {
          if (!result) {
            console.warn(
              '[SCS-Bridge ReadTranscript] PUTR · no per-ulid .jsonl found · sessionId=',
              sessionId,
              '· claudeSessionId=',
              claudeSessionId,
            );
            if (action.strategy) {
              controller.fire(strategySuccess(action.strategy));
            } else {
              controller.fire(muxiumConclude());
            }
            return;
          }

          const { content, filePath } = result;
          const { lastUser, lastModel } = extractLastTurn(content);

          // TSTR: 120-char truncated snippet for SRBR always-visible display
          const transcriptSnippet =
            lastModel.length > 0
              ? lastModel.slice(0, 120) + (lastModel.length > 120 ? '…' : '')
              : '';

          console.log(
            '[SCS-Bridge ReadTranscript] PUTR success · sessionId=',
            sessionId,
            '· snippet length=',
            transcriptSnippet.length,
            '· path=',
            filePath,
          );

          const transcriptLastReadAt = Date.now();

          // LSSD pre-fire log · CFRA diagnostic discipline
          console.log(
            '[SCS-Bridge ReadTranscript] About to fire Relay-only dispatch · sessionId=',
            sessionId,
            '· deck.scsBridge defined=',
            !!deck.scsBridge,
          );

          // Bug F fix · Cycle 164 R6 · BLCO discipline:
          // actionQue broadcasts EVERY action to ALL clients · HuirthBase is Huirth-only
          // (NOT in actionExchange.serverToClient · NOT registered in concept.client.ts).
          // Including HuirthBase in actionQue → Client receives unregistered action →
          // "Muxium Received a Bad Action" rejection (verified via browser console).
          //
          // Canonical pattern (per R4 Green audit · every existing WSS dispatch site):
          // SMRP scsBridgeStateMirror.principle.huirth.ts:L116-121 · sendBridgeMessage L246-253 ·
          // BOCR scsBridgeBackfillOnConnect — ALL bundle ONLY Relay-class actions (registered
          // in actionExchange.serverToClient · client-side concept). NEVER Huirth-only Base.
          //
          // Relay reducer is dual-deployed (registered in BOTH concept.huirth.ts AND
          // concept.client.ts · byte-for-byte IDENTICAL reducer body). When WSS dispatches
          // the Relay action, the reducer runs on Huirth side (updating local sessionsList)
          // AND broadcasts to Client (where reducer runs again with same payload).
          // Therefore HuirthBase is architecturally redundant for this dispatch path —
          // omit from bundle. Quality file remains for potential direct-Muxium dispatch.
          //
          // Cite: D3F-BUG-F-R4-GREEN-11-ANGLES.md §Angles 1+5+6 · D3F-BUG-F-R7-FUCHSIA-CLINICAL.md §B1.
          // Pattern: BLCO (Broadcast-Limited-to-Client-Only) — Onyx-bound discipline.
          const internalDeck = deck as unknown as {
            scsBridge: typeof deck.scsBridge;
            webSocketServer: {
              e: {
                webSocketServerAppendToActionQue: (payload: {
                  actionQue: unknown[];
                  targetClientStateKey?: string;
                  targetConnectionId?: string;
                }) => unknown;
              };
            };
          };
          const transcriptPayload = {
            sessionId,
            transcriptSnippet,
            transcriptLastUserInput: lastUser,
            transcriptLastModelOutput: lastModel,
            transcriptLastReadAt,
            transcriptPath: filePath,
          };
          // D3H · Wave 1 · HBSU (Huirth-Base-State-Update) via parallel muxiumTimeOut.
          // SBSF (Server-Barrier-to-Source-of-Filesystem): Huirth state IS the source
          // of truth — BOCR-Refine (Wave 2) reads from Huirth state via DECK K, so we
          // MUST update Huirth state here (not just broadcast Relay to clients).
          //
          // Canonical SBIS pattern at scsBridgeJsonWatcher.principle.huirth.ts:L210-215
          // dispatches HuirthBase + Relay sequentially via nextA from Principle scope.
          // Here we are in Quality scope (AQSD async method) — controller.fire is
          // single-use and reserved for strategy lifecycle (L238-242 CFRA constraint).
          //
          // Option E (Stratimux-canonical · verified at stratimux/dist/index.js:1758
          // muxiumTimeOut definition + :2227 muxiumRegisterTimeOut pattern):
          // muxiumTimeOut(concepts, () => action, 0) enqueues an arbitrary action
          // into the muxium queue. We invoke it TWICE:
          //   1) HuirthBase action → Huirth-local reducer runs (updates sessionsList
          //      with transcript fields) → SMRP selectors fire → Relay broadcasts.
          //   2) WSS bundle (Relay-only) → broadcast to all clients.
          // BLCO discipline preserved: HuirthBase is NOT in the actionQue bundle,
          // therefore NOT broadcast (Huirth-only action class · would crash Client
          // with "Muxium Received a Bad Action" if broadcast).
          //
          // Cite: D3H-FOUNDATION-R6-PURPLE-ORCHESTRATION.md (HBSU missing finding)
          // Cite: D3H-FOUNDATION-R7-FUCHSIA-CLINICAL.md (SBSF violation finding)
          // Cite: feedback_stratidian_base_informative_state.md (SBIS canonical)
          const huirthBaseAction = deck.scsBridge.e.scsBridgeSetSessionTranscriptDataHuirthBase(
            transcriptPayload,
          );
          muxiumTimeOut(
            concepts_,
            () => huirthBaseAction as never,
            0,
          );
          console.log(
            '[SCS-Bridge ReadTranscript] HBSU fire · sessionId=',
            sessionId,
          );

          const relayAction = deck.scsBridge.e.scsBridgeSetSessionTranscriptDataRelay(
            transcriptPayload,
          );
          muxiumTimeOut(
            concepts_,
            () =>
              internalDeck.webSocketServer.e.webSocketServerAppendToActionQue({
                actionQue: [relayAction],
              }) as never,
            0,
          );

          // LSSD pre-fire log · CFRA diagnostic discipline
          console.log(
            '[SCS-Bridge ReadTranscript] About to fire strategy completion · hasStrategy=',
            !!action.strategy,
          );

          // SINGLE controller.fire reserved for strategy lifecycle (single-use semantics)
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { sessionId, transcriptSnippet, transcriptPath: filePath })));
          } else {
            controller.fire(muxiumConclude());
          }

          console.log(
            '[SCS-Bridge ReadTranscript] All dispatches queued · sessionId=',
            sessionId,
          );
        })
        .catch((err) => {
          console.warn(
            '[SCS-Bridge ReadTranscript] LJDR failed · sessionId=',
            sessionId,
            '· err=',
            String(err),
          );
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
