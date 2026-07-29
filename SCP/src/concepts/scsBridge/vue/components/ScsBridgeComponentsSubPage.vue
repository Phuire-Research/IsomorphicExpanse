<script setup lang="ts">
/**
 * Component Preview Page · SCS-Bridge Concept Components Showcase
 *
 * Portable showcase of the scsBridge concept's registered components:
 * Bridge Status Mirror · Bridge JSON Relay · Sessions Panel.
 * Props-only; no muxium access. Parent (ScsBridgeLanding.vue) owns the stage
 * planner and routes via v-if when activeSubPage === 'components'.
 *
 * Pattern is intended to be replicated across any Concept's sub-page surface
 * for portable inspection of Concept components. The name 'Components' signals
 * this is a generic preview capability, not a 'current state mirror'.
 *
 * Pewter Tessera HiFi:
 *   D1 Color Token Architecture — zero raw hex; all colors via var(--color-*)
 *   D3 Pane Gradient Assembly   — hifi-pane-onyx | hifi-pane-cobalt | hifi-pane-amethyst (HPCI)
 *   D5 Embossed Border Treatment — global pane classes carry; list items use board-elevated
 *   D6 Typography Stack         — font-mono for technical data; uppercase tracking for labels
 *
 * Citation: TASKBAR-PEWTER-PASS-WAVE2-OCHRE-REFACTOR-BLUEPRINT.md Section 5
 * Citation: PEWTER-PASS-WAVE2-OCHRE-C-CURRENT-SUBPAGE-BLUEPRINT.md (prior anchor)
 * Citation: ScsBridgeLanding.vue (parent · owns stage planner subscription)
 */
import { inject, ref } from 'vue';
import { BRIDGE_STATUS_COLORS } from '../../scsBridge.type';
import type { BridgeJsonShape, ScsBridgeSessionEntry } from '../../scsBridge.type';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
// SCS-Enabled Input Components (#646) — the `|` end-marker input set + showcase gallery.
import ScsInput from '../../../vue/components/ScsInput.vue';
import ScsTextarea from '../../../vue/components/ScsTextarea.vue';
// SCS-Enabled Dropdown (the offscreen-safe in-DOM selection control) — showcased here
// beside the input gallery. Native <select> popups can never open on the offscreen SCP
// surface; ScsDropdown renders wholly in-DOM.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

interface Props {
  bridgeStatus: string;
  bridgeJson: BridgeJsonShape | null;
  sessionsList: ScsBridgeSessionEntry[];
}

defineProps<Props>();

// PP-D5 · Ochre-C §6 · Surface 1 · controller bridgeActive binding
const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);

function sessionStatusColor(status: ScsBridgeSessionEntry['status']): string {
  switch (status) {
    case 'launched':  return BRIDGE_STATUS_COLORS.connected;
    case 'allocated': return BRIDGE_STATUS_COLORS.syncing;
    case 'archived':  return BRIDGE_STATUS_COLORS.idle;
    case 'offline':   return BRIDGE_STATUS_COLORS.error;
    default:          return BRIDGE_STATUS_COLORS.idle;
  }
}

function boundScpStatusColor(status: string): string {
  if (status === 'live' || status === 'launched') return BRIDGE_STATUS_COLORS.connected;
  if (status === 'syncing') return BRIDGE_STATUS_COLORS.syncing;
  if (status === 'error' || status === 'offline') return BRIDGE_STATUS_COLORS.error;
  return BRIDGE_STATUS_COLORS.idle;
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}

function formatTime(timestamp: number): string {
  if (timestamp === 0) return '—';
  return new Date(timestamp).toLocaleTimeString();
}

// SCS Input Components showcase (#646) — local demo state, one model per field.
const demoText = ref('');
const demoPassword = ref('');
const demoEmail = ref('');
const demoUrl = ref('');
const demoSearch = ref('');
const demoNumber = ref('');
const demoTel = ref('');
const demoTextarea = ref('');

// SCS Dropdown showcase — the offscreen-safe in-DOM selection control. A sample option set
// (value/label/hint) mirroring how a native <select> would be populated.
const demoDropdown = ref('balanced');
const demoDropdownOptions = [
  { value: 'flagship', label: 'Flagship', hint: 'most capable', title: 'The most capable option — deepest reasoning.' },
  { value: 'balanced', label: 'Balanced', hint: 'speed + capability', title: 'A balance of throughput and capability.' },
  { value: 'fast', label: 'Fast', hint: 'lowest latency', title: 'The fastest option — lowest latency and cost.' },
];
</script>

