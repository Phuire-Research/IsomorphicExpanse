/**
 * Bridge Turn Over standby overlay.
 *
 * A full-screen notice shown while the connection to the bridge is being
 * re-established. It signals the operator to cease activity until the page
 * resumes automatically. Self-contained: a single injected element carrying
 * its own scoped styles, removed automatically when the page reloads.
 *
 * Design tokens (--color-*, --fade-*, --shadow-*, --font-heading) are sourced
 * from the global stylesheet :root; literal fallbacks keep the overlay legible
 * if the stylesheet has not yet applied.
 */

import type { GitmTurnoverProgress } from '../../../model/gitmTurnover.model';

const STANDBY_OVERLAY_ID = 'bridge-turn-over-standby';
const STANDBY_STYLE_ID = 'bridge-turn-over-standby-style';

// SORD Shield/Sword title glyph — an inline SVG (1.2em · stroke currentColor · the retained
// blue/fuchsia palette rides the title's own color). The shield precedes the RETURN-TO-STABLE-A
// (recovery) title; the sword precedes the TURN-OVER-TO-B (carry) title. Non-seat modes (the plain
// 'turn-over' + the 'b-failed-reverting' failsafe) carry no glyph.
const SHIELD_SVG =
  `<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `style="vertical-align:-0.15em;margin-right:0.32em" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="M12 3 4 6v5c0 4.5 3.2 8 8 10 4.8-2 8-5.5 8-10V6l-8-3Z"/></svg>`;
const SWORD_SVG =
  `<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `style="vertical-align:-0.15em;margin-right:0.32em" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="M14.5 3.5 21 3l-.5 6.5-9 9"/><path d="M11.5 18.5 3 21l2.5-8.5 9-9"/>` +
  `<path d="M6.5 15.5 8.5 17.5"/><path d="M4 21l3.5-3.5"/></svg>`;

// The glyph for a given mode — '' for the non-seat (turn-over / failsafe) modes.
function standbyIconSvg(mode: StandbyMode): string {
  if (mode === 'shield-a') return SHIELD_SVG;
  if (mode === 'sword-b') return SWORD_SVG;
  return '';
}

// STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · the Suite 8 design pass · C637). The
// SAME StratiPUNK composition (ring crown · glow type · countdown · footer rail) wears one of
// three FUNCTIONAL COLOR REGISTERS keyed to the turn-over CLASS the trigger fired — a body-class
// on the overlay root drives per-class accent overrides (STAND BY line · countdown · glow · rail).
//   'shield' = SHIELD — the Ground · the Tactical Fall Back — RETAINS the current blue/fuchsia
//              scheme (the existing overlay IS the Shield's · zero visual regression on the
//              unthreaded/legacy paths, which default here).
//   'sword'  = SWORD  — the Experiment — YELLOW ⊗ BLUE interplay.
//   'sparks' = SPARKS — the Compromise (a curation of what exists) — the RED register.
// The CLASS is orthogonal to StandbyMode (which carries the message CONTENT): a plain 'turn-over'
// mode is shared by BOTH the A-leg fallback (Shield) AND the hard turn-over leg (Sparks), so the
// register cannot be derived from the mode alone — the trigger passes it explicitly.
export type StandbyTurnClass = 'shield' | 'sword' | 'sparks';

// The overlay-root body-class carrying the register (default 'shield' — the retained scheme).
function standbyClassName(turnClass: StandbyTurnClass): string {
  return `standby-express-${turnClass}`;
}

