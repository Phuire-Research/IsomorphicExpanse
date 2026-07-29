<script setup lang="ts">
/**
 * ScpManifestIntake.vue · D4+D5 · ZONE 2 · INSTALL FROM MANIFEST (commit-pinned)
 *
 * C836 · PASTE IS THE PRIMARY DOOR — the manifest travels as TEXT; copy-and-paste is the
 * easiest bridge to formalize (no download → browse round-trip). Paste from Clipboard
 * (one click) anor paste into the field; drag-and-drop anor browse remain as the file
 * doors. ALL doors funnel through the ONE applyText → validateScpManifest gate (the SAME
 * validator table the bridge carries) → EMPTY / INVALID / VALID states. A VALID
 * manifest surfaces the ScpAnchorStamp preview + description + Cognitive Aspects,
 * then Designation (PascalCase) + Origin — LOCAL anor REMOTE: an https://… / git@… remote
 * anor a file:///abs/path (the assemble output's Copy Location value pastes here;
 * performCloneAtCommit clones both alike and checks out the pinned commit).
 * Install at Anchor POSTs /bridge-install-manifest — disabled until the
 * security notice is viewed, the manifest is valid, and both fields are present.
 *
 * The page talks to THE BRIDGE only via the SCP-server proxy route (the R3 law);
 * the install is ACK-only — the roster reflects registration on the next broadcast.
 */
import { computed, onBeforeUnmount, ref } from 'vue';
import ScsInput from '../../../vue/components/ScsInput.vue';
import ScpAnchorStamp from './ScpAnchorStamp.vue';
import { validateScpManifest, type ParsedScpManifest } from '../../../../model/scpManifest.model';

const props = defineProps<{ noticeViewed: boolean }>();

type IntakeState = 'empty' | 'invalid' | 'valid';

const state = ref<IntakeState>('empty');
const invalidReason = ref('');
const manifest = ref<ParsedScpManifest | null>(null);
const manifestJson = ref('');

const dragActive = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const designation = ref('');
const gitUrl = ref('');

const installBusy = ref(false);
const statusLine = ref('');
const statusKind = ref<'idle' | 'ok' | 'error'>('idle');

const designationValid = computed(() => /^[A-Z][A-Za-z0-9]*$/.test(designation.value));

const canInstall = computed(
  () =>
    props.noticeViewed &&
    state.value === 'valid' &&
    !installBusy.value &&
    designationValid.value &&
    gitUrl.value.trim().length > 0,
);

function applyText(raw: string): void {
  const check = validateScpManifest(raw);
  if (check.ok) {
    state.value = 'valid';
    manifest.value = check.manifest;
    manifestJson.value = raw;
    invalidReason.value = '';
    // C837 · THE ORIGIN RIDES INSIDE THE MANIFEST — a manifest carrying `origin` PRE-FILLS
    // the Origin field (one paste installs); the field stays editable (an override never
    // fights the user's own typing — only an EMPTY field is filled).
    if (typeof check.manifest.origin === 'string' && gitUrl.value.trim().length === 0) {
      gitUrl.value = check.manifest.origin;
    }
    // C838 · THE DESIGNATION RIDES TOO — pre-filled the same way; edit it if you see fit.
    if (typeof check.manifest.designation === 'string' && designation.value.trim().length === 0) {
      designation.value = check.manifest.designation;
    }
  } else {
    state.value = 'invalid';
    manifest.value = null;
    manifestJson.value = '';
    invalidReason.value = check.reason;
  }
}

async function readFile(file: File): Promise<void> {
  try {
    const text = await file.text();
    applyText(text);
  } catch (err) {
    state.value = 'invalid';
    invalidReason.value = `could not read the file: ${String(err)}`;
  }
}

function onDrop(ev: DragEvent): void {
  ev.preventDefault();
  dragActive.value = false;
  const file = ev.dataTransfer?.files?.[0];
  if (file) void readFile(file);
}

function onDragOver(ev: DragEvent): void {
  ev.preventDefault();
  dragActive.value = true;
}

function onDragLeave(): void {
  dragActive.value = false;
}

function onBrowse(): void {
  fileInput.value?.click();
}

