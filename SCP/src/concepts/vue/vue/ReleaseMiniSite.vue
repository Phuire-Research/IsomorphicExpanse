<script setup lang="ts">
/**
 * ReleaseMiniSite — the v0.811.0 Release Notes as a MINI WEBSITE (D-HOME · R3 · R4: the C702-C809 delta + the inline hifi-hl highlighting).
 *
 * Section 04 of the SCP Release Home (DefaultLanding.vue) mounts this as its body. The section's
 * eyebrow/heading and the "version = Cascade Cycle" headline stay in the parent; this component owns
 * the full tour: a viewport-height frame the person can scroll PAST as one block, anor stop and
 * frame. Inside it, a NAV SIDEBAR (left) lists all 44 features grouped with a designed break per
 * category, and a CONTENT PANE (right) expands the selected feature into its full explanation on a
 * card whose head + accent carry that feature's FUNCTIONAL COLOR.
 *
 * The color idiom is grounded ONLY in the template's existing hifi-* families (src/style.css):
 *   spectrum token → head pane          → accent (border + label)
 *   base    → .hifi-pane-base    → var(--color-base-light)    / var(--color-base)
 *   red     → .hifi-pane-red     → var(--color-red-light)     / var(--color-red)
 *   orange  → .hifi-pane-orange  → var(--color-orange-light)  / var(--color-orange)
 *   yellow  → .hifi-pane-yellow  → var(--color-yellow-light)  / var(--color-yellow)
 *   green   → .hifi-pane-green   → var(--color-green-light)   / var(--color-green)
 *   blue    → .hifi-pane-blue    → var(--color-blue-light)    / var(--color-blue)
 *   purple  → .hifi-pane-purple  → var(--color-purple-light)  / var(--color-purple)
 *   fuchsia → .hifi-pane-fuchsia → var(--color-fuchsia-light) / var(--color-fuchsia)
 * Every salvo `color:` token maps 1:1 to an existing hifi-pane-{spectrum} family — no invention,
 * no nearest-family fallback needed.
 *
 * Content is transcribed VERBATIM from the D-HOME-R3 salvo files (one per category) — the firewall
 * already governed the copy; no rewrites here.
 */
import { ref, computed } from 'vue';

// The eight functional color tokens the salvo copy uses — each has an existing hifi-pane-{token}
// head family and a --color-{token}-light accent in src/style.css.
type SpectrumColor =
  | 'base'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'fuchsia';

interface ReleaseFeature {
  title: string;
  color: SpectrumColor;
  summary: string;
  detail: string[];
}

interface ReleaseCategory {
  id: string;
  label: string;
  features: ReleaseFeature[];
}

