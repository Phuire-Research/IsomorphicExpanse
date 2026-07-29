<script setup lang="ts">
/**
 * GitmMergeBAButton — GITM A↔B Refinement · Merge B→A (the fifth dock component)
 *
 * Cycle 278 (user 076 observation): the Merge was the ONLY generic button in the A/B dock —
 * DOM-enabled read visually DEAD (no glow, no color, no pop) beside four custom-styled
 * siblings. This component gives the MERGEGATE a HiFi Purple presence: when the gate passes,
 * the button POPS with an always-on breathing purple neon (the same enabled-on-B presence the
 * Turn-Over B carries in amber), so the user SEES the merge unlock.
 *
 * MERGEGATE (LOCKED Q3 · read from the reactive gitm controller — ONE gate definition):
 *   mergeEnabled = bMergeable && changesPrimedOnB === 0 && lastTurnOverResult === 'success'
 *
 * CGDA 2-click (ARMED → FIRE · destructive-adjacent git op) → triggerGitmMean
 * ('gitm_merge_working') — awaitable ACK, NO standby overlay (a merge is a pure git op;
 * the SCP does not restart).
 *
 * The ?-badge (EXPLAINER FORWARD CONTRACT): a small question-mark badge opens the Bridge
 * Turn-Over explainer under SCS-Bridge Documentation. Until that sub-page lands, the badge
 * writes the doc-target to localStorage (SCS_DOC_TARGET_KEY) and navigates to /scs-bridge —
 * the Explainer Diamond reads the key at landing mount and opens the topic.
 *
 * Pewter Tessera HiFi (StratiPUNK · D1 Color: HiFi Purple/Amethyst inline — Output Firewall ·
 * D5 Embossed neon frame + breathing pop · the dock chamfer family).
 *
 * Citation: GitmTurnOverBButton.vue (the dock donor · CGDA + inject conformance + btn-tip).
 * Citation: gitmController.ts mergeEnabled (the LOCKED Q3 gate · single source).
 * Citation: defaultToolbarButtons.model.ts TOOLBAR_BUTTON_MERGE_B_A (the registration).
 */
import { ref, computed, onUnmounted, inject } from 'vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';

// GITM CONFORMANCE (SORD §10 · the 053 class) — inject-first with the getGlobal fallback.
// getGlobal is null/stale in the TaskBar render context; every gating computed below must
// read the live relayed gitm.json. NO guard weakened.
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

const state = ref<'idle' | 'armed'>('idle');
const ARMED_TIMEOUT_MS = 4000;
let armedTimer: ReturnType<typeof setTimeout> | null = null;
const isMerging = ref<boolean>(false);

// The MERGEGATE — centralized on the controller (LOCKED Q3 · one definition).
const mergeEnabled = computed<boolean>(() => gitmController?.mergeEnabled.value ?? false);

// Reason reads — which conjunct gates the merge (the reason-tip surfaces the next step).
const workingBranch = computed<string>(() => gitmController?.gitmJson.value?.workingBranch ?? '');
const isUninducted = computed<boolean>(() => workingBranch.value.length === 0);
const changesPrimedOnB = computed<number>(() => gitmController?.changesPrimedOnB.value ?? 0);

const buttonLabel = computed<string>(() =>
  state.value === 'armed' ? 'Confirm Merge B→A' : 'Merge B→A',
);

function handleClick(): void {
  if (!mergeEnabled.value || isMerging.value) return;
  const sbController = scsBridgeController;
  if (!sbController) return;

  // ARMED → FIRE 2-click confirmation (CGDA — the merge lands B onto the guarded A).
  if (state.value === 'idle') {
    state.value = 'armed';
    armedTimer = setTimeout(() => {
      state.value = 'idle';
      armedTimer = null;
    }, ARMED_TIMEOUT_MS);
    return;
  }

  if (state.value === 'armed') {
    if (armedTimer) {
      clearTimeout(armedTimer);
      armedTimer = null;
    }
    state.value = 'idle';
    void fireMerge();
  }
}

