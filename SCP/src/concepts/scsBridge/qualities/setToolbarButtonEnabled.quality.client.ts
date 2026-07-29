/**
 * setToolbarButtonEnabled Quality — Toolbar Pattern (M2-A2-D1)
 *
 * Toggles a toolbar button's enabled flag without changing its other
 * properties. No-op if id absent.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D1
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetToolbarButtonEnabledPayload,
} from '../scsBridge.type';
import { setToolbarButtonEnabled } from '../../../model/toolbarRegistration.model';

export type { ScsBridgeSetToolbarButtonEnabledPayload };

export const scsBridgeSetToolbarButtonEnabled = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetToolbarButtonEnabledPayload
>({
  type: 'Scs Bridge Set Toolbar Button Enabled',
  reducer: (state, action) => {
    const next = setToolbarButtonEnabled(
      state.toolbarButtons,
      action.payload.id,
      action.payload.enabled,
    );
    if (next === state.toolbarButtons) return {};
    return { toolbarButtons: next };
  },
  methodCreator: defaultMethodCreator,
});
