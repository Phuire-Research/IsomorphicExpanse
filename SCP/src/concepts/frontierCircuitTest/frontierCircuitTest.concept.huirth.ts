/**
 * FrontierCircuitTest Concept Factory (Huirth Deployment) · GTMS8C · the thin server-Base home for menuStage
 *
 * frontierCircuitTest is client-only today; the GTMS8C retrofit introduces THIS thin Huirth concept so the
 * frontierCircuitTest Demometer keeps its OWN server-Base `menuStage` state. It registers exactly ONE Base
 * quality (frontierCircuitTestSetMenuStageHuirthBase · Huirth-only · TQNI 'FrontierCircuitTest Set Menu Stage Huirth Base')
 * and the two relay principles: the thin menu-watch dir-watch + the STCP SMRP+BOCR relay.
 *
 * Co-muxified FLAT alongside cadmium + suiteCascade in huirth.concept.ts (Tier-1 Huirth muxium ·
 * NO ECK violation · structurally identical to the cadmium Huirth addition). Because all concepts
 * land flat in the Huirth muxium, d.frontierCircuitTest.k.menuStage, d.frontierCircuitTest.e.frontierCircuitTestSetMenuStageHuirthBase,
 * and d.webSocketServer.e.* are all live (the same cross-concept co-muxified access cadmium proves).
 *
 * The Huirth `frontierCircuitTest` concept names itself 'frontierCircuitTest' (FRONTIERCIRCUITTEST_CONCEPT_NAME); the CLIENT `frontierCircuitTest`
 * concept also names itself 'frontierCircuitTest' — they live in SEPARATE muxiums (client vs huirth) · NO
 * collision (mirrors cadmium: cadmiumName names both, in their respective muxiums).
 *
 * Citation: cadmium.concept.huirth.ts (Huirth face + quality mapping + principle registration).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.9.
 */
import { createConcept } from 'stratimux';
import { FRONTIERCIRCUITTEST_CONCEPT_NAME, type FrontierCircuitTestHuirthQualities } from './frontierCircuitTest.type';
import { createFrontierCircuitTestHuirthState } from './frontierCircuitTest.state.huirth';
import { frontierCircuitTestSetMenuStageHuirthBase } from './qualities/frontierCircuitTestSetMenuStageHuirthBase.quality.huirth';
// PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
import { frontierCircuitTestSetDesignationMenuStageHuirthBase } from './qualities/frontierCircuitTestSetDesignationMenuStageHuirthBase.quality.huirth';
import { frontierCircuitTestMenuStcpRelayPrinciple } from './principles/frontierCircuitTestMenuStcpRelay.principle.huirth';
import { frontierCircuitTestMenuWatchPrinciple } from './principles/frontierCircuitTestMenuWatch.principle.huirth';

// Explicit quality mapping — NEVER typeof. The scalar Base + the PRE-EPOCH keyed Base (both
// Huirth-only · local reducers · neither in actionExchange).
const frontierCircuitTestHuirthQualities: FrontierCircuitTestHuirthQualities = {
  frontierCircuitTestSetMenuStageHuirthBase,
  frontierCircuitTestSetDesignationMenuStageHuirthBase,
};

export const createFrontierCircuitTestHuirthConcept = () =>
  createConcept(
    FRONTIERCIRCUITTEST_CONCEPT_NAME,
    createFrontierCircuitTestHuirthState(),
    frontierCircuitTestHuirthQualities,
    // The thin menu-watch dir-watch (arms the menu.json relay) + the SMRP+BOCR relay principle
    // (reads frontierCircuitTest.k.menuStage · broadcasts frontierCircuitTestSetMenuStage).
    [frontierCircuitTestMenuWatchPrinciple, frontierCircuitTestMenuStcpRelayPrinciple],
  );
