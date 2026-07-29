<script setup lang="ts">
/**
 * ShatteriteTomeSetup (STSC) — generalizable Suite 8 page Setup component.
 *
 * Takes an SFSD (Setup-Field-Schema-Definition · a JSON of fields), renders the
 * field inputs (SetupFormRenderer), and on submit FEEDS each field's interpolated
 * promptTemplate to the page's ANCHOR instance until depleted — async-chained /
 * staggered like the FKIS messaging timed means (one message per field, 500ms
 * apart, AWAITED in sequence · NOT Promise.all). Importable by any Suite 8 page.
 *
 * Anchor resolution (PAOLR · reused from CadmiumLanding §C1-D4):
 *   the page's Anchor = the alive session whose `suite8Name === props.suite8Name`
 *   AND `isAnchor === true` (status 'launched'). Read live from the global
 *   scsBridge controller's `sessionsList`. NEVER spawns or dissipates — the STSC
 *   only feeds an existing Anchor (the Anchor is owned by the page's PAOLR plan).
 *
 * Send mechanism (reused · NOT invented):
 *   controller.triggerSendMessage(sessionId, text) — the live FKIS send-message
 *   path (MCP send_message · returns Promise<{ ok, error? }>). This is the
 *   setup-field text path the WGB names. We do NOT call triggerDeliverVermillion
 *   here (that is the VS/VSDT spawned-worker Vermillion lane, not setup-field text).
 *
 * DFSR: the controller send is an EXTERNAL dispatch (direct /mcp fetch); it is
 *   invoked from a normal async event handler (handleSubmit), NOT synchronously
 *   inside a Stratimux plan stage — so no re-entrant wind-up hazard applies. The
 *   STSC holds NO Muxium and runs NO plan.
 *
 * Citation: EPOCH-DIAMOND-SUITE8-SETUP-RESEARCH.md §2 Macro 1 SU
 * Citation: EPOCH-SR-S1-RED-CURATION.md Macro 1 (SU) + Macro 6 FKIS stagger
 * Citation: CadmiumLanding.vue §C1-D4 PAOLR (anchor-find) + §PPOL-WUD (FKIS defer)
 * Citation: scsBridgeController.ts triggerSendMessage (FKIS live-message path)
 * Citation: Suite8OnDemand.vue (triggerSendMessage await + controller computed)
 */
import { ref, computed } from 'vue';
import type { SetupFieldSchema, SetupFieldDeliveryResult } from '../../setupFieldSchema.type';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import SetupFormRenderer from './SetupFormRenderer.vue';

interface Props {
  // The schema rendered + delivered (the JSON of fields).
  sfsd: SetupFieldSchema;
  // The page's Suite 8 designation — used to find its Anchor in sessionsList.
  suite8Name: string;
  // Optional title shown in the Setup zone header.
  title?: string;
  // Optional one-line usage overview shown under the header.
  overview?: string;
  // Inter-field stagger in ms (FKIS timing). Default 500 (CadmiumLanding precedent).
  staggerMs?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  // Fires once the feed-until-depleted pass completes (per-field results).
  (e: 'setup-delivered', results: SetupFieldDeliveryResult[]): void;
}>();

// ============================================================
// FIELD VALUES (seeded from SFSD defaults · component-owned local state)
// ============================================================

const fieldValues = ref<Record<string, string>>(seedDefaults());

function seedDefaults(): Record<string, string> {
  const seed: Record<string, string> = {};
  for (const field of props.sfsd) {
    // checkbox seeds to 'false' when no default; others to '' for an empty input.
    seed[field.name] =
      field.default ?? (field.type === 'checkbox' ? 'false' : '');
  }
  return seed;
}

// ============================================================
// CONTROLLER + ANCHOR RESOLUTION (PAOLR · reused)
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const sessionsList = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// PAOLR · the page's Anchor for this suite8Name. Keys on isAnchor (authoritative
// page-bound session), NOT "any alive suite8 match" — mirror CadmiumLanding.
const anchor = computed<ScsBridgeSessionEntry | undefined>(() =>
  sessionsList.value.find(
    (s) => s.suite8Name === props.suite8Name && s.isAnchor === true,
  ),
);

// The Anchor must be ALIVE ('launched') to receive setup-field messages.
const anchorAlive = computed<boolean>(
  () => anchor.value?.status === 'launched',
);

// ============================================================
// SUBMIT PHASE (feed-until-depleted)
// ============================================================

type SetupPhase = 'idle' | 'sending' | 'done' | 'error';
const phase = ref<SetupPhase>('idle');
const errorMsg = ref<string>('');
// 1-based index of the field currently being delivered (0 when idle).
const currentFieldIndex = ref<number>(0);
const deliveredResults = ref<SetupFieldDeliveryResult[]>([]);

const totalFields = computed<number>(() => props.sfsd.length);

const canSubmit = computed<boolean>(
  () =>
    phase.value !== 'sending' &&
    anchorAlive.value &&
    totalFields.value > 0,
);

const statusText = computed<string>(() => {
  switch (phase.value) {
    case 'sending':
      return `Delivering field ${currentFieldIndex.value} of ${totalFields.value} to Anchor...`;
    case 'done':
      return `Setup delivered · ${deliveredResults.value.filter((r) => r.ok).length}/${totalFields.value} fields sent to Anchor`;
    case 'error':
      return `Error: ${errorMsg.value}`;
    default:
      return anchorAlive.value
        ? `Ready · Anchor alive (${anchor.value?.id.slice(-8) ?? ''})`
        : 'Waiting for an alive Anchor session...';
  }
});

