<script setup lang="ts">
/**
 * SuiteCascade Documentation SubPage — THE DOCUMENTATION SITE (C882 Macro)
 *
 * The sitelike sub-page: a three-section navigator (Documentation Base · Documentation
 * Local · Cascade Documentation) fed by GET /documentation-index, with each selection
 * fetching the FRESHEST markdown from disk via GET /documentation-doc and rendering it
 * through `marked` (the proven ACFR pipeline). The prior embedded Diamond-forms
 * reference now lives ON DISK at Cascades/Documentation/CASCADE-DIAMOND-FORMS.md
 * (the local section serves it) — the page renders reactively from the filesystem.
 *
 * Sections (the C882 geography):
 *   base    — the Base Cascade's Cascades/Documentation/ (the workspace)
 *   local   — THIS SCP's own Cascades/Documentation/ (cwd · the C465/C872 rule)
 *   cascade — the Cascade Commands, derived from the Base Project's .claude/ directory
 *
 * Design: Pewter Tessera in scope — HiFi panes, amethyst section identity, mono nav.
 * Citation: SuiteCascadeCascadeFiles.vue (marked render-pipeline bearing · B-2).
 */
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';

type DocEntry = { file: string; title: string };
type DocSection = { id: string; label: string; docs: DocEntry[] };

const sections = ref<DocSection[]>([]);
const activeSectionId = ref<string>('local');
const activeFile = ref<string>('');
const markdownSource = ref<string>('');
const loading = ref<boolean>(false);
const loadError = ref<string>('');

const activeSection = computed<DocSection | null>(
  () => sections.value.find((s) => s.id === activeSectionId.value) ?? null,
);
// C886 · NAV COLLAPSE — the doc bar folds to a rail; the reader takes the width.
const navCollapsed = ref<boolean>(false);

