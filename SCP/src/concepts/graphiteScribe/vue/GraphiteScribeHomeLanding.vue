<script setup lang="ts">
/**
 * GraphiteScribeHomeLanding — Template Suite 8 Page (DSSLS · Domain-Scoped SCP Landing Scaffold)
 *
 * The pared-down Cadmium homepage shape. This is the page the install Opus adapts
 * (S9-DomainPageCreate + S10-HomePageAdapt) into the user's domain Suite 8 as the
 * SCP HOME PAGE. The Cadmium research-pipeline machinery (bulletins, topics, sweep,
 * dispatch) has been removed — what remains is the three-zone scaffold any domain
 * Suite 8 can claim by filling the ADAPT markers below:
 *
 *   Zone 1 · DOMAIN HEADER       — the Suite 8 name + one-line identity (hifi-pane · suite-tier)
 *   Zone 2 · SSMC                — ScsBridgeSessionManagement (mode=specific · graphiteScribeName)
 *   Zone 3 · DOMAIN WORK SURFACE — a clearly-delimited section the Opus fills in minutes
 *
 * The install Opus edits the `ADAPT:` markers on the fly: it reads the user's domain
 * from their muxified Cascades/8_SUITES/{name}/Instance.md identity, writes the domain
 * name + tagline, binds the SSMC graphiteScribeName, and fills the work surface. Then it flips
 * `isMainLanding: true` (SAMLS) so this page becomes the SCP's `/` route.
 *
 * Patterns: DSSLS · SSMC · SAMLS · CACB
 * Citation: TU-ARC-S2-ORANGE-NAMING.md (DSSLS · SSMC · SAMLS) · TU-ARC-S1-RED-CURATION.md §4 (ISMC)
 * Reference model: CadmiumLanding.vue (the populated domain page this scaffold pares down)
 */
import { ref, shallowRef, computed, onMounted, onUnmounted, inject } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
// IUPA · the graphiteScribe CLIENT concept supplies this landing's page Muxium (mirrors CadmiumLanding
// supplying createCadmiumClientConcept). The SSMC's GPIM controller binding needs a live Muxium.
import { createGraphiteScribeClientConcept } from '../graphiteScribe.concept.client';
import { graphiteScribeMuxonomic } from '../graphiteScribe.muxonomy';
// SSMC · the importable Session Management component (mode=specific · graphiteScribeName) — the SAME
// import + props CadmiumLanding.vue:37 uses. This binds the session list to the domain Suite 8.
// GPIM · Vue-layer Muxium binding into the universal scsBridge controller (the SSMC reads its
// bridgeJson + sessionsList shallowRefs through this controller). SCS_BRIDGE_CONTROLLER_KEY = the
// W2 forge-door inject key (the branch-aware turn-over leg · inject-with-getGlobal fallback).
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridge/scsBridgeController';
// GTMS8C · the FS-parsed Base Cascade Menu — the shared MenuStage contract + the generic menu
// component (the renderer · carries its OWN anchor-alive guard internally · S4 Risk-2).
import type { MenuStage, MenuDocument } from '../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE, EMPTY_MENU_DOCUMENT } from '../../../model/shatteriteMenu.model';
import ShatteriteMenu from './components/ShatteriteMenu.vue';
// IE-D4 · CREATE-S8 DYNAMIC LINKAGE · the LIVE D-O widget (the per-concept GraphiteScribeCascadeDocs ·
// reads THIS designation's Cascades/Extended/<name>/ pair from the Tier-2 suiteCascade cascades Record ·
// designation-aware · General unpinned). Replaces the prop-fed SuiteCascadeDiamondOnyxPane at the ZONE 1
// WTO Triptych RI-widget seat — the lowest-diff live seat. Leads the triptych (1st · context).
import GraphiteScribeCascadeDocs from './components/GraphiteScribeCascadeDocs.vue';
// PRE-EPOCH · decision 5 · the MINIMAL default standing menu (spawn-anchor row + documentation row).
import { GRAPHITESCRIBE_DEFAULT_MENU_STAGE } from '../model/graphiteScribeDefaultMenu.model';
// W3 · THE ONE-BAR SUBNAV (D-EF-0) · the Card subpage mounts the GraphiteScribeCard by this page's display name.
import type { GraphiteScribeEntry } from '../graphiteScribe.type';
import GraphiteScribeCard from './components/GraphiteScribeCard.vue';
// W2 · THE FORGE MENU DOOR — the branch-aware two-state door reused VERBATIM from GraphiteScribeBiplane
// (the forge-door idiom · the .shatterite-menu Pewter family). The turn-over leg reads the live git
// branch (gitm.json relay · inject-with-getGlobal fallback), the engage leg anchor-spawns Entourage Forge.
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../gitm/gitmController';
import { isWorkingBranchPer } from '../../gitm/gitm.type';
import {
  writeGitmTurnoverProgress,
  GITM_TURNOVER_DEADLINE_MS,
} from '../../../model/gitmTurnover.model';
import { showBridgeStandby } from '../../webSocketClient/model/bridgeStandbyOverlay.model';
// MD-9 · D-MC-3 · Per-Instance Model Control · the Forge Actualization model selection. The catalog
// mirror (labels/tiers/blurbs) + the offscreen-safe in-DOM dropdown (native <select> popups are
// OS-anchored and can NEVER open on the offscreen SCP surface). The Session Management spawn-model-row
// idiom, brought into the Forge launch pane so the user picks WHICH model the Actualization uses.
import { SCS_AVAILABLE_MODELS, SCS_DEFAULT_MODEL, scsModelLabel } from '../../scsBridge/model/scsModelCatalog.model';
// BO-1 · the rename-proof anchor contract (the C373 s8 law · never-copied scsBridge model).
import { resolveS8Anchor, findLiveS8Session, filterS8Sessions } from '../../scsBridge/model/s8Anchor.model';
// MD-CE-4 · THE EDITOR SURFACE — the CM6+vim island filling Zone 3 (the domain work surface).
import GraphiteScribeSurface from './components/GraphiteScribeSurface.vue';
// MD-CE-5 · THE FILE BROWSER — the lazy tree beside the surface (shared open circuit).
import GraphiteScribeFileTree from './components/GraphiteScribeFileTree.vue';

