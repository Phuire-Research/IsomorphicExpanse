<script setup lang="ts">
/**
 * Suite 8 Page — Three-Tab Designation Viewer
 *
 * Tabs:
 *   1. Info Sheet (default) — rendered file-system read of Suite 8 directory
 *   2. D-O Viewer — Diamond.md + Onyx.md side-by-side render
 *   3. Settings (default sub-page when muxified elsewhere) — per-location config
 *
 * D3 lands the page surface + state subscriptions. File-loading dispatches
 * defer to D4 (Diametric Inductions to fileSystem concept). Until then,
 * content slots display placeholders.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave F
 * Citation: NotificationLanding.vue (Vue↔Stratimux integration exemplar)
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { marked } from 'marked';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import { SUITE8_TABS, type Suite8Designation, type Suite8Tab } from '../suite8.type';
// Cycle 159 D1 · IUPA · suite8 muxified per-page (no longer base)
import { createSuite8ClientConcept } from '../suite8.concept.client';
import { suite8Muxonomic } from '../suite8.muxonomy';
// Cycle 159 D1 · GPIM · Vue-layer Muxium binding into universal scsBridge controller
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';

const designations = ref<Suite8Designation[]>([]);
const activeDesignationName = ref<string>('');
const activeTab = ref<Suite8Tab>('info');
const loadedDiamondContent = ref<string>('');
const loadedOnyxContent = ref<string>('');
const loadedBoundCascade = ref<Record<string, unknown> | null>(null);
const loadedFileSystemSheet = ref<string>('');

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

const activeDesignation = computed<Suite8Designation | null>(() => {
  if (!activeDesignationName.value) return null;
  return designations.value.find((d) => d.name === activeDesignationName.value) ?? null;
});

const boundCascadeJson = computed<string>(() => {
  if (!loadedBoundCascade.value) return '';
  return JSON.stringify(loadedBoundCascade.value, null, 2);
});

const renderedDiamond = computed<string>(() => {
  if (!loadedDiamondContent.value) return '';
  return marked.parse(loadedDiamondContent.value, { async: false }) as string;
});

const renderedOnyx = computed<string>(() => {
  if (!loadedOnyxContent.value) return '';
  return marked.parse(loadedOnyxContent.value, { async: false }) as string;
});

const renderedFileSystemSheet = computed<string>(() => {
  if (!loadedFileSystemSheet.value) return '';
  return marked.parse(loadedFileSystemSheet.value, { async: false }) as string;
});

function switchTab(tab: Suite8Tab) {
  if (!muxium) return;
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.suite8.e.suite8SetActiveTab({ tab }),
  );
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // Cycle 159 D1 · IUPA · landing supplies suite8 as muxonomic page concept
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic }],
    {
      title: 'Suite8Page',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8PageSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            designations.value = d.client.d.suite8.k.designations.select();
            activeDesignationName.value = d.client.d.suite8.k.activeDesignationName.select();
            activeTab.value = d.client.d.suite8.k.activeTab.select();
            loadedDiamondContent.value = d.client.d.suite8.k.loadedDiamondContent.select();
            loadedOnyxContent.value = d.client.d.suite8.k.loadedOnyxContent.select();
            loadedBoundCascade.value = d.client.d.suite8.k.loadedBoundCascade.select();
            loadedFileSystemSheet.value = d.client.d.suite8.k.loadedFileSystemSheet.select();
          },
          {
            selectors: [
              d__.client.d.suite8.k.designations,
              d__.client.d.suite8.k.activeDesignationName,
              d__.client.d.suite8.k.activeTab,
              d__.client.d.suite8.k.loadedDiamondContent,
              d__.client.d.suite8.k.loadedOnyxContent,
              d__.client.d.suite8.k.loadedBoundCascade,
              d__.client.d.suite8.k.loadedFileSystemSheet,
            ],
          },
        ),
      ]),
  );
});

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) stagePlanner.conclude();
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="suite8-page">
    <header class="page-header">
      <h1>
        Suite 8: <span class="designation-name">{{
          activeDesignation?.name || '(no designation selected)'
        }}</span>
      </h1>
      <p v-if="activeDesignation?.description" class="page-description">
        {{ activeDesignation.description }}
      </p>
    </header>

    <nav class="tab-nav">
      <button
        v-for="tab in SUITE8_TABS"
        :key="tab.value"
        :class="['tab-btn', { active: activeTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <main class="tab-content">
      <section v-if="activeTab === 'info'" class="info-tab">
        <h2>Info Sheet</h2>
        <p class="tab-description">
          File-system read of the Suite 8 directory (Instance.md + Skill.md + auxiliary files).
          Rendered as a single info-sheet via marked.
        </p>
        <div v-if="renderedFileSystemSheet" class="markdown-pane" v-html="renderedFileSystemSheet" />
        <p v-else class="placeholder">
          (info-sheet not loaded — register sample designations from Suite8Landing for visual preview)
        </p>
      </section>

      <section v-else-if="activeTab === 'doviewer'" class="doviewer-tab">
        <h2>D-O Viewer</h2>
        <p class="tab-description">
          Diamond + Onyx markdown side-by-side. Rendered via marked library (Pewter Tessera D6
          Typography Stack territory).
        </p>
        <div class="doviewer-grid">
          <div class="doviewer-pane">
            <h3>Diamond (Ego)</h3>
            <div v-if="renderedDiamond" class="markdown-pane" v-html="renderedDiamond" />
            <p v-else class="placeholder">
              (Diamond not loaded — register sample designations from Suite8Landing)
            </p>
          </div>
          <div class="doviewer-pane">
            <h3>Onyx (Lambda)</h3>
            <div v-if="renderedOnyx" class="markdown-pane" v-html="renderedOnyx" />
            <p v-else class="placeholder">
              (Onyx not loaded — register sample designations from Suite8Landing)
            </p>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'settings'" class="settings-tab">
        <h2>Settings</h2>
        <p class="tab-description">
          Per-muxification-location configuration. Default sub-page when this Suite 8 Page is
          muxified into a consumer concept (e.g., Cadmium Researcher in A2). Schema-driven settings
          panel arrives with the first muxification consumer.
        </p>
        <div class="settings-section">
          <h3>BoundCascade.json</h3>
          <p class="setting-description">
            Per-designation Cascade.json content for this Suite 8.
          </p>
          <pre v-if="boundCascadeJson" class="content-pre">{{ boundCascadeJson }}</pre>
          <p v-else class="placeholder">(BoundCascade not loaded — load quality arrives in D4)</p>
        </div>
        <div class="settings-section">
          <h3>Designation Paths</h3>
          <ul v-if="activeDesignation" class="path-list">
            <li>Diamond: <code>{{ activeDesignation.diamondPath }}</code></li>
            <li>Onyx: <code>{{ activeDesignation.onyxPath }}</code></li>
            <li>BoundCascade: <code>{{ activeDesignation.cascadeJsonPath }}</code></li>
            <li>Directory: <code>{{ activeDesignation.directoryPath }}</code></li>
          </ul>
          <p v-else class="placeholder">(no active designation)</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.suite8-page {
  min-height: 100vh;
  background: #0f0f1a;
  padding: 2rem;
  color: #e5e5e5;
  font-family: system-ui, -apple-system, sans-serif;
}

.page-header {
  max-width: 900px;
  margin: 0 auto 1.5rem;
}

.page-header h1 {
  color: #f3f4f6;
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}

.designation-name {
  color: #a78bfa;
}

.page-description {
  color: #9ca3af;
  font-size: 0.875rem;
}

.tab-nav {
  max-width: 900px;
  margin: 0 auto 1rem;
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #2d2d44;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #e5e5e5;
}

.tab-btn.active {
  color: #a78bfa;
  border-bottom-color: #a78bfa;
}

.tab-content {
  max-width: 900px;
  margin: 0 auto;
}

.info-tab,
.doviewer-tab,
.settings-tab {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 8px;
  padding: 1.5rem;
}

h2 {
  color: #a78bfa;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}

h3 {
  color: #e5e5e5;
  font-size: 1rem;
  margin: 1rem 0 0.5rem;
}

.tab-description,
.setting-description {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.content-pre {
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 6px;
  padding: 1rem;
  color: #e5e5e5;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}

/* Markdown rendering pane — Pewter Tessera D6 Typography integration */
.markdown-pane {
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 6px;
  padding: 1rem 1.25rem;
  color: #e5e5e5;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;
}

