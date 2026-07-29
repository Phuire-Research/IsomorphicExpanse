<script setup lang="ts">
/**
 * CadmiumLanding — Cadmium Researcher Page Island
 *
 * Generalized research instance Page Island. Composes the CadmiumBulletin (PHBA
 * homepage primary content · Research Frontier + Articles) with the importable
 * ScsBridgeSessionManagement component (R-D2 CSMI · mode=specific) over the
 * universal global scsBridge controller.
 *
 * Pewter Tessera HiFi: Suite 2 Orange (cadmium pigment chemistry · Prospector
 * cognitive function · Cadmium Researcher carrying Vermillion Crystraline).
 *
 * Patterns: SBASC · CSMI · PPOL · SCSF
 * Citation: REFINE-DIAMOND-CADMIUM.md §R-D3
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import type {
  PlannedQuery,
  PlannedQueryStage,
  DiamondScale,
  CadmiumArticle,
  CadmiumTopic,
  MenuStage,
} from '../cadmium.type';
import { EMPTY_MENU_STAGE, CADMIUM_DIAMOND_STATIC_STAGE, CADMIUM_FRONTIER_SUBDIR_BASENAME } from '../cadmium.type';
// Diamond RAR · the CadmiumBulletin monolith decomposed into 4 focused research components.
// RFCC · Research Frontier (Topics TLCR + PlannedQueries child + folded TopicBulletin).
import CadmiumResearchFrontier from './CadmiumResearchFrontier.vue';
// TRGC · Targeted Research (SDSD static Diamond menu + RBSS 3rd STCP ResearchBulletin).
import CadmiumTargetedResearch from './CadmiumTargetedResearch.vue';
// Macro AB · ORRC · the RI-recorded research-accumulation surface (reads the same `articles`
// state AWCR populates · distinct from the per-article Bulletin cards · the compounding record).
// R-D2 CSMI · importable Session Management component (R-D1 SCSE · mode=specific)
import ScsBridgeSessionManagement from '../../scsBridge/vue/components/ScsBridgeSessionManagement.vue';
// Macro SU · STSC · importable Shatterite Tome Setup component (Setup zone · feeds the Anchor)
// Macro SM · SMSP · importable Shatterite Menu (agent-authored stage progression · IAJW relay)
import ShatteriteMenu from '../../suite8/vue/components/ShatteriteMenu.vue';
// MD-6 · D-BP-2 · the CARD subpage mounts the MD-5 Character-Forward Card for Cadmium.
import Suite8Card from '../../suite8/vue/components/Suite8Card.vue';
// Macro SU · Cadmium's SFSD instance (Research Topics) + page-usage overview
// Macro TR · RP · the TPRI Vermillion-per-topic GENERATOR (pure string builder · object input).
// deriveResearchSlug · slugify a topic label when the topic has no kebab id (frontier subdir fallback).
import { buildResearchVermillion, deriveResearchSlug } from '../cadmiumResearchVermillion.model';
// Macro TR · the session-entry shape the readiness gate inspects (status · suite8Name · id).
import type { ScsBridgeSessionEntry } from '../../scsBridge/scsBridge.type';
// Cycle 159 D1 · IUPA · cadmium + suite8 muxified per-page (no longer base)
import { createCadmiumClientConcept } from '../cadmium.concept.client';
import { createSuite8ClientConcept } from '../../suite8/suite8.concept.client';
import { cadmiumMuxonomic } from '../cadmium.muxonomy';
import { suite8Muxonomic } from '../../suite8/suite8.muxonomy';
// Cycle 159 D1 · GPIM · Vue-layer Muxium binding into universal scsBridge controller
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
// MRQ-B · the JSON-safe relay spec type for the per-topic batch enqueue (triggerRelayEnqueue).
import type { ScsBridgeRelaySpec } from '../../scsBridge/scsBridgeController';
// S8RI · suiteCascade muxified as the 3rd page concept (PRIOR base · downward/lateral import).
// The serverToClient relay routes travel WITH the concept (suiteCascade.muxonomy.ts) — NO new
// actionExchange entry in cadmium.muxonomy.ts. Mirrors SuiteCascadeLanding.vue's IUPA composition.
import { createSuiteCascadeConcept } from '../../suiteCascade/suiteCascade.concept.client';
import { suiteCascadeMuxonomic } from '../../suiteCascade/suiteCascade.muxonomy';
import { suiteFromCascadeFilePath } from '../../suiteCascade/model/suiteCascade.suiteDerivation';
import Suite8CascadeDocs from '../../suite8/vue/components/Suite8CascadeDocs.vue';
import type { Cascade } from '../../suiteCascade/suiteCascade.type';

const cadmiumDesignationName = ref<string>('');

// R-D2 CSMI · reactive reads from the global scsBridge controller (shallowRefs).
// computed() re-reads on every shallowRef change — bridgeJson/sessionsList stay live.
const bridgeJsonForSm = computed(() => getGlobalScsBridgeController()?.bridgeJson.value ?? null);
const sessionsListForSm = computed(() => getGlobalScsBridgeController()?.sessionsList.value ?? []);

// C3-D2 · PlannedQuery reactive list (PQCR) + VQIS input
const plannedQueries = ref<PlannedQuery[]>([]);
const vqisInput = ref<string>('');
// C3-D1 · DiamondScale reactive toggle (DSTS)
const diamondScale = ref<DiamondScale>('initial');

// C4-D2 · WNPM articles + TLCR topics reactive lists (Research Frontier source)
const articles = ref<CadmiumArticle[]>([]);
const topics = ref<CadmiumTopic[]>([]);

// Diamond RAR · 3rd STCP · the targeted ResearchBulletin (CadmiumArticle[]). Sourced from the
// CLIENT cadmium state slot `researchBulletin`, which the OkMonitor targeted/researchBulletin.json
// dir-watch populates: the relay broadcasts cadmiumSetResearchBulletin (actionExchange
// serverToClient) → reduces into d.client.d.cadmium.k.researchBulletin → the selector below flows
// it into this ref (mirrors how `articles`/`topics` are sourced · no new dispatch needed here).
const researchBulletin = ref<CadmiumArticle[]>([]);

// Topic Live Bulletin · the merged Topic Bulletin (CadmiumArticle[]). Sourced from the CLIENT
// cadmium state slot `topicBulletin`, which the OkMonitor frontier/ folder-tree merge populates:
// the relay broadcasts cadmiumSetTopicBulletin (actionExchange serverToClient) → reduces into
// d.client.d.cadmium.k.topicBulletin → the selector below flows it into this ref (mirrors how
// `researchBulletin` is sourced · no new dispatch needed here · the BSOH ODCF seeds it on refresh).
const topicBulletin = ref<CadmiumArticle[]>([]);

// Macro SM · SMSP · the current agent-authored menu stage (IAJW relay drives it).
const menuStage = ref<MenuStage>(EMPTY_MENU_STAGE);

// Diamond TRP · W5 · the LIVE targeted-research menu stage (4th STCP · targeted/targeted-menu.json
// relay drives it). Sourced from d.client.d.cadmium.k.targetedMenuStage (the backend C1 first-load
// + the STCP watcher populate it · NO MOCH endpoint). Threaded into CadmiumTargetedResearch's inner
// ShatteriteMenu as :menu-stage; absent a live stage it falls back to CADMIUM_DIAMOND_STATIC_STAGE.
const targetedMenuStage = ref<MenuStage>(EMPTY_MENU_STAGE);

// S8RI · the cascades Record (muxified suiteCascade state · serverToClient relay lands here).
const cascades = ref<Record<string, Cascade>>({});
// S8RI · zone-0 collapsible toggle for the Cadmium Diamond/Onyx pane (collapsed by default).

// ============================================================
// MD-6 · D-BP-2 · THE BIPLANE PAGE STANDARD (Cadmium conformance)
// The existing surface = HOME; the second subpage = CARD (Suite8Card for Cadmium). The Cascade
// Documents section EXTENDS with the name-FILTERED /suite8/:name/working-docs list (the SCP-local
// read) + the in-page reader via /suite8/:name/working-doc?file= (the MD-6 content route).
// ============================================================
type CadmiumBiplaneTab = 'home' | 'card';
const cadmiumBiplaneTab = ref<CadmiumBiplaneTab>('home');
const CADMIUM_NAME = 'Cadmium Researcher';

// The name-filtered working-docs list + the in-page reader (mirror Suite8Biplane's HOME docs leg).
type WorkingDoc = { file: string; firstLine: string };
const cadmiumWorkingDocs = ref<WorkingDoc[]>([]);
const cadmiumDocsBusy = ref<boolean>(false);
const cadmiumDocsError = ref<boolean>(false);
const cadmiumOpenDocFile = ref<string | null>(null);
const cadmiumDocReaderBusy = ref<boolean>(false);
const cadmiumDocReaderContent = ref<string>('');
const cadmiumDocReaderAbsent = ref<boolean>(false);

// The Suite8Entry the CARD subpage consumes (fixed-designation Cadmium · the roster-entry shape).
const cadmiumCardEntry = computed(() => ({
  name: CADMIUM_NAME,
  directoryPath: `Cascades/8_SUITES/${CADMIUM_NAME}`,
  description: 'Generalized Research Instance · carries the Vermillion Crystraline',
  color: '#10b981',
}));

async function loadCadmiumWorkingDocs() {
  cadmiumDocsBusy.value = true;
  cadmiumDocsError.value = false;
  try {
    const r = await fetch(`/suite8/${encodeURIComponent(CADMIUM_NAME)}/working-docs`);
    if (!r.ok) {
      cadmiumDocsError.value = true;
      cadmiumWorkingDocs.value = [];
      return;
    }
    const data = await r.json();
    cadmiumWorkingDocs.value = Array.isArray(data) ? (data as WorkingDoc[]) : [];
  } catch {
    cadmiumDocsError.value = true;
    cadmiumWorkingDocs.value = [];
  } finally {
    cadmiumDocsBusy.value = false;
  }
}

async function openCadmiumWorkingDoc(file: string) {
  if (cadmiumOpenDocFile.value === file) {
    cadmiumOpenDocFile.value = null;
    return;
  }
  cadmiumOpenDocFile.value = file;
  cadmiumDocReaderBusy.value = true;
  cadmiumDocReaderAbsent.value = false;
  cadmiumDocReaderContent.value = '';
  try {
    const url = `/suite8/${encodeURIComponent(CADMIUM_NAME)}/working-doc?file=${encodeURIComponent(file)}`;
    const r = await fetch(url);
    if (!r.ok) {
      cadmiumDocReaderAbsent.value = true;
      return;
    }
    cadmiumDocReaderContent.value = await r.text();
    cadmiumDocReaderAbsent.value = cadmiumDocReaderContent.value.trim().length === 0;
  } catch {
    cadmiumDocReaderAbsent.value = true;
  } finally {
    cadmiumDocReaderBusy.value = false;
  }
}

// S8RI · this page's cascade keyed by the watcher's deriveCascadeName (last dir segment).
// Cascades/Extended/Cadmium Researcher → 'Cadmium Researcher'. Mirrors SuiteCascadeLanding:56-72.
const cadmiumCascade = computed<Cascade | null>(
  () => cascades.value['Cadmium Researcher'] ?? null,
);
const diamondContent = computed<string | null>(() => {
  const c = cadmiumCascade.value;
  if (!c) return null;
  const f = c.activeCascadeFiles.find(
    (file) => suiteFromCascadeFilePath(file.filePath) === 'diamond',
  );
  return f ? f.markdown : null;
});
const onyxContent = computed<string | null>(() => {
  const c = cadmiumCascade.value;
  if (!c) return null;
  const f = c.activeCascadeFiles.find(
    (file) => suiteFromCascadeFilePath(file.filePath) === 'onyx',
  );
  return f ? f.markdown : null;
});

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

// ============================================================
// C3-D2 · VQIS — natural-language-to-PlannedQuery + PQCR registration
// ============================================================
// MVP: parse the textarea into a single-stage PlannedQuery (full multi-stage parsing
// deferred). Dispatch cadmiumRegisterPlannedQuery. Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D2-g.
function handleCreatePlannedQuery() {
  if (!muxium) return;
  const text = vqisInput.value.trim();
  if (!text) return;
  const queryId = `pq-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = Date.now();
  const firstLine = text.split('\n')[0]?.slice(0, 80) ?? text.slice(0, 80);
  // MVP single-stage query — full multi-stage VQIS parsing deferred to a future cycle.
  const stage: PlannedQueryStage = {
    stageIndex: 0,
    label: firstLine,
    searchIntent: text,
    status: 'pending',
    resultMarkdown: '',
  };
  const query: PlannedQuery = {
    queryId,
    name: firstLine,
    designation: cadmiumDesignationName.value,
    stages: [stage],
    overallStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.cadmium.e.cadmiumRegisterPlannedQuery({
      query,
    }),
  );
  vqisInput.value = '';
}

// ============================================================
// C3-D1 · DSTS — Diamond-Scale toggle (rides on FKIS body when sent via the Bulletin)
// ============================================================
function handleSetDiamondScale(scale: DiamondScale) {
  if (!muxium) return;
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.cadmium.e.cadmiumSetDiamondScale({
      scale,
    }),
  );
}

// ============================================================
// Macro TR · FSBA / STDB — Research Sweep Orchestrator
// ============================================================
//
// runResearchSweep(topics) is a BLOCKING async-chain (NOT Promise.all) over the
// topics, one spawned-then-dissipated Cadmium worker per topic. It runs in a Vue
// async click-handler (NOT a Stratimux plan stage) so no DFSR/re-entrant wind-up
// applies — it merely calls the controller's EXTERNAL dispatch methods (the same
// methods STSC/PPOL call from handlers). Mirrors STSC handleSubmit's sequential
// `await` + `wait(staggerMs)` precedent (ShatteriteTomeSetup.vue).
//
// H3 SPAWN-FLOOD GUARD (S4 EPOCH-SR-S4-GREEN-SCULPT): the spawn ACK fires BEFORE the
// subprocess is alive (scsBridgeSpawnSuite8Session.quality:83 · fire-and-forget). So
// we DO NOT gate on the spawn return — we AWAIT READINESS: poll sessionsList (the FBB
// relay updates it · same shallowRef PPOL reads) for a NEW Cadmium session (id NOT in
// the pre-spawn snapshot) reaching status === 'launched'. Timeout-guarded (~30s) →
// skip+log that topic. One spawn at a time (blocking) + the readiness gate together
// prevent the flood (SSEB/PPOL-safe). The page Anchor (established by PPOL) is NEVER
// touched: it pre-exists → its id is IN the snapshot set → never selected as the new
// worker; and claimAnchorIfUnclaimed (registry.ts:450) no-ops once an anchor exists,
// so sweep-spawns are non-anchor ephemeral (DSST then dissipates them safely).
//
// Citation: EPOCH-DIAMOND-SUITE8-SETUP-RESEARCH.md §2 Macro 6 TR · §3.5 blocking async-chain
// Citation: EPOCH-SR-S4-GREEN-SCULPT.md H3 (readiness-not-ACK) + Forward Context #5
// Citation: ShatteriteTomeSetup.vue handleSubmit (FKIS sequential await + wait stagger)
// Citation: cadmiumResearchVermillion.model.ts buildResearchVermillion (object input)

// MRQ-B · the old SWEEP_STAGGER_MS inter-topic delivery stagger is REMOVED — the bridge
// messageRelayQue (RQPOAD) is now the serializer for the focus/keystroke relays (§3.4). The
// readiness gate (awaitNewLaunchedWorker) provides inter-spawn spacing; sweepWait below is
// retained because the readiness poll still uses it.
// Readiness poll interval + timeout (S4 H3 · skip the topic if no worker launches in time).
const READINESS_POLL_MS = 500;
const READINESS_TIMEOUT_MS = 30_000;

// Light progress UI state (a sweep status line · WGB §Macro 6 "light progress UI").
type SweepPhase = 'idle' | 'running' | 'done';
const sweepPhase = ref<SweepPhase>('idle');
const sweepTotal = ref<number>(0);
const sweepIndex = ref<number>(0); // 1-based index of the topic currently being dispatched
const sweepCurrentLabel = ref<string>('');
const sweepStatusDetail = ref<string>('');
const sweepDispatched = ref<number>(0); // topics that reached a launched worker + got a Vermillion
const sweepSkipped = ref<number>(0); // topics whose worker never launched in time (timeout)

const sweepRunning = computed<boolean>(() => sweepPhase.value === 'running');

// ============================================================
// MD-CF-3 (C460) · THE DISPATCH CLOSURE DIAMETER
// SQRK never returns worker ULIDs (the bridge substitutes {{SCS_WORKER_ULID}} at prime-time),
// so dispatched Topic Researchers are tracked BY OBSERVATION: any non-anchor session whose
// suite8Name matches the designation enters the ledger on first sight. The SESSION-OBITUARY-
// PREDICATE then pairs each tracked id against the live sessionsList — id ABSENT anor status
// offline/archived → that researcher is NO LONGER IN DISPATCH (CLOSURE-MARKS-NOT-REMOVES:
// the row stays as the audit trail). Pure computeds off the controller's sessionsList
// shallowRef — no principle, no poll; the display principle's sync() drives reactivity.
// Citation: DIAMOND-CADMIUM-FORGE.md §MD-CF-3 · s8Anchor.model (the lookup idiom inverted).
// ============================================================
const dispatchLedger = ref<Map<string, { firstSeen: number }>>(new Map());

const workerSessions = computed(() => {
  const designation = cadmiumDesignationName.value;
  if (!designation) return [];
  const sessions = getGlobalScsBridgeController()?.sessionsList.value ?? [];
  return sessions.filter((s) => s.suite8Name === designation && s.isAnchor !== true);
});

// First-sight upsert — ONLY a worker observed ALIVE enters the ledger (C464 · user refinement:
// after a bridge turn-over sessions.json still lists old OFFLINE researchers — those are history,
// not dispatches this page-life observed; admitting them flashed a closed-pill roster on every
// turn-over before the All Clear wiped it). Once in, a worker never drops until the All Clear.
watch(workerSessions, (workers) => {
  let grew = false;
  for (const w of workers) {
    if (w.status === 'offline' || w.status === 'archived') continue;
    if (!dispatchLedger.value.has(w.id)) {
      dispatchLedger.value.set(w.id, { firstSeen: Date.now() });
      grew = true;
    }
  }
  if (grew) dispatchLedger.value = new Map(dispatchLedger.value);
});

const dispatchRoster = computed<Array<{ id: string; closed: boolean; status: string }>>(() => {
  const sessions = getGlobalScsBridgeController()?.sessionsList.value ?? [];
  return Array.from(dispatchLedger.value.keys()).map((id) => {
    const live = sessions.find((s) => s.id === id);
    const closed = !live || live.status === 'offline' || live.status === 'archived';
    return { id, closed, status: live?.status ?? 'gone' };
  });
});

// THE ALL CLEAR (C463 · user refinement) — when EVERY dispatched agent has closed, the roster
// clears entirely AND the sweep notification closes (sweepPhase → 'idle'). Guarded: never fires
// mid-sweep (a running sweep spawns workers one at a time — an all-closed instant between spawns
// must not wipe the roster). A short fixed grace keeps the final ✓ perceptible before the wipe.
let allClearTimer: ReturnType<typeof setTimeout> | null = null;
watch(dispatchRoster, (roster) => {
  const allClosed = roster.length > 0 && roster.every((r) => r.closed);
  if (!allClosed || sweepPhase.value === 'running') {
    if (allClearTimer) {
      clearTimeout(allClearTimer);
      allClearTimer = null;
    }
    return;
  }
  if (allClearTimer) return;
  allClearTimer = setTimeout(() => {
    allClearTimer = null;
    dispatchLedger.value = new Map();
    sweepPhase.value = 'idle';
  }, 4000);
});

// THE FOCUS ENHANCEMENT (C463) — a LIVE researcher pill focuses that agent's session window
// (the Session Management focus leg) so the user can watch it research.
function handleFocusWorker(id: string): void {
  getGlobalScsBridgeController()?.triggerFocusSession(id);
}

const sweepStatusText = computed<string>(() => {
  switch (sweepPhase.value) {
    case 'running':
      return `Research sweep · topic ${sweepIndex.value} of ${sweepTotal.value}`
        + (sweepCurrentLabel.value ? ` · "${sweepCurrentLabel.value}"` : '')
        + (sweepStatusDetail.value ? ` · ${sweepStatusDetail.value}` : '');
    case 'done':
      return `Research sweep complete · ${sweepDispatched.value} dispatched`
        + (sweepSkipped.value > 0 ? ` · ${sweepSkipped.value} skipped (no worker)` : '');
    default:
      return '';
  }
});

// FKIS stagger helper (mirror STSC's wait).
function sweepWait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// S4 H3 · AWAIT READINESS (NOT the spawn ACK). Poll the live sessionsList shallowRef
// for a NEW Cadmium worker (id not in `priorIds`) reaching status === 'launched'.
// Returns the worker's sessionId, or null on timeout (caller skips + logs the topic).
async function awaitNewLaunchedWorker(
  priorIds: Set<string>,
  suite8Name: string,
): Promise<string | null> {
  const sbCtrl = getGlobalScsBridgeController();
  const deadline = Date.now() + READINESS_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const sessions: ScsBridgeSessionEntry[] = sbCtrl?.sessionsList.value ?? [];
    // A NEW entry (post-spawn) for THIS Suite 8 that has reached 'launched' = alive worker.
    // The anchor is excluded automatically: it pre-exists → its id is in priorIds.
    // IPTG (timing-miss fix) · status='launched' has TWO write sites: PDFL (first PTY byte =
    // terminal painting · session.ts:136) fires ~tens of ms BEFORE Claude Code is at its
    // interactive prompt; the SessionStart hook (sessionStartHook.ts:148-149) fires seconds
    // later when CC actually booted — and ONLY the hook also sets claudeSessionId. Gating on
    // claudeSessionId makes this the REAL interactive-ready proxy, so the [Focus, AutoMode, Send]
    // batch enqueues after CC can accept the Shift+Tab×3 (Auto-Mode engages · no permission stall).
    const worker = sessions.find(
      (s) =>
        !priorIds.has(s.id) &&
        s.suite8Name === suite8Name &&
        s.status === 'launched' &&
        !!s.claudeSessionId,
    );
    if (worker) {
      console.log(
        '[CadmiumLanding TR] readiness gate PASS · NEW launched worker · id=', worker.id,
        '· claudeSessionId=', worker.claudeSessionId,
        '· suite8Name=', suite8Name,
      );
      return worker.id;
    }
    await sweepWait(READINESS_POLL_MS);
  }
  console.warn(
    '[CadmiumLanding TR] readiness gate TIMEOUT · no NEW launched worker within',
    READINESS_TIMEOUT_MS, 'ms · suite8Name=', suite8Name,
  );
  return null;
}

// The blocking async-chain. STDB = runResearchSweep([topic]) (N=1). Per topic, in
// sequence: snapshot ids → spawn (non-anchor) → AWAIT READINESS → deliver Vermillion →
// FKIS stagger → next. The worker then researches → writes article+JSON (AB) → DSST.
async function runResearchSweep(sweepTopics: CadmiumTopic[]): Promise<void> {
  if (sweepRunning.value) {
    console.warn('[CadmiumLanding TR] runResearchSweep called while a sweep is already running · ignoring');
    return;
  }
  const sbCtrl = getGlobalScsBridgeController();
  if (!sbCtrl) {
    console.warn('[CadmiumLanding TR] no scsBridge controller · cannot run sweep');
    return;
  }
  const suite8Name = cadmiumDesignationName.value || 'Cadmium Researcher';
  if (sweepTopics.length === 0) {
    console.log('[CadmiumLanding TR] runResearchSweep · no topics to sweep · no-op');
    return;
  }

  sweepPhase.value = 'running';
  sweepTotal.value = sweepTopics.length;
  sweepIndex.value = 0;
  sweepDispatched.value = 0;
  sweepSkipped.value = 0;
  sweepCurrentLabel.value = '';
  sweepStatusDetail.value = '';

  console.log(
    '[CadmiumLanding TR] runResearchSweep START · topicCount=', sweepTopics.length,
    '· suite8Name=', suite8Name,
  );

  // C407 · SQRK — THE STEPPED SWEEP. The per-topic loop (spawn OUTSIDE the queue →
  // await launched → enqueue focus/send) is RETIRED: topic N+1's spawn stole focus
  // mid-stream of topic N's typing (the queue only serialized the relays, never the
  // spawns). Now ONE batch of ATOMIC spawn specs — the bridge relay body composes the
  // ENTIRE sequence per topic (create → spawn → launched gate → the priming awaited to
  // CLI-exit, i.e. the final Enter CONFIRMED) inside one serialized block before the
  // next topic's block opens. The page enqueues once and the queue is the stepper —
  // N different Suite 8 instances operated through one focus channel (MISO).
  // The SORD prefix stays page-side (byte-parity with scsBridgeDeliverVermillion:91).
  // {{SCS_WORKER_ULID}}: the worker's OWN ULID is born inside the relay body — the
  // bridge substitutes the placeholder at prime time (the CWDC self-dissipate leg).
  sweepStatusDetail.value = 'building the stepped batch';
  // C466 · the SERVER-declared absolute Extended base (the browser has no process.cwd()).
  // Fetched fresh per sweep — one GET against the same-origin /scp-config (AFPR: absent field
  // → undefined → the Vermillion falls back to the legacy relative path).
  let riBase: string | undefined;
  try {
    const cfg = (await (await fetch('/scp-config')).json()) as { extendedRoot?: string };
    if (typeof cfg.extendedRoot === 'string' && cfg.extendedRoot.length > 0) {
      riBase = cfg.extendedRoot;
    }
  } catch {
    /* unreachable /scp-config — legacy relative fallback */
  }
  const specs: ScsBridgeRelaySpec[] = sweepTopics.map((topic) => {
    const topicSlug = topic.id || deriveResearchSlug(topic.label);
    const vermillion = buildResearchVermillion({
      topic: topic.query || topic.label,
      suite8Name,
      riBase,
      outputSubdir: `${CADMIUM_FRONTIER_SUBDIR_BASENAME}/${topicSlug}`,
      workerSessionId: '{{SCS_WORKER_ULID}}',
    });
    return {
      kind: 'spawn' as const,
      sessionId: '',
      suite8Name,
      text: `SCS:Vermillion\n${vermillion}`,
    };
  });
  sweepIndex.value = sweepTopics.length;
  sweepCurrentLabel.value = `${sweepTopics.length} topics stepped through the queue`;
  sweepStatusDetail.value = 'enqueuing the stepped batch';
  console.log(
    '[CadmiumLanding TR] enqueuing STEPPED batch · specCount=', specs.length,
    '· suite8Name=', suite8Name,
  );
  const enq = await sbCtrl.triggerRelayEnqueue(specs);
  if (enq?.ok) {
    sweepDispatched.value = specs.length;
    sweepStatusDetail.value = 'stepped batch enqueued · the queue paces each worker';
  } else {
    sweepSkipped.value = specs.length;
    sweepStatusDetail.value = `enqueue failed: ${enq?.error ?? 'unknown'}`;
    console.error(
      '[CadmiumLanding TR] STEPPED batch enqueue FAILED · error=', enq?.error,
    );
  }

  sweepPhase.value = 'done';
  sweepIndex.value = 0;
  sweepCurrentLabel.value = '';
  sweepStatusDetail.value = '';
  console.log(
    '[CadmiumLanding TR] runResearchSweep COMPLETE · dispatched=', sweepDispatched.value,
    '· skipped=', sweepSkipped.value,
  );
}

