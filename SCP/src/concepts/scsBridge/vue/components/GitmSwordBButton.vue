<script setup lang="ts">
/**
 * GitmSwordBButton — GITM A↔B Refinement (Sword epoch) · the B SETTER (Pewter Tessera · Ochre)
 *
 * The symmetric mirror of the Shield A-setter (GitmStableAButton). Where the Shield holds A
 * pristine as the launch baseline, the Sword is the DRIFT VESSEL — it crystallizes the current
 * drift onto a new B while protecting Shield A. DUAL-MODE, keyed on whether the Shield/Origin
 * is fully committed (shieldFullyCommitted):
 *
 *   - Mode 1 — Drift Crystallizer (A is DIRTY / has uncommitted drift):
 *     a commit-message panel (templated default · editable). On confirm it chains three EXISTING
 *     MCP tool strings via triggerGitmAction (NO new bridge quality · the Shield's settle pattern):
 *       1. gitm_branch_create { name: <new B>, checkout: true }  — git switch -c carries the drift
 *          onto B (dirty-safe · A untouched).
 *       2. gitm_stage_all_and_commit { message }  — commits the carried drift onto B.
 *       3. gitm_register_stable {}  — registers the from-branch (A) as stableBranch · the deadlock
 *          guard (a B that can never merge / an ANCHORLOCK on the Shield is dissolved by this).
 *     The drift leaves A committed onto B; A holds its launch base.
 *
 *   - Mode 2 — Prismatic Free-Hop (A is CLEAN / fully committed):
 *     the Sword turns PRISMATIC (an animated iridescent gradient border) — the signal "A is safe,
 *     hop anywhere cleanly." The panel becomes a branch-selector (the SUBSUMED Freehop · the
 *     standalone GitmFreehopButton is removed in favor of this). Rides gitm_branch_switch { name }.
 *
 * Badge — the DEDICATED-ENUMERATION predicate (no new state field): shows the live
 * changesPrimedOnB ONLY when THIS setter's branch (the workingBranch B) is the checked-out one;
 * else 0. SIBLING of the chamfered <button> (the f20033b Chamfer-Clip Trap fix — the badge MUST
 * be a sibling, never a child, so the clip-path never cuts the corner).
 *
 * State reads come from the read-only reactive gitm controller (gitmJson · NO /gitm-status poll).
 * Dispatch via getGlobalScsBridgeController().triggerGitmAction (Decision 2).
 *
 * Pewter Tessera HiFi (Ochre · the B drift identity · prismatic when A is safe):
 *   D1 Color: Ochre/amber palette inline (Output Firewall · no missing-token reliance)
 *   D5 Embossed Border + chamfered clip-path (StratiPUNK precedent)
 *
 * Citation: GitmStableAButton.vue (the Shield clone donor · chamfered button + *-wrap + sibling
 *   badge + panel + the stage_all_and_commit→register_stable settle chain).
 * Citation: GitmFreehopButton.vue (the Mode-2 branch-hop panel + gitm_branch_switch donor).
 * Citation: GITM-AB-REFINE-BUILD-SPEC.md §THE CONFERRED MECHANISM + §THE WAVES W3.
 */
import { ref, computed, watch, onUnmounted, inject } from 'vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
import ScsInput from '../../../vue/components/ScsInput.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

// GITM CONFORMANCE FIX (SORD §10 · the setter GATING root) — resolve the gitm controller via inject
// with the getGlobal fallback (same proven pattern as the scsBridge controller below · already fixed
// 053). getGlobalGitmController() is null/stale in the TaskBar render context (cleared on IslandWrapper
// unmount :415); when null, the Sword's gating computeds read empty → the setter silently mis-evaluates.
// IslandWrapper provides the GITM_CONTROLLER_KEY inject (:175). NO guard weakened.
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();

// SORD Shield/Sword FIX (053 diagnosis · swept from c823c40) — resolve the controller via inject
// (the proven send_message accessor · Vue runtime-singleton) with the getGlobal fallback.
// getGlobalScsBridgeController() is null/stale in the TaskBar render context (cached at setup ·
// cleared on IslandWrapper unmount), so handleSpin/handleHop returned at `if (!controller) return`
// BEFORE the triggerGitmAction dispatch. Every WORKING feature uses inject; the GitM setters used
// getGlobal. Used by handleSpin + handleHop below.
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

