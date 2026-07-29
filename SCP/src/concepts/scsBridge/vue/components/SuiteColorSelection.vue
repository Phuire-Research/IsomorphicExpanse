<script setup lang="ts">
/**
 * SuiteColorSelection.vue — HIFI.2 · the Suite Color Selection control (functional · in Settings)
 *
 * 8 per-spectrum color controls that re-tint the whole app live via the HIFI.1 runtime override
 * mechanism (`suiteColorOverride.model`) and persist across restart through localStorage.
 *
 * Each row is a swatch button + a spectrum label + a functional designation; clicking the swatch
 * opens the constrained in-DOM canvas picker (WIRE.2 · SuiteColorPickerPanel · hue band-clamped,
 * no native dialog). On change → save the full selection + apply (re-tints :root on documentElement).
 * Reset → clear the persisted map and restore the `:root` defaults.
 *
 * Output Firewall: SPECTRUM names + FUNCTIONAL designations ONLY — no profession/cascade names,
 * no scare-quotes. The user picks colors; the cascade/profession semantics stay internal.
 */
import { reactive, ref } from 'vue';
import {
  type SpectrumName,
  SPECTRUM_NAMES,
  loadSuiteColorOverrides,
  saveSuiteColorOverrides,
  applySuiteColorOverrides,
  clearSuiteColorOverrides,
} from '../../../../model/suiteColorOverride.model';
import SuiteColorPickerPanel from './SuiteColorPickerPanel.vue';

// The RD default hex per spectrum suite — the `:root` baseline a Reset restores to.
const DEFAULT_HEX: Record<SpectrumName, string> = {
  base: '#1a1a1a',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  fuchsia: '#ec4899',
};

// The spectrum label + functional designation per row (Output Firewall — no profession names).
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

// The live selection — saved overrides win over the RD defaults on setup.
const selection = reactive<Record<SpectrumName, string>>({
  ...DEFAULT_HEX,
  ...loadSuiteColorOverrides(),
});

function onColorChange(n: SpectrumName, hex: string): void {
  selection[n] = hex;
  // Persist the full selection (defaults + overrides), then re-tint the app live (HIFI.1).
  const full: Record<SpectrumName, string> = { ...selection };
  saveSuiteColorOverrides(full);
  applySuiteColorOverrides(full);
}

function onReset(): void {
  clearSuiteColorOverrides();
  SPECTRUM_NAMES.forEach((n) => {
    selection[n] = DEFAULT_HEX[n];
  });
  activePicker.value = null;
}

// WIRE.2 · which spectrum's constrained canvas picker is open (single-panel toggle).
const activePicker = ref<SpectrumName | null>(null);
function togglePicker(n: SpectrumName): void {
  activePicker.value = activePicker.value === n ? null : n;
}
function onResetOne(n: SpectrumName): void {
  selection[n] = DEFAULT_HEX[n];
  const full: Record<SpectrumName, string> = { ...selection };
  saveSuiteColorOverrides(full);
  applySuiteColorOverrides(full);
}
</script>

<template>
  <section class="suite-colors-root hifi-pane-base">
    <header class="suite-colors-header">
      <h2 class="hifi-heading suite-colors-title">Suite Colors</h2>
      <p class="suite-colors-subtitle">
        Pick the spectrum colors — the whole app re-tints live and remembers across restart.
      </p>
    </header>

    <div class="suite-colors-grid">
      <!-- C881 · WHOLE-CARD SELECT — the entire row is the control (not just the swatch tile). -->
      <button
        v-for="n in SPECTRUM_NAMES"
        :key="n"
        type="button"
        class="suite-color-row"
        :class="{ 'is-active': activePicker === n }"
        :aria-label="`Edit ${FUNCTIONAL_LABEL[n].name}`"
        @click="togglePicker(n)"
      >
        <span
          class="suite-color-swatch-btn"
          :style="{ background: `var(--color-${n})` }"
        ></span>
        <span class="suite-color-label">
          <strong class="suite-color-name">{{ FUNCTIONAL_LABEL[n].name }}</strong>
          <span class="suite-color-designation">— {{ FUNCTIONAL_LABEL[n].designation }}</span>
        </span>
      </button>
    </div>

    <!-- WIRE.2 · the constrained in-DOM canvas picker for the active spectrum (in-flow · no native
         dialog · resolves the off-screen GLSL-presenter escape · hand-off Item 2+3). -->
    <SuiteColorPickerPanel
      v-if="activePicker"
      :suite="activePicker!"
      :model-value="selection[activePicker!]"
      :default-color="DEFAULT_HEX[activePicker!]"
      :has-custom-color="selection[activePicker!] !== DEFAULT_HEX[activePicker!]"
      @update:model-value="(hex: string) => onColorChange(activePicker!, hex)"
      @reset="onResetOne(activePicker!)"
      @close="activePicker = null"
    />

    <div class="suite-colors-actions">
      <button type="button" class="hifi-btn hifi-btn-red suite-colors-reset" @click="onReset()">
        Reset
      </button>
    </div>
  </section>
</template>

<style scoped>
.suite-colors-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.25rem;
}

.suite-colors-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.suite-colors-title {
  margin: 0;
}
.suite-colors-subtitle {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

.suite-colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.suite-color-row {
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

.suite-color-swatch-btn {
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: box-shadow 0.12s;
}
.suite-color-swatch-btn:hover {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
}
.suite-color-row.is-active .suite-color-swatch-btn {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
}

.suite-color-label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.suite-color-name {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.92);
}
.suite-color-designation {
  font-size: 0.68rem;
  opacity: 0.6;
}

.suite-colors-actions {
  display: flex;
  justify-content: flex-start;
}
.suite-colors-reset {
  font-size: 0.78rem;
  padding: 0.45rem 1.1rem;
}

/* C881 · whole-card select — the row IS the button: reset chrome + point + hover lift. */
.suite-color-row {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;
  cursor: pointer;
}
.suite-color-row:hover {
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(255, 255, 255, 0.03);
}
.suite-color-swatch-btn {
  pointer-events: none;
  display: inline-block;
}
</style>
