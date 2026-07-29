<script setup lang="ts">
/**
 * SuiteCascade Landing — HCD SubPage Triad Island (Band B-6)
 *
 * The closer of Macro B. IUPA-muxifies the suiteCascade CLIENT face per-page
 * (matching Suite8Landing.vue) — this is the deferred B-4 step: WITHOUT a mounted
 * suiteCascade client face, the Huirth WCJF watcher's serverToClient relays
 * (suiteCascadeSetCascadeRelay · suiteCascadeSetActiveCascadeFilesRelay ·
 * suiteCascadeSetActiveCascadeDirectoryRelay) have no client deck to land in.
 * Mounting this island gives the relays their Client `cascades` Record target.
 *
 * Renders the HCD SubPage triad (Home · Component · Documentation) via a
 * v-if/v-else-if chain keyed on activeSubPage (DECK K · local-only UI selector):
 *   Home          -> the active General cascade summary (DOPR + ACFR + GRID/SDCR context)
 *   Component     -> CPLD live render keyed by the cascades plurality
 *   Documentation -> the Diamond-forms ladder + Commands (initial reference)
 *
 * Citation: Suite8Landing.vue (IUPA per-page muxification idiom — the bearing).
 * Citation: ScsBridgeLanding.vue (SubPage triad v-if switch + stage-planner subscription).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §3 (HCD) + §6 (deferred B-4 IUPA).
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import type { Cascade, SuiteCascadeSubPage } from '../suiteCascade.type';
import { GENERAL_CASCADE_NAME, GENERAL_CASCADE_DIRECTORY } from '../suiteCascade.type';
// IUPA · suiteCascade muxified per-page (matches suite8 · the deferred B-4 client face)
import { createSuiteCascadeConcept } from '../suiteCascade.concept.client';
import { suiteCascadeMuxonomic } from '../suiteCascade.muxonomy';
import { SUITECASCADE_SUB_PAGE_OPTIONS } from '../suiteCascade.subPageRegistry';
import { suiteFromCascadeFilePath } from '../model/suiteCascade.suiteDerivation';
import SuiteCascadeSubPageNav from './components/SuiteCascadeSubPageNav.vue';
import SuiteCascadeCascadeFiles from './components/SuiteCascadeCascadeFiles.vue';
import SuiteCascadeDiamondOnyxPane from './components/SuiteCascadeDiamondOnyxPane.vue';
import SuiteCascadeComponentSubPage from './components/SuiteCascadeComponentSubPage.vue';
import SuiteCascadeDocumentationSubPage from './components/SuiteCascadeDocumentationSubPage.vue';

// --- Reactive refs mirrored from suiteCascade state via the stage-planner subscription.
const cascades = ref<Record<string, Cascade>>({});
// C898 · THE GENERAL FLOOR — fetched on EVERY mount (/general-cascade · fresh from disk);
// the relay wins per-key when it carries substance, but an EMPTY relayed General never
// clobbers a filled floor (the boot-tick guard).
const generalFloor = ref<Cascade | null>(null);
function mergeCascades(relayed: Record<string, Cascade>): Record<string, Cascade> {
  const merged: Record<string, Cascade> = { ...relayed };
  const floor = generalFloor.value;
  if (floor) {
    const incoming = merged[floor.name];
    if (!incoming || (incoming.cascadeJson === null && incoming.activeCascadeFiles.length === 0)) {
      merged[floor.name] = floor;
    }
  }
  return merged;
}
async function loadGeneralFloor(): Promise<void> {
  try {
    const r = await fetch('/general-cascade');
    if (!r.ok) return;
    const j = (await r.json()) as Cascade;
    if (j && j.name === 'General') {
      generalFloor.value = j;
      cascades.value = mergeCascades(cascades.value);
    }
  } catch { /* absent route → the relay path stands alone */ }
}
const activeCascadeDirectory = ref<string>(GENERAL_CASCADE_DIRECTORY);
const activeSubPage = ref<SuiteCascadeSubPage>('documentation');

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

const subPageOptions = SUITECASCADE_SUB_PAGE_OPTIONS;

// --- Home derivation · the active General cascade (the GRID 'General' context).
const generalCascade = computed<Cascade | null>(
  () => cascades.value[GENERAL_CASCADE_NAME] ?? null,
);

