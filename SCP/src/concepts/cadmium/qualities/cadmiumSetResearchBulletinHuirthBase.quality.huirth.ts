/**
 * cadmiumSetResearchBulletinHuirthBase Quality — Huirth-side Base Reducer (Diamond RAR · 3rd STCP · SBIS Base)
 *
 * Writes the current targeted CadmiumArticle[] into the cadmium Demometer's OWN Huirth (Base)
 * state — the server source of truth the researchBulletin STCP SMRP/BOCR stack reads. Dispatched
 * by the helper's SBIS path (Base FIRST, then the relay 'Cadmium Set Research Bulletin').
 * Full-replace (targeted/researchBulletin.json is the single accumulating source · the worker
 * write — DEFERRED — owns accumulation, not here); partial reducer return (only researchBulletin ·
 * Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Research Bulletin Huirth Base' is DISTINCT
 * from the relay's 'Cadmium Set Research Bulletin' and MUST match exactly at the five registration
 * sites:
 *   (1) this quality `type` ·
 *   (2) cadmium.concept.huirth.ts cadmiumHuirthQualities mapping (deck-key
 *       cadmiumSetResearchBulletinHuirthBase) ·
 *   (3) cadmium.type.ts CadmiumHuirthQualities deck-key ·
 *   (4) cadmium.type.ts CadmiumHuirthState.researchBulletin slot + cadmium.state.huirth.ts [] seed ·
 *   (5) cadmiumResearchBulletinRelay.config.ts baseActionCreator ·
 *   INVARIANT — ABSENT from cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only ·
 *       local reducer · the relay 'Cadmium Set Research Bulletin' IS present there · that is correct).
 *
 * Citation: cadmiumSetTopicsHuirthBase.quality.huirth (the topics Base mirror · same STCP shape).
 * Citation: cadmiumSetResearchBulletin.quality.client.ts (relay reception sibling · same CadmiumArticle[] shape).
 * Citation: RAR-DIAMOND-WGB.md §FULL 3rd-STCP TQNI SITE CHECKLIST (B-rows).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumSetResearchBulletinHuirthBasePayload,
} from '../cadmium.type';

export type { CadmiumSetResearchBulletinHuirthBasePayload };

export const cadmiumSetResearchBulletinHuirthBase = createQualityCardWithPayload<
  CadmiumHuirthState,
  CadmiumSetResearchBulletinHuirthBasePayload
>({
  // TQNI · DISTINCT from the relay's 'Cadmium Set Research Bulletin'. MUST NOT appear in
  // cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Cadmium Set Research Bulletin Huirth Base',
  reducer: (_state, action) => {
    const { researchBulletin } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { researchBulletin };
  },
  methodCreator: defaultMethodCreator,
});
