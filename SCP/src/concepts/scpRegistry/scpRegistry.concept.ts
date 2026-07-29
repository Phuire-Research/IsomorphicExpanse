/**
 * SCP Registry Concept (Server-Side · Huirth Deployment) — M2-A1-D4
 *
 * Composes into huirth via muxifyConcepts. Owns Cascades/SCPs.json as
 * single source of truth for installed SCPs. Watcher principle (separate
 * file) arms fs.watch and pushes registry changes to clients.
 *
 * AJMI Extension 4 (Reactivity) — the watcher principle is what makes
 * SCS-Bridge reactive to SCPs.json without polling.
 *
 * Higher-Order Composition: muxified into huirth at Tier 2:
 *   d.huirth.d.scpRegistry.k.scps.select()
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D4 + §AJMI Extension 4
 * Citation: scpRegistry.type.ts (M2-P2 types)
 * Citation: scpRegistry.state.ts (state factory)
 * Citation: scpRegistryWatcher.principle.ts (fs.watch principle)
 */
import { createConcept } from 'stratimux';
import { scpRegistryName } from './scpRegistry.type';
import { createScpRegistryState } from './scpRegistry.state';
import { scpRegistryWatcherPrinciple } from './principles/scpRegistryWatcher.principle';

// Quality map is empty for M2-A1-D4 — qualities land as consumers materialize.
// (read/write/updateStatus emerge through M2-A1-D5 + M2-Final.)
// Empty quality map type per Stratimux pattern: Record<string, never>.
const scpRegistryQualities = {};

export const createScpRegistryConcept = (projectRoot?: string) => {
  return createConcept(
    scpRegistryName,
    createScpRegistryState(projectRoot),
    scpRegistryQualities,
    [scpRegistryWatcherPrinciple as never],
  );
};
