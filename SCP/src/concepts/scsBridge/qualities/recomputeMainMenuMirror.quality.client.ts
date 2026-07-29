/**
 * recomputeMainMenuMirror Quality — AJMI Mirror Derivation (M2-A1-D1)
 *
 * Standalone recompute trigger. setInstalledScps already auto-derives the
 * mirror entry inline (single-dispatch invariant); this quality exists for
 * the rare case where the mirror MUST be recomputed without a registry
 * change — e.g., after status promotion via local-only optimistic update
 * or after a wizard step transition that affects "Show SCP" labeling.
 *
 * No payload — reads current installedScps from state and recomputes.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D1 + §AJMI Extension 2
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeRecomputeMainMenuMirrorPayload,
} from '../scsBridge.type';
import { deriveMainMenuMirrorEntry } from '../../scpRegistry/scpRegistry.type';

export type { ScsBridgeRecomputeMainMenuMirrorPayload };

export const scsBridgeRecomputeMainMenuMirror = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeRecomputeMainMenuMirrorPayload
>({
  type: 'Scs Bridge Recompute Main Menu Mirror',
  reducer: (state, _action) => {
    return {
      mainMenuMirrorEntry: deriveMainMenuMirrorEntry({ scps: state.installedScps }),
    };
  },
  methodCreator: defaultMethodCreator,
});
