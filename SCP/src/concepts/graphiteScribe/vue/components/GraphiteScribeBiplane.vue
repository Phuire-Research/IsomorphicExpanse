<script setup lang="ts">
/**
 * GraphiteScribeBiplane.vue — THE BIPLANE PAGE STANDARD (MD-6 · D-BP-1)
 *
 * TWO STARTING SUBPAGES for any Suite 8 detail surface, joined by a same-page HOME | CARD navbar
 * (the tab idiom the GitM sub-page uses · GraphiteScribeSubPageNav bearing). The standard the epoch cascades
 * onto every Suite 8 page (Cadmium · Pewter · SCS-Bridge · the minted default).
 *
 *   HOME subpage:
 *     (a) THE CASCADE DOCUMENTS — the /graphiteScribe/:name/working-docs list (file + firstLine); a click
 *         opens an in-page reader pane fetching /graphiteScribe/:name/working-doc?file=<file> (the MD-6
 *         content route · the traversal guard). 404 → the honest absent note, never breaks.
 *     (b) THE BOUND-ANCHOR SHATTERITE MENU — ShatteriteMenu reused VERBATIM (the same bound-anchor
 *         control GraphiteScribeHomeLanding mounts · the per-NDEP anchor system · SAC anchorConfig). It owns
 *         the anchor bind + its own Spawn + Anchor button internally (WIRE.1 SOE).
 *     (c) THE SPAWN-NOT-ANCHOR CADMIUM — a 'Research this Domain (Cadmium)' button that spawns the
 *         Cadmium Researcher WITHOUT anchoring (triggerSpawnGraphiteScribeSession(name, null, asWorker=true) ·
 *         the worker leg skips claimAnchorIfUnclaimed → a NON-anchor research worker). HONEST SCOPE:
 *         the spawn payload does not carry an initial prompt (no Onboard field on the spawn quality),
 *         so the Suite-8's Instance snippet is NOT delivered inline here — the deliver-vermillion
 *         poll leg is a separate future concern (MD-6 'honest scope if not').
 *
 *   CARD subpage: the MD-5 GraphiteScribeCard expanded (the full anatomy + the reader row) as the second
 *   starting subpage.
 *
 * Citation: DIAMOND-SCP-ACTUALIZATION-EPOCH.md §MD-6 (D-BP-1 · the two-subpage standard).
 * Citation: GraphiteScribeHomeLanding.vue (the ShatteriteMenu bound-anchor mount + PPOL idiom · reused).
 * Citation: GraphiteScribeSubPageNav.vue (the same-page HiFi tab navbar bearing · zero raw hex).
 * Citation: GraphiteScribeCard.vue (MD-5 · the expanded CARD subpage).
 */
import { ref, computed, onMounted, watch, inject } from 'vue';
import type { GraphiteScribeEntry } from '../../graphiteScribe.type';
import type { MenuStage } from '../../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE } from '../../../../model/shatteriteMenu.model';
import { GRAPHITESCRIBE_DEFAULT_MENU_STAGE } from '../../model/graphiteScribeDefaultMenu.model';
import {
  getGlobalScsBridgeController,
  SCS_BRIDGE_CONTROLLER_KEY,
} from '../../../scsBridge/scsBridgeController';
// W1 · THE TWO-STATE DOOR — the branch-aware read. The gitm controller mirrors the gitm.json relay
// (GitmJsonShape.currentBranch · the SCP client's live git-branch surface). inject-with-getGlobal
// fallback is the proven GitM accessor pattern (the same one every GitM toolbar button uses).
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
import { isWorkingBranchPer } from '../../../gitm/gitm.type';
// W1 · the turn-over failsafe carrier + deadline (the SAME single source the Sword-B button writes ·
// HAZARD-5 byte-match) + the standby overlay the WS-close handler re-asserts across the respawn gap.
import {
  writeGitmTurnoverProgress,
  GITM_TURNOVER_DEADLINE_MS,
} from '../../../../model/gitmTurnover.model';
import { showBridgeStandby } from '../../../webSocketClient/model/bridgeStandbyOverlay.model';
import ShatteriteMenu from './ShatteriteMenu.vue';
import GraphiteScribeCard from './GraphiteScribeCard.vue';
// MD-9 · D-MC-3 · Per-Instance Model Control · the Forge Actualization model selection (parity with
// GraphiteScribeHomeLanding's forge launch). The catalog mirror + the offscreen-safe in-DOM dropdown (native
// <select> popups are OS-anchored and can NEVER open on the offscreen SCP surface).
import { SCS_AVAILABLE_MODELS, SCS_DEFAULT_MODEL, scsModelLabel } from '../../../scsBridge/model/scsModelCatalog.model';
// BO-1 · the rename-proof anchor contract (the C373 s8 law · never-copied scsBridge model).
import { findLiveS8Session, filterS8Sessions } from '../../../scsBridge/model/s8Anchor.model';
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