// Interpolate the field's promptTemplate with its entered value.
// `{{value}}` → entered value; if the template carries no token, append the value.
function interpolate(promptTemplate: string, value: string): string {
  if (promptTemplate.includes('{{value}}')) {
    return promptTemplate.split('{{value}}').join(value);
  }
  // No token — deliver the template followed by the value (still depletes the field).
  return value ? `${promptTemplate} ${value}` : promptTemplate;
}

// FKIS stagger: resolve after `ms` (one macrotask gap between field sends).
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Feed each field to the Anchor, in order, AWAITED + staggered, until depleted.
// NOT Promise.all — sequential so the Anchor receives messages in schema order
// without keystroke contention (FSBA-style blocking async-chain · WGB §Macro 6).
async function handleSubmit(): Promise<void> {
  if (!canSubmit.value) return;

  const ctrl = controller.value;
  const target = anchor.value;
  if (!ctrl || !target) {
    phase.value = 'error';
    errorMsg.value = 'No alive Anchor session for this Suite 8';
    return;
  }

  phase.value = 'sending';
  errorMsg.value = '';
  deliveredResults.value = [];
  const results: SetupFieldDeliveryResult[] = [];

  console.log(
    '[ShatteriteTomeSetup STSC] handleSubmit · suite8Name=', props.suite8Name,
    '· anchorId=', target.id, '· fieldCount=', totalFields.value,
    '· staggerMs=', props.staggerMs ?? 500,
  );

  for (let i = 0; i < props.sfsd.length; i++) {
    const field = props.sfsd[i];
    currentFieldIndex.value = i + 1;
    const value = fieldValues.value[field.name] ?? '';
    const message = interpolate(field.promptTemplate, value);

    console.log(
      '[ShatteriteTomeSetup STSC] delivering field', currentFieldIndex.value,
      'of', totalFields.value, '· name=', field.name, '· messageLength=', message.length,
    );

    const result = await ctrl.triggerSendMessage(target.id, message);
    results.push({
      name: field.name,
      message,
      ok: result?.ok ?? false,
      error: result?.error,
    });

    if (!result?.ok) {
      console.error(
        '[ShatteriteTomeSetup STSC] field delivery failed · name=', field.name,
        '· error=', result?.error,
      );
    }

    // FKIS stagger between fields (skip after the last to avoid a trailing wait).
    if (i < props.sfsd.length - 1) {
      await wait(props.staggerMs ?? 500);
    }
  }

  deliveredResults.value = results;
  const anyFailed = results.some((r) => !r.ok);
  phase.value = anyFailed ? 'error' : 'done';
  if (anyFailed) {
    errorMsg.value = `${results.filter((r) => !r.ok).length} field(s) failed delivery`;
  }
  currentFieldIndex.value = 0;

  emit('setup-delivered', results);
  console.log('[ShatteriteTomeSetup STSC] feed-until-depleted complete · phase=', phase.value);
}
</script>

<template>
  <section class="shatterite-tome-setup">
    <header class="setup-header">
      <h2 class="setup-title hifi-heading">{{ title ?? 'Setup' }}</h2>
      <p v-if="overview" class="setup-overview">{{ overview }}</p>
    </header>

    <SetupFormRenderer
      v-model="fieldValues"
      :fields="sfsd"
      :disabled="phase === 'sending'"
    />

    <div class="setup-actions">
      <button
        class="setup-submit-btn"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        {{ phase === 'sending' ? 'Delivering...' : 'Send to Anchor' }}
      </button>
      <span
        :class="['setup-status', `setup-status-${phase}`]"
      >{{ statusText }}</span>
    </div>

    <!-- Progress bar (field i of N) during the feed-until-depleted pass -->
    <div v-if="phase === 'sending'" class="setup-progress">
      <div
        class="setup-progress-fill"
        :style="{ width: `${(currentFieldIndex / totalFields) * 100}%` }"
      ></div>
    </div>
  </section>
</template>

<style scoped>
.shatterite-tome-setup {
  background: #1a1208;
  border-top: 2px solid #92400e;
  border-right: 2px solid #92400e;
  border-bottom: 2px solid #fb923c;
  border-left: 2px solid #fb923c;
  box-shadow: -3px 3px 0 rgba(146, 64, 14, 0.4);
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setup-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setup-title {
  color: #f97316;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.setup-overview {
  color: #d6d3d1;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.setup-actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-wrap: wrap;
}

.setup-submit-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f97316;
  color: #1a0f08;
  border-top: 2px solid #c2410c;
  border-right: 2px solid #c2410c;
  border-bottom: 2px solid #fdba74;
  border-left: 2px solid #fdba74;
  box-shadow: -2px 2px 6px rgba(194, 65, 12, 0.4);
  text-shadow: 0.5px 0.5px 0 rgba(30, 144, 200, 0.7);
}

.setup-submit-btn:hover:not(:disabled) {
  background: #fb923c;
  box-shadow: -1px 1px 4px rgba(194, 65, 12, 0.4);
}

.setup-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setup-status {
  font-size: 0.75rem;
  font-family: 'SF Mono', Monaco, monospace;
  color: #a8a29e;
}

.setup-status-sending {
  color: #fbbf24;
}

.setup-status-done {
  color: #4ade80;
}

.setup-status-error {
  color: #ef4444;
}

.setup-progress {
  height: 4px;
  background: #0f0a05;
  border-radius: 2px;
  overflow: hidden;
}

.setup-progress-fill {
  height: 100%;
  background: #f97316;
  transition: width 0.2s ease;
}
</style>
