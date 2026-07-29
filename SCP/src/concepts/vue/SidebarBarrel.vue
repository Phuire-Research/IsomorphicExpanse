<script setup lang="ts">
/**
 * SidebarBarrel — THE NAVBAR ROTARY BARREL (D-RB · Cobalt W2)
 *
 * The sidebar nav column, reborn as an ALWAYS-ROTATING barrel (unlimited scroll). The mechanism
 * is transferred VERBATIM from the proven RotaryLoader.vue (client/src/components/RotaryLoader.vue)
 * — the same virtual-ring + twin-marquee + IntersectionObserver + reset-to-midpoint chain — but
 * SHED of every Stratimux/MuxTape plumb: virtualStartIndex is a plain ref, the items array is the
 * SSR nav list (read from window.__APP_STATE__.navItems), and there is no dispatch anywhere.
 *
 * THE RING (the load-bearing trick): the container is padded with spacer divs above + below the
 * rendered window so it is ALWAYS scrollable in both directions. Two invisible marquee hairlines
 * sit at scrollHeight/2 ∓ ROW_HEIGHT/2. When the user scrolls, an IntersectionObserver (root = the
 * scroll container) fires when a marquee leaves the viewport: TOP marquee out → rotate the ring
 * forward (index + 1); BOTTOM marquee out → rotate back (index − 1). After EVERY index step the
 * scroll position is snapped back to the exact midpoint with behavior:'instant', so the barrel is
 * perpetually re-centered and the next scroll motion in either direction re-triggers a boundary.
 * That is what makes it endless: you never actually reach a top or bottom — you rotate through one.
 *
 * TIMING (do NOT touch — these are the RotaryLoader's audited values):
 *  - ROTATION_BEAT_MS = 33 — one rotation per beat; rotationOffBeat is the timestamp gate.
 *  - reset chain after each step: nextTick → setTimeout(25) [DOM settle] → scrollTo(mid,'instant')
 *    → setTimeout(50) [scroll settle] → re-observe. 'instant' is MANDATORY — 'smooth' on the reset
 *    re-crosses the marquee mid-animation and double-triggers (the re-trigger race).
 *  - the @scroll fallback (scrollTop===0 → up · scrollTop===max → down) is debounced 33ms and
 *    exists ONLY for browsers where the observer misses the exact-boundary case.
 *
 * ROW COUNT scales with screen height (ResizeObserver → floor(clientHeight / ROW_HEIGHT), clamped).
 * ON LOAD the window snaps so the isActive row lands at the TOP of the visible ring.
 *
 * Reference: RotaryLoader.vue + rotaryLoader/model/boundaryObserver.ts (READ-ONLY source mechanism).
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// ============================================
// THE NAV ITEM SHAPE (mirrors vue.principle.ts NavItem — structurally identical)
// ============================================
interface BarrelNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive: boolean;
  variant?: string;
}

// ============================================
// CONSTANTS — the barrel's load-bearing timings + geometry (RotaryLoader-derived)
// ============================================
// ROW_HEIGHT is a SEED — the true row height is MEASURED after mount (measuredRowHeight) and used
// wherever available, because .nav-item padding/font can be re-tinted by the user's HiFi config.
const ROW_HEIGHT_SEED = 44; // px — a standard .nav-item (0.75rem × 2 padding + ~0.875rem line)
const MIN_VISIBLE_ROWS = 3; // never rotate fewer than 3 rows (a barrel needs a window)
const ROTATION_BEAT_MS = 33; // the FLYWHEEL beat — scroll-down spins free (one step per 33ms)
// C511 · THE FRICTION BEAT (the up-spin resistance): the acceleration glitch (out of our control —
// platform momentum fighting the instant re-anchor, shoving the container down) rides RAPID
// backward steps. The up-spin is therefore a REFINING rotation: one step per FRICTION_BEAT_MS —
// each re-anchor gets settle room before the next step is allowed. Down-spin stays the flywheel.
const FRICTION_BEAT_MS = 300; // C513 · more dampening (user-tuned: 160 → 300)
const DOM_SETTLE_MS = 25; // resize-path settle (the ROTATION path re-centers in the SAME nextTick)
const SCROLL_SETTLE_MS = 50; // after the instant re-center, wait before re-observing
const FALLBACK_DEBOUNCE_MS = 33; // the @scroll fallback debounce (mirrors ROTATION_BEAT_MS)
// C509 · THE SEAMLESS-STEP GEOMETRY (the extra-jump cure): each spacer is THREE rows tall — the
// off-screen headroom that lets the trigger fire well BEFORE the hard edge (the blank-gap +
// dead-stop the one-row spacers forced, where only the @scroll fallback ever rotated the ring).
const SPACER_ROWS = 3;
// C514 · THE DAMPED RATCHET (the persistent-consistency cure): clamping the native scroll still
// let the PLATFORM'S acceleration drive the up-motion between stops — the dampening applied to
// the outcome, not the input. The up direction now takes the WHEEL ITSELF: upward wheel events
// are preventDefault'ed (the native scroll never moves) and feed an accumulator at a FIXED ratio
// with a PER-EVENT CAP — acceleration is structurally ignored (a violent flick's spiking deltas
// each contribute at most CAP × DAMPING). The drum drags smoothly toward the stop in proportion
// to the damped input and steps when the accumulator fills a row (still beat-gated). Down stays
// the native flywheel.
const UP_DAMPING = 0.35; // the fixed input ratio — every upward wheel px counts as 0.35px
const WHEEL_DELTA_CAP = 60; // px per event before damping — kills momentum's spiking deltas

// ============================================
// STATE — all plain refs (NO Stratimux)
// ============================================
// The ring: the navItems array VERBATIM (Create-S8 entry stays LAST). Defensive: absent → [].
const items = ref<BarrelNavItem[]>([]);
const virtualStartIndex = ref<number>(0); // the ring's rotation offset (0..items.length-1)
const visibleRowCount = ref<number>(MIN_VISIBLE_ROWS); // scales with container height
const measuredRowHeight = ref<number>(ROW_HEIGHT_SEED); // the measured .nav-item height (post-mount)

// Template refs — the scroll container + the twin marquee hairlines (NOT getElementById · the
// RotaryLoader used ids because its marquees lived outside the scroll subtree; ours are inline so
// template refs are cleaner and hydration-safe).
const scrollContainer = ref<HTMLElement | null>(null);
const marqueeTop = ref<HTMLElement | null>(null);
const marqueeBottom = ref<HTMLElement | null>(null);

// The beat gate — one timestamp; a rotation is allowed only once Date.now() passes it.
const rotationOffBeat = ref<number>(0);

// The IntersectionObserver + its lifecycle bookkeeping.
let boundaryObserver: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let lastFallbackTrigger = 0; // the @scroll fallback debounce clock
let pendingResetTimers: ReturnType<typeof setTimeout>[] = []; // reset-chain timers (cleared on unmount)

// ============================================
// THE ROTATED WINDOW — the visible slice of the ring
// ============================================
// C516 · THE REPEATING RING — the window is generated by MODULAR WALK, not sliced from one ring
// copy: displayIndex i renders ring[(vStart + i) % n], for as many rows as the viewport needs —
// MORE than n when the viewport out-sizes the ring (the drum shows a full revolution; items
// legitimately repeat). The C510 cap at n was the resting TOP GAP's root: a tall viewport +
// a short ring left the content too SHORT for the anchor to be reachable — scrollTo clamped at
// maxScroll below firstRow.offsetTop and the shortfall painted as spacer above the first row.
const visibleRowsRotated = computed(() => {
  const ring = items.value;
  const n = ring.length;
  if (n === 0) return [];
  const vStart = virtualStartIndex.value;
  return Array.from({ length: visibleRowCount.value }, (_, displayIndex) => ({
    item: ring[(vStart + displayIndex) % n],
    originalIndex: (vStart + displayIndex) % n,
    displayIndex,
  }));
});

// The spacer + marquee geometry — SPACER_ROWS of pad above + below the window keep the container
// scrollable well past the trigger in both directions (the marquees fire at ±one row of travel;
// the remaining headroom means the hard edge — and the @scroll fallback — is rarely reached).
const rowHeightPx = computed(() => measuredRowHeight.value);
const spacerHeightPx = computed(() => rowHeightPx.value * SPACER_ROWS);

// ============================================
// THE RING WRAP HELPER — (idx ± 1 + N) % N (the RotaryLoader index math, safe against negatives)
// ============================================
function wrapIndex(idx: number, delta: number): number {
  const n = items.value.length;
  if (n === 0) return 0;
  return (idx + delta + n) % n;
}

// ============================================
// RE-ANCHOR — snap the scroll so the FIRST ROW sits flush at the viewport top (C510)
// ============================================
// C510 · THE FIRST-ROW ANCHOR (the top-gap cure): the C509 midpoint rest position only aligned
// with the row stack when clientHeight was an exact row multiple — the REMAINDER leaked out as a
// visible gap above the first row (and the rows aren't even uniform: the Create-S8 row is shorter,
// the seam adds margin, the measured seed drifts). Arithmetic centering is dead: the rest position
// is now the first row's OWN offsetTop — flush to frame BY CONSTRUCTION, whatever the heights.
// The spacers still give scroll room both ways (topSpacer above the anchor · the window overfill +
// bottomSpacer below). 'instant' is MANDATORY — a 'smooth' re-anchor animates the marquee back
// across the boundary and double-fires the observer.
function anchorScroll(): void {
  const container = scrollContainer.value;
  if (!container) return;
  const firstRow = container.querySelector<HTMLElement>('a.nav-item');
  const top = firstRow ? firstRow.offsetTop : (container.scrollHeight - container.clientHeight) / 2;
  container.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
}

// C509 · THE ONE-ROW TRIGGER (the extra-jump cure, part 1) — the marquees are placed RELATIVE TO
// THE VIEWPORT AT REST, not at content-center (where, with short spacers, they could NEVER exit
// the viewport — the observer was dead and only the @scroll edge-fallback ever rotated, forcing a
// visible blank-gap + snap). Geometry: the TOP hairline sits exactly ONE ROW below the resting
// viewport top → it exits the top after ONE ROW of downward travel; the BOTTOM hairline sits ONE
// ROW above the resting viewport bottom → exits after one row upward. Because the trigger travel
// (one row) EQUALS the ring shift (one row), the re-anchor cancels the render shift to NET-ZERO
// visual movement — the seamless step. C510: the rest reference is the FIRST-ROW ANCHOR (its
// offsetTop), not the arithmetic midpoint.
function positionMarquees(): void {
  const container = scrollContainer.value;
  if (!container) return;
  const firstRow = container.querySelector<HTMLElement>('a.nav-item');
  const anchor = firstRow ? firstRow.offsetTop : (container.scrollHeight - container.clientHeight) / 2;
  const row = rowHeightPx.value;
  if (marqueeTop.value) marqueeTop.value.style.top = `${anchor + row}px`;
  if (marqueeBottom.value) marqueeBottom.value.style.top = `${anchor + container.clientHeight - row}px`;
}

// ============================================
// THE ROTATION — one step, then the reset-to-midpoint chain (beat-gated)
// ============================================
function performRotation(direction: 'up' | 'down'): void {
  // Step the ring: down → forward (index + 1); up → back (index − 1). Wrap-safe.
  virtualStartIndex.value = wrapIndex(virtualStartIndex.value, direction === 'down' ? 1 : -1);

  // C509 · THE ONE-FRAME RESET (the extra-jump cure, part 2): the original waited 25ms after
  // nextTick because MuxTapes were HEAVY renders — that gap painted an intermediate frame (the
  // ring visibly shifted at the old scroll position: "the button is added… then falls"). Nav rows
  // are featherweight: re-place the marquees + re-center INSIDE the same nextTick — the DOM is
  // updated but NOT YET PAINTED, so the ring shift and the scroll re-center land as ONE frame
  // (net-zero movement per the one-row-trigger geometry above). Only the observer re-arm keeps
  // its settle delay ('instant' scroll still emits events the re-arm must not race).
  nextTick(() => {
    positionMarquees();
    anchorScroll();
    const t = setTimeout(() => {
      refreshObservation();
    }, SCROLL_SETTLE_MS);
    pendingResetTimers.push(t);
  });
}

// C512 · THE HELD WHEEL — during the friction window the SCROLL ITSELF is held at the one-row
// stop (firstRow.offsetTop − one row). C511 gated only the ROTATION: the container kept
// physically traveling through the window, and the next re-anchor snapped back from wherever
// that accumulation had drifted — a jump cut proportional to the pre-dampening scroll. The
// friction must bind the AREA, not just the step: excess up-travel is discarded the moment it
// happens (clamped, never accumulated), so when the beat expires the travel at the stop is
// EXACTLY one row and the step lands net-zero like every other.
function holdAtUpStop(): void {
  const container = scrollContainer.value;
  if (!container) return;
  const firstRow = container.querySelector<HTMLElement>('a.nav-item');
  if (!firstRow) return;
  const stop = firstRow.offsetTop - rowHeightPx.value;
  if (container.scrollTop < stop) container.scrollTop = stop;
}

// One-shot re-check guard — a burst of held crossings must arm only ONE expiry re-observe.
let upRecheckArmed = false;

// C515 · THE SMOOTH DAMPED UP-SCROLL (the ratchet retired — user: the ENTIRE upward action stays
// one continuous smooth motion, just dampened). The wheel intake preventDefaults upward events
// (the platform's momentum/acceleration never drives the container) and applies the SAME motion
// as a direct damped scrollTop move — capped per event, fixed ratio.
//
// C517 · THE PREPEND-GAP TRIAD (Vermillion-grounded: the documented bidirectional infinite-scroll
// defect — an up-rotation is a content PREPEND above the viewport; browsers hold the raw pixel
// offset while the content above changes, and absolute re-anchoring alone is NOT sufficient
// against a live event stream — the drift accumulated with nothing reclaiming it at rest):
//  1. THE HARD FLOOR — scrollTop can never sit more than ONE ROW above the anchor at any instant
//     (the gap is bounded by construction).
//  2. TRANSITION-FREE RE-DELIVERY — landing at the floor steps the ring DIRECTLY (beat-gated);
//     the IntersectionObserver only reports TRANSITIONS, and a marquee already out delivers no
//     further events while the drift continues — the C515 re-delivery hole.
//  3. THE IDLE SETTLE — wheel quiet 200ms → the drum comes home flush to the anchor (any residual
//     sub-row drift is reclaimed at rest, whatever produced it).
function anchorTopPx(): number | null {
  const container = scrollContainer.value;
  if (!container) return null;
  const firstRow = container.querySelector<HTMLElement>('a.nav-item');
  return firstRow ? firstRow.offsetTop : null;
}

let upIdleTimer: ReturnType<typeof setTimeout> | null = null;
const UP_IDLE_SETTLE_MS = 200;

// ============================================
// C518 · THE ARRIVAL SPIN — the scroll animation to the intended NavLink
// ============================================
// Navigation is a FULL-PAGE reload (href links · no client router), so the animation belongs to
// the ARRIVAL: the departing page stores the drum's position + the intended target (localStorage
// — the persistence between page loads the rotary picks up); the NEW page's barrel mounts at the
// DEPARTED position and SPINS to bring the now-active link home to the top — a decelerating drum
// roll that lands in the C517 lock. No intent stored (direct URL · stale > 10s) → the plain
// active-at-top snap.
const SPIN_INTENT_KEY = 'scsBarrelSpinIntent';
const SPIN_INTENT_FRESH_MS = 10000; // an intent older than this is a stale artifact — ignored
const SPIN_STEP_BASE_MS = 110; // the spin's fastest step (the roll's body) — C519 half-speed
const SPIN_STEP_EASE_MS = 300; // added deceleration toward the landing (quadratic ease-out) — C519 half-speed

// The departure — remember where the drum stands + where the user intends to land. Written
// synchronously in the click (the navigation tears the page down right after). The mint row is
// excluded (its delegated click opens the Create overlay — no navigation, no spin).
function rememberSpinIntent(item: BarrelNavItem): void {
  if (item.id === 'suite8-mint') return;
  try {
    window.localStorage.setItem(
      SPIN_INTENT_KEY,
      JSON.stringify({ fromIndex: virtualStartIndex.value, targetId: item.id, at: Date.now() }),
    );
  } catch {
    /* storage unavailable — the arrival falls back to the plain snap */
  }
}

