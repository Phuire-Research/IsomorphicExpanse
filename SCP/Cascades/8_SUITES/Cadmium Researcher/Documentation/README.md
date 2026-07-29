# Cadmium Researcher — RI Defaults (Hardline)

These are the **hardline default** RI files for a fresh Cadmium Researcher instance — the
cycle-0 baseline **Diamond**, **Onyx**, and **Cascade manifest**. Cycle them back into the
runtime RI directory (`Cascades/Extended/Cadmium Researcher/`) to reset the instance to a
clean slate (e.g. after archiving the Cadmium anchor and re-running a research round).

The runtime `Cascades/Extended/` directory is **gitignored** (live RI artifacts); these
committed defaults are the durable source of truth for a clean reset.

## Files

| Default (committed) | → Runtime target (gitignored) |
|---|---|
| `DIAMOND-TIER-0.default.md` | `Cascades/Extended/Cadmium Researcher/DIAMOND-TIER-0.md` |
| `ONYX-TIER-0.default.md` | `Cascades/Extended/Cadmium Researcher/ONYX-TIER-0.md` |
| `Cascade.default.json` | `Cascades/Extended/Cadmium Researcher/Cascade.json` |

## Reset — cycle the defaults back in

```sh
ROOT="<repo root>"
SRC="$ROOT/Cascades/8_SUITES/Cadmium Researcher/Documentation"
DEST="$ROOT/Cascades/Extended/Cadmium Researcher"

cp "$SRC/DIAMOND-TIER-0.default.md" "$DEST/DIAMOND-TIER-0.md"
cp "$SRC/ONYX-TIER-0.default.md"    "$DEST/ONYX-TIER-0.md"
cp "$SRC/Cascade.default.json"      "$DEST/Cascade.json"

# Clear the Bulletins: delete research articles + the targeted/ subdir
rm -f "$DEST"/*-[0-9]*.md "$DEST"/*-[0-9]*.json   # timestamped research articles
rm -rf "$DEST/targeted"                           # the Research Bulletin store
```

`topics.json` and `menu.json` are intentionally **not** part of the RI default set — reset
those separately only if you want a fully blank slate (the Anchor re-authors `menu.json` on
its next onboarding regardless).
