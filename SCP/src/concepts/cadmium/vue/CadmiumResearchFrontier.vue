<script setup lang="ts">
/**
 * CadmiumResearchFrontier — RFCC · the Research-Frontier composition (Diamond RAR · W5)
 *
 * Composes the §1 Topics zone (TLCR topics table + FSBA Research-All + STDB per-topic triggers)
 * (C864: the CadmiumPlannedQueries child is PRUNED — disconnected from the live circuit) with the
 * folded TopicBulletin (the EXISTING `articles` topic-research output rendered per-card,
 * collapsible). Relocated from CadmiumBulletin.vue §1 Topics (:164-216) + §2 article cards
 * (:218-256) + the `activeTopics` filter (:53-55).
 *
 * Pure render surface — parent (CadmiumLanding) owns all state + handlers. The
 *
 * CDBL · the folded TopicBulletin article cards route citation anchors via the shared usePelb
 * (@click.capture) → default browser (Electron) / normal nav (web SSR) — same intercept the
 * ResearchBulletin uses, no duplicated logic.
 *
 * Pewter Tessera HiFi: Suite 2 Orange. Patterns: RFCC · TLCR · FSBA/STDB · IAAF · CDBL/PELB
 * Citation: RAR-DIAMOND-WGB.md §COMPONENT CONTRACTS (RFCC) · §W5/W7
 * Citation: CadmiumBulletin.vue:53-55 (activeTopics) · :164-256 (Topics + folded article cards)
 */
import { computed } from 'vue';
import type { CadmiumArticle, CadmiumTopic } from '../cadmium.type';
// MD-CF-2 (C460) · the CodeEditorFileTree-resembling article browser replaces LiveBulletin for
// the Topic Bulletin zone (topics = dirs · articles = files · reactive off the same relay).
import CadmiumArticleTree from './CadmiumArticleTree.vue';

const props = defineProps<{
  topics: CadmiumTopic[];
  // Topic Live Bulletin · the merged Topic Bulletin (CadmiumArticle[] · frontier/ folder-tree relay
  // stream). Replaces the prior `articles` prop that drove the folded inline cards — those are now
  // rendered by the LiveBulletin sidebar+detail component below.
  topicBulletin: CadmiumArticle[];
  // Macro TR · FIX 3 · the research-sweep status RELOCATED into this zone (it is logically part of
  // the Research Frontier, by the Research All button). Parent (CadmiumLanding) owns the state.
  // sweepPhase 'idle' → the status line is hidden; 'running'/'done' → it renders sweepStatusText.
  sweepPhase: 'idle' | 'running' | 'done';
  sweepStatusText: string;
  // MD-CF-3 (C460) · THE DISPATCH ROSTER — observed worker sessions paired against sessionsList
  // (the SESSION-OBITUARY-PREDICATE runs in the parent): live workers pulse, closed show ✓.
  dispatchRoster: Array<{ id: string; closed: boolean; status: string }>;
}>();

const emit = defineEmits<{
  // Macro TR · STDB · per-topic Research dispatch — orchestrator runs runResearchSweep([topic]).
  researchTopic: [topic: CadmiumTopic];
  // Macro TR · FSBA · Research-All full-sweep — orchestrator runs runResearchSweep(activeTopics).
  researchAll: [];
  // MD-CF-3+ (C463) · a LIVE researcher pill click focuses that agent's session window.
  focusWorker: [id: string];
}>();

// Macro TR · the ACTIVE topics the Research-All sweep targets (idle topics are skipped).
// Mirrors the orchestrator's filter so the button label + disabled-state stay truthful.
const activeTopics = computed<CadmiumTopic[]>(() =>
  props.topics.filter((t) => t.active),
);
</script>

