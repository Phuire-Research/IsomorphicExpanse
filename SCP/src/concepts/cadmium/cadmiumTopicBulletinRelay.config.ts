/**
 * Cadmium TopicBulletin STCP Relay — Shared Config (Topic Live Bulletin · FIRST folder-tree instance)
 *
 * The FIRST folder-tree STCP instance on createLiveBulletin (aggregationMode 'folder-tree'), against
 * the `frontier/` SUBDIR of the Cadmium RI dir, with the CadmiumArticle[] payload. Where Targeted
 * watches ONE accumulating researchBulletin.json (single-file), this watches frontier/ RECURSIVELY:
 * each per-session worker writes `frontier/<topic-slug>/<slug>-<ts>.json` (a single ResearchArticleMeta
 * object), and the folder-tree merge re-reads every child JSON, parses each into a one-element
 * CadmiumArticle[], merges (dedup by articleId · newest-first), materialises the aggregate
 * (frontier/topicBulletin.json · AMFJ · Option A), and dispatches Base+Relay.
 *
 * ONE exported config object both `cadmiumOkMonitor` (folder-tree-watch arm) AND
 * `cadmiumTopicBulletinStcpRelay` (SMRP+BOCR) import — no duplicated config literals. Each principle
 * builds its OWN createLiveBulletin output INSTANCE; the config VALUES are single-source.
 *
 * The Base is the NEW Huirth-only cadmiumSetTopicBulletinHuirthBase ('Cadmium Set Topic Bulletin
 * Huirth Base'); the relay is the NEW cadmiumSetTopicBulletin ('Cadmium Set Topic Bulletin',
 * registered in cadmium.muxonomy.ts actionExchange) — the LiveBulletin renderer re-renders when
 * the relay lands.
 *
 * The frontier/ path resolves against SCS_ROOT (the SAME live Cascades/ the menu + research-bulletin
 * relays use · dev:self → SCS root; production → install cwd). Mirrors cadmiumResearchBulletinRelay.config.ts
 * SCS_BRIDGE_ROOT_OVERRIDE discipline so the path lands at the live
 * Cascades/Extended/<Cadmium Researcher>/frontier/.
 *
 * Citation: cadmiumResearchBulletinRelay.config.ts (the single-file sibling · structural mirror).
 * Citation: liveBulletin.model.ts §createLiveBulletin (the factory · folder-tree mode).
 * Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §W3 · §parseTopicArticleFile · §mergeTopicArticles · §Option A.
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import { createLiveBulletin } from '../../model/liveBulletin.model';
import type { CadmiumArticle } from './cadmium.type';
import {
  CADMIUM_FRONTIER_SUBDIR_BASENAME,
  CADMIUM_TOPIC_BULLETIN_JSON_BASENAME,
  DEFAULT_CADMIUM_DESIGNATION_NAME,
} from './cadmium.type';
import { parseResearchBulletin } from './cadmiumResearchBulletinRelay.config';
import { cadmiumSetTopicBulletin } from './qualities/cadmiumSetTopicBulletin.quality.client';
import { cadmiumSetTopicBulletinHuirthBase } from './qualities/cadmiumSetTopicBulletinHuirthBase.quality.huirth';

// SCS root — mirrors cadmiumResearchBulletinRelay.config.ts SCS_ROOT (the live Cascades/). The
// frontier/ path lands at Cascades/Extended/<Cadmium Researcher>/frontier/.
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

const CADMIUM_FRONTIER_DIR_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Extended',
  DEFAULT_CADMIUM_DESIGNATION_NAME,
  CADMIUM_FRONTIER_SUBDIR_BASENAME,
);

// AMFJ · the materialised aggregate the folder-tree merge writes (atomic rename) after each
// dispatch. The BSE LIST endpoint + the C1 first-load read this ONE consistent file (Option A).
const CADMIUM_TOPIC_BULLETIN_AGGREGATE_PATH = path.resolve(
  CADMIUM_FRONTIER_DIR_PATH,
  CADMIUM_TOPIC_BULLETIN_JSON_BASENAME,
);

// The Idle sentinel — an empty topic bulletin list. An empty frontier/ tree → the folder-tree merge
// dispatches this (Base + relay) so the Topic Bulletin clears when every frontier child is removed.
export const EMPTY_TOPIC_BULLETIN: CadmiumArticle[] = [];

// STCP SLOT 1 (folder-tree) · parse a SINGLE per-session frontier child file (a ResearchArticleMeta
// object · NOT an array) into a ONE-element CadmiumArticle[]. Returns null on empty / parse-fail /
// missing required fields (partial write / malformed) so a half-written child is skipped and the
// merge re-folds the remaining valid children. The articleId = the article's filePath (mirrors the
// mock + targeted parser convention · stable across renames).
//
// markdownContent is EMPTY here — the per-session JSON (ResearchArticleMeta) does not carry the full
// body in today's shape (W3-accepted). When the worker writes a `markdownContent` field (W4 · or the
// mock writes it now to prove DETAIL), it threads through. The BSE DETAIL channel returns this same
// merged shape — DETAIL body is provable as soon as a child carries markdownContent.
export const parseTopicArticleFile = (raw: string): CadmiumArticle[] | null => {
  if (!raw.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const m = parsed as Record<string, unknown>;
  if (
    typeof m.title !== 'string'
    || typeof m.slug !== 'string'
    || typeof m.topic !== 'string'
    || typeof m.timestamp !== 'string'
    || typeof m.preview !== 'string'
  ) return null;
  // C462 · TIMESTAMP REPAIR — workers sometimes leak the FILENAME-SAFE stem into the meta
  // timestamp field (`2026-07-12T14-02-06Z` · dashes in the time part) → new Date() = NaN →
  // the completed article was silently DROPPED from the merge (user-diagnosed: written on disk,
  // never registered). Repair the time-part dashes back to colons before rejecting.
  let createdAt = new Date(m.timestamp as string).getTime();
  if (isNaN(createdAt)) {
    const repaired = (m.timestamp as string).replace(
      /T(\d{2})-(\d{2})-(\d{2})/,
      'T$1:$2:$3',
    );
    createdAt = new Date(repaired).getTime();
  }
  if (isNaN(createdAt)) return null;
  // Reconstruct the .md output path from the slug+timestamp so articleId is stable. The worker
  // writes `frontier/<topic-slug>/<slug>-<ts>.json`; the .md sibling shares the stem. When the
  // worker inlines `filePath` (W4) it wins; until then derive it (timestamp colons/dots → dashes).
  const filePath = typeof m.filePath === 'string'
    ? m.filePath
    : `Cascades/Extended/${DEFAULT_CADMIUM_DESIGNATION_NAME}/${CADMIUM_FRONTIER_SUBDIR_BASENAME}/${m.slug}/${m.slug}-${(m.timestamp as string).replace(/[:.]/g, '-')}.md`;
  const article: CadmiumArticle = {
    articleId: filePath,
    title: m.title as string,
    filePath,
    // Empty unless the child inlines it (W4 / mock) — the DETAIL channel returns it from the merge.
    markdownContent: typeof m.markdownContent === 'string' ? (m.markdownContent as string) : '',
    createdAt,
    preview: m.preview as string,
    topic: m.topic as string,
    slug: m.slug as string,
    ...(typeof m.sourceCount === 'number' ? { sourceCount: m.sourceCount as number } : {}),
  };
  return [article];
};

// STCP SLOT 1b (folder-tree) · merge the per-file parsed CadmiumArticle[] arrays into ONE
// CadmiumArticle[]. Flatten, dedup by articleId (last createdAt wins · sort asc first so the Map
// keeps the most recent per articleId), then return newest-first (createdAt desc).
export const mergeTopicArticles = (items: CadmiumArticle[][]): CadmiumArticle[] => {
  const flat = items.flat();
  flat.sort((a, b) => a.createdAt - b.createdAt);
  const byId = new Map<string, CadmiumArticle>();
  for (const article of flat) {
    byId.set(article.articleId, article);
  }
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
};

// CLBF · the FIRST folder-tree instance rides createLiveBulletin (aggregationMode 'folder-tree').
// The factory composes the SAME three pieces — the STCP relay config (single-source for both
// principles), the relay principle factory (per-instance closure bundle), and the BSE LIST/DETAIL
// registration. The folder-tree slots (watchDir, excludeBasenames, mergePayloads, aggregateWritePath)
// arm armFolderTreeWatch + readAndDispatchFolderTree; the single-file jsonPath/basename are
// satisfied by the aggregate path (the merge writes it · the BSE LIST reads it · Option A).
//
// Base = Huirth-only quality; Relay = cadmiumSetTopicBulletin (in actionExchange). payloadIdentity
// OMITTED — arrays have no monotonic scalar identity; merges are infrequent + idempotent.
export const cadmiumTopicBulletinLiveBulletin = createLiveBulletin<CadmiumArticle[]>({
  aggregationMode: 'folder-tree',
  // single-file slots: the aggregate the merge writes + the BSE LIST reads (Option A · also the
  // jsonPath the helper's single-file readAndDispatchSbis / readCurrentFromDisk fall back to).
  jsonPath: CADMIUM_TOPIC_BULLETIN_AGGREGATE_PATH,
  basename: CADMIUM_TOPIC_BULLETIN_JSON_BASENAME,
  // folder-tree slots:
  watchDir: CADMIUM_FRONTIER_DIR_PATH,
  // EXCLUDE the aggregate itself so the merge never re-folds its own output (would double-count).
  excludeBasenames: [CADMIUM_TOPIC_BULLETIN_JSON_BASENAME],
  mergePayloads: mergeTopicArticles,
  aggregateWritePath: CADMIUM_TOPIC_BULLETIN_AGGREGATE_PATH,
  // parsePayload parses a SINGLE child file → one-element CadmiumArticle[]; mergePayloads flattens.
  parsePayload: parseTopicArticleFile,
  emptyPayload: EMPTY_TOPIC_BULLETIN,
  baseActionCreator: (topicBulletin) =>
    cadmiumSetTopicBulletinHuirthBase.actionCreator({ topicBulletin }) as AnyAction,
  relayActionCreator: (topicBulletin) =>
    cadmiumSetTopicBulletin.actionCreator({ topicBulletin }) as AnyAction,
  logTag: '[Cadmium OkMonitor · STCP topicBulletin]',
  // BSE LIST/DETAIL — reads the materialised aggregate (a CadmiumArticle[] · SAME parser as Targeted).
  listRoute: '/cadmium-topic-bulletin',
  detailRoute: '/cadmium-topic-bulletin/:id',
  endpointJsonPath: CADMIUM_TOPIC_BULLETIN_AGGREGATE_PATH,
  endpointParse: parseResearchBulletin,
  idField: 'articleId',
});

// STABLE EXPORT — the shared STCP relay config. Both principles (cadmiumOkMonitor folder-tree arm +
// cadmiumTopicBulletinStcpRelay SMRP/BOCR) import this exact object by name (the config shape is
// byte-identical to the researchBulletin relay config · the folder-tree slots ride alongside).
export const CADMIUM_TOPIC_BULLETIN_RELAY_CONFIG: StcpComponentRelayConfig<CadmiumArticle[]> =
  cadmiumTopicBulletinLiveBulletin.relayConfig;

// The relay principle factory (per-instance STCP closure bundle) + the pre-bound BSE registration.
export const cadmiumTopicBulletinStcpRelayPrincipleFactory =
  cadmiumTopicBulletinLiveBulletin.stcpRelayPrincipleFactory;
export const registerTopicBulletinEndpoints =
  cadmiumTopicBulletinLiveBulletin.registerEndpoints;
