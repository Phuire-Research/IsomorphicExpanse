/**
 * scsBridgeSetSessionTranscriptDataHuirthBase Quality — Huirth-Only Base State Setter
 *
 * D3F Diamond B · Cycle 164 R3 · Wave-1 Server Substrate
 *
 * SBIS Base companion to scsBridgeSetSessionTranscriptDataRelay.
 * Dispatched by scsBridgeReadSessionTranscript AQSD Quality alongside the Relay.
 * Runs Huirth-local reducer only — NOT in actionExchange.serverToClient.
 *
 * INVARIANT: MUST NOT appear in actionExchange.serverToClient.
 * INVARIANT: MUST NOT be registered in scsBridge.concept.client.ts.
 * INVARIANT: IS registered in scsBridge.concept.huirth.ts only.
 *
 * GCWP (Graceful-Cleanup-Watcher-Pattern): reducer returns unchanged state (null-equiv)
 * when sessionId is not found in sessionsList. Handles in-flight race with session removal.
 *
 * Citation: setSessionsListHuirthBase.quality.ts (SBIS Base pattern)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeSessionEntry,
  ScsBridgeSetSessionTranscriptDataPayload,
} from '../scsBridge.type';

export const scsBridgeSetSessionTranscriptDataHuirthBase =
  createQualityCardWithPayload<
    { sessionsList: ScsBridgeSessionEntry[] },
    ScsBridgeSetSessionTranscriptDataPayload
  >({
    type: 'Scs Bridge Set Session Transcript Data Huirth Base',
    reducer: (state, action) => {
      const {
        sessionId,
        transcriptSnippet,
        transcriptLastUserInput,
        transcriptLastModelOutput,
        transcriptLastReadAt,
        transcriptPath,
      } = action.payload;

      const idx = state.sessionsList.findIndex((s) => s.id === sessionId);
      if (idx === -1) {
        // GCWP · NOOP guard · race-safe · session removed in-flight
        console.log(
          '[SCS-Bridge SetTranscript-Base] GCWP NOOP · sessionId not found · sessionId=',
          sessionId,
        );
        return state;
      }

      const updated = state.sessionsList.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              transcriptSnippet,
              transcriptLastUserInput,
              transcriptLastModelOutput,
              transcriptLastReadAt,
              transcriptPath,
            }
          : s,
      );

      console.log(
        '[SCS-Bridge SetTranscript-Base] sessionId=',
        sessionId,
        '· snippet length=',
        transcriptSnippet?.length ?? 0,
      );

      return { sessionsList: updated };
    },
    methodCreator: defaultMethodCreator,
  });