async function fireMerge(): Promise<void> {
  const sbController = scsBridgeController;
  if (!sbController) return;
  isMerging.value = true;
  const ack = await sbController.triggerGitmMean('gitm_merge_working', {});
  isMerging.value = false;
  if (!ack.ok) {
    console.error('[GitmMergeBA] merge ACK failed:', ack.error);
  }
}

// EXPLAINER FORWARD CONTRACT — the ?-badge opens the Bridge Turn-Over explainer under
// SCS-Bridge Documentation. The Explainer Diamond reads SCS_DOC_TARGET_KEY at landing mount.
const SCS_DOC_TARGET_KEY = 'scs:doc-target';
const MERGE_EXPLAINER_TOPIC = 'bridge-turn-over';
function openExplainer(event: MouseEvent): void {
  event.stopPropagation();
  try {
    localStorage.setItem(SCS_DOC_TARGET_KEY, MERGE_EXPLAINER_TOPIC);
  } catch {
    /* storage unavailable → plain navigation still lands on the SCS-Bridge page */
  }
  window.location.assign('/scs-bridge');
}

onUnmounted(() => {
  if (armedTimer) clearTimeout(armedTimer);
});
</script>

<template>
  <div class="merge-ba-wrap" data-readout="MERGE B → A">
    <button
      class="merge-ba-btn"
      :class="{ pop: mergeEnabled && state === 'idle', armed: state === 'armed', disabled: !mergeEnabled }"
      :aria-label="buttonLabel"
      :disabled="!mergeEnabled"
      @click="handleClick"
    >
      <i
        :class="['fa-solid', 'fa-code-merge', { 'spin-icon': isMerging }]"
        aria-hidden="true"
      ></i>
    
    </button>
    <!-- The ?-badge — the explainer link (always visible · the doc opens under SCS-Bridge Documentation). -->
    <span
      class="merge-help-badge"
      role="button"
      tabindex="0"
      aria-label="Open the Bridge Turn Over explainer"
      @click="openExplainer"
      @keydown.enter="openExplainer"
    >?</span>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">Merge B → A · Land the Proven Work</span>
      <span class="btn-tip-body" v-if="isUninducted">No working B yet — your changes move into a B through Turn Over A. The merge lands a PROVEN B back onto the guarded stable A.</span>
      <span class="btn-tip-body" v-else-if="!mergeEnabled && changesPrimedOnB > 0">Changes are still primed on B — Turn Over B to test them. A B that boots is proven automatically, unlocking this merge.</span>
      <span class="btn-tip-body" v-else-if="!mergeEnabled">Waiting on B proof — Turn Over B; a B that boots auto-confirms and this merge lights up.</span>
      <span class="btn-tip-body" v-else>Merges the proven working Branch B into the guarded stable A. A stays your ground; a fresh B is forked on the next move — you keep working ahead of stable.</span>
    </span>
  </div>
</template>

<style scoped>
.merge-ba-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* The dock family chamfer — a deep near-black body; the HiFi Purple identity reads through
   the thin neon edge, never a flooded fill (StratiPUNK). */
