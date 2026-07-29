/**
 * cadmiumClearArticles Quality — Local Reducer (WNPM · C4-D1)
 *
 * Resets the assembled-articles list to empty. No payload (createQualityCard). Partial
 * reducer return (only articles · Shortest Path Principle).
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 1 (Simple Quality).
 * Citation: CADMIUM-C4-OCHRE-BLUEPRINT.md §C4-D1.
 */
import { createQualityCard, defaultMethodCreator } from 'stratimux';
import type { CadmiumClientState } from '../cadmium.type';

export const cadmiumClearArticles = createQualityCard<CadmiumClientState>({
  type: 'Cadmium Clear Articles',
  reducer: () => {
    return { articles: [] };
  },
  methodCreator: defaultMethodCreator,
});
