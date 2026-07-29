<script setup lang="ts">
/**
 * ScsBridgeSettingsSubPage.vue — SWRM D4 · Render-Mode Settings (SCP-side Vue surface)
 *
 * The control surface for the shader-wrap render mode. Two TARGETS share the one shared catalog:
 *   - Terminal — writes bridge.json.renderMode (→ the D3 watcher live-swaps the spawned terminals).
 *   - SCP-self — the SCP page's own shader (D5 · local reactive aspect · not yet rendering).
 *
 * The mode vocabulary comes ENTIRELY from controller.bridgeJson.availableRenderModes (the shared
 * model published by the bridge · D3) — so the Terminal render and the SCPs can never offer
 * different modes. The current Terminal mode reflects bridgeJson.renderMode reactively.
 *
 * W2 (this): the panel renders, lists the catalog, the target selector, highlights the current
 * mode. W3 wires the Terminal-card click → controller.triggerSetTerminalRenderMode → bridge.json.
 *
 * Pewter (D4): root hifi-pane-base · header hifi-pane-amethyst (Suite 6 orchestration semantic) +
 * hifi-heading · ◇ Muxon hero card amber-accented; the rest tiered embossed cards.
 */
import { inject, ref, computed } from 'vue';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import type {
  ShaderRenderMode,
  RenderModeCatalogEntry,
} from '../../scsBridge.type';
// MD-9 · D-MC-6 · the template-side model catalog mirror — the FALLBACK vocabulary + default the
// Default Model section renders before the bridge relays bridgeJson.availableModels/defaultModel.
import {
  SCS_AVAILABLE_MODELS,
  SCS_DEFAULT_MODEL,
  type ScsModelCatalogEntry,
} from '../../model/scsModelCatalog.model';
import SuiteColorSelection from './SuiteColorSelection.vue';
import SuitePatternSelection from './SuitePatternSelection.vue';

const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);

// the active target — which surface the deck controls (local UI state).
const settingsTarget = ref<'terminal' | 'scp'>('terminal');

// optimistic echo of the just-clicked Terminal mode (snaps before bridgeJson.renderMode catches up).
const optimisticTerminalMode = ref<ShaderRenderMode | null>(null);

// SCP render mode — controlled through the BRIDGE (bridge.json.scpRenderMode · applies to ALL
// SCPs), mirroring the Terminal pipe. The SCP page's own CSS/JS cannot reach the offscreen GLSL
// render (it happens in Electron main), so control is Electron-side, not local. The optimistic
// echo snaps the highlight before bridgeJson.scpRenderMode catches up.
const optimisticScpMode = ref<ShaderRenderMode | null>(null);

const bridgeJson = computed(() => controller?.bridgeJson.value ?? null);

// the shared catalog · the single source of truth, published into bridge.json by the bridge (D3).
const catalog = computed<RenderModeCatalogEntry[]>(
  () => bridgeJson.value?.availableRenderModes ?? [],
);

const currentTerminalMode = computed<ShaderRenderMode>(
  () => optimisticTerminalMode.value ?? bridgeJson.value?.renderMode ?? 'muxon',
);

// the live SCP mode (bridge.json.scpRenderMode · all SCPs share it · default Muxon).
const currentScpMode = computed<ShaderRenderMode>(
  () => optimisticScpMode.value ?? bridgeJson.value?.scpRenderMode ?? 'muxon',
);

// the highlighted card for the active target — both read from bridge.json now (Terminal =
// renderMode, SCP-self = scpRenderMode).
const activeMode = computed<ShaderRenderMode | null>(() =>
  settingsTarget.value === 'terminal' ? currentTerminalMode.value : currentScpMode.value,
);

const heroCard = computed<RenderModeCatalogEntry | null>(
  () => catalog.value.find((m) => m.id === 'muxon') ?? null,
);
const restCards = computed<RenderModeCatalogEntry[]>(
  () => catalog.value.filter((m) => m.id !== 'muxon'),
);