// DOPR derivation — locate the Diamond + Onyx markdown among the General cascade's
// active files by the suite-derivation classifier (ONYX-TIER -> 'onyx',
// DIAMOND-TIER|MASTER-DIAMOND -> 'diamond'). Falls back to null → DOPR empty card.
const generalDiamondContent = computed<string | null>(() => {
  const cascade = generalCascade.value;
  if (!cascade) return null;
  const file = cascade.activeCascadeFiles.find(
    (f) => suiteFromCascadeFilePath(f.filePath) === 'diamond',
  );
  return file ? file.markdown : null;
});

const generalOnyxContent = computed<string | null>(() => {
  const cascade = generalCascade.value;
  if (!cascade) return null;
  const file = cascade.activeCascadeFiles.find(
    (f) => suiteFromCascadeFilePath(f.filePath) === 'onyx',
  );
  return file ? file.markdown : null;
});

const generalCascadeFiles = computed(() =>
  generalCascade.value ? generalCascade.value.activeCascadeFiles : [],
);

// GRID vs docked-SDCR context label for the Home surface.
const isGrid = computed<boolean>(
  () => activeCascadeDirectory.value === GENERAL_CASCADE_DIRECTORY,
);

function selectSubPage(subPage: SuiteCascadeSubPage) {
  if (!muxium) return;
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.suiteCascade.e.suiteCascadeSetActiveSubPage({
      activeSubPage: subPage,
    }),
  );
}

onMounted(() => {
  void loadGeneralFloor();
  if (typeof window === 'undefined') return;

  // IUPA · landing supplies suiteCascade as the muxonomic page concept. This is the
  // deferred B-4 client face — the serverToClient relays now have a deck to land in.
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createSuiteCascadeConcept(), muxonomy: suiteCascadeMuxonomic }],
    {
      title: 'SuiteCascadeLanding',
      logging: true,
      storeDialog: true,
    },
  );

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'suiteCascadeLandingSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
cascades.value = mergeCascades(d.client.d.suiteCascade.k.cascades.select() as Record<string, Cascade>);
            activeCascadeDirectory.value =
              d.client.d.suiteCascade.k.activeCascadeDirectory.select();
            const relayed = d.client.d.suiteCascade.k.activeSubPage.select();
            // C882 · 'home' is pruned from the triad — a relayed 'home' forwards to the site.
            const mapped = relayed === 'home' ? 'documentation' : relayed;
            // C895 · THE UNION GUARD (the C844 toggle-off class · recurrent): the relay's
            // boot/persistence beat can push a value OUTSIDE the rendered options (the
            // select-then-DESELECT wound) — accept only registry members; reject + hold.
            if (SUITECASCADE_SUB_PAGE_OPTIONS.some((o) => o.value === mapped)) {
              activeSubPage.value = mapped;
            } else {
              console.warn('[SuiteCascadeLanding C895] out-of-union subPage relay REJECTED ·', relayed);
            }
          },
          {
            selectors: [
              d__.client.d.suiteCascade.k.cascades,
              d__.client.d.suiteCascade.k.activeCascadeDirectory,
              d__.client.d.suiteCascade.k.activeSubPage,
            ],
          },
        ),
      ]),
  );
});

onUnmounted(() => {
  if (stagePlanner) stagePlanner.conclude();
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="suitecascade-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">Suite Cascade</h1>
      <p class="subtitle hifi-label">The Documentation Site · Base · Local · Cascade — rendered fresh from disk · Suite 8 Cascade Memory</p>
    </header>

    <main :class="['landing-content', { 'landing-content--reader': activeSubPage === 'documentation' }]">
      <SuiteCascadeSubPageNav
        :options="subPageOptions"
        :active-sub-page="activeSubPage"
        @sub-page-selected="selectSubPage"
      />

      <!-- C882 · HOME PRUNED — Documentation (the site) leads the triad. -->

      <!-- COMPONENT · CPLD live render keyed by the cascades plurality -->
      <SuiteCascadeComponentSubPage
        v-if="activeSubPage === 'component'"
        :cascades="cascades"
      />

      <!-- DOCUMENTATION · the Diamond-forms ladder + Commands (initial reference) -->
      <SuiteCascadeDocumentationSubPage v-else-if="activeSubPage === 'documentation'" />
    </main>
  </div>
</template>

<style scoped>
.suitecascade-landing {
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

/* C886 · the Documentation branch widens to a site reader's width — bounded, never spilling. */
.landing-content--reader { max-width: 1240px !important; }
.landing-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.home-subpage,
.home-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.home-subpage {
  gap: 1.25rem;
}

.home-context {
  border-radius: 8px;
  padding: 1.5rem;
}

.home-context h2 {
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

.home-block-label {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(200, 200, 200, 0.5);
}
</style>
