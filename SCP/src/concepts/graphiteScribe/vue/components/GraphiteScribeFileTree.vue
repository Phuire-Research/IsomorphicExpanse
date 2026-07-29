<template>
  <!-- MD-CE-5 · THE FILE BROWSER — own-drawn lazy tree (the C418 spine: per-expand
       GET /editor-fs/list · NO eager recursion). One component renders ONE directory
       level and recurses into itself per expanded child dir. GitM badges suffix-match
       the repo-root-relative gitm.json paths against SCP-root-relative tree paths. -->
  <ul class="ce-tree-level" :data-depth="depth">
    <li v-for="(entry, i) in entries" :key="entry.name" class="ce-tree-node">
      <template v-if="entry.type === 'dir'">
        <div class="ce-tree-rowwrap">
        <button
          :class="['ce-tree-row', 'ce-tree-dir', `rot-${(i % 7) + 1}`]"
          @contextmenu.prevent.stop="openCtx($event, entry)"
          data-testid="ce-tree-dir"
          :data-path="childPath(entry.name)"
          @click="toggleDir(entry.name)"
        >
          <span class="ce-tree-arrow">{{ expanded[entry.name] ? '▾' : '▸' }}</span>
          <span class="ce-tree-name">{{ entry.name }}</span>
          <span v-if="dirBadge(entry.name)" class="ce-tree-badge ce-badge-dir">●</span>
        </button>
        <!-- MD-CE Close · the context affordances (C453): mkdir · rename · delete (armed) -->
        <span class="ce-tree-ops">
          <button class="ce-op" data-testid="ce-op-mkdir" :data-path="childPath(entry.name)" title="new folder inside" @click.stop="startMkdir(entry.name)">＋</button>
          <button class="ce-op" data-testid="ce-op-rename" :data-path="childPath(entry.name)" title="rename" @click.stop="startRename(entry.name)">✎</button>
          <button :class="['ce-op', { armed: armedDelete === childPath(entry.name) }]" data-testid="ce-op-delete" :data-path="childPath(entry.name)" :title="armedDelete === childPath(entry.name) ? 'click again to delete (empty dirs only)' : 'delete'" @click.stop="pressDelete(entry.name)">✕</button>
        </span>
        </div>
        <div v-if="renamingName === entry.name" class="ce-tree-inline">
          <ScsInput v-model="inlineValue" class="ce-inline-input" data-testid="ce-rename-input" @keydown.enter="commitRename(entry.name)" @keydown.escape="cancelInline" />
        </div>
        <div v-if="mkdirIn === entry.name" class="ce-tree-inline">
          <ScsInput v-model="inlineValue" class="ce-inline-input" data-testid="ce-mkdir-input" placeholder="new folder name" @keydown.enter="commitMkdir(entry.name)" @keydown.escape="cancelInline" />
        </div>
        <GraphiteScribeFileTree
          v-if="expanded[entry.name]"
          :muxium="muxium"
          :dir="childPath(entry.name)"
          :depth="depth + 1"
          :badges="badges"
        />
      
  <!-- C907 · THE FILE CONTEXT MENU — in-DOM (the WIRE.2 OSR law: no native menu can open
       offscreen) · fixed + viewport-clamped · VS Code grouping (paths first · then ops). -->
  <Teleport to="body">
    <div
      v-if="ctx.open"
      class="ce-ctx"
      data-testid="ce-ctx-menu"
      :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }"
      @click.stop
      @contextmenu.prevent
    >
      <div class="ce-ctx-path mono">{{ ctx.path }}</div>
      <button class="ce-ctx-item" data-testid="ce-ctx-copy-path" @click="ctxCopy('absolute')">Copy Path</button>
      <button class="ce-ctx-item" data-testid="ce-ctx-copy-rel" @click="ctxCopy('relative')">Copy Relative Path</button>
      <button class="ce-ctx-item" @click="ctxCopy('name')">Copy Name</button>
      <div class="ce-ctx-sep"></div>
      <button class="ce-ctx-item" @click="ctxRename()">Rename</button>
      <button v-if="ctx.isDir" class="ce-ctx-item" @click="ctxMkdir()">New Folder Inside</button>
      <button class="ce-ctx-item ce-ctx-danger" @click="ctxDelete()">Delete</button>
      <div v-if="ctxNote" class="ce-ctx-note">{{ ctxNote }}</div>
    </div>
  </Teleport>
