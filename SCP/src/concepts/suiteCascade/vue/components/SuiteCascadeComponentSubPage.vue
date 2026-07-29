<script setup lang="ts">
/**
 * SuiteCascade Component SubPage (CPLD · Band B-6 HCD)
 *
 * Component Plurality Live Doc. Docs + a LIVE example of the render components
 * (ACFR CascadeFiles + DOPR Diamond/Onyx pane) keyed BY the plurality — the
 * `cascades` Record by Name. A foundation that expands on release: the user
 * selects any registered cascade Key (Name) and sees its live render surface,
 * demonstrating that the SuiteCascade concept "plugs into the Record by Key".
 *
 * Diametric mirror of Suite8's CPLD (Component-Page-as-Plurality-and-Cascade-
 * Mirror · Master Diamond §5 Diameter 3): same Key shows ACFR + DOPR here.
 *
 * Citation: ScsBridgeComponentsSubPage.vue (props-driven SubPage doc + live bearing).
 * Citation: SuiteCascadeCascadeFiles.vue (ACFR B-2) · SuiteCascadeDiamondOnyxPane.vue (DOPR B-3).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §3 (CPLD) + §5 Diameter 3.
 */
import { ref, computed, watch } from 'vue';
import type { Cascade } from '../../suiteCascade.type';
import { suiteFromCascadeFilePath } from '../../model/suiteCascade.suiteDerivation';
import SuiteCascadeDiamondOnyxPane from './SuiteCascadeDiamondOnyxPane.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.

// C882 · the S8 Cascade Memory viewer — pick ANY available Suite 8 and mount its
// standardized Cascade Memory card (Suite8CascadeDocs · designation-keyed · collapsed default).
import Suite8CascadeDocs from '../../../suite8/vue/components/Suite8CascadeDocs.vue';
import { ref as vueRef, onMounted as vueOnMounted } from 'vue';

const s8Designations = vueRef<string[]>([]);
const selectedS8 = vueRef<string>('');
vueOnMounted(async () => {
  try {
    const r = await fetch('/suite8-designations');
    if (r.ok) {
      const j = (await r.json()) as { designations?: string[] };
      s8Designations.value = Array.isArray(j.designations) ? j.designations : [];
    }
  } catch { /* absent roster → the selector renders empty honestly */ }
});

const props = defineProps<{
  cascades: Record<string, Cascade>;
}>();

// C904 · GENERAL HARDWIRED — the CPLD selector is pruned; this surface IS the General
// Cascade Memory (auto-expanded, always rendered). The plurality lives on via the S8 viewer.
const selectedCascade = computed<Cascade | null>(() => props.cascades['General'] ?? null);

// C904 · the rotation pills (the C888 HiFi rotation language) for the S8 picker.
const ROT_SPECTRUM = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'fuchsia'];
function rotPill(i: number): string { return `hifi-btn-${ROT_SPECTRUM[i % 7]}`; }

// C901 · DOPR derivation — THE ACTIVE POINTER WINS: activeCascadeFiles carries the
// pointers PLUS priors (the cycles ledger), and the old find-first classifier rendered
// whichever pair sorted first (the Hello-before-Lorem field wound). Match the manifest's
// activeDiamond/activeOnyx path first (basename-tolerant); the classifier is the fallback
// for manifests that carry files but no pointers.
function activePointerFile(
  cascade: Cascade,
  pointerKey: 'activeDiamond' | 'activeOnyx',
  kind: 'diamond' | 'onyx',
): string | null {
  const pointer = cascade.cascadeJson?.[pointerKey];
  if (typeof pointer === 'string' && pointer.length > 0) {
    const pointerBase = pointer.split('/').pop() ?? pointer;
    const hit = cascade.activeCascadeFiles.find(
      (f) => f.filePath === pointer || (f.filePath.split('/').pop() ?? f.filePath) === pointerBase,
    );
    if (hit) return hit.markdown;
  }
  const classified = cascade.activeCascadeFiles.find(
    (f) => suiteFromCascadeFilePath(f.filePath) === kind,
  );
  return classified ? classified.markdown : null;
}

