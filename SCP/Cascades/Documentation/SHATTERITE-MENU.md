# THE SHATTERITE MENU — Component Documentation

**The agent-authored, file-anchored, staged menu system of the Suite Cascade.** Every claim in
this document traces to a proven cycle (Onyx TIER-28 · C750-C773). Nothing here is aspiration.

---

## 1 · Identity and Composition

The Shatterite Menu is the Conference surface between a Suite 8 page and its living Anchor
session. It is composed by PLACING ONE TAG — the component owns its own acquisition, staging,
navigation, persistence, and discipline (the anti-fragmentation law · C757/C758):

```vue
<ShatteriteMenu
  :menu-document="menuDocument"   <!-- the staged document from the keyed relay Record -->
  :menu-stage="EMPTY_MENU_STAGE"  <!-- the legacy scalar slot (bespoke consumers · Cadmium) -->
  :default-stage="DEFAULT_STAGE"  <!-- the standing explainer when nothing is authored -->
  :suite8-name="designationName"  <!-- the designation — keys EVERY lookup -->
  title="Base Cascade Menu"
/>
```

| Prop | Purpose |
|---|---|
| `suite8Name` | The designation (NDEP dir name). Keys the floor fetch, the anchor lookup, the Record read, the persistence writes. |
| `menuDocument?` | The staged `MenuDocument` from the keyed relay. Wins when it holds stages. |
| `menuStage` | The legacy single-stage slot (the Cadmium scalar pipe). |
| `defaultStage?` | The standing explainer rendered when no live document exists (SDSD). |
| `noAnchorAuthority?` | On a page composing multiple menus, exactly one holds the anchor lifecycle (C484). |
| `title?` · `defaultAssistPrompt?` | Header override · the AMAF assist fallback. |

## 2 · The File Is the Authority (Floor + Stream)

The menu's truth lives in `Cascades/Extended/<designation>/menu.json` — SCP-local (C465/C481).
Two delivery legs, both proven:

