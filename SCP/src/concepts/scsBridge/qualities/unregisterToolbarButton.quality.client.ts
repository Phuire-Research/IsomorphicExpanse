/**
 * unregisterToolbarButton Quality — Toolbar Pattern (M2-A2-D1)
 *
 * Removes a toolbar button by id. No-op if id absent.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D1
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeUnregisterToolbarButtonPayload,
} from '../scsBridge.type';
import { removeToolbarButton } from '../../../model/toolbarRegistration.model';

export type { ScsBridgeUnregisterToolbarButtonPayload };

export const scsBridgeUnregisterToolbarButton = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeUnregisterToolbarButtonPayload
>({
  type: 'Scs Bridge Unregister Toolbar Button',
  reducer: (state, action) => {
    const next = removeToolbarButton(state.toolbarButtons, action.payload.id);
    if (next === state.toolbarButtons) return {}; // shortest-path: unchanged
    return { toolbarButtons: next };
  },
  methodCreator: defaultMethodCreator,
});
