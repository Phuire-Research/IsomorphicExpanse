/**
 * cadmiumSetResearchBulletin Quality — Local Reducer (Diamond RAR · 3rd STCP · RBSS)
 *
 * Replaces the full targeted ResearchBulletin list (targeted/researchBulletin.json is the single
 * accumulating source — full replace, not append at the client). Partial reducer return (only
 * researchBulletin · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Cadmium Set Research Bulletin') is the SAME type the
 * cadmiumOkMonitor broadcasts when targeted/researchBulletin.json changes (mirrors the topics
 * relay precedent). When CadmiumLanding's page muxium is mounted, the broadcast lands here.
 *
 * Citation: cadmiumSetTopics.quality.client.ts (the topics relay mirror · same shape).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 2 (Payload Quality).
 * Citation: RAR-DIAMOND-WGB.md §FULL 3rd-STCP TQNI SITE CHECKLIST (R1).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetResearchBulletinPayload,
} from '../cadmium.type';

export type { CadmiumSetResearchBulletinPayload };

export const cadmiumSetResearchBulletin = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetResearchBulletinPayload
>({
  type: 'Cadmium Set Research Bulletin',
  reducer: (state, action) => {
    return { researchBulletin: action.payload.researchBulletin };
  },
  methodCreator: defaultMethodCreator,
});
