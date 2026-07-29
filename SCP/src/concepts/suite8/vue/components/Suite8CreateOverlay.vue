<script setup lang="ts">
/**
 * Suite8CreateOverlay — the Create S8 STEP PIPELINE (C372 · the Creation Pipeline Overlay)
 *
 * The overlay is a FOUR-STEP process. The user's design: a TOP stepper strip (the step in the
 * process) over a BOTTOM occurring-panel (what is happening now · swaps per step). The StratiPUNK
 * dress (S-STRATIPUNK · Pewter Tessera D9) rides the shell — the deep field, the neon frame + the
 * chamfered corners, the ceremonial type, the bracket, and (Step 2/3) the geometric charge — because
 * the system itself takes the stage while the SCP scaffolds and duplicates a page.
 *
 *   STEP 1 · NAME     — the MD-3 mint form (the NDEP name input). POST is deferred to Step 2.
 *   STEP 2 · SCAFFOLD — fires POST /s8/create → the created dir + the two files (real response bound).
 *                       Auto-advance on success; an error rests honestly with a Retry.
 *   STEP 3 · THE PAGE — invokes suite8_page_create on the bridge via the controller's awaitable
 *                       triggerSuite8PageCreate (the SAME /mcp tools/call idiom the GitM buttons ride,
 *                       PARSING the structured result). Args: name (PascalCase · spaces stripped),
 *                       displayName (the minted name), designation (THIS SCP's name · getScpName ??
 *                       bridgeJson.activeScp). The duplication runs up to ~30s; on timeout the files
 *                       may still have landed → verify after the turn-over.
 *   STEP 4 · TURN OVER — the close. On a NON-'b/' branch: the Sword-B hard turn-over (the door's
 *                       requestTurnOverToB composition · writeGitmTurnoverProgress + triggerHardTurnOver
 *                       'B' · git switch -c carries the new page onto B · nodemon restarts + REBUILDS).
 *                       On a 'b/' branch: a plain restart-carrying turn-over on B (triggerGitmTurnOver
 *                       'B'). The SCP restart rebuilds the client (nodemon exec = build:server &&
 *                       build:client && ts-node) → the page appears once the rebuild completes.
 *
 * Citation: Suite8Biplane.vue requestTurnOverToB (:250 — the writeGitmTurnoverProgress + hard turn-over).
 * Citation: GitmSwordBButton.vue triggerGitmAction/triggerGitmMean (the /mcp tools/call idiom).
 * Citation: scsBridgeController triggerSuite8PageCreate (the awaitable page-create result-parsing mean).
 * Citation: S-STRATIPUNK Skill (the six ceremonial elements ridden over the overlay shell).
 */
import { ref, computed, inject } from 'vue';
import {
  getGlobalScsBridgeController,
  SCS_BRIDGE_CONTROLLER_KEY,
} from '../../../scsBridge/scsBridgeController';
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
import { isWorkingBranchPer } from '../../../gitm/gitm.type';
import {
  writeGitmTurnoverProgress,
  GITM_TURNOVER_DEADLINE_MS,
} from '../../../../model/gitmTurnover.model';
import { showBridgeStandby } from '../../../webSocketClient/model/bridgeStandbyOverlay.model';

const emit = defineEmits<{ (e: 'close'): void }>();

// The controllers — inject-with-getGlobal (the proven GitM/Bridge accessor · the same pattern the
// Sword-B button + the Biplane door use).
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();

// ============================================================
// THE STEPPER — the four steps + the active index.
// ============================================================
type StepId = 'name' | 'scaffold' | 'page' | 'turnover';
const STEPS: Array<{ id: StepId; label: string; ordinal: string }> = [
  { id: 'name', label: 'Name', ordinal: '01' },
  { id: 'scaffold', label: 'Scaffold', ordinal: '02' },
  { id: 'page', label: 'The Page', ordinal: '03' },
  { id: 'turnover', label: 'Turn Over', ordinal: '04' },
];
const activeStep = ref<StepId>('name');
const activeIndex = computed<number>(() => STEPS.findIndex((s) => s.id === activeStep.value));
function stepState(i: number): 'done' | 'active' | 'pending' {
  if (i < activeIndex.value) return 'done';
  if (i === activeIndex.value) return 'active';
  return 'pending';
}

