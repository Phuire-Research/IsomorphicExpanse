<script setup lang="ts">
/**
 * LiveBulletin — LBGC · prop-driven sidebar + detail render of ANY STCP bulletin output stream
 * (Topic Live Bulletin · W3 · generalised from CadmiumResearchBulletin.vue)
 *
 * The transferable bulletin renderer: a two-channel SIDEBAR + DETAIL layout driven by props, so the
 * SAME component renders BOTH the Targeted Research Bulletin (endpointBase '/cadmium-research-bulletin')
 * AND the Topic Bulletin (endpointBase '/cadmium-topic-bulletin') — any future Suite-8 page passes a
 * fresh `articles` list + `endpointBase` and gets a complete live bulletin renderer.
 *   - SIDEBAR · a selectable list of compact META cards (title / preview / topic / sourceCount /
 *     filePath) sourced from the `articles: CadmiumArticle[]` prop (the live STCP store drives this
 *     list reactively).
 *   - DETAIL · an overview pane that renders the SELECTED article's full markdownContent. The full
 *     body is fetched on-demand from the DETAIL channel (GET `${endpointBase}/:id`) into a
 *     COMPONENT-SCOPED bodyCache Map — never re-fetched, never into Stratimux state.
 *
 * The `:id` (articleId) derives from a file path (may contain slashes) → encodeURIComponent on the
 * fetch. Orphan guard: a live STCP broadcast that removes the selected article clears the selection.
 *
 * SERVER-ONLY parse stays server-side — this surface uses `fetch()` only (no parser in the client
 * bundle). Preserves IAAF + CDBL/usePelb + `.markdown-pane` CSS (byte-identical to the prior
 * CadmiumResearchBulletin.vue · only the hardcoded path → `endpointBase` prop + a `title` prop).
 *
 * Pewter Tessera HiFi: Suite 2 Orange. Patterns: LBGC · BSBS · BDRP · IAAF · CDBL/PELB · marked render
 * Citation: CadmiumResearchBulletin.vue (the single-bulletin source this generalises)
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §W3 (LiveBulletin.vue · prop-driven endpointBase)
 */
import { ref, reactive, watch } from 'vue';
import { marked } from 'marked';
import type { CadmiumArticle } from '../cadmium.type';
import { usePelb } from '../composables/usePelb';

const props = defineProps<{
  articles: CadmiumArticle[];
  endpointBase: string;
  title?: string;
}>();

// CDBL · shared external-link intercept (usePelb) — routes citation anchors to the default browser.
const { handleExternalLinkClick } = usePelb();

