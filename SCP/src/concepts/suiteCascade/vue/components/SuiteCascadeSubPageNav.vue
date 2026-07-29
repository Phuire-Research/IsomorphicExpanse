<script setup lang="ts">
/**
 * SuiteCascade Sub-Page Navigation (Band B-6 HCD)
 *
 * Props-driven tab Navbar mirroring ScsBridgeSubPageNav.vue. Reads the `options`
 * registry constant + `activeSubPage` from the parent stage-planner subscription.
 * Emits a single `subPageSelected` event per click; the parent dispatches the
 * Stratimux Quality (suiteCascadeSetActiveSubPage).
 *
 * Pewter Tessera HiFi (per-suite --tab-* indirection · zero raw hex) reused
 * verbatim from the scsBridge SubPage nav bearing.
 *
 * Citation: scsBridge/vue/components/ScsBridgeSubPageNav.vue (structural bearing).
 * Citation: suiteCascade.subPageRegistry.ts (SUITECASCADE_SUB_PAGE_OPTIONS source).
 */
import type { SuiteCascadeSubPage } from '../../suiteCascade.type';
import type { SuiteCascadeSubPageOption } from '../../suiteCascade.subPageRegistry';

interface Props {
  options: SuiteCascadeSubPageOption[];
  activeSubPage: SuiteCascadeSubPage;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: 'subPageSelected', value: SuiteCascadeSubPage): void;
}>();

function handleClick(option: SuiteCascadeSubPageOption) {
  if (option.deferred) return;
  emit('subPageSelected', option.value);
}
</script>

<template>
  <nav class="suitecascade-subpage-nav hifi-pane-base">
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
.suitecascade-subpage-nav {
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
  --tab-comp:   var(--color-green);
}
.tab-btn--orange {
  --tab-accent: var(--color-orange);
  --tab-dark:   var(--color-orange-dark);
  --tab-light:  var(--color-orange-light);
  --tab-shadow: var(--shadow-orange);
  --tab-comp:   var(--color-blue);
}
.tab-btn--yellow {
  --tab-accent: var(--color-yellow);
  --tab-dark:   var(--color-yellow-dark);
  --tab-light:  var(--color-yellow-light);
  --tab-shadow: var(--shadow-yellow);
  --tab-comp:   var(--color-purple);
}
.tab-btn--green {
  --tab-accent: var(--color-green);
  --tab-dark:   var(--color-green-dark);
  --tab-light:  var(--color-green-light);
  --tab-shadow: var(--shadow-green);
  --tab-comp:   var(--color-fuchsia);
}
.tab-btn--blue {
  --tab-accent: var(--color-blue);
  --tab-dark:   var(--color-blue-dark);
  --tab-light:  var(--color-blue-light);
  --tab-shadow: var(--shadow-blue);
  --tab-comp:   var(--color-red);
}
.tab-btn--purple {
  --tab-accent: var(--color-purple);
  --tab-dark:   var(--color-purple-dark);
  --tab-light:  var(--color-purple-light);
  --tab-shadow: var(--shadow-purple);
  --tab-comp:   var(--color-orange);
}
.tab-btn--fuchsia {
  --tab-accent: var(--color-fuchsia);
  --tab-dark:   var(--color-fuchsia-dark);
  --tab-light:  var(--color-fuchsia-light);
  --tab-shadow: var(--shadow-fuchsia);
  --tab-comp:   var(--color-yellow);
}
.tab-btn--maroon {
  --tab-accent: var(--color-maroon);
  --tab-dark:   var(--color-maroon-dark);
  --tab-light:  var(--color-maroon-light);
  --tab-shadow: var(--shadow-maroon);
  --tab-comp:   var(--color-green);
}
.tab-btn--viridian {
  --tab-accent: var(--color-viridian);
  --tab-dark:   var(--color-viridian-dark);
  --tab-light:  var(--color-viridian-light);
  --tab-shadow: var(--shadow-viridian);
  --tab-comp:   var(--color-fuchsia);
}
.tab-btn--cobalt {
  --tab-accent: var(--color-cobalt);
  --tab-dark:   var(--color-cobalt-dark);
  --tab-light:  var(--color-cobalt-light);
  --tab-shadow: var(--shadow-cobalt);
  --tab-comp:   var(--color-red);
}
.tab-btn--amethyst {
  --tab-accent: var(--color-amethyst);
  --tab-dark:   var(--color-amethyst-dark);
  --tab-light:  var(--color-amethyst-light);
  --tab-shadow: var(--shadow-amethyst);
  --tab-comp:   var(--color-orange);
}

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

.tab-btn:hover:not(.tab-btn--deferred):not(:disabled) {
  border-color: var(--tab-accent);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: -1px 1px 4px var(--tab-shadow);
}

.tab-btn--active {
  background: var(--tab-accent);
  /* C887 · the Complement law (C885): the active label wears the +3 spectrum complement of
     its suite — never the suite color of its own background. */
  color: var(--tab-comp, var(--color-board-dark));
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.55);
  border-top:    1px solid var(--tab-light);
  border-right:  1px solid var(--tab-light);
  border-bottom: 1px solid var(--tab-dark);
  border-left:   1px solid var(--tab-dark);
  box-shadow: 0 0 2px inset rgba(0, 0, 0, 0.5);
}

.tab-btn--deferred,
.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.4);
}
</style>
