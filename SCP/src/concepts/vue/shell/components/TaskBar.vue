<script setup lang="ts">
/**
 * TaskBar — Fixed-Bottom Toolbar (FXAB + TBFL Patterns)
 *
 * Shell-concept primitive rendering registered toolbar buttons in a three-zone
 * flex layout (LEFT reserved · CENTER placeholder · RIGHT user-registered).
 * Buttons are resolved through `componentMap` by id (with `componentName` override).
 *
 * Pewter Tessera HiFi:
 *   D3 Pane Gradient + D8 Locked-Pane (hifi-pane-base + backdrop blur)
 *   D5 Embossed Border (top separator)
 *   D7 Button Variant (btn-base fallback)
 *
 * Layout: position: fixed; bottom: 0; left: 0; right: 0; z-index: 110
 * Option B per Ochre-Shell blueprint — full-width overlay spanning sidebar.
 *
 * Citation: TASKBAR-PEWTER-PASS-WAVE2-OCHRE-SHELL-BLUEPRINT.md §3
 * Citation: STRATIMUX-REFERENCE.md "Vue-Stratimux Integration Patterns"
 */
import { computed, onMounted, ref } from 'vue';
import type { Component } from 'vue';
import type { ToolbarButtonRegistration } from '../../../scsBridge/scsBridge.type';
import { RESERVED_TOOLBAR_BUTTON_IDS } from '../../../../model/toolbarRegistration.model';
// SCP IDENTITY INDICATOR (C698) · the SCP's declarative identity (scp.config.json scpName ·
// the FKIS Per-SCP-Identity-Config) rendered at the FAR LEFT of the toolbar — the SCP tells
// the user WHO IT IS. loadScpConfig is the 3s-abort-bounded /scp-config fetch (null-tolerant:
// no name → no chip, never a placeholder).
import { loadScpConfig } from '../../../../model/scpConfig.model';

interface Props {
  buttons: ToolbarButtonRegistration[];
  componentMap: Record<string, Component>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'buttonClicked', id: string): void;
}>();

// Cycle 158 R6 · Zone distribution by `position` field (TBFL pattern · Ochre-Shell)
// Default to 'right' for buttons without explicit position (preserves backward-compat
// for any user-registered buttons missing the field · matches Pewter contextual-action
// convention where contextual actions live right of primary registry navigation).
const leftButtons = computed(() =>
  props.buttons.filter((btn) => (btn.position ?? 'right') === 'left'),
);

// SCP IDENTITY INDICATOR (C698) · resolved once at mount; empty until (and unless) the
// SCP's own server answers /scp-config — absence renders NOTHING (no placeholder flash).
const scpIdentityName = ref('');
onMounted(() => {
  void loadScpConfig().then((cfg) => {
    if (cfg?.scpName) scpIdentityName.value = cfg.scpName;
  });
});

// D-UP8 · THE VERSION LABEL — the installed SCS-Bridge version beside the SCP name,
// populated by THIS SCP's own server (/scs-bridge-version · checked at server boot via
// `npm view scs-bridge version` with a registry fallback — independent of the bridge
// vintage, visible even when nothing else changed). The btn-tip hover pane (the
// SCS-Bridge inspiration) reveals the npm side and whether they differ. Color law:
// purple = current anor unknown · RED = the npm publish is GREATER than the installed
// bridge (update it) · FUCHSIA = the npm publish is LESSER (this install is ahead).
const bridgeInstalledVersion = ref<string | null>(null);
const bridgeNpmVersion = ref<string | null>(null);
// THE VERSIONING MUXAMETER · the classed verdict from the SCP server's counter comparison
// ('cli' → the CLI update · 'scp' → the Update circuit · 'both' · 'unknown' = a pre-counter
// publish, both paths). Drives the tip's routing lines; the click lands the Update page.
const bridgeUpdateClass = ref<'none' | 'cli' | 'scp' | 'both' | 'unknown'>('none');
// THE FULL MUXAMETER LINE — the two Demometers' counters, installed → remote, rendered in
// the pop over once available (installed rides bridge.json; remote rides the npm /latest
// custom field — absent until a counter-carrying publish).
type CounterPair = { cli: number; scp: number };
const installedCounters = ref<CounterPair | null>(null);
const remoteCounters = ref<CounterPair | null>(null);
const muxameterLine = computed<string | null>(() => {
  const i = installedCounters.value;
  const r = remoteCounters.value;
  if (!i && !r) return null;
  const side = (label: string, iv: number | undefined, rv: number | undefined): string => {
    if (iv === undefined && rv === undefined) return `${label} —`;
    if (rv === undefined || iv === rv) return `${label} #${iv ?? rv}`;
    return `${label} #${iv ?? '—'} → #${rv}`;
  };
  return `${side('CLI', i?.cli, r?.cli)} · ${side('App', i?.scp, r?.scp)}`;
});
// D-UP8c · the hover state crosses the body Teleport (CSS :hover cannot).
const versionTipVisible = ref(false);

