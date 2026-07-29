/**
 * setArchiveManifestRelay Quality — Dual-Deployment (Huirth + Client) Reducer
 *
 * SE · Epoch Extension · ASMQ · the relay half of the manifest-in-state pair.
 *
 * Huirth: dispatched by scsBridgeArchiveManifestWatcherPrinciple on arm-hydration and on any
 *   filesystem change under Cascades/Archive/ (an *.entry.json add/change). Carries the full
 *   ArchiveManifestEntry[] (UFRT full-replace · capped at 50 in the scan).
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Path B explicit broadcast ·
 *   mirrors scsBridgeSetSessionsListRelay precedent). Writes the payload into Client state for
 *   Vue rendering of the Archive view (Macro AV · next).
 *
 * Both deployments use identical reducer logic — shortest-path return (full-replace).
 *
 * Type-string source of truth: the SHARED const SCS_BRIDGE_SET_ARCHIVE_MANIFEST_RELAY_TYPE
 * (= 'Scs Bridge Set Archive Manifest Relay'). Must byte-match the actionExchange declaration
 * in scsBridge.muxonomy.ts EXACTLY (TQNI · S4 Angle 6 · BCMC silent-no-op gate).
 *
 * PACP: payload property `scsBridgeArchiveManifest` carries the concept-name prefix.
 *
 * Citation: setSessionsListRelay.quality.ts (sibling pattern · same structural form).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { ArchiveManifestEntry } from '../archiveManifest.types';
import { SCS_BRIDGE_SET_ARCHIVE_MANIFEST_RELAY_TYPE } from './archiveManifestActionTypes';

export type ScsBridgeSetArchiveManifestRelayPayload = {
  scsBridgeArchiveManifest: ArchiveManifestEntry[];
};

export const scsBridgeSetArchiveManifestRelay = createQualityCardWithPayload<
  { archiveManifest: ArchiveManifestEntry[] },
  ScsBridgeSetArchiveManifestRelayPayload
>({
  type: SCS_BRIDGE_SET_ARCHIVE_MANIFEST_RELAY_TYPE,
  reducer: (_state, action) => {
    console.log(
      '[SCS-Bridge AMWP-Relay-Reducer] setArchiveManifestRelay · manifest length=',
      action.payload.scsBridgeArchiveManifest?.length ?? 0,
    );
    return {
      archiveManifest: action.payload.scsBridgeArchiveManifest,
    };
  },
  methodCreator: defaultMethodCreator,
});
