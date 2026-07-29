/**
 * cadmiumSetTargetedMenuStageHuirthBase Quality — Huirth-side Base Reducer (Diamond TRP · 4th STCP · SBIS Base)
 *
 * Writes the current Anchor-authored targeted-research MenuStage into the cadmium Demometer's OWN
 * Huirth (Base) state — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by
 * the helper's SBIS path (Base FIRST, then the relay 'Cadmium Set Targeted Menu Stage'). Full-replace;
 * partial reducer return (only targetedMenuStage · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Targeted Menu Stage Huirth Base' is DISTINCT
 * from the relay's 'Cadmium Set Targeted Menu Stage' and MUST match exactly at the four registration sites:
 *   (1) this quality `type` ·
 *   (2) cadmium.concept.huirth.ts cadmiumHuirthQualities mapping (deck-key
 *       cadmiumSetTargetedMenuStageHuirthBase) ·
 *   (3) cadmium.type.ts CadmiumHuirthQualities deck-key ·
 *   (4) INVARIANT — ABSENT from cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only ·
 *       local reducer · mirrors the cadmiumSetMenuStageHuirthBase posture).
 *
 * Citation: cadmiumSetMenuStageHuirthBase.quality.huirth.ts (byte-mirror · same MenuStage shape).
 * Citation: cadmiumSetTargetedMenuStage.quality.client.ts (relay reception sibling).
 * Citation: TRP-DIAMOND-WGB.md §3 (Base quality · TQNI 4-site map + H-INV).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumSetTargetedMenuStageHuirthBasePayload,
} from '../cadmium.type';

export type { CadmiumSetTargetedMenuStageHuirthBasePayload };

export const cadmiumSetTargetedMenuStageHuirthBase = createQualityCardWithPayload<
  CadmiumHuirthState,
  CadmiumSetTargetedMenuStageHuirthBasePayload
>({
  // TQNI · DISTINCT from the relay's 'Cadmium Set Targeted Menu Stage'. MUST NOT appear in
  // cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Cadmium Set Targeted Menu Stage Huirth Base',
  reducer: (_state, action) => {
    const { targetedMenuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { targetedMenuStage };
  },
  methodCreator: defaultMethodCreator,
});
