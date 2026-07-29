# Skill · Add a New SVG Pattern + Assign Suite Patterns via hifiConfig.json

**Scope**: Pewter Tessera · SCP HiFi Design. **Effect**: the repeating-texture Suite Patterns of the SCP.

Suite Patterns are **achromatic** (white-stroke, low-opacity) repeating SVG tiles — one per spectrum suite, tinted by that suite's color. Defaults live in `src/style.css` (`--pattern-*`); a user picks per-spectrum via the Suite Patterns control. You set the SCP's *shipped* pattern design via `Cascades/hifiConfig.json`. **Precedence**: factory < `hifiConfig.json` < the user's live clicks.

## Assign an existing pattern to a spectrum
1. Read `Cascades/hifiConfig.json` (start from `{ "schemaVersion": "1" }` if absent).
2. Set the `patterns` map — `{ "<spectrum>": "<PatternId>" }`. Valid `PatternId`s (the `PATTERN_LIBRARY` in `src/model/suitePatternOverride.model.ts`):
   `scattered-dust` · `nested-frames` · `radial-compass` · `ruled-axis` · `branching-growth` · `cardinal-orbit` · `pentagon-constellation` · `paired-lobes` · `faceted-diamond` · `spectrum-waves` · `square-grid` · `diagonal-rule` · `hex-net` · `concentric-rings` · `wave-lattice` · `circuit-trace` · `triangle-mesh` · `cross-hatch` · `plain-none`
3. Write back. Example:
   ```json
   { "schemaVersion": "1", "patterns": { "blue": "hex-net", "green": "wave-lattice" } }
   ```
4. **Confirm the write** (read it back).

## Author a NEW SVG pattern in the library
1. Design an achromatic tileable motif: `viewBox='0 0 100 100'`, `fill`/`stroke='white'`, `opacity` ~0.1–0.25 (so it reads against any Suite Color), tileable at 30px.
2. Add it to `PATTERN_LIBRARY` in `src/model/suitePatternOverride.model.ts` — a new `PatternId` literal + the `{ id, label, css }` entry where `css` = `url("data:image/svg+xml,…")` (URL-encode the SVG). If it should be a per-spectrum default, also add a matching `--pattern-<id>` to `src/style.css :root`.
3. Then assign it per "Assign an existing pattern" above.

## Notes
- Patterns are **orthogonal** to colors — they tint with whatever Suite Color is set; keep the SVG achromatic.
- Keep the user-facing pattern label spectrum/style-descriptive — no internal profession/cascade names.
- Confirm every write by reading the file back.