const props = withDefaults(
  defineProps<{
    /** The Suite 8 roster entry (name-bearing · the reader routes + the card consume it). */
    entry: GraphiteScribeEntry;
    /** The domain word (the D9 meaning source · passed through to the card). */
    domain?: string;
    /** The first meaningful Instance.md line (passed through to the card). */
    snippet?: string;
    /** The live keyed Shatterite Menu stage for this designation (falls to EMPTY_MENU_STAGE). */
    menuStage?: MenuStage;
    /**
     * D-EF-3 · THE FORGE PREDICATE — true when this Suite 8's raw Instance.md still carries the
     * scaffold's '**Domain**: TBD' (named, but not yet forged). Surfaces the Forge door at the TOP
     * of the Overview stack. The Forge writes the real Domain → next roster load flips this false →
     * the door self-clears.
     */
    isUnactualized?: boolean;
  }>(),
  { domain: '', snippet: '', menuStage: () => EMPTY_MENU_STAGE, isUnactualized: false },
);

const emit = defineEmits<{
  (e: 'collapse'): void;
}>();

// The same-page biplane tab (HOME default · CARD second). Two starting subpages (the standard).
type BiplaneTab = 'home' | 'card';
const activeTab = ref<BiplaneTab>('home');

// ============================================================
// HOME (a) · THE CASCADE DOCUMENTS — the name-filtered working-docs list + the in-page reader.
// ============================================================
type WorkingDoc = { file: string; firstLine: string };
const workingDocs = ref<WorkingDoc[]>([]);
const docsBusy = ref<boolean>(false);
const docsError = ref<boolean>(false);

// The in-page reader pane (one open doc · toggle-closed on re-click · 404 honest · never breaks).
const openDocFile = ref<string | null>(null);
const docReaderBusy = ref<boolean>(false);
const docReaderContent = ref<string>('');
const docReaderAbsent = ref<boolean>(false);

async function loadWorkingDocs() {
  docsBusy.value = true;
  docsError.value = false;
  try {
    const r = await fetch(`/s8/${encodeURIComponent(props.entry.name)}/working-docs`); // C370-B · rename-proof
    if (!r.ok) {
      docsError.value = true;
      workingDocs.value = [];
      return;
    }
    const data = await r.json();
    workingDocs.value = Array.isArray(data) ? (data as WorkingDoc[]) : [];
  } catch {
    docsError.value = true; // offline / SSR-guard → the empty state (never a broken surface)
    workingDocs.value = [];
  } finally {
    docsBusy.value = false;
  }
}

async function openWorkingDoc(file: string) {
  if (openDocFile.value === file) {
    openDocFile.value = null; // toggle closed
    return;
  }
  openDocFile.value = file;
  docReaderBusy.value = true;
  docReaderAbsent.value = false;
  docReaderContent.value = '';
  try {
    const url = `/s8/${encodeURIComponent(props.entry.name)}/working-doc?file=${encodeURIComponent(file)}`; // C370-B · rename-proof
    const r = await fetch(url);
    if (!r.ok) {
      docReaderAbsent.value = true; // 404 / 403 → the honest absent note
      return;
    }
    docReaderContent.value = await r.text();
    docReaderAbsent.value = docReaderContent.value.trim().length === 0;
  } catch {
    docReaderAbsent.value = true;
  } finally {
    docReaderBusy.value = false;
  }
}