// The single typed structure — built from the salvo files' content, VERBATIM.
const RELEASE_SITE: ReleaseCategory[] = [
  {
    id: 'v0939',
    label: 'New in 0.939.0',
    features: [
      {
        title: 'The substrate renewed — Stratimux 0.3.296',
        color: 'green',
        summary: 'The functional runtime every surface stands on advances to its newest release — the CLI, the app template, and the flagship apps all carry it together.',
        detail: [
          'Stratimux is the <span class="hifi-hl-green">Muxified Turing Machine</span> this whole window runs on — the bridge, your app’s server, and every page compose through it. This release moves all of them to <span class="hifi-hl-blue">0.3.296</span> in one motion, boot-proven before shipping: the app answers on its own doors under the new pin before the release carries it.',
          'And the Open Race now rides both faces: the <span class="hifi-hl-fuchsia">06 · The Open Race</span> section on your Home page and its twin in the README — the season ladder, the MPL 2.0 return, and the one door to the Commons.',
        ],
      },
    ],
  },
  {
    id: 'v0938',
    label: 'New in 0.938.0',
    features: [
      {
        title: 'Updates that weigh what they carry',
        color: 'blue',
        summary: 'The update now computes from the last update you landed — not from the day the app was installed — so a one-file release reads as a one-file update.',
        detail: [
          'Each successful update becomes the <span class="hifi-hl-blue">starting point for the next comparison</span>. Before this, every run re-carried everything since install; measured live, a one-page release weighed 1.6 MB of working papers — the same run now weighs <span class="hifi-hl-green">tens of KB</span>, and the review reads in moments. Files your app already carries identically are invisible to the update entirely: nothing to review, nothing to land.',
          'And the update’s conductor now holds a standing law for <span class="hifi-hl-fuchsia">your own working surfaces</span>: pages and suites you created that the template never shipped are yours by decision — never a deletion candidate, never a question. Where a shared roster overlaps, the union keeps your entries whole.',
        ],
      },
    ],
  },
  {
    id: 'v0937',
    label: 'New in 0.937.0',
    features: [
      {
        title: 'Installs that say what happened',
        color: 'green',
        summary: 'A manifest install that cannot proceed now lands its reason on the staged rail — never silence — and the manifest accepts UTC timestamps in either standard spelling.',
        detail: [
          'A field run surfaced the one quiet corner left: an install the bridge declined was reported only to the logs — the rail sat on its first stage while nothing moved. Every declined install now writes its <span class="hifi-hl-green">honest reason</span> to the same rail the page already watches: what stopped, and why, within a beat.',
          'And the stop that revealed it is itself cured: a Configuration JSON carrying its timestamp as <span class="hifi-hl-blue">+00:00</span> instead of <span class="hifi-hl-blue">Z</span> — the same UTC instant in either spelling — is now accepted on <span class="hifi-hl-green">both sides of the door</span>, the page and the bridge alike.',
        ],
      },
    ],
  },
  {
    id: 'v0936',
    label: 'New in 0.936.0',
    features: [
      {
        title: 'The red label tells the truth to the end',
        color: 'red',
        summary: 'The version label stays red until an update actually LANDS in your app — not merely when the install finishes — and stays purple when a newer publish carries nothing of value for you.',
        detail: [
          'Each app now remembers which template payload it has <span class="hifi-hl-red">landed</span> — installing the newer package alone no longer flips the label: it stays red until you press Run Update and the payload arrives, then purple returns. The install action stands available the whole way — syncing the global never hides behind the label’s color again.',
          'And the reverse holds: when a newer version is published but the counters say <span class="hifi-hl-green">nothing changed for your app anor the CLI</span>, the label stays purple — no nag, with an optional sync offered quietly on the Update page.',
        ],
      },
      {
        title: 'The Release pane — ship your app',
        color: 'fuchsia',
        summary: 'A first-class Release surface now heads the GitM page: set your app’s remote origin, push, and step straight into SCP Management to copy its Configuration JSON.',
        detail: [
          'Just above the Branches, the <span class="hifi-hl-fuchsia">Release pane</span> reads the current origin with ahead/behind counts, sets anor modifies it, and pushes — the first push sets upstream on its own. The developer chips keep their Remote group; the pane is the release path made visible.',
          'Its <span class="hifi-hl-purple">SCP Management</span> door lands where the app’s <span class="hifi-hl-fuchsia">Configuration JSON</span> is assembled and copied — the manifest others paste to install your app. Set origin, push, copy: released.',
        ],
      },
    ],
  },
  {
    id: 'v0935',
    label: 'New in 0.935.0',
    features: [
      {
        title: 'Updates that land whole',
        color: 'blue',
        summary: 'The update conductor is now held to carrying every change exactly as computed — anor writing the whole file — so an update either lands complete or stages a clear decision, never a stall.',
        detail: [
          'A field run surfaced the one way an update could stall: a change bundle carried <span class="hifi-hl-red">imprecisely</span> between comparison and landing. The conductor now carries every change <span class="hifi-hl-blue">byte-exact from the comparison itself</span>, and anything beyond exact carriage is written as the <span class="hifi-hl-green">whole resolved file</span> instead — the always-safe form. The landing gate is unchanged: your own work is preserved, identity is preserved by rule.',
          'Template-only releases now get the same <span class="hifi-hl-purple">one-press install</span> as CLI releases — the Update page offers it whenever any part of a release is newer, and says plainly that <span class="hifi-hl-green">no relaunch is needed</span> for this kind: install, then Run Update, and the new payload arrives.',
        ],
      },
    ],
  },
  {
    id: 'v0934',
    label: 'New in 0.934.0',
    features: [
      {
        title: 'Updates, classed — the version label knows which kind',
        color: 'purple',
        summary: 'Every release now declares which aspect it changes — the CLI, your app’s template, anor both — and the version label routes you to exactly the right motion.',
        detail: [
          'Each published release carries two counters — one for the <span class="hifi-hl-purple">CLI</span>, one for the <span class="hifi-hl-blue">app template</span> — and your installation compares them against npm on its own. The label beside your app’s name turns <span class="hifi-hl-red">red</span> the moment something newer is published, and its hover tells you precisely which path applies: a template update runs through your app’s Update page; a CLI-only update needs <span class="hifi-hl-green">no app changes at all</span>.',
          'Clicking the label lands directly on the Update page. When the CLI is due, an <span class="hifi-hl-purple">Update SCS-Bridge CLI</span> action installs it for you — then a RESTART REQUIRED notice hands the relaunch to you. When only the CLI changed, the page says so outright and the whole update circuit stands down: nothing to resolve, nothing to apply.',
        ],
      },
    ],
  },
  {
    id: 'v0933',
    label: 'New in 0.933.0',
    features: [
      {
        title: 'The Update circuit, conducted end to end',
        color: 'green',
        summary: 'The update surface now reads as a conducted sequence: Run Update opens the cycle, the resolver appears only when there is something to resolve, and every button state is explained in place.',
        detail: [
          'The three update actions carry a <span class="hifi-hl-green">state legend in their own panel</span> — every possible state of Run Update, Spawn Resolver, and Apply is named, and the row matching the live next step is emphasized. The resolver shows <span class="hifi-hl-blue">solid</span> when a comparison awaits resolution, a <span class="hifi-hl-purple">dotted border</span> when a complete resolution already exists (spawn again only to review anor redo), and stays dimmed until this cycle’s comparison has actually run.',
          'A finished update now <span class="hifi-hl-yellow">closes its own cycle</span>: the working comparison artifacts are cleared at apply, so a prior update can never re-enable the resolver off stale state. Run Update is the door, every cycle.',
        ],
      },
      {
        title: 'Stand By — the primed session',
        color: 'blue',
        summary: 'A session spawned to receive instructions shows a transparent Stand By notice while Claude Code boots — and stays focused once the instructions land.',
        detail: [
          'The resolver’s session opens with a <span class="hifi-hl-blue">fully transparent Stand By overlay</span> — fixed text over the live terminal, never a curtain: the boot draws through it untouched. It clears the moment the instructions finish entering, on your <span class="hifi-hl-green">first key press</span>, anor on a short safety timeout. It belongs to this one spawn path alone — no other session ever shows it.',
          'Two disciplines land with it: the primed session <span class="hifi-hl-purple">keeps focus</span> after its instructions are placed (it no longer snaps back to the app window), and it boots with Claude Code’s <span class="hifi-hl-yellow">approval mode intact</span> — the update is conducted by you, decision by decision.',
        ],
      },
      {
        title: 'Session spawn discipline',
        color: 'red',
        summary: 'A rare loop where navigating pages after a spawn could keep spawning sessions is closed at its root.',
        detail: [
          'The session-spawn trigger is now cleared <span class="hifi-hl-red">the instant it fires</span> rather than after the request settles — the narrow window where page navigation could re-fire the spawn is gone. One click, <span class="hifi-hl-green">one session</span>, every time.',
        ],
      },
      {
        title: 'The version label — always in view',
        color: 'purple',
        summary: 'The installed SCS-Bridge version sits beside your app’s name on every page — and tells you the moment npm carries something newer.',
        detail: [
          'Your app’s own server checks the npm registry at boot and every six hours; the label beside the app name renders the <span class="hifi-hl-purple">installed version in purple</span>, turns <span class="hifi-hl-red">red when npm carries a newer publish</span> (time to update), and <span class="hifi-hl-fuchsia">fuchsia when your install is ahead</span>. Hovering it shows both versions and the verdict, with the one-line update command when one is due.',
          'It is fully offline-honest: no network anor no npm on the machine simply leaves the <span class="hifi-hl-purple">purple label</span> standing — never an error, never a blocked boot. The Bridge page carries the fuller pane with the same truth.',
        ],
      },
    ],
  },
  {
    id: 'v0930',
    label: 'New in 0.930.0',
    features: [
      {
        title: 'Crash containment — sessions in their own host',
        color: 'red',
        summary: 'Terminal sessions now run in an isolated host process. A session-layer crash can no longer take the whole client down.',
        detail: [
          'Every terminal session\u2019s underlying process is hosted in a <span class="hifi-hl-red">dedicated helper process</span>, separate from the window layer. If that host ever fails, your windows stay open, the bridge stays up, and the affected sessions simply read as exited — <span class="hifi-hl-green">the next spawn heals the host automatically</span>, no restart required.',
          'Recovery is honest end to end: the bridge sweeps its own <span class="hifi-hl-yellow">stale locks</span> on relaunch — including the case where the operating system has handed a dead process\u2019s id to something unrelated — so reopening a session always brings a fresh window up instead of silently doing nothing.',
        ],
      },
      {
        title: 'The Frame Governor — 24 FPS, like animation',
        color: 'yellow',
        summary: 'The shader draws at 24 frames per second by default — the cadence of animation film — with a live Settings slider from 8 to 60.',
        detail: [
          'Every shaded surface — terminal windows and app windows alike — renders on <span class="hifi-hl-yellow">one governed cadence</span>, defaulting to 24 FPS. The Settings page gains a <span class="hifi-hl-purple">Frame Rate slider</span> (8–60) with a LIKE ANIMATION tag pinned at 24; releasing the slider re-paces every open window live, no respawn.',
          'The governor caps the <span class="hifi-hl-blue">output</span> draw only — input and the underlying terminal stay as responsive as before. Lower it for a heavier filmic feel or to spare the battery; raise it toward 60 when you want glass.',
        ],
      },
      {
        title: 'The Documentation Site',
        color: 'green',
        summary: 'The Suite Cascade page hosts a three-shelf documentation site — Base, Local, and Cascade — read fresh from disk on every load.',
        detail: [
          'Three shelves: <span class="hifi-hl-red">Base</span> (the system\u2019s shipped documentation), <span class="hifi-hl-yellow">Local</span> (your app\u2019s own), and <span class="hifi-hl-blue">Cascade</span> (the working method). The reader renders markdown with full HiFi styling — per-letter heading shadows, a rotating spectrum for the navigation, in-article section links that scroll.',
          'The nav bar collapses to a <span class="hifi-hl-green">glyph rail</span> when you want the full reader width, and every document is read <span class="hifi-hl-base">fresh from disk</span> — what you see is what is on the machine, never a cached copy.',
        ],
      },
      {
        title: 'Cascade Memory on every surface',
        color: 'blue',
        summary: 'A standardized plan-and-trajectory card — the General memory for unassigned sessions, plus a per-domain viewer with live updates.',
        detail: [
          'Every working surface carries the same two-pane memory card: the <span class="hifi-hl-purple">plan</span> (editable on the page) and the <span class="hifi-hl-base">trajectory log</span> (written only by working sessions). Sessions spawned without a domain now land in the app\u2019s own <span class="hifi-hl-green">General memory</span>, and the Suite Cascade page adds a per-domain viewer with a rotating picker.',
          'The cards update <span class="hifi-hl-blue">live</span> as the working session writes — the page watches the documents themselves, so an agent\u2019s progress is visible the moment it lands on disk.',
        ],
      },
      {
        title: 'Your styling stays yours',
        color: 'purple',
        summary: 'Color and pattern choices are scoped per app — styling never bleeds between installs again.',
        detail: [
          'Each app\u2019s HiFi color and pattern overrides are stored under <span class="hifi-hl-purple">that app\u2019s own name</span>, and the design layer written by styling sessions lands in the app\u2019s own configuration file. Two apps on the same machine — even trading the same port over time — keep <span class="hifi-hl-green">fully independent looks</span>.',
        ],
      },
      {
        title: 'The Release Door — remote origin and push',
        color: 'fuchsia',
        summary: 'The GitM Developer bar gains a Remote group: set or modify the origin, then push — first-push upstream handled automatically.',
        detail: [
          'The Remote group shows the current origin, takes a <span class="hifi-hl-blue">validated URL</span> (https, git@, or ssh shapes only), and offers Set/Modify Origin and Push. An app with a freshly set origin and a never-pushed branch <span class="hifi-hl-green">pushes with upstream configured automatically</span> — the exact shape of releasing an app to the world.',
          'The push guard rails stand: pushing while behind the remote is refused with a <span class="hifi-hl-yellow">pull-first recommendation</span>, and failures carry the server\u2019s own message verbatim.',
        ],
      },
      {
        title: 'The Update circuit, proven end to end',
        color: 'base',
        summary: 'Updating an installed app runs a three-way comparison against its original template — safe changes apply, your identity and work are preserved by rule.',
        detail: [
          'The update compares three points: the app <span class="hifi-hl-base">as installed</span>, the app <span class="hifi-hl-green">as you\u2019ve changed it</span>, and the template <span class="hifi-hl-blue">as it is now</span>. Template-only changes apply cleanly; your own work is preserved untouched; genuine both-sides conflicts are staged for your decision.',
          'A <span class="hifi-hl-yellow">rules layer</span> stands over the whole run: identity fields — the app\u2019s name, its package identity — are constitutionally preserved no matter what the comparison says.',
        ],
      },
      {
        title: 'Opus 5 as the default',
        color: 'orange',
        summary: 'Every spawned session now runs Claude Opus 5 by default — the latest Opus generation — with per-instance selection in Settings.',
        detail: [
          'The default spawn model is <span class="hifi-hl-orange">Claude Opus 5</span> (released July 2026 — near-frontier intelligence with a 1M-token context). The full current lineup stays selectable per instance: Fable 5, Sonnet 5, Opus 4.8, Haiku 4.5 — a recorded per-session choice always wins over the global default.',
        ],
      },
      {
        title: 'Windows come forward only when asked',
        color: 'green',
        summary: 'Focus discipline: navigating between pages no longer pulls a working session\u2019s window to the front.',
        detail: [
          'Working sessions are taught that <span class="hifi-hl-green">window focus is your attention</span> — spent only when a menu choice asked to be shown something, or when you asked directly. Moving between pages churns the files agents watch; reacting to that churn is fine, <span class="hifi-hl-red">stealing the page you just moved to is not</span>.',
        ],
      },
    ],
  },
  {
    id: 'sessions',
    label: 'Sessions',
    features: [
      {
        title: 'Spawn or resume real sessions',
        color: 'blue',
        summary: 'Start a fresh Claude Code session or pick up an existing one exactly where it left off.',
        detail: [
          'Press <span class="hifi-hl-blue">[n]</span> in the session list to spawn a new Claude Code session — it opens in its own window and gets registered in the <span class="hifi-hl-base">roster</span> immediately. To return to one you’ve run before, find its row in the <span class="hifi-hl-orange">offline section</span> and engage it — the session resumes from where it stopped.',
          'The bridge tracks each session via a <span class="hifi-hl-yellow">registry entry</span> that records the transcript reference. Resuming reattaches to that transcript rather than starting over, so your history carries forward. The session window is a real terminal running a <span class="hifi-hl-blue">real Claude Code process</span> — not a replay or a simulation.',
        ],
      },
      {
        title: 'Rename, archive, and dissipate',
        color: 'purple',
        summary: 'Rename any session, archive one out of the way (recoverable later), or dissipate it for good.',
        detail: [
          'From the session list, press <span class="hifi-hl-blue">`r`</span> on any row to rename it, <span class="hifi-hl-orange">`a`</span> to archive it (moves it to a recoverable archive directory), or <span class="hifi-hl-red">`d`</span> to dissipate it (removes the registry entry and deletes the underlying session for good). Archived sessions leave the active list but stay on disk and can be browsed from the <span class="hifi-hl-purple">archive view</span> (`w` to open).',
          '<span class="hifi-hl-green">Archive is the reversible choice</span> — it moves the transcript file to `Cascades/Archive/YYYY/MM/DD/` rather than deleting it, and you can inspect archived sessions before deciding to dissipate them permanently. Both actions are <span class="hifi-hl-yellow">anchor-guarded</span>: a session that is the active page anchor cannot be archived or dissipated until the anchor is released.',
        ],
      },
      {
        title: 'Per-page session anchor',
        color: 'yellow',
        summary: 'Bind a session to a page so that page always opens it. Set, release, or configure auto-anchor.',
        detail: [
          'In the session’s <span class="hifi-hl-yellow">Anchor cell</span>, choose Set as Anchor to bind that session to the current Suite 8 page. From then on, navigating to that page connects to the anchored session rather than prompting you to spawn. Choose Release Anchor to clear the binding. The <span class="hifi-hl-blue">auto-anchor setting</span> controls whether a freshly spawned session on a page without an anchor automatically claims the anchor role.',
          '<span class="hifi-hl-yellow">Anchor assignment is one-per-page</span>: setting a new anchor reassigns rather than adding a second. The auto-anchor config persists on disk per page and survives bridge restarts. Sessions that are page anchors get a <span class="hifi-hl-green">visible tag</span> in the session list so you can tell at a glance which sessions are load-bearing.',
        ],
      },
      {
        title: 'The Suite-8 Spawn Picker',
        color: 'blue',
        summary: 'Choose which Suite 8 to spawn a new session for from one picker, then launch in a single step.',
        detail: [
          'Open the <span class="hifi-hl-blue">Suite-8 Spawn Picker</span> from the Sessions page header — it expands a drawer listing every available Suite 8 registered under `Cascades/8_SUITES/`. Select one and press Spawn. The session launches into that Suite 8 page, gets registered in the roster, and the picker collapses once the spawn completes.',
          'The picker fetches the <span class="hifi-hl-orange">live Suite-8 roster</span> from the bridge on each open so it always reflects what is actually installed. The bridge’s spawn path runs <span class="hifi-hl-yellow">`claimAnchorIfUnclaimed`</span> on the new session, so if the page has no anchor yet the freshly spawned session automatically becomes the page anchor without a separate step.',
        ],
      },
      {
        title: 'Sessions across multiple live apps',
        color: 'orange',
        summary: 'Run sessions in several installed apps at once, with filters to focus by app or working surface.',
        detail: [
          'The Session Manager shows sessions from every installed app the bridge is aware of. <span class="hifi-hl-orange">Two rows of filter pills</span> sit above the list — one row per installed app (SCP), one row per Suite 8 working surface — so you can narrow the view on either axis independently. The count badge on each pill shows how many sessions belong to it.',
          'The pill lists are derived from the <span class="hifi-hl-blue">bridge’s live registry</span>, so a newly booted app’s pill appears as soon as it comes online. Selecting a pill filters both the online and offline session sections. The <span class="hifi-hl-base">"All" view</span> is the default — selecting any pill just narrows what’s visible without removing anything.',
        ],
      },
      {
        title: 'The Session Manager',
        color: 'red',
        summary: 'One roster of every session — online and offline sections, sortable columns, filter pills by app and working surface, and clean pagination for the offline list.',
        detail: [
          'The Session Manager is the Sessions page’s central view. <span class="hifi-hl-green">Online sessions</span> appear at the top, sorted and immediately engageable. <span class="hifi-hl-orange">Offline sessions</span> follow in a paginated list below. Column headers are sortable. Two rows of filter pills let you narrow by app and by working surface independently.',
          'The view is driven by the bridge’s <span class="hifi-hl-blue">live session registry</span> and refreshes reactively as sessions change state. Each row shows the session’s name, status, working directory, launch time, working surface tag, and anchor indicator. Actions — <span class="hifi-hl-purple">rename, archive, dissipate, set anchor</span> — are available per row without leaving the page.',
        ],
      },
      {
        title: 'Ghost-session auto-verification',
        color: 'fuchsia',
        summary: 'At start-up, sessions with a missing or empty transcript are archived for you — no stale rows.',
        detail: [
          'When the bridge starts, it runs a <span class="hifi-hl-fuchsia">ghost-prune sweep</span> before the session list becomes visible. Any session whose transcript file is missing from disk, whose transcript file exists but is empty, or that never produced a turn (no Claude session ID recorded) is classified as a ghost and <span class="hifi-hl-orange">automatically archived</span> to `Cascades/Archive/`. The sweep logs how many sessions were pruned and how many were kept.',
          'This runs once at boot — ghosts that appear during a run are retired on the next restart. <span class="hifi-hl-yellow">Page anchors are always preserved</span>: the sweep never archives a session that holds the anchor role, leaving resolution to the anchor system on next load. The result is a roster you can trust: every row in the online or offline section points at a session with <span class="hifi-hl-green">real content</span> that can be resumed.',
        ],
      },
    ],
  },
  {
    id: 'terminal',
    label: 'Terminal',
    features: [
      {
        title: 'Real terminal windows',
        color: 'blue',
        summary: 'True terminals, wrapped in a high-fidelity presenter with selectable render modes.',
        detail: [
          'Each session you open gets a genuine terminal — a <span class="hifi-hl-blue">real PTY</span>, running your shell or Claude Code directly, rendered through <span class="hifi-hl-blue">xterm.js</span> with full scrollback and <span class="hifi-hl-base">Unicode 11 support</span>. The terminal lives in an offscreen renderer; a GL presenter window sits on top and shades every frame through one of <span class="hifi-hl-yellow">twelve selectable render modes</span>.',
          'Switch render modes from the <span class="hifi-hl-base">settings deck</span> at any time: Muxon (the default — subtle curvature with chromatic fringe), CRT Curve, Fishbowl, Chroma, CRT Flat, LCD, Game Boy DMG, CGA, VHS (animated), VFD, E-Ink, and a plain Off mode with no shader at all. <span class="hifi-hl-yellow">Geometric modes</span> (the ones that actually bend the image) also <span class="hifi-hl-blue">adjust pointer forwarding</span> so clicks land where they look like they land.',
        ],
      },
      {
        title: 'A crafted, persistent cursor',
        color: 'orange',
        summary: 'The cursor is drawn on its own bright under-layer and keeps its place through resize and scroll.',
        detail: [
          'The <span class="hifi-hl-base">white engine cursor</span> renders as the base presence everywhere — in scrollback, when the app hides its own cursor, before focus is established. On top of that sits a <span class="hifi-hl-orange">custom DOM cursor block</span> with a full spectrum gradient (all seven suite colors top to bottom), a <span class="hifi-hl-base">pewter-grain texture tile</span>, and a chamfered top-right corner. The overlay is not driven by a timer; it repositions itself on every <span class="hifi-hl-blue">cursor move, render, resize, and scroll event</span>, so it never parks in a stale location.',
          'The two layers work together: the engine\'s white block guarantees presence even in edge conditions where the DOM overlay cannot reach, while the <span class="hifi-hl-orange">styled block rides on top</span> whenever the cell is on screen. If you scroll into scrollback the overlay hides; the instant you <span class="hifi-hl-blue">scroll back to the live bottom</span> it returns.',
        ],
      },
      {
        title: 'Dark-render recovery + resume reflow',
        color: 'fuchsia',
        summary: 'If a window ever renders dark it recovers on its own, and the view reflows cleanly on resume.',
        detail: [
          'When the offscreen renderer parks in the background, the GL compositor can occasionally produce a completely dark frame. The main process detects this by inspecting the captured bitmap and calls a <span class="hifi-hl-fuchsia">scroll-recover function</span> in the terminal renderer — it scrolls the viewport up a few lines and then immediately back to the bottom across two separate animation frames, forcing xterm to <span class="hifi-hl-blue">re-rasterize the visible rows</span>. No geometry change, no flicker; content returns.',
          'A second automatic repair handles the <span class="hifi-hl-fuchsia">dead-space band</span> that appears after Claude Code\'s auto-expanding input shrinks: the blank rows below the cursor are detected by counting empty bottom lines, confirmed stable across <span class="hifi-hl-yellow">two checks</span>, and then trimmed with a <span class="hifi-hl-blue">resize jiggle</span> that pops the blank band and pulls real history back from scrollback. Both mechanisms run silently in the background and reset on a cooldown so they never fight a live redraw.',
        ],
      },
      {
        title: 'The everyday comforts',
        color: 'green',
        summary: 'Scroll-on-input, copy and paste, and the view snaps to what you type.',
        detail: [
          'Every keystroke <span class="hifi-hl-green">scrolls the view to the live bottom</span> before the character is sent. If you scroll up into history to read output and then start typing, the view snaps back to your prompt automatically — the same behavior you expect from a native terminal. <span class="hifi-hl-blue">Copy (Cmd+C)</span> reads the current xterm selection from the offscreen window and writes it to the system clipboard; <span class="hifi-hl-blue">paste (Cmd+V)</span> reads the clipboard from main and delivers it through xterm\'s bracketed-paste path, so multiline text arrives as a single paste event rather than a stream of newlines.',
          'Drop support is also included on the presenter surface: <span class="hifi-hl-green">drag a file or folder</span> onto the terminal window and the path is resolved to an absolute string and pasted at the cursor, using the <span class="hifi-hl-base">same delivery channel</span> as Cmd+V.',
        ],
      },
      {
        title: 'Graceful close, everywhere',
        color: 'purple',
        summary: 'A double-tap of Ctrl-C and an exit confirm guard against accident, a shutting-down overlay shows the wind-down, and your transcripts always survive shutdown.',
        detail: [
          'Closing the app — whether from the TUI menu, the keyboard shortcut, or a system signal — goes through a single <span class="hifi-hl-purple">graceful close path</span>. Each session receives a Ctrl-C on its PTY stdin, which tells Claude Code to flush its transcript before exiting; a <span class="hifi-hl-yellow">five-second window</span> allows the flush to complete before the process is hard-killed as a fallback. A <span class="hifi-hl-base">"Shutting Down… flushing session" overlay</span> appears on the visible terminal surface the moment the close begins, so you always know the wind-down is happening rather than seeing a frozen screen.',
          'In the TUI itself, quitting opens an <span class="hifi-hl-purple">exit-confirm modal</span> rather than closing immediately, and the same guard covers the CLOSE row in the session list. During install animations <span class="hifi-hl-red">Ctrl-C is the only active key</span> — it exits the bridge entirely — and all other input is absorbed until the animation completes. These layers together mean an accidental keypress cannot close the app and <span class="hifi-hl-green">transcript data is not dropped</span> at shutdown.',
        ],
      },
    ],
  },
  {
    id: 'the-tui',
    label: 'The TUI',
    features: [
      {
        title: 'The animated session menu',
        color: 'purple',
        summary: 'A live-updating menu to filter, rename, and archive sessions from the terminal itself.',
        detail: [
          'Run `scs` from your project and the <span class="hifi-hl-purple">session list appears immediately</span>. The menu renders in the terminal\'s alternate screen, repaints at ~30 fps, and reflects the live session registry as it changes. Sessions are grouped into alive and offline rows. <span class="hifi-hl-blue">Arrow keys move the cursor</span>; Enter resumes or spawns.',
          'From inside that menu you can <span class="hifi-hl-green">rename a session</span> by pressing `r` (a text buffer appears inline), <span class="hifi-hl-orange">archive it</span> with `a` (moves it to the Archive, recoverable), or <span class="hifi-hl-red">permanently dissipate it</span> with `d`. An <span class="hifi-hl-base">SCP filter chip</span> at the top narrows the list to one installed app when you have several running at once.',
          'The whole surface is driven by a <span class="hifi-hl-yellow">pure state machine</span> in `src/lib/bridge/menu.ts`. Every keypress produces a new <span class="hifi-hl-purple">`MenuState`</span> and a `KeyAction`; the frame renderer paints the result. <span class="hifi-hl-base">Nothing persists or fires until your input commits it.</span>',
        ],
      },
      {
        title: 'The app command helm',
        color: 'blue',
        summary: 'Spawn, focus, or boot any installed app, walk the worktree rail, and retire one with a typed confirmation.',
        detail: [
          'Press Enter on the <span class="hifi-hl-blue">"Open SCP Menu" row</span> inside the session menu and a bordered pane slides into view listing every installed app. Each row shows a <span class="hifi-hl-yellow">lifecycle badge</span> — pending, booting (with elapsed seconds), live with its port and interactive-session count, or offline. Pressing `L` on a row boots that app; pressing Enter on a live row focuses its window.',
          'The same pane exposes the worktree rail: you can <span class="hifi-hl-orange">multiply an app into a second git worktree instance</span> from here, and the <span class="hifi-hl-red">retire flow</span> (a typed confirmation guard) lets you cleanly remove an app and its registry entry without leaving the terminal. A `+ Install Another SCP` entry at the bottom opens the install wizard for a new app.',
          'The pane is populated live from the <span class="hifi-hl-purple">Stratimux lifecycle FSM</span> — the badge you see reflects the actual FSM state (`pending` &#x2192; `booting` &#x2192; `live`), not a cached snapshot. Source: <span class="hifi-hl-base">`renderScpSubMenuPane`</span> in `src/lib/bridge/menu.ts` and `launchScpRuntime` in `src/lib/tui/animatedTui.ts`.',
        ],
      },
      {
        title: 'Full-screen install animation',
        color: 'yellow',
        summary: 'Installing the system into a project plays a full-screen progress animation from start to finish.',
        detail: [
          'When you run `scs` in a project for the first time and confirm the install, the whole terminal becomes the animation. A <span class="hifi-hl-purple">particle sphere fills the viewport</span> and a centered Pewter-styled status pane overlays it, showing the current <span class="hifi-hl-yellow">phase label</span> (INITIALIZING &#x2192; AWAITING FIRST RESPONSE &#x2192; READY), a sub-status line that advances through time buckets (Cloning bridge... &#x2192; Scaffolding cwd... &#x2192; Spawning Terminal...), and a <span class="hifi-hl-green">progress bar</span> that fills asymptotically toward completion.',
          'The animation is <span class="hifi-hl-orange">phase-driven, not purely time-driven</span>. The bridge updates the phase when real pipeline events fire — the bar jumps forward when scaffolding completes and again when the first session response arrives. <span class="hifi-hl-red">All keypresses are absorbed</span> during this window except Ctrl-C, which cancels cleanly.',
          'The implementation lives in <span class="hifi-hl-base">`src/lib/tui/installAnimation.ts`</span>. The particle sphere backdrop (`renderManifoldSphere`) composes with a <span class="hifi-hl-yellow">Pewter embossed pane overlay</span> (`buildPewterPane`) using the same grid-plus-overlay system the rest of the TUI animations use.',
        ],
      },
      {
        title: 'Exit confirmation',
        color: 'fuchsia',
        summary: 'A confirm popup guards against quitting the bridge by accident.',
        detail: [
          'Press `q`, `Escape`, or navigate to the Close row and press Enter — instead of quitting immediately, a Yes/No modal appears in the menu. The <span class="hifi-hl-green">default selection is Yes</span>, so a second Enter confirms and the bridge closes cleanly. <span class="hifi-hl-blue">Any arrow key toggles</span> between Yes and No; pressing `n` or Escape from the modal returns to the menu without doing anything.',
          'The guard exists because <span class="hifi-hl-red">the bridge is the coordination point for every running session</span> — quitting mid-session without intent would leave orphaned windows. The modal is a direct clone of the uninstall-confirmation modal architecture: <span class="hifi-hl-purple">`exitConfirm` state slot</span> in `MenuState`, `exit-confirm-open / exit-confirm-toggle / exit-confirm-activate / exit-confirm / exit-cancel` actions, and a dedicated render pane (`renderExitConfirmPane`). Source: <span class="hifi-hl-base">`src/lib/bridge/menu.ts`</span> D-GTC S6 annotation.',
        ],
      },
    ],
  },
  {
    id: 'git-manager',
    label: 'Git Manager',
    features: [
      {
        title: 'Git status and branches per app',
        color: 'red',
        summary: 'See each app’s git status and branches, and stage or unstage changes right there.',
        detail: [
          'Open the Git Manager tab for any running app. The panel shows your <span class="hifi-hl-base">current branch</span>, ahead/behind counts, and two live lists: <span class="hifi-hl-green">staged files</span> and <span class="hifi-hl-orange">unstaged files</span>. Click any file to toggle it between staged and unstaged with a single action — no terminal required.',
          'The status refreshes automatically via a <span class="hifi-hl-blue">file-system watcher</span>, so the counts update the moment you save a change in your editor. Staged, unstaged, untracked, and <span class="hifi-hl-red">conflict counts</span> are all visible at a glance. A commit row sits below the file lists: type a message and press Enter or click <span class="hifi-hl-green">Commit</span> to land the change.',
        ],
      },
      {
        title: 'Create and rename branches',
        color: 'orange',
        summary: 'Make a new branch or rename one without leaving the window.',
        detail: [
          'In the Git Manager\’s Developer section there is a <span class="hifi-hl-green">Create Branch form</span> with an inline name field. Type a branch name, optionally leave "Switch to new branch" checked, and press Enter or click Create. The field validates as you type — <span class="hifi-hl-orange">git check-ref-format rules</span> are enforced inline, and a <span class="hifi-hl-red">collision guard</span> prevents creating a name that already exists.',
          'To rename an existing branch, find it in the Branches list and trigger the rename control inline. The new name is submitted with Enter; Escape cancels. The rename routes through the <span class="hifi-hl-blue">bridge\’s quality layer</span> so the <span class="hifi-hl-base">branch list</span> refreshes immediately after the operation completes.',
        ],
      },
      {
        title: 'Role assignment (Shield · Sword · Sparks)',
        color: 'yellow',
        summary: 'Assign roles: a clean Shield baseline, a Sword you drift on, and Sparks for a hard reset.',
        detail: [
          'In the Tactical Bridge section of the Git Manager you assign two roles to your branches. The <span class="hifi-hl-base">Shield (A)</span> is your stable baseline — the clean state the system always knows how to return to. The <span class="hifi-hl-yellow">Sword (B)</span> is the branch you experiment on; code is committed onto it as you drift away from A. Naming a branch with the `b/` prefix marks it as Sword lineage by convention, but <span class="hifi-hl-orange">role semantics</span> are decided by the explicit assignment, not the name.',
          '<span class="hifi-hl-red">Sparks</span> is the hard-reset leg: when the Sword branch fails to boot, the failsafe commits any work on B to preserve it, switches back to the Shield, and writes the restart signal — so the app comes back up on <span class="hifi-hl-green">clean ground</span>. The glyphs (shield, blade, bolt) and the <span class="hifi-hl-blue">role register</span> appear in the Branches panel and the taskbar buttons, making the current position visible at all times.',
        ],
      },
      {
        title: 'Safe turn-over with auto-revert',
        color: 'fuchsia',
        summary: 'Adopt code changes with a turn-over; a bad boot reverts to your baseline on its own.',
        detail: [
          'The turn-over is the motion of switching the running app from one branch to the other. Clicking the <span class="hifi-hl-yellow">Sword B button</span> switches the app to the working branch and writes a restart signal; the app reboots on the new code. If the new boot succeeds, a <span class="hifi-hl-green">Confirm Success button</span> advances the state machine. If the boot fails, the <span class="hifi-hl-red">Sparks failsafe</span> fires automatically — it commits whatever is on B (so no work is lost), switches back to the Shield A, and restarts the app on the safe branch.',
          'The <span class="hifi-hl-base">state machine position</span> (idle, candidate-created, turned-over, success, merged) is stored to disk and survives a bridge restart. When the bridge comes back up, it reads the <span class="hifi-hl-blue">persisted position</span> and resumes where it left off — a crash mid-turn-over does not strand you in an unknown state.',
        ],
      },
      {
        title: 'Carry into B and serve B',
        color: 'green',
        summary: 'When you turn over to A with working changes, confirm carries your work into B and reboots onto B — you land looking at your own changes.',
        detail: [
          'Turning over to A while you have working changes triggers an <span class="hifi-hl-green">intrusive center-vision confirmation</span>. Two options are presented: <span class="hifi-hl-green">Carry into B &amp; Serve B</span> commits the drift onto your working branch and reboots the app ONTO B — you are immediately looking at your own work. The <span class="hifi-hl-base">stable branch</span> stays the guarded stable you can revert to at any time. Nothing is discarded.',
          'The second option, <span class="hifi-hl-red">Hard Turn Over</span>, performs a ground reset — the app reboots as-is without carrying your changes. Once the confirmed carry lands, the flow <span class="hifi-hl-blue">converges on the standard verify → confirm → merge loop</span>: your working branch is now the candidate, A stands as the proven stable, and the normal success-confirm and merge buttons pick up from there.',
        ],
      },
      {
        title: 'The sparks disconnect register',
        color: 'red',
        summary: 'A bare disconnection — no button pressed — wears the hard red Sparks register by default, pointing you straight at the Tactical Bridge controls.',
        detail: [
          'When the WebSocket drops and the server restarts without a <span class="hifi-hl-red">click-site trigger</span> declaring a register, the standby overlay defaults to the <span class="hifi-hl-red">SPARKS (red) register</span> rather than the derived Shield. The moment is deliberately visible: the frame, badge, countdown, and footer rail all burn red so an unexpected disconnection reads as a hard turn-over event, not a routine one.',
          'A click-site register always wins over the default. If you pressed a <span class="hifi-hl-base">Shield or Sword</span> button before the disconnect, that declared register stays — the sticky-explicit guard on the overlay never lets a derived default downgrade a declared expression. Only the <span class="hifi-hl-orange">register default</span> flips to Sparks; the mode fallback stays plain turn-over. The Tactical Bridge controls remain live in the retained top and bottom fifths of the screen so you can revert immediately.',
        ],
      },
      {
        title: 'Merge and worktree flows',
        color: 'purple',
        summary: 'Merge across two live apps, or multiply an app into a second worktree so both trees run at once.',
        detail: [
          'The <span class="hifi-hl-green">Merge B→A button</span> appears once a turn-over has confirmed success. It runs a <span class="hifi-hl-blue">fast-forward-only merge</span> from the working branch back into the Shield, then resets the state machine to idle — the tested changes are now part of your baseline.',
          'For running two versions of an app simultaneously, the <span class="hifi-hl-purple">Multiply control</span> creates a git worktree: a sibling directory sharing the same object store as the original but checked out on a separate branch. The new instance gets its own port and its own <span class="hifi-hl-base">`scp.config.json`</span>, so both trees run independently. A <span class="hifi-hl-orange">progress bar</span> tracks the create → register → install → ready sequence. When you are finished, the Delete affordance removes the tree (the branch is kept by default) and retires the instance from the registry.',
        ],
      },
      {
        title: 'The update circuit',
        color: 'blue',
        summary: 'When the template advances, a three-way diff stages the changes for you to resolve, then apply.',
        detail: [
          'Open the Update tab in the Git Manager. The <span class="hifi-hl-blue">Run diff button</span> clones the latest template into a temporary location and computes a <span class="hifi-hl-orange">three-way diff</span> against your app\’s own copy. The result is a categorized list: changes to apply automatically, changes to preserve as-is, and <span class="hifi-hl-red">collision zones</span> where your edits and the template\’s edits overlap.',
          'Collision zones must be resolved one by one in the resolver before the <span class="hifi-hl-green">Apply button</span> unlocks. Apply is halted until no unresolved entries remain — this is enforced at the <span class="hifi-hl-base">quality level</span>, not just the UI. Once all entries are resolved, Apply lands the staged changes and sets the update note to "update applied · Turn Over B to finalize," which cues you to do a <span class="hifi-hl-yellow">Sword B turn-over</span> so the running app picks up the new code.',
        ],
      },
      {
        title: 'The developer menu',
        color: 'base',
        summary: 'A dedicated menu gathers the git and turn-over controls in one place.',
        detail: [
          'The Developer section sits at the top of the Git Manager\’s Workflow tab. It groups the most-used git operations into labeled chip groups: <span class="hifi-hl-green">Changes</span> (Stage All, Unstage All, Discard All), <span class="hifi-hl-base">Commit</span> (Amend), <span class="hifi-hl-blue">Remote</span> (Fetch, Pull, Push, Force Push), <span class="hifi-hl-orange">Stash</span> (Stash with optional message, Pop with current count), and <span class="hifi-hl-purple">Inspect</span> (Log, Diff). <span class="hifi-hl-red">Destructive chips</span> show an armed-confirm step before firing — clicking once arms the chip and shows a confirm label; a second click executes.',
          'The Diff chip loads the current working diff into a panel below the commit row. Each changed file is broken into <span class="hifi-hl-orange">hunks</span>, and each hunk carries its own <span class="hifi-hl-green">Stage button</span> — so you can stage exactly the lines you want without staging the whole file. The <span class="hifi-hl-purple">Inspect panel</span> and Developer section together form the full git workflow surface without leaving the window.',
        ],
      },
    ],
  },
  {
    id: 'scps',
    label: 'SCPs',
    features: [
      {
        title: 'Installing lands you inside your first app',
        color: 'blue',
        summary: 'The install creates and boots your first app as its primary motion — you arrive in your own space, not a generic dashboard.',
        detail: [
          'When you run <span class="hifi-hl-blue">`scs`</span> for the first time, the guided install asks you to <span class="hifi-hl-green">name your first app</span>, then installs it from the bundled template, boots it, and focuses its window in front of you — all in one continuous motion. You are not dropped into a launcher and asked to find the next step; the first window that opens <span class="hifi-hl-blue">is your app</span>, named and ready.',
          'Suite 8 domains emerge naturally from your project after you have landed — they are not an entry ritual. The install sequence completes first; then, once you have an app to build inside, the assistant offers to mint your first domain page if you want one. Declining is a full answer — you can explore and add domains whenever the project calls for it.',
          'When a freshly minted page needs serving, the assistant <span class="hifi-hl-yellow">cannot rebuild the app itself</span> — the bridge owns the app lifecycle. Instead it focuses your window and a <span class="hifi-hl-orange">banner appears</span> showing an inert replica of the exact button you need to press. The <span class="hifi-hl-blue">Turn Over A</span> button in your TaskBar pulses until you find it; pressing it triggers the sovereign rebuild and re-serve. The assistant stands by and confirms the new page is live before continuing.',
        ],
      },
      {
        title: 'Install from a local path or a link',
        color: 'blue',
        summary: 'Add an app from a folder on your machine or from a link.',
        detail: [
          'Run <span class="hifi-hl-blue">`scs scp install <YourName>`</span> without any flags to install from the bundled template. When you want to install from an existing source instead, add <span class="hifi-hl-base">`--source`</span> followed by either a local folder path or a git URL. The bridge checks whether the value matches a URL pattern (`https://`, `git@`, or `file://`) and routes it to a clone; anything else is treated as a directory copy.',
          'Either way, the same <span class="hifi-hl-yellow">seven-step pipeline</span> runs: validate the designation, copy or clone the source, stamp the app\’s name into its config, run `npm install`, register it in the project\’s app registry, and build the launch descriptor. The <span class="hifi-hl-base">`--no-npm`</span> flag skips the install step when you need faster iteration.',
          'After the pipeline finishes, the command prints the <span class="hifi-hl-green">install path, the file count, and the assigned port</span>, then probes the bridge to report whether the connection endpoint is live or waiting to be started.',
        ],
      },
      {
        title: 'The template scaffold',
        color: 'yellow',
        summary: 'Every app starts from a complete Vue app with its own server, ready to grow.',
        detail: [
          'When you install without a `--source`, the bridge copies its bundled template — a <span class="hifi-hl-yellow">complete Vue 3 SSR app</span> with its own Express server, Stratimux concepts, and a working landing page — into `Cascades/scps/<YourName>/SCP/`. The designation you provide is stamped throughout: concept names are generated, the app\’s <span class="hifi-hl-base">`scp.config.json`</span> receives its unique name, and files that carry template-level placeholder names are rewritten in place.',
          'The scaffold is the <span class="hifi-hl-green">starting floor, not a skeleton</span>. The generated app boots, serves pages, and connects to the bridge without you adding anything. From there you build on top of it — adding pages, concepts, and Suite 8 domains as your app grows.',
          'The install pipeline skips <span class="hifi-hl-base">`.git`, `node_modules`, `dist`, and `coverage`</span> when copying, so only the source code transfers. If you supply a foreign source via `--source`, concept-name generation is skipped since the source already has its own structure.',
        ],
      },
      {
        title: 'Full per-app sovereignty',
        color: 'orange',
        summary: 'Each app owns its own git, its own configuration, and its own identity — nothing is shared behind your back.',
        detail: [
          'Every installed app gets its own <span class="hifi-hl-orange">git repository initialized at install time</span>. The bridge runs `git init` and an initial commit in the app\’s directory, then ensures a separate nested git structure under `Cascades/scps/<name>/` — two distinct repos, each tracking its own history. No app shares a repository with another.',
          'Configuration is also per-app. Each app carries a <span class="hifi-hl-base">`scp.config.json`</span> that declares its name. The bridge reads this file when the app connects; it <span class="hifi-hl-orange">never inherits another app\’s identity</span> or configuration. The name in that file is what appears in the toolbar indicator and what the bridge uses to route messages to the correct running instance.',
          'The app registry (<span class="hifi-hl-base">`Cascades/SCPs.json`</span>) records each app as an independent entry with its own port, status, and metadata. <span class="hifi-hl-green">Removing or stopping one app has no effect on any other.</span>',
        ],
      },
      {
        title: 'The identity indicator',
        color: 'green',
        summary: 'A name chip in the toolbar always tells you which app the window belongs to.',
        detail: [
          'At the far left of every app\’s fixed bottom toolbar, a <span class="hifi-hl-green">small name chip</span> displays the app\’s name. It is rendered in Orbitron uppercase with a green accent rule on its left edge. The chip reads the name from the app\’s own <span class="hifi-hl-base">`/scp-config`</span> endpoint at mount time; if the endpoint is unavailable it renders nothing — no placeholder, no fallback label.',
          'The name the chip shows is the same name stamped into `scp.config.json` during install, so it is <span class="hifi-hl-green">deterministic</span> and matches what the bridge and TUI use to identify the app. When you have multiple apps running in separate windows, the chip is the immediate answer to which window you are looking at.',
          'The chip is capped at <span class="hifi-hl-base">180px</span> with text-overflow ellipsis so long names truncate cleanly rather than pushing the toolbar layout.',
        ],
      },
      {
        title: 'Boot and focus lifecycle',
        color: 'purple',
        summary: 'Boot an app when you need it and focus its window to bring it forward.',
        detail: [
          'From the TUI, press Enter on any installed app to boot it. The bridge <span class="hifi-hl-purple">spawns the app\’s Electron window</span>, tracks its state through a lifecycle — pending, booting, live — and displays a boot overlay in the TUI while the window is loading. Once the window has painted its first frame (the rendered signal), the TUI marks it live and can focus it.',
          'Focusing brings the app\’s window to the front of your display <span class="hifi-hl-blue">without restarting it</span>. The bridge identifies the window by the ID it received when the session was registered, so focus is targeted and does not affect other running apps. If the window is already live, focus is the only step needed.',
          'The same boot and focus operations are also available as <span class="hifi-hl-purple">MCP tool calls</span>, so an agent running in a Claude Code session can launch or surface an app programmatically as part of a larger automated flow.',
        ],
      },
      {
        title: 'Focus any page by name',
        color: 'blue',
        summary: 'A tool focuses any app\’s window and navigates straight to a named domain page — and it answers honestly when something goes wrong.',
        detail: [
          'Pass the <span class="hifi-hl-blue">app name and the page name</span> to the focus tool and it brings the correct window forward and navigates directly to that page in one step. Resolution is by name first — the tool looks up the bound app entry exactly, then falls back to a case-insensitive match, then to the app registry — so no body-directory probing is needed for a freshly minted page that exists on the server but whose local files are still being written.',
          'The navigation URL is <span class="hifi-hl-yellow">composed</span> from the resolved port when the browser URL is not yet available — a deep link is always formed as long as the port resolves. The page name is converted to an island key (spaces stripped, first character lowercased) and appended to the base URL, so the app opens directly on the right island without requiring a separate navigation step.',
          'A <span class="hifi-hl-red">failed focus returns its reason</span>, never a silent success. Every exit path — unresolved name, uncomposable URL, failed relay — fires a result object with `ok: false` and a `reason` string. A successful focus fires `ok: true` along with the app name, the composed URL, and the window ID. The agent reads the result and acts on it rather than assuming the window moved.',
        ],
      },
    ],
  },
  {
    id: 'suite-8s',
    label: 'Suite 8s',
    features: [
      {
        title: 'Project-local working surfaces',
        color: 'orange',
        summary: 'Named surfaces for the domains you work in — a few ride the template, and you mint more from inside the app.',
        detail: [
          'The template carries a set of working surfaces already in place — <span class="hifi-hl-orange">Teal Claude, Stratimuxian Scholar, Cadmium Researcher, Graphite Scribe, Pewter Tessera, and Entourage Forge</span> are scaffolded from the start. Additional surfaces emerge after the first SCP is up: you mint them from within the app, and they settle SCP-local into your project.',
          'To add one manually, you add a folder under <span class="hifi-hl-base">`Cascades/8_SUITES/`</span> in the SCP. The bridge reads the folder, registers it as a new surface in the roster, and it appears alongside the built-in ones. The <span class="hifi-hl-orange">name you give the folder</span> becomes the surface\’s identity throughout the system.',
          'The roster on the Suite 8 landing shows all installed surfaces as cards, each carrying its <span class="hifi-hl-base">domain name</span>, a one-line description, and a <span class="hifi-hl-orange">spectrum color</span> the system derives from the domain itself.',
        ],
      },
      {
        title: 'Spawn any surface from the picker',
        color: 'blue',
        summary: 'Launch a session into any working surface straight from the Spawn Picker.',
        detail: [
          'In the Session Manager, open the <span class="hifi-hl-blue">Spawn Picker</span> — the collapsed drawer labeled "Spawn a Suite 8." It lists every installed surface that has an Instance file. Select the one you want, pick a model if you want to change the default, and press Spawn. A session opens in its own window, bound to that surface.',
          'The picker reloads the roster each time it opens, so a surface you just added <span class="hifi-hl-green">appears immediately</span> without a page refresh. While a spawn is in flight the button stays disabled and the drawer collapses once the <span class="hifi-hl-blue">new session row</span> lands in the list.',
          'Surfaces without an Instance file appear in the roster but are <span class="hifi-hl-red">not selectable</span> — they show in the list so you know they exist, but the spawn button stays inert until the Instance is present.',
        ],
      },
      {
        title: 'Its own page per surface',
        color: 'purple',
        summary: 'Each working surface gets its own page, and the menu system to drive it.',
        detail: [
          'Every installed surface has its own page in the SCP — a dedicated island with a header, a <span class="hifi-hl-purple">session manager</span> scoped to that surface\’s sessions, and a Shatterite menu driven by whatever the active anchor session writes. Navigating to the surface\’s page focuses only its sessions and its menu; no other surface\’s work bleeds in.',
          'The page also carries a <span class="hifi-hl-base">Diamond / Onyx pane</span> so you can read the active session\’s planning context without leaving the surface\’s page. A Home / Card tab lets you switch between the live work surface and the surface\’s summary card from the roster.',
          'New pages are scaffolded through the in-app <span class="hifi-hl-purple">Create S8 flow</span> — you mint one from the Rotary Nav, the system builds the page concept and carries it onto a working branch, and the Entourage Forge builds out the domain-specific content once you\’re ready. The surface is SCP-local from the moment it\’s minted.',
        ],
      },
      {
        title: 'The anchor system',
        color: 'green',
        summary: 'Bind a page to a session so returning to the page returns you to its work.',
        detail: [
          'In the session list on any surface\’s page, find the session you want to make the permanent point of return and click "Set as Anchor." That session is now bound to the surface — navigating back to the page <span class="hifi-hl-green">focuses it if it is live</span>, or re-engages it if it went offline. One anchor per surface; setting a new one reassigns the binding.',
          'The Shatterite menu on the page is driven by the anchor session. When the anchor session <span class="hifi-hl-green">writes a menu</span> to its working directory, the page picks it up and displays the options the session is offering — commands, decisions, next steps. Releasing the anchor clears the binding without ending the session.',
          'The anchor lookup is resolved by a shared model that all surface pages use, so renames and new surface mints never break the lookup. The <span class="hifi-hl-base">`isAnchor` flag</span> on the session entry is the authoritative signal; the page reads it through <span class="hifi-hl-base">`resolveS8Anchor`</span> rather than any inline field check.',
        ],
      },
      {
        title: 'The Shatterite menu',
        color: 'purple',
        summary: 'The agent-authored, staged menu on every surface page — the anchor session writes it, the page renders it.',
        detail: [
          'Every surface page carries a <span class="hifi-hl-purple">Shatterite menu</span> — placed with one tag, the component owns its own acquisition, staging, navigation, and persistence. The anchor session writes `menu.json` inside the surface\’s Extended directory; the page watches the file and renders whatever the session staged. The menu is the live interface between the running agent and the page.',
          'The menu is a <span class="hifi-hl-purple">staged workflow</span>: the agent authors stages (prompts + options), and pressing an option advances to the next stage immediately while the model responds. Navigation arrows let you move back through earlier stages; position persists across reloads. Options come in two focus disciplines — <span class="hifi-hl-green">In Focus</span> (the terminal keeps focus, the agent works in the foreground) and <span class="hifi-hl-orange">Pass Through</span> (the agent works in the background, focus returns when done).',
          'Options can also carry <span class="hifi-hl-purple">written input forms</span> — text fields, tag inputs, and select lists compose the user\’s writing into the dispatch, pairing it with the option\’s directive before sending. The menu can summon its own documentation through a staged option, making the system self-describing without leaving the page.',
        ],
      },
      {
        title: 'Auto Mode',
        color: 'yellow',
        summary: 'A per-surface toggle that lets the anchor session work in the background without approval prompts.',
        detail: [
          'Each surface page carries an <span class="hifi-hl-yellow">Auto Mode pill</span> — toggling it on writes `autoMode: true` to the surface\’s `S8.json` file in its Extended directory. That file is the filesystem anchor: the bridge reads it at every spawn and resume and, when Auto Mode is on, appends <span class="hifi-hl-yellow">`--permission-mode auto`</span> to the session launch. The anchor works in the background under the classifier gate without requiring per-action approval.',
          'Toggling Auto Mode off restores the <span class="hifi-hl-base">approval gate intact</span> — the session launched next will prompt for permissions as normal. The toggle is per-surface and persists across sessions; it is not a global setting. The `spawn.auto-mode` telemetry entry names each firing so you can verify the mode is being read correctly.',
        ],
      },
      {
        title: 'Cascade Memory',
        color: 'base',
        summary: 'Each surface founds and maintains its own working-memory document pair, written by its anchor session and readable on the page.',
        detail: [
          'Every surface owns a <span class="hifi-hl-base">Diamond / Onyx pair</span> inside its Extended directory — `DIAMOND-TIER-0.md` holds the Ego side (the active plan, the cycle position, what aspires to be done) and `ONYX-TIER-0.md` holds the Lambda side (the accumulated Rose diagnoses, what was actually done, the trajectory). The anchor session authors both; the page\’s Diamond / Onyx pane renders them without leaving the surface.',
          'The pair is <span class="hifi-hl-base">founded at mint time</span> — the Shatterite menu\’s founding option runs the resolve-then-judge ladder and creates the documents as its first act. From that point the anchor session maintains them: Diamond is updated as plans evolve; Onyx accumulates a diagnosis at the close of each cycle. The files tier when they grow (Diamond-Tier-1, Onyx-Tier-1), preserving <span class="hifi-hl-base">the full history</span> without deletion.',
        ],
      },
      {
        title: 'Create a surface from the page',
        color: 'green',
        summary: 'Mint a new named surface from inside the app — the Create S8 flow scaffolds it and the Entourage Forge builds it out.',
        detail: [
          'Open the <span class="hifi-hl-green">Create S8 overlay</span> from the Rotary Nav and walk a four-step pipeline: Name (enter the domain name) → Scaffold (the system creates the directory and its seed files) → Page (the bridge duplicates the page concept, registers it, and runs the verification gates — up to ~30 seconds) → Turn Over (the new page rides a working branch onto B and the SCP rebuilds so the page appears). The flow is <span class="hifi-hl-green">SCP-local</span>: the surface is yours, in your project, from the moment it\’s minted.',
          'Once the surface is live, the <span class="hifi-hl-orange">Entourage Forge</span> builds it out with you — its staged conference conducts a domain elicitation, a research pass, Instance and Skill authoring, and an architecture ground before handing the finished surface back. The Forge is a conductor, not an author: it leads the Suite 8s that accompany a creation (Cadmium researches, the Bridge grounds, the template lends its shape) and closes its own entry point once the surface is actualized.',
        ],
      },
    ],
  },
  {
    id: 'the-bridge',
    label: 'The Bridge',
    features: [
      {
        title: 'One workspace bridge',
        color: 'base',
        summary: 'A single bridge process coordinates every app and every session in your workspace.',
        detail: [
          'Run <span class="hifi-hl-blue">`scs`</span> from your terminal. <span class="hifi-hl-base">One process starts</span> — and that one process is the bridge. It holds the state for every app you have installed and every session running across all of them. There is no separate daemon per app, no per-project service to launch.',
          'The bridge enforces its own <span class="hifi-hl-base">single-instance rule</span> at the OS level: if you try to start a second bridge in the same workspace, the attempt <span class="hifi-hl-blue">relays to the already-running instance</span> instead of spawning a duplicate. Everything in the interface — the TUI, the Electron windows, the callable tools — reaches back to that same running bridge.',
        ],
      },
      {
        title: 'One bridge at a time',
        color: 'red',
        summary: 'A second bridge anywhere on the machine detects the running one and stands down with plain instructions.',
        detail: [
          'SCS-Bridge holds a <span class="hifi-hl-red">machine-global lockfile</span> — one per user account, written to the system temp directory — carrying the running bridge\'s pid, workspace path, and start time. When a second bridge starts in a different project, it reads that file, checks liveness with a <span class="hifi-hl-orange">zero-signal kill probe</span>, and if the holder is alive it reports the workspace name and pid to the user and exits cleanly.',
          'A bridge that crashed without cleanup leaves a <span class="hifi-hl-fuchsia">stale lockfile</span>. The next bridge to start detects the dead pid, claims the lock over it automatically, and proceeds — no manual cleanup required. Re-running `scs` in the same workspace that is already running is a separate case: the <span class="hifi-hl-blue">per-workspace singleton relay</span> owns that handoff, and the global mutex does not interfere.',
        ],
      },
      {
        title: 'Discoverable by any tool',
        color: 'orange',
        summary: 'The bridge publishes a small discovery file so other tools can find and talk to it.',
        detail: [
          'When the bridge starts and binds its port, it writes a small JSON file at <span class="hifi-hl-orange">`&lt;your-project&gt;/Cascades/Bridge/bridge.json`</span>. That file contains the port number, the bridge version, and metadata about the apps currently running. Any tool that knows to look for that file — including Claude Code sessions — can read it to find the bridge without any manual configuration.',
          'The discovery file is written <span class="hifi-hl-base">atomically</span> (write to a temp path, then rename into place) so a reader never sees a half-written file. The bridge also <span class="hifi-hl-orange">updates it whenever relevant state changes</span>, so the file is a live snapshot, not a one-time stamp at startup.',
        ],
      },
      {
        title: 'The live SCP roster',
        color: 'blue',
        summary: 'One query answers every installed SCP\'s liveness with a real socket probe — never a stale file.',
        detail: [
          'When you ask the bridge about your installed apps, it does not read a cached status field. It opens a <span class="hifi-hl-blue">real socket connection to 127.0.0.1 on each app\'s port</span> — all in parallel, with a 300-millisecond cap — and the result of that probe is the answer. A socket that accepts the connection is live. One that times out or refuses is dark. No dock entry, no registry stamp, and no lifecycle field can override what the socket reports.',
          'The roster entry for each app carries <span class="hifi-hl-green">name, live status, host, port, and URL</span> composed directly from the probed port. Alongside liveness, the query surfaces each app\'s <span class="hifi-hl-fuchsia">git state</span> — current branch, stable branch, working branch, A/B mode, and any pending turn-over signal — pulled from the app\'s own `gitm.json` at query time.',
        ],
      },
      {
        title: 'A callable tool surface',
        color: 'blue',
        summary: 'A roster of callable tools covers sessions, apps, git, capture, and orchestration.',
        detail: [
          'From inside any Claude Code session connected to the bridge, you have access to a set of <span class="hifi-hl-blue">callable tools</span>. They span session operations (spawn, engage, rename, archive, dissipate, set anchors), app lifecycle (boot, focus), git actions (stage, unstage, commit, branch), render capture, and window orchestration. The tools <span class="hifi-hl-orange">register dynamically</span> as apps come online and unregister when they leave.',
          'This means you can ask Claude to <span class="hifi-hl-blue">manage your sessions, flip branches, or capture a screenshot</span> of a running app without leaving the conversation. The bridge translates those tool calls into real operations against the running processes and reports back with <span class="hifi-hl-green">structured results</span>.',
        ],
      },
      {
        title: 'Cross-process safety',
        color: 'fuchsia',
        summary: 'A single-writer registry and atomic writes keep the shared state consistent when several windows run at once.',
        detail: [
          'The bridge keeps a shared session registry on disk. Every write to that registry goes through a <span class="hifi-hl-fuchsia">`chainWrite` mutex</span> — an in-process queue that serializes writes so they never interleave — and the final save is a <span class="hifi-hl-base">tmp-file-then-rename atomic swap</span>. A reader always sees a complete, consistent file; partial writes are structurally impossible.',
          'This matters when <span class="hifi-hl-fuchsia">several Electron windows and the TUI</span> are all active at the same time and could each trigger a registry update simultaneously. The mutex handles the within-process ordering; the atomic rename handles the cross-process read safety. The two layers compose so that <span class="hifi-hl-green">no combination of concurrent events</span> can corrupt the registry.',
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    features: [
      {
        title: 'Local-only by default',
        color: 'base',
        summary: 'Everything binds to your own machine — nothing is exposed to the network.',
        detail: [
          'The bridge server and all its connected tools listen exclusively on <span class="hifi-hl-base">`127.0.0.1` — the loopback address</span> — never on a LAN-facing interface. Every port scan, every endpoint URL, every inter-process connection <span class="hifi-hl-base">stays on your own machine</span>. If you are not at that machine, there is no surface to reach.',
          'This is a <span class="hifi-hl-blue">structural choice, not a configuration toggle</span>. The port-probe logic binds `127.0.0.1` specifically so that a <span class="hifi-hl-yellow">conflict check and an actual server cannot disagree about which address they are on</span>. The result is that <span class="hifi-hl-base">no network packet from outside your machine can reach the bridge</span>, regardless of your firewall settings.',
        ],
      },
      {
        title: 'A navigation guard',
        color: 'fuchsia',
        summary: 'External links open in your own browser instead of inside the app window.',
        detail: [
          'Any link that points outside the app — whether you click it, <span class="hifi-hl-fuchsia">a page embeds it in a frame</span>, or a redirect tries to follow it — is intercepted before the app window changes. The guard <span class="hifi-hl-blue">hands `http` and `https` addresses to your default system browser</span> and blocks the navigation inside the app. Links that try to open a new window are handled the same way.',
          'The guard is registered <span class="hifi-hl-fuchsia">at the application level</span> so it covers every window and every embedded frame the app ever creates, including subframes. A per-window approach has a known gap: <span class="hifi-hl-red">embedded frames slip past it</span>. The app-level hook <span class="hifi-hl-blue">closes that gap structurally</span>. Malformed URLs are denied silently; the guard is written to <span class="hifi-hl-yellow">fail open on unparseable addresses</span> so a corner case cannot brick a window.',
        ],
      },
      {
        title: 'Per-session content policy + sandbox',
        color: 'green',
        summary: 'Each session runs under its own content policy in a sandboxed window.',
        detail: [
          'Every SCP window opens with <span class="hifi-hl-green">`sandbox: true`, `nodeIntegration: false`, and `contextIsolation: true`</span> — the renderer has no direct access to Node.js or the Electron internals. On top of that, the app stamps a content security policy onto the SCP document <span class="hifi-hl-blue">at the network layer, overriding any header the SCP server might send</span>, so the policy is authoritative regardless of what the served page declares.',
          'The policy <span class="hifi-hl-red">blocks embedded objects and cross-origin frames</span> (`object-src ’none’`, `frame-src ’self’`), which structurally prevents the class of attack where an embedded PDF or external resource loads inside the app window. Scripts, styles, fonts, and WebSocket connections are <span class="hifi-hl-green">limited to the SCP’s own localhost origin plus a short explicit allowlist</span>. <span class="hifi-hl-yellow">`<webview>` tags are disabled at the window level</span> as a separate layer.',
        ],
      },
    ],
  },
  {
    id: 'hygiene',
    label: 'Hygiene',
    features: [
      {
        title: 'Self-truncating logs',
        color: 'fuchsia',
        summary: 'Debug logs drop their oldest lines and stay bounded, so a long session never fills your disk.',
        detail: [
          'Every log the bridge writes is <span class="hifi-hl-fuchsia">capped automatically</span>. When a log file grows past <span class="hifi-hl-base">5 MB (roughly 10,000 lines)</span>, the system reads the file, drops the oldest lines, and rewrites only the tail — using an <span class="hifi-hl-green">atomic rename</span> so a watcher reading the file at the same moment never sees a half-written result. The cap runs on the first write of a session (to catch any file left oversized by a prior run) and then periodically on every <span class="hifi-hl-blue">500th append</span>, so it adds no overhead during normal operation.',
          'Each installed app also gets its own boot log, capped separately at <span class="hifi-hl-base">500 lines</span> and rotated down to <span class="hifi-hl-fuchsia">400</span> when that limit is crossed. Neither cap requires any configuration — they <span class="hifi-hl-green">engage on their own</span> and stay within the boundary regardless of how long a session runs.',
        ],
      },
      {
        title: 'Stray output captured, never painted over',
        color: 'base',
        summary: 'Loose terminal output is captured to a log rather than smeared across the menu.',
        detail: [
          'The TUI renders inside the terminal\’s <span class="hifi-hl-blue">alternate screen</span> — the same full-screen mode that tools like vim or htop use. Any code running alongside the TUI that tries to write directly to stdout, stderr, or the console would corrupt that screen, mixing raw text into the menu layout. Before the TUI takes the screen, it intercepts <span class="hifi-hl-base">five output channels</span> — stdout, stderr, console.log, console.error, and console.warn — and <span class="hifi-hl-green">redirects them to a structured log file</span> instead.',
          'The result is that the <span class="hifi-hl-blue">TUI surface stays clean</span> no matter what the bridge is doing in the background. If you ever need to see what was redirected, the output lands in <span class="hifi-hl-base">`Cascades/Bridge/terminal-output.json`</span> as timestamped entries. When the TUI exits and releases the alternate screen, the <span class="hifi-hl-green">original output channels are restored</span>.',
        ],
      },
    ],
  },
  {
    id: 'look-and-feel',
    label: 'Look & Feel',
    features: [
      {
        title: 'The Named SCP home page',
        color: 'green',
        summary: 'The Home opens on the founder\'s introduction of the Named SCP, with suite-colored prose, interactive function chips, and a tri-color SCP mark.',
        detail: [
          'Section 01 of the Home is a <span class="hifi-hl-green">green-paned teaching surface</span> titled "The Named SCP." The prose rides a <span class="hifi-hl-base">Mux-Ego subtext ground</span> — light text on a dark gem-lit Onyx inset — so the functional color highlights read cleanly against the dark depth rather than the suite color. Each paragraph applies <span class="hifi-hl-purple">inline hifi-hl-* spans</span> by the system-wide functional color law: blue for core-action phrases, yellow for value and architecture, green for creation and recursion, and so on. The hero above the body carries the same idiom: the identity paragraph tints each SCP acronym reading to its own color, and the "Welcome to the UnKnown" line closes the hero with a faint glow.',
          'The acronym panel below the prose is built from the <span class="hifi-hl-base">hifi-panel-toolbar + hifi-panel-body anatomy</span> and uses a <span class="hifi-hl-fuchsia">hifi-list</span> — diamond-marker bullets whose marker color is set per-item via the CSS custom property --mark, so each acronym entry is tinted to its own suite. Section 02 (The Mental Model) closes with a <span class="hifi-hl-purple">suite-chip row</span>: the eight cognitive functions appear as pressable popover chips (SuiteChip.vue) that reveal the profession, operation, and geometric role for each suite on hover or tap.',
          'The term SCP everywhere on the page is rendered by <span class="hifi-hl-green">ScpMark.vue</span> — a single-tag component that wraps the letters in a tri-color mark. S wears Suite 1 red with an orange shadow; C wears Suite 3 yellow with a green shadow; P wears Suite 5 blue with a purple shadow. The shadows alternate to the <span class="hifi-hl-base">next suite in the cascade</span> — the full rotation implied in three letters. The whole <span class="hifi-hl-yellow">Pewter Tessera</span> component set (transparent panes, Mux-Ego pane, subtext ground, panel anatomy, hifi-list, hifi-key family, hifi-hl highlighting, SuiteChip, ScpMark) ships in the template stylesheet so every SCP page can apply the same vocabulary.',
        ],
      },
      {
        title: 'The Pewter design voice',
        color: 'base',
        summary: 'A consistent, legible look across every screen.',
        detail: [
          'Open any page in the app and you land in the same visual language: <span class="hifi-hl-base">embossed pane borders, Orbitron headings, Space Mono monospace</span>, and a fixed set of spectrum color tokens that tint backgrounds, badges, and accents. The Bridge TUI, the install animation, the Session Manager, and every Settings panel share that vocabulary — a consistent frame the rest of the UI sits inside.',
          'The design is not decorative first. Every element uses a <span class="hifi-hl-yellow">functional color role</span> (red for risk and hard-halting actions, blue for <span class="hifi-hl-blue">working-system panes</span>, fuchsia for <span class="hifi-hl-fuchsia">closing accents</span>, and so on) so that the look and the meaning move together. Scanning a page, the color tells you what kind of thing you are looking at before you read it.',
        ],
      },
      {
        title: 'Runtime color selection',
        color: 'orange',
        summary: 'Pick your accent color and the window re-tints live — no reload.',
        detail: [
          'Go to Settings and open Suite Colors. Each of the eight spectrum slots shows a swatch and its <span class="hifi-hl-yellow">functional designation</span>. Click a swatch and a constrained canvas picker opens in the panel — no native OS dialog, no page jump. Move the picker and the whole app <span class="hifi-hl-green">re-tints as you drag</span>: the CSS variables on the document root update live, so every pane, button, and badge responds immediately.',
          'Your choices are saved to <span class="hifi-hl-base">localStorage</span> and applied again the next time the app starts. A Reset button restores any single slot, or the whole palette, to the factory defaults. The color derivation follows a <span class="hifi-hl-yellow">fixed rule</span> (dark = 85%, light = 115%, fade = 15% of the base channel) so the variants always stay in proportion regardless of which hue you pick.',
        ],
      },
      {
        title: 'Selectable render modes',
        color: 'blue',
        summary: 'Choose the terminal render mode, including the shader skins, or turn them off.',
        detail: [
          'In Settings, a target selector lets you set the <span class="hifi-hl-blue">render mode</span> for the Terminal windows or for the SCP window itself. The available modes come from the bridge — the same catalog applies to both targets so they never get out of sync. The default skin is <span class="hifi-hl-base">Muxon</span>; you can switch to another shader skin or turn shaders off entirely if you prefer a plain render.',
          'The setting writes through to <span class="hifi-hl-base">bridge.json</span> and the running terminals pick it up live — you do not need to close and reopen a window. If a terminal ever renders dark, it <span class="hifi-hl-green">recovers on its own</span>; and when you resume a session the view reflows without the display getting <span class="hifi-hl-red">stuck</span>.',
        ],
      },
    ],
  },
];

// A flat, addressable list of every feature — each carries its category label + a stable key so the
// nav can render category breaks and the pane can resolve the active feature by key.
interface FlatFeature extends ReleaseFeature {
  categoryId: string;
  categoryLabel: string;
  isFirstOfCategory: boolean;
  key: string;
}

const flatFeatures = computed<FlatFeature[]>(() => {
  const rows: FlatFeature[] = [];
  for (const cat of RELEASE_SITE) {
    cat.features.forEach((f, i) => {
      rows.push({
        ...f,
        categoryId: cat.id,
        categoryLabel: cat.label,
        isFirstOfCategory: i === 0,
        key: cat.id + '·' + f.title,
      });
    });
  }
  return rows;
});

// Total feature count — the little tally shown in the nav header.
const featureCount = computed<number>(() => flatFeatures.value.length);

// Default selection = the first feature.
const activeKey = ref<string>(RELEASE_SITE[0].features[0]
  ? RELEASE_SITE[0].id + '·' + RELEASE_SITE[0].features[0].title
  : '');

const activeFeature = computed<FlatFeature | undefined>(() =>
  flatFeatures.value.find((f) => f.key === activeKey.value),
);

const selectFeature = (key: string): void => {
  activeKey.value = key;
};

// The head pane family for a color token — a direct 1:1 into the existing hifi-pane-{spectrum}
// families defined in src/style.css (never an invented class).
const headPaneClass = (color: SpectrumColor): string => `hifi-pane-${color}`;
</script>

<template>
  <div class="release-minisite">
    <!-- THE NAV SIDEBAR · all 44 features, grouped with a designed break per category. -->
    <nav class="rms-nav" aria-label="Release features by category">
      <div class="rms-nav-head">
        <span class="rms-nav-eyebrow hifi-mono">THE FULL TOUR</span>
        <span class="rms-nav-count hifi-mono">{{ featureCount }} features</span>
      </div>

      <ul class="rms-nav-list">
        <template v-for="feature in flatFeatures" :key="feature.key">
          <!-- THE CATEGORY BREAK · a visual divider + the category label in the section-label
               voice (slim accent rule · Orbitron uppercase · recede-toned), injected before the
               first feature of each category. -->
          <li
            v-if="feature.isFirstOfCategory"
            class="rms-nav-break"
            role="heading"
            aria-level="3"
          >
            <span class="rms-nav-break-rule"></span>
            <span class="rms-nav-break-label hifi-label">{{ feature.categoryLabel }}</span>
          </li>

          <li class="rms-nav-item">
            <button
              type="button"
              :class="['rms-nav-btn', `rms-accent-${feature.color}`, { active: feature.key === activeKey }]"
              @click="selectFeature(feature.key)"
            >
              <span class="rms-nav-btn-title hifi-heading">{{ feature.title }}</span>
              <span class="rms-nav-btn-summary">{{ feature.summary }}</span>
            </button>
          </li>
        </template>
      </ul>
    </nav>

    <!-- THE CONTENT PANE · the selected feature expands into its full explanation, on a card whose
         head + accent carry the feature's FUNCTIONAL COLOR. -->
    <section class="rms-content" aria-live="polite">
      <article v-if="activeFeature" class="rms-card">
        <header :class="['rms-card-head', headPaneClass(activeFeature.color)]">
          <span class="rms-card-cat hifi-mono">{{ activeFeature.categoryLabel }}</span>
          <h3 class="rms-card-title hifi-heading">{{ activeFeature.title }}</h3>
          <p class="rms-card-lede">{{ activeFeature.summary }}</p>
        </header>
        <div :class="['rms-card-body', `rms-accent-${activeFeature.color}`]">
          <!-- D-HOME R4 (C811) · the detail paragraphs carry inline hifi-hl spans — repo-authored
               strings only (never user input), so v-html is safe here. -->
          <p
            v-for="(para, i) in activeFeature.detail"
            :key="i"
            class="rms-card-para"
            v-html="para"
          ></p>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
/* ===================== THE VIEWHEIGHT FRAME =====================
   The mini-website is a viewport-height block in the page flow — the person can scroll PAST it as
   one block, anor stop and frame it. scroll-margin-top lets an anchor jump frame it cleanly under
   the fixed chrome. Inside, the nav column and the content pane each scroll independently. */
.release-minisite {
  height: 100vh;
  scroll-margin-top: 1rem;
  display: grid;
  grid-template-columns: minmax(240px, 340px) 1fr;
  gap: 1rem;
  min-height: 0; /* allow the inner overflow-y children to size correctly */
  border-radius: 8px;
  overflow: hidden;
}

/* ---- NAV SIDEBAR (left) ---- */
.rms-nav {
  overflow-y: auto;
  min-height: 0;
  padding: 0.25rem 0.5rem 1rem 0;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.rms-nav-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.6rem;
  margin-bottom: 0.25rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.rms-nav-eyebrow {
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.55);
}

.rms-nav-count {
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  color: rgba(235, 231, 222, 0.5);
}

.rms-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

/* THE CATEGORY BREAK · slim accent rule + Orbitron uppercase label, recede-toned (mirrors the
   session-section-label idiom — a heading between grouped rows). */
.rms-nav-break {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 0.5rem 0.35rem;
  margin-top: 0.35rem;
}

.rms-nav-break:first-child {
  margin-top: 0;
  padding-top: 0.35rem;
}

.rms-nav-break-rule {
  height: 2px;
  width: 1.25rem;
  flex: 0 0 auto;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
  border-radius: 1px;
}

.rms-nav-break-label {
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(230, 226, 216, 0.55);
  white-space: nowrap;
}

.rms-nav-item {
  margin: 0;
}

.rms-nav-btn {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.55rem 0.7rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
  border-left: 3px solid var(--rms-accent, rgba(255, 255, 255, 0.2));
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.rms-nav-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.rms-nav-btn.active {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.16);
  border-left-color: var(--rms-accent, rgba(255, 255, 255, 0.5));
}

.rms-nav-btn-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(240, 236, 228, 0.92);
  line-height: 1.25;
}

.rms-nav-btn.active .rms-nav-btn-title {
  /* C812 · the active title stays white-conductor — the accent lives in the border rail
     (accent-light on the lit row washed out under the shader). */
  color: var(--color-white-conductor, #f5f2ec);
}

.rms-nav-btn-summary {
  font-size: 0.7rem;
  line-height: 1.4;
  color: rgba(235, 231, 222, 0.55);
}

/* ---- CONTENT PANE (right) ---- */
.rms-content {
  overflow-y: auto;
  min-height: 0;
  padding: 0.25rem 0.25rem 1.5rem 0.25rem;
}

.rms-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* THE COLOR-TINTED HEAD · reuses the existing hifi-pane-{spectrum} family (applied in the template
   binding) so the head + its embossed border carry the feature's functional color. Cards are
   deliberately non-uniform — the head hue IS the feature's role. */
.rms-card-head {
  padding: 1.3rem 1.5rem 1.4rem;
  border-radius: 8px 8px 0 0;
}

.rms-card-cat {
  display: block;
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  /* C812 · the ground law: light text ON the suite pane (the dark-ink R3 idiom died under
     the shader — the screenshot Lambda). */
  color: rgba(255, 255, 255, 0.66);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
  margin-bottom: 0.5rem;
}

.rms-card-title {
  margin: 0 0 0.55rem;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
}

.rms-card-lede {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  max-width: 60ch;
}

.rms-card-body {
  padding: 1.4rem 1.5rem 1.6rem;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-top: none;
  border-left: 3px solid var(--rms-accent, rgba(255, 255, 255, 0.3));
  border-radius: 0 0 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.rms-card-para {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(235, 231, 222, 0.86);
}

.rms-card-para code {
  font-family: var(--font-mono, 'Space Mono', monospace);
  background: rgba(0, 0, 0, 0.4);
  padding: 0.08rem 0.35rem;
  border-radius: 3px;
  font-size: 0.85em;
}

/* ===================== THE SPECTRUM ACCENT MAPPING =====================
   1:1 into the template's existing --color-{spectrum} tokens (src/style.css). --rms-accent drives
   the nav item's left rule and the content body's left rule; --rms-accent-light tints the active
   nav title. No invented tokens — every value resolves to a defined --color-{spectrum}[-light]. */
.rms-accent-base    { --rms-accent: var(--color-base);    --rms-accent-light: var(--color-base-light); }
.rms-accent-red     { --rms-accent: var(--color-red);     --rms-accent-light: var(--color-red-light); }
.rms-accent-orange  { --rms-accent: var(--color-orange);  --rms-accent-light: var(--color-orange-light); }
.rms-accent-yellow  { --rms-accent: var(--color-yellow);  --rms-accent-light: var(--color-yellow-light); }
.rms-accent-green   { --rms-accent: var(--color-green);   --rms-accent-light: var(--color-green-light); }
.rms-accent-blue    { --rms-accent: var(--color-blue);    --rms-accent-light: var(--color-blue-light); }
.rms-accent-purple  { --rms-accent: var(--color-purple);  --rms-accent-light: var(--color-purple-light); }
.rms-accent-fuchsia { --rms-accent: var(--color-fuchsia); --rms-accent-light: var(--color-fuchsia-light); }

/* Narrow viewports · stack the nav over the content but keep the viewheight frame. */
@media (max-width: 720px) {
  .release-minisite {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 40%) 1fr;
  }
  .rms-nav {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>
