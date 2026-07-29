<script setup lang="ts">
/**
 * CadmiumPlannedQueries — PQXC · the extracted §1 Planned-Query zone (Diamond RAR · W5)
 *
 * Relocated verbatim from CadmiumBulletin.vue §1 Planned-Queries (:110-162): the VQIS creation
 * form (DiamondScale toggle + textarea + Create) and the PQCR reactive Planned-Query list (reuses
 * CadmiumPlannedQueryRenderer, unchanged). The DiamondScale toggle (DSTS) now lives HERE — the
 * duplicate header copy in CadmiumLanding is pruned (S1 Pruning · lossy-abstraction collapse).
 *
 * Pure renderer — parent (CadmiumLanding · via CadmiumResearchFrontier) owns all state + handlers.
 * Mounted as a CHILD of CadmiumResearchFrontier (locked decision 1 boundary); its emits proxy up.
 *
 * Pewter Tessera HiFi: Suite 2 Orange. Patterns: PQXC · VQIS · DSTS/LTIP · PQCR
 * Citation: RAR-DIAMOND-WGB.md §COMPONENT CONTRACTS (PQXC) · §W5
 * Citation: CadmiumBulletin.vue:110-162 (VQIS form + PQCR list · relocated)
 */
import type { PlannedQuery, DiamondScale } from '../cadmium.type';
import CadmiumPlannedQueryRenderer from './CadmiumPlannedQueryRenderer.vue';
// SCS-Enabled textarea (#646) — replaces the raw <textarea> so the `|` end-marker is
// present at render. class/rows/placeholder flow through $attrs.
import ScsTextarea from '../../vue/components/ScsTextarea.vue';

const props = defineProps<{
  plannedQueries: PlannedQuery[];
  vqisInput: string;
  diamondScale: DiamondScale;
}>();

const emit = defineEmits<{
  'update:vqisInput': [value: string];
  createPlannedQuery: [];
  setDiamondScale: [scale: DiamondScale];
}>();
</script>

<template>
  <div class="zone-block">
    <h3 class="zone-heading">Planned Queries</h3>

    <!-- VQIS creation form (DiamondScale toggle + textarea + Create · relocated R-D2 CSMI) -->
    <div class="vqis-form">
      <div class="dsts-row">
        <span class="scale-toggle-label">Scale:</span>
        <button
          :class="['scale-btn', { active: props.diamondScale === 'initial' }]"
          title="Initial — single-query sprint"
          @click="emit('setDiamondScale', 'initial')"
        >
          Initial
        </button>
        <button
          :class="['scale-btn', { active: props.diamondScale === 'macro' }]"
          title="Macro — multi-query campaign"
          @click="emit('setDiamondScale', 'macro')"
        >
          Macro
        </button>
        <button
          :class="['scale-btn', { active: props.diamondScale === 'epoch' }]"
          title="Epoch — full research cycle"
          @click="emit('setDiamondScale', 'epoch')"
        >
          Epoch
        </button>
      </div>
      <!-- SCS owned-caret textarea (#646) — caret present at render, no auto-attach race -->
      <ScsTextarea
        :model-value="props.vqisInput"
        placeholder="Describe the research query — becomes a Planned Query stage"
        class="vqis-textarea"
        rows="2"
        @update:model-value="emit('update:vqisInput', $event)"
      />
      <div class="vqis-actions">
        <button class="vqis-create-btn" @click="emit('createPlannedQuery')">
          + Create Planned Query
        </button>
      </div>
    </div>

    <div v-if="plannedQueries.length > 0" class="pq-list">
      <CadmiumPlannedQueryRenderer
        v-for="query in plannedQueries"
        :key="query.queryId"
        :query="query"
      />
    </div>
    <p v-else class="placeholder">(no planned queries yet)</p>
  </div>
</template>

<style scoped>
.zone-block {
  margin-bottom: 1.25rem;
}

.zone-block:last-child {
  margin-bottom: 0;
}

.zone-heading {
  color: #fb923c;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.625rem;
}

.pq-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* R-D2 CSMI · VQIS creation form. */
.vqis-form {
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}

.dsts-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.scale-toggle-label {
  color: #a8a29e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 0.25rem;
}

.scale-btn {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-family: system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: #1a1208;
  color: #d6d3d1;
  border: 1px solid #44351a;
  transition: all 0.2s ease;
}

.scale-btn:hover {
  border-color: #fb923c;
}

.scale-btn.active {
  background: #f97316;
  color: #1a0f08;
  border-color: #c2410c;
}

.vqis-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  background: #1a1208;
  border: 1px solid #44351a;
  border-radius: 4px;
  color: #f5e8d8;
  font-size: 0.8125rem;
  font-family: system-ui, sans-serif;
  resize: vertical;
}

.vqis-textarea:focus {
  /* Focus outline is the global OSR default (style.css); border-color is the component cue. */
  outline: none;
  border-color: #fb923c;
}

.vqis-actions {
  display: flex;
  gap: 0.5rem;
}

.vqis-create-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: system-ui, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  background: #f97316;
  color: #1a0f08;
  border: 1px solid #c2410c;
  transition: all 0.2s ease;
}

.vqis-create-btn:hover {
  background: #fb923c;
}

.placeholder {
  color: #78716c;
  font-style: italic;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
  background: #0f0a05;
  border-radius: 4px;
  margin: 0;
}
</style>
