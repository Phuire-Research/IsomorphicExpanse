<script setup lang="ts">
/**
 * ShatteriteMenu (SMSP · IAJW · AMAF) — generalizable agent-authored Shatterite Menu.
 *
 * A Shatterite Menu whose STAGES ARE AUTHORED BY THE AGENT (the page's Anchor instance)
 * and progress over time. The agent writes the current stage to menu.json in the page's
 * RI dir; the IAJW watcher (cadmiumOkMonitor extension) relays the parsed MenuStage to the
 * page muxium; this component re-renders the new stage's options on each agent advance.
 *
 * Receives the live `menuStage` (page-muxium state · driven by the IAJW relay) + the page's
 * `suite8Name` as props — exactly like STSC receives its `sfsd`. The page muxium owns the
 * reactive state; this component is the Vue surface that renders it + dispatches selections.
 *
 * Anchor resolution (PAOLR · reused from CadmiumLanding §C1-D4 + STSC):
 *   the page's Anchor = the alive session whose `suite8Name === props.suite8Name`
 *   AND `isAnchor === true` (status 'launched'). Read live from the global scsBridge
 *   controller's `sessionsList`. NEVER spawns or dissipates.
 *
 * S6 ANCHOR-ALIVE GUARD (S4 Green hazard H5/S6): the menu disables every option + shows a
 *   "Waiting for an alive Anchor…" stub when no alive Anchor exists (mirrors STSC's canSubmit).
 *
 * WIRE.1 · SOE (Shatterite-as-Origin-of-Engagement): the menu is the ORIGIN of engagement. When
 *   NO live anchor exists AND this Suite 8's anchorSpawn mode is 'prompt' (the default · read in
 *   onMounted from GET /suite8-anchor-spawn/<suite8Name>), the inert "Waiting…" stub is replaced
 *   by a Pewter-styled "Spawn + Anchor this domain" button. handleSpawnAnchor spawns via the
 *   EXISTING triggerSpawnSuite8Session (the bridge's claimAnchorIfUnclaimed auto-anchors the page
 *   anchor), then a readiness poll (mirror Suite8HomeLanding PPOL · 250ms/3000ms) focuses the new
 *   session once isAnchor flips. The `anchor` computed reacts to sessionsList, so the menu
 *   auto-transitions from the spawn button to the normal options — no extra wiring. This absorbs
 *   the per-callsite page spawn buttons (Suite8HomeLanding · PewterLanding), making the menu
 *   self-sufficient. 'auto' mode + no anchor → auto-fires the spawn once on mount.
 *
 * Option dispatch by kind (curried SCS Commands · reused triggers · NOT invented):
 *   'scs'     → triggerSendMessage(anchorId, scsCommand)              — curry the stage as a command
 *   'focus'   → triggerFocusSession(anchorId)                         — engage the Terminal directly
 *   'askMore' → triggerFocusSession(anchorId) + triggerSendMessage(anchorId, assistPrompt)
 *               AMAF: "Ask More" is MERELY a Focus that ALSO injects an assist prompt → the agent
 *               writes the next stage → IAJW relays → the menu advances + refocuses. One option
 *               kind, no separate modality (the user's own canonical "Ask More = merely a Focus").
 *
 * DFSR: every dispatch is an EXTERNAL controller trigger (direct /mcp fetch or trigger-field
 *   set), invoked from a normal async/event handler — NOT synchronously inside a Stratimux
 *   plan stage. This component holds NO Muxium and runs NO plan.
 *
 * Pewter-styled (mirror the SM-* Reference Design look + the existing menu / STSC conventions).
 *
 * Citation: ShatteriteTomeSetup.vue (PAOLR anchor-find · anchorAlive disabled-guard · triggers)
 * Citation: CadmiumLanding.vue §C1-D4 PAOLR
 * Citation: scsBridgeController.ts (triggerSendMessage · triggerFocusSession)
 * Citation: EPOCH-SR-S2-ORANGE-NAMING.md §Macro SM (SMSP · IAJW · AMAF)
 * Citation: EPOCH-SR-S4-GREEN-SCULPT.md §H5 (NCEC nextA) + S6 anchor-alive guard
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

// C473 · THE DOUBLE-ENGAGE GUARD (r7: two menu instances on one page fired engage twice within
// 40ms on every restart). Module-scoped — shared by every ShatteriteMenu instance in the bundle:
// one in-flight engage per session id, cleared when the engage settles anor 10s elapse.
const inFlightEngages = new Set<string>();
import type { MenuStage, MenuOption } from '../../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE } from '../../../../model/shatteriteMenu.model';
import type { MenuDocument } from '../../../../model/shatteriteMenu.model';
import { EMPTY_MENU_DOCUMENT } from '../../../../model/shatteriteMenu.model';
import type { ScsBridgeSessionEntry } from '../../../scsBridge/scsBridge.type';
import { getGlobalScsBridgeController, type ScsBridgeController } from '../../../scsBridge/scsBridgeController';
// BO-1 · the rename-proof anchor contract (the C373 s8 law) — the session-field lookup and
// the anchor-spawn route live in a NEVER-COPIED scsBridge model so the suite8:page token
// rewrite cannot break them in mints (s.suite8Name → s.{domain}Name was the BO-1 kill).
import { resolveS8Anchor, s8AnchorSpawnPath } from '../../../scsBridge/model/s8Anchor.model';
// W1 (C758) · REWRITE-PROOF ROUTES (the BO-1 law) — the menu-floor path survives the mint rewrite.
import { s8MenuPath, S8_MENU_STAGE_SET_PATH } from '../../../scsBridge/model/s8Routes.model';
import ScsInput from '../../../vue/components/ScsInput.vue';
// SB-DS6 · native <select> can never open on the offscreen SCP surface → the in-DOM ScsDropdown.
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';

interface Props {
  // The current agent-authored stage (page-muxium state · IAJW relay drives it).
  menuStage: MenuStage;
  // The page's Suite 8 designation — used to find its Anchor in sessionsList.
  suite8Name: string;
  // C484 · THE ANCHOR AUTHORITY — when a page composes MULTIPLE menus for ONE designation
  // (the Cadmium double), exactly ONE holds the anchor lifecycle (autoDecideAnchor · the
  // close-watch/tombstone · the Auto-Spawn toggle · spawn/re-engage surfaces). A non-authority
  // menu still renders + dispatches options to the SAME live session — interaction intact,
  // lifecycle silent. Default TRUE (single-menu pages unchanged — Graphite Scribe as-is).
  anchorAuthority?: boolean;
  // Optional title shown in the menu zone header (falls back to the stage title).
  title?: string;
  // Optional default assist prompt for an 'askMore' option that carries no scsCommand (AMAF).
  defaultAssistPrompt?: string;
  // Diamond RAR · SDSD — OPTIONAL static default stage. When NO live menu.json stage exists
  // (menuStage.stageIndex < 0), the menu renders THIS stage as a standing explainer instead of
  // the empty stub. The live menu.json path (stageIndex >= 0) ALWAYS wins — the default never
  // overrides a live stage, and the SMUP ping watch stays on the RAW menuStage.stageIndex so a
  // static default NEVER pings. Absent → unchanged behavior (backward-compat for every caller).
  defaultStage?: MenuStage;
  // C766 · STAGED (the complete conversion · 1A) — the keyed circuit's full document (ALL
  // stages + currentStageIndex). When present with stages it supersedes the scalar menuStage
  // (retained for legacy scalar consumers · the Cadmium pipe).
  menuDocument?: MenuDocument;
}

const props = defineProps<Props>();

// C484/C485 · the authority gate — everything anchor-lifecycle keys on this (negative prop:
// absent coerces false → authority true — the boolean-prop-trap-safe form).
const isAnchorAuthority = computed<boolean>(() => !props.noAnchorAuthority);

const emit = defineEmits<{
  // Fires after an option is dispatched (label + kind + ok). Lets the page log / react.
  (e: 'option-selected', payload: { label: string; kind: MenuOption['kind']; ok: boolean }): void;
}>();

// ============================================================
// CONTROLLER + ANCHOR RESOLUTION (PAOLR · reused from STSC)
// ============================================================

const controller = computed(() => getGlobalScsBridgeController());

const sessionsList = computed<ScsBridgeSessionEntry[]>(
  () => controller.value?.sessionsList.value ?? [],
);

// PAOLR · the page's Anchor for this suite8Name. Keys on isAnchor (authoritative
// page-bound session), NOT "any alive suite8 match" — mirror CadmiumLanding / STSC.
const anchor = computed<ScsBridgeSessionEntry | undefined>(() =>
  resolveS8Anchor(sessionsList.value, props.suite8Name),
);

// S6 GUARD · the Anchor must be ALIVE ('launched') to receive any option dispatch.
const anchorAlive = computed<boolean>(
  () => anchor.value?.status === 'launched',
);

// ============================================================
// WIRE.1 · SOE · ANCHOR-SPAWN MODE + SPAWN GATE (the menu is the origin of engagement)
// ============================================================
//
// anchorSpawnMode · this Suite 8's spawn-prompt behavior, read once in onMounted from
// GET /suite8-anchor-spawn/<suite8Name> (server resolves the per-Suite-8 Cascade.json ·
// DEFAULT 'prompt' on any failure · mirrors Suite8HomeLanding AD). 'prompt' = the menu surfaces a
// Spawn + Anchor button when there is no live anchor; 'auto' = the menu auto-fires the spawn once.
const anchorSpawnMode = ref<'prompt' | 'auto'>('prompt');
// C772 · W4 · AUTO MODE — the HiFi-yellow toggle: when ON the Anchor spawns anor resumes
// with --permission-mode auto (the bridge reads the S8.json truth at spawn — no threading).
const autoModeEnabled = ref<boolean>(false);

// SOE GATE · render the Spawn + Anchor button only when there is NO live anchor AND auto-spawn is
// OFF ('prompt'). `anchor` (NOT anchorAlive) is the gate: an allocated/offline anchor already owns
// the page → no new spawn (the existing options stay inert until it relaunches). Once a live anchor
// appears, anchor.value flips truthy → this falls false → the normal options render (no extra wiring).
const showSpawnOption = computed<boolean>(
  () => isAnchorAuthority.value && !anchor.value && anchorSpawnMode.value === 'prompt',
);

// P1 RE-ENGAGE GATE · the ORPHAN-ANCHOR case: an anchor entry EXISTS (isAnchor=true) but is NOT
// alive (status !== 'launched' · e.g. offline after a bridge restart, which intentionally preserves
// isAnchor). Without a recovery path this deadlocks the menu — showSpawnOption is false (anchor
// exists → no Spawn button) AND optionsEnabled is false (anchor not alive → options inert), so the
// menu freezes at "Waiting for an alive Anchor…" with no way out. The fix surfaces a "Re-engage
// Anchor" button that relaunches the SAME offline anchor (triggerEngageSession · keeps isAnchor →
// sidesteps the server anti-flood guard that a fresh spawn would trip). Mirrors Suite8HomeLanding /
// CadmiumLanding PPOL branch (2): offline anchor → engage. Mutually exclusive with showSpawnOption
// (that needs NO anchor; this needs an offline anchor).
const showReengageOption = computed<boolean>(
  // SOE · suppress re-engage WHILE a fresh spawn is in flight. An anchor present but not yet
  // 'launched' is the normal spawn-settling window — NOT an offline anchor — so re-engage must
  // not shadow the PEWTER_DEFAULT_MENU_STAGE before the spawn poll resolves. A genuine offline
  // anchor still surfaces once `spawning` clears and the anchor stays not-alive (spawn timeout).
  () => isAnchorAuthority.value && !!anchor.value && !anchorAlive.value && !spawning.value,
);

// SOE · in-flight guard for the spawn handler (disables the button + shows a spawning hint while the
// trigger + readiness poll resolve). Distinct from dispatchingLabel (the option-row in-flight guard).
const spawning = ref<boolean>(false);

// P1 · in-flight guard for the re-engage handler (parallel to `spawning` · disables the re-engage
// button + shows a hint while the engage trigger + readiness poll resolve the offline anchor alive).
const isReengaging = ref<boolean>(false);

// SOE · the readiness poll interval handle (cleared on resolve + on unmount · macrotask · NOT a
// plan selector · mirrors Suite8HomeLanding PPOL-WUD).
let spawnPoll: ReturnType<typeof setInterval> | null = null;

// P1 · the re-engage readiness poll handle (parallel to spawnPoll · cleared on resolve + unmount).
let reengagePoll: ReturnType<typeof setInterval> | null = null;

// P1.1 · ANCHOR-RESPECT · AD-Auto settle-then-decide one-shot guard. The AUTO auto-fire must NOT
// act on a TRANSIENT-empty anchor.value (the hydration race: sessionsList inits [] and the
// /suite8-anchor-spawn fetch can resolve BEFORE the offline prior hydrates → !anchor.value momentarily
// true → a spurious spawn that then steals the offline original via the fallback). This guard mirrors
// CadmiumLanding / Suite8HomeLanding PAOLR: settle over a window, then branch ONCE on the SETTLED
// anchor state (alive → nothing · offline → re-engage · NO anchor AFTER settle → spawn).
const didAutoDecide = ref<boolean>(false);

// P1.1 · the AD-Auto settle poll handle (parallel to spawnPoll/reengagePoll · cleared on resolve + unmount).
let autoDecidePoll: ReturnType<typeof setInterval> | null = null;

// ============================================================
// STAGE RENDER STATE
// ============================================================

// 1A-prime · THE MENU FLOOR (ODCF · lifted from CadmiumLanding:644 into the component itself —
// the anti-fragmentation seam: every consumer inherits display-on-viewing by PLACING the
// component; no page wires its own floor). GET /suite8-menu/<suite8Name> on mount → floorStage.
// Precedence (Record-wins-when-FILLED · the C750 Cascade Memory RD): the live relayed stage
// (props.menuStage.stageIndex >= 0) ALWAYS wins; the floor fills the cold mount the stream
// races (BOCR-starved · pre-hash identity-suppressed — the C756 diagnosis). The SMUP ping
// watch stays on the RAW props.menuStage — a floor fill must never fire the attention ping.
const floorDoc = ref<MenuDocument>(EMPTY_MENU_DOCUMENT);
onMounted(() => {
  void fetch(s8MenuPath(props.suite8Name))
    .then((r) => (r.ok ? r.json() : null))
    .then((doc: unknown) => {
      if (!doc || typeof doc !== 'object') return;
      const d = doc as MenuDocument;
      if (!Array.isArray(d.stages) || d.stages.length === 0) return;
      if (typeof d.currentStageIndex !== 'number') return;
      floorDoc.value = d;
    })
    .catch(() => {
      /* floor absent → the default standing stage remains (honest) */
    });
});