</template>
      <template v-else>
        <div class="ce-tree-rowwrap">
        <button
          :class="['ce-tree-row', 'ce-tree-file', `rot-${(i % 7) + 1}`]"
          data-testid="ce-tree-file"
          :data-path="childPath(entry.name)"
          @click="openFile(entry.name)"
          @contextmenu.prevent.stop="openCtx($event, entry)"
        >
          <span class="ce-tree-arrow"></span>
          <span class="ce-tree-name">{{ entry.name }}</span>
          <span
            v-if="badges[childPath(entry.name)]"
            :class="['ce-tree-badge', 'ce-badge-' + badges[childPath(entry.name)]]"
            data-testid="ce-tree-badge"
            >{{ badges[childPath(entry.name)] }}</span
          >
        </button>
        <span class="ce-tree-ops">
          <button class="ce-op" data-testid="ce-op-rename" :data-path="childPath(entry.name)" title="rename" @click.stop="startRename(entry.name)">✎</button>
          <button :class="['ce-op', { armed: armedDelete === childPath(entry.name) }]" data-testid="ce-op-delete" :data-path="childPath(entry.name)" :title="armedDelete === childPath(entry.name) ? 'click again to delete' : 'delete'" @click.stop="pressDelete(entry.name)">✕</button>
        </span>
        </div>
        <div v-if="renamingName === entry.name" class="ce-tree-inline">
          <ScsInput v-model="inlineValue" class="ce-inline-input" data-testid="ce-rename-input" @keydown.enter="commitRename(entry.name)" @keydown.escape="cancelInline" />
        </div>
      </template>
    </li>
    <li v-if="loadError" class="ce-tree-error">{{ loadError }}</li>
  </ul>
</template>

<script setup lang="ts">
/**
 * MD-CE-5 · GraphiteScribeFileTree — one lazy directory level, self-recursive.
 *
 * The level fetches its OWN listing on mount (the parent only mounts it when
 * expanded — v-if — so expansion IS the lazy trigger). File click rides the
 * SHARED open circuit (graphiteScribeOpenCircuit.model — the same fetch+dispatch
 * the MD-CE-4 surface opener uses).
 *
 * Badges: 'M' unstaged · 'U' untracked · 'A' staged · 'C' conflict — computed
 * by the PARENT (the Zone 3 owner reads gitmJson off the global gitmController)
 * and passed down as one flat Record keyed by SCP-root-relative path.
 */
import { ref, onMounted } from 'vue';
import { openFileThroughEditorFs } from '../../model/graphiteScribeOpenCircuit.model';
import ScsInput from '../../../vue/components/ScsInput.vue';

defineOptions({ name: 'GraphiteScribeFileTree' });

const props = withDefaults(
  defineProps<{
    muxium: unknown;
    dir?: string;
    depth?: number;
    badges?: Record<string, string>;
  }>(),
  { dir: '.', depth: 0, badges: () => ({}) },
);

type TreeEntry = { name: string; type: 'file' | 'dir' };

const entries = ref<TreeEntry[]>([]);
const expanded = ref<Record<string, boolean>>({});
const loadError = ref<string>('');

function childPath(name: string): string {
  return props.dir === '.' ? name : `${props.dir}/${name}`;
}

function toggleDir(name: string): void {
  expanded.value = { ...expanded.value, [name]: !expanded.value[name] };
}

// A dir shows the change dot when ANY badge path lives under it.
function dirBadge(name: string): boolean {
  const prefix = childPath(name) + '/';
  return Object.keys(props.badges).some((p) => p.startsWith(prefix));
}

async function openFile(name: string): Promise<void> {
  const err = await openFileThroughEditorFs(props.muxium, childPath(name));
  if (err) loadError.value = err;
}

// MD-CE Close (C453) · THE CONTEXT AFFORDANCES — rename · delete (two-click armed · the
// OSR-safe confirm: no native dialog can open offscreen) · mkdir. Every op rides the
// EXISTING /editor-fs endpoints; the level reloads after each. The rename field is
// ScsInput (the SCS law).
const renamingName = ref<string>('');
const mkdirIn = ref<string>('');
const inlineValue = ref<string>('');
const armedDelete = ref<string>('');

