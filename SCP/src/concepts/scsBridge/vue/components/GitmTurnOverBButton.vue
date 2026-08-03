<script setup lang="ts">
/**
 * GitmTurnOverBButton — GITM A↔B Refinement (#641-R) · Turn Over B + Confirm B Success
 *
 * The B-side of the DUALTURN split (forked from the retired GitmTurnOverABButton.vue).
 * Source is ALWAYS 'B'. Two display states keyed off the abMode from the reactive gitm
 * controller (NO /gitm-status poll — reads getGlobalGitmController()):
 *   - 'turned-over' → CONFIRM B SUCCESS gesture (single click · dispatches
 *     gitm_confirm_success → sets bMergeable=true, enabling the Merge B→A button). This is
 *     the merge-flow lifeline (HAZARD-4) — built FIRST.
 *   - 'candidate-created' → TURN OVER B (CGDA 2-click). The FIRE handler writes the
 *     GITM_TURNOVER_KEY to localStorage (via gitmTurnover.model · the shared single source ·
 *     HAZARD-5) BEFORE dispatching gitm_turn_over_with_source { source: 'B' }, so the
 *     webSocketClient close handler can arm the failsafe deadline.
 *
 * CHANGEDIAL badge — the live changesPrimedOnB count (mirrors the pending-badge pattern from
 * ScsBridgeTurnOverButton.vue). ALWAYS-ON: renders unconditionally, defaulting to the boot
 * count (shows 0 at a clean tree) — the deliberate UNLIKE vs the hide-at-0 status-bar pill.
 *
 * Enabled when abMode === 'candidate-created' (turn-over available) OR 'turned-over'
 * (confirm-success available).
 *
 * Dispatch stays on getGlobalScsBridgeController().triggerGitmAction (Decision 2 — the
 * action-pipe lives in ScsBridgeClientState). State reads come from the read-only gitm
 * controller.
 *
 * Pewter Tessera HiFi (Ochre warn-state · the turn-over is a transition · Viridian on confirm):
 *   D1 Color: Ochre/amber palette inline (Output Firewall · no missing-token reliance)
 *   D5 Embossed Border + ARMED pulse (CGDA precedent from ScsBridgeTurnOverButton.vue)
 *
 * Citation: GitmTurnOverABButton.vue (the now-retired fork source · CGDA ARMED→FIRE + confirm-success).
 * Citation: gitmTurnover.model.ts (the shared GITM_TURNOVER_KEY single source · HAZARD-5).
 * Citation: ScsBridgeTurnOverButton.vue:100 (the pending-badge pattern · CHANGEDIAL).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W5-step-2.
 */
import { ref, computed, watch, onUnmounted, inject } from 'vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
// SORD Shield/Sword (Macro Diamond · Path B) · the byte-match single source (HAZARD-5).
// writeGitmTurnoverProgress is the write helper the WS-close handler reads.
import { writeGitmTurnoverProgress, GITM_TURNOVER_DEADLINE_MS } from '../../../../model/gitmTurnover.model';
// SORD Shield/Sword (D5/TVOS) · the turn-over standby overlay (the 'sword-b' variant). The button
// mounts it client-side; the WS-close handler re-asserts the SAME variant across the respawn gap.
import { showBridgeStandby } from '../../../webSocketClient/model/bridgeStandbyOverlay.model';

// GITM CONFORMANCE FIX (SORD §10 · the turn-over GATING root) — resolve the gitm controller via inject
// (the proven Vue runtime-singleton accessor) with the getGlobal fallback. getGlobalGitmController() is
// null/stale in the TaskBar render context (cached at setup · cleared on IslandWrapper unmount :415,
// the SAME clear that bit scsBridge's getGlobal :413). When null, abMode === 'idle' + changesPrimedOnB
// === 0 + workingBranch === '' → isEnabled === false → handleClick returns BEFORE arming/dispatch ("no
// action"). The scsBridge controller below was already repaired (053); the GATING controller was left on
// the bare global. IslandWrapper provides BOTH the GITM_CONTROLLER_KEY inject (:175) and the global
// (:176). This makes every gating computed (isEnabled · abMode · changesPrimedOnB · workingBranch) read
// live relayed gitm.json. NO guard weakened.
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
// SORD Shield/Sword FIX (053 diagnosis) — resolve the controller via inject (the proven send_message
// accessor · Vue runtime-singleton) with the getGlobal fallback. getGlobalScsBridgeController() is
// null/stale in the TaskBar render context (cached at setup · cleared on IslandWrapper unmount :413),
// so the dispatch silently returned at `if (!sbController) return` BEFORE the overlay/`/mcp` fetch —
// "no movement". Every WORKING feature (send_message, settings, archive…) uses inject; the GitM
// buttons used getGlobal. This one resolution is used by every handler below + the highlight read.
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

