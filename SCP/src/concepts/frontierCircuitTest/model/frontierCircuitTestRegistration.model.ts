/**
 * FrontierCircuitTest Registration Model File — MPRF (Model-File-as-Registration-Function)
 *
 * Pure functions: zero Stratimux imports, zero dispatch. Any Suite 8 that
 * muxifies the FrontierCircuitTest concept imports `buildFrontierCircuitTestRegistration` and calls it
 * with its own Name + params to produce the FrontierCircuitTestEntry it will register.
 *
 * NDEP (Name-as-Directory-Entry-Proof): the `name` parameter IS the literal
 * directory entry under `Cascades/8_SUITES/<name>/`. No slug, no
 * normalization — renaming the directory MUST be accompanied by renaming the
 * registration call, making the coupling explicit and traceable.
 *
 * Usage (by a Suite 8 that muxifies FrontierCircuitTest):
 *
 *   import { buildFrontierCircuitTestRegistration } from
 *     '../frontierCircuitTest/model/frontierCircuitTestRegistration.model';
 *
 *   const entry = buildFrontierCircuitTestRegistration({
 *     name: 'Cadmium Researcher',
 *     description: 'Spawned ClaudeCode Instance Page Island',
 *     color: '#c44d22',
 *   });
 *
 *   // → entry.name          = 'Cadmium Researcher'
 *   // → entry.directoryPath = 'Cascades/8_SUITES/Cadmium Researcher/'
 *
 * The FrontierCircuitTest registration principle (`frontierCircuitTestRegistration.principle.client.ts`)
 * uses `buildFrontierCircuitTestRegistration` to seed the known directory names at boot.
 *
 * Citation: MASTER-DIAMOND-FRONTIERCIRCUITTEST-CONCEPT-ASPIRANT.md Band A-2 MPRF + NDEP.
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts
 *           (Model-File-as-Principle-Function convention).
 */
import type { FrontierCircuitTestEntry } from '../frontierCircuitTest.type';

// ============================================
// REGISTER PARAMS — the shape a Suite 8 passes when calling buildFrontierCircuitTestRegistration
// ============================================

export type FrontierCircuitTestRegisterParams = {
  name: string;        // NDEP — literal directory entry; drives directoryPath derivation
  description: string;
  color: string;
};

// ============================================
// MPRF — the primary export; any Suite 8 imports + calls this
// ============================================

export function buildFrontierCircuitTestRegistration(params: FrontierCircuitTestRegisterParams): FrontierCircuitTestEntry {
  const { name, description, color } = params;
  return {
    name,
    directoryPath: `Cascades/8_SUITES/${name}/`,
    description,
    color,
  };
}

// ============================================
// KNOWN SEED ENTRIES — the authoritative 8_SUITES directory list at boot.
// Consumed by the registration principle to pre-populate SPSR at startup.
// Each entry derives `directoryPath` from its Name (NDEP).
// ============================================

export const KNOWN_FRONTIERCIRCUITTEST_ENTRIES: FrontierCircuitTestEntry[] = [
  buildFrontierCircuitTestRegistration({
    name: 'Teal Claude',
    description: 'Conductor · Band assignment · Shatterite Menu',
    color: '#008080',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'Stratimuxian Scholar',
    description: 'Stratimux framework reference · code patterns · quality creation',
    color: '#4a5568',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'Stratimuxian Automata',
    description: 'Autonomous Cascade Engagement via /loop',
    color: '#2d3748',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'Pewter Tessera',
    description: 'HiFi Design System Maintainer · Suite 8 Dynamic',
    color: '#9aa0a8',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'Cadmium Researcher',
    description: 'Spawned ClaudeCode Instance Page Island',
    color: '#c44d22',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'SCP Researcher',
    description: 'Personal SCP Designation Manager · SCP Adapt cascade',
    color: '#a35e3b',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'SCS Bridge',
    description: 'Bridge runtime Suite 8 · session management',
    color: '#2b6cb0',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'Fresh Slate',
    description: 'Fresh Slate Suite 8',
    color: '#718096',
  }),
  buildFrontierCircuitTestRegistration({
    name: 'Cinnabar Dialectic',
    description: 'Cinnabar Dialectic Suite 8',
    color: '#9b2c2c',
  }),
  // NDEP · NO SPACE — byte-matches Cascades/8_SUITES/IsomorphicExpanse/ AND
  // Cascades/Extended/IsomorphicExpanse/ AND the NPC name the anchor resolves on.
  // Without this entry frontierCircuitTestMenuWatch arms NO watcher for the designation and the
  // page's keyed menuStage stays EMPTY_MENU_STAGE forever.
  buildFrontierCircuitTestRegistration({
    name: 'IsomorphicExpanse',
    description: 'Isomorphic game world · NPC dialog anchor · agent-authored menu',
    color: '#3fb6a8',
  }),
];