// ============================================================
// ADAPT: DOMAIN IDENTITY
// The install Opus fills these two refs from the user's muxified Instance.md identity.
// `graphiteScribeName` MUST byte-match the Suite 8 directory name (Cascades/8_SUITES/{name}/) so the
// SSMC mode=specific filter narrows the session list to THIS domain's sessions.
// ============================================================
// ADAPT: replace 'Code Editor' with the user's Suite 8 designation (from Instance.md Designation).
const domainName = ref<string>('Graphite Scribe');
// ADAPT: replace with the user's one-line domain identity (from Instance.md Identity / tagline).
const domainTagline = ref<string>(
  'Your project, now a first-class Suite 8 within the Stratidian Manifold.',
);
// ADAPT: set this to the EXACT Cascades/8_SUITES/{name}/ directory name so SSMC filters correctly.
const graphiteScribeName = ref<string>('Graphite Scribe');

// SSMC · reactive reads from the global scsBridge controller (shallowRefs · same idiom as
// CadmiumLanding bridgeJsonForSm / sessionsListForSm). computed() re-reads on every change.
const bridgeJsonForSm = computed(() => getGlobalScsBridgeController()?.bridgeJson.value ?? null);
const sessionsListForSm = computed(() => getGlobalScsBridgeController()?.sessionsList.value ?? []);

// PRE-EPOCH · BSSM · the live keyed per-designation Shatterite Menu stage for THIS page's
// designation. The N-watcher SMRP relay flows shatteriteMenus[graphiteScribeName] into here; absent a live
// stage it stays EMPTY_MENU_STAGE and ShatteriteMenu renders the GRAPHITESCRIBE_DEFAULT_MENU_STAGE
// (passed as :default-stage · decision 5). The scalar `menuStage` slot is superseded for the page
// render by this keyed read (the scalar pipe remains for backward-compat in the concept).
const menuDocument = ref<MenuDocument>(EMPTY_MENU_DOCUMENT);

// PRE-EPOCH · WTO triptych · the RI widget content (loadedDiamondContent / loadedOnyxContent from the
// graphiteScribe state · populated by D4 Diametric reads · empty at first render → the pane shows its built-in
// empty state · S6 composition gap note). Passed `|| null` so the pane's bothNull branch renders.
const loadedDiamondContent = ref<string>('');
const loadedOnyxContent = ref<string>('');

// ============================================================
// W3 · THE ONE-BAR SUBNAV (D-EF-0) — Home · Card. Home = the current island contents (the RI
// widget + the Forge menu + the Shatterite Menu + the Session Manager); Card = the GraphiteScribeCard
// mounted by THIS page's display name (the biplane-tab idiom · GraphiteScribeBiplane's HOME|CARD standard).
// ============================================================
type HomeTab = 'home' | 'card';
const activeTab = ref<HomeTab>('home');

// W3 · THE CARD ENTRY — a minimal GraphiteScribeEntry keyed on THIS page's display name (graphiteScribeName). The
// local-roster fetch below fills its snippet + color; before it resolves the Card renders the name
// with the base placeholder (never a broken surface). GraphiteScribeCard consumes {entry, domain, snippet}.
const selfSnippet = ref<string>('');
const cardEntry = computed<GraphiteScribeEntry>(() => ({
  name: graphiteScribeName.value,
  directoryPath: `Cascades/8_SUITES/${graphiteScribeName.value}`,
  description: selfSnippet.value.length > 0 ? selfSnippet.value : 'Suite 8',
  color: '#9aa0a8',
}));

// ============================================================
// W2 · THE FORGE PREDICATE — the generated page knows its own 8_SUITES dir name (graphiteScribeName · the
// display-name binding). Fetch THIS SCP's local-roster and read the entry matching graphiteScribeName for
// its isUnactualized flag (the GraphiteScribeLanding idiom · the raw Instance.md still carries the scaffold's
// '**Domain**: TBD'). true → the Forge menu shows at the TOP of Home; the Forge writes the real
// Domain → the next roster load flips this false → the menu SELF-CLEARS (dissolving-once-set).
// ============================================================
// W1 · THE FORGE PREDICATE (robust) — a GENERATED page is un-forged by construction: its concept
// was minted by `graphiteScribe:page` but NO Cascades/8_SUITES/{display-name}/ scaffold exists yet, so THIS
// page's own roster self-entry is ABSENT. Absence IS the forgeable signal (alongside the explicit
// '**Domain**: TBD' mark on a scaffold that DOES exist). The predicate is therefore: show the launch
// UNLESS a real self-entry resolves that is NOT unactualized. The launch SELF-CLEARS only once the
// Forge writes a real Instance.md whose roster entry reports isUnactualized === false.
//
// C370-B · RENAME-PROOF ROUTE: the roster fetch uses /s8/local-roster (the `s8` string carries no
// `graphiteScribe`/`GraphiteScribe` token, so `graphiteScribe:page`'s copy-move-rename can NEVER rewrite it) — a GENERATED
// page now reads a WORKING roster keyed by its DISPLAY name (graphiteScribeName · the 8_SUITES dir). The
// forge predicate therefore self-clears honestly once the Forge writes the real Instance.md.
// HONEST-FETCH GUARD (belt-and-braces): should any prefix ever go unrouted, the SPA HTML fallback
// returns 200 + '<!DOCTYPE html>'. We treat a non-array / HTML body as ABSENT (never parse the SPA
// shell as data) → the launch shows (the SAFE side · the page is un-forged). Only a genuine JSON
// array with a self-entry that reports isUnactualized === false can flip the launch off.
const isUnactualized = ref<boolean>(true);

