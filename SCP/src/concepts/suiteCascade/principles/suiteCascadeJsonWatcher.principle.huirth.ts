/**
 * suiteCascadeJsonWatcher Principle — Huirth Deployment · Band B-4 WCJF
 *
 * Watcher-Cascade-JSON-Function. At principle startup, resolve the GRID
 * `Cascades/Cascade.json` (the General-RI-Directory manifest), read + parse it,
 * register the General cascade entry, enumerate the markdown file paths it lists,
 * read each file's live content, and dispatch the activeCascadeFiles into the
 * shared `cascades['General']` Record. A chokidar watcher armed on Cascade.json
 * re-reads (manifest + files) on every change (debounced).
 *
 * MCW (Multi-Cascade Watch) · DPASL-D1: this watcher watches the GENERAL (GRID)
 * Cascade.json + the files it lists, PLUS every registered Extra cascade SIMULTANEOUSLY.
 * The single-active `cascadeJsonWatcher` (one watched dir at a time, torn down + re-armed
 * on dock) is replaced by a `Map<cascadeDirectory, FSWatcher>` — one live watcher per
 * directory.
 *
 * DPASL-D1 · CASCADE REGISTRY (point of entry) · the watcher is the PURE CONSUMER. The
 * `cascades` Record IS the Cascade Registry: entities REGISTER their cascade onto it (via
 * the suiteCascade/model/cascadeRegistration.model factory — registrants dispatch the
 * cascade-register Base+Relay actions). The watcher reads ONLY its OWN `k_.cascades` and
 * watches what is registered. It imports NOTHING from `../../suite8/` (boundary discipline:
 * suite8 is the EMERGENT base that muxifies suiteCascade; suiteCascade is the PRIOR base and
 * must stand alone). STAGE 0 arms GRID/General (always-watched base · never torn down — the
 * live SuiteCascade UI depends on it). STAGE 1 is selector-bound on [k_.cascades] with a
 * wind-up delay (MCW_WINDUP_MS) so coinciding registers settle into ONE additive sweep: it
 * reads k.cascades, filters General, and armWatcherOn(entry.cascadeDirectory) each Extra —
 * additive + idempotent ("checked, created if absent then watched, or just watched").
 * Registered Extra RI dirs live at `Cascades/Extended/<name>/`. Cross-cascade interaction
 * is a FUTURE concern (out of scope here).
 *
 * SBIS (Stratidian-Base-Informative-State) · Base before Relay:
 *   At each dispatch site the watcher fires the Base action FIRST (runs the local
 *   Huirth reducer → cascades['General'] actually exists server-side) THEN the
 *   Relay action (routes via actionExchange.serverToClient to all connected
 *   Clients). Both via nextA so the async read-then-dispatch re-fires each event.
 *   loadGeneralCascade is defined INSIDE the arming stage (where `d`/`nextA` are
 *   in scope) — exactly like initialReadBackoff in scsBridgeJsonWatcher.
 *
 * Pattern source: scsBridge/principles/scsBridgeJsonWatcher.principle.huirth.ts.
 *   Input substitution: bridge.json/sessions.json → Cascade.json + its listed
 *   markdown files. Output structure preserved: stage dispatch · cleanup return ·
 *   no controller.fire · timer→watcher→conclude teardown (HAZARD-A).
 *
 * Citation: scsBridgeJsonWatcher.principle.huirth.ts (:31 chokidar · :59 DEBOUNCE_MS
 *           · :104 { plan, nextA } · 4-step closure · SBIS Base+Relay order ·
 *           async helper defined inside the stage).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-4 WCJF · §0.5
 *           (ACFR Load Rule: Cascade.json → activeDiamond/activeOnyx + priors).
 * Citation: feedback_stratidian_base_informative_state.md (SBIS).
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns".
 */
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { appendFileSync, mkdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  GENERAL_CASCADE_NAME,
  GENERAL_CASCADE_DIRECTORY,
  GENERAL_CASCADE_JSON_BASENAME,
  GENERAL_CASCADE_FILE_MANIFEST_KEYS,
  SUITE_CASCADE_WATCHER_DEBOUNCE_MS,
  type Cascade,
  type CascadeFileEntry,
  type SuiteCascadeHuirthPrinciple,
} from '../suiteCascade.type';
// DPASL-D1 · BOUNDARY DISCIPLINE — the watcher is the PURE CONSUMER. It imports NOTHING
// from `../../suite8/` (suite8 is the EMERGENT base that muxifies suiteCascade; suiteCascade
// is the PRIOR base, must stand alone). The watcher reads ONLY its OWN `k_.cascades` Record
// (the Cascade Registry · the point of entry) and watches each registered Extra. Entities
// REGISTER cascades onto the Record via the cascadeRegistration.model factory (downward
// import, allowed); the watcher never enumerates a foreign seed list.

