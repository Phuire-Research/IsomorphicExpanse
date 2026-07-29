/**
 * SFSD — Setup-Field-Schema-Definition (Macro SU · STSC input contract)
 *
 * The Vermillion-passable JSON a Suite 8 page hands the Shatterite Tome Setup
 * Component (ShatteriteTomeSetup.vue). Each field declares HOW it renders (type)
 * AND how its entered value is delivered to the page's Anchor (promptTemplate).
 *
 * Diameter: SFSD ↔ STSC — the schema is the UNLIKE Demometer to the rendered form;
 * the through-measure is the promptTemplate (a per-field SCS delivery message that
 * carries the entered value to the Anchored Instance via the FKIS send-message path).
 *
 * KeyedSelector discipline: these are PURE input types (component props + local
 * refs), NOT Stratimux state — no concept holds an SFSD as state, so no bare-optional
 * KeyedSelector hazard applies. If a future cycle promotes an SFSD to concept state,
 * the optional fields (`options`, `default`) MUST be normalized to non-optional
 * defaults at that boundary.
 *
 * Citation: EPOCH-DIAMOND-SUITE8-SETUP-RESEARCH.md §2 Macro 1 SU + §3 distinctions
 * Citation: EPOCH-SR-S1-RED-CURATION.md Macro 1 (SU) — NEW-BUILD: Field-Type Registry
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles" (Type-First Architecture)
 */

// ============================================
// FIELD TYPE REGISTRY (the renderable input kinds)
// ============================================
//
// The four input kinds the STSC renders. Kept intentionally small — a focused
// registry, not a kitchen-sink form library (FormRenderer does not exist in this
// template SCP · S1 inventory confirmed). Extend here when a page needs more.

export type SetupFieldType = 'text' | 'textarea' | 'select' | 'checkbox';

// ============================================
// SETUP FIELD (one renderable + deliverable unit)
// ============================================

export type SetupField = {
  // Stable identity for v-model keying + interpolation. Unique within an SFSD.
  name: string;
  // Human-facing label rendered above the input.
  label: string;
  // Which input kind to render (drives the SetupFormRenderer switch).
  type: SetupFieldType;
  // The per-field SCS delivery message. `{{value}}` is interpolated with the
  // entered value at submit time; the result is sent to the page's Anchor via
  // the staggered FKIS send-message path (one message per field, async-chained).
  promptTemplate: string;
  // Required ONLY for type === 'select' (the option set). Optional otherwise.
  options?: string[];
  // Initial value seeded into the field on mount (string for text/textarea/select;
  // 'true'/'false'-style truthy for checkbox — the renderer coerces).
  default?: string;
};

// ============================================
// SFSD — the full schema (an ordered array of fields)
// ============================================
//
// Order is meaningful: the STSC delivers fields to the Anchor in array order,
// staggered, until depleted ("until depleted" = the full SFSD has been sent).

export type SetupFieldSchema = SetupField[];

// ============================================
// SUBMIT RESULT (what handleSubmit reports per field)
// ============================================
//
// One entry per delivered field — the Muxistration trace of the feed-until-depleted
// pass (which message went out, whether the Anchor accepted it).

export type SetupFieldDeliveryResult = {
  name: string;
  message: string;
  ok: boolean;
  error?: string;
};
