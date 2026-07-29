/**
 * GraphiteScribe Concept Factory (Huirth Deployment) · GTMS8C · the thin server-Base home for menuStage
 *
 * graphiteScribe is client-only today; the GTMS8C retrofit introduces THIS thin Huirth concept so the
 * graphiteScribe Demometer keeps its OWN server-Base `menuStage` state. It registers exactly ONE Base
 * quality (graphiteScribeSetMenuStageHuirthBase · Huirth-only · TQNI 'GraphiteScribe Set Menu Stage Huirth Base')
 * and the two relay principles: the thin menu-watch dir-watch + the STCP SMRP+BOCR relay.
 *
 * Co-muxified FLAT alongside cadmium + suiteCascade in huirth.concept.ts (Tier-1 Huirth muxium ·
 * NO ECK violation · structurally identical to the cadmium Huirth addition). Because all concepts
 * land flat in the Huirth muxium, d.graphiteScribe.k.menuStage, d.graphiteScribe.e.graphiteScribeSetMenuStageHuirthBase,
 * and d.webSocketServer.e.* are all live (the same cross-concept co-muxified access cadmium proves).
 *
 * The Huirth `graphiteScribe` concept names itself 'graphiteScribe' (GRAPHITESCRIBE_CONCEPT_NAME); the CLIENT `graphiteScribe`
 * concept also names itself 'graphiteScribe' — they live in SEPARATE muxiums (client vs huirth) · NO
 * collision (mirrors cadmium: cadmiumName names both, in their respective muxiums).
 *
 * Citation: cadmium.concept.huirth.ts (Huirth face + quality mapping + principle registration).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.9.
 */
import { createConcept } from 'stratimux';
import { GRAPHITESCRIBE_CONCEPT_NAME, type GraphiteScribeHuirthQualities } from './graphiteScribe.type';
import { createGraphiteScribeHuirthState } from './graphiteScribe.state.huirth';
import { graphiteScribeSetMenuStageHuirthBase } from './qualities/graphiteScribeSetMenuStageHuirthBase.quality.huirth';
// PRE-EPOCH · BSSM keyed Huirth Base quality (the N-watcher dispatches this FIRST · Base-maintenance).
import { graphiteScribeSetDesignationMenuStageHuirthBase } from './qualities/graphiteScribeSetDesignationMenuStageHuirthBase.quality.huirth';
import { graphiteScribeMenuStcpRelayPrinciple } from './principles/graphiteScribeMenuStcpRelay.principle.huirth';
import { graphiteScribeMenuWatchPrinciple } from './principles/graphiteScribeMenuWatch.principle.huirth';

// Explicit quality mapping — NEVER typeof. The scalar Base + the PRE-EPOCH keyed Base (both
// Huirth-only · local reducers · neither in actionExchange).
const graphiteScribeHuirthQualities: GraphiteScribeHuirthQualities = {
  graphiteScribeSetMenuStageHuirthBase,
  graphiteScribeSetDesignationMenuStageHuirthBase,
};

export const createGraphiteScribeHuirthConcept = () =>
  createConcept(
    GRAPHITESCRIBE_CONCEPT_NAME,
    createGraphiteScribeHuirthState(),
    graphiteScribeHuirthQualities,
    // The thin menu-watch dir-watch (arms the menu.json relay) + the SMRP+BOCR relay principle
    // (reads graphiteScribe.k.menuStage · broadcasts graphiteScribeSetMenuStage).
    [graphiteScribeMenuWatchPrinciple, graphiteScribeMenuStcpRelayPrinciple],
  );