const STANDBY_STYLES = `
#${STANDBY_OVERLAY_ID} {
  /* THE RIBBON (user design · Cycle 261): the overlay composes ONLY the middle 3/5 of the
     screen — the top and bottom fifths are NOT covered at all, so the TaskBar (bottom fifth)
     stays LIVE. Why: if a B turn-over stalls, the escape is Turn Over A — the full-screen
     overlay was BLOCKING its own escape hatch (067 stalled exactly this way). */
  position: fixed;
  left: 0;
  right: 0;
  top: 20vh;
  bottom: 20vh;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(110, 170, 255, 0.55);
  border-bottom: 1px solid rgba(110, 170, 255, 0.55);
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  color: #dfe6f5;
  background-color: #050608;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.025) 0px,
      rgba(255, 255, 255, 0.025) 1px,
      transparent 1px,
      transparent 3px
    ),
    radial-gradient(
      ellipse at 50% 42%,
      var(--color-blue-dark, rgb(50, 111, 209)) 0%,
      #0a1020 34%,
      #050608 72%,
      #020203 100%
    );
  overflow: hidden;
  animation: bridge-standby-fade-in 0.25s ease-out;
}

#${STANDBY_OVERLAY_ID} .standby-frame {
  position: absolute;
  inset: 14px;
  pointer-events: none;
  border: 1px solid rgba(110, 170, 255, 0.55);
  clip-path: polygon(
    22px 0, calc(100% - 22px) 0, 100% 22px,
    100% calc(100% - 22px), calc(100% - 22px) 100%,
    22px 100%, 0 calc(100% - 22px), 0 22px
  );
  box-shadow:
    0 0 18px 2px rgba(59, 130, 246, 0.45),
    inset 0 0 26px 1px rgba(59, 130, 246, 0.30),
    inset 0 0 60px 6px rgba(236, 72, 153, 0.18);
  animation: bridge-standby-frame-pulse 2.6s ease-in-out infinite;
}

#${STANDBY_OVERLAY_ID} .standby-core {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  text-align: center;
  /* BOOT-STREAM: a flex column inside the fixed 60vh ribbon needs a floor of 0 so the capped
     .standby-stream (max-height 72px · overflow hidden) can shrink instead of overflowing the core. */
  min-height: 0;
}

/* THE STALL TIMER (user design): elapsed mm:ss since the turn-over began — the user working
   in the retained fifths gets a FEEL for a stalled turn-over and can revert to A. */
#${STANDBY_OVERLAY_ID} .standby-timer {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}

#${STANDBY_OVERLAY_ID} .standby-hint {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  color: rgba(150, 168, 200, 0.6);
}

#${STANDBY_OVERLAY_ID} .standby-shapes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  height: 56px;
}

/* THE SUITE POLYGON SEQUENCE: 8 regular polygons — the triangle (3 sides) for the dark base
   ascending one side per position to the decagon (10). The base polygon is onyx-dark with a
   small diamond INLAID (the pairing); the seven that follow carry their suite colors as neon
   outlines. The svg strokes ride currentColor; the glow is a drop-shadow filter. */
#${STANDBY_OVERLAY_ID} .standby-shape {
  width: 28px;
  height: 28px;
  opacity: 0.25;
  animation:
    bridge-standby-shape 1.5s ease-in-out infinite,
    bridge-standby-charge 9s ease-in-out infinite;
}
#${STANDBY_OVERLAY_ID} .standby-shape svg {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 6px currentColor);
}

#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(1) { color: rgb(232, 233, 238); animation-delay: 0s, 0s; } /* the off-white border shadow — the drop-shadow rides currentColor */
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(2) { color: var(--color-red, rgb(239, 68, 68)); animation-delay: 0.12s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(3) { color: var(--color-orange, rgb(249, 115, 22)); animation-delay: 0.24s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(4) { color: var(--color-yellow, rgb(234, 179, 8)); animation-delay: 0.36s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(5) { color: var(--color-green, rgb(34, 197, 94)); animation-delay: 0.48s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(6) { color: var(--color-blue-light, rgb(68, 150, 255)); animation-delay: 0.6s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(7) { color: var(--color-purple, rgb(168, 85, 247)); animation-delay: 0.72s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(8) { color: var(--color-fuchsia, rgb(236, 72, 153)); animation-delay: 0.84s, 0s; }

#${STANDBY_OVERLAY_ID} .standby-title {
  margin: 0;
  font-size: clamp(1.5rem, 4.2vw, 2.6rem); /* ribbon-fitted (60vh) — was 2-4rem full-screen */
  font-weight: 700;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
  color: #eaf1ff;
  text-shadow:
    0 0 8px rgba(59, 130, 246, 0.9),
    0 0 22px rgba(59, 130, 246, 0.55),
    0 0 38px rgba(236, 72, 153, 0.35);
}

#${STANDBY_OVERLAY_ID} .standby-subtitle {
  margin: 0;
  font-size: clamp(0.85rem, 2.2vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.5em;
  text-indent: 0.5em;
  color: var(--color-fuchsia-light, rgb(255, 83, 176));
  text-shadow:
    0 0 8px rgba(236, 72, 153, 0.85),
    0 0 18px rgba(236, 72, 153, 0.45);
}

#${STANDBY_OVERLAY_ID} .standby-note {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  color: rgba(170, 190, 225, 0.7);
}

/* THE CLASS-NAME EYEBROW (W2 · C637): the human-readable turn-over class (SHIELD / SWORD /
   SPARKS) as a compact tracked eyebrow above the content title. Base = the SHIELD register's
   blue tint; the SWORD/SPARKS blocks below re-tint it to the register color. */
/* C638 · THE LOGO BADGE — the class glyph centered at the head of the title stack. Base = the
   SHIELD register (the retained scheme); the express blocks re-tint per class. Accents+shadows
   only (the OSR root-paint law holds). */
#${STANDBY_OVERLAY_ID} .standby-logo-badge {
  margin: 0 0 10px;
  font-size: 2.3rem;
  line-height: 1;
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow:
    0 0 12px rgba(59, 130, 246, 0.85),
    0 0 28px rgba(217, 70, 239, 0.35);
}
#${STANDBY_OVERLAY_ID} .standby-class-name {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow: 0 0 9px rgba(59, 130, 246, 0.7);
}

#${STANDBY_OVERLAY_ID} .standby-bracket {
  position: absolute;
  left: 50%;
  bottom: 42px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(560px, 70vw);
  color: rgba(150, 168, 200, 0.85);
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-tick {
  width: 14px;
  height: 22px;
  flex: 0 0 auto;
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-tick.left {
  border-left: 2px solid currentColor;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-tick.right {
  border-right: 2px solid currentColor;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-rail {
  flex: 1 1 auto;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-blue, rgb(59, 130, 246)) 22%,
    var(--color-fuchsia, rgb(236, 72, 153)) 50%,
    var(--color-blue, rgb(59, 130, 246)) 78%,
    transparent 100%
  );
  box-shadow: 0 0 10px 1px rgba(59, 130, 246, 0.55);
  animation: bridge-standby-rail 2.6s linear infinite;
}

@keyframes bridge-standby-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes bridge-standby-frame-pulse {
  0%, 100% {
    box-shadow:
      0 0 18px 2px rgba(59, 130, 246, 0.45),
      inset 0 0 26px 1px rgba(59, 130, 246, 0.30),
      inset 0 0 60px 6px rgba(236, 72, 153, 0.18);
  }
  50% {
    box-shadow:
      0 0 30px 4px rgba(59, 130, 246, 0.70),
      inset 0 0 38px 2px rgba(59, 130, 246, 0.45),
      inset 0 0 84px 10px rgba(236, 72, 153, 0.30);
  }
}

@keyframes bridge-standby-shape {
  0%, 100% { opacity: 0.22; transform: scale(0.86); }
  50%      { opacity: 1;    transform: scale(1.12); }
}

@keyframes bridge-standby-charge {
  0%   { animation-duration: 1.5s; filter: brightness(1); }
  100% { animation-duration: 0.55s; filter: brightness(1.4); }
}

@keyframes bridge-standby-rail {
  0%   { opacity: 0.55; }
  50%  { opacity: 1; }
  100% { opacity: 0.55; }
}

/* BOOT-STREAM (the live tail): the re-booting SCP's last boot lines, tailed on-demand from
   /scp-boot-log/:scpName across the respawn gap. Mono · dim · left-aligned · pre-wrapped, and
   HARD-CAPPED to ~8 lines (max-height 72px · overflow hidden) so it never grows the ribbon core. */
#${STANDBY_OVERLAY_ID} .standby-stream {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.58rem;
  line-height: 1.35;
  color: rgba(120, 140, 170, 0.5);
  width: min(520px, 68vw);
  text-align: left;
  white-space: pre;
  max-height: 72px;
  overflow: hidden;
}

/* THE ESCALATING PULSE (user design): every 15 elapsed seconds the stall deepens the title's
   glow + a subtle scale beat — a growing visual urgency so a stalled turn-over reads as stalled.
   pulseLevel drives the class swap in showBridgeStandby (cap 4); the body[data-standby-pulse]
   mirror escalates the LIVE toolbar's Turn Over A (style.css) in lockstep. */
#${STANDBY_OVERLAY_ID} .standby-title.pulse-1 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.0);
  text-shadow:
    0 0 10px rgba(59, 130, 246, 0.95),
    0 0 24px rgba(59, 130, 246, 0.6),
    0 0 40px rgba(236, 72, 153, 0.4);
}
#${STANDBY_OVERLAY_ID} .standby-title.pulse-2 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.06);
  text-shadow:
    0 0 12px rgba(59, 130, 246, 1),
    0 0 30px rgba(59, 130, 246, 0.7),
    0 0 52px rgba(236, 72, 153, 0.5);
}
#${STANDBY_OVERLAY_ID} .standby-title.pulse-3 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.12);
  text-shadow:
    0 0 16px rgba(59, 130, 246, 1),
    0 0 38px rgba(236, 72, 153, 0.7),
    0 0 64px rgba(236, 72, 153, 0.6);
}
#${STANDBY_OVERLAY_ID} .standby-title.pulse-4 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.18);
  text-shadow:
    0 0 20px rgba(236, 72, 153, 1),
    0 0 48px rgba(236, 72, 153, 0.85),
    0 0 80px rgba(236, 72, 153, 0.7);
}

/* ══ STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · C637) ══════════════════════════════
   Per-class ACCENT overrides keyed to the overlay-root register class. The SHIELD register is
   the base rules above (no override block — the retained blue/fuchsia scheme · zero regression).
   SWORD and SPARKS re-tint ONLY the functional accent surfaces (the frame glow · the STAND BY
   subtitle · the countdown · the title glow · the footer rail); the ring crown's suite-spectrum
   sequence, the layout, and the composition stay identical across all three.

   OSR LESSON (C598/C602): the overlay paints its background DELIBERATELY (background-color +
   background-image on the root); the register overrides touch only foreground accents + shadows,
   never the opaque backdrop — so no transparency artifact opens under the shader. */

/* ── SWORD (Turn Over B · the Experiment) — YELLOW ⊗ BLUE interplay ──
   The blade divides the palette: the STAND BY subtitle carries YELLOW (the striking edge · the
   experiment declaring itself); the title glow + countdown + rail keep BLUE (the tempered spine
   the experiment rides). Yellow-over-blue is the Sword's two-metal fold. */
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-frame {
  box-shadow:
    0 0 18px 2px rgba(59, 130, 246, 0.45),
    inset 0 0 26px 1px rgba(59, 130, 246, 0.30),
    inset 0 0 60px 6px rgba(234, 179, 8, 0.20);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-logo-badge {
  color: var(--color-yellow-light, rgb(255, 206, 9));
  text-shadow:
    0 0 12px rgba(234, 179, 8, 0.85),
    0 0 28px rgba(59, 130, 246, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-class-name {
  color: var(--color-yellow-light, rgb(255, 206, 9));
  text-shadow: 0 0 9px rgba(234, 179, 8, 0.7);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-subtitle {
  color: var(--color-yellow-light, rgb(255, 206, 9));
  text-shadow:
    0 0 8px rgba(234, 179, 8, 0.85),
    0 0 18px rgba(234, 179, 8, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-title {
  text-shadow:
    0 0 8px rgba(59, 130, 246, 0.9),
    0 0 22px rgba(59, 130, 246, 0.55),
    0 0 38px rgba(234, 179, 8, 0.35);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-timer {
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-bracket .bracket-rail {
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-blue, rgb(59, 130, 246)) 22%,
    var(--color-yellow, rgb(234, 179, 8)) 50%,
    var(--color-blue, rgb(59, 130, 246)) 78%,
    transparent 100%
  );
  box-shadow: 0 0 10px 1px rgba(234, 179, 8, 0.55);
}

/* ── SPARKS (Hard Turn Over · the Compromise) — the RED register ──
   The clean-slate reset reads as a single decisive red: every accent surface (frame glow · STAND
   BY · countdown · title glow · rail) burns to red. No interplay — the Compromise is one register,
   a curation of what exists with no other pursuit. */
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-frame {
  box-shadow:
    0 0 18px 2px rgba(239, 68, 68, 0.48),
    inset 0 0 26px 1px rgba(239, 68, 68, 0.32),
    inset 0 0 60px 6px rgba(239, 68, 68, 0.18);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-logo-badge {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow:
    0 0 12px rgba(239, 68, 68, 0.85),
    0 0 28px rgba(203, 58, 58, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-class-name {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow: 0 0 9px rgba(239, 68, 68, 0.7);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-subtitle {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow:
    0 0 8px rgba(239, 68, 68, 0.85),
    0 0 18px rgba(239, 68, 68, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-title {
  text-shadow:
    0 0 8px rgba(239, 68, 68, 0.9),
    0 0 22px rgba(239, 68, 68, 0.55),
    0 0 38px rgba(203, 58, 58, 0.35);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-timer {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-bracket .bracket-rail {
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-red-dark, rgb(203, 58, 58)) 22%,
    var(--color-red-light, rgb(255, 78, 78)) 50%,
    var(--color-red-dark, rgb(203, 58, 58)) 78%,
    transparent 100%
  );
  box-shadow: 0 0 10px 1px rgba(239, 68, 68, 0.55);
}

/* The pulse escalation stays fuchsia-toned for SHIELD (base) but re-tints per register so a
   stalled Sword/Sparks turn-over escalates in its OWN color (the growing urgency reads honest to
   the class). Only the deepest two levels re-tint — the register asserts as the stall deepens. */
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-title.pulse-3,
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-title.pulse-4 {
  text-shadow:
    0 0 18px rgba(234, 179, 8, 0.9),
    0 0 44px rgba(59, 130, 246, 0.7),
    0 0 72px rgba(234, 179, 8, 0.6);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-title.pulse-3,
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-title.pulse-4 {
  text-shadow:
    0 0 18px rgba(239, 68, 68, 1),
    0 0 44px rgba(203, 58, 58, 0.85),
    0 0 72px rgba(239, 68, 68, 0.7);
}
`;