// ============================================================
// STEP 1 · NAME (the MD-3 mint verbatim — the input only · the POST moves to Step 2).
// ============================================================
const createName = ref<string>('');
const createError = ref<string>('');

// The PascalCase concept name for suite8_page_create's `name` arg — the minted name with spaces
// stripped (the --name argv the tool expects). "My Domain" → "MyDomain".
const pascalName = computed<string>(() =>
  createName.value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(''),
);

const nameHint = computed<string>(() => {
  const raw = createName.value;
  if (raw.length === 0) return '';
  if (!/^[A-Za-z0-9 ]+$/.test(raw)) return 'Letters, numbers, and spaces only.';
  return '';
});

function advanceFromName() {
  const name = createName.value.trim();
  if (!name) {
    createError.value = 'Enter a name for your SCP addition';
    return;
  }
  if (nameHint.value) return;
  createError.value = '';
  activeStep.value = 'scaffold';
  void runScaffold();
}

// ============================================================
// STEP 2 · SCAFFOLD (POST /s8/create — the real response bound · auto-advance on success).
// ============================================================
const scaffoldBusy = ref<boolean>(false);
const scaffoldError = ref<string>('');
// The minted { name, directoryPath } from the 200 response (null until scaffolded).
const minted = ref<{ name: string; directoryPath: string } | null>(null);

async function runScaffold() {
  const name = createName.value.trim();
  scaffoldBusy.value = true;
  scaffoldError.value = '';
  minted.value = null;
  try {
    const r = await fetch('/s8/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = (await r.json().catch(() => ({}))) as {
      ok?: boolean;
      name?: string;
      directoryPath?: string;
      reason?: string;
    };
    if (!r.ok) {
      scaffoldError.value = data.reason ?? 'Could not scaffold your SCP addition';
      return;
    }
    minted.value = { name: data.name ?? name, directoryPath: data.directoryPath ?? '' };
    // Auto-advance to Step 3 (the page) once the scaffold lands.
    activeStep.value = 'page';
  } catch {
    scaffoldError.value = 'Network error — could not reach the server';
  } finally {
    scaffoldBusy.value = false;
  }
}

function retryScaffold() {
  void runScaffold();
}

// ============================================================
// STEP 3 · THE PAGE (suite8_page_create · the awaitable controller mean · the ~30s window).
// ============================================================
const pageBusy = ref<boolean>(false);
const pageError = ref<string>('');
const pageTimedOut = ref<boolean>(false);
const pageResult = ref<{ conceptName?: string; gatesPassed?: string[] } | null>(null);

// THE DESIGNATION — this SCP's own name (the FKIS payload-supplied pattern · registry-guarded on
// the bridge). getScpName() reads scp.config.json { scpName }; the live bridgeJson.activeScp is the
// fallback when the config read has not resolved.
async function resolveDesignation(): Promise<string> {
  const fromConfig = (await scsBridgeController?.getScpName()) ?? '';
  if (fromConfig) return fromConfig;
  return scsBridgeController?.bridgeJson.value?.activeScp ?? '';
}

