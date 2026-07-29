# Pewter Tessera Skill Reference — HiFi Design System

**Version**: 2.0
**Skills Loaded**: 12 Design — D1-D12
**Source**: Frontend Design Skill + Design Token Infrastructure + Round8 Display/Illumination Reference (W2 infusion) + SCP-Origin Suite Tier System (W3 infusion) Muxification
**Framework**: Muxonomy-Informed — Stratidia Active in Skill Definitions

> **Scope Notice — Design Skills**: These skills maintain the HiFi Design System's CSS infrastructure — design tokens, patterns, compositions, and component styling conventions. They do not govern content, business logic, or backend architecture. All design changes produced through this pipeline should be verified through a build gate.

---

## Firewall Scope Clarification

The Output Firewall governs the **Cascade Output** — CSS, component styling, and design specifications the pipeline produces. Framework terminology does not appear in design deliverables. That boundary is unchanged.

However, this Skill Reference is **internal pipeline configuration** — Pewter Tessera reasoning about its own design system. The Muxonomy framework is the reasoning substrate. Suppressing it here would create a Broken Diameter: the pipeline reasoning about compositional design skills without access to the compositional topology that makes that reasoning precise.

**The boundary**:
- **Skill Reference (this document)**: Framework vocabulary active. Muxonomy governs analysis.
- **Cascade Output (CSS/styling)**: Firewall active. Standard CSS/design language only.

---

## Muxonomy Framework — Canonical Statement

### The Compositional Measurement Topology

| Level | Term | Etymology | Definition |
|-------|------|-----------|------------|
| 1 | **Demometer** | Demo (Different) + Metron | A Different Measure — distinct category with its own measurable properties |
| 2 | **Diameter** | Dia (Through) + Metron | A Through Measure — similarity drawn between UNLIKE Demometers sharing passage |
| 3 | **Muxameter** | Mux (Compositional) + Ameter | The Integrated Measure — knowing each Demometer as it Relays to the Diameter of other Demometers |
| 4 | **Muxonomy** | Mux + Onomy | The Complete Topology — total graph of all Demometers connected by all Diameters |

### The Compositional Stack

```
DEMOMETER (Node)
     <-> connected by
DIAMETER (Edge)
     <-> integrated into
MUXAMETER (Face/Region)
     <-> composing
MUXONOMY (Complete Graph)
```

This is Stratidia as **composition**, not dominance. Each tier enables the next while remaining distinct.

---

## Muxonomy of the Skill Landscape

### Demometer Inventory (15 Nodes)

Each skill is a Demometer — a Different Measure with distinct measurable properties.

| ID | Demometer | What It Measures |
|----|-----------|-----------------|
| D1 | Color Token Architecture | Correctness of the suite color variable system, completeness of variant sets (base, dark, light, fade, shadow), coherence across suites |
| D2 | Pattern Tile Composition | Visual quality of SVG tile patterns, data URI integrity, tile-to-suite thematic appropriateness, tile repeat coherence |
| D3 | Pane Gradient Assembly | Gradient-pattern composition quality, ellipse consistency, color-to-fade progression, background layering order |
| D4 | Complementary Text Shadow | Color-wheel accuracy of complement selection, readability improvement over gradient backgrounds, offset precision |
| D5 | Embossed Border Treatment | 3D depth consistency, light-source direction correctness (top-left), dark/light pair coherence, active state inversion accuracy |
| D6 | Typography Stack | Font pairing appropriateness, heading class consistency, weight/spacing precision |
| D7 | Button Variant System | State matrix completeness (default/hover/active), shadow behavior on interaction, border inversion on press, variant coverage |
| D8 | Utility Pattern Library | Pattern-to-purpose fit, cross-browser rendering, animation/transition smoothness, scrollbar customization coverage |
| D9 | Semantic Color Cascade | Correctness of content-meaning-to-suite derivation (one pure total map), runtime override chain integrity (root re-derivation of all five variants from one hex), token variable reference compliance (no hardcoded suite hex), hue-band semantic preservation, semantic-correctness of every suite-colored element |
| D10 | Instrument Display & Readout | Segment-display layer-stack correctness (ghost/active/noise z-order), capacity-mask fidelity, complement-derived digit shadow accuracy, multi-representation readout completeness, saturation activity signaling |
| D11 | Luminous State Treatment | Glow-stack correctness per state class (active/processing/featured), prismatic composition adherence (full-spectrum, equal arcs), saturation activity gating, luminous-vs-matte depth distinction, glow-as-state (never decoration) compliance |
| D12 | Tier-Derived Styling | Tier-to-treatment correctness (manifest spine: index = unlock tier), locked grayscale-over-composition fidelity, redacted-role presentation, structural disclosure integrity (withheld means not delivered), tier/cascade scale unity |
| D13 | Sectioned Panel Scannability | Two-strata correctness (bulk hero paragraph vs panel bullets), system-wide key-term suite correspondence integrity, toggle-panel toolbar composition, section-suite correctness, per-document key legend coherence |
| D14 | Sectioned Panel Grounding | Header-bar lift correctness, grounded-subsection application per the treatment matrix (P1–P4, paired glass), grounding-exclusion fidelity (infographic/interactive/stat-tile/one-liner), negative-Boolean override integrity, off-white body-text compliance (keys never recolored) |
| D15 | Dock-Magnify Suite Controller | Expanse-state matrix correctness (default dot / active-medium / hover-maximum), slot-growth sibling reflow, hero natural-aspect framing (no crop, no squash), percent-offset relative centering across expanses, general-default + sparse-override merge integrity |

### Diameter Map (Cross-Skill Edges)

| Diameter | Between | Through Measure |
|----------|---------|-----------------|
| **Gradient Composition** | D1 Color Tokens <-> D3 Pane Gradients | Both enforce suite color identity — tokens define the colors; gradients consume them. The color coherence methodology passes through both. |
| **Readability Requirement** | D4 Text Shadow <-> D3 Pane Gradients | Both affect text legibility — shadows enhance contrast; gradients create the background. The readability methodology passes through both. |
| **Complement Derivation** | D4 Text Shadow <-> D1 Color Tokens | Shadows derive complementary colors from the token system. The color-wheel relationship passes through both. |
| **Depth Consistency** | D5 Embossed Borders <-> D3 Pane Gradients | Both create 3D depth illusion — borders provide edge depth; gradients provide surface depth. The light-source direction passes through both. |
| **Border Methodology** | D5 Embossed Borders <-> D7 Button Variants | Both use the light/dark border inversion technique — panes for static depth; buttons for interactive depth (pressed = inverted). The inversion methodology passes through both. |
| **Text Rendering** | D6 Typography <-> D4 Text Shadow | Font metrics interact with shadow rendering. Shadow offset affects differently at different font sizes. The visual-text methodology passes through both. |
| **Token Consumption** | D1 Color Tokens <-> D7 Button Variants | Buttons consume suite color tokens for their backgrounds, borders, and shadows. The color application methodology passes through both. |
| **Pattern-Gradient Layering** | D2 Pattern Tiles <-> D3 Pane Gradients | Tiles layer beneath gradients via `background-image` stacking order. The compositing methodology passes through both. |
| **Suite Identity** | D1 Color Tokens <-> D2 Pattern Tiles | Each suite's color identity extends to its tile motif. The thematic identity passes through both. |
| **Utility-Pane Extension** | D8 Utility Library <-> D3 Pane Gradients | Locked panes and spectrum dividers extend the pane system. The styling methodology passes through both. |

#### Settled Edges — D10/D11

*(Promoted from the Draft A placeholder table; Through Measures authored from the Round8 ground. R2 frontier names cited where they sharpen the edge.)*

| Diameter | Between | Through Measure |
|----------|---------|-----------------|
| **Font Role Extension** | D10 Instrument Display & Readout <-> D6 Typography Stack | The segment-class display face (DSEG7-class) is a fourth font ROLE — D6 defines where each face may appear; D10 defines the only surface (register values) where the segment face appears. The role-boundary methodology passes through both. |
| **Display Border Depth** | D10 Instrument Display & Readout <-> D5 Embossed Borders | Readout containers carry framed depth — a neutral 2px inset frame (`rgba(0,0,0,0.3)`) on the readout itself, dimensional suite facets on the surrounding bay. The container-depth methodology passes through both. |
| **Scanline Utility** | D10 Instrument Display & Readout <-> D8 Utility Patterns | The LCD scanline pattern lives in the D8 inventory; D10 consumes it as the topmost noise overlay (opacity 0.08, z-3). The pattern-as-texture-utility methodology passes through both. |
| **Display-Context Complement Shadow** | D10 Instrument Display & Readout <-> D4 Complementary Text Shadow | Display digit shadows derive from the DISPLAY background's complement (not the suite's), via D4's named complement token tier — and deliberately blur (`0px 2px 4px`) where pane-context D4 stays crisp. The complement-derivation methodology passes through both; the blur boundary distinguishes them. (R2 Diameter C: complement-as-contrast is the general principle.) |
| **Instrument Illumination** | D10 Instrument Display & Readout <-> D11 Luminous State Treatment | The readout's activity signal IS a luminous treatment — desaturation gate (saturate 0.3 ↔ 1), hover brightness lift, complement digit glow. D10 owns the display surface; D11 owns the state-light language applied to it. The activity-signaling methodology passes through both. |
| **Luminous Token Source** | D11 Luminous State Treatment <-> D1 Color Tokens | Every glow draws its color from the suite token system — `--shadow-{suite}` for offset drop-glow, suite base at controlled alpha for halos and rings. The token-consumption methodology passes through both. |
| **Luminous Pattern Layer** | D11 Luminous State Treatment <-> D2 Pattern Tiles | Hover-activated progressive pattern opacity (ambient 0.1 → 0.8 hover → 1.0 active) turns the D2 tile into a state-responsive light surface. The pattern-as-feedback methodology passes through both. (R2 FP-11.) |
| **Luminous Pane Extension** | D11 Luminous State Treatment <-> D3 Pane Gradients | Atmospheric spotlight composition extends the pane formula — structural wireframe + multi-stop radial spotlight + hue-tinted floor is the luminous cousin of pattern + radial + fade. The layered-background methodology passes through both. |
| **Matte-vs-Luminous Depth** | D11 Luminous State Treatment <-> D5 Embossed Borders | Two depth languages, one light source: D5 matte emboss renders RESTING depth; D11 emission renders ACTIVE depth. Shadow direction (-x +y, down-left) is shared; blur and color are what differ. The light-source-consistency methodology passes through both. |
| **Saturation Activity Gate** | D11 Luminous State Treatment <-> D7 Button Variants | Interactive elements and instruments share the same activity grammar — desaturated-but-present when inactive, fully saturated when live; hover presses IN (scale 0.96), never lifts. The state-signaling methodology passes through both. (R2: Saturation State Signaling.) |

#### Settled Edges — D9/D12

