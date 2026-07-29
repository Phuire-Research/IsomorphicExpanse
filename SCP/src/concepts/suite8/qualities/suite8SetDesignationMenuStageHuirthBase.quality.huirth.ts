/**
 * suite8SetDesignationMenuStageHuirthBase Quality — Huirth-side keyed Base Reducer (PRE-EPOCH · BSSM)
 *
 * The keyed-Record sibling of suite8SetMenuStageHuirthBase. Writes one designation's MenuStage into
 * the suite8 Demometer's OWN Huirth (Base) `shatteriteMenus` Record — the server source of truth the
 * STCP SMRP/BOCR stack reads. Dispatched by the N-watcher's SBIS path (Base FIRST, then the keyed
 * relay 'Suite8 Set Designation Menu Stage'). Keyed merge; partial reducer return (only
 * shatteriteMenus · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Suite8 Set Designation Menu Stage Huirth Base' is
 * DISTINCT from the relay's 'Suite8 Set Designation Menu Stage' and MUST be ABSENT from
 * suite8.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer · the TQNI invariant).
 *
 * Citation: suite8SetMenuStageHuirthBase.quality.huirth.ts (the scalar Base sibling · cloned + keyed).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 2 (the keyed Record Base-maintenance law).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8HuirthState, Suite8SetDesignationMenuStageHuirthBasePayload } from '../suite8.type';

export type { Suite8SetDesignationMenuStageHuirthBasePayload };

export const suite8SetDesignationMenuStageHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8SetDesignationMenuStageHuirthBasePayload
>({
  // TQNI · = VERBOSE('SetDesignationMenuStageHuirthBase') · rename target. DISTINCT from the relay's
  // 'Suite8 Set Designation Menu Stage'. MUST NOT appear in suite8.muxonomy.ts actionExchange
  // (Huirth-only · local reducer · the TQNI invariant).
  type: 'Suite8 Set Designation Menu Stage Huirth Base',
  reducer: (state, action) => {
    const { designation, menuStage } = action.payload;
    // SHORTEST PATH — keyed merge: return only the changed Record (spread the Record, not the state).
    return { shatteriteMenus: { ...state.shatteriteMenus, [designation]: menuStage } };
  },
  methodCreator: defaultMethodCreator,
});
