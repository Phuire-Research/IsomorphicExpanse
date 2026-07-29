/**
 * STCP — Suite-Cascade-Transferable Component-Display Pattern · Reusable Relay Helper
 *
 * PURE factory closures · zero Stratimux dispatch of its OWN. The helper owns the
 * MECHANISM (directory-watch + basename-filter + SBIS Base→Relay + JDIS unlink→Idle +
 * SMRP broadcast + BOCR backfill); a component's principle owns the OWNERSHIP (declares
 * its deck, supplies `nextA`/`dispatch`/`d` from its stage context, holds the FSWatcher
 * handle for teardown). The helper is component-AGNOSTIC — it imports NO concept and never
 * inspects payload contents beyond null/non-null (the transferability invariant).
 *
 * Why src/model/ (not a single concept folder): the SMFT precedent (sordEnvelope.model.ts,
 * messageEnvelope.model.ts, scpSpawn.model.ts) places PURE, dispatch-free, cross-concept
 * helpers here. A helper wired by ANY component belongs in src/model/, not inside one
 * concept's folder. No `.huirth.ts` suffix — it imports chokidar + node:fs (server-only)
 * but exports factory closures, NOT a principle. COMPONENT-AGNOSTIC: this file references no
 * concept and no concept-specific payload type — every binding arrives via the generic config.
 *
 * The helper returns CLOSURE BODIES (SD-2), not fully-formed principles: a Stratimux
 * PrincipleFunction is bound to a SPECIFIC deck/quality/state generic, so a generic
 * principle cannot satisfy every component's deck shape. The action-creators are passed as
 * plain `(payload) => Action` functions, so the helper's `<TPayload>` flows through the
 * payload only — never the deck type. TypeScript infers TPayload at the call site.
 *
 * `armDirectoryWatch(nextA)` (SD-3 / S4 REFINE-1): the helper OWNS the add/change→SBIS and
 * unlink→Idle wiring internally; the caller only supplies `nextA` from its stage context.
 *
 * Citation: STCP-S3-OCHRE-BLUEPRINT.md §1 (helper API + mechanics).
 * Citation: STCP-S4-VIRIDIAN-VERIFY.md REFINE-1 / SD-3 (armDirectoryWatch(nextA) canonical).
 * Citation: the first instance's OkMonitor folder-watcher — directory-watch + basename-filter
 *           inode-swap-immune precedent (the proven dir-watch the helper generalizes).
 * Citation: scsBridgeJsonWatcher.principle.huirth.ts:295 — nextA Base→Relay async-callback idiom.
 */
import type { AnyAction } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import path from 'node:path';
import { promises as fsp } from 'node:fs';

// ---- Broadcast primitive injected by the caller (the concept's webSocketServer.e.* call) ----
// The helper NEVER imports webSocketServer; the caller hands it the append fn so the helper
// stays concept-agnostic. Matches webSocketServerAppendToActionQue's payload shape.
export type StcpBroadcastFn = (payload: {
  actionQue: AnyAction[];
  targetConnectionId?: string;
}) => void;