async function refreshSelfForgeState(): Promise<void> {
  try {
    const r = await fetch('/s8/local-roster', { headers: { Accept: 'application/json' } });
    if (!r.ok) return; // route present but errored → keep the default (launch shows · un-forged)
    const ct = (r.headers.get('content-type') ?? '').toLowerCase();
    const body = await r.text();
    // SPA fallback / non-JSON → NOT a roster (the renamed route is unrouted on a generated page).
    if (!ct.includes('json') && /^\s*<(?:!doctype|html)/i.test(body)) return;
    let entries: Array<{ name: string; snippet?: string; isUnactualized?: boolean }>;
    try {
      entries = JSON.parse(body);
    } catch {
      return; // unparseable → absent → keep the launch (un-forged).
    }
    if (!Array.isArray(entries)) return;
    const self = entries.find((e) => e.name === graphiteScribeName.value);
    if (self) {
      // A real self-entry resolved: honor its forge state (TBD mark → still forgeable).
      isUnactualized.value = self.isUnactualized === true;
      selfSnippet.value = (self.snippet ?? '').trim();
    }
    // No self-entry → generated-but-unforged → keep isUnactualized = true (the launch shows).
  } catch {
    /* offline / SSR-guard — keep the default (the launch shows; the Forge is the only build path). */
  }
}

// ============================================================
// W2 · THE FORGE'S DOOR — Engage Entourage Forge (ANCHOR spawn · reused from GraphiteScribeBiplane VERBATIM).
// NO asWorker → the bridge quality runs claimAnchorIfUnclaimed → the Forge binds THIS page's anchor.
// ============================================================
const forgeSpawning = ref<boolean>(false);
const forgeSpawnNote = ref<string>('');

// W1 · THE PULSE — the prismatic launch pane PULSES (a soft spectrum glow) to draw the eye UNTIL the
// user first engages it (first hover anor first click/utilization). A simple session ref (no storage):
// once true, the pulse class drops for the rest of the session. Both mouseenter and any door action
// settle it — the invitation is answered the moment it is acknowledged.
const forgeLaunchEngaged = ref<boolean>(false);
function settleForgeLaunchPulse(): void {
  if (!forgeLaunchEngaged.value) forgeLaunchEngaged.value = true;
}

async function engageEntourageForge(): Promise<void> {
  // C375 · THE ENGAGE AWAIT HARDENING · THE GUARD-TELEMETRY LAW — log at ENTRY so the relay names
  // this exact drop on any future failure (the click reached the handler).
  console.log('[Forge Engage] clicked');
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || forgeSpawning.value) return;
  settleForgeLaunchPulse(); // W1 · utilization drops the pulse
  forgeSpawning.value = true;
  forgeSpawnNote.value = '';
  try {
    // C375 · THE ENGAGE AWAIT HARDENING · THE TIMEOUT RACE. The C373 addition `await ctrl.getScpName()`
    // could hang forever if the /scp-config fetch never settled (a never-settling getScpName hangs the
    // await; the finally never runs; the dispatch is never reached; silence). Race it against a 3s
    // timeout so the await can NEVER hang the dispatch — a null/timeout proceeds with undefined and the
    // bridge resolves the default SCP dir. (loadScpConfig is now 3s-abort-bounded at source too; the
    // race is belt-and-braces against ANY future getScpName stall.)
    console.log('[Forge Engage] before scpName resolve');
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    if (scpName === undefined) {
      console.log('[Forge Engage] scpName resolve fell back to undefined (null/timeout) · proceeding with bridge default');
    }
    console.log('[Forge Engage] after scpName resolve · scpName=', scpName ?? null);
    // C386 · THE ONE MOTION — a LIVE Forge conduction for THIS SCP is FOCUSED, never duplicated. Read
    // the live sessionsList (the Session Management source · the controller relay) for an Entourage Forge
    // session scoped to this SCP whose liveness read says alive (status==='launched' · the PPOL alive
    // idiom). Found → triggerFocusSession(that ulid) + settle. ELSE → a NEW conduction (fresh:true) so
    // the bridge, on an OFFLINE prior anchor, creates a fresh session + re-claims the anchor (never a
    // resume). The pane is mortal — it dissolves on completion (isUnactualized · untouched).
    const liveForge = findLiveS8Session(ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName);
    if (liveForge) {
      console.log('[Forge Engage] ONE MOTION · live Forge found · focusing · ulid=', liveForge.id);
      ctrl.triggerFocusSession(liveForge.id);
      forgeSpawnNote.value = 'Focused the running Forge.';
      return;
    }
    // ANCHOR spawn — the forge-door idiom (GraphiteScribeBiplane.engageEntourageForge). The Forge researches
    // + builds this domain, writing the real Domain into the minted Instance.md. C373 · triggerSpawnS8Session
    // (the rename-proof alias) — the `graphiteScribe:page` domain-token rewrite leaves `s8` intact against the
    // shared controller, unlike the dangling triggerSpawn{Domain}Session the old name would produce.
    // C386 · fresh:true (4th arg) — a NEW conduction (never resume a prior one): on an OFFLINE anchor
    // the bridge creates a fresh session + re-claims the anchor rather than re-engaging the dead one.
    ctrl.triggerSpawnS8Session('Entourage Forge', scpName, false, true);
    console.log('[Forge Engage] after triggerSpawnS8Session (fresh)');
    forgeSpawnNote.value = 'Entourage Forge engaged. It will research and build out this Suite.';
  } catch {
    forgeSpawnNote.value = 'Could not engage the Entourage Forge — is the Bridge running?';
  } finally {
    setTimeout(() => {
      forgeSpawning.value = false;
    }, 1200);
  }
}

