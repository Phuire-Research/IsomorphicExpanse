// MD-9 · D-MC-3 · Per-Instance Model Control · the TEMPLATE-side model catalog MIRROR.
//
// SYNC-NOTE: the SOURCE OF TRUTH is the bridge's src/shared/modelCatalog.model.ts
// (AVAILABLE_MODELS · DEFAULT_MODEL · isAvailableModel). The bridge OWNS the catalog and
// injects `--model <id>` at spawn/resume; this mirror exists ONLY so the Session Management
// UI can render the model DROPDOWN (labels + tiers) and resolve a recorded entry.model id
// to a friendly label on session rows. Keep the four entries + labels + ids byte-identical
// to the bridge source; re-sync per release (TQNI discipline — no path alias into the bridge
// lib from the SCP template, same decision as Suite8PickerEntry / BridgeJsonShape).

export interface ScsModelCatalogEntry {
  /** the exact string passed to `claude --model <id>` (full pinned ID, not a drifting alias) */
  id: string;
  label: string;
  tier: 'flagship' | 'formative' | 'balanced' | 'fast';
  blurb: string;
}

/** the default spawn model — Opus 5 (C929 · mirrors bridge DEFAULT_MODEL). */
export const SCS_DEFAULT_MODEL = 'claude-opus-5';

export const SCS_AVAILABLE_MODELS: ScsModelCatalogEntry[] = [
  {
    id: 'claude-opus-5',
    label: 'Opus 5',
    tier: 'flagship',
    blurb:
      'Default spawn model. The latest Opus — near-frontier intelligence, strongest complex multi-step work. 1M context.',
  },
  {
    id: 'claude-opus-4-8',
    label: 'Opus 4.8',
    tier: 'flagship',
    blurb:
      'Prior Opus flagship — complex reasoning, long-horizon agentic coding, high-autonomy work. 1M context.',
  },
  {
    id: 'claude-fable-5',
    label: 'Fable 5',
    tier: 'formative',
    blurb:
      'Upgrade-in-scale for Formative cases. Sustains long autonomous sessions; investigates and verifies more deeply. 1M context.',
  },
  {
    id: 'claude-sonnet-5',
    label: 'Sonnet 5',
    tier: 'balanced',
    blurb:
      'Latest Sonnet generation — a capability step above 4.6 with improved reasoning. 1M context.',
  },
  {
    id: 'claude-opus-4-7',
    label: 'Opus 4.7',
    tier: 'flagship',
    blurb:
      'Prior Opus flagship — proven long-horizon agentic work. 1M context.',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4.6',
    tier: 'flagship',
    blurb:
      'Opus 4.6 generation — stable complex reasoning and multi-step coding. 1M context.',
  },
  {
    id: 'claude-opus-4-5-20251101',
    label: 'Opus 4.5',
    tier: 'flagship',
    blurb:
      'Pinned Opus 4.5 — full agentic capability. 1M context.',
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4.6',
    tier: 'balanced',
    blurb:
      'Best combination of speed and intelligence — fast throughput with near-Opus capability for daily tasks. 1M context.',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    label: 'Sonnet 4.5',
    tier: 'balanced',
    blurb:
      'Pinned Sonnet 4.5 — reliable mid-tier throughput. 1M context.',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    tier: 'fast',
    blurb:
      'Fastest model — low latency, lowest cost for simple tasks and high-volume work. 200K context.',
  },
];

export function isScsAvailableModel(id: string): boolean {
  return SCS_AVAILABLE_MODELS.some((m) => m.id === id);
}

/** resolve a recorded model id to its friendly label (falls back to the raw id). */
export function scsModelLabel(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return SCS_AVAILABLE_MODELS.find((m) => m.id === id)?.label ?? id;
}