// C907 · THE CONTEXT MENU (in-DOM · OSR-safe). The critical op is COPY PATH: absolute =
// the SCP package root (derived once from /scp-config extendedRoot) + the tree-relative
// path; relative = the tree path itself. Clipboard: navigator.clipboard with the
// execCommand fallback. Click-away + Escape close; viewport-clamped at open.
const ctx = ref<{ open: boolean; x: number; y: number; name: string; path: string; isDir: boolean }>({
  open: false, x: 0, y: 0, name: '', path: '', isDir: false,
});
const ctxNote = ref<string>('');
const scpRoot = ref<string>('');
async function ensureScpRoot(): Promise<string> {
  if (scpRoot.value) return scpRoot.value;
  try {
    const r = await fetch('/scp-config');
    if (r.ok) {
      const j = (await r.json()) as { extendedRoot?: string };
      if (typeof j.extendedRoot === 'string') {
        scpRoot.value = j.extendedRoot.replace(/\/Cascades\/Extended$/, '');
      }
    }
  } catch { /* absent → relative-only copies (honest) */ }
  return scpRoot.value;
}
function openCtx(e: MouseEvent, entry: TreeEntry): void {
  const MENU_W = 220;
  const MENU_H = 240;
  ctx.value = {
    open: true,
    x: Math.min(e.clientX, Math.max(0, window.innerWidth - MENU_W)),
    y: Math.min(e.clientY, Math.max(0, window.innerHeight - MENU_H)),
    name: entry.name,
    path: childPath(entry.name),
    isDir: entry.type === 'dir',
  };
  ctxNote.value = '';
  void ensureScpRoot();
}
function closeCtx(): void { ctx.value = { ...ctx.value, open: false }; }
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch { return false; }
  }
}
async function ctxCopy(kind: 'absolute' | 'relative' | 'name'): Promise<void> {
  let text = ctx.value.path;
  if (kind === 'name') text = ctx.value.name;
  if (kind === 'absolute') {
    const root = await ensureScpRoot();
    text = root ? `${root}/${ctx.value.path}` : ctx.value.path;
  }
  const ok = await writeClipboard(text);
  ctxNote.value = ok ? 'copied' : 'copy failed';
  setTimeout(closeCtx, ok ? 450 : 1200);
}
function ctxRename(): void { startRename(ctx.value.name); closeCtx(); }
function ctxMkdir(): void { startMkdir(ctx.value.name); closeCtx(); }
function ctxDelete(): void { pressDelete(ctx.value.name); closeCtx(); }
onMounted(() => {
  window.addEventListener('click', closeCtx);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCtx(); });
});

function cancelInline(): void {
  renamingName.value = '';
  mkdirIn.value = '';
  inlineValue.value = '';
}

function startRename(name: string): void {
  cancelInline();
  armedDelete.value = '';
  renamingName.value = name;
  inlineValue.value = name;
}

function startMkdir(name: string): void {
  cancelInline();
  armedDelete.value = '';
  mkdirIn.value = name;
}

async function postOp(url: string, body: Record<string, unknown>): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as { ok: boolean; error?: string };
    return j.ok ? '' : (j.error ?? 'op-failed');
  } catch {
    return 'fetch-failed';
  }
}

async function commitRename(name: string): Promise<void> {
  const next = inlineValue.value.trim();
  if (!next || next === name) {
    cancelInline();
    return;
  }
  const from = childPath(name);
  const to = props.dir === '.' ? next : `${props.dir}/${next}`;
  const err = await postOp('/editor-fs/rename', { from, to });
  if (err) loadError.value = err;
  cancelInline();
  await loadLevel();
}

async function commitMkdir(name: string): Promise<void> {
  const folder = inlineValue.value.trim();
  if (!folder) {
    cancelInline();
    return;
  }
  const err = await postOp('/editor-fs/mkdir', { path: `${childPath(name)}/${folder}` });
  if (err) loadError.value = err;
  cancelInline();
  // Expand the parent so the new folder is visible.
  expanded.value = { ...expanded.value, [name]: true };
  await loadLevel();
}

async function pressDelete(name: string): Promise<void> {
  const target = childPath(name);
  if (armedDelete.value !== target) {
    armedDelete.value = target; // first click ARMS (the OSR-safe confirm)
    return;
  }
  armedDelete.value = '';
  const err = await postOp('/editor-fs/delete', { path: target });
  if (err) loadError.value = err;
  await loadLevel();
}

async function loadLevel(): Promise<void> {
  try {
    const res = await fetch(`/editor-fs/list?dir=${encodeURIComponent(props.dir)}`);
    const body = (await res.json()) as { ok: boolean; entries?: TreeEntry[]; error?: string };
    if (!body.ok || !Array.isArray(body.entries)) {
      loadError.value = body.error ?? 'list-failed';
      return;
    }
    entries.value = body.entries;
  } catch {
    loadError.value = 'fetch-failed';
  }
}

