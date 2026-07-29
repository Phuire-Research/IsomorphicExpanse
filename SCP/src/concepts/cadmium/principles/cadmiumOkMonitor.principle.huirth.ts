/**
 * cadmiumOkMonitor Principle — Huirth Deployment · C3-D3-b SCSF
 *
 * Independent JSONL :OK: monitor for the running Cadmium session.
 *
 * NCEC-SAFE (HARD CONSTRAINT): this plan is its OWN independent two-stage plan.
 * It is NOT the scsBridge transcript watcher. It NEVER adds a dispatch /
 * iterateStage / conclude to scsBridgeSessionTranscriptWatcher.principle.huirth.ts
 * Stage 2 (that Stage is NCEC-pure by construction; touching it risks DELETED-PLAN
 * halting). Here, in this principle's OWN plan, dispatch is fully legal.
 *
 * Detection seam (S4 Viridian SCSF §Detection Point, layer 2 · Huirth-side feedback):
 *   The running Cadmium Claude Code session reads an injected `SCS:<Aspect>` directive
 *   (taught by base skeleton §7), executes the Cascade behavior directly (file writes),
 *   and responds with a `SCS:<Aspect>:OK:<summary>` confirmation line. THIS principle
 *   monitors Cadmium's own JSONL via extractLastTurnSnippet (lastTurnExtraction.model.ts),
 *   scans transcriptLastModelOutput for the `:OK:` line, and dispatches the appropriate
 *   suiteCascade quality — in this principle's own (non-NCEC) plan.
 *
 * Aspect → action map (C3 MVP):
 *   SCS:Diamond:OK:      → dispatch suiteCascade Base+Relay cascade setter (the Huirth-side
 *                          analog of the client `suiteCascadeSetCascadeJson` quality · MVP
 *                          passes cascadeJson=null so the WCJF watcher re-reads from disk).
 *   SCS:Research:OK:     → no dispatch · WCJF watcher auto-detects the written Markdown file.
 *   SCS:TopicUpdate:OK:  → no dispatch · WCJF watcher auto-detects topics.json (manifest).
 *   SCS:Summarize:OK: / SCS:Onboard:OK: / SCS:Cascade:OK: → response-only · no dispatch.
 *
 * Deck-type solution (read-before-write · biggest tsc risk):
 *   Type params cast against SuiteCascadeHuirthQualities/State (this principle's dispatch
 *   home — the suiteCascade Huirth concept it registers on). The deck extends
 *   SuiteCascadeHuirthDeck (suiteCascade selectors + dispatch) WITH the scsBridge concept
 *   slot (sessionsList read) — copied EXACTLY from scsBridge.type ScsBridgeHuirthDeck shape
 *   (Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>). Both concepts are co-muxified
 *   in the Huirth muxium (huirth.concept.ts: createScsBridgeHuirthConcept +
 *   createSuiteCascadeHuirthConcept), so d.scsBridge.k.* and d.suiteCascade.e.* are both live.
 *
 * Patterns:
 *   chokidar arm · extractLastTurnSnippet · resolveClaudeProjectDir (CSJP Path-B encoding)
 *   lastProcessedLine closure guard (re-dispatch suppression · NEW-:OK:-only)
 *   SLSF (Stage-Level-Selector-Fire) · Stage-2 selector-reactive on sessionsList
 *
 * Citation: scsBridgeSessionTranscriptWatcher.principle.huirth.ts (chokidar arm · NCEC discipline · deck-type shape).
 * Citation: suiteCascadeJsonWatcher.principle.huirth.ts (Stage-1 muxiumKick bootstrap · SBIS Base→Relay dispatch order).
 * Citation: lastTurnExtraction.model.ts (extractLastTurnSnippet · resolveClaudeProjectDir).
 * Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D3-b · CADMIUM-C3-S4-VIRIDIAN-SCSF.md §Q4 RISK-2 (NCEC).
 */