// ============================================================
// HOME (c) · THE SPAWN-NOT-ANCHOR CADMIUM — spawn the Cadmium Researcher as a NON-anchor worker.
// ============================================================
const cadmiumSpawning = ref<boolean>(false);
const cadmiumSpawnNote = ref<string>('');

function spawnCadmiumUnanchored() {
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || cadmiumSpawning.value) return;
  cadmiumSpawning.value = true;
  cadmiumSpawnNote.value = '';
  try {
    // asWorker=true → the bridge quality skips claimAnchorIfUnclaimed (the anchor bind) → a
    // NON-anchor research worker for THIS domain. scpName null → the bridge resolves the SCP dir.
    // C373 · triggerSpawnS8Session (rename-proof alias) — survives the graphiteScribe:page domain-token rewrite.
    ctrl.triggerSpawnS8Session('Cadmium Researcher', null, true);
    cadmiumSpawnNote.value = 'Cadmium Researcher spawned (unanchored). Focus it from the Session Manager.';
  } catch {
    cadmiumSpawnNote.value = 'Could not spawn Cadmium Researcher — is the Bridge running?';
  } finally {
    // The spawn is fire-and-forget (no page anchor to poll for); clear the in-flight guard shortly.
    setTimeout(() => {
      cadmiumSpawning.value = false;
    }, 1200);
  }
}

// ============================================================
// D-EF-3 · THE FORGE'S DOOR — Engage Entourage Forge (ANCHOR spawn · W3 spawn leg).
// ============================================================
// The placeholder pane's ONE button spawns the Entourage Forge as an ANCHOR (NO asWorker arg →
// the bridge quality runs claimAnchorIfUnclaimed → the Forge binds THIS page's per-graphiteScribeName
// anchor, collision-free beside the page S8's own anchor). The Forge's Onboard.md rides the anchor
// seed. Mirrors spawnCadmiumUnanchored's in-flight guard, but ANCHORED (no asWorker).
const forgeSpawning = ref<boolean>(false);
const forgeSpawnNote = ref<string>('');

async function engageEntourageForge() {
  // C375 · THE ENGAGE AWAIT HARDENING · THE GUARD-TELEMETRY LAW — log at ENTRY so the relay names
  // this exact drop on any future failure (the click reached the handler).
  console.log('[Forge Engage] clicked');
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || forgeSpawning.value) return;
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
    // the bridge, on an OFFLINE prior anchor, creates a fresh session + re-claims the anchor (never a resume).
    const liveForge = findLiveS8Session(ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName);
    if (liveForge) {
      console.log('[Forge Engage] ONE MOTION · live Forge found · focusing · ulid=', liveForge.id);
      ctrl.triggerFocusSession(liveForge.id);
      forgeSpawnNote.value = 'Focused the running Forge.';
      return;
    }
    // ANCHOR spawn — no asWorker → claimAnchorIfUnclaimed binds the Forge to this page's anchor.
    // The Forge researches + builds this domain, writing the real Domain into the minted Instance.md.
    // C373 · triggerSpawnS8Session (rename-proof alias) — survives the graphiteScribe:page domain-token rewrite.
    // C386 · fresh:true (4th arg) — a NEW conduction (never resume a prior one): on an OFFLINE anchor
    // the bridge creates a fresh session + re-claims the anchor rather than re-engaging the dead one.
    ctrl.triggerSpawnS8Session('Entourage Forge', scpName, false, true);
    console.log('[Forge Engage] after triggerSpawnS8Session (fresh)');
    forgeSpawnNote.value = 'Entourage Forge engaged. It will research and build out this Suite.';
  } catch {
    forgeSpawnNote.value = 'Could not engage the Entourage Forge — is the Bridge running?';
  } finally {
    // Anchor spawn is fire-and-forget from this pane (the anchor binds server-side); clear the
    // in-flight guard shortly (mirrors the Cadmium spawn's settle window).
    setTimeout(() => {
      forgeSpawning.value = false;
    }, 1200);
  }
}

