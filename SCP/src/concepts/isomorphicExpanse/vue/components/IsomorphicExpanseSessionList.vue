<script setup lang="ts">
/**
 * IsomorphicExpanseSessionList — Pre-Filtered Session List (PFGD · Band A-5)
 *
 * PFGD Split Demometer:
 *   - THIS component (IsomorphicExpanseSessionList) = Pre-filtered-to-Name.
 *     Receives a isomorphicExpanseName prop and renders ONLY sessions whose
 *     ScsBridgeSessionEntry.isomorphicExpanseName matches. Used by the IsomorphicExpanse
 *     Component SubPage (A-6 HCD) to scope the session list to the
 *     active Suite 8 by Name.
 *   - General Manager (ScsBridgeSessionManagement) = General-with-filter-chip.
 *     Gains activeIsomorphicExpanseFilter ref + GMSF pills — the FULL session list,
 *     narrowable to a Suite 8 name by the user. Both Demometers draw a
 *     Diameter through session identity (PFGD: Pre-Filtered-General-Diameter).
 *
 * Architecture (mirrors IsomorphicExpanseOnDemand IUPA pattern):
 *   - IUPA Island: own ClientMuxiumDeck muxium per component mount.
 *   - DECK K Tier-2 reach: d.client.d.isomorphicExpanse.k.isomorphicExpanses.select() (own Record)
 *     d.client.d.scsBridge.k.sessionsList.select() for the session list.
 *   - Fallback path: getGlobalScsBridgeController().sessionsList.value is used
 *     for the session list because the scsBridge concept's sessionsList is
 *     broadcast-relay state; the controller shallowRef is the proven reactive
 *     surface in this codebase (precedent: IsomorphicExpanseOnDemand.vue:104).
 *   - The isomorphicExpanseName prop is the NDEP (literal directory entry name) that keys
 *     into isomorphicExpanses Record and gates the session filter.
 *
 * Display: thin session-row list (id-label · spawnedAt · status).
 * No sort controls, no expand drawer — those live in the General Manager.
 * A "No sessions" empty state is shown when no sessions match the filter
 * (isomorphicExpanseName absent from all sessionsList entries → expected before A-3 SAPR
 * populates the field at spawn).
 *
 * Citation: MASTER-DIAMOND-ISOMORPHICEXPANSE-CONCEPT-ASPIRANT.md §2 Band A-5 PFGD
 * Citation: ScsBridgeSessionManagement.vue activeScpFilter pattern (SCFC)
 * Citation: IsomorphicExpanseOnDemand.vue (IUPA + controller sessionsList access)
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../../client/client.muxonomy';
import { createIsomorphicExpanseClientConcept } from '../../isomorphicExpanse.concept.client';
import { isomorphicExpanseMuxonomic } from '../../isomorphicExpanse.muxonomy';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';

// ============================================================
// PROPS
// ============================================================

interface Props {
  isomorphicExpanseName: string;
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
    [{ concept: createIsomorphicExpanseClientConcept(), muxonomy: isomorphicExpanseMuxonomic }],
    { title: 'IsomorphicExpanseSessionList', logging: false, storeDialog: false },
  );

  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'isomorphicExpanseSessionListSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          () => {
            // IsomorphicExpanseSessionList is read-only with respect to isomorphicExpanse state.
            // The session list is read from the controller shallowRef (reactive
            // surface proven by IsomorphicExpanseOnDemand precedent). No local dispatch needed.
          },
          { selectors: [d__.client.d.isomorphicExpanse.k.isomorphicExpanses] },
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
// SESSION LIST — pre-filtered to isomorphicExpanseName prop
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const allSessions = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// PFGD pre-filter: only sessions whose isomorphicExpanseName matches the prop.
// This is the structural Diameter — isomorphicExpanseName prop IS the filter predicate.
const filteredSessions = computed<ScsBridgeSessionEntry[]>(() =>
  allSessions.value.filter((s) => s.isomorphicExpanseName === props.isomorphicExpanseName),
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
  <div class="isomorphicExpanse-session-list">
    <header class="isomorphicExpanse-session-list-header">
      <h3 class="hifi-heading">Sessions for {{ isomorphicExpanseName }}</h3>
      <p class="isomorphicExpanse-session-list-subtitle">
        {{ filteredSessions.length }} session{{ filteredSessions.length !== 1 ? 's' : '' }}
        · pre-filtered to this Suite 8
      </p>
    </header>

    <div v-if="filteredSessions.length === 0" class="isomorphicExpanse-session-list-empty">
      <p>No sessions for Suite 8 "{{ isomorphicExpanseName }}" · spawn a session via the Spawn control above</p>
    </div>

    <ul v-else class="isomorphicExpanse-session-list-rows" role="list">
      <li
        v-for="session in filteredSessions"
        :key="session.id"
        class="isomorphicExpanse-session-row"
        :class="[`isomorphicExpanse-session-row-${session.status}`]"
      >
        <span class="isomorphicExpanse-session-cell isomorphicExpanse-session-cell-id">
          {{ session.scsLabel?.trim() || session.displayName?.trim() || shortId(session.id) }}
        </span>
        <span class="isomorphicExpanse-session-cell isomorphicExpanse-session-cell-time">
          {{ formatTime(session.spawnedAt) }}
        </span>
        <span class="isomorphicExpanse-session-cell">
          <span :class="['session-status-badge', `session-status-badge-${session.status}`]">
            {{ session.status.toUpperCase() }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