async function runPageCreate() {
  const ctrl = scsBridgeController;
  if (!ctrl || pageBusy.value || !minted.value) return;
  pageBusy.value = true;
  pageError.value = '';
  pageTimedOut.value = false;
  pageResult.value = null;
  try {
    const designation = await resolveDesignation();
    if (!designation) {
      pageError.value = 'Could not resolve this SCP’s name — is the Bridge running?';
      return;
    }
    const res = await ctrl.triggerSuite8PageCreate({
      name: pascalName.value,
      displayName: minted.value.name,
      designation,
    });
    if (res.timedOut) {
      pageTimedOut.value = true;
      return;
    }
    if (!res.ok) {
      pageError.value = res.reason ?? 'The page could not be created.';
      return;
    }
    pageResult.value = { conceptName: res.conceptName, gatesPassed: res.gatesPassed };
    // Advance to the turn-over close once the page lands.
    activeStep.value = 'turnover';
  } catch {
    pageError.value = 'Unexpected error while creating the page.';
  } finally {
    pageBusy.value = false;
  }
}

function retryPageCreate() {
  void runPageCreate();
}

// Proceed to the turn-over step even on a timeout (the files may have landed · verify after restart).
function proceedAfterTimeout() {
  activeStep.value = 'turnover';
}

// ============================================================
// STEP 4 · TURN OVER (the door's requestTurnOverToB · branch-aware · rebuild-truthful).
// ============================================================
const currentBranch = computed<string>(() => gitmController?.gitmJson.value?.currentBranch ?? '');
// A working (B) branch; anything else (or an absent read) is the A side. D-BN · THE branchRoles
// SWEEP — the working-B identity is the canonical roles.b (isWorkingBranchPer), NOT the `b/` prefix.
const onWorkingB = computed<boolean>(() =>
  isWorkingBranchPer(currentBranch.value, gitmController?.gitmJson.value),
);

const turnOverBusy = ref<boolean>(false);
const turnOverNote = ref<string>('');

// THE TURN OVER — carries the new page onto a working branch and restarts the SCP (which REBUILDS
// the client · nodemon exec = build:server && build:client && ts-node), so the new page appears once
// the rebuild completes. On the A side: the Sword-B hard turn-over (git switch -c b/<branch>-<ts> ·
// the door's composition). On a 'b/' branch: a plain restart-carrying turn-over on B.
async function doTurnOver() {
  const sb = scsBridgeController;
  if (!sb || turnOverBusy.value) return;
  turnOverBusy.value = true;
  turnOverNote.value = '';
  try {
    showBridgeStandby('sword-b');
    if (onWorkingB.value) {
      // Already on a working branch — a plain restart-carrying turn-over on B (the honest same-branch
      // variant · no new branch · the dirty tree with the new page rides the restart onto B).
      writeGitmTurnoverProgress({
        source: 'B',
        overlayVariant: 'sword-b',
    turnClass: 'sword',
        deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
        stableA: currentBranch.value,
        bridgeEndpoint: sb.bridgeJson.value?.endpoint ?? '',
        scpName: (await sb.getScpName()) ?? undefined,
      });
      await sb.triggerGitmTurnOver('B');
      turnOverNote.value = 'Restarting on your working branch — the new page appears once the rebuild completes…';
    } else {
      // The A side — forge a working B (git switch -c carries the dirty tree · the door's leg).
      const fromBranch = currentBranch.value.length > 0 ? currentBranch.value : 'a';
      // D-BN · THE branchRoles SWEEP · THE CANONICAL MINT — `b/<fromBranch>-<uuid>`, fromBranch VERBATIM
      // (no prefix stripping) + crypto.randomUUID() (browser global · unique · replaces the legacy Date.now()).
      const newBranch = `b/${fromBranch}-${crypto.randomUUID()}`;
      writeGitmTurnoverProgress({
        source: 'B',
        overlayVariant: 'sword-b',
    turnClass: 'sword',
        deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
        stableA: fromBranch,
        bridgeEndpoint: sb.bridgeJson.value?.endpoint ?? '',
        scpName: (await sb.getScpName()) ?? undefined,
      });
      sb.triggerHardTurnOver('B', newBranch, true);
      turnOverNote.value = 'Turning over to B — the SCP restarts + rebuilds; the new page appears after the rebuild…';
    }
  } catch {
    turnOverNote.value = 'Could not turn over — is the Bridge running?';
  } finally {
    setTimeout(() => {
      turnOverBusy.value = false;
    }, 1200);
  }
}

