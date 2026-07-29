<script setup lang="ts">
/**
 * GitmCommandPalette — GITM Dev Epoch (MD-E · part 3 · THE COMMAND PALETTE)
 *
 * Cmd/Ctrl+K over the GitM island opens a centered fuzzy-find over the ACTION ROSTER — the loop ops
 * mapped to the SAME dispatch pipes the island buttons use. Each row EITHER emits a `gitm-action`
 * ({ tool, arguments }) — the identical MCP-tool payload fireAction emits (so a palette Commit and a
 * button Commit are one code path) — OR emits `focus-panel` (Set Active → focus the branch list;
 * Load Graph → the graph tab) so the row lands the user on the relevant surface. Keyboard-navigable
 * (up/down/enter/esc); Pewter-styled (neutral system chrome · the SuiteColorPickerPanel / TurnOver
 * confirm-modal glass idiom · Teleport to body so it escapes the island stacking context).
 *
 * WHY a static roster (not a live MCP tool list): the palette is the KEYBOARD MIRROR of the existing
 * button surface — every row is a control that already exists on the island, so the roster is a
 * hand-curated map of {label, hint, tool|panel, args} the developer reaches without the mouse. New
 * island controls add a roster row here (the one place to keep in step · a small, legible contract).
 *
 * Citation: GitmTurnOverAConfirmModal.vue (Teleport + backdrop + Pewter glass block + keydown).
 * Citation: ScsBridgeGitmSubPage.vue fireAction (the { tool, arguments } gitm-action contract).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md MD-E part 3 (the palette · the action roster).
 */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { GitmJsonShape } from '../gitm.type';
import type { GitmPendingAction } from '../../scsBridge/scsBridge.type';

interface Props {
  isOpen: boolean;
  gitmJson: GitmJsonShape | null;
  // In-flight guard — every action row is inert while an op runs (mirror the island's isGitmActing gate).
  isGitmActing: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'gitm-action', action: GitmPendingAction): void;
  // Panel-focus rows (Set Active → 'branches'; Load Graph → 'graph') — the parent scrolls/focuses.
  (e: 'focus-panel', panel: 'branches' | 'graph' | 'changes' | 'commit' | 'stash'): void;
}>();

// ──────────────────────────────────────────────────────────────────────────
// THE ACTION ROSTER — the loop ops mapped to their existing dispatch pipes. Each entry is EITHER a
// tool row (emits gitm-action with the SAME { tool, arguments } the island button fires) OR a panel
// row (emits focus-panel · Set Active focuses the branch list, Load Graph the graph tab). `enabled`
// reads the relayed snapshot so a disabled control is disabled here too (never dispatches a no-op).
// ──────────────────────────────────────────────────────────────────────────
type RosterEntry = {
  id: string;
  label: string;
  hint: string;
  // A row is EITHER a tool dispatch OR a panel focus (never both).
  tool?: string;
  args?: Record<string, unknown>;
  panel?: 'branches' | 'graph' | 'changes' | 'commit' | 'stash';
  enabled: (g: GitmJsonShape | null) => boolean;
};

const alwaysOn = (): boolean => true;

const ROSTER: RosterEntry[] = [
  // Branches
  { id: 'set-active', label: 'Set Active Branch…', hint: 'Focus the branch list to pick a branch (routes through the Turn Over Law)', panel: 'branches', enabled: alwaysOn },
  // Changes
  { id: 'stage-all', label: 'Stage All', hint: 'git add -A', tool: 'gitm_stage_all', args: {}, enabled: (g) => !!g && g.unstagedFiles.length > 0 },
  { id: 'unstage-all', label: 'Unstage All', hint: 'git restore --staged .', tool: 'gitm_unstage_all', args: {}, enabled: (g) => !!g && g.stagedFiles.length > 0 },
  { id: 'commit', label: 'Commit…', hint: 'Focus the commit box', panel: 'commit', enabled: alwaysOn },
  { id: 'load-diff', label: 'Diff', hint: 'Load the working diff (stage individual hunks)', tool: 'gitm_load_diff', args: {}, enabled: alwaysOn },
  // Remote
  { id: 'fetch', label: 'Fetch', hint: 'git fetch --prune', tool: 'gitm_fetch', args: {}, enabled: alwaysOn },
  { id: 'pull', label: 'Pull', hint: 'git pull --ff-only', tool: 'gitm_pull', args: {}, enabled: alwaysOn },
  { id: 'push', label: 'Push', hint: 'git push', tool: 'gitm_push', args: {}, enabled: alwaysOn },
  // Stash
  { id: 'stash-push', label: 'Stash Push', hint: 'git stash push', tool: 'gitm_stash_push', args: {}, enabled: (g) => !!g && g.dirty },
  { id: 'stash-pop', label: 'Stash Pop', hint: 'git stash pop (most recent)', tool: 'gitm_stash_pop', args: {}, enabled: (g) => !!g && g.stashCount > 0 },
  { id: 'stash-list', label: 'Stash List', hint: 'Load the labeled stash roster', tool: 'gitm_stash_list', args: {}, enabled: alwaysOn },
  // History
  { id: 'load-graph', label: 'Load Graph', hint: 'The commit DAG (opens the Graph tab)', panel: 'graph', enabled: alwaysOn },
  { id: 'load-reflog', label: 'Load Reflog', hint: 'The reflog roster (universal undo picker)', tool: 'gitm_load_reflog', args: {}, enabled: alwaysOn },
];