// W3c/W3d · THE LIVENESS BRIDGE (the Turn-Over Disconnect Guard) — push the scsBridge WS-connection
// witness into the gitm controller so isLive/isHeld compose from ONE synced source. The Sword's
// B-creation invitation MUST NOT fire while the Bridge is dark: a blank workingBranch during the
// post-reload MOCH gap (gitmJson null) OR a dropped socket reads as "no B" and would invite a FALSE
// forge mid-crash. Immediate sync at setup + a reactive watch keep the gate live across WS drops.
if (gitmController && scsBridgeController) {
  gitmController.sync({ connectionEstablished: scsBridgeController.connectionEstablished.value });
  watch(
    () => scsBridgeController.connectionEstablished.value,
    (connected) => gitmController.sync({ connectionEstablished: connected }),
  );
}
// isHeld = the dark hour (WS down OR the MOCH-gap null gitmJson). While held, the Sword renders a
// HELD state — the held branch is shown, but the Forge invite is suppressed and the action fails
// honestly (never a gitm_create_working dispatch into a dead server).
const isHeld = computed<boolean>(() => gitmController?.isHeld.value ?? true);

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

const commitMessage = ref<string>('gitm: spin drift onto B');
const selectedBranch = ref<string>('');
// W3b · THE HONEST-FAILURE REASON (the Turn-Over Disconnect Guard) — a named guard reason surfaced
// in the panel when a B gesture is attempted while dark. Never a silent no-op / dispatch into the
// void: the handler early-returns and sets this so the user sees WHY the action did not fire.
const heldReason = ref<string>('');

let settleTimer: ReturnType<typeof setTimeout> | null = null;

// All state derives from the reactive gitm controller's gitmJson (no poll).
const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');
const dirty = computed<boolean>(() => gitmController?.gitmJson.value?.dirty ?? false);
const branches = computed<string[]>(() => gitmController?.gitmJson.value?.branches ?? []);
// SB-DS6 · branch names mapped to ScsDropdown option shape (value === label; each branch a row).
// C593 · THE REGISTERED-FIRST PRIORITY DISPLAY (user law · Sword B): the CURRENTLY
// REGISTERED working B leads the list (labeled), the seat second, the rest alphabetical.
const branchOptions = computed(() => {
  const wb = workingBranch.value;
  const cb = currentBranch.value;
  const rank = (b: string): number => (b === wb ? 0 : b === cb ? 1 : 2);
  return [...branches.value]
    .sort((x, y) => rank(x) - rank(y) || x.localeCompare(y))
    .map((b) => ({ value: b, label: b === wb ? `${b} · registered B` : b }));
});
const stableBranch = computed<string>(() => gitmController?.gitmJson.value?.stableBranch ?? '');
const workingBranch = computed<string>(() => gitmController?.gitmJson.value?.workingBranch ?? '');

// DEDICATED ENUMERATION (no new state field) — the Sword badge shows the live changesPrimedOnB
// ONLY when its branch (the working branch B) is the checked-out one; else 0. (True per-branch
// counts for the inactive branch = a future refinement, NOT this build.)
const changeCount = computed<number>(() => {
  const count = gitmController?.changesPrimedOnB.value ?? 0;
  return currentBranch.value.length > 0 && currentBranch.value === workingBranch.value ? count : 0;
});

// shieldFullyCommitted (the Sword goes PRISMATIC · Mode 2) — "no work would be lost by hopping":
// a stable A is registered AND there is no uncommitted drift to lose on the origin. Concretely,
// prismatic when stableBranch is set AND (if we are currently ON the stable A, the tree is clean;
// if we are elsewhere, the origin-A drift cannot be lost by a hop from here).
const shieldFullyCommitted = computed<boolean>(() => {
  if (stableBranch.value.length === 0) return false;
  const count = gitmController?.changesPrimedOnB.value ?? 0;
  // C284 (the hop-with-drift leak): NOT-on-A used to auto-pass — a dirty B could hop and
  // strand its uncommitted drift. The prismatic requires THE TREE clean wherever we stand.
  return currentBranch.value === stableBranch.value ? count === 0 : !dirty.value;
});

// Mode 1 = Drift Crystallizer (A dirty · commit-message panel). Mode 2 = Prismatic Free-Hop.
const isPrismatic = computed<boolean>(() => shieldFullyCommitted.value);

