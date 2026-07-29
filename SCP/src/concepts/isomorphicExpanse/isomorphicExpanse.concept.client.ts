/**
 * IsomorphicExpanse Concept Factory (Client-Side)
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave D
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK"
 */
import { createConcept, muxifyConcepts } from 'stratimux';
import {
  isomorphicExpanseName,
  type IsomorphicExpanseClientQualities,
} from './isomorphicExpanse.type';
import { createIsomorphicExpanseClientState } from './isomorphicExpanse.state';
// A-1 SCBM (the paramount invariant) · IsomorphicExpanse muxifies SuiteCascade → ONE shared
// runtime instance at Tier 2 (`d.suiteCascade` · Scholar §1). The factory
// pulls the parameterless SuiteCascade factory; the muxified member carries its own
// two-principle array (TPDF — General Watcher + Named Loader) intact.
import { createSuiteCascadeConcept } from '../suiteCascade/suiteCascade.concept.client';
import { isomorphicExpanseRegisterIsomorphicExpanse } from './qualities/isomorphicExpanseRegisterIsomorphicExpanse.quality.client';
import { isomorphicExpanseRegistrationPrinciple } from './principles/isomorphicExpanseRegistration.principle.client';
import { isomorphicExpanseRegisterDesignation } from './qualities/registerDesignation.quality.client';
import { isomorphicExpanseRegisterSampleDesignations } from './qualities/registerSampleDesignations.quality.client';
import { isomorphicExpanseSetActiveDesignation } from './qualities/setActiveDesignation.quality.client';
import { isomorphicExpanseSetActiveTab } from './qualities/setActiveTab.quality.client';
import { isomorphicExpanseSetActiveSubPage } from './qualities/isomorphicExpanseSetActiveSubPage.quality.client';
import { isomorphicExpanseSetDiamondContent } from './qualities/setDiamondContent.quality.client';
import { isomorphicExpanseSetOnyxContent } from './qualities/setOnyxContent.quality.client';
import { isomorphicExpanseSetBoundCascade } from './qualities/setBoundCascade.quality.client';
import { isomorphicExpanseSetFileSystemSheet } from './qualities/setFileSystemSheet.quality.client';
// GTMS8C · the MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
import { isomorphicExpanseSetMenuStage } from './qualities/isomorphicExpanseSetMenuStage.quality.client';
// PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
import { isomorphicExpanseSetDesignationMenuStage } from './qualities/isomorphicExpanseSetDesignationMenuStage.quality.client';

const isomorphicExpanseQualities: IsomorphicExpanseClientQualities = {
  isomorphicExpanseRegisterIsomorphicExpanse,
  isomorphicExpanseRegisterDesignation,
  isomorphicExpanseRegisterSampleDesignations,
  isomorphicExpanseSetActiveDesignation,
  isomorphicExpanseSetActiveTab,
  isomorphicExpanseSetActiveSubPage,
  isomorphicExpanseSetDiamondContent,
  isomorphicExpanseSetOnyxContent,
  isomorphicExpanseSetBoundCascade,
  isomorphicExpanseSetFileSystemSheet,
  // GTMS8C · MenuStage relay reception (the menu-watch broadcasts 'IsomorphicExpanse Set Menu Stage').
  isomorphicExpanseSetMenuStage,
  // PRE-EPOCH · BSSM keyed MenuStage relay reception (the N-watcher broadcasts 'IsomorphicExpanse Set
  // Designation Menu Stage').
  isomorphicExpanseSetDesignationMenuStage,
};

export const createIsomorphicExpanseClientConcept = () => {
  // SCBM · muxifyConcepts([createSuiteCascadeConcept()], createConcept('isomorphicExpanse', ...)).
  // The base node IS isomorphicExpanse (Tier 1); suiteCascade is the muxified member (Tier 2).
  // A-2 MPRF — isomorphicExpanseRegistrationPrinciple seeds SPSR at boot.
  return muxifyConcepts(
    [createSuiteCascadeConcept()],
    createConcept(
      isomorphicExpanseName,
      createIsomorphicExpanseClientState(),
      isomorphicExpanseQualities,
      [isomorphicExpanseRegistrationPrinciple],
    ),
  );
};
