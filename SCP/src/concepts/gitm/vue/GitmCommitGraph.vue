<script setup lang="ts">
/**
 * GitmCommitGraph — the GitM Graph tab (MD-C · THE DAG · Pewter HiFi)
 *
 * An SVG commit-DAG off gitmJson.commitGraph (the gitmLoadLogGraph result · TRUE parents +
 * refs). The graph log is TOPO-ORDERED by git; we render in that order top→down. Lane
 * assignment is a simple active-lane algorithm: a commit takes its first child's lane; a
 * merge's extra parents get NEW lanes. Nodes + parent edges render as SVG; ref labels are
 * branch/tag chips (b/* Sword-tinted per the Branch namespace · HEAD luminous per Pewter).
 *
 * WINDOWED: render ≤50 nodes; Load More extends the window. Refresh dispatches
 * gitm_load_log_graph through the gitm-action emit pipe (the SubPage relays it to the Landing's
 * Muxium action-pipe · ACK-only · the relay returns commitGraph).
 *
 * Per-node action row (on click):
 *   · Set Active — dispatches gitm_select_branch when the node carries a BRANCH ref (the
 *     Branch-Set Law routes it). HASH-ONLY nodes get NO checkout (honest scope — the Law keys
 *     on branch names, not detached hashes · the row notes it).
 *   · Branch from here — gitm_branch_create { name }. NOTE (honest scope): the gitmBranchCreate
 *     payload has NO `from` field, so this creates a branch from the CURRENT HEAD, not from the
 *     clicked hash. The from-hash variant is DEFERRED (PENDING · gitmBranchCreate needs a `from`).
 *   · Revert — DEFERRED (PENDING): no gitm_revert tool/quality exists in the roster yet.
 *
 * Citation: ScsBridgeGitmSubPage.vue (the fireAction emit pipe · isSword · Pewter panes).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-C (THE DAG · lane assignment · graph as action surface).
 */
import { ref, computed } from 'vue';
import type { GitmCommitGraphEntry, GitmJsonShape } from '../gitm.type';
import { isWorkingBranchPer } from '../gitm.type';
import type { GitmPendingAction } from '../../scsBridge/scsBridge.type';
import ScsInput from '../../vue/components/ScsInput.vue';

interface Props {
  commitGraph: GitmCommitGraphEntry[];
  currentBranch: string;
  // D-BN · THE branchRoles SWEEP — the whole snapshot so the per-node Set-Active gating decides
  // Sword identity by the canonical roles.b (isWorkingBranchPer), not the `b/` lineage prefix.
  gitmJson: GitmJsonShape | null;
  isGitmActing: boolean;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'gitm-action', action: GitmPendingAction): void;
}>();

function fireAction(tool: string, args: Record<string, unknown>): void {
  if (props.isGitmActing) return;
  emit('gitm-action', { tool, arguments: args });
}

// ── WINDOWING (≤50 · Load More extends) ──────────────────────────────────────
const WINDOW_STEP = 50;
const windowSize = ref<number>(WINDOW_STEP);

const windowedGraph = computed<GitmCommitGraphEntry[]>(() =>
  props.commitGraph.slice(0, windowSize.value),
);
const hasMore = computed<boolean>(() => props.commitGraph.length > windowSize.value);
function loadMore(): void {
  windowSize.value += WINDOW_STEP;
}

// ── REFRESH (dispatch gitm_load_log_graph through the controller pipe) ────────
function refreshGraph(): void {
  // Ask the bridge to re-read the DAG at the current window depth (+ a step of headroom).
  fireAction('gitm_load_log_graph', { limit: windowSize.value + WINDOW_STEP });
}

// ── LANE ASSIGNMENT (simple active-lane · topo-order top→down) ────────────────
// The log is topo-ordered (child before parent). We walk it top→down, maintaining a set of
// ACTIVE LANES each holding the hash it currently expects next. A commit takes the lane that
// expects it (its first child reserved it); if none, it opens a fresh lane. It then RESERVES
// a lane for its FIRST parent (reusing its own lane) and NEW lanes for the extra (merge) parents.
type GraphNode = {
  entry: GitmCommitGraphEntry;
  row: number; // vertical index (topo order)
  lane: number; // horizontal lane index
  y: number; // pixel center-y
  x: number; // pixel center-x
  parents: string[];
};
type GraphEdge = { from: GraphNode; toHash: string };

const ROW_H = 46;
const LANE_W = 22;
const NODE_R = 6;
const LEFT_PAD = 18;
const TOP_PAD = 18;