// The arrival — consume (read + remove) a fresh intent. Returns the departed index anor null.
function consumeSpinIntent(): { fromIndex: number; targetId: string } | null {
  try {
    const raw = window.localStorage.getItem(SPIN_INTENT_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(SPIN_INTENT_KEY); // one-shot — an intent spends itself
    const parsed = JSON.parse(raw) as { fromIndex?: number; targetId?: string; at?: number };
    if (
      typeof parsed.fromIndex !== 'number' ||
      typeof parsed.targetId !== 'string' ||
      typeof parsed.at !== 'number' ||
      Date.now() - parsed.at > SPIN_INTENT_FRESH_MS
    ) {
      return null;
    }
    return { fromIndex: parsed.fromIndex, targetId: parsed.targetId };
  } catch {
    return null;
  }
}

// The drum roll — step the ring to the target along the SHORTEST arc, decelerating into the
// landing (quadratic ease-out on the inter-step delay). Each step is a real performRotation
// (the same net-zero seamless step as user scrolling — the roll IS the mechanism, animated).
function runArrivalSpin(targetIndex: number): void {
  const n = items.value.length;
  if (n === 0) return;
  const forward = (targetIndex - virtualStartIndex.value + n) % n;
  const backward = (virtualStartIndex.value - targetIndex + n) % n;
  const steps = Math.min(forward, backward);
  if (steps === 0) return;
  const direction: 'up' | 'down' = forward <= backward ? 'down' : 'up';
  let elapsed = 0;
  for (let i = 0; i < steps; i++) {
    const progress = i / steps;
    elapsed += SPIN_STEP_BASE_MS + SPIN_STEP_EASE_MS * progress * progress;
    const t = setTimeout(() => performRotation(direction), elapsed);
    pendingResetTimers.push(t);
  }
}

function handleWheel(event: WheelEvent): void {
  if (event.deltaY >= 0) return; // down — native flywheel untouched
  event.preventDefault(); // the native up-scroll never runs — the damped move below replaces it
  const container = scrollContainer.value;
  if (!container) return;
  const damped = Math.min(-event.deltaY, WHEEL_DELTA_CAP) * UP_DAMPING;
  const anchor = anchorTopPx();
  if (anchor === null) {
    container.scrollTop -= damped;
    return;
  }
  const floor = anchor - rowHeightPx.value;
  container.scrollTop = Math.max(floor, container.scrollTop - damped);
  // At the floor → the ring must step (beat-gated) — no observer transition required.
  if (container.scrollTop <= floor + 0.5) {
    executeRotationWithBeat('up');
  }
  // The idle settle — re-armed per event; fires only once the wheel goes quiet.
  if (upIdleTimer) clearTimeout(upIdleTimer);
  upIdleTimer = setTimeout(() => {
    upIdleTimer = null;
    anchorScroll();
  }, UP_IDLE_SETTLE_MS);
  pendingResetTimers.push(upIdleTimer);
}

// The beat gate — collapse a burst of boundary crossings into one rotation per beat. C511: the
// beat is DIRECTIONAL — 'down' spins on the 33ms flywheel; 'up' grinds on the 160ms friction
// (the refining rotation — resistance that starves the acceleration glitch of rapid re-anchors).
// C512: a dropped UP crossing is not merely ignored — the wheel is HELD (clamp to the stop) and
// a single re-check is armed for the beat's expiry (refreshObservation re-delivers the still-out
// marquee via the observer's initial-state callback, so the held step fires cleanly — no stall).
function executeRotationWithBeat(direction: 'up' | 'down'): void {
  const now = Date.now();
  if (rotationOffBeat.value < now) {
    rotationOffBeat.value = now + (direction === 'up' ? FRICTION_BEAT_MS : ROTATION_BEAT_MS);
    performRotation(direction);
    return;
  }
  if (direction === 'up') {
    holdAtUpStop();
    if (!upRecheckArmed) {
      upRecheckArmed = true;
      const t = setTimeout(() => {
        upRecheckArmed = false;
        holdAtUpStop();
        refreshObservation();
      }, Math.max(1, rotationOffBeat.value - now) + 1);
      pendingResetTimers.push(t);
    }
  }
  // A dropped DOWN crossing stays a plain drop — the flywheel re-triggers on its own motion.
}

// ============================================
// THE INTERSECTION OBSERVER — the boundary sensor (root = the scroll container)
// ============================================
// TOP marquee leaves view (ratio 0, not intersecting) → the user scrolled DOWN past it → rotate
// forward. BOTTOM marquee leaves view → the user scrolled UP past it → rotate back. thresholds
// [0, 0.01, 0.99, 1] give the crossing precise checkpoints (mirrors boundaryObserver.ts).
function initObserver(): void {
  const container = scrollContainer.value;
  if (!container) return;
  disconnectObserver();
  boundaryObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Only ACT on a marquee LEAVING the viewport (crossed OUT · ratio 0).
        if (entry.isIntersecting || entry.intersectionRatio > 0) continue;
        if (entry.target === marqueeTop.value) {
          executeRotationWithBeat('down'); // TOP out → forward
        } else if (entry.target === marqueeBottom.value) {
          executeRotationWithBeat('up'); // BOTTOM out → back
        }
      }
    },
    { root: container, rootMargin: '0px', threshold: [0, 0.01, 0.99, 1.0] },
  );
  refreshObservation();
}

