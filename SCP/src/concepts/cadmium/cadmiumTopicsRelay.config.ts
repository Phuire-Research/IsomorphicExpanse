/**
 * Cadmium Topics STCP Relay — Shared Config (Diamond RFI · 2nd STCP instance · single-source)
 *
 * The 2nd STCP instance on the SAME helper (createStcpComponentRelay), against the SAME RI dir,
 * with the topics payload. ONE exported config object both `cadmiumOkMonitor` (dir-watch arm)
 * AND `cadmiumTopicsStcpRelay` (SMRP+BOCR) import — no duplicated config literals. Each principle
 * builds its OWN createStcpComponentRelay<CadmiumTopic[]>(CADMIUM_TOPICS_RELAY_CONFIG) INSTANCE
 * (independent FSWatcher handle), but the config VALUES are single-source.
 *
 * The PRODUCER is rebuilt on the STCP helper; the CONSUMER is REUSED untouched: the
 * baseActionCreator is the NEW Huirth-only cadmiumSetTopicsHuirthBase ('Cadmium Set Topics Huirth
 * Base'), and the relayActionCreator is the EXISTING cadmiumSetTopics ('Cadmium Set Topics',
 * already in cadmium.muxonomy.ts actionExchange) — the SAME relay the legacy readAndBroadcastTopics
 * used, so the existing CadmiumBulletin Research Frontier zone re-renders with zero consumer change.
 *
 * payloadIdentity is OMITTED — a CadmiumTopic[] has no monotonic scalar identity (unlike menuStage's
 * stageIndex), and topics.json full-replace writes are infrequent + idempotent (re-broadcasting an
 * unchanged array is a correct full-replace no-op). Omit → broadcast on every valid parse.
 *
 * The topics.json path resolves against SCS_ROOT (the SAME live Cascades/ the menu relay + the
 * MCW watcher + the Cascade Registry use · dev:self → SCS root; production → install cwd). Mirrors
 * cadmiumMenuRelay.config.ts SCS_BRIDGE_ROOT_OVERRIDE discipline so the path lands at the live
 * Cascades/Extended/<Cadmium Researcher>/topics.json.
 *
 * Citation: cadmiumMenuRelay.config.ts (the 1st STCP instance · byte-for-byte mirror).
 * Citation: RFI-DIAMOND-WGB.md §PART B (RFSCI · TRIBS · TSSL) + §L1 (REUSE relay action-creator).
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import type { Application } from 'express';
import { registerBulletinEndpoints } from '../vue/registerBulletinEndpoints';
import type { CadmiumTopic } from './cadmium.type';
import {
  CADMIUM_TOPICS_JSON_BASENAME,
  DEFAULT_CADMIUM_DESIGNATION_NAME,
} from './cadmium.type';
import { cadmiumSetTopics } from './qualities/cadmiumSetTopics.quality.client';
import { cadmiumSetTopicsHuirthBase } from './qualities/cadmiumSetTopicsHuirthBase.quality.huirth';

// SCS root — mirrors cadmiumMenuRelay.config.ts SCS_ROOT (the live Cascades/). The topics.json
// path lands at Cascades/Extended/<Cadmium Researcher>/topics.json.
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

const CADMIUM_TOPICS_JSON_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Extended',
  DEFAULT_CADMIUM_DESIGNATION_NAME,
  CADMIUM_TOPICS_JSON_BASENAME,
);

// The Idle sentinel — an empty topics list. JDIS unlink → the helper SBIS-dispatches this (Base
// + relay) so the Research Frontier clears when topics.json is removed.
export const EMPTY_TOPICS: CadmiumTopic[] = [];

// STCP SLOT 1 · schema-aware parse of topics.json into a CadmiumTopic[]. Returns null on empty /
// parse-fail / non-array so the watcher stays alive until a valid Anchor-authored topics list
// lands. Each entry requires the four CadmiumTopic fields ({id,label,query,active}); malformed
// entries are filtered out (defensive · the Anchor authored it as free JSON). An empty-but-valid
// array (`[]`) returns [] (a deliberate clear), NOT null.
export const parseCadmiumTopics = (raw: string): CadmiumTopic[] | null => {
  if (!raw.trim()) return null; // skip empty/partial writes
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[Cadmium STCP topics] topics.json parse failed · ignoring (partial write?)');
    return null;
  }
  if (!Array.isArray(parsed)) {
    console.warn('[Cadmium STCP topics] topics.json not an array · ignoring');
    return null;
  }
  const topics = (parsed as unknown[])
    .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
    .filter(
      (t) =>
        typeof t.id === 'string'
        && typeof t.label === 'string'
        && typeof t.query === 'string'
        && typeof t.active === 'boolean',
    )
    .map((t) => ({
      id: t.id as string,
      label: t.label as string,
      query: t.query as string,
      active: t.active as boolean,
    }));
  return topics;
};

// The single shared config. Both principles construct their own instance from this exact object.
export const CADMIUM_TOPICS_RELAY_CONFIG: StcpComponentRelayConfig<CadmiumTopic[]> = {
  jsonPath: CADMIUM_TOPICS_JSON_PATH,
  basename: CADMIUM_TOPICS_JSON_BASENAME,
  parsePayload: parseCadmiumTopics,
  emptyPayload: EMPTY_TOPICS,
  // Action-creators carry a payload-parameterized Action<Payload>; the slot is AnyAction (the
  // payload-agnostic action shape · the helper only routes it through nextA / broadcast, never
  // inspects payload). Cast to AnyAction — mirrors the menu config / OkMonitor `as AnyAction`.
  // Base = NEW Huirth-only quality; Relay = EXISTING cadmiumSetTopics (in actionExchange · REUSE).
  baseActionCreator: (topics) =>
    cadmiumSetTopicsHuirthBase.actionCreator({ topics }) as AnyAction,
  relayActionCreator: (topics) =>
    cadmiumSetTopics.actionCreator({ topics }) as AnyAction,
  // payloadIdentity OMITTED — arrays have no monotonic scalar identity; full-replace writes are
  // infrequent + idempotent (re-broadcast = correct no-op). Broadcast on every valid parse.
  logTag: '[Cadmium OkMonitor · STCP topics]',
};

// TOCH · Topics-On-Connect-Hydration — the BSOH/ODCF pattern cascaded to the topics registry.
// topics.json is an STCP relay that broadcasts ONCE per write to clients connected at that moment;
// the webSocketServer NEVER replays on (re)connect, so a page loading/refreshing AFTER the boot
// broadcast shows "no topics configured" even though topics.json is populated. This pre-bound LIST
// endpoint lets the CadmiumLanding onMounted GET /cadmium-topics to seed the topics store on a
// hard-refresh; the STCP relay keeps it live thereafter. Single-file mode (reads topics.json directly
// via the SAME parseCadmiumTopics the relay uses). DETAIL route registered for factory symmetry
// (unused by the flat topics list). Server-side ONLY (registerBulletinEndpoints → fs · this config is
// imported only by .huirth principles + vue.principle · never the client bundle).
export const registerTopicsEndpoint = (app: Application): void =>
  registerBulletinEndpoints<CadmiumTopic>(app, {
    listRoute: '/cadmium-topics',
    detailRoute: '/cadmium-topics/:id',
    jsonPath: CADMIUM_TOPICS_JSON_PATH,
    parse: parseCadmiumTopics,
    idField: 'id',
  });
