<script setup lang="ts">
/**
 * SuitePatternPickerPanel.vue — HIFI.3 · the in-DOM suite-pattern picker (thumbnail gallery).
 *
 * The Diameter twin of SuiteColorPickerPanel.vue: same in-flow, single-panel, plain-CSS Pewter
 * design language; same decoupled contract (modelValue in / update:modelValue out → drops into the
 * SuitePatternSelection onPatternChange → applySuitePatternOverrides flow). But the body is a GRID
 * of selectable SVG-tile thumbnails, not a hue/SL canvas — the pattern choice is discrete, so no
 * canvas, no getComputedStyle, no drag handlers.
 *
 * Each thumbnail renders the motif via `background-image: <css>` over a spectrum-tinted base
 * (`var(--color-{suite})`), so the preview reads in context — a dot-field on the Blue suite previews
 * blue-on-blue, exactly as it will tile live once chosen.
 *
 * Output Firewall: motif labels only — no profession/cascade names, no scare-quotes.
 */
import { ref, onMounted, onUnmounted } from 'vue';
import {
  type SpectrumName,
  type PatternId,
  PATTERN_LIBRARY,
} from '../../../../model/suitePatternOverride.model';

const props = defineProps<{
  suite: SpectrumName;
  modelValue: PatternId;
  defaultPattern: PatternId;
  hasCustomPattern: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [id: PatternId];
  reset: [];
  close: [];
}>();

const panelRef = ref<HTMLDivElement | null>(null);

function selectPattern(id: PatternId): void {
  emit('update:modelValue', id);
}

function handleClickOutside(e: MouseEvent): void {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<template>
  <div ref="panelRef" class="scp-picker-panel" @mousedown.stop>
    <div class="scp-picker-head">
      <span
        class="scp-picker-swatch"
        :style="{ backgroundColor: `var(--color-${suite})` }"
        aria-hidden="true"
      ></span>
      <span class="scp-picker-name">Texture</span>
      <button v-if="hasCustomPattern" type="button" class="scp-picker-reset" @click="$emit('reset')">
        Reset
      </button>
      <button type="button" class="scp-picker-close" aria-label="Close" @click="$emit('close')">×</button>
    </div>

    <div class="scp-pattern-grid">
      <button
        v-for="entry in PATTERN_LIBRARY"
        :key="entry.id"
        type="button"
        class="scp-pattern-tile"
        :class="{ 'is-selected': entry.id === modelValue }"
        :style="{ backgroundColor: `var(--color-${suite})` }"
        :aria-label="entry.label"
        :title="entry.label"
        @click="selectPattern(entry.id)"
      >
        <span
          class="scp-pattern-tile-motif"
          :style="{ backgroundImage: entry.css }"
        ></span>
        <span class="scp-pattern-tile-label">{{ entry.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scp-picker-panel {
  margin-top: 0.5rem;
  padding: 0.6rem;
  border-radius: 0.4rem;
  background: var(--color-board-elevated, #222228);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  border-left: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(0, 0, 0, 0.4);
  position: relative;
}
.scp-picker-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.scp-picker-swatch {
  flex: 0 0 auto;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.scp-picker-name {
  flex: 1;
  font-family: var(--font-heading);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.6;
}
.scp-picker-reset,
.scp-picker-close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.2rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
}
.scp-picker-reset:hover,
.scp-picker-close:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.3);
}
.scp-picker-close {
  font-size: 0.95rem;
  line-height: 1;
  padding: 0.05rem 0.4rem;
}

.scp-pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 0.4rem;
}

.scp-pattern-tile {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0.3rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: box-shadow 0.12s, border-color 0.12s;
}
.scp-pattern-tile:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}
.scp-pattern-tile.is-selected {
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.scp-pattern-tile-motif {
  display: block;
  height: 44px;
  border-radius: 0.2rem;
  background-color: rgba(0, 0, 0, 0.28);
  background-repeat: repeat;
  background-size: 100px 100px; /* preview motif at ~3.3x the live 30px surface tile (60px + 2/3) — one full viewBox tile per cell */
  border: 1px solid rgba(0, 0, 0, 0.34);
}

.scp-pattern-tile-label {
  font-size: 0.58rem;
  line-height: 1.15;
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