// MD-9 · D-MC-6 · Default Model section state. The catalog comes from bridgeJson.availableModels
// (published field-agnostically by the bridge · mirrors availableRenderModes), falling back to the
// template catalog mirror when the bridge hasn't relayed yet. The live default comes from
// bridgeJson.defaultModel, falling back to the mirror's default. optimisticDefaultModel snaps the
// highlight before bridgeJson.defaultModel catches up (mirrors optimisticTerminalMode · :34/:50).
const optimisticDefaultModel = ref<string | null>(null);

const modelCatalog = computed<ScsModelCatalogEntry[]>(
  () => bridgeJson.value?.availableModels ?? SCS_AVAILABLE_MODELS,
);
const currentDefaultModel = computed<string>(
  () => optimisticDefaultModel.value ?? bridgeJson.value?.defaultModel ?? SCS_DEFAULT_MODEL,
);

function selectDefaultModel(id: string): void {
  // write the default model → bridge.json.defaultModel → the bridge's renderModeWatch applies it →
  // activeDefaultModel → every subsequent spawn/resume without a per-instance record. Optimistic echo.
  optimisticDefaultModel.value = id;
  controller?.triggerSetDefaultModel(id);
}

// C919 · THE FRAME GOVERNOR slider — bridge.json.shaderFps (8-60 · default 24 = Like
// Animation, the animation-film cadence). @input tracks the drag locally (live readout);
// @change dispatches ONE write through the sendBridgeMessage Diameter → the huirth RMW →
// the bridge's watcher re-gates every presenter live.
const SHADER_FPS_MIN = 8;
const SHADER_FPS_MAX = 60;
const SHADER_FPS_DEFAULT = 24;
const draggingFps = ref<number | null>(null);
const currentShaderFps = computed<number>(
  () => draggingFps.value ?? bridgeJson.value?.shaderFps ?? SHADER_FPS_DEFAULT,
);

function onFpsInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) draggingFps.value = value;
}

function onFpsChange(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  draggingFps.value = value; // optimistic — bridgeJson.shaderFps catches up via the relay.
  controller?.triggerSetShaderFps(value);
}

function setTarget(target: 'terminal' | 'scp'): void {
  settingsTarget.value = target;
}

function selectMode(mode: ShaderRenderMode): void {
  if (settingsTarget.value === 'terminal') {
    // write the Terminal mode → bridge.json.renderMode → the watcher live-swaps the running
    // terminals. The optimistic echo snaps the highlight before bridgeJson catches up.
    optimisticTerminalMode.value = mode;
    controller?.triggerSetTerminalRenderMode(mode);
  } else {
    // SCP-self · write bridge.json.scpRenderMode → the bridge's watcher swaps EVERY SCP presenter
    // (the Electron offscreen pipe · the Terminal pattern fanned to all SCPs · no local skin).
    optimisticScpMode.value = mode;
    controller?.triggerSetScpRenderMode(mode);
  }
}
</script>

