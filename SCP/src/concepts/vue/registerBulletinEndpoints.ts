/**
 * registerBulletinEndpoints — BSPT · the transferable two-channel bulletin endpoint factory
 * (Diamond BSE · W1 · folder-tree aggregate-on-read · Topic Live Bulletin fix)
 *
 * A pure Express + fs factory that registers the two-channel base pattern for any bulletin-style
 * Suite 8 output stream: a LIST endpoint (full array) + a by-identifier DETAIL endpoint (single
 * entry). The Cadmium Research Bulletin is the FIRST instantiation; the Topic Bulletin (and any
 * future Suite 8 page) registers the same factory with a different `jsonPath` / `parse` / `idField`.
 *
 * Two READ modes (the persist-on-refresh source MUST match the live-relay source — else live and
 * refresh diverge, the LBPR hazard the Topic Bulletin hit):
 *   - single-file (default · Targeted) — read+parse ONE jsonPath (the file the mock/anchor writes
 *     directly · the live relay watches the same file). Self-consistent.
 *   - folder-tree (AOR · Topics) — when `folderTree` is set, read+merge the SAME per-session children
 *     the live folder-tree relay merges (`watchDir/**.json` minus `excludeBasenames`), via the SAME
 *     parseChild + merge. This makes the LIST/DETAIL aggregate-on-read from the source of truth (the
 *     frontier/ children), NOT a separately-materialised aggregate cache — so a hard-refresh returns
 *     exactly what the live relay broadcast. No write-then-read dependency.
 *
 * Two channels (mirrors the Archive Server-Extension two-channel split — the AMWP light list +
 * the SEAP heavy body):
 *   - LIST  · `app.get(listRoute)`   → read articles → res.json(articles) (absent/malformed → `[]`).
 *             This is the ODCF hydration channel the client GETs on mount so a hard-refresh seeds the
 *             store WITHOUT waiting for the STCP broadcast (the BSOH lost-on-refresh fix).
 *   - DETAIL · `app.get(detailRoute)` (a `:id` route) → read articles → find by
 *             `entry[idField] === decodeURIComponent(req.params.id)` → res.json(entry) or
 *             res.status(404).json(null). The `:id` derives from a file path → encodeURIComponent
 *             on the client, decodeURIComponent here.
 *
 * SERVER-ONLY: this factory + the caller's `parse` (e.g. parseResearchBulletin) run inside
 * vue.principle.ts (Express handler context). The Vue surface uses `fetch()` only — `parse` /
 * `node:fs` NEVER enter the client bundle.
 *
 * Citation: BSE-DIAMOND-WGB.md §W1 (BSPT factory · BLEP LIST · BDRP DETAIL) · Locked Decisions 10.
 * Citation: ScsBridgeArchiveView.vue (the two-channel ODCF doctrine this factory generalizes).
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md (folder-tree AOR · the live-source persist parity).
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Application } from 'express';

// Folder-tree aggregate-on-read slots. When present, LIST/DETAIL read+merge the per-session children
// under `watchDir` (the SAME source + merge the live folder-tree relay uses) instead of a single
// jsonPath. parseChild parses ONE child file → T[] (typically a 1-element array); merge folds the
// per-file arrays into the final T[] (flatten/dedup/sort) — identical to the live relay's merge.
export interface BulletinFolderTreeRead<T> {
  // Absolute path to the recursively-read root dir (e.g. .../frontier/).
  watchDir: string;
  // Parse ONE child file string → T[] (or null on bad-input). Same parser the live merge uses.
  parseChild: (raw: string) => T[] | null;
  // Fold the per-file parsed arrays into the final T[] (flatten/dedup/sort). Same as the live merge.
  merge: (items: T[][]) => T[];
  // Child basenames to EXCLUDE (e.g. the materialised aggregate file, so it is never double-folded).
  excludeBasenames?: readonly string[];
}

// The factory config. Generic over the parsed entry type `T` (e.g. CadmiumArticle). `parse` is the
// server-only schema-aware parser (already validating + filtering); `idField` is the always-present
// stable identifier the DETAIL route finds by (e.g. 'articleId').
export interface BulletinEndpointsConfig<T> {
  // The LIST route, e.g. '/cadmium-research-bulletin'.
  listRoute: string;
  // The DETAIL route with the :id param, e.g. '/cadmium-research-bulletin/:id'.
  detailRoute: string;
  // The absolute path to the bulletin JSON the watcher writes (resolved by the caller). Used in
  // single-file mode (ignored when `folderTree` is set).
  jsonPath: string;
  // Server-only parser: raw file string → T[] (or null on parse-fail). AFPR-safe. Single-file mode.
  parse: (raw: string) => T[] | null;
  // The stable identifier field on T the DETAIL route matches against (e.g. 'articleId').
  idField: keyof T;
  // OPTIONAL folder-tree aggregate-on-read — when set, LIST/DETAIL aggregate the children directly
  // (the live source of truth) instead of reading the single jsonPath. The persist-on-refresh fix.
  folderTree?: BulletinFolderTreeRead<T>;
}

// Read + parse a SINGLE bulletin JSON. AFPR: absent / unreadable / malformed / non-array → `[]` (the
// LIST channel is always a valid array; the DETAIL channel finds within it). Never throws.
function readBulletin<T>(jsonPath: string, parse: (raw: string) => T[] | null): T[] {
  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// AOR · aggregate-on-read the folder-tree: read every child *.json under watchDir (recursive · minus
// excludeBasenames), parse each via parseChild, merge into the final T[]. Mirrors the live relay's
// readAndDispatchFolderTree EXACTLY, so the persist path returns what the live path broadcast. Absent
// dir / unreadable / all-malformed → `[]`. Never throws.
function readBulletinFolderTree<T>(ft: BulletinFolderTreeRead<T>): T[] {
  const exclude = ft.excludeBasenames ?? [];
  let files: string[];
  try {
    const entries = fs.readdirSync(ft.watchDir, { withFileTypes: true, recursive: true });
    files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.json') && !exclude.includes(e.name))
      .map((e) => path.resolve(
        (e as { parentPath?: string; path?: string }).parentPath
          ?? (e as { parentPath?: string; path?: string }).path
          ?? ft.watchDir,
        e.name,
      ));
  } catch {
    return []; // watchDir does not exist yet (no frontier writes) — empty list.
  }
  const parsed: T[][] = [];
  for (const p of files) {
    try {
      const arr = ft.parseChild(fs.readFileSync(p, 'utf-8'));
      if (arr) parsed.push(arr);
    } catch {
      // ENOENT / partial write / malformed — skip this child.
    }
  }
  if (parsed.length === 0) return [];
  return ft.merge(parsed);
}

export function registerBulletinEndpoints<T>(
  app: Application,
  config: BulletinEndpointsConfig<T>,
): void {
  const { listRoute, detailRoute, jsonPath, parse, idField, folderTree } = config;

  // The single read function both channels share — folder-tree aggregate-on-read when configured
  // (the Topic Bulletin · persist parity with live), else single-file read (Targeted · unchanged).
  const readArticles = folderTree
    ? (): T[] => readBulletinFolderTree(folderTree)
    : (): T[] => readBulletin(jsonPath, parse);

  // BLEP · LIST channel — full array (→ []). The client's onMounted ODCF GETs this to seed the STCP
  // store on hard-refresh (the BSOH lost-on-refresh fix); the live relay keeps it fresh.
  app.get(listRoute, (_req, res) => {
    res.json(readArticles());
  });

  // BDRP · DETAIL channel — single entry by idField (404 → null). The id derives from a file path
  // (may contain slashes) → decodeURIComponent here (encodeURIComponent on the client).
  app.get(detailRoute, (req, res) => {
    const requestedId = decodeURIComponent(req.params.id);
    const articles = readArticles();
    const found = articles.find((article) => article[idField] === requestedId);
    if (found) {
      res.json(found);
      return;
    }
    res.status(404).json(null);
  });
}
