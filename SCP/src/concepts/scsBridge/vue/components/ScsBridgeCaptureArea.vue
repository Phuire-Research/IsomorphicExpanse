<script setup lang="ts">
/**
 * ScsBridgeCaptureArea — Rectangle Selection Overlay (D5)
 *
 * Atomic-shippable area selection surface for the scsBridge 'capture' sub-page.
 * Captures user's drag-rectangle via mousedown → mousemove (window) → mouseup
 * (window) events. Coordinates calculated as clientX/clientY minus the
 * viewport's bounding rect (more reliable than offsetX which jitters on child
 * elements). Emits 'capture-complete' event with structured payload; parent
 * (ScsBridgeLanding) dispatches the actual scsBridgeSendBridgeMessage.
 *
 * Real screenshot image capture via `getDisplayMedia` API is DEFERRED to D5.5
 * (RSCRD pattern · Real Screen Capture Replaced-Later Deferral). D5 ships
 * coord-capture + structured message dispatch.
 *
 * Pewter Tessera influence (no global tokens · inline CSS):
 * - D3 Pane Gradient: viewport background gradient
 * - D5 Embossed Border: selection rectangle borders
 * - D4 Text Shadow: coord-display label readability
 * - cursor: crosshair (semantic capture-surface indicator)
 *
 * Patterns: VDRS · VSSH · GCPD · PTOV · DSPE
 * Citation: DIAMOND-TIER-M1-A1-D5.md
 */
import { ref, computed, onUnmounted } from 'vue';

interface AreaCapturePayload {
  kind: 'area-capture';
  x: number;
  y: number;
  w: number;
  h: number;
  timestamp: number;
}

const emit = defineEmits<{
  (e: 'capture-complete', payload: AreaCapturePayload): void;
}>();

const viewportRef = ref<HTMLDivElement | null>(null);
const isSelecting = ref<boolean>(false);
const startX = ref<number>(0);
const startY = ref<number>(0);
const currentX = ref<number>(0);
const currentY = ref<number>(0);
const finalSelection = ref<{ x: number; y: number; w: number; h: number } | null>(null);

const MINIMUM_DRAG_THRESHOLD = 4;

const liveSelection = computed<{ x: number; y: number; w: number; h: number } | null>(() => {
  if (!isSelecting.value) return null;
  const x = Math.min(startX.value, currentX.value);
  const y = Math.min(startY.value, currentY.value);
  const w = Math.abs(currentX.value - startX.value);
  const h = Math.abs(currentY.value - startY.value);
  return { x, y, w, h };
});

const displayedSelection = computed<{ x: number; y: number; w: number; h: number } | null>(() => {
  return liveSelection.value ?? finalSelection.value;
});