// A regular polygon's points (n sides · centered 14,14 · radius 11 · flat-bottom orientation).
function polygonPoints(n: number, rot = -Math.PI / 2, r = 11): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI + rot;
    pts.push(`${(14 + r * Math.cos(a)).toFixed(2)},${(14 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// The eight polygons: position 0 = THE OBSIDIAN TRIANGLE — flipped POINT-DOWN, the outline
// WHITE with a shadowed off-white border glow, the body an obsidian-like volume (the radial
// inset shadow darkening toward the edges + the glassy sheen sliver + the speckle texture),
// the diamond INLAID in pewter-light (the pairing); positions 1-7 = square → decagon, neon
// suite outlines.
function suitePolygonShapes(): string {
  let shapes = '';
  for (let i = 0; i < 8; i++) {
    const sides = i + 3;
    let body = '';
    let inlay = '';
    if (i === 0) {
      const tri = polygonPoints(3, Math.PI / 2); // point-DOWN
      const triInner = polygonPoints(3, Math.PI / 2, 9); // the inset-shadow inner line
      body =
        `<defs>` +
        `<radialGradient id="hf-obsidian" cx="0.42" cy="0.32" r="0.95">` +
        `<stop offset="0%" stop-color="rgb(28,28,34)"/>` +
        `<stop offset="55%" stop-color="rgb(13,13,17)"/>` +
        `<stop offset="100%" stop-color="rgb(4,4,6)"/>` +
        `</radialGradient>` +
        `<clipPath id="hf-obsidian-clip"><polygon points="${tri}"/></clipPath>` +
        `</defs>` +
        // The obsidian body — the radial fill IS the inset shadow (dark pooling at the edges).
        `<polygon points="${tri}" fill="url(#hf-obsidian)" stroke="rgb(255,255,255)" stroke-width="1.6"/>` +
        // The inner shadow line — the volume's lip.
        `<polygon points="${triInner}" fill="none" stroke="rgba(0,0,0,0.65)" stroke-width="1.4"/>` +
        // The glassy sheen sliver + the speckle texture, clipped to the triangle.
        `<g clip-path="url(#hf-obsidian-clip)">` +
        `<circle cx="10.5" cy="11" r="0.55" fill="rgba(232,233,238,0.22)"/>` +
        `<circle cx="17" cy="9.5" r="0.4" fill="rgba(232,233,238,0.16)"/>` +
        `<circle cx="14.5" cy="16" r="0.45" fill="rgba(232,233,238,0.12)"/>` +
        `</g>`;
      // No graphic within (user): the interior is just starry space + the inner shadow.
    } else {
      body = `<polygon points="${polygonPoints(sides)}" fill="none" stroke="currentColor" stroke-width="2"/>`;
    }
    shapes += `<span class="standby-shape"><svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">${body}${inlay}</svg></span>`;
  }
  return shapes;
}

