/**
 * Pewter Tessera Concept Type Definitions (P2 · THIN-BUT-REAL · client-only)
 *
 * The Pewter Tessera's domain is the user's HiFi DESIGN — the per-spectrum suite
 * COLORS + suite PATTERNS that re-tint the whole SCP. P4 handled this with the
 * hifiConfig.json controlling file + ad-hoc Vue refs; P2 gives the domain a real
 * reactive HOME so PewterLanding selects it via the DECK K pattern
 * (`d.client.d.pewter.k.<slot>.select()`) instead of ad-hoc refs.
 *
 * THIN-BUT-REAL (user Conference 2026-06-23): concept-body symmetry with Cadmium,
 * but client-side ONLY — no Huirth/STCP/server-relay machinery. The live
 * file-watch→relay re-tint circuit is the DEFERRED P4 portion, OUT of scope here.
 *
 * The state slots REUSE the proven P4 model shapes (SpectrumName-keyed color hex +
 * PatternId) so the concept is the in-memory mirror of what hifiConfig + localStorage
 * carry. Precedence (factory < hifiConfig.json < localStorage) is applied by the Vue
 * controls / IslandWrapper boot (P4) — the concept simply holds the resolved design.
 *
 * Citation: cadmium.type.ts (state / qualities-map / concept / deck / payload / const layout)
 * Citation: hifiConfig.model.ts · suiteColorOverride.model.ts · suitePatternOverride.model.ts (P4 shapes)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" (explicit Quality type map · NEVER typeof)
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck } from 'stratimux';
import type { SpectrumName } from '../../model/suiteColorOverride.model';
import type { PatternId } from '../../model/suitePatternOverride.model';

export const pewterName = 'pewter';

// ============================================
// HIFI CONFIG DOMAIN SHAPES (REUSE the P4 models)
// ============================================
//
// The two design axes the Pewter Tessera governs. Both are full (NON-OPTIONAL ·
// every spectrum present) per-spectrum records so the KeyedSelector discipline holds
// — the slots are seeded for all 8 spectra in createPewterClientState. These mirror
// hifiConfig.model.HifiConfig.colors / .patterns but materialised as FULL records
// (the concept holds the resolved design, not a sparse override map).

export type PewterSuiteColors = Record<SpectrumName, string>;
export type PewterSuitePatterns = Record<SpectrumName, PatternId>;

// The Pewter design status — a small designation/status slot proving the concept
// carries more than the two axis records (KeyedSelector-tracked · NON-OPTIONAL).
//   'factory'  — only the :root defaults are applied (no JSON, no localStorage)
//   'config'   — the SCP-design hifiConfig.json baseline is in effect
//   'override' — the user's localStorage clicks are in effect (precedence top)
export type PewterDesignStatus = 'factory' | 'config' | 'override';

// ============================================
// PAYLOAD TYPES
// ============================================

// Per-spectrum single-color set (one swatch click).
export type PewterSetSuiteColorPayload = {
  spectrum: SpectrumName;
  hex: string;
};

// Per-spectrum single-pattern set (one tile pick).
export type PewterSetSuitePatternPayload = {
  spectrum: SpectrumName;
  patternId: PatternId;
};

// Bulk HiFi-config load (the resolved colors + patterns + the status that produced
// them) — the reduce target when the IslandWrapper boot / a relay supplies a full
// resolved design (factory < hifiConfig.json < localStorage already applied upstream).
export type PewterSetHifiConfigPayload = {
  suiteColors: PewterSuiteColors;
  suitePatterns: PewterSuitePatterns;
  designStatus: PewterDesignStatus;
};

// ============================================
// STATE DEFINITION
// ============================================

export type PewterClientState = {
  // The page's Suite 8 designation reference (the Cascades/8_SUITES/<name>/ key).
  pewterDesignationName: string;

  // The resolved per-spectrum suite colors (hex) — the COLOR axis home.
  suiteColors: PewterSuiteColors;

  // The resolved per-spectrum suite patterns (PatternId) — the PATTERN axis home.
  suitePatterns: PewterSuitePatterns;

  // Which precedence tier produced the current design (factory / config / override).
  designStatus: PewterDesignStatus;
};

// ============================================
// QUALITY TYPE DEFINITIONS (EXPLICIT map · NEVER typeof)
// ============================================

export type PewterClientQualities = {
  // Per-spectrum color set (one swatch) — partial reducer (only suiteColors).
  pewterSetSuiteColor: Quality<PewterClientState, PewterSetSuiteColorPayload>;
  // Per-spectrum pattern set (one tile) — partial reducer (only suitePatterns).
  pewterSetSuitePattern: Quality<PewterClientState, PewterSetSuitePatternPayload>;
  // Bulk resolved-design load — partial reducer (suiteColors + suitePatterns + designStatus).
  pewterSetHifiConfig: Quality<PewterClientState, PewterSetHifiConfigPayload>;
};

// ============================================
// CONCEPT + DECK TYPES
// ============================================

export type PewterClientConcept = Concept<PewterClientState, PewterClientQualities>;

export type PewterDeck = {
  pewter: PewterClientConcept;
};

export type PewterClientDeck = MuxiumDeck & PewterDeck;

// ============================================
// PRINCIPLE TYPE (reserved · no principle shipped in P2 · minimal-diff)
// ============================================

export type PewterPrinciple = PrincipleFunction<
  PewterClientQualities,
  MuxiumDeck & PewterDeck,
  PewterClientState
>;

// ============================================
// CONSTANTS + DEFAULTS
// ============================================

export const DEFAULT_PEWTER_DESIGNATION_NAME = 'Pewter Tessera';

// The factory `:root` color baseline per spectrum (mirrors SuiteColorSelection.vue
// DEFAULT_HEX · the RD §6 default a Reset restores to). Seeds suiteColors at boot —
// the IslandWrapper / Vue controls apply hifiConfig.json + localStorage OVER this
// (precedence factory < JSON < localStorage); the concept holds the resolved result.
export const DEFAULT_PEWTER_SUITE_COLORS: PewterSuiteColors = {
  base: '#1a1a1a',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  fuchsia: '#ec4899',
};

// The factory `:root` pattern baseline per spectrum — REUSED VERBATIM from the P4
// model so the concept default never drifts from the live CSS-token default.
export { DEFAULT_PATTERN as DEFAULT_PEWTER_SUITE_PATTERNS } from '../../model/suitePatternOverride.model';

// The boot precedence floor — only `:root` defaults applied until a config / override lands.
export const DEFAULT_PEWTER_DESIGN_STATUS: PewterDesignStatus = 'factory';
