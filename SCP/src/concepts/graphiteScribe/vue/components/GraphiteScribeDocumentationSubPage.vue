<script setup lang="ts">
/**
 * GraphiteScribe Documentation SubPage (Band A-6 HCD)
 *
 * CRITICAL reference — the Suite 8 registration / assignment doc set. Documents
 * how a Suite 8 enters the `graphiteScribes` plurality (MPRF registration · NDEP Name),
 * how it muxifies SuiteCascade (SCBM · Tier 2), how a session routes to it (SAPR),
 * and how the ODSS + PFGD mock-ups exercise the General Agent before Cadmium
 * supplies the real one (Macro C).
 *
 * Static markdown via `marked` (matching the SuiteCascade Documentation render
 * pipeline). As the documentation cascade grows, additional GraphiteScribe usage entries
 * append here (a foundation that expands on release).
 *
 * Citation: SuiteCascadeDocumentationSubPage.vue (marked render-pipeline bearing · B-6).
 * Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md §0-§3 + §5 (Diametric Conference).
 */
import { computed } from 'vue';
import { marked } from 'marked';

// The initial reference — the GraphiteScribe registration + assignment + composition doc set.
const GRAPHITESCRIBE_DOCUMENTATION_SOURCE = `
# Suite 8 — Registration · Assignment · Composition

The GraphiteScribe concept is the **Emergent Base** of the dual-Macro composition. Its sole
state surface is one Record keyed by Name:

\`\`\`
graphiteScribes: Record<string, GraphiteScribeEntry>
\`\`\`

Each entry is the minimal identity + routing surface for one Suite 8 — the literal
\`Cascades/8_SUITES/<Name>/\` directory entry.

## The Paramount Invariant — SCBM

Every Suite 8 **muxifies SuiteCascade**. The composition is flat Tier-2: the graphiteScribe
base (Tier 1) carries the ONE shared SuiteCascade instance at Tier 2.

\`\`\`
d.graphiteScribe.k.graphiteScribes.select()                  // Tier 1 — own roster Record
d.suiteCascade.k.cascades.select()  // Tier 2 — shared cascades Record
\`\`\`

There is no Tier 3 (SuiteCascade muxifies nothing further) — the ECK 2-tier ceiling
is satisfied by design and never triggered. SuiteCascade is **shared without overload**:
one runtime instance reached by every muxifier at the same Tier-2 path.

## Registration — MPRF + NDEP

| Step | Mechanism |
|---|---|
| **NDEP** | The \`name\` passed IS the literal directory entry — no slug, no normalization. |
| **MPRF** | A boot Principle seeds \`graphiteScribes\` from the known \`Cascades/8_SUITES/\` entries. |
| **Shortest-Path** | The register reducer returns ONLY \`graphiteScribes\` — spreads the Record, not the state. |

## Assignment — SAPR

A session gains a **GraphiteScribe-Assignment** that routes its appended System Prompt by
Name, attaching ONLY that Suite 8's \`Instance.md\` (path-derived from the Name) via
the existing \`appendSystemPromptFile\` slot — parallel to the SCP assignment.

## The Mock-Ups — ODSS + PFGD

| Component | Function |
|---|---|
| **ODSS** (A-4) | On-Demand GraphiteScribe Spawn — spawn a session then immediately send a persisting first message (atomic spawn + first-message unit). |
| **PFGD** (A-5) | Pre-Filtered-General-Diameter — a GraphiteScribe-scoped SessionList beside the General Manager; both filter by Suite 8 Name. |

Both are **mock-ups on the GraphiteScribe concept** — they spawn / reach a **General Agent**,
exactly as the SCS-Bridge does as its default testing path. The GraphiteScribe page ships fully
exercisable against a General Agent before any real Suite 8 exists.

## Diametric Conference — GraphiteScribe ↔ SuiteCascade

| Diameter | Through-Measure |
|---|---|
| **Name-as-Shared-Registration-Key** | \`graphiteScribes[Name]\` ↔ \`cascades[Name]\` — the SAME Name keys BOTH Records. |
| **Ego-Lambda-at-Suite-Grain** | GraphiteScribe = identity (Ego); SuiteCascade = history (Lambda). |
| **Component-Page-as-Plurality-Mirror** | The same Key shows the roster here + the cascade in SuiteCascade. |

## Cadmium — The First Real Example (Macro C)

Cadmium Researcher **muxifies GraphiteScribe** and implements ODSS + PFGD for real (its own
agent, not the General testing agent) — the first user-buildable GraphiteScribe example. This
Macro A + Macro B are the **foundation** of Epoch Diamond E1, which bridges into Cadmium.
`;

const renderedDocumentation = computed<string>(
  () => marked.parse(GRAPHITESCRIBE_DOCUMENTATION_SOURCE, { async: false }) as string,
);
</script>

<template>
  <section class="graphiteScribe-documentation-subpage">
    <div class="doc-card hifi-pane-cobalt">
      <div class="doc-header">
        <span class="hifi-heading doc-title">Suite 8 Documentation · Initial Reference</span>
        <div class="hifi-embossed-cobalt" style="margin-top: 0.4rem;" />
      </div>
      <div class="hifi-stamp doc-stamp">
        <div class="doc-markdown-body" v-html="renderedDocumentation" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.graphiteScribe-documentation-subpage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.doc-card {
  border-radius: 8px;
  overflow: hidden;
  padding: 0.75rem;
}

.doc-header {
  padding: 0 0.25rem 0.5rem;
}

.doc-title {
  font-size: 0.9rem;
  display: block;
  color: var(--color-cobalt);
}

.doc-stamp {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  max-height: 70vh;
  overflow-y: auto;
}

.doc-markdown-body {
  font-size: 0.82rem;
  line-height: 1.55;
  color: rgba(220, 220, 220, 0.85);
}

.doc-markdown-body :deep(h1),
.doc-markdown-body :deep(h2),
.doc-markdown-body :deep(h3) {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0.85rem 0 0.45rem;
  color: rgba(240, 240, 240, 0.9);
}

.doc-markdown-body :deep(h1) { font-size: 1.05rem; }
.doc-markdown-body :deep(h2) { font-size: 0.92rem; }
.doc-markdown-body :deep(h3) { font-size: 0.85rem; }

.doc-markdown-body :deep(p) {
  margin: 0.45rem 0;
}

.doc-markdown-body :deep(strong) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.doc-markdown-body :deep(code) {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.doc-markdown-body :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  margin: 0.45rem 0;
  overflow-x: auto;
}

.doc-markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.doc-markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
  font-size: 0.75rem;
}

.doc-markdown-body :deep(th),
.doc-markdown-body :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.3rem 0.6rem;
  text-align: left;
}

.doc-markdown-body :deep(th) {
  background: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  color: rgba(240, 240, 240, 0.9);
}

.doc-markdown-body :deep(blockquote) {
  border-left: 2px solid rgba(255, 255, 255, 0.25);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: rgba(200, 200, 200, 0.7);
  font-style: italic;
}
</style>