// THE MUXAMETER CLICK — the DUAL-RAIL deep link (the goScpManagement exemplar): the GitM
// island's Update tab is the one destination for every update class.
function goUpdatePage(): void {
  const params = new URLSearchParams(window.location.search);
  params.set('island', 'gitm');
  params.set('sub', 'update');
  window.location.search = params.toString();
}
function versionNewer(a: string, b: string): boolean {
  const av = a.split('.').map((s) => parseInt(s, 10) || 0);
  const bv = b.split('.').map((s) => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
    if ((av[i] ?? 0) > (bv[i] ?? 0)) return true;
    if ((av[i] ?? 0) < (bv[i] ?? 0)) return false;
  }
  return false;
}
// D-RD1 · THE APPLIED-COUNTER RED DISCIPLINE: RED keys on the CLASSED verdict (the server
// compares the cli counter against the global install AND the scp counter against what THIS
// app has LANDED) — red persists after a global sync until Run Update lands the payload, and
// purple stands even when the npm VERSION is newer but the counters say nothing of value
// changed. Fuchsia (install ahead) is version-keyed as before.
const versionState = computed<'unknown' | 'current' | 'remote-greater' | 'remote-lesser'>(() => {
  const i = bridgeInstalledVersion.value;
  const n = bridgeNpmVersion.value;
  if (!i || !n) return 'unknown';
  if (versionNewer(i, n)) return 'remote-lesser';
  if (bridgeUpdateClass.value !== 'none') return 'remote-greater';
  return 'current';
});
const versionTipBody = computed<string>(() => {
  const i = bridgeInstalledVersion.value ?? '—';
  const n = bridgeNpmVersion.value;
  if (!n) return `Installed v${i} · npm not yet checked`;
  switch (versionState.value) {
    case 'remote-greater': {
      // THE MUXAMETER ROUTING LINES — the classed verdict names the honest path(s).
      const routes: Record<string, string> = {
        cli: 'A CLI update only — one install + restart from the Update page; your app needs no changes.',
        scp: 'A template update awaits this app — run it through the GitM Update page.',
        both: 'Both aspects updated — the CLI install + restart, then this app updates through its GitM page.',
        unknown: 'A newer SCS-Bridge is published — open the Update page for both paths.',
        none: 'A newer SCS-Bridge is published — open the Update page.',
      };
      return `Installed v${i} · npm v${n} — ${routes[bridgeUpdateClass.value] ?? routes.unknown} Click to open.`;
    }
    case 'remote-lesser':
      return `Installed v${i} · npm v${n} — this install is ahead of the npm publish.`;
    default:
      return i !== n
        ? `Installed v${i} · npm v${n} — current: nothing of value changed for this app anor the CLI.`
        : `Installed v${i} · npm v${n} — current.`;
  }
});
onMounted(() => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  fetch('/scs-bridge-version', { signal: abort.signal })
    .then((r) => (r.ok ? r.json() : null))
    .then((body: {
      installedVersion?: unknown;
      npmLatestVersion?: unknown;
      updateClass?: unknown;
      installedMuxameter?: unknown;
      remoteMuxameter?: unknown;
    } | null) => {
      if (body && typeof body.installedVersion === 'string') bridgeInstalledVersion.value = body.installedVersion;
      if (body && typeof body.npmLatestVersion === 'string') bridgeNpmVersion.value = body.npmLatestVersion;
      if (
        body &&
        typeof body.updateClass === 'string' &&
        ['none', 'cli', 'scp', 'both', 'unknown'].includes(body.updateClass)
      ) {
        bridgeUpdateClass.value = body.updateClass as 'none' | 'cli' | 'scp' | 'both' | 'unknown';
      }
      const pair = (m: unknown): CounterPair | null => {
        const o = m as { cli?: unknown; scp?: unknown } | null | undefined;
        return o && typeof o.cli === 'number' && typeof o.scp === 'number'
          ? { cli: o.cli, scp: o.scp }
          : null;
      };
      if (body) {
        installedCounters.value = pair(body.installedMuxameter);
        remoteCounters.value = pair(body.remoteMuxameter);
      }
    })
    .catch(() => { /* absent server route (an older SCP) — no label, never a placeholder */ })
    .finally(() => clearTimeout(timer));
});
const centerButtons = computed(() =>
  props.buttons.filter((btn) => btn.position === 'center'),
);
const rightButtons = computed(() =>
  props.buttons.filter((btn) => (btn.position ?? 'right') === 'right'),
);