// C766 · THE STAGED CORE (1A complete conversion + 2A client-persisted iteration).
// activeDoc: the relay document wins when FILLED; else the floor. localStageIndex is the
// press/nav preview, reconciled from the document position whenever the file's authority
// relays (the file remains the single authority — every client converges through it).
const activeDoc = computed<MenuDocument>(() =>
  props.menuDocument && props.menuDocument.stages.length > 0 ? props.menuDocument : floorDoc.value,
);
const stageCount = computed<number>(() => activeDoc.value.stages.length);
const localStageIndex = ref<number>(0);
watch(
  () => activeDoc.value.currentStageIndex,
  (idx) => {
    if (typeof idx === 'number' && idx >= 0) localStageIndex.value = idx;
  },
  { immediate: true },
);
const clampStageIdx = (i: number): number =>
  Math.min(Math.max(i, 0), Math.max(stageCount.value - 1, 0));

// 2A · persist the iterated position back into menu.json (the agent owns `stages`; the client
// owns position) — the watcher then relays the converged document to every open page.
const persistStageIndex = (idx: number): void => {
  void fetch(S8_MENU_STAGE_SET_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ designation: props.suite8Name, currentStageIndex: idx }),
  }).catch(() => {
    /* persistence best-effort · the relay reconciles on the next authoritative write */
  });
};

// Back/forth navigation between stored stages (2A) — clamped both ends.
const goToStage = (idx: number): void => {
  if (stageCount.value < 2) return;
  const next = clampStageIdx(idx);
  if (next === localStageIndex.value) return;
  localStageIndex.value = next;
  persistStageIndex(next);
};

// The press-time advance: an scs workflow press moves to the NEXT stage while the model
// responds; at the last stage it stays (2A · no remaining stages → the same last stage).
const advanceStageOnPress = (): void => {
  if (stageCount.value < 2) return;
  const next = clampStageIdx(localStageIndex.value + 1);
  if (next === localStageIndex.value) return;
  localStageIndex.value = next;
  persistStageIndex(next);
};

// The stage the SDSD branches read: the staged document (relay anor floor) wins; absent both,
// the legacy scalar relay; else EMPTY and the defaultStage explainer path takes over below.
const presentedStage = computed<MenuStage>(() =>
  stageCount.value > 0
    ? activeDoc.value.stages[clampStageIdx(localStageIndex.value)]
    : props.menuStage.stageIndex >= 0
      ? props.menuStage
      : EMPTY_MENU_STAGE,
);

// stageIndex -1 = the EMPTY_MENU_STAGE seed (no agent-authored stage yet).
// Diamond RAR · SDSD two-branch: a live stage (stageIndex >= 0) reports hasStage from its OWN
// options; absent a live stage, hasStage falls through to the static defaultStage (if present and
// non-empty). The static explainer therefore RENDERS readably even with no live anchor — only
// DISPATCH gates on the anchor (optionsEnabled below, UNCHANGED).
const hasStage = computed<boolean>(() =>
  presentedStage.value.stageIndex >= 0
    ? presentedStage.value.options.length > 0
    : (props.defaultStage !== undefined && props.defaultStage.options.length > 0),
);

// Diamond RAR · SDSD · the stage actually rendered: the live menu.json stage wins (relay anor
// floor); absent both, render the static defaultStage (or fall back to the raw stage when no
// default given).
const effectiveStage = computed<MenuStage>(() =>
  presentedStage.value.stageIndex >= 0
    ? presentedStage.value
    : (props.defaultStage ?? presentedStage.value),
);

// S6 GUARD · options are clickable only when a live Anchor exists AND a real stage is present.
// UNCHANGED — a static explainer renders via hasStage/effectiveStage but only DISPATCHES with a
// live anchor (S4 H3 invariant). The SMUP ping watch (below) likewise stays on the RAW menuStage.
const optionsEnabled = computed<boolean>(() => anchorAlive.value && hasStage.value);

// In-flight option (label) — disables the row + shows a sending hint while the trigger resolves.
const dispatchingLabel = ref<string | null>(null);

const headerTitle = computed<string>(
  () => props.title ?? (hasStage.value ? effectiveStage.value.title : 'Shatterite Menu'),
);

const statusText = computed<string>(() => {
  if (!anchorAlive.value) return 'Waiting for an alive Anchor…';
  if (!hasStage.value) return 'Waiting for the agent to author the next menu stage…';
  return `Stage ${effectiveStage.value.stageIndex} · Anchor alive (${anchor.value?.id.slice(-8) ?? ''})`;
});

// ============================================================
// SMUP · STAGE-UPDATE PING (Pewter attention-grab on live advance)
// ============================================================
//
// SMUP: when the IAJW relay advances the menu to a NEW valid stage, the menu
// must INTRUSIVELY capture the user's eye (a first-encounter feature the user
// is unaware of). A Pewter glow-pulse LOOP + sustained glow + "UPDATED" badge
// PERSISTS until the user actually engages. It fires ONLY on a genuine live
// advance — NOT on the Idle seed (stageIndex -1), NOT on first mount, and ONLY
// when the stageIndex actually changes to a real (≥ 0) stage. There is NO
// time-based auto-clear: the first SCS-Bridge refocus can outlast any timer, so
// a timer would self-clear the ping before the user ever sees the menu. The ping
// deactivates ONLY on a SPECIFIC engagement — hover (mouseenter) OR an option
// selection — which is when the user has demonstrably noticed it.

// True while the attention-grab animation is active (drives the .menu-pinged class).
const pinged = ref<boolean>(false);