const state = ref<'idle' | 'armed'>('idle');
const ARMED_TIMEOUT_MS = 4000;
let armedTimer: ReturnType<typeof setTimeout> | null = null;

const abMode = computed<string>(() => gitmController?.abMode.value ?? 'idle');

// C873 · THE BLINK BEACON (B side) — mirror of GitmTurnOverAButton D-β, gated on the alert's
// signaled side: when scp_alert_turn_over stamps source:'B' (the user's current tactical
// branch · C872), THIS control blinks the Pewter HiFi-yellow pulse ring. mouseenter disarms
// per-alert (requestedAt-keyed); the alert's self-retire (turnOver.at > requestedAt) ends it.
const alertBlinkDisarmedAt = ref<number>(0);
const alertBlinkActive = computed<boolean>(() => {
  const gj = gitmController?.gitmJson.value;
  const alert = gj?.turnOverAlert;
  if (!alert) return false;
  if ((alert.source ?? 'A') !== 'B') return false;
  const retired = (gj?.turnOver?.at ?? 0) > alert.requestedAt;
  if (retired) return false;
  return alertBlinkDisarmedAt.value !== alert.requestedAt;
});
function disarmAlertBlink(): void {
  const alert = gitmController?.gitmJson.value?.turnOverAlert;
  if (alert) alertBlinkDisarmedAt.value = alert.requestedAt;
}
// THE PHANTOM FIX (Cycle 263) + THE CONFIRM REMOVAL (Cycle 267): the Confirm-B-Success gesture
// is GONE from this button — a B turn-over that boots auto-confirms at the reconnect seam.
const isCandidate = computed<boolean>(() => abMode.value === 'candidate-created');
const changesPrimedOnB = computed<number>(() => gitmController?.changesPrimedOnB.value ?? 0);
// CLEAN-HOP (Cycle 263 · user design): when A is FULLY CLEAN (on the stable A · no changes),
// the otherwise-disabled Turn-Over B becomes ACTIVE in the prismatic (B-Hop) coloration — a
// clean branch hop is always safe. No B yet → gitm_create_working forges one at parity first.
const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');
const isDirtyTree = computed<boolean>(() => gitmController?.gitmJson.value?.dirty ?? false);
// GITM color-cascade (W3) — ALWAYS-AVAILABLE TURN-OVER B (decoupled from the strict abMode gate).
// Available whenever there are changes to turn over (changesPrimedOnB > 0) OR the A↔B machine is at
// a turn-over-ready state (candidate-created → turn-over · turned-over → confirm-success). The
// bridge-side guards remain the AUTHORITATIVE safety rail — this is UI gating only (UNWEAKENED).
// THE CONFIRM GESTURE IS REMOVED (Cycle 267 · user design): a B turn-over that boots without a
// revert AUTO-CONFIRMS at the reconnect seam (webSocketClient Stage 1) — 'turned-over' is now a
// transient state, never a click target on this button.
// KEEP-TURNING-OVER-ON-B (Cycle 269 · user 072 note): ON the working B, the turn-over is ALWAYS
// available — the natural loop is edit-on-B → turn over B (restart+test) → repeat. Dirty → the
// row-4 pre-commit carries the work; clean → the row-5 anchor is a pure restart-on-B. Previously
// abMode 'success' + a clean tree left NO way to re-turn-over on B.
// MD-ATC · THE SELECTED-B PREDICATE (checkout-sovereign · the hop break): the CURRENT
// branch is a working B when it lives in the b/ namespace ANOR it IS the registered
// workingBranch — a hopped-to, never-registered B counts. Enablement follows the
// CHECKOUT; the registration is bookkeeping, never a gate.
const selectedB = computed<boolean>(() => {
  const cur = currentBranch.value.trim();
  if (cur === '') return false;
  const wb = gitmController?.gitmJson.value?.workingBranch ?? '';
  return cur.startsWith('b/') || (wb.length > 0 && cur === wb);
});
const onWorkingB = computed<boolean>(() => selectedB.value);
const baseEnabled = computed<boolean>(
  () => changesPrimedOnB.value > 0 || isCandidate.value || onWorkingB.value,
);
// CLEAN-HOP enablement (Cycle 264 · user 069 correction): a B BRANCH MUST BE SET — the button is
// DISABLED until a working B exists (no on-the-fly forging from this button). With a B present,
// A fully clean (on the stable A · no changes) lights the prismatic (B-Hop) coloration — the
// free, safe hop onto the EXISTING B.
const cleanHopReady = computed<boolean>(() => {
  const sb = gitmController?.gitmJson.value?.stableBranch ?? '';
  const wb = gitmController?.gitmJson.value?.workingBranch ?? '';
  return (
    !baseEnabled.value &&
    wb.length > 0 &&
    sb.length > 0 &&
    currentBranch.value === sb &&
    !isDirtyTree.value
  );
});
// THE HARD GATE (user 069): NO working B set → the button is DISABLED, whatever the other gates
// say (isCandidate/isTurnedOver imply a B anyway; this pins the changesPrimedOnB>0 path too).
const isEnabled = computed<boolean>(() => {
  const wb = gitmController?.gitmJson.value?.workingBranch ?? '';
  // F2 · THE DIRTY-TREE FALLBACK — a working B carrying uncommitted changes is ALWAYS turn-over-able
  // (the natural edit-on-B → turn-over loop · the bridge guards remain authoritative). This keeps the
  // finalize gesture live after an auto-apply lands changes on B, even when the strict abMode gate
  // hasn't flipped (the STAMP RACE left the rail mid-state · isDirtyTree is the honest signal).
  // MD-ATC · the hard gate RELAXES to the Selected-B predicate: a hopped-to B (never
  // registered · wb still '') ENABLES; the registered-B path (incl. the prismatic hop
  // from A) is preserved.
  return (selectedB.value || wb.length > 0) && (baseEnabled.value || cleanHopReady.value || isDirtyTree.value);
});

