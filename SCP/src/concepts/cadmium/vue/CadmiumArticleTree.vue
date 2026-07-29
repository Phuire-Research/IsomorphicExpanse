<script setup lang="ts">
/**
 * CadmiumArticleTree — MD-CF-2 (C460) · the Research Browser relayout: the CodeEditorFileTree
 * Diameter drawn onto articles.
 *
 * TOPICS are the "directories" (expandable ▸/▾ rows · `Record<string,boolean>` expansion —
 * the same skeleton as CodeEditorFileTree); ARTICLES are the "file" rows; the sourceCount
 * pill plays the GitM-badge role. TOPICBULLETIN-AS-ARTICLE-INDEX: the `articles` prop IS the
 * already-relayed STCP store — no new endpoint, no new state; a new article arriving over the
 * relay surfaces in the tree reactively (EXPANSION-IS-LAZY-FILTER: opening a topic shows a
 * computed slice, not a network request). The detail pane carries the LiveBulletin BDRP idiom
 * verbatim (component-scoped bodyCache · GET `${endpointBase}/:id` on select · marked render ·
 * usePelb citation-anchor intercept).
 *
 * Patterns: CADMIUM-ARTICLE-TREE · TOPICBULLETIN-AS-ARTICLE-INDEX · EXPANSION-IS-LAZY-FILTER ·
 * BDRP · IAAF · CDBL/PELB
 * Citation: DIAMOND-CADMIUM-FORGE.md §MD-CF-2 · CodeEditorFileTree.vue (the structural idiom) ·
 * LiveBulletin.vue (the BDRP detail pane this carries over)
 */
import { ref, reactive, computed, watch } from 'vue';
import { marked } from 'marked';
import type { CadmiumArticle } from '../cadmium.type';
import { usePelb } from '../composables/usePelb';

const props = defineProps<{
  articles: CadmiumArticle[];
  endpointBase: string;
  title?: string;
}>();

const { handleExternalLinkClick } = usePelb();

const UNFILED = '(unfiled)';

// The topic grouping — the tree's "directory" level. Insertion-ordered by first appearance;
// articles newest-first within a topic.
const topicGroups = computed<Array<{ topic: string; entries: CadmiumArticle[] }>>(() => {
  const groups = new Map<string, CadmiumArticle[]>();
  for (const a of props.articles) {
    const key = a.topic && a.topic.trim() ? a.topic : UNFILED;
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([topic, entries]) => ({
    topic,
    entries: [...entries].sort((x, y) => y.createdAt - x.createdAt),
  }));
});

// The CodeEditorFileTree expansion idiom — expansion IS the reveal.
const expanded = ref<Record<string, boolean>>({});
function toggleTopic(topic: string): void {
  expanded.value = { ...expanded.value, [topic]: !expanded.value[topic] };
}

// BDRP · component-scoped detail bodyCache (LiveBulletin idiom, carried verbatim).
const selectedArticleId = ref<string | null>(null);
const bodyCache = reactive(new Map<string, CadmiumArticle | 'loading' | 'error'>());

