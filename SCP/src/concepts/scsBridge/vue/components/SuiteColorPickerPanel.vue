<script setup lang="ts">
/**
 * SuiteColorPickerPanel.vue — WIRE.2 · the constrained in-DOM canvas color picker.
 *
 * Ported from SCP_ORIGIN `src/components/SuiteColorPickerPanel.vue` (Pewter hand-off Item 2).
 * A hue-strip canvas (band-clamped via tToHue — the hue can never leave the suite's band) +
 * a saturation/lightness square canvas. NO native <input type="color"> dialog → renders in the
 * page's own DOM flow → composited by the SAME Electron offscreen GLSL pipe as the rest of the
 * page (resolves the off-screen catch · hand-off Item 3). Decoupled: modelValue (hex) in /
 * update:modelValue (hex) out — drops into the existing onColorChange → applySuiteColorOverrides
 * flow. Adapted to SCP patterns: plain CSS (no Tailwind), our SpectrumName, no hexToColorName.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { SpectrumName } from '../../../../model/suiteColorOverride.model';
import {
  hexToRgb,
  rgbToHsl,
  hslToHex,
  SUITE_HUE_BANDS,
  tToHue,
  hueToT,
  type HueBand,
} from '../../../../model/suiteColorPickerBands.model';

const props = defineProps<{
  suite: SpectrumName;
  modelValue: string;
  defaultColor: string;
  hasCustomColor: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [hex: string];
  reset: [];
  close: [];
}>();

const panelRef = ref<HTMLDivElement | null>(null);
const hueCanvasRef = ref<HTMLCanvasElement | null>(null);
const slCanvasRef = ref<HTMLCanvasElement | null>(null);

const currentHue = ref(0);
const currentSat = ref(100);
const currentLit = ref(50);

const hueBand = computed<HueBand | null>(() => SUITE_HUE_BANDS[props.suite]);
const isBase = computed(() => props.suite === 'base');
const currentHex = computed(() =>
  isBase.value ? hslToHex(0, 0, currentLit.value) : hslToHex(currentHue.value, currentSat.value, currentLit.value),
);

const HUE_STRIP_HEIGHT = 24;
const SL_CANVAS_HEIGHT = 140;

let isDraggingHue = false;
let isDraggingSL = false;

function decomposeHex(hex: string): void {
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (isBase.value) {
    currentLit.value = hsl.l;
    currentSat.value = 0;
    currentHue.value = 0;
  } else {
    currentHue.value = hsl.h;
    currentSat.value = hsl.s;
    currentLit.value = hsl.l;
  }
}

watch(
  () => props.modelValue,
  (hex) => {
    if (!isDraggingHue && !isDraggingSL) decomposeHex(hex);
  },
  { immediate: true },
);

watch(currentHue, () => {
  drawSLCanvas();
});

function emitColor(): void {
  emit('update:modelValue', currentHex.value);
}

function getDpr(): number {
  return window.devicePixelRatio || 1;
}

function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = getDpr();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.scale(dpr, dpr);
  return ctx;
}

function drawHueCanvas(): void {
  const canvas = hueCanvasRef.value;
  if (!canvas) return;
  const band = hueBand.value;
  const width = canvas.parentElement?.clientWidth ?? 300;
  const height = HUE_STRIP_HEIGHT;

  const ctx = setupCanvas(canvas, width, height);
  if (!ctx) return;

  if (isBase.value) {
    for (let x = 0; x < width; x++) {
      const l = (x / (width - 1)) * 100;
      ctx.fillStyle = `hsl(0, 0%, ${l}%)`;
      ctx.fillRect(x, 0, 1, height);
    }
    const indicatorX = (currentLit.value / 100) * (width - 1);
    drawIndicatorLine(ctx, indicatorX, height);
  } else if (band) {
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1);
      const h = tToHue(t, band);
      ctx.fillStyle = `hsl(${h}, 100%, 50%)`;
      ctx.fillRect(x, 0, 1, height);
    }
    const t = hueToT(currentHue.value, band);
    const indicatorX = t * (width - 1);
    drawIndicatorLine(ctx, indicatorX, height);
  }
}

function drawIndicatorLine(ctx: CanvasRenderingContext2D, x: number, height: number): void {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 2, 0);
  ctx.lineTo(x - 2, height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 2, 0);
  ctx.lineTo(x + 2, height);
  ctx.stroke();
}

function drawSLCanvas(): void {
  const canvas = slCanvasRef.value;
  if (!canvas || isBase.value) return;
  const width = canvas.parentElement?.clientWidth ?? 300;
  const height = SL_CANVAS_HEIGHT;

  const ctx = setupCanvas(canvas, width, height);
  if (!ctx) return;

  const dpr = getDpr();
  const pw = Math.round(width * dpr);
  const ph = Math.round(height * dpr);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const imgData = ctx.createImageData(pw, ph);
  const data = imgData.data;

  for (let y = 0; y < ph; y++) {
    const l = (1 - y / (ph - 1)) * 100;
    for (let x = 0; x < pw; x++) {
      const s = (x / (pw - 1)) * 100;
      const hex = hslToHex(currentHue.value, s, l);
      const rgb = hexToRgb(hex);
      if (!rgb) continue;
      const idx = (y * pw + x) * 4;
      data[idx] = rgb.r;
      data[idx + 1] = rgb.g;
      data[idx + 2] = rgb.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = (currentSat.value / 100) * (width - 1);
  const cy = (1 - currentLit.value / 100) * (height - 1);
  drawCrosshair(ctx, cx, cy);
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
}

function getCanvasX(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
  return Math.max(0, Math.min(rect.width, clientX - rect.left));
}

function getCanvasXY(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;
  return {
    x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
  };
}

function handleHueDown(e: MouseEvent | TouchEvent): void {
  e.preventDefault();
  isDraggingHue = true;
  updateHueFromEvent(e);
  window.addEventListener('mousemove', handleHueMove);
  window.addEventListener('mouseup', handleHueUp);
  window.addEventListener('touchmove', handleHueMove, { passive: false });
  window.addEventListener('touchend', handleHueUp);
}

function handleHueMove(e: MouseEvent | TouchEvent): void {
  if (!isDraggingHue) return;
  e.preventDefault();
  updateHueFromEvent(e);
}

function handleHueUp(): void {
  isDraggingHue = false;
  window.removeEventListener('mousemove', handleHueMove);
  window.removeEventListener('mouseup', handleHueUp);
  window.removeEventListener('touchmove', handleHueMove);
  window.removeEventListener('touchend', handleHueUp);
}

function updateHueFromEvent(e: MouseEvent | TouchEvent): void {
  const canvas = hueCanvasRef.value;
  if (!canvas) return;
  const x = getCanvasX(e, canvas);
  const width = canvas.getBoundingClientRect().width;
  const t = x / (width - 1);

  if (isBase.value) {
    currentLit.value = Math.max(0, Math.min(100, t * 100));
  } else if (hueBand.value) {
    currentHue.value = tToHue(Math.max(0, Math.min(1, t)), hueBand.value);
  }
  emitColor();
  drawHueCanvas();
}

function handleSLDown(e: MouseEvent | TouchEvent): void {
  e.preventDefault();
  isDraggingSL = true;
  updateSLFromEvent(e);
  window.addEventListener('mousemove', handleSLMove);
  window.addEventListener('mouseup', handleSLUp);
  window.addEventListener('touchmove', handleSLMove, { passive: false });
  window.addEventListener('touchend', handleSLUp);
}

function handleSLMove(e: MouseEvent | TouchEvent): void {
  if (!isDraggingSL) return;
  e.preventDefault();
  updateSLFromEvent(e);
}

function handleSLUp(): void {
  isDraggingSL = false;
  window.removeEventListener('mousemove', handleSLMove);
  window.removeEventListener('mouseup', handleSLUp);
  window.removeEventListener('touchmove', handleSLMove);
  window.removeEventListener('touchend', handleSLUp);
}

function updateSLFromEvent(e: MouseEvent | TouchEvent): void {
  const canvas = slCanvasRef.value;
  if (!canvas) return;
  const { x, y } = getCanvasXY(e, canvas);
  const rect = canvas.getBoundingClientRect();
  currentSat.value = Math.max(0, Math.min(100, (x / (rect.width - 1)) * 100));
  currentLit.value = Math.max(0, Math.min(100, (1 - y / (rect.height - 1)) * 100));
  emitColor();
  drawSLCanvas();
  drawHueCanvas();
}

function handleClickOutside(e: MouseEvent): void {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    emit('close');
  }
}

function redrawAll(): void {
  drawHueCanvas();
  if (!isBase.value) drawSLCanvas();
}

onMounted(async () => {
  await nextTick();
  redrawAll();
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('resize', redrawAll);
});

onUnmounted(() => {
  handleHueUp();
  handleSLUp();
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', redrawAll);
});
</script>

<template>
  <div ref="panelRef" class="scp-picker-panel" @mousedown.stop>
    <div class="scp-picker-head">
      <span class="scp-picker-swatch" :style="{ background: currentHex }" aria-hidden="true"></span>
      <span class="scp-picker-hex">{{ currentHex }}</span>
      <button v-if="hasCustomColor" type="button" class="scp-picker-reset" @click="$emit('reset')">Reset</button>
      <button type="button" class="scp-picker-close" aria-label="Close" @click="$emit('close')">×</button>
    </div>

    <p class="scp-picker-axis-label">{{ isBase ? 'Lightness' : 'Hue' }}</p>
    <canvas
      ref="hueCanvasRef"
      class="scp-picker-canvas"
      :style="{ height: `${HUE_STRIP_HEIGHT}px` }"
      @mousedown="handleHueDown"
      @touchstart.prevent="handleHueDown"
    />

    <template v-if="!isBase">
      <p class="scp-picker-axis-label">Saturation / Lightness</p>
      <canvas
        ref="slCanvasRef"
        class="scp-picker-canvas"
        :style="{ height: `${SL_CANVAS_HEIGHT}px` }"
        @mousedown="handleSLDown"
        @touchstart.prevent="handleSLDown"
      />
    </template>
  </div>
</template>

<style scoped>
.scp-picker-panel {
  margin-top: 0.5rem;
  padding: 0.6rem;
  border-radius: 0.4rem;
  background: var(--color-board-elevated, #222228);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  border-left: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(0, 0, 0, 0.4);
  position: relative;
}
.scp-picker-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.scp-picker-swatch {
  flex: 0 0 auto;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.scp-picker-hex {
  flex: 1;
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  opacity: 0.7;
}
.scp-picker-reset,
.scp-picker-close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.2rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
}
.scp-picker-reset:hover,
.scp-picker-close:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.3);
}
.scp-picker-close {
  font-size: 0.95rem;
  line-height: 1;
  padding: 0.05rem 0.4rem;
}
.scp-picker-axis-label {
  margin: 0.4rem 0 0.2rem;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.4;
}
.scp-picker-canvas {
  display: block;
  width: 100%;
  border-radius: 0.25rem;
  cursor: crosshair;
}
</style>
