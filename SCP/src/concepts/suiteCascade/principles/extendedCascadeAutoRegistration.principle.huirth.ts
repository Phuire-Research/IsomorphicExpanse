/**
 * extendedCascadeAutoRegistration Principle — Huirth Deployment · DPASL-D1 · Forge Auto-Registrant
 *
 * THE GROUNDED GAP this closes: the suiteCascadeJsonWatcher watches
 * `Cascades/Extended/<name>/Cascade.json` per cascade REGISTERED in `k.cascades`. Registration
 * flows through `createCascadeRegistrationPrinciple({ name })` (cascadeRegistration.model), and the
 * ONLY compile-time registrant is cadmiumCascadeRegistration (Cadmium Researcher). A Suite 8 forged
 * at RUNTIME by the Entourage Forge (e.g. Isomorphic Expanse) has NO concept code → never registers
 * → its `Cascades/Extended/<name>/` is never watched → the page never sees its docs.
 *
 * This principle is the DIRECTORY-DRIVEN registrant that pairs the CONVENTION (the watcher's
 * `Cascades/Extended/<name>` NDEP round-trip) with the FILE SYSTEM (the dirs actually present).
 * It registers EVERY Extended subdirectory — the forged designations that no concept code speaks
 * for — onto the same `cascades` Record via the SAME factory idiom, using the SAME dispatch as the
 * cadmium registrant (Base → Relay via nextA, then a single iterateStage dispatch).
 *
 * BOUNDARY (DPASL-D1): this principle lives IN suiteCascade (the registry owner · the PRIOR base)
 * and dispatches `d.suiteCascade.e.*` — the SAME muxium where the watcher, the OkMonitor, and the
 * cadmium registrant already dispatch the Base+Relay setters (SuiteCascadeHuirthDeck supplies them).
 * The watcher imports NOTHING from any registrant; registration flows INTO the Record, the watcher
 * only reads OUT of it — so an Extended dir registered here is armed by the watcher's [k_.cascades]
 * MCW sweep with ZERO coupling.
 *
 * IDEMPOTENCE: Cadmium Researcher self-registers (cadmiumCascadeRegistrationPrinciple). This
 * principle reads `k.cascades.select()` at register time and NEVER re-registers a Name already
 * present in the Record (or already registered by an earlier sweep of this same principle). Double-
 * registration is a no-op regardless (the watcher's armWatcherOn is idempotent), but the guard keeps
 * the dispatch stream clean.
 *
 * TWO PHASES:
 *   BOOT  — read the subdirectories of `Cascades/Extended/` (fs · tolerant of absence) → for each
 *           dir name NOT already in the Record, dispatch its registration.
 *   LIVE  — chokidar-watch `Cascades/Extended/` at depth 0 for `addDir` — a NEWLY FORGED
 *           designation (the Forge built the dir mid-session and nothing corresponded) registers
 *           IMMEDIATELY. Debounced lightly; skip paths emit `*.skip{reason}` telemetry; NEVER throws
 *           (absence anor malformed = skip + telemetry).
 *
 * PATH RESOLUTION — mirrors suiteCascadeJsonWatcher EXACTLY: `SCS_ROOT = path.resolve(process.cwd())`
 * (dev:self override discipline lives on the watcher; this principle resolves against the same base
 * so the dirs it enumerates are the same dirs the watcher arms). The registered `cascadeDirectory`
 * is the model's `deriveExtendedCascadeDirectory(name)` — the repo-relative POSIX path that round-
 * trips through the watcher's deriveCascadeName back to `<name>` (§NDEP).
 *
 * Citation: cadmiumCascadeRegistration.principle.huirth.ts (the sibling registrant · the dispatch
 *           idiom this mirrors: createCascadeRegistrationPrinciple actualization + Base→Relay setters).
 * Citation: suiteCascade/model/cascadeRegistration.model.ts (CRPF factory · deriveExtendedCascadeDirectory
 *           · the all-KeyedSelector stub Cascade · SBIS Base→Relay via nextA · single iterateStage dispatch).
 * Citation: suiteCascadeJsonWatcher.principle.huirth.ts (:88 SCS_ROOT=path.resolve(process.cwd()) ·
 *           :353 chokidar options · :396 armRegisteredExtras reads k.cascades.select() · MCW sweep arms Extras).
 * Citation: fileSystem/qualities/getDirectories.quality.ts (fs directory enumeration idiom).
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns" (single dispatch per stage ·
 *           nextA for queued actions · Principle Context · k.property.select()).
 */
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  EXTENDED_CASCADE_DIR,
  type Cascade,
  type SuiteCascadeHuirthPrinciple,
} from '../suiteCascade.type';
import { deriveExtendedCascadeDirectory } from '../model/cascadeRegistration.model';

