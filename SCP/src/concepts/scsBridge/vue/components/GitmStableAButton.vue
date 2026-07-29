<script setup lang="ts">
/**
 * GitmStableAButton — GITM A↔B (#641) · Register Stable A (Pewter Tessera · Viridian)
 *
 * The richer Stable-A surface: a branch-selector dropdown (defaults to the current branch)
 * + a commit-message input. On Register it dispatches gitm_stage_all_and_commit then, on the
 * action settling, gitm_register_stable (sequential — the A must be committed clean before B
 * is created). When the tree is already clean it shows "Mark" (skips the commit, just
 * registers the current branch as stable A).
 *
 * State is read from GET /gitm-status (the snapshot the bridge writes to gitm.json). The
 * component re-fetches on mount, after each dispatch, and on a light interval so the
 * dropdown + dirty hint stay fresh (the TaskBar lives outside the gitm landing's relay).
 *
 * Pewter Tessera HiFi (Suite 4 Viridian · the A/B baseline color):
 *   D1 Color: Viridian palette inline (Output Firewall · no missing-token reliance)
 *   D5 Embossed Border: dark top/right · light bottom/left · INVERTED on :active
 *
 * Citation: ScsBridgeTurnOverButton.vue (CGDA precedent) · GitmLanding.vue (/gitm-status fetch).
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W4b Button 1.
 */
import { ref, computed, watch, onUnmounted, inject } from 'vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
// #641-R W5 — read state from the reactive gitm controller (replaces the 5s /gitm-status poll).
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
import ScsInput from '../../../vue/components/ScsInput.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

// GITM CONFORMANCE FIX (SORD §10 · the setter GATING root) — resolve the gitm controller via inject
// with the getGlobal fallback (same proven pattern as the scsBridge controller below · already fixed
// 053). getGlobalGitmController() is null/stale in the TaskBar render context (cleared on IslandWrapper
// unmount :415); when null, isLocked/branches/stableBranch read empty → the Register-Stable-A gating
// silently mis-evaluates. IslandWrapper provides the GITM_CONTROLLER_KEY inject (:175). NO guard weakened.
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();

// SORD Shield/Sword FIX (053 diagnosis · swept from c823c40) — resolve the controller via inject
// (the proven send_message accessor · Vue runtime-singleton) with the getGlobal fallback.
// getGlobalScsBridgeController() is null/stale in the TaskBar render context (cached at setup ·
// cleared on IslandWrapper unmount), so handleRegister returned at `if (!controller) return`
// BEFORE the triggerGitmAction dispatch. Every WORKING feature uses inject; the GitM setters used
// getGlobal. Used by handleRegister below.
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

const open = ref<boolean>(false);
// BO-5b · THE PANEL ESCAPE (C585): the taskbar row's X-scroll cure (overflow-x auto ·
// overflow-y hidden · TaskBar.vue BO-5/C454) CLIPS absolutely-positioned descendants — this
// panel opened INVISIBLE inside the row. On open, measure the wrap and pin the panel FIXED to
// the viewport (fixed escapes ancestor overflow; the taskbar carries no transform), keeping
// the per-button anchor (right-aligned, above the bar).
const wrapEl = ref<HTMLElement | null>(null);
const panelFixedStyle = ref<Record<string, string>>({});
watch(open, (isOpen) => {
  if (!isOpen) return;
  const rect = wrapEl.value?.getBoundingClientRect();
  if (!rect) return;
  panelFixedStyle.value = {
    position: 'fixed',
    right: `${Math.max(8, window.innerWidth - rect.right)}px`,
    bottom: `${window.innerHeight - rect.top + 6}px`,
    zIndex: '300',
  };
});

const commitMessage = ref<string>('gitm: register stable A');
const selectedBranch = ref<string>('');
// C647 · the last AUTO-pinned value — distinguishes the system's pin from the user's pick.
let lastAutoPin = '';

let isGitmActingPoll: ReturnType<typeof setTimeout> | null = null;