// C886 · SECTION ANCHORS — marked emits no heading ids; slugify every heading (GitHub style)
// so in-document links (#section) have a target, then the capture handler scrolls WITHIN the
// rendered article (no page jump).
function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/<[^>]+>/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}
function anchorizeHeadings(html: string): string {
  return html.replace(/<h([1-6])>([^<]*)<\/h\1>/g, (_m, lvl: string, text: string) =>
    `<h${lvl} id="${slugify(text)}">${text}</h${lvl}>`);
}
function onContentClick(e: MouseEvent): void {
  const a = (e.target as HTMLElement).closest?.('a');
  if (!a) return;
  const href = a.getAttribute('href') ?? '';
  if (!href.startsWith('#')) return;
  e.preventDefault();
  const id = decodeURIComponent(href.slice(1));
  const host = (e.currentTarget as HTMLElement);
  const target = host.querySelector(`[id="${id}"]`) ?? host.querySelector(`[id="${slugify(id)}"]`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// C884 · THE LETTER ROTATION — each doc's main header (h1, when present) wears a per-letter
// HiFi shadow cycling the same 1-7 spectrum (plain-text h1s only; a tagged h1 renders as-is).
function letterizeMainHeaders(html: string): string {
  return html.replace(/<h1([^>]*)>([^<]*)<\/h1>/g, (_m, attrs: string, text: string) => {
    let i = 0;
    const inner = text
      .split('')
      .map((ch) => {
        if (ch.trim() === '') return ch;
        const n = (i++ % 7) + 1;
        return `<span class="hrot-${n}">${ch}</span>`;
      })
      .join('');
    return `<h1${attrs} class="hrot-head">${inner}</h1>`;
  });
}
const rendered = computed<string>(() =>
  markdownSource.value
    ? letterizeMainHeaders(anchorizeHeadings(marked.parse(markdownSource.value, { async: false }) as string))
    : '',
);

async function loadIndex(): Promise<void> {
  try {
    const r = await fetch('/documentation-index');
    if (!r.ok) return;
    const j = (await r.json()) as { sections?: DocSection[] };
    sections.value = Array.isArray(j.sections) ? j.sections : [];
    const withDocs = sections.value.find((s) => s.id === activeSectionId.value && s.docs.length > 0)
      ?? sections.value.find((s) => s.docs.length > 0);
    if (withDocs) {
      activeSectionId.value = withDocs.id;
      if (!activeFile.value && withDocs.docs.length > 0) void openDoc(withDocs.docs[0].file);
    }
  } catch { /* index absent → the empty state renders honestly */ }
}

function selectSection(id: string): void {
  activeSectionId.value = id;
  activeFile.value = '';
  markdownSource.value = '';
  loadError.value = '';
  const first = sections.value.find((s) => s.id === id)?.docs[0];
  if (first) void openDoc(first.file);
}

async function openDoc(file: string): Promise<void> {
  loading.value = true;
  loadError.value = '';
  activeFile.value = file;
  try {
    const r = await fetch(
      `/documentation-doc?section=${encodeURIComponent(activeSectionId.value)}&file=${encodeURIComponent(file)}`,
    );
    if (!r.ok) { loadError.value = `Could not read ${file}`; markdownSource.value = ''; return; }
    const j = (await r.json()) as { markdown?: string };
    markdownSource.value = typeof j.markdown === 'string' ? j.markdown : '';
  } catch {
    loadError.value = `Could not read ${file}`;
    markdownSource.value = '';
  } finally {
    loading.value = false;
  }
}

// C884 · the pill classes — the elements REMUXIFY their respective HiFi panels.
const SECTION_PILL: Record<string, string> = { base: 'hifi-btn-red', local: 'hifi-btn-yellow', cascade: 'hifi-btn-blue' };
const ROT_SPECTRUM = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'fuchsia'];
function sectionPill(id: string): string { return SECTION_PILL[id] ?? 'hifi-btn-red'; }
function rotPill(i: number): string { return `hifi-btn-${ROT_SPECTRUM[i % 7]}`; }
// C888 · the HiFi suite MOTIF GLYPHS (frame · radial · grid · branch · compass · node · petal)
// — the collapsed rail renders each doc as its rotation glyph in its rotation color.
const ROT_GLYPHS = ['\u25c6', '\u2726', '\u25a6', '\u2325', '\u271a', '\u25c9', '\u274b'];
function rotGlyph(i: number): string { return ROT_GLYPHS[i % 7]; }

onMounted(() => { void loadIndex(); });
</script>

<template>
  <section class="suitecascade-documentation-subpage">
    <div class="docsite hifi-pane-mux">
      <div class="docsite-header">
        <span class="hifi-heading docsite-title">Documentation</span>
        <span class="hifi-label docsite-sub">Base · Local · Cascade — rendered fresh from disk</span>
        <div class="hifi-embossed-amethyst" style="margin-top: 0.4rem;" />
      </div>

      <nav class="docsite-sections">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          :class="['hifi-btn', sectionPill(s.id), 'docsite-section-btn', `docsite-section--${s.id}`, { active: s.id === activeSectionId }]"
          @click="selectSection(s.id)"
        >
          {{ s.label }}
          <span class="docsite-count">{{ s.docs.length }}</span>
        </button>
      </nav>

      <div :class="['docsite-body', { 'nav-collapsed': navCollapsed }]">
        <aside class="docsite-nav custom-scrollbar">
          <!-- C892 · THE SAME COMPONENT as the Shell's C457 UnExpand bar — angles flanking the
               label; collapsed shows the expansion angles alone (the label folds via CSS). -->
          <button
            type="button"
            class="docsite-nav-toggle hifi-btn hifi-btn-base"
            :title="navCollapsed ? 'Expand the document bar' : 'Collapse the document bar'"
            @click="navCollapsed = !navCollapsed"
          >
            <i :class="navCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"></i>
            <span class="toggle-type">DOCUMENTS</span>
            <i v-show="!navCollapsed" class="fa-solid fa-angles-left"></i>
          </button>
          <p v-if="!navCollapsed && (!activeSection || activeSection.docs.length === 0)" class="docsite-empty">
            (no documents in this section yet)
          </p>
          <button
            v-for="(d, i) in activeSection?.docs ?? []"
            :key="d.file"
            type="button"
            :class="['hifi-btn', rotPill(i), 'docsite-doc-btn', `rot-${(i % 7) + 1}`, { active: d.file === activeFile }]"
            :title="d.title"
            @click="openDoc(d.file)"
          >
            <span class="docsite-doc-glyph" aria-hidden="true">{{ rotGlyph(i) }}</span>
            <span v-show="!navCollapsed" class="docsite-doc-title">{{ d.title }}</span>
            <span v-show="!navCollapsed" class="docsite-doc-file mono">{{ d.file }}</span>
          </button>
        </aside>

        <article class="docsite-content hifi-stamp custom-scrollbar" @click="onContentClick($event)">
          <p v-if="loading" class="docsite-empty">Reading from disk…</p>
          <p v-else-if="loadError" class="docsite-empty">{{ loadError }}</p>
          <div v-else-if="rendered" class="doc-markdown-body" v-html="rendered" />
          <p v-else class="docsite-empty">Select a document.</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.suitecascade-documentation-subpage { display: flex; flex-direction: column; gap: 1rem; }
.docsite { border-radius: 8px; overflow: hidden; padding: 0.75rem; }
.docsite-header { padding: 0 0.25rem 0.5rem; }
.docsite-sub { display: block; margin-top: 0.25rem; opacity: 0.75; }
.docsite-sections { display: flex; gap: 0.5rem; padding: 0.25rem 0.25rem 0.75rem; flex-wrap: wrap; }
.docsite-section-btn {
  cursor: pointer;
  font: inherit;
  padding: 0.4rem 0.8rem;
}
.docsite-section-btn.active { outline: 2px solid var(--sect-comp); outline-offset: 1px; }
.docsite-count { opacity: 0.6; margin-left: 0.4rem; font-size: 0.75em; }
.docsite-body { display: flex; gap: 0.75rem; align-items: stretch; min-height: 340px; }
.docsite-nav {
  flex: 0 0 240px; max-height: 65vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 0.35rem; padding-right: 0.25rem;
  transition: flex-basis 0.2s ease;
}
/* C886 · the collapsed rail — the bar folds to the toggle; the reader takes the width. */
.docsite-body.nav-collapsed .docsite-nav { flex: 0 0 42px; overflow-y: auto; overflow-x: hidden; }
/* C888 · the collapsed rail — every doc repeats as its HiFi suite glyph (rotation color · pill kept). */
.docsite-doc-glyph { display: none; }
.docsite-body.nav-collapsed .docsite-doc-glyph {
  display: block;
  color: var(--rot);
  text-shadow: 0 0 6px color-mix(in srgb, var(--rot) 65%, transparent);
  font-size: 1.45rem;
  line-height: 1;
}
/* C889 · the glyphs STAND APART — no HiFi panel behind them when collapsed: the pill chrome
   strips away and the motif carries the color alone, at size. */
.docsite-body.nav-collapsed .docsite-doc-btn {
  padding: 0.3rem 0;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.docsite-body.nav-collapsed .docsite-doc-btn:hover { transform: scale(1.15); }
.docsite-body.nav-collapsed .docsite-doc-btn.active { outline: none; }
.docsite-body.nav-collapsed .docsite-doc-btn.active .docsite-doc-glyph {
  text-shadow: 0 0 8px var(--rot-comp), 0 0 3px var(--rot);
}
/* C890 · ONE BAR, BOTH STATES — the expansion bar IS the unexpand bar of the rotary nav
   sidebar: a full-width slim bar riding the rail's width in either state. */
.docsite-nav-toggle {
  cursor: pointer;
  font: inherit;
  padding: 0.25rem 0;
  width: 100%;
  line-height: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.toggle-type {
  font-family: 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}
/* C892 · collapsed = the expansion angles alone (the C457 Shell law: the label hides). */
.docsite-body.nav-collapsed .toggle-type { display: none; }
.docsite-body.nav-collapsed .docsite-nav-toggle { padding: 0.35rem 0; }
.docsite-doc-btn {
  cursor: pointer;
  font: inherit;
  text-align: left;
  padding: 0.5rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
}
.docsite-doc-btn.active { outline: 2px solid var(--rot-comp); outline-offset: 1px; }
.docsite-doc-title { font-size: 0.85rem; }
.docsite-doc-file { font-size: 0.65rem; opacity: 0.55; word-break: break-all; }
.docsite-content { flex: 1 1 auto; min-width: 0; max-height: 65vh; overflow-y: auto; }
/* C886 · READER'S WIDTH — the markdown measures ~78ch centered; fully expanded it reads
   like a site page, never spilling the bounds (min-width 0 guards the flex overflow). */
.doc-markdown-body { max-width: 78ch; margin: 0 auto; }
.docsite-empty { opacity: 0.6; font-style: italic; }
/* C883 · SECTION IDENTITY — Base=red · Local=yellow · Cascade=blue (HiFi Suite Colors). */
/* C885 · the COMPLEMENT law — selection borders wear the +3 spectrum offset of the element. */
.docsite-section--base { --sect: var(--color-red); --sect-comp: var(--color-green); }
.docsite-section--local { --sect: var(--color-yellow); --sect-comp: var(--color-purple); }
.docsite-section--cascade { --sect: var(--color-blue); --sect-comp: var(--color-red); }

/* C883 · THE NAV ROTATION — selections cycle the spectrum 1-7 (red orange yellow green blue purple fuchsia). */
.docsite-doc-btn.rot-1 { --rot: var(--color-red); --rot-comp: var(--color-green); }
.docsite-doc-btn.rot-2 { --rot: var(--color-orange); --rot-comp: var(--color-blue); }
.docsite-doc-btn.rot-3 { --rot: var(--color-yellow); --rot-comp: var(--color-purple); }
.docsite-doc-btn.rot-4 { --rot: var(--color-green); --rot-comp: var(--color-fuchsia); }
.docsite-doc-btn.rot-5 { --rot: var(--color-blue); --rot-comp: var(--color-red); }
.docsite-doc-btn.rot-6 { --rot: var(--color-purple); --rot-comp: var(--color-orange); }
.docsite-doc-btn.rot-7 { --rot: var(--color-fuchsia); --rot-comp: var(--color-yellow); }
.docsite-doc-btn.active .docsite-doc-title { color: var(--rot); }

/* C883 · THE MARKDOWN READOUT — every repeating element the markdown composes cycles the
   SAME 1-7 spectrum by its nth position; spacing opened for reading air. */
.doc-markdown-body { line-height: 1.65; }
.doc-markdown-body :deep(h1) { margin: 1.25rem 0 0.75rem; }
.doc-markdown-body :deep(h2) { margin: 1.5rem 0 0.6rem; }
.doc-markdown-body :deep(h3) { margin: 1.25rem 0 0.5rem; }
.doc-markdown-body :deep(p) { margin: 0.75rem 0; }
.doc-markdown-body :deep(ul), .doc-markdown-body :deep(ol) { margin: 0.75rem 0; padding-left: 1.5rem; }
.doc-markdown-body :deep(li) { margin: 0.35rem 0; }
.doc-markdown-body :deep(pre) { overflow-x: auto; padding: 0.75rem 0.9rem; margin: 1rem 0; border-radius: 6px; background: rgba(0, 0, 0, 0.35); }
.doc-markdown-body :deep(blockquote) { margin: 1rem 0; padding: 0.4rem 0.9rem; background: rgba(255, 255, 255, 0.03); }
.doc-markdown-body :deep(table) { border-collapse: collapse; margin: 1rem 0; }
.doc-markdown-body :deep(td), .doc-markdown-body :deep(th) { border: 1px solid rgba(255, 255, 255, 0.18); padding: 0.4rem 0.7rem; }
.doc-markdown-body :deep(h2:nth-of-type(7n+1)) { color: var(--color-red); }
.doc-markdown-body :deep(h2:nth-of-type(7n+2)) { color: var(--color-orange); }
.doc-markdown-body :deep(h2:nth-of-type(7n+3)) { color: var(--color-yellow); }
.doc-markdown-body :deep(h2:nth-of-type(7n+4)) { color: var(--color-green); }
.doc-markdown-body :deep(h2:nth-of-type(7n+5)) { color: var(--color-blue); }
.doc-markdown-body :deep(h2:nth-of-type(7n+6)) { color: var(--color-purple); }
.doc-markdown-body :deep(h2:nth-of-type(7n+7)) { color: var(--color-fuchsia); }
.doc-markdown-body :deep(h3:nth-of-type(7n+1)) { color: var(--color-red); }
.doc-markdown-body :deep(h3:nth-of-type(7n+2)) { color: var(--color-orange); }
.doc-markdown-body :deep(h3:nth-of-type(7n+3)) { color: var(--color-yellow); }
.doc-markdown-body :deep(h3:nth-of-type(7n+4)) { color: var(--color-green); }
.doc-markdown-body :deep(h3:nth-of-type(7n+5)) { color: var(--color-blue); }
.doc-markdown-body :deep(h3:nth-of-type(7n+6)) { color: var(--color-purple); }
.doc-markdown-body :deep(h3:nth-of-type(7n+7)) { color: var(--color-fuchsia); }
.doc-markdown-body :deep(li:nth-child(7n+1))::marker { color: var(--color-red); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+1) td:first-child) { border-left: 3px solid var(--color-red); }
.doc-markdown-body :deep(pre:nth-of-type(7n+1)) { border-left: 3px solid var(--color-red); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+1)) { border-left: 3px solid var(--color-red); }
.doc-markdown-body :deep(li:nth-child(7n+2))::marker { color: var(--color-orange); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+2) td:first-child) { border-left: 3px solid var(--color-orange); }
.doc-markdown-body :deep(pre:nth-of-type(7n+2)) { border-left: 3px solid var(--color-orange); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+2)) { border-left: 3px solid var(--color-orange); }
.doc-markdown-body :deep(li:nth-child(7n+3))::marker { color: var(--color-yellow); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+3) td:first-child) { border-left: 3px solid var(--color-yellow); }
.doc-markdown-body :deep(pre:nth-of-type(7n+3)) { border-left: 3px solid var(--color-yellow); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+3)) { border-left: 3px solid var(--color-yellow); }
.doc-markdown-body :deep(li:nth-child(7n+4))::marker { color: var(--color-green); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+4) td:first-child) { border-left: 3px solid var(--color-green); }
.doc-markdown-body :deep(pre:nth-of-type(7n+4)) { border-left: 3px solid var(--color-green); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+4)) { border-left: 3px solid var(--color-green); }
.doc-markdown-body :deep(li:nth-child(7n+5))::marker { color: var(--color-blue); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+5) td:first-child) { border-left: 3px solid var(--color-blue); }
.doc-markdown-body :deep(pre:nth-of-type(7n+5)) { border-left: 3px solid var(--color-blue); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+5)) { border-left: 3px solid var(--color-blue); }
.doc-markdown-body :deep(li:nth-child(7n+6))::marker { color: var(--color-purple); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+6) td:first-child) { border-left: 3px solid var(--color-purple); }
.doc-markdown-body :deep(pre:nth-of-type(7n+6)) { border-left: 3px solid var(--color-purple); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+6)) { border-left: 3px solid var(--color-purple); }
.doc-markdown-body :deep(li:nth-child(7n+7))::marker { color: var(--color-fuchsia); }
.doc-markdown-body :deep(tbody tr:nth-child(7n+7) td:first-child) { border-left: 3px solid var(--color-fuchsia); }
.doc-markdown-body :deep(pre:nth-of-type(7n+7)) { border-left: 3px solid var(--color-fuchsia); }
.doc-markdown-body :deep(blockquote:nth-of-type(7n+7)) { border-left: 3px solid var(--color-fuchsia); }
.docsite-content { padding: 1rem 1.4rem 1.5rem; }
/* C884 · the per-letter rotating header shadow (the main h1 of each rendered doc). */
.doc-markdown-body :deep(h1.hrot-head) { letter-spacing: 0.02em; }
.doc-markdown-body :deep(.hrot-1) { text-shadow: 0.09em 0.09em 0 var(--shadow-red, var(--color-red)); }
.doc-markdown-body :deep(.hrot-2) { text-shadow: 0.09em 0.09em 0 var(--shadow-orange, var(--color-orange)); }
.doc-markdown-body :deep(.hrot-3) { text-shadow: 0.09em 0.09em 0 var(--shadow-yellow, var(--color-yellow)); }
.doc-markdown-body :deep(.hrot-4) { text-shadow: 0.09em 0.09em 0 var(--shadow-green, var(--color-green)); }
.doc-markdown-body :deep(.hrot-5) { text-shadow: 0.09em 0.09em 0 var(--shadow-blue, var(--color-blue)); }
.doc-markdown-body :deep(.hrot-6) { text-shadow: 0.09em 0.09em 0 var(--shadow-purple, var(--color-purple)); }
.doc-markdown-body :deep(.hrot-7) { text-shadow: 0.09em 0.09em 0 var(--shadow-fuchsia, var(--color-fuchsia)); }
.mono { font-family: 'Courier New', monospace; }
</style>
