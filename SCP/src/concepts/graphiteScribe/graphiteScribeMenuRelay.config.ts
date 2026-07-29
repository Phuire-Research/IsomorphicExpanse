/**
 * GraphiteScribe Menu STCP Relay — Shared Config (GTMS8C · SD-6 single-source)
 *
 * ONE exported config object both `graphiteScribeMenuWatch` (the thin dir-watch arm) AND
 * `graphiteScribeMenuStcpRelay` (SMRP+BOCR) import — no duplicated config literals. Each principle
 * builds its OWN createStcpComponentRelay<MenuStage>(GRAPHITESCRIBE_MENU_RELAY_CONFIG) INSTANCE
 * (independent lastIdentity guard + independent FSWatcher handle), but the config VALUES are
 * single-source: a change to jsonPath / parseMenuStage / payloadIdentity edits one place.
 *
 * The menu.json path resolves against SCS_ROOT (the SAME live Cascades/ the menu-watch +
 * the Cascade Registry use). Mirrors the cadmiumMenuRelay.config.ts SCS_BRIDGE_ROOT_OVERRIDE
 * discipline so the path lands at Cascades/Extended/<DEFAULT_GRAPHITESCRIBE_DESIGNATION_NAME>/menu.json.
 *
 * Citation: cadmiumMenuRelay.config.ts (the verbatim STCP menu-relay config precedent).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.6.
 */
import path from 'node:path';
import { existsSync, appendFileSync, mkdirSync, statSync } from 'node:fs';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import type { MenuStage, MenuDocument } from '../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE, EMPTY_MENU_DOCUMENT, normalizeMenuDocument } from '../../model/shatteriteMenu.model';
import { DEFAULT_GRAPHITESCRIBE_DESIGNATION_NAME, GRAPHITESCRIBE_MENU_JSON_BASENAME } from './graphiteScribe.type';
import { graphiteScribeSetMenuStage } from './qualities/graphiteScribeSetMenuStage.quality.client';
import { graphiteScribeSetMenuStageHuirthBase } from './qualities/graphiteScribeSetMenuStageHuirthBase.quality.huirth';
// PRE-EPOCH · BSSM keyed action creators — the per-designation factory binds these so each
// watcher's SBIS dispatch carries the designation key (Base FIRST, then the keyed relay).
import { graphiteScribeSetDesignationMenuStage } from './qualities/graphiteScribeSetDesignationMenuStage.quality.client';
import { graphiteScribeSetDesignationMenuStageHuirthBase } from './qualities/graphiteScribeSetDesignationMenuStageHuirthBase.quality.huirth';

// SCS root — mirrors the cadmium menu relay SCS_ROOT (the live Cascades/). The menu.json path
// lands at Cascades/Extended/<Template Suite 8>/menu.json (the install Opus retargets the
// designation name at rename → the user's RI dir).
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

const GRAPHITESCRIBE_MENU_JSON_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Extended',
  DEFAULT_GRAPHITESCRIBE_DESIGNATION_NAME,
  GRAPHITESCRIBE_MENU_JSON_BASENAME,
);

// C761 · THE RELAY TELEMETRY SINK (the S6 observability gap): every watch-event and
// read-dispatch outcome lands in the SCP-local Bridge rail so a silent live-edit names its
// own leg by grep. Never-throw + the 2MB skip-guard (the C740 idiom).
const MENU_RELAY_SINK_PATH = path.resolve(SCS_ROOT, 'Cascades', 'Bridge', 'graphiteScribe-menu-relay.json');
const MENU_RELAY_SINK_MAX_BYTES = 2 * 1024 * 1024;
export const sinkMenuRelayTelemetry = (seat: string, detail: Record<string, unknown> = {}): void => {
  try {
    mkdirSync(path.dirname(MENU_RELAY_SINK_PATH), { recursive: true });
    try {
      if (statSync(MENU_RELAY_SINK_PATH).size > MENU_RELAY_SINK_MAX_BYTES) return;
    } catch { /* first append creates it */ }
    appendFileSync(
      MENU_RELAY_SINK_PATH,
      JSON.stringify({ ts: new Date().toISOString(), seat, ...detail }) + '\n',
      'utf8',
    );
  } catch { /* telemetry must never harm the relay */ }
};

