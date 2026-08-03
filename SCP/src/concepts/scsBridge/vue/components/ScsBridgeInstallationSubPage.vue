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

// MD-ARC+C · Wave 7 · the WAPF worktree role rides each boundScp entry (bridge-probed).
type ScpWorktreeRole = 'clean' | 'instance' | 'owner';
type BoundScpEntry = { port: number; status: string; browserUrl: string; worktree?: ScpWorktreeRole };
type InstalledScpEntry = { anchoredAt?: string };
// MD-ARC+C · Wave 7 · the Archived tab roster row (the sibling ledger relay).
type ArchivedScpMetaEntry = { name: string; archivedAt: number; worktree: ScpWorktreeRole };
type RosterShape = {
  bridgeUp: boolean;
  installedScps: string[];
  boundScps: Record<string, BoundScpEntry>;
  // The registry MAY surface per-SCP anchor metadata; read defensively (absent = no chip).
  installedMeta?: Record<string, InstalledScpEntry>;
  // MD-ARC+C · Wave 7 · the Archived tab data (from SCPs.json archivedScps[] · same poll).
  archivedScps?: ArchivedScpMetaEntry[];
  writtenAt: number;
};

// D4+D5 · ZONE 1 gate — the security notice must be viewed before any install fires.
const noticeViewed = ref(false);
function onNoticeViewed(): void {
  noticeViewed.value = true;
}

const roster = ref<RosterShape>({ bridgeUp: false, installedScps: [], boundScps: {}, archivedScps: [], writtenAt: 0 });
const rosterLoaded = ref(false);

// The row-action status surface (Boot/Focus feedback · the C842 Direct-Install prune kept it)
const statusLine = ref('');
const statusKind = ref<'idle' | 'ok' | 'error'>('idle');

// Per-row in-flight guards (Boot/Focus/Archive/Restore/Delete)
const rowBusy = ref<Record<string, boolean>>({});

// ══ MD-ARC+C · Wave 7 · THE INSTALLED | ARCHIVED TAB SYSTEM (Pewter RD §1.2) ══
// The tab bar lives inline in the roster head; the count chips migrate into each tab.
const activeScpTab = ref<'installed' | 'archived'>('installed');

// MD-ARC+C · Wave 7 · confirm-round state (Pewter RD §1.5).
// deleteOpenFor = the row name whose Delete confirm expansion is open (either tab).
// deleteTyped = the typed-name buffer (Installed tab · armed on exact match).
// wapfOpenFor = the row name whose WAPF confer is open (worktree-owner Archive · §1.7).
const deleteOpenFor = ref<string>('');
const deleteTyped = ref<string>('');
const wapfOpenFor = ref<string>('');
const deleteArmed = computed(() => deleteTyped.value === deleteOpenFor.value && deleteOpenFor.value !== '');

function openDeleteConfirm(name: string): void {
  deleteOpenFor.value = name;
  deleteTyped.value = '';
  wapfOpenFor.value = '';
}
function cancelDelete(): void {
  deleteOpenFor.value = '';
  deleteTyped.value = '';
}
function openWapfConfer(name: string): void {
  wapfOpenFor.value = name;
  deleteOpenFor.value = '';
}
function cancelWapf(): void {
  wapfOpenFor.value = '';
}

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
    roster.value = { bridgeUp: false, installedScps: [], boundScps: {}, archivedScps: [], writtenAt: 0 };
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

