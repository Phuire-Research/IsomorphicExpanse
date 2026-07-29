<script setup lang="ts">
/**
 * GraphiteScribeSessionList — Pre-Filtered Session List (PFGD · Band A-5)
 *
 * PFGD Split Demometer:
 *   - THIS component (GraphiteScribeSessionList) = Pre-filtered-to-Name.
 *     Receives a graphiteScribeName prop and renders ONLY sessions whose
 *     ScsBridgeSessionEntry.graphiteScribeName matches. Used by the GraphiteScribe
 *     Component SubPage (A-6 HCD) to scope the session list to the
 *     active Suite 8 by Name.
 *   - General Manager (ScsBridgeSessionManagement) = General-with-filter-chip.
 *     Gains activeGraphiteScribeFilter ref + GMSF pills — the FULL session list,
 *     narrowable to a Suite 8 name by the user. Both Demometers draw a
 *     Diameter through session identity (PFGD: Pre-Filtered-General-Diameter).
 *
 * Architecture (mirrors GraphiteScribeOnDemand IUPA pattern):
 *   - IUPA Island: own ClientMuxiumDeck muxium per component mount.
 *   - DECK K Tier-2 reach: d.client.d.graphiteScribe.k.graphiteScribes.select() (own Record)
 *     d.client.d.scsBridge.k.sessionsList.select() for the session list.
 *   - Fallback path: getGlobalScsBridgeController().sessionsList.value is used
 *     for the session list because the scsBridge concept's sessionsList is
 *     broadcast-relay state; the controller shallowRef is the proven reactive
 *     surface in this codebase (precedent: GraphiteScribeOnDemand.vue:104).
 *   - The graphiteScribeName prop is the NDEP (literal directory entry name) that keys
 *     into graphiteScribes Record and gates the session filter.
 *
 * Display: thin session-row list (id-label · spawnedAt · status).
 * No sort controls, no expand drawer — those live in the General Manager.
 * A "No sessions" empty state is shown when no sessions match the filter
 * (graphiteScribeName absent from all sessionsList entries → expected before A-3 SAPR
 * populates the field at spawn).
 *
 * Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md §2 Band A-5 PFGD
 * Citation: ScsBridgeSessionManagement.vue activeScpFilter pattern (SCFC)
 * Citation: GraphiteScribeOnDemand.vue (IUPA + controller sessionsList access)
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../../client/client.muxonomy';
import { createGraphiteScribeClientConcept } from '../../graphiteScribe.concept.client';
import { graphiteScribeMuxonomic } from '../../graphiteScribe.muxonomy';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';

// ============================================================
// PROPS
// ============================================================

interface Props {
  graphiteScribeName: string;
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
    [{ concept: createGraphiteScribeClientConcept(), muxonomy: graphiteScribeMuxonomic }],
    { title: 'GraphiteScribeSessionList', logging: false, storeDialog: false },
  );

  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'graphiteScribeSessionListSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          () => {
            // GraphiteScribeSessionList is read-only with respect to graphiteScribe state.
            // The session list is read from the controller shallowRef (reactive
            // surface proven by GraphiteScribeOnDemand precedent). No local dispatch needed.
          },
          { selectors: [d__.client.d.graphiteScribe.k.graphiteScribes] },
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
// SESSION LIST — pre-filtered to graphiteScribeName prop
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const allSessions = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// PFGD pre-filter: only sessions whose graphiteScribeName matches the prop.
// This is the structural Diameter — graphiteScribeName prop IS the filter predicate.
const filteredSessions = computed<ScsBridgeSessionEntry[]>(() =>
  allSessions.value.filter((s) => s.graphiteScribeName === props.graphiteScribeName),
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
  <div class="graphiteScribe-session-list">
    <header class="graphiteScribe-session-list-header">
      <h3 class="hifi-heading">Sessions for {{ graphiteScribeName }}</h3>
      <p class="graphiteScribe-session-list-subtitle">
        {{ filteredSessions.length }} session{{ filteredSessions.length !== 1 ? 's' : '' }}
        · pre-filtered to this Suite 8
      </p>
    </header>

    <div v-if="filteredSessions.length === 0" class="graphiteScribe-session-list-empty">
      <p>No sessions for Suite 8 "{{ graphiteScribeName }}" · spawn a session via the Spawn control above</p>
    </div>

    <ul v-else class="graphiteScribe-session-list-rows" role="list">
      <li
        v-for="session in filteredSessions"
        :key="session.id"
        class="graphiteScribe-session-row"
        :class="[`graphiteScribe-session-row-${session.status}`]"
      >
        <span class="graphiteScribe-session-cell graphiteScribe-session-cell-id">
          {{ session.scsLabel?.trim() || session.displayName?.trim() || shortId(session.id) }}
        </span>
        <span class="graphiteScribe-session-cell graphiteScribe-session-cell-time">
          {{ formatTime(session.spawnedAt) }}
        </span>
        <span class="graphiteScribe-session-cell">
          <span :class="['session-status-badge', `session-status-badge-${session.status}`]">
            {{ session.status.toUpperCase() }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
