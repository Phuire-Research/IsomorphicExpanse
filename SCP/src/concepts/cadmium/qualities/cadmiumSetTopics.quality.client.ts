/**
 * cadmiumSetTopics Quality — Local Reducer (TLCR · PQJT · C4-D1)
 *
 * Replaces the full topics list (topics.json is the single TLCR source — full replace, not
 * append). Partial reducer return (only topics · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Cadmium Set Topics') is the SAME type the
 * cadmiumOkMonitor broadcasts when topics.json changes (mirrors the suiteCascade relay
 * precedent). When CadmiumLanding's page muxium is mounted, the broadcast lands here.
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 2 (Payload Quality).
 * Citation: CADMIUM-C4-OCHRE-BLUEPRINT.md §AD-5.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetTopicsPayload,
} from '../cadmium.type';

export type { CadmiumSetTopicsPayload };

export const cadmiumSetTopics = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetTopicsPayload
>({
  type: 'Cadmium Set Topics',
  reducer: (state, action) => {
    return { topics: action.payload.topics };
  },
  methodCreator: defaultMethodCreator,
});
