/**
 * enableSendMessageToolbar Quality — Send Message Enable (M2-A2-D3)
 *
 * Flips the `send-message` toolbar button's `enabled` flag from false
 * (DEFAULT-DISABLED-AS-PROGRESS-MARKER · M2-A2-D2) to true now that the
 * dispatch path is wired and Managing Instance Contact is operational.
 *
 * Composes setToolbarButtonEnabled — the underlying arithmetic is the
 * same; this quality just specializes the target. Discoverable by name
 * for the bridge boot principle to dispatch when Managing Instance
 * Contact handshake succeeds.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A2-D3
 * Citation: defaultToolbarButtons.model.ts TOOLBAR_BUTTON_SEND_MESSAGE
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeBootDefaultToolbarPayload,
} from '../scsBridge.type';
import { setToolbarButtonEnabled } from '../../../model/toolbarRegistration.model';

// Reuses BootDefaultToolbarPayload shape — both are no-payload triggers
export type ScsBridgeEnableSendMessageToolbarPayload = ScsBridgeBootDefaultToolbarPayload;

export const scsBridgeEnableSendMessageToolbar = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeEnableSendMessageToolbarPayload
>({
  type: 'Scs Bridge Enable Send Message Toolbar',
  reducer: (state, _action) => {
    const next = setToolbarButtonEnabled(state.toolbarButtons, 'send-message', true);
    if (next === state.toolbarButtons) return {};
    return { toolbarButtons: next };
  },
  methodCreator: defaultMethodCreator,
});
