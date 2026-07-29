<script setup lang="ts">
/**
 * Suite 8 Landing — HCD SubPage Triad Island (Band A-6)
 *
 * The closer of Macro A — the FINAL Band of the Epoch E1 foundation. IUPA-muxifies
 * the suite8 CLIENT face per-page; createSuite8ClientConcept() returns the SCBM
 * muxifyConcepts node — suite8 (Tier 1) carrying the ONE shared suiteCascade member
 * (Tier 2 · d.suiteCascade). The MPRF registration Principle seeds the
 * `suite8s` roster at boot.
 *
 * Renders the HCD SubPage triad (Home · Component · Documentation) via a
 * v-if/v-else-if chain keyed on activeSubPage (DECK K · local-only UI selector):
 *   Home          -> the Suite 8 roster (suite8s · Tier 1) + the docked-cascade
 *                    context (cascades · Tier 2 · the SCBM payoff)
 *   Component     -> CPLD live render — ODSS spawn (A-4) + PFGD list (A-5), keyed
 *                    by the suite8s plurality
 *   Documentation -> the Suite8 registration/assignment reference (static markdown)
 *
 * MIGRATION (deferred A-1 item): the Home roster reads `suite8s` (the SPSR Record)
 * via DECK K, NOT the legacy `designations[]` array. The legacy array + its 3
 * sync'd qualities remain on the concept (Suite8Page.vue still reads them) — this
 * Landing's roster is the canonical `suite8s` surface.
 *
 * Citation: SuiteCascadeLanding.vue (HCD triad v-if switch · DIRECT bearing · B-6).
 * Citation: Suite8OnDemand.vue / Suite8SessionList.vue (IUPA + GPIM controller idiom).
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §3 (HCD) + §5 (Diametric Conference).
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import type { Suite8Entry, Suite8SubPage } from '../suite8.type';
import type { Cascade } from '../../suiteCascade/suiteCascade.type';
import {
  GENERAL_CASCADE_NAME,
  GENERAL_CASCADE_DIRECTORY,
} from '../../suiteCascade/suiteCascade.type';
// A-1 SCBM · IUPA · createSuite8ClientConcept() returns the muxifyConcepts node —
// suite8 (Tier 1) carrying the ONE shared suiteCascade member (Tier 2).
import { createSuite8ClientConcept } from '../suite8.concept.client';
// MD-5 · THE D9 DERIVATION — supersede the flat #9aa0a8 placeholder; the roster color is the
// domain-derived spectrum token (the base neutral for the minted default).
import { deriveSuiteFromDomain } from '../../../model/deriveSuiteFromDomain.model';

// The style.css :root suite token hex for a derived spectrum register (the entry.color read as a
// swatch fallback where the card's pane class carries the real treatment). Mirrors style.css :root.
const SUITE_SWATCH_HEX: Record<string, string> = {
  base: '#9aa0a8',
  red: 'rgb(239, 68, 68)',
  orange: 'rgb(249, 115, 22)',
  yellow: 'rgb(234, 179, 8)',
  green: 'rgb(34, 197, 94)',
  blue: 'rgb(59, 130, 246)',
  purple: 'rgb(168, 85, 247)',
  fuchsia: 'rgb(236, 72, 153)',
};
import { createSuiteCascadeConcept } from '../../suiteCascade/suiteCascade.concept.client';
import { suiteCascadeMuxonomic } from '../../suiteCascade/suiteCascade.muxonomy';
import { suite8Muxonomic } from '../suite8.muxonomy';
import { SUITE8_SUB_PAGE_OPTIONS } from '../suite8.subPageRegistry';
// GPIM · Vue-layer Muxium binding into universal scsBridge controller
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import Suite8SubPageNav from './components/Suite8SubPageNav.vue';
import Suite8ComponentSubPage from './components/Suite8ComponentSubPage.vue';
import Suite8DocumentationSubPage from './components/Suite8DocumentationSubPage.vue';
// MD-5 · THE CHARACTER-FORWARD CARD — the roster surface renders one card per Suite 8.
import Suite8Card from './components/Suite8Card.vue';
// MD-6 · THE BIPLANE PAGE STANDARD — the expanded detail becomes the two-subpage biplane (HOME | CARD).
import Suite8Biplane from './components/Suite8Biplane.vue';

// --- Reactive refs mirrored from suite8 state via the stage-planner subscription.
// suite8s + activeSubPage = Tier 1 (own); cascades + activeCascadeDirectory = Tier 2
// (the shared suiteCascade member · the SCBM payoff).
const suite8s = ref<Record<string, Suite8Entry>>({});
const activeSubPage = ref<Suite8SubPage>('home');

// C834 · THE INSTRUMENTATION CARD — the delayed HOME-unselect wound. The sibling scsBridge
// hold taught the law: instrument the FLIGHT before ANY cure (three blind cures failed
// there). Every activeSubPage transition logs value + source + ms; the field run names the
// writer, then this card is pruned. Greppable tag: [S8-SUBPAGE].
const subPageLog = (source: string, value: unknown) => {
  if (typeof window !== 'undefined') {
    console.log(`[S8-SUBPAGE] ${performance.now().toFixed(0)}ms · ${source} →`, value);
  }
};
watch(activeSubPage, (nv, ov) => subPageLog(`ref-transition ${String(ov)} → ${String(nv)}`, nv));
const cascades = ref<Record<string, Cascade>>({});
const activeCascadeDirectory = ref<string>(GENERAL_CASCADE_DIRECTORY);

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

const subPageOptions = SUITE8_SUB_PAGE_OPTIONS;

// ============================================
// MD-3 · THE NAME-FIRST DEMOMETRIC MINT — the Create UI + the sovereignty-pure roster
// ============================================
// SOVEREIGNTY: the roster reads THIS SCP's OWN Cascades/8_SUITES via GET /suite8/local-roster
// (SCP-local · no bridge SEAP dependency · no static-seed GAP). A minted Suite 8 appears the
// instant its dir exists — refreshLocalRoster re-fetches + dispatches suite8RegisterSuite8 per
// entry into the SPSR Record (the existing subscription mirrors it into suite8s.value).

// MD-5 · the local-roster entry now carries the SNIPPET (the first meaningful Instance.md line ·
// the extended /suite8/local-roster · the MD-4 firstLine helper idiom).
// D-EF-3 · the entry now also carries isUnactualized (the FORGE PREDICATE · the raw Instance.md
// still holds the scaffold's '**Domain**: TBD') — the biplane's Overview surfaces the Forge door for it.
type LocalRosterEntry = {
  name: string;
  directoryPath: string;
  snippet?: string;
  isUnactualized?: boolean;
};

const showCreateField = ref<boolean>(false);
const createName = ref<string>('');
const createError = ref<string>('');
const createBusy = ref<boolean>(false);

// MD-5 · snippet map keyed by Suite 8 name — held here (NOT on the Suite8Entry state · the
// KeyedSelector no-optional discipline S13 §4) and passed to each card as a prop.
const snippetsByName = ref<Record<string, string>>({});

// D-EF-3 · THE FORGE PREDICATE map — keyed by Suite 8 name (held OFF the Suite8Entry state · same
// KeyedSelector no-optional discipline). true = the raw Instance.md still carries the scaffold's
// '**Domain**: TBD' → the biplane's Overview surfaces the Forge door. The Forge writes the real
// Domain → next roster load flips this false → the door self-clears.
const unactualizedByName = ref<Record<string, boolean>>({});

// MD-5 · the in-landing EXPANDED selection — one card at a time reveals the full anatomy + the
// reader row (the biplane's CARD subpage arrives MD-6; here the expanded card = the in-landing
// detail). null = the compact roster grid.
const expandedName = ref<string | null>(null);

// C833 · the biplane's starting tab for the CURRENT expansion — 'home' for every manual
// expand; the ?s8= focus door sets 'card' BEFORE expanding ("all the way into" the card).
const expandedStartTab = ref<'home' | 'card'>('home');

function expandCard(name: string) {
  subPageLog(`expandCard(${name}) · startTab=${expandedStartTab.value}`, activeSubPage.value); // C834
  expandedName.value = name;
}
function collapseCard() {
  subPageLog('collapseCard', activeSubPage.value); // C834
  expandedName.value = null;
  expandedStartTab.value = 'home';
}

// W2 · THE MINTED AUTO-EXPAND — a nav click on a minted S8 lands here as `?minted=<name>`. Read the
// query param on mount; once the roster load resolves that entry into suite8s, auto-expand it (the
// existing expandCard mechanism · the Overview surfaces the Forge/turn-over door for it). Fires ONCE
// (the watcher self-clears the pending name), so a later manual collapse is not re-forced.
const pendingMintedName = ref<string | null>(null);
watch(
  () => suite8s.value,
  (roster) => {
    const target = pendingMintedName.value;
    if (!target) return;
    if (roster[target]) {
      expandCard(target);
      pendingMintedName.value = null; // fire once — never re-force a manual collapse.
    }
  },
);

// C833 · THE ?s8= FOCUS DOOR — the manifest output's Edit button lands here as
// `/?island=suite8&s8=<name>`. The SAME auto-expand mechanism as ?minted=, but it opens the
// biplane directly on CARD ("all the way into" the card · its Description section is the
// destination). When the AUTHORITATIVE roster listing resolves WITHOUT the target (no valid
// card), the GENERAL DESCRIPTION EDITOR opens for that name instead — every focus link lands
// on an authoring surface; none dead-ends.
const pendingFocusName = ref<string | null>(null);
watch(
  () => suite8s.value,
  (roster) => {
    const target = pendingFocusName.value;
    if (!target) return;
    if (roster[target]) {
      expandedStartTab.value = 'card';
      expandCard(target);
      pendingFocusName.value = null; // fire once — the manual collapse is never re-forced.
    }
  },
);

// C833 · THE GENERAL DESCRIPTION EDITOR — the no-valid-card fall of the focus door. Saving
// POSTs /s8/<name>/description (the server CREATES the Suite 8 dir + Description.md); on
// success the roster refresh resolves the now-present dir and the focus mechanism carries
// straight into its card.
const generalEditorName = ref<string | null>(null);
const generalDraft = ref<string>('');
const generalBusy = ref<boolean>(false);
const generalError = ref<string>('');

async function openGeneralEditor(name: string) {
  generalEditorName.value = name;
  generalDraft.value = '';
  generalError.value = '';
  try {
    const r = await fetch(`/s8/${encodeURIComponent(name)}/description`, {
      headers: { Accept: 'application/json' },
    });
    if (r.ok) {
      const data = (await r.json().catch(() => ({}))) as { description?: string };
      if (typeof data.description === 'string') generalDraft.value = data.description;
    }
  } catch { /* offline — the empty draft stands */ }
}