// GITM A↔B (#641) — the standby variant. 'turn-over' is the normal connection-turnover
// notice; 'b-failed-reverting' is the failsafe message the deadline timer swaps in when B
// never booted (the system is restoring the stable A branch).
//
// SORD Shield/Sword (Macro Diamond · D5/TVOS) — two SORD-routed turn-over variants. 'shield-a'
// is the recovery/return-to-stable-A overlay (the Shield-A turn-over); 'sword-b' is the
// carry-changes-onto-B overlay (the Sword-B turn-over). TEXT-ONLY variants — the shield/sword
// GRAPHIC is deferred polish; the shapes/frame/bracket/CSS are identical across all modes.
export type StandbyMode = 'turn-over' | 'b-failed-reverting' | 'shield-a' | 'sword-b';

const STANDBY_TEXTS: Record<StandbyMode, { title: string; subtitle: string; note: string }> = {
  'turn-over': {
    title: 'BRIDGE TURN OVER',
    subtitle: 'STAND BY &middot; CEASE ACTIVITY',
    note: 'the system resumes automatically',
  },
  'b-failed-reverting': {
    title: 'B FAILED &middot; REVERTING',
    subtitle: 'RETURNING TO STABLE A',
    note: 'the system is restoring the stable branch',
  },
  'shield-a': {
    title: 'RETURN TO STABLE A',
    subtitle: 'STAND BY &middot; RECOVERING',
    note: 'restoring the stable branch',
  },
  'sword-b': {
    title: 'TURN OVER TO B',
    subtitle: 'STAND BY &middot; CARRYING CHANGES',
    note: 'the system resumes automatically',
  },
};