// ============================================================
// SHELL
// ============================================================
function close() {
  emit('close');
}
function onBackdropClick() {
  // Never close mid-flight (scaffold / page build in progress).
  if (scaffoldBusy.value || pageBusy.value) return;
  close();
}
</script>

<template>
  <div class="create-overlay-backdrop" @click.self="onBackdropClick">
    <div
      class="create-overlay-panel stratipunk-frame"
      role="dialog"
      aria-modal="true"
      aria-label="Create S8 addition"
      @keyup.esc="close"
    >
      <!-- THE DEEP FIELD grain layer (StratiPUNK E1 · scanline grain over the radial field). -->
      <div class="sp-grain" aria-hidden="true"></div>

      <header class="overlay-header">
        <h2 class="overlay-title">Create S8</h2>
        <button
          type="button"
          class="overlay-close"
          aria-label="Close"
          @click="close"
        >
          ×
        </button>
      </header>

      <!-- ============================================ -->
      <!-- TOP · THE STEPPER STRIP (the step in the process · StratiPUNK ceremonial type). -->
      <!-- ============================================ -->
      <nav class="stepper-strip" aria-label="Create pipeline steps">
        <template v-for="(step, i) in STEPS" :key="step.id">
          <div :class="['step-cell', `step-cell--${stepState(i)}`]">
            <span class="step-ordinal">{{ step.ordinal }}</span>
            <span class="step-label">{{ step.label }}</span>
          </div>
          <span v-if="i < STEPS.length - 1" class="step-rail" aria-hidden="true"></span>
        </template>
      </nav>

      <!-- ============================================ -->
      <!-- BOTTOM · THE OCCURRING PANEL (what is happening now · swaps per step). -->
      <!-- ============================================ -->
      <section class="occurring-panel">
        <!-- STEP 1 · NAME ------------------------------------------------ -->
        <div v-if="activeStep === 'name'" class="occurring name-occurring">
          <h3 class="occurring-heading">Name your addition</h3>
          <p class="occurring-note">
            Give your new addition a name. It is scaffolded into this project as a directory you own,
            then given a working page and carried onto a branch.
          </p>
          <label class="field-label" for="create-overlay-name">Name</label>
          <input
            id="create-overlay-name"
            v-model="createName"
            class="name-input"
            type="text"
            placeholder="e.g. My Domain"
            autocomplete="off"
            @keyup.enter="advanceFromName"
          />
          <p v-if="pascalName" class="field-hint">
            Concept name: <code class="mono-inline">{{ pascalName }}</code>
          </p>
          <p v-if="nameHint" class="field-hint field-hint--warn">{{ nameHint }}</p>
          <p v-if="createError" class="field-error">{{ createError }}</p>
          <div class="occurring-actions">
            <button type="button" class="sp-btn sp-btn--go" @click="advanceFromName">Next · Scaffold</button>
            <button type="button" class="sp-btn sp-btn--ghost" @click="close">Cancel</button>
          </div>
        </div>

        <!-- STEP 2 · SCAFFOLD -------------------------------------------- -->
        <div v-else-if="activeStep === 'scaffold'" class="occurring scaffold-occurring">
          <h3 class="occurring-heading">Scaffolding the directory</h3>
          <!-- In-flight — the geometric charge (StratiPUNK E5). -->
          <template v-if="scaffoldBusy">
            <div class="sp-charge" aria-hidden="true">
              <span class="charge-poly p3"></span>
              <span class="charge-poly p4"></span>
              <span class="charge-poly p5"></span>
              <span class="charge-poly p6"></span>
            </div>
            <p class="occurring-status mono">Creating the directory and its two files…</p>
          </template>
          <!-- Error — rests honestly with a retry. -->
          <template v-else-if="scaffoldError">
            <p class="field-error">{{ scaffoldError }}</p>
            <div class="occurring-actions">
              <button type="button" class="sp-btn sp-btn--go" @click="retryScaffold">Retry</button>
              <button type="button" class="sp-btn sp-btn--ghost" @click="activeStep = 'name'">Back</button>
            </div>
          </template>
          <!-- Result — the real response bound (dir + the two files). -->
          <template v-else-if="minted">
            <p class="occurring-status"><span class="ok-check">✓</span> Scaffolded.</p>
            <p class="occurring-note">
              Created at <code class="mono-path">{{ minted.directoryPath }}</code>.
            </p>
          </template>
        </div>

        <!-- STEP 3 · THE PAGE -------------------------------------------- -->
        <div v-else-if="activeStep === 'page'" class="occurring page-occurring">
          <h3 class="occurring-heading">Building the page</h3>
          <!-- Idle → the launch (the duplication has NOT run yet). -->
          <template v-if="!pageBusy && !pageError && !pageTimedOut && !pageResult">
            <p class="occurring-note">
              The bridge will duplicate the page concept, register it, and run the gates for your new
              addition — copy, rename, registration, and the checks. This can take up to half a minute.
            </p>
            <div class="occurring-actions">
              <button type="button" class="sp-btn sp-btn--go" @click="runPageCreate">Build the Page</button>
            </div>
          </template>
          <!-- In-flight — the geometric charge (the patient half-minute note). -->
          <template v-else-if="pageBusy">
            <div class="sp-charge" aria-hidden="true">
              <span class="charge-poly p3"></span>
              <span class="charge-poly p4"></span>
              <span class="charge-poly p5"></span>
              <span class="charge-poly p6"></span>
              <span class="charge-poly p7"></span>
            </div>
            <p class="occurring-status mono">Duplicating · renaming · registering · running the gates…</p>
            <p class="occurring-note occurring-note--dim">This is synchronous and can take up to ~30 seconds. Hold on.</p>
          </template>
          <!-- Timeout — the files MAY still have landed (verify after turn-over). -->
          <template v-else-if="pageTimedOut">
            <p class="field-warn">
              The build passed the 30-second window. The page files may still have landed on disk — you
              can proceed and verify after the turn-over.
            </p>
            <div class="occurring-actions">
              <button type="button" class="sp-btn sp-btn--go" @click="proceedAfterTimeout">Proceed to Turn Over</button>
              <button type="button" class="sp-btn sp-btn--ghost" @click="retryPageCreate">Retry</button>
            </div>
          </template>
          <!-- Error — rests honestly with a retry. -->
          <template v-else-if="pageError">
            <p class="field-error">{{ pageError }}</p>
            <div class="occurring-actions">
              <button type="button" class="sp-btn sp-btn--go" @click="retryPageCreate">Retry</button>
            </div>
          </template>
          <!-- Result — the structured page-create result (concept + gates). -->
          <template v-else-if="pageResult">
            <p class="occurring-status"><span class="ok-check">✓</span> Page created.</p>
            <p v-if="pageResult.conceptName" class="occurring-note">
              Concept: <code class="mono-inline">{{ pageResult.conceptName }}</code>
            </p>
            <ul v-if="pageResult.gatesPassed && pageResult.gatesPassed.length" class="gates-list">
              <li v-for="g in pageResult.gatesPassed" :key="g" class="gate-item">
                <span class="ok-check ok-check--sm">✓</span> {{ g }}
              </li>
            </ul>
          </template>
        </div>

        <!-- STEP 4 · TURN OVER ------------------------------------------- -->
        <div v-else class="occurring turnover-occurring">
          <h3 class="occurring-heading">Turn over to a working branch</h3>
          <p class="occurring-note">
            <template v-if="onWorkingB">
              You are on a working branch. Turning over restarts the SCP on it, carrying your new page —
              the SCP rebuilds the client on restart, so the page appears once the rebuild completes.
            </template>
            <template v-else>
              Your new page lands with the next turn over onto a working branch (B). The SCP rebuilds
              the client on restart, so the page appears once the rebuild completes.
            </template>
          </p>
          <div class="occurring-actions">
            <button
              type="button"
              class="sp-btn sp-btn--sword"
              :disabled="turnOverBusy"
              @click="doTurnOver"
            >
              <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>
              <span>{{ turnOverBusy ? 'Turning over…' : (onWorkingB ? 'Turn Over · Restart on B' : 'Turn Over · Forge on B') }}</span>
            </button>
            <button v-if="!turnOverBusy" type="button" class="sp-btn sp-btn--ghost" @click="close">Later</button>
          </div>
          <p v-if="turnOverNote" class="occurring-status mono">{{ turnOverNote }}</p>
        </div>
      </section>

      <!-- THE BRACKET (StratiPUNK E4 · the stage's lower lip). -->
      <div class="sp-bracket" aria-hidden="true">
        <span class="bracket-tick">[</span>
        <span class="bracket-rail"></span>
        <span class="bracket-tick">]</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   MODAL FRAME + THE DEEP FIELD (StratiPUNK E1) — the room goes dark before the announcement.
   ============================================================ */
.create-overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
}