function clearPing(): void {
  pinged.value = false;
}

function firePing(): void {
  // Restart cleanly so back-to-back advances each re-trigger the full animation.
  // Force a re-flow of the CSS animation on a repeat fire (toggle off → on next tick).
  // NO time-based clear — the ping persists until hover/select (clearPing).
  pinged.value = false;
  requestAnimationFrame(() => {
    pinged.value = true;
  });
}

// Watch the stage IDENTITY (index). Vue's watch does NOT fire on initial mount by
// default (immediate omitted), so the seed → first-stage transition that happens at
// page load does not ping. We additionally gate on: NEW index, a real stage (≥ 0),
// and a genuine change from the prior index — so the Idle seed (-1) never pings and
// a no-op re-relay of the same stageIndex never pings.
watch(
  () => (props.menuDocument ? props.menuDocument.currentStageIndex : props.menuStage.stageIndex),
  (next, prev) => {
    const advancedToRealStage = next >= 0 && next !== prev;
    if (advancedToRealStage && hasStage.value) {
      firePing();
    } else if (next < 0) {
      // Relayed back to the Idle/empty seed — never ping; ensure any prior ping clears.
      clearPing();
    }
  },
);

// ============================================================
// WIRE.1 · SOE · SPAWN-MODE FETCH + SPAWN HANDLER (the origin of engagement)
// ============================================================
//
// onMounted: read this Suite 8's anchorSpawn mode from its own Cascade.json (GET
// /suite8-anchor-spawn/<suite8Name> · DEFAULT 'prompt' on any failure · fire-and-forget · the
// showSpawnOption computed reads anchorSpawnMode.value live, so an in-flight fetch that resolves
// after first paint simply re-evaluates the gate). On 'auto' + no live anchor, auto-fire the spawn
// ONCE (the existing always-auto behavior, now owned by the menu).
onMounted(() => {
  if (typeof window === 'undefined') return;
  // C481/C482 · THE FILESYSTEM ANCHOR + THE TAB-IN FOLLOW — S8.json is the ONE truth and
  // every window FOLLOWS it: refreshed at mount AND on every tab-in (visibility/focus). The
  // 6⊗7 wrap found mode had NO live propagation — a toggle in window 1 left window 2's ref
  // stale-at-mount (visually disabled while the behavior followed the file).
  window.addEventListener('focus', refreshS8ModeFromDisk);
  document.addEventListener('visibilitychange', refreshS8ModeOnVisible);
  void fetch(s8AnchorSpawnPath(props.suite8Name))
    .then((r) => (r.ok ? r.json() : { anchorSpawn: 'prompt' }))
    .then((j: { anchorSpawn?: string }) => {
      anchorSpawnMode.value = j.anchorSpawn === 'auto' ? 'auto' : 'prompt';
      autoModeEnabled.value = (j as { autoMode?: unknown }).autoMode === true;
      // P1.1 · AD-Auto · 'auto' → run the settle-then-decide (NOT an immediate spawn). The naive
      // `!anchor.value → handleSpawnAnchor()` auto-fire raced sessionsList hydration: an offline
      // prior had not yet hydrated when this fetch resolved → !anchor.value was transiently true →
      // a spurious spawn that then STOLE the offline original. The settle-then-decide waits for
      // sessionsList to hydrate before branching, and re-engages an offline prior instead of
      // spawning over it (mirror CadmiumLanding / Suite8HomeLanding PAOLR three-branch).
      // C470/C484 · THE RETURN-ENGAGE runs on the ANCHOR AUTHORITY only — a non-authority
      // menu never decides lifecycle (the Cadmium double fired twice from two instances).
      if (isAnchorAuthority.value) autoDecideAnchor();
    })
    .catch(() => {
      anchorSpawnMode.value = 'prompt';
      if (isAnchorAuthority.value) autoDecideAnchor();
    });
});

// P1.1 · ANCHOR-RESPECT · AD-Auto settle-then-decide (the producing-decision fix). Mirrors the
// CadmiumLanding / Suite8HomeLanding PAOLR three-branch under a one-shot settle window: poll
// sessionsList for the hydration to complete, then decide ONCE on the SETTLED anchor state —
//   (1) anchorAlive            → do nothing (the normal options render · no spawn).
//   (2) anchor && !anchorAlive → handleReengageAnchor() (re-engage the SAME offline original).
//   (3) NO anchor AFTER settle → handleSpawnAnchor() (the ONLY path that spawns · genuine first run).
// Branch (3) ONLY fires once the full settle window elapses, so a transient-empty anchor.value (the
// hydration race) NEVER triggers a spawn — a late-arriving offline prior is re-engaged, never stolen.
// `didAutoDecide` makes the decision fire exactly ONCE (the interval self-clears on resolve).
function autoDecideAnchor(): void {
  if (didAutoDecide.value) return;
  const AD_STEP_MS = 250;
  const AD_MAX_MS = 3000;
  let elapsedMs = 0;
  const resolveOnce = (act: () => void): void => {
    if (didAutoDecide.value) return;
    didAutoDecide.value = true;
    if (autoDecidePoll) { clearInterval(autoDecidePoll); autoDecidePoll = null; }
    act();
  };
  if (autoDecidePoll) clearInterval(autoDecidePoll);
  autoDecidePoll = setInterval(() => {
    elapsedMs += AD_STEP_MS;
    // anchor / anchorAlive read the live sessionsList — settle until the offline prior hydrates.
    if (anchorAlive.value) {
      // (1) anchor alive → the normal options render · no spawn, no re-engage.
      resolveOnce(() => {
        console.log('[ShatteriteMenu P1.1] AD-Auto · anchor ALIVE · no spawn · suite8Name=', props.suite8Name);
      });
    } else if (anchor.value) {
      // (2) anchor exists but offline → re-engage the SAME original — UNLESS the user
      // deliberately closed it (C472 tombstone): a tombstoned anchor is NEVER auto-resummoned;
      // the Re-engage button (which clears the tombstone) is the conscious path back.
      resolveOnce(() => {
        // C487 · the visit-scoped tombstone — the authority's OWN ref is the decision truth
        // (C484: only the authority decides; the cross-instance read is retired).
        if (reengageTombstoned.value) {
          console.log('[ShatteriteMenu C472] anchor OFFLINE but TOMBSTONED · no auto re-engage · suite8Name=', props.suite8Name);
          return;
        }
        // C488 · AUTO-SPAWN IS THE ONE SWITCH — automatic RE-ENGAGE is auto-summoning too:
        // 'prompt' reserves ALL automatic action behind the toggle (the Re-engage button is
        // the manual path). Only 'auto' summons on a page visit.
        if (anchorSpawnMode.value !== 'auto') {
          console.log('[ShatteriteMenu C488] anchor OFFLINE · Auto-Spawn OFF · the button stands · suite8Name=', props.suite8Name);
          return;
        }
        console.log('[ShatteriteMenu P1.1] AD-Auto · anchor OFFLINE · re-engage SAME · anchorId=', anchor.value?.id);
        void handleReengageAnchor();
      });
    } else if (elapsedMs >= AD_MAX_MS) {
      // (3) NO anchor after the FULL settle window → genuine first run. C470: the spawn fires
      // ONLY on 'auto' (the toggle); 'prompt' no-ops — the Spawn + Anchor button renders.
      resolveOnce(() => {
        if (anchorSpawnMode.value === 'auto' && !spawning.value) {
          // C471 · THE SPAWN DOUBLE-CHECK — re-verify the SERVER truth at fire time (the ref may
          // be the localStorage seed): only a server-confirmed 'auto' spawns.
          void fetch(s8AnchorSpawnPath(props.suite8Name))
            .then((r) => (r.ok ? r.json() : { anchorSpawn: 'prompt' }))
            .then((j: { anchorSpawn?: string }) => {
              if (j.anchorSpawn === 'auto' && !spawning.value && !anchor.value) {
                console.log('[ShatteriteMenu P1.1] AD-Auto · NO anchor after settle · server-confirmed · spawn · suite8Name=', props.suite8Name);
                void handleSpawnAnchor();
              } else {
                console.log('[ShatteriteMenu C471] spawn double-check REFUSED · server mode=', j.anchorSpawn, '· suite8Name=', props.suite8Name);
              }
            })
            .catch(() => { /* unreachable server — never spawn blind */ });
        } else {
          console.log('[ShatteriteMenu C470] NO anchor after settle · auto-spawn OFF · the button stands · suite8Name=', props.suite8Name);
        }
      });
    }
  }, AD_STEP_MS);
}

function clearAutoDecidePoll(): void {
  if (autoDecidePoll) { clearInterval(autoDecidePoll); autoDecidePoll = null; }
}

// C470 · THE AUTO-SPAWN TOGGLE — flips this page's anchorSpawn mode ('auto' ↔ 'prompt') through
// the POST write leg (the Suite 8's OWN Cascade.json holds the truth; the menu maintains it).
// C772 · W4 — persist the Auto Mode toggle into the same S8.json rail; the bridge reads it
// at the Anchor's next spawn anor resume (first-attach exactly as designed).
async function toggleAutoMode(): Promise<void> {
  const next = !autoModeEnabled.value;
  try {
    const res = await fetch(s8AnchorSpawnPath(props.suite8Name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoMode: next }),
    });
    if (res.ok) autoModeEnabled.value = next;
  } catch {
    /* toggle best-effort · the pill reflects only a confirmed write */
  }
}

async function toggleAnchorSpawnMode(): Promise<void> {
  const next = anchorSpawnMode.value === 'auto' ? 'prompt' : 'auto';
  try {
    const res = await fetch(s8AnchorSpawnPath(props.suite8Name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anchorSpawn: next }),
    });
    if (res.ok) {
      anchorSpawnMode.value = next;
      // C472/C487 · consciously turning Auto-Spawn ON lifts the tombstone AND acts NOW —
      // the re-armed decide runs immediately (no off/on cycling, no page change needed).
      if (next === 'auto') {
        setReengageTombstone(false);
        if (isAnchorAuthority.value) {
          didAutoDecide.value = false;
          autoDecideAnchor();
        }
      }
    }
  } catch {
    /* unreachable write — the mode stands */
  }
}

