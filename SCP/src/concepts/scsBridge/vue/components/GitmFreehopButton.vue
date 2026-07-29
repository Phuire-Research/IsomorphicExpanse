<script setup lang="ts">
/**
 * GitmFreehopButton — GITM A↔B Refinement (#641-R) · FREEHOP (free branch selector)
 *
 * A popover of gitmJson.branches → gitm_branch_switch { name }. FREEHOP rides the EXISTING
 * gitm_branch_switch tool (no new bridge quality · the MCP handler already exists, used by
 * ScsBridgeGitmSubPage.vue). Gated on A being committed + stable: only enabled when
 * abMode === 'idle' (a free hop during a B cycle would corrupt the A↔B reserve mechanism).
 *
 * Reads state from the reactive gitm controller (NO /gitm-status poll). Dispatch via
 * getGlobalScsBridgeController().triggerGitmAction (Decision 2).
 *
 * Pewter Tessera HiFi (Pewter/cobalt neutral · a free navigation, not an A/B reserve move):
 *   D1 Color: cobalt palette inline (Output Firewall · no missing-token reliance)
 *   D5 Embossed Border + chamfered clip-path (StratiPUNK precedent)
 *
 * Citation: GitmStableAButton.vue (the panel + branch-select pattern).
 * Citation: ScsBridgeGitmSubPage.vue (gitm_branch_switch precedent).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W5-step-7 (OPTIONAL · FREEHOP).
 */
import { ref, computed, inject } from 'vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

// GITM CONFORMANCE FIX (SORD §10 · the setter GATING root) — resolve the gitm controller via inject
// with the getGlobal fallback (same proven pattern as the scsBridge controller below · already fixed
// 053). getGlobalGitmController() is null/stale in the TaskBar render context (cleared on IslandWrapper
// unmount :415); when null, abMode/branches read empty → the Freehop isEnabled gate silently
// mis-evaluates. IslandWrapper provides the GITM_CONTROLLER_KEY inject (:175). NO guard weakened.
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();

// SORD Shield/Sword FIX (053 diagnosis · swept from c823c40) — resolve the controller via inject
// (the proven send_message accessor · Vue runtime-singleton) with the getGlobal fallback.
// getGlobalScsBridgeController() is null/stale in the TaskBar render context (cached at setup ·
// cleared on IslandWrapper unmount), so handleHop returned at `if (!sbController) return` BEFORE
// the triggerGitmAction dispatch. Every WORKING feature uses inject; the GitM setters used
// getGlobal. Used by handleHop below.
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

const open = ref<boolean>(false);
const selectedBranch = ref<string>('');

const abMode = computed<string>(() => gitmController?.gitmJson.value?.abMode ?? 'idle');
const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');
const branches = computed<string[]>(() => gitmController?.gitmJson.value?.branches ?? []);
// SB-DS6 · branch names mapped to ScsDropdown option shape (value === label; each branch a row).
const branchOptions = computed(() => branches.value.map((b) => ({ value: b, label: b })));
// FREEHOP gate — only when the A↔B cycle is idle (A committed + stable · no B mid-flight).
const isEnabled = computed<boolean>(() => abMode.value === 'idle');

// CHANGEDIAL — the live changesPrimedOnB count (changes-between-commits). ALWAYS-ON: the
// badge renders unconditionally, defaulting to the boot count (shows 0 at a clean tree).
const changeCount = computed<number>(() => gitmController?.changesPrimedOnB.value ?? 0);

function togglePanel(): void {
  if (!isEnabled.value) return;
  open.value = !open.value;
  if (open.value && selectedBranch.value.length === 0 && currentBranch.value.length > 0) {
    selectedBranch.value = currentBranch.value;
  }
}

function handleHop(): void {
  const sbController = scsBridgeController;
  if (!sbController) return;
  const name = selectedBranch.value.trim();
  if (name.length === 0) return;
  sbController.triggerGitmAction('gitm_branch_switch', { name });
  open.value = false;
}
</script>