.create-overlay-panel {
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: 92vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.6rem 1.6rem 1.9rem;
  color: var(--color-white-conductor, #f0f0f0);
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
  /* THE DEEP FIELD — a dark cobalt-tinted core → near-black edges. */
  background:
    radial-gradient(ellipse at 50% 22%, rgba(37, 99, 235, 0.16) 0%, rgba(8, 9, 16, 0) 60%),
    radial-gradient(ellipse at 50% 120%, rgba(37, 99, 235, 0.08) 0%, rgba(6, 7, 12, 0) 70%),
    rgb(8, 9, 15);
}

/* THE NEON FRAME (StratiPUNK E2) — an inset dual-glow border + chamfered corners that BREATHES. */
.stratipunk-frame {
  border: 1.5px solid rgba(80, 140, 255, 0.55);
  clip-path: polygon(
    22px 0, calc(100% - 22px) 0, 100% 22px,
    100% calc(100% - 22px), calc(100% - 22px) 100%,
    22px 100%, 0 calc(100% - 22px), 0 22px
  );
  box-shadow:
    0 0 20px 1px rgba(80, 140, 255, 0.35),
    inset 0 0 22px 0 rgba(200, 90, 255, 0.14);
  animation: sp-frame-breathe 2.8s ease-in-out infinite;
}

@keyframes sp-frame-breathe {
  0%, 100% {
    box-shadow:
      0 0 18px 1px rgba(80, 140, 255, 0.28),
      inset 0 0 20px 0 rgba(200, 90, 255, 0.12);
  }
  50% {
    box-shadow:
      0 0 28px 2px rgba(80, 140, 255, 0.5),
      inset 0 0 26px 0 rgba(200, 90, 255, 0.2);
  }
}

/* THE SCANLINE GRAIN (E1) — a subtle repeating layer over the field. */
.sp-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.015) 0px,
    rgba(255, 255, 255, 0.015) 1px,
    rgba(0, 0, 0, 0) 1px,
    rgba(0, 0, 0, 0) 3px
  );
}

