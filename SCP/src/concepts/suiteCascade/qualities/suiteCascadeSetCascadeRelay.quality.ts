/**
 * suiteCascadeSetCascadeRelay Quality — Dual-Deployment (Huirth + Client) Reducer
 *
 * Band B-4 WCJF · SBIS Relay (Informative) companion to suiteCascadeSetCascadeHuirthBase.
 *
 * Huirth: dispatched by the WCJF watcher principle alongside the Base action. On the
 *   Huirth side this reducer ALSO runs locally (harmless idempotent re-write of the
 *   same entry) — but its PRIMARY purpose is to be intercepted by Path B
 *   actionExchange.serverToClient and routed to every connected Client.
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Path B explicit
 *   broadcast · mirrors scsBridgeSetBridgeJsonRelay). Writes the registered Cascade
 *   entry into the Client `cascades` Record for Vue rendering through DECK K.
 *
 * The reducer state shape is `{ cascades: Record<string, Cascade> }` — shared by
 * both deployments (Huirth + Client states are structurally identical). Shortest-path
 * return: spread the Record, never the whole state.
 *
 * Type-string source of truth: the actionExchange declaration in suiteCascade.muxonomy.ts.
 * Must match EXACTLY ('Suite Cascade Set Cascade Relay').
 *
 * Citation: scsBridge/qualities/setBridgeJsonRelay.quality.ts (dual-deployment relay bearing).
 * Citation: feedback_stratidian_base_informative_state.md (SBIS Relay = Informative path).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Cascade, SuiteCascadeSetCascadeRelayPayload } from '../suiteCascade.type';

export type { SuiteCascadeSetCascadeRelayPayload };

export const suiteCascadeSetCascadeRelay = createQualityCardWithPayload<
  { cascades: Record<string, Cascade> },
  SuiteCascadeSetCascadeRelayPayload
>({
  type: 'Suite Cascade Set Cascade Relay',
  reducer: (state, action) => {
    const { name, cascade } = action.payload;
    // PAYLOAD TELEMETRY (Band1-L3) — client-guarded receive log · the received name + fileCount.
    // Never throws (guarded window check · optional-chained count).
    if (typeof window !== 'undefined') {
      console.log(
        '[SuiteCascade RELAY recv] cascade ·',
        name,
        '· fileCount=',
        (cascade?.activeCascadeFiles ?? []).length,
      );
    }
    return {
      cascades: {
        ...state.cascades,
        [name]: cascade,
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
