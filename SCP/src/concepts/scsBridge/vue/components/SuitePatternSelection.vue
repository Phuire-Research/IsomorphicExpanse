<script setup lang="ts">
/**
 * SuitePatternSelection.vue — HIFI.3 · the Suite Pattern Selection control (functional · in Settings)
 *
 * The Diameter twin of SuiteColorSelection.vue: 8 per-spectrum texture controls that re-tile the whole
 * app live via the HIFI.3 runtime override mechanism (`suitePatternOverride.model`) and persist across
 * restart through localStorage. Independent of the color axis — separate model, separate localStorage
 * key, separate documentElement properties (`--pattern-*` vs `--color-*`). They compose on the shared
 * documentElement plane; neither owns the other.
 *
 * Each row is a motif-preview button + a spectrum label + a functional designation; clicking the
 * preview opens the in-flow thumbnail picker (SuitePatternPickerPanel). On change → save the full
 * selection + apply (re-tiles `--pattern-{spectrum}` on documentElement → every `.hifi-pane-*` /
 * `.hifi-btn-*` surface of that spectrum re-tiles, no component re-render). Reset → clear the
 * persisted map and restore the `:root` defaults via removeProperty.
 *
 * Output Firewall: SPECTRUM names + FUNCTIONAL designations + MOTIF labels ONLY — no profession/
 * cascade names, no scare-quotes.
 */
import { reactive, ref } from 'vue';
import {
  type SpectrumName,
  type PatternId,
  SPECTRUM_NAMES,
  PATTERN_LIBRARY,
  DEFAULT_PATTERN,
  loadSuitePatternOverrides,
  saveSuitePatternOverrides,
  applySuitePatternOverrides,
  clearSuitePatternOverrides,
} from '../../../../model/suitePatternOverride.model';
import SuitePatternPickerPanel from './SuitePatternPickerPanel.vue';

// The spectrum label + functional designation per row (Output Firewall — no profession names).
// Mirrors SuiteColorSelection's FUNCTIONAL_LABEL.
const FUNCTIONAL_LABEL: Record<SpectrumName, { name: string; designation: string }> = {
  base: { name: 'Base', designation: 'Ground chrome' },
  red: { name: 'Red', designation: 'Primary actions' },
  orange: { name: 'Orange', designation: 'Discovery accents' },
  yellow: { name: 'Yellow', designation: 'Planning surfaces' },
  green: { name: 'Green', designation: 'Go / advance' },
  blue: { name: 'Blue', designation: 'Working-system panes' },
  purple: { name: 'Purple', designation: 'Secondary actions' },
  fuchsia: { name: 'Fuchsia', designation: 'Closing accents' },
};

// Resolve a PatternId to its motif label (for the row's current-selection caption).
function patternLabel(id: PatternId): string {
  return PATTERN_LIBRARY.find((entry) => entry.id === id)?.label ?? id;
}

// The live selection — saved overrides win over the defaults on setup.
const selection = reactive<Record<SpectrumName, PatternId>>({
  ...DEFAULT_PATTERN,
  ...loadSuitePatternOverrides(),
});

function onPatternChange(n: SpectrumName, id: PatternId): void {
  selection[n] = id;
  // Persist the full selection (defaults + overrides), then re-tile the app live (HIFI.3).
  const full: Record<SpectrumName, PatternId> = { ...selection };
  saveSuitePatternOverrides(full);
  applySuitePatternOverrides(full);
}

function onReset(): void {
  clearSuitePatternOverrides();
  SPECTRUM_NAMES.forEach((n) => {
    selection[n] = DEFAULT_PATTERN[n];
  });
  activePicker.value = null;
}

// Which spectrum's thumbnail picker is open (single-panel toggle).
const activePicker = ref<SpectrumName | null>(null);
function togglePicker(n: SpectrumName): void {
  activePicker.value = activePicker.value === n ? null : n;
}
function onResetOne(n: SpectrumName): void {
  selection[n] = DEFAULT_PATTERN[n];
  const full: Record<SpectrumName, PatternId> = { ...selection };
  saveSuitePatternOverrides(full);
  applySuitePatternOverrides(full);
}
</script>

