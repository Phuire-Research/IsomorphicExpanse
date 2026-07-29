/**
 * liveBulletin.model.ts — CLBF · createLiveBulletin Factory (the transferable Suite-8 base pattern)
 *
 * A HIGH-ORDER factory that instantiates the complete STCP live-bulletin stack from ONE config
 * object. It replaces the prior 3-piece manual wiring (relay.config.ts + relay principle +
 * BSE registration call) with a single call that returns the three wired outputs together:
 *
 *   createLiveBulletin<TPayload>(config) → { relayConfig, stcpRelayPrincipleFactory, registerEndpoints }
 *
 * This is the transferable encapsulation — any future Suite-8 page calls createLiveBulletin once
 * and gets a complete live bulletin (live STCP relay + BSE LIST/DETAIL endpoints).
 *
 * Aggregation modes (the FATW discriminant):
 *   - 'single-file' → the proven Targeted behavior: watch dir(jsonPath), basename-filter, SBIS.
 *   - 'folder-tree' → watch watchDir RECURSIVELY; on any child .json write, merge all child JSONs
 *                     into one TPayload (via mergePayloads), materialise an aggregate file (AMFJ),
 *                     and dispatch Base+Relay.
 *
 * Why src/model/: same SMFT cross-concept-helper placement as stcpComponentRelay.model.ts —
 * PURE, dispatch-free, component-AGNOSTIC. It imports createStcpComponentRelay (the mechanism)
 * and registerBulletinEndpoints (the BSE factory) — never a concept, never a concept-specific
 * payload type. Every binding arrives via the generic config.
 *
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §Architecture Map (the createLiveBulletin Factory).
 * Citation: stcpComponentRelay.model.ts (the mechanism this factory composes).
 * Citation: registerBulletinEndpoints.ts (the BSE two-channel factory this factory binds).
 */
import type { Application } from 'express';
import type { AnyAction } from 'stratimux';
import {
  createStcpComponentRelay,
  type StcpComponentRelayConfig,
  type StcpComponentRelayClosures,
} from './stcpComponentRelay.model';
import {
  registerBulletinEndpoints,
  type BulletinEndpointsConfig,
  type BulletinFolderTreeRead,
} from '../concepts/vue/registerBulletinEndpoints';

// The BSE DETAIL route finds by `idField` on the ELEMENT type of the bulletin array. When TPayload
// is `CadmiumArticle[]`, the element type is `CadmiumArticle`. This helper extracts the element.
type ElementOf<TPayload> = TPayload extends (infer U)[] ? U : never;

// ---- The single config the factory consumes (Suite-8 slots + paths + the BSE routes) ----
export interface LiveBulletinConfig<TPayload> {
  // The aggregation mode discriminant (see file header). Defaults to 'single-file' when omitted.
  aggregationMode?: 'single-file' | 'folder-tree';

  // --- single-file mode ---
  // Absolute path to the single watched JSON file.
  jsonPath: string;
  // Basename to filter directory events on (e.g. 'researchBulletin.json').
  basename: string;

  // --- folder-tree mode ---
  // Absolute path to the recursively watched root dir (e.g. .../frontier/).
  watchDir?: string;
  // Child JSON basenames to EXCLUDE from the tree merge (e.g. the aggregate file itself).
  excludeBasenames?: readonly string[];
  // Merge the per-file parsed payloads into ONE TPayload (flatten/dedup/sort).
  mergePayloads?: (items: TPayload[]) => TPayload;
  // The materialised aggregate file path (AMFJ · Option A) the merge writes after each dispatch.
  aggregateWritePath?: string;

  // SUITE-8 SLOT 1 — parse a single raw JSON string into a TPayload (or null on bad-input).
  parsePayload: (raw: string) => TPayload | null;
  // SUITE-8 SLOT 2 — the Idle sentinel (e.g. EMPTY_RESEARCH_BULLETIN = []).
  emptyPayload: TPayload;
  // SUITE-8 SLOT 3a — Huirth-only Base action creator (NOT in actionExchange).
  baseActionCreator: (payload: TPayload) => AnyAction;
  // SUITE-8 SLOT 3b — Relay action creator (carries the registered TQNI type · in actionExchange).
  relayActionCreator: (payload: TPayload) => AnyAction;