// STRATIPUNK TURN-OVER EXPRESSIONS (W2 · the naming line · C637) — the human-readable class name
// per register. Surfaced as an EYEBROW sub-line above the content title (NOT a title replacement):
// the existing title strings carry load-bearing message content ("TURN OVER TO B" · "RETURN TO
// STABLE A") that fidelity requires be retained, so the class name rides its own tinted line and
// the title stays intact.
const STANDBY_CLASS_NAMES: Record<StandbyTurnClass, string> = {
  shield: 'SHIELD',
  sword: 'SWORD',
  sparks: 'SPARKS',
};

// The markup is mode-parameterized — only the title/subtitle/note strings swap; the shapes,
// frame, bracket, styles, and layout are identical across modes. The turn-over CLASS adds the
// eyebrow naming line (W2) and drives the accent register via the overlay-root body-class (W3).
// The register a mode implies when no explicit class is passed (the honest default per leg):
//   'sword-b'            → SWORD  (the carry-onto-B experiment)
//   'shield-a'           → SHIELD (the recovery/return-to-stable-A)
//   'b-failed-reverting' → SHIELD (the failsafe reverts TO A)
//   'turn-over'          → SHIELD (the plain restart · the retained scheme · zero regression)
// The hard turn-over (SPARKS) uses the plain 'turn-over' message but MUST pass 'sparks' explicitly
// — the mode alone cannot distinguish an A-leg fallback (Shield) from a hard reset (Sparks).
// C638 · THE LOGO BADGE ICONS (user law: the Bridge's own iconography, centered to the user) —
// Shield/Sword ride the SAME FA glyphs their Tactical Bridge buttons wear (fa-shield-halved ·
// fa-khanda); Sparks wears the honest spark (fa-bolt — the hard button's fa-rotate is a verb,
// not the class identity). FA resolves via the client's CDN kit (vue.principle:522).
const STANDBY_CLASS_ICONS: Record<StandbyTurnClass, string> = {
  shield: 'fa-shield-halved',
  sword: 'fa-khanda',
  sparks: 'fa-bolt',
};