import type { PrincipleFunction, Concept, AnyAction } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import {
  extractLastTurnSnippet,
  resolveClaudeProjectDir,
} from '../../../lib/bridge/lastTurnExtraction.model';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeHuirthQualities,
  SuiteCascadeHuirthDeck,
  Cascade,
} from '../../suiteCascade/suiteCascade.type';
import type {
  ScsBridgeHuirthState,
  ScsBridgeHuirthQualities,
} from '../../scsBridge/scsBridge.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import {
  DEFAULT_CADMIUM_DESIGNATION_NAME,
  CADMIUM_RI_DIR_BASENAME,
  CADMIUM_NON_RESEARCH_JSON_BASENAMES,
} from '../cadmium.type';
import type { CadmiumArticle, CadmiumTopic, MenuStage, CadmiumHuirthConcept } from '../cadmium.type';
// STCP · the reusable component-agnostic relay helper + the single shared menu config (SD-6).
// The dir-watch+filter (inode-swap-immune) + SBIS Base→Relay + JDIS unlink→Idle now live in the
// helper; this principle owns only the FSWatcher handle (for teardown) and supplies `nextA`.
// Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.2 (W1 · OkMonitor → helper dir-watch).
import { createStcpComponentRelay } from '../../../model/stcpComponentRelay.model';
import { CADMIUM_MENU_RELAY_CONFIG } from '../cadmiumMenuRelay.config';
// Diamond RFI · 2nd STCP · the topics relay config (single-source). This OkMonitor owns the
// topics dir-watch arm (mirrors the menu arm); the topics SMRP/BOCR live in
// cadmiumTopicsStcpRelay.principle.huirth.ts. The legacy topics direct-broadcast function
// is REMOVED (REFINE-1) — the STCP topics instance owns topics.json now.
import { CADMIUM_TOPICS_RELAY_CONFIG } from '../cadmiumTopicsRelay.config';
// Diamond RAR · 3rd STCP · the researchBulletin relay config (targeted/researchBulletin.json
// dir-watch + SBIS Base→Relay + JDIS unlink→Idle · same helper as the menu/topics arms).
import { CADMIUM_RESEARCH_BULLETIN_RELAY_CONFIG } from '../cadmiumResearchBulletinRelay.config';
// Diamond TRP · 4th STCP · the targeted-menu relay config (targeted/targeted-menu.json dir-watch +
// SBIS Base→Relay + JDIS unlink→Idle · same helper as the menu/topics/researchBulletin arms). The
// targeted-menu SMRP/BOCR live in cadmiumTargetedMenuStcpRelay.principle.huirth.ts.
import { CADMIUM_TARGETED_MENU_RELAY_CONFIG } from '../cadmiumTargetedMenuRelay.config';
// Topic Live Bulletin · the FIRST folder-tree STCP instance — built on createLiveBulletin. This
// OkMonitor owns the frontier/ folder-tree-watch arm (armFolderTreeWatch · recursive · re-merges
// every child JSON on any write); the topicBulletin SMRP/BOCR live in
// cadmiumTopicBulletinStcpRelay.principle.huirth.ts. Sourced from the factory's per-instance closure
// bundle (independent FSWatcher handle) so the arm + the relay never share one watcher.
import { cadmiumTopicBulletinStcpRelayPrincipleFactory } from '../cadmiumTopicBulletinRelay.config';
// Macro AB · ARJP/AWCR · the paired-JSON preview shape the PRPL worker writes (JSON-write =
// article complete · MD-first / JSON-last). This watcher reads + JSON.parses the
// `<slug>-<ts>.json` as ResearchArticleMeta, reads the sibling `<slug>-<ts>.md`, and broadcasts
// a CadmiumArticle (preview threaded from the meta). Type-only import (no I/O / no Stratimux).
import type { ResearchArticleMeta } from '../cadmiumResearchVermillion.model';
// C4-D1 WNPM · the client article quality action-creator reused to BUILD the relay action the
// OkMonitor broadcasts on a written `.md` article. The quality card imports only stratimux +
// types (server-safe — no browser deps) and carries the registered type string ('Cadmium Register
// Article') so each broadcast action reduces into CadmiumLanding's page-muxium cadmium concept.
// Mirrors the suiteCascade SMRP relay precedent (explicit webSocketServer broadcast). Diamond RFI ·
// REFINE-1: the cadmiumSetTopics import is REMOVED here — the 2nd STCP topics instance
// (cadmiumTopicsRelay.config.ts) owns the topics relay action-creator now.
import { cadmiumRegisterArticle } from '../qualities/cadmiumRegisterArticle.quality.client';
// Macro SM · IAJW menu relay moved to the STCP helper (createStcpComponentRelay) +
// CADMIUM_MENU_RELAY_CONFIG. The cadmiumSetMenuStage relay action-creator + parseMenuStage now
// live in cadmiumMenuRelay.config.ts (single-source · SD-6) — no longer imported directly here.

// The Cadmium designation Name — the session whose JSONL this monitor watches.
const CADMIUM_DESIGNATION_NAME = DEFAULT_CADMIUM_DESIGNATION_NAME;

// Macro SM · IAJW · the SCS root the Cadmium RI dir (Cascades/Extended/<name>/) resolves
// against. Mirrors the SuiteCascade JSON watcher's SCS_BRIDGE_ROOT_OVERRIDE discipline so the
// menu.json path lands at the SAME live `Cascades/` the MCW watcher + the Cascade Registry use
// (dev:self → SCS root; production → install cwd). Zero-regression fallback to process.cwd().
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

// :OK: confirmation line pattern (first line · multiline-safe). Captures the Aspect.
const SCS_OK_PATTERN = /^SCS:([A-Za-z]+):OK:/m;

// chokidar debounce for the Cadmium JSONL re-read (mirror the transcript watcher bearing).
const OK_MONITOR_DEBOUNCE_MS = 200;

// ============================================
// DECK TYPE — suiteCascade dispatch home + scsBridge sessionsList read
// ============================================
//
// Copied EXACTLY from the two existing Huirth deck shapes:
//   SuiteCascadeHuirthDeck (suiteCascade.type) supplies the dispatch concept + muxium.
//   ScsBridgeHuirthDeck (scsBridge.type) supplies the scsBridge concept slot — replicated
//   here as the same Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities> entry so the
//   sessionsList selector is read-accessible. Both are co-muxified in the Huirth muxium.
export type CadmiumOkMonitorDeck = SuiteCascadeHuirthDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
  // C4-D1 WNPM/TLCR · webSocketServer is co-muxified in the Huirth muxium (huirth.concept.ts
  // createWebSocketServerConcept). Its broadcast quality (webSocketServerAppendToActionQue) is
  // how this principle relays the article/topics actions to all connected clients — the same
  // explicit-broadcast mechanism the suiteCascade SMRP uses. Replicated as the same Concept
  // shape so d.webSocketServer.e.webSocketServerAppendToActionQue is dispatch-accessible.
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
  // STCP · the NEW thin cadmium Huirth concept (co-muxified in huirth.concept.ts) holds the
  // menuStage Base. The IAJW dir-watch SBIS dispatches d.cadmium.e.cadmiumSetMenuStageHuirthBase
  // via nextA; the deck slot keeps that dispatch type-checked. Citation: STCP blueprint §2.2.
  cadmium: CadmiumHuirthConcept;
};

export type CadmiumOkMonitorPrincipleType = PrincipleFunction<
  SuiteCascadeHuirthQualities,
  CadmiumOkMonitorDeck,
  SuiteCascadeHuirthState
>;

