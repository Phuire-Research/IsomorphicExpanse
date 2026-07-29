/**
 * GitM Concept Factory (Client-Side)
 *
 * The BASE client concept (BASE_CONCEPTS_CREATORS) holding the gitm.json relay reception.
 * Registers ONLY the relay quality (gitmSetGitmJson · NO Base quality on the client ·
 * TQNI invariant). Explicit quality map — NEVER typeof.
 *
 * Citation: cadmium.concept.client.ts (explicit quality map · createConcept shape).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W1 gitm.concept.client.ts.
 */
import { createConcept } from 'stratimux';
import { gitmClientName, type GitmClientQualities } from './gitm.type';
import { createGitmClientState } from './gitm.state';
import { gitmSetGitmJson } from './qualities/gitmSetGitmJson.quality.client';
// GITM Staging-Update (D-U4.2) — the diff/resolved RELAY-reception qualities (Relay-only on
// the client · the Base variants stay Huirth-only · TQNI invariant).
import { gitmSetUpdateDiff } from './qualities/gitmSetUpdateDiff.quality.client';
import { gitmSetUpdateResolved } from './qualities/gitmSetUpdateResolved.quality.client';
// GITM A↔B Refinement (#641-R) · W4 — the read-only display principle syncs gitmJson
// into the global gitm controller (replaces the per-button /gitm-status polls).
import { gitmDisplayPrinciple } from './principles/gitmDisplay.principle.client';

const gitmClientQualities: GitmClientQualities = {
  gitmSetGitmJson,
  gitmSetUpdateDiff,
  gitmSetUpdateResolved,
};

export const createGitmClientConcept = () =>
  createConcept(
    gitmClientName,
    createGitmClientState(),
    gitmClientQualities,
    [gitmDisplayPrinciple],
  );