const diamondContent = computed<string | null>(() => {
  const cascade = selectedCascade.value;
  return cascade ? activePointerFile(cascade, 'activeDiamond', 'diamond') : null;
});

const onyxContent = computed<string | null>(() => {
  const cascade = selectedCascade.value;
  return cascade ? activePointerFile(cascade, 'activeOnyx', 'onyx') : null;
});
</script>

<template>
  <section class="suitecascade-component-subpage">
    <!-- C904 · SUITE 8 CASCADE MEMORY leads — the rotating HiFi pills (C888 language). -->
    <div class="s8mem hifi-pane-viridian">
      <h2 class="hifi-heading">Suite 8 · Cascade Memory</h2>
      <p class="cpld-description">
        Select an available Suite 8 to view its specific Cascade Memory — the same
        standardized card every Suite 8 page carries.
      </p>
      <div class="s8mem-picker">
        <button
          v-for="(n, i) in s8Designations"
          :key="n"
          type="button"
          :class="['hifi-btn', rotPill(i), 's8mem-btn', `rot-${(i % 7) + 1}`, { active: selectedS8 === n }]"
          @click="selectedS8 = selectedS8 === n ? '' : n"
        >{{ n }}</button>
        <p v-if="s8Designations.length === 0" class="cpld-description">(no Suite 8s found)</p>
      </div>
      <Suite8CascadeDocs v-if="selectedS8" :key="selectedS8" :designation="selectedS8" />
    </div>

    <!-- C904 · GENERAL CASCADE MEMORY — auto-expanded (always rendered · CPLD + ACFR pruned). -->
    <div class="genmem hifi-pane-cobalt">
      <h2 class="hifi-heading">General Cascade Memory</h2>
      <SuiteCascadeDiamondOnyxPane
        v-if="selectedCascade"
        :diamond-content="diamondContent"
        :onyx-content="onyxContent"
      />
      <div v-else class="cpld-empty hifi-pane-base">
        <span class="hifi-label">No General cascade yet — the General Watcher populates it at boot; a founding pair renders here the moment it lands.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.suitecascade-component-subpage {
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
   $attrs and owns its own chrome. Preserve the min-width sizing + cobalt open-state accent. */
.cpld-key-select {
  min-width: 200px;
  --dropdown-accent: var(--color-cobalt, #3b82f6);
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

/* C882 · the S8 memory picker */
.s8mem { border-radius: 8px; padding: 0.75rem; margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.s8mem-picker { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.s8mem-btn {
  appearance: none; cursor: pointer; font: inherit; color: inherit;
  padding: 0.3rem 0.65rem; border-radius: 6px;
  background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.14);
}
.s8mem-btn:hover { border-color: rgba(234, 179, 8, 0.35); }
.s8mem-btn.active { border-color: var(--color-green, #34d399); background: rgba(52, 211, 153, 0.1); }

/* C904 · the rotation identities + the C885 complement selection on the S8 pills. */
.s8mem-btn.rot-1 { --rot: var(--color-red); --rot-comp: var(--color-green); }
.s8mem-btn.rot-2 { --rot: var(--color-orange); --rot-comp: var(--color-blue); }
.s8mem-btn.rot-3 { --rot: var(--color-yellow); --rot-comp: var(--color-purple); }
.s8mem-btn.rot-4 { --rot: var(--color-green); --rot-comp: var(--color-fuchsia); }
.s8mem-btn.rot-5 { --rot: var(--color-blue); --rot-comp: var(--color-red); }
.s8mem-btn.rot-6 { --rot: var(--color-purple); --rot-comp: var(--color-orange); }
.s8mem-btn.rot-7 { --rot: var(--color-fuchsia); --rot-comp: var(--color-yellow); }
.s8mem-btn.active { outline: 2px solid var(--rot-comp); outline-offset: 1px; }
.genmem { border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
</style>