// W3 · THE SWORD CHIP (discoverability cure) — an ALWAYS-VISIBLE 'Spin to B' hint shown ONLY in
// Mode 1 (Drift Crystallizer · !isPrismatic) AND when there is drift to spin (changeCount > 0). No
// behavior change — the chip is a label pointing at the khanda's existing togglePanel. It uses the
// dedicated-enumeration changeCount (the same badge signal · nonzero only on the working B).
const showSpinChip = computed<boolean>(() => !isPrismatic.value && changeCount.value > 0);

// The templated default new-B branch name (D-BN doctrine: the from-branch VERBATIM + uuid —
// `b/` is pure lineage naming; branchRoles carries the semantics).
const templatedBranchName = computed<string>(() => {
  const from = currentBranch.value.length > 0 ? currentBranch.value : 'a';
  return `b/${from}-${crypto.randomUUID()}`;
});

function togglePanel(): void {
  open.value = !open.value;
  // C593 · THE REGISTERED-FIRST SELECTION — every Mode-2 open re-pins the hop selector to the
  // REGISTERED working B (the seat only when no B is assigned); a prior pick never masks it.
  if (open.value && isPrismatic.value) {
    selectedBranch.value =
      workingBranch.value.length > 0 ? workingBranch.value : currentBranch.value;
  }
}

// Mode 1 — spin the drift onto a new B, then register the from-branch (A) as stable. Three
// EXISTING MCP tool strings chained with the Shield's settle delay (no new bridge quality).
function handleSpin(): void {
  const controller = scsBridgeController;
  if (!controller) return;
  // W3b · HONEST FAILURE while dark — the spin chains create+commit+register onto a server that has
  // gone dark; refuse and surface the reason rather than dispatch into the void.
  if (isHeld.value) {
    heldReason.value = 'the Bridge is dark · GitM held — spin unavailable until it reconnects.';
    return;
  }
  heldReason.value = '';
  const message = commitMessage.value.trim() || 'gitm: spin drift onto B';
  const newBranch = templatedBranchName.value;

  // 1. Create AND switch onto the new B (git switch -c · carries the dirty drift over · A untouched).
  controller.triggerGitmAction('gitm_branch_create', { name: newBranch, checkout: true });

  // 2. Stage + commit the carried drift onto B, THEN 3. register the from-branch (A) as stable —
  //    each sequenced after a short settle so the prior op lands first (the Shield chain pattern).
  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    controller.triggerGitmAction('gitm_stage_all_and_commit', { message });
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      // Register A as stableBranch (the deadlock guard · protect Shield A · enable Merge B→A).
      controller.triggerGitmAction('gitm_register_stable', {});
    }, 1200);
  }, 1200);

  open.value = false;
}

// Mode 2 — Prismatic Free-Hop. Hop the running bridge to ANY branch (the subsumed Freehop).
function handleHop(): void {
  const controller = scsBridgeController;
  if (!controller) return;
  // W3b · HONEST FAILURE while dark — a branch hop needs the running bridge; refuse when dark.
  if (isHeld.value) {
    heldReason.value = 'the Bridge is dark · GitM held — hop unavailable until it reconnects.';
    return;
  }
  heldReason.value = '';
  const name = selectedBranch.value.trim();
  if (name.length === 0) return;
  controller.triggerGitmAction('gitm_branch_switch', { name });
  open.value = false;
}

// D-T-HOP (Cycle 270 · user design): forge a FRESH B from A — the failing/prior B is STASHED
// (the branch REMAINS in git; only the workingBranch pointer re-points), changing WHICH branch
// is being worked to merge into A. gitm_create_working = create + switch + workingBranch
// re-point + candidate-created; nodemon is untouched (A keeps running). The ToolBar tracks the
// A↔B difference against the NEW B from here.
function handleForgeFreshB(): void {
  const controller = scsBridgeController;
  if (!controller) return;
  // W3b · HONEST FAILURE while dark (the genuine-break dispatch-into-void the guard closes) — forging
  // a fresh B commits a new branch on a dead/dark server. Refuse and surface the reason: a turn-to-B
  // attempt while dark FAILS HONESTLY, never a silent gitm_create_working into the void.
  if (isHeld.value) {
    heldReason.value = 'the Bridge is dark · GitM held — cannot forge a fresh B until it reconnects.';
    return;
  }
  heldReason.value = '';
  controller.triggerGitmAction('gitm_create_working', {});
  open.value = false;
}