// GUARD-SURFACE (the honest-feedback net for "C") — the bridge target-branch-empty GUARDSHUNT
// fires when workingBranch === '' (no B forked). After the auto-induction a B always exists, but
// if a firing reaches here, surface a teaching hint instead of a silent no-op. Composes the
// SAME workingBranch predicate from the propagated gitm.json (NO new state field · TQNI-safe).
const workingBranch = computed<string>(() => gitmController?.gitmJson.value?.workingBranch ?? '');
// MD-ATC · a Selected B (hopped-to · unregistered) is inducted-IN-FACT — the checkout IS the B.
const isUninducted = computed<boolean>(() => workingBranch.value.length === 0 && !selectedB.value);
// SORD Shield/Sword — the stable A name for the failsafe carrier. (The row-4 commit-then-anchor vs
// row-5 anchor-only split keys off changesPrimedOnB — the B working-tree drift signal.)
const stableBranch = computed<string>(() => gitmController?.gitmJson.value?.stableBranch ?? '');

// GITM A↔B Refinement (Sword epoch) — the CHANGEDIAL badge is REMOVED from Turn-Over B.
// Only the two SETTERS (Shield · Sword) now carry the dedicated-enumeration badge.

const buttonLabel = computed<string>(() => {
  return state.value === 'armed' ? 'Confirm Turn Over B' : 'Turn Over B';
});

// GITM color-cascade (W4) · Vermillion Focus+Highlight — pulse when the scs:highlight relay targets
// 'turn-over'. AUTO-RESET: a watch clears the target ~2s after it arms (shared 'turn-over' target with
// the A button · whichever button mounts owns the clear · the local dispatch is idempotent).
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

