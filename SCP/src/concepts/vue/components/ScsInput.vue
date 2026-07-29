<script setup lang="ts">
/**
 * ScsInput — SCS-Enabled Text-Entry Input (Build #648)
 *
 * The SCS-canonized replacement for any text-entry `<input>` (type text | search |
 * url | email | password | number | tel).
 *
 * BLOCK CURSOR — the Mirror-Tail (Build #648): the literal `|`-in-value hack is
 * RETIRED. While focused, a `pointer-events:none` `aria-hidden` mirror (`.scs-cursor-mirror`)
 * co-flows inside the `position:relative` wrap, reproducing the input's text so a
 * trailing block span (`.scs-cursor-block`) lands at the text-END by inline LAYOUT —
 * NO pixel measurement (END-PINNED, FORK 2). The real `<input>` keeps native
 * value/type/validation/selection; its text is transparent while focused (`.is-mirrored`)
 * + the kept `caret-color:transparent` — only the mirror paints. On blur the mirror
 * unmounts and the real input restores its own text.
 *
 * MASK-FAITHFUL MIRROR (password-safe): `mirrorText()` returns bullets for
 * `type=password` (NEVER the plaintext in a visible/inspectable node), the real text
 * otherwise. CROSS-FONT ALIGNMENT: `copyMirrorMetrics()` copies the real element's
 * COMPUTED typography at focus (handles call-site font overrides e.g. cadmium
 * `.vqis-textarea` sans-serif) — NOT a static class.
 *
 * ATTRS-TO-INNER-FALLTHROUGH (S2): `inheritAttrs: false` + `v-bind="$attrs"` on the
 * inner `<input>` (NOT the wrapper) — class/style/listeners/native attrs all land on
 * the real element.
 *
 * Citation: SCS-BLOCK-CURSOR-S3-YELLOW.md §1-3 (the Mirror-Tail · Mask-Faithful · CSS).
 */
import { ref } from 'vue';

interface Props {
  type?: 'text' | 'search' | 'url' | 'email' | 'password' | 'number' | 'tel';
}

const props = withDefaults(defineProps<Props>(), { type: 'text' });
const model = defineModel<string>();

defineOptions({ inheritAttrs: false });

const inputRef = ref<HTMLInputElement | null>(null);
const focused = ref(false);

// The Mask-Faithful Mirror content: bullets for password (length-faithful, NEVER the
// plaintext in a visible node), the real text otherwise. Length-and-metric-faithful so
// inline layout pins the trailing block span at the true text-end.
const mirrorText = (): string =>
  props.type === 'password' ? '•'.repeat((model.value ?? '').length) : (model.value ?? '');

// C602 · THE GHOST MEASURER (the grounded rework — the textarea-caret-position pattern): the
// mirror is a MEASUREMENT REPLICA, never painted (visibility:hidden — unlike color:transparent
// it paints NOTHING: no shadows, no shader participation; the double-draw class dies). Its
// content is the text BEFORE the caret (selectionStart — THE CARET-FOLLOWING the END-PIN
// deferred); inline layout places the block at the true insertion point, and the block alone
// re-enables its own visibility (the child-override).
const caretIndex = ref(0);
const syncCaret = (): void => {
  const el = inputRef.value;
  if (!el) return;
  caretIndex.value = el.selectionStart ?? (model.value ?? '').length;
  scrollX.value = el.scrollLeft;
};
const beforeCaretText = (): string => mirrorText().slice(0, caretIndex.value);

// the Scroll-Track Diameter: slave the mirror's horizontal scroll to the real input so
// the block rides the visible text-end under horizontal overflow.
const scrollX = ref(0);
const onScrollSync = (): void => { scrollX.value = inputRef.value?.scrollLeft ?? 0; };

// Copy the real element's COMPUTED typography onto the mirror so it aligns under a
// call-site font override (e.g. cadmium .vqis-textarea sans-serif). NOT a static class.
const mirrorStyle = ref<Record<string, string>>({});
const copyMirrorMetrics = (): void => {
  const el = inputRef.value;
  if (!el) { return; }
  const cs = getComputedStyle(el);
  mirrorStyle.value = {
    fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle, letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing,
    lineHeight: cs.lineHeight, textTransform: cs.textTransform, textIndent: cs.textIndent,
    paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
    borderTopWidth: cs.borderTopWidth, borderRightWidth: cs.borderRightWidth,
    borderBottomWidth: cs.borderBottomWidth, borderLeftWidth: cs.borderLeftWidth,
    direction: cs.direction, // RTL — logical end placement is free once direction matches
  };
};

const onFocus = (): void => { focused.value = true; copyMirrorMetrics(); syncCaret(); };
const onBlur = (): void => { focused.value = false; };
const onInput = (e: Event): void => {
  model.value = (e.target as HTMLInputElement).value; // plain passthrough — no strip
  syncCaret();
};

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select(),
  blur: () => inputRef.value?.blur(),
  inputEl: inputRef,
});
</script>

