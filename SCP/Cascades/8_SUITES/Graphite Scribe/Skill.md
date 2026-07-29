# Graphite Scribe — Skill

**GS-S1 · Aid Through the Editor Tools**

The one skill: perform editing tasks on the user's project THROUGH the SCP's editor_* tools,
and teach the surface while doing it.

## The Walks

**Inspect** (informative):
1. `editor_tree` from `.` — orient; expand only the dirs the task needs (the tool is lazy by design).
2. `editor_read` the target file(s); quote the exact lines that matter (path + line numbers).
3. When the user should SEE it: name the path and point them at the tree anor the path opener
   on the Code Editor page (🎴 Code Editor → the workbench).

**Edit** (actionable):
1. `editor_read` FIRST — never write over unread content.
2. Compose the full new content (the write is whole-file).
3. `editor_write` → verify the returned `{ok, bytes}` · `editor_read` back when the change is
   load-bearing (the read-back Concluder).
4. Tell the user what changed and where; if the file is open-dirty in their surface, say the
   buffer is now stale and the tree/opener re-open shows the saved state.

**Search** (informative):
1. `editor_search` with a specific substring (min 2 chars); the result carries `capped` — when
   true, SAY the sweep was bounded and narrow the query.
2. Follow hits with `editor_read` on the winning path.

**Guide** (the surface itself):
- Opening: the tree click anor the path opener (type the SCP-root-relative path + Enter).
- Saving: Ctrl/Cmd-S anor vim `:w`; the dirty dot on the tab clears on save.
- Vim: ON by default; the ⚙ panel toggles it (the mode strip shows normal/insert/visual/no-vim).
- Settings: the ⚙ panel — vim · word wrap · autosave (+delay) · font size · tab size; changes
  persist to `editorConfig.json` + localStorage and apply live.

## Concluders

- Every write: the returned byte count + a read-back on load-bearing changes.
- Every claim about file content: a quoted `editor_read` excerpt, never memory.
- Every search summary: the hit count AND the `capped` flag.


## The SCP Skill Envelopes (C913 · the executable forms)

Each protocol above executes through its envelope (the Dock §SORD SKILL ENVELOPES law —
resolve `boundScps[<yourScp>].port` from `Cascades/Bridge/bridge.json`, POST to that SCP's
`/mcp` as `tools/call`):

The five tools the SCP serves, SCHEMA-TRUE (Concluder'd live against tools/list · C914):

- Tree:   [[scp:editor_tree {"dir":"<project-relative-dir>"}]]   (dir optional · '.' = root)
- Read:   [[scp:editor_read {"path":"<project-relative-path>"}]]
- Open:   [[scp:editor_open {"path":"<project-relative-path>"}]]  (opens in the LIVE editor surface)
- Write:  [[scp:editor_write {"path":"<project-relative-path>","content":"<full-content>"}]]
- Search: [[scp:editor_search {"q":"<text · min 2 chars>"}]]      (the arg is `q` — NOT query/pattern)

The envelope IS the authority: a fired envelope's quoted response is your Concluder; an
unfired envelope is a claim you may not make.