// ============================================
// PATH RESOLUTION — THE TWO-ROOTS SWEEP (IE-D4e · founded-but-invisible fix)
// ============================================
//
// C465 made Extended/ SCP-LOCAL (base = cwd = the SCP package dir), but a Suite 8 founded at RUNTIME
// by a newborn Anchor agent runs with cwd = the WORKSPACE root — so the founding pair it writes lands
// at {workspace}/Cascades/Extended/<name>/, NOT the SCP-local Extended/. The SCP-local-only sweep
// therefore never registered it → the watcher never armed its Cascade.json → the page never saw its
// docs (the FOUNDED-but-INVISIBLE gap).
//
// The fix mirrors the H3 resolveDesignationExtendedRoot two-roots walk-up (suite8MenuRelay.config.ts
// :141) EXACTLY: candidate roots = cwd (SCP-local · WINS the TIE on collision) then walk UP <=6
// parents (the workspace). This principle sweeps BOTH roots' Cascades/Extended/ and arms an addDir
// watch on each.
//
// C716 · 2A CONTENT-AWARE PRECEDENCE: SCP-local no longer wins UNCONDITIONALLY. On a name collision
// the FOUNDED root wins — the one whose Cascade.json carries a manifest (activeDiamond anor
// activeOnyx present + non-empty). SCP-local precedence survives as the TIE rule (both-have anor
// both-lack → SCP-local). See readAllExtendedSubdirs + extendedCascadeHasManifest.
//
// PER-ROOT cascadeDirectory: the SCP-local root registers the repo-relative
// deriveExtendedCascadeDirectory(name) (UNCHANGED behavior · resolves against the watcher's SCS_ROOT).
// A WORKSPACE-root dir registers the ABSOLUTE path — path.resolve(SCS_ROOT, <abs>) IGNORES SCS_ROOT
// and returns the abs path, so the watcher arms the RIGHT Cascade.json; deriveCascadeName takes the
// LAST segment, so the abs path still round-trips to <name> as the registry key.
const SCS_ROOT = path.resolve(process.cwd());
const EXTENDED_ROOT_ABS = path.resolve(SCS_ROOT, EXTENDED_CASCADE_DIR);

// The H3 walk-up limit (byte-match suite8MenuRelay.config.ts SUITE8_EXTENDED_ROOT_WALK_UP_LIMIT).
const EXTENDED_ROOT_WALK_UP_LIMIT = 6;

// The candidate Extended-root ABSOLUTE dirs, SCP-local FIRST (precedence) then the walk-up ancestors.
// Each element is `<root>/Cascades/Extended`. A root's Extended dir need not exist — the sweep is
// ENOENT-tolerant per dir (readExtendedSubdirectoryNames), and the addDir watch on an absent dir is
// simply skipped by chokidar until it appears.
const resolveExtendedRootCandidates = (): string[] => {
  const roots: string[] = [SCS_ROOT];
  let dir = SCS_ROOT;
  for (let i = 0; i < EXTENDED_ROOT_WALK_UP_LIMIT; i += 1) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
    roots.push(dir);
  }
  return roots.map((root) => path.resolve(root, EXTENDED_CASCADE_DIR));
};

const EXTENDED_ROOT_ABS_CANDIDATES = resolveExtendedRootCandidates();

// Light debounce (ms) so a burst of Forge writes into Extended/ (e.g. mkdir then seed) settles into
// one sweep rather than re-firing per intermediate event. Matches the watcher's DEBOUNCE bearing.
const AUTO_REGISTRATION_DEBOUNCE_MS = 250;

