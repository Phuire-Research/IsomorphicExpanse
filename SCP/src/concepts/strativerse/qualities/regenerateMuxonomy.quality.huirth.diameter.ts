/**
 * regenerateMuxonomy Quality - Huirth Diameter (Server-side Executor)
 *
 * Triggers a rescan of a concept's muxonomy configuration after modifications.
 * For POC 2.3b, this triggers a concept rescan to reflect file changes.
 *
 * Future Enhancement: Full muxonomy.ts file regeneration with updated demometers.
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 *
 * SCOPE: Only Managed Concepts (hasMuxonomy: true)
 *
 * Type: 'Strativerse Regenerate Muxonomy' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  createMethodWithState,
  strategySuccess,
  strategyFailed,
  strategyData_appendFailure,
  strategyData_muxifyData,
  muxiumConclude,
} from 'stratimux';
import {
  type StrativerseState,
  type StrativerseModelDeck,
} from '../strativerse.type';

export type RegenerateMuxonomyPayload = {
  conceptName: string;
};

export const strativerseRegenerateMuxonomy = createQualityCardWithPayload<
  StrativerseState,
  RegenerateMuxonomyPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Regenerate Muxonomy',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithState(({ action, state }) => {
      const { conceptName } = action.payload;

      console.log('[StratiVERSE] Regenerate Muxonomy: Executing', {
        conceptName,
      });

      // Find concept in state
      const concept = state.conceptList.concepts.find(c => c.name === conceptName);
      if (!concept) {
        const error = `Concept not found: ${conceptName}`;
        console.error('[StratiVERSE] Regenerate Muxonomy:', error);
        if (action.strategy) {
          return strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error));
        }
        return muxiumConclude();
      }

      // Validate: Only managed concepts
      if (!concept.hasMuxonomy) {
        const error = `Concept is not managed (hasMuxonomy: false): ${conceptName}`;
        console.error('[StratiVERSE] Regenerate Muxonomy:', error);
        if (action.strategy) {
          return strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error));
        }
        return muxiumConclude();
      }

      // POC 2.3b: Signal success - the strategy chain will trigger rescan
      // Future: Actually regenerate the muxonomy.ts file with updated demometers
      console.log('[StratiVERSE] Regenerate Muxonomy: Signaling for rescan', {
        conceptName,
        qualityCount: concept.qualities.length,
        principleCount: concept.principles.length,
        strategyCount: concept.strategies.length,
      });

      if (action.strategy) {
        return strategySuccess(
          action.strategy,
          strategyData_muxifyData(action.strategy, {
            regeneratedConcept: conceptName,
            timestamp: Date.now(),
          })
        );
      }
      return muxiumConclude();
    }),
});