// Macro TR · STDB · per-topic Research button → runResearchSweep([topic]) (N=1).
function handleResearchTopic(topic: CadmiumTopic): void {
  console.log('[CadmiumLanding TR] handleResearchTopic · label=', topic.label);
  void runResearchSweep([topic]);
}

// Macro TR · FSBA · Research-All button → blocking sweep over the ACTIVE topics only.
function handleResearchAll(): void {
  const active = topics.value.filter((t) => t.active);
  console.log('[CadmiumLanding TR] handleResearchAll · activeTopicCount=', active.length);
  void runResearchSweep(active);
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // MD-6 · D-BP-2 · seed the name-filtered Cascade Documents list (the SCP-local read).
  void loadCadmiumWorkingDocs();

  // Cycle 159 D1 · IUPA · landing supplies cadmium + suite8 as muxonomic page concepts
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [
      { concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic },
      { concept: createCadmiumClientConcept(), muxonomy: cadmiumMuxonomic },
      { concept: createSuiteCascadeConcept(), muxonomy: suiteCascadeMuxonomic }, // S8RI · PRIOR base muxified
    ],
    {
      title: 'CadmiumLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // Settings-tab default override on mount (RSPC8TAD pattern)
  // Cadmium is fixed-designation consumer · Settings tab is natural entry point
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.suite8.e.suite8SetActiveTab({
      tab: 'settings',
    }),
  );

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'cadmiumLandingSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            cadmiumDesignationName.value = d.client.d.cadmium.k.cadmiumDesignationName.select();
            // C3-D2 PQCR + C3-D1 DSTS reactive reads
            plannedQueries.value = d.client.d.cadmium.k.plannedQueries.select();
            diamondScale.value = d.client.d.cadmium.k.diamondScale.select();
            // C4-D2 WNPM articles + TLCR topics reactive reads
            articles.value = d.client.d.cadmium.k.articles.select();
            topics.value = d.client.d.cadmium.k.topics.select();
            // Diamond RAR · 3rd STCP · researchBulletin reactive read (targeted/researchBulletin.json relay)
            researchBulletin.value = d.client.d.cadmium.k.researchBulletin.select();
            // Topic Live Bulletin · topicBulletin reactive read (frontier/ folder-tree merge relay)
            topicBulletin.value = d.client.d.cadmium.k.topicBulletin.select();
            // Macro SM · SMSP · agent-authored menu stage reactive read (IAJW relay)
            menuStage.value = d.client.d.cadmium.k.menuStage.select();
            // Diamond TRP · W5 · LIVE targeted-research menu stage reactive read (4th STCP relay)
            targetedMenuStage.value = d.client.d.cadmium.k.targetedMenuStage.select();
            // S8RI · muxified suiteCascade cascades Record (Tier-2 DECK-K · serverToClient relay)
            cascades.value = d.client.d.suiteCascade.k.cascades.select();
          },
          {
            selectors: [
              d__.client.d.cadmium.k.cadmiumDesignationName,
              // C3-D2 PQCR + C3-D1 DSTS selectors
              d__.client.d.cadmium.k.plannedQueries,
              d__.client.d.cadmium.k.diamondScale,
              // C4-D2 WNPM articles + TLCR topics selectors
              d__.client.d.cadmium.k.articles,
              d__.client.d.cadmium.k.topics,
              // Diamond RAR · 3rd STCP researchBulletin selector
              d__.client.d.cadmium.k.researchBulletin,
              // Topic Live Bulletin · topicBulletin selector (frontier/ folder-tree merge relay)
              d__.client.d.cadmium.k.topicBulletin,
              // Macro SM · SMSP menuStage selector
              d__.client.d.cadmium.k.menuStage,
              // Diamond TRP · W5 · targetedMenuStage selector (4th STCP live stage)
              d__.client.d.cadmium.k.targetedMenuStage,
              // S8RI · muxified suiteCascade cascades selector (Tier-2 muxified access)
              d__.client.d.suiteCascade.k.cascades,
            ],
          },
        ),
      ]),
  );

  // ============================================================
  // Macro SM · Issue 1a · MOCH · Menu-On-Connect-Hydration (ODCF for the menu stage)
  // The IAJW relay broadcasts cadmiumSetMenuStage ONCE per stage change to clients connected
  // at broadcast time — the webSocketServer does NOT replay state on (re)connect, so a page
  // that loads/reloads AFTER the broadcast (HMR · or the page-loads-then-anchor-writes order)
  // never receives the current stage and renders the empty "Waiting…" placeholder. Mirror the
  // AV ODCF doctrine: on mount, GET the current stage from /cadmium-menu and DISPATCH it into
  // client state so the existing subscription (above) flows it into menuStage.value; the relay
  // then keeps it live. Idempotent — the relay overwrites with the same/newer stage. Same-origin
  // fetch (the SCP serves this page). RSAR: absent menu.json / bridge down → stay on placeholder.
  // ============================================================
  void fetch('/cadmium-menu')
    .then((r) => (r.ok ? r.json() : null))
    .then((stage) => {
      if (
        stage &&
        typeof stage.stageIndex === 'number' &&
        stage.stageIndex >= 0 &&
        Array.isArray(stage.options)
      ) {
        muxium?.dispatch(
          (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.cadmium.e.cadmiumSetMenuStage({
            menuStage: stage as MenuStage,
          }),
        );
      }
    })
    .catch(() => {
      /* RSAR · absent/unreachable → keep the placeholder; the relay still delivers live stages */
    });

  // ============================================================
  // Diamond BSE · BSOH · ResearchBulletin-On-Connect-Hydration (ODCF for the research bulletin)
  // The 3rd STCP relay (cadmiumSetResearchBulletin) broadcasts the bulletin ONCE per
  // targeted/researchBulletin.json write to clients connected at broadcast time — the
  // webSocketServer does NOT replay on (re)connect, so a hard-refresh AFTER the broadcast loses
  // the bulletin (it renders the empty placeholder forever · the lost-on-refresh regression).
  // Mirror the /cadmium-menu MOCH block above: on mount GET the LIST channel and DISPATCH it into
  // the EXISTING cadmiumSetResearchBulletin quality (the d.client.d.cadmium.k.researchBulletin slot
  // already exists · NO new state) so the subscription above flows it into researchBulletin.value;
  // the live STCP relay then keeps it fresh. RSAR: empty array / absent / bridge down → skip the
  // dispatch (keep [] · the relay still delivers live updates). Same-origin fetch.
  // ============================================================
  const triggerFetchResearchBulletin = (): void => {
    void fetch('/cadmium-research-bulletin')
      .then((r) => (r.ok ? r.json() : []))
      .then((bulletin) => {
        if (Array.isArray(bulletin) && bulletin.length > 0) {
          muxium?.dispatch(
            (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.cadmium.e.cadmiumSetResearchBulletin({
              researchBulletin: bulletin as CadmiumArticle[],
            }),
          );
        }
      })
      .catch(() => {
        /* RSAR · absent/unreachable → keep []; the relay still delivers the live bulletin */
      });
  };
  triggerFetchResearchBulletin();

  // ============================================================
  // Topic Live Bulletin · BSOH · TopicBulletin-On-Connect-Hydration (ODCF for the topic bulletin)
  // The folder-tree relay (cadmiumSetTopicBulletin) broadcasts the merged bulletin ONCE per
  // frontier/ child write to clients connected at broadcast time — the webSocketServer does NOT
  // replay on (re)connect, so a hard-refresh AFTER the broadcast loses the bulletin. Mirror the
  // /cadmium-research-bulletin ODCF block above: on mount GET the LIST channel (the materialised
  // frontier/topicBulletin.json aggregate · Option A) and DISPATCH it into the cadmiumSetTopicBulletin
  // quality (the d.client.d.cadmium.k.topicBulletin slot already exists · NO new state) so the
  // subscription above flows it into topicBulletin.value; the live STCP relay then keeps it fresh.
  // RSAR: empty array / absent / bridge down → skip the dispatch (keep [] · the relay still delivers
  // live updates). Same-origin fetch.
  // ============================================================
  const triggerFetchTopicBulletin = (): void => {
    void fetch('/cadmium-topic-bulletin')
      .then((r) => (r.ok ? r.json() : []))
      .then((bulletin) => {
        if (Array.isArray(bulletin) && bulletin.length > 0) {
          muxium?.dispatch(
            (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.cadmium.e.cadmiumSetTopicBulletin({
              topicBulletin: bulletin as CadmiumArticle[],
            }),
          );
        }
      })
      .catch(() => {
        /* RSAR · absent/unreachable → keep []; the relay still delivers the live bulletin */
      });
  };
  triggerFetchTopicBulletin();

  // ============================================================
  // TOCH · Topics-On-Connect-Hydration (ODCF for the topics registry)
  // topics.json is an STCP relay that broadcasts ONCE at boot to connected clients; the
  // webSocketServer does NOT replay on (re)connect, so a hard-refresh AFTER the boot broadcast loses
  // the topics (the registry shows "no topics configured · topics.json absent or empty" though
  // topics.json IS populated). Mirror the bulletin BSOH blocks: on mount GET /cadmium-topics and
  // DISPATCH into cadmiumSetTopics so the topics subscription flows them into the registry; the STCP
  // relay then keeps it live. RSAR: empty / absent / bridge down → skip the dispatch (keep []).
  // ============================================================
  const triggerFetchTopics = (): void => {
    void fetch('/cadmium-topics')
      .then((r) => (r.ok ? r.json() : []))
      .then((topics) => {
        if (Array.isArray(topics) && topics.length > 0) {
          muxium?.dispatch(
            (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.cadmium.e.cadmiumSetTopics({
              topics: topics as CadmiumTopic[],
            }),
          );
        }
      })
      .catch(() => {
        /* RSAR · absent/unreachable → keep []; the relay still delivers the live topics */
      });
  };
  triggerFetchTopics();

  // MD-CF-1 (C460) · PAOLR ERASURE — the PPOL auto-spawn plan is REMOVED (the user's Cadmium
  // Forge directive): page load spawns/engages/focuses NOTHING. The manual path is the
  // ScsBridgeSessionManagement zone (Spawn/Engage/Focus — the same controller methods PAOLR
  // called), gated architecturally on the cadmiumDesignationName relay. The four ODCF
  // hydrations above are PPOL-independent and stay.
});

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) stagePlanner.conclude();
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="cadmium-landing">
    <header class="cadmium-header">
      <h1 class="hifi-heading spectrum-text">Cadmium Researcher</h1>
      <p class="subtitle hifi-label">
        Generalized Research Instance · Carries the Vermillion Crystraline · Designation:
        <span class="designation-name">{{ cadmiumDesignationName }}</span>
      </p>
      <!-- Diamond RAR · DSTS header toggle PRUNED — the DiamondScale toggle now lives in the
           CadmiumPlannedQueries zone (CadmiumResearchFrontier child). The header copy was a
           duplicate dispatch path (S1 Pruning · lossy-abstraction collapse). -->
    </header>

    <!-- D-EF-0 · THE STANDARDIZED SUB-NAV (one bar · HOME dissolved → 'Research' · Card LAST) -->
    <nav class="cadmium-biplane-nav hifi-pane-base">
      <div class="biplane-tabs">
        <button
          type="button"
          :class="['biplane-tab', 'tab--amethyst', { 'biplane-tab--active': cadmiumBiplaneTab === 'home' }]"
          @click="cadmiumBiplaneTab = 'home'"
        >
          Research
        </button>
        <button
          type="button"
          :class="['biplane-tab', 'tab--viridian', { 'biplane-tab--active': cadmiumBiplaneTab === 'card' }]"
          @click="cadmiumBiplaneTab = 'card'"
        >
          Card
        </button>
      </div>
    </nav>

    <!-- MD-6 · D-BP-2 · CARD SUBPAGE — the MD-5 Character-Forward Card for Cadmium -->
    <main v-if="cadmiumBiplaneTab === 'card'" class="cadmium-content cadmium-card-subpage">
      <Suite8Card :entry="cadmiumCardEntry" domain="Research" :compact="false" />
    </main>

    <main v-else class="cadmium-content">
      <!-- S8RI · zone 0 · Cadmium Cascade Diamond/Onyx pane (collapsible · collapsed by default).
           C861 · the standardized Cascade Memory (Suite8CascadeDocs) keyed 'Cadmium Researcher' —
           self-sufficient (HTTP cold-boot floor + live Record leg); its own card handles empty.
           Purely ADDITIVE above ShatteriteMenu — the RAR 4-component layout below is untouched. -->
      <!-- C865 · the Cadmium Cascade section REPLACED altogether by the bare standardized
           Cascade Memory card (Suite8CascadeDocs · own header + collapse · collapsed by
           default) — component consistency with the generated Suite 8 pages. The C861
           wrapper tab + the working-docs extension are retired with it. -->
      <Suite8CascadeDocs designation="Cadmium Researcher" />

      <!-- Macro SM · SMSP · Shatterite Menu zone — FIRST aspect the user sees (ASDR · above
           the Research Frontier / Bulletin). The agent-authored guidance/onboarding leads.
           Renders the live menuStage (IAJW relay · menu.json watcher). S6 GUARD stub. -->
      <ShatteriteMenu
        :menu-stage="menuStage"
        :suite8-name="cadmiumDesignationName"
        title="Research Menu"
      />

      <!-- Diamond RAR · RFCC · Research Frontier — Topics (TLCR + FSBA/STDB) + PlannedQueries
           child (VQIS form + DiamondScale toggle + PQCR) + Topic Live Bulletin (the frontier/
           folder-tree merge stream · LiveBulletin sidebar+detail). Emits proxy to CadmiumLanding's
           handlers. -->
      <CadmiumResearchFrontier
        :topics="topics"
        :topic-bulletin="topicBulletin"
        :sweep-phase="sweepPhase"
        :sweep-status-text="sweepStatusText"
        :dispatch-roster="dispatchRoster"
        @focus-worker="handleFocusWorker"
        @research-topic="handleResearchTopic"
        @research-all="handleResearchAll"
      />

      <!-- Diamond RAR · TRGC · Targeted Research — SDSD static Diamond explainer menu
           (:default-stage=CADMIUM_DIAMOND_STATIC_STAGE · Diamond/Macro/Epoch scale rows) + the
           RBSS 3rd STCP ResearchBulletin (targeted/researchBulletin.json relay stream). -->
      <CadmiumTargetedResearch
        :suite8-name="cadmiumDesignationName"
        :research-bulletin="researchBulletin"
        :diamond-scale="diamondScale"
        :default-stage="CADMIUM_DIAMOND_STATIC_STAGE"
        :targeted-menu-stage="targetedMenuStage"
      />

      <!-- Macro TR · the research sweep status line (FSBA/STDB) now renders INSIDE the Research
           Frontier zone (CadmiumResearchFrontier · by the Research All button) — it is logically part
           of that zone, not a separate one. The standalone div here was relocated (FIX 3). -->

      <!-- C863 · PRUNED: the Ongoing Research zone (the Bulletin relays the accumulation by
           choice) + the Research Topics Setup Tome (topics are set by the Anchor via the
           top-most Shatterite TAGS input) — both redundant on this page. -->

      <!-- R-D2 CSMI · Session Management (mode=specific · Cadmium Researcher · GRGL inject) -->
      <!-- bridgeJson + sessionsList resolve from the global controller shallowRefs (CSMI-GSRM). -->
      <!-- Controller for spawn/engage/focus actions provided globally by IslandWrapper (GRGL). -->
      <ScsBridgeSessionManagement
        :bridge-json="bridgeJsonForSm"
        :sessions-list="sessionsListForSm"
        :mode="'specific'"
        :suite8-name="cadmiumDesignationName"
      />
    </main>
  </div>
</template>

<style scoped>
.cadmium-landing {
  min-height: 100vh;
  background: radial-gradient(ellipse at 87.5% 12.5%, #5a2f0a 0%, #0f0a05 88%);
  padding: 2rem;
  color: #f5e8d8;
  font-family: system-ui, -apple-system, sans-serif;
}

/* MD-6 · D-BP-2 · THE BIPLANE NAVBAR (same-page HOME | CARD tab · zero raw hex accents) */
.cadmium-biplane-nav {
  max-width: 900px;
  margin: 0 auto 1.25rem;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}
.cadmium-biplane-nav .biplane-tabs {
  display: flex;
  gap: 0.5rem;
}
.cadmium-biplane-nav .biplane-tab {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.375rem 1.1rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(0, 0, 0, 0.4);
  background: var(--color-board-dark, #1a1a2e);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}
.cadmium-biplane-nav .tab--amethyst {
  --biplane-accent: var(--color-amethyst, #a855f7);
  --biplane-light: var(--color-amethyst-light, #c4b5fd);
}
.cadmium-biplane-nav .tab--viridian {
  --biplane-accent: var(--color-viridian, #10b981);
  --biplane-light: var(--color-viridian-light, #6ee7b7);
}
.cadmium-biplane-nav .biplane-tab:hover {
  border-color: var(--biplane-accent);
  color: rgba(255, 255, 255, 0.9);
}
.cadmium-biplane-nav .biplane-tab--active {
  background: var(--biplane-accent);
  color: var(--color-board-dark, #1a1a2e);
  border-color: var(--biplane-light);
}
.cadmium-card-subpage {
  max-width: 560px;
  margin: 0 auto;
}

/* MD-6 · D-BP-2 · the Cascade Documents extension inside the Cadmium Cascade zone. */
.cadmium-working-docs {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.cadmium-working-docs .docs-heading {
  display: block;
  margin: 0 0 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cadmium-working-docs .docs-status {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  margin: 0.3rem 0 0;
}
.cadmium-working-docs .docs-status.docs-absent {
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
}
.cadmium-working-docs .docs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.cadmium-working-docs .doc-btn {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.7rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  cursor: pointer;
}
.cadmium-working-docs .doc-btn:hover {
  border-color: rgba(255, 255, 255, 0.25);
}
.cadmium-working-docs .doc-btn--open {
  border-color: var(--color-amethyst-light, #c4b5fd);
}
.cadmium-working-docs .doc-file {
  font-size: 0.78rem;
  color: rgba(230, 230, 230, 0.92);
  word-break: break-word;
}
.cadmium-working-docs .doc-file.mono {
  font-family: var(--font-mono, 'Space Mono', monospace);
}
.cadmium-working-docs .doc-firstline {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  word-break: break-word;
}
.cadmium-working-docs .doc-reader {
  margin-top: 0.4rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.6rem;
}
.cadmium-working-docs .doc-reader-content {
  margin: 0;
  max-height: 340px;
  overflow-y: auto;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(220, 220, 220, 0.9);
  white-space: pre-wrap;
  word-break: break-word;
}

.cadmium-header {
  text-align: center;
  margin-bottom: 2rem;
}

.cadmium-header h1 {
  color: #f97316;
  font-size: 2rem;
  margin: 0 0 0.5rem;
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.subtitle {
  color: #d6d3d1;
  font-size: 0.875rem;
}

.designation-name {
  color: #fb923c;
  font-weight: 600;
}

/* Diamond RAR · DSTS toggle + VQIS form + .pq-list CSS PRUNED — relocated to the owner
   components (CadmiumPlannedQueries · CadmiumResearchFrontier) post-split (S1 Pruning). */

.cadmium-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Macro TR · research sweep progress status line (FSBA/STDB) RELOCATED to CadmiumResearchFrontier.vue
   (FIX 3 — it renders inside the Research Frontier zone now; styles live with the markup). */

.suite8-embed-panel,
.forward-panel,
.info-panel {
  background: #1a1208;
  border-top: 2px solid #92400e;
  border-right: 2px solid #92400e;
  border-bottom: 2px solid #fb923c;
  border-left: 2px solid #fb923c;
  box-shadow: -3px 3px 0 rgba(146, 64, 14, 0.4);
  border-radius: 6px;
  padding: 1.5rem;
}

h2 {
  color: #f97316;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.panel-description {
  color: #d6d3d1;
  font-size: 0.875rem;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.deferred-note {
  color: #a8a29e;
  font-style: italic;
}

.placeholder {
  color: #78716c;
  font-style: italic;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
  background: #0f0a05;
  border-radius: 4px;
  margin: 0;
}

.instance-list,
.connection-list,
.skill-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.instance-row,
.connection-row,
.skill-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.instance-id,
.connection-id,
.skill-id {
  font-family: 'SF Mono', Monaco, monospace;
  color: #fb923c;
}

.instance-designation,
.connection-endpoint,
.skill-designation {
  color: #f5e8d8;
  flex: 1;
}

.spawn-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f97316;
  color: #1a0f08;
  border-top: 2px solid #c2410c;
  border-right: 2px solid #c2410c;
  border-bottom: 2px solid #fdba74;
  border-left: 2px solid #fdba74;
  box-shadow: -2px 2px 6px rgba(194, 65, 12, 0.4);
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
  margin-bottom: 1rem;
}

.spawn-btn:hover {
  background: #fb923c;
  box-shadow: -1px 1px 4px rgba(194, 65, 12, 0.4);
}

.spawn-btn:active {
  border-top: 2px solid #fdba74;
  border-right: 2px solid #fdba74;
  border-bottom: 2px solid #c2410c;
  border-left: 2px solid #c2410c;
}

.connect-actions {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #0f0a05;
  border-radius: 4px;
}

.action-label {
  color: #a8a29e;
  font-size: 0.8125rem;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.connect-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.connect-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #92400e;
  background: #2a1a08;
  color: #fb923c;
  transition: all 0.2s ease;
}

.connect-btn:hover {
  background: #44351a;
  border-color: #fb923c;
}

.disconnect-btn {
  padding: 0.25rem 0.625rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #92400e;
  background: #1a0f05;
  color: #d97706;
  transition: all 0.2s ease;
}

.disconnect-btn:hover {
  background: #2a1a08;
  border-color: #d97706;
}

/* A2-D5 Vermillion Skill form + list */
.skill-form {
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.skill-form-row {
  display: flex;
  gap: 0.5rem;
}

.skill-input,
.skill-select,
.skill-textarea {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: #1a1208;
  border: 1px solid #44351a;
  border-radius: 4px;
  color: #f5e8d8;
  font-size: 0.8125rem;
  font-family: system-ui, sans-serif;
}

.skill-input:focus,
.skill-select:focus,
.skill-textarea:focus {
  outline: none;
  border-color: #fb923c;
}

.skill-textarea {
  resize: vertical;
  font-family: 'SF Mono', Monaco, monospace;
}

.skill-form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.skill-register-btn,
.skill-samples-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: system-ui, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skill-register-btn {
  background: #f97316;
  color: #1a0f08;
  border: 1px solid #c2410c;
}

.skill-register-btn:hover {
  background: #fb923c;
}

.skill-samples-btn {
  background: #2a1a08;
  color: #fb923c;
  border: 1px solid #92400e;
}

.skill-samples-btn:hover {
  background: #44351a;
}

.skill-row-extended {
  background: #0f0a05;
  border: 1px solid #44351a;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.8125rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.skill-row-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.skill-row-name {
  color: #fb923c;
  font-weight: 600;
}

.skill-row-ai {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  color: #d6d3d1;
}

.skill-ai-block {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.skill-ai-label {
  color: #fb923c;
  font-weight: 700;
  flex-shrink: 0;
}

.skill-ai-text {
  color: #d6d3d1;
}

.skill-remove-btn {
  margin-left: auto;
  padding: 0 0.5rem;
  background: transparent;
  color: #ef4444;
  border: 1px solid #7f1d1d;
  border-radius: 3px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.skill-remove-btn:hover {
  background: #7f1d1d;
  color: #fff;
}

/* A2-D6 Personalized HomePage */
.homepage-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: #0f0a05;
  border-radius: 4px;
  border: 1px solid #44351a;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}

.homepage-path {
  flex: 1;
  font-family: 'SF Mono', Monaco, monospace;
  color: #fb923c;
}

.homepage-option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.homepage-option-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #1a1208;
  border: 1px solid #44351a;
  border-radius: 4px;
  color: #f5e8d8;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.homepage-option-btn:hover {
  border-color: #fb923c;
  background: #2a1a08;
}

.homepage-option-btn.active {
  border-color: #fb923c;
  background: #44351a;
}

.homepage-option-btn.active::before {
  content: '✓ ';
  color: #4ade80;
  font-weight: 700;
}

.homepage-option-label {
  color: #fb923c;
  font-weight: 600;
}

.homepage-option-path {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  color: #a8a29e;
}

.sim-badge {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  background: #44351a;
  color: #fbbf24;
  border: 1px solid #92400e;
}

.instance-status,
.connection-status {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  background: #2a1a08;
}

.status-spawning,
.status-pending {
  color: #fbbf24;
}

.status-alive,
.status-connected {
  color: #4ade80;
}

.status-exited,
.status-closed {
  color: #ef4444;
}

.info-content {
  color: #d6d3d1;
  line-height: 1.6;
}

.info-content p {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
}

.info-content p:last-child {
  margin-bottom: 0;
}

.info-content strong {
  color: #fb923c;
}

.info-content code {
  background: #0f0a05;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  color: #fb923c;
}

/* S8RI · zone-0 Cadmium Cascade Diamond/Onyx collapsible (mirrors the pane's chevron/tab idiom). */
.cadmium-cascade-ri {
  margin-bottom: 1rem;
}

.cascade-ri-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.875rem;
  background: linear-gradient(180deg, rgba(60, 60, 60, 0.06) 0%, rgba(40, 40, 40, 0.03) 100%);
  border: 1px solid rgba(180, 160, 120, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.cascade-ri-tab:hover {
  background: linear-gradient(180deg, rgba(80, 80, 80, 0.1) 0%, rgba(50, 50, 50, 0.05) 100%);
}

.cascade-ri-chevron {
  font-size: 0.65rem;
  color: rgba(200, 200, 200, 0.4);
  transition: transform 0.25s ease;
  display: inline-block;
  width: 0.75rem;
  text-align: center;
}

.cascade-ri-chevron.open {
  transform: rotate(90deg);
}

.cascade-ri-label {
  font-family: 'Orbitron', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(200, 190, 170, 0.9);
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.6);
}

.cascade-ri-body {
  margin-top: 0.5rem;
}
</style>
