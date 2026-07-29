/**
 * setSessionsListRelay Quality — Dual-Deployment (Huirth + Client) Reducer
 *
 * Cycle 155 · BJDP (Bridge-Json Discovery Path) · Foundation A Wave 2
 *
 * Huirth: dispatched by scsBridgeJsonWatcherPrinciple on initial read and on
 *   filesystem change of ./Cascades/Bridge/sessions.json. Writes the parsed
 *   ScsBridgeSessionEntry[] (empty array on parse failure / ENOENT — M60
 *   State-or-Payload Anor) into Huirth state.
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Path B
 *   explicit broadcast · mirrors scsBridgeSetBridgeStatus precedent). Writes
 *   payload into Client state for Vue rendering.
 *
 * Both deployments use identical reducer logic — shortest-path return.
 *
 * Type-string source of truth: actionExchange declaration in scsBridge.muxonomy.ts.
 * Must match EXACTLY ('Scs Bridge Set Sessions List Relay').
 *
 * PACP: payload property `scsBridgeSessionsList` carries concept-name prefix.
 *
 * Citation: FOUNDATION-A consolidated RD §3 Q3 (Path B) · §6 File 3
 * Citation: setBridgeJsonRelay.quality.ts (sibling pattern · same structural form)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { ScsBridgeSessionEntry } from '../scsBridge.type';

export type ScsBridgeSetSessionsListRelayPayload = {
  scsBridgeSessionsList: ScsBridgeSessionEntry[];
};

export const scsBridgeSetSessionsListRelay = createQualityCardWithPayload<
  { sessionsList: ScsBridgeSessionEntry[] },
  ScsBridgeSetSessionsListRelayPayload
>({
  type: 'Scs Bridge Set Sessions List Relay',
  reducer: (_state, action) => {
    console.log('[SCS-Bridge SLSR-Reducer] setSessionsListRelay · sessionsList length=', action.payload.scsBridgeSessionsList?.length ?? 0);
    return {
      sessionsList: action.payload.scsBridgeSessionsList,
    };
  },
  methodCreator: defaultMethodCreator,
});