function selectArticle(articleId: string): void {
  if (selectedArticleId.value === articleId) {
    selectedArticleId.value = null;
    return;
  }
  selectedArticleId.value = articleId;
  if (bodyCache.has(articleId)) return;
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

// IAAF · asset-route rewrite before marked parses (LiveBulletin idiom).
function renderArticle(markdownContent: string): string {
  const rewritten = markdownContent.replace(/\.\.\/assets\//g, '/cadmium-assets/');
  return marked.parse(rewritten, { async: false }) as string;
}

// Orphan guard — a relay full-replace that drops the selected article clears the selection.
watch(
  () => props.articles,
  (newList) => {
    if (selectedArticleId.value === null) return;
    if (!newList.some((a) => a.articleId === selectedArticleId.value)) {
      bodyCache.delete(selectedArticleId.value);
      selectedArticleId.value = null;
    }
  },
);
</script>

<template>
  <section class="bulletin-section">
    <div class="hifi-stamp">
      <h2 class="bulletin-section-title">{{ props.title ?? 'Articles' }}</h2>
      <span class="hifi-label">Article Tree · Live</span>
    </div>

    <div v-if="topicGroups.length > 0" class="atree-split">
      <!-- THE TREE · topics as dirs, articles as files (the file-browser resemblance). -->
      <nav class="atree-pane" data-testid="cadmium-article-tree">
        <ul class="atree-level">
          <li v-for="group in topicGroups" :key="group.topic" class="atree-node">
            <button
              class="atree-row atree-dir"
              data-testid="atree-topic"
              :data-topic="group.topic"
              @click="toggleTopic(group.topic)"
            >
              <span class="atree-arrow">{{ expanded[group.topic] ? '▾' : '▸' }}</span>
              <span class="atree-name">{{ group.topic }}</span>
              <span class="atree-count">{{ group.entries.length }}</span>
            </button>
            <ul v-if="expanded[group.topic]" class="atree-level atree-children">
              <li v-for="article in group.entries" :key="article.articleId" class="atree-node">
                <button
                  class="atree-row atree-file"
                  data-testid="atree-article"
                  :class="{ selected: selectedArticleId === article.articleId }"
                  @click="selectArticle(article.articleId)"
                >
                  <span class="atree-arrow"></span>
                  <span class="atree-name">{{ article.title }}</span>
                  <span
                    v-if="typeof article.sourceCount === 'number'"
                    class="atree-badge"
                    >{{ article.sourceCount }}</span
                  >
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <!-- THE DETAIL · BDRP pane (LiveBulletin idiom carried over). -->
      <div class="atree-detail">
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
              <span class="article-path">
                {{ (bodyCache.get(selectedArticleId) as CadmiumArticle).filePath }}
              </span>
            </header>
            <div
              class="markdown-pane"
              v-html="
                renderArticle(
                  (bodyCache.get(selectedArticleId) as CadmiumArticle).markdownContent,
                )
              "
            />
          </article>
        </template>
        <p v-else class="atree-hint">(select an article from the tree)</p>
      </div>
    </div>
    <p v-else class="placeholder">(no articles yet · dispatched research lands here live)</p>
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
  margin: 0;
  font-size: 1.05rem;
  color: #fdba74;
}
.hifi-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.atree-split {
  display: grid;
  grid-template-columns: minmax(200px, 280px) 1fr;
  gap: 1rem;
  align-items: start;
}
.atree-pane {
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 0.4rem;
  background: rgba(0, 0, 0, 0.25);
}
.atree-level {
  list-style: none;
  margin: 0;
  padding: 0;
}
.atree-children {
  padding-left: 0.9rem;
}
.atree-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.14rem 0.3rem;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  font-size: 0.78rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  text-align: left;
}
.atree-row:hover {
  background: rgba(255, 255, 255, 0.07);
}
.atree-row.selected {
  background: rgba(251, 146, 60, 0.15);
}
.atree-dir .atree-name {
  color: #fdba74;
}
.atree-arrow {
  width: 0.85rem;
  display: inline-block;
  color: rgba(255, 255, 255, 0.45);
}
.atree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.atree-count {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.4);
  padding: 0 0.3rem;
}
.atree-badge {
  font-size: 0.62rem;
  font-weight: 700;
  color: #4ade80;
  padding: 0 0.25rem;
}
.atree-detail {
  min-width: 0;
}
.atree-hint,
.placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.8rem;
}
.detail-error {
  color: #f87171;
  font-size: 0.8rem;
}
.shimmer-bar {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #2a2010 25%, #4a3820 50%, #2a2010 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.article-card-header {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
.article-title {
  margin: 0;
  font-size: 0.95rem;
  color: #fdba74;
}
.article-path {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.35);
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
}
.markdown-pane {
  font-size: 0.85rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.85);
  /* C468 · long article-source URLs must WRAP, not overflow the pane */
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
}
.markdown-pane :deep(a) {
  color: #fb923c;
}
.markdown-pane :deep(img) {
  max-width: 100%;
}
</style>
