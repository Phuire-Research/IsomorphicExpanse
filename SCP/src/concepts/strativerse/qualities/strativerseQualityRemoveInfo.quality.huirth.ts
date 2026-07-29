/**
 * strativerseQualityRemoveInfo - Informative for Means 4 (Quality Remove)
 *
 * Documents the Quality Remove strategy: specification structure,
 * 9-node removal chain, no-op safe SCP removal pattern, and
 * regex patterns used for file modifications.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.1
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Key Insight #8
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


export type StrativerseQualityRemoveInfo = Quality<StrativerseState>;

export const strativerseQualityRemoveInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Quality Remove Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 4: Quality Remove Specification',
        citation: 'SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md: Phase 2.1',
        purpose: 'Remove a quality with all file modifications reversed (reverse of Means 1)',
        specificationStructure: {
          type: 'QualityRemovalSpecification',
          fields: [
            { field: 'qualityName', type: 'string', required: true, description: 'camelCase quality variable name to remove' },
            { field: 'conceptName', type: 'string', required: true, description: 'Target concept name (e.g., strativerse)' },
            { field: 'location', type: "'huirth' | 'client' | 'all'", required: true, description: 'Quality location suffix for file name generation' },
            { field: 'diameter', type: 'boolean', required: true, description: 'Whether quality has diameter suffix' },
          ],
        },
        nodeChain: {
          totalNodes: 9,
          description: 'Reverse of Means 1 creation chain. Built in reverse order (Node 9 first, Node 1 as initialNode).',
          nodes: [
            'Node 1: Remove SCP metadata from muxonomy.ts (Means 5 inline - no-op if not found)',
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
        noOpSafePattern: {
          description: 'Node 1 always attempts SCP metadata removal regardless of whether quality has SCP registration',
          mechanism: 'grepReplaceInFiles with 0 matches succeeds with 0 replacements - no branching needed',
          benefit: 'Single linear chain handles both SCP-registered and non-SCP qualities without decision nodes',
        },
        regexPatterns: {
          scpMetadata: 'Uses [\\s\\S]*? (non-greedy any-including-newlines) for nested {} in inputSchema blocks',
          demometer: 'Uses [^}]* for flat objects (no nested braces in quality demometer entries)',
          conceptModifications: 'Line-anchored patterns with \\n\\s* for precise single-line removal',
        },
        selfReferentialCurrying: {
          description: 'Means 4 is a strategy-based SCP tool. To invoke it, use the jq --rawfile currying pattern.',
          workflow: [
            'Step 1: Build JSON spec with removal specification',
            'Step 2: Write spec to /tmp/remove_spec.json',
            'Step 3: curl -d @/tmp/remove_spec.json (no file content to curry - spec is metadata only)',
          ],
          note: 'Unlike creation tools, Means 4 does not require file content currying. The specification is pure metadata.',
        },
        relatedTools: [
          { tool: 'strativerse_quality_create', purpose: 'Means 1 - reverse operation (creation)' },
          { tool: 'strativerse_oneshot_quality_remove', purpose: 'Means 6 - combined quality + SCP removal with explicit SCP spec' },
          { tool: 'strativerse_quality_create_info', purpose: 'Creation counterpart documentation' },
        ],
        pairedActionable: 'strativerse_quality_remove',
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
