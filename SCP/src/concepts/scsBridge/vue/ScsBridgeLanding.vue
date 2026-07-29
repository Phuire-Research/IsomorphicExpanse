<script setup lang="ts">
/**
 * SCS-Bridge Landing Page (Client Muxium · Bridge-Relay Surface · NOT chatbot)
 *
 * D2 minimum: bar visible toggle · status mirror display · sub-page selector ·
 * single message-send form. Directly embeds Vue↔Stratimux state subscription
 * (NotificationLanding pattern — separate controller module justified only
 * when multi-component mediation is needed in D3-D5).
 *
 * Architecture: scsBridge/vue/ScsBridgeLanding.vue
 * Pattern: Each concept owns its Vue pages
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave F
 * Citation: NotificationLanding.vue (Vue↔Stratimux integration exemplar)
 * Citation: STRATIMUX-VUE-REFERENCE.md "Proper State Subscription Pattern"
 */
import { ref, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
import type {
  ScsBridgeSubPage,
  BridgeJsonShape,
  ScsBridgeSessionEntry,
} from '../scsBridge.type';
// Cycle 159 D1 · IUPA · suite8 + cadmium pulled out of base · landing now muxifies per-page
import { createSuite8ClientConcept } from '../../suite8/suite8.concept.client';
import { createCadmiumClientConcept } from '../../cadmium/cadmium.concept.client';
import { suite8Muxonomic } from '../../suite8/suite8.muxonomy';
import { cadmiumMuxonomic } from '../../cadmium/cadmium.muxonomy';
// Cycle 159 D1 · GPIM · Vue-layer Muxium binding into universal controller
import { getGlobalScsBridgeController } from '../scsBridgeController';
import ScsBridgeSubPageNav from './components/ScsBridgeSubPageNav.vue';
import ScsBridgeComponentsSubPage from './components/ScsBridgeComponentsSubPage.vue';
import ScsBridgeSessionManagement from './components/ScsBridgeSessionManagement.vue';
import ScsBridgeArchiveView from './components/ScsBridgeArchiveView.vue';
import ScsBridgeSettingsSubPage from './components/ScsBridgeSettingsSubPage.vue';
import ScsBridgeDocumentationSubPage from './components/ScsBridgeDocumentationSubPage.vue';
// MD-B · THE INSTALLATION SUB-PAGE (install via path anor URL · the roster · Boot/Focus).
import ScsBridgeInstallationSubPage from './components/ScsBridgeInstallationSubPage.vue';
import { SCSBRIDGE_SUB_PAGE_OPTIONS } from '../scsBridge.subPageRegistry';
// MD-6 · D-BP-3 · the CARD subpage mounts the MD-5 Character-Forward Card for SCS-Bridge.
import Suite8Card from '../../suite8/vue/components/Suite8Card.vue';

const bridgeStatus = ref<string>('');
const bridgeStatusLastUpdate = ref<number>(0);
const connectionEstablished = ref<boolean>(false);
const activeSubPage = ref<ScsBridgeSubPage>('sessions');
// C828 · THE PATHED LATCH: 'sessions' is a DEFAULT SELECTION — a &sub= navigation OVERRIDES
// it. While the latch holds a target, the state sync may not clobber the pathed paint with
// the default; convergence (the dispatched target arriving back) clears the latch and
// normal sync resumes (nav clicks behave as ever after).
const pathedSubPage = ref<ScsBridgeSubPage | null>(null);

// ============================================================
// D-EF-0 · THE SUB-NAV STANDARDIZATION (one bar · Card LAST · SCS-Bridge conformance)
// The MD-6 stacked HOME|CARD wrapper is DISSOLVED — 'card' is now the LAST entry of THIS
// island's OWN sub-page nav (ScsBridgeSubPageNav · registry-driven). activeSubPage === 'card'
// renders Suite8Card in the content flow. HONEST SCOPE: SCS-Bridge is a bridge-operating-set
// Suite 8 (not in the template SCP's own Cascades/8_SUITES · MD-2 split), so its /suite8/...
// reader routes 404 here — the card degrades gracefully (initials fallback · never breaks).
// ============================================================
const scsBridgeCardEntry = {
  name: 'SCS Bridge',
  directoryPath: 'Cascades/8_SUITES/SCS Bridge',
  description: 'Bridge-relay island · session management · GitM',
  color: '#10b981',
};
const isConnected = ref<boolean>(false);
const pendingActionQueLength = ref<number>(0);

// Cycle 155 · BJDP · JSON Relay refs (populated from Huirth via Path B broadcast)
const bridgeJson = ref<BridgeJsonShape | null>(null);
const sessionsList = ref<ScsBridgeSessionEntry[]>([]);

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

const subPageOptions = SCSBRIDGE_SUB_PAGE_OPTIONS;

// Deep-link seed for the Documentation sub-page: a caller stashes a topic id in
// localStorage ('scs:doc-target') before navigating here; on mount we consume it once,
// route to the Documentation page, and pass the topic through to the sub-page component.
const docInitialTopic = ref<string>('');

// C829 · the INTERNAL dispatch — moves the deck state WITHOUT touching the pathed latch
// (the retry uses this; a delayed default selector can then never ride a cleared latch).
function dispatchSubPage(subPage: ScsBridgeSubPage) {
  if (!muxium) return;
  muxium.dispatch(
    (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.scsBridge.e.scsBridgeSetActiveSubPage({
      activeSubPage: subPage,
    }),
  );
}

// USER INTENT (nav clicks · the Session Manager link): clears the pathed latch — the one
// legitimate override of a pathed navigation — then dispatches.
function selectSubPage(subPage: ScsBridgeSubPage) {
  pathedSubPage.value = null;
  dispatchSubPage(subPage);
  activeSubPage.value = subPage;
}

function formatTime(timestamp: number): string {
  if (timestamp === 0) return '—';
  return new Date(timestamp).toLocaleTimeString();
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // Deep-link consume: a stashed doc target routes this landing to the Documentation
  // page on arrival. Read-once semantics (removeItem) so a later normal visit is not
  // hijacked back to Documentation.
  const stashedDocTarget = localStorage.getItem('scs:doc-target');
  if (stashedDocTarget) {
    docInitialTopic.value = stashedDocTarget;
    localStorage.removeItem('scs:doc-target');
  }

  // Cycle 159 D1 · IUPA · landing supplies suite8 + cadmium as muxonomic page concepts.
  // scsBridge auto-included as universal base via BASE_CONCEPTS_CREATORS.
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [
      { concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic },
      { concept: createCadmiumClientConcept(), muxonomy: cadmiumMuxonomic },
    ],
    {
      title: 'ScsBridgeLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller
  // so Shell.vue TaskBar Turn Over can dispatch via this Muxium's deck.
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // Deep-link route: honor the consumed doc target now that the Muxium exists.
  if (docInitialTopic.value) selectSubPage('documentation');

  // C821 D1 · THE SUB-PAGE URL TAG — external navigation lands on a specific sub-page:
  // `?island=scsBridge&sub=<subId>` (the C781 island deep-link's sibling). Aliases accepted
  // so the public name and the internal id both resolve; unknown tags no-op.
  const subTag = new URLSearchParams(window.location.search).get('sub');
  if (subTag) {
    const SUB_ALIASES: Record<string, ScsBridgeSubPage> = {
      'scp-management': 'installation',
      'installation': 'installation',
      'sessions': 'sessions',
      'components': 'components',
      'archive': 'archive',
      'settings': 'settings',
      'documentation': 'documentation',
      'card': 'card',
    };
    const resolved = SUB_ALIASES[subTag.toLowerCase()];
    if (resolved) {
      // C826 · the field caught the single mount-time dispatch dying (the muxium just born —
      // an early dispatch can drop, and the state sync then holds the initial sub-page).
      // THE CURE: paint the ref IMMEDIATELY + retry the dispatch until the deck state reads
      // the target (bounded — 10 tries · 200ms).
      activeSubPage.value = resolved;
      pathedSubPage.value = resolved;
      let subTries = 0;
      const subTimer = setInterval(() => {
        subTries += 1;
        try {
          dispatchSubPage(resolved);
          const cur = muxium
            ? (muxium as Muxium<ClientMuxiumDeck>).deck.d.client.d.scsBridge.k.activeSubPage.select()
            : null;
          if (cur === resolved || subTries >= 10) clearInterval(subTimer);
          // the latch HOLDS past convergence anor exhaustion — only user intent clears it
          // (the paint already shows the target; nav clicks clear via selectSubPage).
        } catch {
          if (subTries >= 10) clearInterval(subTimer);
        }
      }, 200);
    }
  }

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'scsBridgeLandingSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => {
        console.log('[SCS-Bridge Landing] Subscription plan initialized');
        return [
          stage(
            ({ d }) => {
              bridgeStatus.value = d.client.d.scsBridge.k.bridgeStatus.select();
              bridgeStatusLastUpdate.value =
                d.client.d.scsBridge.k.bridgeStatusLastUpdate.select();
              connectionEstablished.value =
                d.client.d.scsBridge.k.connectionEstablished.select();
              // SESSION-MANAGEMENT-IS-MAIN (Lambda-of-2b): guard the sync — an early plan-start
              // read can return a falsy/unknown value and clobber the 'sessions' default, leaving
              // NO branch matched + no tab active on arrival. Only assign a truthy value.
              const nextSubPage = d.client.d.scsBridge.k.activeSubPage.select();
              // C828→C829 · the default YIELDS to the pathed set — and the latch now holds
              // until USER INTENT (a nav click), not until convergence: the field caught a
              // DELAYED selector re-asserting 'sessions' a moment after convergence cleared
              // the first latch. While latched, ONLY the target may sync through.
              if (nextSubPage) {
                if (pathedSubPage.value && nextSubPage !== pathedSubPage.value) {
                  // the delayed default suppressed — the pathed selection stands
                } else {
                  activeSubPage.value = nextSubPage;
                }
              }
              isConnected.value = d.client.d.webSocketClient.k.isConnected.select();
              pendingActionQueLength.value = d.client.d.scsBridge.k.actionQue.select().length;
              // Cycle 155 · BJDP · JSON Relay subscriptions
              bridgeJson.value = d.client.d.scsBridge.k.bridgeJson.select();
              sessionsList.value = d.client.d.scsBridge.k.sessionsList.select();
            },
            {
              selectors: [
                d__.client.d.scsBridge.k.bridgeStatus,
                d__.client.d.scsBridge.k.bridgeStatusLastUpdate,
                d__.client.d.scsBridge.k.connectionEstablished,
                d__.client.d.scsBridge.k.activeSubPage,
                d__.client.d.scsBridge.k.actionQue,
                d__.client.d.webSocketClient.k.isConnected,
                // Cycle 155 · BJDP relay selectors
                d__.client.d.scsBridge.k.bridgeJson,
                d__.client.d.scsBridge.k.sessionsList,
              ],
            },
          ),
        ];
      }),
  );

});