// Re-observe both marquees (called after every reset-to-midpoint · the observer must re-latch onto
// the re-positioned hairlines). Disconnect-then-observe is safe on an IntersectionObserver.
function refreshObservation(): void {
  if (!boundaryObserver) return;
  boundaryObserver.disconnect();
  if (marqueeTop.value) boundaryObserver.observe(marqueeTop.value);
  if (marqueeBottom.value) boundaryObserver.observe(marqueeBottom.value);
}

function disconnectObserver(): void {
  boundaryObserver?.disconnect();
  boundaryObserver = null;
}

// ============================================
// THE @scroll FALLBACK — the exact-boundary safety net (debounced 33ms)
// ============================================
// If the observer misses the case where the container hits scrollTop 0 or max exactly, this catches
// it: at absolute top → rotate up; at absolute bottom → rotate down. Debounced to the beat.
function handleFallbackScroll(): void {
  const container = scrollContainer.value;
  if (!container) return;
  const now = Date.now();
  // C512 · THE HELD WHEEL, per-event: scroll events fire synchronously ahead of the observer's
  // async callback — during the friction window every event re-clamps the up-travel at the stop
  // (a no-op for down-travel: the clamp only engages below the stop), so a single violent flick
  // can never paint frames of accumulated drift before the crossing callback catches it.
  if (rotationOffBeat.value > now) holdAtUpStop();
  if (now - lastFallbackTrigger < FALLBACK_DEBOUNCE_MS) return;
  const maxScroll = container.scrollHeight - container.clientHeight;
  if (container.scrollTop <= 0) {
    lastFallbackTrigger = now;
    executeRotationWithBeat('up');
  } else if (Math.abs(container.scrollTop - maxScroll) < 1) {
    lastFallbackTrigger = now;
    executeRotationWithBeat('down');
  }
}

