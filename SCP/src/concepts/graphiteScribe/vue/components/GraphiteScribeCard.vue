<script setup lang="ts">
/**
 * GraphiteScribeCard.vue — THE HERO PIPELINE CARD (MD-11 · D-EF-1 · the Entourage Forge Attend set)
 *
 * The Suite 8's FACE, REDESIGNED into a Pewter-framed HERO PIPELINE (SCP-Origin-inspired · OUR
 * build is the SIMPLIFIED variant — the reference's table STRUCTURE held, its Tailwind/emerald
 * idiom translated to scoped CSS on the SUITE ACCENT `var(--card-accent)`). The compact roster
 * face is UNCHANGED (character-over-background · the MD-5 idiom); the EXPANDED detail becomes the
 * pipeline: a HERO ROW → the SKILLS GRID (Expressions → Skills · click → EXPAND) → the compact
 * READER ROW (Instance/Conductor/Maintainer/Strategies — Skills leaves it for the grid).
 *
 * THE PIPELINE ANATOMY (expanded only):
 *   (1) THE HERO ROW    — a grid 1fr (mobile) → 3fr 1fr (≥640px). LEFT = THE HERO SECTION: the
 *       character portrait (the MD-4 /asset?ref= probe · character→logo→initials fallback) large,
 *       object-contain; beneath it HERO SELECTION + BACKGROUND SELECTION rows listing the S8's
 *       resolvable image assets (probed from a candidate ref set via /graphiteScribe/:name/asset?ref=).
 *       The picked hero swaps the portrait; the picked background sets the card backdrop (a dark
 *       gradient wash so text holds). Picks PERSIST client-side (localStorage `graphiteScribe-card:<name>`).
 *       Zero resolvable backgrounds → an honest empty note, no dead controls. RIGHT = THE CO-PANEL:
 *       the identity content (name · domain · protocol · the Instance snippet — the Definitions
 *       IDENTITY CONTENT idiom · mono/muted · NO lending/share controls).
 *   (2) THE SKILLS GRID — the full-width SKILLS TABLE: a 3-col grid (1→2→3 @640/1024) of skill
 *       CELLS, each an ICON (an `icon:` frontmatter line if the Skill carries it · else a
 *       deterministic per-skill FA glyph) + the skill name. CLICK → EXPAND: a full-width expansion
 *       row (the border-t divider anatomy) rendering the DIRECT READ-OUT of the Skill.md via the
 *       MD-4 GET /graphiteScribe/:name/skill/:skill route (pre · mono · scrollable · honest 404). One open
 *       at a time; click again anor Escape closes.
 *   (3) THE READER ROW  — Instance · Conductor · Maintainer · Strategies (Skills RETIRES into the
 *       grid) → each opens the same in-card reader pane (MD-4 route · 404 honest · never breaks).
 *
 * COMPACT vs EXPANDED: `compact` (roster mode) renders the character-over-background face + a click
 * affordance (emits `expand`); expanded renders the full pipeline. The landing owns the single-
 * expanded selection.
 *
 * Citation: DIAMOND-SCP-ACTUALIZATION-EPOCH.md §MD-11 · D-EF-1 (the Hero Pipeline · Expressions→Skills).
 * Citation: SCP-Origin GraphiteScribeSkillRow.vue / S8RDPanel.vue (the cell + hero-slot grid idiom · READ-ONLY).
 * Citation: graphiteScribeReaderPaths.model.ts (the MD-4 reader/asset routes this card consumes · D-RD-1/2).
 * Citation: deriveSuiteFromDomain.model.ts (the D9 derivation → `var(--color-{suite})` accent).
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import type { GraphiteScribeEntry } from '../../graphiteScribe.type';
import {
  deriveSuiteFromDomain,
  suitePaneClass,
  type SpectrumSuite,
} from '../../../../model/deriveSuiteFromDomain.model';

const props = withDefaults(
  defineProps<{
    entry: GraphiteScribeEntry;
    /** Optional domain word (the meaning source · overrides entry.description when meaningful). */
    domain?: string;
    /** Optional snippet carried from the roster (the first meaningful Instance.md line). */
    snippet?: string;
    /** Roster mode = compact face (no pipeline); expanded = the full Hero Pipeline + readers. */
    compact?: boolean;
  }>(),
  { domain: '', snippet: '', compact: false },
);

// W3 · the 'collapse' emit is pruned with the Close card button — the Card tab owns closing now.
const emit = defineEmits<{
  (e: 'expand', name: string): void;
}>();

