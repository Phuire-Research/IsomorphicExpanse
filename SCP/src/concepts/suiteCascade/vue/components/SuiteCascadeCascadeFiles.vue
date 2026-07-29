<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import type { CascadeFileEntry } from '../../suiteCascade.type';
import { suiteFromCascadeFilePath } from '../../model/suiteCascade.suiteDerivation';

const props = withDefaults(
  defineProps<{
    cascadeFiles: CascadeFileEntry[];
    defaultSuite?: string;
  }>(),
  { defaultSuite: 'base' },
);

type FileCard = {
  filePath: string;
  suite: string;
  title: string;
  renderedMarkdown: string;
};

const fileCards = computed<FileCard[]>(() =>
  props.cascadeFiles.map((file) => {
    const suite = suiteFromCascadeFilePath(file.filePath) || props.defaultSuite;
    const rawName = file.filePath.split('/').at(-1) ?? file.filePath;
    const title = rawName.replace(/\.md$/i, '');
    const renderedMarkdown = file.markdown
      ? (marked.parse(file.markdown, { async: false }) as string)
      : '';
    return { filePath: file.filePath, suite, title, renderedMarkdown };
  }),
);
</script>

<template>
  <div class="cascade-files-stack">
    <div
      v-if="fileCards.length === 0"
      :class="['hifi-pane-base', 'cascade-file-card']"
    >
      <div class="hifi-stamp cascade-stamp">
        <span class="hifi-label cascade-empty-label">No active cascade files.</span>
      </div>
    </div>

    <div
      v-for="card in fileCards"
      :key="card.filePath"
      :class="[`hifi-pane-${card.suite}`, 'cascade-file-card']"
    >
      <div class="cascade-file-header">
        <span
          class="hifi-heading cascade-file-title"
          :style="{ color: `var(--color-${card.suite})` }"
        >{{ card.title }}</span>
        <div :class="`hifi-embossed-${card.suite}`" style="margin-top: 0.4rem;" />
      </div>

      <div class="hifi-stamp cascade-stamp">
        <div
          v-if="card.renderedMarkdown"
          class="cascade-markdown-body"
          v-html="card.renderedMarkdown"
        />
        <span v-else class="hifi-label cascade-empty-label">(no content)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cascade-files-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cascade-file-card {
  border-radius: 8px;
  overflow: hidden;
  padding: 0.75rem;
}

.cascade-file-header {
  padding: 0 0.25rem 0.5rem;
}

.cascade-file-title {
  font-size: 0.85rem;
  display: block;
}

.cascade-stamp {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  max-height: 60vh;
  overflow-y: auto;
}

.cascade-empty-label {
  font-size: 0.8rem;
  color: rgba(200, 200, 200, 0.5);
  display: block;
  text-align: center;
  padding: 1rem 0;
}

.cascade-markdown-body {
  font-size: 0.8rem;
  line-height: 1.5;
  color: rgba(220, 220, 220, 0.85);
}

.cascade-markdown-body :deep(h1),
.cascade-markdown-body :deep(h2),
.cascade-markdown-body :deep(h3) {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0.75rem 0 0.4rem;
  color: rgba(240, 240, 240, 0.9);
}

.cascade-markdown-body :deep(h1) { font-size: 1rem; }
.cascade-markdown-body :deep(h2) { font-size: 0.9rem; }
.cascade-markdown-body :deep(h3) { font-size: 0.85rem; }

.cascade-markdown-body :deep(p) {
  margin: 0.4rem 0;
}

.cascade-markdown-body :deep(strong) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.cascade-markdown-body :deep(code) {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.cascade-markdown-body :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  margin: 0.4rem 0;
  overflow-x: auto;
}

.cascade-markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.cascade-markdown-body :deep(ul),
.cascade-markdown-body :deep(ol) {
  margin: 0.4rem 0;
  padding-left: 1.4rem;
}

.cascade-markdown-body :deep(li) {
  margin: 0.2rem 0;
}

.cascade-markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.4rem 0;
  font-size: 0.75rem;
}

.cascade-markdown-body :deep(th),
.cascade-markdown-body :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.3rem 0.6rem;
  text-align: left;
}

.cascade-markdown-body :deep(th) {
  background: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  color: rgba(240, 240, 240, 0.9);
}

.cascade-markdown-body :deep(blockquote) {
  border-left: 2px solid rgba(255, 255, 255, 0.25);
  padding-left: 0.75rem;
  margin: 0.4rem 0;
  color: rgba(200, 200, 200, 0.7);
  font-style: italic;
}

.cascade-markdown-body :deep(a) {
  color: rgba(160, 200, 255, 0.85);
  text-decoration: none;
}

.cascade-markdown-body :deep(a:hover) {
  text-decoration: underline;
}
</style>