// C836 · THE PASTE DOOR — the primary bridge. One-click clipboard read anor the paste
// field; both land in the same applyText gate every other door uses.
const pasteDraft = ref('');

function applyPasteDraft(): void {
  const raw = pasteDraft.value.trim();
  if (!raw) return;
  applyText(raw);
  if (state.value === 'valid') pasteDraft.value = '';
}

function onPasteEvent(): void {
  // The pasted text lands in the model AFTER the paste event — read it on the next tick.
  setTimeout(() => applyPasteDraft(), 0);
}

async function pasteFromClipboard(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text.trim().length > 0) {
      applyText(text.trim());
      return;
    }
    state.value = 'invalid';
    invalidReason.value = 'The clipboard is empty — copy the manifest JSON first.';
  } catch {
    state.value = 'invalid';
    invalidReason.value = 'Clipboard read unavailable here — paste into the field instead.';
  }
}

function onFilePicked(ev: Event): void {
  const target = ev.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) void readFile(file);
  target.value = '';
}

function clearManifest(): void {
  state.value = 'empty';
  invalidReason.value = '';
  manifest.value = null;
  manifestJson.value = '';
  statusLine.value = '';
  statusKind.value = 'idle';
}

// C839 · THE STAGED INSTALL RAIL — Clone → Install → Ready (the SCP WorkTree scaffolding's
// proven staged bar remuxified). After the ACK the page POLLS the MOCH proxy
// (/bridge-install-progress/:designation · the bridge-owned sidecar) and walks the rail;
// 'ready' = registration landed (the roster lists the citizen reactively); 'failed'
// renders the HONEST reason — the silence dies. Bounded window (10 min · npm can be slow).
type InstallStage = 'idle' | 'cloning' | 'installing' | 'ready' | 'failed' | 'timeout';
const installStage = ref<InstallStage>('idle');
const installStageDetail = ref('');
const installFailReason = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollCount = 0;
const POLL_MS = 1200;
const POLL_MAX = 500; // ~10 minutes

function stopPolling(): void {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function beginStagePolling(target: string): void {
  stopPolling();
  pollCount = 0;
  installStage.value = 'cloning';
  installStageDetail.value = '';
  installFailReason.value = '';
  pollTimer = setInterval(async () => {
    pollCount += 1;
    if (pollCount > POLL_MAX) {
      installStage.value = 'timeout';
      stopPolling();
      return;
    }
    try {
      const r = await fetch(`/bridge-install-progress/${encodeURIComponent(target)}`);
      if (!r.ok) return;
      const p = (await r.json()) as { stage?: string; detail?: string; reason?: string; at?: number } | null;
      if (!p || typeof p.stage !== 'string') return;
      if (p.stage === 'cloning' || p.stage === 'installing') {
        installStage.value = p.stage;
        installStageDetail.value = p.detail ?? '';
      } else if (p.stage === 'ready') {
        installStage.value = 'ready';
        installStageDetail.value = p.detail ?? '';
        stopPolling();
      } else if (p.stage === 'failed') {
        installStage.value = 'failed';
        installFailReason.value = p.reason ?? 'install failed (no reason reported)';
        stopPolling();
      }
    } catch { /* transient — the next tick retries */ }
  }, POLL_MS);
}

onBeforeUnmount(() => stopPolling());

const stageNotchState = (notch: 'clone' | 'install' | 'ready') => {
  const order: Record<string, number> = { cloning: 0, installing: 1, ready: 2 };
  const notchIdx = { clone: 0, install: 1, ready: 2 }[notch];
  const cur = order[installStage.value] ?? -1;
  if (installStage.value === 'ready') return 'done';
  if (cur > notchIdx) return 'done';
  if (cur === notchIdx) return 'active';
  return 'pending';
};

async function handleInstall(): Promise<void> {
  if (!canInstall.value) return;
  installBusy.value = true;
  statusKind.value = 'idle';
  statusLine.value = `Installing ${designation.value} at anchor…`;
  installStage.value = 'idle';
  try {
    const res = await fetch('/bridge-install-manifest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designation: designation.value,
        gitUrl: gitUrl.value.trim(),
        manifestJson: manifestJson.value,
      }),
    });
    const out = (await res.json()) as { ok?: boolean; error?: string; anchor?: string };
    if (out.ok) {
      statusKind.value = 'ok';
      const anchor = out.anchor ? ` at anchor ${out.anchor.slice(0, 8)}` : '';
      statusLine.value = `Install of ${designation.value}${anchor} accepted.`;
      beginStagePolling(designation.value);
    } else {
      statusKind.value = 'error';
      statusLine.value = out.error ?? 'Install rejected.';
    }
  } catch (err) {
    statusKind.value = 'error';
    statusLine.value = `Install request failed: ${String(err)}`;
  } finally {
    installBusy.value = false;
  }
}
</script>

