/**
 * setBridgeStatus Quality — Client Reducer (ServerToClient sync target)
 *
 * Local reducer the server's ServerToClient Diameter routes to. Updates
 * bridgeStatus + bridgeStatusLastUpdate. On the FIRST non-empty payload,
 * flips connectionEstablished to true (CESA — Connection-Established-
 * Selector-Anchor · per D2 R6 reasoning) gating the scsBridgeConnection
 * principle's one-time dispatch.
 *
 * Type-string source of truth: D1's actionExchange declaration in
 * scsBridge.muxonomy.ts. Must match EXACTLY ('Scs Bridge Set Bridge Status').
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave B
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetBridgeStatusPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetBridgeStatusPayload };

export const scsBridgeSetBridgeStatus = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetBridgeStatusPayload
>({
  type: 'Scs Bridge Set Bridge Status',
  reducer: (state, action) => {
    const nextStatus = action.payload.bridgeStatus;
    const shouldEstablishConnection =
      !state.connectionEstablished && nextStatus.length > 0;

    // LSSD · Reducer entry witness · CESA round-trip path (Option A fallback).
    // After Option B (setBridgeJsonRelay flip), this path is provisional — kept
    // to observe whether the sentinel round-trip ever lands.
    // Citation: PING-GATE-BLOCKED-DIAGNOSIS-R7-FUCHSIA-CLINICAL.md §4 LSSD reducer
    console.log(
      '[SCS-Bridge setBridgeStatus] Reducer · nextStatus="',
      nextStatus,
      '" · willFlipConn=',
      shouldEstablishConnection,
    );

    if (shouldEstablishConnection) {
      console.log(
        '[SCS-Bridge setBridgeStatus] connectionEstablished → TRUE (via setBridgeStatus quality)',
      );
      return {
        bridgeStatus: nextStatus,
        bridgeStatusLastUpdate: Date.now(),
        connectionEstablished: true,
      };
    }

    return {
      bridgeStatus: nextStatus,
      bridgeStatusLastUpdate: Date.now(),
    };
  },
  methodCreator: defaultMethodCreator,
});