// STCP SLOT 1 · schema-aware parse of menu.json into a MenuStage. Returns null on empty /
// parse-fail / missing required fields (resilient · the watcher stays alive until a valid
// agent-authored stage lands). VERBATIM from cadmiumMenuRelay.config.ts:49-106 — generic · no
// cadmium-specific logic; forwards a validated inputConfig (tags/text/select + placeholder +
// options + pairDirective).
export const parseMenuStage = (raw: string): MenuStage | null => {
  if (!raw.trim()) return null; // skip empty/partial writes
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[GraphiteScribe STCP menu] menu.json parse failed · ignoring (partial write?)');
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.stageIndex !== 'number' || typeof p.title !== 'string' || !Array.isArray(p.options)) {
    console.warn('[GraphiteScribe STCP menu] menu.json missing required fields · ignoring');
    return null;
  }
  // Normalize each option (defensive · the agent authored it as free JSON).
  const options = (p.options as unknown[])
    .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
    .map((o) => {
      const kindRaw = typeof o.kind === 'string' ? o.kind : 'scs';
      const kind = kindRaw === 'focus' || kindRaw === 'askMore' ? kindRaw : 'scs';
      const option: MenuStage['options'][number] = {
        label: typeof o.label === 'string' ? o.label : '',
        kind: kind as MenuStage['options'][number]['kind'],
        scsCommand: typeof o.scsCommand === 'string' ? o.scsCommand : '',
      };
      // MOIS — forward a VALIDATED inputConfig when the agent authored one (tags/text/select).
      // An absent / malformed inputConfig is dropped → the row stays a plain dispatch button.
      const ic = o.inputConfig;
      if (ic && typeof ic === 'object') {
        const icr = ic as Record<string, unknown>;
        const icKind = icr.kind;
        if (icKind === 'tags' || icKind === 'text' || icKind === 'select') {
          option.inputConfig = {
            kind: icKind,
            ...(typeof icr.placeholder === 'string' ? { placeholder: icr.placeholder } : {}),
            ...(Array.isArray(icr.options)
              ? { options: icr.options.filter((x): x is string => typeof x === 'string') }
              : {}),
            ...(typeof icr.pairDirective === 'string' ? { pairDirective: icr.pairDirective } : {}),
          };
        }
      }
      return option;
    });
  return {
    stageIndex: p.stageIndex,
    title: p.title,
    prompt: typeof p.prompt === 'string' ? p.prompt : '',
    options,
  };
};