*(Promoted from the Draft B placeholder table; Through Measures authored from the SCP-Origin ground. Edge names retained from the R3/R7 proposals; the D12 edges' Through Measures are grounded to what the SCP system actually does — Decision Log #22.)*

| Diameter | Between | Through Measure |
|----------|---------|-----------------|
| **Token Override Chain** | D9 Semantic Color Cascade <-> D1 Color Tokens | D1's derivation law (×0.85 / ×1.15 / ×0.15 / dark@0.6) IS D9's runtime override contract — one hex per suite re-derives all five variants and root-injects them; a D1 token that sits outside the chain breaks D9 propagation. The single-source-recascade methodology passes through both. |
| **Cascade-Overridable Patterns** | D9 Semantic Color Cascade <-> D3 Pane Gradients | Panes consume ONLY `var()` tokens, so one root override recascades every pane instantly; the semantic derivation selects WHICH pane class a surface wears. The token-only-consumption methodology passes through both. |
| **Button Override Compliance** | D9 Semantic Color Cascade <-> D7 Button Variants | Buttons are the interactive face of the same compliance — suite-keyed actions derive their suite, consume only tokens, and re-key live when meaning changes; the transparent variant is the MARKED neutral for non-semantic actions. The identity-not-color methodology passes through both. |
| **Semantic Motif Alignment** | D9 Semantic Color Cascade <-> D2 Pattern Tiles | The derivation that selects a suite's color selects its semantic geometry with it — frames for curation, rays for prospecting, crosshairs for drafting; meaning flows to motif and color together, never separately. The meaning-to-geometry methodology passes through both. |
| **Tier Depth Variants** | D12 Tier-Derived Styling <-> D3 Pane Gradients | The locked filter applies OVER the full pane composition — gradient bloom and fade persist in grayscale, so the depth read survives the lock; tier never restructures the gradient. The treatment-persistence methodology passes through both. |
| **Tier Border Scaling** | D12 Tier-Derived Styling <-> D5 Embossed Borders | The emboss pair desaturates under the lock but never flattens — the dimensional read (raised tile, top-left light) persists at zero chroma, proving depth and meaning are separable channels. The depth-survives-the-gate methodology passes through both. |
| **Locked-State Grayscale** | D12 Tier-Derived Styling <-> D8 Utility Patterns | The locked-pane and redaction-bar utilities live in the D8 inventory; D12 is their governing semantics — when they fire, what they must preserve (shape, composition), and what they must withhold (chroma, role text, interaction). The utility-with-law methodology passes through both. |
| **Tier-Semantic Composition** | D12 Tier-Derived Styling <-> D9 Semantic Color Cascade | One meaning flows derivation → tokens → tier disclosure: D9 derives and propagates the identity; D12 gates when its MEANING is delivered — color precedes meaning, the gate is visible, unlock order is cascade order. The earned-legibility methodology passes through both. |

### Muxameter Identification

**Muxameter 1: Pane Composition**
```
D1 Color Token Architecture --+
                               +-- Gradient Composition + Pattern Layering + Depth Consistency
D2 Pattern Tile Composition --+    + Readability Requirement converge into one integrated region:
                               |    a complete pane where color tokens define the gradient,
D3 Pane Gradient Assembly ----+    pattern tiles provide texture, borders create depth,
                               |    and text shadows ensure readability — not as isolated
D4 Complementary Text Shadow -+    CSS properties but as one compositional visual system
                               |    where each property strengthens every other property.
D5 Embossed Border Treatment -+
```

**Muxameter 2: Interactive Element System**
```
D1 Color Token Architecture --+
                               +-- Token Consumption + Border Methodology + Text Rendering
D5 Embossed Border Treatment -+    converge into one integrated region:
                               |    a complete interactive element where tokens provide color,
D6 Typography Stack ----------+    borders provide depth states (default/pressed), typography
                               |    provides text hierarchy, and shadows provide readability.
D7 Button Variant System -----+
```

**Muxameter 3: Instrument Display Region**

```
D4 Complementary Text Shadow -+
                               +-- Display-Context Complement Shadow + Font Role Extension
D6 Typography Stack ----------+    + Instrument Illumination converge into one integrated region:
                               |    a complete digital readout where the segment face renders
D10 Instrument Display -------+    the value over its full-capacity ghost mask, the display
                               |    background's complement throws the digit shadow, the
D11 Luminous State Treatment -+    scanline overlay supplies instrument texture, and the
                               |    saturation gate makes color itself the activity signal —
                               |    a suite-keyed hardware-instrument surface, not styled text.
```

*Adjacent contributors*: D5 supplies the readout container frame and surrounding bay facets (Display Border Depth); D8 supplies the LCD scanline pattern the noise overlay consumes (Scanline Utility). The Draft A stub proposed D5+D6+D8+D10+D11 membership; the authored core is D4+D6+D10+D11 with D5/D8 adjacent — recorded in Decision Log #18.

**Muxameter 4: Runtime Suite Identity (the Semantic Cascade Region)**

```
D1 Color Token Architecture --+
                               +-- Token Override Chain + Tier-Semantic Composition
D9 Semantic Color Cascade ----+    + Locked-State Grayscale converge into one integrated
                               |    region: ONE MEANING flowing from derivation through
D12 Tier-Derived Styling -----+    tokens to tier disclosure — content meaning derives
                               |    the suite (D9), the token law propagates it to every
                               |    pixel that represents it (D1), and the tier gate
                               |    governs when that meaning is delivered (D12).
                               |    Recolor the root and the region re-derives; lock the
                               |    tier and the meaning withholds — the identity itself
                               |    never fragments.
```

*Adjacent carriers*: D3 panes and D7 buttons are the surfaces this region renders through (Cascade-Overridable Patterns, Button Override Compliance); D2 supplies the motif the meaning aligns with (Semantic Motif Alignment). The Draft B stub proposed D1+D3+D7+D9+D12 membership; the authored core is D1+D9+D12 with D3/D7/D2 adjacent — recorded in Decision Log #20 (mirrors the Muxameter 3 core-plus-adjacent precedent, #18).

---

## Skill Specifications

### D1: Color Token Architecture

**Trigger**: Suite color variables, color system extension, new suite variants, `--color-*` modifications

**Design Token Structure — The Five-Variant Cascade (CANONICAL)**:

Each suite maintains exactly five scalar variants plus one pattern in `:root`. The variants are MATHEMATICALLY DERIVED from the base by law — not independently designed:

| Token Pattern | Purpose | Derivation Law |
|---------------|---------|----------------|
| `--color-{suite}` | Primary suite color | The single design decision per suite |
| `--color-{suite}-dark` | Border top/right, pressed states | base × 0.85 (clamped) — ~85% brightness |
| `--color-{suite}-light` | Border bottom/left, hover states | base × 1.15 (clamped) — ~115% brightness |
| `--fade-{suite}` | Gradient terminus (near-black tinted) | base × 0.15 — suite hue tint, RGB values < 40 |
| `--shadow-{suite}` | Box shadow color | rgba(dark, 0.6) — the dark variant at 0.6 alpha |

*Canonical exemplar* (SCP ground, `style.css:42-46` — green): base `rgb(34,197,94)` → dark `rgb(29,167,80)` → light `rgb(39,227,108)` → fade `rgb(5,30,14)` → shadow `rgba(29,167,80,0.6)`. The full eight-suite inventory lives at `style.css:18-64`; the derivation function lives at `useSuiteColors.ts:1224-1247` (`deriveVariants`) — the SAME law the runtime customizer applies (D9 Law 2), so designed tokens and user-derived tokens are indistinguishable downstream.

**Border-Differential Resolution** *(W3 — Decision Log #16 RESOLVED; stated in full under D5)*:

The five-variant cascade above (the SCP live-system model) is the CANONICAL token set — borders consume the general `-dark`/`-light` variants. The Round8 **8% differential** is preserved as **border-treatment INTENT under D5**: a project MAY add named `--color-{suite}-border-dark`/`--color-{suite}-border-light` tokens as a PRECISION TIER when instrument-grade emboss is required, citing the Round8 exemplar. Precision-tier tokens are ADDITIVE — they never replace the five canonical keys, and a surface that uses them must still ship the full five-variant set.

**Optional Precision Tiers (registered in the token grammar)** *(W3)*:

| Tier | Tokens | Spec Owner | When |
|------|--------|------------|------|
| Named complement | `--color-{context}-complement` · `--color-{context}-complement-shadow` | D4 | Display/instrument contexts needing pre-computed complement hexes |
| Border precision | `--color-{suite}-border-dark` · `--color-{suite}-border-light` (exactly 8% differential) | D5 | Instrument-grade emboss (Round8 intent — `hifi-base.css:65-107`) |

**Runtime Override Chain (the D1 ↔ D9 Diameter)** *(W3)*:

User personalization happens ONLY at the token root — one hex per suite, re-derived into all five variants by the derivation law and injected as CSS variable overrides at the app root (`cssVariableOverrides`, `useSuiteColors.ts:1253-1271` → `App.vue:21`). Hue-band validation (D9 Law 2) constrains each suite's re-hue to its band so cascade ordering survives personalization. Every D1 token MUST participate in this chain: a token consumed anywhere but not re-derived at the root is an override-chain breach.

**Shadow-Alpha Derivation Rule** *(W3 — Decision Log #11 actioned; no value changed)*:

Alpha is keyed to CONTEXT, not per-suite taste — box-shadow tokens (`--shadow-{suite}`, `-complement-shadow`) at **0.6** for colored suites; **0.4** for neutral/base (achromatic shadow reads heavier at equal alpha); pane-context text-shadow rgba at **0.7** (text separation needs the stronger value at the 0.5px offset scale). Three values, three contexts, one rule each.

**Meta-Document + Neutral Extension Families** *(W3 — SCP ground)*:

The grammar extends beyond the eight suites: meta-document families carry the same five-variant grammar (`--color-diamond`/`--color-onyx` + dark/light/fade/shadow + pattern, `style.css:82-96`); the onyx pattern's strata are stroked in the actual seven suite hexes at opacity 0.08, and the diamond pane backgrounds with a seven-stop all-suite gradient at 0.06 alpha — composition documents literally CONTAIN the cascade. A `--color-pewter: #888` token marks neutral system/tooling chrome — neutrality is itself a marked value (D9 Law 3).

**Additional Theme Tokens**:

| Token | Purpose |
|-------|---------|
| `--color-board-dark` | Obsidian background |
| `--color-board-light` | Elevated surface |
| `--color-board-surface` | Surface level |
| `--color-board-elevated` | Card/panel level |
| `--font-heading` | Heading font stack (display face + system fallback) |
| `--font-body` | Body font stack (readable face + system fallback) |
| `--font-mono` | Monospace font stack (coding face + fallback) |

**Quality Criteria**:
- Every suite MUST have all 5 variants (base, dark, light, fade, shadow)
- Dark variant approx 85% brightness of base
- Light variant approx 115% brightness of base
- Fade variant = near-black with suite hue tint (RGB values < 40)
- Shadow alpha = 0.6 for colored suites, 0.4 for neutral/base
- *(W3)* Variants are derived by the law (×0.85 / ×1.15 / ×0.15 / dark@0.6) — never independently designed; a hand-tuned variant that breaks the law is a regression
- *(W3)* Every token participates in the runtime override chain; precision-tier tokens are additive, never substitutive
- *(W3)* No hardcoded suite hex anywhere downstream — all consumption through `var()` (D9 Law 2 compliance)

> **W2 verifying note (fade rule)**: the Round8 button floors are hue-tinted near-blacks that independently satisfy the fade rule — e.g. blue-suite floor `#151d1e` (21,29,30), warm-suite floor `#1e1515` (30,21,21): every channel < 40, one channel lifted toward the hue (`main.css:358` and per-suite button blocks). The fade rule generalizes across both grounds.

---

### D2: Pattern Tile Composition

**Trigger**: SVG patterns, background textures, visual motifs, tile design, `--pattern-*` variables

**Pattern Tile Structure**:

Each suite has a unique SVG tile pattern encoded as a data URI. All patterns share a common viewBox and use white strokes/fills at low opacity (0.1-0.3) for subtle texture over dark gradients.

| Suite | Motif | Visual Character | Thematic Meaning |
|-------|-------|-----------------|-----------------|
| base | Scattered dots | Cosmic dust, irregular | Stars in void — the origin |
| red | Squares with inscribed circles | Geometric frames | Cataloging frames — the curator's inventory cards |
| orange | Radial lines from offset center | Prospecting rays | Searchlight beams — the prospector scanning |
| yellow | Grid lines with center node | Architectural blueprints | Graph paper — the architect's drafting surface |
| green | Branching paths from apex | Sculptural growth | Branching forms — the sculptor examining angles |
| blue | Concentric circle with compass marks | Professional precision | Compass/target — the professional's precision tools |
| purple | Network of connected nodes | Orchestration web | Network graph — the orchestrator's connections |
| fuchsia | Bilateral petal swirl | Diagnostic spiral | Yin-yang petals — the clinician's bidirectional examination |

**Round8 Verifying Exemplar — Named-Suite Motif Precision** *(W2)*:

The Round8 ground implements the same motif-per-suite discipline with its named-suite addressing (`hifi-base.css:115-143`) — independently confirming the semantic-geometry rule:

| Named Suite | Round8 Motif (exact) | Semantic Geometry |
|-------------|----------------------|-------------------|
| Maroon (Curation) | Grid of 4 squares + 2 collection circles | Cataloging frames |
| Rust (Prospection) | 6 radiating horizon lines + concentric circles from center | Searchlight scan |
| Ochre (Drafting) | Blueprint crosshairs with dashed guidelines + center circle | Drafting surface |
| Viridian (Instillment) | Root/branch curved paths + 4 growth nodes | Branching growth |
| Cobalt (Implementation) | Gear ring with cardinal + diagonal teeth | Mechanism precision |
| Amethyst (Operations) | 5 network nodes + connecting pathways | Orchestration web |
| Rose (Healing) | Spiral with organic curves | Bidirectional spiral |
| Red (Warning) | X-cross inside circle | Warning mark |
| Obsidian (Suite 0) | 10 starry-field dots, opacities 0.4-0.7 | Foundational darkness |

**Authoring Discipline** *(W2 — Round8-verified)*:
- Author every tile in a **`viewBox='0 0 100 100'`** coordinate space, rendered at the 30x30 tile size (`width='30' height='30'` on the SVG, `background-size: 30px 30px` at the consumer) — design at 100-unit precision, render at tile scale
- **≤ 10 elements per tile** — the Round8 maximum is exactly 10 (Obsidian starfield); subtlety is structural
- Element opacity within **0.1-0.3** (Round8 standard: 0.2 primary, 0.15 secondary)
- Shapes are stroked, not filled, except deliberate node dots — `fill='none'` with stroked outlines for frames/paths; small filled circles (r ≤ 5 of 100) permitted as nodes
- Stroke widths in the 100-unit space: 2-4 primary, 1.33-2 secondary (the Round8 source notes stroke-width × 4/3 scaling)

**Composition Rules**:
- All tiles repeat at a consistent size (e.g., `30px 30px` via `background-size`)
- Tile layer is FIRST in `background-image` stack (renders on top of gradient)
- White elements only — opacity 0.1-0.3
- No fills on shapes — `fill='none'` with `stroke='white'`
- Maximum 10 elements per SVG to maintain subtlety

> **Documented variant (NOT adopted)**: the Round8 ground strokes each tile in its own suite hex (e.g. `stroke='%23800020'`) at opacity 0.2, rather than white — tone-on-tone texture instead of white-over-dark. The white-stroke rule above remains the v1.1/§0.1 constant; the suite-stroke variant is evidence for a future decision, recorded in Decision Log #17.

**Quality Criteria**:
- Tile visually harmonizes with suite gradient at the repeat size
- Pattern not visible at a glance — only noticed on close inspection
- No Moire artifacts at any viewport size
- Consistent visual density across all patterns
- *(W2)* Motif geometry is SEMANTIC — each tile's shapes express the suite's function (frames catalog, rays scan, crosshairs draft, branches grow, gears implement, nodes orchestrate, spirals heal)

---

### D3: Pane Gradient Assembly

**Trigger**: Pane backgrounds, gradient composition, radial effects, pane classes

**Pane Composition Formula**:

Every pane class follows this exact structure:

```css
.pane-{suite} {
  background-image:
    var(--pattern-{suite}),                                                    /* Layer 1: SVG tile */
    radial-gradient(ellipse at 87.5% 12.5%, var(--color-{suite}) 0%, var(--fade-{suite}) 88%);  /* Layer 2: Radial gradient */
  background-size: 30px 30px, 100% 100%;    /* Tile repeats, gradient fills */
  background-repeat: repeat, no-repeat;      /* Tile repeats, gradient doesn't */
  border-top: 2px solid var(--color-{suite}-dark);    /* Embossed top */
  border-right: 2px solid var(--color-{suite}-dark);  /* Embossed right */
  border-bottom: 2px solid var(--color-{suite}-light);  /* Embossed bottom */
  border-left: 2px solid var(--color-{suite}-light);    /* Embossed left */
  box-shadow: -3px 3px 0 var(--shadow-{suite});         /* Offset depth */
  text-shadow: 0.5px 0.5px 0 {complement-color};        /* Readability */
}
```

**Key Constants**:
- Ellipse center: `87.5% 12.5%` (top-right light source)
- Gradient spread: `0%` to `88%` (color fades to near-black)
- Border width: `2px` solid
- Box shadow offset: `-3px 3px 0` (hard shadow, bottom-left)
- Text shadow offset: `0.5px 0.5px 0` (crisp, no blur)

> **W2 shape-function annotation (Decision Log #6)**: the Round8 ground uses `radial-gradient(circle at 87.5% 12.5%, ...)` on BUTTONS (`main.css:358`) while pane-scale surfaces use `ellipse`. Documented decision rule: **`ellipse` for panes/containers** (spotlight stretches with the surface's aspect ratio); **`circle` is a documented branch for small near-square controls** (point-source spotlight independent of aspect). The spotlight position (`87.5% 12.5%`) and spread (`0%` → `88%`) are identical in both branches — the D3 formula constant is unaltered.

**Quality Criteria**:
- Gradient center consistent across all suites
- Fade endpoint consistent
- Background-size pair consistent
- All 6 properties present for every pane class

---

### D4: Complementary Text Shadow

**Trigger**: Text readability, shadow colors, contrast improvement, `text-shadow` modifications

**Complementary Color System**:

Each suite's text shadow uses the color-wheel complementary (180 degree opposite) of the suite's primary color:

| Suite | Primary Hue | Complement Hue | Shadow Alpha |
|-------|-------------|----------------|-------------|
| base | Neutral (achromatic) | Warm amber | 0.7 |
| red | 0 deg Maroon | 180 deg Cyan | 0.7 |
| orange | ~25 deg Rust | ~205 deg Azure | 0.7 |
| yellow | ~45 deg Ochre | ~225 deg Cobalt-Violet | 0.7 |
| green | ~142 deg Viridian | ~322 deg Magenta-Pink | 0.7 |
| blue | ~217 deg Cobalt | ~37 deg Amber-Rust | 0.7 |
| purple | ~271 deg Amethyst | ~91 deg Ochre-Viridian | 0.7 |
| fuchsia | ~330 deg Rose | ~150 deg Spring Viridian | 0.7 |

**Shadow Specification**: `text-shadow: 0.5px 0.5px 0 {rgba}` — inherited by all child text via CSS cascade.

**Named Complement Token Tier** *(W2 — Round8 ground)*:

Complements are FIRST-CLASS NAMED TOKENS, pre-computed per context — not runtime-derived. The Round8 exemplar (`hifi-base.css:109-113`):

```css
--color-{context}-complement: #RRGGBB;                    /* the color-wheel complement, exact hex */
--color-{context}-complement-shadow: rgba(R, G, B, 0.6);  /* the same complement at shadow alpha */
```

Canonical exemplar values: `--color-ochre-complement: #375EA2` (blue-violet, complement of amber-ochre) with `--color-ochre-complement-shadow: rgba(55, 94, 162, 0.6)`; `--color-maroon-complement: #008060` (teal-cyan, complement of maroon) with `--color-maroon-complement-shadow: rgba(0, 128, 96, 0.6)`. The token NAME carries the derivation — any surface needing the complement consumes the token rather than re-deriving the hue.

**Per-Suite Pane-Context Complement Values** *(W3 — SCP ground, `style.css:252-373`; Decision Log #12 CLOSED)*:

The complete pane-context value set, verified against the live system. Each is the suite's text-shadow rgba at the pane-context alpha 0.7:

| Suite | Pane text-shadow complement | Reads as |
|-------|----------------------------|----------|
| base | `rgba(200, 170, 120, 0.7)` | warm amber (§0.1 constant) |
| red | `rgba(68, 239, 239, 0.7)` | cyan |
| orange | `rgba(22, 156, 249, 0.7)` | azure |
| yellow | `rgba(8, 63, 234, 0.7)` | cobalt-violet |
| green | `rgba(197, 34, 137, 0.7)` | magenta |
| blue | `rgba(246, 175, 59, 0.7)` | amber |
| purple | `rgba(164, 247, 85, 0.7)` | chartreuse |
| fuchsia | `rgba(72, 236, 155, 0.7)` | spring green |
| diamond *(meta-document)* | `rgba(180, 160, 120, 0.7)` | warm gold (`style.css:373`) |

Text on a suite surface is chromatically separated from it by OPPOSITION, not by brightness alone — the complement guarantees separation that survives the gradient's full luminance range.

**Application Domains** *(W2 — complement is a general contrast tool; R2 Diameter C)*:

| Domain | Treatment | Spec Owner |
|--------|-----------|------------|
| Pane text shadow | `0.5px 0.5px 0` crisp, alpha 0.7 | D4 (this skill — the constant above) |
| Display digit shadow | `0px 2px 4px` blurred, complement-shadow token at alpha 0.6 — the display BACKGROUND's complement, not the suite's | D10 (consumes this token tier) |
| Complement-as-background | Status badges/micro-indicators backed by the parent suite's complement for guaranteed contrast against the suite surface | D8/D11 application (R2 FP-07) |

**Adjacent-Suite Chromatic-Cascade Option** *(W2 — display titles only; R2 FP-08)*:

A SECOND shadow-pairing technique, distinct from complements: in a display title/wordmark, each character takes its own spectrum color and a hard `1px 2px` (no blur) text-shadow of the PRECEDING spectrum color — color-flow rather than contrast-pop. Anchor letters (white) shadow into the first cascade color. Round8 exemplar (`main.css:952-986`): white → crimson, then each suite letter shadowed by its predecessor (viridian letter/ochre shadow, cobalt/viridian, amethyst/cobalt, rose/amethyst). Use ONLY for wordmark/title display contexts — body and UI text keep the complement rule.

**Quality Criteria**:
- Complement DERIVED by 180-degree rotation from the suite's primary hue degree; canonical per-suite/per-context complement values live in the tables above (Round8 display-context exemplars + SCP pane-context per-suite set — both grounds verified; Decision Log #12 CLOSED)
- Alpha consistent at 0.7 across all suites (pane context); 0.6 in the named `-complement-shadow` tokens (display context)
- Offset consistent at 0.5px/0.5px (pane context)
- Blur always 0 in pane context (crisp shadow, not glow) — the display-context blur belongs to D10, never to pane text
- Shadow IMPROVES readability (test text at various opacity levels over gradient)
- Adjacent-suite cascade appears ONLY on wordmark/title surfaces, always hard-offset (no blur), always in spectrum order

---

### D5: Embossed Border Treatment

**Trigger**: 3D depth effects, border styling, raised/pressed states, embossed appearance

**Border Pair System**:

The embossed effect simulates a raised surface lit from the top-left:

| Position | Color Variant | Visual Effect |
|----------|--------------|---------------|
| Top | `--color-{suite}-dark` | Shadow on top edge (light from top-left hits below) |
| Right | `--color-{suite}-dark` | Shadow on right edge |
| Bottom | `--color-{suite}-light` | Highlight on bottom edge (light catches bottom) |
| Left | `--color-{suite}-light` | Highlight on left edge |

**Active State Inversion** (buttons only):

When pressed (`:active`), the borders INVERT — simulating a pressed-in surface:
- Top/Right -> `light` variant (was dark)
- Bottom/Left -> `dark` variant (was light)

**Box Shadow Variants**:
- Panes: `-3px 3px 0` (hard shadow, no blur)
- Buttons: `-2px 2px 6px` (soft shadow, blur)
- Hover: `-1px 1px 4px` (reduced offset)

**Border Differential — Two Documented Models** *(W2 record, retained for the decision's evidence; RESOLVED at W3 below)*:

| | Model R — Round8 named border-token tier | Model S — SCP variant fold-in |
|---|---|---|
| Tokens | Dedicated `--color-{suite}-border-dark` / `--color-{suite}-border-light`, plus `--color-{suite}-shadow` | Border consumes the general `-dark` / `-light` variants directly |
| Differential | **Exactly 8%** — source comment "8% Differential (Subtle Factor)" (`hifi-base.css:65-67`) | ~85% / ~115% brightness (≈15% spread) |
| Computation | Pre-computed exact hexes per suite, shipped as named tokens (e.g. Maroon `#751d1d`/`#8a2423`, Cobalt `#00429e`/`#004cb8`, `hifi-base.css:69-107`) | Derived as brightness guidance against the base |
| Shadow | `-shadow` token = border-dark family at rgba alpha 0.6 (e.g. `rgba(117, 29, 29, 0.6)`) | `--shadow-{suite}` per the D1 cascade |
| Semantic | Border depth is a SEPARATE token sub-tier from hover/pressed state colors — `-border-dark` ≠ `-dark` | One dark/light pair serves borders AND states |
| Intent | Subtle dimensional emboss (8% reads as machined edge, not contrast band) | Single 5-variant cascade simplicity |

The Round8 intent claim (R2 FP-03, Diameter B): the differential should be a PRECISE constant with pre-computed named tokens, because the emboss is a dimensional read, not a color accent — at ~15% the edge becomes a visible band. The SCP claim: one cascade, fewer tokens, live-production-proven.

**RESOLUTION** *(W3 — Decision Log #16 RESOLVED; per the R5 §0.1 recommendation)*:

**Model S is CANONICAL.** The five-variant cascade (`-dark`/`-light`/`fade`/`shadow`) is the token set; borders consume the general `-dark`/`-light` variants (~85%/~115%). It is the live, production-proven system, and the runtime override chain (D9) re-derives it from one hex — a model the named-border tier cannot satisfy without extending the derivation law.

**Model R survives as BORDER-TREATMENT INTENT**: a project MAY add named `--color-{suite}-border-dark`/`--color-{suite}-border-light` tokens at exactly **8%** differential as a PRECISION TIER when instrument-grade emboss is required — at instrument scale the ~15% spread reads as a visible band where 8% reads as a machined edge (Round8 source comment "8% Differential (Subtle Factor)", `hifi-base.css:65-67`; pre-computed exemplar hexes `:69-107`). Precision-tier tokens are ADDITIVE — registered in the D1 token grammar, never replacing the canonical five — and a project adopting them must state the rule, citing Round8.

The decision is explicit and documented in both D1 and D5 — not silently averaged. The full numeric audit of every suite's actual `-dark`/`-light` ratio against the chosen model remains DEFERRED (R5 §5.1).

**Quality Criteria**:
- Light source direction consistent (top-left) across all elements
- Dark/light variant pairing never reversed for static elements
- Active inversion only on interactive elements (buttons)
- Box shadow offset direction consistent with border depth direction
- *(W2/W3)* The differential value is a NAMED design rule, never an eyeballed per-component adjustment — canonical ~85%/~115% via the five-variant cascade; exactly 8% where the named border precision tier is adopted

---

### D6: Typography Stack

**Trigger**: Font selection, heading styles, monospace usage, text hierarchy, heading classes

**Font Stack** *(defaults named — these are the canonical reference-ground faces; substitute per project via the extension procedure below)*:

| Role | Default Face | Fallback | Usage |
|------|--------------|----------|-------|
| Heading | **Orbitron** | system-ui, sans-serif | Headings, page titles, suite labels |
| Body | **Inter** | system-ui, -apple-system, sans-serif | Paragraph text, descriptions, UI labels |
| Monospace | **Space Mono** | JetBrains Mono, monospace | Code blocks, metrics, technical data, token counts |
| Display/Instrument *(W2)* | **DSEG7-class segment face** (e.g. DSEG7-Classic Bold) | monospace | Register/readout values ONLY — full role specification under D10 |

**Display/Instrument Role Note** *(W2 — Round8 ground; R5 §5.2: existence noted, adoption not mandated)*: a 7-segment-class display face is loaded via `@font-face` as bold-only with `font-display: swap` (`hifi-base.css:11-19`). It renders register values exclusively — never headings, body, labels, or buttons. Where this role is absent, instrument readouts (D10) degrade to the Monospace role with tabular figures. The role boundary IS the rule; the specific face is a project decision.

**Extension Procedure** *(W2)*: to substitute a face for any role: (1) the candidate must satisfy the role's constraint column (heading = geometric display; body = high x-height readable; mono = fixed-pitch with tabular figures; display = segment-class); (2) update the corresponding `--font-*` theme token (D1) — never hardcode a family at the component level; (3) re-verify D4 shadow rendering at the role's standard sizes (Text Rendering Diameter); (4) the fallback chain stays intact.

**Heading Class**:

```css
.heading {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: 0.02em;
}
```

**Common Text Patterns**:

| Pattern | Typical Classes | Purpose |
|---------|----------------|---------|
| Zone Label | `font-mono text-[10px] font-bold tracking-wider` | Zone headers |
| Metric Text | `font-mono text-[9px] text-white/30` | Token counts, metrics, technical data |
| Detail Summary | `text-[10px] text-white/40` | Expandable detail summaries |
| Detail Content | `text-[9px] text-white/30 whitespace-pre-wrap break-all` | Pre-formatted content within details |

**Quality Criteria**:
- Display face ONLY for headings — never for body text
- Readable face for all body/UI text
- Monospace for all technical/metric text
- Font sizes in admin panels: 9-10px for data, 10-12px for labels
- *(W2)* Segment face ONLY on readout values (D10 surfaces) — appearance anywhere else is a role breach

---

### D7: Button Variant System

**Trigger**: Interactive elements, button states, hover/active effects, button classes

**Button Variant Structure**:

| Class | Background | Border | Shadow | Usage |
|-------|-----------|--------|--------|-------|
| `.btn-base` | `var(--color-base)` | Dark top/right, light bottom/left | `rgba(0,0,0,0.4)` | Neutral actions |
| `.btn-{suite}` | `var(--color-{suite})` | Suite-colored dark/light | `var(--shadow-{suite})` | Suite-keyed actions |
| `.btn-transparent` | `transparent` | `1px solid rgba(255,255,255,0.2)` | `rgba(0,0,0,0.2)` | Subtle/secondary actions |

**State Matrix**:

| State | Background | Border | Shadow | Cursor |
|-------|-----------|--------|--------|--------|
| Default | Suite color | Dark top/right, light bottom/left | `-2px 2px 6px` | pointer |
| Hover | 10% brighter | Maintained | `-1px 1px 4px` (reduced) | pointer |
| Active | Maintained | **INVERTED** (light top/right, dark bottom/left) | `0 0 2px inset` | pointer |

**Shared Button Properties**:
- `font-family: var(--font-heading)`
- `font-weight: 600`
- `letter-spacing: 0.06em`
- `text-transform: uppercase`
- `padding: 0.5rem 1.5rem`
- `border-radius: 0.5rem`
- `transition: all 0.2s ease`

**Feature-Versioned Availability Badge** *(W2 — Round8 ground; R2 FP-14)*:

Capability maturity is worn on the control. A future-version feature ships VISIBLE in its natural grid position — disabled-with-promise, not hidden — so the layout communicates the complete intended capability:

```css
.version-tag {
  position: absolute; top: 2px; right: 2px;
  font: 600 0.6rem var(--font-mono);
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none; z-index: 10;
}
```

- **Disabled-with-promise state**: the host control carries `disabled`, `opacity: 0.5`, `cursor: not-allowed`, and a `title` naming the delivery version — present, legible, inert
- Badge text is the version promise (e.g. `v0.0.17`); shipped features may wear their introduced version the same way
- Badge is non-interactive (`pointer-events: none`), pinned top-right INSIDE the control, hidden below ~375px viewports
- Round8 exemplar: `main.css:798-812` (badge), `index.html:777-796` (disabled multiply/divide with "Coming in v0.0.17/18")

**Quality Criteria**:
- Every variant has all 3 states (default/hover/active)
- Active border inversion consistent with D5 embossed methodology
- Hover shadow reduction gradual (not abrupt)
- Transparent variant uses `backdrop-filter: blur(4px)` for frosted glass effect
- *(W2)* Version badges are standardized (one `.version-tag` construction) — never per-button ad-hoc chips; future-state controls occupy their real grid cells

---

### D8: Utility Pattern Library

**Trigger**: Dividers, locked states, scrollbars, spectrum effects, special patterns

**Utility Pattern Inventory**:

| Class | Purpose | Technique |
|-------|---------|-----------|
| `.suite-hr` | Rainbow spectrum divider | 8-color linear gradient at 2px height |
| `.spectrum-bar` | Full-width spectrum background | 8-color horizontal band |
| `.pane-locked` | Locked/disabled pane state | Reduced opacity, grayscale filter |
| `.custom-scrollbar` | Custom scrollbar | 4px track, translucent thumb |
| `.carbon-fiber` | Textured background | Diagonal line pattern |
| `.grain-overlay` | Film grain effect | Noise texture overlay |
| `.redaction-bar` | Censored/classified effect | Black bar with scanline pattern |
| `--pattern-lcd-scanlines` *(W2)* | LCD refresh-line texture for instrument readouts | 30x3px SVG pattern: 1px band at `rgba(0,0,0,0.05)` + 1px band at `rgba(0,0,0,0.02)`; consumed by D10 as a repeating noise overlay at opacity 0.08 |
| `.gradient-{semantic}` *(W2)* | Semantic workflow gradients | Linear gradient whose color STOPS are suite colors in process order (see below) |
| Sprite-sheet animation *(W2)* | Frame-stepped character/icon animation, no JS | N frames concatenated horizontally in one SVG data URI; `animation: steps(N)` walks `background-position` (see below) |

**Suite HR Composition**:

```css
.suite-hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--color-red) 15%,
    var(--color-orange) 28%,
    var(--color-yellow) 42%,
    var(--color-green) 56%,
    var(--color-blue) 70%,
    var(--color-purple) 85%,
    transparent 100%
  );
}
```

**Semantic Workflow Gradients** *(W2 — Round8 ground, `hifi-base.css:225-269`)*:

A gradient whose stops NARRATE a process in suite colors — meaning-bearing color sequence, not decoration. Round8 exemplars: `.gradient-add` (`135deg` attention-suite 0% → growth-suite 50% → result-suite 100%), `.gradient-subtract` (attention → execution → result), `.gradient-header` (`90deg` three-suite banner sweep). An animated variant extends the stop list symmetrically and slides `background-position` over a `200% 100%` canvas (`animation: gradient-flow 2s ease infinite`) for loading/processing surfaces. Rule: stop ORDER follows the process the gradient names; stops are suite tokens, never arbitrary hexes.

**Sprite-Sheet Frame-Step Animation** *(W2 — Round8 ground, `main.css:1144-1197`; R2 FP-10)*:

```css
.sprite {
  --sprite-size: 100px; --sprite-speed: 0.6s;
  width: var(--sprite-size); height: var(--sprite-size);
  background-size: calc(var(--sprite-size) * N) var(--sprite-size);
  animation: sprite-step var(--sprite-speed) steps(N) infinite;
}
@keyframes sprite-step {
  from { background-position: 0 0; }
  to   { background-position: calc(var(--sprite-size) * -N) 0; }
}
```

N frames live side-by-side in ONE inline-SVG data URI (Round8: 8 frames, 800x100 viewBox); `steps(N)` quantizes the walk into discrete frames. Size and speed are custom properties — variants are property overrides, not new keyframes. Dormant state: `animation-play-state: paused` + a filter recolor. The GLOW treatment applied over sprites (dual drop-shadow) is specified under D11.

**Quality Criteria**:
- `.suite-hr` includes all suite colors in cascade order
- Custom scrollbar maintains minimum 4px track width for usability
- Locked pane clearly communicates disabled state without being ugly
- All utility patterns degrade gracefully if CSS features unsupported
- *(W2)* Semantic gradient stops are suite tokens in process order; scanline texture never exceeds overlay opacity 0.08; sprite frame count in the keyframe math matches the sheet exactly

---

### D9: Semantic Color Cascade

**Trigger**: Content-type-to-suite derivation, runtime color override, suite color customization, semantic state/operation styling, suite identity in component APIs, `data-suite` annotation, hue-band validation

**Principle**: A suite color is a **derived, propagated, gated, and taught identity** — derived from what the content IS, propagated by token law to every pixel that represents it, gated so its meaning is earned in cascade order (D12), and taught by the interface's own structure. No color may ever be hand-picked, partially applied, or semantically silent. D9 closes the gap where a visually coherent component could carry the semantically WRONG suite color: color is a meaning-carrier, not decoration.

D9 is governed by **Three Laws**. Deviation from any one collapses the system from *semantic* back to *decorative*.

#### Law 1 — DERIVATION: Color is derived from content meaning, never hand-picked.

- **One pure function** maps content identity to suite identity — total over the content-type union, with a declared ground fallback. There is no second path by which content acquires a suite:

```typescript
const CONTENT_TYPE_SUITE_MAP: Record<ContentType, SuiteName> = {
  /* every content type declares its suite — one map, one place */
}
export function suiteFromContentType(ct: ContentType): SuiteName {
  return CONTENT_TYPE_SUITE_MAP[ct] ?? 'base'
}
```

- **Type-total**: the `Record<ContentType, SuiteName>` form forces every NEW content type to declare its suite at compile time — adding content without deciding its meaning is a type error
- **Closed identity type**: the suite-name union is closed and threaded through the data model, so every feature carries its suite identity in its DATA, not its templates
- **Identity-only component APIs**: components receive a suite NAME, never a color. The single escape hatch is a typed, named override prop (`suiteOverride?: SuiteName`) — never a raw color value
- **Live derivation**: when meaning changes, color recomputes in place — a workspace bound to the edited content type re-keys its entire treatment the moment the type changes
- **The map's semantics ARE the suite cascade**: each content type belongs to the suite whose cognitive function produced it — incident evidence → Curation; discovered citations → Prospect; designed procedures → Architect; analysis and sculpted visual assets → Sculptor; resolutions → Professional; cross-model replication → Orchestrator; defeat reasoning → Diagnosis; ground material → the base fallback

*Exemplars (SCP ground)*: `suiteDerivation.ts:1-48` (the map + the function — the entire derivation layer is 48 lines); `types/index.ts:38` (closed `SuiteName` union, threaded through 20+ interfaces); `HiFiPane.vue` (identity-only prop — a suite name in, the full treatment out, 18 lines); `MicrositePane.vue:15,33-38` (typed override slot); `RDWorkspace.vue:46` (live recomputation).

#### Law 2 — PROPAGATION: One derivation feeds every visual property by token law.

- The derivation selects a suite; the suite's **five-variant cascade** (D1: ×0.85 / ×1.15 / fade RGB < 40 / shadow@0.6) plus its pattern (D2) supply every visual property through one composed class (D3 panes / D7 buttons). The treatment is never partially applied
- **Scale-invariance**: the same derivation renders as a full workspace pane → a card accent (left border + fade tint + light-variant label) → a badge chip → a **6px dot**. Density compresses the footprint, never the derivation
- **Root-injected overrides**: user personalization happens only at the token root — one hex per suite, re-derived into all five variants by the D1 law and injected as CSS variable overrides at the app root. Every pane, button, badge, dot, divider, and gradient re-derives instantly because nothing anywhere consumed a literal color
- **Hue-band constraints — meaning survives personalization**: each suite may re-hue only within its declared band; the bands tile the wheel in cascade order with deliberate dead zones keeping adjacent suites discriminable. **Red can never become blue** — the cascade ordering (and therefore the meaning encoding) is invariant under personalization:

```typescript
// hue bands, cascade order (SCP canon — useSuiteColors.ts:64-77)
red:    { min: 340, max: 15, wraps: true },   orange: { min: 15,  max: 45 },
yellow: { min: 45,  max: 65 },                green:  { min: 65,  max: 165 },
blue:   { min: 185, max: 255 },               purple: { min: 255, max: 310 },
fuchsia:{ min: 310, max: 340 }
// base: null — achromatic, not re-hueable; 165-185 cyan dead zone keeps green/blue discriminable
```

- **Names follow colors**: the suite's display name re-derives from the customized hue via an HSL→name lexicon — even naming is derived, never stored

*Exemplars*: `deriveVariants` (`useSuiteColors.ts:1224-1247`); `cssVariableOverrides` (`useSuiteColors.ts:1253-1271`) → `App.vue:21`; `SUITE_HUE_BANDS` (`useSuiteColors.ts:64-77`) + `SuiteColorPickerPanel.vue:36,249`; the scale chain `RDWorkspace.vue:302` → `ContextBlockCard.vue:260-292` → `SuiteBadge.vue:38-41` → `InventoryBrowser.vue:133`; `hexToColorName`/`getSuiteDisplayName` (`useSuiteColors.ts:102+,1294-1299`).

#### Law 3 — LEGIBILITY: Color teaches the user the suite system.

- **The Index–Entity–Role triple**: identity surfaces render `Suite N — ColorName — Role` — number, color-name, and cognitive function co-present in three distinct semantic slots, no redundancy
- **The meaning table** — each color IS a cognitive function, and the role + Informative aspect + Actionable aspect live in the design system's DATA LAYER (the suite detail records) — part of the color's definition, not documentation beside it:

| # | Hue addressing (SCP) | Cognitive addressing (Round8/SCS) | Role | Informative | Actionable |
|---|---|---|---|---|---|
| 0 | base | Obsidian | Origin | Recollect prior cycles, internal coherence | Conceive next attempt |
| 1 | red | Maroon | Curator | Read existing, document cards | Prune lossy abstractions |
| 2 | orange | Rust | Prospector | Discuss discoveries verbosely | Name frontier patterns |
| 3 | yellow | Ochre | Architect | Draft blueprints | Design with respect to prior |
| 4 | green | Viridian | Sculptor | Examine from all angles | Instill bidirectional reinforcement |
| 5 | blue | Cobalt | Professional | Plan checkpoints | Implement with sequenced placement |
| 6 | purple | Amethyst | Orchestrator | Know sequence between colors | Interchange and enhance |
| 7 | fuchsia | Rose | Clinician | Diagnose across all tiers | Refine and return to foundation |

- **Narrative structure walks the cascade**: primary navigation/landing structure traverses the suites in order, each stage wearing its suite — the page layout itself is the curriculum
- **Spectrum signature for total-system moments**: a seven-stop spectrum mark (rule / bar / clipped heading text) appears wherever "all suites at once" is meant; meta-document families CONTAIN all suite colors at low alpha, expressing composition (D1). Because the signature consumes `var(--color-*)`, personalization recolors the brand mark itself
- **Marked neutral for the unassigned**: system/tooling chrome uses an explicit neutral token (`var(--color-pewter, #888)`) and a transparent button variant — the ABSENCE of suite color reads as "infrastructure," never as accident
- **Repetition under derivation** is what makes color legible as meaning: the same kind of content derives the same color everywhere, forever

*Exemplars*: `SuiteSectionLabel.vue:41-51` (the triple + locked redaction); `SuiteBadge` tooltip (`useSuiteAccess.ts:24-31`); landing sections walking red→fuchsia (`ProblemSection.vue:15` … `FuchsiaSection.vue:36`); `.suite-hr`/`.hifi-spectrum-text` (`style.css:397-454`) + `SpectrumBar.vue`; the all-suite diamond gradient (`style.css:353-374`) + onyx suite-colored strata (`style.css:96`); pewter token consumers (`style.css:1472-1715`); `.hifi-btn-transparent` (`style.css:224-234`); `SuiteDetail` role/aspect records (`types/index.ts:231-238` + `src/data/suites/*.ts`).

#### Semantic Operation/State Assignment *(both grounds' meaning layers)*

The derivation source is not limited to content type — OPERATIONS and STATES derive suites by the same law:

- **Data-attribute pane adoption** *(Round8 ground — R2 FP-04)*: a surface adopts the FULL pane treatment of whichever suite the current operation carries, routed by data attribute — `[data-operation="+"]` re-skins the row in the Prospect suite's pattern + radial + border pair; `[data-operation="-"]` in the Clinician suite's; comparison operations in theirs (`main.css:1477-1544`). The operation→suite assignment is itself a derivation map — one place, semantic, total over the operation set
- **`data-suite` HTML annotation** *(Round8 ground — R2 FP-09)*: content sections carry their suite identity IN THE MARKUP — `<div class="markdown-section" data-suite="maroon">` (`index.html:314+`, content partials) — the document structure itself declares which cognitive function owns each section, and CSS keys treatments off the attribute. The markup is the meaning layer's transport
- **Zone semantics** *(SCP ground)*: composed prompt/envelope zones each wear the suite that governs them — identity zones Clinician, curated zones Curator, orchestration zones Orchestrator, implementation zones Professional, ground content base (`SecureView.vue:1376-1517`). A reader learns which cognitive function produced each zone purely from the treatment
- **Grouping/orchestration states** adopt the Orchestrator accent (preset-grouped cards, `ContextBlockCard.vue:280`) — because grouping IS orchestration

#### Suite-Name Addressings *(reconciliation note — R5 §5.4; Decision Log #21)*

The seven-suite cascade has two parallel addressings: the **cognitive names** (Round8/SCS ground — maroon, rust, ochre, viridian, cobalt, amethyst, rose) and the **hue names** (SCP ground — red, orange, yellow, green, blue, purple, fuchsia). They address the SAME cascade positions; the Law 3 meaning table above binds them row by row. A token set may use either addressing internally, but one document/system must use one addressing consistently. Canonical unification is DEFERRED — naming both as parallel addressings is the v2.0 rule.

**Quality Criteria**:
- NO hardcoded suite hex in any output — all consumption through `var(--color-*)` tokens, so the propagation chain survives root override
- Every suite-colored element is TRACEABLE to a derivation — a content-type map entry, an operation/state assignment, a zone designation, or a typed override prop; untraceable color = hand-picked = FAIL
- **Semantic-correctness gate**: a component that is visually right but carries the semantically WRONG suite is a FAIL — the gate tests meaning, not just rendering
- Component APIs accept identity, never color; override only via a typed, named prop
- Derivation maps are total with a declared ground fallback; new content/operation types must declare their suite at the map
- Hue customization confined to the suite's band; cascade ordering invariant under personalization
- Neutral is marked (explicit neutral token / transparent variant), never accidental

---

### D10: Instrument Display & Readout

**Trigger**: Digital displays, segment readouts, LED/LCD treatment, ghost-active stacks, instrument panels, live-data values, register displays, multi-representation readouts

**Principle**: A readout is a suite-keyed HARDWARE-INSTRUMENT SURFACE, not styled text. Its realism comes from four composed treatments — the segment-face typography role, the full-capacity ghost beneath the live value, the display-complement digit shadow, and the scanline noise overlay — gated by saturation as the activity signal.

#### 1. Display Typography Role (Font Role Extension <-> D6)

The readout value renders in a **segment-class display face** (7-segment style, e.g. DSEG7-Classic), loaded bold-only via `@font-face` with `font-display: swap`. The face appears ONLY on readout values — never headings, body, labels, or buttons. All layers of one readout share the exact same size (canonical exemplar: `20.5px`) with `font-variant-numeric: tabular-nums; font-feature-settings: "tnum"` so ghost and active digits register column-perfect.

*Exemplar*: `hifi-base.css:11-19` (@font-face); `main.css:2351-2364` (base container type).

#### 2. Three-Layer Readout Architecture (Ghost–Active–Noise)

**DOM pattern** (three stacked children inside a positioned base):

```html
<div class="readout-base readout-{context}">
  <div class="readout-ghost" aria-hidden="true">8,88,88,88,88,88,88,88,88,88,88</div>
  <div class="readout-active"><span class="readout-value"></span></div>
  <div class="readout-noise" aria-hidden="true"></div>
</div>
```

**CSS architecture** (exact constants from the canonical exemplar):

```css
.readout-base {
  position: relative; display: block; width: 100%;
  font: bold 20.5px var(--font-display), monospace;
  font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
  border-radius: 0.375rem;
  border: 2px solid rgba(0, 0, 0, 0.3);     /* neutral inset frame — D5 Display Border Depth */
  transition: all 0.2s ease;
}
.readout-ghost {                             /* the unlit segments */
  position: absolute; top: 0; left: 0; right: 0;
  opacity: 0.15; z-index: 1;
  pointer-events: none; user-select: none;
  padding: 8px; text-align: right;
}
.readout-active {                            /* the live value */
  position: relative; z-index: 2;
  padding: 8px; padding-right: 9px;          /* +1px right trim for final alignment */
  text-align: right;
}
.readout-noise {                             /* LCD scanline overlay — topmost */
  position: absolute; inset: 0;
  opacity: 0.08; z-index: 3;
  pointer-events: none; user-select: none;
  background-image: var(--pattern-lcd-scanlines);  /* D8 inventory */
  background-repeat: repeat;
}
```

**Ghost layer rules**:
- The ghost content is the **full-capacity mask** — every digit position rendered as `8` (the character that lights all seven segments), separators included, matching the register's exact capacity. Canonical exemplar mask: `8,88,88,88,88,88,88,88,88,88,88` (21 positions)
- Ghost opacity **0.15** — visible as unlit hardware segments, never competing with the value
- Per-context ghost color: **dark ghost on light displays** (exemplar `rgb(0 0 0 / 33%)` on amber), **light ghost on dark displays** (exemplar `rgba(255,255,255,0.08)` on deep maroon)
- Ghost may be hidden at narrow viewports (exemplar: ≤520px) — the active layer never is
- Empty-state value: `.readout-value:empty::before { content: '0'; opacity: 0.3; }` — a dim zero, not a blank well

*Exemplar*: `main.css:2344-2412` (layer stack), `2428/2451` (ghost colors); `index.html:590-732` (markup), `:595` (ghost mask).

#### 3. Complement-Derived Digit Shadow (Display-Context Complement Shadow <-> D4)

The live digits throw a shadow in the **color-wheel complement of the DISPLAY background** — not the suite's own hue, and not the pane-context crisp offset. Display-context spec: `text-shadow: 0px 2px 4px var(--color-{context}-complement-shadow)` — deliberately BLURRED (the phosphor depth read), consuming D4's named complement token tier at alpha 0.6.

Canonical exemplars: dark digits (`#1a1a1a`) on the amber display shadow **blue-violet** (`#375EA2` family); light digits (`#e2e8f0`) on the maroon display shadow **teal-cyan** (`#008060` family).

*Exemplar*: `main.css:2385-2397, 2431-2457`; `hifi-base.css:109-113`.

#### 4. Display Context Tints + Saturation State Signaling

Each readout context owns a two-stop background tint and participates in the activity gate:

```css
.readout-{context} {
  background: linear-gradient(135deg, {display-base} 0%, {display-deep} 100%);
  border-color: {display-base at alpha 0.4};
  filter: saturate(0.3);                 /* inactive: desaturated, NOT hidden */
  transition: filter 0.3s ease;
}
.{context}-active .readout-{context} { filter: saturate(1); }
.readout-base:hover .readout-active   { filter: brightness(1.1); }
```

**Saturation IS the activity signal** (D11 Instrument Illumination Diameter): an idle instrument stays fully rendered at `saturate(0.3)`; a live one restores `saturate(1)` over 0.3s. Canonical exemplar tints: input register amber `#C8A15D → #b89650`; output register maroon `#800020 → #6b001a`; alternate-format mode re-tints the output (`#4aa685 → #017881`) without touching the layer stack.

*Exemplar*: `main.css:2415-2463` (tints + gate + hover), `1607-1610` (mode re-tint).

#### 5. Machine-Truth Readout Strip (binary/raw representation)

A micro-type secondary representation of the same value, styled as its own miniature instrument:

```css
.machine-strip {
  font-family: var(--font-heading-mono);    /* the global display mono, NOT the segment face */
  font-size: 9.2px;                          /* micro-type; ~6.2px at narrow viewports */
  font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
  background: #4d0000;                       /* deep well; hover deepens to #660000 */
  color: #d4853d;                            /* amber digits */
  text-shadow: 0.5px 0.5px rgb(5 141 208);   /* hard cyan-blue micro-offset, no blur */
  text-align: center; text-wrap: wrap; word-break: break-all;
  padding: 0.5rem 0.75rem; border-radius: 0.375rem;
  border-top: 2px solid #931a1a;  border-right: 2px solid #931a1a;   /* darker top/right */
  border-bottom: 2px solid #c10000; border-left: 2px solid #c10000;  /* lighter bottom/left */
}
```

The strip wears the D5 dimensional border pair in its own well colors and the hard micro-offset shadow language (crisp, like pane-context D4 — machine truth reads exact, not glowing).

*Exemplar*: `index.html:28-47` + `main.css:2516-2551`.

#### 6. Multi-Representation Stacked Readout (R2 FP-13)

The SAME underlying value renders simultaneously in multiple representations within one display row — each representation with its own treatment, all sharing the row's suite context:

- **Primary**: the segment-face ghost-active readout (§2-4)
- **Secondary**: the machine-truth strip (§5) docked beneath
- **Tertiary** (optional): a format toggle swapping the primary's representation (re-tint only — layer stack unchanged)
- The containing ROW re-skins by active semantic state (the row adopts the full treatment of whichever suite the current operation/state carries — `[data-*]` attribute routing); rows stack with docking geometry (e.g. the terminal row squares its top corners to dock against the stack)

*Exemplar*: `index.html:590-631` (parallel representations), `main.css:1477-1544` (row re-skin by `[data-operation]`), `1579-1604` (docked output row).

**Quality Criteria**:
- Segment face appears ONLY on readout values (role breach = D6 violation)
- Ghost mask capacity EXACTLY matches the register length — a wrong-length mask reads as broken hardware
- Layer z-order is invariant: ghost 1, active 2, noise 3 (noise topmost); ghost and active share identical font metrics and right alignment
- Digit shadow is the display background's COMPLEMENT (never the suite's own hue), blurred `0px 2px 4px` at alpha 0.6
- Saturation gate present on every readout: inactive = `saturate(0.3)` rendered-but-dim, never `display: none`
- All representations of one value agree at all times; representation toggles re-tint, they do not restructure
- Scanline overlay at opacity 0.08 — instrument texture, never visible banding

---

### D11: Luminous State Treatment

**Trigger**: Glow/neon states, active rings, processing indicators, prismatic borders, spotlight/atmosphere composition, saturation gates, featured/showcase elements, sprite glow

**Principle**: **Glow is STATE language — never decoration-by-default.** The HiFi system has two depth languages sharing one light source: D5's matte emboss renders RESTING depth; D11's emission renders ACTIVE depth. A surface earns luminosity by being **active**, **processing**, or **featured** — a glowing element that is none of these is a defect.

#### 1. Neon Glow Shadow Stacks (state: active / live)

Luminosity is built from distinct stacked mechanisms, never one big blur:

| Mechanism | Formula | Reads As |
|-----------|---------|----------|
| Colored offset drop-glow | `box-shadow: -8px 8px 32px var(--shadow-{suite})`; hover tightens to `-6px 6px 24px`; miniature `-3px 3px 12px` for small controls | The element CASTS its suite light down-left (D5 direction held) |
| Soft halo text glow | `text-shadow: 0 0 10px {suite at alpha 0.5}` (labels `0 0 6px`) | The text is LIT |
| Active ring | `border: 2px solid {suite}; background: {suite at alpha 0.1}; box-shadow: 0 0 0 3px {suite at alpha 0.2}` | The region is LIVE |
| Ambient chrome stack | `box-shadow: 0 8px 32px {warm tint at 0.15}, 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 {sheen at 0.2}` | The shell GLOWS faintly + sits deep + catches a top sheen |
| Complement digit glow | `0px 2px 4px` complement-shadow (owned by D10) | Instrument phosphor depth |

Direction consistency is the realism: every offset glow falls down-left (`-x +y`), agreeing with D5's emboss light source. The glow COLOR is always a suite token (`Luminous Token Source` <-> D1).

*Exemplar*: `main.css:361-371` (button glow + hover), `2632` (miniature), `1344-1349` (active ring), `37-83` (ambient stack), `1125-1137` (halo'd live value).

#### 2. Dual Drop-Shadow Sprite Glow (state: animated mascot/icon active vs dormant)

Sprite/icon luminance is a stacked filter pair — one soft halo plus one hard chromatic offset (the same dual language as the wordmark shadows):

```css
.sprite-lit    { filter: drop-shadow(0 0 10px {suite at alpha 0.5})
                         drop-shadow(1px 2px 0 var(--color-{companion-suite})); }
.sprite-dormant { animation-play-state: paused;
                  filter: brightness(0) invert(1)              /* recolored to white */
                          drop-shadow(0 0 10px rgba(255,255,255,0.3))
                          drop-shadow(1px 2px 0 var(--color-{alternate-suite})); }
.sprite-dormant:hover { animation-play-state: unset; filter: unset; }  /* attention revives */
```

The sprite-sheet animation mechanics live in D8; the GLOW grammar — halo + hard companion offset, dormancy as pause + white recolor, hover revival — is D11.

*Exemplar*: `main.css:1144-1197`.

#### 3. Prismatic Rotating Conic Border (state: PROCESSING — R2 FP-05)

The processing state replaces a static frame with the full suite spectrum rotating around the perimeter — total system engagement as a border:

```css
@property --border-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

.processing-active {
  border: 3px solid transparent;
  background:
    linear-gradient({surface gradient}) padding-box,
    conic-gradient(from var(--border-angle),
      var(--color-{s1}) 0deg,      var(--color-{s2}) 51.43deg,
      var(--color-{s3}) 102.86deg, var(--color-{s4}) 154.29deg,
      var(--color-{s5}) 205.71deg, var(--color-{s6}) 257.14deg,
      var(--color-{s7}) 308.57deg, var(--color-{s1}) 360deg) border-box;
  animation: prismatic-border-rotate 3s linear infinite;
}
@keyframes prismatic-border-rotate { to { --border-angle: 360deg; } }
```

- The seven suite colors divide the wheel into **equal 51.43° arcs** (360/7), in cascade order, closing on the first color for a seamless loop
- `padding-box`/`border-box` background-clip separation renders a gradient BORDER over an intact surface
- `@property` registration is REQUIRED — without it the angle cannot animate
- Reserve for genuine processing/working states; a static prismatic variant (non-rotating spotlight) marks FEATURED elements (§5)

*Exemplar*: `main.css:5-9, 1230-1252`.

#### 4. Hover-Activated Progressive Pattern Opacity (state: attention/mode — R2 FP-11)

The D2 pattern tile becomes a state-responsive light surface — opacity is the feedback channel:

- Resting: pattern at ambient opacity **0.1** (subtle texture)
- Hover: surges to **0.8** (`transition: opacity 0.3s ease-out`) — the surface responds to attention
- Active/engaged: **1.0**
- Dual-mode surfaces hold TWO patterns on `::before`/`::after` pseudo-elements; the current mode determines which pattern rests high — pattern identity telegraphs mode, opacity telegraphs attention

*Exemplar*: `main.css:1037-1092` (header dual-pattern hover system).

#### 5. Atmospheric Spotlight Composition (state: FEATURED / showcase chrome)

The luminous shell for featured surfaces — a three-layer background stack plus chrome treatments:

```css
.luminous-card {
  position: relative; isolation: isolate; overflow: hidden;
  border-radius: 1rem; padding: 10px;
  background:
    /* Layer 1 (top): structural SVG wireframe, opacity ≤ 0.08 */
    url("data:image/svg+xml,{wireframe}"),
    /* Layer 2: warm spotlight at EXPONENTIAL opacity decay */
    radial-gradient(ellipse 70% 50% at 50% 50%,
      {tint at 0.2} 0%, {tint at 0.15} 25%, {tint at 0.1} 45%,
      {tint at 0.06} 65%, transparent 100%),
    /* Layer 3 (bottom): glossy near-black floor */
    linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 30%, #000000 70%, #0a0a0a 100%);
  background-size: 200px 200px, 100% 100%, 100% 100%;
  border: 2px solid; border-color: {dark-facet} {dark-facet} {light-facet} {light-facet};
  box-shadow: 0 8px 32px {tint at 0.15}, 0 4px 16px rgba(0,0,0,0.4),
              inset 0 1px 0 {sheen at 0.2};
}
.luminous-card::before {   /* vertical gloss wash */
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(to bottom, {sheen at 0.15} 0%, {sheen at 0.05} 30%,
              transparent 50%, rgba(0,0,0,0.2) 100%);
  pointer-events: none;
}
```

- **Spotlight decay is EXPONENTIAL, not linear** (0.2 → 0.15 → 0.1 → 0.06 → 0) — light falls off like light
- **Multi-suite prismatic variant** (showcase buttons): the radial becomes a SEVEN-SUITE prismatic spotlight positioned OFFSET BEYOND THE UPPER-RIGHT CORNER (exemplar: +8px past the corner, `200%/160%` ellipse), suite stops at exponential decay from first (0.32) to last (0.01), over a deep suite-tinted floor — the full spectrum pours in from off-stage upper-right
- Hue-tinted floors follow the D1 fade rule (near-black, RGB < 40, one channel lifted toward the hue)
- `isolation: isolate; overflow: hidden` contains the composition; gutter-cell wrappers (3px dark cell, `overflow: hidden`) clip oversized member glows into internal neon bleed

*Exemplar*: `main.css:37-101` (card), `318-342` (gutter cell); `index.html:123-250` (showcase prismatic spotlight — sponsor button).

#### 6. Desaturation Activity Gate (state: inactive — shared with D10)

```css
.instrument { filter: saturate(0.3); transition: filter 0.3s ease; }
.instrument.live { filter: saturate(1); }
```

Inactive elements stay FULLY RENDERED but desaturated — presence communicates capability, saturation communicates current state (R2 Diameter D: "visible potential at reduced signal"). Pairs with the active ring (§1) on the engaged element. This gate is the OFF half of the luminosity grammar: glow marks active, desaturation marks idle, and the matte D5 resting state sits between.

*Exemplar*: `main.css:2419-2448` (instrument gate), `1344-1349` (paired ring).

**Quality Criteria**:
- Glow appears ONLY on state-bearing surfaces — active, processing, featured, or live; default/resting surfaces are matte (D5)
- Every offset glow falls down-left (`-x +y`), consistent with the D5 light source; halo glows (`0 0 Npx`) reserved for lit text/sprites
- Glow colors are suite tokens; halo alpha ≤ 0.5; ambient tint alpha ≤ 0.2
- The prismatic conic uses ALL suite colors, cascade order, EQUAL arcs (360/7), closing on the first
- Pattern-reveal returns to ambient ≤ 0.1 at rest; the surge is transitioned (0.3s), never instant
- Spotlight decay curves are exponential; prismatic spotlights originate beyond the upper-right corner
- D4 pane-context crispness is never blurred by D11 — luminous blur belongs to display digits (D10), halos, and ambient stacks only
- Inactive ≠ invisible: the desaturation gate renders idle elements at `saturate(0.3)`, full structure intact

---

### D12: Tier-Derived Styling

**Trigger**: unlockTier treatments, locked grayscale states, trust-gated visuals, tier progression styling, redacted roles, tier-keyed disclosure

**Principle**: **Color precedes meaning; meaning is earned.** The Suite Tier System binds the suite cascade to a trust scale — Suite N unlocks at Tier N — and D12 governs how tier manifests visually: the locked state shows the suite's SHAPE while withholding its CHROMA and REDACTING its role. Tier expression is applied OVER the composed treatment (a filter plus a content gate) — it never restructures the treatment.

#### 1. The Tier Spine — Manifest

One manifest binds index, name, treatment class, and unlock tier:

```typescript
// SCP canon — src/data/suites/manifest.ts:3-13
{ number: 0, name: 'base',    displayName: 'Base',    cssClass: 'hifi-pane-base',    unlockTier: 0 },
{ number: 1, name: 'red',     displayName: 'Red',     cssClass: 'hifi-pane-red',     unlockTier: 1 },
/* ... cascade order ... */
{ number: 7, name: 'fuchsia', displayName: 'Fuchsia', cssClass: 'hifi-pane-fuchsia', unlockTier: 7 },
```

- Suite number and trust tier are the SAME 0-7 scale (`types/index.ts:219-221`) — the user's trust progression IS a walk up the cascade: first you earn Curation, last you earn Diagnosis
- The treatment class name lives in the DATA layer (the manifest's `cssClass`), not in templates — identity surfaces source their class from the manifest

#### 2. The Gate

```typescript
// useSuiteAccess.ts:12-31
isSuiteUnlocked(name)  =  trustTier >= manifest[name].unlockTier
tooltip(locked)        =  'Permission Denied — Trust Factor Too Low'
tooltip(unlocked)      =  `Suite ${number} — ${displayName}` (+ role)
```

#### 3. Locked Visual Treatment — Grayscale Over Composition

```css
/* SCP canon — style.css:882-887 */
.hifi-pane-locked {
  filter: grayscale(1);
  pointer-events: none;
  user-select: none;
  position: relative;
}
```

- Locked = the SAME composed treatment desaturated — pattern, gradient, bevel borders, and shadow all persist under `grayscale(1)`; the shape of the suite is visible, its chroma withheld
- The class COMPOSES with the suite class (`hifi-pane-{suite} hifi-pane-locked`) — tier never replaces the treatment, it filters it
- Applied at every scale: badge chip (`SuiteBadge.vue:40`) and whole landing-grid section (`SolutionSection.vue:135`, `CommunitySection.vue:69`)
- Interaction is withdrawn with chroma: `pointer-events: none; user-select: none` — a locked surface cannot half-work

**Distinction from the D11 desaturation gate**: D11's `saturate(0.3)` marks an INACTIVE-but-available instrument (transient state; hover or activity revives it); D12's `grayscale(1)` marks an UNEARNED capability (structural state; only tier progression revives it). Full grayscale plus interaction withdrawal versus partial desaturation with live transitions — two different statements in the same chroma language.

#### 4. Redacted Role — Meaning Withheld, Identity Shown

The locked identity surface keeps the index and entity slots of the Index–Entity–Role triple (D9 Law 3) but REDACTS the role slot:

```html
<!-- SuiteSectionLabel.vue:41-51 -->
Suite {{ number }} — {{ colorName }} — <span v-if="unlocked">{{ role }}</span>
                                       <span v-else class="designation-redacted">████████</span>
```

The redaction bar family (`.redaction-bar`, `style.css:507-549`) is the D8 utility this consumes. The user can SEE that a meaning exists and that it is withheld — the gate is visible, which is what makes progression legible.

#### 5. Structural Disclosure — Meaning Is Not Delivered Until Earned

Tier gating is structural, not cosmetic: locked meaning content is not merely hidden in the page — it is NOT DELIVERED. The suite detail records (role + aspects) load only through a dynamic-import loader that returns null below the tier (`loader.ts` security contract; `getSuiteDetail` → null, `useSuiteAccess.ts:19-22`), with build-time verification that no locked content leaks into the served bundle (`scripts/verify-ssr-isolation.mjs`). D12's visual law assumes this substrate: grayscale + redaction SIGNAL withheld, and the architecture guarantees withheld means absent.

#### 6. Progressive Trust Legibility

The tier system makes the cascade a CURRICULUM: color is visible from tier 0 (the wheel is always whole), meaning unlocks in cascade order, and each unlock recolors and un-redacts in place. The interface teaches: what you see desaturated is what remains to be earned. Tier-gated disclosure composes with D9 Law 3 — the locked state is part of how color teaches.

**Quality Criteria**:
- Locked = the same treatment under `grayscale(1)` — NEVER `display: none`, never a different layout; shape persists, chroma withheld
- The locked class composes OVER the suite class; tier expression never restructures the composed treatment (gradient, pattern, borders, shadow intact beneath the filter)
- Redaction shows that meaning EXISTS (visible bars) — it never pretends absence
- Interaction is withdrawn with chroma (`pointer-events: none`) on locked surfaces
- Tier scale and suite index are ONE scale — a suite whose unlock tier diverges from its cascade position breaks the curriculum
- Where the gated meaning is sensitive, gating must be structural (not-delivered), with the visual state as its honest signal
- D12 structural grayscale is never conflated with D11 transient desaturation — different filters, different revival paths

---

### D13: Sectioned Panel Scannability

**Trigger**: Long-form article sections, white-paper surfaces, any page where readers SCAN instead of wading through walls of text

**Doctrine — Two Strata, Treated Differently**:
1. **Main text (the section's hero paragraph)** KEEPS its original verbosity as a single bulk paragraph. NEVER bulleted; NEVER fragmented into staccato short paragraphs (short paragraphs read choppy; bullets belong to panels). Scannability here comes ONLY from suite-coordinated key terms.
2. **Panels (HiFi pane cards)** carry the BULLET aspect — each a toggle panel with a HiFi Base toolbar + A/B view toggle, switching the body between ◆ bullet list (A, default) and prose (B).

**Key-Term Coloring — System-Wide Suite Correspondence (`.hifi-key{,-SUITE}`)**:
Key terms are colored by the SUITE THEY CORRESPOND TO, **system-wide** — a concept keeps its color in EVERY panel, independent of the panel's own suite. Load-bearing rule (NOT the panel's color). BOTH list and paragraph views carry the same keys.
- `.hifi-key` — neutral bright-white emphasis (concepts with no suite home).
- `.hifi-key-{red,orange,yellow,green,blue,purple,fuchsia,diamond}` — suite-colored (`var(--color-SUITE-light)`; diamond = light lavender for observation/Ego concepts).
- The legend is PER-DOCUMENT (concept → suite), authored once and held everywhere the concept appears.
- **Keying interpolated/gated body text**: mustache interpolation HTML-escapes, so inline `hifi-key` spans render as literal text. Put the spans INTO the data source and render with `v-html` — AUTHORED strings only (never user input).

**The ◆ Bullet List (`.hifi-list`) — Panel-Only**:
`<ul class="hifi-list">` with ◆ (`\25C6`) markers; per-`<li>` suite tint via `style="--mark: var(--color-SUITE-light)"`. Each bullet = a bold suite-key lead-in + explanation.

**The Toggle Panel + HiFi Base Toolbar**:
A toggle panel wraps an unpadded HiFi pane with:
- `.hifi-panel-toolbar` — toolbar bracketing the panel TOP: title where the window TITLE goes (left); the A/B toggle where the window CONTROLS go (top-right, `justify-content: space-between`).
- `.hifi-panel-body` — holds the list/paragraph views (own padding).
- Each panel owns its `mode` ref (default list) — self-contained per-panel toggle.
- The A/B toggle: pill track + sliding white thumb, icon opacity inversion, dimensional borders, 0.3s transitions, `aria-pressed`.

**Section Suite Correctness (CRITICAL)**: Each section's panes take the section's OWN suite; the section eyebrow takes the suite-light color (base/neutral sections use `text-white/70`). The key-term legend stays concept-coded — NOT overridden by the section's suite.

**Quality Criteria**:
- Main text = single bulk paragraph, suite keys, NEVER bulleted, NEVER fragmented
- Bullets ONLY in panels
- Suite keys identical in BOTH views (same concept→color)
- Section panes = the section's own suite
- Eyebrow clears preceding dividers (collapse-safe margin — neutralize the divider's bottom margin, give the eyebrow its own top margin)
- Build gate exit 0

---

### D14: Sectioned Panel Grounding — HiFiPanel Primitive · Grounded Subsections

**Trigger**: Any suite-color panel carrying statement prose; any panel with a header; badge cards; CLI demonstrations

**The `HiFiPanel` primitive — the unifying panel**. Wraps an unpadded HiFi pane and does two separable things:
- **Header bar (any suite)**: lifts a header into the TRANSPARENT toolbar — `#title` slot (composite) or `title` prop (left), `#toolbar-action` slot (right). Applies to ANY panel with a header.
- **Body grounding (suite-color only)**: wraps the body in a grounded inner card (`.hifi-subtext-ground`) automatically when `suite ∈ {red,orange,yellow,green,blue,purple,fuchsia}`.

**CRITICAL — the Boolean-prop opt-out rule**: The grounding override MUST be a NEGATIVE prop `noGround?: boolean`. Vue coerces an ABSENT Boolean prop to `false` (never `undefined`), so a positive `ground?` + `props.ground ?? auto` is DEAD code (`false ?? auto` → `false`) — nothing ever grounds. `grounded = !noGround && isSuiteColor`. The same trap applies to any auto-defaulting Boolean prop (e.g. an auto-padding prop) — always pass explicit values or design the prop negative.

**`.hifi-subtext-ground` — the grounded inner card**: An inset card grounding statement prose for readability over pane gradients — dark ground + a radial gem spotlight (`::before`, offset toward the upper-left at ~38% 32%) + a facet lattice (`::after`, masked to the gem), content at z-index 2, gem/facet opacities toned for legibility. Box: `border-radius: 8px; border-top: solid black; border-right: 1.7px solid rgb(172 172 172); padding: 28px; color: var(--color-white-conductor)`. The surrounding `.hifi-panel-body` padding is the inset gap from the card edge.

**`.hifi-subtext-glass` — the transparent inner card**: Same inset box model (8px / 28px / off-white); surface = the transparent pane treatment (`rgba(255,255,255,.015)` + `blur(5px)` + embossed border). The glass counterpart, used when PAIRED with a grounded suite card.

**Off-white body text (never the keys)**: Inside panels/subsections, lift dim `text-white/NN` utilities to off-white: `.hifi-panel-body :is(p,li), .hifi-subtext-ground :is(p,li), .hifi-subtext-glass :is(p,li) { color: var(--color-white-conductor) }`, each guarded `:not([class*="hifi-key"])` — key terms keep their suite color, ALWAYS.

**The five treatments — choose per panel**:
- **P1 · Subsection only**: wrap a sub-region (a column; text beside/under an image) in `.hifi-subtext-ground`; the pane can stay raw.
- **P2 · Header bar only**: HiFiPanel with a neutral suite — title in toolbar, no grounding.
- **P3 · Header bar + full ground**: HiFiPanel with a suite color — auto-grounds the whole body.
- **P4 · Header bar + partial ground**: suite color + `no-ground`; keep images/diagrams ungrounded; wrap ONLY the prose in `.hifi-subtext-ground`.
- **Glass-when-paired**: in a paired split where ONE card is a grounded suite card, the neutral partner grounds its body in `.hifi-subtext-glass` (NOT the dark ground). Only in that pairing — standalone neutral cards get no subsection.

**EXCLUDE from grounding**: infographic/diagram panes, interactive panes (sliders, forms, CTAs), empty/error states, and NUMBER-ONLY stat tiles. They may still take the HEADER BAR if headed.

**One-Line Rule**: a one-liner body is NOT grounded (a dark card around a single line reads as empty bulk) — pass `no-ground`; grounding is for MULTI-LINE statement prose.

**Stat Tile rule**: a stat tile leads with a big centered statistic + label (the stat-header stays CENTERED — not a left header bar); its supporting prose grounds in `.hifi-subtext-ground` WHEN multi-line. Number+label alone → excluded.

**Sequence-vs-Statement surfaces**: an ORDERED PROCESS (A→B→C steps, pipeline stages) renders as **HiFi Base cards** (sectionable into one sub-card per step) — NOT the grounded subsection. The grounded subsection grounds TEXT (statements/prose). A hero paragraph cast as an ITALIC quote/declaration may skip its own grounding PROVIDED the panel already carries structural grounding beneath it.

**BadgePanel — badge + header in the bar**: a HiFiPanel whose header is a BADGE (icon tile) + optional label + title in the transparent bar. Props: `suite` · `icon` · `title` · `label?` (a prefix reading into the title, e.g. "Layer 0") · `iconColor?`/`labelColor?` (cross-suite badge colors are retained) · `noGround?`. ONE form (horizontal header bar) — **vertical vs horizontal is a LAYOUT choice, not a component mode**: stack the same cards in a single-column container (`space-y-6`, constrain to ~`max-w-4xl` for line length) or grid them; the card never reorients.

**Suite CLI Mock — the Suite-keyword demonstration**: a Claude-Code-style terminal in a HiFi Onyx pane (terminal panes are grounding-EXCLUDED — Onyx IS the surface). Window dots + `›` prompt (authored `v-html`, the Suite keyword wearing its key color) + the agent output block verbatim in `<pre>`. TWO modes matched to the real commands: **`Issue Suite N, N…`** = the parallel salvo → an `⏺ N agents finished` tree; **`Engage a /cascade:FullSuite`** = the SEQUENTIAL curried cascade → one agent running to completion INTO the next with the Diamond + Onyx printouts. Output authored-only, never user input.

**Quality Criteria**:
- Grounding override is NEGATIVE (`no-ground`), never a positive prop
- Statement bodies on suite-color panels → grounded; exclusions honored
- Partial grounding wraps ONLY the prose; images stay outside
- Paired neutral → glass; suite card → grounded
- Off-white panel text; `.hifi-key*` never recolored
- Build gate exit 0

---

### D15: Dock-Magnify Suite Controller

**Trigger**: Slide/section controllers, suite selectors, any compact row of suite-identified buttons that reveal imagery on focus

**Doctrine — Three Expanse States** (macOS-dock magnification pattern: grow the SLOT so siblings reflow; the bubble stays round and centered):

| State | Slot | Bubble | Imagery |
|---|---|---|---|
| Default | ~1.35rem | small round suite dot (`--dot` custom property) | hidden |
| Active (medium) | ~38px | ~32px + suite-color ring/glow | **visible — no hover required** |
| Hover/focus (maximum) | ~62px | ~58px, raised z | visible |

- Hover carries higher specificity than active → hovering the active dot still wins to maximum.
- Progress/autoplay indicators ride the active dot only.
- Transitions on slot width + bubble size produce the sweeping magnify; anchor the row (`items-end`) so bubbles grow without lifting neighbors.

**Imagery Framing — Natural Aspect + Percent Offsets (CRITICAL)**: the round bubble (`overflow: hidden; border-radius: 9999px`) masks a full-figure cutout that must show WHOLE:
- **NEVER `object-fit: cover`** — it overflow-crops the figure.
- **NEVER `height: 100%`** — it squashes the Y axis. Use `width: 100%; height: auto`.
- **Position by PERCENT `top`/`left` of the bubble, never px** — percent offsets scale with the bubble so framing holds RELATIVELY across medium and maximum; a px offset that fits medium pushes the figure down at maximum. Zoom via `transform: scale()`.

**General Default + Sparse Per-Suite Overrides**: one general knob frames the MAJORITY; overrides only for imagery that differs, merged over the default:
```js
const heroDefault = { top: '-16%', left: '6%', scale: 0.8 }
const heroOverrides = { 0: { top: '-52%', left: '33%', scale: 1.3 }, 4: { scale: 0.7 } }
const style = (i) => { const a = { ...heroDefault, ...(heroOverrides[i] || {}) }
  return { top: a.top, left: a.left, transform: `scale(${a.scale})` } }
```

**Position Memory**: the active index persists to `sessionStorage` and restores on mount — per-session position memory.

**Verification Caveat**: controllers rendered from `onMounted` are NOT in the SSR payload — verify by build gate + browser (BOTH expanse states per suite), never curl.

**Quality Criteria**:
- Full figure at BOTH medium and maximum — no crop, no squash
- Offsets in percent; zoom via `scale()`
- One general default; overrides sparse
- Siblings reflow via slot growth; bubble round + centered
- Build gate exit 0 + visual verify both states per suite

---

#### Settled Edges — D13/D14/D15

| Diameter | Between | Through Measure |
|----------|---------|-----------------|
| **Grounded Surface Language** | D14 Sectioned Panel Grounding <-> D3 Pane Gradients / D5 Embossed Borders | The grounded inner card's gem spotlight + the glass card's embossed transparency are inset restatements of the pane surface formula. The layered-surface methodology passes through both. |
| **Key Token Consumption** | D13 Sectioned Panel Scannability <-> D1 Color Tokens / D9 Semantic Color Cascade | Key terms consume `--color-SUITE-light` by CONCEPT correspondence (D9's meaning-to-suite derivation applied at the term level). The semantic token methodology passes through both. |
| **Strata Composition** | D13 Sectioned Panel Scannability <-> D14 Sectioned Panel Grounding | D13 sets the two strata (bulk hero + bulleted panels); D14 grounds the panel stratum (header bar + subsection). The scannable-panel methodology passes through both — D14 is D13's grounding layer. |
| **Controller Token Identity** | D15 Dock-Magnify Suite Controller <-> D1 Color Tokens | Each dot's `--dot` custom property + active ring/glow draw from the suite token system. The suite-identity methodology passes through both. |
| **Expanse Transition Grammar** | D15 Dock-Magnify Suite Controller <-> D7 Button Variants / D8 Utility Patterns | The controller's state matrix (default/active/hover) extends the button state grammar; its transitions obey the utility smoothness standard. The interactive-state methodology passes through both. |

---

## Compound Workflows

### New Component Styling
D1 -> D3 -> D5 -> D4 -> D6 (tokens -> gradient -> borders -> shadow -> typography)

### New Suite Color
D1 -> D2 -> D3 -> D4 -> D5 -> D7 -> D8 (full token set -> pattern -> gradient -> shadow -> borders -> buttons -> utilities)

### Accessibility Improvement
D4 -> D3 -> D6 (text shadow -> gradient contrast -> font size verification)

### Interactive Element Addition
D7 -> D5 -> D1 -> D6 (button variant -> border treatment -> color tokens -> typography)

### Digital Readout Component *(W2)*
D6 -> D10 -> D4 -> D5 -> D11 (display font role -> layer stack + context tint -> complement digit shadow -> container/bay framing -> saturation gate + live glow)

### Showcase / Processing Element *(W2)*
D1 -> D11 -> D2 -> D7 (suite tokens -> luminous treatment selection [spotlight / conic / glow stack] -> pattern reveal behavior -> interactive states + availability badge)

### Semantic Component Styling *(W3)*
D9 -> D1 -> D3 -> D2 -> D4 (derive suite from content meaning -> consume the token cascade -> pane treatment -> motif alignment -> readability over the derived surface)

### Full Suite Customization *(W3)*
D9 -> D1 -> D3/D7 -> D12 (hue-band validation -> re-derive all five variants from one hex at the root -> verify panes/buttons recascade -> verify locked/tier treatments persist under the new hue)

### Tier-Gated Surface *(W3)*
D12 -> D9 -> D8 -> D11 (tier analysis -> semantic identity beneath the gate -> locked grayscale + redaction utilities -> distinguish structural lock from transient desaturation)

### Long-Form Scannable Article *(W4)*
D13 -> D9 -> D1 -> D14 (two-strata layout + per-document key legend -> semantic suite derivation per section -> token consumption -> panel grounding pass)

### Panel Grounding Pass *(W4)*
D14 -> D13 -> D3/D5 (treatment selection per panel [P1-P4 / glass-when-paired / exclusions / One-Line / Stat Tile] -> key + bullet integrity held through the pass -> gem/glass surface language verified)

### Suite-Selector Controller *(W4)*
D15 -> D1 -> D8 -> D7 (expanse states + natural-aspect framing -> dot suite tokens -> transition smoothness -> interactive-state grammar)

---

## Reference Grounds — Canonical Exemplar Citations (Five Grounds)

> **Path convention**: `<dev-archive>/` marks exemplar grounds that live in the maintainer's development archive (Round8 · SCP_ORIGIN) — they do NOT ship with an install; the descriptions beside each citation carry the pattern. Unprefixed paths resolve relative to this Suite 8's own package root.

| Ground | Exact Paths | Canonical For |
|--------|-------------|---------------|
| **Pewter Instance v1.1** | `Cascades/8_SUITES/Pewter Tessera/Instance.md` | Identity, firewall, pipeline governance (REWRITE target) |
| **Pewter Skill v1.1** | `Cascades/8_SUITES/Pewter Tessera/Skill.md` | D1-D8 base specs, §0.1 constants (REWRITE target) |
| **Round8 Reference Design** — canonical exemplar ground for **D10/D11** (and verifying exemplar for D2/D3/D4/D5/D7/D8 refinements) | `<dev-archive>/Round8/demo/index.html` (markup: ghost-active stacks, binary strips, version badges, showcase spotlight, chromatic title) · `<dev-archive>/Round8/demo/styles/hifi-base.css` (suite palette, 8% border token tier, complement tokens, SVG patterns, LCD scanlines, DSEG7 @font-face, workflow gradients) · `<dev-archive>/Round8/demo/styles/main.css` (display layer stack, button tiers, prismatic conic, glow systems, sprite mascot) · `<dev-archive>/Round8/demo/styles/markdown-layers.css` (atmosphere, vignette, reader chrome) | **D10 Instrument Display & Readout · D11 Luminous State Treatment** |
| **SCP-Origin Suite Tier System** — canonical exemplar ground for **D9/D12** (and verifying exemplar for D1 token law, D3 `.hifi-pane-*` formula parity, D4 per-suite complements, D7 `.hifi-btn-*` parity) | `<dev-archive>/SCP_ORIGIN/src/lib/suiteDerivation.ts` (the derivation map — 48 lines) · `<dev-archive>/SCP_ORIGIN/src/style.css` (five-variant token inventory, pane/button formulas, locked treatment, redaction bars, spectrum utilities, diamond/onyx families, pewter neutral) · `src/composables/useSuiteColors.ts` (`deriveVariants`, `cssVariableOverrides`, `SUITE_HUE_BANDS`, name lexicon) · `src/composables/useSuiteAccess.ts` (tier gate) · `src/data/suites/` (`manifest.ts` tier spine, detail files with role + aspect records, `loader.ts` structural disclosure) · components `HiFiPane.vue`, `SuiteBadge.vue`, `SuiteSectionLabel.vue`, `SpectrumBar.vue`, `ContextBlockCard.vue`, `RDWorkspace.vue`, `MicrositePane.vue`, `InventoryBrowser.vue`, `SecureView.vue`, `App.vue` | **D9 Semantic Color Cascade · D12 Tier-Derived Styling** |

| **SCP-Origin Long-Form + Home Slides** — canonical exemplar ground for **D13/D14/D15** (and verifying exemplar for D3/D5 surface parity under grounding) | `<dev-archive>/SCP_ORIGIN/src/views/YourMoatView.vue` (P1–P4 + glass-when-paired exemplars, two-strata sections) · components `HiFiPanel.vue`, `TogglePanel.vue`, `ViewToggle.vue`, `BadgePanel.vue`, `SuiteCliMock.vue`, `HeroSlideshow.vue` (dock controller + hero framing) · `src/style.css` (`.hifi-key{,-SUITE}`, `.hifi-list`, `.hifi-panel-toolbar`/`-body`, `.hifi-subtext-ground`/`-glass`, off-white body-text rule, `.shelf-building`/`.shelf-proven`) · source doctrine: SCP-Origin Pewter Skill v1.16 §D18/§D18.1/§D18.2 | **D13 Sectioned Panel Scannability · D14 Sectioned Panel Grounding · D15 Dock-Magnify Suite Controller** |

All D10/D11 `file:line` citations in this document resolve against the Round8 paths above; all D9/D12 citations resolve against the SCP-Origin paths above (paths relative to `<dev-archive>/SCP_ORIGIN/` where not absolute); all D13/D14/D15 citations resolve against the SCP-Origin Long-Form + Home Slides paths above.

---

*Skill Reference Version: 2.1*
*Origin: Design (Frontend Design Skill) + System (Design Token Infrastructure) Muxification — v2.0 infuses Round8 design language + Suite Tier color-cascade; v2.1 infuses the HiFi Functional Design Specification (Sectioned Panel Scannability, Sectioned Panel Grounding, Dock-Magnify Suite Controller) generalized from the SCP-Origin YOUR-MOAT / HOME-SLIDES rounds (source: SCP-Origin Pewter Skill v1.16 D18/D18.1/D18.2)*
*Loaded Skills: Design (15) — D1 Color Tokens, D2 Pattern Tiles, D3 Pane Gradients, D4 Text Shadows, D5 Embossed Borders, D6 Typography, D7 Button Variants, D8 Utility Patterns, D9 Semantic Color Cascade, D10 Instrument Display & Readout, D11 Luminous State Treatment, D12 Tier-Derived Styling, D13 Sectioned Panel Scannability, D14 Sectioned Panel Grounding, D15 Dock-Magnify Suite Controller*

**Changelog note (Conductor Decision B)**: v1.1 removed D9 Director Atmosphere Overlay as project-specific. v2.0 allocates D9-D12 to new GENERALIZED skills (Semantic Color Cascade, Instrument Display & Readout, Luminous State Treatment, Tier-Derived Styling). The v2.0 D9 is NOT a resurrection of the removed Director Atmosphere Overlay — atmospheric composition technique is generalized under D11 Luminous State Treatment. The R5 §3.4(d) Concluder (`grep "D9" = 0`) is superseded accordingly: its intent (no silent resurrection of the removed project-specific skill) is preserved by this note.

## THE WRITE GEOGRAPHY (C927 · hifiConfig.json lands in the SCP's OWN Cascades — never cwd-relative)

Your session's cwd is the WORKSPACE, not the SCP. A relative `Cascades/hifiConfig.json` write
lands in the workspace — a shared directory NO SCP server ever reads (every SCP reads its OWN
`<scpRoot>/Cascades/hifiConfig.json`). Styling written there is orphaned AND pollutes siblings.

RESOLVE THE TARGET FIRST, every time:
1. `curl -s http://127.0.0.1:<port>/scp-config` → `{ scpName, extendedRoot }`
2. scpRoot = extendedRoot with the trailing `/Cascades/Extended` removed.
3. Write `<scpRoot>/Cascades/hifiConfig.json` — the SCP's own design layer (factory < JSON <
   the user's clicks). Read it back. Never write the cwd-relative path.
