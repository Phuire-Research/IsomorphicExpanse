/**
 * GitM Concept Factory (Huirth Deployment) · STCP · the server-Base home for gitmJson
 *
 * The BASE gitm concept on the Huirth side — holds gitmJson as the server source of truth.
 * Registers BOTH the Base quality (gitmSetGitmJsonHuirthBase · Huirth-only · TQNI 'Gitm
 * Set Gitm Json Huirth Base') AND the Relay quality (gitmSetGitmJson · dual-deploy: the
 * Huirth reduce keeps the SMRP selector's gitmJson current). Registers the two STCP
 * principles: the dir-watch arm + C1 (gitmJsonWatcher) and the SMRP+BOCR relay (gitmStcpRelay).
 *
 * Co-muxified FLAT alongside createScsBridgeHuirthConcept in huirth.concept.ts (flat
 * Tier-1 co-muxification · gitm is a SIBLING concept, NOT nested under scsBridge · the
 * same cross-concept co-muxified access the cadmium STCP relay proves).
 *
 * Citation: cadmium.concept.huirth.ts (Base quality map + STCP principle registration).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W1 gitm.concept.huirth.ts.
 */
import { createConcept } from 'stratimux';
import { gitmHuirthName, type GitmHuirthQualities } from './gitm.type';
import { createGitmHuirthState } from './gitm.state.huirth';
import { gitmSetGitmJsonHuirthBase } from './qualities/gitmSetGitmJsonHuirthBase.quality.huirth';
import { gitmSetGitmJson } from './qualities/gitmSetGitmJson.quality.client';
import { gitmJsonWatcherPrinciple } from './principles/gitmJsonWatcher.principle.huirth';
import { gitmStcpRelayPrinciple } from './principles/gitmStcpRelay.principle.huirth';
// GITM Staging-Update (D-U4.2) — the diff/resolved dual-deploy pairs (Base Huirth-only + Relay
// dual-deploy) + the SECOND dir-watch arm (gitmUpdateWatcher) for the HEAVY bodies off gitm.json.
import { gitmSetUpdateDiffHuirthBase } from './qualities/gitmSetUpdateDiffHuirthBase.quality.huirth';
import { gitmSetUpdateDiff } from './qualities/gitmSetUpdateDiff.quality.client';
import { gitmSetUpdateResolvedHuirthBase } from './qualities/gitmSetUpdateResolvedHuirthBase.quality.huirth';
import { gitmSetUpdateResolved } from './qualities/gitmSetUpdateResolved.quality.client';
import { gitmUpdateWatcherPrinciple } from './principles/gitmUpdateWatcher.principle.huirth';

// Explicit quality mapping — NEVER typeof. Base (Huirth-only) + Relay (dual-deploy).
const gitmHuirthQualities: GitmHuirthQualities = {
  gitmSetGitmJsonHuirthBase,
  gitmSetGitmJson,
  // D-U4.2 · the diff/resolved Base (Huirth-only) + Relay (dual-deploy) pairs.
  gitmSetUpdateDiffHuirthBase,
  gitmSetUpdateDiff,
  gitmSetUpdateResolvedHuirthBase,
  gitmSetUpdateResolved,
};

export const createGitmHuirthConcept = () =>
  createConcept(
    gitmHuirthName,
    createGitmHuirthState(),
    gitmHuirthQualities,
    // D-U4.2 · gitmUpdateWatcher arms ALONGSIDE gitmJsonWatcher (the SAME composition-site arming
    // path · one more watcher principle in the concept's principle array · gitmStcpRelay's SMRP/BOCR
    // already broadcast the new relay types via actionExchange — no second relay principle needed).
    [gitmJsonWatcherPrinciple, gitmStcpRelayPrinciple, gitmUpdateWatcherPrinciple],
  );
