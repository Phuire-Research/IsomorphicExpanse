<script setup lang="ts">
/**
 * ScsBridgeInstallation.vue · MD-B · THE INSTALLATION SUB-PAGE
 *
 * Install an SCP into this workspace from the bundled template, a local PATH,
 * anor a git URL — then see the installed/active roster and Boot anor Focus any
 * entry. Every action rides the SCP-server proxy routes (vue.principle.ts):
 * the page talks to THE BRIDGE only (the R3 law); discovery rides the SCP's
 * own sovereign bridge.json (MD-A), which the bridge keeps current.
 *
 * Roster semantics: installedScps = the SCPs.json registry broadcast ·
 * boundScps = the live spawnsByScp projection (currently running). Install is
 * ACK-only — the pipeline runs async on the bridge; the roster reflects the
 * registration on the next bridge.json broadcast (the refresh poll picks it up).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
// D4+D5 · THE SCP MANAGEMENT PAGE — the manifest install/assemble/security zones compose
// AROUND the existing designation/source form + roster (both stay, evolved).
import ScpSecurityNotice from './ScpSecurityNotice.vue';
import ScpManifestIntake from './ScpManifestIntake.vue';
import ScpManifestAssemble from './ScpManifestAssemble.vue';
import type { BridgeJsonShape } from '../../scsBridge.type';

// D-UP7 · THE UPDATE INDICATOR — the landing threads bridgeJson so this Bridge surface
// renders installed-vs-latest from the bridge's own npm registry check (no fetch of its
// own; the bridge.json relay is the truth). Null until the first relay lands.
const props = defineProps<{ bridgeJson?: BridgeJsonShape | null }>();
const installedVersion = computed<string>(() => props.bridgeJson?.bridgeVersion ?? '—');
const npmLatestVersion = computed<string | null>(() => props.bridgeJson?.npmLatestVersion ?? null);
const updateAvailable = computed<boolean>(() => props.bridgeJson?.updateAvailable === true);

type BoundScpEntry = { port: number; status: string; browserUrl: string };
type InstalledScpEntry = { anchoredAt?: string };
type RosterShape = {
  bridgeUp: boolean;
  installedScps: string[];
  boundScps: Record<string, BoundScpEntry>;
  // The registry MAY surface per-SCP anchor metadata; read defensively (absent = no chip).
  installedMeta?: Record<string, InstalledScpEntry>;
  writtenAt: number;
};

// D4+D5 · ZONE 1 gate — the security notice must be viewed before any install fires.
const noticeViewed = ref(false);
function onNoticeViewed(): void {
  noticeViewed.value = true;
}

const roster = ref<RosterShape>({ bridgeUp: false, installedScps: [], boundScps: {}, writtenAt: 0 });
const rosterLoaded = ref(false);

// The row-action status surface (Boot/Focus feedback · the C842 Direct-Install prune kept it)
const statusLine = ref('');
const statusKind = ref<'idle' | 'ok' | 'error'>('idle');

// Per-row in-flight guards (Boot/Focus)
const rowBusy = ref<Record<string, boolean>>({});

let pollTimer: ReturnType<typeof setInterval> | null = null;

// ══ ZONE 3 · CREATE A NEW SCP (FB-2 · the Freshest-Template workflow) ══
// The Reference Design is the C839 staged rail (ScpManifestIntake) — the SAME poll route,
// the SAME stage states, reused verbatim. One field, one press: the bridge refreshes the
// template to the freshest release (the retained-clone seam) and births the SCP from it.
type CreateStage = 'idle' | 'cloning' | 'installing' | 'ready' | 'failed' | 'timeout';
const createDesignation = ref('');
const createValid = computed(() => /^[A-Z][A-Za-z0-9]*$/.test(createDesignation.value));
const createStage = ref<CreateStage>('idle');
const createStageDetail = ref('');
const createFailReason = ref('');
const CREATE_POLL_MS = 1200;
const CREATE_POLL_MAX = 500;
let createPollTimer: ReturnType<typeof setInterval> | null = null;
let createPollCount = 0;

function stopCreatePolling(): void {
  if (createPollTimer !== null) { clearInterval(createPollTimer); createPollTimer = null; }
}

function beginCreatePolling(target: string): void {
  stopCreatePolling();
  createPollCount = 0;
  createStage.value = 'cloning';
  createStageDetail.value = '';
  createFailReason.value = '';
  createPollTimer = setInterval(async () => {
    createPollCount += 1;
    if (createPollCount > CREATE_POLL_MAX) {
      createStage.value = 'timeout';
      stopCreatePolling();
      return;
    }
    try {
      const r = await fetch(`/bridge-install-progress/${encodeURIComponent(target)}`);
      if (!r.ok) return;
      const p = (await r.json()) as { stage?: string; detail?: string; reason?: string } | null;
      if (!p || typeof p.stage !== 'string') return;
      if (p.stage === 'cloning' || p.stage === 'installing') {
        createStage.value = p.stage;
        createStageDetail.value = p.detail ?? '';
      } else if (p.stage === 'ready') {
        createStage.value = 'ready';
        createStageDetail.value = p.detail ?? '';
        stopCreatePolling();
        void refreshRoster();
      } else if (p.stage === 'failed') {
        createStage.value = 'failed';
        createFailReason.value = p.reason ?? 'install failed (no reason reported)';
        stopCreatePolling();
      }
    } catch { /* transient — the next tick retries */ }
  }, CREATE_POLL_MS);
}

