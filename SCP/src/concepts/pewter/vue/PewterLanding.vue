<script setup lang="ts">
/**
 * PewterLanding.vue — HIFI.3 · the Pewter Tessera page (Main/Sub triad)
 *
 * A dedicated Suite Color page. Main = the Suite Color Selection (reuse HIFI.2
 * SuiteColorSelection.vue) + a ShatteriteMenu header (Cadmium pattern · default
 * stage fallback) + the Shatterite Tome. WIRE.1 · SOE: the per-page Spawn Button is
 * RETIRED — the ShatteriteMenu header is now the origin of engagement and surfaces its
 * own Spawn + Anchor button when there is no live anchor (anchorSpawn 'prompt').
 * Sub = a components-preview gallery so the live re-tint is visible (one
 * .hifi-pane-{s} + each .hifi-btn-{s} + the .spectrum-bar, all spectrum-token-driven).
 *
 * P1 SPAWN-FIX · the page binds a Muxium (GitmLanding shape · empty page-concept array).
 * The spawn + engage dispatches ride the BASE scsBridge deck (BASE_CONCEPTS_CREATORS,
 * always composed at Tier-1 of ClientMuxiumDeck) — so the page needs NO page concept of its
 * own, only a bound Muxium so the universal scsBridgeController can dispatch. Without this
 * binding, triggerSpawnSuite8Session AND triggerEngageSession both !currentMuxium-guard →
 * silent return (the spawn / re-engage never fire). The sub-page selector stays a plain Vue
 * `ref` (Main/Sub); the color control still writes through the HIFI.1 documentElement override
 * (re-tints every island live · no extra wiring). The ShatteriteMenu + Tome resolve the page's
 * Anchor from the live sessionsList by suite8Name 'Pewter Tessera'; the menu owns spawn (SOE)
 * + re-engage via the universal scsBridge controller (now armed by this binding).
 *
 * Output Firewall: SPECTRUM names + FUNCTIONAL designations ONLY in user-facing
 * labels — no profession/cascade names, no scare-quotes.
 *
 * Reachability: registered in IslandWrapper.vue islandRegistry ('pewter' → this)
 * and vue.principle.ts REGISTERED_MUXONOMICS (pewterMuxonomic · nav entry /pewter).
 *
 * Citation: Suite8Landing.vue (Main/Sub v-if/v-else triad + SubPageNav idiom)
 * Citation: CadmiumLanding.vue:785 (<ShatteriteMenu :menu-stage> · default stage fallback)
 * Citation: CadmiumLanding.vue:452-471 / GitmLanding.vue:50-58 (GPIM · createClientMuxiumInstance + setMuxium)
 * Citation: ShatteriteMenu.vue (WIRE.1 · SOE · the menu owns Spawn + Anchor + re-engage)
 * Citation: ShatteriteTomeSetup.vue (STSC · :suite8Name + :sfsd setup feed)
 * Citation: SuiteColorSelection.vue (HIFI.2 · reused self-contained control)
 */