function handleClick(): void {
  if (!isEnabled.value) return;
  const sbController = scsBridgeController;
  if (!sbController) return;

  // ARMED → FIRE 2-click confirmation for the turn-over to B.
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
    void fireTurnOverB();
  }
}

// SORD Shield/Sword (Macro Diamond · Path B) · the Sword-B turn-over (sequences ③ + clean-B). Mount
// the 'sword-b' overlay + write the carrier (source 'B' · variant 'sword-b') BEFORE the sequence so
// the WS-close handler re-asserts the SAME variant across the respawn gap.
//
//   row 4 (sequence ③) — drift on B (changesPrimedOnB > 0): commit B's working tree
//     (gitm_stage_all_and_commit) →ACK → fixed 600 ms step-pause → ⚓ SORD anchor to B. A non-ok
//     commit ACK ABORTS (no anchor fired).
//   row 5 — clean B (no drift): ⚓ SORD anchor to B only (no commit step).
//
// The SORD anchor is routed to the bridge CLI (survives a B that bricked the SCP). The separate
// "Confirm B" gesture (isTurnedOver → gitm_confirm_success) is UNTOUCHED above (row 6).
async function fireTurnOverB(): Promise<void> {
  const sbController = scsBridgeController;
  if (!sbController) return;

  // B is the candidate that can fail to boot — arm the B failsafe (source 'B'). The carrier holds
  // the outer-bridge endpoint so the WS-close handler can fire the revert MCP while the SCP is down.
  // STRATIPUNK TURN-OVER EXPRESSIONS (C637) — the SWORD register (YELLOW ⊗ BLUE · the Experiment).
  showBridgeStandby('sword-b', null, 'sword');
  writeGitmTurnoverProgress({
    source: 'B',
    overlayVariant: 'sword-b',
    turnClass: 'sword',
    deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
    stableA: stableBranch.value,
    bridgeEndpoint: sbController.bridgeJson.value?.endpoint ?? '',
    // BOOT-STREAM — stamp THIS SCP's own name so the standby overlay can tail
    // /scp-boot-log/:scpName across the respawn gap (async-safe: fireTurnOverB is async).
    scpName: (await sbController.getScpName()) ?? undefined,
  });

  // CLEAN-HOP (Cycle 264 · user 069 correction): NO forging from this button — the hard gate above
  // guarantees a working B already exists (the button is disabled otherwise). The clean hop anchors
  // straight onto the existing B (row 5 below · no commit needed on a clean tree).

  // row 4 (sequence ③) — drift on B → commit first (this button has no commit-message panel, so
  // the fallback message is used).
  if (changesPrimedOnB.value > 0) {
    const committed = await sbController.triggerGitmMean('gitm_stage_all_and_commit', {
      message: 'gitm: pre-turnover commit',
    });
    if (!committed.ok) {
      console.error('[GitmTurnOverB] sword-b commit ACK failed · aborting:', committed.error);
      return; // ABORT — do NOT fire the anchor. The overlay stays as the honest failure signal.
    }
    // Visible step-pause (overlay shows progress; the gitm.json watcher relay settles).
    await new Promise((res) => setTimeout(res, 600));
  }

  // row 4 + row 5 — ⚓ the SORD anchor to B → restart lands back on B → reconnect dismisses overlay.
  const ack = await sbController.triggerGitmTurnOver('B');
  if (!ack.ok) {
    console.error('[GitmTurnOverB] sword-b anchor ACK failed:', ack.error);
  }
}

onUnmounted(() => {
  if (armedTimer) clearTimeout(armedTimer);
  // GITM color-cascade (W4) — clear the highlight auto-reset timer on teardown.
  if (highlightResetTimer) clearTimeout(highlightResetTimer);
});
</script>