<template>
  <div class="components-subpage">

    <!-- C911 · WHY THESE COMPONENTS EXIST — the page-top explanation. -->
    <section class="osr-why hifi-pane-base">
      <h2 class="hifi-heading">SCS-Enabled Components — Why They Exist</h2>
      <p>
        Every SCP window renders through the Off-Screen Render for post-processing — the page is
        drawn to a texture the presenter shades and composes. Native browser affordances never
        reach that surface: OS tooltips, native context menus, dialogs, and the system text caret
        all draw OUTSIDE the page, so the post-processed render simply never sees them.
      </p>
      <p>
        The SCS therefore provides in-DOM equivalents — inputs with drawn carets, portal-rendered
        hover readouts, in-DOM context menus and pickers — everything painted INSIDE the page,
        where the Off-Screen Render carries it. Compose with these and your surfaces survive
        post-processing whole.
      </p>
    </section>

    <!-- C911 · THE ON-HOVER EXAMPLE — the data-readout portal contract, live. -->
    <section class="hover-demo-panel hifi-pane-base">
      <h2 class="hifi-heading">On-Hover Readout · data-readout</h2>
      <p class="hover-demo-copy">
        Any element carrying a <code>data-readout</code> attribute teaches its label on hover —
        rendered by ONE body-level portal (fixed · measured · viewport-clamped), never clipped
        by a container. Hover the pills:
      </p>
      <div class="hover-demo-row">
        <button type="button" class="hifi-btn hifi-btn-green" data-readout="A GREEN EXAMPLE · THE LABEL RIDES data-readout">Hover Me</button>
        <button type="button" class="hifi-btn hifi-btn-yellow" data-readout="LABELS ARE ALWAYS A GOOD IDEA WHEN TEACHING">And Me</button>
        <button type="button" class="hifi-btn hifi-btn-purple" data-readout="PORTAL-RENDERED · FIXED · NEVER CLIPPED">This One Too</button>
      </div>
    </section>

    <section class="mirror-panel hifi-pane-onyx">
      <h2 class="hifi-heading">Bridge Status Mirror</h2>
      <pre class="mirror-output">{{ bridgeStatus || '(awaiting initial connection...)' }}</pre>
      <!-- PP-D5 · Ochre-C §6 · Surface 1 · additive bridgeActive row (zero regression) -->
      <div
        class="bridge-active-row"
        :style="{
          color: controller?.bridgeActive.value
            ? BRIDGE_STATUS_COLORS.connected
            : BRIDGE_STATUS_COLORS.error,
        }"
      >
        BRIDGE ACTIVE: {{ controller?.bridgeActive.value ? 'Active' : 'Pending' }}
      </div>
    </section>

    <section v-if="bridgeJson" class="bridge-json-panel hifi-pane-cobalt">
      <h2 class="hifi-heading">Bridge JSON Relay</h2>
      <div class="bridge-json-grid">
        <div class="bjr-field">
          <span class="bjr-label">port</span>
          <span class="bjr-value">{{ bridgeJson.port }}</span>
        </div>
        <div class="bjr-field">
          <span class="bjr-label">endpoint</span>
          <span class="bjr-value">{{ bridgeJson.endpoint }}</span>
        </div>
        <div class="bjr-field">
          <span class="bjr-label">version</span>
          <span class="bjr-value">{{ bridgeJson.bridgeVersion }}</span>
        </div>
        <div class="bjr-field">
          <span class="bjr-label">written</span>
          <span class="bjr-value time">{{ formatTime(bridgeJson.writtenAt) }}</span>
        </div>
        <div class="bjr-field">
          <span class="bjr-label">installed</span>
          <span class="bjr-value">{{ bridgeJson.installedScps.length }}</span>
        </div>
        <div class="bjr-field">
          <span class="bjr-label">bound</span>
          <span class="bjr-value">{{ Object.keys(bridgeJson.boundScps).length }}</span>
        </div>
      </div>
      <ul v-if="Object.keys(bridgeJson.boundScps).length > 0" class="bound-scp-list">
        <li
          v-for="(scp, name) in bridgeJson.boundScps"
          :key="name"
          class="bound-scp-item"
        >
          <span class="bound-scp-name">{{ name }}</span>
          <span class="bound-scp-status" :style="{ color: boundScpStatusColor(scp.status) }">
            {{ scp.status }}
          </span>
          <span class="bound-scp-port">port {{ scp.port }}</span>
        </li>
      </ul>
    </section>

    <section class="sessions-panel hifi-pane-amethyst">
      <h2 class="hifi-heading">Sessions ({{ sessionsList.length }})</h2>
      <ul v-if="sessionsList.length > 0" class="session-list">
        <li
          v-for="session in sessionsList"
          :key="session.id"
          class="session-item"
        >
          <span class="session-id">{{ shortId(session.id) }}</span>
          <span
            class="session-status"
            :style="{ color: sessionStatusColor(session.status) }"
          >
            {{ session.status }}
          </span>
          <span v-if="session.scpName" class="session-scp">{{ session.scpName }}</span>
          <span class="session-spawned time">{{ formatTime(session.spawnedAt) }}</span>
        </li>
      </ul>
      <p v-else class="session-empty">(no sessions registered)</p>
    </section>

    <!-- SCS Input Components showcase (#646) — the owned end-marker input gallery.
         Each card is a live SCS component; focus reveals a literal `|` pinned at the
         end of the text (stripped from v-model). The .scs-input-field class falls
         through to the inner element; per-card --input-accent carries the focus-border
         theming. -->
    <section class="input-showcase hifi-pane-viridian">
      <h2 class="hifi-heading input-showcase-heading">SCS Input Components</h2>
      <p class="input-showcase-hint">
        Click any field — the solid caret appears at the insertion point.
      </p>

      <!-- GROUP 1 · Text-Likes -->
      <div class="input-showcase-group-label">Text-Likes</div>
      <div class="input-gallery input-gallery--4">
        <div class="input-card input-card-red">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">text</span>
            <ScsInput
              v-model="demoText"
              type="text"
              class="scs-input-field"
              placeholder="type to see the caret…"
            />
          </div>
        </div>
        <div class="input-card input-card-orange">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">password</span>
            <ScsInput
              v-model="demoPassword"
              type="password"
              class="scs-input-field"
              placeholder="type to see the caret…"
            />
          </div>
        </div>
        <div class="input-card input-card-yellow">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">email</span>
            <ScsInput
              v-model="demoEmail"
              type="email"
              class="scs-input-field"
              placeholder="user@example.com…"
            />
          </div>
        </div>
        <div class="input-card input-card-green">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">url</span>
            <ScsInput
              v-model="demoUrl"
              type="url"
              class="scs-input-field"
              placeholder="https://…"
            />
          </div>
        </div>
      </div>

      <!-- GROUP 2 · Alphanumeric Variants -->
      <div class="input-showcase-group-label">Alphanumeric Variants</div>
      <div class="input-gallery input-gallery--3">
        <div class="input-card input-card-blue">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">search</span>
            <ScsInput
              v-model="demoSearch"
              type="search"
              class="scs-input-field"
              placeholder="type to search…"
            />
          </div>
        </div>
        <div class="input-card input-card-purple">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">number</span>
            <ScsInput
              v-model="demoNumber"
              type="number"
              class="scs-input-field scs-input-field--no-spin"
              placeholder="0"
            />
          </div>
        </div>
        <div class="input-card input-card-fuchsia">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">tel</span>
            <ScsInput
              v-model="demoTel"
              type="tel"
              class="scs-input-field"
              placeholder="+1 (555) 000-0000…"
            />
          </div>
        </div>
      </div>

      <!-- GROUP 3 · Multi-Line -->
      <div class="input-showcase-group-label">Multi-Line</div>
      <div class="input-gallery input-gallery--1">
        <div class="input-card input-card-viridian">
          <div class="hifi-stamp input-card-inner">
            <span class="input-type-label">textarea</span>
            <ScsTextarea
              v-model="demoTextarea"
              class="scs-input-field scs-input-field--textarea"
              rows="4"
              placeholder="type to see the caret — multi-line…"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- SCS Dropdown showcase — the offscreen-safe in-DOM selection control. Follows the
         input-showcase idiom: a live demo + short honest copy. OS-level popup controls
         (native select popups) do not open on this rendered surface, so selection controls
         use this in-DOM dropdown instead. -->
    <section class="dropdown-showcase hifi-pane-cobalt">
      <h2 class="hifi-heading dropdown-showcase-heading">SCS Dropdown</h2>
      <p class="dropdown-showcase-hint">
        OS-level popup controls do not open on this rendered surface, so selection controls
        use this in-DOM dropdown. Click it — the choices appear right in the page.
      </p>
      <div class="dropdown-showcase-card">
        <div class="hifi-stamp dropdown-showcase-inner">
          <span class="input-type-label">choose one</span>
          <ScsDropdown
            v-model="demoDropdown"
            :options="demoDropdownOptions"
            placeholder="Select an option…"
          />
          <span class="dropdown-showcase-value">selected: {{ demoDropdown }}</span>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.components-subpage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mirror-output {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.875rem;
  color: var(--color-white-conductor, rgba(255, 255, 255, 0.87));
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

/* PP-D5 · Ochre-C §6 · Surface 1 · bridgeActive row */
.bridge-active-row {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Cycle 155 · BJDP · Bridge JSON Relay + Sessions panels */
.bridge-json-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.bjr-field {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.bjr-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bjr-value {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.875rem;
  color: var(--color-white-conductor, rgba(255, 255, 255, 0.87));
}

.bjr-value.time {
  color: var(--color-cobalt, rgba(96, 165, 250, 1));
}

.bound-scp-list,
.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bound-scp-item,
.session-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-board-dark-alpha, rgba(15, 15, 26, 0.4));
  border: 1px solid var(--color-board-elevated, rgba(34, 34, 40, 1));
  border-radius: 4px;
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.8125rem;
}

.bound-scp-name,
.session-scp,
.session-id {
  color: var(--color-white-conductor, rgba(255, 255, 255, 0.87));
  font-weight: 600;
}

.bound-scp-status,
.session-status {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.bound-scp-port,
.session-spawned {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  text-align: right;
}

.session-empty {
  color: rgba(255, 255, 255, 0.4);
  font-family: var(--font-body, system-ui, sans-serif);
  font-style: italic;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}

/* ---- SCS Input Components showcase (#646) ---- */
.input-showcase {
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.input-showcase-heading {
  font-size: 0.9375rem;
  margin: 0 0 0.25rem;
}

.input-showcase-hint {
  font-size: 0.75rem;
  color: var(--color-white-muted, #a0a0a8);
  font-style: italic;
  margin: 0 0 1.25rem;
  font-family: var(--font-mono, 'Space Mono', monospace);
}

.input-showcase-group-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-white-muted, #a0a0a8);
  margin: 1.25rem 0 0.5rem;
  font-weight: 600;
}

/* Gallery grids */
.input-gallery {
  display: grid;
  gap: 0.875rem;
}

.input-gallery--4 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.input-gallery--3 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.input-gallery--1 { grid-template-columns: 1fr; }

/* Cards — the suite-keyed accent + inner stamp backing plane */
.input-card {
  border-radius: 8px;
  padding: 0.875rem;
}

/* Inner stamp — the position:relative anchor IS the component wrapper itself; the
   stamp gives the field a distinct backing plane inside the suite-colored card. */
.input-card-inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-type-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
}

/* Per-card suite accent — feeds --input-accent (focus border) on the field */
.input-card-red     { --input-accent: var(--color-red); }
.input-card-orange  { --input-accent: var(--color-orange); }
.input-card-yellow  { --input-accent: var(--color-yellow); }
.input-card-green   { --input-accent: var(--color-viridian); }
.input-card-blue    { --input-accent: var(--color-cobalt); }
.input-card-purple  { --input-accent: var(--color-amethyst); }
.input-card-fuchsia { --input-accent: var(--color-fuchsia); }
.input-card-viridian{ --input-accent: var(--color-viridian); }

/* Narrow width — 2-col then 1-col reflow */
@media (max-width: 640px) {
  .input-gallery--4,
  .input-gallery--3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .input-gallery--4,
  .input-gallery--3 {
    grid-template-columns: 1fr;
  }
}

/* ---- SCS Dropdown showcase ---- */
.dropdown-showcase {
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.dropdown-showcase-heading {
  font-size: 0.9375rem;
  margin: 0 0 0.25rem;
}

.dropdown-showcase-hint {
  font-size: 0.75rem;
  color: var(--color-white-muted, #a0a0a8);
  font-style: italic;
  margin: 0 0 1.25rem;
  font-family: var(--font-mono, 'Space Mono', monospace);
}

.dropdown-showcase-card {
  border-radius: 8px;
  padding: 0.875rem;
  --input-accent: var(--color-cobalt);
}

.dropdown-showcase-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.dropdown-showcase-value {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.55);
}

/* C911 · the why + the on-hover demo. */
.osr-why { border-radius: 8px; padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; line-height: 1.55; }
.hover-demo-panel { border-radius: 8px; padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.6rem; }
.hover-demo-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.hover-demo-row .hifi-btn { cursor: pointer; font: inherit; padding: 0.4rem 0.8rem; }
.hover-demo-copy code { color: var(--color-yellow, #eab308); }
</style>
