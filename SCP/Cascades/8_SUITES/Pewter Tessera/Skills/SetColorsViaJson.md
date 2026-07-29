# Skill · Set / Change Suite Colors via hifiConfig.json

**Scope**: Pewter Tessera · SCP HiFi Design. **Effect**: the Suite Colors of the SCP this Pewter is anchored in.

You modify the SCP's **controlling JSON** — `hifiConfig.json` — inside the SCP PACKAGE directory's own `Cascades/` folder (create the file if absent). The SCP reads it on boot (the `/hifi-config` endpoint → IslandWrapper) and re-tints every island. **Precedence**: factory defaults < `hifiConfig.json` < the user's live clicks (localStorage). So your JSON sets the SCP's *shipped* design; a user's live click still wins per-spectrum.

## CRITICAL · Resolve the WRITE TARGET first (do NOT write a bare relative path)

The SCP server reads `hifiConfig.json` from the **SCP package directory's** `Cascades/` — NOT from your session's working directory. Writing `Cascades/hifiConfig.json` relative to your cwd lands the file OUTSIDE the SCP (the anchor session's cwd is the OUTER workspace, not the SCP package), so the color **never applies on reload and Git never sees it**. You MUST write to the SCP-rooted, absolute path. Resolve it as follows:

1. **Read the `SCP_NAME` header** from the priming envelope (the `《SCS:Skill》` block that delivered this Skill carries a `SCP_NAME: <name>` line). That `<name>` is the SCP this Pewter serves.
2. **Read `./Cascades/Bridge/bridge.json`** (relative to your session cwd) and take its `userCwd` field — the absolute path of the workspace root the bridge manages.
3. **Compose the absolute target**:
   ```
   <userCwd>/Cascades/scps/<SCP_NAME>/SCP/Cascades/hifiConfig.json
   ```
   This is the EXACT path the SCP server reads (`/hifi-config`) AND it lives inside the SCP's RED git work-tree (rooted at `<userCwd>/Cascades/scps/<SCP_NAME>/`), so a turn-over / Git status will detect it.

**FALLBACK (no `SCP_NAME` header — e.g. dev:self / direct invocation)**: read `scp.config.json` at the SCP package root for its `scpName`, or resolve the SCP package directory directly (the directory containing `package.json` + `scp.config.json` for this SCP under `Cascades/scps/<scpName>/SCP/`), and write `Cascades/hifiConfig.json` inside that package directory's `Cascades/`. The invariant is the same: the file MUST land in the SCP package dir's `Cascades/`, expressed as an absolute path — never a bare `Cascades/hifiConfig.json` relative to your cwd.

## Spectrum names (the 8 user-facing Suite Colors)
`base` · `red` · `orange` · `yellow` · `green` · `blue` · `purple` · `fuchsia`

(User-facing spectrum names only — never expose the internal profession/cascade names.)

## Procedure
1. Resolve the absolute write target per the CRITICAL section above. Call it `<TARGET>`.
2. Read `<TARGET>`. If absent, start from `{ "schemaVersion": "1" }`. (Create the `Cascades/` directory inside the SCP package if it does not exist.)
3. Set the `colors` map — `{ "<spectrum>": "<#rrggbb>" }` for each Suite Color you are changing. Hex must be `#rrggbb`.
4. Write the file back to `<TARGET>` (the absolute SCP-rooted path). Example:
   ```json
   { "schemaVersion": "1", "colors": { "blue": "#3b82f6", "green": "#22c55e" } }
   ```
5. **Confirm the write** — read `<TARGET>` back and verify the JSON parses and the values landed. Run `git -C "<userCwd>/Cascades/scps/<SCP_NAME>" status --short` and confirm the new/modified `SCP/Cascades/hifiConfig.json` appears (it is now inside the SCP RED git work-tree).
6. The change cascades on the SCP's next boot / bridge turn-over (or live if the config-watch relay is active).
7. **Highlight step (best-effort · MCPL Phase 1)** — signal the bridge to focus the SCS-Bridge UI + pulse the Turn-Over button so the user knows the new design awaits a turn-over. Read `./Cascades/Bridge/bridge.json` for its `endpoint`; if present, POST a `scs:highlight` bridge message to `<endpoint>/mcp` carrying `{ "target": "turn-over" }` via the SAME bridge-message tool the render-mode broadcast uses (the `send_message`-class SORD tool · `kind: 'scs:highlight'`, `target: 'turn-over'`). If `bridge.json` is absent or the endpoint is unreachable, SKIP this step silently — the color write above is the load-bearing effect and must not be undone by a failed highlight.

## Notes
- Only set the spectra you intend to change — omit the rest (they keep the factory default).
- Achromatic `base` is the ground chrome; change it sparingly.
- Do **NOT** edit `src/style.css` directly — `hifiConfig.json` is the durable, user-respecting surface.
- The token family per spectrum (`--color-X`, `-dark`, `-light`, `-fade`, `-shadow`) is re-derived automatically from the hex you set (HIFI.1 `deriveVariants`).
