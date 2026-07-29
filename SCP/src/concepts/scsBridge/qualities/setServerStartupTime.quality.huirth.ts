/**
 * setServerStartupTime Quality — Huirth Reducer (PP-D4 · Stale-Pong Baseline)
 *
 * Captures huirth boot timestamp into ScsBridgeHuirthState.serverStartupTime.
 * Dispatched once on principle startup by scsBridgeJsonWatcherPrinciple BEFORE
 * any bridge.json read. Any pre-existing pongReceipt in bridge.json will have
 * a respondedAt less than this timestamp (prior session), correctly reading
 * as Pending on the Client (bridgeActive = pongReceipt.respondedAt > serverStartupTime).
 *
 * Relayed to Client via extended setBridgeJsonRelay payload (single broadcast
 * carries both bridgeJson and serverStartupTime atomically).
 *
 * Type-string source of truth: 'Scs Bridge Set Server Startup Time' — must
 * match TQNI invariant via Verbose Split Naming.
 *
 * Pattern: simple-setter reducer (M63 from setBridgeStatus.quality.client.ts).
 * Shortest-path return per Stratimuxian Scholar S10 reducer optimization.
 *
 * Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2 Amendment
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeHuirthState,
  ScsBridgeSetServerStartupTimePayload,
} from '../scsBridge.type';

export type { ScsBridgeSetServerStartupTimePayload };

export const scsBridgeSetServerStartupTime = createQualityCardWithPayload<
  ScsBridgeHuirthState,
  ScsBridgeSetServerStartupTimePayload
>({
  type: 'Scs Bridge Set Server Startup Time',
  reducer: (_state, action) => ({
    serverStartupTime: action.payload.timestamp,
  }),
  methodCreator: defaultMethodCreator,
});