// Component resolution: componentName override OR by-id lookup
function resolveComponent(btn: ToolbarButtonRegistration): Component | undefined {
  if (btn.componentName && props.componentMap[btn.componentName]) {
    return props.componentMap[btn.componentName];
  }
  return props.componentMap[btn.id];
}

// Per-button props resolver — UI PREP stub; WAVE 4 expands per-id mapping
function componentPropsFor(btn: ToolbarButtonRegistration): Record<string, unknown> {
  if (btn.id === 'turn-over') {
    return { pendingCount: btn.badgeCount ?? 0 };
  }
  return { enabled: btn.enabled };
}

function handleFallbackClick(btn: ToolbarButtonRegistration): void {
  if (!btn.enabled) return;
  emit('buttonClicked', btn.id);
}

// The hover-panel content: a TITLE + a one-sentence role explanation, keyed by button id.
// Falls back to the registration label when a button has no bespoke explanation.
const FALLBACK_TIP_CONTENT: Record<string, { title: string; body: string }> = {
  'create-b': {
    title: 'Working Branch (B)',
    body: 'Branches a new working version from A and checks it out — develop on B while A stays safe.',
  },
  'merge-b-a': {
    title: 'Merge B → A · Land the Proven Work',
    body: 'Merges proven working Branch B into the guarded stable A. Available after you confirm B successful. A fresh B is auto-forked on the next bind — you stay on B, always working ahead of stable.',
  },
};

function fallbackTipTitle(btn: ToolbarButtonRegistration): string {
  return FALLBACK_TIP_CONTENT[btn.id]?.title ?? btn.label;
}

function fallbackTipBody(btn: ToolbarButtonRegistration): string {
  return FALLBACK_TIP_CONTENT[btn.id]?.body ?? '';
}

function handleTurnOverTriggered(): void {
  console.log('[TaskBar] handleTurnOverTriggered FIRED · emitting buttonClicked turn-over');
  emit('buttonClicked', 'turn-over');
}
</script>

