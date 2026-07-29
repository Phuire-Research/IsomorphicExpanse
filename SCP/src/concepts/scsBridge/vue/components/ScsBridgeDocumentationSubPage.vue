<script setup lang="ts">
/**
 * SCS-Bridge Documentation SubPage — Full Suite C280 · Pewter spec + Damascus copy.
 *
 * The systems under the A/B dock, rendered as reference + glossary. Static markdown
 * via `marked` (matching the SuiteCascade / Suite8 documentation render pipeline).
 * In-component topic registry (DOC_TOPICS + TOPIC_BODIES) so the doc set expands by
 * appending a chip + a keyed markdown body — a foundation that grows on release.
 *
 * The glossary card renders the five A/B dock buttons at reduced glow beside their
 * role + gate; the topic markdown OMITS a glossary list because the card supplies it.
 *
 * No animations anywhere on this page (Pewter spec).
 */
import { computed, ref } from 'vue';
import { marked } from 'marked';

interface DocTopic {
  id: string;
  label: string;
  accent: string;
}

const DOC_TOPICS: DocTopic[] = [
  { id: 'bridge-turn-over', label: 'Bridge Turn-Over', accent: 'amethyst' },
];

const props = defineProps<{ initialTopic?: string }>();

const activeTopic = ref<string>(
  props.initialTopic && DOC_TOPICS.some((t) => t.id === props.initialTopic)
    ? props.initialTopic
    : DOC_TOPICS[0].id,
);

function selectTopic(id: string): void {
  activeTopic.value = id;
}

// Keyed markdown bodies. The 'bridge-turn-over' body is the final approved Damascus
// copy — verbatim; it ends at "That is the whole machine." The glossary CARD below
// renders the button reference, so no '## Glossary' list appears in the body.
const TOPIC_BODIES: Record<string, string> = {
  'bridge-turn-over': `# The Bridge Turn-Over

## Your Workshop Is the Frontier

You are developing the tool you are standing in. The app on your screen is also your workshop — the place you do the work is the thing the work changes. That means every real change threatens the ground under your feet.

Version control alone does not save you here. Git protects the code's history. It does not protect your running session — the booted, living app you are actually working inside. You can have a perfect commit log and still be standing in a workshop that will not start.

The turn-over binds the two. It is the mechanism that lets you change the floor of the room you are standing in without ever falling through it.

And this matters most for AI-driven work. An agent's changes land at the exact edge where hallucination risk peaks — the code that is genuinely yours, the code with no ten thousand examples behind it. The turn-over is the containment vessel that lets an agent work at that edge without ever holding your stable ground hostage.

## The Two Slots: Stable Ground and the Dirty Frontier

There are two slots, and they do different jobs.

**A is the ground.** Press the Shield and your current branch is registered as A — the stable version, the one that is never gambled. A is not where ambition goes. A is what ambition returns to.

**B is where ambition goes.** When your working tree is dirty — when you or your agent have changed something real — press Turn Over A. A confirmation panel shows you what is about to happen. Confirm Move into B, and the machine does three things: forks a b/ branch, commits your changes onto it, and restarts the app on B.

Now you are standing on the frontier — the workshop running on the risky version — and A has not moved. Nothing you break out here can touch it.

## Boot Is the Proof

Here is the part that separates this from every green checkmark you have learned not to trust.

The test is not a claim. It is not a passing suite, not an agent reporting success, not you deciding it looks fine. The test is the boot. **If B boots, B is proven** — automatically, structurally, with no confirm gesture from you. The app either stands up or it does not, and the machine watched it happen.

That is Practice IS Proof made mechanical. Nothing gets to assert that it works. It has to run.

And you do not prove B once and stop. On B you keep working: edit, press Turn Over B, and the machine commits your latest work and boots it again. Every turn-over is a commit and a proof run in one gesture. The rhythm becomes the whole workflow — edit, turn over, proven. Edit, turn over, proven. The dread of *I hope this did not break everything* is replaced by a beat.

## The Purple Merge: When B Earns Its Ground

When B is proven and the tree is clean, the purple Merge button appears. It does not appear before that. You cannot promote hope.

Two clicks — one to arm, one to confirm — and B lands onto A. Your proven work becomes the ground. A stays A; it did not change roles, it gained territory. B did not get promoted by promise or by patience. It booted. It earned it.

Then the cycle starts again from a stronger floor.

## The Failsafe: No Gamble Is Permanent

And when B fails to boot — because eventually one will — the machine does not ask you what to do. A failsafe deadline runs, and when it expires the app reverts to A on its own. You were on the frontier; now you are back on solid ground, and you did nothing to get there.

The failed branch is not destroyed. Press the Sword and hop to a fresh B; the failing branch is stashed, never lost. You can return to it, mine it for what worked, or leave it. Either way it cannot pin you down.

Add it up and the arithmetic is the point: **the cost of trying something is always zero ground.** A is never gambled. B is always recoverable. The boot decides, the failsafe catches, the merge promotes. You can let an agent swing hard at the edge of what it knows, because the worst case was priced in before the first edit landed.

## Your Work Survives the Restart

A restart sounds like death and rebirth — and for the process, it is. But the app you are working in does not lose itself. Your session's state is a persistent throughline, and it survives by a relay of custody.

The app holds a durable identity, and the state rides that identity through both gaps. When the server restarts, the still-open page is the custodian: it reconnects to the reborn server and hands its state up before it refreshes. Then the page itself refreshes — and now the server is the custodian: the fresh page reconnects with the same identity, and the server hands the state back down. Each side carries the state across the other's death. Neither gap can drop it.

Only the application state makes the crossing — the working memory of the app itself. The page furniture rebuilds fresh: menus and open views re-derive what they show from the state that survived. What matters persists; what displays recomputes.

And when something has gone genuinely wrong — a lock-up, a state that will not settle — the hard turn-over is the other tool. It comes back clean on purpose: a full reset carried by the outer tool system instead of the state relay. Carrying your state is the default. The clean slate is the escape hatch, and you choose when to pull it.

Edit, turn over, proven, merge. That is the whole machine.`,
};