// ============================================
// W2 · THE SPA-HTML FALLBACK GUARD — the card's doc fetches use the RENAME-PROOF /s8/:name/… prefix
// (C370-B): the string `s8` carries no `graphiteScribe`/`GraphiteScribe` token, so `graphiteScribe:page`'s copy-move-rename
// can NEVER rewrite it — a GENERATED page keeps a working reader family (the routes live in the
// shared `vue` concept, aliased under both /graphiteScribe AND /s8). This guard still stands belt-and-braces:
// any unrouted GET (e.g. a stale prefix on an old install)
// returns the SPA SHELL: HTTP 200 + a text/html body starting '<!DOCTYPE html>' / '<html'. r.ok is
// TRUE, so a naive read renders the raw SPA HTML into the card. This guard treats an HTML-shell
// response as ABSENT (the honest empty note), so a doc read NEVER leaks the SPA shell as content.
//
// It also catches a genuine 404 whose body an upstream rewrote to HTML. Markdown docs are served
// text/markdown; JSON listings application/json — neither trips this. Returns null on HTML-shell.
function looksLikeSpaShell(contentType: string, body: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes('text/html')) return true;
  if (!ct.includes('markdown') && !ct.includes('json') && !ct.includes('text/plain')) {
    return /^\s*<(?:!doctype\s+html|html[\s>])/i.test(body);
  }
  return false;
}

/** Fetch a doc route; return its text ONLY when it is a real doc (not the SPA HTML shell). null = absent. */
async function fetchDocText(url: string): Promise<string | null> {
  const r = await fetch(url, { headers: { Accept: 'text/markdown, text/plain, */*' } });
  if (!r.ok) return null; // honest 404 → absent
  const body = await r.text();
  if (looksLikeSpaShell(r.headers.get('content-type') ?? '', body)) return null; // SPA shell → absent
  return body;
}

/** Fetch a JSON listing route; return the parsed array ONLY when it is real JSON (not the SPA shell). */
async function fetchJsonArray<T>(url: string): Promise<T[] | null> {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) return null;
  const ct = (r.headers.get('content-type') ?? '').toLowerCase();
  const body = await r.text();
  if (looksLikeSpaShell(ct, body)) return null; // unrouted → SPA shell → absent
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null; // non-JSON body (e.g. an HTML shell that slipped the content-type check) → absent
  }
}

// --- THE BACKGROUND · D9 derivation. Domain is the meaning source; entry.description carries the
// domain word (or the 'Suite 8' placeholder → base neutral).
const domainWord = computed<string>(() => {
  const d = (props.domain ?? '').trim();
  if (d.length > 0) return d;
  const desc = (props.entry.description ?? '').trim();
  return desc.length > 0 ? desc : '';
});

const derivedSuite = computed<SpectrumSuite>(() =>
  deriveSuiteFromDomain(props.entry.name, domainWord.value),
);
const paneClass = computed<string>(() => suitePaneClass(derivedSuite.value));
const textShadowClass = computed<string>(() => `text-shadow-${derivedSuite.value}`);
const readerBtnClass = computed<string>(() => `hifi-btn-${derivedSuite.value}`);
// The suite accent bound onto a scoped custom property → every pipeline rule reads var(--card-accent).
const accentStyle = computed(() => ({ '--card-accent': `var(--color-${derivedSuite.value})` }));

// ============================================
// PERSISTENCE · localStorage `graphiteScribe-card:<name>` (the honest first pass · server-side follow-up)
// ============================================
interface CardPrefs {
  hero?: string;
  background?: string;
}
const storageKey = computed<string>(() => `graphiteScribe-card:${props.entry.name}`);

function loadPrefs(): CardPrefs {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(storageKey.value);
    return raw ? (JSON.parse(raw) as CardPrefs) : {};
  } catch {
    return {}; // SSR / disabled storage / malformed → no prefs (the card still renders).
  }
}

function savePrefs(prefs: CardPrefs) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storageKey.value, JSON.stringify(prefs));
  } catch {
    /* SSR / disabled storage → the pick is session-only (never breaks) */
  }
}

const pickedHero = ref<string>('');
const pickedBackground = ref<string>('');

// ============================================
// ASSET PROBE · the candidate ref set (/graphiteScribe/:name/asset?ref=<ref>)
// ============================================
// The candidate set we probe for resolvable images. HERO candidates seed the portrait + the hero
// selection; BACKGROUND candidates seed the backdrop selection. A ref RESOLVES iff its image loads.
const HERO_CANDIDATE_REFS = ['character', 'hero', 'logo'] as const;
const BG_CANDIDATE_REFS = ['background', 'backdrop', 'scene', 'hero'] as const;

function assetUrlFor(ref: string): string {
  return `/s8/${encodeURIComponent(props.entry.name)}/asset?ref=${encodeURIComponent(ref)}`;
}

const resolvedHeroRefs = ref<string[]>([]);
const resolvedBgRefs = ref<string[]>([]);
const assetProbeDone = ref<boolean>(false);

/** Probe a ref by loading its image; resolves true iff the browser fetched a real image. */
function probeAssetRef(ref: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(false); // SSR → no probing (the fallback renders)
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = assetUrlFor(ref);
  });
}