  // --- BSE endpoint registration ---
  listRoute: string;
  detailRoute: string;
  // The LIST endpoint reads this file. For single-file = jsonPath; for folder-tree = the aggregate.
  endpointJsonPath: string;
  // Server-only parser the BSE LIST/DETAIL handlers use to read endpointJsonPath into an array.
  endpointParse: (raw: string) => ElementOf<TPayload>[] | null;
  // The stable identifier field on the element type the DETAIL route matches against.
  idField: keyof ElementOf<TPayload>;

  // --- optional tuning ---
  payloadIdentity?: (payload: TPayload) => string | number;
  stabilityThresholdMs?: number;
  logTag?: string;
}

// The factory's three wired outputs.
export interface LiveBulletin<TPayload> {
  // The shared STCP relay config object (both principles construct their own instance from it).
  relayConfig: StcpComponentRelayConfig<TPayload>;
  // Builds a fresh STCP relay closure bundle (independent FSWatcher handle / lastIdentity) — each
  // caller (OkMonitor arm · SMRP/BOCR relay principle) calls this for its own instance.
  stcpRelayPrincipleFactory: () => StcpComponentRelayClosures<TPayload>;
  // A pre-bound BSE registration (LIST + DETAIL) ready for vue.principle.ts — call with the app.
  registerEndpoints: (app: Application) => void;
}

export function createLiveBulletin<TPayload>(
  config: LiveBulletinConfig<TPayload>,
): LiveBulletin<TPayload> {
  const aggregationMode = config.aggregationMode ?? 'single-file';

  // The shared STCP relay config — single-source. Folder-tree slots pass through only when set
  // (single-file instances get them undefined, keeping the relay byte-behavior-identical).
  const relayConfig: StcpComponentRelayConfig<TPayload> = {
    aggregationMode,
    jsonPath: config.jsonPath,
    basename: config.basename,
    watchDir: config.watchDir,
    excludeBasenames: config.excludeBasenames,
    mergePayloads: config.mergePayloads,
    aggregateWritePath: config.aggregateWritePath,
    parsePayload: config.parsePayload,
    emptyPayload: config.emptyPayload,
    baseActionCreator: config.baseActionCreator,
    relayActionCreator: config.relayActionCreator,
    payloadIdentity: config.payloadIdentity,
    stabilityThresholdMs: config.stabilityThresholdMs,
    logTag: config.logTag,
  };

  const stcpRelayPrincipleFactory = (): StcpComponentRelayClosures<TPayload> =>
    createStcpComponentRelay<TPayload>(relayConfig);

  // Folder-tree AOR — the LIST/DETAIL aggregate-on-read the SAME children the live relay merges
  // (parsePayload + mergePayloads), so persist-on-refresh returns exactly what the live path
  // broadcast — NOT a separately-materialised aggregate cache (the Topic Bulletin persist fix · LBPR).
  const endpointFolderTree: BulletinFolderTreeRead<ElementOf<TPayload>> | undefined =
    aggregationMode === 'folder-tree' && config.watchDir && config.mergePayloads
      ? {
          watchDir: config.watchDir,
          parseChild: config.parsePayload as unknown as (raw: string) => ElementOf<TPayload>[] | null,
          merge: config.mergePayloads as unknown as (items: ElementOf<TPayload>[][]) => ElementOf<TPayload>[],
          excludeBasenames: config.excludeBasenames,
        }
      : undefined;

  const bulletinEndpointsConfig: BulletinEndpointsConfig<ElementOf<TPayload>> = {
    listRoute: config.listRoute,
    detailRoute: config.detailRoute,
    jsonPath: config.endpointJsonPath,
    parse: config.endpointParse,
    idField: config.idField,
    ...(endpointFolderTree ? { folderTree: endpointFolderTree } : {}),
  };

  const registerEndpoints = (app: Application): void => {
    registerBulletinEndpoints<ElementOf<TPayload>>(app, bulletinEndpointsConfig);
  };

  return {
    relayConfig,
    stcpRelayPrincipleFactory,
    registerEndpoints,
  };
}