<template>
  <div class="scs-taskbar">
    <div class="taskbar-inner">

      <div class="taskbar-zone taskbar-zone--left">
        <!-- SCP IDENTITY INDICATOR (C698) · the far-left name chip — WHO this SCP is,
             dynamically provided (scp.config.json scpName via /scp-config). -->
        <span v-if="scpIdentityName" class="taskbar-scp-identity" :title="'SCP · ' + scpIdentityName">
          {{ scpIdentityName }}
        </span>
        <!-- D-UP8 · THE VERSION LABEL — beside the SCP name · HiFi purple base; RED when the
             npm publish is greater (update) · FUCHSIA when lesser (ahead). The hover pane
             (the btn-tip idiom) carries installed-vs-npm and the difference verdict. -->
        <span v-if="bridgeInstalledVersion" class="taskbar-version-wrap">
          <!-- THE MUXAMETER CLICK — the label navigates to the GitM island's Update tab
               (the one destination for every update class · the DUAL-RAIL deep link). -->
          <span
            class="taskbar-bridge-version"
            :class="{
              'taskbar-bridge-version--red': versionState === 'remote-greater',
              'taskbar-bridge-version--fuchsia': versionState === 'remote-lesser',
            }"
            role="button"
            tabindex="0"
            @mouseenter="versionTipVisible = true"
            @mouseleave="versionTipVisible = false"
            @click="goUpdatePage"
            @keydown.enter="goUpdatePage"
          >
            v{{ bridgeInstalledVersion }}
          </span>
          <!-- D-UP8c · BODY-MOUNTED (the bridgeStandbyOverlay law): the taskbar's inner row
               clips vertically (the BO-5 overflow cure) — no in-bar tip can rise above it.
               The Tactical Bridge's own strip escapes by living on document.body with fixed
               positioning; the Teleport is the same means. -->
          <Teleport to="body">
            <span
              class="taskbar-version-tip"
              :class="{ 'taskbar-version-tip--visible': versionTipVisible }"
              role="tooltip"
            >
              <span class="taskbar-version-tip-title">SCS-Bridge</span>
              <span class="taskbar-version-tip-body">{{ versionTipBody }}</span>
              <!-- THE FULL MUXAMETER LINE — the two counters, installed → remote, once
                   the data serves (installed via bridge.json · remote via the npm publish). -->
              <span v-if="muxameterLine" class="taskbar-version-tip-counters">{{ muxameterLine }}</span>
            </span>
          </Teleport>
        </span>
        <template v-for="btn in leftButtons" :key="btn.id">
          <component
            :is="resolveComponent(btn)"
            v-if="resolveComponent(btn)"
            v-bind="componentPropsFor(btn)"
            :disabled="!btn.enabled"
            @turn-over-triggered="handleTurnOverTriggered"
            @click="$emit('buttonClicked', btn.id)"
          />
          <span
            v-else
            class="taskbar-btn-wrap"
            :style="{ '--btn-neon': `var(--color-${btn.suiteColor})` }"
          >
            <button
              :class="['taskbar-btn', 'btn-base', { 'taskbar-btn--disabled': !btn.enabled }]"
              :disabled="!btn.enabled"
              :aria-label="btn.label"
              @click="handleFallbackClick(btn)"
            >
              <i :class="['taskbar-btn-icon', btn.icon]"></i>
              <span v-if="btn.badgeCount && btn.badgeCount > 0" class="taskbar-btn-badge">
                {{ btn.badgeCount }}
              </span>
            </button>
            <span class="btn-tip" role="tooltip">
              <span class="btn-tip-title">{{ fallbackTipTitle(btn) }}</span>
              <span class="btn-tip-body">{{ fallbackTipBody(btn) }}</span>
            </span>
          </span>
        </template>
      </div>

      <div class="taskbar-zone taskbar-zone--center">
        <!-- WAVE 4: future expansion (Sessions button center-mount) -->
      </div>

      <div class="taskbar-zone taskbar-zone--right">
        <template v-for="btn in rightButtons" :key="btn.id">
          <component
            :is="resolveComponent(btn)"
            v-if="resolveComponent(btn)"
            v-bind="componentPropsFor(btn)"
            :disabled="!btn.enabled"
            @turn-over-triggered="handleTurnOverTriggered"
            @click="$emit('buttonClicked', btn.id)"
          />
          <span
            v-else
            class="taskbar-btn-wrap"
            :style="{ '--btn-neon': `var(--color-${btn.suiteColor})` }"
          >
            <button
              :class="['taskbar-btn', 'btn-base', { 'taskbar-btn--disabled': !btn.enabled }]"
              :disabled="!btn.enabled"
              :aria-label="btn.label"
              @click="handleFallbackClick(btn)"
            >
              <i :class="['taskbar-btn-icon', btn.icon]"></i>
              <span v-if="btn.badgeCount && btn.badgeCount > 0" class="taskbar-btn-badge">
                {{ btn.badgeCount }}
              </span>
            </button>
            <span class="btn-tip" role="tooltip">
              <span class="btn-tip-title">{{ fallbackTipTitle(btn) }}</span>
              <span class="btn-tip-body">{{ fallbackTipBody(btn) }}</span>
            </span>
          </span>
        </template>
      </div>

    </div>
    <!-- The bottom spectrum band: the INVERSE of the top bar — an 8px buffer under the
         buttons absorbing the shader curve's bottom-edge distortion (the curved modes bend
         the bottom rows; this band is what bends instead of the controls). -->
    <div class="taskbar-bottom-band" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.scs-taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 110;
  /* 56px content + the 12px bottom spectrum band — the buttons ride above the
     shader curve's bottom-edge distortion; the band is what bends instead. */
  height: 68px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 10, 16, 0.92);
  backdrop-filter: blur(8px);
}

