![Stratimux](https://github.com/Phuire-Research/Stratimux/blob/main/Stratimux.png?raw=true)

# SCP — Suite Cascade Protocol

The **Suite Cascade Protocol (SCP)** is the MCP-parallel concept the Suite Cascade System hosts on its own terms. Where Anthropic's Model Context Protocol exposes tools and context to model runtimes, SCP exposes the same surface through Suite 8 designations — locally via a Suite-8-fronted runtime, remotely via the SCP server. The protocol is identical at the surface; the hosting layer is what differs.

This directory is a **template**. SCP-arc Diamonds in the SuiteCascadeSystem repository (`RC-to-AppKiller` branch · Diamonds SCP-1 through SCP-6) progressively reframe and extend it; downstream Diamonds SCP-3 onward make this template clone-and-rename-able into Personal / Organizational / Project SCP Suite 8 instances. AppKiller closes the arc by replacing hosted-app entry surfaces with SCP-orchestrated dispatch.

## Positioning

| Surface | Hosted By | Used For |
|---|---|---|
| **MCP** | Model runtime (Claude Code, others) | Tool/context exposure to a model |
| **SCP local** | Suite 8 designation in a Cascades-installed project | Tool/context exposure governed by Suite 8 identity |
| **SCP remote** | SCP server (this template's WebSocket runtime) | Tool/context exposure across project / org / personal scope · attack surface reduced because the entry IS the Suite 8 boundary |

SCP and MCP are not in opposition. SCP composes through MCP where MCP is the runtime. SCP replaces direct hosted-app exposure where the goal is to keep the entry surface inside the Suite 8 model — orchestrative deployment instead of endpoint deployment.

## Inheritance

This template inherits the Stratimux runtime tree — Vue + Stratimux client, Node + WebSocket server, the `huirth` / `client` / `server` / `webSocketClient` / `webSocketServer` / `vue` / `notification` / `localStorage` / `muxonomy` / `scp` concept set. The `scp/` concept is the protocol surface itself: connection lifecycle, tool registration, tool execution, response storage, response transport. Each SCP capability is a Stratimux quality registered through the `muxonomyRegistry.generated.ts` so MCP-side tool listings derive from the same concept tree the Suite 8 composes.

The template does NOT bundle a `node_modules/` or `dist/` — those are regenerable via `npm install`.

## Quickstart

```bash
npm install
npm run start
```

The SCP server runs the Stratimux muxium with the SCP concept set composed in. The client surface is a Vite-built Vue shell that connects via WebSocket. Both sides share `webSocket.shared.ts` for action dehydration so client and server speak the same Stratimux action graph.

## Project Structure

```
src/
├── index.ts                     # Muxium bootstrap
├── main.ts                      # Client entry
├── concepts/
│   ├── scp/                     # SCP — protocol surface (qualities + strategies + transport)
│   ├── client/                  # Client base concept
│   ├── server/                  # Server base concept
│   ├── webSocketClient/         # Client-side WS bridge
│   ├── webSocketServer/         # Server-side WS bridge
│   ├── huirth/                  # Composed runtime concept
│   ├── vue/                     # Vue integration concept
│   ├── notification/            # User-facing notification surface
│   ├── localStorage/            # Persistence layer
│   └── muxonomy/                # Muxonomy / Diametric model
└── globals/, model/             # Cross-cutting helpers
```

The `scp/` concept is the heart of the template. Its qualities — `scpInitialize`, `scpRegisterTool`, `scpRegisterToolsWithMetadata`, `scpExecuteTool`, `scpSendResponse`, `scpExtractAndSendResponse`, `scpStoreHttpResponse`, `scpResponseSent`, `scpConnectionOpened` — compose the protocol lifecycle. The `scpExpressTransport.principle.huirth.ts` binds the protocol to an Express HTTP transport while `webSocketServer/` provides the WebSocket transport for live state bridging. The same SCP qualities operate identically over either transport.

## SCP Server (Remote)

The remote SCP server is the template's Express + WebSocket runtime composed with the SCP concept set. Its identity is established by a Suite 8 designation when deployed via the SuiteCascadeSystem; the runtime alone is generic, but the deployed instance carries the Suite 8's name, scope (Personal / Organizational / Project), and access boundary.

When deployed:
- **Personal SCP Suite 8** — runs as the user's own bridge into their MCP-using clients
- **Organizational SCP Suite 8** — runs as a team / company-scoped tool surface
- **Project SCP Suite 8** — runs as project-bound tooling (the project itself is the scope)

The Suite 8 IS the perimeter. There is no separate authentication layer to defend; the Suite 8's identity boundary is the access layer.

## Stratimux Reference

Stratimux is the compositional substrate. Concepts compose state, qualities, and principles into a muxium; qualities are atomic state-transformation units; strategies are termination-provable directed graphs of actions; the Stage Planner slices reactive flow into ordered beats. SCP rides on these primitives.

- [Stratimux](https://github.com/Phuire-Research/Stratimux) — the framework
- [ActionStrategy](https://github.com/Phuire-Research/Stratimux/blob/main/ActionStrategy.md) — termination-provable algorithm structure
- [Muxium](https://github.com/Phuire-Research/Stratimux/blob/main/Muxium.md) — runtime composition
- [Concept](https://github.com/Phuire-Research/Stratimux/blob/main/Concept.md) — state + qualities + principles + mode
- [Stage Planner](https://github.com/Phuire-Research/Stratimux/blob/main/StagePlanner.md) — beat-controlled application slicing

## Branch Prediction Advice (carried from template inheritance)

When complex strategies + plans + qualities exceed O(n³) total assembly complexity, Stratimux execution becomes probabilistically nondeterministic — branch prediction errors emerge as state-access ambiguity. To avoid this: keep state structures flat where possible, atomize qualities, partition strategies into Stage Planner beats. When in doubt, simplify. Dialog logging on the muxium surfaces the trace.

## Origin

This template was forked from the prior ICP runtime (Intelligently Crystallized Protocol exploration) at `/reference/beginning/ICP` in the SuiteCascadeSystem workspace. SCP is the canonical successor — same Stratimux runtime mechanics, MCP-parallel positioning made explicit, attack-surface-reduction reframed as the architectural intent. Diamond SCP-1 brought the template in; Diamond SCP-2 (this rewrite) reclassifies the surface; later Diamonds extend it.

---

*Part of the [Suite Cascade System](https://github.com/Phuire-Research/SuiteCascadeSystem). Template state — pre-clone, pre-deployment. Each instantiated SCP Suite 8 starts from a copy of this directory and is named by the user at clone time.*
