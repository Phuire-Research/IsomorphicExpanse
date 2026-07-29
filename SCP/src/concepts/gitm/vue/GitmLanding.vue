<script setup lang="ts">
/**
 * GitM Landing — the REGISTERED GitM page island (Suite Muxonomy sidebar entry)
 *
 * The 'gitm' island. Surfaces the live git surface as a top-level REGISTERED page
 * (sibling of Suite Cascade / Cadmium Researcher) — NOT only as the SCS-Bridge "GitM"
 * sub-page tab. The page's gitmJson rides the gitm BASE concept (BASE_CONCEPTS_CREATORS ·
 * #639) — d.client.d.gitm.k.gitmJson, populated from Huirth via the gitm STCP relay. The
 * action-pipe (scsBridgeSetGitmPendingAction) STAYS on the scsBridge base deck (orthogonal
 * MCP dispatch, NOT the file-watch relay). This Landing creates the Client Muxium with NO
 * muxonomic page concepts (gitm is BASE · always present) and binds the gitmJson selector
 * + the onGitmAction dispatcher, then renders ScsBridgeGitmSubPage.vue.
 *
 * Citation: ScsBridgeLanding.vue (muxium composition + gitmJson subscription + onGitmAction).
 * Citation: client.muxonomy.ts BASE_CONCEPTS_CREATORS (gitm + scsBridge universal base).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W4 consumer re-point.
 */
import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import type { GitmJsonShape } from '../gitm.type';
import type { UpdateDiffShape, UpdateResolvedShape } from '../gitmUpdate.type';
import type { GitmPendingAction } from '../../scsBridge/scsBridge.type';
// GPIM · bind this landing's Muxium into the universal scsBridge controller (parity with
// ScsBridgeLanding) so the TaskBar Turn Over can dispatch via this Muxium's deck.
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import ScsBridgeGitmSubPage from '../../scsBridge/vue/components/ScsBridgeGitmSubPage.vue';

// GITM PAGE · gitm.json relay ref (populated from Huirth via the gitmJsonWatcher relay).
const gitmJson = ref<GitmJsonShape | null>(null);

// THE VERSIONING MUXAMETER · the ?sub=update seed + the /scs-bridge-version verdict.
const initialGitmTab = ref<'workflow' | 'graph' | 'update' | null>(null);
const versionCheck = ref<{
  updateClass?: string;
  npmLatestVersion?: string | null;
  installedVersion?: string | null;
} | null>(null);
// GITM SCP-UPD (C282) · the HEAVY diff body — MOCH-carried (the update watcher's C1 relay
// fires at server boot before any client connects and BOCR is dead #640); the /gitm page
// previously passed NO update-diff at all. generatedAt-guarded.
const updateDiff = ref<UpdateDiffShape | null>(null);
let lastDiffGeneratedAt = '';
function fetchUpdateDiffMoch(): void {
  void fetch('/gitm-update-diff')
    .then((r) => (r.ok ? r.json() : null))
    .then((parsed) => {
      if (parsed && parsed.buckets && typeof parsed.generatedAt === 'string') {
        if (parsed.generatedAt === lastDiffGeneratedAt) return;
        lastDiffGeneratedAt = parsed.generatedAt;
        updateDiff.value = parsed as UpdateDiffShape;
      }
    })
    .catch(() => {
      /* absent/unreachable → the review rail stays empty until the next trigger */
    });
}
const updateResolved = ref<UpdateResolvedShape | null>(null);
function fetchUpdateResolvedMoch(): void {
  void fetch('/gitm-update-resolved')
    .then((r) => (r.ok ? r.json() : null))
    .then((parsed) => {
      if (parsed && Array.isArray(parsed.decisions)) {
        updateResolved.value = parsed as UpdateResolvedShape;
      }
    })
    .catch(() => {
      /* absent → Apply stays gated until the next trigger */
    });
}
// Re-fetch when a NEW diff lands: updateStatus rides the gitmJson relay (live-proven).
watch(
  () => gitmJson.value?.updateStatus,
  (u) => {
    if (u && u.diffPresent) fetchUpdateDiffMoch();
    // The resolved body's arrival signal (the resolver wrote + the stage advanced) —
    // ALSO poll on resolvedPending changes while reviewing (the resolver writes DURING review).
    if (u && (u.stage === 'resolving' || u.stage === 'applying' || u.diffPresent)) {
      fetchUpdateResolvedMoch();
    }
  },
  { deep: true },
);

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