// ============================================================
// MD-9 · D-MC-3 · Per-Instance Model Control · THE ACTUALIZATION MODEL SELECT (parity with the roster
// landing's forge launch). The user picks WHICH model the Forge's Actualization uses; the choice pins
// to the NEXT Entourage Forge anchor spawn (→ pendingSpawnModel · read fresh at fire-time). Persistent
// selection (not a per-click trigger) · the Session Management spawn-model-row idiom. The Turn-Over leg
// restarts the SCP (no session spawn) — the model does not thread there.
// ============================================================
const selectedModel = ref<string>(SCS_DEFAULT_MODEL);
const selectedModelLabel = computed<string>(
  () => scsModelLabel(selectedModel.value) ?? selectedModel.value,
);
const modelDropdownOptions = computed(() =>
  SCS_AVAILABLE_MODELS.map((m) => ({ value: m.id, label: m.label, hint: m.tier, title: m.blurb })),
);
function handleForgeModelChange(): void {
  getGlobalScsBridgeController()?.setSpawnModel(selectedModel.value);
}

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

// ============================================================
// W1 · THE TWO-STATE DOOR — the Forge door becomes BRANCH-AWARE.
// ============================================================
// The SCP client reads the current git branch from the gitm.json relay (GitmJsonShape.currentBranch),
// mirrored into the read-only gitm controller. inject-with-getGlobal is the proven GitM accessor
// (getGlobalGitmController() is null/stale in some render contexts · IslandWrapper provides BOTH the
// inject key AND the global · the same resolution GitmTurnOverBButton + GitmSwordBButton use).
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
const scsBridgeControllerForDoor =
  inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

// The live current branch (default '' when the relay is absent · SSR-guard). A 'b/'-prefixed branch
// is a working (B) branch; anything else is the stable (A) side.
const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');
// THE SAFE-SIDE DEFAULT — the A side (or an absent/unreadable branch read) resolves to the turn-over-
// request state (the safe side · forging happens on a working branch you can keep anor revert, never
// straight on the A ground). Only a KNOWN working B shows the Engage door. D-BN · THE branchRoles
// SWEEP — the working-B identity is the canonical roles.b (isWorkingBranchPer), NOT the `b/` prefix.
const onWorkingB = computed<boolean>(() =>
  isWorkingBranchPer(currentBranch.value, gitmController?.gitmJson.value),
);
const showTurnOverDoor = computed<boolean>(() => !onWorkingB.value);

const turnOverSpawning = ref<boolean>(false);
const turnOverNote = ref<string>('');

