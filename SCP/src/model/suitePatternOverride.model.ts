// Suite Pattern Override Model — the runtime suite-pattern (SVG-texture) override mechanism (HIFI.3).
//
// The pattern axis is the COLOR axis's Diameter twin. Where `suiteColorOverride.model` overrides the
// `--color-{spectrum}` tokens with a re-derived hex family, this module overrides the
// `--pattern-{spectrum}` tokens with a chosen SVG tile, and persists the choice across restart via
// localStorage. The two are independent Demometers: separate file, separate localStorage key,
// separate documentElement properties. They compose on the shared documentElement plane; neither
// owns the other. A color Reset never touches patterns and vice-versa.
//
// The substrate (the 8 default tiles) already lives in `src/style.css :root` as `--pattern-{spectrum}`
// data-URIs; `.hifi-pane-{spectrum}` / `.hifi-btn-{spectrum}` consume them at `30px 30px`. Overriding
// `--pattern-{spectrum}` on documentElement re-tiles every surface of that spectrum live — no
// component re-render. The CSS token system IS the cascade.
//
// Patterns are ACHROMATIC (white stroke/fill + low opacity) → orthogonal to color; they tint with
// whatever `--color-{spectrum}` the user chose underneath.
//
// SERIALIZATION DISCIPLINE (H3 — DataClone mitigation): localStorage holds only library KEYS
// (`PatternId` short strings), NEVER the heavy SVG data-URI. The library lives in-code; `apply`
// looks up id → css at runtime. The persisted map is a sparse `{ spectrum: 'square-grid' }`.
//
// THE `spectrum-waves` / `--pattern-onyx` BOUNDARY (H2): the Spectrum Waves tile bakes the 7
// spectrum hex INSIDE its data-URI; data-URI SVGs do not read `:root` vars, so its internal wave
// stroke colors stay fixed regardless of any color override. It is one library entry among many —
// a choice of motif, not a recolor. Its value IS its all-seven-stripes display; it reads coherently
// on any spectrum. We do NOT attempt to var-drive its internal strokes (out of scope).

import { type SpectrumName, SPECTRUM_NAMES } from './suiteColorOverride.model';

export type { SpectrumName };
export { SPECTRUM_NAMES };

// C927 · PER-SCP SCOPING — the generic key leaked user styling across every SCP sharing a
// localhost origin (port reuse across citizens/time). The key now carries the SCP's own name
// (SSR-injected · window.__APP_STATE__.scpName) so each SCP's styling stands alone. Pre-release
// clean break: the old generic key simply orphans (no migration).
function storageKey(): string {
  const scpName =
    (typeof window !== 'undefined' &&
      (window as unknown as { __APP_STATE__?: { scpName?: string } }).__APP_STATE__?.scpName) ||
    'scp';
  return 'scs-suite-pattern-overrides:' + scpName;
}

// A library key — the short string id persisted to localStorage and looked up at apply time.
export type PatternId =
  | 'scattered-dust'
  | 'nested-frames'
  | 'radial-compass'
  | 'ruled-axis'
  | 'branching-growth'
  | 'cardinal-orbit'
  | 'pentagon-constellation'
  | 'paired-lobes'
  | 'faceted-diamond'
  | 'spectrum-waves'
  | 'square-grid'
  | 'diagonal-rule'
  | 'hex-net'
  | 'concentric-rings'
  | 'wave-lattice'
  | 'circuit-trace'
  | 'triangle-mesh'
  | 'cross-hatch'
  | 'plain-none';

export interface PatternEntry {
  id: PatternId;
  label: string;
  // The full CSS value written to `--pattern-{spectrum}` — a `url("data:image/svg+xml,…")` string,
  // or `none` for the no-tile option.
  css: string;
}