const laidOut = computed<{ nodes: GraphNode[]; edges: GraphEdge[]; laneCount: number; height: number }>(() => {
  const entries = windowedGraph.value;
  const nodes: GraphNode[] = [];
  const byHash = new Map<string, GraphNode>();
  // activeLanes[i] = the hash that lane i currently expects (or null = free).
  const activeLanes: (string | null)[] = [];

  const claimFreeLane = (): number => {
    const free = activeLanes.indexOf(null);
    if (free !== -1) return free;
    activeLanes.push(null);
    return activeLanes.length - 1;
  };

  entries.forEach((entry, row) => {
    // Find the lane already expecting this commit (a child reserved it), else open one.
    let lane = activeLanes.indexOf(entry.hash);
    if (lane === -1) lane = claimFreeLane();
    // This commit occupies `lane` for this row; free it (we re-reserve for the first parent).
    activeLanes[lane] = null;

    const node: GraphNode = {
      entry,
      row,
      lane,
      y: TOP_PAD + row * ROW_H,
      x: LEFT_PAD + lane * LANE_W,
      parents: entry.parents,
    };
    nodes.push(node);
    byHash.set(entry.hash, node);

    // Reserve lanes for the parents: first parent reuses this lane; extras open new lanes.
    entry.parents.forEach((parentHash, pi) => {
      // If a lane already expects this parent (a merge target already reserved), keep it.
      if (activeLanes.includes(parentHash)) return;
      if (pi === 0) {
        activeLanes[lane] = parentHash;
      } else {
        activeLanes[claimFreeLane()] = parentHash;
      }
    });
  });

  // Edges: from each node to each parent that is WITHIN the window (draw a line to it).
  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    for (const parentHash of node.parents) {
      if (byHash.has(parentHash)) edges.push({ from: node, toHash: parentHash });
    }
  }

  const laneCount = Math.max(1, activeLanes.length);
  const height = TOP_PAD + entries.length * ROW_H;
  return { nodes, edges, laneCount, height };
});

// SVG helpers — an edge path from a node down to its parent (a simple elbow when lanes differ).
function edgePath(edge: GraphEdge): string {
  const from = edge.from;
  const to = laidOut.value.nodes.find((n) => n.entry.hash === edge.toHash);
  if (!to) return '';
  if (from.lane === to.lane) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  // Elbow: down half a row, slide to the parent lane, down to the parent.
  const midY = from.y + ROW_H / 2;
  return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
}

// A lane's tint color (cycles the Pewter spectrum so branches read apart).
const LANE_COLORS = [
  'var(--color-yellow)',
  'var(--color-blue)',
  'var(--color-green, rgb(34,197,94))',
  'var(--color-purple, rgb(168,85,247))',
  'var(--color-orange, rgb(249,115,22))',
];
function laneColor(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length];
}

// ── REF CHIPS ─────────────────────────────────────────────────────────────────
// A ref roster entry can be 'HEAD', 'HEAD -> main', 'origin/main', 'tag: v1.0'.
type RefChip = { label: string; kind: 'head' | 'sword' | 'tag' | 'remote' | 'branch' };
function classifyRefs(refs: string[]): RefChip[] {
  const chips: RefChip[] = [];
  for (const raw of refs) {
    // Split 'HEAD -> main' into HEAD + main.
    const parts = raw.split(' -> ').map((p) => p.trim());
    for (const p of parts) {
      if (p === '') continue;
      if (p === 'HEAD') chips.push({ label: 'HEAD', kind: 'head' });
      else if (p.startsWith('tag: ')) chips.push({ label: p.slice(5), kind: 'tag' });
      else if (p.startsWith('b/')) chips.push({ label: p, kind: 'sword' });
      else if (p.includes('/')) chips.push({ label: p, kind: 'remote' });
      else chips.push({ label: p, kind: 'branch' });
    }
  }
  return chips;
}
function nodeRefChips(node: GraphNode): RefChip[] {
  return classifyRefs(node.entry.refs);
}
function nodeHasHead(node: GraphNode): boolean {
  return nodeRefChips(node).some((c) => c.kind === 'head');
}
// A node's LOCAL branch ref (the Branch-Set Law keys on a local branch name · not HEAD/tag/remote).
function nodeLocalBranch(node: GraphNode): string {
  const chip = nodeRefChips(node).find((c) => c.kind === 'branch' || c.kind === 'sword');
  return chip ? chip.label : '';
}

// ── PER-NODE ACTION ROW (Set Active / Branch-from-here / Revert) ──────────────
const openNodeHash = ref<string>('');
function toggleNode(hash: string): void {
  openNodeHash.value = openNodeHash.value === hash ? '' : hash;
}