// ============================================
// PATH RESOLUTION (mirrors scsBridge BRIDGE_ROOT override discipline)
// ============================================
//
// In dev:self mode the orchestrator stays at the SCS root cwd while the template
// SCP huirth runs with cwd=templateScpPath. SCS_BRIDGE_ROOT_OVERRIDE points at the
// SCS root where the live `Cascades/` GRID actually lives. In production the env
// var is unset → fall back to process.cwd() = install directory · zero regression.
//
// B-5 SDCR + GRID — the watched directory is now DYNAMIC. `activeCascadeDirectory`
// is repository-relative (GRID = 'Cascades'; a docked Suite8 = 'Cascades/8_SUITES/
// <Name>/Cascades'). Path resolution is a FUNCTION of that dir, resolved against the
// same SCS_ROOT base. The base never moves — only the active watch re-points.
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

// Resolve the absolute cascade ROOT for a repository-relative cascade directory.
const resolveCascadeRoot = (cascadeDirectory: string): string =>
  path.resolve(SCS_ROOT, cascadeDirectory);

// Resolve the absolute Cascade.json path for a repository-relative cascade directory.
const resolveCascadeJsonPath = (cascadeDirectory: string): string =>
  path.join(resolveCascadeRoot(cascadeDirectory), GENERAL_CASCADE_JSON_BASENAME);

// DPASL-D1 · Derive the registered cascade Name from a directory. GRID dir
// ('Cascades' or '') → 'General'. A registered Extra dir ('Cascades/Extended/<name>')
// → '<name>' (the LAST path segment · NDEP — the same Name keys cascades[Name]).
// The old `.../8_SUITES/<Name>/Cascades` parent-of-trailing-'Cascades' rule is dropped;
// the new convention places each registrant's RI dir at `Cascades/Extended/<name>`, so
// the trailing segment IS the Name directly.
const deriveCascadeName = (cascadeDirectory: string): string => {
  const normalized = cascadeDirectory.replace(/\\/g, '/').replace(/\/+$/, '');
  if (normalized === GENERAL_CASCADE_DIRECTORY || normalized === '') {
    return GENERAL_CASCADE_NAME;
  }
  const segments = normalized.split('/');
  const last = segments[segments.length - 1];
  return last || GENERAL_CASCADE_NAME;
};

// ============================================
// FILE-SUNK TELEMETRY — THE SIGHTED-DRIVE SINK (Band1)
// ============================================
//
// The SCP's stdout pipes to nodemon — the console.log seats in this file are INVISIBLE to
// drives (no captured sink). Every telemetry seat ALSO appends a JSONL line to the SCP-local
// Bridge rail (<cwd>/Cascades/Bridge/suitecascade-watcher.json) so a drive can Conclude
// (grep) whether the principle booted, armed, and relayed. ADDITIVE — the console.logs stay.
// Never-throw: a sink failure must never harm the watcher. >2MB skip-guard: over the cap the
// sink simply stops appending (mirrors the logRotation.model 2MB cap discipline WITHOUT its
// write-count state — no rotation here; a drive truncates the file between drives). The path
// mirrors resolveScpLocalBridgeDir() semantics (SCS_ROOT IS resolved cwd) WITHOUT importing
// across the scsBridge concept boundary.
const WATCHER_TELEMETRY_SINK_MAX_BYTES = 2 * 1024 * 1024;
const WATCHER_TELEMETRY_SINK_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Bridge',
  'suitecascade-watcher.json',
);

