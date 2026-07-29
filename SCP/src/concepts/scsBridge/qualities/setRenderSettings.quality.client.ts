/**
 * setRenderSettings Quality — Client UI Reducer (Local · SWRM D4)
 *
 * Local-only UI reducer for the SCS-Bridge Settings sub-page render-mode controls. One quality
 * covers all three render-settings fields (target + the SCP-self mode + the optimistic terminal
 * echo); each payload field is optional so the reducer updates only what's present (the Shortest
 * Path partial-return principle). No bridge round-trip — the Terminal-target WRITE to
 * bridge.json.renderMode rides the sendBridgeMessage Diameter (D4 W3), separate from this local UI.
 *
 * Mirrors setActiveSubPage.quality.client.ts (the canonical local-quality pattern).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetRenderSettingsPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetRenderSettingsPayload };

export const scsBridgeSetRenderSettings = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetRenderSettingsPayload
>({
  type: 'Scs Bridge Set Render Settings',
  reducer: (_state, action) => {
    const out: Partial<ScsBridgeClientState> = {};
    if (action.payload.settingsTarget !== undefined) {
      out.settingsTarget = action.payload.settingsTarget;
    }
    if (action.payload.selfRenderMode !== undefined) {
      out.selfRenderMode = action.payload.selfRenderMode;
    }
    if (action.payload.selectedTerminalMode !== undefined) {
      out.selectedTerminalMode = action.payload.selectedTerminalMode;
    }
    return out;
  },
  methodCreator: defaultMethodCreator,
});
