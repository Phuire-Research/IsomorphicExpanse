<script setup lang="ts">
/**
 * GitmTurnOverAConfirmModal — THE-TURN-OVER-A-GUARD · intrusive center-vision confirmation.
 *
 * THE LAW: the working seat is B; changes made while working belong to B. When Turn Over A
 * fires with working changes present (a working branch exists AND the tree is dirty, or the
 * checkout is already on a working branch), the turn-over must NOT proceed silently — this
 * modal seizes the center of vision and demands an explicit choice.
 *
 * THE C302 CONSOLIDATION (Cycle 312) — this modal is now the SOLE confirmation surface for every
 * A turn-over. It absorbs the three actions of the retired button-anchored panel:
 *
 *   Confirm → the working changes are carried into the working branch, then the turn-over SERVES that
 *             working branch: the app reboots ONTO B (you will be looking at your changes) and the
 *             stable branch remains the guarded stable you can revert to. Runs the two-call safeguard
 *             handshake — THE ONE CANONICAL CARRY (the bridge mints `git switch -c b/<stable>-<ts>`,
 *             guard-compatible, signifier-registered):
 *               call 1: gitm_turn_over_with_source { source:'A' } → the bridge holds the switch
 *                       and relays a one-time confirmation token via gitmJson.pendingConfirm.
 *               call 2: gitm_turn_over_with_source { source:'A', confirmToken } → carry, then the
 *                       bridge resolves the confirmed target to B server-side and serves B.
 *   Hard Turn Over → a GROUND RESET: the blind hard-restart (triggerHardTurnOver · BRTF · no branch
 *             switch, no carry) — the app reboots as-is. The dim-warm third button (the fork away
 *             from carry). Your working changes are NOT carried onto B.
 *   Cancel  → nothing moves (backdrop click · ESC · Cancel button all resolve to Cancel).
 *
 * THE FORK (the teaching line): carry = your changes ride into B AND the app reboots ONTO B (you will
 * be looking at your changes; A remains the guarded stable you can revert to); hard = ground reset,
 * nothing carried.
 *
 * Teleports to body so it escapes the Island/dock stacking context and dims the whole viewport
 * — a genuinely blocking overlay, not a button-anchored popover.
 *
 * HiFi (Viridian identity · the stable-A palette · Output Firewall — plain copy only):
 *   Glossy near-black glass block · thin viridian neon edge + glow · neon-primary Confirm ·
 *   dim Cancel · backdrop blur + dim. Precedent: ScsBridgeSessionsPopup.vue (Teleport + backdrop),
 *   GitmTurnOverAButton.vue (Viridian neon palette · the two-call safeguard handshake).
 */
import { onMounted, onUnmounted, computed } from 'vue';

interface Props {
  isOpen: boolean;
  changesCount: number; // working-tree change count (0 when the trigger is an on-working-branch checkout)
  onWorkingBranch: boolean; // true when the checkout is already on a working branch (commit-in-place)
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'hard'): void;
  (e: 'cancel'): void;
}>();

const changeLabel = computed<string>(() => {
  if (props.changesCount <= 0) return 'uncommitted work';
  return `${props.changesCount} uncommitted change${props.changesCount === 1 ? '' : 's'}`;
});

function handleConfirm(): void {
  emit('confirm');
}

function handleHard(): void {
  emit('hard');
}

function handleCancel(): void {
  emit('cancel');
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    handleCancel();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="ta-confirm">
      <div
        v-if="isOpen"
        class="ta-confirm-backdrop"
        @click="handleCancel"
      >
        <div
          class="ta-confirm-block"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm turn over with working changes"
          @click.stop
        >
          <div class="ta-confirm-glare" aria-hidden="true"></div>

          <div class="ta-confirm-heading">
            <i class="fa-solid fa-triangle-exclamation ta-confirm-icon" aria-hidden="true"></i>
            <span class="ta-confirm-title">You have working changes</span>
          </div>

          <p class="ta-confirm-body">
            You are working on the reserve branch and it holds {{ changeLabel }}.
            Carrying now will <strong>ride your changes into the reserve branch</strong> and
            <strong>reboot the app onto the reserve branch</strong> — you will be looking at your
            changes. The stable branch remains the guarded stable you can revert to. Nothing is discarded.
          </p>

          <p class="ta-confirm-fork">
            <strong>Carry into B &amp; Serve B</strong> — your changes ride into B and the app reboots onto B
            (you will be looking at your changes; A stays the guarded stable you can revert to).
            <strong>Hard Turn Over</strong> — ground reset (the app reboots as-is; nothing carried).
          </p>

          <div class="ta-confirm-actions">
            <button class="ta-confirm-cancel" type="button" @click="handleCancel">
              Cancel
            </button>
            <button class="ta-confirm-hard" type="button" @click="handleHard">
              <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
              Hard Turn Over
            </button>
            <button class="ta-confirm-primary" type="button" @click="handleConfirm">
              <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
              Carry into B &amp; Serve B
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ta-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(
      ellipse at 50% 42%,
      rgba(8, 20, 15, 0.72) 0%,
      rgba(2, 5, 4, 0.9) 100%
    );
  backdrop-filter: blur(6px);
  pointer-events: auto;
}

/* The glossy near-black glass block — a deep radial field carrying a thin viridian neon edge.
   Color informs through the glow, never a flooded fill (the GitmTurnOverAButton register idiom). */
