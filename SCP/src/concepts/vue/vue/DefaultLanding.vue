<script setup lang="ts">
/**
 * SCP Release Home — the template SCP's landing for release (D-HOME · Cycle 699).
 *
 * This is the Vue concept's OWN main landing (DEFAULT_LANDING_MUXONOMIC · isMainLanding:true ·
 * vue.principle.ts) — it owns the `/` route and is the first screen a person meets after
 * `npm i -g scs-bridge` → `scs` installs the Suite Cascade System into their project. It is a
 * STATIC teaching surface (no domain state) built in the Pewter voice from ONLY the existing
 * hifi-* style families. The per-domain page a user forges lives elsewhere (Suite8HomeLanding.vue ·
 * the SAMLS seam) — this page is the release-grade template home that complements it, never
 * replacing the sidebar, TaskBar, or any other working navigation.
 *
 * Content authored from the two Suite 8 knowledge bases in Conference:
 *   - SCP Researcher · SCP-S18 ProjectKnowHow (identity · inventory · mental model · how-to · FAQ)
 *   - SCS Bridge · Instance.md (the release epoch · the callable surface · ghost auto-prune)
 *   - SCP Researcher · SCP-S19 CommandHelmAndWorktrees (the Tactical Bridge · Worktrees · Update)
 *
 * Teaching law: every section leads with the DOING (the command anor click path), the concept
 * second. Written for someone exploring the platform for the first time.
 *
 * The muxium + scsBridge-controller binding below is preserved VERBATIM from the prior default
 * landing so the fixed-bottom Tactical Bridge (Turn Over) resolves from the Home page.
 */
import { ref, onMounted, onUnmounted, provide } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance } from '../../client/client.muxonomy';
// Cycle 159 D1 · GPIM · Vue-layer Muxium binding into universal scsBridge controller
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
// D-HOME R3 · Section 04 Release Notes rendered as a MINI WEBSITE (viewheight nav + content pane).
import ReleaseMiniSite from './ReleaseMiniSite.vue';
// C803 · THE PEWTER TESSERA CASCADE — the HiFi Suite Highlighting chips (0-7 · popover cards).
import SuiteChip from '../components/SuiteChip.vue';
// C809 · THE SCP MARK — the tri-color formalization of the term (the alternating shadows).
import ScpMark from '../components/ScpMark.vue';

// For client-side type safety
type ClientDeck = any;

// The SCS-Bridge release · version = Cascade Cycle (see Release Notes below).
const RELEASE_VERSION = '0.938.0';

// ===================== RELEASE NOTES (D-HOME R3) =====================
// The 0.697.0 notes were the FIRST public stamp; 0.811.0 (R4) added the C702-C809 delta;
// 0.930.0 (R5 · the release stamp) heads the mini-site with the New-in-0.930.0 wing.
// delta features + the inline hifi-hl highlighting fleet pass. In R3 the full, categorized tour moved into a
// MINI WEBSITE — ReleaseMiniSite.vue owns the 44-feature nav + content pane; section 04 below keeps
// only its eyebrow/heading and the "version = Cascade Cycle" headline, and mounts the mini-site as
// its body. The R2 pill/filter catalog (ReleaseCategory type · RELEASE_FEATURES · .release-pill*)
// was retired here and now lives, expanded, inside the child component.

// Reactive connection state
const isConnected = ref<boolean>(false);
const connectionStatus = ref<string>('Initializing...');

// Muxium instance and stage planner
let muxium: Muxium<ClientDeck> | null = null;
let stagePlanner: any = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  // CREATE ClientMuxium — the tier-gating mechanism (base concepts only · [] page concepts).
  muxium = createClientMuxiumInstance([], {
    title: 'ScpReleaseHome',
    logging: true,
    storeDialog: true,
  }) as Muxium<ClientDeck>;

  // Provide muxium for any child components
  provide('muxium', muxium);

  // GPIM · bind this landing's Muxium into the universal scsBridge controller so the Tactical
  // Bridge (Turn Over) in the fixed-bottom dock fires from the Home page.
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // Subscribe to connection state
  stagePlanner = muxium.plan<ClientDeck>(
    'scpReleaseHomeSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => {
        return [
          stage(
            ({ d }) => {
              const connected = d.client.d.webSocketClient.k.isConnected.select();
              isConnected.value = connected;
              connectionStatus.value = connected ? 'Connected' : 'Connecting...';
            },
            {
              selectors: [d__.client.d.webSocketClient.k.isConnected],
            },
          ),
        ];
      }),
  );
});