<template>
  <section class="scpm-intake hifi-pane-green">
    <div class="hifi-panel-toolbar">
      <span class="hifi-heading hifi-hl-green scpm-intake-title">Install from Manifest</span>
      <span class="named-scp-badge hifi-mono scpm-commit-badge">COMMIT-PINNED</span>
    </div>
    <div class="hifi-panel-body">
      <div class="hifi-subtext-ground">
        <!-- THE DROPZONE -->
        <div
          class="scpm-dropzone"
          :class="{ 'scpm-dropzone-drag': dragActive, 'scpm-dropzone-invalid': state === 'invalid' }"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <template v-if="state !== 'valid'">
            <p class="scpm-dropzone-hint">
              <span class="hifi-hl-green">Paste</span> the manifest JSON — the easiest bridge —
              anor drag a <span class="hifi-mono">.json</span> here, anor browse for the file.
            </p>
            <div class="scpm-door-row">
              <button type="button" class="scpm-browse-btn scpm-paste-btn" @click="pasteFromClipboard">
                Paste from Clipboard
              </button>
              <button type="button" class="scpm-browse-btn" @click="onBrowse">Browse for file</button>
            </div>
            <textarea
              v-model="pasteDraft"
              class="scpm-paste-input custom-scrollbar"
              rows="3"
              placeholder='anor paste it here — {"manifestVersion": 1, "commit": { … }, …}'
              spellcheck="false"
              @paste="onPasteEvent"
              @blur="applyPasteDraft"
            ></textarea>
            <input
              ref="fileInput"
              class="scpm-file-input"
              type="file"
              accept=".json,application/json"
              @change="onFilePicked"
            />
            <p v-if="state === 'invalid'" class="scpm-invalid-line">
              <span class="scpm-invalid-tag">Manifest rejected</span>
              <span class="scpm-invalid-reason">{{ invalidReason }}</span>
              <button type="button" class="scpm-clear-btn" @click="clearManifest">Clear</button>
            </p>
          </template>

          <!-- THE VALID PREVIEW -->
          <template v-else-if="manifest">
            <div class="scpm-preview">
              <ScpAnchorStamp :commit="manifest.commit" />
              <p class="scpm-description">{{ manifest.description }}</p>
              <div v-if="manifest.suite8s.length > 0" class="scpm-aspects">
                <span class="scpm-aspects-label">Cognitive Aspects</span>
                <ul class="hifi-list scpm-aspects-list">
                  <li v-for="s in manifest.suite8s" :key="s.name" style="--mark: rgba(39, 227, 108, 0.8)">
                    <span class="scpm-aspect-name">{{ s.name }}</span>
                    <span class="scpm-aspect-desc"> · {{ s.functionalDescription }}</span>
                  </li>
                </ul>
              </div>
              <button type="button" class="scpm-clear-btn scpm-clear-btn-inline" @click="clearManifest">
                Clear manifest
              </button>
            </div>
          </template>
        </div>

        <!-- DESIGNATION + GIT URL (only once a valid manifest is loaded) -->
        <div v-if="state === 'valid'" class="scpm-fields">
          <div class="scpm-field-row">
            <label class="hifi-label scpm-field-label" for="scpm-designation">Designation</label>
            <ScsInput
              id="scpm-designation"
              v-model="designation"
              class="scpm-input"
              type="text"
              placeholder="PascalCase · e.g. MyProject"
              spellcheck="false"
            />
            <span v-if="designation && !designationValid" class="scpm-field-hint">PascalCase required</span>
          </div>
          <div class="scpm-field-row">
            <label class="hifi-label scpm-field-label" for="scpm-giturl">Origin</label>
            <ScsInput
              id="scpm-giturl"
              v-model="gitUrl"
              class="scpm-input scpm-input-wide"
              type="text"
              placeholder="https://… · git@… · file:///abs/path — local anor remote, cloned at the pinned commit"
              spellcheck="false"
            />
          </div>
          <p class="scpm-origin-note">
            The origin is LOCAL anor REMOTE — a git remote (priority), anor a
            <span class="hifi-mono">file://</span> path for direct transfer. A manifest
            carrying its own origin pre-fills this field — one paste installs. Either
            clones at the pinned commit; the anchor is verified after checkout.
          </p>

          <div class="scpm-install-row">
            <button
              type="button"
              class="hifi-btn hifi-btn-green scpm-install-btn"
              :disabled="!canInstall"
              @click="handleInstall"
            >
              {{ installBusy ? 'Installing…' : 'Install at Anchor' }}
            </button>
            <span v-if="!noticeViewed" class="scpm-gate-hint">Review the notice above to enable install.</span>
          </div>

          <p
            v-if="statusLine"
            class="scs-install-status scpm-status"
            :class="{ 'scpm-status-ok': statusKind === 'ok', 'scpm-status-error': statusKind === 'error' }"
          >{{ statusLine }}</p>

          <!-- C839 · THE STAGED INSTALL RAIL — Clone → Install → Ready (the worktree staged-bar
               idiom). Lights as each stage lands; failed carries the honest reason. -->
          <div v-if="installStage !== 'idle'" class="scpm-stage-rail">
            <div class="scpm-stage-notches">
              <span :class="['scpm-notch', `scpm-notch-${stageNotchState('clone')}`]">CLONE</span>
              <span class="scpm-notch-link" aria-hidden="true">→</span>
              <span :class="['scpm-notch', `scpm-notch-${stageNotchState('install')}`]">INSTALL</span>
              <span class="scpm-notch-link" aria-hidden="true">→</span>
              <span :class="['scpm-notch', `scpm-notch-${stageNotchState('ready')}`]">READY</span>
            </div>
            <p v-if="installStage === 'ready'" class="scpm-stage-line scpm-stage-ready">
              Installed at anchor — {{ installStageDetail || 'the roster now lists it.' }}
            </p>
            <p v-else-if="installStage === 'failed'" class="scpm-stage-line scpm-stage-failed">
              Install failed — {{ installFailReason }}
            </p>
            <p v-else-if="installStage === 'timeout'" class="scpm-stage-line scpm-stage-failed">
              No progress within the polling window — check the bridge; the pipeline may still be running.
            </p>
            <p v-else-if="installStageDetail" class="scpm-stage-line">{{ installStageDetail }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scpm-intake {
  border-radius: 0.65rem;
  overflow: hidden;
}
.scpm-intake-title {
  font-size: 0.9rem;
}
.scpm-commit-badge {
  margin: 0;
}
.scpm-dropzone {
  border: 1px dashed rgba(39, 227, 108, 0.45);
  border-radius: 0.55rem;
  background: rgba(10, 20, 14, 0.5);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.scpm-dropzone-drag {
  border-color: var(--color-green-light, #6ee7b7);
  background: rgba(20, 40, 26, 0.6);
  box-shadow: 0 0 12px rgba(39, 227, 108, 0.25);
}
.scpm-dropzone-invalid {
  border-color: var(--color-red-light, #ff4e4e);
  border-style: dashed;
}
.scpm-dropzone-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-white-conductor, #f0f0f0);
}
.scpm-browse-btn {
  background: rgba(39, 227, 108, 0.12);
  border: 1px solid var(--color-green, #22c55e);
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.72rem;
  padding: 0.35rem 0.9rem;
  transition: box-shadow 0.15s ease;
}
.scpm-browse-btn:hover {
  box-shadow: 0 0 8px rgba(39, 227, 108, 0.35);
}
.scpm-file-input {
  display: none;
}
/* C836 · the paste door (the primary bridge) */
.scpm-door-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.scpm-paste-btn {
  background: rgba(39, 227, 108, 0.2);
  font-weight: 600;
}
.scpm-paste-input {
  width: 100%;
  padding: 0.5rem 0.65rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(6, 14, 9, 0.65);
  border: 1px solid rgba(39, 227, 108, 0.3);
  border-radius: 0.4rem;
  resize: vertical;
}
.scpm-paste-input:focus {
  outline: none;
  border-color: var(--color-green, #22c55e);
  box-shadow: 0 0 8px rgba(39, 227, 108, 0.3);
}
.scpm-origin-note {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.55));
}
.scpm-invalid-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 0.35rem 0 0;
}
.scpm-invalid-tag {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-red-light, #ff4e4e);
}
.scpm-invalid-reason {
  font-size: 0.75rem;
  color: rgba(255, 210, 210, 0.9);
}
.scpm-clear-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.375rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.65));
  cursor: pointer;
  font-size: 0.66rem;
  padding: 0.22rem 0.65rem;
}
.scpm-clear-btn:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.4);
}
.scpm-clear-btn-inline {
  align-self: flex-start;
  margin-top: 0.25rem;
}
.scpm-preview {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
}
.scpm-description {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.6;
}
.scpm-aspects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.scpm-aspects-label {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-green-light, #6ee7b7);
}
.scpm-aspects-list {
  font-size: 0.78rem;
}
.scpm-aspect-name {
  color: var(--color-white-conductor, #f0f0f0);
  font-weight: 500;
}
.scpm-aspect-desc {
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.65));
}
.scpm-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}
.scpm-field-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.scpm-field-label {
  font-size: 0.72rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.6));
  min-width: 6.5rem;
}
.scpm-input {
  background: rgba(10, 13, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  color: #ffffff;
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  padding: 0.45rem 0.6rem;
  min-width: 16rem;
}
.scpm-input-wide {
  flex: 1;
  min-width: 22rem;
}
.scpm-input:focus {
  outline: none;
  border-color: var(--color-green, #22c55e);
  box-shadow: 0 0 8px rgba(39, 227, 108, 0.3);
}
.scpm-field-hint {
  color: var(--color-yellow-light, #ffce09);
  font-size: 0.68rem;
}
.scpm-install-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
}
.scpm-install-btn {
  font-size: 0.75rem;
  padding: 0.55rem 1.25rem;
}
.scpm-gate-hint {
  font-size: 0.7rem;
  color: var(--color-red-light, #ff4e4e);
}
.scpm-status {
  font-size: 0.72rem;
  margin: 0;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.6));
}
.scpm-status-ok {
  color: var(--color-green-light, #6ee7b7);
}
.scpm-status-error {
  color: var(--color-red-light, #ff4e4e);
}

/* C839 · the staged install rail (Clone → Install → Ready · the worktree staged-bar idiom) */
.scpm-stage-rail {
  margin-top: 0.6rem;
  padding: 0.65rem 0.8rem;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 6px;
  border-left: 3px solid var(--color-green, #22c55e);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.scpm-stage-notches {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.scpm-notch {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  padding: 0.22rem 0.6rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.scpm-notch-active {
  color: var(--color-green-light, #6ee7b7);
  border-color: var(--color-green, #22c55e);
  box-shadow: 0 0 8px rgba(39, 227, 108, 0.35);
  animation: scpm-notch-pulse 1.4s ease-in-out infinite;
}
.scpm-notch-done {
  color: var(--color-green-light, #6ee7b7);
  border-color: rgba(39, 227, 108, 0.55);
}
.scpm-notch-link {
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.7rem;
}
@keyframes scpm-notch-pulse {
  0%, 100% { box-shadow: 0 0 6px rgba(39, 227, 108, 0.25); }
  50% { box-shadow: 0 0 12px rgba(39, 227, 108, 0.5); }
}
.scpm-stage-line {
  margin: 0;
  font-size: 0.72rem;
  color: var(--pewter-text-recede, rgba(255, 255, 255, 0.65));
}
.scpm-stage-ready {
  color: var(--color-green-light, #6ee7b7);
}
.scpm-stage-failed {
  color: var(--color-red-light, #ff4e4e);
}
</style>
