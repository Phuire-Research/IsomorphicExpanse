/**
 * cadmiumSetMenuStageHuirthBase Quality — Huirth-side Base Reducer (STCP · SBIS Base)
 *
 * Writes the current agent-authored MenuStage into the cadmium Demometer's OWN Huirth (Base)
 * state — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by the helper's
 * SBIS path (Base FIRST, then the relay 'Cadmium Set Menu Stage'). Full-replace; partial reducer
 * return (only menuStage · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Menu Stage Huirth Base' is DISTINCT
 * from the relay's 'Cadmium Set Menu Stage' and MUST match exactly at the four registration sites:
 *   (1) this quality `type` ·
 *   (2) cadmium.concept.huirth.ts cadmiumHuirthQualities mapping (deck-key
 *       cadmiumSetMenuStageHuirthBase) ·
 *   (3) cadmium.type.ts CadmiumHuirthQualities deck-key ·
 *   (4) INVARIANT — ABSENT from cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only ·
 *       local reducer · mirrors the suiteCascade*HuirthBase / setSessionsListHuirthBase posture).
 *
 * Citation: cadmiumSetMenuStage.quality.client.ts (relay reception sibling · same MenuStage shape).
 * Citation: suiteCascadeSetCascadeHuirthBase.quality.huirth (Huirth-only Base · SBIS precedent).
 * Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.1 (Base quality · TQNI 4-site map).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumSetMenuStageHuirthBasePayload,
} from '../cadmium.type';

export type { CadmiumSetMenuStageHuirthBasePayload };

export const cadmiumSetMenuStageHuirthBase = createQualityCardWithPayload<
  CadmiumHuirthState,
  CadmiumSetMenuStageHuirthBasePayload
>({
  // TQNI · DISTINCT from the relay's 'Cadmium Set Menu Stage'. MUST NOT appear in
  // cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Cadmium Set Menu Stage Huirth Base',
  reducer: (_state, action) => {
    const { menuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { menuStage };
  },
  methodCreator: defaultMethodCreator,
});
