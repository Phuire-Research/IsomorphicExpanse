/**
 * gitmSetGitmJson Quality — Relay Reducer (STCP · SBIS Relay · dual-deploy)
 *
 * Sets the current gitm.json snapshot. Full-replace: every gitm.json write relays the
 * parsed snapshot here. Partial reducer return (only gitmJson · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Gitm Set Gitm Json') is the SAME type the
 * gitm STCP relay broadcasts via webSocketServerAppendToActionQue. Registered in BOTH
 * gitm.concept.huirth.ts (the SMRP selector observes the Huirth reduce) AND
 * gitm.concept.client.ts (the client reduce updates GitmClientState · the page re-renders).
 *
 * TQNI byte-match anchor — the type string 'Gitm Set Gitm Json' MUST match exactly:
 *   (1) this quality `type` · (2) gitm.muxonomy.ts demometer `type` ·
 *   (3) gitm.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the gitmSetGitmJson.actionCreator the relay config imports (carries this type).
 *
 * Typed against GitmClientState (mirrors the cadmiumSetMenuStage.quality.client relay
 * precedent · the Huirth concept's GitmHuirthQualities map re-types it for Huirth deploy).
 *
 * Citation: cadmiumSetMenuStage.quality.client.ts (relay reception bearing · dual-deploy).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W2 gitmSetGitmJson.
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GitmClientState,
  GitmSetGitmJsonRelayPayload,
} from '../gitm.type';

export type { GitmSetGitmJsonRelayPayload };

export const gitmSetGitmJson = createQualityCardWithPayload<
  GitmClientState,
  GitmSetGitmJsonRelayPayload
>({
  type: 'Gitm Set Gitm Json',
  reducer: (_state, action) => {
    const { gitmJson } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { gitmJson };
  },
  methodCreator: defaultMethodCreator,
});