import { ref, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import type { MenuStage, MenuDocument } from '../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE, EMPTY_MENU_DOCUMENT } from '../../../model/shatteriteMenu.model';
// C870 · the live keyed Shatterite relay (Suite8HomeLanding parity — same component, same wiring).
import { createSuite8ClientConcept } from '../../suite8/suite8.concept.client';
import { suite8Muxonomic } from '../../suite8/suite8.muxonomy';
// SMSP · the Pewter design menu (Modify Suite Colors / Patterns · 'prime' Skill options).
import { PEWTER_DEFAULT_MENU_STAGE } from '../../../model/pewterDefaultMenu.model';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
// GPIM · bind this landing's Muxium into the universal scsBridge controller so the
// ShatteriteMenu's Spawn (triggerSpawnSuite8Session) + re-engage (triggerEngageSession) dispatch.
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import ShatteriteMenu from '../../suite8/vue/components/ShatteriteMenu.vue';
import SuiteColorSelection from '../../scsBridge/vue/components/SuiteColorSelection.vue';
import SuitePatternSelection from '../../scsBridge/vue/components/SuitePatternSelection.vue';
// MD-6 · D-BP-3 · the CARD subpage mounts the MD-5 Character-Forward Card for Pewter.
import Suite8Card from '../../suite8/vue/components/Suite8Card.vue';
import Suite8CascadeDocs from '../../suite8/vue/components/Suite8CascadeDocs.vue';

// The page's Suite 8 designation — the literal Cascades/8_SUITES/<name>/ key the
// spawn-anchor + ShatteriteMenu + Tome all resolve against.
const PEWTER_SUITE_8_NAME = 'Pewter Tessera';

// ============================================================
// D-EF-0 · THE SUB-NAV STANDARDIZATION (one bar per island · Card LAST)
// The MD-6 biplane HOME|CARD wrapper is DISSOLVED into the island's OWN subnav: HOME's
// content WAS the Suite Colors surface, so 'main' (Suite Colors) is the honest first
// subpage. The single bar = Suite Colors · Preview · Card. The 'card' subpage mounts the
// MD-5 Suite8Card the biplane wrapper previously mounted.
// ============================================================
const pewterCardEntry = {
  name: PEWTER_SUITE_8_NAME,
  directoryPath: `Cascades/8_SUITES/${PEWTER_SUITE_8_NAME}`,
  description: 'HiFi design language · spectrum colors + patterns',
  color: '#9aa0a8',
};

// ============================================================
// SUB-PAGE SET (Suite Colors / Preview / Card · local-only selector · no Muxium)
// ============================================================

type PewterSubPage = 'main' | 'preview' | 'card';

interface PewterSubPageOption {
  value: PewterSubPage;
  label: string;
}

const SUB_PAGE_OPTIONS: PewterSubPageOption[] = [
  { value: 'main', label: 'Suite Colors' },
  { value: 'preview', label: 'Preview' },
  { value: 'card', label: 'Card' },
];

const activeSubPage = ref<PewterSubPage>('main');

function selectSubPage(value: PewterSubPage): void {
  activeSubPage.value = value;
}

// ============================================================
// SHATTERITE MENU (Cadmium pattern · default static stage fallback)
// ============================================================
//
// No live menu.json relay on this page yet — the menu renders its standing
// explainer (PEWTER_DEFAULT_STAGE) until/unless an Anchor instance authors a
// stage. menuStage stays EMPTY_MENU_STAGE (stageIndex -1) so defaultStage wins.

const menuStage = ref<MenuStage>(EMPTY_MENU_STAGE);
// C870 · the LIVE document — the N-watcher SMRP relay flows shatteriteMenus['Pewter Tessera']
// into here; the component's activeDoc prefers it over the mount floor (live advance · no refresh).
const menuDocument = ref<MenuDocument>(EMPTY_MENU_DOCUMENT);

// SMSP · the Pewter design menu (Modify Suite Colors / Patterns · 'prime' Skill options) is the
// standing default stage until/unless an Anchor instance authors a live menu.json stage.
const PEWTER_DEFAULT_STAGE: MenuStage = PEWTER_DEFAULT_MENU_STAGE;

function onMenuOption(payload: { label: string; kind: string; ok: boolean }): void {
  console.log('[PewterLanding] menu option selected', payload);
}

// WIRE.1 · SOE · the per-page Spawn Button is RETIRED. The ShatteriteMenu header above is now the
// origin of engagement: it reads this Suite 8's anchorSpawn mode + surfaces its own Spawn + Anchor
// button (or auto-fires on 'auto') when no live anchor exists — so the page no longer wires a spawn.

// ============================================================
// P1 SPAWN-FIX · MUXIUM BINDING (GPIM · GitmLanding shape · empty page-concept array)
// ============================================================
//
// The spawn (triggerSpawnSuite8Session) + re-engage (triggerEngageSession) dispatches both
// !currentMuxium-guard on the universal scsBridgeController → silent return when no Muxium is
// bound. PewterLanding previously held NONE, so the menu's Spawn + re-engage buttons dispatched
// into a warn-and-return. Bind a Muxium with an EMPTY page-concept array (GitmLanding precedent):
// the spawn/engage dispatches ride the BASE scsBridge deck (always composed at Tier-1 of
// ClientMuxiumDeck), so Pewter needs NO page concept of its own — only a bound Muxium. setMuxium
// is last-write-win; restored to the principle shim on unmount (setMuxium(null) + muxium.close()).

let muxium: Muxium<ClientMuxiumDeck> | null = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  // scsBridge is the universal base (BASE_CONCEPTS_CREATORS) — no page concepts needed; the spawn +
  // engage dispatches live on the base scsBridge deck (reached via mux.deck.d.client.d.scsBridge.e.*).
  // C870 · suite8 supplied as the muxonomic page concept — the keyed shatteriteMenus Record
  // (the SMRP relay target) must EXIST on this page muxium for live menu advance (the
  // refresh-required wound: the prior empty-concepts muxium had no relay state to read).
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic }],
    {
      title: 'PewterLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller — arms BOTH the
  // ShatteriteMenu Spawn (triggerSpawnSuite8Session) AND the orphan-anchor re-engage
  // (triggerEngageSession). Without this, both controller triggers warn-and-return.
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // C870 · BSSM parity (Suite8HomeLanding:393) — flow the keyed relay Record into the live ref.
  muxium.plan<ClientMuxiumDeck>(
    'pewterMenuStageSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.suite8.k.shatteriteMenus.select() as Record<string, MenuDocument>;
            menuDocument.value = record[PEWTER_SUITE_8_NAME] ?? EMPTY_MENU_DOCUMENT;
          },
          { selectors: [d__.client.d.suite8.k.shatteriteMenus] },
        ),
      ]),
  );
});

