<script setup lang="ts">
/**
 * ScsTextarea — SCS-Enabled Multi-Line Textarea (Build #648)
 *
 * The SCS-canonized replacement for any `<textarea>`.
 *
 * BLOCK CURSOR — the Mirror-Tail (Build #648): the literal `|`-in-value hack is
 * RETIRED. While focused, a `pointer-events:none` `aria-hidden` mirror
 * (`.scs-cursor-mirror`, `white-space:pre-wrap`) co-flows inside the `position:relative`
 * wrap, reproducing the textarea's text so a trailing block span (`.scs-cursor-block`)
 * lands at the text-END by inline LAYOUT — NO pixel measurement (END-PINNED, FORK 2).
 * An End-Sentinel zero-width space sits BEFORE the block so a value ending in `\n`
 * shows the block on the new empty last line. The real `<textarea>` keeps native
 * value/validation/selection; its text is transparent while focused (`.is-mirrored`)
 * + the kept `caret-color:transparent`. On blur the mirror unmounts.
 *
 * CROSS-FONT ALIGNMENT: `copyMirrorMetrics()` copies the real element's COMPUTED
 * typography at focus (handles call-site font overrides e.g. cadmium `.vqis-textarea`
 * sans-serif — the regression canary) — NOT a static class. Scroll-Track slaves both
 * `scrollTop` (vertical overflow) and `scrollLeft` to the real element.
 *
 * ATTRS-TO-INNER-FALLTHROUGH (S2): `inheritAttrs: false` + `v-bind="$attrs"` on the
 * inner `<textarea>` — class/style/listeners/native attrs (rows/resize/disabled/...)
 * all land on the real element.
 *
 * Citation: SCS-BLOCK-CURSOR-S3-YELLOW.md §1.5 (textarea deltas) · §4.3 (End-Sentinel).
 */
import { ref } from 'vue';

const model = defineModel<string>();

defineOptions({ inheritAttrs: false });

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const focused = ref(false);

// The mirror content: textarea is never a password → always the real model text.
// Length-and-metric-faithful so inline layout pins the trailing block span at the
// true text-end (last line's end, multi-line fine).
const mirrorText = (): string => model.value ?? '';

// the Scroll-Track Diameter: slave BOTH the mirror's vertical (scrollTop) and
// horizontal (scrollLeft) scroll to the real textarea so the block rides the visible
// text-end under overflow.
const scrollX = ref(0);
const scrollY = ref(0);
const onScrollSync = (): void => {
  scrollX.value = textareaRef.value?.scrollLeft ?? 0;
  scrollY.value = textareaRef.value?.scrollTop ?? 0;
};

// Copy the real element's COMPUTED typography onto the mirror so it aligns under a
// call-site font override (e.g. cadmium .vqis-textarea sans-serif). NOT a static class.
const mirrorStyle = ref<Record<string, string>>({});
const copyMirrorMetrics = (): void => {
  const el = textareaRef.value;
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

const onFocus = (): void => { focused.value = true; copyMirrorMetrics(); };
const onBlur = (): void => { focused.value = false; };
const onInput = (e: Event): void => {
  model.value = (e.target as HTMLTextAreaElement).value; // plain passthrough — no strip
  onScrollSync();
};

defineExpose({
  focus: () => textareaRef.value?.focus(),
  select: () => textareaRef.value?.select(),
  blur: () => textareaRef.value?.blur(),
  textareaEl: textareaRef,
});
</script>

<template>
  <span class="scs-textarea-wrap" :class="{ 'is-mirrored': focused }">
    <textarea
      ref="textareaRef"
      class="scs-input-field scs-input-field--textarea"
      v-bind="$attrs"
      :value="model"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
      @scroll="onScrollSync"
    />
    <span
      v-if="focused"
      class="scs-cursor-mirror"
      aria-hidden="true"
      :style="{ ...mirrorStyle, transform: `translate(${-scrollX}px, ${-scrollY}px)` }"
    >{{ mirrorText() }}<span class="scs-cursor-sentinel">&#8203;</span><span class="scs-cursor-block"></span></span>
  </span>
</template>

<!-- UNSCOPED INLINE — the .scs-input-field / .scs-cursor-* / .is-mirrored identity is
     compiled INTO this component's own CSS chunk (Vite attributes inline SFC styles to the
     component, NOT the shared entry) so it travels WITH the component and renders wherever it
     mounts, with NO dependency on the global style.css / entry main-*.css. UNSCOPED is REQUIRED:
     the inner <textarea> is reached via v-bind="$attrs" and carries NO scopeId, so a scoped block
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
.scs-textarea-wrap {
  position: relative;
  display: block;
  width: 100%;
}
</style>
