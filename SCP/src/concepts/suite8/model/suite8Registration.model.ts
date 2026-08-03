/**
 * Suite8 Registration Model File — MPRF (Model-File-as-Registration-Function)
 *
 * Pure functions: zero Stratimux imports, zero dispatch. Any Suite 8 that
 * muxifies the Suite8 concept imports `buildSuite8Registration` and calls it
 * with its own Name + params to produce the Suite8Entry it will register.
 *
 * NDEP (Name-as-Directory-Entry-Proof): the `name` parameter IS the literal
 * directory entry under `Cascades/8_SUITES/<name>/`. No slug, no
 * normalization — renaming the directory MUST be accompanied by renaming the
 * registration call, making the coupling explicit and traceable.
 *
 * Usage (by a Suite 8 that muxifies Suite8):
 *
 *   import { buildSuite8Registration } from
 *     '../suite8/model/suite8Registration.model';
 *
 *   const entry = buildSuite8Registration({
 *     name: 'Cadmium Researcher',
 *     description: 'Spawned ClaudeCode Instance Page Island',
 *     color: '#c44d22',
 *   });
 *
 *   // → entry.name          = 'Cadmium Researcher'
 *   // → entry.directoryPath = 'Cascades/8_SUITES/Cadmium Researcher/'
 *
 * The Suite8 registration principle (`suite8Registration.principle.client.ts`)
 * uses `buildSuite8Registration` to seed the known directory names at boot.
 *
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md Band A-2 MPRF + NDEP.
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts
 *           (Model-File-as-Principle-Function convention).
 */
import type { Suite8Entry } from '../suite8.type';

// ============================================
// REGISTER PARAMS — the shape a Suite 8 passes when calling buildSuite8Registration
// ============================================

export type Suite8RegisterParams = {
  name: string;        // NDEP — literal directory entry; drives directoryPath derivation
  description: string;
  color: string;
};

// ============================================
// MPRF — the primary export; any Suite 8 imports + calls this
// ============================================

export function buildSuite8Registration(params: Suite8RegisterParams): Suite8Entry {
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

export const KNOWN_SUITE8_ENTRIES: Suite8Entry[] = [
  buildSuite8Registration({
    name: 'Teal Claude',
    description: 'Conductor · Band assignment · Shatterite Menu',
    color: '#008080',
  }),
  buildSuite8Registration({
    name: 'Stratimuxian Scholar',
    description: 'Stratimux framework reference · code patterns · quality creation',
    color: '#4a5568',
  }),
  buildSuite8Registration({
    name: 'Stratimuxian Automata',
    description: 'Autonomous Cascade Engagement via /loop',
    color: '#2d3748',
  }),
  buildSuite8Registration({
    name: 'Pewter Tessera',
    description: 'HiFi Design System Maintainer · Suite 8 Dynamic',
    color: '#9aa0a8',
  }),
  buildSuite8Registration({
    name: 'Cadmium Researcher',
    description: 'Spawned ClaudeCode Instance Page Island',
    color: '#c44d22',
  }),
  buildSuite8Registration({
    name: 'SCP Researcher',
    description: 'Personal SCP Designation Manager · SCP Adapt cascade',
    color: '#a35e3b',
  }),
  buildSuite8Registration({
    name: 'SCS Bridge',
    description: 'Bridge runtime Suite 8 · session management',
    color: '#2b6cb0',
  }),
  buildSuite8Registration({
    name: 'Fresh Slate',
    description: 'Fresh Slate Suite 8',
    color: '#718096',
  }),
  buildSuite8Registration({
    name: 'Cinnabar Dialectic',
    description: 'Cinnabar Dialectic Suite 8',
    color: '#9b2c2c',
  }),
];