<template>
  <div class="freehop-wrap">
    <button
      class="freehop-btn"
      :class="{ disabled: !isEnabled }"
      aria-label="Free Branch Hop"
      :disabled="!isEnabled"
      @click="togglePanel"
    >
      <i class="fa-solid fa-shuffle" aria-hidden="true"></i>
    </button>
    <!-- CHANGEDIAL — the live changesPrimedOnB count badge · ALWAYS-ON (no v-if · default 0).
         SIBLING of the chamfered button (like .btn-tip) so the clip-path never cuts the corner. -->
    <span class="ab-count-badge">{{ changeCount }}</span>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">Branch Hop</span>
      <span class="btn-tip-body">Switches to any branch — available only when the A↔B cycle is idle (A committed + stable).</span>
    </span>

    <div v-if="open" class="freehop-panel" role="dialog" aria-label="Free Branch Hop">
      <p class="panel-title">BRANCH HOP</p>
      <label class="panel-field">
        <span class="field-label">Branch</span>
        <ScsDropdown v-model="selectedBranch" :options="branchOptions" class="field-select" />
      </label>
      <div class="panel-actions">
        <button class="panel-confirm" @click="handleHop">Hop</button>
        <button class="panel-cancel" @click="open = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.freehop-wrap {
  position: relative;
  display: inline-flex;
}

/* Dark neon-framed register: a deep near-black chamfered body whose cobalt identity reads
   through a thin glowing edge — the color informs via the glow, never a flooded fill. */
.freehop-btn {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  background:
    radial-gradient(ellipse at 38% 30%, rgba(59, 130, 246, 0.16) 0%, rgba(6, 10, 18, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(59, 130, 246, 0.09) 0%, rgba(5, 9, 16, 0) 70%),
    rgb(7, 11, 18);

  border: 1px solid rgba(59, 130, 246, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(59, 130, 246, 0.28),
    inset 0 0 10px 0 rgba(59, 130, 246, 0.10);

  color: rgb(125, 178, 255);
  text-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
}

.freehop-btn:hover:not(.disabled) {
  border-color: rgba(59, 130, 246, 0.9);
  color: rgb(170, 205, 255);
  box-shadow:
    0 0 14px 1px rgba(59, 130, 246, 0.5),
    inset 0 0 14px 0 rgba(59, 130, 246, 0.18);
}

.freehop-btn:active:not(.disabled) {
  box-shadow: inset 0 0 12px 1px rgba(59, 130, 246, 0.35);
}

/* DISABLED — dimmed, no glow (A↔B cycle active · freehop would corrupt the reserve). */
.freehop-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: none;
}

/* CHANGEDIAL badge — the live changesPrimedOnB count, ALWAYS-ON (default 0). Cloned from the
   ochre B precedent (GitmTurnOverBButton.vue), recolored to this button's own cobalt edge. */
.ab-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgb(6, 9, 18);
  color: rgb(170, 205, 255);
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(59, 130, 246, 0.7);
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

/* The Pewter HiFi hover panel — a SIBLING of the clipped body so the chamfer never cuts it. */
.btn-tip {
  position: absolute;
  bottom: calc(100% + 11px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 220px;
  padding: 8px 11px;
  white-space: normal;
  text-align: left;
  background: rgba(7, 11, 18, 0.97);
  border: 1px solid rgba(59, 130, 246, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 220;
}

.btn-tip-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgb(170, 205, 255);
  text-shadow: 0 0 6px rgba(59, 130, 246, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(222, 230, 245, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.freehop-btn:hover ~ .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.freehop-panel {
  position: absolute;
  bottom: 54px;
  right: 0;
  width: 240px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 8px;
  background: rgba(6, 11, 20, 0.97);
  border: 1px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.6), 0 0 14px rgba(59, 130, 246, 0.25);
  z-index: 200;
}

.panel-title {
  margin: 0;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  color: rgb(125, 178, 255);
}

.panel-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  color: rgba(180, 200, 235, 0.8);
}

/* SB-DS6 · ScsDropdown replaces the native branch <select>; the trigger spans the field width.
   cobalt accent for the open-state trigger border (matches the retired select's edge). */
.field-select {
  display: block;
  width: 100%;
  --dropdown-accent: rgba(59, 130, 246, 0.55);
}

.panel-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.panel-confirm,
.panel-cancel {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.panel-confirm {
  background: rgb(7, 11, 18);
  color: rgb(170, 205, 255);
  border: 1px solid rgba(59, 130, 246, 0.55);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.25);
  text-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

.panel-confirm:hover {
  border-color: rgba(59, 130, 246, 0.9);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.45);
}

.panel-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(220, 230, 245, 0.85);
}
</style>