const sinkWatcherTelemetry = (seat: string, detail: Record<string, unknown> = {}): void => {
  try {
    mkdirSync(path.dirname(WATCHER_TELEMETRY_SINK_PATH), { recursive: true });
    try {
      if (statSync(WATCHER_TELEMETRY_SINK_PATH).size > WATCHER_TELEMETRY_SINK_MAX_BYTES) {
        return; // sink over the 2MB cap · skip{sink-cap} · never rotate here, never throw.
      }
    } catch {
      /* sink absent · the first append creates it */
    }
    appendFileSync(
      WATCHER_TELEMETRY_SINK_PATH,
      JSON.stringify({ ts: new Date().toISOString(), seat, ...detail }) + '\n',
      'utf8',
    );
  } catch {
    /* telemetry must never harm the watcher · skip */
  }
};

const DEBOUNCE_MS = SUITE_CASCADE_WATCHER_DEBOUNCE_MS;

// MCW · wind-up delay (ms) so the Suite-8 registers coincide before the watcher assigns
// per-Extra watchers in one pass. The [k_.cascades] stage debounces by this window: a
// burst of register dispatches (each adding a cascades[name] entry) settles into a single
// armWatcherOn sweep rather than re-firing the sweep on every individual register. Larger
// than DEBOUNCE_MS — the per-event re-read window — because registers arrive together.
const MCW_WINDUP_MS = 250;

// ============================================
// RESILIENT READ HELPERS — ENOENT-safe, parse-error-safe (module scope · no deck need)
// ============================================
//
// B-5 SDCR — each helper is now PARAMETERIZED by the active cascade directory so the
// same read logic serves GRID and any docked Suite8 dir (single-active re-scope).

// C1-D5 CWSD · the read result carries a `missingCascadeJson` discriminant so a
// genuinely-absent file (ENOENT) is distinguishable from a present-but-empty one.
// cascadeJson is still `null` whenever parsing fails or the file is absent; the
// flag is true ONLY when the file does not exist on disk (ENOENT).
type CascadeJsonReadResult = {
  cascadeJson: Record<string, unknown> | null;
  missingCascadeJson: boolean;
};

const readCascadeJson = async (
  cascadeDirectory: string,
): Promise<CascadeJsonReadResult> => {
  const cascadeJsonPath = resolveCascadeJsonPath(cascadeDirectory);
  console.log('[SuiteCascade Watcher] read · Cascade.json access · path=', cascadeJsonPath);
  try {
    const raw = await readFile(cascadeJsonPath, 'utf-8');
    return { cascadeJson: JSON.parse(raw) as Record<string, unknown>, missingCascadeJson: false };
  } catch (err) {
    // ENOENT (file absent) → missingCascadeJson true. Parse failures (partial writes)
    // also yield null cascadeJson but missingCascadeJson false (the file exists).
    const isEnoent = (err as NodeJS.ErrnoException)?.code === 'ENOENT';
    return { cascadeJson: null, missingCascadeJson: isEnoent };
  }
};

// Resolve the markdown file paths the manifest lists (ACFR Load Rule), read each
// file's live content, and return the finite CascadeFileEntry list. Missing files
// are skipped (resilient — a stale manifest entry must not crash the watcher).
// THE CONTENT-FILE WATCH · the read returns the RESOLVED absolute file paths alongside
// the entries so the watcher can arm a chokidar watch on the SAME paths loadCascade read
// (the C712 own-root-first resolution). A md edit touches a resolved path → the content
// watcher fires → debounced re-loadCascade → the existing relay fires with fresh content.
type ActiveCascadeFilesReadResult = {
  entries: CascadeFileEntry[];
  resolvedPaths: string[];
};

