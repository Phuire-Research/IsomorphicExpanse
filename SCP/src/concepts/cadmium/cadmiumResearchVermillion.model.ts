/**
 * Cadmium Research Vermillion — the TPRI Vermillion-per-topic GENERATOR (Macro RP)
 *
 * A pure string builder. `buildResearchVermillion` returns the Vermillion TEXT
 * (A-I / SCS-directive format) that the orchestrator (Macro TR) delivers to a
 * spawned-then-dissipated Cadmium worker via the VSDT tool (`scs_deliver_vermillion`),
 * wrapped as an `SCS:Vermillion` SORD message. The worker EXECUTES the contained
 * Vermillion — this model does NOT execute anything (no I/O, no Stratimux import).
 *
 * PRPL arc the emitted Vermillion drives (per-topic, atomic):
 *   1. Read the RI at `Cascades/Extended/<suite8Name>/` (TPRI — the Vermillion
 *      carries the RI *path*, read at research time; personalization = Topic + RI,
 *      NOT inline content — the worker reads the RI AS IT EXISTS when it researches).
 *   2. Generate a Planned Query for Topic + RI (the existing <PlannedQuery> shape).
 *   3. Research via WebSearch.
 *   4. Write a timestamped + titled Markdown article + a PAIRED JSON (ARJP) at
 *      `Cascades/Extended/<suite8Name>/<slug>-<ts>.md` and `<slug>-<ts>.json` —
 *      MD FIRST, JSON LAST (the JSON-write is the completion signal Macro AB watches).
 *   5. Terminal teardown — the worker's final step. WORKER path (workerSessionId set):
 *      ACTUATE `scs_close_wait_dissipate` by RUNNING a curl HTTP POST (the §4 SORD actuation)
 *      to the bridge /mcp naming its OWN session ID — the worker RUNS it with Bash (NOT a
 *      self-generated 《》 envelope · §5 forbids that · relay-only contract). CWDC · full
 *      graceful close + dissipate + session-dir teardown. TARGETED path (no workerSessionId):
 *      call `scs_dissipate_session` (DSST).
 *
 * Diameter: this generator (Macro RP) ↔ VSDT (Macro VS) — UNLIKE Demometers
 * (a pure text builder vs a registered SCS-Bridge MCP tool); the through-measure is
 * the `SCS:Vermillion` message body — this model PRODUCES the body, VSDT DELIVERS it.
 * Diameter: ResearchArticleMeta (ARJP contract) ↔ AWCR (Macro AB watcher) — the
 * paired JSON this Vermillion instructs the worker to write IS the shape AB consumes.
 *
 * Citation: EPOCH-DIAMOND-SUITE8-SETUP-RESEARCH.md §2 Macro 4 RP + §3 distinctions
 * Citation: EPOCH-SR-S2-ORANGE-NAMING.md PRPL · TPRI · ARJP (locked names)
 * Citation: VERMILLION-PLANNED-QUERY.md (<PlannedQuery> A-I stage format)
 * Citation: Cadmium Researcher/Instance.md §Research Pipeline (SCS:Aspect · :OK: contract)
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles" (Type-First Architecture)
 */

// ============================================
// ARJP CONTRACT — the paired-JSON preview shape (Macro AB consumes this)
// ============================================
//
// ARJP (Article-Research-JSON-Pairing): every research Markdown the worker writes
// has a sibling JSON carrying a STORED PREVIEW, so the CadmiumBulletin renders an
// article card WITHOUT re-reading the full Markdown. JSON is written LAST — its
// creation is the completion signal the AWCR watcher (Macro AB) fires on.
//
// This is the clean contract AB depends on. `sourceCount` is optional (the worker
// may not always tally sources); the required fields are the card-render minimum.