.ta-confirm-block {
  position: relative;
  width: 460px;
  max-width: calc(100vw - 3rem);
  padding: 26px 26px 22px;
  overflow: hidden;
  border-radius: 14px;

  background:
    radial-gradient(ellipse at 30% 8%, rgba(19, 213, 148, 0.16) 0%, rgba(8, 16, 13, 0) 58%),
    radial-gradient(ellipse at 88% 118%, rgba(19, 213, 148, 0.1) 0%, rgba(6, 12, 10, 0) 70%),
    linear-gradient(170deg, rgba(12, 20, 17, 0.98) 0%, rgba(5, 9, 8, 0.99) 100%);

  border: 1px solid rgba(19, 213, 148, 0.55);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.7),
    0 0 26px 0 rgba(19, 213, 148, 0.3),
    inset 0 0 22px 0 rgba(19, 213, 148, 0.08);
}

/* Top glossy sheen — the StratiPUNK glass highlight. */
.ta-confirm-glare {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 46%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
}

.ta-confirm-heading {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
}

.ta-confirm-icon {
  font-size: 1.1rem;
  color: rgb(19, 213, 148);
  text-shadow: 0 0 10px rgba(19, 213, 148, 0.7);
}

.ta-confirm-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(140, 255, 215);
  text-shadow: 0 0 8px rgba(19, 213, 148, 0.5), 0.5px 0.5px 0 rgba(0, 0, 0, 0.6);
}

.ta-confirm-body {
  position: relative;
  margin: 0 0 1.35rem;
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
  font-size: 0.82rem;
  line-height: 1.55;
  color: rgba(214, 236, 228, 0.86);
}

.ta-confirm-body strong {
  color: rgb(150, 250, 210);
  font-weight: 600;
}

/* THE FORK teaching line — the carry/hard distinction under the body copy. */
.ta-confirm-fork {
  position: relative;
  margin: 0 0 1.2rem;
  padding: 0.6rem 0.75rem;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(19, 213, 148, 0.16);
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.72rem;
  line-height: 1.5;
  color: rgba(206, 228, 220, 0.78);
}

.ta-confirm-fork strong {
  color: rgb(150, 250, 210);
  font-weight: 600;
}

.ta-confirm-actions {
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}

.ta-confirm-cancel,
.ta-confirm-hard,
.ta-confirm-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.15rem;
  border-radius: 7px;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.18s ease;
}

/* Dim — the recessive Cancel. */
.ta-confirm-cancel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(222, 236, 230, 0.7);
}

.ta-confirm-cancel:hover {
  background: rgba(255, 255, 255, 0.09);
  color: rgba(240, 248, 244, 0.92);
  border-color: rgba(255, 255, 255, 0.28);
}

/* Dim-warm — the recessive Hard Turn Over (the ground-reset fork · amber register per the existing
   Pewter warm palette). Reads as available-but-secondary against the neon-viridian Confirm. */
.ta-confirm-hard {
  background:
    radial-gradient(ellipse at 40% 20%, rgba(217, 148, 42, 0.16) 0%, rgba(20, 14, 6, 0) 70%),
    rgb(16, 12, 7);
  border: 1px solid rgba(217, 148, 42, 0.45);
  color: rgba(240, 200, 140, 0.88);
  text-shadow: 0 0 6px rgba(217, 148, 42, 0.4);
}

.ta-confirm-hard:hover {
  border-color: rgba(217, 148, 42, 0.8);
  color: rgb(250, 215, 155);
  box-shadow:
    0 0 14px 1px rgba(217, 148, 42, 0.4),
    inset 0 0 12px 0 rgba(217, 148, 42, 0.16);
}

.ta-confirm-hard:active {
  box-shadow: inset 0 0 12px 1px rgba(217, 148, 42, 0.32);
}

/* Neon-primary — the glowing viridian Confirm. */
.ta-confirm-primary {
  background:
    radial-gradient(ellipse at 40% 20%, rgba(19, 213, 148, 0.28) 0%, rgba(8, 16, 13, 0) 70%),
    rgb(9, 16, 13);
  border: 1px solid rgba(19, 213, 148, 0.7);
  color: rgb(150, 250, 210);
  box-shadow:
    0 0 12px 0 rgba(19, 213, 148, 0.4),
    inset 0 0 12px 0 rgba(19, 213, 148, 0.14);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.6);
}

.ta-confirm-primary:hover {
  border-color: rgba(19, 213, 148, 0.95);
  color: rgb(180, 255, 225);
  box-shadow:
    0 0 20px 2px rgba(19, 213, 148, 0.6),
    inset 0 0 16px 0 rgba(19, 213, 148, 0.22);
}

.ta-confirm-primary:active {
  box-shadow: inset 0 0 14px 1px rgba(19, 213, 148, 0.4);
}

/* Entrance/exit — the block drops in over the dimming backdrop. */
.ta-confirm-enter-active {
  transition: opacity 0.2s ease-out;
}
.ta-confirm-leave-active {
  transition: opacity 0.15s ease-in;
}
.ta-confirm-enter-active .ta-confirm-block {
  transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.22s ease-out;
}
.ta-confirm-enter-from,
.ta-confirm-leave-to {
  opacity: 0;
}
.ta-confirm-enter-from .ta-confirm-block {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}
</style>
