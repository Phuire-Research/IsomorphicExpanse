<script setup lang="ts">
/**
 * FrontierCircuitTestSessionList — Pre-Filtered Session List (PFGD · Band A-5)
 *
 * PFGD Split Demometer:
 *   - THIS component (FrontierCircuitTestSessionList) = Pre-filtered-to-Name.
 *     Receives a frontierCircuitTestName prop and renders ONLY sessions whose
 *     ScsBridgeSessionEntry.frontierCircuitTestName matches. Used by the FrontierCircuitTest
 *     Component SubPage (A-6 HCD) to scope the session list to the
 *     active Suite 8 by Name.
 *   - General Manager (ScsBridgeSessionManagement) = General-with-filter-chip.
 *     Gains activeFrontierCircuitTestFilter ref + GMSF pills — the FULL session list,
 *     narrowable to a Suite 8 name by the user. Both Demometers draw a
 *     Diameter through session identity (PFGD: Pre-Filtered-General-Diameter).
 *
 * Architecture (mirrors FrontierCircuitTestOnDemand IUPA pattern):
 *   - IUPA Island: own ClientMuxiumDeck muxium per component mount.
 *   - DECK K Tier-2 reach: d.client.d.frontierCircuitTest.k.frontierCircuitTests.select() (own Record)
 *     d.client.d.scsBridge.k.sessionsList.select() for the session list.
 *   - Fallback path: getGlobalScsBridgeController().sessionsList.value is used
 *     for the session list because the scsBridge concept's sessionsList is
 *     broadcast-relay state; the controller shallowRef is the proven reactive
 *     surface in this codebase (precedent: FrontierCircuitTestOnDemand.vue:104).
 *   - The frontierCircuitTestName prop is the NDEP (literal directory entry name) that keys
 *     into frontierCircuitTests Record and gates the session filter.
 *
 * Display: thin session-row list (id-label · spawnedAt · status).
 * No sort controls, no expand drawer — those live in the General Manager.
 * A "No sessions" empty state is shown when no sessions match the filter
 * (frontierCircuitTestName absent from all sessionsList entries → expected before A-3 SAPR
 * populates the field at spawn).
 *
 * Citation: MASTER-DIAMOND-FRONTIERCIRCUITTEST-CONCEPT-ASPIRANT.md §2 Band A-5 PFGD
 * Citation: ScsBridgeSessionManagement.vue activeScpFilter pattern (SCFC)
 * Citation: FrontierCircuitTestOnDemand.vue (IUPA + controller sessionsList access)
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../../client/client.muxonomy';
import { createFrontierCircuitTestClientConcept } from '../../frontierCircuitTest.concept.client';
import { frontierCircuitTestMuxonomic } from '../../frontierCircuitTest.muxonomy';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';

// ============================================================
// PROPS
// ============================================================

interface Props {
  frontierCircuitTestName: string;
}

const props = defineProps<Props>();

// ============================================================
// MUXIUM SETUP (IUPA · per-component island)
// ============================================================

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createFrontierCircuitTestClientConcept(), muxonomy: frontierCircuitTestMuxonomic }],
    { title: 'FrontierCircuitTestSessionList', logging: false, storeDialog: false },
  );

  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'frontierCircuitTestSessionListSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          () => {
            // FrontierCircuitTestSessionList is read-only with respect to frontierCircuitTest state.
            // The session list is read from the controller shallowRef (reactive
            // surface proven by FrontierCircuitTestOnDemand precedent). No local dispatch needed.
          },
          { selectors: [d__.client.d.frontierCircuitTest.k.frontierCircuitTests] },
        ),
      ]),
  );
});

onUnmounted(() => {
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) stagePlanner.conclude();
  if (muxium) muxium.close();
});

// ============================================================
// SESSION LIST — pre-filtered to frontierCircuitTestName prop
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const allSessions = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// PFGD pre-filter: only sessions whose frontierCircuitTestName matches the prop.
// This is the structural Diameter — frontierCircuitTestName prop IS the filter predicate.
const filteredSessions = computed<ScsBridgeSessionEntry[]>(() =>
  allSessions.value.filter((s) => s.frontierCircuitTestName === props.frontierCircuitTestName),
);

// ============================================================
// DISPLAY HELPERS
// ============================================================

function shortId(id: string): string {
  return id.slice(-8);
}

function formatTime(timestamp: number | undefined): string {
  if (timestamp === undefined) return '—';
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '—';
  }
}
</script>

<template>
  <div class="frontierCircuitTest-session-list">
    <header class="frontierCircuitTest-session-list-header">
      <h3 class="hifi-heading">Sessions for {{ frontierCircuitTestName }}</h3>
      <p class="frontierCircuitTest-session-list-subtitle">
        {{ filteredSessions.length }} session{{ filteredSessions.length !== 1 ? 's' : '' }}
        · pre-filtered to this Suite 8
      </p>
    </header>

    <div v-if="filteredSessions.length === 0" class="frontierCircuitTest-session-list-empty">
      <p>No sessions for Suite 8 "{{ frontierCircuitTestName }}" · spawn a session via the Spawn control above</p>
    </div>

    <ul v-else class="frontierCircuitTest-session-list-rows" role="list">
      <li
        v-for="session in filteredSessions"
        :key="session.id"
        class="frontierCircuitTest-session-row"
        :class="[`frontierCircuitTest-session-row-${session.status}`]"
      >
        <span class="frontierCircuitTest-session-cell frontierCircuitTest-session-cell-id">
          {{ session.scsLabel?.trim() || session.displayName?.trim() || shortId(session.id) }}
        </span>
        <span class="frontierCircuitTest-session-cell frontierCircuitTest-session-cell-time">
          {{ formatTime(session.spawnedAt) }}
        </span>
        <span class="frontierCircuitTest-session-cell">
          <span :class="['session-status-badge', `session-status-badge-${session.status}`]">
            {{ session.status.toUpperCase() }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
