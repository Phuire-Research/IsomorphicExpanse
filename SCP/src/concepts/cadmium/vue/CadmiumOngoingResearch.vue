<script setup lang="ts">
/**
 * CadmiumOngoingResearch — ORRC · Ongoing-Research-RI-Component (Macro AB)
 *
 * The RI-recorded research-accumulation surface: a light, focused panel that records the
 * research PERFORMED (the compounding research record) — distinct from the CadmiumBulletin
 * article cards (which render INDIVIDUAL article bodies). ORRC shows the TRAJECTORY: how many
 * arcs have run, when, and across which topics — the RI accumulation made visible.
 *
 * Source: the same cadmium `articles` state AWCR populates (no new watcher needed). Each
 * CadmiumArticle carries the ARJP meta (topic / preview / sourceCount / createdAt) the AWCR
 * watcher threaded from the paired JSON. ORRC reads it, tallies a count + a per-topic timeline,
 * and renders a compact record row per arc (most-recent first).
 *
 * Props-driven (parent CadmiumLanding owns the Muxium + reactive reads · pure renderer · the
 * same contract CadmiumBulletin uses).
 *
 * Pewter Tessera HiFi: Suite 2 Orange (cadmium pigment · Prospector · accumulating record).
 * Patterns: ORRC · ARJP (the meta this reads) · AWCR (the watcher that populates articles)
 * Citation: EPOCH-SR-S2-ORANGE-NAMING.md §Macro AB (ORRC · "RI-based, not article-based")
 * Citation: EPOCH-DIAMOND-SUITE8-SETUP-RESEARCH.md §2 Macro 5 AB (Ongoing Research)
 */
import { computed } from 'vue';
import type { CadmiumArticle } from '../cadmium.type';

const props = defineProps<{
  articles: CadmiumArticle[];
}>();

// ORRC · the accumulation count — how many research arcs have produced a durable article.
const researchCount = computed<number>(() => props.articles.length);

// ORRC · distinct topics researched (from the ARJP meta · falls back to the title when a bare
// Markdown-only article carries no topic). The distinct count signals research BREADTH.
const distinctTopicCount = computed<number>(() => {
  const set = new Set<string>();
  for (const a of props.articles) {
    set.add((a.topic ?? a.title ?? a.filePath).trim());
  }
  return set.size;
});

// ORRC · the research record rows — most-recent first (createdAt desc). Each row is one arc's
// compact trajectory entry: topic, title, source count, and a readable timestamp.
const recordRows = computed(() =>
  props.articles
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((a) => ({
      key: a.filePath,
      topic: a.topic ?? '',
      title: a.title,
      preview: a.preview ?? '',
      sourceCount: a.sourceCount,
      when: formatWhen(a.createdAt),
    })),
);

// Light, dependency-free timestamp formatter (no date lib · matches the codebase no-new-deps rule).
function formatWhen(ts: number): string {
  if (!ts || Number.isNaN(ts)) return '';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}
</script>

<template>
  <section class="ongoing-research">
    <div class="hifi-stamp">
      <h2 class="ongoing-title">Ongoing Research</h2>
      <span class="hifi-label">RI-Recorded Accumulation</span>
    </div>

    <!-- ORRC · the accumulation summary — the compounding research record at a glance. -->
    <div class="ongoing-summary">
      <div class="stat">
        <span class="stat-value">{{ researchCount }}</span>
        <span class="stat-label">research arc{{ researchCount === 1 ? '' : 's' }}</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ distinctTopicCount }}</span>
        <span class="stat-label">topic{{ distinctTopicCount === 1 ? '' : 's' }} covered</span>
      </div>
    </div>

    <!-- ORRC · the per-arc record timeline (most-recent first · distinct from the article cards). -->
    <ol v-if="recordRows.length > 0" class="record-list">
      <li v-for="row in recordRows" :key="row.key" class="record-row">
        <div class="record-head">
          <span v-if="row.topic" class="record-topic">{{ row.topic }}</span>
          <span class="record-title">{{ row.title }}</span>
        </div>
        <p v-if="row.preview" class="record-preview">{{ row.preview }}</p>
        <div class="record-meta">
          <span v-if="typeof row.sourceCount === 'number'" class="record-sources">
            {{ row.sourceCount }} source{{ row.sourceCount === 1 ? '' : 's' }}
          </span>
          <span v-if="row.when" class="record-when">{{ row.when }}</span>
        </div>
      </li>
    </ol>
    <p v-else class="placeholder">
      (no research recorded yet · each research arc compounds the RI here)
    </p>
  </section>
</template>

<style scoped>
.ongoing-research {
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

.ongoing-title {
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

.ongoing-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  flex: 1;
}

.stat-value {
  color: #fb923c;
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, monospace;
}

.stat-label {
  color: #a8a29e;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.record-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.record-row {
  background: #0f0a05;
  border: 1px solid #44351a;
  border-left: 3px solid #fb923c;
  border-radius: 4px;
  padding: 0.625rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.record-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.record-topic {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  background: #2a1a08;
  color: #fb923c;
  border: 1px solid #92400e;
}

.record-title {
  color: #f5e8d8;
  font-size: 0.875rem;
  font-weight: 600;
}

.record-preview {
  color: #d6d3d1;
  font-size: 0.8125rem;
  line-height: 1.45;
  margin: 0;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.record-sources {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #4ade80;
}

.record-when {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #a8a29e;
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
</style>