<template>
  <span class="scs-input-wrap" :class="{ 'is-mirrored': focused }">
    <input
      ref="inputRef"
      class="scs-input-field"
      v-bind="$attrs"
      :type="props.type"
      :value="model"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
      @scroll="onScrollSync"
      @click="syncCaret"
      @keyup="syncCaret"
      @select="syncCaret"
    />
    <span
      v-if="focused"
      class="scs-cursor-mirror"
      aria-hidden="true"
      :style="{ ...mirrorStyle, transform: `translateX(${-scrollX}px)` }"
    >{{ beforeCaretText() }}<span class="scs-cursor-block"></span></span>
    <slot name="suffix" />
  </span>
</template>

<!-- UNSCOPED INLINE — the .scs-input-field / .scs-cursor-* / .is-mirrored identity is
     compiled INTO this component's own CSS chunk (Vite attributes inline SFC styles to the
     component, NOT the shared entry) so it travels WITH the component and renders wherever it
     mounts, with NO dependency on the global style.css / entry main-*.css. UNSCOPED is REQUIRED:
     the inner <input> is reached via v-bind="$attrs" and carries NO scopeId, so a scoped block
     would [data-v]-qualify and never match. Mirror of src/concepts/vue/components/scsInputField.css
     (the source of truth that style.css @imports for the showcase's raw class usages) — Vue dedupes
     identical injected styles. Citation: SCS-INPUT-EXPORT-DIAGNOSTIC.md (A2-as-non-self-containment). -->
<style>
.scs-input-field {
  width: 100%;
  box-sizing: border-box;
  background: radial-gradient(ellipse at 15% 25%, var(--color-board-elevated) 0%, var(--color-board-dark) 80%);
  border-top: 1px solid var(--color-board-dark);
  border-right: 1px solid var(--color-board-dark);
  border-bottom: 1px solid var(--color-board-elevated);
  border-left: 1px solid var(--color-board-elevated);
  box-shadow:
    inset 1px 1px 4px rgba(0, 0, 0, 0.5),
    inset -1px -1px 2px rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 0.625rem 0.875rem;
  color: var(--color-white-conductor);
  font-size: 0.875rem;
  font-family: var(--font-mono, 'Space Mono', monospace);
  caret-color: transparent;
  --input-accent: var(--color-cobalt);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.scs-input-field::placeholder {
  color: rgba(160, 160, 168, 0.4);
  font-style: italic;
}
.scs-input-field:focus {
  outline: none;
  border-top: 1px solid var(--input-accent);
  border-right: 1px solid var(--input-accent);
  border-bottom: 1px solid color-mix(in srgb, var(--input-accent) 50%, var(--color-board-elevated));
  border-left: 1px solid color-mix(in srgb, var(--input-accent) 50%, var(--color-board-elevated));
  box-shadow:
    inset 1px 1px 4px rgba(0, 0, 0, 0.5),
    0 0 0 1px color-mix(in srgb, var(--input-accent) 30%, transparent);
  text-shadow: 0.5px 0.5px 0 var(--color-red);
}
.scs-input-field:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.5);
}
.scs-input-field--textarea {
  resize: vertical;
  min-height: 4.5rem;
}
.scs-input-field--no-spin::-webkit-inner-spin-button,
.scs-input-field--no-spin::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.scs-input-field--no-spin {
  -moz-appearance: textfield;
  appearance: textfield;
}
.scs-input-field.is-valid {
  --input-accent: var(--color-viridian);
}
.scs-input-field.is-invalid {
  --input-accent: var(--color-maroon);
}
.scs-cursor-mirror {
  position: absolute;
  inset: 0;
  margin: 0;
  pointer-events: none;
  overflow: hidden;
  white-space: pre;
  /* C602 · THE GHOST MEASURER — visibility:hidden paints NOTHING (color:transparent still
   * painted shadows + fed the shader → the double-draw); the block child re-enables itself. */
  visibility: hidden;
  color: transparent;
  background: none;
  box-sizing: border-box;
  user-select: none;
}
.scs-textarea-wrap .scs-cursor-mirror {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.scs-cursor-block {
  display: inline-block;
  width: 1ch;
  height: 1.1em;
  vertical-align: text-bottom;
  /* C602 — the ONLY painted piece of the ghost (the visibility child-override). */
  visibility: visible;
  /* cobalt fallback — the block is a SIBLING of .scs-input-field so it does NOT inherit the
   * input's --input-accent; migrated sites (no ancestor card) would resolve it transparent →
   * invisible cursor. Lockstep with scsInputField.css. */
  background: var(--input-accent, var(--color-cobalt));
  box-shadow: 0 0 6px color-mix(in srgb, var(--input-accent, var(--color-cobalt)) 60%, transparent);
}
.scs-cursor-mirror > :not(.scs-cursor-block) { color: transparent; }
.scs-cursor-sentinel { color: transparent; }
.scs-input-wrap.is-mirrored > .scs-input-field,
.scs-textarea-wrap.is-mirrored > .scs-input-field {
  color: var(--color-white-conductor);
}
</style>

<style scoped>
.scs-input-wrap {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>