function getViewportRelativeCoords(event: MouseEvent): { x: number; y: number } {
  if (!viewportRef.value) return { x: 0, y: 0 };
  const rect = viewportRef.value.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function handleMouseDown(event: MouseEvent) {
  if (event.button !== 0) return;
  const coords = getViewportRelativeCoords(event);
  startX.value = coords.x;
  startY.value = coords.y;
  currentX.value = coords.x;
  currentY.value = coords.y;
  isSelecting.value = true;
  finalSelection.value = null;

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(event: MouseEvent) {
  if (!isSelecting.value) return;
  const coords = getViewportRelativeCoords(event);
  currentX.value = coords.x;
  currentY.value = coords.y;
}

function handleMouseUp(event: MouseEvent) {
  if (!isSelecting.value) return;
  isSelecting.value = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);

  const live = liveSelection.value;
  if (live && (live.w >= MINIMUM_DRAG_THRESHOLD || live.h >= MINIMUM_DRAG_THRESHOLD)) {
    finalSelection.value = live;
  } else {
    finalSelection.value = null;
  }
}

function sendCapture() {
  if (!finalSelection.value) return;
  const { x, y, w, h } = finalSelection.value;
  emit('capture-complete', {
    kind: 'area-capture',
    x,
    y,
    w,
    h,
    timestamp: Date.now(),
  });
}

function resetSelection() {
  finalSelection.value = null;
}

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div class="capture-area-root">
    <div class="capture-instructions">
      <h3>Area Selection</h3>
      <p>
        Click and drag inside the viewport below to select an area. Release to commit. The
        captured coords will be dispatched to the SCS-Bridge as a structured message. Real
        screenshot image capture arrives in D5.5 (RSCRD pattern).
      </p>
    </div>

    <div
      ref="viewportRef"
      class="capture-viewport"
      @mousedown="handleMouseDown"
    >
      <div v-if="displayedSelection" class="selection-rect" :style="{
        left: `${displayedSelection.x}px`,
        top: `${displayedSelection.y}px`,
        width: `${displayedSelection.w}px`,
        height: `${displayedSelection.h}px`,
      }">
        <span class="selection-coords">
          {{ Math.round(displayedSelection.x) }}, {{ Math.round(displayedSelection.y) }}
          · {{ Math.round(displayedSelection.w) }} × {{ Math.round(displayedSelection.h) }}
        </span>
      </div>
      <div v-else class="capture-placeholder">
        Drag to select an area
      </div>
    </div>

    <div class="capture-controls">
      <button
        class="control-btn send-btn"
        :disabled="!finalSelection"
        @click="sendCapture"
      >
        Send to Bridge
      </button>
      <button
        class="control-btn reset-btn"
        :disabled="!finalSelection"
        @click="resetSelection"
      >
        Reset
      </button>
    </div>

    <div v-if="finalSelection" class="capture-result">
      <h4>Final Selection (Payload Preview)</h4>
      <pre class="result-pre">{
  "kind": "area-capture",
  "x": {{ Math.round(finalSelection.x) }},
  "y": {{ Math.round(finalSelection.y) }},
  "w": {{ Math.round(finalSelection.w) }},
  "h": {{ Math.round(finalSelection.h) }},
  "timestamp": &lt;Date.now()&gt;
}</pre>
    </div>
  </div>
</template>

<style scoped>
.capture-area-root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.capture-instructions {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 8px;
  padding: 1.25rem;
}

.capture-instructions h3 {
  color: #4ade80;
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.capture-instructions p {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.capture-viewport {
  position: relative;
  background: radial-gradient(ellipse at 87.5% 12.5%, #1f3328 0%, #0f0f1a 88%);
  border-top: 2px solid #16331f;
  border-right: 2px solid #16331f;
  border-bottom: 2px solid #5ce896;
  border-left: 2px solid #5ce896;
  box-shadow: -3px 3px 0 rgba(74, 222, 128, 0.4);
  border-radius: 6px;
  height: 320px;
  cursor: crosshair;
  user-select: none;
  overflow: hidden;
}

.capture-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-style: italic;
  font-size: 0.875rem;
  pointer-events: none;
  text-shadow: 0.5px 0.5px 0 rgba(74, 222, 128, 0.7);
}

.selection-rect {
  position: absolute;
  background: rgba(74, 222, 128, 0.12);
  border-top: 2px solid #16331f;
  border-right: 2px solid #16331f;
  border-bottom: 2px solid #5ce896;
  border-left: 2px solid #5ce896;
  box-shadow: -1px 1px 0 rgba(74, 222, 128, 0.4);
  pointer-events: none;
}

.selection-coords {
  position: absolute;
  top: -1.5rem;
  left: 0;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  color: #4ade80;
  background: #0f0f1a;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  white-space: nowrap;
  text-shadow: 0.5px 0.5px 0 rgba(74, 222, 128, 0.7);
}

.capture-controls {
  display: flex;
  gap: 0.75rem;
}

.control-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  color: white;
}

.send-btn {
  background: #4ade80;
  color: #0f0f1a;
}

.send-btn:hover:not(:disabled) {
  background: #22c55e;
}

.reset-btn {
  background: #374151;
}

.reset-btn:hover:not(:disabled) {
  background: #4b5563;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.capture-result {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 8px;
  padding: 1.25rem;
}

.capture-result h4 {
  color: #4ade80;
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-pre {
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 4px;
  padding: 0.75rem;
  color: #e5e5e5;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  margin: 0;
  white-space: pre-wrap;
}
</style>