function onGitmAction(action: GitmPendingAction) {
  if (!muxium) return;
  // Set the action-pipe trigger field; scsBridgeGitmActionPrinciple watches it and
  // fires the MCP fetch. State returns via the gitm.json watcher relay (ACK-ONLY).
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.scsBridge.e.scsBridgeSetGitmPendingAction({
      gitmPendingAction: action,
    }),
  );
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // THE VERSIONING MUXAMETER · the ?sub=update deep link (the C821-mirror reader — the
  // TaskBar version label's DUAL-RAIL click lands /?island=gitm&sub=update) → seed the
  // sub-page's Update tab. 'update' is the only tagged tab; unknown tags fall through.
  const subTag = new URLSearchParams(window.location.search).get('sub');
  if (subTag === 'update') initialGitmTab.value = 'update';

  // THE MUXAMETER VERDICT · one fetch on mount (the TaskBar/scp-config idiom) — the SCP
  // server's counter comparison drives the sub-page's class gates.
  {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 5000);
    fetch('/scs-bridge-version', { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { updateClass?: unknown; npmLatestVersion?: unknown; installedVersion?: unknown } | null) => {
        if (body) versionCheck.value = body as typeof versionCheck.value;
      })
      .catch(() => { /* absent route (an older server) — the gates stay class-less */ })
      .finally(() => clearTimeout(timer));
  }

  // scsBridge is the universal base (BASE_CONCEPTS_CREATORS) — no page concepts needed;
  // gitmJson + scsBridgeSetGitmPendingAction live on the base scsBridge deck.
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>([], {
    title: 'GitmLanding',
    logging: true,
    storeDialog: true,
  });

  // GPIM · bind this landing's Muxium into the universal scsBridge controller.
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'gitmLandingSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            // GITM #639 · gitmJson relay subscription (gitm BASE concept).
            gitmJson.value = d.client.d.gitm.k.gitmJson.select();
          },
          {
            selectors: [
              // GITM #639 · gitmJson relay selector (gitm BASE concept).
              d__.client.d.gitm.k.gitmJson,
            ],
          },
        ),
      ]),
  );

  // GITM #639 · the MOCH on-mount hydration (the diagnosis · the cadmium-menu doctrine): the
  // webSocketServer does NOT replay state on (re)connect, and the STCP relay's BOCR backfill is
  // dead across all relays — so a late-mounting client (the page opens on navigation, well after
  // the SMRP broadcast) NEVER receives the gitmJson via the relay alone. On mount, GET the
  // current snapshot from /gitm-status and DISPATCH it; the live SMRP relay then keeps it fresh.
  void fetch('/gitm-status')
    .then((r) => (r.ok ? r.json() : null))
    .then((parsed) => {
      if (parsed && typeof parsed.isRepo === 'boolean') {
        muxium?.dispatch(
          (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.gitm.e.gitmSetGitmJson({
            gitmJson: parsed as GitmJsonShape,
          }),
        );
      }
    })
    .catch(() => {
      /* absent/unreachable → keep the placeholder; the relay still delivers live status */
    });

  // GITM SCP-UPD (C282) · the heavy-body MOCH at mount (covers already-present bodies).
  fetchUpdateDiffMoch();
  fetchUpdateResolvedMoch();
});

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium.
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) stagePlanner.conclude();
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="gitm-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">GitM</h1>
      <p class="subtitle hifi-label">Bridge Git Manager · Live Working-Tree Surface</p>
    </header>

    <main class="landing-content">
      <ScsBridgeGitmSubPage
        :gitm-json="gitmJson"
        :update-diff="updateDiff"
        :update-resolved="updateResolved"
        :initial-tab="initialGitmTab"
        :version-check="versionCheck"
        @gitm-action="onGitmAction"
      />
    </main>
  </div>
</template>

<style scoped>
.gitm-landing {
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
</style>
