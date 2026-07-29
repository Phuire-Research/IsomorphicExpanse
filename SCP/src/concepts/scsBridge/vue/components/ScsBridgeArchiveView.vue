<script setup lang="ts">
/**
 * ScsBridgeArchiveView.vue — Macro AV · Archival View (SCP-side Vue surface)
 *
 * READ-ONLY terminal-state view of archived sessions. Injects the universal
 * scsBridge controller; renders controller.archiveManifest (the light reactive
 * UFRT list the AMWP relay full-replaces into Stratimux state). On single-row
 * expand it fetches the heavy { entry, lastTurn } body on-demand via the
 * controller's triggerFetchArchiveContents(id) ODCF channel (GET the bridge SEAP
 * endpoint) into a COMPONENT-SCOPED load-gate Map — never re-fetched, never into
 * Stratimux state (the manifest is the light list; bodies stay local).
 *
 * No engage / dissipate / focus / rename — archive is a terminal record (S4 A8-1).
 *
 * Pewter (S3 Ochre Blueprint Part 3): root hifi-pane-base · header
 * hifi-pane-maroon (Suite 1 Curator semantic — archive is curated history) +
 * hifi-heading · detail drawer hifi-pane-onyx (Lambda-document record semantic).
 *
 * Citation: EPOCH-EXT-AV-S3-OCHRE-VUE-BLUEPRINT.md Part 2 · EPOCH-EXT-AV-S4-GREEN-SCULPT.md
 *   (R2 ODCF load-gate · A3-2 orphan guard · A6-1 cap notice · A8-1 read-only)
 */
import { inject, reactive, watch, computed, onMounted } from 'vue';
import { ref } from 'vue';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import type { ArchiveManifestEntry, ArchiveContents } from '../../archiveManifest.types';
// MANIFEST_CAP imported from the PURE types neighbor (NOT the Node-coupled model) so the
// archiveManifest.model.ts node:fs/promises code never enters the client Rollup bundle.
import { MANIFEST_CAP } from '../../archiveManifest.types';

/*
 * Field vocabulary (shared with TUI render function — do not swap these):
 *   entry.label          — primary identity (scsLabel ?? displayName ?? id.slice(-8))
 *   entry.archivedAt     — ms epoch timestamp; render as relative time
 *   entry.suite8Name     — optional Suite 8 designation pill
 *   entry.preview        — cached pre-archive snippet ("Archived preview:" label)
 *   lastTurn.transcriptLastUserInput   — last user message ("Last turn — User:" label)
 *   lastTurn.transcriptLastModelOutput — last model response ("Last turn — Model:" label)
 * preview != lastTurn content — different provenance; both must be labeled distinctly.
 * Pewter: Maroon = Archive header (NOT Cobalt — that is Session Management). Load-bearing.
 */

const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);

// Single-expand state — one row open at a time (mirrors expandedSessionId in SessionManagement)
const expandedArchiveId = ref<string | null>(null);

// ODCF load-gate (S4 R2 — BLOCKING): component-scoped body cache.
// Keys: entry.id. Values: ArchiveContents | 'loading' | 'error'.
// reactive(new Map()) (OQ-2 recommended) — Vue 3 reactive wraps Map so .set()
// triggers re-render with zero counter refs. Never re-fetches a key already
// present. NEVER enters Stratimux state (the heavy body stays local).
const bodyCache = reactive(new Map<string, ArchiveContents | 'loading' | 'error'>());

// ODCF-for-the-list (the bug fix): the manifest list must NOT depend solely on the
// AMWP reactive relay (controller.archiveManifest) — that relay is dormant until a
// bridge re-launch arms the SCP-side watcher. So we ALSO fetch the manifest from the
// bridge GET /sessionArchive endpoint on mount (fires each time the Archive tab is
// selected, since the component mounts/unmounts with the v-else-if). The displayed
// list PREFERS the live relay when populated, else falls back to the fetched snapshot.
const fetchedManifest = ref<ArchiveManifestEntry[]>([]);
const isLoadingManifest = ref(false);
const displayManifest = computed<ArchiveManifestEntry[]>(() => {
  const relay = controller?.archiveManifest.value ?? [];
  return relay.length > 0 ? relay : fetchedManifest.value;
});

async function loadManifest(): Promise<void> {
  if (isLoadingManifest.value) return;
  isLoadingManifest.value = true;
  try {
    const m = await controller?.triggerFetchArchiveManifest();
    if (m) fetchedManifest.value = m;
  } finally {
    isLoadingManifest.value = false;
  }
}

onMounted(loadManifest);

