# Onyx · Cadmium Researcher · Tier 0

**Suite**: Cadmium Researcher (Suite 8 · Prospector aspect)
**Through**: Cycle 1 (first targeted research Diamond)

---

## Trajectory (Lambda · what was actually done)

The Cadmium research pipeline has been scaffolded. The page island, the Shatterite Menu,
and the RI directory (`Cascades/Extended/Cadmium Researcher/`) are in place.

**Cycle 1 — Targeted Diamond · Initial · Singular · "The History of Hello, World!"**
The first research arc has run. A WebSearch-grounded Planned Query traced the program's
lineage — the contested 1967 BCPL claim, the first documented 1972 Language B tutorial
(Kernighan, with the four-character-word packed source), the 1974 "Programming in C: A
Tutorial" memo, and the 1978 K&R canonization (`hello, world`, lowercase, no bang). The
finding was written to `targeted/history-of-hello-worlds-1780637702000.md` (6533 bytes, 7
sources), paired with an authored SVG lineage asset, and appended to
`targeted/researchBulletin.json` as a `CadmiumArticle` (markdownContent = full body) — the
TOWC array-write that signals the Research Bulletin.

## Rose Diagnosis

**Cycle 0 (baseline)**
- **Maintain**: research pipeline scaffolded — topics, menu, and RI directory operational.

**Cycle 1 (first targeted Diamond)**
- **Gainy**: the targeted-Diamond → Research Bulletin route (ROSR) executed cleanly end-to-end
  (article + asset + TOWC append, Concluder-verified at 6533 bytes / 1 entry). Worth promoting
  as the standard pattern for `SCS:Diamond` research arcs. Authoring an SVG asset in-context
  (text, containment-safe) sidesteps the risk of binary image fetches — keep this practice.
- **Maintain**: Memory-First (S1) before WebSearch; primary-source preference (Wikipedia +
  Kernighan's own denial of the BCPL-authorship myth) gave citation-grade rigor.
- **Lossy**: the `node -e` argv double-skip bug (no script-path slot under `-e`) cost one
  failed write before correction — prune by remembering `[, a, b] = process.argv` for `-e`.

## Semantic Index

- RI directory: `Cascades/Extended/Cadmium Researcher/`
- Topics state: `topics.json` — `{ id, label, query, active }[]` (active: Agentic-Programming, Operating-Systems)
- Menu state: `menu.json` (stageIndex 2) · `targeted/targeted-menu.json` (stageIndex 0)
- Manifest: `Cascade.json` — `activeDiamond` / `activeOnyx` repo-relative paths
- Cycle 1 article: `targeted/history-of-hello-worlds-1780637702000.md`
- Cycle 1 asset: `assets/history-of-hello-worlds.svg`
- Research Bulletin: `targeted/researchBulletin.json` (1 entry · TOWC)
- ROSR: targeted Diamond → `targeted/researchBulletin.json`; topic sweep → flat RI dir (TopicBulletin/AWCR)

## Cascade Position

Cycle 1 closed at Gate 7 (Diagnose). The targeted "Hello, World" Diamond is in TESTING pending
user confirmation of the rendered card. The Anchor reads this Onyx for context before authoring
topics or planning research, and appends each completed research motion + targeted Diamond here.
Next: a topic-sweep pass (Agentic-Programming / Operating-Systems → Topic Bulletin) or a
follow-on targeted Diamond at Macro/Epoch scale.