function closeGeneralEditor() {
  generalEditorName.value = null;
  generalDraft.value = '';
  generalError.value = '';
}

async function saveGeneralDescription() {
  const name = generalEditorName.value;
  const text = generalDraft.value.trim().slice(0, 300);
  if (!name) return;
  if (!text) {
    generalError.value = 'A description is required (1-300 chars).';
    return;
  }
  generalBusy.value = true;
  generalError.value = '';
  try {
    const r = await fetch(`/s8/${encodeURIComponent(name)}/description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: text }),
    });
    const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!r.ok || !data.ok) {
      generalError.value = data.error ?? 'Could not save the description.';
      return;
    }
    // The dir now exists — re-arm the focus door and refresh; the roster resolves it into
    // the card (the watcher above opens it on CARD).
    closeGeneralEditor();
    pendingFocusName.value = name;
    await refreshLocalRoster();
  } catch {
    generalError.value = 'Network error — could not reach the SCP server.';
  } finally {
    generalBusy.value = false;
  }
}

function beginCreate() {
  showCreateField.value = true;
  createName.value = '';
  createError.value = '';
}

function cancelCreate() {
  showCreateField.value = false;
  createName.value = '';
  createError.value = '';
}

// Seed / refresh the SPSR Record from the SCP-LOCAL roster endpoint. Dispatches one
// suite8RegisterSuite8 per dir entry (idempotent · the reducer overwrites by name). Missing
// description/color (the local listing carries only name+path) → deterministic placeholders.
async function refreshLocalRoster() {
  if (!muxium) return;
  try {
    const r = await fetch('/s8/local-roster'); // C370-B · rename-proof prefix (aliased to /suite8)
    if (!r.ok) return;
    const entries = (await r.json()) as LocalRosterEntry[];
    if (!Array.isArray(entries)) return;
    const nextSnippets: Record<string, string> = {};
    const nextUnactualized: Record<string, boolean> = {};
    for (const e of entries) {
      // MD-5 · carry the snippet into the local map (keyed by name · off the KeyedSelector state).
      nextSnippets[e.name] = (e.snippet ?? '').trim();
      // D-EF-3 · carry the Forge predicate (keyed by name · off the KeyedSelector state).
      nextUnactualized[e.name] = e.isUnactualized === true;
      // MD-5 · THE D9 DERIVATION supersedes the flat placeholder — the snippet is the meaning
      // source (the domain word), name-hash fallback else, base neutral for the minted default.
      const suite = deriveSuiteFromDomain(e.name, nextSnippets[e.name]);
      const entry: Suite8Entry = {
        name: e.name,
        directoryPath: e.directoryPath,
        // description carries the domain/snippet the card derives from (was the 'Suite 8' placeholder).
        description: nextSnippets[e.name].length > 0 ? nextSnippets[e.name] : 'Suite 8',
        color: SUITE_SWATCH_HEX[suite] ?? '#9aa0a8',
      };
      (muxium as Muxium<ClientMuxiumDeck>).dispatch(
        (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.suite8.e.suite8RegisterSuite8({
          name: e.name,
          entry,
        }),
      );
    }
    snippetsByName.value = nextSnippets;
    unactualizedByName.value = nextUnactualized;
    // C833 · the focus door's ABSENT fall — this listing is the AUTHORITATIVE roster; a focus
    // target it does not carry has no valid card → the General Description Editor opens for
    // that name (the present case is handled by the suite8s watcher above).
    const focusTarget = pendingFocusName.value;
    if (focusTarget && !entries.some((e) => e.name === focusTarget)) {
      pendingFocusName.value = null;
      void openGeneralEditor(focusTarget);
    }
  } catch {
    /* offline / SSR-guard / malformed — the boot MPRF seed stands as the fallback roster */
  }
}

async function submitCreate() {
  const name = createName.value.trim();
  if (!name) {
    createError.value = 'Enter a name for your Suite 8';
    return;
  }
  createBusy.value = true;
  createError.value = '';
  try {
    const r = await fetch('/s8/create', { // C370-B · rename-proof prefix (aliased to /suite8)
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = (await r.json().catch(() => ({}))) as { reason?: string };
    if (!r.ok) {
      createError.value = data.reason ?? 'Could not create Suite 8';
      return;
    }
    // 200 — refresh the roster; the new Suite 8 appears in the list (the generic island path).
    await refreshLocalRoster();
    showCreateField.value = false;
    createName.value = '';
  } catch {
    createError.value = 'Network error — could not reach the SCP server';
  } finally {
    createBusy.value = false;
  }
}

// --- Home derivation · the Suite 8 roster (suite8s Record · Tier 1).
const suite8Entries = computed<Suite8Entry[]>(() => Object.values(suite8s.value));

// MD-5 · resolve the expanded selection to its entry (null → the compact grid).
const expandedEntry = computed<Suite8Entry | null>(() =>
  expandedName.value ? suite8s.value[expandedName.value] ?? null : null,
);

// --- Docked-cascade context (the SCBM payoff · Tier 2 read of cascades).
// The active cascade for the currently-watched directory: when a Suite 8 docks,
// activeCascadeDirectory re-points to its scoped path and a matching cascade Name
// appears in the shared Record. The General (GRID) cascade is the default context.
const generalCascade = computed<Cascade | null>(
  () => cascades.value[GENERAL_CASCADE_NAME] ?? null,
);

const isGrid = computed<boolean>(
  () => activeCascadeDirectory.value === GENERAL_CASCADE_DIRECTORY,
);

// The docked Suite 8 cascade (non-General) when one is active, else null.
const dockedCascade = computed<Cascade | null>(() => {
  if (isGrid.value) return null;
  const entry = Object.values(cascades.value).find(
    (c) => c.cascadeDirectory === activeCascadeDirectory.value,
  );
  return entry ?? null;
});

const activeCascadeName = computed<string>(() =>
  isGrid.value
    ? GENERAL_CASCADE_NAME
    : dockedCascade.value?.name ?? '(none docked)',
);

const registeredCascadeCount = computed<number>(
  () => Object.keys(cascades.value).length,
);

function selectSubPage(subPage: Suite8SubPage) {
  subPageLog('user-click dispatch', subPage); // C834 instrumentation
  if (!muxium) return;
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.suite8.e.suite8SetActiveSubPage({
      activeSubPage: subPage,
    }),
  );
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // W2 · THE MINTED AUTO-EXPAND — read the `?minted=<name>` nav param BEFORE the roster loads, so the
  // suite8s watcher above can auto-expand that entry the instant refreshLocalRoster resolves it.
  try {
    const params = new URLSearchParams(window.location.search);
    const minted = params.get('minted');
    if (minted) pendingMintedName.value = minted;
    // C833 · the ?s8= focus door (the manifest output's Edit button · CARD-tab landing anor
    // the General Description Editor when no card resolves).
    const focus = params.get('s8');
    if (focus) pendingFocusName.value = focus;
  } catch {
    /* malformed query — no auto-expand (the roster still renders). */
  }

  // IUPA · landing supplies suite8 (SCBM node) as the muxonomic page concept.
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [
      { concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic },
      { concept: createSuiteCascadeConcept(), muxonomy: suiteCascadeMuxonomic }, // top-level base · serverToClient relay lands here (CadmiumLanding:568)
    ],
    {
      title: 'Suite8Landing',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8LandingSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            // Tier 1 — own roster Record + local SubPage selector.
            suite8s.value = d.client.d.suite8.k.suite8s.select();
            // C834 instrumentation · log ONLY when the state beat would CHANGE the ref.
            // C844 S2 · THE UNION GUARD — the field wound: the page loads with a sub-page
            // selected, then TOGGLES OFF (no tab lit · no content = the ref holds a value
            // OUTSIDE the triad union; every in-page writer was exonerated C834 and the
            // localStorage persistence lead died C844 — only darkMode syncs). The guard
            // makes the blank IMPOSSIBLE: an out-of-union select is REJECTED and LOGGED
            // (the instrumentation still names the writer when it fires) — the standing
            // selection holds.
            const nextSubPage = d.client.d.suite8.k.activeSubPage.select();
            const inUnion = SUITE8_SUB_PAGE_OPTIONS.some((o) => o.value === nextSubPage);
            if (!inUnion) {
              subPageLog('plan-select REJECTED (out-of-union · the C844 union guard)', nextSubPage);
            } else {
              if (nextSubPage !== activeSubPage.value) {
                subPageLog('plan-select (state beat)', nextSubPage);
              }
              activeSubPage.value = nextSubPage;
            }
            // Tier 2 — the shared suiteCascade member (the SCBM payoff).
            cascades.value = d.client.d.suiteCascade.k.cascades.select();
            activeCascadeDirectory.value =
              d.client.d.suiteCascade.k.activeCascadeDirectory.select();
          },
          {
            selectors: [
              d__.client.d.suite8.k.suite8s,
              d__.client.d.suite8.k.activeSubPage,
              d__.client.d.suiteCascade.k.cascades,
              d__.client.d.suiteCascade.k.activeCascadeDirectory,
            ],
          },
        ),
      ]),
  );

  // MD-3 D-NM-3 · SOVEREIGNTY — seed the roster from THIS SCP's own 8_SUITES (the SCP-local
  // endpoint), folding the static-seed GAP closed. Runs after the muxium is live so the
  // dispatched suite8RegisterSuite8 actions land on the bound base.
  void refreshLocalRoster();
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
  <div class="suite8-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">Suite 8</h1>
      <p class="subtitle hifi-label">
        Shared-Plurality Roster · muxifies Suite Cascade (Tier 2) · ODSS + PFGD Mock-Ups
      </p>
    </header>

    <main class="landing-content">
      <Suite8SubPageNav
        :options="subPageOptions"
        :active-sub-page="activeSubPage"
        @sub-page-selected="selectSubPage"
      />

      <!-- HOME · the Suite 8 roster (suite8s · Tier 1) + docked-cascade context (Tier 2) -->
      <section v-if="activeSubPage === 'home'" class="home-subpage">
        <!-- Docked-cascade context · the SCBM payoff (Tier-2 cascades read) -->
        <div class="home-context hifi-pane-amethyst">
          <h2 class="hifi-heading">Docked Cascade Context</h2>
          <div class="context-row">
            <span class="context-label">Context</span>
            <span :class="['context-value', isGrid ? 'context-grid' : 'context-sdcr']">
              {{ isGrid ? 'GRID · General RI' : 'SDCR · Docked Suite 8' }}
            </span>
          </div>
          <div class="context-row">
            <span class="context-label">Active Cascade</span>
            <span class="context-value mono">{{ activeCascadeName }}</span>
          </div>
          <div class="context-row">
            <span class="context-label">Watched Directory</span>
            <span class="context-value mono">{{ activeCascadeDirectory }}</span>
          </div>
          <div class="context-row">
            <span class="context-label">Registered Cascades (Tier 2)</span>
            <span class="context-value mono">{{ registeredCascadeCount }}</span>
          </div>
        </div>

        <!-- The Suite 8 roster · suite8s Record (Tier 1 · the migrated A-1 surface) -->
        <section class="roster-panel hifi-pane-amethyst">
          <h2 class="hifi-heading">Registered Suite 8 Roster</h2>

          <p v-if="suite8Entries.length === 0" class="roster-empty-note">
            No Suite 8 registered yet. Mint one below to begin.
          </p>

          <!-- MD-6 · EXPANDED DETAIL — the BIPLANE (HOME | CARD · the two starting subpages). HOME =
               Cascade Documents + bound-anchor menu + spawn-not-anchor Cadmium; CARD = the MD-5 card. -->
          <div v-if="expandedEntry" class="roster-expanded">
            <Suite8Biplane
              :key="expandedEntry.name"
              :entry="expandedEntry"
              :domain="snippetsByName[expandedEntry.name] ?? ''"
              :snippet="snippetsByName[expandedEntry.name] ?? ''"
              :is-unactualized="unactualizedByName[expandedEntry.name] === true"
              :start-tab="expandedStartTab"
              @collapse="collapseCard"
            />
          </div>

          <!-- C833 · THE GENERAL DESCRIPTION EDITOR — the focus door's no-valid-card fall.
               Saving creates Cascades/8_SUITES/<name>/Description.md; the roster refresh then
               resolves the new dir and carries straight into its card. -->
          <div v-else-if="generalEditorName" class="general-editor hifi-pane-transparent">
            <div class="general-editor-head">
              <span class="hifi-label">General Description Editor</span>
              <button type="button" class="general-editor-close" @click="closeGeneralEditor">×</button>
            </div>
            <p class="general-editor-name hifi-heading">{{ generalEditorName }}</p>
            <p class="general-editor-note">
              No Suite 8 card resolved for this name — author its description directly. Saving
              creates its registry entry and opens the card.
            </p>
            <textarea
              v-model="generalDraft"
              class="general-editor-input custom-scrollbar"
              maxlength="300"
              rows="3"
              placeholder="What this Suite 8 does for this SCP (1-300 chars · plain text · this line ships in the manifest)"
            ></textarea>
            <div class="general-editor-row">
              <span class="general-editor-count hifi-label">{{ generalDraft.trim().length }}/300</span>
              <button
                type="button"
                class="hifi-btn hifi-btn-purple general-editor-btn"
                :disabled="generalBusy || generalDraft.trim().length === 0"
                @click="saveGeneralDescription"
              >{{ generalBusy ? 'Saving…' : 'Save Description' }}</button>
            </div>
            <p v-if="generalError" class="general-editor-error">{{ generalError }}</p>
          </div>

          <!-- MD-5 · THE ROSTER SURFACE SWAP — one Suite8Card (compact) per entry; card click -->
          <!-- expands the in-landing detail. The Create entry stays at the END (the MD-3 law).  -->
          <div v-else class="roster-grid">
            <Suite8Card
              v-for="entry in suite8Entries"
              :key="entry.name"
              :entry="entry"
              :domain="snippetsByName[entry.name] ?? ''"
              :snippet="snippetsByName[entry.name] ?? ''"
              :compact="true"
              @expand="expandCard"
            />

            <!-- MD-3 · THE CREATE ENTRY · AT THE END of the installed list (the primer's law) -->
            <div class="roster-create-cell">
              <button
                v-if="!showCreateField"
                type="button"
                class="create-trigger"
                @click="beginCreate"
              >
                <span class="create-plus">+</span>
                <span class="create-label">Create Suite 8</span>
              </button>

              <div v-else class="create-form">
                <label class="create-field-label" for="suite8-create-name">
                  New Suite 8 Name
                </label>
                <input
                  id="suite8-create-name"
                  v-model="createName"
                  class="create-input"
                  type="text"
                  placeholder="e.g. My Domain"
                  autocomplete="off"
                  :disabled="createBusy"
                  @keyup.enter="submitCreate"
                  @keyup.esc="cancelCreate"
                />
                <p v-if="createError" class="create-error">{{ createError }}</p>
                <div class="create-actions">
                  <button
                    type="button"
                    class="create-submit"
                    :disabled="createBusy"
                    @click="submitCreate"
                  >
                    {{ createBusy ? 'Minting…' : 'Mint' }}
                  </button>
                  <button
                    type="button"
                    class="create-cancel"
                    :disabled="createBusy"
                    @click="cancelCreate"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <!-- COMPONENT · CPLD live render — ODSS spawn (A-4) + PFGD list (A-5) keyed by suite8s -->
      <Suite8ComponentSubPage
        v-else-if="activeSubPage === 'component'"
        :suite8s="suite8s"
      />

      <!-- DOCUMENTATION · the Suite8 registration/assignment reference -->
      <Suite8DocumentationSubPage v-else-if="activeSubPage === 'documentation'" />
    </main>
  </div>
</template>

<style scoped>
.suite8-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
}

.landing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.landing-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}

.subtitle {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.875rem;
}

.landing-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.home-subpage {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.home-context,
.empty-panel,
.roster-panel {
  border-radius: 8px;
  padding: 1.5rem;
}

.home-context h2,
.empty-panel h2,
.roster-panel h2 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
}

.context-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.context-row:last-child {
  border-bottom: none;
}

.context-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.context-value {
  font-size: 0.85rem;
  font-weight: 600;
}

.context-value.mono {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-weight: 500;
  color: rgba(220, 220, 220, 0.8);
}

.context-grid {
  color: var(--color-cobalt-light, #60a5fa);
}

.context-sdcr {
  color: var(--color-amethyst-light, #c4b5fd);
}

.empty-panel p {
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

.empty-panel code,
.roster-path .mono {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.78rem;
}

.empty-panel code {
  color: #c4b5fd;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}

/* MD-5 · THE ROSTER GRID — one Character-Forward Card per Suite 8 (compact face). */
.roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.9rem;
}

/* MD-6 · the EXPANDED DETAIL — the biplane (HOME | CARD), centered, roomier than the compact card. */
.roster-expanded {
  display: block;
  max-width: 720px;
  margin: 0 auto;
}

/* C833 · THE GENERAL DESCRIPTION EDITOR (the focus door's no-valid-card fall) */
.general-editor {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.1rem 1.25rem;
  border-radius: 0.65rem;
}
.general-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.general-editor-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
}
.general-editor-close:hover {
  color: rgba(255, 255, 255, 0.95);
}
.general-editor-name {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}
.general-editor-note {
  margin: 0 0 0.7rem;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.65);
}
.general-editor-input {
  width: 100%;
  padding: 0.5rem 0.65rem;
  font-size: 0.82rem;
  line-height: 1.5;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 0.4rem;
  resize: vertical;
}
.general-editor-input:focus {
  outline: none;
  border-color: var(--color-purple, #a78bfa);
}
.general-editor-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.55rem;
}
.general-editor-count {
  font-size: 0.62rem;
  opacity: 0.7;
}
.general-editor-btn {
  font-size: 0.7rem;
  padding: 0.35rem 0.9rem;
}
.general-editor-error {
  margin: 0.45rem 0 0;
  font-size: 0.72rem;
  color: var(--color-red-light, #ff4e4e);
}

.roster-empty-note {
  color: #9ca3af;
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
}

/* MD-3 · THE CREATE ENTRY (Pewter · the plus affordance) — a dashed grid cell at the END. */
.roster-create-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 168px;
  border: 1px dashed rgba(154, 160, 168, 0.35);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  padding: 1rem;
}

.create-trigger {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.35rem 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-pewter-light, #cbd0d6);
  font-size: 0.9rem;
  font-weight: 600;
}

.create-trigger:hover {
  color: #f3f4f6;
}

.create-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 1px solid rgba(154, 160, 168, 0.5);
  font-size: 1rem;
  line-height: 1;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.55);
}

.create-input {
  width: 100%;
  padding: 0.5rem 0.65rem;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(154, 160, 168, 0.4);
  border-radius: 5px;
  color: #f3f4f6;
  font-size: 0.9rem;
}

.create-input:focus {
  outline: none;
  border-color: var(--color-pewter-light, #cbd0d6);
}

.create-error {
  color: #f87171;
  font-size: 0.8rem;
  margin: 0;
}

.create-actions {
  display: flex;
  gap: 0.5rem;
}

.create-submit,
.create-cancel {
  padding: 0.4rem 0.85rem;
  border-radius: 5px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.create-submit {
  background: rgba(154, 160, 168, 0.9);
  color: #1a1a1a;
}

.create-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.create-cancel {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: #cbd0d6;
}

.create-cancel:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