// MD-ARC+C · Wave 7 · the Installed-tab rows (the prior rosterRows · now carrying the
// live flag for the live-guard + the WAPF worktree role for the ochre-hatch/refusal).
const installedRows = computed(() => {
  const bound = roster.value.boundScps ?? {};
  const meta = roster.value.installedMeta ?? {};
  const names = new Set<string>([...(roster.value.installedScps ?? []), ...Object.keys(bound)]);
  return [...names].sort().map((name) => ({
    name,
    active: name in bound,
    // The live-guard rail (Pewter RD §1.6): a bound SCP is running → Archive/Delete refused.
    live: name in bound,
    // THE TEMPLATE PROTECTION (the user's field law): the template is the SYSTEM ground
    // every install builds from — the bridge guards refuse it (system-scp-cannot-*), and
    // the UI must never present live controls the guard would only bounce.
    system: name === 'template',
    browserUrl: bound[name]?.browserUrl ?? '',
    port: bound[name]?.port ?? null,
    // WAPF role — 'instance' rows get the ochre-hatch + Archive-disabled; 'owner' rows fire
    // the WAPF confer on Archive. Absent ⇒ 'clean' (a standard SCP).
    worktree: (bound[name]?.worktree ?? 'clean') as ScpWorktreeRole,
    // Defensive: the registry may surface anchoredAt; absent field = no chip (graceful).
    anchoredAt: meta[name]?.anchoredAt,
  }));
});

// MD-ARC+C · Wave 7 · the Archived-tab rows (from SCPs.json archivedScps[] relay).
const archivedRows = computed(() =>
  [...(roster.value.archivedScps ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      name: entry.name,
      archivedAt: entry.archivedAt,
      worktree: (entry.worktree ?? 'clean') as ScpWorktreeRole,
    })),
);

// Retained alias — the count in the head / legacy readers. Installed is the primary roster.
const rosterRows = installedRows;

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

// ══ MD-ARC+C · Wave 7 · THE ARCHIVE / RESTORE / DELETE HANDLERS (Pewter RD §1.3-1.7) ══
// All ride the SAME /bridge-* proxy pipe as Boot/Focus (the R3 law) with the SAME
// rowBusy guard + statusLine feedback + refreshRoster-on-success (R1B finding 8).

// A shared POST helper — mirrors handleRowAction's body/guard for the new verbs.
async function fireRowRoute(
  name: string,
  route: string,
  body: Record<string, unknown>,
  verb: string,
): Promise<void> {
  if (rowBusy.value[name]) return;
  rowBusy.value = { ...rowBusy.value, [name]: true };
  try {
    const res = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = (await res.json()) as { ok: boolean; error?: string };
    statusKind.value = out.ok ? 'ok' : 'error';
    statusLine.value = out.ok ? `${verb} of ${name} accepted.` : out.error ?? `${verb} rejected.`;
    void refreshRoster();
  } catch (err) {
    statusKind.value = 'error';
    statusLine.value = `${verb} failed: ${String(err)}`;
  } finally {
    const next = { ...rowBusy.value };
    delete next[name];
    rowBusy.value = next;
  }
}

// Archive an installed (stopped) SCP. Owner-of-worktrees rows route to the WAPF confer
// instead (openWapfConfer surfaces Retire-first anor Force); a clean/normal row archives
// directly. The live-guard (:disabled on the button) prevents a live-row press upstream.
function handleArchive(name: string, worktree: ScpWorktreeRole): void {
  if (worktree === 'owner') { openWapfConfer(name); return; }
  void fireRowRoute(name, '/bridge-archive', { scpName: name }, 'Archive');
}
// WAPF Path B — force archive despite owned worktrees (move + git worktree repair · maroon voice).
function fireWapfForce(name: string): void {
  cancelWapf();
  void fireRowRoute(name, '/bridge-archive', { scpName: name, force: true }, 'Force archive');
}

// Reinstate (Restore) an archived SCP back to its original seat at status 'pending'.
function handleRestore(name: string): void {
  void fireRowRoute(name, '/bridge-reinstate', { scpName: name }, 'Restore');
}