export const cadmiumOkMonitorPrinciple: CadmiumOkMonitorPrincipleType = ({ d_, plan, nextA }) => {
  console.log('[Cadmium OkMonitor] Principle started · NCEC-independent :OK: monitor');

  // WDLS · single watcher + timer in closure (FSWatcher is not JSON-safe · never in state).
  let okWatcher: FSWatcher | null = null;
  let okDebounceTimer: NodeJS.Timeout | null = null;
  let armedJsonlPath: string | null = null;

  // lastProcessedLine closure guard — the last transcriptLastModelOutput we dispatched on.
  // Only dispatch when the :OK: line is NEW (different from the prior processed value) so the
  // selector-reactive Stage 2 does not re-dispatch on every beat.
  let lastProcessedLine: string | null = null;

  // ============================================
  // C4-D1 · WNPM/TLCR — Cadmium folder watcher (SEPARATE handle from the JSONL watcher)
  // ============================================
  //
  // A DISTINCT chokidar watcher on Cascades/Extended/Cadmium Researcher/ (the converged RI dir ·
  // SCSNM · supersedes the old Cascades/Cadmium/) that detects written Markdown articles (*.md)
  // and topics.json. This lives in THIS principle's OWN plan (NCEC-safe · the transcript watcher
  // Stage 2 is never touched). On file events it reads the file from disk and broadcasts the
  // matching client action (cadmiumRegisterArticle / cadmiumSetTopics) via
  // webSocketServerAppendToActionQue — the explicit-broadcast relay (suiteCascade SMRP precedent).
  // The RI dir is resolved against SCS_ROOT (the SAME live Cascades/ the menu + research-JSON
  // watchers + the Cascade Registry use).
  let cadmiumFolderWatcher: FSWatcher | null = null;
  let cadmiumWatchArmed = false;

  // ============================================
  // STCP · IAJW menu relay — DIRECTORY-watch (inode-swap-immune) via the shared helper
  // ============================================
  //
  // The prior single-FILE menu.json watch (armMenuWatcher) was orphaned on inode-swap (atomic
  // temp+rename swaps the file's inode; a single-file watch loses it) AND its unlink handler
  // pushed NOTHING (page held stale · JDIS gap). Both are fixed by the STCP helper: it watches
  // the DIRECTORY (stable inode) + basename-filters to menu.json (survives the swap · proven by
  // armCadmiumFolderWatcher below), and on unlink SBIS-dispatches EMPTY_MENU_STAGE (JDIS Idle).
  //
  // This principle owns ONLY the FSWatcher handle (for teardown) + supplies `nextA`. The helper
  // owns the mechanism (add/change → SBIS Base→Relay · unlink → JDIS Idle · identity-suppression
  // by stageIndex). The Base dispatch (cadmiumSetMenuStageHuirthBase) keeps d.cadmium.k.menuStage
  // authoritative; the Relay (cadmiumSetMenuStage) broadcasts to clients. NCEC-safe — own plan ·
  // the transcript-watcher Stage 2 is never touched. Config single-source: CADMIUM_MENU_RELAY_CONFIG.
  // Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.2 · STCP-S4-VIRIDIAN-VERIFY.md REFINE-1 (armDirectoryWatch(nextA)).
  let menuWatcher: FSWatcher | null = null;
  const menuRelay = createStcpComponentRelay<MenuStage>(CADMIUM_MENU_RELAY_CONFIG);

  // ============================================
  // Diamond RFI · 2nd STCP · topics dir-watch (inode-swap-immune) via the shared helper
  // ============================================
  //
  // The topics.json producer rebuilt on the STCP helper (decoupled from the menu instance ·
  // topics.json is the only coupling surface · TSSL). This principle owns ONLY the FSWatcher
  // handle (teardown) + supplies `nextA`; the helper owns add/change → SBIS Base→Relay
  // (cadmiumSetTopicsHuirthBase → cadmiumSetTopics) · unlink → JDIS Idle (EMPTY_TOPICS). The Base
  // dispatch keeps d.cadmium.k.topics authoritative; the Relay (cadmiumSetTopics · EXISTING ·
  // in actionExchange) broadcasts to clients → the existing CadmiumBulletin Research Frontier zone
  // re-renders. REFINE-1: this SUPERSEDES the legacy topics direct-broadcast function.
  let topicsWatcher: FSWatcher | null = null;
  const topicsRelay = createStcpComponentRelay<CadmiumTopic[]>(CADMIUM_TOPICS_RELAY_CONFIG);

  // ============================================
  // Diamond RAR · 3rd STCP · researchBulletin dir-watch (inode-swap-immune) via the shared helper
  // ============================================
  //
  // The targeted/researchBulletin.json producer rebuilt on the SAME STCP helper (decoupled from the
  // menu/topics instances · researchBulletin.json is the only coupling surface). This principle owns
  // ONLY the FSWatcher handle (teardown) + supplies `nextA`; the helper owns add/change → SBIS
  // Base→Relay (cadmiumSetResearchBulletinHuirthBase → cadmiumSetResearchBulletin) · unlink → JDIS
  // Idle (EMPTY_RESEARCH_BULLETIN). The targeted/ subdir sits BELOW the AWCR depth:0 research watch,
  // so no cross-fire (Option B). Citation: RAR-DIAMOND-WGB.md §W3.
  let researchBulletinWatcher: FSWatcher | null = null;
  const researchBulletinRelay = createStcpComponentRelay<CadmiumArticle[]>(CADMIUM_RESEARCH_BULLETIN_RELAY_CONFIG);

  // ============================================
  // Diamond TRP · 4th STCP · targeted-menu dir-watch (inode-swap-immune) via the shared helper
  // ============================================
  //
  // The targeted/targeted-menu.json producer (the Anchor-authored targeted-research live menu) on the
  // SAME STCP helper (decoupled from the menu/topics/researchBulletin instances). This principle owns
  // ONLY the FSWatcher handle (teardown) + supplies `nextA`; the helper owns add/change → SBIS
  // Base→Relay (cadmiumSetTargetedMenuStageHuirthBase → cadmiumSetTargetedMenuStage) · unlink → JDIS
  // Idle (EMPTY_MENU_STAGE). The targeted/ subdir sits BELOW the AWCR depth:0 research watch, so no
  // cross-fire (mirrors the researchBulletin instance · R4). Citation: TRP-DIAMOND-WGB.md §W3.
  let targetedMenuWatcher: FSWatcher | null = null;
  const targetedMenuRelay = createStcpComponentRelay<MenuStage>(CADMIUM_TARGETED_MENU_RELAY_CONFIG);

  // ============================================
  // Topic Live Bulletin · FIRST folder-tree STCP · frontier/ recursive merge via createLiveBulletin
  // ============================================
  //
  // The FIRST folder-tree STCP instance. Where the menu/topics/researchBulletin/targeted-menu arms
  // watch a single JSON file (armDirectoryWatch · depth:0 · basename-filter), THIS arm watches the
  // frontier/ dir RECURSIVELY (armFolderTreeWatch · depth:undefined). On any child .json
  // add/change/unlink it re-reads every frontier/<slug>/<slug>-<ts>.json, parses each into a
  // one-element CadmiumArticle[], merges (dedup by articleId · newest-first), materialises the
  // aggregate (frontier/topicBulletin.json · AMFJ · excluded from the merge), and SBIS-dispatches
  // Base→Relay (cadmiumSetTopicBulletinHuirthBase → cadmiumSetTopicBulletin). This principle owns
  // ONLY the FSWatcher handle (teardown · H3 no fd leak) + supplies `nextA`. The frontier/ subdir
  // sits BELOW the AWCR depth:0 research watch, so no cross-fire (mirrors the targeted/ subdir).
  // Citation: DIAMOND-TOPIC-LIVE-BULLETIN-WGB.md §W3 composition point.
  let topicBulletinWatcher: FSWatcher | null = null;
  const topicBulletinRelay = cadmiumTopicBulletinStcpRelayPrincipleFactory();

  // ============================================
  // Macro AB · ARJP/AWCR — research-article JSON watcher (SEPARATE handle · paired-JSON signal)
  // ============================================
  //
  // A DISTINCT chokidar watcher on the Cadmium RI dir's research output
  // (Cascades/Extended/<CADMIUM_RI_DIR_BASENAME>/*.json · the DPASL Cascade Registry substrate).
  // The PRPL worker writes `<slug>-<ts>.md` FIRST then `<slug>-<ts>.json` LAST — the JSON-write
  // is the article-complete signal (ARJP · MD-first / JSON-last). On a JSON add/change this
  // watcher JSON.parses it as ResearchArticleMeta, reads the sibling `<slug>-<ts>.md` for the
  // body, builds a CadmiumArticle (preview threaded from the meta), and broadcasts
  // cadmiumRegisterArticle via webSocketServerAppendToActionQue — the SAME explicit-broadcast
  // relay the article/topics/menu broadcasts use (NCEC-safe · this principle's OWN plan · the
  // transcript-watcher Stage 2 is never touched). lastSeenResearchJson suppresses re-broadcast on
  // an identical JSON path+mtime (NEW-only · mirrors lastProcessedLine / lastMenuStageIndex).
  // menu.json is excluded (CADMIUM_NON_RESEARCH_JSON_BASENAMES) so the SM IAJW menu watcher and
  // this AB AWCR watcher never cross-fire on the same `.json`.
  let researchJsonWatcher: FSWatcher | null = null;
  let researchJsonWatchArmed = false;
  // lastSeenResearchJson · keyed by resolved JSON path → last broadcast mtimeMs (re-broadcast
  // suppressed when a path re-fires with an unchanged mtime · upsert-by-filePath in the reducer
  // makes a genuine re-write a correct replace).
  const lastSeenResearchJson = new Map<string, number>();

  // Build a CadmiumArticle from a Markdown file: id = filePath (stable upsert key), title =
  // first `# ` heading (fallback = basename), markdownContent = raw file body.
  // Macro AB · ARJP — an optional `meta` (the paired-JSON ResearchArticleMeta) threads the stored
  // preview/topic/slug/sourceCount through, and the meta `title` (if present) wins over the
  // Markdown-heading fallback (the worker authored a card-facing headline in the JSON).
  const buildArticle = (
    filePath: string,
    markdownContent: string,
    meta?: ResearchArticleMeta,
  ): CadmiumArticle => {
    const titleLine = markdownContent.split('\n').find((l) => /^#\s+/.test(l));
    const fallbackTitle = titleLine
      ? titleLine.replace(/^#\s+/, '').trim()
      : path.basename(filePath, '.md');
    const article: CadmiumArticle = {
      articleId: filePath,
      title: meta?.title?.trim() ? meta.title.trim() : fallbackTitle,
      filePath,
      markdownContent,
      createdAt: Date.now(),
    };
    if (meta) {
      if (typeof meta.preview === 'string') article.preview = meta.preview;
      if (typeof meta.topic === 'string') article.topic = meta.topic;
      if (typeof meta.slug === 'string') article.slug = meta.slug;
      if (typeof meta.sourceCount === 'number') article.sourceCount = meta.sourceCount;
    }
    return article;
  };

  // Read a written Markdown article and broadcast cadmiumRegisterArticle to all clients.
  const readAndBroadcastArticle = async (d: any, mdPath: string): Promise<void> => {
    try {
      const markdownContent = await fsp.readFile(mdPath, 'utf-8');
      if (!markdownContent.trim()) return; // skip empty/partial writes
      const article = buildArticle(mdPath, markdownContent);
      const action = cadmiumRegisterArticle.actionCreator({ article }) as AnyAction;
      d.webSocketServer.e.webSocketServerAppendToActionQue({ actionQue: [action] });
      console.log('[Cadmium OkMonitor] WNPM · article broadcast · path=', mdPath, '· title=', article.title);
    } catch (err) {
      console.warn('[Cadmium OkMonitor] readAndBroadcastArticle failed · path=', mdPath, '· err=', String(err));
    }
  };

  // Diamond RFI · REFINE-1 — the legacy topics direct-broadcast function is REMOVED. The 2nd STCP
  // topics instance (CADMIUM_TOPICS_RELAY_CONFIG · topicsRelay.armDirectoryWatch +
  // cadmiumTopicsStcpRelay SMRP/BOCR) owns topics.json now (SBIS Base→Relay · JDIS unlink→Idle).
  // Keeping the old direct-broadcast would double-broadcast on every topics.json write.

  // Arm the Cadmium-folder watcher once (idempotent). Resolves the converged RI dir
  // (Cascades/Extended/<CADMIUM_RI_DIR_BASENAME>) against SCS_ROOT — the SAME live Cascades/ the
  // menu + research-JSON watchers + the Cascade Registry use (SCSNM convergence · supersedes the
  // old Cascades/Cadmium/). Watches *.md (articles) + topics.json (TLCR). depth:0 — flat folder.
  const armCadmiumFolderWatcher = (d: any): void => {
    if (cadmiumWatchArmed) return; // idempotent — already armed.
    const cadmiumDir = path.resolve(SCS_ROOT, 'Cascades', 'Extended', CADMIUM_RI_DIR_BASENAME);
    try {
      cadmiumFolderWatcher = chokidarWatch(cadmiumDir, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
        depth: 0,
      });
      // Diamond RFI · REFINE-1 — the topics.json branch is REMOVED (the 2nd STCP topics instance
      // owns topics.json now). This folder watcher handles ONLY the `.md` article broadcasts.
      const handleFileEvent = (changedPath: string): void => {
        const resolved = path.resolve(changedPath);
        const base = path.basename(resolved);
        if (/\.md$/i.test(resolved) && !/^(DIAMOND-TIER-|ONYX-TIER-)/.test(base)) {
          void readAndBroadcastArticle(d, resolved);
        }
      };
      cadmiumFolderWatcher.on('add', handleFileEvent);
      cadmiumFolderWatcher.on('change', handleFileEvent);
      cadmiumFolderWatcher.on('error', (err) => {
        console.warn('[Cadmium OkMonitor] Cadmium-folder chokidar error · err=', err);
      });
      cadmiumWatchArmed = true;
      console.log('[Cadmium OkMonitor] WNPM/TLCR · Cadmium-folder watcher armed on', cadmiumDir);
    } catch (err) {
      console.warn('[Cadmium OkMonitor] Cadmium-folder arm failed · dir=', cadmiumDir, '· err=', err);
    }
  };

  // Macro AB · ARJP/AWCR — schema-aware parse of a research-article JSON into ResearchArticleMeta.
  // Returns null on empty / parse-fail / missing required fields (resilient · the watcher stays
  // alive until a valid paired JSON lands). "Aware": only a well-formed meta (string title + slug
  // + topic + timestamp + preview) is relayed; malformed / partial writes are ignored.
  const parseResearchMeta = (raw: string): ResearchArticleMeta | null => {
    if (!raw.trim()) return null; // skip empty / partial writes
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[Cadmium OkMonitor] AWCR · research JSON parse failed · ignoring (partial write?)');
      return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Record<string, unknown>;
    if (
      typeof p.title !== 'string'
      || typeof p.slug !== 'string'
      || typeof p.topic !== 'string'
      || typeof p.timestamp !== 'string'
      || typeof p.preview !== 'string'
    ) {
      console.warn('[Cadmium OkMonitor] AWCR · research JSON missing required fields · ignoring');
      return null;
    }
    return {
      title: p.title,
      slug: p.slug,
      topic: p.topic,
      timestamp: p.timestamp,
      preview: p.preview,
      sourceCount: typeof p.sourceCount === 'number' ? p.sourceCount : undefined,
    };
  };

  // Macro AB · ARJP/AWCR — derive the sibling Markdown path from a research JSON path. The pair
  // shares the same `<slug>-<ts>` stem (cadmiumResearchVermillion.model.ts Step 4): swap the
  // trailing `.json` for `.md`.
  const siblingMarkdownPath = (jsonPath: string): string =>
    jsonPath.replace(/\.json$/i, '.md');

  // Macro AB · ARJP/AWCR — read the paired JSON (completion signal) + its sibling Markdown, build
  // a preview-enriched CadmiumArticle, and broadcast cadmiumRegisterArticle to all clients. The
  // article's stable upsert key is the SIBLING MARKDOWN path (filePath) — the same key the legacy
  // WNPM folder-watcher `.md` path uses — so a bare-Markdown broadcast and this enriched broadcast
  // upsert into ONE card (the enriched one wins · reducer replaces by filePath). NEW-only guard
  // via lastSeenResearchJson (path → mtimeMs). Broadcast is the explicit
  // webSocketServerAppendToActionQue relay (same as article/topics/menu) — NOT a stage-body
  // dispatch (NCEC-safe). The sibling `.md` is REQUIRED (ARJP pairing invariant); if it is absent
  // the JSON is treated as a partial write and skipped (the worker writes MD first).
  const readAndBroadcastResearchArticle = async (d: any, jsonPath: string): Promise<void> => {
    try {
      let jsonRaw: string;
      try {
        jsonRaw = await fsp.readFile(jsonPath, 'utf-8');
      } catch {
        return; // ENOENT — JSON vanished between event and read · skip.
      }
      const meta = parseResearchMeta(jsonRaw);
      if (!meta) return;

      // mtime guard — suppress a re-fire on an unchanged JSON (same path + mtime already done).
      let mtimeMs = 0;
      try {
        mtimeMs = (await fsp.stat(jsonPath)).mtimeMs;
      } catch {
        /* stat best-effort — fall through with mtimeMs=0 */
      }
      if (lastSeenResearchJson.get(jsonPath) === mtimeMs && mtimeMs !== 0) {
        return; // identical JSON already broadcast · suppress.
      }

      const mdPath = siblingMarkdownPath(jsonPath);
      let markdownContent: string;
      try {
        markdownContent = await fsp.readFile(mdPath, 'utf-8');
      } catch {
        // ARJP pairing invariant: JSON without a sibling MD = partial write (MD written first,
        // so this should not happen on a complete arc). Skip · stay armed for the change event.
        console.warn('[Cadmium OkMonitor] AWCR · paired Markdown absent · skipping · md=', mdPath);
        return;
      }
      if (!markdownContent.trim()) return; // empty/partial MD · skip.

      lastSeenResearchJson.set(jsonPath, mtimeMs);
      const article = buildArticle(mdPath, markdownContent, meta);
      const action = cadmiumRegisterArticle.actionCreator({ article }) as AnyAction;
      d.webSocketServer.e.webSocketServerAppendToActionQue({ actionQue: [action] });
      console.log(
        '[Cadmium OkMonitor] AWCR · research article broadcast · json=', jsonPath,
        '· title=', article.title, '· topic=', article.topic, '· sources=', article.sourceCount,
      );
    } catch (err) {
      console.warn('[Cadmium OkMonitor] readAndBroadcastResearchArticle failed · path=', jsonPath, '· err=', String(err));
    }
  };

  // Macro AB · ARJP/AWCR — arm the research-JSON watcher once (idempotent). Resolves the converged
  // Cadmium RI dir (Cascades/Extended/<CADMIUM_RI_DIR_BASENAME>) against SCS_ROOT — the SAME live
  // Cascades/ the menu + folder watchers + the Cascade Registry use. Watches *.json at depth:0
  // (flat RI dir). ignoreInitial:false so already-present research JSON re-broadcasts on arm (a
  // page reload re-hydrates the Bulletin). menu.json is excluded so the SM IAJW watcher owns it.
  const armResearchJsonWatcher = (d: any): void => {
    if (researchJsonWatchArmed) return; // idempotent — already armed.
    const riDir = path.resolve(SCS_ROOT, 'Cascades', 'Extended', CADMIUM_RI_DIR_BASENAME);
    try {
      researchJsonWatcher = chokidarWatch(riDir, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
        depth: 0,
      });
      const handleResearchJsonEvent = (changedPath: string): void => {
        const resolved = path.resolve(changedPath);
        if (!/\.json$/i.test(resolved)) return; // only *.json (the ARJP completion signal).
        const base = path.basename(resolved);
        // Exclude menu.json (and any other non-research JSON) — the SM IAJW watcher owns it.
        if (CADMIUM_NON_RESEARCH_JSON_BASENAMES.includes(base)) return;
        void readAndBroadcastResearchArticle(d, resolved);
      };
      researchJsonWatcher.on('add', handleResearchJsonEvent);
      researchJsonWatcher.on('change', handleResearchJsonEvent);
      researchJsonWatcher.on('error', (err) => {
        console.warn('[Cadmium OkMonitor] AWCR · research-JSON chokidar error · err=', err);
      });
      researchJsonWatchArmed = true;
      console.log('[Cadmium OkMonitor] AWCR · research-JSON watcher armed on', riDir);
    } catch (err) {
      console.warn('[Cadmium OkMonitor] AWCR · research-JSON arm failed · dir=', riDir, '· err=', err);
    }
  };

  // STCP · IAJW menu relay — the dir-watch + SBIS Base→Relay + JDIS unlink→Idle now live in the
  // helper (menuRelay · CADMIUM_MENU_RELAY_CONFIG). The prior inline parseMenuStage /
  // readAndBroadcastMenuStage / armMenuWatcher / lastMenuStageIndex are SUPERSEDED:
  //   - parseMenuStage → CADMIUM_MENU_RELAY_CONFIG.parsePayload (cadmiumMenuRelay.config.ts).
  //   - read+broadcast → menuRelay.readAndDispatchSbis(nextA) (Base→Relay · identity-suppressed).
  //   - arm → menuRelay.armDirectoryWatch(nextA) (directory-watch · basename-filter · inode-safe).
  //   - lastMenuStageIndex → the helper's closure-scoped lastIdentity (config.payloadIdentity).
  //   - unlink → menuRelay.dispatchIdle(nextA) inside armDirectoryWatch (JDIS · was a NO-OP).
  // The arm call now lives in Stage 1 below: `menuWatcher = menuRelay.armDirectoryWatch(nextA)`.

  // The async :OK: scan, defined so it can re-derive `d` from the latest stage closure.
  // Reads Cadmium's JSONL → extractLastTurnSnippet → scan for SCS:<Aspect>:OK: → route.
  // `d` is the stage-supplied runtime deck (typed `any` — the action creators d.suiteCascade.e.*
  // are validated at runtime by CadmiumOkMonitorDeck · mirrors suiteCascadeJsonWatcher makeOps).
  // Dispatch is via `nextA` (async-safe action-queue append · the JsonWatcher idiom for
  // read-then-dispatch from an async/chokidar callback outside the stage body).
  const scanAndRoute = async (
    d: any,
    cwd: string,
    claudeSessionId: string,
  ): Promise<void> => {
    try {
      const sessionDir = resolveClaudeProjectDir(cwd);
      const snippet = await extractLastTurnSnippet(sessionDir, claudeSessionId);
      if (!snippet) return;
      const modelOutput = snippet.transcriptLastModelOutput;
      const match = SCS_OK_PATTERN.exec(modelOutput);
      if (!match) return;

      // Identify the :OK: line itself (first line) for the NEW-only guard.
      const okLine = modelOutput.split('\n').find((l) => SCS_OK_PATTERN.test(l)) ?? match[0];
      if (okLine === lastProcessedLine) {
        // Already dispatched on this exact :OK: line — suppress re-dispatch.
        return;
      }
      lastProcessedLine = okLine;

      const aspect = match[1];
      console.log('[Cadmium OkMonitor] :OK: detected · aspect=', aspect, '· line=', okLine);

      if (aspect === 'Diamond') {
        // SCS:Diamond:OK: → re-sync the Cadmium cascade entry. The Huirth-side analog of the
        // client `suiteCascadeSetCascadeJson` quality is the Base+Relay cascade setter pair.
        // MVP: pass cascadeJson=null so the WCJF watcher re-reads the written Diamond from disk.
        const cascade: Cascade = {
          name: CADMIUM_DESIGNATION_NAME,
          cascadeDirectory: `Cascades/8_SUITES/${CADMIUM_DESIGNATION_NAME}/Cascades`,
          cascadeJson: null,
          activeCascadeFiles: [],
          missingCascadeJson: false,
        };
        // SBIS Base first (runs local Huirth reducer so server state is real), then Relay.
        nextA(
          d.suiteCascade.e.suiteCascadeSetCascadeHuirthBase({
            name: CADMIUM_DESIGNATION_NAME,
            cascade,
          }),
        );
        nextA(
          d.suiteCascade.e.suiteCascadeSetCascadeRelay({
            name: CADMIUM_DESIGNATION_NAME,
            cascade,
          }),
        );
        console.log('[Cadmium OkMonitor] Diamond :OK: → cascade re-sync dispatched (WCJF re-reads)');
      } else if (aspect === 'Research' || aspect === 'TopicUpdate') {
        // WCJF auto-detect — no direct dispatch needed; the SuiteCascade JSON watcher picks up
        // the written Markdown / topics.json file automatically.
        console.log('[Cadmium OkMonitor]', aspect, ':OK: → WCJF auto-detect · no dispatch');
      } else {
        // Summarize / Onboard / Cascade → response-only; no Cascade state update.
        console.log('[Cadmium OkMonitor]', aspect, ':OK: → response-only · no dispatch');
      }
    } catch (err) {
      console.warn('[Cadmium OkMonitor] scanAndRoute failed · err=', String(err));
    }
  };

  // Arm a chokidar watch on the resolved Cadmium JSONL path; debounce re-reads.
  // `d` is the stage-supplied runtime deck (typed `any` · JsonWatcher makeOps precedent).
  const armOkWatcher = (
    d: any,
    cwd: string,
    claudeSessionId: string,
  ): void => {
    const sessionDir = resolveClaudeProjectDir(cwd);
    const jsonlPath = path.join(sessionDir, `${claudeSessionId}.jsonl`);
    if (armedJsonlPath === jsonlPath) return; // idempotent — already armed on this path.

    // Tear down any prior watcher before re-arming (no handle leak).
    if (okDebounceTimer) {
      clearTimeout(okDebounceTimer);
      okDebounceTimer = null;
    }
    if (okWatcher) {
      try {
        okWatcher.close();
      } catch {
        /* already closed */
      }
      okWatcher = null;
    }

    try {
      okWatcher = chokidarWatch(jsonlPath, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
        depth: 0,
      });
      const handleEvent = (): void => {
        if (okDebounceTimer) clearTimeout(okDebounceTimer);
        okDebounceTimer = setTimeout(() => {
          void scanAndRoute(d, cwd, claudeSessionId);
        }, OK_MONITOR_DEBOUNCE_MS);
      };
      okWatcher.on('add', handleEvent);
      okWatcher.on('change', handleEvent);
      okWatcher.on('error', (err) => {
        console.warn('[Cadmium OkMonitor] chokidar error · err=', err);
      });
      armedJsonlPath = jsonlPath;
      console.log('[Cadmium OkMonitor] Armed on', jsonlPath);
    } catch (err) {
      console.warn('[Cadmium OkMonitor] arm failed · path=', jsonlPath, '· err=', err);
    }
  };

  // Resolve the running Cadmium session from sessionsList (suite8Name === Cadmium designation).
  const findCadmiumSession = (
    list: ScsBridgeHuirthState['sessionsList'],
  ): { cwd: string; claudeSessionId: string } | null => {
    for (const s of list) {
      if (s.suite8Name === CADMIUM_DESIGNATION_NAME && s.cwd && s.claudeSessionId) {
        return { cwd: s.cwd, claudeSessionId: s.claudeSessionId };
      }
    }
    return null;
  };

  // This principle's OWN plan — two stages, fully independent of the transcript watcher.
  const okMonitorPlan = plan('Cadmium OkMonitor (Huirth · independent · NCEC-safe)', ({ stage }) => [
    // Stage 1 · one-shot bootstrap: find the Cadmium session, arm the JSONL watcher, advance.
    stage(
      ({ d, dispatch }) => {
        console.log('[Cadmium OkMonitor] Stage 1 · bootstrap arm');
        // C4-D1 WNPM/TLCR · arm the Cadmium-folder watcher (session-independent · own plan).
        armCadmiumFolderWatcher(d);
        // STCP · IAJW · arm the menu.json DIRECTORY watch via the helper (inode-swap-immune ·
        // basename-filtered · own plan · NCEC-safe). The helper owns add/change→SBIS Base→Relay +
        // unlink→JDIS Idle internally; we supply `nextA` and hold the returned FSWatcher handle
        // for teardown. Idempotent guard: only arm once (re-entry on plan re-init would double-arm).
        if (!menuWatcher) {
          menuWatcher = menuRelay.armDirectoryWatch(nextA);
        }
        // Diamond RFI · 2nd STCP · arm the topics.json DIRECTORY watch via the helper (same
        // inode-swap-immune · basename-filtered · own plan · NCEC-safe path as the menu arm).
        if (!topicsWatcher) {
          topicsWatcher = topicsRelay.armDirectoryWatch(nextA);
          // C1 FIRST-LOAD CORRECTION — the helper hardcodes ignoreInitial:true (CDV-Break-A · NOT
          // settable per-call), so the arm alone does NOT hydrate an ALREADY-PRESENT topics.json
          // on page load OR bridge-restart. One-shot disk-read + SBIS dispatch covers both: read
          // topics.json now and dispatch Base→Relay (no-op if absent · ENOENT → null). BOCR then
          // backfills late-joining clients from the now-authoritative Huirth state.
          void topicsRelay.readAndDispatchSbis(nextA);
        }
        // Diamond RAR · 3rd STCP · arm the targeted/researchBulletin.json DIRECTORY watch via the
        // helper (same inode-swap-immune · basename-filtered · own plan · NCEC-safe path as the
        // menu + topics arms). Citation: RAR-DIAMOND-WGB.md §W3 composition point.
        if (!researchBulletinWatcher) {
          researchBulletinWatcher = researchBulletinRelay.armDirectoryWatch(nextA);
          // C1 FIRST-LOAD CORRECTION (S4 H4) — armDirectoryWatch hardcodes ignoreInitial:true, so
          // the arm alone does NOT hydrate an ALREADY-PRESENT targeted/researchBulletin.json on
          // load/restart. One-shot read + SBIS dispatch covers both (no-op if absent · ENOENT → null).
          void researchBulletinRelay.readAndDispatchSbis(nextA);
        }
        // Diamond TRP · 4th STCP · arm the targeted/targeted-menu.json DIRECTORY watch via the helper
        // (same inode-swap-immune · basename-filtered · own plan · NCEC-safe path as the menu + topics
        // + researchBulletin arms). Citation: TRP-DIAMOND-WGB.md §W3 composition point.
        if (!targetedMenuWatcher) {
          targetedMenuWatcher = targetedMenuRelay.armDirectoryWatch(nextA);
          // C1 FIRST-LOAD CORRECTION (R3 · NO MOCH endpoint for this stream) — armDirectoryWatch
          // hardcodes ignoreInitial:true, so the arm alone does NOT hydrate an ALREADY-PRESENT
          // targeted/targeted-menu.json on page-load OR bridge-restart. One-shot read + SBIS dispatch
          // covers both (no-op if absent · ENOENT → null). Mirrors the topics/researchBulletin arms.
          void targetedMenuRelay.readAndDispatchSbis(nextA);
        }
        // Topic Live Bulletin · FIRST folder-tree STCP · arm the frontier/ RECURSIVE folder-tree
        // watch via the factory's armFolderTreeWatch (depth:undefined · re-merges every child JSON
        // on any write/unlink · own plan · NCEC-safe). Idempotent guard mirrors the other arms.
        if (!topicBulletinWatcher) {
          topicBulletinWatcher = topicBulletinRelay.armFolderTreeWatch?.(nextA) ?? null;
          // C1 FIRST-LOAD CORRECTION — armFolderTreeWatch hardcodes ignoreInitial:true, so the arm
          // alone does NOT hydrate an ALREADY-PRESENT frontier/ tree on load/restart. One-shot
          // read-and-dispatch covers both: read every frontier child now, merge, write the aggregate,
          // and SBIS Base→Relay (no-op if frontier/ absent · ENOENT → null). Mirrors the other arms.
          void topicBulletinRelay.readAndDispatchFolderTree?.(nextA);
        }
        // Macro AB · ARJP/AWCR · arm the research-JSON watcher (session-independent · own plan · NCEC-safe).
        // HInfo · H6 — the AWCR flat-dir watcher (armResearchJsonWatcher) watches the RI dir at
        // depth:0. The targeted/ AND frontier/ subdirs sit one level BELOW it, so AWCR never fires
        // on their child JSONs — the 3rd STCP (targeted/) and the Topic Bulletin (frontier/) own
        // them without cross-fire. No CADMIUM_NON_RESEARCH_JSON_BASENAMES change is needed.
        armResearchJsonWatcher(d);
        const list = d.scsBridge.k.sessionsList.select() ?? [];
        const cad = findCadmiumSession(list);
        if (cad) {
          armOkWatcher(d, cad.cwd, cad.claudeSessionId);
        }
        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 33 },
    ),

    // Stage 2 · SLSF selector-reactive sentinel on sessionsList. Re-arms when the Cadmium
    // session appears / changes claudeSessionId. The chokidar callback in the closure does the
    // :OK: scan + dispatch — legal here, because this is THIS principle's own plan (NOT the
    // NCEC transcript watcher Stage 2). This stage does NOT iterateStage / conclude — it is the
    // permanent monitoring stage; the plan does not conclude on its own.
    stage(
      ({ d }) => {
        const list = d.scsBridge.k.sessionsList.select() ?? [];
        const cad = findCadmiumSession(list);
        if (cad) {
          armOkWatcher(d, cad.cwd, cad.claudeSessionId);
        }
        // No dispatch / iterateStage / conclude here — selector-reactive permanent sentinel.
      },
      { selectors: [d_.scsBridge.k.sessionsList], beat: 200 },
    ),
  ]);

  // Cleanup — timer first, then watcher(s), then conclude this principle's own plan.
  return () => {
    console.log('[Cadmium OkMonitor] Principle cleanup');
    if (okDebounceTimer) clearTimeout(okDebounceTimer);
    if (okWatcher) {
      try {
        okWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // C4-D1 WNPM/TLCR · close the Cadmium-folder watcher too (no handle leak).
    if (cadmiumFolderWatcher) {
      try {
        cadmiumFolderWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // Macro SM · IAJW · close the menu.json watcher too (no handle leak).
    if (menuWatcher) {
      try {
        menuWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // Diamond RFI · 2nd STCP · close the topics.json watcher too (no handle leak).
    if (topicsWatcher) {
      try {
        topicsWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // Diamond RAR · 3rd STCP · close the targeted/researchBulletin.json watcher too (no handle leak).
    if (researchBulletinWatcher) {
      try {
        researchBulletinWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // Diamond TRP · 4th STCP · close the targeted/targeted-menu.json watcher too (no handle leak).
    if (targetedMenuWatcher) {
      try {
        targetedMenuWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // Topic Live Bulletin · FIRST folder-tree STCP · close the frontier/ folder-tree watcher too
    // (H3 · no fd leak — depth:undefined opens inotify/kqueue handles for the entire subtree).
    if (topicBulletinWatcher) {
      try {
        topicBulletinWatcher.close();
      } catch {
        /* already closed */
      }
    }
    // Macro AB · ARJP/AWCR · close the research-JSON watcher too (no handle leak).
    if (researchJsonWatcher) {
      try {
        researchJsonWatcher.close();
      } catch {
        /* already closed */
      }
    }
    okMonitorPlan.conclude();
  };
};
