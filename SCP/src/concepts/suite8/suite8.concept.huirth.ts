/**
 * Suite8 Concept Factory (Huirth Deployment) · GTMS8C · the thin server-Base home for menuStage
 *
 * suite8 is client-only today; the GTMS8C retrofit introduces THIS thin Huirth concept so the
 * suite8 Demometer keeps its OWN server-Base `menuStage` state. It registers exactly ONE Base
 * quality (suite8SetMenuStageHuirthBase · Huirth-only · TQNI 'Suite8 Set Menu Stage Huirth Base')
 * and the two relay principles: the thin menu-watch dir-watch + the STCP SMRP+BOCR relay.
 *
 * Co-muxified FLAT alongside cadmium + suiteCascade in huirth.concept.ts (Tier-1 Huirth muxium ·
 * NO ECK violation · structurally identical to the cadmium Huirth addition). Because all concepts
 * land flat in the Huirth muxium, d.suite8.k.menuStage, d.suite8.e.suite8SetMenuStageHuirthBase,
 * and d.webSocketServer.e.* are all live (the same cross-concept co-muxified access cadmium proves).
 *
 * The Huirth `suite8` concept names itself 'suite8' (SUITE8_CONCEPT_NAME); the CLIENT `suite8`
 * concept also names itself 'suite8' — they live in SEPARATE muxiums (client vs huirth) · NO
 * collision (mirrors cadmium: cadmiumName names both, in their respective muxiums).
 *
 * Citation: cadmium.concept.huirth.ts (Huirth face + quality mapping + principle registration).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.9.
 */
import { createConcept } from 'stratimux';
import { SUITE8_CONCEPT_NAME, type Suite8HuirthQualities } from './suite8.type';
import { createSuite8HuirthState } from './suite8.state.huirth';
import { suite8SetMenuStageHuirthBase } from './qualities/suite8SetMenuStageHuirthBase.quality.huirth';
// PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
import { suite8SetDesignationMenuStageHuirthBase } from './qualities/suite8SetDesignationMenuStageHuirthBase.quality.huirth';
import { suite8MenuStcpRelayPrinciple } from './principles/suite8MenuStcpRelay.principle.huirth';
import { suite8MenuWatchPrinciple } from './principles/suite8MenuWatch.principle.huirth';

// Explicit quality mapping — NEVER typeof. The scalar Base + the PRE-EPOCH keyed Base (both
// Huirth-only · local reducers · neither in actionExchange).
const suite8HuirthQualities: Suite8HuirthQualities = {
  suite8SetMenuStageHuirthBase,
  suite8SetDesignationMenuStageHuirthBase,
};

export const createSuite8HuirthConcept = () =>
  createConcept(
    SUITE8_CONCEPT_NAME,
    createSuite8HuirthState(),
    suite8HuirthQualities,
    // The thin menu-watch dir-watch (arms the menu.json relay) + the SMRP+BOCR relay principle
    // (reads suite8.k.menuStage · broadcasts suite8SetMenuStage).
    [suite8MenuWatchPrinciple, suite8MenuStcpRelayPrinciple],
  );