onUnmounted(() => {
  if (settleTimer) clearTimeout(settleTimer);
});
</script>

<template>
  <div class="sword-b-wrap" ref="wrapEl" data-readout="SWORD · REGISTER WORKING B">
    <button
      class="sword-b-btn"
      :class="{ prismatic: isPrismatic }"
      aria-label="Sword (B setter)"
      @click="togglePanel"
    >
      <i class="fa-solid fa-khanda" aria-hidden="true"></i>
    
    </button>
    <!-- DEDICATED-ENUMERATION badge — changesPrimedOnB only when currentBranch === workingBranch.
         SIBLING of the chamfered button (the f20033b chamfer fix) so the clip-path never cuts it. -->
    <span class="ab-count-badge">{{ changeCount }}</span>
    <!-- W3 · THE SWORD CHIP (discoverability cure) — an always-visible 'Spin to B' hint in Mode 1
         with drift. SIBLING of the chamfered button (never a child · the chamfer never cuts it).
         Ochre accent · the Pewter chip treatment · NO behavior change (points at the khanda). -->
    <span v-if="showSpinChip" class="spin-chip" aria-hidden="true">Spin to B</span>
    <span class="btn-tip" role="tooltip">
      <span class="btn-tip-title">{{ isPrismatic ? 'the Tactical Bridge · Sword B — Free Hop' : 'the Tactical Bridge · Sword B — Spin Drift' }}</span>
      <span class="btn-tip-body">{{ isPrismatic
        ? 'A is committed and safe — hop the running bridge to any branch cleanly.'
        : 'Crystallizes your current drift onto a new B branch with a commit message, leaving Shield A pristine at its launch base.' }}</span>
    </span>

    <!-- Mode 1 — Drift Crystallizer (A dirty) · the commit-message panel. -->
    <div v-if="open && !isPrismatic" class="sword-b-panel" :style="panelFixedStyle" role="dialog" aria-label="Spin Drift onto B">
      <p class="panel-title">SPIN DRIFT → B</p>
      <p class="panel-hint">
        Carries your current drift onto a new B branch and commits it — Shield A stays pristine
        at its launch base. A is registered stable so B can later merge back.
      </p>
      <label class="panel-field">
        <span class="field-label">New B branch</span>
        <span class="field-readonly">{{ templatedBranchName }}</span>
      </label>
      <label class="panel-field">
        <span class="field-label">Commit message</span>
        <ScsInput v-model="commitMessage" class="field-input" type="text" />
      </label>
      <div class="panel-actions">
        <button class="panel-confirm" :class="{ held: isHeld }" :disabled="isHeld" @click="handleSpin">Spin</button>
        <button class="panel-cancel" @click="open = false">Cancel</button>
      </div>
      <!-- W3 · THE HELD BANNER (board requirement) — the same Pewter dark-glass chip in Mode 1. -->
      <p v-if="isHeld" class="held-banner">
        {{ heldReason || 'the Bridge is dark · GitM held' }}
      </p>
    </div>

    <!-- Mode 2 — Prismatic Free-Hop (A clean) · the subsumed branch-selector hop. -->
    <div v-else-if="open && isPrismatic" class="sword-b-panel prismatic-panel" :style="panelFixedStyle" role="dialog" aria-label="Free Branch Hop">
      <p class="panel-title">FREE HOP</p>
      <p class="panel-hint">A is safe — hop the running bridge to any branch cleanly.</p>
      <label class="panel-field">
        <span class="field-label">Branch</span>
        <ScsDropdown v-model="selectedBranch" :options="branchOptions" class="field-select" />
      </label>
      <div class="panel-actions">
        <button class="panel-confirm" :disabled="isHeld" @click="handleHop">Hop</button>
        <!-- W3a · THE FORGE GATE (the Turn-Over Disconnect Guard) — the B-creation invite fires ONLY
             when live (WS up AND a real gitmJson landed). While held/dark, render a HELD label +
             disabled state instead of the "Forge Fresh B" invitation, so a blank workingBranch in the
             reload MOCH gap can never lure a false forge mid-crash. -->
        <button
          class="panel-confirm"
          :class="{ held: isHeld }"
          :disabled="isHeld"
          @click="handleForgeFreshB"
        >
          {{ isHeld ? 'Held (Bridge dark)' : workingBranch ? 'Fresh B (stash current)' : 'Forge Fresh B' }}
        </button>
        <button class="panel-cancel" @click="open = false">Cancel</button>
      </div>
      <!-- W3 · THE HELD BANNER (board requirement) — a compact Pewter chip while the Bridge is dark ·
           GitM held. Surfaces the honest-failure reason when a gesture was refused. -->
      <p v-if="isHeld" class="held-banner">
        {{ heldReason || 'the Bridge is dark · GitM held' }}
      </p>
      <p v-else-if="workingBranch" class="panel-hint">
        Fresh B stashes {{ workingBranch }} — the branch remains in git; the working pointer
        re-points to the new B (the one that merges into A).
      </p>
    </div>
  </div>
