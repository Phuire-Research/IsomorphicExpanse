/**
 * suiteColorPickerBands.model.ts — WIRE.2 · the constrained color-picker math.
 *
 * Ported verbatim from SCP_ORIGIN `src/composables/useSuiteColors.ts:17-97` (the Pewter
 * hand-off Item 2 · HIFI-SCP-RESEARCHER-WIRING-HANDOFF.md). Per-suite HUE-BAND clamping:
 * a normalized slider param t ∈ [0,1] maps onto the band's degree span, so the chosen hue
 * can NEVER leave the band (no clamp-on-pick needed — the band IS the slider's domain).
 * Saturation + lightness are free (0–100). `base` is achromatic (lightness-only · null band).
 *
 * Standard hand-rolled HSL conversions (no libs · 0–255 byte clamp). Keyed to THIS SCP's
 * SpectrumName union (matches the band-map keys 1:1).
 */
import type { SpectrumName } from './suiteColorOverride.model';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export interface HueBand {
  min: number;
  max: number;
  wraps: boolean;
}

// Tune each suite by editing its {min,max,wraps}. red is the only wrapping band (crosses 0°/360°).
export const SUITE_HUE_BANDS: Record<SpectrumName, HueBand | null> = {
  base: null, // achromatic — lightness ramp only
  red: { min: 340, max: 15, wraps: true },
  orange: { min: 15, max: 45, wraps: false },
  yellow: { min: 45, max: 65, wraps: false },
  green: { min: 65, max: 165, wraps: false },
  blue: { min: 185, max: 255, wraps: false },
  purple: { min: 255, max: 310, wraps: false },
  fuchsia: { min: 310, max: 340, wraps: false },
};

export function bandDegrees(band: HueBand): number {
  return band.wraps ? (360 - band.min) + band.max : band.max - band.min;
}

export function tToHue(t: number, band: HueBand): number {
  const degrees = bandDegrees(band);
  const offset = t * degrees;
  const hue = band.min + offset;
  return hue >= 360 ? hue - 360 : hue;
}

export function hueToT(hue: number, band: HueBand): number {
  const degrees = bandDegrees(band);
  let offset: number;
  if (band.wraps) {
    offset = hue >= band.min ? hue - band.min : hue + (360 - band.min);
  } else {
    offset = hue - band.min;
  }
  // safety clamp: snaps out-of-band hex onto the band edge on decompose
  return Math.max(0, Math.min(1, offset / degrees));
}
