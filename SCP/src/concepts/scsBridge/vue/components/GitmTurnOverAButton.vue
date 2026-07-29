<script setup lang="ts">
/**
 * GitmTurnOverAButton — GITM A↔B Refinement (#641-R) · Turn Over A (return to stable A)
 *
 * THE C302 CONSOLIDATION (Cycle 312 · the namespace-schism cure). This button is now a
 * PRESENTATIONAL shell — badge · tooltip · enablement · armed/highlight visuals only. The press
 * carries NO dispatch and NO panel: the native @click bubbles to the TaskBar wrapper's
 * `@click="$emit('buttonClicked', btn.id)"` (TaskBar.vue), IslandWrapper routes id 'turn-over-a',
 * and THE C302 MODAL (GitmTurnOverAConfirmModal via IslandWrapper) is the SOLE confirmation surface
 * for every A turn-over. The retired button-anchored panel minted the legacy `gitm/b-<ts>` namespace
 * (blind to isWorkingBranch → the C311 stranded-carry defect); the one canonical carry now rides the
 * BRIDGE's `git switch -c b/<stable>-<ts>` through the confirmToken handshake.
 *
 * Enablement: enabled whenever a stable A is registered (stableBranch non-empty). Reads abMode /
 * stableBranch from the reactive gitm controller (NO /gitm-status poll). When disabled the native
 * click cannot bubble — the modal never opens on an uninducted SCP.
 *
 * Pewter Tessera HiFi (Suite 4 Viridian · A is the stable green baseline):
 *   D1 Color: Viridian palette inline (Output Firewall · no missing-token reliance)
 *   D5 Embossed Border + highlight pulse (CGDA precedent from ScsBridgeTurnOverButton.vue)
 *
 * Citation: GitmTurnOverABButton.vue (the now-retired fork source · CGDA ARMED→FIRE).
 * Citation: GitmStableAButton.vue (the Viridian A palette).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W5-step-3.
 */
import { ref, computed, watch, onUnmounted, inject } from 'vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';

// GITM CONFORMANCE FIX (SORD §10 · the turn-over GATING root) — resolve the gitm controller via
// inject (the proven Vue runtime-singleton accessor) with the getGlobal fallback. getGlobalGitmController()
// is null/stale in the TaskBar render context (cached at setup · cleared on IslandWrapper unmount :415).
// When null, stableBranch === '' → isEnabled === false → the button disables (no click bubbles). This
// makes every gating computed (isEnabled · currentBranch · abMode) read live relayed gitm.json.
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
// SORD Shield/Sword FIX (053 diagnosis) — resolve the scsBridge controller via inject (the proven
// send_message accessor · Vue runtime-singleton) with the getGlobal fallback. Used only for the
// scs:highlight pulse read below (the dispatch itself lives in IslandWrapper's C302 handshake now).
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

const abMode = computed<string>(() => gitmController?.abMode.value ?? 'idle');
const stableBranch = computed<string>(() => gitmController?.gitmJson.value?.stableBranch ?? '');
// GITM color-cascade (W3 · Counter B display) — the commits-between divergence (rev-list A..B).
// This is the "total changes between the two branches" the badge surfaces on Turn-Over A (UNLIKE
// the Shield's working-TREE changesPrimedOnB). ALWAYS-ON · defaults to 0 at no-divergence.
const commitsDivergenceCount = computed<number>(() => gitmController?.commitsDivergenceCount.value ?? 0);

// SORD Shield/Sword — ALWAYS-AVAILABLE TURN-OVER A. The only hard UI block is the uninducted state
// (no stable A registered → nothing to turn over to). Otherwise ENABLED — the native click bubbles
// to the TaskBar id emit → IslandWrapper opens the C302 modal (the sole surface). The bridge-side
// guards remain the AUTHORITATIVE safety rail; this is UI enablement only.
const isEnabled = computed<boolean>(() => stableBranch.value.length > 0);

// GUARD-SURFACE (the honest-feedback net) — the bridge-side target-branch-empty GUARDSHUNT fires when
// stableBranch === '' (no A registered). Surface a brief teaching hint on the disabled button instead
// of a silent no-op. NO new state field — stableBranch is already on the propagated gitm.json.
const isUninducted = computed<boolean>(() => stableBranch.value.length === 0);

