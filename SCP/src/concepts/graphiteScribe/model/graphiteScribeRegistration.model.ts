/**
 * GraphiteScribe Registration Model File — MPRF (Model-File-as-Registration-Function)
 *
 * Pure functions: zero Stratimux imports, zero dispatch. Any Suite 8 that
 * muxifies the GraphiteScribe concept imports `buildGraphiteScribeRegistration` and calls it
 * with its own Name + params to produce the GraphiteScribeEntry it will register.
 *
 * NDEP (Name-as-Directory-Entry-Proof): the `name` parameter IS the literal
 * directory entry under `Cascades/8_SUITES/<name>/`. No slug, no
 * normalization — renaming the directory MUST be accompanied by renaming the
 * registration call, making the coupling explicit and traceable.
 *
 * Usage (by a Suite 8 that muxifies GraphiteScribe):
 *
 *   import { buildGraphiteScribeRegistration } from
 *     '../graphiteScribe/model/graphiteScribeRegistration.model';
 *
 *   const entry = buildGraphiteScribeRegistration({
 *     name: 'Cadmium Researcher',
 *     description: 'Spawned ClaudeCode Instance Page Island',
 *     color: '#c44d22',
 *   });
 *
 *   // → entry.name          = 'Cadmium Researcher'
 *   // → entry.directoryPath = 'Cascades/8_SUITES/Cadmium Researcher/'
 *
 * The GraphiteScribe registration principle (`graphiteScribeRegistration.principle.client.ts`)
 * uses `buildGraphiteScribeRegistration` to seed the known directory names at boot.
 *
 * Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md Band A-2 MPRF + NDEP.
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts
 *           (Model-File-as-Principle-Function convention).
 */
import type { GraphiteScribeEntry } from '../graphiteScribe.type';

// ============================================
// REGISTER PARAMS — the shape a Suite 8 passes when calling buildGraphiteScribeRegistration
// ============================================

export type GraphiteScribeRegisterParams = {
  name: string;        // NDEP — literal directory entry; drives directoryPath derivation
  description: string;
  color: string;
};

// ============================================
// MPRF — the primary export; any Suite 8 imports + calls this
// ============================================

export function buildGraphiteScribeRegistration(params: GraphiteScribeRegisterParams): GraphiteScribeEntry {
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

export const KNOWN_GRAPHITESCRIBE_ENTRIES: GraphiteScribeEntry[] = [
  buildGraphiteScribeRegistration({
    name: 'Teal Claude',
    description: 'Conductor · Band assignment · Shatterite Menu',
    color: '#008080',
  }),
  buildGraphiteScribeRegistration({
    name: 'Stratimuxian Scholar',
    description: 'Stratimux framework reference · code patterns · quality creation',
    color: '#4a5568',
  }),
  buildGraphiteScribeRegistration({
    name: 'Stratimuxian Automata',
    description: 'Autonomous Cascade Engagement via /loop',
    color: '#2d3748',
  }),
  buildGraphiteScribeRegistration({
    name: 'Pewter Tessera',
    description: 'HiFi Design System Maintainer · Suite 8 Dynamic',
    color: '#9aa0a8',
  }),
  buildGraphiteScribeRegistration({
    name: 'Cadmium Researcher',
    description: 'Spawned ClaudeCode Instance Page Island',
    color: '#c44d22',
  }),
  buildGraphiteScribeRegistration({
    name: 'SCP Researcher',
    description: 'Personal SCP Designation Manager · SCP Adapt cascade',
    color: '#a35e3b',
  }),
  buildGraphiteScribeRegistration({
    name: 'SCS Bridge',
    description: 'Bridge runtime Suite 8 · session management',
    color: '#2b6cb0',
  }),
  buildGraphiteScribeRegistration({
    name: 'Fresh Slate',
    description: 'Fresh Slate Suite 8',
    color: '#718096',
  }),
  buildGraphiteScribeRegistration({
    name: 'Cinnabar Dialectic',
    description: 'Cinnabar Dialectic Suite 8',
    color: '#9b2c2c',
  }),
];