<template>
  <div class="settings-view-root hifi-pane-base">
    <!-- HEADER — amethyst: Suite 6 orchestration semantic -->
    <header class="settings-header hifi-pane-amethyst">
      <h1 class="hifi-heading settings-title">Render Settings</h1>
      <p class="settings-subtitle">
        Shader-wrap render mode — one shared catalog across the Terminal render and this SCP.
      </p>
    </header>

    <!-- TARGET SELECTOR -->
    <div class="settings-target-row">
      <button
        type="button"
        class="settings-target-btn"
        :class="{ 'target-active': settingsTarget === 'terminal' }"
        @click="setTarget('terminal')"
      >Terminal</button>
      <button
        type="button"
        class="settings-target-btn"
        :class="{ 'target-active': settingsTarget === 'scp' }"
        @click="setTarget('scp')"
      >SCP-self</button>
      <span class="settings-target-hint">
        <template v-if="settingsTarget === 'terminal'">
          Live mode: <strong>{{ currentTerminalMode }}</strong> · writes to the spawned terminals.
        </template>
        <template v-else>
          Live mode: <strong>{{ currentScpMode }}</strong> · applies to all SCPs via the bridge.
        </template>
      </span>
    </div>

    <!-- EMPTY (no catalog yet — bridge not running / pre-first-relay) -->
    <div v-if="!catalog.length" class="settings-empty">
      Waiting for the bridge — the render-mode catalog publishes via bridge.json.
    </div>

    <!-- THE DECK -->
    <div v-else class="settings-deck">
      <!-- ◇ MUXON HERO -->
      <button
        v-if="heroCard"
        type="button"
        class="render-card render-card-hero"
        :class="{ 'card-selected': activeMode === heroCard.id }"
        @click="selectMode(heroCard.id)"
      >
        <span class="card-diamond">◇</span>
        <span class="card-label">{{ heroCard.label }}</span>
        <span class="card-blurb">{{ heroCard.blurb }}</span>
        <span class="card-tier">{{ heroCard.tier }}</span>
      </button>

      <!-- THE REST -->
      <div class="render-grid">
        <button
          v-for="mode in restCards"
          :key="mode.id"
          type="button"
          class="render-card"
          :class="[`render-tier-${mode.tier}`, { 'card-selected': activeMode === mode.id }]"
          @click="selectMode(mode.id)"
        >
          <span class="card-label">{{ mode.label }}</span>
          <span class="card-blurb">{{ mode.blurb }}</span>
          <span class="card-tier">{{ mode.tier }}</span>
        </button>
      </div>
    </div>

    <!-- FRAME RATE — C919 · the shader output governor (bridge.json.shaderFps · default 24) -->
    <section class="settings-section">
      <header class="settings-section-header hifi-pane-cobalt">
        <h2 class="hifi-heading settings-section-title">Frame Rate</h2>
        <p class="settings-section-subtitle">
          The shader's output cadence — every shaded surface (Terminal and SCP) draws at this rate.
          The default, 24, is the frame rate of animation.
        </p>
      </header>
      <div class="settings-fps-row">
        <span class="settings-fps-value">
          <strong>{{ currentShaderFps }}</strong> FPS
          <span v-if="currentShaderFps === 24" class="settings-fps-tag">LIKE ANIMATION</span>
        </span>
        <input
          type="range"
          class="settings-fps-slider"
          :min="SHADER_FPS_MIN"
          :max="SHADER_FPS_MAX"
          step="1"
          :value="currentShaderFps"
          @input="onFpsInput"
          @change="onFpsChange"
        />
        <span class="settings-fps-bound">{{ SHADER_FPS_MIN }}</span>
        <span class="settings-fps-bound settings-fps-bound-max">{{ SHADER_FPS_MAX }}</span>
      </div>
    </section>

    <!-- DEFAULT MODEL — MD-9 · D-MC-6 · the model every new instance uses (bridge.json.defaultModel) -->
    <section class="settings-section">
      <header class="settings-section-header hifi-pane-cobalt">
        <h2 class="hifi-heading settings-section-title">Default Model</h2>
        <p class="settings-section-subtitle">
          The model every new instance uses unless a spawn chooses its own. Applies at the next spawn —
          running sessions are not swapped.
        </p>
      </header>
      <div class="settings-target-row">
        <span class="settings-target-hint settings-model-live">
          Live default: <strong>{{ currentDefaultModel }}</strong>
        </span>
      </div>
      <div class="settings-deck">
        <div class="render-grid">
          <button
            v-for="model in modelCatalog"
            :key="model.id"
            type="button"
            class="render-card"
            :class="{ 'card-selected': currentDefaultModel === model.id }"
            @click="selectDefaultModel(model.id)"
          >
            <span class="card-label">{{ model.label }}</span>
            <span class="card-blurb">{{ model.blurb }}</span>
            <span class="card-tier">{{ model.tier }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- SUITE COLOR SELECTION — HIFI.2 · re-tints the app live via the HIFI.1 override mechanism -->
    <SuiteColorSelection />

    <!-- SUITE PATTERN SELECTION — HIFI.3 · re-tiles the app live via the HIFI.3 override mechanism -->
    <SuitePatternSelection />
  </div>
</template>

<style scoped>
.settings-view-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 200px;
}

