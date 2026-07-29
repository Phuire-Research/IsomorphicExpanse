/**
 * suiteCascadeSetActiveCascadeFilesRelay Quality — Dual-Deployment Reducer
 *
 * Band B-4 WCJF · SBIS Relay (Informative) companion to
 * suiteCascadeSetActiveCascadeFilesHuirthBase.
 *
 * Huirth: dispatched by the WCJF watcher alongside its Base sibling after reading the
 *   live markdown of each file listed in the Cascade.json manifest.
 * Client: receives the broadcast via actionExchange.serverToClient (Path B). Replaces
 *   the finite activeCascadeFiles list for the named entry so the ACFR (B-2) render
 *   surface reacts. If the entry was not registered first, no-op ({}).
 *
 * Shared reducer state shape `{ cascades }` (Huirth + Client identical). Shortest-path
 * return: spread the Record + the single entry; never spread the whole state.
 *
 * Type-string source of truth: actionExchange declaration in suiteCascade.muxonomy.ts.
 * Must match EXACTLY ('Suite Cascade Set Active Cascade Files Relay').
 *
 * Citation: scsBridge/qualities/setSessionsListRelay.quality.ts (dual-deployment relay bearing).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Cascade, SuiteCascadeSetActiveCascadeFilesRelayPayload } from '../suiteCascade.type';

export type { SuiteCascadeSetActiveCascadeFilesRelayPayload };

export const suiteCascadeSetActiveCascadeFilesRelay = createQualityCardWithPayload<
  { cascades: Record<string, Cascade> },
  SuiteCascadeSetActiveCascadeFilesRelayPayload
>({
  type: 'Suite Cascade Set Active Cascade Files Relay',
  reducer: (state, action) => {
    const { name, activeCascadeFiles } = action.payload;
    const existing = state.cascades[name];
    // PAYLOAD TELEMETRY (Band1-L3) — client-guarded receive log · name + fileCount + whether the
    // entry was registered first (existing). !existing → the SBIS ordering no-op (the blind spot).
    if (typeof window !== 'undefined') {
      console.log(
        '[SuiteCascade RELAY recv] activeFiles ·',
        name,
        '· fileCount=',
        (activeCascadeFiles ?? []).length,
        '· registered=',
        existing ? 'yes' : 'NO(no-op)',
      );
    }
    if (!existing) {
      return {};
    }
    return {
      cascades: {
        ...state.cascades,
        [name]: {
          ...existing,
          activeCascadeFiles,
        },
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
