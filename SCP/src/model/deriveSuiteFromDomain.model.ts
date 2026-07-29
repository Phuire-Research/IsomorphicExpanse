/**
 * deriveSuiteFromDomain.model.ts — THE D9 SEMANTIC COLOR CASCADE for the Character-Forward Card
 * (MD-5 · Pewter D9 Law 1 DERIVATION).
 *
 * PURE module · zero Stratimux/Huirth/Vue/Express deps · CLI- and test-importable (the repo idiom ·
 * cf. suite8ReaderPaths.model.ts, scpConfig.model.ts). One pure TOTAL function maps a Suite 8's
 * DOMAIN identity → a spectrum SuiteName that keys its `.hifi-pane-{suite}` card background. There
 * is no second path by which a card acquires its color (D9 Law 1 · "one map, one place").
 *
 * THE DERIVATION SOURCE (D9 Law 1): the Suite 8's DOMAIN word (the Instance.md domain · the meaning
 * of what the Suite 8 DOES), falling back to the NAME. A minted Suite 8 with NO domain yet declared
 * derives the `base` NEUTRAL register — neutrality is itself a MARKED value (D9 Law 3), the honest
 * "domain-not-yet-declared" read, NOT an accident.
 *
 * THE TWO-STAGE DERIVATION (deterministic · pure):
 *   1. KEYWORD MAP — the domain/name lower-cased, scanned for the meaning-table keywords (the seven
 *      cognitive functions · Pewter Skill D9 Law 3 meaning table). A hit → that suite. This is the
 *      SEMANTIC path — a "curation" domain reads Curator-red, a "diagnosis" domain reads Clinician-
 *      fuchsia, forever (repetition-under-derivation · D9 Law 3).
 *   2. NAME-HASH FALLBACK — no keyword hit AND a non-empty domain/name → a deterministic char-sum
 *      hash into the seven CHROMATIC bands (red…fuchsia · cascade order). Same name → same color,
 *      always. The card is never colorless when it names something; the hash is stable, not random.
 *   3. GROUND — empty domain AND empty name → `base` (the minted default · the marked neutral).
 *
 * HUE-BAND INVARIANCE (D9 Law 2): every returned token is a member of the closed spectrum union;
 * the card consumes ONLY `var(--color-{suite})` via the `.hifi-pane-{suite}` class — no hardcoded
 * hex — so a root re-hue recascades the card instantly (the override chain survives).
 *
 * Citation: DIAMOND-SCP-ACTUALIZATION-EPOCH.md §MD-5 · the D9 semantic cascade.
 * Citation: Pewter Tessera Skill.md · D9 Law 1 DERIVATION (one pure total map + ground fallback) +
 *           Law 3 meaning table (the seven cognitive-function keywords).
 * Citation: SCP_ORIGIN/src/lib/suiteDerivation.ts (the pure-total-map + `?? 'base'` idiom).
 */

// ============================================
// THE CLOSED SPECTRUM UNION (D9 Law 1 · closed identity type)
// ============================================
// The seven chromatic registers in cascade order + the base neutral. Each keys a live
// `.hifi-pane-{suite}` class in style.css (D3). Closed union → every new derivation branch must
// name a valid suite at compile time (D9 Law 1 type-totality).
export type SpectrumSuite =
  | 'base'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'fuchsia';

/** The seven CHROMATIC registers, cascade order (red…fuchsia) — the name-hash fallback range. */
export const CHROMATIC_SUITES: readonly SpectrumSuite[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'fuchsia',
];

