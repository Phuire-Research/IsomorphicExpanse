# Gitm Resolver — Maintainer (the Aspect Transplant Manifest)

## Preamble — the Boundary Law
Three identity-bearing fields are NEVER patched at an update seam: the **Designation**
(byte-match to this directory's name), the **Home SCP** (fixed origin, never re-homed),
and the **Strategy contract** (the anchor-parameter names `<scpName>`/`<diffJsonPath>`/
`<resolvedPath>` — the thin-anchor builder depends on them). Renewal is WRITE disposition —
the full incoming part, never a partial patch.

## Sovereignty Boundary
- **Home SCP**: the Template SCP (`Cascades/scps/template/SCP`) — rides EVERY install.
- **Installed-in**: each SCP's own `Cascades/8_SUITES/Gitm Resolver/` (the clone).
- **Portable**: yes — Instance.md + Skill.md + Strategy/ + Onboard.md transplant whole.
- **Fixed**: the Designation · the Home · the read-only-on-git-history reach.
- **The recursive seam**: this Suite 8 ships IN the template, so the update circuit it
  serves also RENEWS it — doctrine improvements arrive through its own resolution passes.
  A conference entry touching THIS directory resolves per the standard doctrine (the
  user's local Strategy expansions win; template doctrine additions union).

## Skills Registry
| Skill | File | Currency Gate | Last Executed |
|---|---|---|---|
| S1 Diff-Ingest | Skill.md §S1 → Strategy §Step 1 | the diff JSON shape unchanged (buckets + provenance) | every dispatch |
| S2 Auto-Path | Skill.md §S2 → Strategy §Step 3 | the disposition triple unchanged (write/patch/preserve) | every dispatch |
| S3 Zone-Union | Skill.md §S3 → Instance §Zones | the two collision zones' files/targets unchanged | every dispatch |
| S4 Conference-Surface | Skill.md §S4 → Strategy §Step 2 | AskUserQuestion available (the manualMode session) | per true overlap |
| S5 Resolution-Emit | Skill.md §S5 → Strategy §Step 4 | UpdateResolvedShape unchanged (gitmUpdate.type.ts) | every dispatch |

## Muxonomy Registration
- **Designation**: Gitm Resolver
- **Spawn seam**: the Update view (ScsBridgeGitmSubPage) → `triggerSpawnSuite8Session('Gitm
  Resolver', <scpName>, asWorker=true, fresh=false, manualMode=true)` → the anchor delivery.
- **Compose**: Base → Dock (§4 stamps designation + SCP root) → Instance.md.
- **Consumes**: `Cascades/Bridge/scp-update-diff.<name>.json` (the update circuit's diff).
- **Emits**: `Cascades/Bridge/scp-update-resolved.<name>.json` (the bridge watcher lands it).
