/**
 * strativerseThreeMeansInfo - Informative tool providing Three Means SCP Tool Automation documentation
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 *
 * Type: 'Strativerse Three Means Info' (Verbose Split)
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


export type StrativerseThreeMeansInfo = Quality<StrativerseState>;

export const strativerseThreeMeansInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Three Means Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      // undefined
      if (action.strategy) {
        return strategySuccess(action.strategy);
      }
      return muxiumConclude();
    }),
});