export type ResearchArticleMeta = {
  // Human-facing article title (the headline rendered on the Bulletin card).
  title: string;
  // URL-safe stable slug — shared path stem of the .md and .json pair.
  slug: string;
  // The research topic this article answers (echoes the Vermillion's topic).
  topic: string;
  // ISO 8601 timestamp the worker stamps at write time (also embedded in the filename).
  timestamp: string;
  // Short preview/summary text for the card surface (no full-Markdown read needed).
  preview: string;
  // W4 · the full Markdown article body inlined so parseTopicArticleFile carries it into the merged
  // CadmiumArticle.markdownContent (the Topic Bulletin DETAIL renders from this · no .md re-read).
  // Optional: a child without it falls back to an empty body (DETAIL shows the preview only).
  markdownContent?: string;
  // W4 · the .md path the worker wrote (the .json sibling shares the stem). Optional: when absent,
  // parseTopicArticleFile derives it from slug+timestamp. When present it wins (stable articleId).
  filePath?: string;
  // Optional count of distinct sources cited (citation-density signal).
  sourceCount?: number;
};

// ============================================
// GENERATOR INPUT — Topic + the RI locator + optional depth
// ============================================
//
// TPRI: `suite8Name` locates the RI directory (`Cascades/Extended/<suite8Name>/`);
// the worker reads the RI there at research time. `depth` maps to the Diamond Scale
// (Initial = targeted · Macro = sweeping · Epoch = continuous) and tunes stage count.

export type ResearchVermillionDepth = 'initial' | 'macro' | 'epoch';

export type BuildResearchVermillionInput = {
  // The research topic — what to search for (the Vermillion's subject).
  topic: string;
  // The Suite 8 designation whose RI directory personalizes the query.
  // Resolves to the RI path `Cascades/Extended/<suite8Name>/`.
  suite8Name: string;
  // Optional research depth (Diamond Scale). Defaults to 'macro' when omitted.
  depth?: ResearchVermillionDepth;
  // C466 · the SERVER-declared absolute Extended base (GET /scp-config → extendedRoot). This
  // model is BROWSER-SHARED (the sweep builds the batch client-side — no process/node:path here);
  // the caller threads the base in. Absent → the legacy relative path (worker-cwd-dependent).
  riBase?: string;
  // W4 · Topics/frontier redirect. When set (e.g. `frontier/<topic-slug>`), the Output Stem becomes
  // `Cascades/Extended/<suite8Name>/<outputSubdir>/<slug>-<ts>` so the worker writes into the
  // frontier folder-tree the Topic Bulletin watcher aggregates. The JSON it writes MUST be the
  // ResearchArticleMeta shape parseTopicArticleFile parses (title/slug/topic/timestamp/preview +
  // markdownContent/filePath), NOT the targeted single-file CadmiumArticle shape. When omitted the
  // worker writes the targeted pair flat in the RI dir and Step 4c (anchor append) is present.
  outputSubdir?: string;
  // CWDC · the spawned worker's OWN session ULID, threaded from the orchestrator
  // (runResearchSweep already holds it from awaitNewLaunchedWorker BEFORE building the
  // Vermillion). When present, Step 5 directs the worker to RUN a curl POST (the §4 SORD
  // actuation) for scs_close_wait_dissipate naming THIS ULID — the worker gracefully closes +
  // dissipates ITSELF (the FULL teardown the base skeleton §5 allowlist now permits). The ULID
  // belongs in the VERMILLION (NOT the base skeleton — the skeleton is hydrated once at bridge
  // boot and cannot carry a per-session ULID). When ABSENT (the targeted/anchor path), Step 5
  // keeps the prior DSST scs_dissipate_session call — only the frontier/worker path actuates
  // close-wait-dissipate.
  workerSessionId?: string;
};

// ============================================
// PURE HELPERS — slug derivation (no I/O)
// ============================================

/**
 * Derive a URL-safe slug from a topic string. The .md and .json pair share this
 * stem; the worker appends `-<ts>` at write time (timestamp owned by the worker,
 * which knows the real research-time clock — this builder does not stamp time).
 */