- **THE FLOOR (ODCF · C757/C766)**: on mount the component GETs `/suite8-menu/<designation>`
  (the `s8MenuPath` helper) — the normalized staged document straight from disk, timing-immune
  to every socket race. MOCH floors are MANDATORY on relay-fed surfaces (the #640 law).
- **THE STREAM (C760/C761)**: the per-designation menu watcher (chokidar on the Extended dir)
  reads on change, passes the CONTENT-IDENTITY gate (a djb2 hash — in-place edits relay; the
  bare-stageIndex compare was the C756/C761 double suppression, both gates now hashed), and the
  PER-CONCEPT SMRP broadcasts the concept's OWN wire dialect ('X Set Designation Menu Stage').
  The runtime resolves wire types by name against the page muxium's deck — exchange
  declarations are codegen-only intent (the C760 truth).
- Precedence: the relayed document wins when FILLED; the floor fills the cold mount; the
  default stage stands when nothing is authored.

## 3 · The Staged Document (the VermillionFlow spine · C766)

`menu.json` holds the WHOLE workflow:

```json
{ "schemaVersion": "1", "currentStageIndex": 0, "stages": [ { "stageIndex": 0, "title": "…",
  "prompt": "…", "options": [ … ] } ] }
```

- A LEGACY single-stage file auto-wraps as `stages[0]` (normalizeMenuDocument · zero migration).
- **The press advances**: an `scs` workflow press moves to the next stored stage IMMEDIATELY
  while the model responds; at the last stage it stays (the clamp).
- **Navigation**: the `‹ Stage x / y ›` row (visible when stages > 1) moves back and forth.
- **Persistence**: every iteration POSTs `/suite8-menu-stage` — the server read-modify-writes
  ONLY `currentStageIndex` (the agent owns `stages`); the watcher relays convergence to every
  open page. A reload hydrates the exact position.
- **SMUP**: the attention ping fires on a RELAYED position advance — never on a floor fill.
- The AGENT authors `stages` (add, edit, re-stage); the CLIENT owns position. The file
  reconciles both.

## 4 · The Input Census (everything the menu enables · C768)

| Kind | Badge | Dispatch | Focus discipline |
|---|---|---|---|
| `askMore` (Ask Me) | IN FOCUS · green | focus the terminal + send the assist/scsCommand | In Focus BY NATURE (`inFocus !== false`) |
| `scs` | PASS THROUGH · orange | send scsCommand to the Anchor | Pass Through default |
| `scs` + `inFocus: true` | IN FOCUS · green | focus the terminal first, send, HOLD | the SCS:In-Focus variant |
| `focus` | FOCUS | pure window focus — no relay | (no message) |
| `prime` | PASS THROUGH default | GET the Skill/Strategy loaded-in-full, relay the envelope | can declare `inFocus` |

**The written input forms** — `inputConfig: { kind: 'text' | 'tags' | 'select', placeholder?,
options?, pairDirective? }` — compose the user's writing into the dispatch
(`<pairDirective> <input>` when paired) and **INHERIT their option's focus discipline**.

Page-level affordances: the spawn-anchor row (AD 'prompt') · re-engage · the readiness polls ·
anchorAuthority (the Cadmium double).

## 5 · The Focus Discipline (C768-C770)

`In Focus` (HiFi GREEN): the terminal KEEPS focus — the message relay carries `inFocus: true`
through the WHOLE chain (component → `triggerSendMessage` opts → the `send_message` MCP arg →
the bridge quality → the CSSP envelope → `executeFkis`) and the final Focus-Return-Out to the
SCP is SUPPRESSED (`fkis.execute.focus-out-suppressed · in-focus-hold`).
`Pass Through` (HiFi ORANGE): traditional background messaging — the final refocus occurs.
The chain was proven hop-by-hop (the C769 four-hop flight telemetry); the historic lesson: a
flag that dies silently dies at an envelope REBUILD — instrument the flight, not the stations.

## 6 · Auto-Spawn and Auto Mode (the S8.json rail · C470/C481/C772)

Both toggles persist in `Cascades/Extended/<designation>/S8.json` — THE FILESYSTEM ANCHOR:
- **Auto-Spawn** (`anchorSpawn: 'auto' | 'prompt'`): whether the page spawns its Anchor
  automatically when none exists.
- **Auto Mode** (`autoMode: boolean` · the HiFi-YELLOW pill · C772): when ON, the bridge reads
  the file at EVERY spawn anor resume and appends ` --permission-mode auto` — the Anchor works
  in the background under Claude Code's classifier gate. No client threading: the file is the
  truth (`spawn.auto-mode` telemetry names each firing). OFF = the approval gate intact.

## 7 · The Turing Completeness of Pass Through (the doctrine)

**The system is, technically, a complete Turing Machine in Pass Through.** Whatever is placed
through the channel can create an effect on the screen:

- The CHANNEL carries arbitrary instruction to a LIVE AGENT (the Anchor — a full computational
  head with filesystem hands).
- The agent WRITES STATE the system WATCHES: menu.json (this menu) · the Cascade Memory pair ·
  any JSON under a watched rail. The watchers relay; the components render; the screen changes.
- The loop CLOSES: the rendered menu dispatches the next instruction; the staged document IS a
  program counter (`currentStageIndex`) over stored instructions (`stages`).
- The machine is SELF-EXTENDING: a Pass Through instruction can direct the agent to BUILD A NEW
  CHANNEL — a new JSON file + a chokidar watcher + an STCP relay + a component read — and that
  channel then informs the state of a component forever after. The very rails documented here
  (the menu · the Cascade Memory · gitm · cadmium) were each built exactly this way.

Tape = the watched files. Head = the agent. Transition table = the staged commands. Tape
extension = new channels on demand. The screen is the observable state of the machine.

## 8 · The Never-Copied Trilogy (the mint-rewrite law)

The Forge clones a Suite 8 concept with a blanket `suite8 → {name}` token rewrite. ANY wire
contract literal inside a copied file WILL be rewritten and break. All wire contracts therefore
live in the NEVER-COPIED `scsBridge/model/` home under `s8`-prefixed names the rewrite cannot
touch:
- `s8Anchor.model` — session-field + anchor-spawn contracts (BO-1).
- `s8Routes.model` — every fetch path (`/suite8-menu` · `/suite8-menu-stage` ·
  `/suite8-cascade` · `/suite8-doc-tiers` · `/suite8-doc-save`) (C758).
- `s8RelayTypes.model` — the wire action type strings (C760).
A minted concept inherits the whole working system with ZERO hand-heals (Frontier Pasture ·
C763 · the virgin proof).

## 9 · The Seed and the Founding

The mint births `menu.json` STAGED, its founding options `inFocus: true` (the founding
conversation belongs in the terminal) plus a plain Focus row (C772). The founding Vermillion
(option 1) runs the resolve-then-judge ladder and CREATES the Cascade Memory Documents —
see the Dock §4 and the founding command for the full protocol.

## 10 · Observability (drive-verify any leg)

| Sink (SCP-local `Cascades/Bridge/`) | Names |
|---|---|
| `{name}-menu-watch.json` | principle-start · arm-designation · boot-sweep · addDir re-sweeps |
| `{name}-menu-relay.json` | watch-event · read-dispatch (dispatched / suppressed / parse-null) |
| the fkis sinks (`electron-debug.json` · BOTH the workspace's AND the bridge repo's — the SINK SPLIT) | mcp.pre-relay {inFocus} · relay.attempt · cli.received · focus-out-decision / -suppressed / -confirmed · spawn.auto-mode |

A silent leg is a named leg: grep the seat, find the last hop that spoke, fix that seam.

## 11 · The Cycle Trace

Floors C750/C757 · rewrite-proof routes C758 · wire dialect truth C760 · content identity both
gates C757/C761 · virgin replication C763 · staged conversion C766 · discipline C768-C770 ·
Auto Mode C772 · the pill layout lesson C773. The ledger: `Cascades/Working/ONYX-TIER-28.md`.
