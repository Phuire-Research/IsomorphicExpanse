/**
 * GraphiteScribe Default Menu Model File — the MINIMAL standing Shatterite Menu (PRE-EPOCH · decision 5)
 *
 * Pure model: zero Stratimux imports, zero dispatch. The DEFAULT MenuStage the GraphiteScribeHomeLanding
 * passes to ShatteriteMenu as its `defaultStage` prop. When NO live agent-authored menu.json stage
 * exists for this page's designation (shatteriteMenus[graphiteScribeName] absent or EMPTY_MENU_STAGE), the
 * menu renders THIS standing explainer instead of the empty stub (ShatteriteMenu §SDSD `defaultStage`).
 *
 * MINIMAL scope (decision 5): the spawn-anchor row + ONE documentation row + ONE focus row.
 *   - The spawn-anchor row is RENDERED AT THE PAGE LEVEL (GraphiteScribeHomeLanding · the AD `'prompt'`
 *     branch) because ShatteriteMenu's option dispatch gates on a LIVE anchor (optionsEnabled →
 *     anchorAlive) and therefore CANNOT itself spawn one. This default menu carries the spawn-anchor
 *     row as an 'askMore' explainer affordance (it dispatches an assist prompt once an anchor is
 *     alive); the actual first-load spawn path is the page prompt-row → triggerSpawnGraphiteScribeSession.
 *   - The documentation row is a 'focus' affordance: once an anchor is alive, focusing brings the
 *     user to the instance to read the domain's documentation.
 *   - The focus row is a plain 'focus' affordance: focuses the bound session's window directly.
 *
 * The live menu.json stage (stageIndex >= 0) ALWAYS wins — this default never overrides a live stage.
 *
 * Citation: PRE-EPOCH-S6-PURPLE-COMPOSITION.md §C4/decision 5 (the MINIMAL default menu).
 * Citation: ShatteriteMenu.vue §SDSD (`defaultStage` standing-explainer render path).
 * Citation: graphiteScribeCreateScaffold.model.ts buildFoundingVermillionCommand (the founding shape).
 * Citation: IE-D4d · THE TRUE BASE MENU — the LIVE spawn fires from THIS default MenuStage
 *   when a designation's menu.json is absent/blank; the prior scsCommand walked a newborn
 *   into a stranger's Ego. Replaced with the designation-agnostic FOUNDING command below.
 */
import type { MenuStage } from '../../../model/shatteriteMenu.model';

