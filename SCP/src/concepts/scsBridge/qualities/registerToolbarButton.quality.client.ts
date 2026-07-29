/**
 * registerToolbarButton Quality — Toolbar Pattern (M2-A2-D1)
 *
 * Upserts a toolbar button into scsBridge.toolbarButtons. Validates via
 * the pure-function model layer; invalid buttons are silently rejected
 * (caller can inspect state to detect; future cycle may add error state).
 *
 * Higher-Order Composition: the model layer owns the validation +
 * arithmetic; this quality owns the dispatch + reducer. Diameter.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D1
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeRegisterToolbarButtonPayload,
} from '../scsBridge.type';
import {
  validateToolbarButton,
  addToolbarButton,
} from '../../../model/toolbarRegistration.model';

export type { ScsBridgeRegisterToolbarButtonPayload };

export const scsBridgeRegisterToolbarButton = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeRegisterToolbarButtonPayload
>({
  type: 'Scs Bridge Register Toolbar Button',
  reducer: (state, action) => {
    const validation = validateToolbarButton(action.payload.button);
    if (!validation.valid) {
      // Reject silently — state unchanged. Shortest-path return = empty partial.
      return {};
    }
    return {
      toolbarButtons: addToolbarButton(state.toolbarButtons, action.payload.button),
    };
  },
  methodCreator: defaultMethodCreator,
});