function createNotchState(notch: 'clone' | 'install' | 'ready'): 'idle' | 'active' | 'done' {
  const s = createStage.value;
  if (notch === 'clone') {
    return s === 'cloning' ? 'active' : s === 'installing' || s === 'ready' ? 'done' : 'idle';
  }
  if (notch === 'install') {
    return s === 'installing' ? 'active' : s === 'ready' ? 'done' : 'idle';
  }
  return s === 'ready' ? 'done' : 'idle';
}

async function handleCreate(): Promise<void> {
  if (!createValid.value || createStage.value === 'cloning' || createStage.value === 'installing') return;
  const target = createDesignation.value;
  try {
    const res = await fetch('/bridge-create-scp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designation: target }),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || body?.ok === false) {
      createStage.value = 'failed';
      createFailReason.value = body?.error ?? `create request failed (${res.status})`;
      return;
    }
    beginCreatePolling(target);
  } catch (err) {
    createStage.value = 'failed';
    createFailReason.value = String(err);
  }
}

async function refreshRoster(): Promise<void> {
  try {
    const res = await fetch('/bridge-roster');
    roster.value = (await res.json()) as RosterShape;
  } catch {
    roster.value = { bridgeUp: false, installedScps: [], boundScps: {}, writtenAt: 0 };
  }
  rosterLoaded.value = true;
}

onMounted(() => {
  void refreshRoster();
  // The registration lands async on the bridge — a light poll keeps the roster honest.
  pollTimer = setInterval(() => void refreshRoster(), 5000);
});
onBeforeUnmount(() => {
  if (pollTimer !== null) clearInterval(pollTimer);
  stopCreatePolling();
});

const rosterRows = computed(() => {
  const bound = roster.value.boundScps ?? {};
  const meta = roster.value.installedMeta ?? {};
  const names = new Set<string>([...(roster.value.installedScps ?? []), ...Object.keys(bound)]);
  return [...names].sort().map((name) => ({
    name,
    active: name in bound,
    browserUrl: bound[name]?.browserUrl ?? '',
    port: bound[name]?.port ?? null,
    // Defensive: the registry may surface anchoredAt; absent field = no chip (graceful).
    anchoredAt: meta[name]?.anchoredAt,
  }));
});