// #641-R W5 — all state derives from the reactive gitm controller's gitmJson (no poll).
const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');
const dirty = computed<boolean>(() => gitmController?.gitmJson.value?.dirty ?? false);
const branches = computed<string[]>(() => {
  const raw = gitmController?.gitmJson.value?.branches ?? [];
  if (raw.length > 0) return raw;
  // Q1 FRESH-INSTALL FIX (062): before the STARC branch list populates (or under the empty
  // sentinel), branches[] is [] → the Shield dropdown renders empty → master is never selectable
  // as the Origin/A. Fall back to the current branch so master is offered immediately — the same
  // empty-ground fallback the changeCount computed (:63) already applies on a fresh install.
  const cb = gitmController?.gitmJson.value?.currentBranch ?? '';
  return cb.length > 0 ? [cb] : [];
});
// SB-DS6 · branch names mapped to ScsDropdown option shape (value === label; each branch a row).
// C593 · THE REGISTERED-FIRST PRIORITY DISPLAY (user law · Shield A): the CURRENTLY
// REGISTERED stable leads the list (labeled), the seat second, the rest alphabetical —
// opening the panel SHOWS what is registered, never buries it under the seat.
const branchOptions = computed(() => {
  const sb = stableBranch.value;
  const cb = currentBranch.value;
  // C644 · THE AUTHORITATIVE UNION (the second flush-window sighting): a transient partial
  // branches[] snapshot rendered the selector WITHOUT the registered A while the Branches
  // panel (bridge-side) held the full roster. The selector unions the names the rail itself
  // declares authoritative — the registered stable, the seat, both roles — so it can never
  // lack the Shield anor the seat, whatever the enumeration's momentary state (the C621
  // union lesson, component-side).
  const roles = gitmController?.gitmJson.value?.branchRoles;
  const union = new Set<string>([...branches.value, sb, cb, roles?.a ?? '', roles?.b ?? '']);
  union.delete('');
  const rank = (b: string): number => (b === sb ? 0 : b === cb ? 1 : 2);
  return [...union]
    .sort((x, y) => rank(x) - rank(y) || x.localeCompare(y))
    .map((b) => ({ value: b, label: b === sb ? `${b} · registered A` : b }));
});
const stableBranch = computed<string>(() => gitmController?.gitmJson.value?.stableBranch ?? '');
const abMode = computed<string>(() => gitmController?.gitmJson.value?.abMode ?? 'idle');
// C648 · always REGISTER — the SELECTED branch is what registers (never 'mark current').
const actionLabel = computed<string>(() => 'Register');

// D-β · THE BLINK BEACON (Shield control) — when a turnOverAlert is live and NO stable A is
// registered yet (uninducted), the alert directs to the SHIELD first (register a stable A before
// there is anything to turn over to). The Shield blinks a Pewter HiFi-yellow pulse ring — direction
// without teaching the UI. Active ONLY on the uninducted ground (stableBranch === ''); once a
// stable A exists the Turn-Over-A control is the directed control and this stays dark. mouseenter
// disarms for that alert (requestedAt-keyed); the alert's own self-retire also ends it.
const alertBlinkDisarmedAt = ref<number>(0);
const alertBlinkActive = computed<boolean>(() => {
  if (stableBranch.value.length > 0) return false;
  const gj = gitmController?.gitmJson.value;
  const alert = gj?.turnOverAlert;
  if (!alert) return false;
  const retired = (gj?.turnOver?.at ?? 0) > alert.requestedAt;
  if (retired) return false;
  return alertBlinkDisarmedAt.value !== alert.requestedAt;
});
function disarmAlertBlink(): void {
  const alert = gitmController?.gitmJson.value?.turnOverAlert;
  if (alert) alertBlinkDisarmedAt.value = alert.requestedAt;
}

// DEDICATED ENUMERATION (Sword epoch · no new state field) — the Shield badge shows the live
// changesPrimedOnB for ITS branch (the stable A). FRESH-INSTALL FIX: when no A is registered
// yet (stableBranch === ''), the current branch IS the Origin the user operates from, so the
// Shield shows the count then too — otherwise the badge hard-zeroes on every fresh install
// (the regression: "master" === "" is false → 0 forever). Once A is registered, show only when
// checked out on A. (True per-branch counts for the inactive branch = a future refinement.)
const changeCount = computed<number>(() => {
  const count = gitmController?.changesPrimedOnB.value ?? 0;
  if (currentBranch.value.length === 0) return 0;
  return stableBranch.value === '' || currentBranch.value === stableBranch.value ? count : 0;
});