function turnClassForMode(mode: StandbyMode): StandbyTurnClass {
  if (mode === 'sword-b') return 'sword';
  return 'shield';
}

function buildStandbyMarkup(mode: StandbyMode, turnClass: StandbyTurnClass): string {
  const texts = STANDBY_TEXTS[mode];
  const className = STANDBY_CLASS_NAMES[turnClass];
  return `
  <div class="standby-frame"></div>
  <div class="standby-core">
    <div class="standby-shapes">
      ${suitePolygonShapes()}
    </div>
    <div class="standby-logo-badge"><i class="fa-solid ${STANDBY_CLASS_ICONS[turnClass]}" aria-hidden="true"></i></div>
    <p class="standby-class-name">${className} &middot; TURN OVER</p>
    <h1 class="standby-title">${texts.title}</h1>
    <p class="standby-subtitle">${texts.subtitle}</p>
    <p class="standby-timer">00:00</p>
    <p class="standby-note">${texts.note}</p>
    <pre class="standby-stream"></pre>
    <p class="standby-hint">the toolbar remains live &middot; Turn Over A reverts to the stable branch</p>
  </div>
  <div class="standby-bracket">
    <span class="bracket-tick left"></span>
    <span class="bracket-rail"></span>
    <span class="bracket-tick right"></span>
  </div>
`;
}

