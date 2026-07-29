<script setup lang="ts">
/**
 * IsomorphicExpanseHomeLanding — Template Suite 8 Page (DSSLS · Domain-Scoped SCP Landing Scaffold)
 *
 * The pared-down Cadmium homepage shape. This is the page the install Opus adapts
 * (S9-DomainPageCreate + S10-HomePageAdapt) into the user's domain Suite 8 as the
 * SCP HOME PAGE. The Cadmium research-pipeline machinery (bulletins, topics, sweep,
 * dispatch) has been removed — what remains is the domain scaffold any domain
 * Suite 8 can claim by filling the ADAPT markers below:
 *
 *   Zone 1 · DOMAIN HEADER       — the Suite 8 name + one-line identity (hifi-pane · suite-tier)
 *   HOME · DOMAIN WORK SURFACE   — the game harness leads (subject · 1st), then the RI Diamond/Onyx
 *                                  pane, then the Base Cascade Shatterite Menu (Game → RI → Menu)
 *   CARD · the IsomorphicExpanseCard mounted by this page's display name
 *
 * The install Opus edits the `ADAPT:` markers on the fly: it reads the user's domain
 * from their muxified Cascades/8_SUITES/{name}/Instance.md identity, writes the domain
 * name + tagline, binds the designation, and fills the work surface. Then it flips
 * `isMainLanding: true` (SAMLS) so this page becomes the SCP's `/` route.
 *
 * Patterns: DSSLS · SAMLS · CACB
 * Citation: TU-ARC-S2-ORANGE-NAMING.md (DSSLS · SSMC · SAMLS) · TU-ARC-S1-RED-CURATION.md §4 (ISMC)
 * Reference model: CadmiumLanding.vue (the populated domain page this scaffold pares down)
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
// IUPA · the isomorphicExpanse CLIENT concept supplies this landing's page Muxium (mirrors CadmiumLanding
// supplying createCadmiumClientConcept). The SSMC's GPIM controller binding needs a live Muxium.
import { createIsomorphicExpanseClientConcept } from '../isomorphicExpanse.concept.client';
import { isomorphicExpanseMuxonomic } from '../isomorphicExpanse.muxonomy';
// GPIM · Vue-layer Muxium binding into the universal scsBridge controller. The onMounted muxium bind
// (setMuxium) + the PPOL spawn-on-load poll route their spawn/engage/focus actions through this global
// controller (mirrors CadmiumLanding onMounted).
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
// GTMS8C · the FS-parsed Base Cascade Menu — the shared MenuStage contract + the generic menu
// component (the renderer · carries its OWN anchor-alive guard internally · S4 Risk-2).
import type { MenuStage, MenuDocument } from '../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE, EMPTY_MENU_DOCUMENT } from '../../../model/shatteriteMenu.model';
import ShatteriteMenu from './components/ShatteriteMenu.vue';
// IE-D2 · the D-O page surface — the LIVE two-pane Cascade Memory (plan + trajectory), fed from the
// registered cascade state (cascades['IsomorphicExpanse'].activeCascadeFiles · the C702 relay). Replaces
// the earlier empty-slot RI widget (loadedDiamondContent/loadedOnyxContent were D4-deferred + never filled).
import IsomorphicExpanseCascadeDocs from './components/IsomorphicExpanseCascadeDocs.vue';
// PRE-EPOCH · decision 5 · the MINIMAL default standing menu (spawn-anchor row + documentation row).
import { ISOMORPHICEXPANSE_DEFAULT_MENU_STAGE } from '../model/isomorphicExpanseDefaultMenu.model';
// W3 · THE ONE-BAR SUBNAV (D-EF-0) · the Card subpage mounts the IsomorphicExpanseCard by this page's display name.
import type { IsomorphicExpanseEntry } from '../isomorphicExpanse.type';
import IsomorphicExpanseCard from './components/IsomorphicExpanseCard.vue';
// D2 · DZDE · the game harness fills THE DOMAIN WORK SURFACE (Zone 3) directly —
// self-contained Vue subtree, no props, no Stratimux wiring; GameView owns its
// own onMounted → initialize() lifecycle.
import IsomorphicExpanseGameHarness from './components/IsomorphicExpanseGameHarness.vue';

// ============================================================
// ADAPT: DOMAIN IDENTITY
// The install Opus fills these two refs from the user's muxified Instance.md identity.
// `isomorphicExpanseName` MUST byte-match the Suite 8 directory name (Cascades/8_SUITES/{name}/) so the
// SSMC mode=specific filter narrows the session list to THIS domain's sessions.
// ============================================================
// ADAPT: replace 'Isomorphic Expanse' with the user's Suite 8 designation (from Instance.md Designation).
const domainName = ref<string>('Isomorphic Expanse');
// ADAPT: replace with the user's one-line domain identity (from Instance.md Identity / tagline).
const domainTagline = ref<string>(
  'Your project, now a first-class Suite 8 within the Stratidian Manifold.',
);
// ADAPT: set this to the EXACT Cascades/8_SUITES/{name}/ directory name so SSMC filters correctly.
// NDEP · ONE DESIGNATION STRING — this literal byte-matches ALL FOUR of:
//   1. Cascades/8_SUITES/IsomorphicExpanse/   (the RI dir · SSMC mode=specific filter)
//   2. Cascades/Extended/IsomorphicExpanse/   (the menu.json dir the FSWatcher arms on)
//   3. the shatteriteMenus relay KEY this page reads (menuStage subscription below)
//   4. the NPC `name` in game/engine/data/npcs.ts that resolveS8Anchor resolves the anchor on
// It was previously 'Isomorphic Expanse' (spaced) — which matched NO directory, so the keyed
// relay never filled and menuStage stayed EMPTY_MENU_STAGE forever.
const isomorphicExpanseName = ref<string>('IsomorphicExpanse');

// PRE-EPOCH · BSSM · the live keyed per-designation Shatterite Menu stage for THIS page's
// designation. The N-watcher SMRP relay flows shatteriteMenus[isomorphicExpanseName] into here; absent a live
// stage it stays EMPTY_MENU_STAGE and ShatteriteMenu renders the ISOMORPHICEXPANSE_DEFAULT_MENU_STAGE
// (passed as :default-stage · decision 5). The scalar `menuStage` slot is superseded for the page
// render by this keyed read (the scalar pipe remains for backward-compat in the concept).
const menuDocument = ref<MenuDocument>(EMPTY_MENU_DOCUMENT);

// PRE-EPOCH · WTO triptych · the RI widget content (loadedDiamondContent / loadedOnyxContent from the
// isomorphicExpanse state · populated by D4 Diametric reads · empty at first render → the pane shows its built-in
// empty state · S6 composition gap note). Passed `|| null` so the pane's bothNull branch renders.
const loadedDiamondContent = ref<string>('');
const loadedOnyxContent = ref<string>('');

// ============================================================
// W3 · THE ONE-BAR SUBNAV (D-EF-0) — Home · Card. Home = the current island contents (the RI
// widget + the Forge menu + the Shatterite Menu + the Session Manager); Card = the IsomorphicExpanseCard
// mounted by THIS page's display name (the biplane-tab idiom · IsomorphicExpanseBiplane's HOME|CARD standard).
// ============================================================
type HomeTab = 'home' | 'card';
const activeTab = ref<HomeTab>('home');

// W3 · THE CARD ENTRY — a minimal IsomorphicExpanseEntry keyed on THIS page's display name (isomorphicExpanseName). The
// local-roster fetch below fills its snippet + color; before it resolves the Card renders the name
// with the base placeholder (never a broken surface). IsomorphicExpanseCard consumes {entry, domain, snippet}.
const selfSnippet = ref<string>('');
const cardEntry = computed<IsomorphicExpanseEntry>(() => ({
  name: isomorphicExpanseName.value,
  directoryPath: `Cascades/8_SUITES/${isomorphicExpanseName.value}`,
  description: selfSnippet.value.length > 0 ? selfSnippet.value : 'Suite 8',
  color: '#9aa0a8',
}));

// ============================================================
// CARD SNIPPET SEED — fetch THIS SCP's local-roster and read the self-entry's snippet for the Card tab
// description (cardEntry.description). The Forge predicate that once shared this fetch is removed; this
// slimmed reader sets ONLY selfSnippet (a clean isolate · no forge state). Absent / unparseable / SPA-
// HTML fallback → snippet stays '' → cardEntry falls back to 'Suite 8'. Uses /s8/local-roster (the `s8`
// string carries no isomorphicExpanse token, so the copy-move-rename can never rewrite the route).
// ============================================================
async function refreshSelfSnippet(): Promise<void> {
  try {
    const r = await fetch('/s8/local-roster', { headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const ct = (r.headers.get('content-type') ?? '').toLowerCase();
    const body = await r.text();
    // SPA fallback / non-JSON → NOT a roster.
    if (!ct.includes('json') && /^\s*<(?:!doctype|html)/i.test(body)) return;
    let entries: Array<{ name: string; snippet?: string }>;
    try {
      entries = JSON.parse(body);
    } catch {
      return;
    }
    if (!Array.isArray(entries)) return;
    const self = entries.find((e) => e.name === isomorphicExpanseName.value);
    if (self) {
      selfSnippet.value = (self.snippet ?? '').trim();
    }
  } catch {
    /* offline / SSR-guard — keep the empty snippet (Card shows the 'Suite 8' fallback). */
  }
}