// ============================================
// ROW-COUNT SCALING — visibleRowCount = clamp(floor(clientHeight / ROW_HEIGHT), 3, N)
// ============================================
function recomputeVisibleRowCount(): void {
  const container = scrollContainer.value;
  const n = items.value.length;
  if (!container || n === 0) return;
  // C510 · Measure the AVERAGE row height across the rendered window (offsetTop span / count) —
  // the first row alone lied when it happened to be the shorter Create-S8 row anor the seam row
  // (taller). The average absorbs the non-uniform heights the ring actually renders.
  const rowEls = container.querySelectorAll<HTMLElement>('a.nav-item');
  if (rowEls.length > 0) {
    const first = rowEls[0];
    const last = rowEls[rowEls.length - 1];
    const span = last.offsetTop + last.offsetHeight - first.offsetTop;
    const avg = span / rowEls.length;
    if (avg > 0) measuredRowHeight.value = avg;
  }
  const rowH = rowHeightPx.value;
  // C510 · THE OVERFILL (+1): render ONE MORE row than fits so the window always overhangs the
  // viewport bottom — the bottom edge can never expose spacer at rest (the top is flush by the
  // first-row anchor; the overfill closes the bottom). C516: the cap at n is GONE — the ring
  // REPEATS when the viewport out-sizes it (the modular-walk window above); capping left the
  // content too short for the anchor to be reachable (the resting top gap).
  const fit = Math.floor(container.clientHeight / rowH) + 1;
  visibleRowCount.value = Math.max(MIN_VISIBLE_ROWS, fit);
  // After a resize the geometry moved — re-place the marquees, re-anchor, re-observe.
  nextTick(() => {
    const t = setTimeout(() => {
      positionMarquees();
      anchorScroll();
      refreshObservation();
    }, DOM_SETTLE_MS);
    pendingResetTimers.push(t);
  });
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  // Defensive read of the SSR-injected ring. Absent → items stays [] → the barrel renders nothing
  // (v-if in the template) and leaves the static SSR column untouched (the no-JS fallback).
  if (typeof window !== 'undefined') {
    const injected = window.__APP_STATE__?.navItems;
    if (Array.isArray(injected)) items.value = injected as BarrelNavItem[];
  }
  if (items.value.length === 0) return;

  // C834 instrumentation · one mount snapshot — which nav item arrived ACTIVE from SSR. The
  // ring never re-derives isActive after mount, so a later visual change is NOT this class.
  console.log(
    `[BARREL] ${performance.now().toFixed(0)}ms · mount · active=` +
      (items.value.filter((it) => it.isActive).map((it) => it.id).join(',') || '(none)'),
  );

  // ON LOAD: snap the ring so the isActive row lands at the TOP of the window (found → its index;
  // none → 0). This is the "scroll snaps to the top of the active navlink on load" requirement.
  // C518 · THE ARRIVAL SPIN: a fresh spin intent (stored by the departing page's click) overrides
  // the snap — the drum mounts at the DEPARTED position and rolls to the target after the
  // geometry settles (the spin is scheduled below, once the observer is armed).
  const activeIdx = items.value.findIndex((it) => it.isActive);
  const intent = consumeSpinIntent();
  let spinTargetIdx = -1;
  if (intent !== null) {
    const targetIdx = items.value.findIndex((it) => it.id === intent.targetId);
    if (targetIdx >= 0) {
      virtualStartIndex.value = ((intent.fromIndex % items.value.length) + items.value.length) % items.value.length;
      spinTargetIdx = targetIdx;
    }
  }
  if (spinTargetIdx < 0) {
    virtualStartIndex.value = activeIdx >= 0 ? activeIdx : 0;
  }

  nextTick(() => {
    // Measure the row + fit the window, then arm the observer against the re-centered container.
    recomputeVisibleRowCount();
    const t = setTimeout(() => {
      positionMarquees();
      anchorScroll();
      initObserver();
      // The drum roll fires only after the barrel is fully armed (anchored + observed).
      if (spinTargetIdx >= 0) runArrivalSpin(spinTargetIdx);
    }, DOM_SETTLE_MS);
    pendingResetTimers.push(t);

    // ResizeObserver — the row count scales with screen height (re-fit on any container resize).
    if (typeof ResizeObserver !== 'undefined' && scrollContainer.value) {
      resizeObserver = new ResizeObserver(() => recomputeVisibleRowCount());
      resizeObserver.observe(scrollContainer.value);
    }

    // C514 · THE DAMPED RATCHET intake — registered imperatively with passive:false (a Vue @wheel
    // binding cannot guarantee a non-passive listener, and preventDefault on a passive listener
    // is silently ignored — the ratchet REQUIRES the ability to stop the native up-scroll).
    scrollContainer.value?.addEventListener('wheel', handleWheel, { passive: false });
  });
});

