<script setup lang="ts">
/**
 * SCS-Bridge Sub-Page Navigation (Cycle 156 · Pewter Pass · Wave 4 Cobalt-Wire)
 *
 * Props-driven tab Navbar. Reads `options` registry constant + `activeSubPage`
 * from parent stage planner subscription. Emits a single `subPageSelected`
 * event per click; parent dispatches the Stratimux Quality.
 *
 * Pewter Tessera HiFi:
 *   D1 Color Token Architecture - zero raw hex; per-suite --tab-* indirection layer
 *   D5 Embossed Border Treatment - active state inverts dark/light borders
 *   D7 Button Variant System - state matrix (default/hover/active/deferred)
 *   D8 Locked Pane - deferred tabs receive opacity + grayscale + not-allowed
 *
 * Citation: PEWTER-PASS-WAVE2-OCHRE-A-SUBPAGE-NAV-BLUEPRINT.md Sections 2-5
 * Citation: scsBridge.subPageRegistry.ts (SCSBRIDGE_SUB_PAGE_OPTIONS source)
 */
import type { ScsBridgeSubPage } from '../../scsBridge.type';
import type { SubPageOption } from '../../scsBridge.subPageRegistry';

interface Props {
  options: SubPageOption[];
  activeSubPage: ScsBridgeSubPage;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: 'subPageSelected', value: ScsBridgeSubPage): void;
}>();

function handleClick(option: SubPageOption) {
  if (option.deferred) return;
  emit('subPageSelected', option.value);
}
</script>

<template>
  <nav class="scsbridge-subpage-nav hifi-pane-base">
    <div class="subpage-tabs">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="[
          'tab-btn',
          option.suite ? `tab-btn--${option.suite}` : 'tab-btn--base',
          { 'tab-btn--active': activeSubPage === option.value },
          { 'tab-btn--deferred': option.deferred },
        ]"
        :disabled="option.deferred"
        @click="handleClick(option)"
      >
        {{ option.label }}
      </button>
    </div>
    <hr class="suite-hr" />
  </nav>
</template>

<style scoped>
.scsbridge-subpage-nav {
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0;
}

.subpage-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* D1 per-suite indirection layer - tabs consume --tab-* and the suite class
   re-assigns those to the suite's --color-* tokens. Zero raw hex. */
.tab-btn--base {
  --tab-accent: var(--color-board-elevated);
  --tab-dark:   var(--color-board-dark);
  --tab-light:  var(--color-board-surface);
  --tab-shadow: rgba(0, 0, 0, 0.4);
}
.tab-btn--red {
  --tab-accent: var(--color-red);
  --tab-dark:   var(--color-red-dark);
  --tab-light:  var(--color-red-light);
  --tab-shadow: var(--shadow-red);
}
.tab-btn--orange {
  --tab-accent: var(--color-orange);
  --tab-dark:   var(--color-orange-dark);
  --tab-light:  var(--color-orange-light);
  --tab-shadow: var(--shadow-orange);
}
.tab-btn--yellow {
  --tab-accent: var(--color-yellow);
  --tab-dark:   var(--color-yellow-dark);
  --tab-light:  var(--color-yellow-light);
  --tab-shadow: var(--shadow-yellow);
}
.tab-btn--green {
  --tab-accent: var(--color-green);
  --tab-dark:   var(--color-green-dark);
  --tab-light:  var(--color-green-light);
  --tab-shadow: var(--shadow-green);
}
.tab-btn--blue {
  --tab-accent: var(--color-blue);
  --tab-dark:   var(--color-blue-dark);
  --tab-light:  var(--color-blue-light);
  --tab-shadow: var(--shadow-blue);
}
.tab-btn--purple {
  --tab-accent: var(--color-purple);
  --tab-dark:   var(--color-purple-dark);
  --tab-light:  var(--color-purple-light);
  --tab-shadow: var(--shadow-purple);
}
.tab-btn--fuchsia {
  --tab-accent: var(--color-fuchsia);
  --tab-dark:   var(--color-fuchsia-dark);
  --tab-light:  var(--color-fuchsia-light);
  --tab-shadow: var(--shadow-fuchsia);
}
.tab-btn--maroon {
  --tab-accent: var(--color-maroon);
  --tab-dark:   var(--color-maroon-dark);
  --tab-light:  var(--color-maroon-light);
  --tab-shadow: var(--shadow-maroon);
}
.tab-btn--viridian {
  --tab-accent: var(--color-viridian);
  --tab-dark:   var(--color-viridian-dark);
  --tab-light:  var(--color-viridian-light);
  --tab-shadow: var(--shadow-viridian);
}
.tab-btn--cobalt {
  --tab-accent: var(--color-cobalt);
  --tab-dark:   var(--color-cobalt-dark);
  --tab-light:  var(--color-cobalt-light);
  --tab-shadow: var(--shadow-cobalt);
}
.tab-btn--amethyst {
  --tab-accent: var(--color-amethyst);
  --tab-dark:   var(--color-amethyst-dark);
  --tab-light:  var(--color-amethyst-light);
  --tab-shadow: var(--shadow-amethyst);
}

/* D7 default state */
.tab-btn {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.375rem 1rem;
  border-radius: 0.375rem;
  border-top:    1px solid var(--tab-dark);
  border-right:  1px solid var(--tab-dark);
  border-bottom: 1px solid var(--tab-light);
  border-left:   1px solid var(--tab-light);
  background: var(--color-board-dark);
  color: rgba(255, 255, 255, 0.55);
  box-shadow: -2px 2px 6px var(--tab-shadow);
  transition: all 0.2s ease;
  cursor: pointer;
}

/* D7 hover state */
.tab-btn:hover:not(.tab-btn--deferred):not(:disabled) {
  border-color: var(--tab-accent);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: -1px 1px 4px var(--tab-shadow);
}

/* D5 + D7 active state - inverted embossed borders */
.tab-btn--active {
  background: var(--tab-accent);
  color: var(--color-board-dark);
  border-top:    1px solid var(--tab-light);
  border-right:  1px solid var(--tab-light);
  border-bottom: 1px solid var(--tab-dark);
  border-left:   1px solid var(--tab-dark);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}

/* D8 deferred state - locked pane treatment */
.tab-btn--deferred,
.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.4);
}
</style>