const renderedTopicBody = computed<string>(() => {
  const source = TOPIC_BODIES[activeTopic.value] ?? '';
  return marked.parse(source, { async: false }) as string;
});

// The A/B dock button glossary — the five buttons quoted at reduced glow beside role + gate.
interface GlossaryRow {
  key: string;
  icon: string;
  name: string;
  role: string;
  gate: string;
  variant: 'accent' | 'prismatic';
  accentRgb?: string; // "r, g, b"
  iconColor?: string;
  floor?: string;
}

const GLOSSARY_ROWS: GlossaryRow[] = [
  {
    key: 'shield',
    icon: 'fa-solid fa-shield-halved',
    name: 'Guarded Stable A',
    role: 'The proven branch you never work on directly.',
    gate: 'Auto-registered at setup; press to re-register.',
    variant: 'accent',
    accentRgb: '19, 213, 148',
    iconColor: 'rgb(19, 213, 148)',
    floor: 'rgb(9, 14, 12)',
  },
  {
    key: 'turn-over-a',
    icon: 'fa-solid fa-arrow-right-from-bracket',
    name: 'Return to Proven',
    role: 'Turns the running app back over to the stable A; a dirty tree moves your work into a B first.',
    gate: 'A stable A is registered.',
    variant: 'accent',
    accentRgb: '19, 213, 148',
    iconColor: 'rgb(19, 213, 148)',
    floor: 'rgb(9, 14, 12)',
  },
  {
    key: 'sword',
    icon: 'fa-solid fa-khanda',
    name: 'Working B',
    role: 'Hops you to a fresh B when one goes bad; the failing branch is stashed, never lost.',
    gate: 'A working B exists.',
    variant: 'prismatic',
  },
  {
    key: 'turn-over-b',
    icon: 'fa-solid fa-arrow-right-to-bracket',
    name: 'Test Your Work',
    role: 'Commits your latest work on B and boots it — every turn-over is a commit and a proof run in one gesture.',
    gate: 'A working B exists — no B, no turn-over.',
    variant: 'accent',
    accentRgb: '234, 179, 8',
    iconColor: 'rgb(255, 206, 9)',
    floor: 'rgb(15, 12, 6)',
  },
  {
    key: 'merge',
    icon: 'fa-solid fa-code-merge',
    name: 'Land the Proven Work',
    role: 'Lands the proven B onto the guarded stable A; A stays the ground.',
    gate: 'B proven: boots clean, nothing still primed, last turn-over succeeded.',
    variant: 'accent',
    accentRgb: '168, 85, 247',
    iconColor: 'rgb(193, 98, 255)',
    floor: 'rgb(13, 9, 18)',
  },
];

