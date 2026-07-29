/**
 * Cadmium Concept Factory (Huirth Deployment) · STCP · the thin server-Base home for menuStage
 *
 * Cadmium is client-only today; STCP introduces THIS thin Huirth concept so the cadmium
 * Demometer keeps its OWN server-Base `menuStage` state (the truest reading of the LOCKED
 * Option C "Cadmium keeps its own state"). It registers exactly ONE Base quality
 * (cadmiumSetMenuStageHuirthBase · Huirth-only · TQNI 'Cadmium Set Menu Stage Huirth Base')
 * and the STCP SMRP+BOCR relay principle (cadmiumMenuStcpRelay · W4).
 *
 * Co-muxified ALONGSIDE createSuiteCascadeHuirthConcept in huirth.concept.ts (flat Tier-1
 * co-muxification · NO ECK violation · structurally identical to the suiteCascade addition).
 * Because all concepts land flat in the Huirth muxium, d.cadmium.k.menuStage,
 * d.cadmium.e.cadmiumSetMenuStageHuirthBase, and d.webSocketServer.e.* are all live (the same
 * cross-concept co-muxified access the CadmiumOkMonitorDeck already proves).
 *
 * Citation: suiteCascade.concept.huirth.ts (Huirth face + quality mapping + principle registration).
 * Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.0 (SD-1 · NEW thin Cadmium Huirth concept).
 * Citation: STCP-S4-VIRIDIAN-VERIFY.md D2 + REFINEMENT NOTE (PrincipleType binds Huirth variants).
 */
import { createConcept } from 'stratimux';
import { cadmiumName, type CadmiumHuirthQualities } from './cadmium.type';
import { createCadmiumHuirthState } from './cadmium.state.huirth';
import { cadmiumSetMenuStageHuirthBase } from './qualities/cadmiumSetMenuStageHuirthBase.quality.huirth';
// Diamond RFI · 2nd STCP · the Huirth-only Base quality writing the topics source of truth.
import { cadmiumSetTopicsHuirthBase } from './qualities/cadmiumSetTopicsHuirthBase.quality.huirth';
// Diamond RAR · 3rd STCP · the Huirth-only Base quality writing the researchBulletin source of truth.
import { cadmiumSetResearchBulletinHuirthBase } from './qualities/cadmiumSetResearchBulletinHuirthBase.quality.huirth';
// Diamond TRP · 4th STCP · the Huirth-only Base quality writing the targetedMenuStage source of truth.
import { cadmiumSetTargetedMenuStageHuirthBase } from './qualities/cadmiumSetTargetedMenuStageHuirthBase.quality.huirth';
// Topic Live Bulletin · the Huirth-only Base quality writing the topicBulletin source of truth.
import { cadmiumSetTopicBulletinHuirthBase } from './qualities/cadmiumSetTopicBulletinHuirthBase.quality.huirth';
// STCP · W4 · SMRP (selector-reactive broadcast on menuStage change) + BOCR (targeted backfill
// on new WebSocket connect). Reads d.cadmium.k.menuStage; reaches d.webSocketServer.e.*.
import { cadmiumMenuStcpRelayPrinciple } from './principles/cadmiumMenuStcpRelay.principle.huirth';
// Diamond RFI · 2nd STCP · the topics SMRP + BOCR relay principle (reads d.cadmium.k.topics ·
// broadcasts cadmiumSetTopics · the existing Research Frontier zone re-renders).
import { cadmiumTopicsStcpRelayPrinciple } from './principles/cadmiumTopicsStcpRelay.principle.huirth';
// Diamond RAR · 3rd STCP · the researchBulletin SMRP + BOCR relay principle (reads
// d.cadmium.k.researchBulletin · broadcasts cadmiumSetResearchBulletin · CadmiumResearchBulletin re-renders).
import { cadmiumResearchBulletinStcpRelayPrinciple } from './principles/cadmiumResearchBulletinStcpRelay.principle.huirth';
// Diamond TRP · 4th STCP · the targetedMenuStage SMRP + BOCR relay principle (reads
// d.cadmium.k.targetedMenuStage · broadcasts cadmiumSetTargetedMenuStage · the targeted-research
// inner menu re-renders).
import { cadmiumTargetedMenuStcpRelayPrinciple } from './principles/cadmiumTargetedMenuStcpRelay.principle.huirth';
// Topic Live Bulletin · the topicBulletin SMRP + BOCR relay principle (reads d.cadmium.k.topicBulletin
// · broadcasts cadmiumSetTopicBulletin · the LiveBulletin Topic Bulletin re-renders).
import { cadmiumTopicBulletinStcpRelayPrinciple } from './principles/cadmiumTopicBulletinStcpRelay.principle.huirth';

// Explicit quality mapping — NEVER typeof. Five Base qualities (ALL Huirth-only · local reducer).
const cadmiumHuirthQualities: CadmiumHuirthQualities = {
  cadmiumSetMenuStageHuirthBase,
  cadmiumSetTopicsHuirthBase,
  cadmiumSetResearchBulletinHuirthBase,
  cadmiumSetTargetedMenuStageHuirthBase,
  cadmiumSetTopicBulletinHuirthBase,
};

export const createCadmiumHuirthConcept = () =>
  createConcept(
    cadmiumName,
    createCadmiumHuirthState(),
    cadmiumHuirthQualities,
    // STCP · W4 · the menu SMRP + BOCR relay principle (reads cadmium.k.menuStage · broadcasts) +
    // Diamond RFI · 2nd STCP · the topics SMRP + BOCR relay principle (reads cadmium.k.topics).
    [
      cadmiumMenuStcpRelayPrinciple,
      cadmiumTopicsStcpRelayPrinciple,
      cadmiumResearchBulletinStcpRelayPrinciple,
      // Diamond TRP · 4th STCP · the targeted-menu SMRP + BOCR relay principle (reads
      // cadmium.k.targetedMenuStage · broadcasts cadmiumSetTargetedMenuStage).
      cadmiumTargetedMenuStcpRelayPrinciple,
      // Topic Live Bulletin · the topicBulletin SMRP + BOCR relay principle (reads
      // cadmium.k.topicBulletin · broadcasts cadmiumSetTopicBulletin).
      cadmiumTopicBulletinStcpRelayPrinciple,
    ],
  );