const readActiveCascadeFiles = async (
  cascadeDirectory: string,
  cascadeJson: Record<string, unknown> | null,
): Promise<ActiveCascadeFilesReadResult> => {
  if (!cascadeJson) {
    return { entries: [], resolvedPaths: [] };
  }
  const cascadeRoot = resolveCascadeRoot(cascadeDirectory);
  const entries: CascadeFileEntry[] = [];
  const resolvedPaths: string[] = [];
  const seen = new Set<string>();
  for (const key of GENERAL_CASCADE_FILE_MANIFEST_KEYS) {
    const value = cascadeJson[key];
    if (typeof value !== 'string' || value.length === 0) {
      continue;
    }
    if (seen.has(value)) {
      continue; // de-dupe (e.g. masterDiamond === macroDiamondAspirant)
    }
    seen.add(value);
    const filePath = value;
    // IE-D4e · THE FOUNDED-DIR BASENAME RESOLUTION. Two manifest conventions coexist:
    //   1. GRID / repo-relative paths (e.g. 'Cascades/Working/...md') → resolve against SCS_ROOT.
    //   2. A FOUNDED Suite 8's Cascade.json lists BARE basenames (e.g. 'DIAMOND-TIER-1.md') that live
    //      IN its own Extended/<name>/ dir — a newborn Anchor wrote the pair beside the manifest.
    // Resolve against the cascade's OWN root FIRST (covers the bare-basename founded case + any dir
    // whose manifest is dir-local); fall back to the SCS_ROOT resolution (the repo-relative case) when
    // the dir-local file is absent. cascadeRoot is the absolute dir where THIS Cascade.json lives (for
    // a workspace-founded dir the cascadeDirectory is absolute, so cascadeRoot IS that founded dir).
    const cascadeLocalPath = path.resolve(cascadeRoot, filePath);
    const scsRootPath = path.resolve(SCS_ROOT, filePath);
    try {
      let markdown: string;
      let resolvedPath = cascadeLocalPath;
      try {
        markdown = await readFile(cascadeLocalPath, 'utf-8');
      } catch {
        // dir-local miss → the repo-relative interpretation (resolve against SCS_ROOT).
        resolvedPath = scsRootPath;
        markdown = await readFile(scsRootPath, 'utf-8');
      }
      resolvedPaths.push(resolvedPath);
      entries.push({ filePath, markdown });
    } catch (err) {
      // File listed but absent on disk under BOTH interpretations · skip · watcher stays alive.
      console.warn(
        '[SuiteCascade Watcher] manifest file unreadable · skip · dirLocal=',
        cascadeLocalPath,
        '· scsRoot=',
        scsRootPath,
      );
    }
  }
  return { entries, resolvedPaths };
};

// Compose a Cascade entry from the parsed manifest. activeCascadeFiles is set in a
// SECOND dispatch (after the async file reads) so registration is immediate and the
// file content streams in once read. Keyed by the directory-derived Name (GRID =
// 'General', or the Suite8 basename).
const buildCascade = (
  cascadeName: string,
  cascadeDirectory: string,
  cascadeJson: Record<string, unknown> | null,
  missingCascadeJson: boolean,
): Cascade => ({
  name: cascadeName,
  cascadeDirectory,
  cascadeJson,
  activeCascadeFiles: [],
  // C1-D5 CWSD · true only when the Cascade.json file is absent on disk (ENOENT).
  missingCascadeJson,
});

// ============================================
// THE PRINCIPLE
// ============================================

