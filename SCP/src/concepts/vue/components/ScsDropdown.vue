<script setup lang="ts">
/**
 * ScsDropdown — SCS-Enabled In-DOM Selection Control (the Offscreen-Safe Dropdown)
 *
 * The SCS-canonized replacement for a `<select>`. Sibling to ScsInput (the custom-caret
 * text input) — both exist because the SCP surface renders OFFSCREEN.
 *
 * THE OFFSCREEN CAVEAT: the SCP page renders offscreen (electronWindow · offscreen:true) →
 * texture → presenter. A native `<select>` popup is OS-drawn chrome anchored to a real
 * window handle — on an offscreen surface there is NO window for it to anchor to, so the
 * popup can NEVER open. This control renders WHOLLY in-DOM (a trigger button + a `v-if`
 * drawer painted into the page's own DOM), so it composes with the offscreen post-processing
 * pipe exactly like the rest of the page — nothing is OS-anchored.
 *
 * CLOSE-WITHOUT-CHANGE: Escape and outside-click collapse the drawer WITHOUT mutating the
 * selection (a `document` mousedown listener is attached only while OPEN and detached on
 * close / unmount). Only a row click emits `update:modelValue`. Keyboard: Enter/Space on the
 * trigger toggles the drawer.
 *
 * ATTRS-TO-TRIGGER-FALLTHROUGH (S2 · mirrors ScsInput): `inheritAttrs: false` +
 * `v-bind="$attrs"` on the trigger `<button>` (NOT the wrapper) — class/style/native attrs
 * land on the interactive element.
 *
 * Citation: SB-DS6 Offscreen UI Doctrine (Cascades/8_SUITES/SCS Bridge/Skills/
 * SB-DS6-Offscreen-UI-Doctrine/Skill.md) · the in-DOM solutions family.
 */
import { onBeforeUnmount, ref } from 'vue';

interface DropdownOption {
  value: string;
  label: string;
  hint?: string;
  title?: string;
}

interface Props {
  options: DropdownOption[];
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), { placeholder: 'Select…' });
const model = defineModel<string>();

defineOptions({ inheritAttrs: false });

const open = ref(false);
const wrapEl = ref<HTMLElement | null>(null);
// C649 · THE MEASURED DRAWER — a fixed cap cannot save a down-anchored drawer whose trigger
// sits near the viewport bottom (options land past the screen · out of selection range).
// Measure at OPEN: clamp the height to the available space; DROP UP when below is too tight.
const dropUp = ref(false);
const drawerStyle = ref<Record<string, string>>({});

// The current option (for the trigger label). Falls back to the placeholder when the
// model does not match any option (e.g. unset).
const currentLabel = (): string =>
  props.options.find((o) => o.value === model.value)?.label ?? props.placeholder;

// Outside-click close (attached while OPEN only). A mousedown outside the wrapper
// collapses the drawer WITHOUT changing the selection.
function onOutside(e: MouseEvent): void {
  const wrap = wrapEl.value;
  if (wrap && !wrap.contains(e.target as Node)) {
    close();
  }
}

function open_(): void {
  if (open.value) return;
  if (typeof window !== 'undefined' && wrapEl.value) {
    const rect = wrapEl.value.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    dropUp.value = below < 140 && above > below;
    const space = dropUp.value ? above : below;
    drawerStyle.value = { maxHeight: `${Math.max(100, Math.min(180, space))}px` };
  }
  open.value = true;
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', onOutside);
  }
}

function close(): void {
  if (!open.value) return;
  open.value = false;
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', onOutside);
  }
}

function toggle(): void {
  if (open.value) {
    close();
  } else {
    open_();
  }
}

// Enter/Space on the trigger toggles the drawer.
function onTriggerKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'Escape') {
    close();
  }
}

// Row click → set selection → emit → close. Escape / outside-click close do NOT reach here,
// so they never mutate the selection.
function select(value: string): void {
  model.value = value;
  close();
}
</script>

