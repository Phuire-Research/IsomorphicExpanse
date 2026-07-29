#!/usr/bin/env node
/**
 * mockTopicBulletin.mjs — Topic Bulletin Means Trigger (Topic Live Bulletin · folder-tree proving tool)
 *
 * Clone of mockResearchBulletin.mjs for the FIRST folder-tree STCP instance. Where the research
 * mock writes ONE accumulating researchBulletin.json (single-file), THIS mock writes a per-session
 * JSON into its OWN per-slug folder `frontier/<slug>/<slug>-<ts>.json` — exercising the REAL
 * aggregation path (NOT a shortcut write to the aggregate · H7). The act of writing the per-slug
 * JSON IS the trigger:
 *
 *   1. STCP live-emit — the cadmiumOkMonitor frontier/ folder-tree watch (armFolderTreeWatch ·
 *      recursive) sees the write → parseTopicArticleFile → mergeTopicArticles → materialise the
 *      aggregate (frontier/topicBulletin.json) → SBIS relay (cadmiumSetTopicBulletinHuirthBase →
 *      cadmiumSetTopicBulletin) → the Topic Bulletin card appears LIVE, no refresh.
 *   2. BSE persist-on-refresh — the on-mount LIST endpoint (/cadmium-topic-bulletin) re-reads the
 *      materialised aggregate, so the card survives a reload (the BSOH / ODCF-on-mount invariant).
 *   3. DETAIL — /cadmium-topic-bulletin/:id finds the article by `articleId` from the aggregate.
 *      This mock INCLUDES `markdownContent` in the per-session JSON, so the parser threads it into
 *      the merged article → DETAIL loads the full body NOW (W3-provable · without waiting for W4).
 *
 * Citation-only by design (IRR): the mock cites sources, it does NOT embed images. This proves the
 * folder-tree aggregation means: any future Suite-8 folder-tree bulletin clones this trigger by
 * swapping the path constants.
 *
 * Run from the SCS root (the same cwd dev:self / the bridge uses):
 *     node Cascades/scps/template/SCP/scripts/mockTopicBulletin.mjs --topic mock-topic
 *
 * Flags:
 *     --root <path>    explicit SCS root (else SCS_BRIDGE_ROOT_OVERRIDE env, else auto-detect, else cwd)
 *     --topic <slug>   write into frontier/<slug>/ (default 'mock-topic') — the per-slug folder
 *     --clean          remove the mock frontier/<slug>/ folder(s) AND the stale topicBulletin.json, exit
 *
 * No dependencies — node built-ins only. Mirrors cadmiumTopicBulletinRelay.config.ts path discipline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Constants — byte-match cadmium.type.ts (DEFAULT_CADMIUM_DESIGNATION_NAME · CADMIUM_FRONTIER_SUBDIR_BASENAME
// · CADMIUM_TOPIC_BULLETIN_JSON_BASENAME). If those change, change here too (single coupling surface).
const DESIGNATION = 'Cadmium Researcher';
const SUBDIR = 'frontier';
const AGGREGATE_BASENAME = 'topicBulletin.json';
const DEFAULT_TOPIC_SLUG = 'mock-topic';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const argVal = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
};

// Resolve the runtime frontier/ dir the SAME way the relay does (SCS_BRIDGE_ROOT_OVERRIDE ?? cwd),
// then auto-detect by walking up from cwd + the script dir so the trigger works regardless of where
// it is run from. Whichever resolution finds an existing Cadmium RI dir wins; cwd-based (the code's
// discipline) is preferred. Logs the decision so the path is never a silent guess.
function frontierDirFrom(root) {
  return path.resolve(root, 'Cascades', 'Extended', DESIGNATION, SUBDIR);
}
function riDirFrom(root) {
  return path.resolve(root, 'Cascades', 'Extended', DESIGNATION);
}
function walkUpForRiDir(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 8; i++) {
    const cand = riDirFrom(dir);
    if (fs.existsSync(cand)) return cand;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const explicitRoot = argVal('--root') || process.env.SCS_BRIDGE_ROOT_OVERRIDE || null;
let frontierDir = null;
if (explicitRoot) {
  frontierDir = frontierDirFrom(explicitRoot);
} else {
  const riDir = walkUpForRiDir(process.cwd()) || walkUpForRiDir(__dirname);
  frontierDir = riDir ? path.join(riDir, SUBDIR) : null;
}
if (!frontierDir) {
  // Last resort — cwd-based (matches the relay's default); create it so a fresh reset still works.
  frontierDir = frontierDirFrom(process.cwd());
}

const aggregatePath = path.join(frontierDir, AGGREGATE_BASENAME);
const topicSlug = argVal('--topic') || DEFAULT_TOPIC_SLUG;
const topicDir = path.join(frontierDir, topicSlug);

console.log(`[mock-topic] runtime frontier dir : ${frontierDir}`);
console.log(`[mock-topic] per-slug topic dir   : ${topicDir}`);
console.log(`[mock-topic] aggregate            : ${aggregatePath}`);

if (flag('--clean')) {
  let removed = 0;
  // Remove the per-slug topic folder (the mock children) entirely.
  if (fs.existsSync(topicDir)) {
    fs.rmSync(topicDir, { recursive: true, force: true });
    removed += 1;
    console.log(`[mock-topic] --clean: removed topic folder ${topicDir}`);
  }
  // Remove the stale materialised aggregate so the folder-tree merge re-folds cleanly (the
  // remaining-children merge / Idle-clear test then works correctly).
  if (fs.existsSync(aggregatePath)) {
    fs.rmSync(aggregatePath, { force: true });
    console.log(`[mock-topic] --clean: removed stale aggregate ${aggregatePath}`);
  }
  console.log(`[mock-topic] --clean: ${removed} mock topic folder(s) removed.`);
  console.log('[mock-topic] Watch the Topic Bulletin — the mock card(s) should disappear live (folder-tree re-merge).');
  process.exit(0);
}

const createdAt = Date.now();
const timestamp = new Date(createdAt).toISOString();
const stem = `${topicSlug}-${timestamp.replace(/[:.]/g, '-')}`;
const filePath = `Cascades/Extended/${DESIGNATION}/${SUBDIR}/${topicSlug}/${stem}.md`;

// The mock per-session JSON — the ResearchArticleMeta shape parseTopicArticleFile reads (a SINGLE
// object · NOT an array). Required fields (title/slug/topic/timestamp/preview) + the optional
// markdownContent (so DETAIL is provable NOW) + filePath (stable articleId across the parser).
// markdownContent is inline + CITATION-ONLY (no image embed · IRR).
const markdownContent = [
  '# [MOCK] Proving the Topic Bulletin Means',
  '',
  '*Mock trigger · Cadmium Researcher · folder-tree STCP live-emit smoke — no live research arc ran.*',
  '',
  'This card was written by `scripts/mockTopicBulletin.mjs` into its OWN per-slug folder',
  `\`frontier/${topicSlug}/${stem}.json\` to trigger the **folder-tree means**: the recursive`,
  'frontier/ watch that merges every per-session JSON into one Topic Bulletin and emits it live,',
  'plus the BSE list/detail endpoints (reading the materialised aggregate) that re-hydrate it on',
  'refresh. The per-slug write IS the trigger — the real aggregation path, not a shortcut.',
  '',
  '## What this proves',
  '',
  '- **STCP live-emit** — writing a per-session `ResearchArticleMeta` JSON into `frontier/<slug>/`',
  '  fires the recursive folder-tree watch → merge → materialise aggregate → SBIS relay → this card',
  '  appears **without a refresh**.',
  '- **BSE persist-on-refresh** — the on-mount LIST endpoint re-reads the materialised',
  '  `frontier/topicBulletin.json` aggregate, so the card survives a reload (BSOH / ODCF-on-mount).',
  '- **DETAIL** — this mock inlines `markdownContent`, so the merged article carries the full body;',
  '  opening the card loads it via `/cadmium-topic-bulletin/:id` (provable at W3, before W4).',
  '- **Citation-only (IRR)** — Reference-Design output cites its sources; it does not harvest images.',
  '',
  '## Next aspect, once this moves through',
  '',
  'Extend `buildResearchVermillion` (W4) so each live worker writes its output into',
  '`frontier/<topic-slug>/` — the same folder-tree the mock exercises here.',
  '',
  '### Sources',
  '',
  '- The transferable pattern — DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §W3 (CLBF · FATW · AMFJ · LBGC)',
  '- `cadmiumTopicBulletinRelay.config.ts` — parseTopicArticleFile + mergeTopicArticles + the aggregate',
  '- `liveBulletin.model.ts` — the createLiveBulletin factory (folder-tree mode)',
  '',
  '*Cadmium Researcher · mock topic-bulletin means-trigger · citation-only · no image harvest.*',
  '',
].join('\n');

const mockMeta = {
  title: '[MOCK] Proving the Topic Bulletin Means',
  slug: stem,
  topic: topicSlug,
  timestamp,
  preview: 'A mock per-session card written straight into frontier/<slug>/ to trigger the folder-tree merge relay and the BSE persist-on-refresh endpoints — no live research arc. Proves the aggregation means, citation-only.',
  sourceCount: 3,
  // Inline so the merged article carries the body → DETAIL loads NOW (W3-provable).
  markdownContent,
  // Stable articleId across the parser (else it derives from slug+timestamp).
  filePath,
};

// Atomic write — temp file + rename, so the folder-tree watcher never reads a partial write (the
// awaitWriteFinish / parse-null-on-partial discipline). The rename is the observable event.
const jsonPath = path.join(topicDir, `${stem}.json`);
fs.mkdirSync(topicDir, { recursive: true });
const tmp = path.join(topicDir, `.${stem}.json.tmp-${process.pid}`);
fs.writeFileSync(tmp, JSON.stringify(mockMeta, null, 2), 'utf8');
fs.renameSync(tmp, jsonPath);

console.log(`[mock-topic] wrote mock per-session JSON · ${jsonPath}`);
console.log(`[mock-topic] articleId=${filePath}`);
console.log('[mock-topic] ── Now watch the Topic Bulletin (Research Frontier) ──');
console.log('[mock-topic]  • LIVE  : the new card should appear WITHOUT a refresh (folder-tree relay).');
console.log('[mock-topic]  • REFRESH: reload the page — the card should persist (BSE aggregate LIST).');
console.log('[mock-topic]  • DETAIL : open the card — the body loads via /cadmium-topic-bulletin/:id.');
console.log('[mock-topic]  • CLEANUP: `node <thisScript> --topic ' + topicSlug + ' --clean` removes it live.');