/* Every foreground layer sits above the grain. */
.overlay-header,
.stepper-strip,
.occurring-panel,
.sp-bracket {
  position: relative;
  z-index: 1;
}

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(120, 160, 255, 0.14);
}

/* THE CEREMONIAL TYPE (E3) — Orbitron-class, letter-spaced, neon text-shadowed. */
.overlay-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin: 0;
  color: rgb(198, 218, 255);
  text-shadow: 0 0 8px rgba(80, 140, 255, 0.6), 0 0 14px rgba(200, 90, 255, 0.3);
}

.overlay-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(120, 160, 255, 0.22);
  color: rgba(200, 214, 240, 0.7);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.overlay-close:hover {
  background: rgba(80, 140, 255, 0.1);
  border-color: rgba(120, 160, 255, 0.45);
  color: #f0f0f0;
}

/* ============================================================
   TOP · THE STEPPER STRIP
   ============================================================ */
.stepper-strip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.step-cell {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.7rem;
  border-radius: 5px;
  border: 1px solid transparent;
  min-width: 64px;
  transition: all 0.25s ease;
}

.step-ordinal {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

.step-label {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.step-cell--pending {
  color: rgba(160, 176, 210, 0.4);
  border-color: rgba(80, 140, 255, 0.08);
}

.step-cell--active {
  color: rgb(210, 226, 255);
  border-color: rgba(80, 140, 255, 0.6);
  background: rgba(37, 99, 235, 0.14);
  box-shadow: 0 0 12px rgba(80, 140, 255, 0.35), inset 0 0 10px rgba(80, 140, 255, 0.1);
  text-shadow: 0 0 6px rgba(80, 140, 255, 0.6);
}

.step-cell--done {
  color: rgba(140, 200, 255, 0.85);
  border-color: rgba(90, 230, 200, 0.3);
}

.step-rail {
  flex: 1 1 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(80, 140, 255, 0.5), rgba(200, 90, 255, 0.35));
  opacity: 0.5;
}

/* ============================================================
   BOTTOM · THE OCCURRING PANEL
   ============================================================ */
.occurring-panel {
  border: 1px solid rgba(80, 140, 255, 0.2);
  border-radius: 8px;
  background: rgba(4, 6, 12, 0.55);
  padding: 1.2rem;
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.occurring {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.occurring-heading {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
  color: rgb(190, 210, 250);
  text-shadow: 0 0 6px rgba(80, 140, 255, 0.4);
}

.occurring-note {
  font-size: 0.82rem;
  line-height: 1.55;
  color: rgba(190, 200, 220, 0.78);
  margin: 0;
}

.occurring-note--dim {
  color: rgba(160, 172, 200, 0.6);
  font-size: 0.76rem;
}

.occurring-status {
  font-size: 0.82rem;
  color: rgba(200, 214, 240, 0.9);
  margin: 0.2rem 0 0;
}

.occurring-status.mono {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.76rem;
  color: rgba(140, 200, 255, 0.85);
}

.field-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(180, 196, 230, 0.6);
  margin-top: 0.25rem;
}

.name-input {
  width: 100%;
  padding: 0.55rem 0.7rem;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(80, 140, 255, 0.35);
  border-radius: 6px;
  color: #eef2ff;
  font-size: 0.9rem;
}

.name-input:focus {
  outline: none;
  border-color: rgba(120, 170, 255, 0.75);
  box-shadow: 0 0 10px rgba(80, 140, 255, 0.35);
}

.field-hint {
  font-size: 0.74rem;
  color: rgba(160, 200, 255, 0.7);
  margin: 0;
}

.field-hint--warn {
  color: rgba(255, 200, 120, 0.85);
}

.field-error {
  font-size: 0.8rem;
  color: #f87171;
  margin: 0;
}

.field-warn {
  font-size: 0.8rem;
  line-height: 1.5;
  color: rgba(255, 210, 130, 0.92);
  margin: 0;
}

.mono-inline,
.mono-path {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.76rem;
  color: rgb(150, 205, 255);
  background: rgba(0, 0, 0, 0.45);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  word-break: break-all;
}

.ok-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: rgba(52, 211, 153, 0.18);
  color: #34d399;
  font-size: 0.7rem;
  margin-right: 0.3rem;
}

.ok-check--sm {
  width: 0.9rem;
  height: 0.9rem;
  font-size: 0.6rem;
}

.gates-list {
  list-style: none;
  margin: 0.3rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.gate-item {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.74rem;
  color: rgba(190, 210, 240, 0.85);
  display: flex;
  align-items: center;
}

.occurring-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

/* ============================================================
   STRATIPUNK BUTTONS — the neon-edged directives.
   ============================================================ */
.sp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.05rem;
  border-radius: 5px;
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.sp-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.sp-btn--go {
  color: rgb(210, 226, 255);
  background:
    radial-gradient(ellipse at 40% 30%, rgba(37, 99, 235, 0.28) 0%, rgba(8, 9, 16, 0) 70%),
    rgb(9, 12, 22);
  border: 1px solid rgba(80, 140, 255, 0.6);
  box-shadow: 0 0 8px rgba(80, 140, 255, 0.3);
  text-shadow: 0 0 6px rgba(80, 140, 255, 0.5);
}

.sp-btn--go:hover:not(:disabled) {
  border-color: rgba(120, 170, 255, 0.9);
  box-shadow: 0 0 14px 1px rgba(80, 140, 255, 0.5);
  color: #eef4ff;
}

.sp-btn--ghost {
  background: transparent;
  border: 1px solid rgba(150, 170, 210, 0.25);
  color: rgba(200, 214, 240, 0.75);
}

.sp-btn--ghost:hover {
  border-color: rgba(150, 170, 210, 0.5);
  color: #eef2ff;
}

/* THE SWORD-B TREATMENT — the ochre neon-edge + chamfer (the door's turn-over language). */
.sp-btn--sword {
  color: rgb(255, 206, 9);
  background:
    radial-gradient(ellipse at 38% 30%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 13, 5, 0) 62%),
    rgb(15, 12, 6);
  border: 1px solid rgba(234, 179, 8, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.28), inset 0 0 10px rgba(234, 179, 8, 0.1);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.6);
}