// IE-D4d · THE FOUNDING COMMAND (designation-agnostic form of buildFoundingVermillionCommand).
// The default menu is a STATIC constant with no runtime designation, so this procedure is
// SELF-REFERENTIAL: the live spawned session already knows its OWN designation and its OWN
// Cascades/Extended/<name>/ path (the Dock §4 teaches it its geography). The existence check
// runs in the SPAWNED session, instruction-borne — own Extended pair EXISTS → engage/summarize
// IT; ABSENT → declare unfounded + run the First Goal Conference. This is the
// newborn-reads-a-stranger's-Ego fix at the TRUE base-menu seam.
const GRAPHITESCRIBE_DEFAULT_FOUNDING_COMMAND = [
  `Establish or continue THIS Suite 8's own ground — your Cascade Memory Documents.`,
  ``,
  `YOUR VOCABULARY, FIRST. Your Cascade Memory Documents ARE your Diamond and Onyx pair — exactly two files: Working/DIAMOND-TIER-1.md (your Ego plan) and Working/ONYX-TIER-1.md (your Lambda ledger), living in the Working/ subfolder of YOUR memory home at <scpRoot>/Cascades/Extended/<your designation>/. They render LIVE on your Suite 8 page's Cascade Memory section. When the user says "Cascade Documents" or "Cascade Memory", they mean THIS pair at THIS address — nothing in Documentation/, nothing at the workspace, nothing in another domain's folder. It is Cascade Memory, not project memory: Suite 8s interact with each other while each maintains its own domain, so no single project encapsulates you.`,
  ``,
  `PHASE 1 · RESOLVE YOUR SCP ROOT (location only — no status judgment). An absent file at your current working directory means NOTHING about whether you are founded — your home is SCP-local, not cwd-local. Work through these rungs IN ORDER and stop at the first that answers:`,
  `  (0) Your system instruction's Dock section 4 may already STAMP "Your SCP root" as a resolved absolute path — if it does, that IS your SCP root and you are done resolving; the rungs below are the fallback.`,
  `  (a) At your current working directory, read Cascades/Extended/<your designation>/S8.json. IF it is present, its scpLocalRoot field is your SCP root (and its scpName, if present, names your SCP) — you are done resolving.`,
  `  (b) IF that S8.json is absent, read Cascades/Bridge/bridge.json at your current working directory: for EACH entry in boundScps, take its dir field (the SCP's absolute root) and check whether <dir>/Cascades/8_SUITES/<your designation>/ exists — the dir that contains your designation is your SCP root. A miss at rung (a) is only a miss of LOCATION; this rung may still find your fully-built SCP-local home.`,
  `  (c) ONLY IF all prior rungs fail to yield a root, ASK the user for the absolute path to your SCP before touching anything — do NOT guess and do NOT default to cwd.`,
  `  SELF-HEAL: if you resolved via rung (b) or (c), repair the seat the miss revealed — ensure <scpRoot>/Cascades/Extended/<your designation>/S8.json exists and carries "scpLocalRoot" (your resolved root) and "scpName", merging into the existing file and preserving its other keys; create it if absent, then read it back. Resolution without repair leaks the cost forward.`,
  ``,
  `PHASE 2 · JUDGE FOUNDEDNESS AT THE RESOLVED ROOT ONLY. Now that you hold your SCP root from Phase 1, read <scpRoot>/Cascades/Extended/<your designation>/Cascade.json for its manifest, and remember your Cascade Memory Documents themselves live in the Working/ subfolder. Judge foundedness ONLY here, never at the bare-cwd path you may have missed in Phase 1:`,
  `  - IF the manifest lists a Diamond (activeDiamond) and an Onyx (activeOnyx) — your Cascade Memory Documents EXIST THERE — then you are FOUNDED: read your DIAMOND-TIER-1.md and ONYX-TIER-1.md from <scpRoot>/Cascades/Extended/<your designation>/Working/, introduce yourself, and summarize where THIS domain stands and its pending items.`,
  `  - ONLY IF the manifest at the resolved root lists no Diamond and no Onyx — your Cascade Memory Documents are ABSENT THERE — declare yourself UNFOUNDED plainly. Do NOT read the workspace Cascade.json or any other project's manifest, and do NOT narrate another domain's Diamond or Onyx as your own — that Ego belongs to a different domain. Instead, run the First Goal Conference: ask the user three questions and wait for the answers —`,
  `      1. What is this Suite 8's domain — the aspect it maintains?`,
  `      2. What is its first goal for the page?`,
  `      3. What are its first three aspirations?`,
  ``,
  `Then CREATE YOUR CASCADE MEMORY DOCUMENTS from the answers, written into the Working/ subfolder of the RESOLVED Extended folder — <scpRoot>/Cascades/Extended/<your designation>/Working/:`,
  `  - Working/DIAMOND-TIER-1.md — the Ego plan (Status, Domain from answer 1, First Goal from answer 2 as the first plan row).`,
  `  - Working/ONYX-TIER-1.md — the Lambda trajectory, an open ledger whose first entry is this founding conversation.`,
  `  - Cascade.json (which stays at the Extended/<your designation>/ ROOT, NOT in Working/) — add activeDiamond and activeOnyx keys with Working/-relative paths pointing at those two files: "activeDiamond": "Working/DIAMOND-TIER-1.md", "activeOnyx": "Working/ONYX-TIER-1.md".`,
  ``,
  `After writing, read each file back to confirm it landed, then report the founded ground — your Cascade Memory Documents now render on your page's Cascade Memory section.`,
].join('\n');

// PRE-EPOCH · the MINIMAL default standing menu (decision 5). stageIndex 0 so ShatteriteMenu renders
// it as a real stage (its SDSD `defaultStage` path requires options.length > 0 to render readably).
export const GRAPHITESCRIBE_DEFAULT_MENU_STAGE: MenuStage = {
  stageIndex: 0,
  title: 'Base Cascade Menu',
  prompt: "No agent-authored menu yet. Summon this domain's Anchor to begin or focus its window.",
  options: [
    {
      // FOUNDING (SPAWN-ANCHOR) row · the page-level AD 'prompt' branch renders the live spawn
      // affordance (triggerSpawnGraphiteScribeSession); this menu row is the standing explainer for it.
      // IE-D4d · the scsCommand is the existence-aware FOUNDING command (carries the full boundScps
      // ladder) — a newborn that finds its own pair ABSENT declares itself unfounded and runs the
      // First Goal Conference instead of reading a stranger's Ego.
      label: 'Summon Anchor',
      kind: 'askMore',
      scsCommand: GRAPHITESCRIBE_DEFAULT_FOUNDING_COMMAND,
      tooltip: "Spawn / engage this domain's Anchor — founds its own ground if unfounded.",
    },
    {
      // W6 (C775) · THE DOCUMENTATION SUMMON — the menu's own manual, pulled through the menu
      // (In Focus: the reading conversation belongs in the terminal).
      label: 'Summon the Menu Documentation',
      kind: 'askMore',
      inFocus: true,
      scsCommand:
        'Summon the Shatterite Menu Documentation: read Cascades/Documentation/SHATTERITE-MENU.md at your SCP root (resolve your root per the Dock section 4 stamp anor the ladder). It is the complete, cycle-traced manual for the menu component you are bound to — the staged document model you author, the option kinds and the In Focus anor Pass Through discipline, the file authority, Auto-Spawn and Auto Mode, and the Turing-complete Pass Through doctrine. Summarize what it enables for THIS domain, then hold it as your operating reference for authoring menu.json.',
      tooltip: 'The Anchor loads SHATTERITE-MENU.md — the full manual for this menu system.',
    },
    {
      // FOCUS row · bring the bound session's window to the foreground.
      label: 'Focus',
      kind: 'focus',
      scsCommand: '',
      tooltip: "Focus the bound session's window.",
    },
  ],
};