// ============================================================
// MD-9 · D-MC-3 · Per-Instance Model Control · THE ACTUALIZATION MODEL SELECT — the user picks WHICH
// model the Forge's Actualization uses. Seeded to the default (Opus 4.8); on change we push it to the
// controller (→ pendingSpawnModel state) so the NEXT spawn (the Entourage Forge anchor) pins it. The
// selection is PERSISTENT (not a per-click trigger) — the Session Management spawn-model-row idiom.
// The Engage-button label notes the choice; the Turn-Over leg restarts the SCP (no session spawn), so
// the model does not thread there — no note on that leg.
// ============================================================
const selectedModel = ref<string>(SCS_DEFAULT_MODEL);
const selectedModelLabel = computed<string>(
  () => scsModelLabel(selectedModel.value) ?? selectedModel.value,
);

// ============================================================
// C386 · W3 · THE PREVIOUS-CONDUCTIONS ROW — beneath the Engage button, list this SCP's OFFLINE
// Entourage Forge sessions (up to 3) so the user can DELIBERATELY re-open one (the resume leg the
// Session Management rows use · triggerEngageSession). Modest, muted, no ceremony — the pane is
// mortal. resolvedScpName is filled on mount (best-effort · null → match by graphiteScribeName alone).
// ============================================================
const resolvedScpName = ref<string | null>(null);
const previousForgeConductions = computed(() => {
  const list = getGlobalScsBridgeController()?.sessionsList.value ?? [];
  const scp = resolvedScpName.value;
  return filterS8Sessions(list, 'Entourage Forge')
    .filter((s) => (scp === null || s.scpName === scp) && s.status === 'offline')
    .slice(0, 3);
});
function shortUlid(id: string): string {
  return id.length > 8 ? id.slice(-8) : id;
}
function conductionModelLabel(model: string | undefined): string {
  return model ? scsModelLabel(model) ?? model : 'default model';
}
function reopenConduction(id: string): void {
  console.log('[Forge Previous] re-opening conduction · ulid=', id);
  getGlobalScsBridgeController()?.triggerEngageSession(id);
}
const modelDropdownOptions = computed(() =>
  SCS_AVAILABLE_MODELS.map((m) => ({ value: m.id, label: m.label, hint: m.tier, title: m.blurb })),
);
function handleForgeModelChange(): void {
  getGlobalScsBridgeController()?.setSpawnModel(selectedModel.value);
}

// ============================================================
// W2 · THE TWO-STATE DOOR — branch-aware (reused from GraphiteScribeBiplane VERBATIM). Forging modifies this
// Suite's ground, so the work moves onto a working (B) branch first. On a NON-'b/' branch (the A side ·
// the safe default when the branch read is absent) the door is the TURN OVER REQUEST; on a 'b/' branch
// it is the Engage-the-Forge anchor spawn.
// ============================================================
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
const scsBridgeControllerForDoor =
  inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');

// MD-CE-5 · THE TREE BADGE MAP — gitm.json paths are REPO-ROOT-relative (the bridge watches the
// user project) while the tree's paths are SCP-PACKAGE-relative; the SCP package lives somewhere
// under the repo (dev:self: Cascades/scps/template/SCP/…). SUFFIX-STRIP: keep the segment after
// the LAST '/SCP/' marker anor the whole path when the repo root IS the SCP root (an installed
// standalone). 'M' unstaged · 'U' untracked · 'A' staged · 'C' conflict (conflict wins).
function scpRelative(repoPath: string): string {
  const marker = repoPath.lastIndexOf('/SCP/');
  return marker === -1 ? repoPath : repoPath.slice(marker + 5);
}
const treeBadges = computed<Record<string, string>>(() => {
  const gj = gitmController?.gitmJson.value;
  if (!gj) return {};
  const badges: Record<string, string> = {};
  for (const p of gj.stagedFiles ?? []) badges[scpRelative(p)] = 'A';
  for (const p of gj.unstagedFiles ?? []) badges[scpRelative(p)] = 'M';
  for (const p of gj.untrackedFiles ?? []) badges[scpRelative(p)] = 'U';
  for (const p of gj.conflicts ?? []) badges[scpRelative(p)] = 'C';
  return badges;
});
// D-BN · THE branchRoles SWEEP — the working-B identity is the canonical roles.b (isWorkingBranchPer),
// NOT the `b/` prefix (the prefix is the legacy fallback inside the helper).
const onWorkingB = computed<boolean>(() =>
  isWorkingBranchPer(currentBranch.value, gitmController?.gitmJson.value),
);
const showTurnOverDoor = computed<boolean>(() => !onWorkingB.value);

const turnOverSpawning = ref<boolean>(false);
const turnOverNote = ref<string>('');

async function requestTurnOverToB(): Promise<void> {
  const sb = scsBridgeControllerForDoor;
  if (!sb || turnOverSpawning.value) return;
  settleForgeLaunchPulse(); // W1 · utilization drops the pulse
  turnOverSpawning.value = true;
  turnOverNote.value = '';
  try {
    const fromBranch = currentBranch.value.length > 0 ? currentBranch.value : 'a';
    // D-BN · THE branchRoles SWEEP · THE CANONICAL MINT — `b/<fromBranch>-<uuid>`, fromBranch VERBATIM
    // (no prefix stripping) + crypto.randomUUID() (browser global · unique · replaces the legacy Date.now()).
    const newBranch = `b/${fromBranch}-${crypto.randomUUID()}`;
    showBridgeStandby('sword-b');
    writeGitmTurnoverProgress({
      source: 'B',
      overlayVariant: 'sword-b',
    turnClass: 'sword',
      deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
      stableA: fromBranch,
      bridgeEndpoint: sb.bridgeJson.value?.endpoint ?? '',
      scpName: (await sb.getScpName()) ?? undefined,
    });
    // ONE dispatch — git switch -c carries the dirty tree onto B; nodemon restarts on B.
    sb.triggerHardTurnOver('B', newBranch, true);
    turnOverNote.value = 'Turning over to B — the SCP restarts on your working branch…';
  } catch {
    turnOverNote.value = 'Could not turn over to B — is the Bridge running?';
  } finally {
    setTimeout(() => {
      turnOverSpawning.value = false;
    }, 1200);
  }
}