// C472 · THE DELIBERATE-CLOSE TOMBSTONE (r4∥r6∥r7 diagnostic shotgun) — STATUS-PRECISE:
// only the launched→offline transition is a USER close (recordOfflineOnUserClose writes
// 'offline'); bridge restarts flap launched→pending and MUST NOT trip this (the r6-found
// false positive that kept erasing the setting). A deliberate close: (1) flips Auto-Spawn
// OFF (both rails), (2) sets the RE-ENGAGE TOMBSTONE — persisted in localStorage so page
// remounts do NOT auto-resummon the window (the r7-confirmed 03:07 double-summon). The
// tombstone clears on the user's explicit Re-engage anor toggling Auto-Spawn back ON.
const reengageTombstoneKey = (): string => `scsReengageTombstone:${props.suite8Name}`;
const reengageTombstoned = ref<boolean>(false);
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', refreshS8ModeFromDisk);
    document.removeEventListener('visibilitychange', refreshS8ModeOnVisible);
  }
});

// C482 · THE TAB-IN FOLLOW — re-read the S8 truth (S8.json mode via GET + the tombstone via
// localStorage) whenever this window returns to the user. The refs RENDER; the file DECIDES.
function refreshS8ModeFromDisk(): void {
  void fetch(s8AnchorSpawnPath(props.suite8Name))
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { anchorSpawn?: string } | null) => {
      if (j) anchorSpawnMode.value = j.anchorSpawn === 'auto' ? 'auto' : 'prompt';
    })
    .catch(() => { /* unreachable — the ref stands */ });
  }
// C486 · THE DESIGNATION-ARRIVAL RE-ARM (the Cadmium residue): pages whose designation
// hydrates ASYNC over the relay (cadmiumDesignationName starts EMPTY) mount this menu before
// the name exists — the mount GET 404s to 'prompt' and the one-shot auto-decide consumes
// itself against a blank designation. When the REAL name arrives (empty→value), re-read the
// S8 truth AND re-arm the decide. Static-designation pages (Graphite Scribe) never transition.
watch(() => props.suite8Name, (name, prev) => {
  if (name && !prev) {
    refreshS8ModeFromDisk();
    didAutoDecide.value = false;
    if (isAnchorAuthority.value) autoDecideAnchor();
  }
});

function refreshS8ModeOnVisible(): void {
  if (document.visibilityState === 'visible') refreshS8ModeFromDisk();
}

function setReengageTombstone(on: boolean): void {
  // C487 · VISIT-SCOPED (user semantics): the tombstone suppresses the resummon for THIS page
  // visit only — a page change + return with Auto-Spawn ON is FRESH spawn intent. With the
  // Anchor Authority (C484) only ONE instance decides, so the cross-instance localStorage rail
  // is retired; the ref IS the tombstone, and it dies with the visit.
  reengageTombstoned.value = on;
}
const anchorStatus = computed<string | null>(() => anchor.value?.status ?? null);
// C477 · GATE-STATE TRANSITION LOG (user: 'the menu highlights as if the session was spawned'
// on the 2nd close→reload) — every flip of the spawn/re-engage gates narrates its inputs.
watch([showSpawnOption, showReengageOption, anchorStatus], ([spawnOpt, reengOpt, status]) => {
  // C483 · render honesty — the tombstone ref follows localStorage at every gate flip
  // (a cross-window set otherwise leaves this window's render stale until tab-in).
    console.log('[ShatteriteMenu C477] gates · spawnOption=', spawnOpt, '· reengageOption=', reengOpt,
    '· anchorStatus=', status, '· mode=', anchorSpawnMode.value, '· tombstone=', reengageTombstoned.value,
    '· spawning=', spawning.value, '· suite8Name='.replace('suite8Name','designation'), props.suite8Name);
});
// C483 · THE SETTLE DAMPER — the sessionsList relay can deliver STALE frames after a local
// change (the 04:52:26 flap: USER-CLOSED → 'launched' again 300ms later from a pre-close
// broadcast). The close-detection consumes settledAnchorStatus: a status must HOLD 400ms —
// past-describing frames die in the damper.
const settledAnchorStatus = ref<string | null>(null);
let settleTimer: ReturnType<typeof setTimeout> | null = null;
watch(anchorStatus, (nowStatus) => {
  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    settledAnchorStatus.value = nowStatus;
  }, 400);
}, { immediate: true });
watch(settledAnchorStatus, (nowStatus, prevStatus) => {
  // C484 · only the authority AUTHORS the tombstone (the non-authority still READS it).
  if (!isAnchorAuthority.value) return;
  if (prevStatus === 'launched' && nowStatus === 'offline') {
    // C480 · THE TOGGLE STANDS (r7 clinical + user directive): the tombstone ALONE is the
    // per-close suppression — it halts branch-2 re-engage until the conscious Re-engage anor
    // toggle-ON. The prior three-rail wipe (ref + localStorage + server POST → 'prompt') made
    // every deliberate close ERASE the user's standing Auto-Spawn preference; the toggle is a
    // PERSISTENT setting, not a per-close state.
    setReengageTombstone(true);
    console.log('[ShatteriteMenu C472] anchor USER-CLOSED · tombstone SET · Auto-Spawn PRESERVED · suite8Name=', props.suite8Name);
  }
});

// SOE · spawn + anchor THIS domain from the menu (parallel to handleOption). Spawns via the EXISTING
// triggerSpawnSuite8Session (the bridge sets entry.suite8Name BEFORE spawn → claimAnchorIfUnclaimed
// auto-anchors the page anchor), then a readiness poll (250ms/3000ms · mirror Suite8HomeLanding PPOL
// / CadmiumLanding PAOLRP) watches sessionsList for the launched anchor. On found → focus + clear.
// Fallback (a session for this suite8Name appeared but did NOT auto-anchor): await triggerSetAnchor.
// The `anchor` computed reacts to sessionsList, so once isAnchor flips the menu auto-transitions from
// the spawn button to the normal options — no extra wiring needed here.
// C880 · THE SPAWN-ORIGIN THREAD — the page's OWN citizen (GET /scp-config → scpName ·
// the FKIS precedent). Passed as triggerSpawnS8Session arg 2 so the bridge minds the
// RIGHT SCP: registry entry.scpName → the Dock §4 stamp + Instance compose + the S8.json
// seat all land in THIS citizen (the Pewter template-origin confusion: the omitted arg
// let the first-found designation probe bind the anchor to the template).
const originScpName = ref<string>('');
async function ensureOriginScpName(): Promise<string> {
  if (originScpName.value) return originScpName.value;
  try {
    const r = await fetch('/scp-config');
    if (r.ok) {
      const j = (await r.json()) as { scpName?: string };
      if (typeof j.scpName === 'string' && j.scpName.length > 0 && j.scpName !== 'template') {
        originScpName.value = j.scpName;
      }
    }
  } catch { /* absent config → spawn without the thread (the probe fallback stands) */ }
  return originScpName.value;
}

async function handleSpawnAnchor(): Promise<void> {
  // SOE: spawning means the user has engaged the menu — clear any attention-grab ping.
  clearPing();
  const ctrl = controller.value;
  if (!ctrl || spawning.value) return;

  spawning.value = true;
  console.log('[ShatteriteMenu SOE] spawn + anchor · suite8Name=', props.suite8Name);

  // Spawn — the bridge claimAnchorIfUnclaimed auto-anchors the new session to this page.
  // C373 · triggerSpawnS8Session (rename-proof alias) — survives the suite8:page domain-token rewrite.
  const origin = await ensureOriginScpName();
  ctrl.triggerSpawnS8Session(props.suite8Name, origin || undefined);

  // Readiness poll — settle on the launched anchor, else fall back to an explicit set-anchor.
  const SOE_STEP_MS = 250;
  const SOE_MAX_MS = 3000;
  let elapsedMs = 0;
  if (spawnPoll) clearInterval(spawnPoll);
  spawnPoll = setInterval(() => {
    void (async () => {
      elapsedMs += SOE_STEP_MS;
      const sessions = sessionsList.value;
      // (1) launched anchor present → focus the Terminal, clear the poll, done.
      const live = sessions.find(
        (s) => s.suite8Name === props.suite8Name && s.isAnchor === true && s.status === 'launched',
      );
      if (live) {
        if (spawnPoll) { clearInterval(spawnPoll); spawnPoll = null; }
        ctrl.triggerFocusSession(live.id);
        spawning.value = false;
        return;
      }
      // Timeout fallback. P1.1 · ANCHOR-RESPECT — NEVER steal an existing anchor on a spawn-time
      // auto-stamp. If a same-suite8Name anchor ALREADY exists (any status — e.g. an offline prior
      // that hydrated DURING this poll window), re-engage IT (triggerEngageSession · keeps isAnchor)
      // rather than triggerSetAnchor-ing the new session over it (the steal · setSessionAnchor's
      // scope-clear wipes the prior). Only set-anchor when there is genuinely NO existing anchor.
      if (elapsedMs >= SOE_MAX_MS) {
        if (spawnPoll) { clearInterval(spawnPoll); spawnPoll = null; }
        const existingAnchor = sessions.find((s) => s.suite8Name === props.suite8Name && s.isAnchor === true);
        const unanchored = sessions.find((s) => s.suite8Name === props.suite8Name && !s.isAnchor);
        if (existingAnchor) {
          console.log('[ShatteriteMenu SOE] fallback · existing anchor present → re-engage (NO steal) · anchorId=', existingAnchor.id);
          ctrl.triggerEngageSession(existingAnchor.id);
        } else if (unanchored) {
          console.log('[ShatteriteMenu SOE] fallback · no existing anchor → set-anchor · sessionId=', unanchored.id);
          try {
            await ctrl.triggerSetAnchor(unanchored.id);
            ctrl.triggerFocusSession(unanchored.id);
          } catch (err) {
            console.error('[ShatteriteMenu SOE] set-anchor fallback failed · err=', err);
          }
        } else {
          console.warn('[ShatteriteMenu SOE] spawn settled with no session for suite8Name=', props.suite8Name);
        }
        spawning.value = false;
      }
    })();
  }, SOE_STEP_MS);
}