// ---- Per-component configuration (the 3 parametric Suite-8 slots + path/basename + creators) ----
export interface StcpComponentRelayConfig<TPayload> {
  // W5 (NEW · FATW) — aggregation mode discriminant. Defaults to 'single-file' when omitted so
  // every existing instance keeps its exact behavior (watch dir(jsonPath), basename-filter, SBIS).
  //   'single-file'  → existing: watch dirname(jsonPath) at depth:0, filter on basename.
  //   'folder-tree'  → NEW: watch watchDir RECURSIVELY; on any child .json write, re-read every
  //                    childJsonGlob file, parse each (tolerant), merge via mergePayloads, dispatch.
  aggregationMode?: 'single-file' | 'folder-tree';
  // Absolute resolved path to the watched JSON file (caller resolves against its SCS root).
  jsonPath: string;
  // The basename to filter directory events on (e.g. 'menu.json'). Survives inode swap.
  basename: string;
  // W5 (NEW · folder-tree only) — absolute path to the recursively watched root dir (e.g. frontier/).
  watchDir?: string;
  // W5 (NEW · folder-tree only) — basename-list of child JSONs to EXCLUDE from the tree merge
  //   (e.g. the materialised aggregate file itself + any non-article basenames). Defaults to [].
  excludeBasenames?: readonly string[];
  // W5 (NEW · folder-tree only) — merge the array of per-file parsed payloads into ONE TPayload
  //   (e.g. flatten CadmiumArticle[] arrays, dedup by articleId, sort createdAt desc).
  mergePayloads?: (items: TPayload[]) => TPayload;
  // W5 (NEW · folder-tree only) — after merging, write this aggregate file (atomic rename) so the
  //   BSE LIST endpoint + the C1 first-load read one consistent file (AMFJ · Option A). Absolute path.
  aggregateWritePath?: string;
  // SUITE-8 SLOT 1 — schema-validate raw file text → typed payload, or null (ignore).
  //   For 'folder-tree' this parses a SINGLE child file's raw text → TPayload | null.
  parsePayload: (raw: string) => TPayload | null;
  // SUITE-8 SLOT 2 — the Idle sentinel (e.g. EMPTY_MENU_STAGE · stageIndex -1).
  emptyPayload: TPayload;
  // SUITE-8 SLOT 3a — Base action creator (Huirth-only · runs local reducer · NOT in actionExchange).
  // Typed AnyAction (the payload-agnostic action shape every Action<T> widens to) so a
  // payload-carrying action-creator slots in without a per-payload cast (mirrors the OkMonitor's
  // `as AnyAction` action-creator convention). The helper never inspects the action's payload.
  baseActionCreator: (payload: TPayload) => AnyAction;
  // SUITE-8 SLOT 3b — Relay action creator (carries the registered TQNI type · in actionExchange).
  relayActionCreator: (payload: TPayload) => AnyAction;
  // Optional: a per-payload identity used to suppress duplicate broadcasts (e.g. stageIndex).
  // Returns a value compared by === to the last broadcast identity. Omit → broadcast every parse.
  payloadIdentity?: (payload: TPayload) => string | number;
  // Optional debounce + awaitWriteFinish tuning (defaults below).
  stabilityThresholdMs?: number; // default 150
  logTag?: string; // default '[STCP]'
  // C761 · OPTIONAL FILE-SUNK TELEMETRY (the S6 observability gap): console.logs pipe into
  // nodemon and are LOST to drives; a config may supply a never-throw sink and the helper
  // emits watch-event / read-dispatch seats so a silent live-edit names its own leg.
  telemetrySink?: (seat: string, detail: Record<string, unknown>) => void;
  // W2a (the Turn-Over Disconnect Guard) — SUPPRESS the unlink→Idle null relay for this instance.
  // Default undefined → every existing instance keeps its exact JDIS behavior (byte-identical). The
  // GITM instance sets this true: gitm.json is the bridge↔SCP contact seam whose emptyPayload is null
  // (relayed straight through to client state · H8), so a transient file absence during the dark hour
  // would blank the client's last-known decision fields. Hold instead — the file returns on the next
  // bridge write, and the atomic tmp+rename writer never truly unlinks it (only a genuine rm would).
  suppressUnlinkIdle?: boolean;
}

// ---- The closure bundle a component's principle composes. All arms returned together. ----
export interface StcpComponentRelayClosures<TPayload> {
  // W1 · DIRECTORY-WATCH + BASENAME-FILTER arm. Watches dirname(jsonPath) at depth:0;
  // filters events to basename; on add/change → SBIS dispatch (Base→Relay); on unlink → JDIS
  // Idle dispatch. Owns the wiring internally — the caller supplies only `nextA` from its
  // stage context. Returns the armed FSWatcher (caller stores for teardown) or null on failure.
  armDirectoryWatch: (nextA: (action: AnyAction) => void) => FSWatcher | null;

  // W2 · SBIS two-dispatch (Base FIRST, then Relay). Reads the file, parses, applies
  // identity-suppression, then dispatches base+relay via nextA. Exposed separately so the arm
  // and any future SMRP/BOCR caller can reuse the same parse+identity path. Returns the parsed
  // payload (or null if suppressed/invalid) for the caller's logging.
  readAndDispatchSbis: (nextA: (action: AnyAction) => void) => Promise<TPayload | null>;

  // W3 · JDIS unlink → Idle. Dispatches emptyPayload via SBIS (Base + Relay) AND resets the
  // identity guard so a recreated file at the same identity re-broadcasts.
  dispatchIdle: (nextA: (action: AnyAction) => void) => void;

