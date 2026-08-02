<script setup lang="ts">
/**
 * FrontierCircuitTest Component SubPage (CPLD · Band A-6 HCD)
 *
 * Component Plurality Live Doc. Docs + a LIVE example of what is usable once the
 * FrontierCircuitTest concept is muxified — it plugs into the `frontierCircuitTests` Record BY Key (Name).
 * The user selects any registered FrontierCircuitTestEntry Key (Name); the selection scopes the
 * PFGD pre-filtered session list (FrontierCircuitTestSessionList · A-5) to that Name, while the
 * ODSS spawn control (FrontierCircuitTestOnDemand · A-4) hosts the spawn + first-message unit.
 * A foundation that expands on release.
 *
 * Diametric mirror of SuiteCascade's CPLD (Component-Page-as-Plurality-and-Cascade-
 * Mirror · Master Diamond §5 Diameter 3): the SAME Name keys a cascade context in
 * SuiteCascade's CPLD — the visual Conference seed.
 *
 * Wiring:
 *   - FrontierCircuitTestOnDemand (ODSS · A-4) = self-init island, NO props. Hosts spawn + send.
 *   - FrontierCircuitTestSessionList (PFGD · A-5) = self-init island, `frontierCircuitTestName` prop. Receives
 *     the selected roster entry's Name → pre-filters the session list to it.
 *
 * Citation: SuiteCascadeComponentSubPage.vue (props-driven CPLD bearing · B-6).
 * Citation: FrontierCircuitTestOnDemand.vue (ODSS · A-4) · FrontierCircuitTestSessionList.vue (PFGD · A-5).
 * Citation: MASTER-DIAMOND-FRONTIERCIRCUITTEST-CONCEPT-ASPIRANT.md §3 (CPLD) + §5 Diameter 3.
 */
import { ref, computed, watch } from 'vue';
import type { FrontierCircuitTestEntry } from '../../frontierCircuitTest.type';
import FrontierCircuitTestOnDemand from './FrontierCircuitTestOnDemand.vue';
import FrontierCircuitTestSessionList from './FrontierCircuitTestSessionList.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

const props = defineProps<{
  frontierCircuitTests: Record<string, FrontierCircuitTestEntry>;
}>();

// The plurality — every registered Key (Name) is a selectable Suite 8 context.
const frontierCircuitTestKeys = computed<string[]>(() => Object.keys(props.frontierCircuitTests));
// SB-DS6 · registered keys mapped to the ScsDropdown {value,label} shape (value === label === key).
const frontierCircuitTestKeyOptions = computed(() => frontierCircuitTestKeys.value.map((k) => ({ value: k, label: k })));

const selectedKey = ref<string>('');

// Keep the selected Key valid as the Record fills in (default to the first Key).
watch(
  frontierCircuitTestKeys,
  (keys) => {
    if (keys.length === 0) {
      selectedKey.value = '';
      return;
    }
    if (!keys.includes(selectedKey.value)) {
      selectedKey.value = keys[0];
    }
  },
  { immediate: true },
);

const selectedEntry = computed<FrontierCircuitTestEntry | null>(() =>
  selectedKey.value ? props.frontierCircuitTests[selectedKey.value] ?? null : null,
);

// The selected entry's Name IS the PFGD filter predicate handed to the SessionList.
const selectedFrontierCircuitTestName = computed<string>(() => selectedEntry.value?.name ?? '');
</script>

<template>
  <section class="frontierCircuitTest-component-subpage">
    <div class="cpld-doc hifi-pane-viridian">
      <h2 class="hifi-heading">Component · Plurality Live Doc (CPLD)</h2>
      <p class="cpld-description">
        The FrontierCircuitTest concept plugs into the <strong>frontierCircuitTests</strong> Record
        <strong>by Key (Name)</strong>. Select a registered Suite 8 below to scope the
        live <strong>ODSS</strong> spawn control and the <strong>PFGD</strong> pre-filtered
        session list to that Name. This is the same component shape SuiteCascade mirrors by
        the same Name (the Conference seed). A foundation that expands on release.
      </p>
      <div class="cpld-selector">
        <label class="hifi-label">Suite 8 Key</label>
        <ScsDropdown
          v-model="selectedKey"
          :options="frontierCircuitTestKeyOptions"
          :placeholder="frontierCircuitTestKeys.length === 0 ? '(no Suite 8 registered)' : 'Select a Suite 8…'"
          :disabled="frontierCircuitTestKeys.length === 0"
          class="cpld-key-select"
        />
      </div>
    </div>

    <div v-if="selectedEntry" class="cpld-live">
      <div class="cpld-live-block">
        <span class="hifi-label cpld-block-label">ODSS · On-Demand Spawn + First Message (A-4)</span>
        <FrontierCircuitTestOnDemand />
      </div>

      <div class="cpld-live-block">
        <span class="hifi-label cpld-block-label">PFGD · Pre-Filtered Session List (A-5)</span>
        <FrontierCircuitTestSessionList :frontierCircuitTest-name="selectedFrontierCircuitTestName" />
      </div>
    </div>

    <div v-else class="cpld-empty hifi-pane-base">
      <span class="hifi-label">No Suite 8 registered yet. The MPRF registration Principle seeds the roster at boot.</span>
    </div>
  </section>
</template>

<style scoped>
.frontierCircuitTest-component-subpage {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cpld-doc {
  border-radius: 8px;
  padding: 1.5rem;
}

.cpld-doc h2 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
}

.cpld-description {
  color: rgba(220, 220, 220, 0.75);
  font-size: 0.85rem;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.cpld-description strong {
  color: rgba(255, 255, 255, 0.92);
}

.cpld-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* SB-DS6 · ScsDropdown replaces the native key <select>; the trigger carries this class via
   $attrs and owns its own chrome. Preserve the min-width sizing + viridian open-state accent. */
.cpld-key-select {
  min-width: 200px;
  --dropdown-accent: var(--color-viridian, #2dd4bf);
}

.cpld-live {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cpld-live-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cpld-block-label {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(200, 200, 200, 0.5);
}

.cpld-empty {
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}
</style>