async function probeAssets() {
  assetProbeDone.value = false;
  const heroHits: string[] = [];
  const bgHits: string[] = [];
  await Promise.all([
    ...HERO_CANDIDATE_REFS.map(async (r) => {
      if (await probeAssetRef(r)) heroHits.push(r);
    }),
    ...BG_CANDIDATE_REFS.map(async (r) => {
      if (await probeAssetRef(r)) bgHits.push(r);
    }),
  ]);
  // Preserve the candidate order (stable pick cells) rather than the race-completion order.
  resolvedHeroRefs.value = HERO_CANDIDATE_REFS.filter((r) => heroHits.includes(r));
  resolvedBgRefs.value = BG_CANDIDATE_REFS.filter((r) => bgHits.includes(r));
  assetProbeDone.value = true;

  // Reconcile the stored picks against what actually resolves (a stale pick that 404s → cleared).
  const prefs = loadPrefs();
  pickedHero.value =
    prefs.hero && resolvedHeroRefs.value.includes(prefs.hero)
      ? prefs.hero
      : resolvedHeroRefs.value[0] ?? '';
  pickedBackground.value =
    prefs.background && resolvedBgRefs.value.includes(prefs.background) ? prefs.background : '';
}

// --- THE PORTRAIT · the picked hero (else the first resolvable) with the INITIALS fallback.
const portraitFailed = ref<boolean>(false);
const portraitUrl = computed<string>(() => {
  const ref = pickedHero.value || resolvedHeroRefs.value[0] || 'character';
  return assetUrlFor(ref);
});

function onPortraitError() {
  portraitFailed.value = true;
}

// --- THE BACKDROP · the picked background as a wash-under layer (a dark gradient over the image).
const backdropStyle = computed(() => {
  if (!pickedBackground.value) return {};
  return {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.78)), url("${assetUrlFor(pickedBackground.value)}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
});

function pickHero(ref: string) {
  pickedHero.value = ref;
  portraitFailed.value = false;
  savePrefs({ hero: pickedHero.value, background: pickedBackground.value });
}

function pickBackground(ref: string) {
  // Toggle off when the picked background is clicked again (an honest clear · no dead control).
  pickedBackground.value = pickedBackground.value === ref ? '' : ref;
  savePrefs({ hero: pickedHero.value, background: pickedBackground.value });
}

// The suite-colored INITIALS (up to two leading word-initials of the name).
const initials = computed<string>(() => {
  const words = props.entry.name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
});

// ============================================
// THE SNIPPET · roster-carried first, else the fetched Instance.md line (MD-4 /instance).
// ============================================
const localSnippet = ref<string>(props.snippet ?? '');
const displaySnippet = computed<string>(() =>
  (props.snippet ?? '').trim().length > 0 ? (props.snippet as string) : localSnippet.value,
);

async function fetchSnippetIfNeeded() {
  if ((props.snippet ?? '').trim().length > 0 || localSnippet.value.length > 0) return;
  try {
    // W2 · guarded — the SPA-HTML shell (unrouted /{{concept}}/…/instance on a generated page)
    // returns null here, so the co-panel snippet is NEVER the raw '<!DOCTYPE html>' shell text.
    const text = await fetchDocText(`/s8/${encodeURIComponent(props.entry.name)}/instance`);
    if (text === null) return; // 404 / SPA shell → no snippet (honest silence · the card still renders)
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (t.length === 0 || t.startsWith('#') || t.startsWith('>')) continue;
      if (/^[-*=_]{3,}$/.test(t)) continue;
      const cleaned = t.replace(/^[-*]\s+/, '').replace(/^\*\*|\*\*$/g, '');
      localSnippet.value = cleaned.length > 200 ? `${cleaned.slice(0, 199)}…` : cleaned;
      break;
    }
  } catch {
    /* offline / SSR-guard → no snippet */
  }
}

// ============================================
// THE SKILLS GRID · listing (MD-4 /skills) + per-skill ICON derivation + click-to-EXPAND read-out.
// ============================================
interface SkillListItem {
  name: string;
  kind: 'flat' | 'dir';
  skillMdRelPath: string;
}
interface SkillCell {
  name: string;
  icon: string; // an FA class (fa-solid fa-…) — from frontmatter or the deterministic default.
}

const skills = ref<SkillCell[]>([]);
const skillsLoaded = ref<boolean>(false);

// The deterministic default glyph pool — a per-skill FA icon chosen by a stable name-hash so a
// Skill with no `icon:` frontmatter still gets a consistent glyph (never random, stable per name).
const DEFAULT_SKILL_GLYPHS: readonly string[] = [
  'fa-gear',
  'fa-flask',
  'fa-compass',
  'fa-bolt',
  'fa-cube',
  'fa-diagram-project',
  'fa-wand-magic-sparkles',
  'fa-scroll',
  'fa-microscope',
  'fa-puzzle-piece',
  'fa-shield-halved',
  'fa-satellite-dish',
];

