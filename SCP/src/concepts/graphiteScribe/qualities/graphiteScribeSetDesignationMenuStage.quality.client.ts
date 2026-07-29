/**
 * graphiteScribeSetDesignationMenuStage Quality — Local keyed Reducer (PRE-EPOCH · BSSM · relay reception)
 *
 * The keyed-Record sibling of graphiteScribeSetMenuStage. Sets one designation's agent-authored Shatterite
 * Menu stage into the client `shatteriteMenus` Record. Keyed merge: each agent advance for a given
 * designation writes a new stage to that designation's menu.json; the N-watcher SMRP relay broadcasts
 * this keyed action. Partial reducer return (only shatteriteMenus · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('GraphiteScribe Set Designation Menu Stage') is the SAME type the
 * graphiteScribe N-watcher SMRP relay broadcasts via webSocketServerAppendToActionQue. When GraphiteScribeHomeLanding's
 * page muxium is mounted, the broadcast lands here and re-renders the keyed menu for that designation.
 *
 * TQNI byte-match anchor — 'GraphiteScribe Set Designation Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) graphiteScribe.muxonomy.ts demometer `type` ·
 *   (3) graphiteScribe.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the graphiteScribeSetDesignationMenuStage.actionCreator the N-watcher SMRP relay imports.
 *
 * Citation: graphiteScribeSetMenuStage.quality.client.ts (the scalar relay sibling · cloned + keyed).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 2 (the keyed Record relay law).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { GraphiteScribeClientState, GraphiteScribeSetDesignationMenuStagePayload } from '../graphiteScribe.type';

export type { GraphiteScribeSetDesignationMenuStagePayload };

export const graphiteScribeSetDesignationMenuStage = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetDesignationMenuStagePayload
>({
  // TQNI · = VERBOSE('SetDesignationMenuStage') · rename target. The keyed relay-reception type.
  // MUST byte-match: (1) this type · (2) graphiteScribe.muxonomy.ts demometer type · (3) actionExchange
  // actionType · (4) the graphiteScribeSetDesignationMenuStage.actionCreator the N-watcher SMRP relay imports.
  type: 'GraphiteScribe Set Designation Menu Stage',
  reducer: (state, action) => {
    const { designation, menuStage } = action.payload;
    // SHORTEST PATH — keyed merge: return only the changed Record (spread the Record, not the state).
    return { shatteriteMenus: { ...state.shatteriteMenus, [designation]: menuStage } };
  },
  methodCreator: defaultMethodCreator,
});