// WIRE.1 · SOE · the anchor-spawn PROMPT is now owned by the ShatteriteMenu (the origin of
// engagement) — it reads this Suite 8's anchorSpawn mode itself in onMounted and surfaces its own
// Spawn + Anchor button when there is no live anchor. The page no longer renders a spawn-prompt row
// nor reads anchorSpawnMode here. The PPOL poll below KEEPS its alive→focus / offline→engage branches
// (page-load convenience) but DEFERS first-run spawn entirely to the menu (no page-level spawn).

let muxium: Muxium<ClientMuxiumDeck> | null = null;
// GTMS8C · PPOL · one-shot spawn-on-load planner (concluded on unmount + self-concludes).
// C932 · ppolPlanner ERASED with the legacy PPOL (the page carries nothing).
// GTMS8C · PPOL-WUD · wind-up-defer interval for the spawn/focus dispatch (cleared on unmount).
// C932 · ppolWindUp ERASED with the legacy PPOL.

onMounted(() => {
  if (typeof window === 'undefined') return;

  // C376 · THE MOUNT STAMP — the relay's proof of WHICH build the window is running.
  console.log('[IsomorphicExpanseHomeLanding] mounted · build=C376-pointerfix-clickprobe');

  // IUPA · this landing supplies isomorphicExpanse as the muxonomic page concept (the SSMC controller
  // binding needs a live Muxium; the domain work surface can dispatch into it once adapted).
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createIsomorphicExpanseClientConcept(), muxonomy: isomorphicExpanseMuxonomic }],
    {
      title: 'IsomorphicExpanseHomeLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller (so the PPOL spawn-on-
  // load poll + the ShatteriteMenu's anchor actions route their spawn/engage/focus through it ·
  // mirrors CadmiumLanding onMounted).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // ============================================================
  // ADAPT: DOMAIN WORK SURFACE — onMounted wiring
  // If the domain work surface needs live state, add the stage-planner subscription here
  // (mirror CadmiumLanding's `muxium.plan(...)` + `d.client.d.isomorphicExpanse.k.<prop>.select()` reads).
  // The scaffold ships with a static work surface; wire reactive state only when the domain needs it.
  // ============================================================

  // PRE-EPOCH · BSSM · subscribe the page muxium's keyed shatteriteMenus Record + the RI widget
  // content into reactive refs. The N-watcher SMRP relay dispatches isomorphicExpanseSetDesignationMenuStage into
  // this page muxium; the selector flows the keyed Record in, and we read THIS page's designation key
  // (isomorphicExpanseName), falling back to EMPTY_MENU_STAGE (the default menu is supplied via :default-stage).
  // loadedDiamondContent / loadedOnyxContent feed the WTO RI widget (Tier-2 page-muxium reach · isomorphicExpanse
  // is mounted under client). Mirrors the cadmiumLandingSubscription staging/stage/d__ shape.
  muxium.plan<ClientMuxiumDeck>(
    'isomorphicExpanseMenuStageSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.isomorphicExpanse.k.shatteriteMenus.select() as Record<string, MenuDocument>;
            menuDocument.value = record[isomorphicExpanseName.value] ?? EMPTY_MENU_DOCUMENT;
            loadedDiamondContent.value = d.client.d.isomorphicExpanse.k.loadedDiamondContent.select() as string;
            loadedOnyxContent.value = d.client.d.isomorphicExpanse.k.loadedOnyxContent.select() as string;
          },
          {
            selectors: [
              d__.client.d.isomorphicExpanse.k.shatteriteMenus,
              d__.client.d.isomorphicExpanse.k.loadedDiamondContent,
              d__.client.d.isomorphicExpanse.k.loadedOnyxContent,
            ],
          },
        ),
      ]),
  );

  // C932 · THE PAGE CARRIES NOTHING (the C489 treatment · Suite8HomeLanding parity): the
  // legacy page-side PPOL (alive→focus · offline→engage on EVERY page load) is ERASED — it
  // stole focus to the anchored session on every navigation. The ShatteriteMenu owns the
  // anchor lifecycle entirely (alive → no action · offline → the Re-engage button anor the
  // Auto-Spawn toggle · first-run → the Spawn + Anchor button). Focus is the user's
  // attention — spent only when a menu selection carries In-Focus anor the user asks.

  // CARD SNIPPET SEED · fetch THIS SCP's OWN local-roster (keyed by isomorphicExpanseName) once on mount
  // to fill the Card tab snippet (cardEntry.description). No forge predicate rides this anymore.
  void refreshSelfSnippet();

  // Cycle 8 · Salvo B(ii) · MOCH HYDRATE — THE HYDRATE-EVERY-LOAD LAW.
  // The Bridge Turn Over restarts the SCP, so EVERY page load is a cold start: if menu.json exists on
  // disk, its options must be present immediately, without waiting for the anchor to write again. The
  // STCP relay (SMRP) only fires on CHANGE, and the BOCR backfill arm never delivered for this
  // designation — so without this seed the authored menu silently vanished on every reload.
  // C766 · the page-level menu floor is RETIRED — the ShatteriteMenu component owns the ODCF
  // floor (staged /suite8-menu) + navigation + persistence now.
});