</template>

<style scoped>
.sword-b-wrap {
  position: relative;
  display: inline-flex;
}

/* Dark neon-framed register: a deep near-black chamfered body whose ochre B identity reads
   through a thin glowing edge — the color informs via the glow, never a flooded fill. */
.sword-b-btn {
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
    radial-gradient(ellipse at 38% 30%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 13, 5, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(234, 179, 8, 0.09) 0%, rgba(14, 11, 4, 0) 70%),
    rgb(15, 12, 6);

  /* The neon edge — a thin ochre/amber ring carried by border + glow. */
  border: 1px solid rgba(234, 179, 8, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(234, 179, 8, 0.28),
    inset 0 0 10px 0 rgba(234, 179, 8, 0.10);

  /* The neon glyph. */
  color: rgb(255, 206, 9);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.6);
}

.sword-b-btn:hover:not(.prismatic) {
  border-color: rgba(234, 179, 8, 0.9);
  color: rgb(255, 224, 120);
  box-shadow:
    0 0 14px 1px rgba(234, 179, 8, 0.5),
    inset 0 0 14px 0 rgba(234, 179, 8, 0.18);
}

.sword-b-btn:active {
  box-shadow: inset 0 0 12px 1px rgba(234, 179, 8, 0.35);
}

/* PRISMATIC — Mode 2 (A is clean + safe · hop anywhere). An animated iridescent gradient border
   carried on a conic-gradient ring that rotates, signaling the "free hop" safety. The glyph
   shifts to a bright neutral so the rainbow edge reads as the dominant state. */
.sword-b-btn.prismatic {
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
  animation: sword-prismatic-spin 4s linear infinite;
}

.sword-b-btn.prismatic:hover {
  box-shadow:
    0 0 18px 2px rgba(180, 120, 255, 0.7),
    0 0 26px 3px rgba(80, 180, 255, 0.5),
    inset 0 0 14px 0 rgba(255, 200, 60, 0.18);
}

@keyframes sword-prismatic-spin {
  to {
    /* Rotate the conic ring by re-keying the hue cycle (background-position has no effect on
       conic border-box, so animate the hue via a filter sweep for the iridescent shimmer). */
    filter: hue-rotate(360deg);
  }
}

/* DEDICATED-ENUMERATION badge — changesPrimedOnB only when on the working branch B (else 0).
   ALWAYS-ON render (default 0), recolored to this button's own ochre B edge. */
.ab-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: rgb(22, 17, 6);
  color: rgb(255, 224, 120);
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
  border: 1px solid rgba(234, 179, 8, 0.7);
  box-shadow: 0 0 6px rgba(234, 179, 8, 0.5);
}

/* W3 · THE SWORD CHIP — the always-visible 'Spin to B' discoverability hint. SIBLING of the
   chamfered button (never a child) so the clip-path never cuts it. Sits just under the khanda,
   centered. Ochre accent · the Pewter chip treatment (deep near-black · thin ochre edge + glow). */
.spin-chip {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 2px 7px;
  border-radius: 8px;
  background: rgba(15, 12, 6, 0.96);
  border: 1px solid rgba(234, 179, 8, 0.55);
  color: rgb(255, 224, 120);
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-shadow: 0 0 5px rgba(234, 179, 8, 0.5);
  box-shadow: 0 0 6px rgba(234, 179, 8, 0.35);
  pointer-events: none;
  z-index: 210;
}

