/**
 * gitmSetUpdateDiff Quality — Relay Reducer (STCP · SBIS Relay · dual-deploy · D-U4.2)
 *
 * Sets the current scp-update-diff.<name>.json body. Full-replace: every diff write relays
 * the parsed body here. Partial reducer return (only updateDiff · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Gitm Set Update Diff') is the SAME type the
 * gitmUpdateWatcher's relay broadcasts via webSocketServerAppendToActionQue. Registered in
 * BOTH gitm.concept.huirth.ts (the Huirth reduce keeps the Base current) AND
 * gitm.concept.client.ts (the client reduce updates GitmClientState · the page re-renders).
 *
 * TQNI byte-match anchor — the type string 'Gitm Set Update Diff' MUST match exactly:
 *   (1) this quality `type` · (2) gitm.muxonomy.ts demometer `type` ·
 *   (3) gitm.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the gitmSetUpdateDiff.actionCreator the gitmUpdateRelay.config imports.
 *
 * Citation: gitmSetGitmJson.quality.client.ts (relay reception bearing · dual-deploy · clone).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.2 gitmSetUpdateDiff.
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GitmClientState,
} from '../gitm.type';
import type { GitmSetUpdateDiffPayload } from '../gitmUpdate.type';

export type { GitmSetUpdateDiffPayload };

export const gitmSetUpdateDiff = createQualityCardWithPayload<
  GitmClientState,
  GitmSetUpdateDiffPayload
>({
  type: 'Gitm Set Update Diff',
  reducer: (_state, action) => {
    const { updateDiff } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { updateDiff };
  },
  methodCreator: defaultMethodCreator,
});
