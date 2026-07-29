/**
 * scsBridgeSetGitmPendingAction Quality — Client UI Reducer (Local · GITM PAGE)
 *
 * The Git sub-page action-pipe trigger-field setter. Vue dispatches with a
 * { tool, arguments } object when the user stages/unstages a file, commits, or
 * switches a branch; scsBridgeGitmActionPrinciple watches this selector and fires
 * the MCP fetch tools/call(action.tool, action.arguments). Cleared (set to null)
 * after the fetch resolves to prevent re-fire (WSVN discipline).
 *
 * Sibling to setPendingFocusSessionId (the CMIA-Focus trigger exemplar). Client-local
 * only — gitmPendingAction MUST appear in SCSBRIDGE_FILTER_KEYS (no server sync).
 *
 * Template: setPendingFocusSessionId.quality.client.ts
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetGitmPendingActionPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetGitmPendingActionPayload };

export const scsBridgeSetGitmPendingAction = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetGitmPendingActionPayload
>({
  type: 'Scs Bridge Set Gitm Pending Action',
  reducer: (_state, action) => {
    console.log(
      '[SCS-Bridge GITM] setGitmPendingAction · tool=',
      action.payload.gitmPendingAction?.tool,
    );
    return {
      gitmPendingAction: action.payload.gitmPendingAction,
    };
  },
  methodCreator: defaultMethodCreator,
});