// ──────────────────────────────────────────────────────────────────────────
// FUZZY-FIND — a light subsequence match over label + hint (order-preserving char match · scored by
// span tightness). Empty query → the whole roster in declaration order. No dependency; pure + local.
// ──────────────────────────────────────────────────────────────────────────
const query = ref<string>('');
const selectedIndex = ref<number>(0);
const inputEl = ref<HTMLInputElement | null>(null);

function fuzzyScore(needle: string, haystack: string): number {
  if (needle === '') return 1;
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  let hi = 0;
  let firstHit = -1;
  let lastHit = -1;
  for (let ni = 0; ni < n.length; ni++) {
    const c = n[ni];
    let found = false;
    while (hi < h.length) {
      if (h[hi] === c) {
        if (firstHit === -1) firstHit = hi;
        lastHit = hi;
        hi++;
        found = true;
        break;
      }
      hi++;
    }
    if (!found) return 0; // a needle char never matched — no subsequence
  }
  // Tighter span (fewer gaps) + earlier start = higher score.
  const span = lastHit - firstHit + 1;
  return 1000 - span - firstHit;
}

const filtered = computed<RosterEntry[]>(() => {
  const q = query.value.trim();
  if (q === '') return ROSTER;
  return ROSTER.map((e) => ({ e, score: fuzzyScore(q, `${e.label} ${e.hint}`) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
});

// Keep the selection in-bounds as the filter narrows.
watch(filtered, () => {
  if (selectedIndex.value >= filtered.value.length) selectedIndex.value = 0;
});

// Reset + focus the input each time the palette opens.
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      query.value = '';
      selectedIndex.value = 0;
      void nextTick(() => inputEl.value?.focus());
    }
  },
);

function isEnabled(entry: RosterEntry): boolean {
  return !props.isGitmActing && entry.enabled(props.gitmJson);
}

function runEntry(entry: RosterEntry): void {
  if (!isEnabled(entry)) return;
  if (entry.panel) {
    emit('focus-panel', entry.panel);
  } else if (entry.tool) {
    emit('gitm-action', { tool: entry.tool, arguments: entry.args ?? {} });
  }
  emit('close');
}

function move(delta: number): void {
  const len = filtered.value.length;
  if (len === 0) return;
  selectedIndex.value = (selectedIndex.value + delta + len) % len;
}