// The 8 existing default tiles (lifted VERBATIM from style.css:133-151) + diamond + onyx (special)
// + 9 new achromatic styles. KEYS are persisted; these heavy strings are looked up on apply.
export const PATTERN_LIBRARY: readonly PatternEntry[] = [
  // ---- The 8 spectrum defaults (verbatim from style.css :root) ----
  {
    id: 'scattered-dust',
    label: 'Scattered dust',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='15' cy='25' r='1' fill='white' opacity='0.15'/%3E%3Ccircle cx='45' cy='15' r='1.5' fill='white' opacity='0.2'/%3E%3Ccircle cx='75' cy='35' r='1' fill='white' opacity='0.15'/%3E%3Ccircle cx='25' cy='65' r='2' fill='white' opacity='0.1'/%3E%3Ccircle cx='55' cy='55' r='1' fill='white' opacity='0.25'/%3E%3Ccircle cx='85' cy='75' r='1.5' fill='white' opacity='0.15'/%3E%3Ccircle cx='35' cy='85' r='1' fill='white' opacity='0.2'/%3E%3Ccircle cx='65' cy='90' r='1.5' fill='white' opacity='0.3'/%3E%3Ccircle cx='95' cy='45' r='1' fill='white' opacity='0.15'/%3E%3Ccircle cx='10' cy='50' r='1' fill='white' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: 'nested-frames',
    label: 'Nested frames',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='10' y='10' width='35' height='35' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Crect x='55' y='55' width='35' height='35' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='27.5' cy='27.5' r='4' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='72.5' cy='72.5' r='4' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: 'radial-compass',
    label: 'Radial compass',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='20' y1='50' x2='95' y2='20' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cline x1='20' y1='50' x2='95' y2='50' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cline x1='20' y1='50' x2='95' y2='80' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='20' cy='50' r='15' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='20' cy='50' r='30' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3C/svg%3E\")",
  },
  {
    id: 'ruled-axis',
    label: 'Ruled axis',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='50' y1='0' x2='50' y2='100' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cline x1='0' y1='50' x2='100' y2='50' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cline x1='25' y1='0' x2='25' y2='100' stroke='white' stroke-width='1' opacity='0.1' stroke-dasharray='4 4'/%3E%3Cline x1='75' y1='0' x2='75' y2='100' stroke='white' stroke-width='1' opacity='0.1' stroke-dasharray='4 4'/%3E%3Ccircle cx='50' cy='50' r='2' fill='white' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: 'branching-growth',
    label: 'Branching growth',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 Q45 40 30 60 Q20 75 15 90' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cpath d='M50 10 Q55 40 70 60 Q80 75 85 90' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cpath d='M50 10 Q50 45 50 90' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Ccircle cx='15' cy='90' r='3' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='85' cy='90' r='3' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: 'cardinal-orbit',
    label: 'Cardinal orbit',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='25' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Crect x='45' y='15' width='10' height='12' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Crect x='45' y='73' width='10' height='12' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Crect x='15' y='45' width='12' height='10' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Crect x='73' y='45' width='12' height='10' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: 'pentagon-constellation',
    label: 'Pentagon constellation',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='20' cy='20' r='3' fill='white' opacity='0.2'/%3E%3Ccircle cx='80' cy='20' r='3' fill='white' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='3' fill='white' opacity='0.2'/%3E%3Ccircle cx='20' cy='80' r='3' fill='white' opacity='0.2'/%3E%3Ccircle cx='80' cy='80' r='3' fill='white' opacity='0.2'/%3E%3Cline x1='20' y1='20' x2='80' y2='20' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='20' y1='20' x2='50' y2='50' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='80' y1='20' x2='50' y2='50' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='20' y1='80' x2='50' y2='50' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='80' y1='80' x2='50' y2='50' stroke='white' stroke-width='1' opacity='0.15'/%3E%3C/svg%3E\")",
  },
  {
    id: 'paired-lobes',
    label: 'Paired lobes',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 50 Q60 30 80 25 Q70 45 75 65 Q55 60 50 50' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Cpath d='M50 50 Q40 70 20 75 Q30 55 25 35 Q45 40 50 50' fill='none' stroke='white' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='2' fill='white' opacity='0.25'/%3E%3C/svg%3E\")",
  },
  // ---- The two special-purpose tiles (also selectable for any spectrum) ----
  {
    id: 'faceted-diamond',
    label: 'Faceted diamond',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L70 50 L50 90 L30 50 Z' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3Cpath d='M50 10 L30 50' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/%3E%3Cpath d='M50 10 L70 50' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/%3E%3Cpath d='M30 50 L50 90' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/%3E%3Cpath d='M70 50 L50 90' fill='none' stroke='white' stroke-width='0.5' opacity='0.12'/%3E%3Cpath d='M50 30 L60 50 L50 70 L40 50 Z' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cline x1='30' y1='50' x2='70' y2='50' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E\")",
  },
  {
    // SPECIAL: this tile bakes the 7 spectrum hex inside the data-URI (H2). Its value IS the
    // all-seven-stripes display; it reads coherently on any spectrum. Internal strokes are fixed.
    id: 'spectrum-waves',
    label: 'Spectrum waves',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 4 Q25 2 50 4 T100 4' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 11 Q25 8 50 11 T100 11' fill='none' stroke='%23ef4444' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M0 18 Q25 14 50 18 T100 18' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 25 Q25 20 50 25 T100 25' fill='none' stroke='%23f97316' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M0 32 Q25 26 50 32 T100 32' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 39 Q25 32 50 39 T100 39' fill='none' stroke='%23eab308' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M0 46 Q25 38 50 46 T100 46' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 53 Q25 45 50 53 T100 53' fill='none' stroke='%2322c55e' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M0 60 Q25 53 50 60 T100 60' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 67 Q25 61 50 67 T100 67' fill='none' stroke='%233b82f6' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M0 74 Q25 69 50 74 T100 74' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 81 Q25 77 50 81 T100 81' fill='none' stroke='%23a855f7' stroke-width='1.5' opacity='0.08'/%3E%3Cpath d='M0 88 Q25 85 50 88 T100 88' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3Cpath d='M0 95 Q25 93 50 95 T100 95' fill='none' stroke='%23ec4899' stroke-width='1.5' opacity='0.08'/%3E%3C/svg%3E\")",
  },
  // ---- 9 new achromatic styles (white stroke/fill, opacity 0.1–0.25, 100x100 viewBox, 30px tile) ----
  {
    id: 'square-grid',
    label: 'Square grid',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='0' y1='25' x2='100' y2='25' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cline x1='0' y1='50' x2='100' y2='50' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cline x1='0' y1='75' x2='100' y2='75' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cline x1='25' y1='0' x2='25' y2='100' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cline x1='50' y1='0' x2='50' y2='100' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cline x1='75' y1='0' x2='75' y2='100' stroke='white' stroke-width='1' opacity='0.12'/%3E%3C/svg%3E\")",
  },
  {
    id: 'diagonal-rule',
    label: 'Diagonal rule',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='0' y1='0' x2='100' y2='100' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='0' y1='33' x2='67' y2='100' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='33' y1='0' x2='100' y2='67' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cline x1='0' y1='67' x2='33' y2='100' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cline x1='67' y1='0' x2='100' y2='33' stroke='white' stroke-width='1' opacity='0.12'/%3E%3C/svg%3E\")",
  },
  {
    id: 'hex-net',
    label: 'Hex net',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M25 15 L40 23 L40 40 L25 48 L10 40 L10 23 Z' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cpath d='M70 50 L85 58 L85 75 L70 83 L55 75 L55 58 Z' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cpath d='M70 8 L85 16 L85 33 L70 41 L55 33 L55 16 Z' fill='none' stroke='white' stroke-width='1' opacity='0.12'/%3E%3C/svg%3E\")",
  },
  {
    id: 'concentric-rings',
    label: 'Concentric rings',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3Ccircle cx='50' cy='50' r='22' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Ccircle cx='50' cy='50' r='35' fill='none' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Ccircle cx='50' cy='50' r='48' fill='none' stroke='white' stroke-width='1' opacity='0.1'/%3E%3Ccircle cx='50' cy='50' r='2' fill='white' opacity='0.2'/%3E%3C/svg%3E\")",
  },
  {
    id: 'wave-lattice',
    label: 'Wave lattice',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 20 Q25 10 50 20 T100 20' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cpath d='M0 37 Q25 27 50 37 T100 37' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cpath d='M0 63 Q25 53 50 63 T100 63' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cpath d='M0 80 Q25 70 50 80 T100 80' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3C/svg%3E\")",
  },
  {
    id: 'circuit-trace',
    label: 'Circuit trace',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M10 20 L40 20 L40 50 L70 50 L70 80' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Cpath d='M90 30 L60 30 L60 60 L20 60 L20 90' fill='none' stroke='white' stroke-width='1' opacity='0.15'/%3E%3Ccircle cx='10' cy='20' r='2.5' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3Ccircle cx='40' cy='50' r='2.5' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3Ccircle cx='70' cy='80' r='2.5' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3Ccircle cx='60' cy='30' r='2.5' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3Ccircle cx='20' cy='60' r='2.5' fill='none' stroke='white' stroke-width='1' opacity='0.18'/%3E%3C/svg%3E\")",
  },
  {
    id: 'triangle-mesh',
    label: 'Triangle mesh',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M10 90 L30 20 L55 85 Z' fill='none' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cpath d='M30 20 L65 30 L55 85 Z' fill='none' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cpath d='M65 30 L90 80 L55 85 Z' fill='none' stroke='white' stroke-width='1' opacity='0.12'/%3E%3Cpath d='M30 20 L70 10 L65 30 Z' fill='none' stroke='white' stroke-width='1' opacity='0.1'/%3E%3C/svg%3E\")",
  },
  {
    id: 'cross-hatch',
    label: 'Cross hatch',
    css: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cline x1='0' y1='20' x2='80' y2='100' stroke='white' stroke-width='0.75' opacity='0.1'/%3E%3Cline x1='20' y1='0' x2='100' y2='80' stroke='white' stroke-width='0.75' opacity='0.1'/%3E%3Cline x1='0' y1='60' x2='40' y2='100' stroke='white' stroke-width='0.75' opacity='0.1'/%3E%3Cline x1='60' y1='0' x2='100' y2='40' stroke='white' stroke-width='0.75' opacity='0.1'/%3E%3Cline x1='80' y1='0' x2='100' y2='20' stroke='white' stroke-width='0.75' opacity='0.1'/%3E%3Cline x1='0' y1='80' x2='20' y2='100' stroke='white' stroke-width='0.75' opacity='0.1'/%3E%3C/svg%3E\")",
  },
  {
    id: 'plain-none',
    label: 'No texture',
    css: 'none',
  },
];

