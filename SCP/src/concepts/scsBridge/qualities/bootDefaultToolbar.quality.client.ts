/**
 * bootDefaultToolbar Quality — Turn Over Refold + Default Boot (M2-A2-D2)
 *
 * Initializes scsBridge.toolbarButtons with the 4 reserved default
 * buttons in one dispatch. Idempotent: if a default button is already
 * registered (e.g., manual register dispatch fired first), upserts
 * preserve position via addToolbarButton.
 *
 * Turn Over Refold: the existing scsBridgeTriggerHardTurnOver quality
 * (from M1-A1-D6) is now reachable via the toolbar entry rather than
 * a dedicated standalone Vue component. Single dispatch surface.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D2 (Turn Over refold)
 * Citation: defaultToolbarButtons.model.ts (button config source)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeBootDefaultToolbarPayload,
} from '../scsBridge.type';
import { DEFAULT_TOOLBAR_BUTTONS } from '../../../model/defaultToolbarButtons.model';
import { addToolbarButton } from '../../../model/toolbarRegistration.model';

export type { ScsBridgeBootDefaultToolbarPayload };

export const scsBridgeBootDefaultToolbar = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeBootDefaultToolbarPayload
>({
  type: 'Scs Bridge Boot Default Toolbar',
  reducer: (state, _action) => {
    let next = state.toolbarButtons;
    for (const btn of DEFAULT_TOOLBAR_BUTTONS) {
      next = addToolbarButton(next, btn);
    }
    // If nothing actually changed (all already registered with identical shape),
    // shortest-path returns empty partial. Reference-equality check approximates
    // "no change" since addToolbarButton returns a new array only on mutation.
    if (next === state.toolbarButtons) return {};
    return { toolbarButtons: next };
  },
  methodCreator: defaultMethodCreator,
});