function onKeydown(e: KeyboardEvent): void {
  if (!props.isOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    move(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    move(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const entry = filtered.value[selectedIndex.value];
    if (entry) runEntry(entry);
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="gitm-cmdk">
      <div
        v-if="isOpen"
        class="gitm-cmdk-backdrop"
        @click="emit('close')"
      >
        <div
          class="gitm-cmdk-block"
          role="dialog"
          aria-modal="true"
          aria-label="GitM command palette"
          @click.stop
        >
          <div class="gitm-cmdk-glare" aria-hidden="true"></div>
          <div class="gitm-cmdk-searchrow">
            <i class="fa-solid fa-magnifying-glass gitm-cmdk-searchicon" aria-hidden="true"></i>
            <input
              ref="inputEl"
              v-model="query"
              class="gitm-cmdk-input"
              type="text"
              placeholder="Run a git command…"
              aria-label="Filter commands"
              autocomplete="off"
              spellcheck="false"
            />
            <kbd class="gitm-cmdk-kbd">Esc</kbd>
          </div>

          <ul class="gitm-cmdk-list" role="listbox">
            <li
              v-for="(entry, i) in filtered"
              :key="entry.id"
              class="gitm-cmdk-row"
              :class="{ selected: i === selectedIndex, disabled: !isEnabled(entry) }"
              role="option"
              :aria-selected="i === selectedIndex"
              @mouseenter="selectedIndex = i"
              @click="runEntry(entry)"
            >
              <span class="gitm-cmdk-row-label">{{ entry.label }}</span>
              <span class="gitm-cmdk-row-hint">{{ entry.hint }}</span>
            </li>
            <li v-if="filtered.length === 0" class="gitm-cmdk-empty">
              No matching command.
            </li>
          </ul>

          <div class="gitm-cmdk-foot">
            <span><kbd class="gitm-cmdk-kbd">↑</kbd><kbd class="gitm-cmdk-kbd">↓</kbd> navigate</span>
            <span><kbd class="gitm-cmdk-kbd">↵</kbd> run</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* PEWTER — neutral system chrome (the palette is tooling, not a suite-keyed action). Glass block +
   backdrop dim, the SuiteColorPickerPanel / TurnOver confirm-modal idiom, neutral grays throughout. */
.gitm-cmdk-backdrop {
  position: fixed;
  inset: 0;
  z-index: 420;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 1.5rem 1.5rem;
  background: radial-gradient(
      ellipse at 50% 30%,
      rgba(12, 14, 16, 0.72) 0%,
      rgba(2, 3, 4, 0.9) 100%
    );
  backdrop-filter: blur(6px);
  pointer-events: auto;
}

.gitm-cmdk-block {
  position: relative;
  width: 560px;
  max-width: calc(100vw - 3rem);
  overflow: hidden;
  border-radius: 12px;
  background:
    radial-gradient(ellipse at 30% 6%, rgba(160, 170, 180, 0.08) 0%, rgba(12, 14, 16, 0) 58%),
    linear-gradient(170deg, rgba(18, 20, 23, 0.98) 0%, rgba(9, 10, 12, 0.99) 100%);
  border: 1px solid rgba(160, 170, 180, 0.28);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.7),
    0 0 18px 0 rgba(140, 150, 160, 0.14),
    inset 0 0 18px 0 rgba(160, 170, 180, 0.05);
}

.gitm-cmdk-glare {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.gitm-cmdk-searchrow {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(160, 170, 180, 0.16);
}

.gitm-cmdk-searchicon {
  color: rgba(190, 200, 210, 0.55);
  font-size: 0.85rem;
}

.gitm-cmdk-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(236, 240, 244, 0.94);
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
  font-size: 0.92rem;
  letter-spacing: 0.01em;
}

.gitm-cmdk-input::placeholder {
  color: rgba(190, 200, 210, 0.4);
}

.gitm-cmdk-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.3rem;
  padding: 0.08rem 0.35rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.66rem;
  color: rgba(210, 218, 224, 0.72);
}

.gitm-cmdk-list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0.35rem;
  max-height: 48vh;
  overflow-y: auto;
}

.gitm-cmdk-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.5rem 0.7rem;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.gitm-cmdk-row.selected {
  background: rgba(160, 170, 180, 0.12);
}

.gitm-cmdk-row.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.gitm-cmdk-row-label {
  flex: 0 0 auto;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(232, 238, 242, 0.92);
}

.gitm-cmdk-row-hint {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.68rem;
  color: rgba(180, 190, 200, 0.6);
  text-align: right;
}

.gitm-cmdk-empty {
  padding: 1rem 0.7rem;
  text-align: center;
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
  font-size: 0.78rem;
  color: rgba(180, 190, 200, 0.5);
}

.gitm-cmdk-foot {
  display: flex;
  gap: 1.2rem;
  padding: 0.55rem 1rem;
  border-top: 1px solid rgba(160, 170, 180, 0.16);
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
  font-size: 0.66rem;
  color: rgba(180, 190, 200, 0.5);
}

.gitm-cmdk-foot kbd {
  margin-right: 0.15rem;
}

.gitm-cmdk-enter-active {
  transition: opacity 0.18s ease-out;
}
.gitm-cmdk-leave-active {
  transition: opacity 0.14s ease-in;
}
.gitm-cmdk-enter-active .gitm-cmdk-block {
  transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.15), opacity 0.2s ease-out;
}
.gitm-cmdk-enter-from,
.gitm-cmdk-leave-to {
  opacity: 0;
}
.gitm-cmdk-enter-from .gitm-cmdk-block {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
