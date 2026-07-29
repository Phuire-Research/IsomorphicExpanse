/**
 * gitmSetUpdateResolved Quality — Relay Reducer (STCP · SBIS Relay · dual-deploy · D-U4.2)
 *
 * Sets the current scp-update-resolved.<name>.json body. Full-replace: every resolved write
 * relays the parsed body here. Partial reducer return (only updateResolved · Shortest Path).
 *
 * Relay reception side: this quality's type ('Gitm Set Update Resolved') is the SAME type the
 * gitmUpdateWatcher's relay broadcasts via webSocketServerAppendToActionQue. Registered in
 * BOTH gitm.concept.huirth.ts (the Huirth reduce keeps the Base current) AND
 * gitm.concept.client.ts (the client reduce updates GitmClientState · the page re-renders).
 *
 * TQNI byte-match anchor — the type string 'Gitm Set Update Resolved' MUST match exactly:
 *   (1) this quality `type` · (2) gitm.muxonomy.ts demometer `type` ·
 *   (3) gitm.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the gitmSetUpdateResolved.actionCreator the gitmUpdateRelay.config imports.
 *
 * Citation: gitmSetGitmJson.quality.client.ts (relay reception bearing · dual-deploy · clone).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.2 gitmSetUpdateResolved.
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GitmClientState,
} from '../gitm.type';
import type { GitmSetUpdateResolvedPayload } from '../gitmUpdate.type';

export type { GitmSetUpdateResolvedPayload };

export const gitmSetUpdateResolved = createQualityCardWithPayload<
  GitmClientState,
  GitmSetUpdateResolvedPayload
>({
  type: 'Gitm Set Update Resolved',
  reducer: (_state, action) => {
    const { updateResolved } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { updateResolved };
  },
  methodCreator: defaultMethodCreator,
});
