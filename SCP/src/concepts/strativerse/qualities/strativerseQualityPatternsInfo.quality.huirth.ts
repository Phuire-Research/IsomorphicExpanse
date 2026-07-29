/**
 * strativerseQualityPatternsInfo - Returns 6 quality patterns with working code examples
 *
 * Citation: STRATIMUX-REFERENCE.md: Quality Creation Patterns (2905-3191)
 *
 * Type: 'Strativerse Quality Patterns Info' (Verbose Split)
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

export type StrativerseQualityPatternsInfo = Quality<StrativerseState>;

export const strativerseQualityPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Quality Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: '6 Quality Patterns with Working Code',
        citation: 'STRATIMUX-REFERENCE.md: Quality Creation Patterns (2905-3191)',
        patterns: [
          {
            name: 'Pattern 1: Simple Quality (No Payload)',
            code: 'createQualityCard with partial reducer return',
            useCase: 'Basic state toggle, counters, boolean flips',
          },
          {
            name: 'Pattern 2: Payload Quality (With Parameters)',
            code: 'createQualityCardWithPayload with action.payload',
            useCase: 'Parameterized updates, setter actions',
          },
          {
            name: 'Pattern 3: Informative Quality (No State Change)',
            code: 'reducer returns {}, method returns strategySuccess',
            useCase: 'Documentation tools, logging, strategy pass-through',
          },
          {
            name: 'Pattern 4: Strategy-Enabled Quality (With Data)',
            code: 'strategyData_muxifyData to carry data forward',
            useCase: 'Strategy chains that carry data forward',
          },
          {
            name: 'Pattern 5: Async Quality (External Operations)',
            code: 'createAsyncMethodWithConcepts with controller.fire',
            useCase: 'API calls, file I/O, external service integration',
          },
          {
            name: 'Pattern 6: Deferred Action (muxiumTimeOut)',
            code: 'muxiumTimeOut for non-blocking follow-ups',
            useCase: 'Notifications, follow-up actions',
          },
        ],
        relatedTools: ['strativerse_reducer_patterns_info', 'strativerse_method_patterns_info'],
      };
      if (action.strategy) {
        return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, informativeContent));
      }
      return muxiumConclude();
    }),
});
