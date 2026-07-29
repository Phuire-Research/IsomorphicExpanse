<script setup lang="ts">
/**
 * Suite8SessionList — Pre-Filtered Session List (PFGD · Band A-5)
 *
 * PFGD Split Demometer:
 *   - THIS component (Suite8SessionList) = Pre-filtered-to-Name.
 *     Receives a suite8Name prop and renders ONLY sessions whose
 *     ScsBridgeSessionEntry.suite8Name matches. Used by the Suite8
 *     Component SubPage (A-6 HCD) to scope the session list to the
 *     active Suite 8 by Name.
 *   - General Manager (ScsBridgeSessionManagement) = General-with-filter-chip.
 *     Gains activeSuite8Filter ref + GMSF pills — the FULL session list,
 *     narrowable to a Suite 8 name by the user. Both Demometers draw a
 *     Diameter through session identity (PFGD: Pre-Filtered-General-Diameter).
 *
 * Architecture (mirrors Suite8OnDemand IUPA pattern):
 *   - IUPA Island: own ClientMuxiumDeck muxium per component mount.
 *   - DECK K Tier-2 reach: d.client.d.suite8.k.suite8s.select() (own Record)
 *     d.client.d.scsBridge.k.sessionsList.select() for the session list.
 *   - Fallback path: getGlobalScsBridgeController().sessionsList.value is used
 *     for the session list because the scsBridge concept's sessionsList is
 *     broadcast-relay state; the controller shallowRef is the proven reactive
 *     surface in this codebase (precedent: Suite8OnDemand.vue:104).
 *   - The suite8Name prop is the NDEP (literal directory entry name) that keys
 *     into suite8s Record and gates the session filter.
 *
 * Display: thin session-row list (id-label · spawnedAt · status).
 * No sort controls, no expand drawer — those live in the General Manager.
 * A "No sessions" empty state is shown when no sessions match the filter
 * (suite8Name absent from all sessionsList entries → expected before A-3 SAPR
 * populates the field at spawn).
 *
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §2 Band A-5 PFGD
 * Citation: ScsBridgeSessionManagement.vue activeScpFilter pattern (SCFC)
 * Citation: Suite8OnDemand.vue (IUPA + controller sessionsList access)
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../../client/client.muxonomy';
import { createSuite8ClientConcept } from '../../suite8.concept.client';
import { suite8Muxonomic } from '../../suite8.muxonomy';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';

// ============================================================
// PROPS
// ============================================================

interface Props {
  suite8Name: string;
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
    [{ concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic }],
    { title: 'Suite8SessionList', logging: false, storeDialog: false },
  );

  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8SessionListSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          () => {
            // Suite8SessionList is read-only with respect to suite8 state.
            // The session list is read from the controller shallowRef (reactive
            // surface proven by Suite8OnDemand precedent). No local dispatch needed.
          },
          { selectors: [d__.client.d.suite8.k.suite8s] },
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
// SESSION LIST — pre-filtered to suite8Name prop
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const allSessions = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// PFGD pre-filter: only sessions whose suite8Name matches the prop.
// This is the structural Diameter — suite8Name prop IS the filter predicate.
const filteredSessions = computed<ScsBridgeSessionEntry[]>(() =>
  allSessions.value.filter((s) => s.suite8Name === props.suite8Name),
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
  <div class="suite8-session-list">
    <header class="suite8-session-list-header">
      <h3 class="hifi-heading">Sessions for {{ suite8Name }}</h3>
      <p class="suite8-session-list-subtitle">
        {{ filteredSessions.length }} session{{ filteredSessions.length !== 1 ? 's' : '' }}
        · pre-filtered to this Suite 8
      </p>
    </header>

    <div v-if="filteredSessions.length === 0" class="suite8-session-list-empty">
      <p>No sessions for Suite 8 "{{ suite8Name }}" · spawn a session via the Spawn control above</p>
    </div>

    <ul v-else class="suite8-session-list-rows" role="list">
      <li
        v-for="session in filteredSessions"
        :key="session.id"
        class="suite8-session-row"
        :class="[`suite8-session-row-${session.status}`]"
      >
        <span class="suite8-session-cell suite8-session-cell-id">
          {{ session.scsLabel?.trim() || session.displayName?.trim() || shortId(session.id) }}
        </span>
        <span class="suite8-session-cell suite8-session-cell-time">
          {{ formatTime(session.spawnedAt) }}
        </span>
        <span class="suite8-session-cell">
          <span :class="['session-status-badge', `session-status-badge-${session.status}`]">
            {{ session.status.toUpperCase() }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