onUnmounted(() => {
  // GPIM cleanup · unbind the controller from this landing's Muxium (restores the principle shim)
  // and close the page Muxium so it is not leaked across navigation (GitmLanding :100-106).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (muxium) muxium.close();
});

</script>

<template>
  <div class="pewter-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">Pewter Tessera</h1>
      <p class="subtitle hifi-label">
        Pick the spectrum colors — the whole app re-tints live and remembers across restart.
      </p>
    </header>

    <!-- D-EF-0 · THE STANDARDIZED SUB-NAV (one bar · island subpages + Card LAST · biplane-tab pill) -->
    <nav class="pewter-subnav hifi-pane-base">
      <div class="biplane-tabs">
        <button
          v-for="opt in SUB_PAGE_OPTIONS"
          :key="opt.value"
          type="button"
          :class="[
            'biplane-tab',
            opt.value === 'card' ? 'tab--viridian' : 'tab--amethyst',
            { 'biplane-tab--active': activeSubPage === opt.value },
          ]"
          @click="selectSubPage(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </nav>

    <!-- CARD SUBPAGE — the MD-5 Character-Forward Card for Pewter (now the LAST tab of the one bar) -->
    <main v-if="activeSubPage === 'card'" class="landing-content pewter-card-subpage">
      <Suite8Card :entry="pewterCardEntry" domain="HiFi" :compact="false" />
    </main>

    <template v-else>
    <!-- Suite Cascade Bar (spectrum-token-driven · re-tints live with the Main selection) -->
    <div class="spectrum-bar pewter-spectrum-bar" aria-hidden="true">
      <span class="spectrum-bar--red"></span>
      <span class="spectrum-bar--orange"></span>
      <span class="spectrum-bar--yellow"></span>
      <span class="spectrum-bar--green"></span>
      <span class="spectrum-bar--blue"></span>
      <span class="spectrum-bar--purple"></span>
      <span class="spectrum-bar--fuchsia"></span>
    </div>

    <main class="landing-content">
      <!-- MAIN · ShatteriteMenu header + Suite Color Selection + Spawn Button + Tome -->
      <section v-if="activeSubPage === 'main'" class="pewter-main">
        <!-- C868/C870 · the standardized Cascade Memory (Suite8CascadeDocs · collapsed by default ·
             own header) — present on EVERY Suite 8 page for consistency, functional anor not:
             Pewter's design cycles record onto its Diamond/Onyx tiers the same as any domain. -->
        <Suite8CascadeDocs designation="Pewter Tessera" />

        <ShatteriteMenu
          :menu-stage="menuStage"
          :menu-document="menuDocument"
          :suite8-name="PEWTER_SUITE_8_NAME"
          :default-stage="PEWTER_DEFAULT_STAGE"
          title="Pewter Tessera"
          @option-selected="onMenuOption"
        />

        <!-- The reused HIFI.2 control (self-contained — re-tints :root live) -->
        <SuiteColorSelection />

        <!-- The reused HIFI.3 control (self-contained — re-tiles :root patterns live) -->
        <SuitePatternSelection />

        <!-- WIRE.1 · SOE · the per-page Spawn Button is RETIRED — the ShatteriteMenu header above is
             now the origin of engagement and surfaces its own Spawn + Anchor button. -->

        <!-- C881 · PRUNED: the Setup Tome — the Shatterite menu's Skills are the engagement
             surface; the reserved palette-note field carried no live function. -->
      </section>

      <!-- SUB · components-preview gallery (re-tints live as the Main selection changes) -->
      <section v-else-if="activeSubPage === 'preview'" class="pewter-preview">
        <p class="pewter-preview-note hifi-label">
          Each pane + button reads the live spectrum tokens — change a color on the
          Suite Colors tab and watch every surface re-tint.
        </p>

        <div class="pewter-preview-grid">
          <div
            v-for="s in ['base', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'fuchsia']"
            :key="s"
            :class="`hifi-pane-${s}`"
            class="pewter-preview-pane"
          >
            <h3 class="hifi-heading pewter-preview-title">{{ s }}</h3>
            <button type="button" :class="`hifi-btn hifi-btn-${s}`" class="pewter-preview-btn">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- The full spectrum strip (the framing-chrome reference) -->
        <div class="spectrum-bar pewter-preview-spectrum" aria-hidden="true">
          <span class="spectrum-bar--red"></span>
          <span class="spectrum-bar--orange"></span>
          <span class="spectrum-bar--yellow"></span>
          <span class="spectrum-bar--green"></span>
          <span class="spectrum-bar--blue"></span>
          <span class="spectrum-bar--purple"></span>
          <span class="spectrum-bar--fuchsia"></span>
        </div>
      </section>
    </main>
    </template>
  </div>