// Delete — PERMANENT. Fired from a confirm expansion (typed-name armed on the Installed
// tab · immediate Y/N on the Archived tab). fromArchive selects the vault seat.
function fireDelete(name: string, fromArchive: boolean): void {
  cancelDelete();
  void fireRowRoute(name, '/bridge-delete', { scpName: name, fromArchive }, 'Delete');
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

    <!-- THE ROSTER · MD-ARC+C · Wave 7 · Installed | Archived tab system (Pewter RD §1) -->
    <section class="scs-install-roster hifi-pane-base">
      <div class="scs-install-roster-head">
        <h2 class="scs-install-roster-title">Registered SCPs</h2>
        <!-- Pewter RD §1.2 · the tab bar (StratiPUNK neon-amber · D7 active inversion) -->
        <div class="scp-mgmt-tab-bar">
          <button
            class="sessions-btn scp-mgmt-tab"
            :class="{ active: activeScpTab === 'installed' }"
            type="button"
            @click="activeScpTab = 'installed'"
          >
            <span class="sessions-btn-label">Installed</span>
            <span class="sessions-badge">{{ installedRows.length }}</span>
          </button>
          <button
            class="sessions-btn scp-mgmt-tab"
            :class="{ active: activeScpTab === 'archived' }"
            type="button"
            @click="activeScpTab = 'archived'"
          >
            <span class="sessions-btn-label">Archived</span>
            <span class="sessions-badge">{{ archivedRows.length }}</span>
          </button>
        </div>
        <button class="scs-install-refresh" type="button" @click="refreshRoster">Refresh</button>
      </div>

      <p
        v-if="statusLine"
        class="scs-install-status"
        :class="{ 'scs-install-status-ok': statusKind === 'ok', 'scs-install-status-error': statusKind === 'error' }"
      >{{ statusLine }}</p>

      <!-- ══ INSTALLED TAB (Pewter RD §1.3) ══ -->
      <template v-if="activeScpTab === 'installed'">
        <p v-if="rosterLoaded && installedRows.length === 0" class="scs-install-empty">
          No SCPs installed — install one above.
        </p>

        <div
          v-for="row in installedRows"
          :key="row.name"
          class="scs-install-roster-card"
          :class="{ 'scs-install-roster-card-worktree': row.worktree === 'instance' }"
        >
          <div class="scs-install-roster-row">
            <span class="scs-install-roster-name">{{ row.name }}</span>
            <span
              v-if="row.worktree === 'instance'"
              class="scs-install-roster-chip scs-install-chip-worktree"
            >{{ row.active ? `INSTANCE · :${row.port}` : 'INSTANCE · OFFLINE' }}</span>
            <span
              v-else
              class="scs-install-roster-chip"
              :class="row.active ? 'scs-install-chip-active' : 'scs-install-chip-installed'"
            >{{ row.active ? `LIVE · :${row.port}` : 'OFFLINE' }}</span>
            <span v-if="row.anchoredAt" class="scs-install-roster-chip scs-install-chip-anchored">ANCHORED</span>
            <span class="scs-install-roster-spacer"></span>
            <!-- Boot / Focus (the primary action · persists) -->
            <button
              v-if="!row.active"
              class="scs-install-row-btn"
              type="button"
              :disabled="!!rowBusy[row.name] || !roster.bridgeUp"
              @click="handleRowAction(row.name, '/bridge-boot')"
            >{{ rowBusy[row.name] ? 'Booting…' : 'Spawn' }}</button>
            <button
              v-if="row.active"
              class="scs-install-row-btn scs-install-row-btn-focus"
              type="button"
              :disabled="!!rowBusy[row.name]"
              @click="handleRowAction(row.name, '/bridge-focus')"
            >{{ rowBusy[row.name] ? 'Focusing…' : 'Focus' }}</button>
            <!-- Archive (amber · reversible vault) · disabled-with-reason on live rows (§1.6);
                 an instance is refused toward Delete (§1.7); an owner fires the WAPF confer -->
            <button
              class="scs-install-row-btn scs-install-row-btn-archive"
              type="button"
              :disabled="!!rowBusy[row.name] || row.live || row.system || row.worktree === 'instance' || !roster.bridgeUp"
              :title="row.system
                ? 'The template is system-protected — the ground every install builds from'
                : row.live
                  ? 'Stop the SCP first — archive requires the process to be offline'
                  : row.worktree === 'instance'
                    ? 'A worktree instance — Delete retires it; the branch survives in its parent'
                    : row.worktree === 'owner'
                      ? 'Owns worktrees — Archive will confer git cleanup'
                      : 'Archive this SCP (reversible · moves to the vault)'"
              @click="handleArchive(row.name, row.worktree)"
            >Archive</button>
            <!-- Delete (red · PERMANENT) · opens the typed-name confirm expansion (§1.5) -->
            <button
              class="scs-install-row-btn scs-install-row-btn-delete"
              type="button"
              :disabled="!!rowBusy[row.name] || row.live || row.system || !roster.bridgeUp"
              :title="row.system
                ? 'The template is system-protected — the ground every install builds from'
                : row.live
                  ? 'Stop the SCP first — delete requires the process to be offline'
                  : 'Delete this SCP PERMANENTLY (removes the directory from disk)'"
              @click="openDeleteConfirm(row.name)"
            >{{ deleteOpenFor === row.name ? 'Delete ▲' : 'Delete' }}</button>
          </div>

          <!-- WAPF CONFER (§1.7) · worktree-owner Archive — Retire-first anor Force -->
          <div v-if="wapfOpenFor === row.name" class="scs-install-panel scs-install-panel-wapf">
            <span class="scs-install-panel-warn">
              ⚑ WORKTREE INSTANCE — archiving requires git worktree cleanup. Choose:
            </span>
            <div class="scs-install-panel-actions">
              <button
                class="scs-install-panel-fire scs-install-panel-fire-wapf-force"
                type="button"
                :disabled="!!rowBusy[row.name]"
                @click="fireWapfForce(row.name)"
              >Force archive</button>
              <button class="scs-install-panel-cancel" type="button" @click="cancelWapf">Cancel</button>
            </div>
          </div>

          <!-- INSTALLED-TAB DELETE CONFIRM (§1.5 · typed-name armed) -->
          <div v-if="deleteOpenFor === row.name" class="scs-install-panel scs-install-panel-delete">
            <span class="scs-install-panel-warn">
              ⚠ DELETE IS PERMANENT — <strong>removes the SCP directory from disk.</strong>
              This cannot be undone. Type <strong>{{ row.name }}</strong> to confirm:
            </span>
            <div class="scs-install-panel-input">
              <input
                v-model="deleteTyped"
                class="scs-create-input hifi-mono"
                type="text"
                :placeholder="row.name"
                spellcheck="false"
              />
            </div>
            <div class="scs-install-panel-actions">
              <button class="scs-install-panel-cancel" type="button" @click="cancelDelete">Cancel</button>
              <button
                class="scs-install-panel-fire scs-install-panel-fire-delete"
                :class="{ 'is-armed': deleteArmed }"
                type="button"
                :disabled="!deleteArmed || !!rowBusy[row.name]"
                @click="fireDelete(row.name, false)"
              >Delete</button>
            </div>
          </div>
        </div>
      </template>

      <!-- ══ ARCHIVED TAB (Pewter RD §1.4) ══ -->
      <template v-else>
        <p v-if="rosterLoaded && archivedRows.length === 0" class="scs-install-empty scs-install-empty-archived">
          No archived SCPs yet — Archive an installed SCP to move it here.
        </p>

        <div
          v-for="row in archivedRows"
          :key="row.name"
          class="scs-install-roster-card"
        >
          <div class="scs-install-roster-row">
            <span class="scs-install-roster-name">{{ row.name }}</span>
            <span class="scs-install-roster-chip scs-install-chip-archived">ARCHIVED</span>
            <span class="scs-install-roster-spacer"></span>
            <!-- Restore (green · revival) -->
            <button
              class="scs-install-row-btn scs-install-row-btn-restore"
              type="button"
              :disabled="!!rowBusy[row.name] || !roster.bridgeUp"
              @click="handleRestore(row.name)"
            >{{ rowBusy[row.name] ? 'Restoring…' : 'Restore' }}</button>
            <!-- Delete (red · PERMANENT · simple Y/N — already vaulted) -->
            <button
              class="scs-install-row-btn scs-install-row-btn-delete"
              type="button"
              :disabled="!!rowBusy[row.name] || !roster.bridgeUp"
              @click="openDeleteConfirm(row.name)"
            >{{ deleteOpenFor === row.name ? 'Delete ▲' : 'Delete' }}</button>
          </div>

          <!-- ARCHIVED-TAB DELETE CONFIRM (§1.5 · simple Y/N · Cancel autofocus) -->
          <div v-if="deleteOpenFor === row.name" class="scs-install-panel scs-install-panel-delete">
            <span class="scs-install-panel-warn">
              ⚠ DELETE IS PERMANENT — <strong>removes the archived SCP directory.</strong>
              Already removed from active roster.
            </span>
            <div class="scs-install-panel-actions">
              <button class="scs-install-panel-cancel" type="button" autofocus @click="cancelDelete">Cancel</button>
              <button
                class="scs-install-panel-fire scs-install-panel-fire-delete is-armed"
                type="button"
                :disabled="!!rowBusy[row.name]"
                @click="fireDelete(row.name, true)"
              >Delete permanently</button>
            </div>
          </div>
        </div>
      </template>
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

/* ══════════════════════════════════════════════════════════════════════════
   MD-ARC+C · Wave 7 · SCP Archive/Delete UI (Pewter RD MD-ARC-PEWTER-UIFLOW.md)
   ══════════════════════════════════════════════════════════════════════════ */

/* Pewter RD §1.2 · THE TAB BAR — StratiPUNK neon-amber register · D7 active inversion.
   Self-contained (does not rely on a global .sessions-btn) — mirrors its look. */
.scp-mgmt-tab-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 0.5rem;
}
.scp-mgmt-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  font-size: 0.7rem;
  font-family: var(--font-mono, monospace);
  letter-spacing: 0.04em;
  color: rgba(255, 206, 9, 0.7);
  background: rgba(12, 16, 26, 0.6);
  border: 1px solid rgba(255, 191, 96, 0.3);
  border-radius: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.scp-mgmt-tab:hover {
  color: rgba(255, 228, 170, 0.95);
  border-color: rgba(255, 191, 96, 0.6);
}
/* Active tab: D7 inversion — full-saturation border + amplified glow (RD §1.2). */
.scp-mgmt-tab.active {
  color: rgb(255, 228, 170);
  background: radial-gradient(ellipse at 87.5% 12.5%, rgba(255, 191, 96, 0.32) 0%, rgba(12, 16, 26, 0.8) 88%);
  border: 1px solid rgb(255, 191, 96);
  box-shadow: -2.5px 2.5px 0 rgba(255, 191, 96, 0.6), 0 0 16px rgba(255, 170, 60, 0.55);
  text-shadow: 0 0 9px rgba(255, 180, 70, 0.9);
}
.scp-mgmt-tab .sessions-badge {
  font-family: var(--font-mono, monospace);
  font-size: 0.625rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

/* The row card wrapper — hosts the row + its confirm expansion. */
.scs-install-roster-card {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.scs-install-roster-card .scs-install-roster-row {
  border-bottom: none;
}

/* Pewter RD §1.7 · WORKTREE INSTANCE ROW — ochre diagonal-hatch tessera + yellow left-border. */
.scs-install-roster-card-worktree {
  position: relative;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    rgba(234, 179, 8, 0.06) 6px,
    rgba(234, 179, 8, 0.06) 7px
  );
  background-color: var(--color-board-elevated, #222228);
  border-left: 2px solid rgba(234, 179, 8, 0.45);
}

/* Pewter RD §1.3/1.4 · the new status chips. */
.scs-install-chip-worktree {
  border: 1px solid var(--color-yellow, #eab308);
  color: var(--color-yellow-light, #ffce09);
  letter-spacing: 0.04em;
}
.scs-install-chip-archived {
  border: 1px solid var(--color-maroon, #b03a48);
  color: var(--color-maroon, #b03a48);
  letter-spacing: 0.06em;
}

/* Pewter RD §1.3 · Archive — amber voice (reversible · vault). */
.scs-install-row-btn-archive {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.55);
  color: rgba(255, 206, 9, 0.85);
}
.scs-install-row-btn-archive:hover:not(:disabled) {
  background: rgba(234, 179, 8, 0.2);
  border-color: var(--color-yellow, #eab308);
  color: var(--color-yellow-light, #ffce09);
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.35);
}
/* Pewter RD §1.6 · Archive disabled on LIVE/instance rows — muted amber. */
.scs-install-row-btn-archive:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: rgba(234, 179, 8, 0.25);
  color: rgba(255, 206, 9, 0.35);
}

/* Pewter RD §1.3 · Delete — red voice (destructive · permanent). */
.scs-install-row-btn-delete {
  background: rgba(190, 60, 70, 0.1);
  border-color: rgba(190, 60, 70, 0.5);
  color: rgba(220, 90, 100, 0.85);
}
.scs-install-row-btn-delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.18);
  border-color: var(--color-red, #ef4444);
  color: var(--color-red-light, #ff4e4e);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

/* Pewter RD §1.4 · Restore — green voice (revival). */
.scs-install-row-btn-restore {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.55);
  color: rgba(39, 227, 108, 0.85);
}
.scs-install-row-btn-restore:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.2);
  border-color: var(--color-green, #22c55e);
  color: var(--color-green-light, #27e36c);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.35);
}

/* Pewter RD §1.5/1.7 · THE CONFIRM / WAPF EXPANSION PANEL (inline row-expansion · not a modal). */
.scs-install-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  margin: 0 0 0.4rem;
  background: radial-gradient(ellipse at 20% 0%, rgba(190, 60, 70, 0.1) 0%, rgba(0, 0, 0, 0) 70%),
              var(--color-board-elevated, #222228);
  border: 1px solid color-mix(in srgb, var(--color-maroon, #be3c46) 45%, transparent);
  border-radius: 0.4rem;
}
/* WAPF confer variant — yellow accent (RD §1.7). */
.scs-install-panel-wapf {
  border-color: color-mix(in srgb, var(--color-yellow, #eab308) 55%, var(--color-board-light, #16161a));
  background: radial-gradient(ellipse at 20% 0%, rgba(234, 179, 8, 0.08) 0%, rgba(0, 0, 0, 0) 70%),
              var(--color-board-elevated, #222228);
}
.scs-install-panel-wapf .scs-install-panel-warn {
  color: var(--color-yellow-light, #ffce09);
}
.scs-install-panel-warn {
  font-size: 0.72rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.7);
}
.scs-install-panel-warn strong {
  color: #ffffff;
}
.scs-install-panel-input {
  display: flex;
}
.scs-install-panel-input .scs-create-input {
  flex: 1 1 auto;
}
.scs-install-panel-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.scs-install-panel-cancel {
  border: 1px solid var(--color-board-light, #16161a);
  border-radius: 0.3rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  padding: 0.28rem 0.85rem;
  cursor: pointer;
}
.scs-install-panel-cancel:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.3);
}
/* The FIRE button — muted at rest (RD destructive default-N); .is-armed lights it. */
.scs-install-panel-fire {
  border-radius: 0.3rem;
  font-size: 0.7rem;
  padding: 0.28rem 0.85rem;
  cursor: pointer;
}
.scs-install-panel-fire-delete {
  border: 1px solid var(--color-maroon, #be3c46);
  background: rgba(190, 60, 70, 0.15);
  color: rgba(220, 90, 100, 0.6);
  opacity: 0.7;
}
.scs-install-panel-fire-delete.is-armed {
  color: var(--color-red-light, #ff4e4e);
  background: rgba(190, 60, 70, 0.28);
  opacity: 1;
}
.scs-install-panel-fire-delete.is-armed:hover {
  box-shadow: 0 0 8px rgba(190, 60, 70, 0.45);
}
.scs-install-panel-fire-delete:disabled {
  cursor: not-allowed;
}
/* WAPF force path — maroon voice (RD §1.7). */
.scs-install-panel-fire-wapf-force {
  border: 1px solid color-mix(in srgb, var(--color-maroon, #be3c46) 55%, var(--color-board-light, #16161a));
  background: rgba(190, 60, 70, 0.12);
  color: var(--color-red-light, #ff4e4e);
}
.scs-install-panel-fire-wapf-force:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(190, 60, 70, 0.4);
}

/* Pewter RD §1.8 · the archived-tab empty state (italic · centered). */
.scs-install-empty-archived {
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
  text-align: center;
  padding: 1rem 1.25rem;
}
</style>