// Fast id → entry lookup (apply resolves the persisted key against this).
const PATTERN_BY_ID: Record<PatternId, PatternEntry> = PATTERN_LIBRARY.reduce(
  (acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  },
  {} as Record<PatternId, PatternEntry>,
);

// The `:root` baseline per spectrum suite — the default a Reset restores to (mirrors DEFAULT_HEX).
// Each maps to that spectrum's own existing tile id (style.css:133-147).
export const DEFAULT_PATTERN: Record<SpectrumName, PatternId> = {
  base: 'scattered-dust',
  red: 'nested-frames',
  orange: 'radial-compass',
  yellow: 'ruled-axis',
  green: 'branching-growth',
  blue: 'cardinal-orbit',
  purple: 'pentagon-constellation',
  fuchsia: 'paired-lobes',
};

// Apply a sparse map of per-spectrum pattern overrides onto documentElement's :style.
// For each entry: look up the library by id → set `--pattern-{spectrum}` to its css value.
// Unmentioned spectrums fall through to their `:root` defaults. SSR-safe.
export function applySuitePatternOverrides(map: Partial<Record<SpectrumName, PatternId>>): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement.style;
  (Object.keys(map) as SpectrumName[]).forEach((n) => {
    const id = map[n];
    if (!id) return;
    const entry = PATTERN_BY_ID[id];
    if (!entry) return;
    el.setProperty(`--pattern-${n}`, entry.css);
  });
}

// Load the persisted pattern map from localStorage; `{}` on absent/parse failure. SSR-safe.
export function loadSuitePatternOverrides(): Partial<Record<SpectrumName, PatternId>> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Partial<Record<SpectrumName, PatternId>>;
    }
    return {};
  } catch {
    return {};
  }
}

// Persist the pattern map to localStorage. SSR-safe; swallows quota/serialization errors.
// Only library KEYS are stored — never the heavy SVG data-URI (H3 DataClone mitigation).
export function saveSuitePatternOverrides(map: Partial<Record<SpectrumName, PatternId>>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(map));
  } catch {
    // ignore quota / serialization failures
  }
}

// Clear the persisted map AND remove the set properties from documentElement, restoring the
// `:root` defaults declared in style.css. removeProperty (NOT setProperty(default)) — the CSS
// cascade IS the default-retention mechanism.
export function clearSuitePatternOverrides(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(storageKey());
    } catch {
      // ignore
    }
  }
  if (typeof document === 'undefined') return;
  const el = document.documentElement.style;
  SPECTRUM_NAMES.forEach((n) => {
    el.removeProperty(`--pattern-${n}`);
  });
}