// WIRE.1 · SOE · the anchor-spawn PROMPT is now owned by the ShatteriteMenu (the origin of
// engagement) — it reads this Suite 8's anchorSpawn mode itself in onMounted and surfaces its own
// Spawn + Anchor button when there is no live anchor. The page no longer renders a spawn-prompt row
// nor reads anchorSpawnMode here. The PPOL poll below KEEPS its alive→focus / offline→engage branches
// (page-load convenience) but DEFERS first-run spawn entirely to the menu (no page-level spawn).

let muxium: Muxium<ClientMuxiumDeck> | null = null;
// MD-CE-4 · THE REACTIVE MUXIUM HAND-OFF — the plain `let muxium` is assigned in onMounted
// AFTER the first render, so a child receiving `:muxium="muxium"` captures null and never
// re-receives it without an unrelated re-render (the C431 finding). The shallowRef makes the
// hand-off reactive: the surface's watcher binds its stage plan the moment the muxium lands.
const surfaceMuxium = shallowRef<Muxium<ClientMuxiumDeck> | null>(null);

// C376 · THE CLICK-PATH PROBE (capture phase on the prismatic pane): logs the exact element
// every click lands on INSIDE the pane — the relay then names whatever swallows the pointer.
function logForgeClickPath(e: MouseEvent): void {
  const t = e.target as HTMLElement | null;
  console.log(
    '[Forge ClickPath] target=', t?.tagName, '· class=', (t?.className ?? '').toString().slice(0, 80),
  );
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // C376 · THE MOUNT STAMP — the relay's proof of WHICH build the window is running.
  console.log('[GraphiteScribeHomeLanding] mounted · build=C376-pointerfix-clickprobe');

  // IUPA · this landing supplies graphiteScribe as the muxonomic page concept (the SSMC controller
  // binding needs a live Muxium; the domain work surface can dispatch into it once adapted).
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createGraphiteScribeClientConcept(), muxonomy: graphiteScribeMuxonomic }],
    {
      title: 'GraphiteScribeHomeLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller (so the SSMC's
  // spawn/engage/focus actions route through it · mirrors CadmiumLanding onMounted).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);
  // MD-CE-4 · the reactive hand-off to the editor surface (see surfaceMuxium declaration).
  surfaceMuxium.value = muxium;

  // ============================================================
  // ADAPT: DOMAIN WORK SURFACE — onMounted wiring
  // If the domain work surface needs live state, add the stage-planner subscription here
  // (mirror CadmiumLanding's `muxium.plan(...)` + `d.client.d.graphiteScribe.k.<prop>.select()` reads).
  // The scaffold ships with a static work surface; wire reactive state only when the domain needs it.
  // ============================================================

  // PRE-EPOCH · BSSM · subscribe the page muxium's keyed shatteriteMenus Record + the RI widget
  // content into reactive refs. The N-watcher SMRP relay dispatches graphiteScribeSetDesignationMenuStage into
  // this page muxium; the selector flows the keyed Record in, and we read THIS page's designation key
  // (graphiteScribeName), falling back to EMPTY_MENU_STAGE (the default menu is supplied via :default-stage).
  // loadedDiamondContent / loadedOnyxContent feed the WTO RI widget (Tier-2 page-muxium reach · graphiteScribe
  // is mounted under client). Mirrors the cadmiumLandingSubscription staging/stage/d__ shape.
  muxium.plan<ClientMuxiumDeck>(
    'graphiteScribeMenuStageSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.graphiteScribe.k.shatteriteMenus.select() as Record<string, MenuDocument>;
            menuDocument.value = record[graphiteScribeName.value] ?? EMPTY_MENU_DOCUMENT;
            loadedDiamondContent.value = d.client.d.graphiteScribe.k.loadedDiamondContent.select() as string;
            loadedOnyxContent.value = d.client.d.graphiteScribe.k.loadedOnyxContent.select() as string;
          },
          {
            selectors: [
              d__.client.d.graphiteScribe.k.shatteriteMenus,
              d__.client.d.graphiteScribe.k.loadedDiamondContent,
              d__.client.d.graphiteScribe.k.loadedOnyxContent,
            ],
          },
        ),
      ]),
  );

  // GTMS8C · PPOL+PAOLRP · Persistent Spawn-on-Page-Load. One-shot plan; the settle poll
  // (alive→focus · offline→engage · absent-after-3s→defer-to-menu) keyed on isAnchor. The poll runs in
  // a setInterval (macrotask · PPOL-WUD safe · NOT a plan selector · #616 recursion guard). 250ms/3000ms.
  // The designation source is the graphiteScribeName ref (the ADAPT marker · Design Decision 3) — the SSMC
  // filter, this PAOLRP, and the ShatteriteMenu anchor-lookup ALL read graphiteScribeName (W3-A).
  //
  // C489 · THE PAGE CARRIES NOTHING (Cadmium parity · the alignment law): the ShatteriteMenu
  // IS the anchor lifecycle — the easy-import self-contained element (spawn · re-engage ·
  // tombstone · the one switch). The legacy page-side PPOL (a muxium plan + 3s settle poll
  // per mount, duplicating the menu's decide) is ERASED — this is also the Cadmium-vs-GS
  // startup gap the user measured.

  // W2 · seed the Forge predicate + the Card snippet from THIS SCP's OWN local-roster (keyed by
  // graphiteScribeName). Runs once on mount; the Forge menu shows only while isUnactualized === true.
  void refreshSelfForgeState();

  // MD-9 · seed pendingSpawnModel with the picker's initial default so the FIRST Forge spawn threads
  // it (the Session Management onMounted idiom). The controller was bound to this page's Muxium above
  // (setMuxium) — setSpawnModel needs a bound Muxium, so this runs after that binding.
  getGlobalScsBridgeController()?.setSpawnModel(selectedModel.value);

  // C386 · W3 · resolve THIS SCP's name (best-effort) so the previous-conductions row filters to this
  // SCP's OFFLINE Forge sessions. Null on failure → the row matches by graphiteScribeName alone (safe superset).
  void (async () => {
    try {
      resolvedScpName.value = (await getGlobalScsBridgeController()?.getScpName()) ?? null;
    } catch {
      resolvedScpName.value = null;
    }
  })();
});

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium (mirror CadmiumLanding onUnmounted).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  // muxium.close() concludes the menuStage subscription plan (and all page plans) too.
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="domain-landing">
    <!-- ============================================================
         ZONE 1 · DOMAIN HEADER
         ADAPT: the hifi-pane-base neutral pane can become any suite tier — swap to
         hifi-pane-cobalt / hifi-pane-viridian / hifi-pane-orange etc. to match the
         user's chosen Suite 8 color (the muxonomy `color` field · S10 sets it).
         ============================================================ -->
    <header class="domain-header hifi-pane-base">
      <!-- ADAPT: domainName renders the Suite 8 designation. spectrum-text is neutral;
           swap for a suite-tier text-shadow class once the color is chosen. -->
      <h1 class="hifi-heading spectrum-text">{{ domainName }}</h1>
      <p class="domain-tagline hifi-label">{{ domainTagline }}</p>
    </header>

    <!-- ============================================================
         W3 · THE ONE-BAR SUBNAV (D-EF-0) — Home · Card. Home = the current island contents (RI
         widget + Forge menu + Shatterite Menu + Session Manager); Card = the GraphiteScribeCard by display
         name (the biplane-tab idiom · GraphiteScribeBiplane HOME|CARD standard).
         ============================================================ -->
    <nav class="domain-subnav hifi-pane-base">
      <button
        type="button"
        :class="['subnav-tab', 'tab-btn--amethyst', { 'subnav-tab--active': activeTab === 'home' }]"
        @click="activeTab = 'home'"
      >
        Home
      </button>
      <button
        type="button"
        :class="['subnav-tab', 'tab-btn--viridian', { 'subnav-tab--active': activeTab === 'card' }]"
        @click="activeTab = 'card'"
      >
        Card
      </button>
    </nav>

    <!-- ===================== HOME SUBPAGE ===================== -->
    <main v-if="activeTab === 'home'" class="domain-content">
      <!-- C459 · GRAPHITE SCRIBE RECOMPOSITION — the Editor LEADS (the domain work surface IS
           the domain), Cascade pane after, Shatterite Menu last. The Prismatic Forge launch and
           the Session Manager are PRUNED from this Suite (the user's Magic Shotgun directive);
           the forge script machinery remains dormant for the minting scaffold. -->
      <section class="hifi-pane-base ce-work-surface-pane">
        <h2 class="hifi-heading">Editor</h2>
        <div class="ce-workbench">
          <!-- MD-CE-5 · THE FILE BROWSER — lazy tree + GitM badges; click rides the
               shared open circuit into the surface's tab strip. -->
          <aside class="ce-workbench-tree">
            <GraphiteScribeFileTree :muxium="surfaceMuxium" :badges="treeBadges" />
          </aside>
          <div class="ce-workbench-editor">
            <GraphiteScribeSurface :muxium="surfaceMuxium" />
          </div>
        </div>
      </section>

      <!-- ============================================================
           IE-D4 · WTO TRIPTYCH · ZONE 1 (1st) · the LIVE RI widget — GraphiteScribeCascadeDocs.
           Leads the triptych (context-first · user-binding order RI → Menu → Session Manager ·
           decision 4). Reads THIS designation's Cascades/Extended/<graphiteScribeName>/ Diamond+Onyx
           pair LIVE from the Tier-2 suiteCascade cascades Record (designation-aware · the pane reads
           its OWN cascade, NOT the hard-coded General). Replaces the prop-fed
           SuiteCascadeDiamondOnyxPane (the empty-slot placeholder) with the live two-pane surface.
           ============================================================ -->
      <!-- C907 · THE PROOF-OF-CONCEPT NOTE — between the Editor and the Cascade Memory. -->
      <section class="hifi-pane-base scribe-poc-note">
        <h3 class="hifi-heading">A Proof of Concept — Yours to Expand</h3>
        <p>
          The Graphite Scribe is a Proof of Concept editor you can expand on if you so wish.
          Treat the Scribe's Anchor as the project context of your own modification of the
          Graphite Scribe itself — the editor becomes the workshop for its own next form.
        </p>
        <p class="scribe-poc-founder">
          A note from the founder: part of why this editor stays a Proof of Concept is that
          TypeScript's type system falls apart on Stratimux projects past a certain point —
          the recursively halting type system gets trashed by TypeScript. Fine in
          low-complexity projects, but useless when larger. Part of the goal of this release
          is to begin work on a TypeScript variant that would better support a type system
          for Higher-Order Compositional Programming.
          <a href="https://scs-origin.com/contribute" target="_blank" rel="noopener">scs-origin.com/contribute</a>
        </p>
      </section>

      <GraphiteScribeCascadeDocs :designation="graphiteScribeName" />

      <!-- ============================================================
           PRE-EPOCH · WTO TRIPTYCH · ZONE 2 (2nd) · the Shatterite Menu. ShatteriteMenu carries the
           MANDATORY anchor-alive guard INTERNALLY (optionsEnabled gates dispatch on a live anchor ·
           S4 Risk-2) — so the menu can safely LEAD the Session Manager visually without blocking on
           session confirmation (decision 4 · the guard makes the order safe). :menu-stage is the
           live keyed relay state (shatteriteMenus[graphiteScribeName]); :default-stage is the MINIMAL default
           menu (decision 5) the component renders when no live stage exists; :graphiteScribe-name binds the
           anchor lookup to the SAME designation the SSMC + PAOLRP use.

           WIRE.1 · SOE · the spawn-anchor PROMPT now lives INSIDE the ShatteriteMenu (the origin of
           engagement): with no live anchor + anchorSpawn 'prompt' the menu surfaces its own Spawn +
           Anchor button; the page no longer renders a separate spawn-prompt row.
           ============================================================ -->
      <!-- C489 · THE EASY-IMPORT DOCTRINE: this menu is the BASE Shatterite (the Anchor
           Authority · default). Compose MORE menus for the same designation anywhere on the
           page as SUPPORTING Shatterites with :no-anchor-authority="true" — they render +
           dispatch to the SAME live session; only the Base contains the lifecycle
           (the Cadmium Researcher pattern: Landing=Base · TargetedResearch=Supporting). -->
      <div class="domain-menu-zone">
        <ShatteriteMenu
          :menu-stage="EMPTY_MENU_STAGE"
          :menu-document="menuDocument"
          :default-stage="GRAPHITESCRIBE_DEFAULT_MENU_STAGE"
          :graphiteScribe-name="graphiteScribeName"
          title="Base Cascade Menu"
        />
      </div>

    </main>

    <!-- ===================== CARD SUBPAGE ===================== -->
    <main v-else class="domain-content domain-card-page">
      <!-- W3 · THE CARD — the GraphiteScribeCard mounted by THIS page's display name (the biplane CARD tab). -->
      <GraphiteScribeCard
        :key="cardEntry.name"
        :entry="cardEntry"
        :domain="selfSnippet"
        :snippet="selfSnippet"
        :compact="false"
      />
    </main>
  </div>
</template>

<style scoped>
.domain-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
  font-family: system-ui, -apple-system, sans-serif;
}