// ============================================
// RESILIENT ENUMERATION — ENOENT-safe (module scope · no deck need)
// ============================================
//
// A discovered designation dir: its Name + the ABSOLUTE path of the dir (wherever it actually lives).
// The absolute dir path becomes the registered cascadeDirectory (SCP-local dirs are re-expressed as
// the repo-relative form at register time so their behavior is byte-identical to the prior code).
type DiscoveredExtendedDir = { name: string; absDir: string };

// Read the immediate subdirectory names of ONE `<root>/Cascades/Extended/`. Absence (the dir was
// never created on this root) is NOT an error: return [] + skip telemetry. NEVER throws.
const readExtendedSubdirsAt = async (extendedRootAbs: string): Promise<DiscoveredExtendedDir[]> => {
  try {
    const dirents = await readdir(extendedRootAbs, { withFileTypes: true });
    return dirents
      .filter((d) => d.isDirectory())
      .map((d) => ({ name: d.name, absDir: path.resolve(extendedRootAbs, d.name) }));
  } catch (err) {
    const isEnoent = (err as NodeJS.ErrnoException)?.code === 'ENOENT';
    console.log(
      '[Extended Auto-Registration] extended.enumerate.skip · reason=',
      isEnoent ? 'absent' : 'unreadable',
      '· path=',
      extendedRootAbs,
    );
    return [];
  }
};

// C716 · 2A CONTENT-AWARE PRECEDENCE — the manifest-check Concluder. A collision winner is the
// root whose Cascades/Extended/<name>/Cascade.json CARRIES a manifest (activeDiamond anor activeOnyx
// present + non-empty-string). ONE readFileSync-equivalent (readFile) per candidate ONLY on a
// collision — the AFPR gate: absent / unreadable / non-JSON / no keys → false (no manifest). NEVER
// throws. A founded root (its operation-born pair stamped into the manifest) is the real ground; an
// unfounded stub (cycles:[] · no active keys) is the loser even when it is the SCP-local copy.
const extendedCascadeHasManifest = async (absDir: string): Promise<boolean> => {
  const cascadeJsonPath = path.resolve(absDir, 'Cascade.json');
  let raw: string;
  try {
    raw = await readFile(cascadeJsonPath, 'utf8');
  } catch {
    return false; // absent / unreadable → no manifest (AFPR)
  }
  if (!raw.trim()) {
    return false;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false; // malformed → no manifest (AFPR)
  }
  if (!parsed || typeof parsed !== 'object') {
    return false;
  }
  const obj = parsed as Record<string, unknown>;
  const hasKey = (key: string): boolean =>
    typeof obj[key] === 'string' && (obj[key] as string).trim().length > 0;
  return hasKey('activeDiamond') || hasKey('activeOnyx');
};

// Sweep EVERY candidate root (SCP-local FIRST) and de-dupe by Name. C716 · 2A CONTENT-AWARE
// PRECEDENCE: on a NAME COLLISION across roots, the winner = the root whose Cascade.json HAS a
// manifest (founded). SCP-LOCAL PRECEDENCE (4A) is preserved as the TIE rule — both-have anor
// both-lack → the SCP-local (first-seen) copy wins. The manifest-check readFile fires ONLY on a
// collision (one per contender), never on the common no-collision path. NEVER throws; every drop
// emits skip{reason} telemetry naming the loser + why.
const readAllExtendedSubdirs = async (): Promise<DiscoveredExtendedDir[]> => {
  // firstSeen keeps the SCP-local (or earliest) copy per Name so the array position (registration
  // order) is stable; a collision may REPLACE the held entry when the challenger is founded and the
  // held one is not (content-aware upgrade), else the held copy stands (4A tie).
  const firstSeen = new Map<string, DiscoveredExtendedDir>();
  const order: string[] = [];
  for (const extendedRootAbs of EXTENDED_ROOT_ABS_CANDIDATES) {
    const found = await readExtendedSubdirsAt(extendedRootAbs);
    for (const entry of found) {
      const held = firstSeen.get(entry.name);
      if (!held) {
        firstSeen.set(entry.name, entry);
        order.push(entry.name);
        continue;
      }
      // COLLISION · 2A · compare manifests (ONE readFile per contender · collision-only).
      const heldHasManifest = await extendedCascadeHasManifest(held.absDir);
      const challengerHasManifest = await extendedCascadeHasManifest(entry.absDir);
      if (challengerHasManifest && !heldHasManifest) {
        // Content-aware UPGRADE — the founded challenger displaces the unfounded (SCP-local) stub.
        console.log(
          '[Extended Auto-Registration] sweep.skip · reason=content-aware-precedence · name=',
          entry.name,
          '· droppedRoot=',
          held.absDir,
          '· droppedReason=no-manifest · winningRoot=',
          entry.absDir,
        );
        firstSeen.set(entry.name, entry);
      } else {
        // 4A TIE — both founded anor both unfounded → the held (SCP-local / earliest) copy stands.
        console.log(
          '[Extended Auto-Registration] sweep.skip · reason=scp-local-precedence · name=',
          entry.name,
          '· droppedRoot=',
          entry.absDir,
          '· droppedReason=',
          challengerHasManifest ? 'both-have-manifest' : 'both-lack-manifest',
        );
      }
    }
  }
  return order.map((name) => firstSeen.get(name) as DiscoveredExtendedDir);
};

