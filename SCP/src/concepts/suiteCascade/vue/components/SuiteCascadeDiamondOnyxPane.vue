<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';

const props = withDefaults(
  defineProps<{
    diamondContent: string | null;
    onyxContent: string | null;
    diamondLabel?: string;
    onyxLabel?: string;
    isLoading?: boolean;
  }>(),
  {
    diamondLabel: 'Diamond',
    onyxLabel: 'Onyx',
    isLoading: false,
  },
);

const diamondExpanded = ref(false);
const onyxExpanded = ref(false);

const renderedDiamond = computed<string>(() =>
  props.diamondContent
    ? (marked.parse(props.diamondContent, { async: false }) as string)
    : '',
);

const renderedOnyx = computed<string>(() =>
  props.onyxContent
    ? (marked.parse(props.onyxContent, { async: false }) as string)
    : '',
);

const bothNull = computed(
  () => props.diamondContent === null && props.onyxContent === null,
);

function toggleDiamond() {
  diamondExpanded.value = !diamondExpanded.value;
}

function toggleOnyx() {
  onyxExpanded.value = !onyxExpanded.value;
}
</script>

<template>
  <div
    v-if="isLoading"
    class="hifi-pane-base dopr-loading-card"
  >
    <div class="hifi-stamp dopr-loading-stamp">
      <span class="hifi-label dopr-placeholder">Loading cascade...</span>
    </div>
  </div>

  <div
    v-else-if="bothNull"
    class="hifi-pane-base dopr-empty-card"
  >
    <div class="dopr-empty-icon">&#9670;</div>
    <span class="hifi-label dopr-placeholder">No active cascade</span>
  </div>

  <div v-else class="dopr-card">
    <div class="dopr-header">
      <span class="dopr-header-icon">&#9670;</span>
      <span class="dopr-header-title">Cascade Documents</span>
    </div>

    <div class="dopr-section">
      <button class="dopr-pull-tab" @click="toggleDiamond">
        <span class="dopr-tab-chevron" :class="{ 'dopr-tab-expanded': diamondExpanded }">&#9656;</span>
        <span class="dopr-tab-label dopr-tab-label-diamond">{{ diamondLabel }}</span>
        <span class="dopr-tab-sublabel">Plan</span>
      </button>
      <Transition name="dopr-expand">
        <div v-if="diamondExpanded" class="dopr-expand-area">
          <div class="hifi-pane-diamond dopr-pane-inner">
            <div class="hifi-stamp dopr-content-stamp">
              <div
                v-if="renderedDiamond"
                class="dopr-markdown-body"
                v-html="renderedDiamond"
              />
              <span v-else class="hifi-label dopr-placeholder">(No active plan)</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div class="dopr-section">
      <button class="dopr-pull-tab" @click="toggleOnyx">
        <span class="dopr-tab-chevron" :class="{ 'dopr-tab-expanded': onyxExpanded }">&#9656;</span>
        <span class="dopr-tab-label dopr-tab-label-onyx">{{ onyxLabel }}</span>
        <span class="dopr-tab-sublabel">Trajectory</span>
      </button>
      <Transition name="dopr-expand">
        <div v-if="onyxExpanded" class="dopr-expand-area">
          <div class="hifi-pane-onyx dopr-pane-inner">
            <div class="hifi-stamp dopr-content-stamp">
              <div
                v-if="renderedOnyx"
                class="dopr-markdown-body"
                v-html="renderedOnyx"
              />
              <span v-else class="hifi-label dopr-placeholder">(No trajectory)</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.dopr-loading-card,
.dopr-empty-card {
  border-radius: 8px;
  overflow: hidden;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dopr-loading-stamp {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  width: 100%;
  text-align: center;
}

.dopr-empty-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.5) 0%,
    rgba(249, 115, 22, 0.5) 16%,
    rgba(234, 179, 8, 0.5) 33%,
    rgba(34, 197, 94, 0.5) 50%,
    rgba(59, 130, 246, 0.5) 66%,
    rgba(168, 85, 247, 0.5) 83%,
    rgba(236, 72, 153, 0.5) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dopr-placeholder {
  font-size: 0.8rem;
  color: rgba(200, 200, 200, 0.4);
  font-style: italic;
}

