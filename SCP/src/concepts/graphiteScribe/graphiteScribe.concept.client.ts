/**
 * GraphiteScribe Concept Factory (Client-Side)
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave D
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK"
 */
import { createConcept, muxifyConcepts } from 'stratimux';
import {
  graphiteScribeName,
  type GraphiteScribeClientQualities,
} from './graphiteScribe.type';
import { createGraphiteScribeClientState } from './graphiteScribe.state';
// A-1 SCBM (the paramount invariant) · GraphiteScribe muxifies SuiteCascade → ONE shared
// runtime instance at Tier 2 (`d.suiteCascade` · Scholar §1). The factory
// pulls the parameterless SuiteCascade factory; the muxified member carries its own
// two-principle array (TPDF — General Watcher + Named Loader) intact.
import { createSuiteCascadeConcept } from '../suiteCascade/suiteCascade.concept.client';
import { graphiteScribeRegisterGraphiteScribe } from './qualities/graphiteScribeRegisterGraphiteScribe.quality.client';
import { graphiteScribeRegistrationPrinciple } from './principles/graphiteScribeRegistration.principle.client';
import { graphiteScribeRegisterDesignation } from './qualities/registerDesignation.quality.client';
import { graphiteScribeRegisterSampleDesignations } from './qualities/registerSampleDesignations.quality.client';
import { graphiteScribeSetActiveDesignation } from './qualities/setActiveDesignation.quality.client';
import { graphiteScribeSetActiveTab } from './qualities/setActiveTab.quality.client';
import { graphiteScribeSetActiveSubPage } from './qualities/graphiteScribeSetActiveSubPage.quality.client';
import { graphiteScribeSetDiamondContent } from './qualities/setDiamondContent.quality.client';
import { graphiteScribeSetOnyxContent } from './qualities/setOnyxContent.quality.client';
import { graphiteScribeSetBoundCascade } from './qualities/setBoundCascade.quality.client';
import { graphiteScribeSetFileSystemSheet } from './qualities/setFileSystemSheet.quality.client';
// GTMS8C · the MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
import { graphiteScribeSetMenuStage } from './qualities/graphiteScribeSetMenuStage.quality.client';
// PRE-EPOCH · BSSM keyed relay-reception quality (the N-watcher SMRP broadcasts this type).
import { graphiteScribeSetDesignationMenuStage } from './qualities/graphiteScribeSetDesignationMenuStage.quality.client';
// MD-CE-3 · the editor-holding six (STRATIMUX HOLDS — buffers/tabs/settings live here;
// /editor-fs is the transfer surface).
import { graphiteScribeOpenFile } from './qualities/graphiteScribeOpenFile.quality.client';
import { graphiteScribeCloseFile } from './qualities/graphiteScribeCloseFile.quality.client';
import { graphiteScribeSetActiveFile } from './qualities/graphiteScribeSetActiveFile.quality.client';
import { graphiteScribeUpdateBuffer } from './qualities/graphiteScribeUpdateBuffer.quality.client';
import { graphiteScribeMarkFileSaved } from './qualities/graphiteScribeMarkFileSaved.quality.client';
import { graphiteScribeSetEditorSettings } from './qualities/graphiteScribeSetEditorSettings.quality.client';

const graphiteScribeQualities: GraphiteScribeClientQualities = {
  graphiteScribeRegisterGraphiteScribe,
  graphiteScribeRegisterDesignation,
  graphiteScribeRegisterSampleDesignations,
  graphiteScribeSetActiveDesignation,
  graphiteScribeSetActiveTab,
  graphiteScribeSetActiveSubPage,
  graphiteScribeSetDiamondContent,
  graphiteScribeSetOnyxContent,
  graphiteScribeSetBoundCascade,
  graphiteScribeSetFileSystemSheet,
  // GTMS8C · MenuStage relay reception (the menu-watch broadcasts 'GraphiteScribe Set Menu Stage').
  graphiteScribeSetMenuStage,
  // PRE-EPOCH · BSSM keyed MenuStage relay reception (the N-watcher broadcasts 'GraphiteScribe Set
  // Designation Menu Stage').
  graphiteScribeSetDesignationMenuStage,
  // MD-CE-3 · the editor-holding six.
  graphiteScribeOpenFile,
  graphiteScribeCloseFile,
  graphiteScribeSetActiveFile,
  graphiteScribeUpdateBuffer,
  graphiteScribeMarkFileSaved,
  graphiteScribeSetEditorSettings,
};

export const createGraphiteScribeClientConcept = () => {
  // SCBM · muxifyConcepts([createSuiteCascadeConcept()], createConcept('graphiteScribe', ...)).
  // The base node IS graphiteScribe (Tier 1); suiteCascade is the muxified member (Tier 2).
  // A-2 MPRF — graphiteScribeRegistrationPrinciple seeds SPSR at boot.
  return muxifyConcepts(
    [createSuiteCascadeConcept()],
    createConcept(
      graphiteScribeName,
      createGraphiteScribeClientState(),
      graphiteScribeQualities,
      [graphiteScribeRegistrationPrinciple],
    ),
  );
};