function chipStyle(row: GlossaryRow): Record<string, string> {
  if (row.variant === 'prismatic') {
    return {
      background:
        'linear-gradient(rgb(12,10,14), rgb(12,10,14)) padding-box, conic-gradient(rgb(255,90,160), rgb(255,200,60), rgb(90,230,160), rgb(80,180,255), rgb(180,120,255), rgb(255,90,160)) border-box',
      border: '1px solid transparent',
      'box-shadow':
        '0 0 8px 1px rgba(180,120,255,0.30), 0 0 12px 2px rgba(80,180,255,0.18)',
    };
  }
  const a = row.accentRgb as string;
  return {
    background: `radial-gradient(ellipse at 38% 30%, rgba(${a}, 0.12) 0%, transparent 62%), ${row.floor as string}`,
    border: `1px solid rgba(${a}, 0.45)`,
    'box-shadow': `0 0 6px 0 rgba(${a}, 0.18), inset 0 0 6px 0 rgba(${a}, 0.08)`,
  };
}

function iconStyle(row: GlossaryRow): Record<string, string> {
  if (row.variant === 'prismatic') {
    return {
      color: 'rgb(245, 245, 255)',
      'text-shadow':
        '0 0 4px rgba(255,120,200,0.35), 0 0 7px rgba(120,200,255,0.25)',
    };
  }
  return { color: row.iconColor as string };
}

function nameStyle(row: GlossaryRow): Record<string, string> {
  if (row.variant === 'prismatic') {
    return {
      color: 'rgb(245, 245, 255)',
      'text-shadow': '0 0 5px rgba(180, 120, 255, 0.4)',
    };
  }
  const a = row.accentRgb as string;
  return {
    color: row.iconColor as string,
    'text-shadow': `0 0 5px rgba(${a}, 0.4)`,
  };
}

function chipClassStyle(row: GlossaryRow): Record<string, string> {
  return chipStyle(row);
}
</script>