<template>
  <section class="suite-patterns-root hifi-pane-base">
    <header class="suite-patterns-header">
      <h2 class="hifi-heading suite-patterns-title">Suite Patterns</h2>
      <p class="suite-patterns-subtitle">
        Pick a texture for each Suite — the whole app re-tiles live and remembers across restart.
      </p>
    </header>

    <div class="suite-patterns-grid">
      <!-- C881 · WHOLE-CARD SELECT — the entire row is the control (not just the swatch tile). -->
      <button
        v-for="n in SPECTRUM_NAMES"
        :key="n"
        type="button"
        class="suite-pattern-row"
        :class="{ 'is-active': activePicker === n }"
        :aria-label="`Edit ${FUNCTIONAL_LABEL[n].name}`"
        @click="togglePicker(n)"
      >
        <span
          class="suite-pattern-swatch-btn"
          :style="{
            backgroundColor: `var(--color-${n})`,
            backgroundImage: `var(--pattern-${n})`,
          }"
        ></span>
        <span class="suite-pattern-label">
          <strong class="suite-pattern-name">{{ FUNCTIONAL_LABEL[n].name }}</strong>
          <span class="suite-pattern-designation">— {{ FUNCTIONAL_LABEL[n].designation }}</span>
          <span class="suite-pattern-current">{{ patternLabel(selection[n]) }}</span>
        </span>
      </button>
    </div>

    <SuitePatternPickerPanel
      v-if="activePicker"
      :suite="activePicker!"
      :model-value="selection[activePicker!]"
      :default-pattern="DEFAULT_PATTERN[activePicker!]"
      :has-custom-pattern="selection[activePicker!] !== DEFAULT_PATTERN[activePicker!]"
      @update:model-value="(id: PatternId) => onPatternChange(activePicker!, id)"
      @reset="onResetOne(activePicker!)"
      @close="activePicker = null"
    />

    <div class="suite-patterns-actions">
      <button type="button" class="hifi-btn hifi-btn-red suite-patterns-reset" @click="onReset()">
        Reset
      </button>
    </div>
  </section>
</template>

<style scoped>
.suite-patterns-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.25rem;
}

.suite-patterns-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.suite-patterns-title {
  margin: 0;
}
.suite-patterns-subtitle {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

.suite-patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.suite-pattern-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.3rem;
  background: rgba(0, 0, 0, 0.28);
  border-top:    1px solid rgba(255, 255, 255, 0.14);
  border-left:   1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(0, 0, 0, 0.34);
  border-right:  1px solid rgba(0, 0, 0, 0.34);
}

.suite-pattern-swatch-btn {
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  background-repeat: repeat;
  background-size: 30px 30px;
  transition: box-shadow 0.12s;
}
.suite-pattern-swatch-btn:hover {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
}
.suite-pattern-row.is-active .suite-pattern-swatch-btn {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
}

.suite-pattern-label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.suite-pattern-name {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.92);
}
.suite-pattern-designation {
  font-size: 0.68rem;
  opacity: 0.6;
}
.suite-pattern-current {
  font-size: 0.64rem;
  opacity: 0.45;
}

.suite-patterns-actions {
  display: flex;
  justify-content: flex-start;
}
.suite-patterns-reset {
  font-size: 0.78rem;
  padding: 0.45rem 1.1rem;
}

/* C881 · whole-card select — the row IS the button: reset chrome + point + hover lift. */
.suite-pattern-row {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;
  cursor: pointer;
}
.suite-pattern-row:hover {
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(255, 255, 255, 0.03);
}
.suite-pattern-swatch-btn {
  pointer-events: none;
  display: inline-block;
}
</style>