// IAAF · rewrite `../assets/<file>` Markdown image refs to the secured Huirth route
// `/cadmium-assets/<file>` BEFORE marked parses them. Then render to HTML. (Preserved.)
function renderArticle(markdownContent: string): string {
  const rewritten = markdownContent.replace(/\.\.\/assets\//g, '/cadmium-assets/');
  return marked.parse(rewritten, { async: false }) as string;
}

// BSBS · single-select state — one article open at a time (keyed by articleId · the stable id).
const selectedArticleId = ref<string | null>(null);

// BDRP · component-scoped detail bodyCache. Keys: articleId. Values: CadmiumArticle | 'loading' |
// 'error'. reactive(new Map()) so .set() re-renders with no counter refs; never re-fetches a present
// key; NEVER enters Stratimux state (bodies stay local).
const bodyCache = reactive(new Map<string, CadmiumArticle | 'loading' | 'error'>());

// BDRP · fetch the full article from the DETAIL channel. encodeURIComponent — articleId derives
// from a file path (may contain slashes). The parse lives server-side; this is a plain fetch. The
// path is prop-driven (`endpointBase`) so this component serves any bulletin stream.
function selectCard(articleId: string): void {
  if (selectedArticleId.value === articleId) {
    // Re-click the open card → collapse (keep the cache entry so re-expand is instant).
    selectedArticleId.value = null;
    return;
  }
  selectedArticleId.value = articleId;
  if (bodyCache.has(articleId)) return; // Cache hit — never re-fetch.
  bodyCache.set(articleId, 'loading');
  void fetch(props.endpointBase + '/' + encodeURIComponent(articleId))
    .then((r) => (r.ok ? r.json() : null))
    .then((article: CadmiumArticle | null) => {
      bodyCache.set(articleId, article ?? 'error');
    })
    .catch(() => {
      bodyCache.set(articleId, 'error');
    });
}

// Orphan guard: if the live STCP relay full-replaces the list and the selected article is gone,
// clear the selection + its cache entry. Key on articleId.
watch(
  () => props.articles,
  (newList) => {
    if (selectedArticleId.value === null) return;
    const stillPresent = newList.some((a) => a.articleId === selectedArticleId.value);
    if (!stillPresent) {
      bodyCache.delete(selectedArticleId.value);
      selectedArticleId.value = null;
    }
  },
);
</script>

<template>
  <section class="bulletin-section">
    <div class="hifi-stamp">
      <h2 class="bulletin-section-title">{{ props.title ?? 'Bulletin' }}</h2>
      <span class="hifi-label">Live Articles</span>
    </div>

    <div v-if="props.articles.length > 0" class="bulletin-split">
      <!-- SIDEBAR · selectable compact META cards (the live STCP store drives this list). -->
      <nav class="bulletin-sidebar">
        <button
          v-for="article in props.articles"
          :key="article.articleId"
          type="button"
          class="article-card-compact"
          :class="{ selected: selectedArticleId === article.articleId }"
          @click="selectCard(article.articleId)"
        >
          <h3 class="article-title">{{ article.title }}</h3>
          <!-- Macro AB · ARJP — the stored preview (from the paired JSON meta · optional). -->
          <p v-if="article.preview" class="article-preview">{{ article.preview }}</p>
          <div class="article-meta-row">
            <span v-if="article.topic" class="article-topic">{{ article.topic }}</span>
            <span v-if="typeof article.sourceCount === 'number'" class="article-sources">
              {{ article.sourceCount }} source{{ article.sourceCount === 1 ? '' : 's' }}
            </span>
            <span class="article-path">{{ article.filePath }}</span>
          </div>
        </button>
      </nav>

      <!-- DETAIL · the overview pane (BDRP bodyCache states · full markdownContent on select). -->
      <div class="bulletin-detail">
        <template v-if="selectedArticleId">
          <div v-if="bodyCache.get(selectedArticleId) === 'loading'" class="shimmer-bar" />
          <p v-else-if="bodyCache.get(selectedArticleId) === 'error'" class="detail-error">
            (failed to load this article · the source file may have changed)
          </p>
          <article
            v-else-if="bodyCache.get(selectedArticleId)"
            class="article-card"
            @click.capture="handleExternalLinkClick"
          >
            <header class="article-card-header">
              <h3 class="article-title">
                {{ (bodyCache.get(selectedArticleId) as CadmiumArticle).title }}
              </h3>
              <p
                v-if="(bodyCache.get(selectedArticleId) as CadmiumArticle).preview"
                class="article-preview"
              >
                {{ (bodyCache.get(selectedArticleId) as CadmiumArticle).preview }}
              </p>
              <div class="article-meta-row">
                <span
                  v-if="(bodyCache.get(selectedArticleId) as CadmiumArticle).topic"
                  class="article-topic"
                >
                  {{ (bodyCache.get(selectedArticleId) as CadmiumArticle).topic }}
                </span>
                <span
                  v-if="typeof (bodyCache.get(selectedArticleId) as CadmiumArticle).sourceCount === 'number'"
                  class="article-sources"
                >
                  {{ (bodyCache.get(selectedArticleId) as CadmiumArticle).sourceCount }}
                  source{{ (bodyCache.get(selectedArticleId) as CadmiumArticle).sourceCount === 1 ? '' : 's' }}
                </span>
                <span class="article-path">
                  {{ (bodyCache.get(selectedArticleId) as CadmiumArticle).filePath }}
                </span>
              </div>
            </header>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              class="markdown-pane"
              v-html="renderArticle((bodyCache.get(selectedArticleId) as CadmiumArticle).markdownContent)"
            />
          </article>
        </template>
        <p v-else class="detail-empty">Select an article to read the full bulletin.</p>
      </div>
    </div>
    <p v-else class="placeholder">
      (no articles yet · a research run writes them to the bulletin source)
    </p>
  </section>
</template>

<style scoped>
.bulletin-section {
  background: #1a1208;
  border-top: 2px solid #92400e;
  border-right: 2px solid #92400e;
  border-bottom: 2px solid #fb923c;
  border-left: 2px solid #fb923c;
  box-shadow: -3px 3px 0 rgba(146, 64, 14, 0.4);
  border-radius: 6px;
  padding: 1.5rem;
}

.hifi-stamp {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #44351a;
}

.bulletin-section-title {
  color: #f97316;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.hifi-label {
  color: #a8a29e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* BSBS · sidebar + detail split layout */
.bulletin-split {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: flex-start;
}

.bulletin-sidebar {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.bulletin-detail {
  flex: 1 1 360px;
  min-width: 0;
}

/* SIDEBAR · selectable compact meta card (button for keyboard/a11y) */
.article-card-compact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  text-align: left;
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.12s ease, background 0.12s ease;
}

.article-card-compact:hover {
  border-color: #92400e;
  background: #140d06;
}

.article-card-compact.selected {
  border-color: #fb923c;
  background: #1a1208;
  box-shadow: -2px 2px 0 rgba(146, 64, 14, 0.4);
}

/* DETAIL · loading shimmer + empty/error placeholders */
.shimmer-bar {
  height: 3rem;
  border-radius: 6px;
  background: linear-gradient(90deg, #1a1208 25%, #2a1a08 50%, #1a1208 75%);
  background-size: 200% 100%;
  animation: bulletinShimmer 1.2s ease-in-out infinite;
}

@keyframes bulletinShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.detail-empty {
  color: #78716c;
  font-style: italic;
  font-size: 0.875rem;
  padding: 1.25rem;
  background: #0f0a05;
  border: 1px dashed #44351a;
  border-radius: 6px;
  margin: 0;
}

.detail-error {
  color: #f87171;
  font-style: italic;
  font-size: 0.875rem;
  padding: 1rem;
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  margin: 0;
}

.article-card {
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  padding: 1rem 1.25rem;
}

.article-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #2a1a08;
}

.article-title {
  color: #f97316;
  font-size: 1rem;
  margin: 0;
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.article-path {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #a8a29e;
}

/* Macro AB · ARJP — stored preview + meta row on the research article card */
.article-preview {
  color: #fde6c8;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0.25rem 0 0.5rem;
  font-style: italic;
}

.article-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.article-topic {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  background: #2a1a08;
  color: #fb923c;
  border: 1px solid #92400e;
}

.article-sources {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  background: #1a1208;
  color: #4ade80;
}

.placeholder {
  color: #78716c;
  font-style: italic;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
  background: #0f0a05;
  border-radius: 4px;
  margin: 0;
}

/* Markdown rendering pane — relocated from CadmiumBulletin.vue:613-728 (Cadmium orange retint) */
.markdown-pane {
  /* C468 · long article-source URLs must WRAP, not overflow the pane */
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  padding: 1rem 1.25rem;
  color: #f5e8d8;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
}

.markdown-pane :deep(h1) {
  color: #fb923c;
  font-size: 1.25rem;
  margin: 0.5rem 0 0.75rem;
  border-bottom: 1px solid #44351a;
  padding-bottom: 0.5rem;
}

.markdown-pane :deep(h2) {
  color: #fb923c;
  font-size: 1.05rem;
  margin: 1rem 0 0.5rem;
}

.markdown-pane :deep(h3) {
  color: #fdba74;
  font-size: 0.95rem;
  margin: 0.75rem 0 0.5rem;
}

.markdown-pane :deep(p) {
  margin: 0.5rem 0;
  color: #d6d3d1;
}

.markdown-pane :deep(a) {
  color: #fbbf24;
  text-decoration: underline;
  cursor: pointer;
}

.markdown-pane :deep(strong) {
  color: #fb923c;
  font-weight: 600;
}

.markdown-pane :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5rem 0;
  border: 1px solid #44351a;
}

.markdown-pane :deep(code) {
  background: #1a1208;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  color: #fdba74;
}

.markdown-pane :deep(pre) {
  background: #1a1208;
  border: 1px solid #44351a;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.markdown-pane :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-pane :deep(ul),
.markdown-pane :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-pane :deep(li) {
  margin: 0.25rem 0;
}

.markdown-pane :deep(table) {
  border-collapse: collapse;
  margin: 0.5rem 0;
  font-size: 0.8125rem;
  width: 100%;
}

.markdown-pane :deep(th),
.markdown-pane :deep(td) {
  border: 1px solid #44351a;
  padding: 0.375rem 0.75rem;
  text-align: left;
}

.markdown-pane :deep(th) {
  background: #1a1208;
  color: #fb923c;
  font-weight: 600;
}

.markdown-pane :deep(blockquote) {
  border-left: 3px solid #fb923c;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #a8a29e;
  font-style: italic;
}
</style>