// ============================================
// STAGE 1 · THE KEYWORD MAP (D9 Law 3 meaning table · the semantic path)
// ============================================
// Domain/name keyword → the suite whose cognitive function OWNS that meaning. Order matters only
// for the scan (first hit wins); the keywords are the meaning-table's function verbs + synonyms.
// Each row cites its cognitive function so a NEW keyword is a semantic decision, never a color pick.
const KEYWORD_SUITE_MAP: ReadonlyArray<{ suite: SpectrumSuite; keywords: readonly string[] }> = [
  // 1 · Curator (red) — reading existing, cataloguing, inventory, curation.
  // NOTE: 'ledger'/'account' are Professional-blue (finance · Amber Ledger) — see the blue row.
  { suite: 'red', keywords: ['curat', 'catalog', 'inventor', 'archive', 'librar', 'record'] },
  // 2 · Prospector (orange) — discovery, research, naming the frontier, exploration, mining.
  { suite: 'orange', keywords: ['prospect', 'research', 'discover', 'explor', 'frontier', 'scout', 'mine', 'search'] },
  // 3 · Architect (yellow) — drafting, blueprints, design, planning, structure.
  { suite: 'yellow', keywords: ['architect', 'blueprint', 'draft', 'design', 'plan', 'structur', 'schema'] },
  // 4 · Sculptor (green) — analysis, examination, refinement, growth, visual assets, dialectic.
  { suite: 'green', keywords: ['sculpt', 'analy', 'examin', 'refine', 'dialect', 'visual', 'asset', 'grow'] },
  // 5 · Professional (blue) — implementation, building, resolution, engineering, finance/precision.
  { suite: 'blue', keywords: ['profession', 'implement', 'build', 'engineer', 'resolv', 'finance', 'account', 'ledger', 'craft'] },
  // 6 · Orchestrator (purple) — orchestration, sequencing, testing, play, coordination, conducting.
  { suite: 'purple', keywords: ['orchestrat', 'sequenc', 'conduct', 'operat', 'playtest', 'coordinat', 'compos'] },
  // 7 · Clinician (fuchsia) — diagnosis, healing, calibration, review, defeat reasoning, medicine.
  { suite: 'fuchsia', keywords: ['clinic', 'diagnos', 'heal', 'calibrat', 'review', 'medic', 'defeat', 'therap'] },
];

/** First keyword hit in `text` (already lower-cased) → its suite, else null. */
function matchKeywordSuite(text: string): SpectrumSuite | null {
  for (const row of KEYWORD_SUITE_MAP) {
    for (const kw of row.keywords) {
      if (text.includes(kw)) return row.suite;
    }
  }
  return null;
}

// ============================================
// STAGE 2 · THE NAME-HASH FALLBACK (deterministic · stable per name)
// ============================================
/**
 * Deterministic char-sum hash of `text` → an index into CHROMATIC_SUITES. Same input → same suite,
 * always (never random). Simple sum-of-charCodes mod 7 — stable, order-independent enough for a
 * cosmetic band assignment, zero deps.
 */
function hashToChromaticSuite(text: string): SpectrumSuite {
  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    sum = (sum + text.charCodeAt(i)) % 1_000_000;
  }
  return CHROMATIC_SUITES[sum % CHROMATIC_SUITES.length];
}

// ============================================
// THE PURE TOTAL DERIVATION (D9 Law 1)
// ============================================
/**
 * Derive a Suite 8's card SUITE from its `name` and optional `domain`. The DOMAIN is the primary
 * meaning source (falls back to the NAME when domain is absent/placeholder). Total:
 *   - keyword hit (domain then name) → that semantic suite
 *   - non-empty domain/name, no hit  → the deterministic name-hash chromatic suite
 *   - nothing meaningful             → 'base' (the marked neutral · the minted default)
 *
 * @param name   the Suite 8 NDEP name (directory-entry name).
 * @param domain optional domain word (the Instance.md §Domain · the meaning of what it does).
 */
export function deriveSuiteFromDomain(name: string, domain?: string): SpectrumSuite {
  const domainText = (domain ?? '').trim().toLowerCase();
  const nameText = (name ?? '').trim().toLowerCase();

  // A placeholder domain ('Suite 8' · 'TBD' · empty) carries no meaning — fall through to the name.
  const domainIsMeaningful =
    domainText.length > 0 && domainText !== 'suite 8' && domainText !== 'tbd';

  // STAGE 1 — the semantic keyword path (domain first, then name).
  const semantic =
    (domainIsMeaningful ? matchKeywordSuite(domainText) : null) ?? matchKeywordSuite(nameText);
  if (semantic) return semantic;

  // STAGE 2 — the deterministic name-hash fallback (prefer the meaningful domain as the hash seed).
  const hashSeed = domainIsMeaningful ? domainText : nameText;
  if (hashSeed.length > 0) return hashToChromaticSuite(hashSeed);

  // STAGE 3 — the ground: no domain, no name → the marked neutral (the minted default).
  return 'base';
}

/** The `.hifi-pane-{suite}` class for a derived suite — the single card-background consumption point. */
export function suitePaneClass(suite: SpectrumSuite): string {
  return `hifi-pane-${suite}`;
}
