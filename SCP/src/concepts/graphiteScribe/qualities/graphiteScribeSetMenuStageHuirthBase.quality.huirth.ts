/**
 * graphiteScribeSetMenuStageHuirthBase Quality — Huirth-side Base Reducer (GTMS8C · STCP · SBIS Base)
 *
 * Writes the current agent-authored MenuStage into the graphiteScribe Demometer's OWN Huirth (Base)
 * state — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by the helper's
 * SBIS path (Base FIRST, then the relay 'GraphiteScribe Set Menu Stage'). Full-replace; partial reducer
 * return (only menuStage · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'GraphiteScribe Set Menu Stage Huirth Base' is DISTINCT
 * from the relay's 'GraphiteScribe Set Menu Stage' and MUST be ABSENT from graphiteScribe.muxonomy.ts
 * actionExchange.serverToClient (Huirth-only · local reducer · the TQNI invariant).
 *
 * Citation: cadmiumSetMenuStageHuirthBase.quality.huirth.ts (Huirth-only Base · SBIS sibling).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.5 (VERBOSE resolution: literal · cadmium precedent).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { GraphiteScribeHuirthState, GraphiteScribeSetMenuStageHuirthBasePayload } from '../graphiteScribe.type';

export type { GraphiteScribeSetMenuStageHuirthBasePayload };

export const graphiteScribeSetMenuStageHuirthBase = createQualityCardWithPayload<
  GraphiteScribeHuirthState,
  GraphiteScribeSetMenuStageHuirthBasePayload
>({
  // TQNI · = VERBOSE('SetMenuStageHuirthBase') · rename target. DISTINCT from the relay's
  // 'GraphiteScribe Set Menu Stage'. MUST NOT appear in graphiteScribe.muxonomy.ts actionExchange
  // (Huirth-only · local reducer · the TQNI invariant).
  type: 'GraphiteScribe Set Menu Stage Huirth Base',
  reducer: (_state, action) => {
    const { menuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { menuStage };
  },
  methodCreator: defaultMethodCreator,
});
