<script setup lang="ts">
/**
 * IsomorphicExpanse Component SubPage (CPLD · Band A-6 HCD)
 *
 * Component Plurality Live Doc. Docs + a LIVE example of what is usable once the
 * IsomorphicExpanse concept is muxified — it plugs into the `isomorphicExpanses` Record BY Key (Name).
 * The user selects any registered IsomorphicExpanseEntry Key (Name); the selection scopes the
 * PFGD pre-filtered session list (IsomorphicExpanseSessionList · A-5) to that Name, while the
 * ODSS spawn control (IsomorphicExpanseOnDemand · A-4) hosts the spawn + first-message unit.
 * A foundation that expands on release.
 *
 * Diametric mirror of SuiteCascade's CPLD (Component-Page-as-Plurality-and-Cascade-
 * Mirror · Master Diamond §5 Diameter 3): the SAME Name keys a cascade context in
 * SuiteCascade's CPLD — the visual Conference seed.
 *
 * Wiring:
 *   - IsomorphicExpanseOnDemand (ODSS · A-4) = self-init island, NO props. Hosts spawn + send.
 *   - IsomorphicExpanseSessionList (PFGD · A-5) = self-init island, `isomorphicExpanseName` prop. Receives
 *     the selected roster entry's Name → pre-filters the session list to it.
 *
 * Citation: SuiteCascadeComponentSubPage.vue (props-driven CPLD bearing · B-6).
 * Citation: IsomorphicExpanseOnDemand.vue (ODSS · A-4) · IsomorphicExpanseSessionList.vue (PFGD · A-5).
 * Citation: MASTER-DIAMOND-ISOMORPHICEXPANSE-CONCEPT-ASPIRANT.md §3 (CPLD) + §5 Diameter 3.
 */
import { ref, computed, watch } from 'vue';
import type { IsomorphicExpanseEntry } from '../../isomorphicExpanse.type';
import IsomorphicExpanseOnDemand from './IsomorphicExpanseOnDemand.vue';
import IsomorphicExpanseSessionList from './IsomorphicExpanseSessionList.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

const props = defineProps<{
  isomorphicExpanses: Record<string, IsomorphicExpanseEntry>;
}>();

// The plurality — every registered Key (Name) is a selectable Suite 8 context.
const isomorphicExpanseKeys = computed<string[]>(() => Object.keys(props.isomorphicExpanses));
// SB-DS6 · registered keys mapped to the ScsDropdown {value,label} shape (value === label === key).
const isomorphicExpanseKeyOptions = computed(() => isomorphicExpanseKeys.value.map((k) => ({ value: k, label: k })));

const selectedKey = ref<string>('');

// Keep the selected Key valid as the Record fills in (default to the first Key).
watch(
  isomorphicExpanseKeys,
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

const selectedEntry = computed<IsomorphicExpanseEntry | null>(() =>
  selectedKey.value ? props.isomorphicExpanses[selectedKey.value] ?? null : null,
);

// The selected entry's Name IS the PFGD filter predicate handed to the SessionList.
const selectedIsomorphicExpanseName = computed<string>(() => selectedEntry.value?.name ?? '');
</script>

<template>
  <section class="isomorphicExpanse-component-subpage">
    <div class="cpld-doc hifi-pane-viridian">
      <h2 class="hifi-heading">Component · Plurality Live Doc (CPLD)</h2>
      <p class="cpld-description">
        The IsomorphicExpanse concept plugs into the <strong>isomorphicExpanses</strong> Record
        <strong>by Key (Name)</strong>. Select a registered Suite 8 below to scope the
        live <strong>ODSS</strong> spawn control and the <strong>PFGD</strong> pre-filtered
        session list to that Name. This is the same component shape SuiteCascade mirrors by
        the same Name (the Conference seed). A foundation that expands on release.
      </p>
      <div class="cpld-selector">
        <label class="hifi-label">Suite 8 Key</label>
        <ScsDropdown
          v-model="selectedKey"
          :options="isomorphicExpanseKeyOptions"
          :placeholder="isomorphicExpanseKeys.length === 0 ? '(no Suite 8 registered)' : 'Select a Suite 8…'"
          :disabled="isomorphicExpanseKeys.length === 0"
          class="cpld-key-select"
        />
      </div>
    </div>

    <div v-if="selectedEntry" class="cpld-live">
      <div class="cpld-live-block">
        <span class="hifi-label cpld-block-label">ODSS · On-Demand Spawn + First Message (A-4)</span>
        <IsomorphicExpanseOnDemand />
      </div>

      <div class="cpld-live-block">
        <span class="hifi-label cpld-block-label">PFGD · Pre-Filtered Session List (A-5)</span>
        <IsomorphicExpanseSessionList :isomorphicExpanse-name="selectedIsomorphicExpanseName" />
      </div>
    </div>

    <div v-else class="cpld-empty hifi-pane-base">
      <span class="hifi-label">No Suite 8 registered yet. The MPRF registration Principle seeds the roster at boot.</span>
    </div>
  </section>
</template>

<style scoped>
.isomorphicExpanse-component-subpage {
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