.taskbar-inner {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 0.5rem;
  gap: 0.5rem;
  /* BO-5 (C454) · THE X-SCROLL CURE: the inner row overflowed the viewport (1280 vs 1200)
     and pushed the PAGE wide. The taskbar governs its own overflow — the page never scrolls
     horizontally for it. min-width:0 lets flex children shrink instead of summing past. */
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.taskbar-inner::-webkit-scrollbar {
  display: none;
}

/* The bottom spectrum band — the INVERSE of the top bar's order (pink → red), 8px. */
.taskbar-bottom-band {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12px;
  opacity: 0.85;
  /* dimmed 33% — less value, hue + saturation kept */
  filter: brightness(0.67);
  /* D1 · hardcoded spectrum hex → var(--color-*) so a user re-tint flows through the
     bottom Suite Cascade Bar (values are byte-identical to the tokens — zero default change).
     The brown ::after overlay below is the footer EXCLUSION — preserved as-is. */
  background: linear-gradient(90deg,
    var(--color-fuchsia) 0%, var(--color-fuchsia) 14.28%,
    var(--color-purple) 14.28%, var(--color-purple) 28.57%,
    var(--color-blue) 28.57%, var(--color-blue) 42.85%,
    var(--color-green) 42.85%, var(--color-green) 57.14%,
    var(--color-yellow) 57.14%, var(--color-yellow) 71.42%,
    var(--color-orange) 71.42%, var(--color-orange) 85.71%,
    var(--color-red) 85.71%, var(--color-red) 100%);
}

/* The fixed overlay atop the band: full length, a 3-part gradient — transparent at the
   beginning, brown through the middle, transparent at the end. Lives INSIDE the band
   container so it rides under the same brightness filter. */
.taskbar-bottom-band::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgb(101, 67, 33) 50%,
    transparent 100%);
}

.taskbar-zone--left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* SCP IDENTITY INDICATOR (C698) · Pewter voice — Orbitron uppercase, white glow text,
   a slim accent rule on its left edge; recede-toned so it identifies without shouting. */
.taskbar-scp-identity {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  border-left: 3px solid var(--color-viridian, #40826d);
  padding: 0.15rem 0.6rem 0.15rem 0.5rem;
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

.taskbar-zone--center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.taskbar-zone--right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* The positioning wrapper — carries --btn-neon + hosts the tooltip OUTSIDE the clipped body
   so the chamfer cannot cut the panel away. NO clip-path here. */
.taskbar-btn-wrap {
  --btn-neon: rgba(255, 255, 255, 0.6);
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Dark neon-framed register: a deep near-black chamfered body whose suite identity reads
   through a thin glowing edge (--btn-neon, set per-button from the registration suiteColor).
   The color informs via the glow — never a flooded fill. */
.taskbar-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0.5rem;
  cursor: pointer;

  /* The deep field — radial depth over near-black. */
  background:
    radial-gradient(ellipse at 40% 32%, rgba(255, 255, 255, 0.05) 0%, rgba(12, 14, 20, 0) 64%),
    rgb(12, 14, 20);

  /* The neon edge — thin ring tinted by the suite color. */
  border: 1px solid color-mix(in srgb, var(--btn-neon) 50%, transparent);
  /* Chamfered corners — the angular StratiPUNK cut. */
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 7px 0 color-mix(in srgb, var(--btn-neon) 24%, transparent),
    inset 0 0 9px 0 color-mix(in srgb, var(--btn-neon) 8%, transparent);
  color: var(--color-white-conductor, #f0f0f0);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

/* The neon glyph — the suite color glowing on the dark body. */
.taskbar-btn-icon {
  color: var(--btn-neon);
  text-shadow: 0 0 6px color-mix(in srgb, var(--btn-neon) 55%, transparent);
}

.taskbar-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--btn-neon) 85%, transparent);
  box-shadow:
    0 0 13px 1px color-mix(in srgb, var(--btn-neon) 45%, transparent),
    inset 0 0 13px 0 color-mix(in srgb, var(--btn-neon) 15%, transparent);
}

.taskbar-btn:active:not(:disabled) {
  box-shadow: inset 0 0 11px 1px color-mix(in srgb, var(--btn-neon) 30%, transparent);
}

.taskbar-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button. Lives as a
   SIBLING of the clipped body (under .taskbar-btn-wrap) so the chamfer never cuts it. */
.taskbar-btn-wrap .btn-tip {
  position: absolute;
  bottom: calc(100% + 11px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 220px;
  padding: 8px 11px;
  white-space: normal;
  text-align: left;
  background: rgba(10, 12, 18, 0.97);
  border: 1px solid color-mix(in srgb, var(--btn-neon) 50%, transparent);
  border-radius: 5px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--btn-neon) 32%, transparent), 0 6px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 220;
}

