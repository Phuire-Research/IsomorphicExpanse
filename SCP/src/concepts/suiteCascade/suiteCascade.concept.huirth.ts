/**
 * SuiteCascade Concept Factory (Huirth Deployment) · Band B-4 WCJF
 *
 * Server-side companion to suiteCascade.concept.client.ts. This is the demometric
 * Huirth face of the SuiteCascade concept: it runs the chokidar Cascade.json watcher
 * (suiteCascadeJsonWatcherPrinciple) that loads the GRID `Cascade.json` + its listed
 * files into cascades['General'], and registers the SBIS Base + Relay qualities the
 * watcher dispatches.
 *
 * SBIS split (mirrors scsBridge.concept.huirth.ts):
 *   - Base qualities (Huirth-only · run local reducer so server state is real):
 *       suiteCascadeSetCascadeHuirthBase · suiteCascadeSetActiveCascadeFilesHuirthBase
 *   - Relay qualities (dual-deployment · broadcast via actionExchange.serverToClient):
 *       suiteCascadeSetCascadeRelay · suiteCascadeSetActiveCascadeFilesRelay
 *
 * The Huirth state shares the same `cascades` Record shape as the Client state.
 * Muxified into the Huirth concept via huirth.concept.ts (createSuiteCascadeHuirthConcept).
 *
 * Citation: scsBridge.concept.huirth.ts (Huirth face + watcher principle registration).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-4 WCJF.
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK".
 */
import { createConcept } from 'stratimux';
import { suiteCascadeName, type SuiteCascadeHuirthQualities } from './suiteCascade.type';
import { createSuiteCascadeHuirthState } from './suiteCascade.state';
import { suiteCascadeSetCascadeHuirthBase } from './qualities/suiteCascadeSetCascadeHuirthBase.quality.huirth';
import { suiteCascadeSetActiveCascadeFilesHuirthBase } from './qualities/suiteCascadeSetActiveCascadeFilesHuirthBase.quality.huirth';
// B-5 SDCR + GRID · Base re-scope trigger (Huirth-only) — the watcher reads its
// selector to tear down + re-arm chokidar on the new dir.
import { suiteCascadeSetActiveCascadeDirectoryHuirthBase } from './qualities/suiteCascadeSetActiveCascadeDirectoryHuirthBase.quality.huirth';
import { suiteCascadeSetCascadeRelay } from './qualities/suiteCascadeSetCascadeRelay.quality';
import { suiteCascadeSetActiveCascadeFilesRelay } from './qualities/suiteCascadeSetActiveCascadeFilesRelay.quality';
// B-5 SDCR + GRID · Relay — broadcast the active dir to the Client (Path B).
import { suiteCascadeSetActiveCascadeDirectoryRelay } from './qualities/suiteCascadeSetActiveCascadeDirectoryRelay.quality';
import { suiteCascadeJsonWatcherPrinciple } from './principles/suiteCascadeJsonWatcher.principle.huirth';
import { suiteCascadeBackfillOnConnectPrinciple } from './principles/suiteCascadeBackfillOnConnect.principle.huirth';
import { suiteCascadeStateMirrorPrinciple } from './principles/suiteCascadeStateMirror.principle.huirth';
// C3-D3-b SCSF · Cadmium OkMonitor — independent (NCEC-safe) :OK: monitor for the running
// Cadmium session. Lives here because the suiteCascade Huirth concept is where both the
// suiteCascade dispatch target AND the co-muxified scsBridge.sessionsList read are in scope.
import { cadmiumOkMonitorPrinciple } from '../cadmium/principles/cadmiumOkMonitor.principle.huirth';
// DPASL-D1 · Cadmium is the FIRST REGISTRANT onto the Cascade Registry. This principle
// (the actualized cascadeRegistration.model factory) registers 'Cadmium Researcher' →
// 'Cascades/Extended/Cadmium Researcher/' onto the `cascades` Record on load. Registered
// HERE because this is the muxium where d.suiteCascade.e.* is in scope (same as the
// OkMonitor). Boundary: import flows cadmium → suiteCascade (downward · allowed).
import { cadmiumCascadeRegistrationPrinciple } from '../cadmium/principles/cadmiumCascadeRegistration.principle.huirth';
// DPASL-D1 · FORGE AUTO-REGISTRANT — registers EVERY `Cascades/Extended/<name>/` subdirectory that
// no concept code speaks for (the runtime-forged Suite 8 designations · e.g. Isomorphic Expanse)
// onto the `cascades` Record. BOOT sweeps existing dirs; a live depth-0 addDir watch registers a
// NEWLY forged designation immediately. Same muxium (d.suiteCascade.e.* in scope) · idempotent
// against Cadmium's self-registration. This is the pairing of the watcher's Extended CONVENTION with
// the file system's Extended REALITY — closes the gap where a forged dir was never watched.
import { extendedCascadeAutoRegistrationPrinciple } from './principles/extendedCascadeAutoRegistration.principle.huirth';
// SCRR · Diametric Real — server leg for client-on-load cascade request.
import { suiteCascadeSendCascadeRequestHuirth } from './qualities/suiteCascadeSendCascadeRequest.quality.huirth.diameter';

// Explicit quality mapping — NEVER typeof.
const suiteCascadeHuirthQualities: SuiteCascadeHuirthQualities = {
  suiteCascadeSetCascadeHuirthBase,
  suiteCascadeSetActiveCascadeFilesHuirthBase,
  suiteCascadeSetActiveCascadeDirectoryHuirthBase,
  suiteCascadeSetCascadeRelay,
  suiteCascadeSetActiveCascadeFilesRelay,
  suiteCascadeSetActiveCascadeDirectoryRelay,
  // SCRR · Diametric Real — receives client sentinel + responds with Huirth cascades.
  suiteCascadeSendCascadeRequest: suiteCascadeSendCascadeRequestHuirth,
};

export const createSuiteCascadeHuirthConcept = () =>
  createConcept(
    suiteCascadeName,
    createSuiteCascadeHuirthState(),
    suiteCascadeHuirthQualities,
    // WCJF — the Cascade.json chokidar watcher principle (Base→Relay · SBIS).
    // BOCR — backfill-on-connect replay to newly-connecting WebSocket clients.
    // SMRP — selector-driven broadcast on every cascades state change.
    [
      suiteCascadeJsonWatcherPrinciple,
      suiteCascadeBackfillOnConnectPrinciple,
      suiteCascadeStateMirrorPrinciple,
      // C3-D3-b SCSF · independent NCEC-safe Cadmium :OK: monitor (own plan · dispatches legally).
      cadmiumOkMonitorPrinciple,
      // DPASL-D1 · Cadmium first-registrant — registers 'Cadmium Researcher' onto the
      // Cascade Registry on load (own one-shot plan · dispatches d.suiteCascade.e.* legally).
      cadmiumCascadeRegistrationPrinciple,
      // DPASL-D1 · Forge auto-registrant — registers every runtime-forged Cascades/Extended/<name>/
      // designation onto the Registry (BOOT sweep + live depth-0 addDir watch · idempotent against
      // Cadmium's self-registration · dispatches d.suiteCascade.e.* legally).
      extendedCascadeAutoRegistrationPrinciple,
    ],
  );