export const suiteCascadeJsonWatcherPrinciple: SuiteCascadeHuirthPrinciple = ({ plan, nextA, k_ }) => {
  console.log('[SuiteCascade JSON Watcher] Principle started');
  sinkWatcherTelemetry('principle-start', { cwd: SCS_ROOT });

  // ── Principle-scope mutable state (shared across stages + cleanup) ──────────────
  // MCW (Multi-Cascade Watch) · the GENERAL/GRID watcher PLUS every registered Extra are
  // watched SIMULTANEOUSLY. The single-active `cascadeJsonWatcher` is replaced by a
  // Map<cascadeDirectory, FSWatcher> — one live watcher per watched cascade directory.
  // `armWatcherOn(dir)` is now ADDITIVE + idempotent: a dir already keyed in the Map is a
  // no-op ("just watched"); a new dir scaffolds (CWSD) → arms → stores → loads.
  // The debounce timer stays SHARED (single re-read window across all dirs · keep simple);
  // each fired event re-reads its OWN directory (the dir is captured in the event handler).
  const cascadeWatchers = new Map<string, FSWatcher>();
  // THE CONTENT-FILE WATCH · one content watcher per cascade directory, armed on the
  // RESOLVED markdown paths loadCascade read (re-armed each load · the file set may change).
  // Keyed by directory so a re-load disposes the stale handle before arming fresh (idempotent
  // per path · never-throw). The md-content relay Diameter the Cascade.json watch cannot see.
  const contentWatchers = new Map<string, FSWatcher>();
  let cascadeDebounceTimer: NodeJS.Timeout | null = null;
  // THE CONTENT-FILE WATCH · shared debounce for the content re-read (matches the file's
  // existing 100ms DEBOUNCE_MS idiom · the dir is captured in the content event handler).
  let contentDebounceTimer: NodeJS.Timeout | null = null;
  // MCW wind-up timer — debounces the [k_.cascades] sweep so coinciding registers settle
  // into one armWatcherOn pass (cleared + cleaned up alongside the watchers).
  let mcwWindupTimer: NodeJS.Timeout | null = null;

  // ── Operation factory — `d` captured per-stage (bearing idiom: helpers defined
  // INSIDE the stage where `d`/`nextA` are in scope; keeps d.suiteCascade.e.* live).
  // makeOps is called by BOTH the GRID arming stage (STAGE 0) AND the MCW sweep stage
  // (STAGE 1) so the SAME load/arm logic serves GRID and every registered Extra. `d` is
  // the stage-supplied deck (typed `any` to match the stage callback's inferred deck —
  // the dispatched action creators are validated by the SuiteCascadeHuirthDeck at runtime).
  const makeOps = (d: any) => {
    // Read manifest → register cascade (SBIS Base→Relay) → read listed files → set
    // activeCascadeFiles (Base→Relay). Parameterized by directory (GRID or docked).
    const loadCascade = async (cascadeDirectory: string): Promise<void> => {
      const cascadeName = deriveCascadeName(cascadeDirectory);
      const { cascadeJson, missingCascadeJson } = await readCascadeJson(cascadeDirectory);
      const cascade = buildCascade(cascadeName, cascadeDirectory, cascadeJson, missingCascadeJson);

      // SBIS Base first — Huirth-local reducer runs so cascades[name] exists server-side.
      nextA(
        d.suiteCascade.e.suiteCascadeSetCascadeHuirthBase({ name: cascadeName, cascade }),
      );
      // Relay — routes via actionExchange.serverToClient to all Clients.
      nextA(
        d.suiteCascade.e.suiteCascadeSetCascadeRelay({ name: cascadeName, cascade }),
      );

      const { entries: activeCascadeFiles, resolvedPaths } = await readActiveCascadeFiles(
        cascadeDirectory,
        cascadeJson,
      );
      // THE CONTENT-FILE WATCH · arm (re-arm) on the resolved md paths this load just read.
      armContentWatch(cascadeDirectory, resolvedPaths);
      console.log(
        '[SuiteCascade Watcher] load · dir=',
        cascadeDirectory,
        '· name=',
        cascadeName,
        '· cascadeJson=',
        cascadeJson ? 'present' : 'null',
        '· activeCascadeFiles=',
        activeCascadeFiles.length,
      );
      sinkWatcherTelemetry('load-complete', {
        dir: cascadeDirectory,
        name: cascadeName,
        cascadeJson: cascadeJson ? 'present' : 'null',
        fileCount: activeCascadeFiles.length,
      });

      // SBIS Base first — set the file content on the now-registered entry.
      nextA(
        d.suiteCascade.e.suiteCascadeSetActiveCascadeFilesHuirthBase({
          name: cascadeName,
          activeCascadeFiles,
        }),
      );
      nextA(
        d.suiteCascade.e.suiteCascadeSetActiveCascadeFilesRelay({
          name: cascadeName,
          activeCascadeFiles,
        }),
      );
    };

    // THE CONTENT-FILE WATCH · arm a chokidar watch on the RESOLVED md paths (the same paths
    // loadCascade read · C712 own-root-first). Re-armed on every load: the manifest's file set
    // may change, so DISPOSE the stale per-dir handle before arming fresh (idempotent per path ·
    // never-throw · skip telemetry). On 'change' → debounced re-loadCascade(dir) → the existing
    // relay fires with fresh content. The Cascade.json watch (armWatcherOn) stays untouched.
    const armContentWatch = (cascadeDirectory: string, resolvedPaths: string[]): void => {
      const existing = contentWatchers.get(cascadeDirectory);
      if (existing) {
        try {
          existing.close();
        } catch {
          /* watcher already closed */
        }
        contentWatchers.delete(cascadeDirectory);
      }
      if (resolvedPaths.length === 0) {
        return; // nothing to watch (no readable md files) · skip.
      }
      try {
        // C899 · THE INODE-SWAP CURE (the proven STCP dir-watch idiom): a FILE-path watch dies
        // the moment an editor anor agent replaces the file (write-temp-then-rename) — the
        // Run-Through field evidence: the Anchor's edit fired ZERO content events. Watch the
        // PARENT DIRECTORIES (depth 0) and gate on the listed basenames — rename-immune.
        const watchedBasenames = new Set(resolvedPaths.map((p) => path.basename(p)));
        const parentDirs = Array.from(new Set(resolvedPaths.map((p) => path.dirname(p))));
        const contentWatcher = chokidarWatch(parentDirs, {
          persistent: true,
          ignoreInitial: true, // the initial content is already in-hand from this load.
          depth: 0,
          awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
        });
        const handleContentEvent = (eventTag: string): void => {
          if (contentDebounceTimer) clearTimeout(contentDebounceTimer);
          contentDebounceTimer = setTimeout(() => {
            console.log(
              '[SuiteCascade Watcher] content file',
              eventTag,
              '· re-reading + reloading · dir=',
              cascadeDirectory,
            );
            sinkWatcherTelemetry('content-file-change', { eventTag, dir: cascadeDirectory });
            loadCascade(cascadeDirectory);
          }, DEBOUNCE_MS);
        };
        const gated = (tag: string) => (changed: string): void => {
          if (watchedBasenames.has(path.basename(changed))) handleContentEvent(tag);
        };
        contentWatcher.on('change', gated('change'));
        contentWatcher.on('add', gated('add'));
        contentWatcher.on('unlink', gated('unlink'));
        contentWatcher.on('error', () => {
          /* content watcher error · never throw · skip. */
        });
        contentWatchers.set(cascadeDirectory, contentWatcher);
        console.log(
          '[SuiteCascade Watcher] content watch armed · dir=',
          cascadeDirectory,
          '· files=',
          resolvedPaths.length,
        );
      } catch {
        /* content watch arm failed · never throw · skip. */
      }
    };

    // TEAR DOWN — HAZARD-A order: timers → watchers. MCW closes ALL Map watchers (the
    // GRID/General base AND every Extra) so principle cleanup leaks no handles. Closing
    // each watcher before any rebuild ensures no in-flight event fires into a torn-down
    // target. The Map is cleared after every entry is closed.
    const tearDownWatcher = (): void => {
      if (cascadeDebounceTimer) {
        clearTimeout(cascadeDebounceTimer);
        cascadeDebounceTimer = null;
      }
      if (contentDebounceTimer) {
        clearTimeout(contentDebounceTimer);
        contentDebounceTimer = null;
      }
      if (mcwWindupTimer) {
        clearTimeout(mcwWindupTimer);
        mcwWindupTimer = null;
      }
      for (const watcher of cascadeWatchers.values()) {
        try {
          watcher.close();
        } catch {
          /* watcher already closed */
        }
      }
      cascadeWatchers.clear();
      // THE CONTENT-FILE WATCH · close every per-dir content watcher too (no handle leak).
      for (const watcher of contentWatchers.values()) {
        try {
          watcher.close();
        } catch {
          /* watcher already closed */
        }
      }
      contentWatchers.clear();
    };

    // ARM — ADDITIVE + IDEMPOTENT (MCW). If `cascadeDirectory` already has a live watcher
    // in the Map → no-op ("just watched"). Otherwise run the CWSD scaffold (mkdir + seed
    // Cascade.json when absent · "created if it does not exist") → arm a chokidar watch →
    // store it in the Map → loadCascade. Multiple dirs (GRID + every Extra) are armed by
    // repeated calls; each call adds at most one watcher.
    const armWatcherOn = (cascadeDirectory: string): void => {
      // IDEMPOTENT GUARD — "just watched": already-armed dir is a no-op.
      if (cascadeWatchers.has(cascadeDirectory)) {
        return;
      }
      const cascadeJsonPath = resolveCascadeJsonPath(cascadeDirectory);

      // C1-D5 CWSD · Cascade-With-Scaffold-on-Dock. Ensure the cascade directory
      // exists (mkdir recursive · idempotent · no-op if present) and seed a minimal
      // Cascade.json when both the dir and file are absent — so chokidar's 'add' event
      // (ignoreInitial:false) fires correctly on a freshly-scaffolded file. Fire-and-
      // forget void async so armWatcherOn stays synchronous (the plan stage is sync).
      void (async (): Promise<void> => {
        try {
          const fsp = await import('node:fs/promises');
          const cascadeDirPath = path.dirname(cascadeJsonPath);
          await fsp.mkdir(cascadeDirPath, { recursive: true });
          let fileExists = true;
          try {
            await fsp.access(cascadeJsonPath);
          } catch {
            fileExists = false;
          }
          if (!fileExists) {
            await fsp.writeFile(
              cascadeJsonPath,
              JSON.stringify({ schemaVersion: '1', cycles: [] }, null, 2),
              'utf8',
            );
            console.log('[SuiteCascade Watcher] CWSD scaffold written:', cascadeJsonPath);
          }
        } catch (err) {
          console.warn('[SuiteCascade Watcher] CWSD scaffold failed:', err);
        }
      })();

      // Initial read · register + load (GRID or docked). chokidar picks up changes.
      // CWSD scaffold above is fire-and-forget; the ENOENT-tolerant readCascadeJson
      // returns missingCascadeJson:true if the read races ahead of the scaffold write,
      // and chokidar's 'add' event re-loads once the scaffold lands.
      loadCascade(cascadeDirectory);

      try {
        // C900 · THE INODE-SWAP CURE, MANIFEST LEG (the C899 twin): the Cascade.json watch was
        // FILE-path-armed — an agent's promote (write-temp-then-rename) swapped the inode and
        // the watch died silently: the page held the BOOT-time pair while the disk moved on
        // (the Hello-World-vs-Lorem field evidence). Watch the PARENT DIR (depth 0), gate on
        // the manifest basename — rename-immune.
        const manifestBasename = path.basename(cascadeJsonPath);
        const watcher = chokidarWatch(path.dirname(cascadeJsonPath), {
          persistent: true,
          ignoreInitial: false,
          depth: 0,
          awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
        });
        // MCW · the event handler captures THIS dir (closure) so each watcher re-reads
        // its own Cascade.json. The shared debounce timer is fine — re-read is keyed on
        // the captured directory, not on which watcher fired.
        const handleCascadeJsonEvent = (eventTag: string): void => {
          if (cascadeDebounceTimer) clearTimeout(cascadeDebounceTimer);
          cascadeDebounceTimer = setTimeout(() => {
            console.log(
              '[SuiteCascade Watcher] Cascade.json',
              eventTag,
              '· re-reading + reloading · dir=',
              cascadeDirectory,
            );
            sinkWatcherTelemetry('cascade-json-change', { eventTag, dir: cascadeDirectory });
            loadCascade(cascadeDirectory);
          }, DEBOUNCE_MS);
        };
        const manifestGated = (tag: string) => (changed: string): void => {
          if (path.basename(changed) === manifestBasename) handleCascadeJsonEvent(tag);
        };
        watcher.on('add', manifestGated('add'));
        watcher.on('change', manifestGated('change'));
        watcher.on('error', (err) => {
          console.warn('[SuiteCascade Watcher] chokidar error:', err);
        });
        // MCW · store in the Map keyed by directory — additive watch (not single-active).
        cascadeWatchers.set(cascadeDirectory, watcher);
        console.log(
          '[SuiteCascade Watcher] chokidar armed on',
          cascadeJsonPath,
          '· total watchers=',
          cascadeWatchers.size,
        );
        sinkWatcherTelemetry('arm-cascade-json', {
          dir: cascadeDirectory,
          cascadeJsonPath,
          totalWatchers: cascadeWatchers.size,
        });
      } catch (err) {
        console.warn('[SuiteCascade JSON Watcher] Cascade.json chokidar arm failed:', err);
      }
    };

    // MCW · read the watcher's OWN `cascades` Record (k.cascades) and arm a watcher per
    // entry, FILTERING OUT General (the GRID base is armed by STAGE 0 — never re-armed
    // here; armWatcherOn is idempotent regardless). Newly-registered Extras get armed;
    // already-armed are no-ops ("just watched"). This is the heart of MCW — the assignment
    // FROM the contents of the `cascades` property.
    const armRegisteredExtras = (k: { cascades: { select: () => Record<string, Cascade> } }): void => {
      const cascades = k.cascades.select();
      for (const entry of Object.values(cascades)) {
        if (!entry || entry.name === GENERAL_CASCADE_NAME) {
          continue; // filter the General — its watch is the always-on STAGE 0 base.
        }
        armWatcherOn(entry.cascadeDirectory); // additive + idempotent.
      }
    };

    return { loadCascade, tearDownWatcher, armWatcherOn, armRegisteredExtras };
  };

  const watcherPlan = plan('SuiteCascade JSON Watcher (Huirth)', ({ stage, conclude }) => [
    // ── STAGE 0 · Arm GRID/General (always-watched base) ─────────────────────────────
    // The watcher boots on the GRID `Cascades/Cascade.json` — the always-on General base
    // the live SuiteCascade UI depends on (NEVER torn down by MCW). DPASL-D1 · the watcher
    // is the PURE CONSUMER: it does NOT seed any Extra. Registrants REGISTER their cascade
    // onto the `cascades` Record (the Cascade Registry · point of entry) via the
    // cascadeRegistration.model factory — each register fires the [k_.cascades] selector,
    // which the wind-up-debounced STAGE 1 sweep then picks up + arms.
    stage(({ d, dispatch }) => {
      const ops = makeOps(d);
      // §B.1+B.2 · load + arm on the GRID directory (the General base · always watched).
      ops.armWatcherOn(GENERAL_CASCADE_DIRECTORY);
      dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
    }),
    // ── STAGE 1 · MCW SWEEP (selector-bound on [k_.cascades] · the heart of MCW) ─────
    // Re-fires whenever the `cascades` Record changes (a registrant adds/replaces an entry
    // via the registration factory). A WIND-UP DELAY (MCW_WINDUP_MS) lets coinciding
    // registers settle before assigning, so a burst of register dispatches collapses into
    // ONE armWatcherOn sweep rather than re-firing per individual register (mirrors the
    // existing DEBOUNCE_MS/setTimeout discipline). The sweep reads k.cascades, FILTERS OUT
    // General (its watch is STAGE 0), and armWatcherOn(entry.cascadeDirectory) each Extra —
    // additive + idempotent: new Extras get armed, already-armed are no-ops. NO teardown
    // (MCW supersedes the old single-active SDCR tear-down-and-re-arm — we now watch ALL
    // registered cascades simultaneously).
    stage(
      ({ d, k }) => {
        const ops = makeOps(d);
        if (mcwWindupTimer) clearTimeout(mcwWindupTimer);
        mcwWindupTimer = setTimeout(() => {
          console.log('[SuiteCascade Watcher] MCW sweep · arming registered Extras');
          // THE SCRR ANSWER · the sweep's read of the Cascade Registry (k.cascades) is the
          // Suite-Cascade-Registry-Report: WHICH cascades are registered (names) + HOW MANY
          // (cascadeCount) + each entry's live file count — file-sunk so drives can Conclude.
          const registeredCascades = Object.values(k.cascades.select());
          sinkWatcherTelemetry('scrr-answer', {
            names: registeredCascades.map((entry) => entry.name),
            cascadeCount: registeredCascades.length,
            fileCounts: registeredCascades.map((entry) => entry.activeCascadeFiles.length),
          });
          ops.armRegisteredExtras(k);
        }, MCW_WINDUP_MS);
      },
      {
        selectors: [k_.cascades],
        beat: 0,
      },
    ),
    stage(({ stagePlanner }) => {
      stagePlanner.conclude();
    }),
  ]);

  // Cleanup return — HAZARD-A: timers → watchers → plan.conclude(). MCW closes ALL Map
  // watchers (GRID/General + every Extra) before conclude so no in-flight event fires into
  // a torn-down dispatcher and no chokidar handle leaks.
  return () => {
    console.log('[SuiteCascade JSON Watcher] Principle cleanup');
    sinkWatcherTelemetry('principle-cleanup', {});
    if (cascadeDebounceTimer) clearTimeout(cascadeDebounceTimer);
    if (contentDebounceTimer) clearTimeout(contentDebounceTimer);
    if (mcwWindupTimer) clearTimeout(mcwWindupTimer);
    for (const watcher of cascadeWatchers.values()) {
      try {
        watcher.close();
      } catch {
        /* watcher already closed */
      }
    }
    cascadeWatchers.clear();
    // THE CONTENT-FILE WATCH · close every per-dir content watcher (no handle leak).
    for (const watcher of contentWatchers.values()) {
      try {
        watcher.close();
      } catch {
        /* watcher already closed */
      }
    }
    contentWatchers.clear();
    watcherPlan.conclude();
  };
};
