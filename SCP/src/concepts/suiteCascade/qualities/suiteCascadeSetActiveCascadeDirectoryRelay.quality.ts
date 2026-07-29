/**
 * suiteCascadeSetActiveCascadeDirectoryRelay Quality — Dual-Deployment (Huirth + Client) · Band B-5 SDCR + GRID
 *
 * SBIS Relay (Informative) companion to suiteCascadeSetActiveCascadeDirectoryHuirthBase.
 *
 * Huirth: dispatched by the WCJF watcher alongside the Base re-scope action. On the
 *   Huirth side this reducer ALSO runs locally (harmless idempotent re-write) — but its
 *   PRIMARY purpose is to be intercepted by Path B actionExchange.serverToClient and
 *   routed to every connected Client.
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Path B explicit
 *   broadcast · mirrors suiteCascadeSetCascadeRelay). Writes `activeCascadeDirectory`
 *   into the Client state so the HCD Home context selector reflects the active context
 *   (GRID vs a docked Suite8) through DECK K.
 *
 * The reducer state shape carries `activeCascadeDirectory` — shared by both deployments
 * (Huirth + Client states are structurally identical for this field). Shortest-path
 * return: ONLY the changed property.
 *
 * Type-string source of truth: the actionExchange declaration in suiteCascade.muxonomy.ts.
 * Must match EXACTLY ('Suite Cascade Set Active Cascade Directory Relay').
 *
 * Citation: suiteCascadeSetCascadeRelay.quality.ts (dual-deployment relay bearing).
 * Citation: feedback_stratidian_base_informative_state.md (SBIS Relay = Informative path).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { SuiteCascadeSetActiveCascadeDirectoryRelayPayload } from '../suiteCascade.type';

export type { SuiteCascadeSetActiveCascadeDirectoryRelayPayload };

export const suiteCascadeSetActiveCascadeDirectoryRelay = createQualityCardWithPayload<
  { activeCascadeDirectory: string },
  SuiteCascadeSetActiveCascadeDirectoryRelayPayload
>({
  type: 'Suite Cascade Set Active Cascade Directory Relay',
  reducer: (state, action) => {
    const { activeCascadeDirectory } = action.payload;
    // SHORTEST PATH — return ONLY the changed property.
    return {
      activeCascadeDirectory,
    };
  },
  methodCreator: defaultMethodCreator,
});