.merge-ba-btn {
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
    radial-gradient(ellipse at 38% 30%, rgba(168, 85, 247, 0.16) 0%, rgba(13, 9, 18, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(168, 85, 247, 0.09) 0%, rgba(12, 8, 16, 0) 70%),
    rgb(13, 9, 18);

  border: 1px solid rgba(168, 85, 247, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(168, 85, 247, 0.28),
    inset 0 0 10px 0 rgba(168, 85, 247, 0.10);

  color: rgb(193, 98, 255);
  text-shadow: 0 0 6px rgba(168, 85, 247, 0.6);
}

.merge-ba-btn:hover:not(.disabled) {
  border-color: rgba(193, 98, 255, 0.95);
  color: rgb(216, 160, 255);
  box-shadow:
    0 0 16px 2px rgba(168, 85, 247, 0.6),
    inset 0 0 14px 0 rgba(168, 85, 247, 0.2);
}

.merge-ba-btn:active:not(.disabled) {
  box-shadow: inset 0 0 12px 1px rgba(168, 85, 247, 0.35);
}

/* DISABLED — dimmed, no glow (the MERGEGATE holds: no proven B to land). */
.merge-ba-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(168, 85, 247, 0.25);
  box-shadow: none;
}

/* THE POP (user 076 design) — the MERGEGATE passed: the always-on breathing HiFi Purple neon.
   The same enabled presence the Turn-Over B carries on B, in the purple means — the user SEES
   the merge unlock without hunting for it. */
.merge-ba-btn.pop {
  border-color: rgba(193, 98, 255, 0.9);
  color: rgb(216, 160, 255);
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.8);
  animation: merge-pop-pulse 1.8s ease-in-out infinite;
}

@keyframes merge-pop-pulse {
  0%, 100% {
    box-shadow:
      0 0 12px 1px rgba(168, 85, 247, 0.5),
      inset 0 0 12px 0 rgba(168, 85, 247, 0.16);
  }
  50% {
    box-shadow:
      0 0 24px 3px rgba(168, 85, 247, 0.85),
      0 0 34px 6px rgba(143, 72, 210, 0.35),
      inset 0 0 18px 1px rgba(168, 85, 247, 0.3);
  }
}

/* ARMED — the brighter, faster confirmation pulse (CGDA second click lands the merge). */
.merge-ba-btn.armed {
  background:
    radial-gradient(ellipse at 38% 30%, rgba(193, 98, 255, 0.22) 0%, rgba(13, 9, 18, 0) 62%),
    rgb(15, 10, 20);
  border-color: rgba(216, 160, 255, 0.95);
  color: rgb(230, 190, 255);
  text-shadow: 0 0 10px rgba(193, 98, 255, 0.9);
  animation: merge-armed-pulse 0.9s ease-in-out infinite;
}

@keyframes merge-armed-pulse {
  0%, 100% {
    box-shadow:
      0 0 14px 1px rgba(193, 98, 255, 0.55),
      inset 0 0 14px 0 rgba(193, 98, 255, 0.2);
  }
  50% {
    box-shadow:
      0 0 28px 4px rgba(193, 98, 255, 0.95),
      inset 0 0 22px 2px rgba(193, 98, 255, 0.38);
  }
}

.spin-icon {
  animation: merge-spin 1s linear infinite;
}

@keyframes merge-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* The ?-badge — the dock count-badge position, HiFi Purple, always visible. A SIBLING of the
   clipped body (the chamfer never cuts it). Opens the Bridge Turn-Over explainer. */
.merge-help-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1;
  color: rgb(216, 160, 255);
  background: rgb(13, 9, 18);
  border: 1px solid rgba(168, 85, 247, 0.7);
  border-radius: 50%;
  cursor: pointer;
  text-shadow: 0 0 4px rgba(168, 85, 247, 0.7);
  box-shadow: 0 0 6px 0 rgba(168, 85, 247, 0.35);
  transition: box-shadow 0.16s ease, color 0.16s ease;
  z-index: 2;
}

.merge-help-badge:hover {
  color: rgb(230, 190, 255);
  box-shadow: 0 0 10px 1px rgba(168, 85, 247, 0.7);
}

/* The Pewter HiFi hover panel — the dock micro-pane, purple-tinted. */
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
  background: rgba(13, 9, 18, 0.97);
  border: 1px solid rgba(168, 85, 247, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
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
  color: rgb(216, 160, 255);
  text-shadow: 0 0 6px rgba(168, 85, 247, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(236, 230, 218, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.merge-ba-btn:hover ~ .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* C878 · THE DOCK DESIGN LANGUAGE (Pewter · HiFi StratiPUNK): selectors ROUND · turn-overs SQUARED. */
.merge-ba-btn {  }
.merge-ba-wrap { position: relative; }
</style>
