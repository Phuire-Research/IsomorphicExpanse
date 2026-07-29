<script setup lang="ts">
/**
 * ScsBridgeSessionsPopup — Pewter Cobalt HiFi Drop-Up Popover (DUPP)
 *
 * Teleports to body to escape the Island stacking context and renders a
 * 540px wide x 600px max-height panel anchored 64px above the bottom edge
 * (clears TaskBar h-14 + 8px gap). Embeds ScsBridgeSessionManagement.vue
 * as the full session-management surface — the same content reachable via
 * SubPageNav, surfaced here as a quick-access overlay.
 *
 * Close paths (COBP + ESC + close button):
 *  - Backdrop @click  → emit('close')
 *  - ESC keydown      → emit('close')
 *  - Close button     → emit('close')
 *  - Panel @click.stop blocks bubble-up close
 *
 * Pewter Tessera HiFi compliance (DUPP doctrine + cobalt suite tint):
 *  - D3 Pane Gradient: dark base + near-transparent radial · panel surface
 *  - D5 Embossed Border: panel edge + soft shadow glow
 *  - D4 Text Shadow: Amber-Orange complement of cobalt (~37 deg) on heading
 *  - D6 Typography: heading font on title (uppercase tracking-wider) ·
 *    monospace on footer provenance
 *  - D8 Utility: custom scrollbar on inner body
 *
 * Citation: Wave 2 Ochre-Components Blueprint Section 4 · DUPP · Teleport
 */
import { inject, onMounted, onUnmounted } from 'vue';
import ScsBridgeSessionManagement from './ScsBridgeSessionManagement.vue';
import {
  BRIDGE_STATUS_COLORS,
  type BridgeJsonShape,
  type ScsBridgeSessionEntry,
} from '../../scsBridge.type';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';

interface Props {
  isOpen: boolean;
  bridgeJson: BridgeJsonShape | null;
  sessionsList: ScsBridgeSessionEntry[];
}

defineProps<Props>();

// PP-D5 · Ochre-C §6 · Surface 3 · direct inject for popup-level bridgeActive display
// Teleport does NOT break Vue inject (per Vue 3 provide/inject chain), but direct
// inject ensures the popup header surfaces bridgeActive without relying on the
// embedded Surface 2 component for visibility.
const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function handleClose() {
  emit('close');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose();
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
    <Transition name="sessions-popup">
      <div
        v-if="isOpen"
        class="sessions-popup-backdrop"
        @click="handleClose"
      >
        <div
          class="sessions-popup-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Session Management"
          @click.stop
        >
          <div class="sessions-popup-header">
            <div class="sessions-popup-header-identity">
              <i class="fa-solid fa-clock-rotate-left sessions-popup-icon" aria-hidden="true"></i>
              <span class="sessions-popup-title">Session Management</span>
              <!-- D3D Hotfix-1 · Bug A B1 · popup badge sourced from connectionEstablished (Single-Source Collapse) -->
              <span
                class="sessions-popup-bridge-active"
                :style="{
                  color: (controller?.connectionEstablished.value ?? false)
                    ? BRIDGE_STATUS_COLORS.connected
                    : BRIDGE_STATUS_COLORS.error,
                }"
              >
                BRIDGE {{ (controller?.connectionEstablished.value ?? false) ? 'CONNECTED' : 'PENDING' }}
              </span>
            </div>
            <button
              class="sessions-popup-close"
              aria-label="Close session management"
              title="Close"
              @click="handleClose"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="sessions-popup-body">
            <ScsBridgeSessionManagement
              :bridge-json="bridgeJson"
              :sessions-list="sessionsList"
              :wide="true"
            />
          </div>

          <div class="sessions-popup-footer">
            <span>Session Management · Quick-Access Preview</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sessions-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: auto;
}

.sessions-popup-panel {
  /* SMSR · Split Recomposition · wide form. The panel's LEFT EDGE sits just touching the
     Rotary/sidebar: anchored fixed at the sidebar width + 12px gap, stretched to right: 24px.
     Vertical placement keeps the drop-up feel (bottom: 4rem clears the TaskBar) while the
     enlarged width hosts the two-column ScsBridgeSessionManagement split. */
  position: fixed;
  left: calc(var(--sidebar-width, 240px) + 12px);
  right: 24px;
  bottom: 4rem;
  width: auto;
  max-width: none;
  /* THE DEFINITE-HEIGHT LAW (C539 · re-landed C543): a flex body (flex:1 · min-height:0 ·
     overflow:hidden) inside a panel constrained ONLY by max-height legally collapses to zero
     — the title-bar-only render. height: min(...) gives the flex chain its definite height
     while still clamping to the viewport. */
  height: min(600px, calc(100vh - 8rem));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 0.75rem;

  background: linear-gradient(
    180deg,
    rgba(8, 12, 20, 0.98) 0%,
    rgba(4, 6, 12, 0.99) 100%
  );

  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(37, 99, 235, 0.08);
}

.sessions-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(
    180deg,
    rgba(37, 99, 235, 0.06) 0%,
    transparent 100%
  );
  flex-shrink: 0;
}

.sessions-popup-header-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sessions-popup-icon {
  font-size: 0.875rem;
  color: var(--color-cobalt, #3b82f6);
}

.sessions-popup-title {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);

  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}

/* PP-D5 · Ochre-C §6 · Surface 3 · bridgeActive badge */
.sessions-popup-bridge-active {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-left: 0.5rem;
  padding: 2px 6px;
  border: 1px solid currentColor;
  border-radius: 3px;
}

.sessions-popup-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.15s ease;
  line-height: 1;
  border-radius: 4px;
}

.sessions-popup-close:hover {
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.04);
}

.sessions-popup-body {
  /* THE SCROLL INDEPENDENCE (wide mode) · Pewter · the popup BODY must NOT own the
     scroll in the two-column arrangement — the COLUMNS own it. The panel is already a
     flex column (max-height: 600px); the body fills the remaining panel height and clips,
     handing the actual scroll down to .smgmt-col-sessions / .smgmt-col-menu (each with its
     own min-height:0 + overflow-y:auto). Prior overflow-y:auto here made the whole body
     scroll — dragging the left control column along with the sessions list. */
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sessions-popup-body::-webkit-scrollbar {
  width: 4px;
}
.sessions-popup-body::-webkit-scrollbar-track {
  background: transparent;
}
.sessions-popup-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.sessions-popup-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.sessions-popup-footer {
  /* THE PEWTER BRIGHTNESS PASS · the popup's own provenance caption was dim neutral text
     (0.25 white) — raised to white + the same high-mid glow so it matches the brightened
     Manager surface embedded above. */
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.5625rem;
  color: #ffffff;
  text-shadow: 0 0 7px rgba(255, 255, 255, 0.38);
  font-style: italic;
  flex-shrink: 0;
}

.sessions-popup-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}
.sessions-popup-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.sessions-popup-enter-from,
.sessions-popup-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