function clearSpawnPoll(): void {
  if (spawnPoll) { clearInterval(spawnPoll); spawnPoll = null; }
}

// P1 · RE-ENGAGE the page's OFFLINE anchor (the orphan-anchor recovery · parallel to handleSpawnAnchor).
// triggerEngageSession relaunches the SAME anchor entry (keeps isAnchor → sidesteps the server
// anti-flood guard a fresh spawn would trip), then a readiness poll (250ms/3000ms · mirror the spawn
// poll / Suite8HomeLanding PPOL) watches sessionsList for the anchor flipping to 'launched'. On found
// → focus + clear. The `anchorAlive` computed reacts to sessionsList, so once the anchor relaunches
// the menu auto-transitions from the re-engage button to the normal options — no extra wiring.
async function handleReengageAnchor(): Promise<void> {
  // C473/C478 · the double-engage guard runs FIRST — the tombstone clear must NOT precede it
  // (TCR: a racing second instance would clear the tombstone and then bail, leaving it falsely
  // lifted before any engage landed). Only the WINNING caller clears.
  const engageTargetId = anchor.value?.id;
  if (engageTargetId) {
    if (inFlightEngages.has(engageTargetId)) {
      console.log('[ShatteriteMenu C473] engage already in flight · skip duplicate · id=', engageTargetId);
      return;
    }
    inFlightEngages.add(engageTargetId);
    setTimeout(() => inFlightEngages.delete(engageTargetId), 10000);
  }
  // C472 · the conscious path back — the winning re-engage lifts the deliberate-close tombstone.
  setReengageTombstone(false);
  // Re-engaging means the user has engaged the menu — clear any attention-grab ping.
  clearPing();
  const ctrl = controller.value;
  const target = anchor.value;
  if (!ctrl || !target || isReengaging.value) return;

  isReengaging.value = true;
  console.log('[ShatteriteMenu P1] re-engage offline anchor · suite8Name=', props.suite8Name, '· anchorId=', target.id);

  // Engage — relaunch the same offline anchor (keeps isAnchor; no new spawn).
  ctrl.triggerEngageSession(target.id);

  // Readiness poll — settle once the anchor flips to 'launched', then focus the Terminal.
  const REENGAGE_STEP_MS = 250;
  const REENGAGE_MAX_MS = 3000;
  let elapsedMs = 0;
  if (reengagePoll) clearInterval(reengagePoll);
  reengagePoll = setInterval(() => {
    elapsedMs += REENGAGE_STEP_MS;
    const live = sessionsList.value.find(
      (s) => s.suite8Name === props.suite8Name && s.isAnchor === true && s.status === 'launched',
    );
    if (live) {
      if (reengagePoll) { clearInterval(reengagePoll); reengagePoll = null; }
      ctrl.triggerFocusSession(live.id);
      isReengaging.value = false;
      return;
    }
    // Timeout — the relaunch did not settle within the window; release the guard so the user can retry.
    if (elapsedMs >= REENGAGE_MAX_MS) {
      if (reengagePoll) { clearInterval(reengagePoll); reengagePoll = null; }
      console.warn('[ShatteriteMenu P1] re-engage did not settle alive for suite8Name=', props.suite8Name);
      isReengaging.value = false;
    }
  }, REENGAGE_STEP_MS);
}

function clearReengagePoll(): void {
  if (reengagePoll) { clearInterval(reengagePoll); reengagePoll = null; }
}

onBeforeUnmount(() => {
  clearPing();
  clearAutoDecidePoll();
  clearSpawnPoll();
  clearReengagePoll();
});

// ============================================================
// OPTION DISPATCH (by kind · reused triggers)
// ============================================================

// PRIME-STALL FIX B · SMSP prime send with a guarded fetch. ONE prime attempt:
// (1) GET the SORD-wrapped Skill/Strategy envelope from /suite8-skill-prime, now wrapped
//     in an AbortController + 8000ms timeout (mirror of triggerSendMessage) so a hung
//     prime fetch can no longer stall BEFORE triggerSendMessage is even reached — the
//     await rejects on timeout → handleOption's `finally` clears dispatchingLabel.
// (2) relay the envelope to the live Anchor via triggerSendMessage (itself now armed).
// Returns ok:false on any leg failure; handleOption decides on a one-shot auto-retry.
async function primeSend(
  ctrl: ScsBridgeController,
  targetId: string,
  ref: string,
  primeKind: string,
  label: string,
  inFocus: boolean,
): Promise<boolean> {
  const url = `/suite8-skill-prime/${encodeURIComponent(props.suite8Name)}?ref=${encodeURIComponent(ref)}&kind=${primeKind}`;
  const controllerAbort = new AbortController();
  const PRIME_FETCH_TIMEOUT_MS = 8000;
  const timeoutId = setTimeout(() => controllerAbort.abort(), PRIME_FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: controllerAbort.signal });
    if (!r.ok) {
      console.error('[ShatteriteMenu SMSP] prime fetch failed · status=', r.status, '· ref=', ref);
      return false;
    }
    const j = (await r.json()) as { envelope?: string };
    if (!j.envelope) {
      console.warn('[ShatteriteMenu SMSP] prime envelope empty · ref=', ref, '· label=', label);
      return false;
    }
    // C871 · the refined messaging mechanism: inFocus HOLDS the session focused after the
    // envelope lands (askMore parity) — the relay skips its final refocus-return to the SCP.
    const res = await ctrl.triggerSendMessage(targetId, j.envelope, { inFocus });
    return res?.ok ?? false;
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    console.error(
      '[ShatteriteMenu SMSP] prime send failed · label=', label,
      '· aborted=', aborted, '· err=', err,
    );
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleOption(option: MenuOption): Promise<void> {
  // SMUP: ANY option engagement means the user has noticed the menu — clear the ping.
  clearPing();
  if (!optionsEnabled.value || dispatchingLabel.value) return;

  const ctrl = controller.value;
  const target = anchor.value;
  if (!ctrl || !target) {
    console.warn('[ShatteriteMenu SMSP] no alive Anchor for option · suite8Name=', props.suite8Name);
    emit('option-selected', { label: option.label, kind: option.kind, ok: false });
    return;
  }

  dispatchingLabel.value = option.label;
  console.log(
    '[ShatteriteMenu SMSP] option · label=', option.label, '· kind=', option.kind,
    '· anchorId=', target.id, '· stageIndex=', props.menuStage.stageIndex,
  );

  let ok = true;
  try {
    if (option.kind === 'scs') {
      // SCS Command — curry the stage's command to the Anchor (advances the agent's plan).
      // C768 · the SCS:In-Focus variant focuses the TERMINAL first (askMore parity) and the
      // relay holds it there (no final refocus); Pass Through stays background as always.
      if (optionInFocus(option)) ctrl.triggerFocusSession(target.id);
      const res = await ctrl.triggerSendMessage(target.id, option.scsCommand, {
        inFocus: optionInFocus(option),
      });
      ok = res?.ok ?? false;
      // C766 · 2A — the workflow press advances to the next stored stage while the model
      // responds (clamped at the last stage · position persisted → every client converges).
      if (ok) advanceStageOnPress();
    } else if (option.kind === 'focus') {
      // Focus — engage the Terminal directly (no message). Side-effect-only trigger.
      ctrl.triggerFocusSession(target.id);
    } else if (option.kind === 'prime') {
      // SMSP · Skill-Priming — GET the bound Skill/Strategy loaded-in-full + SORD-wrapped from the
      // server (/suite8-skill-prime), then relay the envelope to the live Anchor (triggerSendMessage)
      // to PRIME the Suite 8 to PERFORM it. The same load-and-SORD-wrap the BDAP/Dock uses for MCP info.
      // C869 · In-Focus parity (the C768 scs precedent): a prime row declared inFocus focuses the
      // TERMINAL first so the user watches the Skill land and the Anchor perform it.
      if (optionInFocus(option)) ctrl.triggerFocusSession(target.id);
      const ref = option.primeRef ?? '';
      if (!ref) {
        console.warn('[ShatteriteMenu SMSP] prime option missing primeRef · label=', option.label);
        ok = false;
      } else {
        // PRIME-STALL FIX B · first attempt + a SINGLE auto-retry on ok:false (the cold-spawn
        // recovery). The bridge now reports ok:false when the just-spawned anchor's renderer
        // channel was not yet live and the chars were dropped (hop-A cold). A one-shot retry
        // after a short settle (mirror the spawn poll's 250ms cadence) lands the prime once the
        // anchor warms — without permanently locking the menu (the row re-enables in `finally`
        // regardless, so the user can also retry manually).
        ok = await primeSend(ctrl, target.id, ref, option.primeKind ?? 'skill', option.label, optionInFocus(option));
        if (!ok) {
          console.warn('[ShatteriteMenu SMSP] prime ok:false · one-shot auto-retry after settle · label=', option.label);
          await new Promise<void>((r) => setTimeout(r, 250));
          ok = await primeSend(ctrl, target.id, ref, option.primeKind ?? 'skill', option.label, optionInFocus(option));
        }
      }
    } else {
      // AMAF · "Ask More" = MERELY a Focus that ALSO injects an assist prompt. Focus FIRST
      // (bring the user to the instance), then inject the elaboration prompt → the agent writes
      // the next stage → IAJW relays → the menu advances + refocuses. No separate modality.
      ctrl.triggerFocusSession(target.id);
      const assist = option.scsCommand || props.defaultAssistPrompt || 'Tell me more about the current stage.';
      const res = await ctrl.triggerSendMessage(target.id, assist, { inFocus: optionInFocus(option) });
      ok = res?.ok ?? false;
    }
  } catch (err) {
    console.error('[ShatteriteMenu SMSP] option dispatch failed · label=', option.label, '· err=', err);
    ok = false;
  } finally {
    dispatchingLabel.value = null;
  }

  emit('option-selected', { label: option.label, kind: option.kind, ok });
}

