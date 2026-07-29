<script setup lang="ts">
/**
 * ScsBridgeSessionsButton — Pewter Cobalt HiFi Sessions Toggle (CBRS)
 *
 * Circular 44px button that toggles the ScsBridgeSessionsPopup (DUPP) when
 * mounted in the TaskBar. Parent (Shell.vue) owns the popup-open ref and
 * passes it down as `popupOpen` for active-state styling.
 *
 * Anatomy:
 *  - CBRS: `border-radius: 50%` · 44px square geometry
 *  - Icon: `fa-solid fa-clock-rotate-left` (session history semantic)
 *  - NPAC: optional numbered pill (top/right -6px) when sessionCount > 0
 *  - Active state when popupOpen === true → D5 embossed border INVERSION
 *
 * Pewter Tessera HiFi compliance (Suite 5 Cobalt · Professional · semantic
 * fit for the bridge's session-management surface):
 *  - D1 Color: var(--color-cobalt*) tokens (verified present in style.css)
 *  - D5 Embossed Border: dark top/right · light bottom/left · INVERTED on active
 *  - D4 Text Shadow: Amber-Orange complement of cobalt (~37 deg)
 *  - D6 Typography: monospace badge font · heading font on parent surfaces
 *  - D7 Button Variant: default/hover/active state matrix
 *
 * Citation: Wave 2 Ochre-Components Blueprint Section 3 · CBRS · DUPP toggle
 */
import { computed } from 'vue';

interface Props {
  popupOpen: boolean;
  sessionCount?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'clicked'): void;
}>();

const showSessionBadge = computed<boolean>(() => {
  return (props.sessionCount ?? 0) > 0;
});

function handleClick() {
  emit('clicked');
}
</script>

<template>
  <span class="sessions-btn-wrap">
    <button
      :class="['sessions-btn', { active: popupOpen }]"
      aria-label="Session Management"
      @click="handleClick"
    >
      <i class="fa-solid fa-terminal" aria-hidden="true"></i>
      <span class="sessions-btn-label">Session Management</span>
      <span v-if="showSessionBadge" class="sessions-badge">
        {{ sessionCount }}
      </span>
    </button>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">Sessions</span>
      <span class="btn-tip-body">Manage the Claude Code sessions bound to this SCP.</span>
    </span>
  </span>
</template>

<style scoped>
/* The positioning wrapper — hosts the explanatory hover panel above the pill.
   No clip-path on the Sessions pill, but the wrapper still anchors the panel. */
.sessions-btn-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button (Cobalt). */
.sessions-btn-wrap .btn-tip {
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
  background: rgba(10, 13, 20, 0.97);
  border: 1px solid rgba(59, 130, 246, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.32), 0 6px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 220;
}

.sessions-btn-wrap .btn-tip-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgb(120, 170, 255);
  text-shadow: 0 0 6px rgba(59, 130, 246, 0.5), 0.5px 0.5px 0 #fff;
}

.sessions-btn-wrap .btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(220, 228, 240, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.sessions-btn-wrap:hover .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>

<!--
  E9 fix · Cycle 160 R3 Wave 2A+ · scoped CSS DELETED · global .sessions-btn rules
  in src/style.css are authoritative (Tailwind pill recipe per Cycle 158 R7).
  Legacy circular recipe here was overriding global via [data-v-hash] specificity
  causing the giant-blue-circle render bug. Pewter Tessera Critique Cycle 160.
  Citation: SESSIONS-BUTTON-PEWTER-CRITIQUE-CYCLE-160.md
-->

