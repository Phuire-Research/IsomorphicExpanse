/**
 * setInstalledScps Quality — AJMI Registry Sync Reducer (M2-A1-D1)
 *
 * AJMI Extension 4 consumer: receives the full installedScps array pushed
 * from scpRegistry (server) and updates client state. Triggered by:
 *   - Initial fetch on bar mount
 *   - fs.watch fire when Cascades/SCPs.json changes (M2-A1-D4 wires the watcher)
 *   - Manual refresh
 *
 * Reactive composition note: this reducer ALSO recomputes mainMenuMirrorEntry
 * via the AJMI derivation helper — keeps the mirror entry coherent with the
 * installedScps in a single dispatch. Per Stratimux reducer best practice,
 * returns ONLY changed properties.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D1 + §AJMI Extension 2
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetInstalledScpsPayload,
} from '../scsBridge.type';
import { deriveMainMenuMirrorEntry } from '../../scpRegistry/scpRegistry.type';

export type { ScsBridgeSetInstalledScpsPayload };

export const scsBridgeSetInstalledScps = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetInstalledScpsPayload
>({
  type: 'Scs Bridge Set Installed Scps',
  reducer: (_state, action) => {
    const installedScps = action.payload.installedScps;
    const mainMenuMirrorEntry = deriveMainMenuMirrorEntry({ scps: installedScps });
    return {
      installedScps,
      mainMenuMirrorEntry,
    };
  },
  methodCreator: defaultMethodCreator,
});