onUnmounted(() => {
  disconnectObserver();
  resizeObserver?.disconnect();
  resizeObserver = null;
  scrollContainer.value?.removeEventListener('wheel', handleWheel);
  for (const t of pendingResetTimers) clearTimeout(t);
  pendingResetTimers = [];
});
</script>

<template>
  <!-- v-if guard: no ring (navItems absent) → render nothing, leave the SSR column alone. -->
  <div
    v-if="items.length > 0"
    ref="scrollContainer"
    class="barrel-scroll"
    @scroll="handleFallbackScroll"
  >
    <!-- TOP SPACER — one row of pad so the container is scrollable upward (enables BOTTOM-out). -->
    <div class="barrel-spacer" :style="{ height: spacerHeightPx + 'px' }" aria-hidden="true"></div>

    <!-- THE TWIN MARQUEE HAIRLINES — invisible IntersectionObserver sensors (template refs). Their
         `top` is set imperatively (positionMarquees) at scrollHeight/2 ∓ ROW_HEIGHT/2. -->
    <div ref="marqueeTop" class="barrel-marquee" aria-hidden="true"></div>
    <div ref="marqueeBottom" class="barrel-marquee" aria-hidden="true"></div>

    <!-- THE ROTATED WINDOW — each row is the EXACT .nav-item markup the SSR Shell renders (icon +
         label spans, data-concept, active/nav-item-create classes) so the served CSS + the
         delegated mint/collapse listeners work untouched. The Create-S8 row gains .barrel-seam
         (the ring boundary marker) whenever it renders mid-window. -->
    <a
      v-for="row in visibleRowsRotated"
      :key="`barrel-slot-${row.displayIndex}`"
      :href="row.item.path"
      :class="[
        'nav-item',
        {
          active: row.item.isActive,
          'nav-item-create': row.item.variant === 'create',
          'barrel-seam': row.item.id === 'suite8-mint',
        },
      ]"
      :data-concept="row.item.id"
      @click="rememberSpinIntent(row.item)"
    >
      <span class="nav-icon">{{ row.item.icon }}</span>
      <span class="nav-label">{{ row.item.label }}</span>
    </a>

    <!-- BOTTOM SPACER — one row of pad so the container is scrollable downward (enables TOP-out). -->
    <div class="barrel-spacer" :style="{ height: spacerHeightPx + 'px' }" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