// Orphan guard (S4 Reinforcement A3-2): if the DISPLAYED manifest changes and the
// currently-expanded id is gone, auto-clear expanded state + cache entry.
watch(
  () => displayManifest.value,
  (newManifest) => {
    if (expandedArchiveId.value === null) return;
    const stillPresent = newManifest?.some((e) => e.id === expandedArchiveId.value) ?? false;
    if (!stillPresent) {
      bodyCache.delete(expandedArchiveId.value);
      expandedArchiveId.value = null;
    }
  },
);

function formatRelativeTime(archivedAt: number): string {
  const diffMs = Date.now() - archivedAt;
  if (!Number.isFinite(diffMs) || diffMs < 0) return '—';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function deriveLabel(entry: ArchiveManifestEntry): string {
  return entry.label ?? entry.id.slice(-8);
}

function toggleRow(id: string): void {
  if (expandedArchiveId.value === id) {
    // Collapse — keep cache entry so re-expand is instant
    expandedArchiveId.value = null;
    return;
  }
  expandedArchiveId.value = id;
  if (bodyCache.has(id)) return; // Cache hit — never re-fetch
  // Cache miss — start fetch
  bodyCache.set(id, 'loading');
  controller
    ?.triggerFetchArchiveContents(id)
    .then((result) => {
      bodyCache.set(id, result ?? 'error');
    })
    .catch(() => {
      bodyCache.set(id, 'error');
    });
}

function getCachedBody(id: string): ArchiveContents | 'loading' | 'error' | undefined {
  return bodyCache.get(id);
}
</script>

<template>
  <div class="archive-view-root hifi-pane-base">

    <!-- HEADER — hifi-pane-maroon: Suite 1 Curator semantic for archive identity -->
    <header class="archive-header hifi-pane-maroon">
      <h1 class="hifi-heading archive-title">Archive</h1>
      <p class="archive-subtitle">Archived sessions — read-only · terminal state</p>
      <button
        type="button"
        class="archive-refresh-btn"
        :disabled="isLoadingManifest"
        @click="loadManifest"
      >{{ isLoadingManifest ? 'Loading…' : 'Refresh' }}</button>
    </header>

    <!-- EMPTY STATE -->
    <div
      v-if="!displayManifest.length"
      class="archive-empty-state"
    >
      <p>No archived sessions — sessions moved here via <kbd>[a] Archive</kbd> in the TUI.</p>
    </div>

    <!-- CAP NOTICE (S4 Reinforcement A6-1) -->
    <div
      v-if="displayManifest.length >= MANIFEST_CAP"
      class="archive-cap-notice"
    >
      Showing {{ MANIFEST_CAP }} most recent — older archives remain on disk.
    </div>

    <!-- MANIFEST LIST -->
    <ul
      v-if="displayManifest.length"
      class="archive-list"
      role="list"
    >
      <li
        v-for="entry in displayManifest"
        :key="entry.id"
        class="archive-row hifi-pane-base"
        :class="{ 'archive-row-expanded': expandedArchiveId === entry.id }"
        role="button"
        :aria-expanded="expandedArchiveId === entry.id"
        @click="toggleRow(entry.id)"
      >
        <!-- COLLAPSED ROW CONTENT -->
        <div class="archive-row-summary">
          <span class="archive-row-label">{{ deriveLabel(entry) }}</span>
          <span class="archive-row-time">{{ formatRelativeTime(entry.archivedAt) }}</span>
          <span v-if="entry.suite8Name" class="archive-row-suite8-pill">{{ entry.suite8Name }}</span>
          <span v-if="entry.preview" class="archive-row-preview">{{ entry.preview }}</span>
        </div>

        <!-- DETAIL DRAWER — renders only for the expanded row -->
        <div
          v-if="expandedArchiveId === entry.id"
          class="archive-detail-drawer hifi-pane-onyx"
          @click.stop
        >
          <!-- LOADING STATE (5-state: S4 R2) -->
          <div v-if="getCachedBody(entry.id) === 'loading'" class="archive-detail-loading">
            <span class="archive-shimmer-bar"></span>
            <span class="archive-shimmer-bar archive-shimmer-bar--short"></span>
          </div>

          <!-- ERROR STATE: fetch returned null (404 or 500 — indistinguishable from controller) -->
          <div v-else-if="getCachedBody(entry.id) === 'error'" class="archive-detail-error">
            Session not found in archive.
          </div>

          <!-- NULL LAST-TURN STATE: entry exists, no .jsonl on disk -->
          <div
            v-else-if="getCachedBody(entry.id) && (getCachedBody(entry.id) as ArchiveContents).lastTurn === null"
            class="archive-detail-no-transcript"
          >
            No transcript recorded for this session.
          </div>

          <!-- FULL CONTENT STATE -->
          <div
            v-else-if="getCachedBody(entry.id) && (getCachedBody(entry.id) as ArchiveContents).lastTurn !== null"
            class="archive-detail-content"
          >
            <div class="archive-detail-section">
              <span class="archive-detail-label">Archived preview:</span>
              <p v-if="(getCachedBody(entry.id) as ArchiveContents).entry.preview" class="archive-detail-preview-text">
                {{ (getCachedBody(entry.id) as ArchiveContents).entry.preview }}
              </p>
              <span v-else class="archive-detail-none">—</span>
            </div>
            <div class="archive-detail-section">
              <span class="archive-detail-label">Last turn — User:</span>
              <p class="archive-detail-user-input">
                {{ (getCachedBody(entry.id) as ArchiveContents).lastTurn!.transcriptLastUserInput || '—' }}
              </p>
            </div>
            <div class="archive-detail-section">
              <span class="archive-detail-label">Last turn — Model:</span>
              <p class="archive-detail-model-output">
                {{ (getCachedBody(entry.id) as ArchiveContents).lastTurn!.transcriptLastModelOutput || '—' }}
              </p>
            </div>
          </div>

          <!-- NOT-YET-FETCHED FALLBACK (guard for race on first expand tick) -->
          <div v-else class="archive-detail-loading">
            <span class="archive-shimmer-bar"></span>
          </div>
        </div>
      </li>
    </ul>

  </div>
</template>

<style scoped>
/* ROOT */
.archive-view-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 200px;
}