function hashIndex(text: string, mod: number): number {
  let sum = 0;
  for (let i = 0; i < text.length; i++) sum = (sum + text.charCodeAt(i)) % 1_000_000;
  return sum % mod;
}

function defaultGlyphFor(name: string): string {
  return `fa-solid ${DEFAULT_SKILL_GLYPHS[hashIndex(name, DEFAULT_SKILL_GLYPHS.length)]}`;
}

// Read an `icon:` line from a Skill's frontmatter/body (e.g. `icon: fa-solid fa-flask`). Accepts a
// bare `fa-…` token (we prefix fa-solid) or a full `fa-solid fa-…`. Absent → null (→ the default).
function parseIconLine(md: string): string | null {
  for (const raw of md.split('\n', 40)) {
    const m = raw.match(/^\s*(?:[-*]\s*)?\**icon\**\s*[:=]\s*(.+?)\s*$/i);
    if (!m) continue;
    const val = m[1].replace(/[`"']/g, '').trim();
    if (!val) continue;
    if (/^fa-(solid|regular|brands|light|thin|duotone)\b/.test(val)) return val;
    if (/^fa-/.test(val)) return `fa-solid ${val.split(/\s+/)[0]}`;
    return null; // an unrecognised value → the deterministic default (never inject arbitrary text)
  }
  return null;
}

async function resolveSkillIcon(item: SkillListItem): Promise<string> {
  // Probe the Skill's own frontmatter for an `icon:` line; fall back deterministically on any miss.
  try {
    const text = await fetchDocText(
      `/s8/${encodeURIComponent(props.entry.name)}/skill/${encodeURIComponent(item.name)}`,
    );
    if (text !== null) {
      const parsed = parseIconLine(text);
      if (parsed) return parsed;
    }
  } catch {
    /* offline / 404 / SPA shell → the deterministic default */
  }
  return defaultGlyphFor(item.name);
}

async function loadSkills() {
  if (skillsLoaded.value) return;
  try {
    // W2 · guarded — the SPA-HTML shell (unrouted listing on a generated page) → null → empty grid.
    const list = await fetchJsonArray<SkillListItem>(
      `/s8/${encodeURIComponent(props.entry.name)}/skills`,
    );
    if (list === null) {
      skills.value = [];
      skillsLoaded.value = true;
      return;
    }
    const arr = list;
    // Resolve every cell's icon in parallel (frontmatter probe · deterministic fallback).
    const cells = await Promise.all(
      arr.map(async (item) => ({ name: item.name, icon: await resolveSkillIcon(item) })),
    );
    skills.value = cells;
  } catch {
    skills.value = [];
  } finally {
    skillsLoaded.value = true;
  }
}

// The single expanded skill + its read-out (the DIRECT Skill.md via MD-4 /skill/:skill).
const expandedSkill = ref<string | null>(null);
const skillReadBusy = ref<boolean>(false);
const skillReadContent = ref<string>('');
const skillReadAbsent = ref<boolean>(false);

async function toggleSkill(name: string) {
  if (expandedSkill.value === name) {
    expandedSkill.value = null; // click again → close
    return;
  }
  expandedSkill.value = name;
  skillReadBusy.value = true;
  skillReadAbsent.value = false;
  skillReadContent.value = '';
  try {
    // W2 · guarded — SPA-HTML shell → null → the honest absent note (never the raw shell in the pre).
    const text = await fetchDocText(
      `/s8/${encodeURIComponent(props.entry.name)}/skill/${encodeURIComponent(name)}`,
    );
    if (text === null) {
      skillReadAbsent.value = true; // honest 404 / SPA shell (the route never breaks the card)
      return;
    }
    skillReadContent.value = text;
    skillReadAbsent.value = skillReadContent.value.trim().length === 0;
  } catch {
    skillReadAbsent.value = true;
  } finally {
    skillReadBusy.value = false;
  }
}

// ============================================
// THE STRATEGIES GRID · listing (MD-4 /strategies) + click-to-EXPAND read-out. Strategies carry NO
// `icon:` frontmatter → the SAME deterministic hash-glyph pool applies directly (no per-file probe).
// ============================================
interface StrategyListItem {
  name: string;
  file: string;
}
interface StrategyCell {
  name: string;
  icon: string; // the deterministic per-name FA glyph (strategies carry no frontmatter icon).
}

const strategies = ref<StrategyCell[]>([]);
const strategiesLoaded = ref<boolean>(false);

async function loadStrategies() {
  if (strategiesLoaded.value) return;
  try {
    // W2 · guarded — the SPA-HTML shell (unrouted listing on a generated page) → null → empty grid.
    const list = await fetchJsonArray<StrategyListItem>(
      `/s8/${encodeURIComponent(props.entry.name)}/strategies`,
    );
    if (list === null) {
      strategies.value = [];
      strategiesLoaded.value = true;
      return;
    }
    const arr = list;
    // The hash-glyph pool applies directly — a stable per-name FA glyph (never random).
    strategies.value = arr.map((item) => ({ name: item.name, icon: defaultGlyphFor(item.name) }));
  } catch {
    strategies.value = [];
  } finally {
    strategiesLoaded.value = true;
  }
}

// The single expanded strategy + its read-out (the DIRECT file via MD-4 /strategy/:strat).
const expandedStrategy = ref<string | null>(null);
const stratReadBusy = ref<boolean>(false);
const stratReadContent = ref<string>('');
const stratReadAbsent = ref<boolean>(false);

async function toggleStrategy(name: string) {
  if (expandedStrategy.value === name) {
    expandedStrategy.value = null; // click again → close
    return;
  }
  expandedStrategy.value = name;
  stratReadBusy.value = true;
  stratReadAbsent.value = false;
  stratReadContent.value = '';
  try {
    // W2 · guarded — SPA-HTML shell → null → the honest absent note (never the raw shell in the pre).
    const text = await fetchDocText(
      `/s8/${encodeURIComponent(props.entry.name)}/strategy/${encodeURIComponent(name)}`,
    );
    if (text === null) {
      stratReadAbsent.value = true; // honest 404 / SPA shell (the route never breaks the card)
      return;
    }
    stratReadContent.value = text;
    stratReadAbsent.value = stratReadContent.value.trim().length === 0;
  } catch {
    stratReadAbsent.value = true;
  } finally {
    stratReadBusy.value = false;
  }
}

// ============================================
// THE READER ROW (Skills + Strategies RETIRED into their grids) + the in-card reader pane.
// ============================================
type ReaderKind = 'instance' | 'conductor' | 'maintainer';
const READER_ROW: ReadonlyArray<{ kind: ReaderKind; label: string }> = [
  { kind: 'instance', label: 'Instance' },
  { kind: 'conductor', label: 'Conductor' },
  { kind: 'maintainer', label: 'Maintainer' },
];

const activeReader = ref<ReaderKind | null>(null);
const readerBusy = ref<boolean>(false);
const readerContent = ref<string>('');
const readerAbsent = ref<boolean>(false);

function readerUrl(kind: ReaderKind): string {
  const base = `/s8/${encodeURIComponent(props.entry.name)}`;
  switch (kind) {
    case 'instance':
      return `${base}/instance`;
    case 'conductor':
      return `${base}/conductor`;
    case 'maintainer':
      return `${base}/maintainer`;
  }
}

async function openReader(kind: ReaderKind) {
  if (activeReader.value === kind) {
    activeReader.value = null; // toggle closed
    return;
  }
  activeReader.value = kind;
  readerBusy.value = true;
  readerAbsent.value = false;
  readerContent.value = '';
  try {
    // W2 · guarded — SPA-HTML shell → null → the honest absent note (never the raw shell in the pre).
    const text = await fetchDocText(readerUrl(kind));
    if (text === null) {
      readerAbsent.value = true; // 404 / SPA shell → the honest absent note
      return;
    }
    readerContent.value = text;
    readerAbsent.value = readerContent.value.trim().length === 0;
  } catch {
    readerAbsent.value = true; // network / offline → honest absent (never a broken card)
  } finally {
    readerBusy.value = false;
  }
}

const activeReaderLabel = computed<string>(
  () => READER_ROW.find((r) => r.kind === activeReader.value)?.label ?? '',
);

// The protocol / identity line for the co-panel (the Definitions IDENTITY CONTENT idiom).
const protocolLine = computed<string>(() => {
  const proto = (props.entry as { protocol?: string }).protocol;
  return typeof proto === 'string' && proto.trim().length > 0 ? proto.trim() : '';
});

function onCardClick() {
  if (props.compact) emit('expand', props.entry.name);
}

// Escape closes whichever detail is open (skill read-out → strategy read-out → reader pane).
function onKeydown(ev: KeyboardEvent) {
  if (ev.key !== 'Escape') return;
  if (expandedSkill.value) {
    expandedSkill.value = null;
  } else if (expandedStrategy.value) {
    expandedStrategy.value = null;
  } else if (activeReader.value) {
    activeReader.value = null;
  }
}

// Re-probe / re-load when the entry changes (card re-used across roster entries).
watch(
  () => props.entry.name,
  () => {
    portraitFailed.value = false;
    resolvedHeroRefs.value = [];
    resolvedBgRefs.value = [];
    pickedHero.value = '';
    pickedBackground.value = '';
    assetProbeDone.value = false;
    skills.value = [];
    skillsLoaded.value = false;
    expandedSkill.value = null;
    strategies.value = [];
    strategiesLoaded.value = false;
    expandedStrategy.value = null;
    activeReader.value = null;
    localSnippet.value = props.snippet ?? '';
    void fetchSnippetIfNeeded();
    if (!props.compact) {
      void probeAssets();
      void loadSkills();
      void loadStrategies();
    }
  },
);

onMounted(() => {
  void fetchSnippetIfNeeded();
  if (!props.compact) {
    void probeAssets();
    void loadSkills();
    void loadStrategies();
    window.addEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <article
    :class="['graphiteScribe-card', paneClass, { 'is-compact': compact, 'is-expanded': !compact }]"
    :data-suite="derivedSuite"
    :style="accentStyle"
    @click="onCardClick"
  >
    <!-- THE FRAME · the system logo mark in scope (the design language key · corner watermark) -->
    <img class="card-logo-mark" src="/scs-logo.png" alt="" aria-hidden="true" />

    <!-- ================= COMPACT ROSTER FACE (character over background · the MD-5 idiom) ============ -->
    <template v-if="compact">
      <div class="card-character">
        <img
          v-if="!portraitFailed"
          class="character-img"
          :src="portraitUrl"
          :alt="`${entry.name} character`"
          @error="onPortraitError"
        />
        <div v-else :class="['character-initials', textShadowClass]">
          <span class="hifi-heading">{{ initials }}</span>
        </div>
      </div>
      <div :class="['card-head', textShadowClass]">
        <h3 class="card-name hifi-heading">{{ entry.name }}</h3>
        <p v-if="domainWord" class="card-domain hifi-label">{{ domainWord }}</p>
        <p v-if="displaySnippet" class="card-snippet">{{ displaySnippet }}</p>
      </div>
      <div class="card-open-hint" aria-hidden="true"><span class="hifi-label">Open</span></div>
    </template>

    <!-- ================= EXPANDED · THE HERO PIPELINE ============================================= -->
    <template v-else>
      <div class="card-backdrop" :style="backdropStyle" aria-hidden="true"></div>

      <!-- (1) THE HERO ROW — 1fr → 3fr 1fr @640px -->
      <div class="hero-row">
        <!-- LEFT · THE HERO SECTION -->
        <section class="hero-section">
          <div class="hero-portrait">
            <img
              v-if="!portraitFailed && resolvedHeroRefs.length > 0"
              class="portrait-img"
              :src="portraitUrl"
              :alt="`${entry.name} hero`"
              @error="onPortraitError"
            />
            <div v-else :class="['portrait-initials', textShadowClass]">
              <span class="hifi-heading">{{ initials }}</span>
            </div>
          </div>

          <!-- HERO SELECTION -->
          <div class="select-block">
            <span class="select-label hifi-label">Hero Selection</span>
            <div v-if="resolvedHeroRefs.length > 0" class="pick-cells">
              <button
                v-for="ref in resolvedHeroRefs"
                :key="`hero-${ref}`"
                type="button"
                :class="['pick-cell', { 'pick-active': pickedHero === ref }]"
                :title="ref"
                @click.stop="pickHero(ref)"
              >
                <img class="pick-thumb" :src="assetUrlFor(ref)" :alt="ref" />
                <span class="pick-name">{{ ref }}</span>
              </button>
            </div>
            <p v-else-if="assetProbeDone" class="select-empty">No hero assets present.</p>
            <p v-else class="select-empty">Probing…</p>
          </div>

          <!-- BACKGROUND SELECTION -->
          <div class="select-block">
            <span class="select-label hifi-label">Background Selection</span>
            <div v-if="resolvedBgRefs.length > 0" class="pick-cells">
              <button
                v-for="ref in resolvedBgRefs"
                :key="`bg-${ref}`"
                type="button"
                :class="['pick-cell', { 'pick-active': pickedBackground === ref }]"
                :title="ref"
                @click.stop="pickBackground(ref)"
              >
                <img class="pick-thumb" :src="assetUrlFor(ref)" :alt="ref" />
                <span class="pick-name">{{ ref }}</span>
              </button>
            </div>
            <p v-else-if="assetProbeDone" class="select-empty">No background assets present.</p>
            <p v-else class="select-empty">Probing…</p>
          </div>
        </section>

        <!-- RIGHT · THE CO-PANEL (identity content · the Definitions idiom · no share controls) -->
        <aside :class="['co-panel', textShadowClass]">
          <h3 class="card-name hifi-heading">{{ entry.name }}</h3>
          <p v-if="domainWord" class="card-domain hifi-label">{{ domainWord }}</p>
          <p v-if="protocolLine" class="identity-content">{{ protocolLine }}</p>
          <p v-if="displaySnippet" class="identity-content identity-snippet">{{ displaySnippet }}</p>
        </aside>
      </div>

      <!-- (2) THE SKILLS GRID — Expressions → Skills · click → EXPAND -->
      <section class="skills-block">
        <span class="section-label hifi-label">Skills</span>
        <div v-if="skills.length > 0" class="skills-grid">
          <button
            v-for="s in skills"
            :key="s.name"
            type="button"
            :class="['skill-cell', { 'skill-open': expandedSkill === s.name }]"
            @click.stop="toggleSkill(s.name)"
          >
            <i class="skill-icon" :class="s.icon" aria-hidden="true"></i>
            <span class="skill-name">{{ s.name }}</span>
          </button>
        </div>
        <p v-else-if="skillsLoaded" class="section-empty">No Skills present for this Suite 8.</p>
        <p v-else class="section-empty">Reading Skills…</p>

        <!-- CLICK → EXPAND · the full-width read-out row (the border-t divider anatomy) -->
        <div v-if="expandedSkill" class="skill-readout" @click.stop>
          <div class="readout-head">
            <span class="readout-title hifi-label">{{ expandedSkill }}</span>
            <button type="button" class="readout-close" @click.stop="expandedSkill = null">×</button>
          </div>
          <div class="readout-body custom-scrollbar">
            <p v-if="skillReadBusy" class="reader-status">Reading…</p>
            <p v-else-if="skillReadAbsent" class="reader-status reader-absent">
              No content present for this Skill.
            </p>
            <pre v-else class="reader-content">{{ skillReadContent }}</pre>
          </div>
        </div>
      </section>

      <!-- (2b) THE STRATEGIES GRID — self-populating (MD-4 /strategies) · click → EXPAND -->
      <section class="skills-block">
        <span class="section-label hifi-label">Strategies</span>
        <div v-if="strategies.length > 0" class="skills-grid">
          <button
            v-for="s in strategies"
            :key="s.name"
            type="button"
            :class="['skill-cell', { 'skill-open': expandedStrategy === s.name }]"
            @click.stop="toggleStrategy(s.name)"
          >
            <i class="skill-icon" :class="s.icon" aria-hidden="true"></i>
            <span class="skill-name">{{ s.name }}</span>
          </button>
        </div>
        <p v-else-if="strategiesLoaded" class="section-empty">No Strategies present for this Suite 8.</p>
        <p v-else class="section-empty">Reading Strategies…</p>

        <!-- CLICK → EXPAND · the full-width read-out row (the border-t divider anatomy · own one-open) -->
        <div v-if="expandedStrategy" class="skill-readout" @click.stop>
          <div class="readout-head">
            <span class="readout-title hifi-label">{{ expandedStrategy }}</span>
            <button type="button" class="readout-close" @click.stop="expandedStrategy = null">×</button>
          </div>
          <div class="readout-body custom-scrollbar">
            <p v-if="stratReadBusy" class="reader-status">Reading…</p>
            <p v-else-if="stratReadAbsent" class="reader-status reader-absent">
              No content present for this Strategy.
            </p>
            <pre v-else class="reader-content">{{ stratReadContent }}</pre>
          </div>
        </div>
      </section>

      <!-- (3) THE READER ROW — the trio (Skills + Strategies retired into their grids) -->
      <div class="card-readers">
        <button
          v-for="r in READER_ROW"
          :key="r.kind"
          type="button"
          :class="['reader-btn', readerBtnClass, { 'reader-active': activeReader === r.kind }]"
          @click.stop="openReader(r.kind)"
        >
          {{ r.label }}
        </button>
      </div>

      <div v-if="activeReader" class="reader-pane" @click.stop>
        <div class="reader-pane-head">
          <span class="reader-pane-title hifi-label">{{ activeReaderLabel }}</span>
          <button type="button" class="reader-close" @click.stop="activeReader = null">×</button>
        </div>
        <div class="reader-pane-body custom-scrollbar">
          <p v-if="readerBusy" class="reader-status">Reading…</p>
          <p v-else-if="readerAbsent" class="reader-status reader-absent">
            No {{ activeReaderLabel }} present for this Suite 8.
          </p>
          <pre v-else class="reader-content">{{ readerContent }}</pre>
        </div>
      </div>
      <!-- W3 · THE 'Close card' BUTTON IS PRUNED — the card now lives inside the Card tab (the D-EF-0
           subnav); closing is the tab's job, not the card's. No in-card collapse control. -->
    </template>
  </article>
</template>

<style scoped>
.graphiteScribe-card {
  position: relative;
  border-radius: 10px;
  /* THE CHAMFERED / BEVELED PEWTER CARD IDIOM — clipped corners = the card-fan design key. */
  clip-path: polygon(
    0 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% 100%,
    14px 100%,
    0 calc(100% - 14px)
  );
  padding: 1rem 1.1rem 1.1rem;
  overflow: hidden;
  color: var(--color-white-conductor, #f0f0f0);
}

/* THE BACKDROP · the picked-background wash layer under the whole expanded card. */
.card-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* ---------- COMPACT ROSTER FACE (unchanged MD-5 idiom) ---------- */
.graphiteScribe-card.is-compact {
  cursor: pointer;
  min-height: 168px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.graphiteScribe-card.is-compact:hover {
  transform: translateY(-2px);
}

.card-logo-mark {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 26px;
  height: auto;
  opacity: 0.28;
  pointer-events: none;
  z-index: 3;
}

.card-character {
  position: absolute;
  bottom: 0;
  right: 8px;
  width: 40%;
  max-width: 128px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.character-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(-2px 4px 6px rgba(0, 0, 0, 0.55));
}

.character-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.22);
}

.character-initials .hifi-heading {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.card-head {
  position: relative;
  z-index: 2;
  max-width: 62%;
}

.card-name {
  font-size: 1.05rem;
  margin: 0 0 0.15rem;
  line-height: 1.15;
}

.card-domain {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.82);
  margin: 0 0 0.5rem;
}

.card-snippet {
  font-size: 0.8rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.card-open-hint {
  position: absolute;
  bottom: 8px;
  left: 12px;
  z-index: 2;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.55);
}

/* ---------- (1) THE HERO ROW ---------- */
.hero-row {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .hero-row {
    grid-template-columns: 3fr 1fr;
  }
}

.hero-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero-portrait {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  max-height: 240px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid color-mix(in srgb, var(--card-accent) 32%, transparent);
  padding: 0.6rem;
}

.portrait-img {
  max-width: 100%;
  max-height: 228px;
  object-fit: contain;
  filter: drop-shadow(-2px 4px 8px rgba(0, 0, 0, 0.6));
}

.portrait-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  border: 2px solid color-mix(in srgb, var(--card-accent) 45%, rgba(255, 255, 255, 0.2));
}

.portrait-initials .hifi-heading {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.select-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.select-label {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--card-accent) 60%, #ffffff);
}

.pick-cells {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pick-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  width: 56px;
  padding: 0.25rem;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.pick-cell:hover {
  border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
}

.pick-cell.pick-active {
  border-color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 18%, rgba(0, 0, 0, 0.4));
}

.pick-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.pick-name {
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.65);
}

.select-empty {
  margin: 0;
  font-size: 0.72rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
}

/* RIGHT · THE CO-PANEL (Definitions IDENTITY CONTENT idiom) */
.co-panel {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.identity-content {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.72rem;
  line-height: 1.5;
  color: rgba(220, 220, 220, 0.72);
  white-space: pre-wrap;
  word-break: break-word;
}

.identity-snippet {
  color: rgba(220, 220, 220, 0.9);
}

/* ---------- (2) THE SKILLS GRID ---------- */
.skills-block {
  position: relative;
  z-index: 2;
  margin-top: 1rem;
}

.section-label {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--card-accent) 60%, #ffffff);
  margin-bottom: 0.5rem;
}

.section-empty {
  margin: 0;
  font-size: 0.78rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
}

.skills-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .skills-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.skill-cell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.7rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.skill-cell:hover {
  border-color: color-mix(in srgb, var(--card-accent) 50%, transparent);
  background: color-mix(in srgb, var(--card-accent) 10%, rgba(0, 0, 0, 0.32));
}

.skill-cell.skill-open {
  border-color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 20%, rgba(0, 0, 0, 0.32));
}

.skill-icon {
  font-size: 0.95rem;
  color: color-mix(in srgb, var(--card-accent) 70%, #ffffff);
  width: 1.2rem;
  text-align: center;
  flex-shrink: 0;
}

.skill-name {
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* CLICK → EXPAND · the full-width read-out (the border-t divider anatomy) */
.skill-readout {
  margin-top: 0.6rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.62);
  border: 1px solid color-mix(in srgb, var(--card-accent) 30%, rgba(255, 255, 255, 0.12));
}

.readout-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.readout-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--card-accent) 55%, #ffffff);
}

.readout-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;
}

.readout-close:hover {
  color: #f3f4f6;
}

.readout-body {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.6rem;
}

/* ---------- (3) THE READER ROW ---------- */
.card-readers {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1rem;
}

.reader-btn {
  padding: 0.3rem 0.7rem;
  border-radius: 5px;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.reader-btn.reader-active {
  filter: brightness(1.12);
  outline: 1px solid rgba(255, 255, 255, 0.35);
}

.reader-pane {
  position: relative;
  z-index: 2;
  margin-top: 0.75rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.reader-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.reader-pane-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.75);
}

.reader-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;
}

.reader-close:hover {
  color: #f3f4f6;
}

.reader-pane-body {
  max-height: 280px;
  overflow-y: auto;
  padding: 0.6rem;
}

.reader-content {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(220, 220, 220, 0.9);
  white-space: pre-wrap;
  word-break: break-word;
}

.reader-status {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
}

.reader-status.reader-absent {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

</style>