/**
 * Mount the standby overlay onto document.body. Idempotent for the SAME mode: a second
 * call while the overlay is already present is a no-op, so repeated connection losses do
 * not stack overlays. The overlay is cleared automatically when the page reloads on
 * reconnection.
 *
 * GITM A↔B (#641): when the failsafe fires ('b-failed-reverting') while a plain
 * 'turn-over' standby is ALREADY mounted, the idempotency guard would block the message
 * upgrade — so an already-mounted overlay performs an INNER-TEXT SWAP instead of returning
 * (single overlay, no double-mount).
 *
 * STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · C637): the optional `turnClass` selects the
 * functional color register (SHIELD / SWORD / SPARKS · W3). Absent ⇒ derived from the mode
 * (turnClassForMode) so unthreaded/legacy callers land on SHIELD — the retained scheme, zero
 * visual regression. The failsafe upgrade also flips the root register class to SHIELD (it
 * reverts TO A), re-tinting the accents + the eyebrow of an already-mounted (possibly SWORD)
 * overlay in place.
 */
export const showBridgeStandby = (
  mode: StandbyMode = 'turn-over',
  progress?: GitmTurnoverProgress | null,
  turnClass?: StandbyTurnClass,
): void => {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  const resolvedClass: StandbyTurnClass = turnClass ?? turnClassForMode(mode);

  const existing = document.getElementById(STANDBY_OVERLAY_ID);
  if (existing) {
    // C639 · THE STICKY-EXPLICIT REGISTER — an EXPLICIT turnClass on a re-show re-tints the
    // mounted overlay in place (register classes + eyebrow + badge glyph); a derived default
    // NEVER downgrades an expression that a trigger declared (the Shield-on-B field round:
    // whichever show mounts first, the declared class wins).
    if (turnClass && !existing.classList.contains(standbyClassName(turnClass))) {
      existing.classList.remove('standby-express-shield', 'standby-express-sword', 'standby-express-sparks');
      existing.classList.add(standbyClassName(turnClass));
      const classEl = existing.querySelector('.standby-class-name');
      if (classEl) classEl.innerHTML = `${STANDBY_CLASS_NAMES[turnClass]} &middot; TURN OVER`;
      const badgeEl = existing.querySelector('.standby-logo-badge i');
      if (badgeEl) badgeEl.className = `fa-solid ${STANDBY_CLASS_ICONS[turnClass]}`;
    }
    // Already mounted — upgrade the message in place when the failsafe fires.
    if (mode === 'b-failed-reverting') {
      const texts = STANDBY_TEXTS[mode];
      const classEl = existing.querySelector('.standby-class-name');
      const titleEl = existing.querySelector('.standby-title');
      const subtitleEl = existing.querySelector('.standby-subtitle');
      const noteEl = existing.querySelector('.standby-note');
      // Flip the register class to SHIELD (revert TO A) so the accents + eyebrow re-tint in place.
      existing.classList.remove('standby-express-shield', 'standby-express-sword', 'standby-express-sparks');
      existing.classList.add(standbyClassName(resolvedClass));
      if (classEl) classEl.innerHTML = `${STANDBY_CLASS_NAMES[resolvedClass]} &middot; TURN OVER`;
      if (titleEl) titleEl.innerHTML = texts.title;
      if (subtitleEl) subtitleEl.innerHTML = texts.subtitle;
      if (noteEl) noteEl.innerHTML = texts.note;
    }
    return;
  }

  if (!document.getElementById(STANDBY_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STANDBY_STYLE_ID;
    style.textContent = STANDBY_STYLES;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = STANDBY_OVERLAY_ID;
  overlay.classList.add(standbyClassName(resolvedClass));
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.innerHTML = buildStandbyMarkup(mode, resolvedClass);
  document.body.appendChild(overlay);

  // THE STALL TIMER (user design · Cycle 261): elapsed mm:ss from mount. The user working in
  // the retained top/bottom fifths gets a FEEL for a stalled turn-over — past the expected
  // beat, the LIVE toolbar's Turn Over A is the revert. Self-clearing: the interval kills
  // itself when the overlay leaves the DOM (page reload anor manual removal).
  const startedAt = Date.now();
  const timerEl = overlay.querySelector('.standby-timer');
  const titleEl = overlay.querySelector('.standby-title');
  // THE ESCALATING PULSE (user design): every 15 elapsed seconds the stall deepens — pulseLevel
  // climbs (cap 4), swapping the .standby-title pulse-N class + mirroring on document.body's
  // data-standby-pulse so the LIVE toolbar's Turn Over A escalates in lockstep (style.css).
  let pulseLevel = 0;
  const timerInterval = setInterval(() => {
    if (!document.getElementById(STANDBY_OVERLAY_ID)) {
      clearInterval(timerInterval);
      delete document.body.dataset.standbyPulse;
      return;
    }
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (timerEl) {
      timerEl.textContent =
        String(Math.floor(elapsed / 60)).padStart(2, '0') +
        ':' +
        String(elapsed % 60).padStart(2, '0');
    }
    const nextLevel = Math.min(4, Math.floor(elapsed / 15));
    if (nextLevel !== pulseLevel) {
      pulseLevel = nextLevel;
      if (titleEl) {
        titleEl.classList.remove('pulse-1', 'pulse-2', 'pulse-3', 'pulse-4');
        if (pulseLevel > 0) titleEl.classList.add(`pulse-${pulseLevel}`);
      }
      if (pulseLevel > 0) {
        document.body.dataset.standbyPulse = String(pulseLevel);
      } else {
        delete document.body.dataset.standbyPulse;
      }
    }
  }, 1000);

  // BOOT-STREAM (the live tail · user design): poll the re-booting SCP's boot log across the
  // respawn gap and render the last 8 lines into .standby-stream. Same DOM-existence self-clear
  // guard as the timer — the interval kills itself (and clears the pulse mirror) when the overlay
  // leaves the DOM. Requires the carrier (bridgeEndpoint + scpName); silent no-op otherwise.
  const bootEndpoint = progress?.bridgeEndpoint ?? '';
  const bootScpName = progress?.scpName ?? '';
  const streamEl = overlay.querySelector('.standby-stream');
  if (bootEndpoint && bootScpName && streamEl) {
    const pollBootStream = async (): Promise<void> => {
      try {
        const res = await fetch(`${bootEndpoint}/scp-boot-log/${bootScpName}`);
        if (!res.ok) return;
        const data = (await res.json()) as { lines?: string[] };
        const lines = Array.isArray(data.lines) ? data.lines : [];
        streamEl.textContent = lines.slice(-8).join('\n');
      } catch {
        /* the SCP is mid-reboot — the poll simply misses until it comes up */
      }
    };
    void pollBootStream();
    const bootInterval = setInterval(() => {
      if (!document.getElementById(STANDBY_OVERLAY_ID)) {
        clearInterval(bootInterval);
        delete document.body.dataset.standbyPulse;
        return;
      }
      void pollBootStream();
    }, 1000);
  }
};