/* HEADER — global hifi-pane-maroon applied; scoped provides padding only */
.archive-header {
  padding: 1rem 1.5rem 0.75rem;
}

.archive-title {
  margin: 0 0 0.25rem;
}

.archive-subtitle {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

/* EMPTY STATE + CAP NOTICE */
.archive-empty-state,
.archive-cap-notice {
  padding: 1rem 1.5rem;
  font-size: 0.8rem;
  opacity: 0.7;
}

.archive-cap-notice {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* LIST */
.archive-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* ROW — global hifi-pane-base applied; scoped provides layout */
.archive-row {
  padding: 0.625rem 1rem;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s ease;
}

.archive-row:hover {
  opacity: 0.88;
}

.archive-row-summary {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.archive-row-label {
  font-weight: 600;
  font-family: var(--font-heading);
  font-size: 0.85rem;
}

.archive-row-time {
  font-size: 0.75rem;
  opacity: 0.55;
}

/* Suite 8 pill — Maroon-tinted (intentional: archive domain color) */
.archive-row-suite8-pill {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: rgba(128, 0, 0, 0.35);
  border: 1px solid var(--color-maroon-dark);
  opacity: 0.9;
}

.archive-row-preview {
  font-size: 0.75rem;
  opacity: 0.5;
  font-style: italic;
  flex-basis: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* DETAIL DRAWER — global hifi-pane-onyx applied; scoped provides inner layout */
.archive-detail-drawer {
  margin-top: 0.625rem;
  padding: 0.875rem 1rem;
  cursor: default;
}

.archive-detail-section {
  margin-bottom: 0.75rem;
}

.archive-detail-section:last-child {
  margin-bottom: 0;
}

.archive-detail-label {
  display: block;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
  margin-bottom: 0.25rem;
}

.archive-detail-preview-text,
.archive-detail-user-input {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.archive-detail-model-output {
  margin: 0;
  font-size: 0.82rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.archive-detail-none {
  opacity: 0.35;
}

.archive-detail-error,
.archive-detail-no-transcript {
  font-size: 0.8rem;
  opacity: 0.6;
  font-style: italic;
}

/* SHIMMER LOADING BARS */
.archive-shimmer-bar {
  display: block;
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.14) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  background-size: 200% 100%;
  animation: archive-shimmer 1.4s infinite;
  margin-bottom: 0.5rem;
  width: 100%;
}

.archive-shimmer-bar--short {
  width: 60%;
}

@keyframes archive-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ODCF-for-the-list · Refresh control (top-right of the Maroon header) */
.archive-header { position: relative; }
.archive-refresh-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  font-size: 0.7rem;
  line-height: 1;
  padding: 0.25rem 0.6rem;
  border-radius: 0.2rem;
  background: rgba(0, 0, 0, 0.28);
  border-top:    1px solid rgba(0, 0, 0, 0.3);
  border-right:  1px solid rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  border-left:   1px solid rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.archive-refresh-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}
.archive-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