</template>

<style scoped>
/* D-EF-0 · the standardized one-bar subnav (biplane-tab pill idiom · shared across islands). */
.pewter-card-subpage {
  max-width: 560px;
  margin: 0 auto;
}

.pewter-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
}

.landing-header {
  text-align: center;
  margin-bottom: 1rem;
}
.landing-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}
.subtitle {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.875rem;
}

.pewter-spectrum-bar {
  max-width: 900px;
  margin: 0 auto 1.5rem;
}

.landing-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* D-EF-0 · the standardized one-bar subnav (biplane-tab pill idiom · Card LAST). */
.pewter-subnav {
  max-width: 900px;
  margin: 0 auto 1.25rem;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}
.pewter-subnav .biplane-tabs {
  display: flex;
  gap: 0.5rem;
}
.pewter-subnav .biplane-tab {
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
.pewter-subnav .tab--amethyst {
  --biplane-accent: var(--color-amethyst, #a855f7);
  --biplane-light: var(--color-amethyst-light, #c4b5fd);
}
.pewter-subnav .tab--viridian {
  --biplane-accent: var(--color-viridian, #10b981);
  --biplane-light: var(--color-viridian-light, #6ee7b7);
}
.pewter-subnav .biplane-tab:hover {
  border-color: var(--biplane-accent);
  color: rgba(255, 255, 255, 0.9);
}
.pewter-subnav .biplane-tab--active {
  background: var(--biplane-accent);
  color: var(--color-board-dark, #1a1a2e);
  border-color: var(--biplane-light);
}

.pewter-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pewter-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pewter-preview-note {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.pewter-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}
.pewter-preview-pane {
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}
.pewter-preview-title {
  margin: 0;
  font-size: 0.78rem;
  text-transform: capitalize;
  letter-spacing: 0.04em;
}
.pewter-preview-btn {
  font-size: 0.78rem;
  padding: 0.4rem 1rem;
  text-transform: capitalize;
}
.pewter-preview-spectrum {
  margin-top: 0.5rem;
}
</style>
