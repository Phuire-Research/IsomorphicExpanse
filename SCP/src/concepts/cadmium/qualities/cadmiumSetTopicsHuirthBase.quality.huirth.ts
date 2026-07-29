/**
 * cadmiumSetTopicsHuirthBase Quality — Huirth-side Base Reducer (Diamond RFI · 2nd STCP · SBIS Base)
 *
 * Writes the current Anchor-authored CadmiumTopic[] into the cadmium Demometer's OWN Huirth
 * (Base) state — the server source of truth the topics STCP SMRP/BOCR stack reads. Dispatched by
 * the helper's SBIS path (Base FIRST, then the EXISTING relay 'Cadmium Set Topics'). Full-replace
 * (topics.json is the single TLCR source · upsert happens in the Anchor's CEWT write, not here);
 * partial reducer return (only topics · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Topics Huirth Base' is DISTINCT from the
 * relay's 'Cadmium Set Topics' and MUST match exactly at the six registration sites:
 *   (1) this quality `type` ·
 *   (2) cadmium.concept.huirth.ts cadmiumHuirthQualities mapping (deck-key
 *       cadmiumSetTopicsHuirthBase) ·
 *   (3) cadmium.type.ts CadmiumHuirthQualities deck-key ·
 *   (4) cadmium.type.ts CadmiumHuirthState.topics slot + cadmium.state.huirth.ts [] seed ·
 *   (5) cadmiumTopicsRelay.config.ts baseActionCreator ·
 *   (6) INVARIANT — ABSENT from cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only ·
 *       local reducer · the EXISTING relay 'Cadmium Set Topics' IS present there · that is correct).
 *
 * Citation: cadmiumSetMenuStageHuirthBase.quality.huirth (the menu Base mirror · same STCP shape).
 * Citation: cadmiumSetTopics.quality.client.ts (relay reception sibling · same CadmiumTopic[] shape).
 * Citation: RFI-DIAMOND-WGB.md §PART B + §TQNI 6-Site Checklist.
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumHuirthState,
  CadmiumSetTopicsHuirthBasePayload,
} from '../cadmium.type';

export type { CadmiumSetTopicsHuirthBasePayload };

export const cadmiumSetTopicsHuirthBase = createQualityCardWithPayload<
  CadmiumHuirthState,
  CadmiumSetTopicsHuirthBasePayload
>({
  // TQNI · DISTINCT from the relay's 'Cadmium Set Topics'. MUST NOT appear in
  // cadmium.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Cadmium Set Topics Huirth Base',
  reducer: (_state, action) => {
    const { topics } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { topics };
  },
  methodCreator: defaultMethodCreator,
});
