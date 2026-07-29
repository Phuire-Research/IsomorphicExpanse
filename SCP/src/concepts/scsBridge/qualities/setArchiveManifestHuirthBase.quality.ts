/**
 * setArchiveManifestHuirthBase Quality — Huirth-Only Base State Maintenance
 *
 * SE · Epoch Extension · ASMQ · SBIS (Stratidian-Base-Informative-State) Pattern.
 * Citation: ~/.claude/projects/<project-slug>/memory/feedback_stratidian_base_informative_state.md
 *
 * Base = Huirth state (server source of truth, maintained by the AMWP chokidar Lambda events).
 * Informative = Client state (derived, broadcast-synchronized from Base).
 *
 * This quality is the Base-maintenance companion to setArchiveManifestRelay. Dispatched by
 * scsBridgeArchiveManifestWatcherPrinciple ALONGSIDE setArchiveManifestRelay at the broadcast
 * site. The relay action routes via actionExchange.serverToClient to Client (Informative path).
 * THIS action runs the LOCAL HUIRTH REDUCER ONLY (Base path) so Huirth state.archiveManifest
 * updates and any selector-reactive propagation observes the change.
 *
 * UFRT full-replace: the reducer assigns the whole manifest (never an append/push).
 *
 * INVARIANT (TQNI · S4 Angle 6 · BCMC):
 *   - This action type MUST NOT appear in actionExchange.serverToClient.
 *   - It MUST NOT be registered in scsBridge.concept.client.ts.
 *   - It IS registered in scsBridge.concept.huirth.ts only.
 *   - The `type` string is the SHARED const (byte-match gate).
 *
 * Citation: setSessionsListHuirthBase.quality.ts (structural precedent).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { ArchiveManifestEntry } from '../archiveManifest.types';
import { SCS_BRIDGE_SET_ARCHIVE_MANIFEST_HUIRTH_BASE_TYPE } from './archiveManifestActionTypes';

export type ScsBridgeSetArchiveManifestHuirthBasePayload = {
  scsBridgeArchiveManifest: ArchiveManifestEntry[];
};

export const scsBridgeSetArchiveManifestHuirthBase = createQualityCardWithPayload<
  { archiveManifest: ArchiveManifestEntry[] },
  ScsBridgeSetArchiveManifestHuirthBasePayload
>({
  type: SCS_BRIDGE_SET_ARCHIVE_MANIFEST_HUIRTH_BASE_TYPE,
  reducer: (_state, action) => {
    console.log(
      '[SCS-Bridge SBIS-Base-ArchiveManifest] setArchiveManifestHuirthBase reducer · manifest length=',
      action.payload.scsBridgeArchiveManifest?.length ?? 0,
    );
    return {
      archiveManifest: action.payload.scsBridgeArchiveManifest,
    };
  },
  methodCreator: defaultMethodCreator,
});
