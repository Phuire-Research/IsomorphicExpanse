/**
 * frontierCircuitTestSetDesignationMenuStage Quality — Local keyed Reducer (PRE-EPOCH · BSSM · relay reception)
 *
 * The keyed-Record sibling of frontierCircuitTestSetMenuStage. Sets one designation's agent-authored Shatterite
 * Menu stage into the client `shatteriteMenus` Record. Keyed merge: each agent advance for a given
 * designation writes a new stage to that designation's menu.json; the N-watcher SMRP relay broadcasts
 * this keyed action. Partial reducer return (only shatteriteMenus · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('FrontierCircuitTest Set Designation Menu Stage') is the SAME type the
 * frontierCircuitTest N-watcher SMRP relay broadcasts via webSocketServerAppendToActionQue. When FrontierCircuitTestHomeLanding's
 * page muxium is mounted, the broadcast lands here and re-renders the keyed menu for that designation.
 *
 * TQNI byte-match anchor — 'FrontierCircuitTest Set Designation Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) frontierCircuitTest.muxonomy.ts demometer `type` ·
 *   (3) frontierCircuitTest.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the frontierCircuitTestSetDesignationMenuStage.actionCreator the N-watcher SMRP relay imports.
 *
 * Citation: frontierCircuitTestSetMenuStage.quality.client.ts (the scalar relay sibling · cloned + keyed).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 2 (the keyed Record relay law).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { FrontierCircuitTestClientState, FrontierCircuitTestSetDesignationMenuStagePayload } from '../frontierCircuitTest.type';

export type { FrontierCircuitTestSetDesignationMenuStagePayload };

export const frontierCircuitTestSetDesignationMenuStage = createQualityCardWithPayload<
  FrontierCircuitTestClientState,
  FrontierCircuitTestSetDesignationMenuStagePayload
>({
  // TQNI · = VERBOSE('SetDesignationMenuStage') · rename target. The keyed relay-reception type.
  // MUST byte-match: (1) this type · (2) frontierCircuitTest.muxonomy.ts demometer type · (3) actionExchange
  // actionType · (4) the frontierCircuitTestSetDesignationMenuStage.actionCreator the N-watcher SMRP relay imports.
  type: 'FrontierCircuitTest Set Designation Menu Stage',
  reducer: (state, action) => {
    const { designation, menuStage } = action.payload;
    // SHORTEST PATH — keyed merge: return only the changed Record (spread the Record, not the state).
    return { shatteriteMenus: { ...state.shatteriteMenus, [designation]: menuStage } };
  },
  methodCreator: defaultMethodCreator,
});
