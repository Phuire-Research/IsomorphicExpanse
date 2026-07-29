/**
 * GitM Update STCP Relay — Shared Config (single-source · D-U4.2 · Fork A·β)
 *
 * The HEAVY scp-update-diff/-resolved bodies ride their OWN STCP relay chain — a faithful
 * 1:1 clone of GITM_RELAY_CONFIG (gitmRelay.config.ts) — OFF gitm.json's per-change broadcast.
 *
 * Two configs (not one): createStcpComponentRelay consumes ONE config per basename (it watches
 * dirname(jsonPath) and basename-filters on config.basename · stcpComponentRelay.model.ts:184-198).
 * The diff + resolved files are SEPARATE basenames, so each relay is its OWN config + its OWN
 * createStcpComponentRelay instance. The gitmUpdateWatcher principle arms BOTH instances — the
 * SAME single-watcher arming the gitmJsonWatcher uses, doubled. This is the "basename-routed"
 * the WGB names: scp-update-diff.<name>.json → gitmSetUpdateDiff ·
 * scp-update-resolved.<name>.json → gitmSetUpdateResolved.
 *
 * The basenames carry the active SCP <name> suffix (the bridge writes per-SCP files). The SCP
 * process knows its own designation via process.env.SCP_NAME (scpSpawn.model.ts:61 injects it).
 * Both files live in the SAME Cascades/Bridge/ dir gitm.json watches (resolveBridgeRoot()).
 *
 * emptyPayload is null (the engine's idle/absent sentinel · mirrors gitmRelay.config.ts) — the
 * client refs stay null until a real body lands; no non-null sentinel (the diff/resolved bodies
 * have no typed empty shape). No payloadIdentity (broadcast every parse · same as gitm.json).
 *
 * KeyedSelector law: the diff JSON's per-entry `collisionZoneName` is OPTIONAL in the file →
 * parseDiff coerces a missing value → '' so UpdateEntry stays non-optional on the SHAPE.
 *
 * Citation: gitmRelay.config.ts (single-source config object shape · BRIDGE_ROOT resolution · clone).
 * Citation: stcpComponentRelay.model.ts:184-198 (one config / one basename / armDirectoryWatch).
 * Citation: scpSpawn.model.ts:61 (SCP_NAME env injection · the active designation).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.2 gitmUpdateRelay.config.ts.
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import type {
  UpdateDiffShape,
  UpdateResolvedShape,
  UpdateEntry,
} from './gitmUpdate.type';
import { resolveBridgeRoot } from '../scsBridge/bridgeRoot.model';
import { gitmSetUpdateDiffHuirthBase } from './qualities/gitmSetUpdateDiffHuirthBase.quality.huirth';
import { gitmSetUpdateDiff } from './qualities/gitmSetUpdateDiff.quality.client';
import { gitmSetUpdateResolvedHuirthBase } from './qualities/gitmSetUpdateResolvedHuirthBase.quality.huirth';
import { gitmSetUpdateResolved } from './qualities/gitmSetUpdateResolved.quality.client';

const BRIDGE_ROOT = resolveBridgeRoot();

// The active SCP designation (scpSpawn.model.ts:61 injects SCP_NAME). '' fallback when running
// outside a spawned SCP (e.g. dev:self at the template root) — the basenames then resolve to
// 'scp-update-diff..json' which simply never matches a real write → the watcher stays armed +
// INERT (the same resilient-stay-armed posture gitmRelay.config keeps when no gitm.json exists).
const SCP_NAME = process.env.SCP_NAME ?? '';

// Coerce ONE raw diff entry: the optional collisionZoneName → '' (KeyedSelector law).
const coerceEntry = (raw: Partial<UpdateEntry> | undefined): UpdateEntry => ({
  path: typeof raw?.path === 'string' ? raw.path : '',
  status: typeof raw?.status === 'string' ? raw.status : '',
  collisionZone: raw?.collisionZone === true,
  collisionZoneName: typeof raw?.collisionZoneName === 'string' ? raw.collisionZoneName : '',
});

const coerceBucket = (raw: unknown): UpdateEntry[] =>
  Array.isArray(raw) ? raw.map((e) => coerceEntry(e as Partial<UpdateEntry>)) : [];

// STCP SLOT 1 · schema-aware parse of scp-update-diff.<name>.json into a UpdateDiffShape.
// Returns null on empty / parse-fail / missing the required schemaVersion gate (resilient ·
// the watcher stays armed until a valid bridge-authored body lands). The per-entry
// collisionZoneName?:string is coerced → '' (KeyedSelector law · non-optional SHAPE).
const parseDiff = (raw: string): UpdateDiffShape | null => {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UpdateDiffShape>;
    if (typeof parsed.schemaVersion !== 'string') return null;
    const buckets: Partial<UpdateDiffShape['buckets']> = parsed.buckets ?? {};
    const summary: Partial<UpdateDiffShape['summary']> = parsed.summary ?? {};
    const provenance: Partial<UpdateDiffShape['provenance']> = parsed.provenance ?? {};
    return {
      schemaVersion: parsed.schemaVersion,
      scpName: typeof parsed.scpName === 'string' ? parsed.scpName : '',
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : '',
      provenance: {
        baseSha: typeof provenance.baseSha === 'string' ? provenance.baseSha : '',
        oursSha: typeof provenance.oursSha === 'string' ? provenance.oursSha : '',
        theirsSha: typeof provenance.theirsSha === 'string' ? provenance.theirsSha : '',
        resultTree: typeof provenance.resultTree === 'string' ? provenance.resultTree : '',
        theirsTemplatePath:
          typeof provenance.theirsTemplatePath === 'string' ? provenance.theirsTemplatePath : '',
        cloneMode: typeof provenance.cloneMode === 'string' ? provenance.cloneMode : '',
        mergeMechanism:
          typeof provenance.mergeMechanism === 'string' ? provenance.mergeMechanism : '',
      },
      summary: {
        apply: typeof summary.apply === 'number' ? summary.apply : 0,
        preserve: typeof summary.preserve === 'number' ? summary.preserve : 0,
        conference: typeof summary.conference === 'number' ? summary.conference : 0,
        collisionZones: Array.isArray(summary.collisionZones) ? summary.collisionZones : [],
      },
      buckets: {
        apply: coerceBucket(buckets.apply),
        preserve: coerceBucket(buckets.preserve),
        conference: coerceBucket(buckets.conference),
      },
    };
  } catch {
    return null;
  }
};

// SCP-UPD D-U5 · schema-aware parse of scp-update-resolved.<name>.json into the CANONICAL
// UpdateResolvedShape. Returns null on empty / parse-fail / missing the required schemaVersion
// gate (resilient · the watcher stays armed until a valid resolver-authored body lands).
//
// CRITICAL (the silent-coerce trap): this parse MUST preserve the load-bearing apply bytes —
// `disposition`, `resolvedContent`, `patch` — or the apply quality reads empty strings and
// writes NOTHING. `disposition`/`bucket` coerce to a safe default ('preserve') on a missing/
// unknown value (an unrecognized decision becomes a no-op rather than a wild write). The
// optional resolvedContent/patch/note coerce → '' (KeyedSelector law · non-optional SHAPE).
const coerceDisposition = (raw: unknown): UpdateResolvedShape['decisions'][number]['disposition'] =>
  raw === 'write' || raw === 'patch' || raw === 'preserve' ? raw : 'preserve';
const coerceBucket2 = (raw: unknown): UpdateResolvedShape['decisions'][number]['bucket'] =>
  raw === 'apply' || raw === 'preserve' || raw === 'conference' ? raw : 'conference';
const parseResolved = (raw: string): UpdateResolvedShape | null => {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UpdateResolvedShape> & { summary?: unknown };
    if (typeof parsed.schemaVersion !== 'string') return null;
    const decisions = Array.isArray(parsed.decisions)
      ? parsed.decisions.map((d) => ({
          path: typeof d?.path === 'string' ? d.path : '',
          bucket: coerceBucket2((d as { bucket?: unknown })?.bucket),
          disposition: coerceDisposition((d as { disposition?: unknown })?.disposition),
          resolvedContent:
            typeof (d as { resolvedContent?: unknown })?.resolvedContent === 'string'
              ? (d as { resolvedContent: string }).resolvedContent
              : '',
          patch:
            typeof (d as { patch?: unknown })?.patch === 'string'
              ? (d as { patch: string }).patch
              : '',
          note: typeof (d as { note?: unknown })?.note === 'string' ? (d as { note: string }).note : '',
        }))
      : [];
    const s = (parsed.summary ?? {}) as Partial<UpdateResolvedShape['summary']>;
    const pending = typeof parsed.pending === 'number' ? parsed.pending : 0;
    return {
      schemaVersion: parsed.schemaVersion,
      scpName: typeof parsed.scpName === 'string' ? parsed.scpName : '',
      decisions,
      pending,
      summary: {
        write: typeof s.write === 'number' ? s.write : 0,
        patch: typeof s.patch === 'number' ? s.patch : 0,
        preserve: typeof s.preserve === 'number' ? s.preserve : 0,
        pending: typeof s.pending === 'number' ? s.pending : pending,
      },
    };
  } catch {
    return null;
  }
};

// scp-update-diff.<name>.json relay config (basename-routed · TQNI 'Gitm Set Update Diff').
export const GITM_UPDATE_DIFF_RELAY_CONFIG: StcpComponentRelayConfig<UpdateDiffShape | null> = {
  jsonPath: path.join(BRIDGE_ROOT, `scp-update-diff.${SCP_NAME}.json`),
  basename: `scp-update-diff.${SCP_NAME}.json`,
  parsePayload: parseDiff,
  // emptyPayload · null is the "no data" sentinel in the engine (not a typed empty shape).
  emptyPayload: null,
  baseActionCreator: (payload) =>
    gitmSetUpdateDiffHuirthBase.actionCreator({ updateDiff: payload }) as AnyAction,
  relayActionCreator: (payload) =>
    gitmSetUpdateDiff.actionCreator({ updateDiff: payload }) as AnyAction,
  logTag: '[GITM UPDATE DIFF STCP]',
  stabilityThresholdMs: 100,
};

// scp-update-resolved.<name>.json relay config (basename-routed · TQNI 'Gitm Set Update Resolved').
export const GITM_UPDATE_RESOLVED_RELAY_CONFIG: StcpComponentRelayConfig<UpdateResolvedShape | null> =
  {
    jsonPath: path.join(BRIDGE_ROOT, `scp-update-resolved.${SCP_NAME}.json`),
    basename: `scp-update-resolved.${SCP_NAME}.json`,
    parsePayload: parseResolved,
    emptyPayload: null,
    baseActionCreator: (payload) =>
      gitmSetUpdateResolvedHuirthBase.actionCreator({ updateResolved: payload }) as AnyAction,
    relayActionCreator: (payload) =>
      gitmSetUpdateResolved.actionCreator({ updateResolved: payload }) as AnyAction,
    logTag: '[GITM UPDATE RESOLVED STCP]',
    stabilityThresholdMs: 100,
  };