.domain-header {
  text-align: center;
  margin: 0 auto 2rem;
  max-width: 1000px;
  border-radius: 8px;
  padding: 1.5rem;
}

.domain-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}

.domain-tagline {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.95rem;
  margin: 0;
}

.domain-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.domain-menu-zone {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ============================================================
   W3 · THE ONE-BAR SUBNAV (D-EF-0) — the same-page tab idiom (GraphiteScribeBiplane bearing · zero raw hex).
   ============================================================ */
.domain-subnav {
  display: flex;
  gap: 0.5rem;
  max-width: 1000px;
  margin: 0 auto 1.5rem;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}

.subnav-tab {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.375rem 1.1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--tab-dark, rgba(0, 0, 0, 0.4));
  background: var(--color-board-dark, #1a1a2e);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn--amethyst {
  --tab-accent: var(--color-amethyst, #a855f7);
  --tab-dark: var(--color-amethyst-dark, #6b21a8);
  --tab-light: var(--color-amethyst-light, #c4b5fd);
}
.tab-btn--viridian {
  --tab-accent: var(--color-viridian, #10b981);
  --tab-dark: var(--color-viridian-dark, #065f46);
  --tab-light: var(--color-viridian-light, #6ee7b7);
}

.subnav-tab:hover {
  border-color: var(--tab-accent);
  color: rgba(255, 255, 255, 0.9);
}

.subnav-tab--active {
  background: var(--tab-accent);
  color: var(--color-board-dark, #1a1a2e);
  border-color: var(--tab-light);
}

.domain-card-page {
  max-width: 560px;
}

/* ============================================================
   W1 · THE PRISMATIC FORGE LAUNCH — a HiFi PRISMATIC variant of the Shatterite Menu pane. The
   .shatterite-menu skeleton (dark Pewter field #14110c · the offset embossed shadow · rounded
   corners) is kept, but the Pewter split-metal border is replaced by a PRISMATIC spectrum border
   (a conic full-spectrum ring painted into a masked ::before) + a spectrum GLOW. The pane PULSES
   (a soft spectrum glow breathe) until the first hover anor first utilization drops .forge-launch--
   pulsing (the forgeLaunchEngaged session ref). Spectrum vocabulary = the --color-red…--color-fuchsia
   HiFi tokens (the same the .spectrum-text heading clips), so it reads as one with the HiFi system.
   ============================================================ */
.forge-launch-prismatic {
  position: relative;
  border-radius: 8px;
  padding: 2px; /* the prismatic ring thickness (the ::before spectrum fills this frame) */
  box-shadow: -3px 3px 0 rgba(91, 83, 71, 0.4);
  isolation: isolate;
}

/* THE PRISMATIC RING — a full-spectrum conic gradient painted into the 2px padding frame. */
.forge-launch-prismatic::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
  /* C375 THE POINTER TRAP: the masked ring paints only the 2px frame but HIT-TESTS across its
     whole box above static children — the Engage button was pointer-dead (zero clicked telemetry)
     while the dropdown (its own stacking context) survived. Decorative layers never take the pointer. */
  pointer-events: none;
  background: conic-gradient(
    from 210deg,
    var(--color-red),
    var(--color-orange),
    var(--color-yellow),
    var(--color-green),
    var(--color-blue),
    var(--color-purple),
    var(--color-fuchsia),
    var(--color-red)
  );
  opacity: 0.85;
}

/* THE SPECTRUM GLOW — a soft blurred spectrum halo behind the pane (animated when pulsing). */
.forge-launch-glow {
  position: absolute;
  inset: -6px;
  border-radius: 12px;
  z-index: -1;
  background: conic-gradient(
    from 210deg,
    var(--color-red),
    var(--color-orange),
    var(--color-yellow),
    var(--color-green),
    var(--color-blue),
    var(--color-purple),
    var(--color-fuchsia),
    var(--color-red)
  );
  filter: blur(14px);
  opacity: 0.28;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* THE PANE FIELD — the dark Pewter body inside the prismatic frame (the .shatterite-menu field). */
.forge-launch-body {
  position: relative;
  z-index: 1;
  background: #14110c;
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* THE PULSE — a soft spectrum-glow breathe, LOOPING until the first hover/utilization settles it.
   Both the ring opacity and the glow halo breathe together (the eye-catch), spoken in spectrum. */
.forge-launch--pulsing .forge-launch-glow {
  animation: forge-launch-glow-pulse 2.2s ease-in-out infinite both;
}
.forge-launch--pulsing::before {
  animation: forge-launch-ring-pulse 2.2s ease-in-out infinite both;
}

@keyframes forge-launch-glow-pulse {
  0%   { opacity: 0.22; filter: blur(12px); }
  50%  { opacity: 0.5;  filter: blur(18px); }
  100% { opacity: 0.22; filter: blur(12px); }
}

@keyframes forge-launch-ring-pulse {
  0%   { opacity: 0.72; }
  50%  { opacity: 1; }
  100% { opacity: 0.72; }
}

/* Accessibility — reduced-motion keeps the prismatic ring + a steady glow, drops the breathe. */
@media (prefers-reduced-motion: reduce) {
  .forge-launch--pulsing .forge-launch-glow { animation: none; opacity: 0.4; }
  .forge-launch--pulsing::before { animation: none; opacity: 0.9; }
}

.forge-launch-heading {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 0.25rem;
}

/* MD-9 · D-MC-3 · THE ACTUALIZATION MODEL ROW — the label + the offscreen-safe ScsDropdown. Rides
   the pane's own gap (the .forge-launch-body flex column · no bespoke margin). Neutral pewter chrome
   (the model picker is system tooling, not a suite-keyed action · the spawn-model-row precedent). */
.forge-model-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative; /* anchor for the ScsDropdown's absolutely-positioned in-DOM drawer */
}
.forge-model-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-pewter, rgba(255, 255, 255, 0.55));
}
.forge-model-dropdown {
  flex: 1 1 auto;
  min-width: 0;
}

.forge-launch-intro {
  color: rgba(230, 226, 216, 0.88);
  font-size: 0.85rem;
  line-height: 1.55;
  margin: 0;
}

.forge-launch-intro--muted {
  color: rgba(206, 202, 194, 0.68);
  font-size: 0.8rem;
}

.forge-launch-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.55rem 1.2rem;
  border-radius: 4px;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  color: #1c1812;
  background: #d8c79a;
  border-top: 1px solid #efe2bb;
  border-right: 1px solid #efe2bb;
  border-bottom: 1px solid #a8975e;
  border-left: 1px solid #a8975e;
  box-shadow: -1px 1px 3px rgba(168, 151, 94, 0.5);
  transition: filter 0.15s ease;
}

.forge-launch-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}

.forge-launch-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* W1 · THE SWORD-B TURN-OVER TREATMENT — rides the GitmSwordBButton ochre neon-edge + chamfer
   language (deep near-black field · the thin ochre/amber ring · the chamfered clip · the neon glyph).
   The turn-over-request leg reads as one with the Sword-B setter it fires. */
.forge-launch-btn--sword-b {
  color: rgb(255, 206, 9);
  background:
    radial-gradient(ellipse at 38% 30%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 13, 5, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(234, 179, 8, 0.09) 0%, rgba(14, 11, 4, 0) 70%),
    rgb(15, 12, 6);
  border: 1px solid rgba(234, 179, 8, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(234, 179, 8, 0.28),
    inset 0 0 10px 0 rgba(234, 179, 8, 0.10);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.6);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.forge-launch-btn--sword-b:hover:not(:disabled) {
  filter: none;
  border-color: rgba(234, 179, 8, 0.9);
  color: rgb(255, 224, 120);
  box-shadow:
    0 0 14px 1px rgba(234, 179, 8, 0.5),
    inset 0 0 14px 0 rgba(234, 179, 8, 0.18);
}

.forge-launch-note {
  color: rgba(216, 199, 154, 0.85);
  font-size: 0.8rem;
  margin: 0;
}

/* C386 · W3 · THE PREVIOUS-CONDUCTIONS ROW — muted pewter, no ceremony (the pane is mortal). A small
   inline-wrap of re-openable OFFLINE conductions beneath the Engage button. */
.forge-previous-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.forge-previous-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(206, 202, 194, 0.55);
}

.forge-previous-btn {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(168, 151, 94, 0.3);
  color: rgba(216, 199, 154, 0.8);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.forge-previous-btn:hover {
  border-color: rgba(216, 199, 154, 0.6);
  background: rgba(0, 0, 0, 0.5);
}

.forge-previous-ulid {
  font-size: 0.68rem;
  color: rgba(230, 226, 216, 0.9);
}

.forge-previous-ulid.mono {
  font-family: var(--font-mono, monospace);
}

.forge-previous-model {
  font-size: 0.6rem;
  color: rgba(206, 202, 194, 0.6);
}

.ce-work-surface-pane {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: 8px;
}
.ce-work-surface-pane h2 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.ce-workbench {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}
.ce-workbench-tree {
  flex: 0 0 240px;
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0.5rem;
}
.ce-workbench-editor {
  flex: 1;
  min-width: 0;
}

/* C907 · the PoC note card. */
.scribe-poc-note { border-radius: 8px; padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; line-height: 1.55; }
.scribe-poc-founder { opacity: 0.85; font-size: 0.9rem; }
.scribe-poc-note a { color: var(--color-blue, #38bdf8); }
</style>
