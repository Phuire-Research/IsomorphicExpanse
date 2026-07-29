/**
 * cadmiumSetTopicBulletin Quality — Local Reducer (Topic Live Bulletin · folder-tree relay · TBSS)
 *
 * Replaces the full Topic Bulletin list (the frontier/ folder-tree merge is the single
 * accumulating source — full replace, not append at the client). Partial reducer return (only
 * topicBulletin · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Cadmium Set Topic Bulletin') is the SAME type the
 * cadmiumOkMonitor broadcasts when any frontier/<slug>/<slug>-<ts>.json changes (mirrors the
 * researchBulletin relay precedent). When CadmiumLanding's page muxium is mounted, the broadcast
 * lands here.
 *
 * Citation: cadmiumSetResearchBulletin.quality.client.ts (the 3rd STCP relay mirror · same shape).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 2 (Payload Quality).
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §TQNI 5-Site Checklist (relay quality).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetTopicBulletinPayload,
} from '../cadmium.type';

export type { CadmiumSetTopicBulletinPayload };

export const cadmiumSetTopicBulletin = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetTopicBulletinPayload
>({
  type: 'Cadmium Set Topic Bulletin',
  reducer: (state, action) => {
    return { topicBulletin: action.payload.topicBulletin };
  },
  methodCreator: defaultMethodCreator,
});
