<script setup lang="ts">
/**
 * Suite8OnDemand — On-Demand Suite8 Spawn + First Message (ODSS · Band A-4)
 *
 * MOCK-UP BOUNDARY: This component spawns a General Agent session (the same
 * default-testing path scsBridge uses). It is NOT a real Suite-8-specific
 * agent. Cadmium (Macro C) replaces the General Agent with the real one by
 * supplying a Suite8-specific MCP session endpoint (SAPR · A-3 plumbing).
 *
 * Invoke path (mirrors scsBridge MCP-tool-bindings-to-UI):
 *   1. User selects a Suite 8 from the `suite8s` Record (DECK K · Tier 1).
 *   2. User types a first message; clicks "Spawn + Send".
 *   3. controller.triggerSpawnSession(undefined) → setPendingSpawnScpName(null)
 *      → CMIA-Spawn principle → MCP scp_launch_new_session (General Agent).
 *   4. Component watches sessionsList for a new row (DSAB FBB relay arrival).
 *   5. On arrival, controller.triggerSendMessage(newSessionId, firstMessage)
 *      → MCP send_message (FKIS path).
 *
 * SAPR NOTE (A-3, not yet built): when A-3 SAPR lands, pass the selected
 * Suite8Entry.name as the scpName arg to triggerSpawnSession so the bridge
 * calls setSessionSuite8Name before spawn, routing Instance.md via
 * appendSystemPromptFile. Until then scpName=undefined → null → Template SCP
 * default (General Agent).
 *
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §2 Band A-4 ODSS
 * Citation: scsBridgeInvokeSessionSpawn.principle.client.ts (CMIA-Spawn)
 * Citation: scsBridgeInvokeSessionChat.principle.client.ts (CBSE)
 * Citation: scsBridgeController.ts (triggerSpawnSession · triggerSendMessage)
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern"
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../../client/client.muxonomy';
import type { Suite8Entry } from '../../suite8.type';
import { createSuite8ClientConcept } from '../../suite8.concept.client';
import { suite8Muxonomic } from '../../suite8.muxonomy';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
// C1-D2 · SBST · the Suite 8 spawn lane uses isSpawningSuite8 (independent SIGR guard).
import { isSpawningSuite8 } from '../../../scsBridge/principles/scsBridgeInvokeSessionSpawn.principle.client';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';
import ScsTextarea from '../../../vue/components/ScsTextarea.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

// ============================================================
// MUXIUM SETUP (IUPA · per-component island)
// ============================================================

const suite8sMap = ref<Record<string, Suite8Entry>>({});
let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic }],
    { title: 'Suite8OnDemand', logging: false, storeDialog: false },
  );

  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8OnDemandSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            suite8sMap.value = d.client.d.suite8.k.suite8s.select();
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
// UI STATE
// ============================================================

const selectedSuite8Name = ref<string>('');
const firstMessage = ref<string>('');

// ODSS phase: idle → spawning → waiting → sending → done | error
type OdssPhase = 'idle' | 'spawning' | 'waiting' | 'sending' | 'done' | 'error';
const phase = ref<OdssPhase>('idle');
const errorMsg = ref<string>('');
const spawnedSessionId = ref<string | null>(null);

// Snapshot the session count at the moment Spawn fires so arrival detection
// is precise (new row = count growth since snapshot).
const sessionCountAtSpawn = ref<number>(0);

// ============================================================
// CONTROLLER + SESSION LIST
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const sessionsList = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

const bridgeReady = computed<boolean>(
  () => (controller.value?.connectionEstablished.value ?? false) === true,
);

// ============================================================
// DERIVED UI
// ============================================================

const suite8Entries = computed<Suite8Entry[]>(() =>
  Object.values(suite8sMap.value),
);

const hasEntries = computed<boolean>(() => suite8Entries.value.length > 0);
// SB-DS6 · Suite 8 entries mapped to the ScsDropdown {value,label} shape (value === label === name).
const suite8SelectOptions = computed(() =>
  suite8Entries.value.map((entry) => ({ value: entry.name, label: entry.name })),
);

const canFire = computed<boolean>(
  () =>
    bridgeReady.value &&
    hasEntries.value &&
    selectedSuite8Name.value !== '' &&
    firstMessage.value.trim() !== '' &&
    !isSpawningSuite8.value &&
    phase.value === 'idle',
);

const statusText = computed<string>(() => {
  switch (phase.value) {
    case 'spawning':  return 'Spawning Suite 8 session...';
    case 'waiting':   return 'Waiting for session row (DSAB relay)...';
    case 'sending':   return 'Delivering first message...';
    case 'done':      return `Sent to session ${spawnedSessionId.value?.slice(-8) ?? ''}`;
    case 'error':     return `Error: ${errorMsg.value}`;
    default:          return bridgeReady.value ? 'Ready' : 'Bridge not connected';
  }
});

// ============================================================
// DSAB SESSION ARRIVAL WATCH
// Watches sessionsList for a new row that appeared after Spawn fired.
// When the row arrives, fires the first message (FKIS send_message path).
// ============================================================

watch(
  () => sessionsList.value.length,
  async (newLen) => {
    if (phase.value !== 'waiting') return;
    if (newLen <= sessionCountAtSpawn.value) return;

    // New row arrived — find the most-recently-spawned session.
    const newest = [...sessionsList.value].sort(
      (a, b) => (b.spawnedAt ?? 0) > (a.spawnedAt ?? 0) ? 1 : -1,
    )[0];

    if (!newest) {
      phase.value = 'error';
      errorMsg.value = 'Session row arrived but could not be found in list';
      return;
    }

    spawnedSessionId.value = newest.id;
    phase.value = 'sending';

    console.log(
      '[Suite8OnDemand ODSS] Session arrived · id=', newest.id,
      '· firing first message · length=', firstMessage.value.trim().length,
    );

    const result = await controller.value?.triggerSendMessage(
      newest.id,
      firstMessage.value.trim(),
    );

    if (result?.ok) {
      phase.value = 'done';
      console.log('[Suite8OnDemand ODSS] First message delivered · sessionId=', newest.id);
    } else {
      phase.value = 'error';
      errorMsg.value = result?.error ?? 'triggerSendMessage returned non-ok';
      console.error('[Suite8OnDemand ODSS] First message failed · error=', errorMsg.value);
    }
  },
);

// ============================================================
// SPAWN + SEND HANDLER
// ============================================================

function handleSpawnAndSend(): void {
  if (!canFire.value) return;

  const ctrl = controller.value;
  if (!ctrl) {
    phase.value = 'error';
    errorMsg.value = 'No controller available';
    return;
  }

  console.log(
    '[Suite8OnDemand ODSS] Spawn+Send · suite8Name=', selectedSuite8Name.value,
    '· messageLength=', firstMessage.value.trim().length,
    '· SBST: identified Suite 8 spawn (setSessionSuite8Name BEFORE spawn)',
  );

  sessionCountAtSpawn.value = sessionsList.value.length;
  phase.value = 'spawning';

  // C1-D2 · SBST · identified Suite 8 spawn. The bridge tool sets entry.suite8Name
  // (NDEP) BEFORE spawn so cli-handler composes Base→Dock→Instance.md prompt.
  // C373 · triggerSpawnS8Session (rename-proof alias) — survives the suite8:page domain-token rewrite.
  ctrl.triggerSpawnS8Session(selectedSuite8Name.value);

  // SIGR auto-clear (mirrors ScsBridgeSessionManagement.vue:244 watch)
  // transitions phase → waiting once SIGR clears (isSpawningSuite8 goes false).
  const sigRWatcher = watch(
    () => isSpawningSuite8.value,
    (nowSpawning) => {
      if (!nowSpawning && phase.value === 'spawning') {
        phase.value = 'waiting';
        console.log('[Suite8OnDemand ODSS] Spawn ack received · waiting for DSAB row');
        sigRWatcher(); // self-clean
      }
    },
  );
}

function reset(): void {
  phase.value = 'idle';
  errorMsg.value = '';
  spawnedSessionId.value = null;
  sessionCountAtSpawn.value = 0;
}
</script>

<template>
  <div class="hifi-pane-base hifi-pane-blue odss-root">
    <header class="odss-header">
      <h2 class="odss-title">On-Demand Suite 8</h2>
      <p class="odss-subtitle">
        Spawn a General Agent session and deliver a persisting first message.
      </p>
    </header>

    <!-- Suite 8 Selector -->
    <div class="odss-field">
      <label class="odss-label">Suite 8</label>
      <div v-if="!hasEntries" class="odss-empty-notice">
        No Suite 8 entries registered — suite8s Record is empty (A-2 MPRF populates at boot).
      </div>
      <ScsDropdown
        v-else
        class="odss-select"
        placeholder="— select a Suite 8 —"
        :disabled="phase !== 'idle'"
        :options="suite8SelectOptions"
        v-model="selectedSuite8Name"
      />
    </div>

    <!-- First Message -->
    <div class="odss-field">
      <label class="odss-label" for="odss-first-message">First Message</label>
      <ScsTextarea
        id="odss-first-message"
        class="odss-textarea"
        placeholder="Type the persisting first message to deliver after spawn..."
        :disabled="phase !== 'idle'"
        v-model="firstMessage"
        rows="4"
      />
    </div>

    <!-- Action Row -->
    <div class="odss-action-row">
      <button
        class="hifi-btn hifi-btn-blue odss-spawn-btn"
        :disabled="!canFire"
        @click="handleSpawnAndSend"
      >
        <span v-if="phase === 'idle'">Spawn + Send</span>
        <span v-else-if="phase === 'spawning'">Spawning...</span>
        <span v-else-if="phase === 'waiting'">Waiting...</span>
        <span v-else-if="phase === 'sending'">Sending...</span>
        <span v-else-if="phase === 'done'">Done</span>
        <span v-else>Error</span>
      </button>

      <button
        v-if="phase === 'done' || phase === 'error'"
        class="hifi-btn hifi-btn-base odss-reset-btn"
        @click="reset"
      >
        Reset
      </button>
    </div>

    <!-- Status Bar -->
    <div
      class="odss-status"
      :class="{
        'odss-status-active': phase === 'spawning' || phase === 'waiting' || phase === 'sending',
        'odss-status-done': phase === 'done',
        'odss-status-error': phase === 'error',
      }"
    >
      {{ statusText }}
    </div>

    <!-- Session Result -->
    <div v-if="spawnedSessionId" class="odss-result hifi-pane-base">
      <span class="odss-result-label">Session</span>
      <code class="odss-result-id">{{ spawnedSessionId }}</code>
    </div>
  </div>
</template>

<style scoped>
.odss-root {
  padding: 1.25rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.odss-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.75rem;
}

.odss-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.25rem;
  color: #93c5fd;
}

.odss-subtitle {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
}

.odss-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.odss-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #93c5fd;
}

.odss-empty-notice {
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
}

.odss-textarea {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(147, 197, 253, 0.25);
  border-radius: 4px;
  color: #e5e5e5;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  outline: none;
  resize: vertical;
  font-family: inherit;
}

.odss-textarea:focus {
  border-color: rgba(147, 197, 253, 0.6);
}

.odss-textarea:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* SB-DS6 · ScsDropdown replaces the native Suite 8 <select>; the trigger carries this class via
   $attrs and owns its own chrome. Full-width to match the textarea + cobalt open-state accent.
   ScsDropdown's own :disabled trigger styling covers the phase-gated disabled state. */
.odss-select {
  display: block;
  width: 100%;
  --dropdown-accent: rgba(147, 197, 253, 0.6);
}

.odss-action-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.odss-spawn-btn {
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.odss-reset-btn {
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
}

.odss-status {
  font-size: 0.8125rem;
  color: #9ca3af;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.odss-status-active {
  color: #93c5fd;
  border-color: rgba(147, 197, 253, 0.2);
  background: rgba(147, 197, 253, 0.04);
}

.odss-status-done {
  color: #6ee7b7;
  border-color: rgba(110, 231, 183, 0.2);
  background: rgba(110, 231, 183, 0.04);
}

.odss-status-error {
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.2);
  background: rgba(252, 165, 165, 0.04);
}

.odss-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8125rem;
}

.odss-result-label {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.odss-result-id {
  color: #c4b5fd;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  word-break: break-all;
}
</style>
