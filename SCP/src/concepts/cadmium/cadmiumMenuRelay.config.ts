/**
 * Cadmium Menu STCP Relay — Shared Config (SD-6 / S4 REFINE-2 · single-source)
 *
 * ONE exported config object both `cadmiumOkMonitor` (W1 · dir-watch arm) AND
 * `cadmiumMenuStcpRelay` (W4 · SMRP+BOCR) import — no duplicated config literals. Each
 * principle builds its OWN createStcpComponentRelay<MenuStage>(CADMIUM_MENU_RELAY_CONFIG)
 * INSTANCE (independent lastIdentity guard + independent FSWatcher handle), but the config
 * VALUES are single-source: a change to jsonPath / parseMenuStage / payloadIdentity edits one
 * place. Citation: STCP-S4-VIRIDIAN-VERIFY.md REFINE-2 / SD-6 · STCP-S6-AMETHYST-VERIFY.md D2.
 *
 * parseMenuStage lives HERE (lifted out of the OkMonitor closure) so BOTH principles share the
 * identical schema-validator slot. The OkMonitor's prior inline parseMenuStage is replaced by
 * this export. Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.2 ("parseMenuStage … now the Suite-8 slot").
 *
 * The menu.json path resolves against SCS_ROOT (the SAME live Cascades/ the MCW watcher + the
 * Cascade Registry use · dev:self → SCS root; production → install cwd). Mirrors the OkMonitor's
 * SCS_BRIDGE_ROOT_OVERRIDE discipline so the path lands at the live Cascades/.
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import type { MenuStage } from './cadmium.type';
import {
  EMPTY_MENU_STAGE,
  CADMIUM_MENU_JSON_BASENAME,
  DEFAULT_CADMIUM_DESIGNATION_NAME,
} from './cadmium.type';
import { cadmiumSetMenuStage } from './qualities/cadmiumSetMenuStage.quality.client';
import { cadmiumSetMenuStageHuirthBase } from './qualities/cadmiumSetMenuStageHuirthBase.quality.huirth';

// SCS root — mirrors cadmiumOkMonitor.principle.huirth.ts SCS_ROOT (the live Cascades/). The
// menu.json path lands at Cascades/Extended/<Cadmium Researcher>/menu.json.
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

const CADMIUM_MENU_JSON_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Extended',
  DEFAULT_CADMIUM_DESIGNATION_NAME,
  CADMIUM_MENU_JSON_BASENAME,
);

// STCP SLOT 1 · schema-aware parse of menu.json into a MenuStage. Returns null on empty /
// parse-fail / missing required fields (resilient · the watcher stays alive until a valid
// agent-authored stage lands). Lifted verbatim from the OkMonitor's prior inline parseMenuStage
// so both the dir-watch arm AND the SMRP/BOCR relay share the identical validator.
export const parseMenuStage = (raw: string): MenuStage | null => {
  if (!raw.trim()) return null; // skip empty/partial writes
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[Cadmium STCP menu] menu.json parse failed · ignoring (partial write?)');
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.stageIndex !== 'number' || typeof p.title !== 'string' || !Array.isArray(p.options)) {
    console.warn('[Cadmium STCP menu] menu.json missing required fields · ignoring');
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
      // Diamond RFI · MOIS — forward a VALIDATED inputConfig when the agent authored one. The
      // inputConfig.kind must be one of the three input kinds (tags/text/select); placeholder is
      // an optional string; options is an optional string[] (only meaningful for 'select'). An
      // absent / malformed inputConfig is dropped → the row stays a plain dispatch button
      // (backward-compat · the existing scs/focus/askMore options never carried inputConfig).
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
            // Diamond TRP · forward the pairing directive when authored. Presence flips the row's
            // Submit (Cobalt-B handleSubmit) to focus-the-Anchor + send `<pairDirective> <input>`.
            // Survives parse from EITHER menu.json OR targeted-menu.json (parseMenuStage reused).
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

// The single shared config. Both principles construct their own instance from this exact object.
export const CADMIUM_MENU_RELAY_CONFIG: StcpComponentRelayConfig<MenuStage> = {
  jsonPath: CADMIUM_MENU_JSON_PATH,
  basename: CADMIUM_MENU_JSON_BASENAME,
  parsePayload: parseMenuStage,
  emptyPayload: EMPTY_MENU_STAGE,
  // Action-creators carry a payload-parameterized Action<Payload>; the slot is AnyAction (the
  // payload-agnostic action shape · the helper only routes it through nextA / broadcast, never
  // inspects payload). Cast to AnyAction — mirrors the OkMonitor's `as AnyAction` convention.
  baseActionCreator: (menuStage) =>
    cadmiumSetMenuStageHuirthBase.actionCreator({ menuStage }) as AnyAction,
  relayActionCreator: (menuStage) =>
    cadmiumSetMenuStage.actionCreator({ menuStage }) as AnyAction,
  // Replaces the OkMonitor's prior lastMenuStageIndex guard (NEW-stage-only suppression).
  payloadIdentity: (menuStage) => menuStage.stageIndex,
  logTag: '[Cadmium OkMonitor · STCP menu]',
};
