/**
 * IsomorphicExpanse Registration Model File — MPRF (Model-File-as-Registration-Function)
 *
 * Pure functions: zero Stratimux imports, zero dispatch. Any Suite 8 that
 * muxifies the IsomorphicExpanse concept imports `buildIsomorphicExpanseRegistration` and calls it
 * with its own Name + params to produce the IsomorphicExpanseEntry it will register.
 *
 * NDEP (Name-as-Directory-Entry-Proof): the `name` parameter IS the literal
 * directory entry under `Cascades/8_SUITES/<name>/`. No slug, no
 * normalization — renaming the directory MUST be accompanied by renaming the
 * registration call, making the coupling explicit and traceable.
 *
 * Usage (by a Suite 8 that muxifies IsomorphicExpanse):
 *
 *   import { buildIsomorphicExpanseRegistration } from
 *     '../isomorphicExpanse/model/isomorphicExpanseRegistration.model';
 *
 *   const entry = buildIsomorphicExpanseRegistration({
 *     name: 'Cadmium Researcher',
 *     description: 'Spawned ClaudeCode Instance Page Island',
 *     color: '#c44d22',
 *   });
 *
 *   // → entry.name          = 'Cadmium Researcher'
 *   // → entry.directoryPath = 'Cascades/8_SUITES/Cadmium Researcher/'
 *
 * The IsomorphicExpanse registration principle (`isomorphicExpanseRegistration.principle.client.ts`)
 * uses `buildIsomorphicExpanseRegistration` to seed the known directory names at boot.
 *
 * Citation: MASTER-DIAMOND-ISOMORPHICEXPANSE-CONCEPT-ASPIRANT.md Band A-2 MPRF + NDEP.
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts
 *           (Model-File-as-Principle-Function convention).
 */
import type { IsomorphicExpanseEntry } from '../isomorphicExpanse.type';

// ============================================
// REGISTER PARAMS — the shape a Suite 8 passes when calling buildIsomorphicExpanseRegistration
// ============================================

export type IsomorphicExpanseRegisterParams = {
  name: string;        // NDEP — literal directory entry; drives directoryPath derivation
  description: string;
  color: string;
};

// ============================================
// MPRF — the primary export; any Suite 8 imports + calls this
// ============================================

export function buildIsomorphicExpanseRegistration(params: IsomorphicExpanseRegisterParams): IsomorphicExpanseEntry {
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

export const KNOWN_ISOMORPHICEXPANSE_ENTRIES: IsomorphicExpanseEntry[] = [
  buildIsomorphicExpanseRegistration({
    name: 'Teal Claude',
    description: 'Conductor · Band assignment · Shatterite Menu',
    color: '#008080',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'Stratimuxian Scholar',
    description: 'Stratimux framework reference · code patterns · quality creation',
    color: '#4a5568',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'Stratimuxian Automata',
    description: 'Autonomous Cascade Engagement via /loop',
    color: '#2d3748',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'Pewter Tessera',
    description: 'HiFi Design System Maintainer · Suite 8 Dynamic',
    color: '#9aa0a8',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'Cadmium Researcher',
    description: 'Spawned ClaudeCode Instance Page Island',
    color: '#c44d22',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'SCP Researcher',
    description: 'Personal SCP Designation Manager · SCP Adapt cascade',
    color: '#a35e3b',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'SCS Bridge',
    description: 'Bridge runtime Suite 8 · session management',
    color: '#2b6cb0',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'Fresh Slate',
    description: 'Fresh Slate Suite 8',
    color: '#718096',
  }),
  buildIsomorphicExpanseRegistration({
    name: 'Cinnabar Dialectic',
    description: 'Cinnabar Dialectic Suite 8',
    color: '#9b2c2c',
  }),
  // Salvo B · THE-MINT-HAS-ITS-OWN-REGISTRY. THIS list — not KNOWN_SUITE8_ENTRIES — is what arms
  // isomorphicExpanseMenuWatch, whose dispatch writes isomorphicExpanse.shatteriteMenus, which is the
  // Record IsomorphicExpanseHomeLanding actually selects. Registering the designation in the suite8
  // registry instead fed suite8.shatteriteMenus (read by Suite8HomeLanding) and left THIS page's menu
  // permanently EMPTY_MENU_STAGE — the authored menu never reached the NPC chat buttons.
  buildIsomorphicExpanseRegistration({
    name: 'IsomorphicExpanse',
    description: 'Isomorphic game world · NPC dialog anchor · agent-authored menu',
    color: '#3fb6a8',
  }),
];