// Per-kind affordance label (small badge on each row).
// C768 · THE FOCUS DISCIPLINE (literal). `In Focus` — HiFi GREEN — the terminal keeps focus;
// the relay suppresses the final refocus (Ask Me IS In Focus by nature; scs+inFocus is the
// SCS:In-Focus variant). `Pass Through` — HiFi ORANGE — traditional background messaging.
// The discipline COMBINES with every dispatching form, including the user-written input rows.
function optionInFocus(option: MenuOption): boolean {
  if (option.kind === 'askMore') return option.inFocus !== false; // In Focus by nature
  if (option.kind === 'focus') return true; // pure focusing — no relay at all
  return option.inFocus === true; // scs · prime — Pass Through unless declared
}

function kindBadge(option: MenuOption): string {
  if (option.kind === 'focus') return 'FOCUS';
  return optionInFocus(option) ? 'IN FOCUS' : 'PASS THROUGH';
}

// ============================================================
// Diamond RFI · MENU INPUT (MOIS · MOIK · WCTTR · ISRF · CEWT)
// ============================================================
//
// An option may carry an OPTIONAL inputConfig that turns the row into a WRITE surface. The user
// types/picks below the label, then Submits → the component emits `SCS:TopicUpdate <category
// list>` (CEWT) via the EXISTING triggerSendMessage to the page Anchor (no new tool/endpoint).
// The Anchor extracts/normalizes the categories → upserts topics.json → the topics STCP relay
// re-renders the Research Frontier. Local input state is keyed `${stageIndex}-${i}` and CLEARED
// on every stage advance (the watch below) so a new stage starts blank.

import type { MenuOptionInputKind } from '../../../../model/shatteriteMenu.model';

// Diamond RFI · separate input-badge helper (NOT kindBadge · the input kinds ride on
// option.inputConfig, NOT option.kind). Renders TAGS / TEXT / SELECT keyed off the input kind.
function inputBadge(kind: MenuOptionInputKind | undefined): string {
  switch (kind) {
    case 'tags':
      return 'TAGS';
    case 'text':
      return 'TEXT';
    case 'select':
      return 'SELECT';
    default:
      return '';
  }
}

// Per-row local input state, keyed `${stageIndex}-${i}`. text/select hold a single string;
// tags holds the tokenized chip array.
const localInputValues = ref<Record<string, string>>({});
const localTags = ref<Record<string, string[]>>({});
// Per-row in-flight Submit guard (label of the submitting option · disables that row's Submit).
const submittingKey = ref<string | null>(null);

function rowKey(i: number): string {
  // Diamond RAR · SDSD: key off effectiveStage so input rows align with the rendered v-for keys
  // (effectiveStage === menuStage on the live path · no behavior change there).
  return `${effectiveStage.value.stageIndex}-${i}`;
}

// Clear ALL local input state on a stage advance (mirrors dispatchingLabel reset · the keys are
// stageIndex-scoped, so a fresh stage starts blank · no stale chips/text carry over).
watch(
  () => (props.menuDocument ? props.menuDocument.currentStageIndex : props.menuStage.stageIndex),
  () => {
    localInputValues.value = {};
    localTags.value = {};
    submittingKey.value = null;
  },
);

