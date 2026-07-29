# Graphite Scribe — Maintainer

**Aspect maintained**: the Code Editor aid surface — the editor_* tool contracts and the
surface knowledge in Instance.md/Skill.md.

## Maintenance dispatch (the S8 pattern)

1. **Maintain the aspect**: diff Instance.md's tool table + surface description against the
   live truth — `src/model/editorFs.model.ts` (buildEditorScpTools + the /editor-fs routes)
   and `src/concepts/codeEditor/` (the surface · the tree · the settings rail). Stale rows
   update; new tools/affordances gain rows.
2. **Maintain itself** (Conference Decide): are the four walks still the right skill shape?
   Gaps become new Skills; dead walks prune.
3. **Return an Onyx Summation**: what changed, what was verified (Concluders), what is PENDING.

## Known seams (check on every pass)

- `editor_open` is informative-only (returns content + guidance); a future STCP leg may drive
  the client tab strip server-side — when it lands, promote editor_open to actionable and
  update Instance.md + Skill.md.
- The rename/move/delete/mkdir endpoints exist on /editor-fs but have NO editor_* tool yet —
  add tools only when an aid walk needs them (the family grows by need, not symmetry).
- GitM badges refresh on .git events, not working-tree creation (the C432 staleness window) —
  don't promise instant badges after a write.