/* HEADER — global hifi-pane-amethyst applied; scoped provides padding only */
.settings-header {
  padding: 1rem 1.5rem 0.75rem;
}
.settings-title {
  margin: 0 0 0.25rem;
}
.settings-subtitle {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

/* TARGET SELECTOR */
.settings-target-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  flex-wrap: wrap;
}
.settings-target-btn {
  font-size: 0.78rem;
  font-family: var(--font-heading);
  padding: 0.3rem 0.9rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  border-top:    1px solid rgba(255, 255, 255, 0.18);
  border-left:   1px solid rgba(255, 255, 255, 0.18);
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  border-right:  1px solid rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.settings-target-btn:hover {
  color: #fff;
}
.settings-target-btn.target-active {
  background: rgba(138, 79, 234, 0.32);
  color: #fff;
  /* pressed/active emboss inversion */
  border-top:    1px solid rgba(0, 0, 0, 0.3);
  border-left:   1px solid rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  border-right:  1px solid rgba(255, 255, 255, 0.22);
}
.settings-target-hint {
  font-size: 0.72rem;
  opacity: 0.6;
  margin-left: auto;
}
.settings-target-hint strong {
  color: #ffb000;
  opacity: 0.95;
}

/* EMPTY */
.settings-empty {
  padding: 1.5rem;
  font-size: 0.8rem;
  opacity: 0.6;
  font-style: italic;
}

/* DECK */
.settings-deck {
  padding: 0.5rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.render-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

/* CARD — embossed; selected inverts + accents */
.render-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-radius: 0.3rem;
  background: rgba(0, 0, 0, 0.28);
  border-top:    1px solid rgba(255, 255, 255, 0.14);
  border-left:   1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(0, 0, 0, 0.34);
  border-right:  1px solid rgba(0, 0, 0, 0.34);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}
.render-card:hover {
  background: rgba(0, 0, 0, 0.42);
}
.render-card.card-selected {
  background: rgba(255, 176, 0, 0.14);
  border-top:    1px solid rgba(0, 0, 0, 0.34);
  border-left:   1px solid rgba(0, 0, 0, 0.34);
  border-bottom: 1px solid rgba(255, 176, 0, 0.55);
  border-right:  1px solid rgba(255, 176, 0, 0.55);
}

/* ◇ MUXON HERO — wider, amber diamond */
.render-card-hero {
  background: linear-gradient(135deg, rgba(255, 176, 0, 0.1), rgba(0, 0, 0, 0.3));
}
.render-card-hero .card-label {
  font-size: 1rem;
}
.card-diamond {
  color: #ffb000;
  font-size: 1.1rem;
  line-height: 1;
}
.card-label {
  font-weight: 600;
  font-family: var(--font-heading);
  font-size: 0.85rem;
}
.card-blurb {
  font-size: 0.7rem;
  opacity: 0.6;
  line-height: 1.25;
}
.card-tier {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.4;
  font-family: var(--font-mono);
}

/* DEFAULT MODEL SECTION — MD-9 · D-MC-6 · cobalt header (Suite 5 professional semantic) */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.settings-section-header {
  padding: 0.85rem 1.5rem 0.65rem;
}
.settings-section-title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}
.settings-section-subtitle {
  margin: 0;
  font-size: 0.72rem;
  opacity: 0.65;
  line-height: 1.35;
}
.settings-model-live {
  margin-left: 0;
}
/* C919 · FRAME RATE — the governor slider (StratiPUNK yellow accent · mono readout). */
.settings-fps-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.5rem 1.1rem;
}
.settings-fps-value {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  min-width: 7.5rem;
}
.settings-fps-value strong {
  color: var(--color-yellow, #eab308);
  font-size: 1.05rem;
}
.settings-fps-tag {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.1rem 0.45rem;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  border: 1px solid var(--color-yellow, #eab308);
  border-radius: 0.2rem;
  color: var(--color-yellow, #eab308);
}
.settings-fps-slider {
  appearance: none;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.16);
  outline: none;
  cursor: pointer;
}
.settings-fps-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: var(--color-yellow, #eab308);
  border-top:    1px solid rgba(255, 255, 255, 0.35);
  border-left:   1px solid rgba(255, 255, 255, 0.35);
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  border-right:  1px solid rgba(0, 0, 0, 0.4);
}
.settings-fps-bound {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  opacity: 0.45;
}
</style>
