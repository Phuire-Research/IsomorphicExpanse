#!/usr/bin/env node
/**
 * mockResearchBulletin.mjs — Bulletin Means Trigger (Diamond BSE proving tool · transferable)
 *
 * Triggers the **means** without running a live anchor research arc: writes ONE well-formed,
 * citation-only `CadmiumArticle` into the runtime `targeted/researchBulletin.json` — the exact
 * proven shape the STCP relay + the BSE endpoints read. The act of writing the JSON IS the trigger:
 *
 *   1. STCP live-emit — the cadmiumOkMonitor directory-watch arm on `targeted/` sees the write →
 *      parseResearchBulletin → SBIS relay (cadmiumSetResearchBulletinHuirthBase → cadmiumSetResearchBulletin)
 *      → the CadmiumResearchBulletin card appears LIVE, no refresh. (The pattern, in combination with the JSON.)
 *   2. BSE persist-on-refresh — the on-mount LIST endpoint (/cadmium-research-bulletin) re-reads the
 *      same JSON, so the card survives a reload (the BSOH / ODCF-on-mount invariant).
 *   3. DETAIL — /cadmium-research-bulletin/:id finds the article by `articleId` from this same JSON
 *      (markdownContent is inline — no .md file on disk is required).
 *
 * Citation-only by design (IRR): the mock cites sources, it does NOT embed images — proving the
 * Reference-Design means. This is a TRANSFERABLE base-pattern smoke: any Suite-8 Bulletin built on
 * the registerBulletinEndpoints factory can clone this trigger by swapping the path constants.
 *
 * Run from the SCS root (the same cwd dev:self / the bridge uses):
 *     node Cascades/scps/template/SCP/scripts/mockResearchBulletin.mjs
 *
 * Flags:
 *     --root <path>   explicit SCS root (else SCS_BRIDGE_ROOT_OVERRIDE env, else auto-detect, else cwd)
 *     --clean         remove prior mock cards (articleId contains 'mock-bulletin-means') and exit
 *     --replace       write ONLY the mock card (drop existing cards) instead of appending
 *
 * No dependencies — node built-ins only. Mirrors cadmiumResearchBulletinRelay.config.ts path discipline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Constants — byte-match cadmium.type.ts (DEFAULT_CADMIUM_DESIGNATION_NAME · CADMIUM_TARGETED_SUBDIR_BASENAME
// · CADMIUM_RESEARCH_BULLETIN_JSON_BASENAME). If those change, change here too (single coupling surface).
const DESIGNATION = 'Cadmium Researcher';
const SUBDIR = 'targeted';
const BASENAME = 'researchBulletin.json';
const MOCK_SLUG = 'mock-bulletin-means';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const argVal = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
};

// Resolve the runtime targeted/ dir the SAME way the relay does (SCS_BRIDGE_ROOT_OVERRIDE ?? cwd),
// then auto-detect by walking up from cwd + the script dir so the trigger works regardless of where
// it is run from. Whichever resolution finds an existing dir wins; cwd-based (the code's discipline)
// is preferred. Logs the decision so the path is never a silent guess.
function targetedDirFrom(root) {
  return path.resolve(root, 'Cascades', 'Extended', DESIGNATION, SUBDIR);
}
function walkUpForTargeted(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 8; i++) {
    const cand = targetedDirFrom(dir);
    if (fs.existsSync(cand)) return cand;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const explicitRoot = argVal('--root') || process.env.SCS_BRIDGE_ROOT_OVERRIDE || null;
let targetedDir = null;
if (explicitRoot) {
  targetedDir = targetedDirFrom(explicitRoot);
} else {
  targetedDir = walkUpForTargeted(process.cwd()) || walkUpForTargeted(__dirname);
}
if (!targetedDir) {
  // Last resort — cwd-based (matches the relay's default); create it so a fresh reset still works.
  targetedDir = targetedDirFrom(process.cwd());
}

const jsonPath = path.join(targetedDir, BASENAME);
console.log(`[mock-bulletin] runtime targeted dir : ${targetedDir}`);
console.log(`[mock-bulletin] researchBulletin.json: ${jsonPath}`);

// Read the existing array (tolerant — absent/partial/non-array → []), mirroring parseResearchBulletin's
// "stay alive on bad input" posture so the trigger never clobbers on a half-written file.
function readExisting() {
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Atomic write — temp file + rename, so the watcher never reads a partial write (the awaitWriteFinish
// / parse-null-on-partial discipline). The rename is the single observable event the dir-watch sees.
function atomicWriteArray(arr) {
  fs.mkdirSync(targetedDir, { recursive: true });
  const tmp = path.join(targetedDir, `.${BASENAME}.tmp-${process.pid}`);
  fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf8');
  fs.renameSync(tmp, jsonPath);
}

const isMock = (a) => a && typeof a.articleId === 'string' && a.articleId.includes(MOCK_SLUG);

if (flag('--clean')) {
  const before = readExisting();
  const kept = before.filter((a) => !isMock(a));
  atomicWriteArray(kept);
  console.log(`[mock-bulletin] --clean: removed ${before.length - kept.length} mock card(s); ${kept.length} remain.`);
  console.log('[mock-bulletin] Watch the Bulletin — the mock card(s) should disappear live (JDIS clear).');
  process.exit(0);
}

const createdAt = Date.now();
const filePath = `Cascades/Extended/${DESIGNATION}/${SUBDIR}/${MOCK_SLUG}-${createdAt}.md`;

// The mock card — all five required CadmiumArticle fields + the ARJP optionals (preview/topic/slug/
// sourceCount) so the full card renders. articleId === filePath (the proven shape). markdownContent is
// inline + CITATION-ONLY (no image embed · IRR). articleId is unique-per-run so each trigger is a real
// change the dir-watch can see, and appended cards don't collide.
const markdownContent = [
  '# [MOCK] Proving the Bulletin Means',
  '',
  '*Mock trigger · Cadmium Researcher · STCP + JSON live-emit smoke — no live research arc ran.*',
  '',
  'This card was written by `scripts/mockResearchBulletin.mjs` directly into',
  '`targeted/researchBulletin.json` to trigger the **means**: the STCP directory-watch relay that',
  'emits the Bulletin live, plus the BSE list/detail endpoints that re-hydrate it on refresh. The',
  'JSON contract alone drives the render — the pattern, in combination with the JSON.',
  '',
  '## What this proves',
  '',
  '- **STCP live-emit** — writing the proven `CadmiumArticle[]` shape into `researchBulletin.json`',
  '  fires the `targeted/` directory-watch arm → SBIS relay → this card appears **without a refresh**.',
  '- **BSE persist-on-refresh** — the on-mount LIST endpoint re-reads the same JSON, so the card',
  '  survives a reload (the BSOH / ODCF-on-mount invariant).',
  '- **Citation-only (IRR)** — Reference-Design output cites its sources; it does not harvest images.',
  '',
  '## Next aspect, once this moves through',
  '',
  'Extend the same `registerBulletinEndpoints` factory + sidebar to the **Topic Bulletin** — a',
  'config-and-clone of this exact base pattern.',
  '',
  '### Sources',
  '',
  '- The proven pattern — ONYX-TIER-19 §1 (STCP · BSE · BSOH)',
  '- `registerBulletinEndpoints.ts` — the BSPT factory (list + detail)',
  '- `cadmiumResearchBulletinRelay.config.ts` — the JSON contract + `parseResearchBulletin`',
  '',
  '*Cadmium Researcher · mock means-trigger · citation-only · no image harvest.*',
  '',
].join('\n');

const mockCard = {
  articleId: filePath,
  title: '[MOCK] Proving the Bulletin Means',
  filePath,
  slug: `${MOCK_SLUG}-${createdAt}`,
  topic: 'Bulletin Means Smoke',
  preview: 'A mock card written straight into researchBulletin.json to trigger the STCP live-emit relay and the BSE persist-on-refresh endpoints — no live research arc. Proves the means, citation-only.',
  sourceCount: 3,
  markdownContent,
  createdAt,
};

const existing = flag('--replace') ? [] : readExisting();
const next = [...existing, mockCard];
atomicWriteArray(next);

console.log(`[mock-bulletin] wrote mock card · articleId=${mockCard.articleId}`);
console.log(`[mock-bulletin] cards before: ${existing.length} → after: ${next.length}`);
console.log('[mock-bulletin] ── Now watch the Bulletin ──');
console.log('[mock-bulletin]  • LIVE  : the new card should appear WITHOUT a refresh (STCP relay).');
console.log('[mock-bulletin]  • REFRESH: reload the page — the card should persist (BSE on-mount LIST).');
console.log('[mock-bulletin]  • DETAIL : open the card — the sidebar/detail loads via /cadmium-research-bulletin/:id.');
console.log('[mock-bulletin]  • CLEANUP: `node <thisScript> --clean` removes the mock card(s) live.');