// D-β · THE BLINK BEACON (Turn Over A control) — when the bridge requests a user Turn Over A, a
// live turnOverAlert rides gitm.json (IslandWrapper C785 renders the banner). While that alert is
// LIVE and unretired, the control the alert DIRECTS to must blink a Pewter HiFi-yellow pulse ring —
// direction without teaching the UI. The alert directs to THIS Turn-Over-A control ONLY when a
// stable A is registered (NOT uninducted); when uninducted the Shield is the directed control.
// mouseenter disarms the blink for that specific alert (requestedAt-keyed); the alert's own
// self-retire (turnOver.at > turnOverAlert.requestedAt) also ends it.
const alertBlinkDisarmedAt = ref<number>(0);
const alertBlinkActive = computed<boolean>(() => {
  if (isUninducted.value) return false;
  const gj = gitmController?.gitmJson.value;
  const alert = gj?.turnOverAlert;
  if (!alert) return false;
  // C873 · SIDE-GATED: the alert carries the signaled side (source · C872 active-side
  // intelligence); THIS control blinks only for an A-side directive — the B control owns B.
  if ((alert.source ?? 'A') !== 'A') return false;
  const retired = (gj?.turnOver?.at ?? 0) > alert.requestedAt;
  if (retired) return false;
  return alertBlinkDisarmedAt.value !== alert.requestedAt;
});
function disarmAlertBlink(): void {
  const alert = gitmController?.gitmJson.value?.turnOverAlert;
  if (alert) alertBlinkDisarmedAt.value = alert.requestedAt;
}

// GITM color-cascade (W4) · Vermillion Focus+Highlight — pulse when the scs:highlight relay targets
// 'turn-over'. AUTO-RESET: a watch clears the target ~2s after it arms (so the pulse self-extinguishes
// without a manual gesture · the controller dispatch is the local clear).
const HIGHLIGHT_RESET_MS = 2000;
let highlightResetTimer: ReturnType<typeof setTimeout> | null = null;
const isHighlighted = computed<boolean>(
  () => scsBridgeController?.highlightTarget.value === 'turn-over',
);
watch(isHighlighted, (on) => {
  if (on) {
    if (highlightResetTimer) clearTimeout(highlightResetTimer);
    highlightResetTimer = setTimeout(() => {
      scsBridgeController?.triggerSetHighlightTarget(null);
      highlightResetTimer = null;
    }, HIGHLIGHT_RESET_MS);
  }
});

onUnmounted(() => {
  // GITM color-cascade (W4) — clear the highlight auto-reset timer on teardown.
  if (highlightResetTimer) clearTimeout(highlightResetTimer);
});
</script>

<template>
  <div class="turn-over-a-wrap" data-readout="BRIDGE TURN OVER A · REBUILD + SERVE A">
    <button
      class="turn-over-a-btn"
      :class="{ disabled: !isEnabled, highlighted: isHighlighted, 'toab-blink': alertBlinkActive }"
      aria-label="Turn Over A"
      :disabled="!isEnabled"
      @mouseenter="disarmAlertBlink"
    >
      <span v-if="alertBlinkActive" class="toab-ring" aria-hidden="true"></span>
      <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
    
      <span class="tob-letter" aria-hidden="true">A</span>
    </button>
    <!-- GITM color-cascade (W3) — the COMMITS-BETWEEN badge: the total commits B carries that A
         does not (rev-list A..B). ALWAYS-ON (no v-if · default 0). SIBLING of the chamfered button
         (like .btn-tip) so the clip-path never cuts the corner. -->
    <span class="ab-count-badge">{{ commitsDivergenceCount }}</span>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">Turn Over to A · Prior-Proven Stable</span>
      <span class="btn-tip-body" v-if="isUninducted">Register a stable A first — press the Shield. No guarded stable exists yet, so there is nothing to turn over to.</span>
      <span class="btn-tip-body" v-else>Returns the SCP to the guarded stable A (the prior-proven branch). If you have working changes, a confirmation asks how to carry them into B. The badge counts the commits B carries that A does not.</span>
    </span>
  </div>
</template>

<style scoped>
.turn-over-a-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Dark neon-framed register: a deep near-black chamfered body whose viridian identity reads
   through a thin glowing edge — the color informs via the glow, never a flooded fill. */
