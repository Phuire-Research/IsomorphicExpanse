/**
 * Cadmium ResearchBulletin STCP Relay — Shared Config (Diamond RAR · 3rd STCP instance · single-source)
 *
 * The 3rd STCP instance on the SAME helper (createStcpComponentRelay), against the `targeted/`
 * SUBDIR of the Cadmium RI dir, with the CadmiumArticle[] payload. ONE exported config object both
 * `cadmiumOkMonitor` (dir-watch arm) AND `cadmiumResearchBulletinStcpRelay` (SMRP+BOCR) import — no
 * duplicated config literals. Each principle builds its OWN
 * createStcpComponentRelay<CadmiumArticle[]>(CADMIUM_RESEARCH_BULLETIN_RELAY_CONFIG) INSTANCE
 * (independent FSWatcher handle), but the config VALUES are single-source.
 *
 * The Base is the NEW Huirth-only cadmiumSetResearchBulletinHuirthBase ('Cadmium Set Research
 * Bulletin Huirth Base'); the relay is the NEW cadmiumSetResearchBulletin ('Cadmium Set Research
 * Bulletin', registered in cadmium.muxonomy.ts actionExchange) — the CadmiumResearchBulletin
 * renderer re-renders when the relay lands.
 *
 * payloadIdentity is OMITTED — a CadmiumArticle[] has no monotonic scalar identity (unlike
 * menuStage's stageIndex), and researchBulletin.json full-replace writes are infrequent +
 * idempotent (re-broadcasting an unchanged array is a correct full-replace no-op). Omit →
 * broadcast on every valid parse.
 *
 * The researchBulletin.json path resolves against SCS_ROOT (the SAME live Cascades/ the menu +
 * topics relays + the MCW watcher use · dev:self → SCS root; production → install cwd). Mirrors
 * cadmiumTopicsRelay.config.ts SCS_BRIDGE_ROOT_OVERRIDE discipline so the path lands at the live
 * Cascades/Extended/<Cadmium Researcher>/targeted/researchBulletin.json.
 *
 * Citation: cadmiumTopicsRelay.config.ts (the 2nd STCP instance · byte-for-byte mirror).
 * Citation: RAR-DIAMOND-WGB.md §LOCKED 2/3 (Option B targeted/ subdir · REUSE CadmiumArticle) + §W2.
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import { createLiveBulletin } from '../../model/liveBulletin.model';
import type { CadmiumArticle } from './cadmium.type';
import {
  CADMIUM_RESEARCH_BULLETIN_JSON_BASENAME,
  CADMIUM_TARGETED_SUBDIR_BASENAME,
  DEFAULT_CADMIUM_DESIGNATION_NAME,
} from './cadmium.type';
import { cadmiumSetResearchBulletin } from './qualities/cadmiumSetResearchBulletin.quality.client';
import { cadmiumSetResearchBulletinHuirthBase } from './qualities/cadmiumSetResearchBulletinHuirthBase.quality.huirth';

// SCS root — mirrors cadmiumTopicsRelay.config.ts SCS_ROOT (the live Cascades/). The
// researchBulletin.json path lands at Cascades/Extended/<Cadmium Researcher>/targeted/researchBulletin.json.
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

const CADMIUM_RESEARCH_BULLETIN_JSON_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Extended',
  DEFAULT_CADMIUM_DESIGNATION_NAME,
  CADMIUM_TARGETED_SUBDIR_BASENAME,
  CADMIUM_RESEARCH_BULLETIN_JSON_BASENAME,
);

// The Idle sentinel — an empty research bulletin list. JDIS unlink → the helper SBIS-dispatches
// this (Base + relay) so the ResearchBulletin clears when researchBulletin.json is removed.
export const EMPTY_RESEARCH_BULLETIN: CadmiumArticle[] = [];

// STCP SLOT 1 · schema-aware parse of researchBulletin.json into a CadmiumArticle[]. Returns null
// on empty / parse-fail / non-array so the watcher stays alive until a valid targeted-research
// list lands. Each entry requires the five CadmiumArticle fields ({articleId,title,filePath,
// markdownContent,createdAt}); malformed entries are filtered out. The optional ARJP fields
// (preview/topic/slug/sourceCount) pass through when present. An empty-but-valid array (`[]`)
// returns [] (a deliberate clear), NOT null.
export const parseResearchBulletin = (raw: string): CadmiumArticle[] | null => {
  if (!raw.trim()) return null; // skip empty/partial writes
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[Cadmium STCP researchBulletin] researchBulletin.json parse failed · ignoring (partial write?)');
    return null;
  }
  if (!Array.isArray(parsed)) {
    console.warn('[Cadmium STCP researchBulletin] researchBulletin.json not an array · ignoring');
    return null;
  }
  const articles = (parsed as unknown[])
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .filter(
      (a) =>
        typeof a.articleId === 'string'
        && typeof a.title === 'string'
        && typeof a.filePath === 'string'
        && typeof a.markdownContent === 'string'
        && typeof a.createdAt === 'number',
    )
    .map((a) => ({
      articleId: a.articleId as string,
      title: a.title as string,
      filePath: a.filePath as string,
      markdownContent: a.markdownContent as string,
      createdAt: a.createdAt as number,
      // Optional ARJP fields pass through when present (REUSE CadmiumArticle · no new entry type).
      ...(typeof a.preview === 'string' ? { preview: a.preview as string } : {}),
      ...(typeof a.topic === 'string' ? { topic: a.topic as string } : {}),
      ...(typeof a.slug === 'string' ? { slug: a.slug as string } : {}),
      ...(typeof a.sourceCount === 'number' ? { sourceCount: a.sourceCount as number } : {}),
    }));
  return articles;
};

// CLBF · Targeted Research Bulletin rides createLiveBulletin (aggregationMode 'single-file').
// The factory composes the SAME three pieces this file used to wire by hand — the STCP relay config
// (single-source for both principles), the relay principle factory (per-instance closure bundle),
// and the BSE LIST/DETAIL registration. The aggregationMode 'single-file' path is byte-behavior-
// identical to the prior direct createStcpComponentRelay usage: watch dir(jsonPath), basename-filter,
// SBIS Base→Relay, JDIS unlink→Idle. The Targeted runtime path, JSON shape, relay action types, and
// BSE routes are unchanged.
//
// Action-creators carry a payload-parameterized Action<Payload>; the slot is AnyAction (the payload-
// agnostic action shape · the helper only routes it through nextA / broadcast, never inspects payload).
// Cast to AnyAction — mirrors the prior config. Base = Huirth-only quality; Relay =
// cadmiumSetResearchBulletin (in actionExchange). payloadIdentity OMITTED — arrays have no monotonic
// scalar identity; full-replace writes are infrequent + idempotent (re-broadcast = correct no-op).
export const cadmiumResearchBulletinLiveBulletin = createLiveBulletin<CadmiumArticle[]>({
  aggregationMode: 'single-file',
  jsonPath: CADMIUM_RESEARCH_BULLETIN_JSON_PATH,
  basename: CADMIUM_RESEARCH_BULLETIN_JSON_BASENAME,
  parsePayload: parseResearchBulletin,
  emptyPayload: EMPTY_RESEARCH_BULLETIN,
  baseActionCreator: (researchBulletin) =>
    cadmiumSetResearchBulletinHuirthBase.actionCreator({ researchBulletin }) as AnyAction,
  relayActionCreator: (researchBulletin) =>
    cadmiumSetResearchBulletin.actionCreator({ researchBulletin }) as AnyAction,
  logTag: '[Cadmium OkMonitor · STCP researchBulletin]',
  // BSE LIST/DETAIL — single-file reads the SAME jsonPath the watcher watches. Routes byte-identical.
  listRoute: '/cadmium-research-bulletin',
  detailRoute: '/cadmium-research-bulletin/:id',
  endpointJsonPath: CADMIUM_RESEARCH_BULLETIN_JSON_PATH,
  endpointParse: parseResearchBulletin,
  idField: 'articleId',
});

// STABLE EXPORT — the shared STCP relay config. Both principles (cadmiumOkMonitor dir-watch arm +
// cadmiumResearchBulletinStcpRelay SMRP/BOCR) import this exact object by name; aliasing the factory's
// relayConfig keeps every importer compiling unchanged (the config shape is byte-identical).
export const CADMIUM_RESEARCH_BULLETIN_RELAY_CONFIG: StcpComponentRelayConfig<CadmiumArticle[]> =
  cadmiumResearchBulletinLiveBulletin.relayConfig;

// The relay principle factory (per-instance STCP closure bundle) + the pre-bound BSE registration.
export const cadmiumResearchBulletinStcpRelayPrincipleFactory =
  cadmiumResearchBulletinLiveBulletin.stcpRelayPrincipleFactory;
export const registerResearchBulletinEndpoints =
  cadmiumResearchBulletinLiveBulletin.registerEndpoints;
