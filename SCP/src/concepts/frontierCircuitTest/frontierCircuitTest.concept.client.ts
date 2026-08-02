/**
 * FrontierCircuitTest Concept Factory (Client-Side)
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave D
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK"
 */
import { createConcept, muxifyConcepts } from 'stratimux';
import {
  frontierCircuitTestName,
  type FrontierCircuitTestClientQualities,
} from './frontierCircuitTest.type';
import { createFrontierCircuitTestClientState } from './frontierCircuitTest.state';
// A-1 SCBM (the paramount invariant) · FrontierCircuitTest muxifies SuiteCascade → ONE shared
// runtime instance at Tier 2 (`d.suiteCascade` · Scholar §1). The factory
// pulls the parameterless SuiteCascade factory; the muxified member carries its own
// two-principle array (TPDF — General Watcher + Named Loader) intact.
import { createSuiteCascadeConcept } from '../suiteCascade/suiteCascade.concept.client';
import { frontierCircuitTestRegisterFrontierCircuitTest } from './qualities/frontierCircuitTestRegisterFrontierCircuitTest.quality.client';
import { frontierCircuitTestRegistrationPrinciple } from './principles/frontierCircuitTestRegistration.principle.client';
import { frontierCircuitTestRegisterDesignation } from './qualities/registerDesignation.quality.client';
import { frontierCircuitTestRegisterSampleDesignations } from './qualities/registerSampleDesignations.quality.client';
import { frontierCircuitTestSetActiveDesignation } from './qualities/setActiveDesignation.quality.client';
import { frontierCircuitTestSetActiveTab } from './qualities/setActiveTab.quality.client';
import { frontierCircuitTestSetActiveSubPage } from './qualities/frontierCircuitTestSetActiveSubPage.quality.client';
import { frontierCircuitTestSetDiamondContent } from './qualities/setDiamondContent.quality.client';
import { frontierCircuitTestSetOnyxContent } from './qualities/setOnyxContent.quality.client';
import { frontierCircuitTestSetBoundCascade } from './qualities/setBoundCascade.quality.client';
import { frontierCircuitTestSetFileSystemSheet } from './qualities/setFileSystemSheet.quality.client';
// GTMS8C · the MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
import { frontierCircuitTestSetMenuStage } from './qualities/frontierCircuitTestSetMenuStage.quality.client';
// PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
import { frontierCircuitTestSetDesignationMenuStage } from './qualities/frontierCircuitTestSetDesignationMenuStage.quality.client';

const frontierCircuitTestQualities: FrontierCircuitTestClientQualities = {
  frontierCircuitTestRegisterFrontierCircuitTest,
  frontierCircuitTestRegisterDesignation,
  frontierCircuitTestRegisterSampleDesignations,
  frontierCircuitTestSetActiveDesignation,
  frontierCircuitTestSetActiveTab,
  frontierCircuitTestSetActiveSubPage,
  frontierCircuitTestSetDiamondContent,
  frontierCircuitTestSetOnyxContent,
  frontierCircuitTestSetBoundCascade,
  frontierCircuitTestSetFileSystemSheet,
  // GTMS8C · MenuStage relay reception (the menu-watch broadcasts 'FrontierCircuitTest Set Menu Stage').
  frontierCircuitTestSetMenuStage,
  // PRE-EPOCH · BSSM keyed MenuStage relay reception (the N-watcher broadcasts 'FrontierCircuitTest Set
  // Designation Menu Stage').
  frontierCircuitTestSetDesignationMenuStage,
};

export const createFrontierCircuitTestClientConcept = () => {
  // SCBM · muxifyConcepts([createSuiteCascadeConcept()], createConcept('frontierCircuitTest', ...)).
  // The base node IS frontierCircuitTest (Tier 1); suiteCascade is the muxified member (Tier 2).
  // A-2 MPRF — frontierCircuitTestRegistrationPrinciple seeds SPSR at boot.
  return muxifyConcepts(
    [createSuiteCascadeConcept()],
    createConcept(
      frontierCircuitTestName,
      createFrontierCircuitTestClientState(),
      frontierCircuitTestQualities,
      [frontierCircuitTestRegistrationPrinciple],
    ),
  );
};