<template>
  <section class="bulletin-section">
    <div class="hifi-stamp">
      <h2 class="bulletin-section-title">Research Frontier</h2>
      <span class="hifi-label">Topics · Topic Bulletin</span>
    </div>

    <!-- C864 · PRUNED: the Planned-Query zone (CadmiumPlannedQueries) — disconnected from the
         live research circuit (the Anchor's Shatterite menus drive dispatch now). -->

    <!-- TLCR · topics.json tabulation + Macro TR triggers (STDB per-topic · FSBA full-sweep) -->
    <div class="zone-block">
      <div class="topics-zone-header">
        <h3 class="zone-heading">Topics</h3>
        <!-- Macro TR · FSBA · Research-All full-sweep button. Emits research-all; the
             orchestrator (CadmiumLanding) runs the blocking async-chain over ACTIVE topics.
             Disabled when no active topics exist (nothing to sweep). -->
        <button
          class="research-all-btn"
          :disabled="activeTopics.length === 0"
          :title="activeTopics.length === 0
            ? 'No active topics to research'
            : `Research all ${activeTopics.length} active topic(s) in sequence`"
          @click="emit('researchAll')"
        >
          Research All ({{ activeTopics.length }})
        </button>
        <!-- Macro TR · FIX 3 · the research-sweep status line, by the Research All button (in-zone).
             Visible only while running or just-completed; the orchestrator (parent) owns the state. -->
        <div
          v-if="sweepPhase !== 'idle'"
          :class="['research-sweep-status', `sweep-${sweepPhase}`]"
        >
          <span class="sweep-status-dot" />
          <span class="sweep-status-text">{{ sweepStatusText }}</span>
        </div>
      </div>
      <!-- MD-CF-3 · THE IN-DISPATCH ROSTER — every observed Topic Researcher, paired live
           against the Session Management sessionsList. A worker whose tracked id no longer
           exists anor is offline flips to CLOSED (the Dispatch Closure Diameter). -->
      <div v-if="dispatchRoster.length > 0" class="dispatch-roster" data-testid="dispatch-roster">
        <span class="dispatch-roster-label">In Dispatch:</span>
        <!-- C463 · a LIVE pill is a FOCUS BUTTON (watch the researcher work); a closed pill is
             inert. The whole roster self-clears on the All Clear (every agent closed · parent). -->
        <component
          :is="w.closed ? 'span' : 'button'"
          v-for="w in dispatchRoster"
          :key="w.id"
          :class="['dispatch-worker', w.closed ? 'worker-closed' : 'worker-live']"
          :data-worker-id="w.id"
          :title="w.closed ? 'researcher closed (session gone anor offline)' : `researcher ${w.status} · click to focus its session`"
          @click="!w.closed && emit('focusWorker', w.id)"
        >
          <span v-if="!w.closed" class="worker-pulse" />
          <span v-else class="worker-check">✓</span>
          <span class="worker-ulid">{{ w.id.slice(-6) }}</span>
          <span class="worker-state">{{ w.closed ? 'closed' : w.status }}</span>
        </component>
      </div>
      <table v-if="topics.length > 0" class="topics-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Query</th>
            <th>Active</th>
            <th>Research</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="topic in topics" :key="topic.id">
            <td class="topic-label">{{ topic.label }}</td>
            <td class="topic-query">{{ topic.query }}</td>
            <td>
              <span :class="['topic-active', topic.active ? 'is-active' : 'is-inactive']">
                {{ topic.active ? 'active' : 'idle' }}
              </span>
            </td>
            <td>
              <!-- Macro TR · STDB · per-topic Research button. Emits research-topic(topic);
                   the orchestrator runs runResearchSweep([topic]) — the N=1 FSBA case. -->
              <button
                class="research-topic-btn"
                :title="`Research this topic: ${topic.label}`"
                @click="emit('researchTopic', topic)"
              >
                Research
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="placeholder">(no topics configured · topics.json absent or empty)</p>
    </div>

    <!-- MD-CF-2 · THE ARTICLE TREE — the frontier/ relay stream rendered as the file-browser-
         resembling tree (topics expandable · articles as rows · sourceCount pills · BDRP detail
         pane). Same props contract LiveBulletin carried; the relay keeps it live. -->
    <div class="zone-block">
      <CadmiumArticleTree
        :articles="topicBulletin"
        endpoint-base="/cadmium-topic-bulletin"
        title="Topic Bulletin"
      />
    </div>
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

.zone-block {
  margin-bottom: 1.25rem;
}

.zone-block:last-child {
  margin-bottom: 0;
}

.zone-heading {
  color: #fb923c;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.625rem;
}

/* TLCR · topics table (Pewter orange) */
.topics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 4px;
  overflow: hidden;
}

