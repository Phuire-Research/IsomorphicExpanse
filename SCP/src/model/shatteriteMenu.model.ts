// model/shatteriteMenu.model.ts
// Shared Shatterite Menu types — the FS-parsed/agent-authored menu stage contract.
// Consumed by: cadmium (re-export · zero behavior change) · suite8 GTMS8C (the Template) ·
// ShatteriteMenu.vue (the client render · FKIS-CR). Lifted out of cadmium.type.ts so the
// renameable Template concept and the generic menu component never depend on cadmium.

export type MenuOptionKind = 'scs' | 'focus' | 'askMore' | 'prime';
export type MenuOptionInputKind = 'tags' | 'text' | 'select';

export type MenuOptionInputConfig = {
  kind: MenuOptionInputKind;
  placeholder?: string;
  options?: string[];
  pairDirective?: string;
};

export type MenuOption = {
  // C768 · THE FOCUS DISCIPLINE (literal · combines with every enabled form incl. the input
  // forms the user may write): `In Focus` (true · HiFi GREEN) — the terminal keeps focus; the
  // message relay suppresses the final refocus to the SCP. `Pass Through` (absent/false · HiFi
  // ORANGE) — traditional background messaging; the refocus occurs. askMore IS In Focus by
  // nature (default true); scs/prime default Pass Through; scs+inFocus = the SCS:In-Focus variant.
  inFocus?: boolean;
  label: string;
  kind: MenuOptionKind;
  scsCommand: string;
  inputConfig?: MenuOptionInputConfig;
  tooltip?: string;
  // SMSP · Skill-Priming binding (kind 'prime'). primeRef = the Skill/Strategy path within the
  // Suite 8's dir (e.g. 'Skills/SetColorsViaJson.md'); on select, the server loads it in full +
  // SORD-wraps it (buildSordSkillEnvelope) and the dispatch relays it to the live anchor
  // (triggerSendMessage) — priming the Suite 8 to PERFORM the Skill. An EXPLICIT set in the default menu.
  primeRef?: string;
  primeKind?: 'skill' | 'strategy';
};

export type MenuStage = {
  stageIndex: number;
  title: string;
  prompt: string;
  options: MenuOption[];
};

// stageIndex -1 = no agent-authored stage yet → ShatteriteMenu renders its waiting state.
export const EMPTY_MENU_STAGE: MenuStage = {
  stageIndex: -1,
  title: '',
  prompt: '',
  options: [],
};

// ============================================================
// C766 · THE STAGED MENU DOCUMENT (the complete conversion · 1A)
// ============================================================
// menu.json now holds the WHOLE workflow: every stage stored + the current position — the
// file is the hydratable authority (floor-served on load · stream-relayed on change). The
// press iterates currentStageIndex CLIENT-side and persists it back (POST /suite8-menu-stage ·
// 2A: clamp at the last stage · back/forth navigation both persist). Agents author/edit
// `stages`; position converges through the file like everything else.
export type MenuDocument = {
  schemaVersion?: string;
  currentStageIndex: number;
  stages: MenuStage[];
};

export const EMPTY_MENU_DOCUMENT: MenuDocument = {
  currentStageIndex: -1,
  stages: [],
};

// Normalize ANY parsed menu.json into the staged form: the new staged shape passes through
// (position clamped into range); a LEGACY single-stage object auto-wraps as stages[0] — every
// pre-conversion file keeps working with zero migration (the 3B seeds migrate; the field is
// tolerant either way). Returns null on schema-invalid input (the caller ignores the write).
export const normalizeMenuDocument = (
  parsed: unknown,
  parseStage: (o: unknown) => MenuStage | null,
): MenuDocument | null => {
  if (!parsed || typeof parsed !== 'object') return null;
  const doc = parsed as Record<string, unknown>;
  if (Array.isArray(doc.stages)) {
    const stages = (doc.stages as unknown[])
      .map((s) => parseStage(s))
      .filter((s): s is MenuStage => s !== null);
    if (stages.length === 0) return null;
    const rawIdx = typeof doc.currentStageIndex === 'number' ? doc.currentStageIndex : 0;
    const currentStageIndex = Math.min(Math.max(rawIdx, 0), stages.length - 1);
    return {
      ...(typeof doc.schemaVersion === 'string' ? { schemaVersion: doc.schemaVersion } : {}),
      currentStageIndex,
      stages,
    };
  }
  const single = parseStage(parsed);
  if (!single) return null;
  return { currentStageIndex: 0, stages: [single] };
};
