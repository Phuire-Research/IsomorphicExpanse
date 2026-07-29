// Suite Color Override Model — the runtime suite-color override mechanism (HIFI.1).
//
// The HiFi token foundation lives in `src/style.css :root` (the 8 spectrum tokens:
// `--color-{n}` + `-dark`/`-light` + `--fade-{n}` + `--shadow-{n}`). This module lets a
// chosen per-suite hex re-derive + override those tokens at runtime (the RD §6 law) and
// persist the choice across restart via localStorage.
//
// Scope = the 8 SPECTRUM tokens ONLY (base/red/orange/yellow/green/blue/purple/fuchsia).
// The internal accent names (viridian/cobalt/amethyst/maroon) are NOT user-overridable
// here (fixed internal accents; aliasing is deferred to a later portion).
//
// RD §6 derivation law (clamp 0..255):
//   dark   = rgb × 0.85
//   light  = rgb × 1.15
//   fade   = rgb × 0.15
//   shadow = rgba(dark.r, dark.g, dark.b, 0.6)

export type SpectrumName =
  | 'base'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'fuchsia';

export const SPECTRUM_NAMES: readonly SpectrumName[] = [
  'base',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'fuchsia',
];

// C927 · PER-SCP SCOPING — the generic key leaked user styling across every SCP sharing a
// localhost origin (port reuse across citizens/time). The key now carries the SCP's own name
// (SSR-injected · window.__APP_STATE__.scpName) so each SCP's styling stands alone. Pre-release
// clean break: the old generic key simply orphans (no migration).
function storageKey(): string {
  const scpName =
    (typeof window !== 'undefined' &&
      (window as unknown as { __APP_STATE__?: { scpName?: string } }).__APP_STATE__?.scpName) ||
    'scp';
  return 'scs-suite-color-overrides:' + scpName;
}

export interface DerivedVariants {
  base: string;
  dark: string;
  light: string;
  fade: string;
  shadow: string;
}

function clampChannel(value: number): number {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return Math.round(value);
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== 'string') return null;
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return {
    r: (int >> 16) & 0xff,
    g: (int >> 8) & 0xff,
    b: int & 0xff,
  };
}

// Derive the five HiFi variants from a `#rrggbb` hex (RD §6 law).
export function deriveVariants(hex: string): DerivedVariants {
  const rgb = parseHex(hex) ?? { r: 0, g: 0, b: 0 };

  const baseR = clampChannel(rgb.r);
  const baseG = clampChannel(rgb.g);
  const baseB = clampChannel(rgb.b);

  const darkR = clampChannel(rgb.r * 0.85);
  const darkG = clampChannel(rgb.g * 0.85);
  const darkB = clampChannel(rgb.b * 0.85);

  const lightR = clampChannel(rgb.r * 1.15);
  const lightG = clampChannel(rgb.g * 1.15);
  const lightB = clampChannel(rgb.b * 1.15);

  const fadeR = clampChannel(rgb.r * 0.15);
  const fadeG = clampChannel(rgb.g * 0.15);
  const fadeB = clampChannel(rgb.b * 0.15);

  return {
    base: `rgb(${baseR}, ${baseG}, ${baseB})`,
    dark: `rgb(${darkR}, ${darkG}, ${darkB})`,
    light: `rgb(${lightR}, ${lightG}, ${lightB})`,
    fade: `rgb(${fadeR}, ${fadeG}, ${fadeB})`,
    shadow: `rgba(${darkR}, ${darkG}, ${darkB}, 0.6)`,
  };
}

// Apply a sparse palette of per-spectrum hex overrides onto documentElement's :style.
// The :root all islands read is documentElement — setting properties there re-tints the
// whole app. base has NO `--shadow-base` token (RD), so shadow is set for NON-base only.
export function applySuiteColorOverrides(map: Partial<Record<SpectrumName, string>>): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement.style;
  (Object.keys(map) as SpectrumName[]).forEach((n) => {
    const hex = map[n];
    if (!hex) return;
    const v = deriveVariants(hex);
    el.setProperty(`--color-${n}`, v.base);
    el.setProperty(`--color-${n}-dark`, v.dark);
    el.setProperty(`--color-${n}-light`, v.light);
    el.setProperty(`--fade-${n}`, v.fade);
    if (n !== 'base') {
      el.setProperty(`--shadow-${n}`, v.shadow);
    }
  });
}

// Load the persisted palette from localStorage; `{}` on absent/parse failure. SSR-safe.
export function loadSuiteColorOverrides(): Partial<Record<SpectrumName, string>> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Partial<Record<SpectrumName, string>>;
    }
    return {};
  } catch {
    return {};
  }
}

// Persist the palette to localStorage. SSR-safe; swallows quota/serialization errors.
export function saveSuiteColorOverrides(map: Partial<Record<SpectrumName, string>>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(map));
  } catch {
    // ignore quota / serialization failures
  }
}

// Clear the persisted palette AND remove the set properties from documentElement,
// restoring the :root defaults declared in style.css.
export function clearSuiteColorOverrides(): void {
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
    el.removeProperty(`--color-${n}`);
    el.removeProperty(`--color-${n}-dark`);
    el.removeProperty(`--color-${n}-light`);
    el.removeProperty(`--fade-${n}`);
    if (n !== 'base') {
      el.removeProperty(`--shadow-${n}`);
    }
  });
}
