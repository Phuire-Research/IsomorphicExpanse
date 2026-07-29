<script setup lang="ts">
/**
 * CadmiumPlannedQueryRenderer — Planned Query Component + Render (PQCR · C3-D2-f)
 *
 * Renders a single PlannedQuery as a multi-stage accordion. PURE render component —
 * no Muxium dispatch inside (the parent passes the query object + handles all state).
 * State updates via cadmiumUpdatePlannedQueryStage re-render this component reactively.
 *
 * LQRT (live streaming fill) is MVP-simplified: render from state on each update. No
 * streaming mechanism — incremental cadmiumUpdatePlannedQueryStage dispatches re-render
 * the component. True stage-by-stage live fill as WebSearch runs is a future concern.
 *
 * Status badge colors: pending = neutral · running = amber · complete = viridian · failed = red.
 * Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D2-f.
 */
import { ref } from 'vue';
import type { PlannedQuery, PlannedQueryStageStatus } from '../cadmium.type';

defineProps<{
  query: PlannedQuery;
}>();

// Collapsed by default; toggle on header click.
const expanded = ref<boolean>(false);

function toggleExpand(): void {
  expanded.value = !expanded.value;
}

// Status → CSS class (badge color).
function statusClass(status: PlannedQueryStageStatus): string {
  return `pq-status-${status}`;
}
</script>

<template>
  <div class="pq-card">
    <header class="pq-header" @click="toggleExpand">
      <span class="pq-expand-icon">{{ expanded ? '▾' : '▸' }}</span>
      <span class="pq-name">{{ query.name }}</span>
      <span class="pq-designation">→ {{ query.designation }}</span>
      <span :class="['pq-status-badge', statusClass(query.overallStatus)]">
        {{ query.overallStatus }}
      </span>
      <span class="pq-stage-count">{{ query.stages.length }} stage(s)</span>
    </header>

    <div v-if="expanded" class="pq-stages">
      <div
        v-for="stage in query.stages"
        :key="stage.stageIndex"
        class="pq-stage-row"
      >
        <div class="pq-stage-head">
          <span class="pq-stage-index">{{ stage.stageIndex }}</span>
          <span class="pq-stage-label">{{ stage.label }}</span>
          <span :class="['pq-status-badge', statusClass(stage.status)]">
            {{ stage.status }}
          </span>
        </div>
        <div class="pq-stage-intent">
          <span class="pq-intent-label">Intent:</span>
          <span class="pq-intent-text">{{ stage.searchIntent }}</span>
        </div>
        <pre
          v-if="stage.status === 'complete' && stage.resultMarkdown"
          class="pq-stage-result"
        >{{ stage.resultMarkdown }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pq-card {
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.pq-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background 0.15s ease;
}

.pq-header:hover {
  background: #1a1208;
}

.pq-expand-icon {
  color: #fb923c;
  font-size: 0.75rem;
  width: 0.875rem;
}

.pq-name {
  color: #fb923c;
  font-weight: 600;
}

.pq-designation {
  color: #d6d3d1;
  flex: 1;
  font-size: 0.75rem;
}

.pq-stage-count {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #a8a29e;
}

.pq-status-badge {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.pq-status-pending {
  background: #2a1a08;
  color: #a8a29e;
}

.pq-status-running {
  background: #422006;
  color: #fbbf24;
}

.pq-status-complete {
  background: #0f2a1a;
  color: #4ade80;
}

.pq-status-failed {
  background: #2a0f0f;
  color: #ef4444;
}

.pq-stages {
  border-top: 1px solid #44351a;
  padding: 0.5rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pq-stage-row {
  background: #1a1208;
  border: 1px solid #2a1a08;
  border-radius: 4px;
  padding: 0.5rem 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.pq-stage-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pq-stage-index {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  color: #fb923c;
  background: #0f0a05;
  border-radius: 3px;
  padding: 0.0625rem 0.375rem;
}

.pq-stage-label {
  color: #f5e8d8;
  flex: 1;
  font-size: 0.8125rem;
}

.pq-stage-intent {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.pq-intent-label {
  color: #fb923c;
  font-weight: 600;
  flex-shrink: 0;
}

.pq-intent-text {
  color: #d6d3d1;
}

.pq-stage-result {
  margin: 0;
  padding: 0.5rem;
  background: #0f0a05;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #d6d3d1;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 240px;
  overflow-y: auto;
}
</style>
