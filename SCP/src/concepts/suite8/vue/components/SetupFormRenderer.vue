<script setup lang="ts">
/**
 * SetupFormRenderer — focused SFSD field renderer (Macro SU · STSC inner)
 *
 * Renders each SetupField by its `type` (text | textarea | select | checkbox)
 * and two-way-binds the entered values into a parent-owned `modelValue` map
 * keyed by field.name. Pure presentation + input capture — NO Anchor knowledge,
 * NO controller, NO Muxium. The STSC (ShatteriteTomeSetup.vue) owns the values
 * and the feed-until-depleted submit.
 *
 * BUILD-VS-REUSE: a focused renderer is BUILT (not FormRenderer reused) because
 * no FormRenderer/FormBuilder/FormSchema component exists in this template SCP
 * (grep returned zero · S1 inventory "No generic input-fields component exists").
 * This is the minimal field switch the SFSD needs — not a form library.
 *
 * Citation: EPOCH-SR-S1-RED-CURATION.md Macro 1 (SU) Priority 1 Form Input Component
 * Citation: STRATIMUX-VUE-REFERENCE.md (Vue SFC · targeted state, no global bridge)
 */
import type { SetupFieldSchema } from '../../setupFieldSchema.type';
import ScsInput from '../../../vue/components/ScsInput.vue';
import ScsTextarea from '../../../vue/components/ScsTextarea.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

interface Props {
  // The schema to render.
  fields: SetupFieldSchema;
  // Parent-owned values map (field.name → entered string). v-model:modelValue.
  modelValue: Record<string, string>;
  // Disables every input while a submit pass is in flight.
  disabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
}>();

// Single setter — clones the parent map, overwrites one key, emits back.
// Avoids mutating the prop (Vue one-way-data-flow discipline).
function setField(name: string, value: string): void {
  emit('update:modelValue', { ...props.modelValue, [name]: value });
}

// checkbox carries 'true'/'false' as a string (SetupField.default is string-typed).
function isChecked(name: string): boolean {
  return props.modelValue[name] === 'true';
}

// SB-DS6 · a select field's string options mapped to the ScsDropdown {value,label} shape
// (value === label === option). Rebuilt per-field render from field.options.
function selectOptions(options: string[] | undefined): { value: string; label: string }[] {
  return (options ?? []).map((opt) => ({ value: opt, label: opt }));
}
</script>

<template>
  <div class="setup-form-renderer">
    <div v-for="field in fields" :key="field.name" class="setup-field">
      <label class="setup-field-label" :for="`setup-field-${field.name}`">
        {{ field.label }}
      </label>

      <!-- text -->
      <ScsInput
        v-if="field.type === 'text'"
        :id="`setup-field-${field.name}`"
        class="setup-field-input"
        type="text"
        :disabled="disabled"
        :model-value="modelValue[field.name] ?? ''"
        @update:model-value="setField(field.name, $event ?? '')"
      />

      <!-- textarea -->
      <ScsTextarea
        v-else-if="field.type === 'textarea'"
        :id="`setup-field-${field.name}`"
        class="setup-field-textarea"
        rows="3"
        :disabled="disabled"
        :model-value="modelValue[field.name] ?? ''"
        @update:model-value="setField(field.name, $event ?? '')"
      />

      <!-- select -->
      <ScsDropdown
        v-else-if="field.type === 'select'"
        class="setup-field-select"
        :disabled="disabled"
        :options="selectOptions(field.options)"
        :model-value="modelValue[field.name] ?? ''"
        @update:model-value="setField(field.name, $event ?? '')"
      />

      <!-- checkbox -->
      <label
        v-else-if="field.type === 'checkbox'"
        class="setup-field-checkbox-wrap"
        :for="`setup-field-${field.name}`"
      >
        <input
          :id="`setup-field-${field.name}`"
          class="setup-field-checkbox"
          type="checkbox"
          :disabled="disabled"
          :checked="isChecked(field.name)"
          @change="setField(field.name, ($event.target as HTMLInputElement).checked ? 'true' : 'false')"
        />
        <span class="setup-field-checkbox-text">{{ field.label }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.setup-form-renderer {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.setup-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.setup-field-label {
  color: #fb923c;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.setup-field-input,
.setup-field-textarea,
/* SB-DS6 · ScsDropdown replaces the native <select>; the trigger carries this class via $attrs
   and owns its own chrome. Full-width field sizing + amber open-state accent. ScsDropdown's own
   :disabled trigger styling covers the disabled state. */
.setup-field-select {
  display: block;
  width: 100%;
  --dropdown-accent: #fb923c;
}

.setup-field-textarea {
  resize: vertical;
  font-family: 'SF Mono', Monaco, monospace;
}

.setup-field-input:focus,
.setup-field-textarea:focus {
  outline: none;
  border-color: #fb923c;
}

.setup-field-input:disabled,
.setup-field-textarea:disabled,
.setup-field-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setup-field-checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.setup-field-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #f97316;
  cursor: pointer;
}

.setup-field-checkbox-text {
  color: #f5e8d8;
  font-size: 0.8125rem;
}
</style>