// Set Active — routes through the Branch-Set Law when the node carries a settable local branch.
// A Sword (b/*) can never be a Shield (the Law) — disabled. A hash-only node has no branch → NO
// checkout (honest scope · the Law keys on names). The current branch's own node → nothing to set.
function setActiveNode(node: GraphNode): void {
  const branch = nodeLocalBranch(node);
  // D-BN · THE branchRoles SWEEP — the Sword gate is the canonical roles.b (isWorkingBranchPer),
  // NOT the `b/` prefix (the prefix is the legacy fallback inside the helper).
  if (branch === '' || isWorkingBranchPer(branch, props.gitmJson) || branch === props.currentBranch) return;
  fireAction('gitm_select_branch', { branchName: branch });
  openNodeHash.value = '';
}

// Branch from here — HONEST SCOPE: gitmBranchCreate has NO `from`, so this creates from the
// CURRENT HEAD (the from-hash variant is PENDING). The input names the new branch.
const newBranchFromHere = ref<string>('');
function branchFromHere(): void {
  const name = newBranchFromHere.value.trim();
  if (name === '') return;
  fireAction('gitm_branch_create', { name, checkout: true });
  newBranchFromHere.value = '';
  openNodeHash.value = '';
}

function shortHash(hash: string): string {
  return hash.slice(0, 7);
}
</script>