async function handleRowAction(name: string, route: '/bridge-boot' | '/bridge-focus'): Promise<void> {
  if (rowBusy.value[name]) return;
  rowBusy.value = { ...rowBusy.value, [name]: true };
  try {
    const res = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scpName: name }),
    });
    const out = (await res.json()) as { ok: boolean; error?: string };
    statusKind.value = out.ok ? 'ok' : 'error';
    statusLine.value = out.ok
      ? `${route === '/bridge-boot' ? 'Boot' : 'Focus'} of ${name} accepted.`
      : out.error ?? 'Action rejected.';
    void refreshRoster();
  } catch (err) {
    statusKind.value = 'error';
    statusLine.value = `Action failed: ${String(err)}`;
  } finally {
    const next = { ...rowBusy.value };
    delete next[name];
    rowBusy.value = next;
  }
}
</script>

<template>
  <div class="scs-install-page">
    <header class="scs-install-header">
      <h1 class="hifi-heading">SCP Management</h1>
      <p class="scs-install-subtitle">
        Install, configure, and boot your SCPs · remote installs are pinned to a verified commit anchor ·
        generate anor intake a manifest to begin
      </p>
      <p v-if="rosterLoaded && !roster.bridgeUp" class="scs-install-bridge-down">
        The SCS-Bridge is not discovered — its per-SCP bridge.json is absent anor stale. Launch
        <code>scs</code> in the workspace to bring the bridge up.
      </p>
    </header>

    <!-- D-UP7 · THE BRIDGE VERSION PANE — installed vs the latest npm publish (the bridge's
         own registry check, relayed through bridge.json; this page fetches nothing itself). -->
    <section class="scs-install-version hifi-pane-base" :class="{ 'scs-install-version-update': updateAvailable }">
      <div class="scs-install-version-row">
        <span class="scs-install-version-label hifi-mono">SCS-BRIDGE</span>
        <span class="scs-install-version-value hifi-mono">installed v{{ installedVersion }}</span>
        <span class="scs-install-version-sep">·</span>
        <span class="scs-install-version-value hifi-mono">
          npm latest {{ npmLatestVersion ? 'v' + npmLatestVersion : 'checking…' }}
        </span>
        <span v-if="updateAvailable" class="scs-install-version-pill hifi-mono">UPDATE AVAILABLE</span>
        <span v-else-if="npmLatestVersion" class="scs-install-version-current hifi-mono">CURRENT</span>
      </div>
      <p v-if="updateAvailable" class="scs-install-version-how">
        Update from the terminal, then relaunch the bridge:
        <code>npm install -g scs-bridge</code> · your apps and their work are untouched — each
        updates on its own through its GitM Update page when you choose.
      </p>
    </section>

    <!-- ZONE 1 · THE SECURITY NOTICE (gates every install button via @viewed) -->
    <ScpSecurityNotice @viewed="onNoticeViewed" />

    <!-- ZONE 2 · INSTALL FROM MANIFEST (commit-pinned) -->
    <ScpManifestIntake :notice-viewed="noticeViewed" />

    <!-- ZONE 3 · CREATE A NEW SCP (FB-2 · the Freshest-Template workflow · the C839
         staged rail as the Reference Design). The bridge refreshes the template to the
         freshest release before the birth — never a stale vintage. -->
    <section class="scs-create hifi-pane-green">
      <h3 class="hifi-heading">Create a New SCP</h3>
      <p class="scs-create-lede">
        Name it, and it is born from the <span class="hifi-hl-green">freshest template</span> —
        the bridge refreshes to the latest release before the install; your name stands from
        the first commit.
      </p>
      <div class="scs-create-row">
        <input
          v-model="createDesignation"
          class="scs-create-input hifi-mono"
          type="text"
          placeholder="PascalCase · e.g. MyStudio"
          spellcheck="false"
          @keyup.enter="handleCreate"
        />
        <button
          class="hifi-btn hifi-btn-green"
          :disabled="!createValid || createStage === 'cloning' || createStage === 'installing'"
          @click="handleCreate"
        >
          {{ createStage === 'cloning' || createStage === 'installing' ? 'Creating…' : 'Create' }}
        </button>
        <span v-if="createDesignation && !createValid" class="scs-create-hint hifi-mono">PascalCase required</span>
      </div>
      <div v-if="createStage !== 'idle'" class="scs-create-rail">
        <div class="scs-create-notches hifi-mono">
          <span :class="['scs-create-notch', `scs-create-notch-${createNotchState('clone')}`]">CLONE</span>
          <span aria-hidden="true">→</span>
          <span :class="['scs-create-notch', `scs-create-notch-${createNotchState('install')}`]">INSTALL</span>
          <span aria-hidden="true">→</span>
          <span :class="['scs-create-notch', `scs-create-notch-${createNotchState('ready')}`]">READY</span>
        </div>
        <p v-if="createStage === 'ready'" class="scs-create-line scs-create-ready">
          Born current — {{ createStageDetail || 'the roster now lists it.' }}
        </p>
        <p v-else-if="createStage === 'failed'" class="scs-create-line scs-create-failed">
          Create failed — {{ createFailReason }}
        </p>
        <p v-else-if="createStage === 'timeout'" class="scs-create-line scs-create-failed">
          No progress within the polling window — check the bridge; the pipeline may still be running.
        </p>
        <p v-else-if="createStageDetail" class="scs-create-line">{{ createStageDetail }}</p>
      </div>
    </section>

    <!-- C842 · THE DIRECT INSTALL WIDGET PRUNED (the user's law: on the manifest
         Lambda's pass, the commit-locked manifest flow IS the install path — no
         un-anchored HEAD installs from the page; the TUI/MCP retain their own paths) -->
    <!-- ZONE 4 · ASSEMBLE + SHARE THIS SCP'S OWN MANIFEST -->
    <ScpManifestAssemble />

    <!-- THE ROSTER -->
    <section class="scs-install-roster hifi-pane-base">
      <div class="scs-install-roster-head">
        <h2 class="scs-install-roster-title">Registered SCPs</h2>
        <span class="scs-install-roster-count">{{ rosterRows.length }}</span>
        <button class="scs-install-refresh" type="button" @click="refreshRoster">Refresh</button>
      </div>

      <p
        v-if="statusLine"
        class="scs-install-status"
        :class="{ 'scs-install-status-ok': statusKind === 'ok', 'scs-install-status-error': statusKind === 'error' }"
      >{{ statusLine }}</p>

      <p v-if="rosterLoaded && rosterRows.length === 0" class="scs-install-empty">
        No SCPs registered yet — install one above.
      </p>

      <div v-for="row in rosterRows" :key="row.name" class="scs-install-roster-row">
        <span class="scs-install-roster-name">{{ row.name }}</span>
        <span
          class="scs-install-roster-chip"
          :class="row.active ? 'scs-install-chip-active' : 'scs-install-chip-installed'"
        >{{ row.active ? `ACTIVE · :${row.port}` : 'INSTALLED' }}</span>
        <span v-if="row.anchoredAt" class="scs-install-roster-chip scs-install-chip-anchored">ANCHORED</span>
        <span class="scs-install-roster-spacer"></span>
        <button
          v-if="!row.active"
          class="scs-install-row-btn"
          type="button"
          :disabled="!!rowBusy[row.name] || !roster.bridgeUp"
          @click="handleRowAction(row.name, '/bridge-boot')"
        >{{ rowBusy[row.name] ? 'Booting…' : 'Boot' }}</button>
        <button
          v-if="row.active"
          class="scs-install-row-btn scs-install-row-btn-focus"
          type="button"
          :disabled="!!rowBusy[row.name]"
          @click="handleRowAction(row.name, '/bridge-focus')"
        >{{ rowBusy[row.name] ? 'Focusing…' : 'Focus' }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ══ ZONE 3 · CREATE A NEW SCP (FB-2 · the C839 rail idiom) ══ */
.scs-create {
  padding: 0.9rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.scs-create-lede {
  font-size: 0.8rem;
  color: rgba(230, 226, 216, 0.62);
  margin: 0;
}
.scs-create-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.scs-create-input {
  flex: 0 1 18rem;
  min-width: 12rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(230, 226, 216, 0.2);
  border-radius: 4px;
  color: rgba(230, 226, 216, 0.9);
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
}
.scs-create-hint {
  font-size: 0.66rem;
  color: rgba(230, 140, 120, 0.85);
}
.scs-create-rail {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.scs-create-notches {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: rgba(230, 226, 216, 0.35);
}
.scs-create-notch-active {
  color: var(--hifi-green, #52a675);
}
.scs-create-notch-done {
  color: rgba(230, 226, 216, 0.85);
}
.scs-create-line {
  font-size: 0.76rem;
  color: rgba(230, 226, 216, 0.6);
  margin: 0;
}
.scs-create-ready {
  color: var(--hifi-green, #52a675);
}
.scs-create-failed {
  color: rgba(230, 120, 110, 0.9);
}
</style>

<style scoped>
.scs-install-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  max-width: 860px;
}
/* D-UP7 · THE BRIDGE VERSION PANE — installed vs npm latest; the update state gains a
   green accent border (the update circuit's register). */
.scs-install-version {
  border-radius: 8px;
  padding: 0.85rem 1.1rem;
}
.scs-install-version-update {
  border: 1px solid rgba(74, 222, 128, 0.55);
}
.scs-install-version-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}
.scs-install-version-label {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-white, #e5e7eb);
}
.scs-install-version-value {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.7));
}
.scs-install-version-sep {
  color: rgba(255, 255, 255, 0.3);
}
.scs-install-version-pill {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px dotted rgba(74, 222, 128, 0.8);
  color: rgba(74, 222, 128, 0.95);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.scs-install-version-current {
  color: rgba(147, 197, 253, 0.8);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
.scs-install-version-how {
  margin: 0.55rem 0 0;
  font-size: 0.78rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.6));
}
.scs-install-version-how code {
  color: rgba(74, 222, 128, 0.9);
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
.scs-install-header .hifi-heading {
  margin: 0 0 0.35rem;
}
.scs-install-subtitle {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
  font-size: 0.8rem;
  margin: 0;
}
.scs-install-bridge-down {
  margin: 0.6rem 0 0;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--color-maroon, #b03a48);
  color: #ffffff;
  text-shadow: var(--pewter-text-glow, 1px 1px 2px rgba(255, 255, 255, 0.45));
  font-size: 0.75rem;
}
.scs-install-roster {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
}
.scs-install-status {
  font-size: 0.72rem;
  margin: 0;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
}
.scs-install-status-ok {
  color: var(--color-viridian, #2f9e77);
}
.scs-install-status-error {
  color: var(--color-maroon, #b03a48);
}
.scs-install-roster-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.scs-install-roster-title {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow, 1px 1px 2px rgba(255, 255, 255, 0.45));
  margin: 0;
}
.scs-install-roster-count {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
  font-family: var(--font-mono, monospace);
  font-size: 0.7rem;
}
.scs-install-refresh {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
  cursor: pointer;
  font-size: 0.68rem;
  padding: 0.25rem 0.7rem;
}
.scs-install-refresh:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.35);
}
.scs-install-empty {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
  font-size: 0.72rem;
  margin: 0;
}
.scs-install-roster-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.scs-install-roster-name {
  color: #ffffff;
  text-shadow: var(--pewter-text-glow, 1px 1px 2px rgba(255, 255, 255, 0.45));
  font-family: var(--font-mono, monospace);
  font-size: 0.78rem;
}
.scs-install-roster-chip {
  border-radius: 999px;
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  padding: 0.12rem 0.55rem;
}
.scs-install-chip-active {
  border: 1px solid var(--color-viridian, #2f9e77);
  color: var(--color-viridian, #2f9e77);
}
.scs-install-chip-installed {
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
}
.scs-install-chip-anchored {
  border: 1px solid var(--color-blue, #3b82f6);
  color: var(--color-blue-light, #4496ff);
  letter-spacing: 0.06em;
}
.scs-install-roster-spacer {
  flex: 1;
}
.scs-install-row-btn {
  background: rgba(47, 158, 119, 0.12);
  border: 1px solid var(--color-viridian, #2f9e77);
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.3rem 0.85rem;
  transition: all 0.15s ease;
}
.scs-install-row-btn-focus {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--color-cobalt, #3b82f6);
}
.scs-install-row-btn:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}
.scs-install-row-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