export function deriveResearchSlug(topic: string): string {
  const slug = topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'research';
}

// ============================================
// DEPTH → STAGE-COUNT GUIDANCE (Diamond Scale tuning)
// ============================================

const DEPTH_GUIDANCE: Record<ResearchVermillionDepth, string> = {
  initial:
    'Initial (targeted): 1-2 Planned Query stages — one focused search, one optional validation.',
  macro:
    'Macro (sweeping): 2-3 Planned Query stages with a decision block — breadth then depth.',
  epoch:
    'Epoch (continuous follow-through): 3+ Planned Query stages — establish baseline, '
    + 'investigate, then validate against the RI through-line for continuity.',
};

// ============================================
// buildResearchVermillion — the TPRI Vermillion-per-topic GENERATOR
// ============================================
//
// Returns the Vermillion TEXT (string). PURE — no I/O, no time, no Stratimux.
// The orchestrator (Macro TR) hands this string to VSDT (`scs_deliver_vermillion`)
// which wraps it as the body of an `SCS:Vermillion` SORD message to the worker.

export function buildResearchVermillion(input: BuildResearchVermillionInput): string {
  const { topic, suite8Name, outputSubdir, workerSessionId, riBase } = input;
  const depth: ResearchVermillionDepth = input.depth ?? 'macro';
  // C465/C466 · THE EXTENDED RELOCATION — workers run at the WORKSPACE cwd, so a bare relative
  // riPath wrote into the workspace Cascades/Extended (the July off-package article). Extended
  // is SCP-LOCAL now: the ABSOLUTE base arrives from the server (riBase · /scp-config
  // extendedRoot — this model is browser-shared, no process.cwd() here). Fallback: legacy relative.
  const riPath = riBase && riBase.length > 0
    ? `${riBase.replace(/\/+$/, '')}/${suite8Name}/`
    : `Cascades/Extended/${suite8Name}/`;
  const slug = deriveResearchSlug(topic);
  const depthGuidance = DEPTH_GUIDANCE[depth];
  // W4 · the frontier redirect. When outputSubdir is set the worker writes into
  // `<riPath><outputSubdir>/` (the frontier folder-tree the Topic Bulletin watcher aggregates) and
  // the JSON it writes MUST be the ResearchArticleMeta shape parseTopicArticleFile parses. When
  // absent the worker writes the targeted pair flat in riPath and Step 4c (anchor append) is present.
  const isFrontier = typeof outputSubdir === 'string' && outputSubdir.length > 0;
  const outDir = isFrontier ? `${riPath}${outputSubdir}/` : riPath;
  const outputStem = `${outDir}${slug}-<ts>`;
  // W4 · the JSON shape Step 4b instructs the worker to write. Frontier MUST match
  // parseTopicArticleFile (cadmiumTopicBulletinRelay.config.ts): title/slug/topic/timestamp/preview
  // required + markdownContent (full body inlined so DETAIL works) + filePath (the .md path) +
  // optional sourceCount. Targeted keeps the lean ResearchArticleMeta preview shape.
  const frontierJsonBlock = `        {
          "title": "<article title>",
          "slug": "${slug}",
          "topic": "${topic}",
          "timestamp": "<TRUE ISO 8601 with COLONS in the time, e.g. 2026-07-12T14:02:06Z — NOT the dash-safe filename <ts> variant>",
          "preview": "<1-2 sentence card preview, no full-Markdown read needed>",
          "markdownContent": "<the FULL article body inlined — the Topic Bulletin DETAIL renders from this>",
          "filePath": "${outDir}${slug}-<ts>.md",
          "sourceCount": <number of distinct sources, optional>
        }`;
  const targetedJsonBlock = `        {
          "title": "<article title>",
          "slug": "${slug}",
          "topic": "${topic}",
          "timestamp": "<TRUE ISO 8601 with COLONS in the time, e.g. 2026-07-12T14:02:06Z — NOT the dash-safe filename <ts> variant>",
          "preview": "<1-2 sentence card preview, no full-Markdown read needed>",
          "sourceCount": <number of distinct sources, optional>
        }`;
  const jsonShapeBlock = isFrontier ? frontierJsonBlock : targetedJsonBlock;
  const jsonShapeLabel = isFrontier
    ? 'JSON shape (ResearchArticleMeta · frontier folder-tree contract — parseTopicArticleFile reads these EXACT fields):'
    : 'JSON shape (ResearchArticleMeta):';
  // W4 · Step 4c (anchor append) is present ONLY for the targeted path. For the frontier path the
  // folder-tree watcher aggregates the per-child JSON — there is NO anchor append.
  const anchorAppendStep = isFrontier
    ? ''
    : `
Step 4c (NOTE for the Anchor — not the worker): After this worker dissipates, the dispatching
  Anchor (if this was a targeted-Diamond arc) reads the article written above and appends it to
  \`${riPath}targeted/researchBulletin.json\` as a \`CadmiumArticle[]\` entry with \`markdownContent\`
  = the full body (TOWC contract — the ResearchBulletin renders from that array, not from the
  individual ARJP files). Read-append-write; never overwrite.
`;

  // CWDC · Step 5 (the terminal teardown step) has TWO shapes:
  //   - WORKER path (workerSessionId present): ACTUATE close-wait-dissipate by RUNNING a curl
  //     HTTP POST — the §4 SORD actuation (a single tools/call POST to the bridge /mcp endpoint)
  //     naming the worker's OWN session ID. The worker RUNS this with its Bash tool; it does NOT
  //     emit a 《》 envelope. (The base-skeleton SORD contract is RELAY-ONLY: §5 forbids a session
  //     from GENERATING guillemet tags — it only ACTUATES envelopes DELIVERED to it. A
  //     self-initiated teardown is therefore a direct POST, not a self-generated envelope —
  //     emitting one just prints text and never reaches the bridge.) Running the curl trips the
  //     worker's PreToolUse permission hook → user approval → the bridge gracefully closes, waits,
  //     then fully dissipates (registry + .jsonl + session dir). Port 7111 is the bridge's standing
  //     port (writeSpawnSettings · bridge.json); the worker confirms it in its bridge contract.
  //   - TARGETED/anchor path (workerSessionId absent): keep the prior DSST step — call
  //     scs_dissipate_session directly. Only the frontier/worker path actuates close-wait-dissipate.
  const isWorker = typeof workerSessionId === 'string' && workerSessionId.length > 0;
  const dissipateStep = isWorker
    ? `Step 5 (Simple Prompt) — Close + Dissipate yourself (CWDC · the terminal step · ACTUATE — do NOT just print):
  Informative: The research arc is complete; this ephemeral worker produced its durable
    output and must gracefully close and release ITSELF (it is NOT the Anchor). Your OWN
    session ID is "${workerSessionId}"; the bridge endpoint is http://127.0.0.1:7111/mcp
    (your standing SORD contract · the port is also in bridge.json).
  Actionable: As your FINAL action (after the SCS:Vermillion:OK: line below), ACTUATE the
    close-wait-dissipate per the §4 SORD contract — a single HTTP POST. RUN this EXACT command
    with your Bash tool. Do NOT merely print it; RUNNING it is what relays the call into the
    bridge and trips the permission prompt. On approval the bridge gracefully closes, waits,
    then fully dissipates you (registry entry + real session + session directory). No further action.

curl -sS -X POST http://127.0.0.1:7111/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"scs_close_wait_dissipate","arguments":{"sessionId":"${workerSessionId}"}}}'`
    : `Step 5 (Simple Prompt) — Dissipate (DSST · the terminal step):
  Informative: The research arc is complete; this ephemeral worker has produced its
    durable output and must release its resources (it is NOT the Anchor).
  Actionable: Call the "scs_dissipate_session" tool (DSST) to close and remove this
    session. This is the final Vermillion step — no further action after dissipation.`;
  const closingTrailer = isWorker
    ? `then RUN the Step 5 curl POST with your Bash tool (do NOT just print it) to actuate scs_close_wait_dissipate with your own session ID.`
    : `then call scs_dissipate_session.`;

  // A-I / SCS-directive Vermillion. The header is the SCS:Vermillion contract the
  // worker recognizes (Instance.md §Research Pipeline); the body is the PRPL arc as
  // ordered Informative/Actionable steps. The worker actuates this verbatim and ends
  // by closing+dissipating itself (CWDC · worker path) or calling scs_dissipate_session
  // (DSST · targeted path) — JSON written LAST as the AB completion signal.
  return `SCS:Vermillion Execute this Personalized Research Pipeline (PRPL) Vermillion for ONE topic, then dissipate.

<VermillionPlan topic="Personalized Research · ${topic}">

Research Topic: ${topic}
Personalization (TPRI): Topic + RI — read the RI at research time, do NOT assume inline content.
RI Path: ${riPath}
Research Depth (Diamond Scale): ${depth} — ${depthGuidance}
Output Stem: ${outputStem}   (worker stamps <ts> = ISO 8601 at write time)

Step 1 (Simple Prompt) — Read the RI (TPRI · Memory-First S1):
  Informative: Read the RI directory at "${riPath}" BEFORE any WebSearch —
    Cascade.json (cycle history), Diamond.md (the research through-line · Ego) and
    Onyx.md (the found record · Lambda) IF present. Absorb what has already been
    researched, which sources proved reliable, and which threads remain open.
  Actionable: Hold the RI context as the personalization frame for this topic.
    The query is shaped by the RI as it EXISTS NOW — not a cold-start web search.

Step 2 (Simple Prompt) — Generate a Planned Query (Topic + RI):
  Informative: Compose a <PlannedQuery> for "${topic}" calibrated by the RI context
    from Step 1. The Planned Query is "just one part" — personalization = Topic + RI.
  Actionable: Emit the <PlannedQuery> in the established stage format:

  <PlannedQuery>
  System Overview: RI-calibrated investigation of "${topic}".
  [
  search "${topic} — foundational current information" as Step1 {
      success: proceed to Step2
      failure: attempt Step1a
  }
  Intent: Establish a current baseline, informed by the RI through-line.
  Transformation: Baseline context matrix (RI-anchored).
  ],
  [
  search "${topic} — depth / specifics / open threads from the RI" as Step2 {
      success: proceed to Conclude
      failure: attempt Step2a
  }
  Intent: Investigate the specifics and the RI's open threads for "${topic}".
  Transformation: Findings synthesis with citation harvest.
  ]
  </PlannedQuery>

Step 3 (Simple Prompt) — Research via WebSearch:
  Informative: Execute the Planned Query using the WebSearch tool — gather current
    information and sources for "${topic}", branching success/failure per the stages.
  Actionable: Harvest citations (plain http(s) source links). Track a sourceCount.

Step 4 (Simple Prompt) — Write Markdown + paired JSON (ARJP · MD FIRST, JSON LAST):
  Informative: Synthesize the findings into a titled, timestamped Markdown article.
  Actionable: Write the pair to the directory "${outDir}":
    (a) FIRST write the Markdown "${slug}-<ts>.md" — a titled article with plain
        http(s) source hyperlinks. This is the full content.
    (b) LAST write the paired JSON "${slug}-<ts>.json" — the ARJP stored preview.
        JSON-write = the completion signal the Bulletin watcher fires on; it MUST be
        written AFTER the Markdown is fully on disk. ${jsonShapeLabel}
${jsonShapeBlock}
${anchorAppendStep}
${dissipateStep}

</VermillionPlan>

After acting, respond with the contract line first:
SCS:Vermillion:OK:<headline of the article written>
${closingTrailer}`;
}
