/**
 * strativerseSCPUnregisterInfo - Informative for Means 5 (SCP Unregister - Inline)
 *
 * Documents the inline SCP unregistration pattern used as Node 1
 * in both Means 4 and Means 6 removal strategies.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Means 5 Design Decision
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


export type StrativerseSCPUnregisterInfo = Quality<StrativerseState>;

export const strativerseSCPUnregisterInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse SCP Unregister Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Means 5: SCP Unregister (Inline Pattern)',
        citation: 'SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md: Means 5 Design Decision',
        purpose: 'Remove SCP tool metadata entry from muxonomy.ts scpToolMetadata array',
        designDecision: {
          isStandalone: false,
          reason: 'Only strativerse_scp_tool_register (Means 2) is a standalone SCP registration tool',
          invocationPattern: 'Means 5 is invoked INLINE as Node 1 in Means 4 and Means 6 removal strategies',
          noOpSafe: 'grepReplaceInFiles with 0 matches succeeds with 0 replacements - always safe to attempt',
        },
        regexPattern: {
          description: 'Removes full SCP metadata block including optional comment lines and nested inputSchema',
          pattern: "\\n?\\s*(?:\\/\\/[^\\n]*\\n\\s*)*\\{\\n\\s*qualityName: 'NAME',[\\s\\S]*?\\} as SCPQualityMetadata,",
          components: [
            '\\n?\\s* - optional leading newline and whitespace',
            '(?:\\/\\/[^\\n]*\\n\\s*)* - optional comment lines above the block',
            "\\{\\n\\s*qualityName: 'NAME', - block start anchored to qualityName",
            '[\\s\\S]*? - non-greedy match across all nested content (handles inputSchema {})',
            '\\} as SCPQualityMetadata, - block end with type assertion',
          ],
          criticalNote: 'Uses [\\s\\S]*? NOT [^}]* because SCP metadata blocks contain nested {} in inputSchema',
        },
        whereInvoked: [
          { means: 'Means 4 (Quality Remove)', node: 'Node 1', behavior: 'No-op safe - 0 replacements if no SCP entry' },
          { means: 'Means 6 (OneShot Remove)', node: 'Node 1', behavior: 'Explicit - SCP toolName known from spec' },
        ],
        comparison: {
          means2: 'SCP Register (Means 2) - ADDS scpToolMetadata entry (standalone SCP tool)',
          means5: 'SCP Unregister (Means 5) - REMOVES scpToolMetadata entry (inline only)',
          symmetry: 'Bidirectional parity: Means 2 creates what Means 5 removes',
        },
        relatedTools: [
          { tool: 'strativerse_scp_register_info', purpose: 'Means 2 documentation - creation counterpart' },
          { tool: 'strativerse_quality_remove', purpose: 'Means 4 - invokes Means 5 inline as Node 1' },
          { tool: 'strativerse_oneshot_quality_remove', purpose: 'Means 6 - invokes Means 5 inline as Node 1' },
        ],
        pairedActionable: 'Inline with strativerse_quality_remove and strativerse_oneshot_quality_remove (not standalone)',
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