.turn-over-a-btn {
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

  /* The deep field — radial depth over near-black, not a solid fill. */
  background:
    radial-gradient(ellipse at 38% 30%, rgba(19, 213, 148, 0.15) 0%, rgba(8, 14, 12, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(19, 213, 148, 0.09) 0%, rgba(7, 12, 10, 0) 70%),
    rgb(9, 14, 12);

  /* The neon edge — a thin viridian ring carried by border + glow. */
  border: 1px solid rgba(19, 213, 148, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(19, 213, 148, 0.28),
    inset 0 0 10px 0 rgba(19, 213, 148, 0.10);

  /* The neon glyph. */
  color: rgb(19, 213, 148);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.6);
}

.turn-over-a-btn:hover:not(.disabled) {
  border-color: rgba(19, 213, 148, 0.9);
  color: rgb(110, 245, 200);
  box-shadow:
    0 0 14px 1px rgba(19, 213, 148, 0.5),
    inset 0 0 14px 0 rgba(19, 213, 148, 0.18);
}

.turn-over-a-btn:active:not(.disabled) {
  box-shadow: inset 0 0 12px 1px rgba(19, 213, 148, 0.35);
}

/* DISABLED — dimmed, no glow (no stable A registered · nothing to turn over to). */
.turn-over-a-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(19, 213, 148, 0.25);
  box-shadow: none;
}

/* GITM color-cascade (W3) — the COMMITS-BETWEEN badge, ALWAYS-ON (default 0). Cloned from the
   GitmStableAButton ab-count-badge pattern, carrying this button's own viridian edge. */
.ab-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgb(6, 14, 12);
  color: rgb(110, 245, 200);
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
  border: 1px solid rgba(19, 213, 148, 0.7);
  box-shadow: 0 0 6px rgba(19, 213, 148, 0.5);
}

/* GITM color-cascade (W4) · Vermillion Focus+Highlight — the scs:highlight pulse. Reuses the
   b-confirm-pulse keyframe pattern (viridian breathing neon) so the just-cascaded color design
   draws the eye to the Turn-Over. Self-extinguishes when the highlightTarget auto-resets (~2s). */
.turn-over-a-btn.highlighted {
  border-color: rgba(19, 213, 148, 0.95);
  color: rgb(140, 255, 215);
  text-shadow: 0 0 8px rgba(19, 213, 148, 0.7);
  animation: a-highlight-pulse 0.9s ease-in-out infinite;
}

@keyframes a-highlight-pulse {
  0%, 100% {
    box-shadow:
      0 0 12px 0 rgba(19, 213, 148, 0.5),
      inset 0 0 12px 0 rgba(19, 213, 148, 0.18);
  }
  50% {
    box-shadow:
      0 0 26px 3px rgba(19, 213, 148, 0.9),
      inset 0 0 20px 1px rgba(19, 213, 148, 0.34);
  }
}

/* D-β · THE BLINK BEACON — the live-alert Pewter HiFi-yellow pulse ring. While a turnOverAlert is
   live and this is the directed control, a yellow ring pulses to DIRECT the eye here (no UI teaching).
   Disarmed on first hover (mouseenter) or on the alert's own self-retire. HiFi yellow family
   (var(--color-yellow, #eab308) · rgba 234,179,8 — matches the ANCHORLOCK ochre-warn tone). */
.toab-ring {
  position: absolute;
  inset: -3px;
  border: 2px solid var(--color-yellow, #eab308);
  border-radius: inherit;
  pointer-events: none;
  animation: toabRingPulse 1.1s ease-in-out infinite;
  z-index: 2;
}

@keyframes toabRingPulse {
  0%, 100% {
    opacity: 0.12;
  }
  50% {
    opacity: 0.95;
  }
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button. Lives as a
   SIBLING of the clipped body (under .turn-over-a-wrap) so the chamfer never cuts it. */
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
  background: rgba(9, 14, 12, 0.97);
  border: 1px solid rgba(19, 213, 148, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(19, 213, 148, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
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
  color: rgb(110, 245, 200);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(222, 236, 230, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.turn-over-a-btn:hover ~ .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* C878 · THE DOCK DESIGN LANGUAGE (Pewter · HiFi StratiPUNK): selectors ROUND · turn-overs SQUARED. */
.turn-over-a-btn { border-radius: 9px; }
.turn-over-a-wrap { position: relative; }
.tob-letter {
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--color-yellow, #eab308);
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.85);
  pointer-events: none;
}
</style>