<template>
  <div class="turn-over-b-wrap" data-readout="BRIDGE TURN OVER B · REBUILD + SERVE B">
    <button
      class="turn-over-b-btn"
      :class="{ armed: state === 'armed', disabled: !isEnabled, highlighted: isHighlighted, prismatic: cleanHopReady, 'tobb-blink': alertBlinkActive }"
      :aria-label="buttonLabel"
      :disabled="!isEnabled"
      @mouseenter="disarmAlertBlink"
      @click="handleClick"
    >
      <span v-if="alertBlinkActive" class="tobb-ring" aria-hidden="true"></span>
      <i
        :class="['fa-solid', 'fa-arrow-right-to-bracket', { 'spin-icon': state === 'armed' }]"
        aria-hidden="true"
      ></i>
    
      <span class="tob-letter" aria-hidden="true">B</span>
    </button>
    <!-- Sword epoch — the CHANGEDIAL badge is REMOVED from Turn-Over B (only the setters badge). -->
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">Turn Over to B · Test Your Work</span>
      <span class="btn-tip-body" v-if="isUninducted">Register a stable A first — press the Shield. B (your working branch) is forked from A, so A must exist before you can test on B.</span>
      <span class="btn-tip-body" v-else>Tests your working Branch B — restarts the SCP on B. A B that boots is PROVEN automatically (Merge unlocks); if B fails its boot, the failsafe auto-reverts to the guarded stable A.</span>
    </span>
  </div>
</template>

<style scoped>
.turn-over-b-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Dark neon-framed register: a deep near-black chamfered body whose ochre identity reads
   through a thin glowing edge — the color informs via the glow, never a flooded fill. */
.turn-over-b-btn {
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
    radial-gradient(ellipse at 38% 30%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 13, 5, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(234, 179, 8, 0.09) 0%, rgba(14, 11, 4, 0) 70%),
    rgb(15, 12, 6);

  /* The neon edge — a thin ochre/amber ring carried by border + glow. */
  border: 1px solid rgba(234, 179, 8, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(234, 179, 8, 0.28),
    inset 0 0 10px 0 rgba(234, 179, 8, 0.10);

  /* The neon glyph. */
  color: rgb(255, 206, 9);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.6);
}

.turn-over-b-btn:hover:not(.disabled) {
  border-color: rgba(234, 179, 8, 0.9);
  color: rgb(255, 224, 120);
  box-shadow:
    0 0 14px 1px rgba(234, 179, 8, 0.5),
    inset 0 0 14px 0 rgba(234, 179, 8, 0.18);
}

.turn-over-b-btn:active:not(.disabled) {
  box-shadow: inset 0 0 12px 1px rgba(234, 179, 8, 0.35);
}

/* DISABLED — dimmed, no glow (no candidate to turn over · no turn-over to confirm). */
.turn-over-b-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(234, 179, 8, 0.25);
  box-shadow: none;
}

/* ARMED — the breathing amber neon (the frame pulse, not a solid color flash). */
.turn-over-b-btn.armed {
  background:
    radial-gradient(ellipse at 38% 30%, rgba(249, 115, 22, 0.18) 0%, rgba(17, 12, 8, 0) 62%),
    rgb(16, 12, 8);
  border-color: rgba(249, 115, 22, 0.85);
  color: rgb(253, 186, 116);
  text-shadow: 0 0 8px rgba(249, 115, 22, 0.7);
  animation: b-armed-pulse 1.6s ease-in-out infinite;
}

/* Confirm-B-success — the breathing viridian neon. */
.turn-over-b-btn.confirm {
  background:
    radial-gradient(ellipse at 38% 30%, rgba(19, 213, 148, 0.18) 0%, rgba(8, 14, 12, 0) 62%),
    rgb(9, 14, 12);
  border-color: rgba(19, 213, 148, 0.85);
  color: rgb(110, 245, 200);
  text-shadow: 0 0 8px rgba(19, 213, 148, 0.7);
  animation: b-confirm-pulse 1.8s ease-in-out infinite;
}

/* CLEAN-HOP PRISMATIC (Cycle 263 · user design) — the same free-hop coloration as the Sword's
   B-Hop: A is fully clean, so turning over onto B is always safe. The iridescent conic ring. */
