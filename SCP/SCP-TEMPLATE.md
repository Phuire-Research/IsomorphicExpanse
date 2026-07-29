# SCP — Suite Cascade Protocol (Template)

This directory is the **Suite Cascade Protocol template** — a blank-state copy of the prior ICP runtime tree, brought into the SuiteCascadeSystem repository to become the canonical SCP S8 starting point.

**Diamond of origin**: SCP-1 · Foundation Move (RC-to-AppKiller branch)
**Diamond of reclassification**: SCP-2 · ICP → SCP, MCP-Parallel (closed 2026-05-10)
**Diamond of type definition**: SCP-3 · Three-Mode Membership (closed 2026-05-10)
**Pearl chain**: SCP-1 *The Template Arrives* → SCP-2 *ICP → SCP, MCP-Parallel* → SCP-3 *Three-Mode Membership*
**State**: type-defined · runtime template SCP/ (this directory) is cloned-and-renamed when an SCP S8 instance is materialized · meta-Suite-8 type spec lives at `Cascades/8_SUITES/SCP Researcher/` (renamed from `SCP/` at Diamond SCP-4)

## What This Is

SCP is the MCP-parallel concept the SuiteCascadeSystem hosts on its own terms:

- **MCP** (Model Context Protocol) — Anthropic's protocol for tool/context exposure to model runtimes.
- **SCP** (Suite Cascade Protocol) — the Suite Cascade equivalent. Suite-8-fronted locally; SCP-server-fronted remotely. The same protocol surface composes through the user's chosen designation.

## What Will Happen Next (Forward Pass)

The arc that lands SCP into the user-facing pathway is sequenced as `RC-to-AppKiller` (this branch). Diamonds in order:

| # | Diamond | Pearl | Scope |
|---|---|---|---|
| 1 | **SCP-1** | The Template Arrives | ✅ CLOSED · Foundation move · `node_modules`/`dist`/inner-`.git` excluded · marker seeded |
| 2 | **SCP-2** | ICP → SCP, MCP-Parallel | ✅ CLOSED · 17 files renamed · ~700 identifier substitutions · README Pearl-rewritten with MCP-parallel framing · historical citations preserved |
| 3 | **SCP-3** | Three-Mode Membership | ✅ CLOSED · Type spec at `Cascades/8_SUITES/SCP Researcher/Instance.md` (originally `SCP/`, renamed SCP-4) · Skill register SCP-S1..SCP-S8 · Conductor with patterns A/B/C/D · slot-substituted templates · registry row added |
| 4 | **SCP-4** | Personal Site Becomes Personal SCP · SCP Researcher | ✅ CLOSED · Muxified scope: (Part A) renamed SCP → SCP Researcher (meta-Suite-8 type definer); (Part B) `/cascade:advanced` Option [3] Personal Suite 8 Website → Personal SCP Suite 8 (clone-and-rename pathway consuming SCP runtime + SCP Researcher Templates) |
| 5 | **SCP-5** | The User Surface | ✅ CLOSED · `/cascade:scp` slash command + `SM-SCP.md` Pewter HiFi Reference Design + `[R]` SM-Main entry + `scs scp` bridge subcommand (`list` + `init` sub-subcommands) + `src/lib/scp/scpInstance.ts` helpers · 42 new tests · v0.38.0 |
| 6 | **SCP-6** | Research → Stratimux → SCP S8 (Backwards Compatibility Bridge) | ✅ CLOSED · Cross-Suite-8 muxification cascade (Cadmium Researcher + Stratimuxian Scholar + SCP Researcher) · Pattern E in SCP Researcher Conductor · `Strategy/SCP-Adapt.md` Vermillion plan · SM-SCP-Adapt RD + `[A]` Adapt option in SM-SCP · SCP-S9 Adapt Research Target skill · doctrine-only · v0.38.1 |
| 7 | **AppKiller (Refining)** | Monolith-Obsolescence Through Hyper-Personalization | ✅ CLOSED · SCP-arc closure via DOCTRINE not destruction · Legacy Apps ARE Reference Designs · Pattern F = doctrinal naming (not cascade) · SCP-Adapt refined with RD-first discipline at Band 1 + Target formal definition (URL · Screenshot · Repo · anor-to) · new SCP-S10 Reference Design Generation skill · pruned wrong-Diameter destructive artifacts (Strategy/AppKiller-Decommission.md · SM-AppKiller.md · /cascade:appkiller · destructive S10/S11 · `[K]` Kill option) · v0.38.2 patch |
| 8 | **Refine-Macro** | Format Discipline + Bridge-Turnover Verification + ClientState-Preservation Spec | ✅ CLOSED · Project auto-formatted via canonical .prettierrc · `.bridge-restart.json` restored (corrected SCP-1 wrong-prune) · bridge turnover Lambda-event verified (`npm run bridge` · touch trigger · `[Bridge Restart] Fresh process spawned` · `Bridge Restart Manifold: READY`) · Three-Suite parallel dispatch (R2 Rust naming + R4 Viridian bidirectional examine + R6 Amethyst orchestration) · 10 named patterns · 12 edges examined · REFINE verdict (3 implementation refinements required for Next Macro) · Pattern G added to SCP Researcher Conductor (G.1 Soft + G.2 Hard + G.3 failure modes + G.4 refinements + G.5 composition + G.6+ reserved slots) · SCP-S11 Bridge Turnover skill added · Instance.md doctrine section · `[T]` Turnover placeholder in SM-SCP · SCP-Adapt Band 6 turnover follow-up note · v0.38.2 → v0.38.3 patch · stages 1 Macro Diamond pending |

## What This Is Not (Yet)

- **Not yet enacting hosted-app decommission**: AppKiller (final Diamond) replaces conventional hosted-app entry surfaces with SCP S8 dispatch.
- **Deploy / retire / migrate not yet operational**: SCP-5 ships `list` + `init` as TypeScript primitives. Deploy (start runtime) · Retire (decommission) · Migrate (cross-mode) are documented as doctrine in `SM-SCP.md` but their bridge implementations are deferred to future cycles.
- **Adapt cascade not yet binary-primitive**: SCP-6 ships the Adapt doctrine + Strategy file + Reference Design as a Diamond-orchestrated cascade. A bridge subcommand `scs scp adapt <target>` is deferred until a deterministic-enough surface emerges (adapt is fundamentally a multi-step LLM cascade).
- **Hard Turn Over not yet operational**: Refine-Macro (Diamond 8) lands the SPEC for the Hard Turn Over parameter (Pattern G + SCP-S11). The Next Macro Diamond implements the TypeScript primitives (`webSocketServerHardTurnOverBroadcast` + `webSocketClientHardTurnOverClear` + `localStorageHardClear` + nodemon `events.restart` HTTP curl hook + `webSocketClient.principle.ts:129-134` initial-sync timeout fallback fix).

## Inheritance

The prior ICP runtime contributed: Vue + Stratimux client · Node + WebSocket server · Stratimux concept tree (`webSocketClient`, `webSocketServer`, `notification`, `huirth`, `vue`, `muxonomy`, `localStorage`, `client`, `server`, `scp`) · `vite.client.config.ts` build · Jest test infrastructure. All carried into this template intact. After SCP-2, the `scp/` concept (formerly `icp/`) is the canonical protocol surface — identifier-current with the Suite Cascade Protocol naming; runtime mechanics unchanged.

---

*This file is the Pearl-label marker for SCP-1. It does not replace `README.md`; that file is preserved as-is for SCP-2 to rewrite under the SCP terminology.*