// C844 S1 · the GitM sub-page MOCH hydration + watch PRUNED with the sub-page (the
// dedicated GitM island self-hydrates — verified before the cut).

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) {
    stagePlanner.conclude();
  }
  if (muxium) {
    muxium.close();
  }
});
</script>

<template>
  <div class="scs-bridge-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">SCS-Bridge</h1>
      <p class="subtitle hifi-label">Bridge-Relay Island · CommandLine UI Mirror</p>
    </header>

    <main class="landing-content">
      <section v-if="activeSubPage !== 'card'" class="status-panel hifi-pane-green">
        <h2 class="hifi-heading">Connection Status</h2>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">WebSocket</span>
            <span :class="['status-value', isConnected ? 'connected' : 'disconnected']">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Bridge</span>
            <span
              :class="[
                'status-value',
                connectionEstablished ? 'connected' : 'disconnected',
              ]"
            >
              {{ connectionEstablished ? 'Established' : 'Pending' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Last Update</span>
            <span class="status-value time">{{ formatTime(bridgeStatusLastUpdate) }}</span>
          </div>
        </div>
      </section>

      <ScsBridgeSubPageNav
        :options="subPageOptions"
        :active-sub-page="activeSubPage"
        @sub-page-selected="selectSubPage"
      />

      <!-- D-UP7 · THE UPDATE INDICATOR chip — visible on every sub-page ONLY when the bridge's
           npm registry check reports a newer published version. Routes to the Bridge surface
           (the installation sub-page) where installed-vs-latest renders in full. -->
      <button
        v-if="bridgeJson?.updateAvailable"
        class="scs-bridge-update-chip hifi-mono"
        title="A newer SCS-Bridge is published on npm — open the Bridge page for details."
        @click="selectSubPage('installation')"
      >
        UPDATE AVAILABLE · v{{ bridgeJson?.npmLatestVersion }}
      </button>

      <!-- SESSION MANAGEMENT IS THE MAIN PAGE (Lambda-of-2 user finding): the active sub-page
           content renders DIRECTLY under the nav — previously the unconditional Suite-8 toolbar
           panel sat between them, pushing Session Management below the fold (the PlayTest opened
           the Session Management popup TOOLBAR instead of seeing the main page). The toolbar +
           broadcast panels now follow the sub-page content. -->
      <!-- D-EF-0 · CARD SUBPAGE — the MD-5 Character-Forward Card (the LAST tab of the island's own nav) -->
      <div v-if="activeSubPage === 'card'" class="scs-bridge-card-subpage">
        <Suite8Card :entry="scsBridgeCardEntry" domain="Bridge" :compact="false" />
      </div>
      <ScsBridgeComponentsSubPage
        v-else-if="activeSubPage === 'components'"
        :bridge-status="bridgeStatus"
        :bridge-json="bridgeJson"
        :sessions-list="sessionsList"
      />
      <ScsBridgeArchiveView
        v-else-if="activeSubPage === 'archive'"
      />
      <ScsBridgeSettingsSubPage
        v-else-if="activeSubPage === 'settings'"
      />
      <ScsBridgeDocumentationSubPage
        v-else-if="activeSubPage === 'documentation'"
        :initial-topic="docInitialTopic"
      />
      <ScsBridgeInstallationSubPage
        v-else-if="activeSubPage === 'installation'"
        :bridge-json="bridgeJson"
      />
      <!-- SESSION MANAGEMENT IS THE MAIN PAGE — the final v-else: whenever no other sub-page
           is explicitly selected (including any boot-value drift), Session Management renders.
           The default-by-construction the Lambda-of-2 finding demands. -->
      <ScsBridgeSessionManagement
        v-else
        :bridge-json="bridgeJson"
        :sessions-list="sessionsList"
        @navigate-sub-page="selectSubPage"
      />

      <!-- C842 · the Spawned-Suite-8-Instances placeholder + the Send-Message broadcast demo
           PRUNED (superseded: the Suite 8 roster page is the real registry surface; session
           messaging rides the Session Manager) -->
      <!-- C913 · the Architecture Notes panel PRUNED (dev-era prose · not user teaching). -->
    </main>
  </div>
</template>

<style scoped>
.scs-bridge-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
}

/* D-EF-0 · the CARD subpage (now the LAST tab of the island's own sub-page nav · no separate bar). */
.scs-bridge-card-subpage {
  max-width: 560px;
  margin: 0 auto;
}

.landing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.landing-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.875rem;
}

/* D-UP7 · THE UPDATE INDICATOR chip — appears under the nav only when the bridge's npm
   check reports a newer publish; routes to the Bridge (installation) surface. */
.scs-bridge-update-chip {
  align-self: flex-start;
  margin: 0.5rem 0 0;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  border: 1px dotted rgba(74, 222, 128, 0.8);
  background: rgba(74, 222, 128, 0.08);
  color: rgba(74, 222, 128, 0.95);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.scs-bridge-update-chip:hover {
  background: rgba(74, 222, 128, 0.16);
}

.landing-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Panels — visual styling from .hifi-pane-* globals; layout-only here */
.status-panel,
.info-panel {
  border-radius: 8px;
  padding: 1.5rem;
}

.status-panel h2,
.info-panel h2 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  margin-top: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-value {
  font-size: 1rem;
  font-weight: 600;
}

.status-value.connected {
  color: var(--color-green-light, #4ade80);
}

.status-value.disconnected {
  color: var(--color-red-light, #ef4444);
}

.status-value.time {
  color: var(--color-blue-light, #60a5fa);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.875rem;
}

.control-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: var(--color-blue); /* D3 · hex→token so a user re-tint flows (was #3b82f6, byte-identical) */
  color: white;
}

.control-btn:hover {
  background: var(--color-blue-dark); /* D3 · hover = blue's dark variant (was #2563eb cobalt) — re-tints with blue, keeps the hover-darken */
}

.instance-select {
  padding: 0.75rem 0.875rem;
  background: #0f0f1a;
  border: 1px solid #2d2d44;
  border-radius: 6px;
  color: #e5e5e5;
  font-size: 0.875rem;
  font-family: 'SF Mono', Monaco, monospace;
  min-width: 220px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%234ade80' d='M6 8 0 0h12z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem;
}

.instance-select:focus {
  outline: none;
  border-color: #4ade80;
}

.info-content {
  color: #9ca3af;
  line-height: 1.6;
}

.info-content p {
  margin-bottom: 0.75rem;
  margin-top: 0;
}

.info-content p:last-child {
  margin-bottom: 0;
}

.info-content strong {
  color: #a78bfa;
}

</style>