// ANCHORLOCK (#641-R W5) — A is locked while the A↔B cycle is mid-flight (a B candidate
// exists or a turn-over is unconfirmed). Committing here annotates the current state rather
// than re-baselining A. Unlocked at idle (no cycle) and success (a clean merge-ready state).
const isLocked = computed<boolean>(
  () => abMode.value !== 'idle' && abMode.value !== 'success',
);

// C593 · THE REGISTERED-FIRST SELECTION — default to the REGISTERED stable when one
// exists (the seat only on an unregistered machine).
watch(
  [stableBranch, currentBranch],
  ([sb, cb]) => {
    // C647 · THE HYDRATION RE-PIN (user law: the selection sets AFTER complete hydration) —
    // the boot-gap pin lands whatever the held/pre-hydration state offers; when the live
    // fetch/relay hydrates (stable anor seat changes), the AUTO-pin follows — unless the
    // user has DIVERGED (a manual pick is never overwritten).
    const pin = sb.length > 0 ? sb : cb;
    if (pin.length > 0 && (selectedBranch.value.length === 0 || selectedBranch.value === lastAutoPin)) {
      selectedBranch.value = pin;
      lastAutoPin = pin;
    }
  },
  { immediate: true },
);

function togglePanel(): void {
  open.value = !open.value;
  // C593 — every OPEN re-pins the selection to the live registration (a prior pick anor the
  // seat must not mask what is currently marked as A).
  if (open.value) {
    selectedBranch.value = stableBranch.value.length > 0 ? stableBranch.value : currentBranch.value;
    lastAutoPin = selectedBranch.value;
  }
}

function handleRegister(): void {
  const controller = scsBridgeController;
  if (!controller) return;
  const message = commitMessage.value.trim() || 'gitm: register stable A';

  if (dirty.value) {
    // 1. Stage + commit, THEN 2. register-stable once the action settles (sequential).
    controller.triggerGitmAction('gitm_stage_all_and_commit', { message });
    // Sequence the register after a short settle so the commit lands before the annotation.
    if (isGitmActingPoll) clearTimeout(isGitmActingPoll);
    isGitmActingPoll = setTimeout(() => {
      controller.triggerGitmAction('gitm_register_stable', { branch: selectedBranch.value });
    }, 1200);
  } else {
    // Already clean — just annotate the current branch as stable A.
    controller.triggerGitmAction('gitm_register_stable', { branch: selectedBranch.value });
  }

  open.value = false;
}

onUnmounted(() => {
  if (isGitmActingPoll) clearTimeout(isGitmActingPoll);
});
</script>

<template>
  <div class="stable-a-wrap" ref="wrapEl" data-readout="SHIELD · REGISTER STABLE A">
    <button
      class="stable-a-btn"
      :class="{ 'has-stable': stableBranch.length > 0, 'flushed': stableBranch.length === 0, 'toab-blink': alertBlinkActive }"
      aria-label="Register Stable Branch (A)"
      @click="togglePanel"
      @mouseenter="disarmAlertBlink"
    >
      <span v-if="alertBlinkActive" class="toab-ring" aria-hidden="true"></span>
      <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
    
    </button>
    <!-- CHANGEDIAL — the live changesPrimedOnB count badge · ALWAYS-ON (no v-if · default 0).
         SIBLING of the chamfered button (like .btn-tip) so the clip-path never cuts the corner. -->
    <span class="ab-count-badge">{{ changeCount }}</span>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">{{ stableBranch.length > 0 ? `the Tactical Bridge · Shield A: ${stableBranch}` : 'the Tactical Bridge · Shield A — UNSET' }}</span>
      <span class="btn-tip-body">{{ stableBranch.length === 0 ? 'The branches were flushed — no Shield A is registered. Press here and pick your stable branch to reset the Tactical Bridge.' : '' }}A is the guarded stable — the proven branch you never work on directly. Your edits live on B; when B is proven you merge it into A. Auto-registered on setup; press here only to re-register or pick a different stable.</span>
    </span>

    <div v-if="open" class="stable-a-panel" :style="panelFixedStyle" role="dialog" aria-label="Register Stable A">
      <p class="panel-title">REGISTER STABLE A</p>
      <!-- ANCHORLOCK (#641-R) — the A Bridge must be fully committed for usage. -->
      <p v-if="isLocked" class="panel-lock-hint">
        A Bridge must be fully committed for usage — the A↔B cycle is active. Committing
        here annotates the current state rather than re-baselining A.
      </p>
      <label class="panel-field">
        <span class="field-label">Branch</span>
        <ScsDropdown v-model="selectedBranch" :options="branchOptions" class="field-select" />
      </label>
      <label class="panel-field" v-if="dirty">
        <span class="field-label">Commit message</span>
        <ScsInput v-model="commitMessage" class="field-input" type="text" />
      </label>
      <p v-else class="panel-clean-hint">Working tree clean — registers the selected branch.</p>
      <div class="panel-actions">
        <button class="panel-confirm" @click="handleRegister">{{ actionLabel }}</button>
        <button class="panel-cancel" @click="open = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stable-a-wrap {
  position: relative;
  display: inline-flex;
}