.markdown-pane :deep(h1) {
  color: #a78bfa;
  font-size: 1.25rem;
  margin: 0.5rem 0 0.75rem;
  border-bottom: 1px solid #2d2d44;
  padding-bottom: 0.5rem;
}

.markdown-pane :deep(h2) {
  color: #a78bfa;
  font-size: 1.05rem;
  margin: 1rem 0 0.5rem;
}

.markdown-pane :deep(h3) {
  color: #c4b5fd;
  font-size: 0.95rem;
  margin: 0.75rem 0 0.5rem;
}

.markdown-pane :deep(p) {
  margin: 0.5rem 0;
  color: #d1d5db;
}

.markdown-pane :deep(strong) {
  color: #a78bfa;
  font-weight: 600;
}

.markdown-pane :deep(code) {
  background: #1a1a2e;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  color: #c4b5fd;
}

.markdown-pane :deep(pre) {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
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
  border: 1px solid #2d2d44;
  padding: 0.375rem 0.75rem;
  text-align: left;
}

.markdown-pane :deep(th) {
  background: #1a1a2e;
  color: #a78bfa;
  font-weight: 600;
}

.markdown-pane :deep(blockquote) {
  border-left: 3px solid #a78bfa;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #9ca3af;
  font-style: italic;
}

.placeholder {
  color: #6b7280;
  font-style: italic;
  font-size: 0.875rem;
}

.doviewer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.doviewer-pane {
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 6px;
  padding: 1rem;
}

.settings-section {
  margin-top: 1.5rem;
}

.settings-section:first-of-type {
  margin-top: 0;
}

.path-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.path-list li {
  font-size: 0.875rem;
  margin: 0.25rem 0;
  color: #9ca3af;
}

.path-list code {
  background: #0f0f1a;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  color: #a78bfa;
  font-size: 0.8125rem;
}

@media (max-width: 700px) {
  .doviewer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