  // W4a · SMRP broadcast — given the caller's selector-read CURRENT payload from Huirth state,
  // builds the relay action and broadcasts to ALL clients (no targetConnectionId). throttle:0
  // stays the caller's concern (it owns the dispatch); this closure only builds+invokes broadcast.
  broadcastToAll: (broadcast: StcpBroadcastFn, current: TPayload) => void;

  // W4b · BOCR targeted backfill — given the current payload (from Huirth state) and the list of
  // newly-joined connectionIds, dispatches a relay action to EACH via targetConnectionId.
  backfillToClients: (
    broadcast: StcpBroadcastFn,
    current: TPayload,
    connectionIds: string[],
  ) => void;

  // Disk-direct read for BOCR fallback (FSGT) when Huirth state is not yet authoritative.
  // Parses via parsePayload; returns emptyPayload on ENOENT/parse-fail (JDIS-consistent Idle).
  readCurrentFromDisk: () => Promise<TPayload>;

  // W5 (NEW · FATW · folder-tree only) — RECURSIVE watch of config.watchDir. On any child .json
  // add/change/unlink → re-read every child JSON, parse each (tolerant), merge via mergePayloads,
  // write the aggregate (AMFJ), and dispatch Base+Relay via nextA. Returns the FSWatcher (caller
  // stores for teardown · H3 no-leak) or null. Only present when aggregationMode === 'folder-tree'.
  armFolderTreeWatch?: (nextA: (action: AnyAction) => void) => FSWatcher | null;

  // W6 (NEW · FATW · folder-tree only) — read-and-dispatch from the folder tree: reads all child
  // JSONs under watchDir, parses each (tolerant), merges via mergePayloads, writes the aggregate,
  // dispatches Base+Relay. The C1 first-load path (mirrors readAndDispatchSbis for tree mode).
  readAndDispatchFolderTree?: (nextA: (action: AnyAction) => void) => Promise<TPayload | null>;
}