/* Dark neon-framed register: a deep near-black chamfered body whose viridian identity
   reads through a thin glowing edge — the color informs via the glow, never a flooded fill. */
/* C643 · THE FLUSHED RING (user law: the SAME color-change mechanism as the Sword's B-hop
   condition, carried to Shield A) — stableBranch === '' means AN ERROR FLUSHED THE BRANCHES
   (the zero-reset anor the C634 phantom gate leaving A honest-empty). The rotating conic
   ring is the release-grade stop-gap: the user is DIRECTED here to Set A. */
.stable-a-btn.flushed {
  border-color: transparent;
  color: rgb(245, 245, 255);
  text-shadow:
    0 0 6px rgba(255, 120, 200, 0.7),
    0 0 10px rgba(120, 200, 255, 0.5);
  background:
    linear-gradient(rgb(12, 10, 14), rgb(12, 10, 14)) padding-box,
    conic-gradient(
      from 0deg,
      rgb(255, 90, 160), rgb(255, 200, 60), rgb(90, 230, 160),
      rgb(80, 180, 255), rgb(180, 120, 255), rgb(255, 90, 160)
    ) border-box;
  box-shadow:
    0 0 12px 1px rgba(180, 120, 255, 0.45),
    0 0 18px 2px rgba(80, 180, 255, 0.30),
    inset 0 0 12px 0 rgba(255, 200, 60, 0.12);
  animation: shield-flushed-spin 4s linear infinite;
}
.stable-a-btn.flushed:hover {
  box-shadow:
    0 0 18px 2px rgba(180, 120, 255, 0.7),
    0 0 26px 3px rgba(80, 180, 255, 0.5),
    inset 0 0 14px 0 rgba(255, 200, 60, 0.18);
}
@keyframes shield-flushed-spin {
  to {
    filter: hue-rotate(360deg);
  }
}