.topics-table th,
.topics-table td {
  border: 1px solid #44351a;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.topics-table th {
  background: #2a1a08;
  color: #fb923c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.6875rem;
}

.topic-label {
  color: #f5e8d8;
  font-weight: 600;
}

.topic-query {
  color: #d6d3d1;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
}

.topic-active {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  background: #2a1a08;
}

.topic-active.is-active {
  color: #4ade80;
}

.topic-active.is-inactive {
  color: #a8a29e;
}

/* Macro TR · Topics zone header (heading + Research-All sweep button) */
.topics-zone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.topics-zone-header .zone-heading {
  margin: 0;
}

/* Macro TR · FSBA · Research-All full-sweep button (Pewter orange · primary) */
.research-all-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 4px;
  font-family: system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  background: #f97316;
  color: #1a0f08;
  border-top: 2px solid #c2410c;
  border-right: 2px solid #c2410c;
  border-bottom: 2px solid #fdba74;
  border-left: 2px solid #fdba74;
  box-shadow: -2px 2px 4px rgba(194, 65, 12, 0.4);
  transition: all 0.2s ease;
}

.research-all-btn:hover:not(:disabled) {
  background: #fb923c;
  box-shadow: -1px 1px 3px rgba(194, 65, 12, 0.4);
}

.research-all-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Macro TR · FIX 3 · research sweep progress status line (FSBA/STDB) RELOCATED from CadmiumLanding.vue.
   Renders in the topics-zone-header trailing the Research All button; pushed to the right via margin. */
.research-sweep-status {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-left: auto;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  background: #1a1208;
  border: 1px solid #44351a;
  font-size: 0.75rem;
  font-family: 'SF Mono', Monaco, monospace;
}

.research-sweep-status.sweep-running {
  border-color: #fbbf24;
  background: #2a1a08;
}

.research-sweep-status.sweep-done {
  border-color: #4ade80;
}

.sweep-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #a8a29e;
}

.sweep-running .sweep-status-dot {
  background: #fbbf24;
  animation: sweep-pulse 1.2s ease-in-out infinite;
}

.sweep-done .sweep-status-dot {
  background: #4ade80;
}

@keyframes sweep-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.sweep-status-text {
  color: #fde6c8;
}

/* MD-CF-3 · the In-Dispatch roster (the Dispatch Closure Diameter surface) */
.dispatch-roster {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0 0.75rem;
  font-size: 0.7rem;
}
.dispatch-roster-label {
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.62rem;
}
.dispatch-worker {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
}
.worker-live {
  color: #fdba74;
  border-color: rgba(251, 146, 60, 0.4);
  background: transparent;
  font: inherit;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.worker-live:hover {
  background: rgba(251, 146, 60, 0.12);
  border-color: rgba(251, 146, 60, 0.7);
}
.worker-closed {
  color: rgba(255, 255, 255, 0.4);
}
.worker-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fb923c;
  animation: dispatch-pulse 1.4s infinite;
}
.worker-check {
  color: #4ade80;
}
@keyframes dispatch-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
.worker-state {
  color: rgba(255, 255, 255, 0.5);
}

/* Macro TR · STDB · per-topic Research button (Pewter orange · secondary) */
.research-topic-btn {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-family: system-ui, sans-serif;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  background: #2a1a08;
  color: #fb923c;
  border: 1px solid #92400e;
  transition: all 0.2s ease;
}

.research-topic-btn:hover {
  background: #44351a;
  border-color: #fb923c;
}

/* folded TopicBulletin · article stack */
.article-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
