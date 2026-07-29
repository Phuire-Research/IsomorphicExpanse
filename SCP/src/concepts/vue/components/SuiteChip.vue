<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { suiteRoles } from './suiteRoles'

const props = defineProps<{ n: number }>()

const role = computed(() => suiteRoles.find(r => r.n === props.n))
const open = ref(false)
const chipEl = ref<HTMLElement | null>(null)

function toggle() { open.value = !open.value }
function close() { open.value = false }

function handleOutside(e: MouseEvent) {
  if (chipEl.value && !chipEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutside))

const isBase = computed(() => props.n === 0)
</script>

<template>
  <span ref="chipEl" class="suite-chip-wrap" :style="{ '--chip-color': role?.colorVar }">
    <button
      type="button"
      class="suite-chip"
      :class="{ 'suite-chip--base': isBase }"
      :aria-label="`Suite ${n} — ${role?.profession}`"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="toggle"
      @keydown.escape="close"
      @mouseenter="open = true"
      @mouseleave="open = false"
    >{{ n }}</button>

    <Transition name="chip-pop">
      <div
        v-if="open && role"
        class="suite-chip-card"
        role="tooltip"
        @mouseenter="open = true"
        @mouseleave="open = false"
      >
        <div class="suite-chip-card__swatch" :style="{ background: role.colorVar }" aria-hidden="true"></div>
        <div class="suite-chip-card__body">
          <div class="suite-chip-card__number">Suite {{ role.n }}</div>
          <div class="suite-chip-card__profession">{{ role.profession }}</div>
          <div class="suite-chip-card__row">
            <span class="suite-chip-card__key">Operation</span>
            <span class="suite-chip-card__val">{{ role.operation }}</span>
          </div>
          <div class="suite-chip-card__row">
            <span class="suite-chip-card__key">Geometric</span>
            <span class="suite-chip-card__val">{{ role.geometric }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.suite-chip-wrap {
  position: relative;
  display: inline-block;
  vertical-align: middle;
}

.suite-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 0.25rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--chip-color) 60%, transparent);
  background: color-mix(in srgb, var(--chip-color) 18%, transparent);
  color: color-mix(in srgb, var(--chip-color) 90%, white 30%);
  transition: background 0.15s, border-color 0.15s;
  user-select: none;
}

.suite-chip:hover,
.suite-chip:focus-visible {
  background: color-mix(in srgb, var(--chip-color) 32%, transparent);
  border-color: color-mix(in srgb, var(--chip-color) 80%, transparent);
  outline: none;
}

.suite-chip:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--chip-color) 50%, transparent);
}

.suite-chip--base {
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.65);
}
.suite-chip--base:hover,
.suite-chip--base:focus-visible {
  background: rgba(255,255,255,0.13);
  border-color: rgba(255,255,255,0.3);
}

.suite-chip-card {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  min-width: 11rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(28, 28, 34, 0.98);
  border: 1px solid color-mix(in srgb, var(--chip-color) 35%, transparent);
  box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.3);
  pointer-events: auto;
  white-space: nowrap;
}

.suite-chip-card__swatch {
  height: 3px;
  width: 100%;
}

.suite-chip-card__body {
  padding: 0.6rem 0.75rem 0.65rem;
}

.suite-chip-card__number {
  font-family: var(--font-mono, monospace);
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--chip-color) 80%, white 20%);
  text-transform: uppercase;
  margin-bottom: 0.15rem;
}

.suite-chip-card__profession {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-bottom: 0.45rem;
  line-height: 1.2;
}

.suite-chip-card__row {
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
  margin-bottom: 0.2rem;
}

.suite-chip-card__key {
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  min-width: 4.2rem;
  flex-shrink: 0;
}

.suite-chip-card__val {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.3;
  white-space: normal;
  max-width: 9rem;
}

.chip-pop-enter-active,
.chip-pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.chip-pop-enter-from,
.chip-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