onUnmounted(() => {
  // GPIM cleanup · unbind controller from this landing's Muxium
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (stagePlanner) {
    stagePlanner.conclude();
  }
  if (muxium) {
    muxium.close();
  }
});
</script>

<template>
  <div class="scp-home">
    <!-- ===================== HERO · identity in three sentences ===================== -->
    <header class="home-hero hifi-pane-base">
      <p class="hero-eyebrow hifi-mono">SUITE CASCADE SYSTEM</p>
      <h1 class="hero-title hifi-heading spectrum-text">Your Frontier, Renewed.</h1>
      <!-- C808 · THE HERO IDENTITY (the inducted founder copy · Damascus polish — voice held,
           the UnKnown's casing deliberate; the acronym readings tinted to MIRROR the section-01
           acronym panel: blue=Stratimux Concept Program · yellow=Suite Cascade Protocol ·
           red=Secure/Contain/Protect · fuchsia=Services Contain Problems · green=recursion). -->
      <div class="hero-identity">
        <p>
          Your <ScpMark />: a <span class="hifi-hl-blue">Stratimux Concept Program</span>, a
          <span class="hifi-hl-yellow">Suite Cascade Protocol</span>, and a means of
          <span class="hifi-hl-red">Securing, Containing, and Protecting</span> a given domain —
          by representing it as <span class="hifi-hl-fuchsia">a Service that Contains a
          Problem</span>. What makes an <ScpMark /> is the anomalous frontier that
          <span class="hifi-hl-green">recursively improving software</span> represents.
        </p>
        <p class="hero-welcome hifi-heading">Welcome to the Unlimited Frontier.</p>
      </div>
      <div class="hero-status">
        <span class="status-label hifi-mono">BRIDGE</span>
        <span :class="['status-value', isConnected ? 'ready' : 'loading']">{{ connectionStatus }}</span>
        <span class="status-sep">·</span>
        <span class="status-label hifi-mono">RELEASE</span>
        <span class="status-value ready">v{{ RELEASE_VERSION }}</span>
      </div>
    </header>

    <main class="home-body">
      <!-- ===================== THE NAMED SCP · C801 Damascus revision (the first-session
           walkthrough retired — the viewer IS in their first session at first public viewing;
           source: the C800 inducted founder copy · DIAMOND-RELEASE-CLOSURE §R4 RESHAPED) ===================== -->
      <section class="home-section hifi-pane-green">
        <p class="section-eyebrow hifi-mono">01 · THE NAMED <ScpMark /></p>
        <h2 class="section-title named-scp-title hifi-heading">Introducing the Named <ScpMark /></h2>
        <span class="named-scp-badge hifi-mono">PHUIRE RESEARCH · FIRST PUBLIC VIEWING</span>
        <p class="section-lede">You are used to numbered, classified <ScpMark />s in traditional canon. Here, from PhuirE Research, we present the first Named <ScpMark />.</p>
        <!-- C805 · THE HIGHLIGHT REWORK — the prose rides the Pewter Tessera subtext ground (light
             text on the dark gem-lit Onyx, never on the suite color) with the functional color law
             highlighting the key phrases inline (the /your-moat idiom). -->
        <div class="named-scp-ground hifi-subtext-ground">
          <div class="named-scp-body">
            <p>The fundamental difference is that <span class="hifi-hl-base">Named <ScpMark />s are real</span> — based on the closest aspect of our reality that could otherwise fall into that unreal category. Artificial Intelligence can be <span class="hifi-hl-purple">anything we compose it to be</span>. You just experienced AI working in tandem with software to actualize the installation and <span class="hifi-hl-green">recursive improvement of software that improves while you use it</span>. And that AI improves with the strength of your Named <ScpMark />’s configuration, alongside each advancing version of AI that comes to the table.</p>
            <p>The Named <ScpMark /> is purpose-created to ride the wave of Artificial Intelligence, so that developers and more have a means to keep up in a rapidly changing economy. We now have a new concept of work: <span class="hifi-hl-purple">Autonomous Work</span>. Many utilize looped conventions to actualize entire software suites at once — the birth of Personalized Software at long last. But with it comes a question: how do you keep up in a marketplace where everyone can have their own personalized software, <span class="hifi-hl-red">gated behind untold amounts of compute</span>? Enter the trusty Open Source means. At the click of a <span class="hifi-hl-blue">Bridge Turn Over</span>, you can rapidly configure your live <ScpMark /> into actualizing any page. Further still, Suite 8s — <span class="hifi-hl-purple">the Suite Cascade System’s premiere agent architecture</span> — represent entire pages as a means of interacting with an AI. The AI is, effectively, the page or the computer program, held within carefully threaded bounds. It may be accessed at the cost of a <span class="hifi-hl-fuchsia">subscription</span>, while the software itself is free. The intention behind this software is to compete in a <span class="hifi-hl-yellow">positive-sums marketplace</span> built on the heavyweight that carries the world’s economy: <span class="hifi-hl-base">Open Source, on a net-metered tap</span>.</p>
            <p>The issue with Free is that it is uncapitalistic in reality — but only because it blocks the ability to perform <span class="hifi-hl-yellow">price discovery</span>. <span class="hifi-hl-base">The <ScpMark /> architecture is free.</span> The reality of a marketplace based on that architecture is the positive-sums exchange of the cost of actualizing the software, by energy and depreciation cost. <span class="hifi-hl-yellow">A Penny Market.</span></p>
            <p>Right now is <span class="hifi-hl-green">the Training Season</span>. A Suite 8 page can be hand-crafted, or built out through <span class="hifi-hl-purple">the Cascade Loop means</span> to suit whatever purpose you require. A website bound to a server is effectively any computer program, and this system can expand to further means of computation — the goal for the <ScpMark /> is the ability to <span class="hifi-hl-blue">relay inputs into off-screen rendered programs</span>. The <ScpMark /> you are interacting with is different from a website: it has <span class="hifi-hl-fuchsia">post-processing applied to it</span>. That comes at a cost, so we built out the basis components — <span class="hifi-hl-green">the SCS-Bridge component library</span> — to ease the difficulty of building your own custom solutions.</p>
            <p>Keep in mind: this is <span class="hifi-hl-green">recursively improving software</span>, riding a <span class="hifi-hl-purple">compounding network effect</span>, with a marketplace of <span class="hifi-hl-yellow">penny transactions</span> as its accelerant. That seems small — and the system can be further refined on absolute utilization — but keep in frame what a million utilizations of a design presented to the marketplace means: <span class="hifi-hl-yellow">ten thousand dollars</span>. Not the largest amount. When that is five million, you are looking at <span class="hifi-hl-yellow">fifty thousand</span> — for the majority, enough to dig out of a debt hole. That is the purpose of the marketplace: to supply a means of keeping in touch, and enough pennies to contribute more time to exploring what is possible with self-evolving software based on your work. You can have this be automatic — but here we advise <span class="hifi-hl-base">the purposeful augmentation as your Diamond</span>. How can you improve your work? What <ScpMark />s from your work can you share that would assist others in improving theirs?</p>
          </div>
        </div>
        <!-- C805 · THE ACRONYM PANEL — the toolbar + body + ◆ list anatomy (the ORIGIN panel idiom). -->
        <div class="named-scp-acronym-panel">
          <div class="hifi-panel-toolbar">
            <span class="nsap-title hifi-heading"><ScpMark /> stands for a number of acronyms</span>
          </div>
          <div class="hifi-panel-body">
            <ul class="hifi-list">
              <li style="--mark: var(--color-red)"><span class="hifi-hl-red">Secure, Contain, Protect</span> — the aesthetic inspiration.</li>
              <li style="--mark: var(--color-blue)"><span class="hifi-hl-blue"><strong>Stratimux Concept Program</strong></span> — the reading we pin here: the <ScpMark /> you are inside is <span class="hifi-hl-base">the UI representation of the StratiDECK system from Stratimux</span>.</li>
              <li style="--mark: var(--color-purple)"><span class="hifi-hl-purple">Stratimux Computer Program</span>.</li>
              <li style="--mark: var(--color-yellow)"><span class="hifi-hl-yellow">Suite Cascade Protocol</span>.</li>
              <li style="--mark: var(--color-fuchsia)"><span class="hifi-hl-fuchsia">Services Contain Problems</span> — two readings: this service solves this problem, and this service has a problem.</li>
            </ul>
            <p class="nsap-close">The point is to make your personal <ScpMark /> in the same sense of what the idea represents in regards to the unreal: an <ScpMark /> in this new marketplace <span class="hifi-hl-base">must solve a problem</span>. The marketplace is directly inspired by <span class="hifi-hl-purple">game modifications</span>: the composability, the ease of transferring any existing agent into a Suite 8 or creating one on the fly. This is capital — and here is the beginning of proving the value of <span class="hifi-hl-yellow">solving problems and calling it a business</span>.</p>
          </div>
        </div>
      </section>

      <!-- ===================== MENTAL MODEL · the one map ===================== -->
      <section class="home-section hifi-pane-blue">
        <p class="section-eyebrow hifi-mono">02 · THE MENTAL MODEL</p>
        <h2 class="section-title hifi-heading">Bridge ↔ <ScpMark />s ↔ Sessions ↔ Suite 8s</h2>
        <p class="section-lede">
          One window, one bar, a small set of pages. Hold this shape and everything else follows.
        </p>
        <div class="model-map">
          <div class="model-node hifi-pane-base">
            <span class="model-name hifi-heading">The Bridge</span>
            <span class="model-desc">Where you stand. The <code>scs</code> command — <span class="hifi-hl-blue">your operational center</span>. It installs <ScpMark />s and lists them, online and offline.</span>
          </div>
          <span class="model-link hifi-mono">installs + manages</span>
          <div class="model-node hifi-pane-base">
            <span class="model-name hifi-heading">An <ScpMark /></span>
            <span class="model-desc">One installed app — this window. <span class="hifi-hl-base">Fronted by your identity</span>, not a public endpoint.</span>
          </div>
          <span class="model-link hifi-mono">runs</span>
          <div class="model-node hifi-pane-base">
            <span class="model-name hifi-heading">Sessions</span>
            <span class="model-desc">Each Claude Code conversation you spawn here — <span class="hifi-hl-blue">list, engage, rename, archive</span>.</span>
          </div>
          <span class="model-link hifi-mono">bound to</span>
          <div class="model-node hifi-pane-base">
            <span class="model-name hifi-heading">Suite 8s</span>
            <span class="model-desc">A named working surface for one domain. Each gets its own page and uses <span class="hifi-hl-purple">the 8-function Cascade</span> internally.</span>
          </div>
        </div>
        <p class="model-note">
          Two frames to hold: the <strong>Suite Cascade</strong> is <span class="hifi-hl-purple">the fixed 8-function method</span> (the
          engine); a <strong>Suite 8</strong> is <span class="hifi-hl-green">a domain you add</span> that uses it. The bridge ships a
          few (Teal Claude, the Scholar, the Researcher, the Gitm Resolver); more emerge per project.
        </p>
        <!-- C803 · THE HIFI SUITE HIGHLIGHTING — the eight functions as popover chips (Pewter Tessera). -->
        <div class="suite-chip-row">
          <span class="suite-chip-row-label hifi-mono">THE EIGHT FUNCTIONS</span>
          <SuiteChip v-for="n in 8" :key="n" :n="n - 1" />
        </div>
      </section>

      <!-- ===================== TUTORIAL · PENDING (C817) — the section moves to locked status:
           after release it becomes the INTERACTIVE Tutorial (the install experience turned
           teacher · automated · step-conducted) mirroring the curated walkthrough at
           youtube.com/@Phuire. The locked-with-promise idiom (C813): the suite color held at
           low saturation — never grayscale death; the channel link LIVE while the body sleeps. -->
      <section class="home-section hifi-pane-yellow">
        <p class="section-eyebrow hifi-mono">03 · TUTORIAL</p>
        <h2 class="section-title hifi-heading">We are just getting started</h2>
        <span class="tutorial-badge hifi-mono">🔒 LOCKED — UNLOCKS AFTER RELEASE</span>
        <p class="section-lede tutorial-promise">
          After release, this section becomes the <span class="hifi-hl-yellow">interactive
          Tutorial</span> — the install experience turned teacher: <span class="hifi-hl-purple">step-conducted
          and automated</span>, walking you through each task live. It mirrors a curated
          walkthrough series at
          <a class="tutorial-channel" href="https://www.youtube.com/@Phuire" target="_blank" rel="noopener">youtube.com/@Phuire</a>
          — <span class="hifi-hl-green">subscribe there; the channel unlocks first</span>.
          The cards below preview the tasks the Tutorial will teach.
        </p>
        <div class="howto-grid tutorial-locked">
          <div class="howto-card hifi-pane-base">
            <span class="howto-q hifi-heading">Spawn or resume a session</span>
            <span class="howto-a">Sessions → open the <strong>Spawn Picker</strong> → pick a Suite 8 → Spawn. A session opens in its own window. To return to an offline one, engage its row — it <span class="hifi-hl-green">resumes where it left off</span>.</span>
          </div>
          <div class="howto-card hifi-pane-base">
            <span class="howto-q hifi-heading">Anchor a session to a page</span>
            <span class="howto-a">In the session's Anchor cell → <strong>Set as Anchor</strong> pins it as that Suite 8's page session (Set reassigns — <span class="hifi-hl-yellow">one anchor per Suite 8</span>). <strong>Release Anchor</strong> clears it.</span>
          </div>
          <div class="howto-card hifi-pane-base">
            <span class="howto-q hifi-heading">Install another <ScpMark /></span>
            <span class="howto-a">Run <span class="hifi-mono">scs</span> from another project folder and take the install menu. Or, in the Session Manager's <strong><ScpMark /> Command</strong> helm, <strong>Multiply</strong> an <ScpMark /> to run it as another worktree instance <span class="hifi-hl-blue">on its own port</span>.</span>
          </div>
          <div class="howto-card hifi-pane-base">
            <span class="howto-q hifi-heading">Turn over (adopt code changes)</span>
            <span class="howto-a">Set <span class="hifi-hl-green"><strong>Shield A</strong></span> as your clean baseline, drift on <span class="hifi-hl-orange"><strong>Sword B</strong></span>, then Turn Over from the bottom dock. The server restarts under you — <span class="hifi-hl-base">your place survives</span>. A bad boot <span class="hifi-hl-red">reverts to Shield A within ~45s</span>.</span>
          </div>
          <div class="howto-card hifi-pane-base">
            <span class="howto-q hifi-heading">Update the <ScpMark /></span>
            <span class="howto-a">When the template advances, run an <ScpMark /> update: a retained clone diffs the new template against your history; the <strong>Gitm Resolver</strong> <span class="hifi-hl-green">keeps your additions</span> and merges the rest. Then Turn Over to boot the updated app.</span>
          </div>
          <div class="howto-card hifi-pane-base">
            <span class="howto-q hifi-heading">Personalize the look</span>
            <span class="howto-a">Settings → pick the render mode (Muxon skin or Off) and theme. The window <span class="hifi-hl-green">re-tints live</span> — no reload.</span>
          </div>
        </div>
      </section>

      <!-- ===================== RELEASE NOTES · v0.930.0 ===================== -->
      <section class="home-section hifi-pane-purple">
        <p class="section-eyebrow hifi-mono">04 · RELEASE NOTES</p>
        <h2 class="section-title hifi-heading">
          v{{ RELEASE_VERSION }}
          <span class="release-stamp hifi-stamp hifi-stamp-purple">version = Cascade Cycle</span>
        </h2>
        <p class="section-lede">
          <span class="hifi-hl-green">Stamped 2026-07-28 — the first public release, carried forward through 0.938.0.</span>
          The bridge's <span class="hifi-hl-purple">version number IS its Cascade Cycle</span> — each cycle of the method advances it.
          This release crossed the bar for <span class="hifi-hl-base">the first public product</span>. This is the full tour — pick a
          feature on the left to read it.
        </p>

        <!-- THE MINI WEBSITE · the full 44-feature tour as a viewport-height nav + content pane
             (D-HOME R3). The section's eyebrow/heading + headline stay above; the body IS the
             child. -->
        <ReleaseMiniSite />
      </section>

      <!-- ===================== TROUBLESHOOTING · top real failure modes ===================== -->
      <section class="home-section hifi-pane-red">
        <p class="section-eyebrow hifi-mono">05 · TROUBLESHOOTING</p>
        <h2 class="section-title hifi-heading">When something looks off</h2>
        <p class="section-lede">Symptom → what to do. The top real failure modes, doing-first.</p>
        <dl class="trouble-list">
          <div class="trouble-row hifi-pane-base">
            <dt class="trouble-q hifi-heading">The bridge shows disconnected / a page won't populate</dt>
            <dd class="trouble-a">Check <span class="hifi-mono">Cascades/Bridge/bridge.json</span> — <span class="hifi-hl-red">absent means the bridge isn't running</span>. Relaunch <span class="hifi-mono">scs</span>. Pages hydrate on mount, so <span class="hifi-hl-green">re-navigate to the page</span> to fire its fetch.</dd>
          </div>
          <div class="trouble-row hifi-pane-base">
            <dt class="trouble-q hifi-heading">I rebuilt but the code didn't take (stale singleton)</dt>
            <dd class="trouble-a">The bridge is a single instance — a relaunch can <span class="hifi-hl-red">relay to the still-running one</span>. <span class="hifi-hl-green">Fully quit it</span> (<span class="hifi-mono">Cmd+Q</span> / stop the process) and run <span class="hifi-mono">scs</span> fresh so the new build loads.</dd>
          </div>
          <div class="trouble-row hifi-pane-base">
            <dt class="trouble-q hifi-heading">The window won't open (electron binary)</dt>
            <dd class="trouble-a">Restore the electron binary with <span class="hifi-mono">node node_modules/electron/install.js</span>, then relaunch.</dd>
          </div>
          <div class="trouble-row hifi-pane-base">
            <dt class="trouble-q hifi-heading">Ghost sessions in the list</dt>
            <dd class="trouble-a">These are <span class="hifi-hl-green">auto-pruned at boot</span> — restart the bridge and stale ghost rows clear themselves.</dd>
          </div>
          <div class="trouble-row hifi-pane-base">
            <dt class="trouble-q hifi-heading">The git change count reads 0 on a fresh install</dt>
            <dd class="trouble-a"><span class="hifi-hl-yellow">The count clamps until a baseline exists.</span> Set the <span class="hifi-hl-green"><strong>Shield A</strong></span> first and the badge starts ticking.</dd>
          </div>
          <div class="trouble-row hifi-pane-base">
            <dt class="trouble-q hifi-heading">State is wedged and Turn Over won't clear it</dt>
            <dd class="trouble-a">A soft turn-over preserves state, so <span class="hifi-hl-red">it won't fix a stuck one</span>. Use <span class="hifi-hl-red"><strong>Sparks</strong></span> (the Hard Turn Over) — it clears client state and <span class="hifi-hl-green">re-hydrates clean</span>; <span class="hifi-hl-base">your <ScpMark /> identity survives</span>.</dd>
          </div>
        </dl>
      </section>

      <!-- ===================== THE OPEN RACE · the Contribute widget (grounded on the
           SCP-Origin Home's race dynamic — seasons on a course, one racing line after
           another, run in the open). The one door to the Commons. ===================== -->
      <section class="home-section hifi-pane-fuchsia">
        <p class="section-eyebrow hifi-mono">06 · THE OPEN RACE</p>
        <h2 class="section-title hifi-heading">A race run in the open</h2>
        <p class="section-lede">
          Right now is the <span class="hifi-hl-fuchsia">Training Season</span> — the machine
          you are using is the first car on the grid, built and proven before it takes the
          course. The course runs one racing line after another, to a single finishing line.
        </p>
        <ol class="race-ladder">
          <li class="race-line hifi-pane-base race-line-now">
            <span class="race-flag hifi-mono">NOW</span>
            <span class="race-name hifi-heading">The Training Season</span>
            <span class="race-what">First Public Release — SCS-Bridge + the <ScpMark /> Template</span>
          </li>
          <li class="race-line hifi-pane-base">
            <span class="race-flag hifi-mono">NEXT</span>
            <span class="race-name hifi-heading">The Testing Season</span>
            <span class="race-what">The Reference Design Marketplace</span>
          </li>
          <li class="race-line hifi-pane-base">
            <span class="race-flag hifi-mono">THEN</span>
            <span class="race-name hifi-heading">The Season Opener</span>
            <span class="race-what">The Suite Bulletin System</span>
          </li>
          <li class="race-line hifi-pane-base">
            <span class="race-flag hifi-mono">····</span>
            <span class="race-name hifi-heading">The Summer Stretch</span>
            <span class="race-what">One racing line after another</span>
          </li>
          <li class="race-line hifi-pane-base race-line-finish">
            <span class="race-flag hifi-mono">🏁</span>
            <span class="race-name hifi-heading">The Grand Prix</span>
            <span class="race-what">SCS Dedicated Hardware — the finishing line</span>
          </li>
        </ol>
        <p class="race-offer">
          <span class="hifi-hl-fuchsia">Support the paradigm shift</span> and it supports you
          back: a subscription grants an <span class="hifi-hl-green">MPL 2.0 license</span> to
          the release projects — free to use, including in your own commercial work — anor
          donate to fund the open RoadMap directly. Donations accelerate the run.
        </p>
        <div class="race-actions">
          <a
            class="hifi-btn hifi-btn-fuchsia"
            href="https://scp-origin.com/contribute"
            target="_blank"
            rel="noopener"
          >
            Contribute — join the race
          </a>
          <span class="race-actions-note hifi-mono">scp-origin.com/contribute</span>
        </div>
      </section>

      <!-- C814 · THE CONCLUDER (the inducted close · Damascus voice held · the transparent
           glass vessel — the frame the user's own conception fills). -->
      <footer class="home-concluder hifi-pane-transparent">
        <p class="concluder-code hifi-mono"><span class="hifi-hl-blue">The window rebuilds itself under you.</span></p>
        <p class="concluder-line hifi-heading">Welcome to the <span class="hifi-hl-orange">Unlimited Frontier</span>. What at first <span class="hifi-hl-blue">Turns</span>, <span class="hifi-hl-purple">Turns Faster</span> — till it's just <span class="hifi-hl-fuchsia">a Cycle</span>.</p>
      </footer>
    </main>

    <footer class="home-footer">
      <p class="footer-line hifi-mono">Suite Cascade System · <ScpMark /> Template · v{{ RELEASE_VERSION }}</p>
      <p class="footer-sub hifi-label">The window rebuilds itself under you.</p>
    </footer>
  </div>
</template>

<style scoped>
/* ═ 06 · THE OPEN RACE ═ — the Contribute widget (the season ladder + the one action). */
.race-ladder {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0.9rem 0;
  padding: 0;
}
.race-line {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.5rem 0.85rem;
  flex-wrap: wrap;
}
.race-flag {
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  min-width: 2.6rem;
  color: rgba(230, 226, 216, 0.45);
}
.race-line-now .race-flag {
  color: var(--hifi-fuchsia, #d16bd1);
}
.race-name {
  font-size: 0.92rem;
}
.race-what {
  font-size: 0.78rem;
  color: rgba(230, 226, 216, 0.55);
}
.race-line-now {
  border-left: 2px solid var(--hifi-fuchsia, #d16bd1);
}
.race-line-finish .race-name {
  color: rgba(230, 226, 216, 0.92);
}
.race-offer {
  font-size: 0.85rem;
  color: rgba(230, 226, 216, 0.72);
  margin: 0.4rem 0 0.8rem;
}
.race-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.race-actions-note {
  font-size: 0.68rem;
  color: rgba(230, 226, 216, 0.4);
}
</style>

<style scoped>
.scp-home {
  min-height: 100vh;
  padding: 2rem 1.5rem 3rem;
  color: var(--color-white-conductor, #f0f0f0);
  font-family: system-ui, -apple-system, sans-serif;
}

/* ---- HERO ---- */
.home-hero {
  max-width: 960px;
  margin: 0 auto 2rem;
  border-radius: 10px;
  padding: 2.25rem 2rem;
  text-align: center;
}

.hero-eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  color: rgba(230, 226, 216, 0.6);
  margin: 0 0 0.75rem;
}

.hero-title {
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0 0 1.25rem;
}

.hero-identity {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  line-height: 1.6;
}

.hero-identity p {
  margin: 0;
  color: rgba(235, 231, 222, 0.9);
  font-size: 0.95rem;
}

.hero-identity strong {
  color: var(--color-white-conductor, #f5f2ec);
}

.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.28);
}

.status-label {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.5);
}

.status-value {
  font-size: 0.85rem;
  font-weight: 600;
}

.status-value.loading {
  color: var(--color-yellow-light, #fbbf24);
}

.status-value.ready {
  color: var(--color-green-light, #4ade80);
}

.status-sep {
  color: rgba(255, 255, 255, 0.3);
}

/* ---- SHARED SECTION SHELL ---- */
.home-body {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.home-section {
  border-radius: 10px;
  padding: 1.75rem 1.75rem 2rem;
}

.section-eyebrow {
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 0.4rem;
}

.section-title {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0 0 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.section-lede {
  margin: 0 0 1.25rem;
  color: rgba(235, 231, 222, 0.82);
  font-size: 0.9rem;
  line-height: 1.55;
  max-width: 640px;
}

/* ---- THE TUTORIAL LOCK (C817 · pending status · the locked-with-promise idiom) ---- */
.tutorial-badge {
  display: inline-block;
  width: max-content;
  margin: 0.15rem 0 0.55rem;
  padding: 0.2rem 0.9rem;
  border: 1px dashed color-mix(in srgb, var(--color-yellow, #eab308) 75%, white 10%);
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  color: var(--color-yellow-light, #fde047);
}

.tutorial-promise {
  max-width: 72ch;
}

.tutorial-channel {
  color: var(--color-green-light, #6ee7b7);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-shadow: 0 0 7px color-mix(in srgb, var(--color-green, #10b981) 55%, transparent);
}

/* The body sleeps: the suite hues held at LOW SATURATION (never grayscale death — the
   promise law) · inert · the preview stays legible. */
.howto-grid.tutorial-locked {
  filter: saturate(0.35) brightness(0.82);
  opacity: 0.75;
  pointer-events: none;
  user-select: none;
}

/* ---- THE CONCLUDER (C814 · the inducted close) ---- */
.home-concluder {
  margin-top: 2rem;
  padding: 2rem 1.75rem 2.2rem;
  border-radius: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.concluder-code {
  margin: 0;
  font-size: 0.88rem;
  letter-spacing: 0.05em;
  color: rgba(235, 231, 222, 0.82);
}

.concluder-line {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.45;
  color: rgba(245, 242, 234, 0.95);
  text-shadow: 0 0 12px rgba(245, 242, 234, 0.25);
}

/* ---- THE HERO WELCOME (C808) ---- */
.hero-welcome {
  margin: 0.5rem 0 0;
  font-size: 1.08rem;
  letter-spacing: 0.06em;
  color: var(--color-white-conductor, #f5f2ea);
  text-shadow: 0 0 10px rgba(245, 242, 234, 0.35);
}

/* ---- THE SUITE CHIP ROW (C803 · Pewter Tessera) ---- */
.suite-chip-row {
  margin-top: 0.9rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.suite-chip-row-label {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: rgba(235, 231, 222, 0.55);
  margin-right: 0.35rem;
}

/* ---- THE NAMED <ScpMark /> (C805 · the Highlight Rework — the subtext ground + the panel anatomy) ---- */
.named-scp-title {
  font-size: 1.9rem;
  line-height: 1.15;
}

.named-scp-badge {
  display: inline-block;
  width: max-content;
  margin: 0.15rem 0 0.6rem;
  padding: 0.18rem 0.85rem;
  border: 1px dashed color-mix(in srgb, var(--color-green, #10b981) 70%, white 10%);
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  color: var(--color-green-light, #6ee7b7);
}

.named-scp-ground {
  margin-top: 0.9rem;
  padding: 1.35rem 1.5rem;
}

.named-scp-body {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  position: relative;
  z-index: 1;
}

.named-scp-body p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.7;
  color: rgba(238, 235, 228, 0.92);
}

.named-scp-acronym-panel {
  margin-top: 1.15rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(2, 6, 4, 0.55);
}

.nsap-title {
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  color: rgba(238, 235, 228, 0.92);
}

.nsap-close {
  margin: 0.95rem 0 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(238, 235, 228, 0.88);
}

/* ---- MENTAL MODEL MAP ---- */
.model-map {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.model-node {
  flex: 1 1 180px;
  min-width: 160px;
  border-radius: 7px;
  padding: 0.85rem 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.model-name {
  font-size: 0.92rem;
  font-weight: 600;
}

.model-desc {
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(235, 231, 222, 0.8);
}

.model-link {
  align-self: center;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

.model-note {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: rgba(235, 231, 222, 0.8);
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.24);
  border-radius: 6px;
}

.model-note strong {
  color: var(--color-white-conductor, #f5f2ec);
}

/* ---- HOW DO I ---- */
.howto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.howto-card {
  border-radius: 7px;
  padding: 1rem 1.05rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.howto-q {
  font-size: 0.92rem;
  font-weight: 600;
}

.howto-a {
  font-size: 0.83rem;
  line-height: 1.5;
  color: rgba(235, 231, 222, 0.82);
}

.howto-a strong {
  color: var(--color-white-conductor, #f5f2ec);
}

/* ---- RELEASE NOTES ---- */
.release-stamp {
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-family: var(--font-mono, 'Space Mono', monospace);
  text-transform: uppercase;
  color: rgba(245, 240, 250, 0.92);
}

/* D-HOME R3 · the R2 pill row + release list styles (.release-pill* · .release-list · .release-item
   · .release-cat/head/body) were retired with their markup — the 44-feature tour moved into
   ReleaseMiniSite.vue's scoped styles. Only .release-stamp (the headline chip above) remains here. */

/* ---- TROUBLESHOOTING ---- */
.trouble-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.trouble-row {
  border-radius: 7px;
  padding: 0.9rem 1.05rem;
}

.trouble-q {
  margin: 0 0 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-red-light, #fca5a5);
}

.trouble-a {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.5;
  color: rgba(235, 231, 222, 0.85);
}

.trouble-a strong {
  color: var(--color-white-conductor, #f5f2ec);
}

/* ---- FOOTER ---- */
.home-footer {
  max-width: 960px;
  margin: 2.5rem auto 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.footer-line {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: rgba(230, 226, 216, 0.55);
  margin: 0;
}

.footer-sub {
  font-size: 0.78rem;
  color: rgba(230, 226, 216, 0.45);
  margin: 0;
}
</style>