// ---- The single factory the component calls. ----
export function createStcpComponentRelay<TPayload>(
  config: StcpComponentRelayConfig<TPayload>,
): StcpComponentRelayClosures<TPayload> {
  const tag = config.logTag ?? '[STCP]';
  const stabilityThreshold = config.stabilityThresholdMs ?? 150;

  // Closure-scoped identity guard — shared by readAndDispatchSbis suppression + dispatchIdle reset.
  let lastIdentity: string | number | null = null;

  const readAndDispatchSbis = async (
    nextA: (action: AnyAction) => void,
  ): Promise<TPayload | null> => {
    let raw: string;
    try {
      raw = await fsp.readFile(config.jsonPath, 'utf-8');
    } catch {
      config.telemetrySink?.('read-dispatch', { outcome: 'read-fail-enoent' });
      return null; // ENOENT — no file authored yet · stay armed for the first write.
    }
    const payload = config.parsePayload(raw);
    if (!payload) {
      config.telemetrySink?.('read-dispatch', { outcome: 'parse-null' });
      return null; // schema-invalid / partial write · ignore.
    }

    // Identity-suppression (e.g. same stageIndex written twice) — only when configured.
    if (config.payloadIdentity) {
      const identity = config.payloadIdentity(payload);
      if (identity === lastIdentity) {
        config.telemetrySink?.('read-dispatch', { outcome: 'suppressed', identity: String(identity) });
        return null; // same identity — already broadcast · suppress.
      }
      lastIdentity = identity;
    }

    // SBIS · Base FIRST (writes Huirth state so SMRP observes it), THEN Relay (broadcasts).
    nextA(config.baseActionCreator(payload));
    nextA(config.relayActionCreator(payload));
    config.telemetrySink?.('read-dispatch', {
      outcome: 'dispatched',
      identity: config.payloadIdentity ? String(config.payloadIdentity(payload)) : null,
    });
    return payload;
  };

  const dispatchIdle = (nextA: (action: AnyAction) => void): void => {
    // Clean slate FIRST so a recreated file at any identity (including 0) re-broadcasts.
    lastIdentity = null;
    // SBIS · Base FIRST (Huirth state → Idle so BOCR replays Idle), THEN Relay (broadcast Idle).
    nextA(config.baseActionCreator(config.emptyPayload));
    nextA(config.relayActionCreator(config.emptyPayload));
  };

  const armDirectoryWatch = (
    nextA: (action: AnyAction) => void,
  ): FSWatcher | null => {
    const dir = path.dirname(config.jsonPath);
    try {
      const watcher = chokidarWatch(dir, {
        persistent: true,
        // SD-5 · ignoreInitial:true — the watcher fires only on LIVE add/change after arm.
        // The already-present-on-connect case is owned by MOCH (HTTP GET) + BOCR (Huirth-state
        // backfill); the arm-time read must NOT pre-poison the identity guard (CDV-Break-A fix).
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold, pollInterval: 50 },
        depth: 0,
      });
      const onAddOrChange = (changedPath: string): void => {
        const resolved = path.resolve(changedPath);
        const matched = path.basename(resolved) === config.basename;
        config.telemetrySink?.('watch-event', { path: resolved, matched });
        if (!matched) return; // basename filter (inode-swap-safe).
        void readAndDispatchSbis(nextA);
      };
      const onUnlink = (changedPath: string): void => {
        const resolved = path.resolve(changedPath);
        if (path.basename(resolved) !== config.basename) return; // basename filter.
        // W2a (the Turn-Over Disconnect Guard) — HOLD instead of Idle when suppressUnlinkIdle. The
        // GITM rail's emptyPayload is null, relayed straight into client state; a transient absence
        // (crash/turn-over/atomic-swap window) must NOT blank the last-known decision fields. The
        // file returns on the next bridge write; the client keeps the held snapshot until then.
        if (config.suppressUnlinkIdle) {
          console.log(`${tag} ${config.basename} unlinked · JDIS SUPPRESSED (held · W2a)`);
          return;
        }
        // JDIS · unlink → Idle (Base + Relay EMPTY) + reset the identity guard.
        dispatchIdle(nextA);
        console.log(`${tag} ${config.basename} unlinked · JDIS Idle dispatched`);
      };
      watcher.on('add', onAddOrChange);
      watcher.on('change', onAddOrChange);
      watcher.on('unlink', onUnlink);
      watcher.on('error', (err) => {
        console.warn(`${tag} directory chokidar error · err=`, err);
      });
      console.log(`${tag} directory watcher armed on`, dir, '· basename=', config.basename);
      return watcher;
    } catch (err) {
      console.warn(`${tag} directory-watch arm failed · dir=`, dir, '· err=', err);
      return null;
    }
  };

  const broadcastToAll = (broadcast: StcpBroadcastFn, current: TPayload): void => {
    broadcast({ actionQue: [config.relayActionCreator(current)] });
  };

  const backfillToClients = (
    broadcast: StcpBroadcastFn,
    current: TPayload,
    connectionIds: string[],
  ): void => {
    for (const id of connectionIds) {
      broadcast({
        actionQue: [config.relayActionCreator(current)],
        targetConnectionId: id,
      });
    }
  };

  const readCurrentFromDisk = async (): Promise<TPayload> => {
    try {
      const raw = await fsp.readFile(config.jsonPath, 'utf-8');
      return config.parsePayload(raw) ?? config.emptyPayload;
    } catch {
      return config.emptyPayload; // ENOENT / parse-fail → JDIS-consistent Idle.
    }
  };

  // ---- W5/W6 · FATW · FOLDER-TREE aggregating watch (only wired when aggregationMode === 'folder-tree') ----
  const isFolderTree = config.aggregationMode === 'folder-tree';
  const excludeBasenames = config.excludeBasenames ?? [];

  // W6 · read every child JSON under watchDir, parse each (tolerant), merge, write the aggregate
  // (AMFJ), then dispatch Base+Relay via nextA. Returns the merged payload (or null on empty/all-bad).
  const readAndDispatchFolderTree = async (
    nextA: (action: AnyAction) => void,
  ): Promise<TPayload | null> => {
    const watchDir = config.watchDir;
    if (!watchDir || !config.mergePayloads) return null; // mis-configured · folder-tree slots absent.

    let jsonPaths: string[];
    try {
      // Node 20+ supports { recursive: true } on readdir (Node 23 here · H4 not a concern).
      const entries = await fsp.readdir(watchDir, { withFileTypes: true, recursive: true });
      jsonPaths = entries
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map((e) => path.resolve((e as { parentPath?: string; path?: string }).parentPath
          ?? (e as { parentPath?: string; path?: string }).path
          ?? watchDir, e.name))
        .filter((p) => !excludeBasenames.includes(path.basename(p)));
    } catch {
      return null; // watchDir does not exist yet (no frontier writes) — stay armed.
    }

    if (jsonPaths.length === 0) {
      // Empty tree — dispatch Idle so the bulletin clears (also clears the aggregate via reset).
      dispatchIdle(nextA);
      return null;
    }

    // Parse each child file. Null on bad-input (partial write / malformed) — filtered out.
    // Annotate the per-file result as TPayload | null so Promise.all yields (TPayload | null)[]
    // (TPayload is unconstrained · Awaited<TPayload> may not equal TPayload — pin it explicitly).
    const results = await Promise.all(
      jsonPaths.map(async (p): Promise<TPayload | null> => {
        try {
          const raw = await fsp.readFile(p, 'utf-8');
          return config.parsePayload(raw);
        } catch {
          return null; // ENOENT / partial write — tolerate.
        }
      }),
    );
    const parsed: TPayload[] = [];
    for (const r of results) {
      if (r !== null) parsed.push(r);
    }

    if (parsed.length === 0) return null; // all files malformed — ignore.

    const merged = config.mergePayloads(parsed);

    // AMFJ · materialise the aggregate (atomic rename) so the BSE LIST + C1 first-load read one
    // consistent file (Option A · no change to registerBulletinEndpoints).
    if (config.aggregateWritePath) {
      const aggregatePath = config.aggregateWritePath;
      const tmp = `${aggregatePath}.tmp-${process.pid}`;
      try {
        await fsp.writeFile(tmp, JSON.stringify(merged, null, 2), 'utf-8');
        await fsp.rename(tmp, aggregatePath);
      } catch (err) {
        console.warn(`${tag} aggregate write failed · path=`, aggregatePath, '· err=', err);
      }
    }

    // SBIS · Base FIRST (Huirth state), THEN Relay (broadcast). Identity-suppression not meaningful
    // for merged arrays — omit (same as the single-file array configs).
    nextA(config.baseActionCreator(merged));
    nextA(config.relayActionCreator(merged));
    return merged;
  };

  // W5 · recursive watch of watchDir; on any child .json add/change/unlink → re-merge + dispatch.
  const armFolderTreeWatch = (
    nextA: (action: AnyAction) => void,
  ): FSWatcher | null => {
    const watchDir = config.watchDir;
    if (!watchDir) return null;
    try {
      const watcher = chokidarWatch(watchDir, {
        persistent: true,
        ignoreInitial: true, // first-load owned by readAndDispatchFolderTree (C1 correction).
        awaitWriteFinish: { stabilityThreshold, pollInterval: 50 },
        depth: undefined, // recursive — traverse frontier/<slug>/ subdirs.
      });
      const onAddOrChange = (changedPath: string): void => {
        const resolved = path.resolve(changedPath);
        if (!/\.json$/i.test(resolved)) return; // only react to .json (not .md / temp).
        if (excludeBasenames.includes(path.basename(resolved))) return; // skip aggregate + non-article.
        void readAndDispatchFolderTree(nextA);
      };
      watcher.on('add', onAddOrChange);
      watcher.on('change', onAddOrChange);
      watcher.on('unlink', (changedPath: string) => {
        const resolved = path.resolve(changedPath);
        if (!/\.json$/i.test(resolved)) return;
        if (excludeBasenames.includes(path.basename(resolved))) return;
        // Any child unlink → re-merge remaining (the removed file simply drops from the merge).
        void readAndDispatchFolderTree(nextA);
      });
      watcher.on('error', (err) => {
        console.warn(`${tag} folder-tree chokidar error · err=`, err);
      });
      console.log(`${tag} folder-tree watcher armed on`, watchDir);
      return watcher;
    } catch (err) {
      console.warn(`${tag} folder-tree watch arm failed · dir=`, watchDir, '· err=', err);
      return null;
    }
  };

  return {
    armDirectoryWatch,
    readAndDispatchSbis,
    dispatchIdle,
    broadcastToAll,
    backfillToClients,
    readCurrentFromDisk,
    // Folder-tree arms only present when aggregationMode === 'folder-tree' — single-file instances
    // get `undefined` (the optional closures), keeping their returned bundle byte-behavior-identical.
    ...(isFolderTree ? { armFolderTreeWatch, readAndDispatchFolderTree } : {}),
  };
}
