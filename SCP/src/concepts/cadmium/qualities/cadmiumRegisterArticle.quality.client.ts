/**
 * cadmiumRegisterArticle Quality — Local Reducer (WNPM · C4-D1)
 *
 * Registers an assembled Markdown research article (CadmiumArticle). Upsert-by-filePath:
 * a re-written `.md` (same path, changed content) REPLACES the existing entry rather than
 * appending a duplicate. Partial reducer return (only articles · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Cadmium Register Article') is the SAME type the
 * cadmiumOkMonitor broadcasts via webSocketServerAppendToActionQue (mirrors the suiteCascade
 * relay precedent). When CadmiumLanding's page muxium is mounted, the broadcast lands here.
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 4 (Array/Object Update).
 * Citation: CADMIUM-C4-OCHRE-BLUEPRINT.md §AD-3 (upsert by filePath).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumRegisterArticlePayload,
} from '../cadmium.type';

export type { CadmiumRegisterArticlePayload };

export const cadmiumRegisterArticle = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumRegisterArticlePayload
>({
  type: 'Cadmium Register Article',
  reducer: (state, action) => {
    const { article } = action.payload;
    const existingIndex = state.articles.findIndex((a) => a.filePath === article.filePath);
    if (existingIndex === -1) {
      // New file — append.
      return { articles: [...state.articles, article] };
    }
    // Re-written file — replace the entry at its index (upsert by filePath).
    const next = state.articles.slice();
    next[existingIndex] = article;
    return { articles: next };
  },
  methodCreator: defaultMethodCreator,
});