/* The Pewter HiFi hover panel — an explanatory micro-pane above the button. Lives as a SIBLING
   of the clipped body (under .sword-b-wrap) so the chamfer never cuts it. */
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
  background: rgba(15, 12, 6, 0.97);
  border: 1px solid rgba(234, 179, 8, 0.55);
  border-radius: 5px;
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.34), 0 6px 16px rgba(0, 0, 0, 0.6);
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
  color: rgb(255, 224, 120);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.5), 0.5px 0.5px 0 #fff;
}

.btn-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(236, 230, 218, 0.82);
  text-shadow: 0.5px 0.5px 0 #fff;
}

.sword-b-btn:hover ~ .btn-tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.sword-b-panel {
  position: absolute;
  bottom: 54px;
  right: 0;
  width: 260px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 8px;
  background: rgba(16, 13, 5, 0.97);
  border: 1px solid rgba(234, 179, 8, 0.4);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.6), 0 0 14px rgba(234, 179, 8, 0.25);
  z-index: 200;
}

/* The Prismatic panel — an iridescent edge matching the Mode-2 free-hop signal. */
.sword-b-panel.prismatic-panel {
  border-color: transparent;
  background:
    linear-gradient(rgba(12, 10, 14, 0.98), rgba(12, 10, 14, 0.98)) padding-box,
    conic-gradient(
      from 0deg,
      rgb(255, 90, 160), rgb(255, 200, 60), rgb(90, 230, 160),
      rgb(80, 180, 255), rgb(180, 120, 255), rgb(255, 90, 160)
    ) border-box;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.6), 0 0 16px rgba(180, 120, 255, 0.3);
}

.panel-title {
  margin: 0;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  color: rgb(255, 206, 9);
}

.prismatic-panel .panel-title {
  color: rgb(230, 220, 255);
  text-shadow: 0 0 6px rgba(180, 120, 255, 0.5);
}

.panel-hint {
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.45;
  color: rgba(220, 200, 150, 0.78);
}

.panel-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  color: rgba(220, 200, 150, 0.8);
}

.field-readonly {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(8, 6, 2, 0.9);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: rgba(255, 224, 120, 0.92);
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.68rem;
  word-break: break-all;
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(8, 6, 2, 0.9);
  border: 1px solid rgba(234, 179, 8, 0.35);
  color: #f5ecd6;
  font-size: 0.78rem;
}
/* SB-DS6 · ScsDropdown replaces the native branch <select>; the trigger spans the field width.
   amber accent for the open-state trigger border (matches the retired select's edge). */
.field-select {
  display: block;
  width: 100%;
  --dropdown-accent: rgba(234, 179, 8, 0.55);
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
  background: rgb(15, 12, 6);
  color: rgb(255, 224, 120);
  border: 1px solid rgba(234, 179, 8, 0.55);
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.25);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.5);
}

.panel-confirm:hover {
  border-color: rgba(234, 179, 8, 0.9);
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.45);
}

.panel-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(235, 228, 215, 0.85);
}

/* W3a · THE HELD CONFIRM — while the Bridge is dark, the creation/hop confirms dim to a muted,
   non-inviting slate (the Pewter dark-glass treatment · the ochre invite glow is withdrawn). */
.panel-confirm.held,
.panel-confirm:disabled {
  background: rgba(20, 18, 12, 0.9);
  color: rgba(180, 172, 158, 0.6);
  border-color: rgba(120, 116, 104, 0.4);
  box-shadow: none;
  text-shadow: none;
  cursor: not-allowed;
}

/* W3 · THE HELD BANNER (the Turn-Over Disconnect Guard · board requirement) — a compact Pewter
   dark-glass chip: 'the Bridge is dark · GitM held'. Same near-black body + thin edge + soft glow
   as .spin-chip, recolored to a neutral slate so it reads as a HELD (not error, not invite) state. */
.held-banner {
  margin: 0;
  padding: 6px 9px;
  border-radius: 6px;
  background: rgba(14, 13, 10, 0.96);
  border: 1px solid rgba(150, 145, 132, 0.4);
  color: rgba(210, 205, 194, 0.9);
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.4;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
}

/* C878 · THE DOCK DESIGN LANGUAGE (Pewter · HiFi StratiPUNK): selectors ROUND · turn-overs SQUARED. */
/* C879 · knocked back from the full circle — squarish yet DISTINCT from the 9px turn-overs. */
.sword-b-btn { border-radius: 16px; }
.sword-b-wrap { position: relative; }
</style>