.stable-a-btn {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* The deep field — radial depth over near-black, not a solid fill. */
  background:
    radial-gradient(ellipse at 38% 30%, rgba(19, 213, 148, 0.15) 0%, rgba(8, 14, 12, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(19, 213, 148, 0.09) 0%, rgba(7, 12, 10, 0) 70%),
    rgb(9, 14, 12);

  /* The neon edge — a thin viridian ring carried by border + glow. */
  border: 1px solid rgba(19, 213, 148, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(19, 213, 148, 0.28),
    inset 0 0 10px 0 rgba(19, 213, 148, 0.10);

  /* The neon glyph. */
  color: rgb(19, 213, 148);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.6);
}

.stable-a-btn:hover {
  border-color: rgba(19, 213, 148, 0.9);
  color: rgb(110, 245, 200);
  box-shadow:
    0 0 14px 1px rgba(19, 213, 148, 0.5),
    inset 0 0 14px 0 rgba(19, 213, 148, 0.18);
}

.stable-a-btn:active {
  box-shadow: inset 0 0 12px 1px rgba(19, 213, 148, 0.35);
}

/* Registered-stable — the steady brighter neon (an established, glowing edge). */
.stable-a-btn.has-stable {
  border-color: rgba(19, 213, 148, 0.85);
  box-shadow:
    0 0 16px 1px rgba(19, 213, 148, 0.55),
    inset 0 0 12px 0 rgba(19, 213, 148, 0.16);
}

/* D-β · THE BLINK BEACON — the live-alert Pewter HiFi-yellow pulse ring. While a turnOverAlert is
   live and this is the directed control (uninducted ground · no stable A), a yellow ring pulses to
   DIRECT the eye here (no UI teaching). Disarmed on first hover (mouseenter) or on the alert's own
   self-retire. HiFi yellow family (var(--color-yellow, #eab308) · rgba 234,179,8 — matches the
   ANCHORLOCK ochre-warn tone). */
/* The overlay ring is a real DOM element (opacity keyframe survives the offscreen streamed
   composition — box-shadow keyframes did not). The .flushed conic-spin identity ring on the
   button root is untouched: the ring OVERLAYS it, so the direction beacon and the flushed
   identity ring coexist (no dual-animation stacking needed — separate elements). */
.toab-ring {
  position: absolute;
  inset: -3px;
  border: 2px solid var(--color-yellow, #eab308);
  border-radius: inherit;
  pointer-events: none;
  animation: toabRingPulse 1.1s ease-in-out infinite;
  z-index: 2;
}

@keyframes toabRingPulse {
  0%, 100% {
    opacity: 0.12;
  }
  50% {
    opacity: 0.95;
  }
}

/* CHANGEDIAL badge — the live changesPrimedOnB count, ALWAYS-ON (default 0). Cloned from the
   ochre B precedent (GitmTurnOverBButton.vue), recolored to this button's own viridian edge. */
.ab-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgb(6, 14, 12);
  color: rgb(110, 245, 200);
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.6875rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(19, 213, 148, 0.7);
  box-shadow: 0 0 6px rgba(19, 213, 148, 0.5);
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button. Lives as a
   SIBLING of the clipped body (under .stable-a-wrap) so the chamfer never cuts it. */
.btn-tip {
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
  background: rgba(9, 14, 12, 0.97);
  border: 1px solid rgba(19, 213, 148, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(19, 213, 148, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 220;
}

.btn-tip-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgb(110, 245, 200);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(222, 236, 230, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.stable-a-btn:hover ~ .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.stable-a-panel {
  position: absolute;
  bottom: 54px;
  right: 0;
  width: 260px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 8px;
  background: rgba(8, 16, 14, 0.97);
  border: 1px solid rgba(19, 213, 148, 0.4);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.6), 0 0 14px rgba(16, 185, 129, 0.25);
  z-index: 200;
}

.panel-title {
  margin: 0;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  color: #13d594;
}

.panel-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  color: rgba(170, 210, 195, 0.8);
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(4, 10, 8, 0.9);
  border: 1px solid rgba(19, 213, 148, 0.35);
  color: #e6f5ee;
  font-size: 0.78rem;
}
/* SB-DS6 · ScsDropdown replaces the native branch <select>; the wrapper spans the field width.
   viridian accent for the open-state trigger border (matches the retired select's edge). */
.field-select {
  display: block;
  width: 100%;
  --dropdown-accent: rgba(19, 213, 148, 0.55);
}

.panel-clean-hint {
  margin: 0;
  font-size: 0.7rem;
  color: rgba(170, 210, 195, 0.7);
}

/* ANCHORLOCK hint (#641-R) — an ochre warn tone so the lock reads as a transition caution
   distinct from the viridian baseline panel. */
.panel-lock-hint {
  margin: 0;
  padding: 7px 9px;
  font-size: 0.68rem;
  line-height: 1.45;
  color: rgb(253, 224, 145);
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.35);
  border-radius: 5px;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.4);
}

.panel-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.panel-confirm,
.panel-cancel {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.panel-confirm {
  background: rgb(9, 14, 12);
  color: rgb(110, 245, 200);
  border: 1px solid rgba(19, 213, 148, 0.55);
  box-shadow: 0 0 8px rgba(19, 213, 148, 0.25);
  text-shadow: 0 0 6px rgba(19, 213, 148, 0.5);
}

.panel-confirm:hover {
  border-color: rgba(19, 213, 148, 0.9);
  box-shadow: 0 0 12px rgba(19, 213, 148, 0.45);
}

.panel-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(220, 235, 228, 0.85);
}

/* C878 · THE DOCK DESIGN LANGUAGE (Pewter · HiFi StratiPUNK): selectors ROUND · turn-overs SQUARED. */
/* C879 · knocked back from the full circle — squarish yet DISTINCT from the 9px turn-overs. */
.stable-a-btn { border-radius: 16px; }
.stable-a-wrap { position: relative; }
</style>