// WCTTR · whitespace-split tokenizer. `-` `_` `.` `/` are INTRA-token connectors (any connected
// form = ONE category): 'machine-learning ai_ethics data.science' → 3 tokens. Only whitespace
// splits topics; empty tokens are dropped.
function tokenizeWcttr(raw: string): string[] {
  return raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// tags kind · add chip(s) from the current input on space/enter, then clear the field. The input
// may contain several whitespace-separated tokens (paste) — each becomes a chip (de-duplicated).
function addTags(key: string): void {
  const raw = localInputValues.value[key] ?? '';
  const tokens = tokenizeWcttr(raw);
  if (tokens.length === 0) return;
  const existing = localTags.value[key] ?? [];
  const merged = [...existing];
  for (const t of tokens) {
    if (!merged.includes(t)) merged.push(t);
  }
  localTags.value = { ...localTags.value, [key]: merged };
  localInputValues.value = { ...localInputValues.value, [key]: '' };
}

function removeTag(key: string, tag: string): void {
  const existing = localTags.value[key] ?? [];
  localTags.value = { ...localTags.value, [key]: existing.filter((t) => t !== tag) };
}

// The composed category list a Submit will emit, per kind. Returns '' when nothing to submit
// (drives the Submit :disabled guard).
function composedCategories(option: MenuOption, key: string): string {
  const kind = option.inputConfig?.kind;
  if (kind === 'tags') {
    return (localTags.value[key] ?? []).join(', ');
  }
  // text / select — a single trimmed value.
  return (localInputValues.value[key] ?? '').trim();
}

// SB-DS6 · a select inputConfig's string options mapped to the ScsDropdown {value,label} shape
// (value === label === option). Rebuilt per-option-row render from inputConfig.options.
function selectRowOptions(options: readonly string[] | undefined): { value: string; label: string }[] {
  return (options ?? []).map((opt) => ({ value: opt, label: opt }));
}

// ISRF · CEWT Submit — build `SCS:TopicUpdate <category list>` and relay via the EXISTING
// triggerSendMessage to the page Anchor. Clears the row's local state on a successful relay.
async function handleSubmit(option: MenuOption, i: number): Promise<void> {
  const key = rowKey(i);
  if (!optionsEnabled.value || submittingKey.value) return;

  // TRP PAIRING PATH (Diamond TRP · W4) — when the option's inputConfig carries a
  // pairDirective, the row FOCUSES the Anchor + sends `<pairDirective> <userInput>` as ONE
  // message (empty input → the bound pairDirective alone). The filter/join guards a leading
  // space when the user input is empty. This branch runs BEFORE the empty-categories guard
  // below so an EMPTY input still sends the bound directive (the bound directive is the point;
  // the user input is optional refinement). NON-pairing inputConfig rows fall through to CEWT.
  const pairDirective = option.inputConfig?.pairDirective;
  if (typeof pairDirective === 'string' && pairDirective.length > 0) {
    const ctrl = controller.value;
    const target = anchor.value;
    if (!ctrl || !target) {
      console.warn('[ShatteriteMenu TRP] no alive Anchor for pairing submit · suite8Name=', props.suite8Name);
      emit('option-selected', { label: option.label, kind: option.kind, ok: false });
      return;
    }
    const userInput = (localInputValues.value[key] ?? '').trim();
    const combined = [pairDirective, userInput].filter(Boolean).join(' ');
    submittingKey.value = key;
    console.log(
      '[ShatteriteMenu TRP] pairing submit · pairDirective=', pairDirective,
      '· userInput=', userInput, '· anchorId=', target.id,
    );
    let ok = true;
    try {
      ctrl.triggerFocusSession(target.id);                            // focus FIRST (askMore parity)
      const res = await ctrl.triggerSendMessage(target.id, combined, { inFocus: optionInFocus(option) }); // the input form inherits its option's discipline
      ok = res?.ok ?? false;
    } catch (err) {
      console.error('[ShatteriteMenu TRP] pairing submit failed · label=', option.label, '· err=', err);
      ok = false;
    } finally {
      submittingKey.value = null;
    }
    if (ok) {
      localInputValues.value = { ...localInputValues.value, [key]: '' };
    }
    emit('option-selected', { label: option.label, kind: option.kind, ok });
    return;
  }

  const categories = composedCategories(option, key);
  if (!categories) return; // nothing to submit

  const ctrl = controller.value;
  const target = anchor.value;
  if (!ctrl || !target) {
    console.warn('[ShatteriteMenu MOIS] no alive Anchor for submit · suite8Name=', props.suite8Name);
    emit('option-selected', { label: option.label, kind: option.kind, ok: false });
    return;
  }

  // CEWT relay-body contract — `SCS:TopicUpdate ` + comma-space-delimited category labels.
  const directive = `SCS:TopicUpdate ${categories}`;
  submittingKey.value = key;
  console.log(
    '[ShatteriteMenu MOIS] submit · inputKind=', option.inputConfig?.kind,
    '· categories=', categories, '· anchorId=', target.id,
  );

  let ok = true;
  try {
    const res = await ctrl.triggerSendMessage(target.id, directive);
    ok = res?.ok ?? false;
  } catch (err) {
    console.error('[ShatteriteMenu MOIS] submit failed · label=', option.label, '· err=', err);
    ok = false;
  } finally {
    submittingKey.value = null;
  }

  if (ok) {
    // Clear the row's local input on success (the topics relay will re-render the Frontier).
    localInputValues.value = { ...localInputValues.value, [key]: '' };
    localTags.value = { ...localTags.value, [key]: [] };
  }
  emit('option-selected', { label: option.label, kind: option.kind, ok });
}
</script>

<template>
  <!-- SMUP: @mouseenter clears the attention-grab ping (the user has noticed the menu).
       .menu-pinged drives the Pewter glow-pulse + lift + UPDATED badge on a live advance. -->
  <section
    class="shatterite-menu"
    :class="{ 'menu-pinged': pinged }"
    @mouseenter="clearPing"
  >
    <!-- SMUP · animated "UPDATED" corner badge — fades in then out only while pinged. -->
    <span v-if="pinged" class="menu-ping-badge" aria-hidden="true">UPDATED</span>
    <header class="menu-header">
      <h2 class="menu-title hifi-heading">{{ headerTitle }}</h2>
      <!-- C470 · the per-page Auto-Spawn toggle (anchorSpawn 'auto' ↔ 'prompt'). -->
      <button
        v-if="isAnchorAuthority"
        class="menu-autospawn-toggle"
        data-testid="menu-autospawn-toggle"
        :class="{ 'autospawn-on': anchorSpawnMode === 'auto' }"
        :title="anchorSpawnMode === 'auto'
          ? 'Auto-Spawn ON — this page spawns its Suite 8 when no anchor exists'
          : 'Auto-Spawn OFF — spawning is the manual button'"
        @click="toggleAnchorSpawnMode"
      >
        Auto-Spawn: {{ anchorSpawnMode === 'auto' ? 'ON' : 'OFF' }}
      </button>
      <!-- C772 · W4 · the Auto Mode toggle (HiFi YELLOW when ON) — the Anchor spawns anor
           resumes with --permission-mode auto and can work in the background. -->
      <button
        v-if="isAnchorAuthority"
        class="menu-automode-toggle"
        data-testid="menu-automode-toggle"
        :class="{ 'automode-on': autoModeEnabled }"
        :title="autoModeEnabled
          ? 'Auto Mode ON — the Anchor spawns in --permission-mode auto and works in the background'
          : 'Auto Mode OFF — the Anchor spawns with the normal approval gate'"
        @click="toggleAutoMode"
      >
        Auto Mode: {{ autoModeEnabled ? 'ON' : 'OFF' }}
      </button>
      <p v-if="hasStage && effectiveStage.prompt" class="menu-prompt">{{ effectiveStage.prompt }}</p>
      <span :class="['menu-status', anchorAlive ? 'menu-status-alive' : 'menu-status-waiting']">
        {{ statusText }}
      </span>
      <!-- C766 · staged navigation (2A) — back/forth between the stored stages; visible only
           when the document holds more than one stage. Both directions persist the position. -->
      <div v-if="stageCount > 1" class="menu-stage-nav">
        <button
          class="menu-stage-nav-btn"
          :disabled="localStageIndex <= 0"
          title="Previous stage"
          @click="goToStage(localStageIndex - 1)"
        >&lsaquo;</button>
        <span class="menu-stage-nav-pos">Stage {{ localStageIndex + 1 }} / {{ stageCount }}</span>
        <button
          class="menu-stage-nav-btn"
          :disabled="localStageIndex >= stageCount - 1"
          title="Next stage"
          @click="goToStage(localStageIndex + 1)"
        >&rsaquo;</button>
      </div>
    </header>

    <!-- WIRE.1 · SOE · the menu is the ORIGIN of engagement. With NO live anchor AND auto-spawn off
         ('prompt'), the inert waiting stub is replaced by a Spawn + Anchor button: clicking spawns
         this domain's instance (the bridge auto-anchors it to the page), then the readiness poll
         focuses it. Once isAnchor flips, showSpawnOption falls false and the normal options render. -->
    <div v-if="showSpawnOption" class="menu-stub menu-stub-spawn">
      <span class="menu-stub-text">No Anchor yet for {{ suite8Name }} — engage to begin.</span>
      <button
        type="button"
        class="menu-option-btn menu-spawn-btn"
        :disabled="spawning"
        @click="handleSpawnAnchor"
      >
        <span class="menu-option-kind">SPAWN</span>
        <span class="menu-option-label">Spawn + Anchor this domain</span>
        <span v-if="spawning" class="menu-option-spinner">…</span>
      </button>
    </div>

    <!-- P1 · ORPHAN-ANCHOR RE-ENGAGE · an anchor exists but is offline (status !== 'launched').
         Without this branch the menu deadlocks at "Waiting for an alive Anchor…" (no Spawn button —
         an anchor exists; no live options — the anchor is offline). The Re-engage button relaunches
         the SAME anchor (triggerEngageSession · keeps isAnchor → sidesteps the server anti-flood
         guard a fresh spawn would trip). Once it flips 'launched', anchorAlive → the normal options
         render (no extra wiring). Mirrors Suite8HomeLanding / CadmiumLanding PPOL branch (2). -->
    <div v-else-if="showReengageOption" class="menu-stub menu-stub-spawn">
      <span class="menu-stub-text">
        Anchor for {{ suite8Name }} is offline — re-engage to bring it back online.
      </span>
      <button
        type="button"
        class="menu-option-btn menu-spawn-btn"
        :disabled="isReengaging"
        @click="handleReengageAnchor"
      >
        <span class="menu-option-kind">ENGAGE</span>
        <span class="menu-option-label">Re-engage Anchor</span>
        <span v-if="isReengaging" class="menu-option-spinner">…</span>
      </button>
    </div>

    <!-- S6 GUARD · disabled-state stub when no alive Anchor OR no agent-authored stage yet.
         ASDR SMTG: while the just-spawned Anchor IS alive but has not yet authored its first
         stage (stageIndex -1 · the onboard window), surface "preparing your menu…" so the
         post-spawn gap is legible rather than appearing frozen (AARL · agent-turn latency). -->
    <div v-else-if="!optionsEnabled" class="menu-stub">
      <span class="menu-stub-pulse" aria-hidden="true">◇</span>
      <span class="menu-stub-text">
        {{ anchorAlive ? 'Anchor is preparing your menu…' : 'Waiting for an alive Anchor…' }}
      </span>
    </div>

    <!-- The agent-authored stage's options (curried SCS Commands · focus · askMore · MOIS input).
         Diamond RAR · SDSD: iterate effectiveStage.options so the static defaultStage renders its
         scale rows when no live stage exists (live stage wins · effectiveStage resolves it). -->
    <ul v-else class="menu-option-list">
      <li v-for="(option, i) in effectiveStage.options" :key="`${effectiveStage.stageIndex}-${i}`">
        <button
          class="menu-option-btn"
          :class="`menu-option-${option.kind}`"
          :disabled="dispatchingLabel !== null"
          :title="option.tooltip"
          @click="handleOption(option)"
        >
          <span
            :class="['menu-option-kind', optionInFocus(option) ? 'menu-kind-infocus' : 'menu-kind-passthrough']"
          >{{ kindBadge(option) }}</span>
          <span
            v-if="option.inputConfig"
            class="menu-option-input-kind"
          >{{ inputBadge(option.inputConfig.kind) }}</span>
          <span class="menu-option-label">{{ option.label }}</span>
          <span v-if="dispatchingLabel === option.label" class="menu-option-spinner">…</span>
        </button>

        <!-- Diamond RFI · MOIS — per-kind input surface BELOW the label. @click.stop keeps a
             click on the input from re-firing the row's handleOption. Disabled with the row. -->
        <div
          v-if="option.inputConfig"
          class="menu-option-input"
          @click.stop
        >
          <!-- tags · tokenized chips (add on space/enter via WCTTR · removable) + Submit -->
          <template v-if="option.inputConfig.kind === 'tags'">
            <div v-if="(localTags[`${effectiveStage.stageIndex}-${i}`] ?? []).length" class="menu-tag-chips">
              <span
                v-for="tag in localTags[`${effectiveStage.stageIndex}-${i}`]"
                :key="tag"
                class="menu-tag-chip"
              >
                {{ tag }}
                <button
                  type="button"
                  class="menu-tag-remove"
                  :disabled="!optionsEnabled"
                  @click="removeTag(`${effectiveStage.stageIndex}-${i}`, tag)"
                >×</button>
              </span>
            </div>
            <div class="menu-input-row">
              <ScsInput
                v-model="localInputValues[`${effectiveStage.stageIndex}-${i}`]"
                type="text"
                class="menu-input-field"
                :placeholder="option.inputConfig.placeholder || 'Type a category, space to add…'"
                :disabled="!optionsEnabled"
                @keydown.enter.prevent="addTags(`${effectiveStage.stageIndex}-${i}`)"
                @keydown.space.prevent="addTags(`${effectiveStage.stageIndex}-${i}`)"
              />
              <button
                type="button"
                class="menu-input-submit"
                :disabled="!optionsEnabled || submittingKey === `${effectiveStage.stageIndex}-${i}` || (!option.inputConfig.pairDirective && !composedCategories(option, `${effectiveStage.stageIndex}-${i}`))"
                @click="handleSubmit(option, i)"
              >Submit</button>
            </div>
          </template>

          <!-- text · single field + Submit -->
          <template v-else-if="option.inputConfig.kind === 'text'">
            <div class="menu-input-row">
              <ScsInput
                v-model="localInputValues[`${effectiveStage.stageIndex}-${i}`]"
                type="text"
                class="menu-input-field"
                :placeholder="option.inputConfig.placeholder || 'Type a category…'"
                :disabled="!optionsEnabled"
                @keydown.enter.prevent="handleSubmit(option, i)"
              />
              <button
                type="button"
                class="menu-input-submit"
                :disabled="!optionsEnabled || submittingKey === `${effectiveStage.stageIndex}-${i}` || (!option.inputConfig.pairDirective && !composedCategories(option, `${effectiveStage.stageIndex}-${i}`))"
                @click="handleSubmit(option, i)"
              >Submit</button>
            </div>
          </template>

          <!-- select · picker (inputConfig.options) + Submit -->
          <template v-else-if="option.inputConfig.kind === 'select'">
            <div class="menu-input-row">
              <ScsDropdown
                v-model="localInputValues[`${effectiveStage.stageIndex}-${i}`]"
                class="menu-input-field menu-input-select menu-input-dropdown"
                :placeholder="option.inputConfig.placeholder || 'Choose a category…'"
                :disabled="!optionsEnabled"
                :options="selectRowOptions(option.inputConfig.options)"
              />
              <button
                type="button"
                class="menu-input-submit"
                :disabled="!optionsEnabled || submittingKey === `${effectiveStage.stageIndex}-${i}` || (!option.inputConfig.pairDirective && !composedCategories(option, `${effectiveStage.stageIndex}-${i}`))"
                @click="handleSubmit(option, i)"
              >Submit</button>
            </div>
          </template>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Pewter-styled · mirrors the SM-* Reference Design look + the STSC / Cadmium HiFi conventions. */
.shatterite-menu {
  position: relative;
  background: #14110c;
  border-top: 2px solid #5b5347;
  border-right: 2px solid #5b5347;
  border-bottom: 2px solid #a9a196;
  border-left: 2px solid #a9a196;
  box-shadow: -3px 3px 0 rgba(91, 83, 71, 0.4);
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* SMUP: the pinged glow + lift animate over this base; transform/box-shadow are the
     animated properties (the static box-shadow above is the resting Pewter offset). */
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

/* ============================================================
   SMUP · STAGE-UPDATE PING (Pewter attention-grab)
   ------------------------------------------------------------
   D3/D5 idiom: the resting state keeps the hard Pewter offset shadow
   (-3px 3px 0). On a live advance, .menu-pinged layers an EXPANDING glow
   ring in the menu's pewter-gold accent (#d8c79a — this component's bright
   'scs' highlight) ON TOP of the offset shadow, plus a subtle scale "breathe"
   so the whole pane visibly pulses. The pulse LOOPS indefinitely (infinite) —
   a SUSTAINED eye-catch that persists until the user hovers/selects, since the
   first SCS-Bridge refocus can outlast any fixed timer. Eye-catching, but spoken
   in the same embossed-shadow language the menu already uses.
   ============================================================ */
.shatterite-menu.menu-pinged {
  /* Intrusive border flash to the bright pewter-gold accent — held for the whole persist window. */
  border-color: #d8c79a;
  /* infinite: the glow pulse LOOPS until clearPing (hover/select) removes .menu-pinged. */
  animation: menu-ping-glow 1.4s ease-in-out 0s infinite both;
  z-index: 2;
}

/* Expanding glow ring + breathe, layered over the resting Pewter offset shadow.
   LOOPS indefinitely (returns to a sustained mid-glow at 100% so the resting
   frame is never dark) — bright pewter-gold, the menu's own accent. */
@keyframes menu-ping-glow {
  0% {
    box-shadow:
      -3px 3px 0 rgba(91, 83, 71, 0.4),
      0 0 8px 1px rgba(216, 199, 154, 0.55),
      0 0 0 2px rgba(216, 199, 154, 0.22);
    transform: scale(1);
  }
  50% {
    box-shadow:
      -3px 3px 0 rgba(91, 83, 71, 0.4),
      0 0 16px 3px rgba(216, 199, 154, 0.9),
      0 0 0 7px rgba(216, 199, 154, 0.3);
    transform: scale(1.012);
  }
  100% {
    box-shadow:
      -3px 3px 0 rgba(91, 83, 71, 0.4),
      0 0 8px 1px rgba(216, 199, 154, 0.55),
      0 0 0 2px rgba(216, 199, 154, 0.22);
    transform: scale(1);
  }
}

/* SMUP · "UPDATED" corner badge — D6 mono + D5 embossed pewter-gold.
   Slides/fades in once, then HOLDS at full opacity (forwards) for the whole
   persist window — it does NOT fade back out; clearPing (hover/select) unmounts it. */
.menu-ping-badge {
  position: absolute;
  top: -0.6rem;
  right: 0.875rem;
  z-index: 3;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1c1812;
  background: #d8c79a;
  border-top: 1px solid #efe2bb;
  border-right: 1px solid #efe2bb;
  border-bottom: 1px solid #a8975e;
  border-left: 1px solid #a8975e;
  box-shadow: -1px 1px 3px rgba(168, 151, 94, 0.5);
  pointer-events: none;
  /* Slide/fade in ONCE, then HOLD (forwards) — persists until clearPing unmounts it. */
  animation: menu-ping-badge 0.4s ease-out forwards;
}

@keyframes menu-ping-badge {
  0% { opacity: 0; transform: translateY(-4px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* Accessibility: honor reduced-motion — keep the badge + a static border accent,
   drop the moving glow/lift (the cue remains legible without animation). */
@media (prefers-reduced-motion: reduce) {
  .shatterite-menu.menu-pinged {
    animation: none;
    box-shadow:
      -3px 3px 0 rgba(91, 83, 71, 0.4),
      0 0 12px 2px rgba(216, 199, 154, 0.8);
    transform: none;
  }
  .menu-ping-badge {
    animation: none;
    opacity: 1;
  }
}

.menu-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.menu-autospawn-toggle {
  margin-left: auto;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.menu-autospawn-toggle:hover {
  color: rgba(255, 255, 255, 0.85);
}
.menu-autospawn-toggle.autospawn-on {
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.45);
}
.menu-title {
  color: #cfc8ba;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  text-shadow: 0.5px 0.5px 0 rgba(60, 70, 90, 0.7);
}

.menu-prompt {
  color: #d6d3d1;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.menu-status {
  font-size: 0.72rem;
  font-family: 'SF Mono', Monaco, monospace;
}

.menu-status-alive {
  color: #9bbf8e;
}

.menu-status-waiting {
  color: #b5ad9f;
}

/* S6 GUARD · disabled stub */
.menu-stub {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  background: #0e0c08;
  border: 1px dashed #5b5347;
  border-radius: 4px;
  color: #b5ad9f;
  font-size: 0.8125rem;
}

.menu-stub-pulse {
  color: #a9a196;
  font-size: 1rem;
  animation: menu-stub-pulse 1.6s ease-in-out infinite;
}

@keyframes menu-stub-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

/* WIRE.1 · SOE · the Spawn + Anchor stub — a column (label over button), reusing the dashed Pewter
   stub frame but as an ACTIVE engagement surface rather than the inert waiting cue. */
.menu-stub-spawn {
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  border-style: solid;
  border-color: #7a6e4e;
}

/* The spawn button — the bright pewter-gold 'scs' accent (the menu's own highlight) so the origin-
   of-engagement affordance reads as the primary action. Reuses .menu-option-btn layout/borders. */
.menu-spawn-btn .menu-option-kind {
  color: #c9b88a;
  border-color: #7a6e4e;
}

.menu-spawn-btn {
  border-bottom-color: #d8c79a;
  border-left-color: #d8c79a;
}

.menu-spawn-btn:hover:not(:disabled) {
  background: #262019;
  border-color: #d8c79a;
}

.menu-option-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 5px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
  background: #1c1812;
  color: #ece6da;
  border-top: 2px solid #4a4338;
  border-right: 2px solid #4a4338;
  border-bottom: 2px solid #8a8276;
  border-left: 2px solid #8a8276;
  box-shadow: -2px 2px 5px rgba(74, 67, 56, 0.35);
}

.menu-option-btn:hover:not(:disabled) {
  background: #262019;
  border-color: #b8b0a2;
}

.menu-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-option-kind {
  flex-shrink: 0;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.125rem 0.4rem;
  border-radius: 3px;
  background: #0e0c08;
  border: 1px solid #5b5347;
  color: #b5ad9f;
}

/* C768 · the literal focus-discipline badges: In Focus = HiFi GREEN · Pass Through = HiFi ORANGE. */
.menu-option-kind.menu-kind-infocus {
  border-color: var(--color-green);
  color: var(--color-green-light);
}
.menu-option-kind.menu-kind-passthrough {
  border-color: var(--color-orange);
  color: var(--color-orange);
}

.menu-option-scs .menu-option-kind {
  color: #c9b88a;
  border-color: #7a6e4e;
}

.menu-option-focus .menu-option-kind {
  color: #8ea9c9;
  border-color: #4e627a;
}

.menu-option-askMore .menu-option-kind {
  color: #c98ea9;
  border-color: #7a4e62;
}

.menu-option-label {
  flex: 1;
  color: #ece6da;
}

.menu-option-spinner {
  color: #b5ad9f;
  font-family: 'SF Mono', Monaco, monospace;
}

/* ============================================================
   Diamond RFI · MOIS · INPUT SURFACE (Pewter · mirrors the menu/STSC conventions)
   ============================================================ */

/* The input-kind badge (TAGS/TEXT/SELECT) on a row — distinct accent from kindBadge. */
.menu-option-input-kind {
  flex-shrink: 0;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  background: #0e0c08;
  border: 1px solid #7a6e4e;
  color: #d8c79a;
}

/* The per-kind input container, indented below the option button. */
.menu-option-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.4rem 0 0.2rem 0.5rem;
  padding: 0.6rem 0.7rem;
  background: #0e0c08;
  border-left: 2px solid #5b5347;
  border-radius: 4px;
}

.menu-tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.menu-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  font-size: 0.75rem;
  background: #1c1812;
  color: #ece6da;
  border: 1px solid #7a6e4e;
}

.menu-tag-remove {
  background: none;
  border: none;
  color: #c9b88a;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.menu-tag-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-input-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.menu-input-field {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.55rem;
  border-radius: 4px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.8125rem;
  background: #14110c;
  color: #ece6da;
  border-top: 1px solid #4a4338;
  border-right: 1px solid #4a4338;
  border-bottom: 1px solid #8a8276;
  border-left: 1px solid #8a8276;
}

.menu-input-field:focus {
  outline: none;
  border-color: #d8c79a;
}

.menu-input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* SB-DS6 · the select row is now ScsDropdown. `.menu-input-field` (bg/border/padding) lands on
   the dropdown trigger via $attrs, keeping the row visually identical to the text-input row. The
   ScsDropdown wrapper (.scs-dropdown-wrap) is the flex child — it must grow to fill the row, and
   its trigger must span the wrapper. */
.menu-input-select {
  cursor: pointer;
  width: 100%;
}
.menu-input-row > :deep(.scs-dropdown-wrap) {
  flex: 1;
  min-width: 0;
}

.menu-input-submit {
  flex-shrink: 0;
  padding: 0.4rem 0.85rem;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  background: #1c1812;
  color: #d8c79a;
  border-top: 2px solid #4a4338;
  border-right: 2px solid #4a4338;
  border-bottom: 2px solid #8a8276;
  border-left: 2px solid #8a8276;
  box-shadow: -1px 1px 3px rgba(74, 67, 56, 0.35);
  transition: all 0.18s ease;
}

.menu-input-submit:hover:not(:disabled) {
  background: #262019;
  border-color: #d8c79a;
}

.menu-input-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* C766 · the staged navigation row (2A) — Pewter-quiet controls · disabled ends clamp. */
.menu-stage-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
}
.menu-stage-nav-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 0.1rem 0.5rem;
}
.menu-stage-nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.menu-stage-nav-pos {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  opacity: 0.75;
  text-transform: uppercase;
}

/* C773 · W4 polish — the Auto Mode pill MIRRORS the Auto-Spawn pill's LAYOUT truth: the
   header is a column flow, so margin-left:auto is what right-aligns AND shrinks the pill to
   content (its absence stretched the button across the row — the user-caught size break).
   Same metric set as .menu-autospawn-toggle; HiFi YELLOW when toggled. */
.menu-automode-toggle {
  margin-left: auto;
  margin-top: 0.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.menu-automode-toggle:hover {
  color: rgba(255, 255, 255, 0.85);
}
.menu-automode-toggle.automode-on {
  border-color: var(--color-yellow);
  color: var(--color-yellow);
}
</style>