// ============================================
// THE PRINCIPLE
// ============================================

export const extendedCascadeAutoRegistrationPrinciple: SuiteCascadeHuirthPrinciple = ({ plan, nextA }) => {
  console.log(
    '[Extended Auto-Registration] Principle started · extendedRoots=',
    EXTENDED_ROOT_ABS_CANDIDATES.join(' · '),
  );

  // ── Principle-scope mutable state (shared across the stage + cleanup) ──────────────
  // One chokidar handle PER candidate root (SCP-local + the workspace walk-up) — the founded-but-
  // invisible fix arms addDir on both so a dir forged at EITHER root registers immediately.
  const extendedDirWatchers: FSWatcher[] = [];
  let addDirDebounceTimer: NodeJS.Timeout | null = null;

  const registrationPlan = plan(
    'SuiteCascade Extended Auto-Registration (Huirth)',
    ({ stage, conclude }) => [
      // ── STAGE · enumerate + register + arm live addDir watch, then conclude ──────────
      // `d`/`k`/`nextA` are in scope here (Principle Context) — d.suiteCascade.e.* is live
      // (SuiteCascadeHuirthDeck), k.cascades.select() reads the registry for idempotence.
      stage(({ d, k, dispatch }) => {
        // register ONE discovered Extended dir (idempotent · skips Names already in the Record).
        // Reads k.cascades FRESH each call so an addDir-triggered register sees prior registers.
        //
        // cascadeDirectory PER ROOT: a dir living under the SCP-local Extended root registers the
        // repo-relative deriveExtendedCascadeDirectory(name) (byte-identical to the prior behavior);
        // a dir living under a WORKSPACE walk-up root registers the ABSOLUTE path (path.resolve in the
        // watcher ignores its SCS_ROOT for an abs arg, so the watcher arms the RIGHT Cascade.json, and
        // deriveCascadeName's last-segment rule still yields <name> as the key).
        const registerExtendedCascade = (discovered: DiscoveredExtendedDir): void => {
          const trimmed = discovered.name.trim();
          if (trimmed.length === 0) {
            console.log('[Extended Auto-Registration] register.skip · reason=empty-name');
            return;
          }
          // IDEMPOTENCE — never double-register (Cadmium self-registers; earlier sweeps register).
          const cascades = k.cascades.select() as Record<string, Cascade>;
          if (cascades[trimmed]) {
            console.log(
              '[Extended Auto-Registration] register.skip · reason=already-registered · name=',
              trimmed,
            );
            return;
          }
          // SCP-LOCAL dir → repo-relative form (unchanged); WORKSPACE dir → the absolute dir path.
          const scpLocalDir = path.resolve(EXTENDED_ROOT_ABS, trimmed);
          const isScpLocal = discovered.absDir === scpLocalDir;
          const cascadeDirectory = isScpLocal
            ? deriveExtendedCascadeDirectory(trimmed)
            : discovered.absDir;
          // Mirror the model's stub Cascade + the cadmium registrant dispatch idiom EXACTLY:
          // the all-KeyedSelector stub (every field set · no optionals) → Base (local reducer runs
          // so cascades[name] is real server-side) → Relay (broadcast via actionExchange.serverToClient),
          // both via nextA. The watcher's [k_.cascades] MCW sweep then arms + scaffolds + watches
          // `<cascadeDirectory>/Cascade.json`.
          const stubCascade: Cascade = {
            name: trimmed,
            cascadeDirectory,
            cascadeJson: null,
            activeCascadeFiles: [],
            missingCascadeJson: true,
          };
          nextA(
            d.suiteCascade.e.suiteCascadeSetCascadeHuirthBase({ name: trimmed, cascade: stubCascade }),
          );
          nextA(
            d.suiteCascade.e.suiteCascadeSetCascadeRelay({ name: trimmed, cascade: stubCascade }),
          );
          console.log(
            '[Extended Auto-Registration] registered · name=',
            trimmed,
            '· root=',
            isScpLocal ? 'scp-local' : 'workspace',
            '· cascadeDirectory=',
            cascadeDirectory,
          );
        };

        // register EVERY currently-present Extended subdirectory ACROSS BOTH ROOTS (BOOT sweep +
        // reusable by LIVE · SCP-local precedence de-dupe applied inside readAllExtendedSubdirs).
        const registerAllExtended = async (): Promise<void> => {
          const discovered = await readAllExtendedSubdirs();
          if (discovered.length === 0) {
            console.log('[Extended Auto-Registration] sweep.skip · reason=no-extended-dirs');
            return;
          }
          for (const entry of discovered) {
            registerExtendedCascade(entry);
          }
        };

        // BOOT — enumerate + register what already exists (fire-and-forget async · the stage is sync).
        void registerAllExtended();

        // LIVE — chokidar-watch EACH candidate `Cascades/Extended/` (SCP-local + the workspace walk-up)
        // at depth 0 for `addDir`. A newly forged OR newly founded designation (the Forge built the dir
        // mid-session · a newborn Anchor wrote its pair into the workspace root) registers immediately.
        // Each addDir on ANY root re-sweeps BOTH roots (de-dupe keeps it idempotent). Debounced lightly;
        // NEVER throws (per-root arm failure = skip + telemetry; the other roots still arm).
        const handleAddDir = (): void => {
          if (addDirDebounceTimer) clearTimeout(addDirDebounceTimer);
          addDirDebounceTimer = setTimeout(() => {
            console.log('[Extended Auto-Registration] addDir · re-sweeping Extended (both roots) for new designations');
            void registerAllExtended();
          }, AUTO_REGISTRATION_DEBOUNCE_MS);
        };
        for (const extendedRootAbs of EXTENDED_ROOT_ABS_CANDIDATES) {
          try {
            const watcher = chokidarWatch(extendedRootAbs, {
              persistent: true,
              // ignoreInitial:true — BOOT already swept the existing dirs; the live watch only reacts
              // to NEW dirs forged after boot (no double-register of the initial set).
              ignoreInitial: true,
              // depth 0 — only the immediate `Cascades/Extended/<name>` designations, not their contents.
              depth: 0,
            });
            watcher.on('addDir', handleAddDir);
            watcher.on('error', (err) => {
              console.log('[Extended Auto-Registration] watch.skip · reason=chokidar-error · root=', extendedRootAbs, '·', err);
            });
            extendedDirWatchers.push(watcher);
            console.log('[Extended Auto-Registration] chokidar armed on', extendedRootAbs, '· depth=0 · addDir');
          } catch (err) {
            console.log('[Extended Auto-Registration] watch.skip · reason=arm-failed · root=', extendedRootAbs, '·', err);
          }
        }

        // Single dispatch per stage — advance into conclude (the register(s) fire via nextA; the live
        // addDir watch persists until cleanup).
        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      }),
      // ── concluding stage (one-shot boot · the live addDir watch keeps firing register on new dirs) ──
      conclude(),
    ],
  );

  // Cleanup return — HAZARD-A order: timer → watchers → plan.conclude(). Never leaks the debounce
  // timer or ANY of the per-root chokidar handles.
  return () => {
    console.log('[Extended Auto-Registration] Principle cleanup');
    if (addDirDebounceTimer) {
      clearTimeout(addDirDebounceTimer);
      addDirDebounceTimer = null;
    }
    while (extendedDirWatchers.length > 0) {
      const watcher = extendedDirWatchers.pop();
      try {
        watcher?.close();
      } catch {
        /* watcher already closed */
      }
    }
    registrationPlan.conclude();
  };
};
