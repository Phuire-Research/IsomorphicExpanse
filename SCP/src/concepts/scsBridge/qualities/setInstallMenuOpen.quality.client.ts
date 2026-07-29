/**
 * setInstallMenuOpen Quality — Client UI Reducer (Local · M2-A1-D1)
 *
 * Local-only UI reducer toggling the install-SCP menu visibility within
 * the SCS-Bridge bar surface. AJMI: when opening, mirror entry remains
 * authoritative — opening the menu does NOT mutate registry.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D1
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetInstallMenuOpenPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetInstallMenuOpenPayload };

export const scsBridgeSetInstallMenuOpen = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetInstallMenuOpenPayload
>({
  type: 'Scs Bridge Set Install Menu Open',
  reducer: (_state, action) => {
    return {
      installMenuOpen: action.payload.installMenuOpen,
    };
  },
  methodCreator: defaultMethodCreator,
});
