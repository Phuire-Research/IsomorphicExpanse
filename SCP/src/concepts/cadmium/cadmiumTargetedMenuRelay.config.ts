/**
 * Cadmium Targeted-Menu STCP Relay — Shared Config (Diamond TRP · 4th STCP instance · single-source)
 *
 * The 4th STCP instance on the SAME helper (createStcpComponentRelay), against the `targeted/`
 * SUBDIR of the Cadmium RI dir, with the MenuStage payload — the Anchor-authored targeted-research
 * live menu. ONE exported config object both `cadmiumOkMonitor` (dir-watch arm) AND
 * `cadmiumTargetedMenuStcpRelay` (SMRP+BOCR) import — no duplicated config literals. Each principle
 * builds its OWN createStcpComponentRelay<MenuStage>(CADMIUM_TARGETED_MENU_RELAY_CONFIG) INSTANCE
 * (independent lastIdentity guard + independent FSWatcher handle), but the config VALUES are
 * single-source.
 *
 * parsePayload REUSES the existing parseMenuStage (imported from cadmiumMenuRelay.config.ts ·
 * single-source · TRP residual decision #3) — the same schema-validator the menu stream uses,
 * already forwarding the new `pairDirective` inputConfig field (A18b). No duplicate validator.
 *
 * The Base is the NEW Huirth-only cadmiumSetTargetedMenuStageHuirthBase ('Cadmium Set Targeted Menu
 * Stage Huirth Base'); the relay is the NEW cadmiumSetTargetedMenuStage ('Cadmium Set Targeted Menu
 * Stage', registered in cadmium.muxonomy.ts actionExchange) — the targeted-research inner menu
 * re-renders when the relay lands.
 *
 * The targeted-menu.json path resolves against SCS_ROOT (the SAME live Cascades/ the menu + topics +
 * researchBulletin relays use · dev:self → SCS root; production → install cwd). The `targeted/`
 * subdir sits BELOW the AWCR depth:0 research watch (no CADMIUM_NON_RESEARCH_JSON_BASENAMES change ·
 * R4). Mirrors cadmiumMenuRelay.config.ts SCS_BRIDGE_ROOT_OVERRIDE discipline.
 *
 * Citation: cadmiumMenuRelay.config.ts (byte-mirror · parseMenuStage reuse · payloadIdentity stageIndex).
 * Citation: cadmiumResearchBulletinRelay.config.ts (the `targeted/` subdir path precedent).
 * Citation: TRP-DIAMOND-WGB.md §1 A10 + §3 (TQNI T1/H1) + §R4 (subdir below depth:0).
 */
import path from 'node:path';
import type { AnyAction } from 'stratimux';
import type { StcpComponentRelayConfig } from '../../model/stcpComponentRelay.model';
import type { MenuStage } from './cadmium.type';
import {
  EMPTY_MENU_STAGE,
  CADMIUM_TARGETED_MENU_JSON_BASENAME,
  CADMIUM_TARGETED_SUBDIR_BASENAME,
  DEFAULT_CADMIUM_DESIGNATION_NAME,
} from './cadmium.type';
// REUSE the existing menu validator (single-source · TRP residual #3). It already forwards the new
// `pairDirective` inputConfig field (A18b), so a pairDirective authored in targeted-menu.json survives.
import { parseMenuStage } from './cadmiumMenuRelay.config';
import { cadmiumSetTargetedMenuStage } from './qualities/cadmiumSetTargetedMenuStage.quality.client';
import { cadmiumSetTargetedMenuStageHuirthBase } from './qualities/cadmiumSetTargetedMenuStageHuirthBase.quality.huirth';

// SCS root — mirrors cadmiumMenuRelay.config.ts SCS_ROOT (the live Cascades/). The targeted-menu.json
// path lands at Cascades/Extended/<Cadmium Researcher>/targeted/targeted-menu.json.
// C465 · THE EXTENDED RELOCATION — Extended/ is SCP-LOCAL (the per-SCP Cascades/ is primary).
// The workspace override env is the BRIDGE rendezvous root, NOT the Extended base: cwd = the
// SCP package dir is the ONLY correct base (mirrors resolveScpLocalExtendedDir).
const SCS_ROOT = path.resolve(process.cwd());

const CADMIUM_TARGETED_MENU_JSON_PATH = path.resolve(
  SCS_ROOT,
  'Cascades',
  'Extended',
  DEFAULT_CADMIUM_DESIGNATION_NAME,
  CADMIUM_TARGETED_SUBDIR_BASENAME,
  CADMIUM_TARGETED_MENU_JSON_BASENAME,
);

// The single shared config. Both principles construct their own instance from this exact object.
export const CADMIUM_TARGETED_MENU_RELAY_CONFIG: StcpComponentRelayConfig<MenuStage> = {
  jsonPath: CADMIUM_TARGETED_MENU_JSON_PATH,
  basename: CADMIUM_TARGETED_MENU_JSON_BASENAME,
  // REUSE the menu validator (single-source · A18b pairDirective forward applies to both streams).
  parsePayload: parseMenuStage,
  emptyPayload: EMPTY_MENU_STAGE,
  // Action-creators carry a payload-parameterized Action<Payload>; the slot is AnyAction (the
  // payload-agnostic action shape · the helper only routes it through nextA / broadcast, never
  // inspects payload). Cast to AnyAction — mirrors the menu config `as AnyAction` convention.
  baseActionCreator: (targetedMenuStage) =>
    cadmiumSetTargetedMenuStageHuirthBase.actionCreator({ targetedMenuStage }) as AnyAction,
  relayActionCreator: (targetedMenuStage) =>
    cadmiumSetTargetedMenuStage.actionCreator({ targetedMenuStage }) as AnyAction,
  // NEW-stage-only suppression by monotonic stageIndex (mirrors the menu config).
  payloadIdentity: (targetedMenuStage) => targetedMenuStage.stageIndex,
  logTag: '[Cadmium OkMonitor · STCP targeted-menu]',
};