<template>
  <section class="scs-bridge-documentation-subpage">
    <!-- Header pane -->
    <div class="doc-head-pane hifi-pane-amethyst">
      <h1 class="hifi-heading doc-head-title">SCS-Bridge Documentation</h1>
      <p class="doc-head-subtitle">
        The systems under the dock — reference &amp; glossary
      </p>
    </div>

    <!-- Topic chips (extensible registry) -->
    <div class="doc-topic-row">
      <button
        v-for="topic in DOC_TOPICS"
        :key="topic.id"
        type="button"
        class="doc-topic-chip"
        :class="{ 'is-active': topic.id === activeTopic }"
        @click="selectTopic(topic.id)"
      >
        {{ topic.label }}
      </button>
    </div>

    <!-- Prose card -->
    <div class="doc-card hifi-pane-amethyst">
      <div class="hifi-stamp doc-stamp">
        <div class="doc-markdown-body" v-html="renderedTopicBody" />
      </div>
    </div>

    <!-- Glossary card -->
    <div class="doc-card hifi-pane-amethyst">
      <div class="hifi-stamp doc-stamp">
        <h2 class="hifi-heading doc-glossary-title">The A/B Dock — Button Reference</h2>
        <div class="doc-glossary-list">
          <div v-for="row in GLOSSARY_ROWS" :key="row.key" class="doc-glossary-row">
            <span class="doc-glossary-chip" :style="chipClassStyle(row)">
              <i :class="row.icon" :style="iconStyle(row)" />
            </span>
            <div class="doc-glossary-body">
              <span class="doc-glossary-name" :style="nameStyle(row)">{{ row.name }}</span>
              <span class="doc-glossary-role">{{ row.role }}</span>
              <span class="doc-glossary-gate">GATE · {{ row.gate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scs-bridge-documentation-subpage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header pane */
.doc-head-pane {
  border-radius: 8px;
  overflow: hidden;
  padding: 1rem 1.25rem;
}

.doc-head-title {
  font-size: 1.05rem;
  display: block;
  margin: 0;
}

.doc-head-subtitle {
  margin: 0.4rem 0 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.78rem;
  color: rgba(230, 226, 218, 0.75);
}

/* Topic chips */
.doc-topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.doc-topic-chip {
  clip-path: polygon(
    6px 0,
    calc(100% - 6px) 0,
    100% 6px,
    100% calc(100% - 6px),
    calc(100% - 6px) 100%,
    6px 100%,
    0 calc(100% - 6px),
    0 6px
  );
  padding: 0.3rem 0.9rem;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  background: rgb(13, 9, 18);
  border: 1px solid rgba(168, 85, 247, 0.30);
  color: rgba(216, 160, 255, 0.65);
}

.doc-topic-chip.is-active {
  border-color: rgba(193, 98, 255, 0.9);
  color: rgb(216, 160, 255);
  box-shadow: 0 0 8px 0 rgba(168, 85, 247, 0.30);
}

/* Cards */
.doc-card {
  border-radius: 8px;
  overflow: hidden;
  padding: 0.75rem;
}

.doc-stamp {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  max-height: 70vh;
  overflow-y: auto;
}

/* Prose */
.doc-markdown-body {
  max-width: 72ch;
  margin: 0 auto;
  line-height: 1.7;
  font-size: 0.9rem;
  color: rgba(230, 226, 218, 0.88);
}

.doc-markdown-body :deep(h1) {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0.85rem 0 0.5rem;
  font-size: 1.2rem;
  color: rgba(240, 240, 240, 0.92);
}

.doc-markdown-body :deep(h2) {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 1.1rem 0 0.5rem;
  font-size: 1.05rem;
  color: var(--color-amethyst-light);
}

.doc-markdown-body :deep(p) {
  margin: 0.55rem 0;
}

.doc-markdown-body :deep(strong) {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
}

.doc-markdown-body :deep(em) {
  color: rgba(230, 226, 218, 0.95);
  font-style: italic;
}

.doc-markdown-body :deep(code) {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.82em;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  padding: 1px 5px;
}

/* Glossary */
.doc-glossary-title {
  font-size: 0.9rem;
  display: block;
  margin: 0 0 0.75rem;
  color: var(--color-amethyst-light);
}

.doc-glossary-list {
  display: flex;
  flex-direction: column;
}

.doc-glossary-row {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 0.8rem;
  align-items: start;
  padding: 0.7rem 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.doc-glossary-row:last-child {
  border-bottom: none;
}

.doc-glossary-chip {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(
    6px 0,
    calc(100% - 6px) 0,
    100% 6px,
    100% calc(100% - 6px),
    calc(100% - 6px) 100%,
    6px 100%,
    0 calc(100% - 6px),
    0 6px
  );
  font-size: 0.9rem;
}

.doc-glossary-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.doc-glossary-name {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
}

.doc-glossary-role {
  font-size: 0.76rem;
  color: rgba(230, 226, 218, 0.85);
}

.doc-glossary-gate {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.68rem;
  color: rgba(230, 226, 218, 0.55);
}
</style>
