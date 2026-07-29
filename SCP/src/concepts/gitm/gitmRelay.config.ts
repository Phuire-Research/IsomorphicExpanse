/**
 * GitM STCP Relay — Shared Config (single-source)
 *
 * ONE exported config object both the gitmJsonWatcher (dir-watch arm + C1 first-load)
 * AND the gitmStcpRelay (SMRP + BOCR) import — no duplicated config literals. Each
 * principle builds its OWN createStcpComponentRelay<GitmJsonShape | null>(GITM_RELAY_CONFIG)
 * INSTANCE (independent lastIdentity guard + independent FSWatcher handle), but the config
 * VALUES are single-source.
 *
 * Key difference from cadmiumMenuRelay.config.ts: the gitm.json path resolves against
 * BRIDGE_ROOT (resolveScpLocalBridgeDir() → <scpPackage>/Cascades/Bridge/gitm.json — the
 * SCP's OWN rail under MD-A sovereignty), NOT SCS_ROOT. gitm.json is the bridge↔SCP
 * contact seam. emptyPayload is null (the engine's idle/absent sentinel). No
 * payloadIdentity (no stageIndex equivalent; null suppression via emptyPayload).
 *
 * Citation: cadmiumMenuRelay.config.ts (single-source config object shape).
 * Citation: scsBridgeGitmJsonWatcher.principle.huirth.ts:42-43 (BRIDGE_ROOT path resolution).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W1 gitmRelay.config.ts (authoritative shape).
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import type { GitmJsonShape } from './gitm.type';
import { resolveScpLocalBridgeDir } from '../scsBridge/bridgeRoot.model';
import { gitmSetGitmJsonHuirthBase } from './qualities/gitmSetGitmJsonHuirthBase.quality.huirth';
import { gitmSetGitmJson } from './qualities/gitmSetGitmJson.quality.client';

// MD-A D2 · SCP BRIDGE SOVEREIGNTY — the gitm relay reads the SCP's OWN bridge rail
// (resolveScpLocalBridgeDir · cwd-local, never walked-up). The bridge's GITEP writer
// lands gitm.json on the CALLING SCP's Cascades/Bridge/ (keyed by activeScpDir); the
// per-SCP gitm.json IS the contact seam of the blindness contract.
const BRIDGE_ROOT = resolveScpLocalBridgeDir();

export const GITM_RELAY_CONFIG: StcpComponentRelayConfig<GitmJsonShape | null> = {
  jsonPath: path.join(BRIDGE_ROOT, 'gitm.json'),
  basename: 'gitm.json',
  // STCP SLOT 1 · schema-aware parse of gitm.json into a GitmJsonShape. Returns null on
  // empty / parse-fail / missing the required isRepo:boolean gate (resilient · the watcher
  // stays armed until a valid bridge-authored snapshot lands).
  parsePayload: (raw: string): GitmJsonShape | null => {
    if (!raw.trim()) return null;
    try {
      const parsed = JSON.parse(raw) as GitmJsonShape;
      if (typeof parsed.isRepo !== 'boolean') return null;
      return parsed;
    } catch {
      return null;
    }
  },
  // emptyPayload · null is the "no data" sentinel in the engine (not a typed empty shape).
  emptyPayload: null,
  // W2a (the Turn-Over Disconnect Guard) — HOLD, never Idle, on a gitm.json unlink. This is the ONE
  // place a null crosses the wire to client state (emptyPayload:null → gitmSetGitmJson → gitmJson
  // null → the Sword reads "no B" → a FALSE Forge invite). A turn-over/crash absence is transient
  // (the atomic tmp+rename writer never unlinks; only a genuine rm would); the client keeps its
  // last-known decision fields until the next bridge write returns the file.
  suppressUnlinkIdle: true,
  baseActionCreator: (payload) =>
    gitmSetGitmJsonHuirthBase.actionCreator({ gitmJson: payload }) as AnyAction,
  relayActionCreator: (payload) =>
    gitmSetGitmJson.actionCreator({ gitmJson: payload }) as AnyAction,
  logTag: '[GITM STCP]',
  stabilityThresholdMs: 100,
};