// THE TURN OVER REQUEST — on the A side, forge on B. ONE dispatch (triggerHardTurnOver · createBranch
// true → the huirth runs `git switch -c b/<branch>-<ts>`, carrying the dirty tree onto B; nodemon
// restarts on B). BEFORE the dispatch, write the SAME failsafe carrier the Sword-B button writes
// (source 'B' · variant 'sword-b' · deadline-armed · HAZARD-5 byte-match) so the WS-close handler can
// re-assert the overlay + arm the auto-revert deadline across the respawn gap.
async function requestTurnOverToB(): Promise<void> {
  const sb = scsBridgeControllerForDoor;
  if (!sb || turnOverSpawning.value) return;
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

// The bound-anchor menu (b) reads the live keyed stage; the page owner may pass a live relay stage,
// else the MINIMAL default menu renders (ShatteriteMenu :default-stage · decision 5).
const effectiveMenuStage = computed<MenuStage>(() => props.menuStage ?? EMPTY_MENU_STAGE);

onMounted(() => {
  if (typeof window === 'undefined') return;
  void loadWorkingDocs();
  // MD-9 · seed pendingSpawnModel with the picker's initial default so the first Forge spawn threads
  // it (the Session Management onMounted idiom). Best-effort — the host page binds the controller
  // Muxium; setSpawnModel no-ops safely if unbound, and the on-change handler is the reliable path.
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

// Re-load the docs + reset the reader when the entry changes (host re-uses the biplane per entry).
watch(
  () => props.entry.name,
  () => {
    openDocFile.value = null;
    docReaderContent.value = '';
    activeTab.value = 'home';
    void loadWorkingDocs();
  },
);
</script>

<template>
  <section class="graphiteScribe-biplane">
    <!-- D-EF-0 · THE STANDARDIZED SUB-NAV (one bar · HOME dissolved → 'Overview' · Card LAST) -->
    <nav class="biplane-nav hifi-pane-base">
      <div class="biplane-tabs">
        <button
          type="button"
          :class="['biplane-tab', 'tab-btn--amethyst', { 'biplane-tab--active': activeTab === 'home' }]"
          @click="activeTab = 'home'"
        >
          Overview
        </button>
        <button
          type="button"
          :class="['biplane-tab', 'tab-btn--viridian', { 'biplane-tab--active': activeTab === 'card' }]"
          @click="activeTab = 'card'"
        >
          Card
        </button>
      </div>
      <button type="button" class="biplane-collapse" @click="emit('collapse')">Close</button>
    </nav>

    <!-- ===================== HOME SUBPAGE ===================== -->
    <div v-if="activeTab === 'home'" class="biplane-home">
      <!-- D-EF-3 · THE FORGE'S DOOR — the placeholder pane at the TOP of the stack (ABOVE the
           Cascade Documents panel AND this S8's own bound-anchor menu). Rides the .shatterite-menu
           Pewter token family (bg #14110c · the offset shadow · the metal borders · the pewter-gold
           accent). Shows ONLY while un-forged (isUnactualized) — the Forge writes the real Domain,
           the next roster load flips the predicate false, and this door SELF-CLEARS. -->
      <div v-if="isUnactualized" class="forge-door">
        <h3 class="forge-door-heading">Forge this Suite</h3>

        <!-- MD-9 · D-MC-3 · THE ACTUALIZATION MODEL SELECT — the user picks WHICH model the Forge's
             Actualization uses (parity with GraphiteScribeHomeLanding's forge launch). Seeded to Opus 4.8; the
             choice pins to the NEXT Entourage Forge spawn. The offscreen-safe in-DOM ScsDropdown. -->
        <div class="forge-model-row">
          <label class="forge-model-label">Model</label>
          <ScsDropdown
            :options="modelDropdownOptions"
            :model-value="selectedModel"
            class="forge-model-dropdown"
            @update:model-value="(v) => { selectedModel = v; handleForgeModelChange(); }"
          />
        </div>

        <!-- W1 · THE TWO-STATE DOOR — branch-aware. On a NON-'b/' branch (the A side · the safe
             default when the branch read is absent), the door is the TURN OVER REQUEST: forging
             modifies this Suite's ground, so the work moves onto a working branch you can keep or
             revert. On a 'b/' branch, the door is the existing Engage-the-Forge anchor spawn. -->
        <template v-if="showTurnOverDoor">
          <p class="forge-door-intro">
            This Suite has a name but no domain yet — forging it modifies this Suite's ground. Turn
            over to a working branch (B) first: the work happens on a branch you can keep or revert.
          </p>
          <button
            type="button"
            class="forge-door-btn forge-door-btn--sword-b"
            :disabled="turnOverSpawning"
            @click="requestTurnOverToB"
          >
            <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>
            <span>{{ turnOverSpawning ? 'Turning over…' : 'Turn Over · Forge on B' }}</span>
          </button>
          <p v-if="turnOverSpawning" class="forge-door-note">
            Turning over to B — the SCP restarts on your working branch…
          </p>
          <p v-else-if="turnOverNote" class="forge-door-note">{{ turnOverNote }}</p>
        </template>

        <!-- ON a 'b/' branch — the EXISTING Engage button (the anchor spawn of the Entourage Forge). -->
        <template v-else>
          <p class="forge-door-intro">
            This Suite has a name but no domain yet — engage the Entourage Forge to research and build
            it out.
          </p>
          <button
            type="button"
            class="forge-door-btn"
            :disabled="forgeSpawning"
            @click="engageEntourageForge"
          >
            {{ forgeSpawning ? 'Engaging…' : `Engage Entourage Forge · ${selectedModelLabel}` }}
          </button>
          <p v-if="forgeSpawning" class="forge-door-note">Engaging the Entourage Forge…</p>
          <p v-else-if="forgeSpawnNote" class="forge-door-note">{{ forgeSpawnNote }}</p>

          <!-- C386 · W3 · THE PREVIOUS-CONDUCTIONS ROW — modest, muted. When OFFLINE Forge sessions
               exist for this SCP, up to 3 re-openable entries (short ulid + model label). Each button
               re-opens THAT conduction (triggerEngageSession · the Session Management resume leg). -->
          <div v-if="previousForgeConductions.length > 0" class="forge-previous-row">
            <span class="forge-previous-label">Previous conductions:</span>
            <button
              v-for="c in previousForgeConductions"
              :key="c.id"
              type="button"
              class="forge-previous-btn"
              @click="reopenConduction(c.id)"
            >
              <span class="forge-previous-ulid mono">{{ shortUlid(c.id) }}</span>
              <span class="forge-previous-model">{{ conductionModelLabel(c.model) }}</span>
            </button>
          </div>
        </template>
      </div>

      <!-- (a) THE CASCADE DOCUMENTS — the name-filtered working-docs list + the in-page reader -->
      <div class="home-panel hifi-pane-base">
        <h3 class="hifi-heading">Cascade Documents</h3>
        <p v-if="docsBusy" class="panel-status">Reading Cascades/Working…</p>
        <p v-else-if="docsError" class="panel-status panel-absent">
          Could not read the Working docs — is the SCP server running?
        </p>
        <p v-else-if="workingDocs.length === 0" class="panel-status panel-absent">
          No Cascade Documents matched "{{ entry.name }}" in Cascades/Working.
        </p>
        <ul v-else class="docs-list">
          <li v-for="doc in workingDocs" :key="doc.file" class="docs-item">
            <button
              type="button"
              :class="['doc-btn', { 'doc-btn--open': openDocFile === doc.file }]"
              @click="openWorkingDoc(doc.file)"
            >
              <span class="doc-file mono">{{ doc.file }}</span>
              <span v-if="doc.firstLine" class="doc-firstline">{{ doc.firstLine }}</span>
            </button>
            <div v-if="openDocFile === doc.file" class="doc-reader">
              <p v-if="docReaderBusy" class="panel-status">Reading…</p>
              <p v-else-if="docReaderAbsent" class="panel-status panel-absent">
                This document could not be read.
              </p>
              <pre v-else class="doc-reader-content custom-scrollbar">{{ docReaderContent }}</pre>
            </div>
          </li>
        </ul>
      </div>

      <!-- (b) THE BOUND-ANCHOR SHATTERITE MENU — reused verbatim (its own anchor bind + spawn btn) -->
      <div class="home-menu-zone">
        <ShatteriteMenu
          :menu-stage="effectiveMenuStage"
          :default-stage="GRAPHITESCRIBE_DEFAULT_MENU_STAGE"
          :graphiteScribe-name="entry.name"
          title="Bound-Anchor Menu"
        />
      </div>

      <!-- (c) THE SPAWN-NOT-ANCHOR CADMIUM — one-shot research worker (no anchor bind) -->
      <div class="home-panel hifi-pane-viridian">
        <h3 class="hifi-heading">Research this Domain</h3>
        <p class="panel-intro">
          Spawn the Cadmium Researcher as a one-shot worker to build out this domain — it runs
          <em>without</em> anchoring, so it never claims this page's bound anchor.
        </p>
        <button
          type="button"
          class="hifi-btn-viridian cadmium-spawn-btn"
          :disabled="cadmiumSpawning"
          @click="spawnCadmiumUnanchored"
        >
          {{ cadmiumSpawning ? 'Spawning…' : 'Research this Domain (Cadmium)' }}
        </button>
        <p v-if="cadmiumSpawnNote" class="panel-status cadmium-spawn-note">{{ cadmiumSpawnNote }}</p>
      </div>
    </div>

    <!-- ===================== CARD SUBPAGE ===================== -->
    <div v-else class="biplane-card">
      <GraphiteScribeCard
        :key="entry.name"
        :entry="entry"
        :domain="domain"
        :snippet="snippet"
        :compact="false"
        @collapse="emit('collapse')"
      />
    </div>
  </section>
</template>

<style scoped>
.graphiteScribe-biplane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* THE NAVBAR — the same-page tab idiom (GraphiteScribeSubPageNav HiFi bearing · zero raw hex). */
.biplane-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}

.biplane-tabs {
  display: flex;
  gap: 0.5rem;
}

.biplane-tab {
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

.biplane-tab:hover {
  border-color: var(--tab-accent);
  color: rgba(255, 255, 255, 0.9);
}

.biplane-tab--active {
  background: var(--tab-accent);
  color: var(--color-board-dark, #1a1a2e);
  border-color: var(--tab-light);
}

.biplane-collapse {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.72rem;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
}

.biplane-collapse:hover {
  color: #f3f4f6;
  border-color: rgba(255, 255, 255, 0.35);
}

.biplane-home {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* D-EF-3 · THE FORGE'S DOOR — the Pewter placeholder pane, riding the .shatterite-menu token
   family VERBATIM (bg #14110c · the offset shadow -3px 3px 0 · the split metal borders · the
   pewter-gold #d8c79a accent). No new palette — the same embossed Pewter language the menu speaks. */
.forge-door {
  position: relative;
  background: #14110c;
  border-top: 2px solid #5b5347;
  border-right: 2px solid #5b5347;
  border-bottom: 2px solid #a9a196;
  border-left: 2px solid #a9a196;
  box-shadow: -3px 3px 0 rgba(91, 83, 71, 0.4);
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.forge-door-heading {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #d8c79a;
  margin: 0;
}

/* MD-9 · D-MC-3 · THE ACTUALIZATION MODEL ROW — the label + the offscreen-safe ScsDropdown. Rides
   the .forge-door flex column's own gap (no bespoke margin). Neutral pewter chrome (system tooling ·
   the spawn-model-row precedent). */
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

.forge-door-intro {
  color: rgba(230, 226, 216, 0.82);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.forge-door-btn {
  align-self: flex-start;
  padding: 0.5rem 1.1rem;
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

.forge-door-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}

.forge-door-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* W1 · THE SWORD-B TURN-OVER TREATMENT — rides the GitmSwordBButton ochre neon-edge + chamfer
   language (deep near-black field · the thin ochre/amber ring carried by border + glow · the
   chamfered clip · the neon glyph). The turn-over-request door reads as one with the Sword-B setter
   it fires. Icon + label sit inline. */
.forge-door-btn--sword-b {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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

.forge-door-btn--sword-b:hover:not(:disabled) {
  filter: none;
  border-color: rgba(234, 179, 8, 0.9);
  color: rgb(255, 224, 120);
  box-shadow:
    0 0 14px 1px rgba(234, 179, 8, 0.5),
    inset 0 0 14px 0 rgba(234, 179, 8, 0.18);
}

.forge-door-note {
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

.home-panel {
  border-radius: 8px;
  padding: 1.25rem;
}

.home-panel h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.85rem;
}

.panel-intro {
  color: var(--color-white-muted, #c0c0c8);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0 0 0.85rem;
}

.panel-status {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
  margin: 0.4rem 0 0;
}

.panel-status.panel-absent {
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
}

.docs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.doc-btn {
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
  transition: border-color 0.15s ease, background 0.15s ease;
}

.doc-btn:hover {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.5);
}

.doc-btn--open {
  border-color: var(--color-amethyst-light, #c4b5fd);
}

.doc-file {
  font-size: 0.78rem;
  color: rgba(230, 230, 230, 0.92);
  word-break: break-word;
}

.doc-file.mono {
  font-family: var(--font-mono, 'Space Mono', monospace);
}

.doc-firstline {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  word-break: break-word;
}

.doc-reader {
  margin-top: 0.4rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.6rem;
}

.doc-reader-content {
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

.home-menu-zone {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cadmium-spawn-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 6px;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.cadmium-spawn-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.cadmium-spawn-note {
  margin-top: 0.6rem;
}

.biplane-card {
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
}
</style>
