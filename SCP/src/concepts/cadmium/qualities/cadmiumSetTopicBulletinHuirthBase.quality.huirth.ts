/**
 * cadmiumSetTopicBulletinHuirthBase Quality — Huirth-side Base Reducer (Topic Live Bulletin · SBIS Base)
 *
 * Writes the current merged Topic Bulletin CadmiumArticle[] into the cadmium Demometer's OWN
 * Huirth (Base) state — the server source of truth the topicBulletin STCP SMRP/BOCR stack reads.
 * Dispatched by the folder-tree merge's SBIS path (Base FIRST, then the relay 'Cadmium Set Topic
 * Bulletin'). Full-replace (the frontier/ folder-tree merge owns accumulation, not here); partial
 * reducer return (only topicBulletin · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Topic Bulletin Huirth Base' is DISTINCT
 * from the relay's 'Cadmium Set Topic Bulletin' and MUST match exactly at the five registration
 * sites:
 *   (1) this quality `type` ·
 *   (2) cadmium.concept.huirth.ts cadmiumHuirthQualities mapping (deck-key
 *       cadmiumSetTopicBulletinHuirthBase) ·
 *   (3) cadmium.type.ts CadmiumHuirthQualities deck-key ·
 *   (4) cadmium.type.ts CadmiumHuirthState.topicBulletin slot + cadmium.state.huirth.ts [] seed ·
 *   (5) cadmiumTopicBulletinRelay.config.ts baseActionCreator ·
 *   INVARIANT — ABSENT from cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only ·
 *       local reducer · the relay 'Cadmium Set Topic Bulletin' IS present there · that is correct).
 *
 * Citation: cadmiumSetResearchBulletinHuirthBase.quality.huirth (the 3rd STCP Base mirror · same shape).
 * Citation: cadmiumSetTopicBulletin.quality.client.ts (relay reception sibling · same CadmiumArticle[] shape).
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §TQNI 5-Site Checklist (Huirth Base).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumSetTopicBulletinHuirthBasePayload,
} from '../cadmium.type';

export type { CadmiumSetTopicBulletinHuirthBasePayload };

export const cadmiumSetTopicBulletinHuirthBase = createQualityCardWithPayload<
  CadmiumHuirthState,
  CadmiumSetTopicBulletinHuirthBasePayload
>({
  // TQNI · DISTINCT from the relay's 'Cadmium Set Topic Bulletin'. MUST NOT appear in
  // cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Cadmium Set Topic Bulletin Huirth Base',
  reducer: (_state, action) => {
    const { topicBulletin } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { topicBulletin };
  },
  methodCreator: defaultMethodCreator,
});
