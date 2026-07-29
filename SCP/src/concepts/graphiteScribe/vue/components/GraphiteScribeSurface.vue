<template>
  <!-- MD-CE-4 · THE EDITOR SURFACE — the CM6+vim island consuming the held state
       (STRATIMUX HOLDS: openFiles/tabOrder/activeFilePath/editorSettings live on the
       graphiteScribe concept; this surface renders + dispatches the editor-holding six;
       /editor-fs is the ONLY fs transfer). The CM6 contenteditable is the ONE lawful
       exception to the SCS Input Components law; the path opener rides ScsInput. -->
  <div class="ce-surface">
    <div class="ce-open-row">
      <ScsInput
        v-model="openPathInput"
        class="ce-path-input"
        data-testid="ce-path-input"
        placeholder="path from SCP root · e.g. scp.config.json"
        @keydown.enter="openByPath"
      />
      <button class="ce-btn" data-testid="ce-open-btn" @click="openByPath">Open</button>
      <button
        class="ce-btn"
        data-testid="ce-save-btn"
        :disabled="!activeHeld || !activeHeld.dirty"
        @click="saveActive"
      >
        Save
      </button>
      <button class="ce-btn" data-testid="ce-settings-btn" @click="showSettings = !showSettings">
        ⚙
      </button>
      <span v-if="openError" class="ce-open-error" data-testid="ce-open-error">{{ openError }}</span>
    </div>

    <!-- MD-CE-6 · THE SETTINGS PANEL — drives graphiteScribeSetEditorSettings; every change
         persists (localStorage + editorConfig.json via /editor-fs/write) and live-applies
         (the view rebuilds off the settings watch). ScsInput for text-entry (the SCS law);
         toggles are buttons (not text-entry — outside the law's mandate). -->
    <div v-if="showSettings" class="ce-settings-panel" data-testid="ce-settings-panel">
      <div class="ce-setting-row">
        <span class="ce-setting-label">vim</span>
        <button
          class="ce-btn ce-toggle"
          data-testid="ce-set-vim"
          :class="{ on: editorSettings.vimEnabled }"
          @click="applySettings({ vimEnabled: !editorSettings.vimEnabled })"
        >
          {{ editorSettings.vimEnabled ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="ce-setting-row">
        <span class="ce-setting-label">word wrap</span>
        <button
          class="ce-btn ce-toggle"
          data-testid="ce-set-wrap"
          :class="{ on: editorSettings.wordWrap }"
          @click="applySettings({ wordWrap: !editorSettings.wordWrap })"
        >
          {{ editorSettings.wordWrap ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="ce-setting-row">
        <span class="ce-setting-label">autosave</span>
        <button
          class="ce-btn ce-toggle"
          data-testid="ce-set-autosave"
          :class="{ on: editorSettings.autosaveEnabled }"
          @click="applySettings({ autosaveEnabled: !editorSettings.autosaveEnabled })"
        >
          {{ editorSettings.autosaveEnabled ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="ce-setting-row">
        <span class="ce-setting-label">font size</span>
        <ScsInput
          type="number"
          class="ce-setting-input"
          data-testid="ce-set-fontsize"
          :model-value="String(editorSettings.fontSize)"
          @update:model-value="(v: string | undefined) => applyNumeric('fontSize', v, 8, 32)"
        />
      </div>
      <div class="ce-setting-row">
        <span class="ce-setting-label">tab size</span>
        <ScsInput
          type="number"
          class="ce-setting-input"
          data-testid="ce-set-tabsize"
          :model-value="String(editorSettings.tabSize)"
          @update:model-value="(v: string | undefined) => applyNumeric('tabSize', v, 1, 8)"
        />
      </div>
      <div class="ce-setting-row">
        <span class="ce-setting-label">autosave ms</span>
        <ScsInput
          type="number"
          class="ce-setting-input"
          data-testid="ce-set-autosavems"
          :model-value="String(editorSettings.autosaveDelayMs)"
          @update:model-value="(v: string | undefined) => applyNumeric('autosaveDelayMs', v, 200, 30000)"
        />
      </div>
    </div>

    <div v-if="tabOrder.length" class="ce-tab-strip" data-testid="ce-tab-strip">
      <button
        v-for="path in tabOrder"
        :key="path"
        :class="['ce-tab', { active: path === activeFilePath }]"
        :data-testid="'ce-tab'"
        :data-path="path"
        @click="activateTab(path)"
      >
        <span v-if="openFiles[path]?.dirty" class="ce-dirty-dot" data-testid="ce-dirty-dot">●</span>
        <span class="ce-tab-label">{{ tabLabel(path) }}</span>
        <span class="ce-tab-close" @click.stop="closeTab(path)">×</span>
      </button>
    </div>

    <div v-show="activeFilePath" ref="editorWrap" class="ce-editor-wrap">
      <div ref="editorHost" class="ce-editor-host" data-testid="ce-editor-host"></div>
      <!-- BO-4 · THE SEND FLOATER — the SAME Aspirant element, placed by the selection's
           bounding box (coordsAtPos), hovering below the selection over the editor. -->
      <div
        v-if="selectionLength > 0"
        class="ce-aspirant-floater"
        data-testid="ce-aspirant-floater"
        :style="{ top: floaterTop + 'px', left: floaterLeft + 'px' }"
      >
        <ScsInput
          v-model="aspirantPrompt"
          class="ce-aspirant-prompt"
          data-testid="ce-aspirant-prompt"
          placeholder="prompt to send with the selection…"
        />
        <ScsDropdown
          v-model="aspirantSessionId"
          class="ce-aspirant-picker"
          data-testid="ce-aspirant-picker"
          :options="aspirantSessionOptions"
          placeholder="session…"
        />
        <button
          class="ce-btn"
          data-testid="ce-aspirant-send"
          :disabled="!aspirantSessionId || selectionLength === 0 || !aspirantPrompt.trim()"
          @click="sendAspirant"
        >
          Send
        </button>
        <span v-if="aspirantStatus" class="ce-aspirant-status" data-testid="ce-aspirant-status">{{
          aspirantStatus
        }}</span>
      </div>
    </div>
    <div v-if="!activeFilePath" class="ce-empty-pane" data-testid="ce-empty-pane">
      No file open — enter a path above and Open.
    </div>

    <div class="ce-status-strip">
      <!-- C907 · VIM AS A TOGGLE — rides the existing vimEnabled setting (the view rebuilds
           on any settings change · MD-CE-6); Pewter pill, ON = green, OFF = base. -->
      <button
        type="button"
        :class="['hifi-btn', editorSettings.vimEnabled ? 'hifi-btn-green' : 'hifi-btn-base', 'ce-vim-toggle']"
        data-testid="ce-vim-toggle"
        :title="editorSettings.vimEnabled ? 'Vim keybindings ON — click for standard editing' : 'Standard editing — click for Vim keybindings'"
        @click="dispatchQuality((e) => e.graphiteScribeSetEditorSettings({ settings: { vimEnabled: !editorSettings.vimEnabled } }))"
      >VIM {{ editorSettings.vimEnabled ? 'ON' : 'OFF' }}</button>
      <span class="ce-status-mode" data-testid="ce-mode">{{ editorSettings.vimEnabled ? vimMode : 'standard' }}</span>
      <span class="ce-status-path" data-testid="ce-active-path">{{ activeFilePath || '—' }}</span>
      <span class="ce-status-dirty" data-testid="ce-dirty-state">{{
        activeHeld ? (activeHeld.dirty ? 'MODIFIED' : 'saved') : ''
      }}</span>
      <span class="ce-status-sel" data-testid="ce-selection-len">{{
        selectionLength > 0 ? selectionLength + ' selected' : ''
      }}</span>
    </div>

</div>
</template>

<script setup lang="ts">
/**
 * MD-CE-4 · GraphiteScribeSurface — the real editor island.
 *
 * The C426/C428 scratch idioms carried over: dynamic CM6 import in onMounted
 * (SSR-clean) · vim() BEFORE basicSetup (keymap precedence) · updateListener ·
 * vim-mode-change readout · window probes for the NP choreography.
 *
 * THE SYNC DISCIPLINE (the two-way loop guard): the CM6 view is REBUILT per
 * active-file swap (buffers persist on the concept — no loss); the updateListener
 * dispatches graphiteScribeUpdateBuffer ONLY when suppressDispatch is off (programmatic
 * doc sets raise it); the stage-plan mirror only rebuilds the view when the active
 * path CHANGES (held-content drift while the same file is active is the editor's
 * own typing echoing back — never re-set the doc from it).
 *
 * THE SAVE CIRCUIT: Mod-s (high-precedence keymap) anor vim :w → POST
 * /editor-fs/write → {ok:true} → dispatch graphiteScribeMarkFileSaved (the mark NEVER
 * precedes the disk artifact).
 *
 * Citation: GraphiteScribeLanding.vue (stage-plan mirror + dispatch idiom).
 * Citation: STRATIMUX-VUE-REFERENCE.md "🎯 Essential Vue-Stratimux Integration Patterns".
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import type { Muxium } from 'stratimux';
import type { ClientMuxiumDeck } from '../../../client/client.muxonomy';
import type { GraphiteScribeOpenFile, GraphiteScribeSettings } from '../../graphiteScribe.type';
import ScsInput from '../../../vue/components/ScsInput.vue';
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';
import { openFileThroughEditorFs } from '../../model/graphiteScribeOpenCircuit.model';
// MD-CE-8 · THE ASPIRANT rides the controller's triggerSendMessage rail (the origin lane +
// relay queue + ensure-sent canon) and its sessionsList ground — no new transport.
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';

const props = defineProps<{
  muxium: Muxium<ClientMuxiumDeck> | null;
}>();

// --- Mirrored held state (the stage-plan subscription below).
const openFiles = ref<Record<string, GraphiteScribeOpenFile>>({});
const tabOrder = ref<string[]>([]);
const activeFilePath = ref<string>('');
const editorSettings = ref<GraphiteScribeSettings>({
  vimEnabled: true,
  autosaveEnabled: false,
  autosaveDelayMs: 1500,
  tabSize: 2,
  fontSize: 14,
  wordWrap: false,
});

const openPathInput = ref<string>('');
// BO-4 · the floater geometry (wrapper-relative px, measured from coordsAtPos).
const editorWrap = ref<HTMLElement | null>(null);
const floaterTop = ref<number>(0);
const floaterLeft = ref<number>(0);
const openError = ref<string>('');
const vimMode = ref<string>('normal');
const editorHost = ref<HTMLElement | null>(null);
const showSettings = ref<boolean>(false);

// MD-CE-8 · THE ASPIRANT state — selection tracked off the CM6 updateListener; the
// composed payload = prompt + fenced selection block with path:line context.
const selectionLength = ref<number>(0);
const selectionText = ref<string>('');
const selectionFromLine = ref<number>(0);
const selectionToLine = ref<number>(0);
const aspirantPrompt = ref<string>('');
const aspirantSessionId = ref<string>('');
const aspirantStatus = ref<string>('');

const aspirantSessionOptions = computed<Array<{ value: string; label: string }>>(() => {
  const list = getGlobalScsBridgeController()?.sessionsList.value ?? [];
  return list
    .filter((s) => s.status === 'launched' || s.status === 'allocated')
    .map((s) => ({
      value: s.id,
      // The DPCO display priority: scsLabel > displayName > shortId.
      label: s.scsLabel ?? s.displayName ?? s.id.slice(0, 8),
    }));
});

function composeAspirantPayload(): string {
  const path = activeFilePath.value;
  const lines =
    selectionFromLine.value === selectionToLine.value
      ? `line ${selectionFromLine.value}`
      : `lines ${selectionFromLine.value}-${selectionToLine.value}`;
  return (
    aspirantPrompt.value.trim() +
    '\n\n```\n' +
    `// ${path} (${lines})\n` +
    selectionText.value +
    '\n```\n'
  );
}

async function sendAspirant(): Promise<void> {
  const controller = getGlobalScsBridgeController();
  if (!controller) {
    aspirantStatus.value = 'no-controller';
    return;
  }
  if (!aspirantSessionId.value || selectionLength.value === 0 || !aspirantPrompt.value.trim()) {
    return;
  }
  aspirantStatus.value = 'sending…';
  // C912 · IN-FOCUS SEND (the Shatterite askMore law · C868/C871): focus the session FIRST
  // so the user watches the Aspirant land, and the relay HOLDS focus there (inFocus: true —
  // no refocus-return to the SCP).
  controller.triggerFocusSession(aspirantSessionId.value);
  const result = await controller.triggerSendMessage(
    aspirantSessionId.value,
    composeAspirantPayload(),
    { inFocus: true },
  );
  aspirantStatus.value = result.ok ? 'sent ✓' : `failed: ${result.error ?? 'unknown'}`;
  if (result.ok) aspirantPrompt.value = '';
}

// MD-CE-6 · THE SETTINGS RAIL — factory (state defaults) < editorConfig.json < localStorage.
const SETTINGS_STORAGE_KEY = 'ceEditorSettings';
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function applySettings(partial: Partial<GraphiteScribeSettings>): void {
  dispatchQuality((e) => e.graphiteScribeSetEditorSettings({ settings: partial }));
  // Persist the MERGED settings on both rails (localStorage instant · file via /editor-fs/write).
  const merged = { ...editorSettings.value, ...partial };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* storage unavailable — the file rail still persists */
  }
  void fetch('/editor-fs/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'editorConfig.json', content: JSON.stringify(merged, null, 2) + '\n' }),
  });
}

function applyNumeric(key: 'fontSize' | 'tabSize' | 'autosaveDelayMs', v: string | undefined, min: number, max: number): void {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return;
  applySettings({ [key]: n } as Partial<GraphiteScribeSettings>);
}

async function loadSettingsRail(): Promise<void> {
  let fileOverrides: Partial<GraphiteScribeSettings> = {};
  try {
    const res = await fetch('/editor-config');
    const body = (await res.json()) as Partial<GraphiteScribeSettings>;
    if (body && typeof body === 'object') fileOverrides = body;
  } catch {
    /* no file rail — factory + localStorage only */
  }
  let localOverrides: Partial<GraphiteScribeSettings> = {};
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) localOverrides = JSON.parse(raw) as Partial<GraphiteScribeSettings>;
  } catch {
    /* malformed local — ignore */
  }
  const merged = { ...fileOverrides, ...localOverrides };
  if (Object.keys(merged).length > 0) {
    dispatchQuality((e) => e.graphiteScribeSetEditorSettings({ settings: merged }));
  }
}

const activeHeld = computed<GraphiteScribeOpenFile | null>(
  () => openFiles.value[activeFilePath.value] ?? null,
);

let stagePlanner: { conclude: () => void } | null = null;
let view: { destroy: () => void; state: { doc: { toString: () => string } }; focus: () => void; hasFocus: boolean } | null = null;
let cmModules: {
  EditorView: any;
  basicSetup: any;
  keymap: any;
  Prec: any;
  EditorState: any;
  vim: any;
  getCM: any;
  Vim: any;
} | null = null;
// The loop guard: raised while WE set the doc programmatically — the updateListener
// must not echo a programmatic set back into graphiteScribeUpdateBuffer.
let suppressDispatch = false;
// The path the live view was built for (rebuild trigger discriminator).
let viewPath = '';

function deck() {
  const m = props.muxium as Muxium<ClientMuxiumDeck> | null;
  return m ? (m as any).deck.d.client.d.graphiteScribe : null;
}

function dispatchQuality(builder: (e: any) => unknown): void {
  const m = props.muxium as any;
  const d = deck();
  if (!m || !d) return;
  m.dispatch(builder(d.e));
}

function tabLabel(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

// --- The transfer legs (MD-CE-2 contracts · same-origin). Open rides THE SHARED
// OPEN CIRCUIT (graphiteScribeOpenCircuit.model — the file tree uses the same one).
async function openByPath(): Promise<void> {
  const path = openPathInput.value.trim();
  openError.value = '';
  if (!path) return;
  const err = await openFileThroughEditorFs(props.muxium, path);
  if (err) {
    openError.value = err;
    return;
  }
  openPathInput.value = '';
}

async function saveActive(): Promise<boolean> {
  const held = activeHeld.value;
  if (!held) return false;
  try {
    const res = await fetch('/editor-fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: held.path, content: held.content }),
    });
    const body = (await res.json()) as { ok: boolean };
    if (body.ok) {
      // The disk artifact exists — NOW the mark (never before).
      dispatchQuality((e) => e.graphiteScribeMarkFileSaved({ path: held.path }));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function activateTab(path: string): void {
  dispatchQuality((e) => e.graphiteScribeSetActiveFile({ path }));
}

function closeTab(path: string): void {
  dispatchQuality((e) => e.graphiteScribeCloseFile({ path }));
}

// --- The CM6 view lifecycle (rebuild per active-file swap · vimEnabled gate).
function destroyView(): void {
  if (view) {
    view.destroy();
    view = null;
  }
  viewPath = '';
}

function buildView(): void {
  if (!cmModules || !editorHost.value) return;
  const held = activeHeld.value;
  if (!held) {
    destroyView();
    return;
  }
  destroyView();
  const { EditorView, basicSetup, keymap, Prec, vim, getCM, Vim, EditorState } = cmModules;
  const extensions: unknown[] = [];
  if (editorSettings.value.vimEnabled) {
    extensions.push(vim()); // vim() FIRST — its keymap must precede basicSetup's.
  }
  // MD-CE-6 · settings-driven extensions (the view rebuilds on ANY settings change).
  if (editorSettings.value.wordWrap) {
    extensions.push(EditorView.lineWrapping);
  }
  extensions.push(EditorState.tabSize.of(editorSettings.value.tabSize));
  extensions.push(
    basicSetup,
    Prec.high(
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            void saveActive();
            return true;
          },
        },
      ]),
    ),
    EditorView.updateListener.of((u: any) => {
      // MD-CE-8 · the Aspirant's selection mirror (docChanged moves selections too).
      if (u.selectionSet || u.docChanged || u.geometryChanged) {
        const sel = u.state.selection.main;
        selectionLength.value = sel.to - sel.from;
        selectionText.value = sel.empty ? '' : u.state.sliceDoc(sel.from, sel.to);
        selectionFromLine.value = u.state.doc.lineAt(sel.from).number;
        selectionToLine.value = u.state.doc.lineAt(sel.to).number;
        // BO-4 · the bounding-box placement: the floater anchors at the selection END's
        // bottom edge, clamped inside the wrapper. Re-measures on every geometry change
        // (typing · selection motion · viewport scroll).
        if (!sel.empty && editorWrap.value) {
          try {
            const c = u.view.coordsAtPos(sel.to);
            if (c) {
              const wrap = editorWrap.value.getBoundingClientRect();
              const width = 460; // the floater's approximate width for the right clamp
              floaterTop.value = Math.max(0, c.bottom - wrap.top + 6);
              floaterLeft.value = Math.min(
                Math.max(0, c.left - wrap.left),
                Math.max(0, wrap.width - width),
              );
            }
          } catch {
            /* coordsAtPos can throw for off-viewport positions — keep the last box */
          }
        }
      }
      if (u.docChanged && !suppressDispatch) {
        const path = viewPath;
        const content = u.state.doc.toString();
        dispatchQuality((e) => e.graphiteScribeUpdateBuffer({ path, content }));
        // MD-CE-6 · AUTOSAVE — debounced save after the configured quiet period.
        if (editorSettings.value.autosaveEnabled) {
          if (autosaveTimer) clearTimeout(autosaveTimer);
          autosaveTimer = setTimeout(() => {
            void saveActive();
          }, editorSettings.value.autosaveDelayMs);
        }
      }
    }),
    EditorView.theme({
      '&': { backgroundColor: '#141414', color: '#e8e8e8', fontSize: `${editorSettings.value.fontSize}px` },
      '.cm-content': { fontFamily: "ui-monospace, 'SF Mono', 'Menlo', monospace" },
      '.cm-gutters': { backgroundColor: '#1a1a1a', color: '#666', border: 'none' },
      '&.cm-focused': { outline: '1px solid rgba(34,197,94,0.55)' },
    }),
  );
  const v = new EditorView({
    doc: held.content,
    parent: editorHost.value,
    extensions,
  });
  view = v;
  viewPath = held.path;
  if (editorSettings.value.vimEnabled) {
    const cm = getCM(v);
    if (cm) {
      // vim :w rides the SAME write→mark circuit as Mod-s.
      Vim.defineEx('write', 'w', () => {
        void saveActive();
      });
      cm.on('vim-mode-change', (e: { mode?: string }) => {
        vimMode.value = e?.mode ?? 'unknown';
      });
    }
    vimMode.value = 'normal';
  } else {
    vimMode.value = 'no-vim';
  }
}

// Rebuild ONLY on active-path change (same-path held-content drift = our own echo).
watch(activeFilePath, () => {
  if (activeFilePath.value !== viewPath) buildView();
});
// MD-CE-6 · ANY view-affecting setting rebuilds in place (same doc — the held buffer is
// authoritative). vimEnabled · fontSize · wordWrap · tabSize all flow through buildView.
watch(
  () => [
    editorSettings.value.vimEnabled,
    editorSettings.value.fontSize,
    editorSettings.value.wordWrap,
    editorSettings.value.tabSize,
  ],
  () => {
    if (activeFilePath.value) buildView();
  },
);

// The stage-plan mirror (DECK K · selectors on the four held keys). Bound LAZILY: the
// parent landing assigns its muxium in onMounted AFTER the first render, so this surface
// may mount with a null prop — the watcher below binds the instant the muxium arrives
// (the C431 reactive hand-off cure).
function bindStagePlan(m: Muxium<ClientMuxiumDeck>): void {
  if (stagePlanner) return;
  stagePlanner = m.plan<ClientMuxiumDeck>('graphiteScribeSurfaceSubscription', ({ staging, stage, d__ }) =>
    staging(() => [
      stage(
        ({ d }: any) => {
          openFiles.value = d.client.d.graphiteScribe.k.openFiles.select();
          tabOrder.value = d.client.d.graphiteScribe.k.tabOrder.select();
          activeFilePath.value = d.client.d.graphiteScribe.k.activeFilePath.select();
          editorSettings.value = d.client.d.graphiteScribe.k.editorSettings.select();
        },
        {
          selectors: [
            (d__ as any).client.d.graphiteScribe.k.openFiles,
            (d__ as any).client.d.graphiteScribe.k.tabOrder,
            (d__ as any).client.d.graphiteScribe.k.activeFilePath,
            (d__ as any).client.d.graphiteScribe.k.editorSettings,
          ],
        },
      ),
    ]),
  );
}

watch(
  () => props.muxium,
  (m) => {
    if (m) bindStagePlan(m as Muxium<ClientMuxiumDeck>);
  },
);

onMounted(async () => {
  if (typeof window === 'undefined') return;

  const m = props.muxium as Muxium<ClientMuxiumDeck> | null;
  if (m) bindStagePlan(m);

  // Client-only CM6 (the C426 idiom — dynamic import keeps the SSR pass clean).
  const [cm, vimMod, viewMod, stateMod] = await Promise.all([
    import('codemirror'),
    import('@replit/codemirror-vim'),
    import('@codemirror/view'),
    import('@codemirror/state'),
  ]);
  cmModules = {
    EditorView: cm.EditorView,
    basicSetup: cm.basicSetup,
    keymap: viewMod.keymap,
    Prec: stateMod.Prec,
    EditorState: stateMod.EditorState,
    vim: vimMod.vim,
    getCM: vimMod.getCM,
    Vim: vimMod.Vim,
  };
  // MD-CE-6 · the boot rail — file overrides under localStorage overrides, dispatched once.
  await loadSettingsRail();
  if (activeFilePath.value) buildView();

  // NP probes (the choreography instruments — the surface's own, scratch-style).
  (window as any).__ceSurfaceDoc = () => (view ? view.state.doc.toString() : '');
  (window as any).__ceSurfaceState = () => ({
    activeFilePath: activeFilePath.value,
    tabOrder: [...tabOrder.value],
    dirty: activeHeld.value?.dirty ?? null,
    vimMode: vimMode.value,
  });
  (window as any).__ceSurfaceSettings = () => ({ ...editorSettings.value });
  // MD-CE-8 · the Aspirant probe — the composed payload WITHOUT sending (the no-live-session
  // smoke asserts composition; the send leg is the user-Lambda).
  (window as any).__ceAspirant = () => ({
    selectionLength: selectionLength.value,
    selectionLines: [selectionFromLine.value, selectionToLine.value],
    sessionCount: aspirantSessionOptions.value.length,
    sessionId: aspirantSessionId.value,
    composed: aspirantPrompt.value.trim() ? composeAspirantPayload() : '',
  });
  (window as any).__ceSurfaceFocus = () => {
    if (!view) return false;
    view.focus();
    return view.hasFocus;
  };
});

onBeforeUnmount(() => {
  destroyView();
  if (stagePlanner) stagePlanner.conclude();
  delete (window as any).__ceSurfaceDoc;
  delete (window as any).__ceSurfaceState;
  delete (window as any).__ceSurfaceFocus;
});
</script>

<style scoped>
.ce-surface {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ce-open-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.ce-path-input {
  flex: 1;
  min-width: 200px;
}
.ce-btn {
  padding: 0.35rem 0.9rem;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 4px;
  color: #e8e8e8;
  cursor: pointer;
  font-size: 0.8rem;
}
.ce-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.ce-btn:not(:disabled):hover {
  background: rgba(34, 197, 94, 0.25);
}
.ce-open-error {
  color: #f87171;
  font-size: 0.75rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
}
.ce-settings-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.6rem;
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
}
.ce-setting-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.ce-setting-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.55);
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  text-transform: uppercase;
}
.ce-setting-input {
  width: 70px;
}
.ce-toggle.on {
  background: rgba(34, 197, 94, 0.35);
}
.ce-tab-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.ce-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 0.75rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
}
.ce-tab.active {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.45);
  color: #e8e8e8;
}
.ce-dirty-dot {
  color: #fbbf24;
  font-size: 0.6rem;
}
.ce-tab-close {
  opacity: 0.5;
  padding: 0 0.15rem;
}
.ce-tab-close:hover {
  opacity: 1;
  color: #f87171;
}
.ce-editor-host {
  min-height: 320px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0 4px 4px 4px;
  overflow: hidden;
}
.ce-empty-pane {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}
.ce-status-strip {
  display: flex;
  gap: 1.25rem;
  padding: 0.3rem 0.6rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  font-size: 0.72rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
}
.ce-status-mode {
  color: rgb(34, 197, 94);
  text-transform: uppercase;
}
.ce-status-path {
  color: rgba(255, 255, 255, 0.6);
  flex: 1;
}
.ce-status-dirty {
  color: #fbbf24;
}
.ce-status-sel {
  color: rgba(147, 197, 253, 0.85);
}
.ce-editor-wrap {
  position: relative;
}
.ce-aspirant-floater {
  position: absolute;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(147, 197, 253, 0.45);
  border-radius: 6px;
  background: rgba(10, 14, 20, 0.92);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  max-width: 460px;
}
.ce-aspirant-prompt {
  flex: 1;
  min-width: 160px;
}
.ce-aspirant-picker {
  min-width: 140px;
}
.ce-aspirant-status {
  font-size: 0.72rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  color: rgba(147, 197, 253, 0.9);
}

/* C907 · the Vim toggle pill (status strip). */
.ce-vim-toggle { cursor: pointer; font: inherit; font-size: 0.62rem; padding: 0.15rem 0.5rem; }

/* C908 · THE OSR CURSOR (the ScsInput drawn-caret law sampled): CM6's standard cursor is a
   BLACK hairline (drawSelection default) — invisible on the dark ground, while vim's
   fat-cursor paints its own block (why VIM 'worked'). Paint the caret HiFi yellow, keep it
   visible even when the OSR focus state wavers, and tint drag selections. */
:deep(.cm-cursor), :deep(.cm-dropCursor) {
  border-left: 2px solid var(--color-yellow, #eab308);
  margin-left: 0;
}
:deep(.cm-editor .cm-cursor) { display: block; }
:deep(.cm-content) { caret-color: var(--color-yellow, #eab308); }
:deep(.cm-selectionBackground),
:deep(.cm-editor ::selection) {
  background: color-mix(in srgb, var(--color-blue, #38bdf8) 30%, transparent) !important;
}
</style>