/* The barrel's own scroll surface — fills the .sidebar-nav it teleports into. The endless ring
   affordance (hidden scrollbar, relative positioning for the marquees) lives in the SERVED CSS
   (.sidebar-nav.barrel-active · vue.principle.ts) so it survives SSR; these scoped rules only size
   the inner surface (scoped styles do NOT ship via SSR — but this island is client-only, so they
   DO apply once hydrated). */
.barrel-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scrollbar-width: none;
  /* C515 · THE ANCHORING KILL — the browser's scroll anchoring auto-adjusts scrollTop when
     content changes ABOVE the viewport (a heuristic built for reading DOWNWARD). It fights the
     ring re-render + re-anchor on the UPWARD flow only — the bidirectional displacement gap at
     the barrel's upper section (works scrolling down, glitches going up). Opt out entirely. */
  overflow-anchor: none;
}
.barrel-scroll::-webkit-scrollbar {
  display: none;
}
.barrel-spacer {
  flex-shrink: 0;
}
/* Local mirrors of the served marquee/seam rules — the served copies are authoritative; these keep
   the island coherent if it is ever previewed outside the SSR document. */
.barrel-marquee {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}
.barrel-seam {
  border-top: 1px dashed rgba(154, 160, 168, 0.4);
  margin-top: 0.35rem;
  padding-top: 0.35rem;
}
</style>