// C766 · hydrateMenuFromDisk RETIRED (the component-internal staged floor supersedes it).

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium (mirror CadmiumLanding onUnmounted).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  // GTMS8C · conclude the PPOL planner + clear the PAOLRP interval (no respawn after unmount).
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
         widget + Forge menu + Shatterite Menu + Session Manager); Card = the IsomorphicExpanseCard by display
         name (the biplane-tab idiom · IsomorphicExpanseBiplane HOME|CARD standard).
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
      <!-- ============================================================
           D2 · DZDE · THE DOMAIN WORK SURFACE — the game harness now LEADS Home as the SUBJECT of the
           page (1st · the reason to visit). It rides the /isomorphicExpanse/home island mount; the harness
           wraps GameView's 800x480 observer-mode canvas + control bar — a self-contained Vue subtree,
           not a Stratimux-wired zone like Menu/RI.
           ============================================================ -->
      <div class="domain-game-zone">
        <IsomorphicExpanseGameHarness :menu-stage="menuStage" />
      </div>

      <!-- ============================================================
           IE-D2 · ZONE 2 (2nd) · THE D-O PAGE SURFACE — the LIVE Cascade Memory (plan + trajectory).
           Reads the registered cascade state directly (Tier-2 shared suiteCascade member ·
           cascades['IsomorphicExpanse'].activeCascadeFiles · the C702 relay), so the panes fill from
           the project's OWN Cascades/Extended/IsomorphicExpanse/ folder without any D4 Diametric read.
           The plan pane is page-editable (3C); the trajectory pane is session-written read-only (3C);
           a tier menu enumerates prior tiers without loading them (2A). Sits below the game surface
           (order: Game → Memory → Menu).
           ============================================================ -->
      <!-- C758 · the divergence ends: the regenerated CascadeDocs speaks the fleet-wide
           `designation` contract (the C750 floor + rewrite-proof routes ride it). -->
      <IsomorphicExpanseCascadeDocs :designation="isomorphicExpanseName" />

      <!-- ============================================================
           PRE-EPOCH · WTO TRIPTYCH · ZONE 3 (3rd) · the Shatterite Menu. ShatteriteMenu carries the
           MANDATORY anchor-alive guard INTERNALLY (optionsEnabled gates dispatch on a live anchor ·
           S4 Risk-2) — the menu renders safely without blocking on session confirmation (the guard
           makes the order safe). :menu-stage is the live keyed relay state
           (shatteriteMenus[isomorphicExpanseName]); :default-stage is the MINIMAL default menu (decision 5) the
           component renders when no live stage exists; :isomorphicExpanse-name binds the anchor lookup to the
           SAME designation the PAOLRP uses.

           WIRE.1 · SOE · the spawn-anchor PROMPT now lives INSIDE the ShatteriteMenu (the origin of
           engagement): with no live anchor + anchorSpawn 'prompt' the menu surfaces its own Spawn +
           Anchor button; the page no longer renders a separate spawn-prompt row.
           ============================================================ -->
      <div class="domain-menu-zone">
        <ShatteriteMenu
          :menu-stage="EMPTY_MENU_STAGE"
          :menu-document="menuDocument"
          :default-stage="ISOMORPHICEXPANSE_DEFAULT_MENU_STAGE"
          :isomorphicExpanse-name="isomorphicExpanseName"
          title="Base Cascade Menu"
        />
      </div>
    </main>

    <!-- ===================== CARD SUBPAGE ===================== -->
    <main v-else class="domain-content domain-card-page">
      <!-- W3 · THE CARD — the IsomorphicExpanseCard mounted by THIS page's display name (the biplane CARD tab). -->
      <IsomorphicExpanseCard
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

.domain-game-zone { display: flex; justify-content: center; background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 1rem; }

/* ============================================================
   W3 · THE ONE-BAR SUBNAV (D-EF-0) — the same-page tab idiom (IsomorphicExpanseBiplane bearing · zero raw hex).
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
</style>
