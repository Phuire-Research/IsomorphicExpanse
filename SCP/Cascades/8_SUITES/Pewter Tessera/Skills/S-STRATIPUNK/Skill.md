# S-STRATIPUNK — the StratiPUNK Extension of HiFi Functional Design

**Suite 8**: Pewter Tessera · **Skill ID**: D9 (extends D1-D8)
**Status**: PROVEN — the Bridge Turn-Over Standby (d1e65d4 + the Suite Polygon Sequence) is the Reference Design; the user's verdict: "Nailed It" / "Captured it On Point."
**Lineage**: HiFi Functional Design (D1-D8) → StratiPUNK (D9) — the same token system, pushed to the FULL-SCREEN CEREMONIAL register.

---

## When StratiPUNK fires

HiFi (D1-D8) styles the WORKING surfaces — panes, buttons, badges: functional beauty that serves without competing. **StratiPUNK fires when the SYSTEM ITSELF takes the stage**: full-screen system moments — the turn over, the standby, the boot, the jump. The user is NOT working; the user is WITNESSING. The register shifts from craftsman-quiet to **starship-ceremonial** — the on-screen warning of a vessel about to jump.

## The Six Elements (the proven recipe)

1. **THE DEEP FIELD** — a radial gradient backdrop (a dark suite-tinted core → near-black edges) + the scanline grain (a subtle repeating-linear-gradient). The room goes dark before the announcement.
2. **THE NEON FRAME** — an inset border (~14px) with DUAL-LAYERED glow (one suite color outer + its ceremonial partner inner — the proven pair: blue outer + fuchsia inner, the turn-over-btn lineage) and **chamfered corners** (clip-path polygon cuts ~22px — the angular signature). The frame BREATHES (a 2-3s glow pulse).
3. **THE CEREMONIAL TYPE** — the heading font (Orbitron-class) large, letter-spaced, neon text-shadowed in the frame's pair; the directive line beneath in the partner color; one mono reassurance line ("the system resumes automatically" class) — command, consequence, comfort.
4. **THE BRACKET** — the `[ ──────── ]` form near the bottom edge: pewter-neutral corner ticks + a horizontal rail carrying a neon gradient (the frame's pair), glow-pulsing. The stage's lower lip.
5. **THE GEOMETRIC CHARGE** — the loading animation as NEON GEOMETRY pulsing in SEQUENCE (staggered animation-delay) with a long second keyframe that ACCELERATES + brightens (the hyperspace charge). **The canonical set: THE SUITE POLYGON SEQUENCE** — eight regular polygons, the triangle (3 sides) ascending one side per position to the decagon (10); position 0 dark (onyx fill · a small diamond INLAID in pewter-light — the pairing); positions 1-7 neon suite-color outlines. Pure transform/opacity/filter — GPU-only.
6. **THE AUTOMATIC EXIT** — StratiPUNK screens NEVER require dismissal: the system event that summoned them ends them (the reload replaces the page · the boot completes). No close button exists.

## The Constraints

- The suite `--color-*` tokens with literal fallbacks (the screen must survive a tokenless context).
- Idempotent mount (a guard against double-append) · SSR-safe (`typeof document` guard) · `role="alert"`.
- The Output Firewall: shipped strings are professional frontend code; the copy is the user-facing warning only.
- GPU-only animation (transform/opacity/filter — never layout properties).
- `prefers-reduced-motion` honor is the standing deferral — add when the skill next fires.

## The Reference Design

`Cascades/scps/template/SCP/src/concepts/webSocketClient/model/bridgeStandbyOverlay.model.ts` — `showBridgeStandby()` · mounted at the WebSocket close before the ping loop · torn down by the reload.
