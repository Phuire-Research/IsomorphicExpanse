/**
 * frontierCircuitTestSetMenuStageHuirthBase Quality — Huirth-side Base Reducer (GTMS8C · STCP · SBIS Base)
 *
 * Writes the current agent-authored MenuStage into the frontierCircuitTest Demometer's OWN Huirth (Base)
 * state — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by the helper's
 * SBIS path (Base FIRST, then the relay 'FrontierCircuitTest Set Menu Stage'). Full-replace; partial reducer
 * return (only menuStage · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'FrontierCircuitTest Set Menu Stage Huirth Base' is DISTINCT
 * from the relay's 'FrontierCircuitTest Set Menu Stage' and MUST be ABSENT from frontierCircuitTest.muxonomy.ts
 * actionExchange.serverToClient (Huirth-only · local reducer · the TQNI invariant).
 *
 * Citation: cadmiumSetMenuStageHuirthBase.quality.huirth.ts (Huirth-only Base · SBIS sibling).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.5 (VERBOSE resolution: literal · cadmium precedent).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { FrontierCircuitTestHuirthState, FrontierCircuitTestSetMenuStageHuirthBasePayload } from '../frontierCircuitTest.type';

export type { FrontierCircuitTestSetMenuStageHuirthBasePayload };

export const frontierCircuitTestSetMenuStageHuirthBase = createQualityCardWithPayload<
  FrontierCircuitTestHuirthState,
  FrontierCircuitTestSetMenuStageHuirthBasePayload
>({
  // TQNI · = VERBOSE('SetMenuStageHuirthBase') · rename target. DISTINCT from the relay's
  // 'FrontierCircuitTest Set Menu Stage'. MUST NOT appear in frontierCircuitTest.muxonomy.ts actionExchange
  // (Huirth-only · local reducer · the TQNI invariant).
  type: 'FrontierCircuitTest Set Menu Stage Huirth Base',
  reducer: (_state, action) => {
    const { menuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { menuStage };
  },
  methodCreator: defaultMethodCreator,
});
