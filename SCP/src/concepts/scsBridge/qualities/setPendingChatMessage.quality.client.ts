/**
 * setPendingChatMessage Quality — Client UI Reducer (Local)
 *
 * D3RM-G · CBSE chat trigger field setter. Vue dispatches with the compound
 * payload { sessionId, message } when user submits the SREX chat bar; the
 * scsBridgeInvokeSessionChat principle watches this selector and fires the
 * MCP fetch tools/call('scp_chat_session'). Cleared (set to null) after the
 * fetch resolves (success or failure) — WSVN discipline ensures the next
 * submit produces a null→object transition that re-fires the selector.
 *
 * Sibling to setPendingFocusSessionId, but the payload shape differs: chat
 * carries a compound { sessionId, message } object rather than a bare
 * sessionId string. WSVN reduces uniformly: action.payload IS the next state.
 *
 * Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 4
 * Citation: D3RM-G-FOUNDATION-TEAL-CLAUDE-PEWTER-DESIGN.md §6.2 (WSVN)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetPendingChatMessagePayload,
} from '../scsBridge.type';

export type { ScsBridgeSetPendingChatMessagePayload };

export const scsBridgeSetPendingChatMessage = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetPendingChatMessagePayload
>({
  type: 'Scs Bridge Set Pending Chat Message',
  reducer: (_state, action) => {
    // Action factory wraps the arg as { payload: <arg> } — the arg itself
    // already carries a `payload` field per ScsBridgeSetPendingChatMessagePayload,
    // so the inner trigger value lives at action.payload.payload.
    const next = action.payload.payload;
    console.log(
      '[SCS-Bridge CBSE] setPendingChatMessage · sessionId=',
      next?.sessionId ?? null,
      '· messageLength=',
      next?.message.length ?? 0,
    );
    return {
      pendingChatMessage: next,
    };
  },
  methodCreator: defaultMethodCreator,
});
