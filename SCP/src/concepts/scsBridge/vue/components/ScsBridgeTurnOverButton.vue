<script setup lang="ts">
/**
 * ScsBridgeTurnOverButton — Pewter Fuchsia HiFi Hard Turn Over Button (D6)
 *
 * State-aware button with pending-count badge + CGDA two-click confirmation.
 *
 * State machine:
 *   IDLE → click → ARMED (orange · 4s timeout)
 *   ARMED → click → DISPATCH (emits 'turn-over-triggered') → IDLE
 *   ARMED → timeout 4s → IDLE
 *
 * Badge: shows `pendingCount` prop (caller passes `actionQue.length` from
 * scsBridge state). When pendingCount === 0, button still operable but badge
 * hides.
 *
 * Real server-side Hard Turn Over mechanism (Pattern G · SCP-S11 spec from
 * Refine-Macro Cycle 58) DEFERRED to M1-Final. D6 ships client surface only.
 *
 * Pewter Tessera HiFi (Suite 7 Fuchsia · Clinician color · semantic fit for
 * destructive-yet-diagnostic action):
 * - D1 Color: Fuchsia palette inline (no global tokens system-wide)
 * - D5 Embossed Border: dark top/right · light bottom/left · INVERTED on :active
 * - D4 Text Shadow: Spring Green complementary (~150° from fuchsia ~330°)
 * - D7 Button Variant: state matrix (default/hover/active) + ARMED warn state
 *
 * Citation: DIAMOND-TIER-M1-A1-D6.md
 * Patterns: SABPB · CGDA · DTBHTO · PHBVSC
 */
import { ref, computed, onUnmounted } from 'vue';

interface Props {
  pendingCount: number;
  badgeCount?: number;
}

const props = defineProps<Props>();

const effectiveBadgeCount = computed<number>(() => {
  return props.badgeCount ?? props.pendingCount;
});

const emit = defineEmits<{
  (e: 'turn-over-triggered'): void;
}>();

type ButtonState = 'idle' | 'armed';

const state = ref<ButtonState>('idle');
const ARMED_TIMEOUT_MS = 4000;
let armedTimer: ReturnType<typeof setTimeout> | null = null;

const buttonLabel = computed<string>(() => {
  return state.value === 'armed' ? 'Confirm Turn Over' : 'Turn Over';
});

const showBadge = computed<boolean>(() => {
  return effectiveBadgeCount.value > 0 && state.value === 'idle';
});

function handleClick() {
  console.log('[ScsBridgeTurnOverButton] handleClick FIRED · state:', state.value);
  if (state.value === 'idle') {
    console.log('[ScsBridgeTurnOverButton] IDLE → ARMED · 4s timeout starting (click again to confirm)');
    state.value = 'armed';
    armedTimer = setTimeout(() => {
      console.log('[ScsBridgeTurnOverButton] ARMED timeout · resetting to IDLE');
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
    console.log('[ScsBridgeTurnOverButton] ARMED confirmed · emitting turn-over-triggered event');
    emit('turn-over-triggered');
  }
}

onUnmounted(() => {
  if (armedTimer) {
    clearTimeout(armedTimer);
    armedTimer = null;
  }
});
</script>

<template>
  <span class="turn-over-btn-wrap" data-readout="HARD BRIDGE TURN OVER · REBUILD + RESTART">
    <button
      :class="['turn-over-btn', state]"
      :aria-label="buttonLabel"
      @click="handleClick"
    >
      <i :class="['fa-solid', 'fa-rotate', { 'spin-icon': state === 'armed' }]" aria-hidden="true"></i>
      <span v-if="showBadge" class="pending-badge">{{ effectiveBadgeCount }}</span>
    </button>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">{{ state === 'armed' ? 'Confirm Hard Turn Over · Sparks' : 'the Tactical Bridge · Sparks — Hard Turn Over · The Clean Slate' }}</span>
      <span class="btn-tip-body">The outermost restart — the whole bridge, not just a branch. Where the working turn-over carries your session across, this one is the fresh start: reach for it when the app locks up or stops answering. The escape hatch, not the daily rhythm.</span>
    </span>
  </span>
</template>

<style scoped>
/* The positioning wrapper — hosts the tooltip OUTSIDE the clipped body so the chamfer
   cannot cut the panel away. NO clip-path here. */
.turn-over-btn-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Dark neon-framed register: a deep near-black chamfered body whose fuchsia identity
   reads through a thin glowing edge — the color informs via the glow, never a flooded fill. */
.turn-over-btn {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* The deep field: a radial depth core over near-black, not a solid fill. */
  background:
    radial-gradient(ellipse at 38% 30%, rgba(217, 70, 239, 0.16) 0%, rgba(14, 11, 17, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(217, 70, 239, 0.10) 0%, rgba(10, 9, 13, 0) 70%),
    rgb(12, 10, 15);

  /* The neon edge: a thin fuchsia ring carried by the border + glow, not a filled circle. */
  border: 1px solid rgba(217, 70, 239, 0.55);
  /* Chamfered corners — the angular bevel cut (8px clip). */
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(217, 70, 239, 0.30),
    inset 0 0 10px 0 rgba(217, 70, 239, 0.10);

  /* The neon glyph: a fuchsia glow on the dark body. */
  color: rgb(236, 138, 245);
  text-shadow: 0 0 6px rgba(217, 70, 239, 0.65);
}

.turn-over-btn:hover {
  border-color: rgba(217, 70, 239, 0.9);
  color: rgb(247, 190, 252);
  box-shadow:
    0 0 14px 1px rgba(217, 70, 239, 0.5),
    inset 0 0 14px 0 rgba(217, 70, 239, 0.18);
}

.turn-over-btn:active {
  box-shadow: inset 0 0 12px 1px rgba(217, 70, 239, 0.35);
}

/* ARMED state — the breathing amber neon (the frame pulse, not a solid color flash). */
.turn-over-btn.armed {
  background:
    radial-gradient(ellipse at 38% 30%, rgba(249, 115, 22, 0.18) 0%, rgba(17, 12, 8, 0) 62%),
    rgb(16, 12, 8);
  border-color: rgba(249, 115, 22, 0.85);
  color: rgb(253, 186, 116);
  text-shadow: 0 0 8px rgba(249, 115, 22, 0.7);
  animation: turn-over-armed-pulse 1.6s ease-in-out infinite;
}

.turn-over-btn.armed:hover {
  border-color: rgba(249, 115, 22, 1);
}

@keyframes turn-over-armed-pulse {
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

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pending-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgb(20, 14, 22);
  color: rgb(236, 138, 245);
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
  border: 1px solid rgba(217, 70, 239, 0.7);
  box-shadow: 0 0 6px rgba(217, 70, 239, 0.5);
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button. Lives as a
   SIBLING of the clipped body (under .turn-over-btn-wrap) so the chamfer never cuts it.
   CSS-only :hover reveal · pointer-events-none · fade-in. */
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
  background: rgba(12, 10, 15, 0.97);
  border: 1px solid rgba(217, 70, 239, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(217, 70, 239, 0.36), 0 6px 16px rgba(0, 0, 0, 0.6);
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
  color: rgb(247, 190, 252);
  text-shadow: 0 0 6px rgba(217, 70, 239, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(232, 222, 236, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.turn-over-btn-wrap:hover .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* C878 · THE DOCK DESIGN LANGUAGE: the Hard Bridge Turn Over is SQUARED — the round form
   retires to the Shield/Sword branch SELECTORS it inspired (selectors round · turn-overs
   squared). The existing .btn-tip remains its hover readout. */
.turn-over-btn { border-radius: 9px; }
</style>
