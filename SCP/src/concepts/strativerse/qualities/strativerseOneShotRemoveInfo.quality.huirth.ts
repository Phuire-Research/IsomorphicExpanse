/**
 * strativerseOneShotRemoveInfo - Informative for Means 6 (OneShot Quality + SCP Remove)
 *
 * Documents the unified removal strategy: specification structure mirroring
 * Means 3, 9-node removal chain, and explicit SCP toolName requirement.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.2
 */
import {
  createQualityCard,
  createMethodWithConcepts,
  strategySuccess,
  strategyData_muxifyData,
  muxiumConclude,
  defaultReducer,
  type Quality,
} from 'stratimux';
import type { StrativerseState } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';


export type StrativerseOneShotRemoveInfo = Quality<StrativerseState>;

export const strativerseOneShotRemoveInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse One Shot Remove Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 6: OneShot Quality + SCP Remove Specification',
        citation: 'SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md: Phase 2.2',
        purpose: 'Unified removal of quality AND SCP registration (reverse of Means 3)',
        specificationStructure: {
          type: 'OneShotRemovalSpecification',
          description: 'Mirrors Means 3 OneShotQualitySCPSpecification with quality + scp sub-objects',
          fields: [
            { field: 'quality.qualityName', type: 'string', required: true, description: 'camelCase quality variable name to remove' },
            { field: 'quality.conceptName', type: 'string', required: true, description: 'Target concept name' },
            { field: 'quality.location', type: "'huirth' | 'client' | 'all'", required: true, description: 'Quality location suffix' },
            { field: 'quality.diameter', type: 'boolean', required: true, description: 'Whether quality has diameter suffix' },
            { field: 'scp.toolName', type: 'string', required: true, description: 'SCP tool name to remove from metadata' },
          ],
        },
        means6VsMeans4: {
          means4: 'Quality Remove - takes flat QualityRemovalSpecification, SCP removal is no-op safe (may or may not find SCP entry)',
          means6: 'OneShot Remove - takes nested { quality, scp } spec, explicitly documents SCP tool being removed',
          recommendation: 'Use Means 6 when you KNOW the quality has SCP registration and want explicit documentation. Use Means 4 for quality-only removal.',
        },
        nodeChain: {
          totalNodes: 9,
          description: 'Same chain as Means 4. Spec structure mirrors Means 3 with { quality: {...}, scp: { toolName } }.',
          nodes: [
            'Node 1: Remove SCP metadata from muxonomy.ts (explicit - toolName known)',
            'Node 2: Remove from conceptQualities object in concept.ts',
            'Node 3: Remove from ConceptQualities type in concept.ts',
            'Node 4: Remove type export from concept.ts',
            'Node 5: Remove import from concept.ts',
            'Node 6: Remove demometer entry from muxonomy.ts',
            'Node 7: Remove export from index.ts',
            'Node 8: Remove type definitions from types.ts',
            'Node 9: Delete quality file via fileSystemRemoveTargetDirectory',
          ],
        },
        bidirectionalParity: {
          creation: 'Means 3 (strativerse_oneshot_quality_scp) - { quality: {...}, scp: {...} }',
          removal: 'Means 6 (strativerse_oneshot_quality_remove) - { quality: {...}, scp: { toolName } }',
          symmetry: 'Input structure mirrors creation spec. Removal needs only identity fields, not full creation fields.',
        },
        relatedTools: [
          { tool: 'strativerse_oneshot_quality_scp', purpose: 'Means 3 - reverse operation (creation)' },
          { tool: 'strativerse_quality_remove', purpose: 'Means 4 - quality-only removal (no explicit SCP spec)' },
          { tool: 'strativerse_oneshot_info', purpose: 'Creation counterpart documentation' },
        ],
        pairedActionable: 'strativerse_oneshot_quality_remove',
      };

      if (action.strategy) {
        return strategySuccess(
          action.strategy,
          strategyData_muxifyData(action.strategy, informativeContent)
        );
      }
      return muxiumConclude();
    }),
});
