/**
 * suite8SetDesignationMenuStage Quality — Local keyed Reducer (PRE-EPOCH · BSSM · relay reception)
 *
 * The keyed-Record sibling of suite8SetMenuStage. Sets one designation's agent-authored Shatterite
 * Menu stage into the client `shatteriteMenus` Record. Keyed merge: each agent advance for a given
 * designation writes a new stage to that designation's menu.json; the N-watcher SMRP relay broadcasts
 * this keyed action. Partial reducer return (only shatteriteMenus · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Suite8 Set Designation Menu Stage') is the SAME type the
 * suite8 N-watcher SMRP relay broadcasts via webSocketServerAppendToActionQue. When Suite8HomeLanding's
 * page muxium is mounted, the broadcast lands here and re-renders the keyed menu for that designation.
 *
 * TQNI byte-match anchor — 'Suite8 Set Designation Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) suite8.muxonomy.ts demometer `type` ·
 *   (3) suite8.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the suite8SetDesignationMenuStage.actionCreator the N-watcher SMRP relay imports.
 *
 * Citation: suite8SetMenuStage.quality.client.ts (the scalar relay sibling · cloned + keyed).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 2 (the keyed Record relay law).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8ClientState, Suite8SetDesignationMenuStagePayload } from '../suite8.type';

export type { Suite8SetDesignationMenuStagePayload };

export const suite8SetDesignationMenuStage = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetDesignationMenuStagePayload
>({
  // TQNI · = VERBOSE('SetDesignationMenuStage') · rename target. The keyed relay-reception type.
  // MUST byte-match: (1) this type · (2) suite8.muxonomy.ts demometer type · (3) actionExchange
  // actionType · (4) the suite8SetDesignationMenuStage.actionCreator the N-watcher SMRP relay imports.
  type: 'Suite8 Set Designation Menu Stage',
  reducer: (state, action) => {
    const { designation, menuStage } = action.payload;
    // SHORTEST PATH — keyed merge: return only the changed Record (spread the Record, not the state).
    return { shatteriteMenus: { ...state.shatteriteMenus, [designation]: menuStage } };
  },
  methodCreator: defaultMethodCreator,
});