.taskbar-btn-wrap .btn-tip-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--btn-neon);
  text-shadow: 0 0 6px color-mix(in srgb, var(--btn-neon) 45%, transparent), 0.5px 0.5px 0 #fff;
}

.taskbar-btn-wrap .btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(228, 232, 240, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.taskbar-btn-wrap:hover .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.taskbar-btn-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 9px;
  font-weight: bold;
  background: rgba(20, 10, 25, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.85);
}

/* D-UP8 · THE VERSION LABEL — HiFi purple base beside the SCP name; the state variants
   swap the neon (RED = npm greater · update / FUCHSIA = npm lesser · ahead). The hover
   pane mirrors the btn-tip recipe exactly (the SCS-Bridge inspiration). */
.taskbar-version-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.taskbar-bridge-version {
  --ver-neon: var(--color-purple, #a78bfa);
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--ver-neon) 55%, transparent);
  color: var(--ver-neon);
  text-shadow: 0 0 6px color-mix(in srgb, var(--ver-neon) 40%, transparent);
  cursor: pointer;
  /* THE CLICKABLE FEEL — the label IS the update button; the cursor alone was the only
     tell. Hover lifts + fills the neon; active PRESSES (the taskbar-btn family feel). */
  background: transparent;
  transition: background 0.14s ease, box-shadow 0.14s ease, transform 0.1s ease;
}
.taskbar-bridge-version:hover {
  background: color-mix(in srgb, var(--ver-neon) 14%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ver-neon) 45%, transparent);
  transform: translateY(-1px);
}
.taskbar-bridge-version:active {
  background: color-mix(in srgb, var(--ver-neon) 26%, transparent);
  box-shadow: 0 0 4px color-mix(in srgb, var(--ver-neon) 60%, transparent) inset;
  transform: translateY(1px) scale(0.97);
}
.taskbar-bridge-version--red {
  --ver-neon: var(--color-red, #f87171);
}
.taskbar-bridge-version--fuchsia {
  --ver-neon: var(--color-fuchsia, #e879f9);
}
.taskbar-version-tip {
  /* D-UP8c · BODY-MOUNTED + FIXED (the bridgeStandbyOverlay law · the working Tactical
     Bridge means): the pane lives on document.body, positioned above the bar at the
     label's corner — no taskbar ancestor exists to clip it. 79px = the 68px bar + 11px. */
  position: fixed;
  bottom: 79px;
  left: 12px;
  transform: translateY(4px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 240px;
  padding: 8px 11px;
  white-space: normal;
  text-align: left;
  background: rgba(10, 12, 18, 0.97);
  border: 1px solid color-mix(in srgb, var(--color-purple, #a78bfa) 50%, transparent);
  border-radius: 5px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-purple, #a78bfa) 32%, transparent), 0 6px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 220;
}
.taskbar-version-tip-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-purple, #a78bfa);
  text-shadow: 0 0 6px color-mix(in srgb, var(--color-purple, #a78bfa) 45%, transparent), 0.5px 0.5px 0 #fff;
}
.taskbar-version-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(228, 232, 240, 0.82);
}
.taskbar-version-tip-counters {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--color-purple, #a78bfa) 85%, #fff);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 4px;
  margin-top: 2px;
}
.taskbar-version-tip--visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
