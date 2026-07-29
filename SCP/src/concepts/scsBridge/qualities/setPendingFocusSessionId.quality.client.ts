/**
 * setPendingFocusSessionId Quality — Client UI Reducer (Local)
 *
 * D3RM-E · CMIA-Focus trigger field setter. Vue dispatches with sessionId
 * when user clicks the Focus button (post-launch, terminalWindowId present);
 * scsBridgeInvokeSessionFocus principle watches this selector and fires the
 * MCP fetch tools/call('scp_focus_session'). Cleared (set to null) after
 * fetch resolves to prevent re-fire.
 *
 * Sibling to setPendingEngageSessionId. Focus is side-effect-only (no SAES
 * mutation) — the engaged session remains engaged after a focus.
 *
 * Citation: D3RM-E-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 3
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetPendingFocusSessionIdPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetPendingFocusSessionIdPayload };

export const scsBridgeSetPendingFocusSessionId = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetPendingFocusSessionIdPayload
>({
  type: 'Scs Bridge Set Pending Focus Session Id',
  reducer: (_state, action) => {
    console.log(
      '[SCS-Bridge CMIA-Focus] setPendingFocusSessionId · id=',
      action.payload.sessionId,
    );
    return {
      pendingFocusSessionId: action.payload.sessionId,
    };
  },
  methodCreator: defaultMethodCreator,
});