<template>
  <div ref="wrapEl" class="scs-dropdown-wrap">
    <button
      type="button"
      class="scs-dropdown-trigger"
      :class="{ 'is-open': open }"
      v-bind="$attrs"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="scs-dropdown-trigger-label">{{ currentLabel() }}</span>
      <span class="scs-dropdown-chevron" :class="{ 'is-open': open }">▸</span>
    </button>

    <div v-if="open" class="scs-dropdown-drawer" :class="{ 'drop-up': dropUp }" :style="drawerStyle" role="listbox">
      <button
        v-for="o in props.options"
        :key="o.value"
        type="button"
        class="scs-dropdown-row"
        :class="{ active: model === o.value }"
        :title="o.title"
        role="option"
        :aria-selected="model === o.value"
        @click="select(o.value)"
      >
        <span class="scs-dropdown-row-label">{{ o.label }}</span>
        <span v-if="o.hint" class="scs-dropdown-row-hint">{{ o.hint }}</span>
        <span v-if="model === o.value" class="scs-dropdown-row-check" aria-hidden="true">✓</span>
      </button>
    </div>
  </div>
</template>

<!-- UNSCOPED INLINE — the .scs-dropdown-* identity is compiled INTO this component's own CSS
     chunk (Vite attributes inline SFC styles to the component, NOT the shared entry) so it
     travels WITH the component and renders wherever it mounts, with NO dependency on the global
     style.css / entry main-*.css. UNSCOPED is REQUIRED: the trigger is reached via
     v-bind="$attrs" and carries call-site classes; the family matches the ScsInput precedent
     (its .scs-input-field block is likewise unscoped-inline). -->
<style>
.scs-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.35rem;
  padding: 0.4rem 0.6rem;
  transition: border-color 0.2s ease;
  cursor: pointer;
  --dropdown-accent: var(--color-pewter, rgba(255, 255, 255, 0.45));
}
.scs-dropdown-trigger:hover {
  border-color: rgba(255, 255, 255, 0.32);
}
.scs-dropdown-trigger.is-open {
  border-color: var(--dropdown-accent, var(--color-pewter, rgba(255, 255, 255, 0.45)));
}
.scs-dropdown-trigger:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.scs-dropdown-trigger-label {
  flex: 1 1 auto;
  text-align: left;
}
.scs-dropdown-chevron {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.6);
}
.scs-dropdown-chevron.is-open {
  transform: rotate(90deg);
}
.scs-dropdown-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100%;
  /* C647 · THE SHORT SCROLL (user law): the drawer caps at a SHORT distance and scrolls —
     a long roster must never run off past the viewport beneath a low-anchored trigger
     (the Shield panel rides just above the taskbar). */
  max-height: 180px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  padding: 6px;
  border-radius: 6px;
  background: radial-gradient(
    ellipse at 15% 25%,
    var(--color-board-elevated, rgba(34, 34, 40, 1)) 0%,
    var(--color-board-dark, rgba(15, 15, 26, 1)) 80%
  );
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
.scs-dropdown-drawer.drop-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 4px;
}
.scs-dropdown-drawer::-webkit-scrollbar {
  width: 4px;
}
.scs-dropdown-drawer::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
.scs-dropdown-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 0.35rem;
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--font-mono, monospace);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}
.scs-dropdown-row:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.2);
}
.scs-dropdown-row.active {
  border-color: var(--color-pewter, rgba(255, 255, 255, 0.45));
  background: rgba(255, 255, 255, 0.06);
}
.scs-dropdown-row-label {
  flex: 1 1 auto;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.9);
}
.scs-dropdown-row-hint {
  font-size: 0.58rem;
  letter-spacing: 0.03em;
  color: var(--color-pewter, rgba(255, 255, 255, 0.5));
}
.scs-dropdown-row-check {
  font-size: 0.62rem;
  color: var(--color-pewter, rgba(255, 255, 255, 0.7));
}
</style>

<style scoped>
.scs-dropdown-wrap {
  position: relative;
  display: inline-block;
}
</style>