<template>
  <section class="gitm-graph hifi-pane-base">
    <div class="gitm-graph-head">
      <h3 class="hifi-heading">Commit Graph ({{ commitGraph.length }})</h3>
      <button
        class="hifi-btn gitm-btn-small"
        :disabled="isGitmActing"
        title="Reload the commit DAG (git log --topo-order)."
        @click="refreshGraph"
      >
        Refresh
      </button>
    </div>

    <p v-if="commitGraph.length === 0" class="gitm-graph-empty">
      No graph loaded. Use Refresh to read the commit DAG (git log --topo-order).
    </p>

    <template v-else>
      <!-- The DAG: an SVG lane column beside a row-per-commit list (aligned to ROW_H). -->
      <div class="gitm-graph-body">
        <svg
          class="gitm-graph-svg"
          :width="LEFT_PAD + laidOut.laneCount * LANE_W"
          :height="laidOut.height"
          :viewBox="`0 0 ${LEFT_PAD + laidOut.laneCount * LANE_W} ${laidOut.height}`"
          aria-hidden="true"
        >
          <!-- Parent edges first (under the nodes). -->
          <path
            v-for="(edge, i) in laidOut.edges"
            :key="'e' + i"
            :d="edgePath(edge)"
            class="gitm-graph-edge"
            :stroke="laneColor(edge.from.lane)"
            fill="none"
          />
          <!-- Nodes: luminous HEAD · lane-tinted fill. -->
          <circle
            v-for="node in laidOut.nodes"
            :key="node.entry.hash"
            :cx="node.x"
            :cy="node.y"
            :r="NODE_R"
            class="gitm-graph-node"
            :class="{ 'gitm-graph-node-head': nodeHasHead(node) }"
            :fill="laneColor(node.lane)"
          />
        </svg>

        <ul class="gitm-graph-rows">
          <li
            v-for="node in laidOut.nodes"
            :key="node.entry.hash"
            class="gitm-graph-row"
            :class="{ open: openNodeHash === node.entry.hash }"
            :style="{ height: ROW_H + 'px' }"
          >
            <button class="gitm-graph-rowbtn" @click="toggleNode(node.entry.hash)">
              <code class="gitm-graph-hash">{{ shortHash(node.entry.hash) }}</code>
              <!-- Ref chips: HEAD luminous · b/* Sword-tinted · tag · remote · branch. -->
              <span
                v-for="(chip, ci) in nodeRefChips(node)"
                :key="ci"
                class="gitm-graph-chip"
                :class="`gitm-graph-chip-${chip.kind}`"
              >
                <span v-if="chip.kind === 'sword'" class="gitm-branch-blade" title="Sword (b/…)">⚔</span>{{ chip.label }}
              </span>
              <span class="gitm-graph-subject">{{ node.entry.subject }}</span>
              <span class="gitm-graph-author">{{ node.entry.author }}</span>
            </button>

            <!-- The per-node action row. -->
            <div v-if="openNodeHash === node.entry.hash" class="gitm-graph-actions">
              <!-- Set Active — the Branch-Set Law (branch nodes only). D-BN · THE branchRoles SWEEP —
                   the Sword gate is the canonical roles.b (isWorkingBranchPer), not the `b/` prefix. -->
              <button
                v-if="nodeLocalBranch(node) && !isWorkingBranchPer(nodeLocalBranch(node), gitmJson) && nodeLocalBranch(node) !== currentBranch"
                class="hifi-btn gitm-btn-small"
                :disabled="isGitmActing"
                title="Set this branch active through the Branch-Set Law."
                @click="setActiveNode(node)"
              >
                Set Active
              </button>
              <span
                v-else-if="isWorkingBranchPer(nodeLocalBranch(node), gitmJson)"
                class="gitm-graph-note"
              >
                Sword (b/…) — cannot be set active (the Law).
              </span>
              <span v-else-if="!nodeLocalBranch(node)" class="gitm-graph-note">
                Hash-only node — no checkout (the Law keys on branch names).
              </span>

              <!-- Branch from here — HONEST SCOPE: creates from CURRENT HEAD (from-hash is PENDING). -->
              <span class="gitm-graph-branchfrom">
                <ScsInput
                  v-model="newBranchFromHere"
                  type="text"
                  placeholder="new-branch-name…"
                  class="gitm-graph-branchinput"
                  :disabled="isGitmActing"
                  @keyup.enter="branchFromHere"
                />
                <button
                  class="hifi-btn gitm-btn-small hifi-btn-blue"
                  :disabled="isGitmActing || newBranchFromHere.trim() === ''"
                  title="Create a branch (from the CURRENT HEAD — from-hash is a pending capability)."
                  @click="branchFromHere"
                >
                  Branch from here
                </button>
                <span class="gitm-graph-note gitm-graph-note-pending" title="gitmBranchCreate has no 'from' — branches from HEAD, not this hash.">
                  · from HEAD (from-hash PENDING)
                </span>
              </span>

              <!-- Revert — PENDING: no gitm_revert tool/quality exists yet. -->
              <button
                class="hifi-btn gitm-btn-small"
                disabled
                title="Revert is a pending capability — no gitm_revert tool exists yet."
              >
                Revert (PENDING)
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="hasMore" class="gitm-graph-more">
        <button class="hifi-btn gitm-btn-small" @click="loadMore">
          Load More ({{ commitGraph.length - windowSize }} more)
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.gitm-graph {
  padding: 1rem;
}
.gitm-graph-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.gitm-graph-empty {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.85rem;
  font-style: italic;
}
.gitm-graph-body {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
}
.gitm-graph-svg {
  flex: 0 0 auto;
}
.gitm-graph-edge {
  stroke-width: 2;
  opacity: 0.8;
}
.gitm-graph-node {
  stroke: rgba(0, 0, 0, 0.4);
  stroke-width: 1;
}
/* Pewter luminous HEAD — a glow ring on the HEAD node. */
.gitm-graph-node-head {
  stroke: var(--color-white-conductor, #f0f0f0);
  stroke-width: 2;
  filter: drop-shadow(0 0 5px var(--color-white-conductor, #f0f0f0));
}
.gitm-graph-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  min-width: 0;
}
.gitm-graph-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.gitm-graph-row.open {
  height: auto !important;
  background: rgba(255, 255, 255, 0.03);
}
.gitm-graph-rowbtn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-align: left;
  font-size: 0.8rem;
  min-height: 40px;
}
.gitm-graph-rowbtn:hover {
  background: rgba(255, 255, 255, 0.04);
}
.gitm-graph-hash {
  color: var(--color-yellow-light, #ffce09);
  font-family: monospace;
  font-size: 0.75rem;
  flex: 0 0 auto;
}
.gitm-graph-chip {
  font-size: 0.68rem;
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  flex: 0 0 auto;
  white-space: nowrap;
}
.gitm-graph-chip-head {
  background: var(--color-white-conductor, #f0f0f0);
  color: #111;
  font-weight: 700;
  box-shadow: 0 0 6px var(--color-white-conductor, #f0f0f0);
}
.gitm-graph-chip-sword {
  background: color-mix(in srgb, var(--color-blue) 30%, transparent);
  border: 1px solid var(--color-blue);
  color: var(--color-blue-light, #4496ff);
}
.gitm-graph-chip-branch {
  background: color-mix(in srgb, var(--color-yellow) 25%, transparent);
  border: 1px solid var(--color-yellow-dark);
  color: var(--color-yellow-light, #ffce09);
}
.gitm-graph-chip-tag {
  background: color-mix(in srgb, var(--color-green, rgb(34, 197, 94)) 25%, transparent);
  border: 1px solid var(--color-green, rgb(34, 197, 94));
  color: var(--color-green, rgb(34, 197, 94));
}
.gitm-graph-chip-remote {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--color-white-muted, #a0a0a8);
}
.gitm-branch-blade {
  margin-right: 0.15rem;
}
.gitm-graph-subject {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-white-conductor, #f0f0f0);
}
.gitm-graph-author {
  flex: 0 0 auto;
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.72rem;
}
.gitm-graph-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem 0.6rem;
}
.gitm-graph-branchfrom {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.gitm-graph-branchinput {
  width: 180px;
}
.gitm-graph-note {
  font-size: 0.72rem;
  color: var(--color-white-muted, #a0a0a8);
  font-style: italic;
}
.gitm-graph-note-pending {
  color: var(--color-yellow-light, #ffce09);
}
.gitm-graph-more {
  margin-top: 0.75rem;
  text-align: center;
}
</style>