.sp-btn--sword:hover:not(:disabled) {
  border-color: rgba(234, 179, 8, 0.9);
  color: rgb(255, 224, 120);
  box-shadow: 0 0 14px 1px rgba(234, 179, 8, 0.5), inset 0 0 14px rgba(234, 179, 8, 0.18);
}

/* ============================================================
   THE GEOMETRIC CHARGE (StratiPUNK E5) — neon polygons pulsing in sequence, accelerating.
   ============================================================ */
.sp-charge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  padding: 0.9rem 0;
}

.charge-poly {
  width: 20px;
  height: 20px;
  background: transparent;
  border: 1.5px solid rgba(80, 140, 255, 0.85);
  box-shadow: 0 0 8px rgba(80, 140, 255, 0.5);
  animation: sp-charge-pulse 1.6s ease-in-out infinite;
}

/* The ascending polygon set (triangle → heptagon · one side per position, clip-path regulars). */
.charge-poly.p3 { clip-path: polygon(50% 0, 100% 100%, 0 100%); animation-delay: 0s; }
.charge-poly.p4 { clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); animation-delay: 0.12s; }
.charge-poly.p5 { clip-path: polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%); animation-delay: 0.24s; }
.charge-poly.p6 { clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); animation-delay: 0.36s; }
.charge-poly.p7 { clip-path: polygon(50% 0, 90% 20%, 100% 60%, 72% 100%, 28% 100%, 0 60%, 10% 20%); animation-delay: 0.48s; }

@keyframes sp-charge-pulse {
  0% { opacity: 0.25; transform: scale(0.85); filter: brightness(0.8); }
  40% { opacity: 1; transform: scale(1.1); filter: brightness(1.6); }
  100% { opacity: 0.25; transform: scale(0.85); filter: brightness(0.8); }
}

/* ============================================================
   THE BRACKET (StratiPUNK E4) — the stage's lower lip.
   ============================================================ */
.sp-bracket {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.4rem;
}

.bracket-tick {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.85rem;
  color: rgba(154, 160, 168, 0.7);
}

.bracket-rail {
  flex: 1 1 auto;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, rgba(80, 140, 255, 0.6), rgba(200, 90, 255, 0.5));
  box-shadow: 0 0 8px rgba(120, 130, 255, 0.4);
  animation: sp-bracket-pulse 2.6s ease-in-out infinite;
}

@keyframes sp-bracket-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
</style>
