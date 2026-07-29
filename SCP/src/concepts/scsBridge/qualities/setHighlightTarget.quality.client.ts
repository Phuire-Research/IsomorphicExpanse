/**
 * setHighlightTarget Quality — Client UI Reducer (Local · GITM color-cascade W4)
 *
 * Vermillion Focus+Highlight. Sets the transient highlightTarget (the control to pulse, e.g.
 * 'turn-over') or clears it to null. TWO callers, ONE quality:
 *   - the scs:highlight relay (the huirth receiver broadcasts this after the Pewter Skill POSTs
 *     scs:highlight following a hifiConfig.json color write) → sets target = 'turn-over'.
 *   - the Vue auto-reset watch (~2s after the pulse arms) → sets target = null.
 *
 * Partial-return law (CLAUDE.md Reducer Performance §): returns ONLY { highlightTarget }, never a
 * full state spread. Local-only (filterKey · never bidirectionally synced).
 *
 * Template: setActiveSubPage.quality.client.ts (the local UI reducer exemplar).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" + "🚀 Critical Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetHighlightTargetPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetHighlightTargetPayload };

export const scsBridgeSetHighlightTarget = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetHighlightTargetPayload
>({
  type: 'Scs Bridge Set Highlight Target',
  reducer: (state, action) => {
    return {
      highlightTarget: action.payload.target,
    };
  },
  methodCreator: defaultMethodCreator,
});