.turn-over-b-btn.prismatic {
  border-color: transparent;
  color: rgb(245, 245, 255);
  text-shadow:
    0 0 6px rgba(255, 120, 200, 0.7),
    0 0 10px rgba(120, 200, 255, 0.5);
  background:
    linear-gradient(rgb(12, 10, 14), rgb(12, 10, 14)) padding-box,
    conic-gradient(
      from 0deg,
      rgb(255, 90, 160), rgb(255, 200, 60), rgb(90, 230, 160),
      rgb(80, 180, 255), rgb(180, 120, 255), rgb(255, 90, 160)
    ) border-box;
  box-shadow:
    0 0 12px 1px rgba(180, 120, 255, 0.45),
    0 0 18px 2px rgba(80, 180, 255, 0.30),
    inset 0 0 12px 0 rgba(255, 200, 60, 0.12);
  animation: b-prismatic-spin 4s linear infinite;
}

@keyframes b-prismatic-spin {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

@keyframes b-armed-pulse {
  0%, 100% {
    box-shadow:
      0 0 10px 0 rgba(249, 115, 22, 0.4),
      inset 0 0 12px 0 rgba(249, 115, 22, 0.15);
  }
  50% {
    box-shadow:
      0 0 20px 2px rgba(249, 115, 22, 0.75),
      inset 0 0 18px 1px rgba(249, 115, 22, 0.30);
  }
}

@keyframes b-confirm-pulse {
  0%, 100% {
    box-shadow:
      0 0 12px 0 rgba(19, 213, 148, 0.45),
      inset 0 0 12px 0 rgba(19, 213, 148, 0.15);
  }
  50% {
    box-shadow:
      0 0 22px 2px rgba(19, 213, 148, 0.8),
      inset 0 0 18px 1px rgba(19, 213, 148, 0.30);
  }
}

/* GITM color-cascade (W4) · Vermillion Focus+Highlight — the scs:highlight pulse (amber, matching
   this button's palette). Reuses the b-confirm-pulse keyframe shape so the just-cascaded design draws
   the eye to the Turn-Over. Self-extinguishes when the highlightTarget auto-resets (~2s). */
.turn-over-b-btn.highlighted {
  border-color: rgba(234, 179, 8, 0.95);
  color: rgb(255, 224, 120);
  text-shadow: 0 0 8px rgba(234, 179, 8, 0.7);
  animation: b-highlight-pulse 0.9s ease-in-out infinite;
}

@keyframes b-highlight-pulse {
  0%, 100% {
    box-shadow:
      0 0 12px 0 rgba(234, 179, 8, 0.5),
      inset 0 0 12px 0 rgba(234, 179, 8, 0.18);
  }
  50% {
    box-shadow:
      0 0 26px 3px rgba(234, 179, 8, 0.9),
      inset 0 0 20px 1px rgba(234, 179, 8, 0.34);
  }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button. Lives as a
   SIBLING of the clipped body (under .turn-over-b-wrap) so the chamfer never cuts it.
   Tint shifts with the active state so the panel reads as one with the button. */
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
  background: rgba(15, 12, 6, 0.97);
  border: 1px solid rgba(234, 179, 8, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
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
  color: rgb(255, 224, 120);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(236, 230, 218, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.turn-over-b-btn:hover ~ .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Confirm-B-success state tint — viridian, matching the button's confirm pulse. */
.btn-tip.confirm {
  background: rgba(9, 14, 12, 0.97);
  border-color: rgba(19, 213, 148, 0.55);
  box-shadow: 0 0 12px rgba(19, 213, 148, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
}

.btn-tip.confirm .btn-tip-title {
  color: rgb(110, 245, 200);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.5), 0.5px 0.5px 0 #fff;
}

/* C873 · the B-side blink beacon ring (mirror of GitmTurnOverAButton .toab-ring). */
.tobb-ring {
  position: absolute;
  inset: -3px;
  border: 2px solid var(--color-yellow, #eab308);
  border-radius: inherit;
  pointer-events: none;
  animation: tobbRingPulse 1.1s ease-in-out infinite;
  z-index: 2;
}
@keyframes tobbRingPulse {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.95; }
}

/* C878 · THE DOCK DESIGN LANGUAGE (Pewter · HiFi StratiPUNK): selectors ROUND · turn-overs SQUARED. */
.turn-over-b-btn { border-radius: 9px; }
.turn-over-b-wrap { position: relative; }
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