// 1A-prime · CONTENT-AWARE IDENTITY (the in-place-edit suppression cure · C756). The prior
// identity was the bare stageIndex — designed for stage ADVANCE, so an agent REVISING its
// stage-0 menu in place produced an identical identity and the stcpComponentRelay lastIdentity
// guard suppressed the broadcast (the Frontier Hello World break). djb2 over the serialized
// stage: any content change = a new identity; truly identical rewrites still dedupe.
export const menuStageContentIdentity = (doc: MenuDocument): string => {
  const s = JSON.stringify(doc);
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${doc.currentStageIndex}:${doc.stages.length}:${h}`;
};

// C766 · the STAGED parse — normalize ANY menu.json (staged anor legacy single-stage) into
// the MenuDocument the keyed circuit now carries end to end.
export const parseMenuDocument = (raw: string): MenuDocument | null => {
  if (!raw.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[GraphiteScribe STCP menu] menu.json parse failed · ignoring (partial write?)');
    return null;
  }
  return normalizeMenuDocument(parsed, (o) => parseMenuStage(JSON.stringify(o)));
};

// The single shared config. Both principles construct their own instance from this exact object.
// LEGACY (scalar · single-designation) — retained for backward-compat. The PRE-EPOCH N-watcher uses
// createGraphiteScribeDesignationRelayConfig (below) per registered designation instead.
export const GRAPHITESCRIBE_MENU_RELAY_CONFIG: StcpComponentRelayConfig<MenuStage> = {
  jsonPath: GRAPHITESCRIBE_MENU_JSON_PATH,
  basename: GRAPHITESCRIBE_MENU_JSON_BASENAME,
  parsePayload: parseMenuStage,
  emptyPayload: EMPTY_MENU_STAGE,
  baseActionCreator: (menuStage) =>
    graphiteScribeSetMenuStageHuirthBase.actionCreator({ menuStage }) as AnyAction,
  relayActionCreator: (menuStage) =>
    graphiteScribeSetMenuStage.actionCreator({ menuStage }) as AnyAction,
  // LEGACY scalar identity — the scalar pipe still carries a single MenuStage; hash it directly
  // (the document identity above serves the keyed staged circuit).
  payloadIdentity: (menuStage) => {
    const s = JSON.stringify(menuStage);
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return `${menuStage.stageIndex}:${h}`;
  },
  logTag: '[GraphiteScribe MenuWatch · STCP menu]',
  telemetrySink: (seat, detail) => sinkMenuRelayTelemetry(seat, { scope: 'scalar', ...detail }),
};

// ============================================================
// H3 · THE-WATCHER-FINDS-THE-ROOT-THAT-EXISTS (the two-roots Extended law)
// ============================================================
// C465 made Extended/ SCP-LOCAL (base = cwd = the SCP package dir), but the ANCHOR AGENT'S cwd is
// the WORKSPACE root — the menu.json it authors lands at {workspace}/Cascades/Extended/{name}/.
// So the two roots genuinely both exist and hold DIFFERENT designations: the SCP-local Extended/
// holds 'Cadmium Researcher'; the workspace Extended/ holds a workspace-authored designation. A
// watcher armed on the wrong root watches a directory that will never receive a write.
//
// Resolution mirrors the /cadmium-menu walk-up precedent (commit 2e5ae7a ·
// src/concepts/vue/vue.principle.ts ~L830 · "THE EXTENDED TWO-ROOTS FALLBACK"): try cwd first,
// then walk UP <=6 parents, and take the FIRST root where the designation's Extended DIRECTORY
// exists. The DIRECTORY is the existence test (not menu.json) because the FSWatcher watches the
// dir — the dir must exist for the watcher to arm, and menu.json need not exist yet.
//
// FALLBACK: no root has the dir -> return the SCP-local root. Behavior is therefore UNCHANGED for
// every designation that has no Extended dir anywhere, and the watcher still arms SCP-locally so a
// dir later created at that root is picked up.
const GRAPHITESCRIBE_EXTENDED_ROOT_WALK_UP_LIMIT = 6;

const resolveDesignationExtendedRoot = (designation: string): string => {
  const candidateRoots: string[] = [SCS_ROOT];
  let dir = SCS_ROOT;
  for (let i = 0; i < GRAPHITESCRIBE_EXTENDED_ROOT_WALK_UP_LIMIT; i += 1) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
    candidateRoots.push(dir);
  }
  const logTag = `[GraphiteScribe MenuWatch · STCP menu · ${designation}]`;
  for (const root of candidateRoots) {
    if (existsSync(path.resolve(root, 'Cascades', 'Extended', designation))) {
      console.log(`${logTag} Extended root resolved · ${root}`);
      return root;
    }
  }
  console.log(`${logTag} no Extended dir on any root · falling back SCP-local · ${SCS_ROOT}`);
  return SCS_ROOT;
};

// PRE-EPOCH · WPS · the per-designation relay-config FACTORY (S6 §Wave 2). For a designation Name,
// resolves THAT designation's menu.json under the SAME convention the scalar config uses
// (Cascades/Extended/{name}/menu.json · SCS_ROOT-relative) + binds the KEYED action creators so the
// SBIS dispatch carries the designation key (Base FIRST → keyed Base · then keyed relay).
//
// payloadIdentity is DESIGNATION-KEYED + CONTENT-AWARE (`${designation}:${contentHash}`) so two designations
// on the same stageIndex do NOT cross-suppress each other in their independent helper instances.
//
// NOTE (convention): the watcher reads Cascades/Extended/{name}/menu.json — the literal Suite 8 dir
// Name (NDEP). The designation's RI dir is Cascades/8_SUITES/{name}/; menu.json the Anchor writes
// lives under Cascades/Extended/{name}/ (the scalar config's convention · S4 Seam 4 · generalized 1:1).
export const createGraphiteScribeDesignationRelayConfig = (
  designation: string,
): StcpComponentRelayConfig<MenuDocument> => {
  const designationMenuJsonPath = path.resolve(
    resolveDesignationExtendedRoot(designation),
    'Cascades',
    'Extended',
    designation,
    GRAPHITESCRIBE_MENU_JSON_BASENAME,
  );
  return {
    jsonPath: designationMenuJsonPath,
    basename: GRAPHITESCRIBE_MENU_JSON_BASENAME,
    parsePayload: parseMenuDocument,
    emptyPayload: EMPTY_MENU_DOCUMENT,
    baseActionCreator: (menuStage) =>
      graphiteScribeSetDesignationMenuStageHuirthBase.actionCreator({ designation, menuStage }) as AnyAction,
    relayActionCreator: (menuStage) =>
      graphiteScribeSetDesignationMenuStage.actionCreator({ designation, menuStage }) as AnyAction,
    payloadIdentity: (menuStage) => `${designation}:${menuStageContentIdentity(menuStage)}`,
    logTag: `[GraphiteScribe MenuWatch · STCP menu · ${designation}]`,
    telemetrySink: (seat, detail) => sinkMenuRelayTelemetry(seat, { designation, ...detail }),
  };
};
