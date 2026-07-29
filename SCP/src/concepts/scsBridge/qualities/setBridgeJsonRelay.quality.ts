/**
 * setBridgeJsonRelay Quality — Dual-Deployment (Huirth + Client) Reducer
 *
 * Cycle 155 · BJDP (Bridge-Json Discovery Path) · Foundation A Wave 2
 *
 * Huirth: dispatched by scsBridgeJsonWatcherPrinciple on initial read and on
 *   filesystem change of ./Cascades/Bridge/bridge.json. Writes the parsed
 *   BridgeJsonShape (or null on parse failure / ENOENT) into Huirth state.
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Path B
 *   explicit broadcast pattern · mirrors scsBridgeSetBridgeStatus precedent).
 *   Writes payload into Client state for Vue rendering through DECK K.
 *
 * Both deployments use identical reducer logic — shortest-path return per
 * Stratimuxian Scholar S10 reducer optimization (only the changed property
 * is returned, NOT the full spread state).
 *
 * Type-string source of truth: actionExchange declaration in scsBridge.muxonomy.ts.
 * Must match EXACTLY ('Scs Bridge Set Bridge Json Relay').
 *
 * PACP (Payload Action Concept Prefix · M162): payload property
 * `scsBridgeBridgeJson` carries the concept-name prefix to avoid Action base
 * type collision.
 *
 * Citation: FOUNDATION-A consolidated RD §3 Q3 (Path B) · §6 File 2
 * Citation: notification/qualities/addNotification.quality.ts (dual-deployment exemplar)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { BridgeJsonShape } from '../scsBridge.type';

// PP-D4 · Extended payload carries serverStartupTime alongside bridgeJson.
// Single broadcast carries both facts atomically — Client cannot compute
// bridgeActive without serverStartupTime baseline.
// Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-C-CLIENT-3SURFACE-BLUEPRINT.md §2
export type ScsBridgeSetBridgeJsonRelayPayload = {
  scsBridgeBridgeJson: BridgeJsonShape | null;
  serverStartupTime: number | null;
};

export const scsBridgeSetBridgeJsonRelay = createQualityCardWithPayload<
  {
    bridgeJson: BridgeJsonShape | null;
    serverStartupTime: number | null;
    connectionEstablished?: boolean;
  },
  ScsBridgeSetBridgeJsonRelayPayload
>({
  type: 'Scs Bridge Set Bridge Json Relay',
  reducer: (state, action) => {
    // LSSD · Reducer entry witness · fires in BOTH Huirth + Client deployments.
    // Citation: PING-GATE-BLOCKED-DIAGNOSIS-R7-FUCHSIA-CLINICAL.md §4 LSSD
    console.log(
      '[SCS-Bridge setBridgeJsonRelay] Reducer · endpoint=',
      action.payload.scsBridgeBridgeJson?.endpoint,
      '· sst=',
      action.payload.serverStartupTime,
    );

    // Option B · Relay-Level Flip (SF-2) · Cycle 160 R7 Cobalt-LSSD-SF2 Combined.
    // When the incoming bridgeJson carries a non-empty endpoint, treat the filesystem
    // relay AS the connection-established signal. Eliminates dependency on the sentinel
    // round-trip (sendBridgeMessage → huirth → setBridgeStatus) that was never wired to
    // dispatch back. Sticky-up gate: NEVER regress true→false. Only flip false→true.
    // Citation: PING-GATE-BLOCKED-DIAGNOSIS-R4-VIRIDIAN-AUDIT.md §SF-1
    // Citation: PING-GATE-BLOCKED-DIAGNOSIS-R7-FUCHSIA-CLINICAL.md §5 Primary
    const incomingEndpoint = action.payload.scsBridgeBridgeJson?.endpoint;
    const shouldEstablish = (incomingEndpoint?.length ?? 0) > 0;
    const currentConnectionEstablished = (state as { connectionEstablished?: boolean })
      .connectionEstablished;

    // Flip-event log fires ONLY when this deployment owns connectionEstablished
    // (Client state) AND we are transitioning false → true. Huirth state lacks the
    // field (undefined) · the flip log is silently skipped there.
    if (
      shouldEstablish &&
      currentConnectionEstablished === false
    ) {
      console.log(
        '[SCS-Bridge setBridgeJsonRelay] connectionEstablished → TRUE (via relay endpoint presence · SF-2)',
      );
    }

    // Sticky-up gate · only include connectionEstablished in return when it would
    // actually flip false → true. Preserves Huirth state (no field) and avoids
    // regressing true → false on Client state.
    const base: {
      bridgeJson: BridgeJsonShape | null;
      serverStartupTime: number | null;
      connectionEstablished?: boolean;
    } = {
      bridgeJson: action.payload.scsBridgeBridgeJson,
      // PP-D4 · pass through if payload provides, else preserve existing
      serverStartupTime:
        action.payload.serverStartupTime ?? state.serverStartupTime,
    };
    if (
      shouldEstablish &&
      currentConnectionEstablished === false
    ) {
      base.connectionEstablished = true;
    }
    return base;
  },
  methodCreator: defaultMethodCreator,
});
