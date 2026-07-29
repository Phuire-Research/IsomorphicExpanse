/**
 * scsBridgeSetSessionTranscriptDataRelay Quality — Dual-Deployment (Huirth + Client) Reducer
 *
 * D3F Diamond B · Cycle 164 R3 · Wave-1 Server Substrate
 *
 * Huirth: dispatched by scsBridgeReadSessionTranscript AQSD Quality alongside
 *   scsBridgeSetSessionTranscriptDataHuirthBase. Listed in actionExchange.serverToClient
 *   so the broadcast reaches the Client after the local reducer fires.
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Direct Relay decision —
 *   D2 committed in R3 Yellow Architecture). Writes transcript fields into Client state
 *   for Vue SRBR rendering.
 *
 * GCWP (Graceful-Cleanup-Watcher-Pattern): reducer returns unchanged state when
 * sessionId is not found. Handles in-flight race with session removal.
 *
 * Both deployments use identical reducer logic — shortest-path return `{ sessionsList: updated }`.
 *
 * Citation: setSessionsListRelay.quality.ts (dual-deployment pattern)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeSessionEntry,
  ScsBridgeSetSessionTranscriptDataPayload,
} from '../scsBridge.type';

export const scsBridgeSetSessionTranscriptDataRelay =
  createQualityCardWithPayload<
    { sessionsList: ScsBridgeSessionEntry[] },
    ScsBridgeSetSessionTranscriptDataPayload
  >({
    type: 'Scs Bridge Set Session Transcript Data Relay',
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
          '[SCS-Bridge SetTranscript-Relay] GCWP NOOP · sessionId not found · sessionId=',
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
        '[SCS-Bridge SetTranscript-Relay] sessionId=',
        sessionId,
        '· snippet length=',
        transcriptSnippet?.length ?? 0,
      );

      return { sessionsList: updated };
    },
    methodCreator: defaultMethodCreator,
  });
