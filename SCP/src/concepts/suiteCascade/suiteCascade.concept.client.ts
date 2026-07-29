/**
 * SuiteCascade Concept Factory (Client-Side)
 *
 * The PRIOR base concept. Standalone / individuatable — it does NOT require
 * Suite8 to function (the General SuiteCascade page IS this standalone
 * individuation). In Macro A, Suite8's factory muxifies this concept:
 *
 *   muxifyConcepts([createSuiteCascadeConcept()], createConcept('suite8', ...))
 *
 * → ONE shared runtime instance of `suiteCascade` at Tier 2
 * (`d.suite8.d.suiteCascade`). See Scholar §1.
 *
 * TPDF: the fourth `createConcept` argument is the two-principle ARRAY from the
 * Model File (`getSuiteCascadePrinciples()` — General Watcher + Named Loader),
 * spread into the factory.
 *
 * Citation: S8SC-SCHOLAR-COMPOSITION-GROUNDING.md §1 (createSuiteCascadeConcept) ·
 *           §4 (principles array splice).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §1 + Band B-1 TPDF.
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK".
 */
import { createConcept } from 'stratimux';
import {
  suiteCascadeName,
  type SuiteCascadeQualities,
} from './suiteCascade.type';
import { createSuiteCascadeState } from './suiteCascade.state';
import { suiteCascadeRegisterNamedCascade } from './qualities/suiteCascadeRegisterNamedCascade.quality.client';
import { suiteCascadeSetCascadeJson } from './qualities/suiteCascadeSetCascadeJson.quality.client';
import { suiteCascadeSetActiveCascadeFiles } from './qualities/suiteCascadeSetActiveCascadeFiles.quality.client';
// B-5 SDCR + GRID · local re-scope setter (Client face — keeps the HCD Home context
// selector in sync; default = GRID, restored on un-dock).
import { suiteCascadeSetActiveCascadeDirectory } from './qualities/suiteCascadeSetActiveCascadeDirectory.quality.client';
// B-6 HCD · local SubPage selector (Home · Component · Documentation triad).
import { suiteCascadeSetActiveSubPage } from './qualities/suiteCascadeSetActiveSubPage.quality.client';
// B-4 WCJF · Relay receivers (Informative) — the Huirth watcher broadcasts these
// via actionExchange.serverToClient; the Client registers them so the relay lands
// in the Client `cascades` Record. Dual-deployment quality files (no .client suffix).
import { suiteCascadeSetCascadeRelay } from './qualities/suiteCascadeSetCascadeRelay.quality';
import { suiteCascadeSetActiveCascadeFilesRelay } from './qualities/suiteCascadeSetActiveCascadeFilesRelay.quality';
// B-5 SDCR + GRID · Relay receiver — the active dir broadcast (GRID vs docked Suite8).
import { suiteCascadeSetActiveCascadeDirectoryRelay } from './qualities/suiteCascadeSetActiveCascadeDirectoryRelay.quality';
import { getSuiteCascadePrinciples } from './principles/suiteCascade.principles.model';
// SCRR · client leg — fire-once on boot to request the current cascade from Huirth.
import { suiteCascadeRequestOnLoadPrinciple } from './principles/suiteCascadeRequestOnLoad.principle.client';

// Explicit quality mapping — NEVER typeof.
const suiteCascadeQualities: SuiteCascadeQualities = {
  suiteCascadeRegisterNamedCascade,
  suiteCascadeSetCascadeJson,
  suiteCascadeSetActiveCascadeFiles,
  suiteCascadeSetActiveCascadeDirectory,
  suiteCascadeSetActiveSubPage,
  suiteCascadeSetCascadeRelay,
  suiteCascadeSetActiveCascadeFilesRelay,
  suiteCascadeSetActiveCascadeDirectoryRelay,
};

export const createSuiteCascadeConcept = () => {
  return createConcept(
    suiteCascadeName,
    createSuiteCascadeState(),
    suiteCascadeQualities,
    // TPDF — two principle entries spread from the Model File.
    // SCRR — client request-on-load principle (fire-once sentinel to Huirth).
    [...getSuiteCascadePrinciples(), suiteCascadeRequestOnLoadPrinciple],
  );
};