onMounted(loadLevel);
</script>

<style scoped>
.ce-tree-level {
  list-style: none;
  margin: 0;
  padding: 0 0 0 0.85rem;
}
.ce-tree-level[data-depth='0'] {
  padding-left: 0;
}
.ce-tree-node {
  margin: 0;
}
.ce-tree-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.12rem 0.3rem;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  font-size: 0.78rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  text-align: left;
}
.ce-tree-row:hover {
  background: rgba(255, 255, 255, 0.07);
}
.ce-tree-dir .ce-tree-name {
  color: rgba(147, 197, 253, 0.9);
}
.ce-tree-arrow {
  width: 0.85rem;
  display: inline-block;
  color: rgba(255, 255, 255, 0.45);
}
.ce-tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ce-tree-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0 0.25rem;
  border-radius: 3px;
}
.ce-badge-M {
  color: #fbbf24;
}
.ce-badge-U {
  color: #4ade80;
}
.ce-badge-A {
  color: #60a5fa;
}
.ce-badge-C {
  color: #f87171;
}
.ce-badge-dir {
  color: #fbbf24;
  font-size: 0.5rem;
}
.ce-tree-rowwrap {
  display: flex;
  align-items: center;
}
.ce-tree-rowwrap .ce-tree-row {
  flex: 1;
  min-width: 0;
}
.ce-tree-ops {
  display: none;
  gap: 0.1rem;
  flex: 0 0 auto;
}
.ce-tree-rowwrap:hover .ce-tree-ops {
  display: inline-flex;
}
.ce-op {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 0.2rem;
}
.ce-op:hover {
  color: #e8e8e8;
}
.ce-op.armed {
  color: #f87171;
  font-weight: 700;
}
.ce-tree-inline {
  padding: 0.1rem 0 0.1rem 1.2rem;
}
.ce-inline-input {
  width: 180px;
  font-size: 0.75rem;
}
.ce-tree-error {
  color: #f87171;
  font-size: 0.72rem;
  font-family: ui-monospace, 'SF Mono', 'Menlo', monospace;
  padding: 0.2rem 0.3rem;
}

/* C907 · the rotating HiFi identities on the tree rows (the Docs Site RD cascaded in). */
.ce-tree-row.rot-1 { --rot: var(--color-red); }
.ce-tree-row.rot-2 { --rot: var(--color-orange); }
.ce-tree-row.rot-3 { --rot: var(--color-yellow); }
.ce-tree-row.rot-4 { --rot: var(--color-green); }
.ce-tree-row.rot-5 { --rot: var(--color-blue); }
.ce-tree-row.rot-6 { --rot: var(--color-purple); }
.ce-tree-row.rot-7 { --rot: var(--color-fuchsia); }
.ce-tree-row { border-left: 2px solid color-mix(in srgb, var(--rot, transparent) 45%, transparent); }
.ce-tree-row:hover { border-left-color: var(--rot); }
/* C907 · the in-DOM context menu (Pewter · OSR-safe). */
.ce-ctx {
  position: fixed;
  z-index: 1000;
  min-width: 200px;
  background: rgb(12, 10, 5);
  border: 1px solid rgba(234, 179, 8, 0.5);
  border-radius: 6px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.75);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
}
.ce-ctx-path { font-size: 0.6rem; opacity: 0.6; padding: 0.25rem 0.5rem; word-break: break-all; }
.ce-ctx-item {
  appearance: none; background: transparent; border: none; color: inherit;
  font: inherit; font-size: 0.75rem; text-align: left; cursor: pointer;
  padding: 0.3rem 0.5rem; border-radius: 4px;
}
.ce-ctx-item:hover { background: rgba(234, 179, 8, 0.14); color: var(--color-yellow, #eab308); }
.ce-ctx-danger:hover { background: rgba(220, 60, 60, 0.16); color: var(--color-red, #ef4444); }
.ce-ctx-sep { height: 1px; margin: 0.2rem 0.3rem; background: rgba(255, 255, 255, 0.12); }
.ce-ctx-note { font-size: 0.6rem; padding: 0.2rem 0.5rem; color: var(--color-green, #34d399); }
.mono { font-family: 'Courier New', monospace; }
</style>
