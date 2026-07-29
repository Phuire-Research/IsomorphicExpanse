/**
 * Suite8 Concept Factory (Client-Side)
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave D
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK"
 */
import { createConcept, muxifyConcepts } from 'stratimux';
import {
  suite8Name,
  type Suite8ClientQualities,
} from './suite8.type';
import { createSuite8ClientState } from './suite8.state';
// A-1 SCBM (the paramount invariant) · Suite8 muxifies SuiteCascade → ONE shared
// runtime instance at Tier 2 (`d.suiteCascade` · Scholar §1). The factory
// pulls the parameterless SuiteCascade factory; the muxified member carries its own
// two-principle array (TPDF — General Watcher + Named Loader) intact.
import { createSuiteCascadeConcept } from '../suiteCascade/suiteCascade.concept.client';
import { suite8RegisterSuite8 } from './qualities/suite8RegisterSuite8.quality.client';
import { suite8RegistrationPrinciple } from './principles/suite8Registration.principle.client';
import { suite8RegisterDesignation } from './qualities/registerDesignation.quality.client';
import { suite8RegisterSampleDesignations } from './qualities/registerSampleDesignations.quality.client';
import { suite8SetActiveDesignation } from './qualities/setActiveDesignation.quality.client';
import { suite8SetActiveTab } from './qualities/setActiveTab.quality.client';
import { suite8SetActiveSubPage } from './qualities/suite8SetActiveSubPage.quality.client';
import { suite8SetDiamondContent } from './qualities/setDiamondContent.quality.client';
import { suite8SetOnyxContent } from './qualities/setOnyxContent.quality.client';
import { suite8SetBoundCascade } from './qualities/setBoundCascade.quality.client';
import { suite8SetFileSystemSheet } from './qualities/setFileSystemSheet.quality.client';
// GTMS8C · the MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
import { suite8SetMenuStage } from './qualities/suite8SetMenuStage.quality.client';
// PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
import { suite8SetDesignationMenuStage } from './qualities/suite8SetDesignationMenuStage.quality.client';

const suite8Qualities: Suite8ClientQualities = {
  suite8RegisterSuite8,
  suite8RegisterDesignation,
  suite8RegisterSampleDesignations,
  suite8SetActiveDesignation,
  suite8SetActiveTab,
  suite8SetActiveSubPage,
  suite8SetDiamondContent,
  suite8SetOnyxContent,
  suite8SetBoundCascade,
  suite8SetFileSystemSheet,
  // GTMS8C · MenuStage relay reception (the menu-watch broadcasts 'Suite8 Set Menu Stage').
  suite8SetMenuStage,
  // PRE-EPOCH · BSSM keyed MenuStage relay reception (the N-watcher broadcasts 'Suite8 Set
  // Designation Menu Stage').
  suite8SetDesignationMenuStage,
};

export const createSuite8ClientConcept = () => {
  // SCBM · muxifyConcepts([createSuiteCascadeConcept()], createConcept('suite8', ...)).
  // The base node IS suite8 (Tier 1); suiteCascade is the muxified member (Tier 2).
  // A-2 MPRF — suite8RegistrationPrinciple seeds SPSR at boot.
  return muxifyConcepts(
    [createSuiteCascadeConcept()],
    createConcept(
      suite8Name,
      createSuite8ClientState(),
      suite8Qualities,
      [suite8RegistrationPrinciple],
    ),
  );
};