.dopr-card {
  background: linear-gradient(135deg, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(180, 160, 120, 0.12);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
}

.dopr-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(90deg,
    rgba(180, 160, 120, 0.04) 0%,
    rgba(120, 100, 70, 0.02) 50%,
    rgba(80, 60, 100, 0.04) 100%
  );
  border-bottom: 1px solid rgba(180, 160, 120, 0.06);
}

.dopr-header-icon {
  font-size: 0.75rem;
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.8) 0%,
    rgba(249, 115, 22, 0.8) 16%,
    rgba(234, 179, 8, 0.8) 33%,
    rgba(34, 197, 94, 0.8) 50%,
    rgba(59, 130, 246, 0.8) 66%,
    rgba(168, 85, 247, 0.8) 83%,
    rgba(236, 72, 153, 0.8) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
}

.dopr-header-title {
  font-family: 'Orbitron', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(200, 190, 170, 0.9);
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.6);
}

.dopr-section {
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.dopr-pull-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.875rem;
  background: linear-gradient(180deg, rgba(60, 60, 60, 0.06) 0%, rgba(40, 40, 40, 0.03) 100%);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.dopr-pull-tab:hover {
  background: linear-gradient(180deg, rgba(80, 80, 80, 0.1) 0%, rgba(50, 50, 50, 0.05) 100%);
}

.dopr-tab-chevron {
  font-size: 0.65rem;
  color: rgba(200, 200, 200, 0.4);
  transition: transform 0.25s ease;
  display: inline-block;
  width: 0.75rem;
  text-align: center;
}

.dopr-tab-expanded {
  transform: rotate(90deg);
}

.dopr-tab-label {
  font-family: 'Orbitron', system-ui, sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dopr-tab-label-diamond {
  background: linear-gradient(90deg, rgba(220, 180, 80, 0.9) 0%, rgba(200, 170, 100, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dopr-tab-label-onyx {
  background: linear-gradient(90deg, rgba(220, 220, 230, 0.9) 0%, rgba(160, 160, 170, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dopr-tab-sublabel {
  font-size: 0.6rem;
  color: rgba(200, 200, 200, 0.25);
  font-style: italic;
}

.dopr-expand-area {
  overflow: hidden;
}

.dopr-pane-inner {
  border-radius: 0;
}

.dopr-content-stamp {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  max-height: 60vh;
  overflow-y: auto;
}

.dopr-markdown-body {
  font-size: 0.8rem;
  line-height: 1.5;
  color: rgba(220, 220, 220, 0.85);
}

.dopr-markdown-body :deep(h1),
.dopr-markdown-body :deep(h2),
.dopr-markdown-body :deep(h3) {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0.75rem 0 0.4rem;
  color: rgba(240, 240, 240, 0.9);
}

.dopr-markdown-body :deep(h1) { font-size: 1rem; }
.dopr-markdown-body :deep(h2) { font-size: 0.9rem; }
.dopr-markdown-body :deep(h3) { font-size: 0.85rem; }

.dopr-markdown-body :deep(p) {
  margin: 0.4rem 0;
}

.dopr-markdown-body :deep(strong) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.dopr-markdown-body :deep(code) {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.dopr-markdown-body :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  margin: 0.4rem 0;
  overflow-x: auto;
}

.dopr-markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.dopr-markdown-body :deep(ul),
.dopr-markdown-body :deep(ol) {
  margin: 0.4rem 0;
  padding-left: 1.4rem;
}

.dopr-markdown-body :deep(li) {
  margin: 0.2rem 0;
}

.dopr-markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.4rem 0;
  font-size: 0.75rem;
}

.dopr-markdown-body :deep(th),
.dopr-markdown-body :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.3rem 0.6rem;
  text-align: left;
}

.dopr-markdown-body :deep(th) {
  background: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  color: rgba(240, 240, 240, 0.9);
}

.dopr-markdown-body :deep(blockquote) {
  border-left: 2px solid rgba(255, 255, 255, 0.25);
  padding-left: 0.75rem;
  margin: 0.4rem 0;
  color: rgba(200, 200, 200, 0.7);
  font-style: italic;
}

.dopr-markdown-body :deep(a) {
  color: rgba(160, 200, 255, 0.85);
  text-decoration: none;
}

.dopr-markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.dopr-expand-enter-active,
.dopr-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
}

.dopr-expand-enter-from,
.dopr-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
