/**
 * strativerseReducerPatternsInfo - Returns Shortest Path Principle for reducers
 *
 * Citation: STRATIMUX-REFERENCE.md: Critical Reducer Performance Optimization (3642-3860)
 *
 * Type: 'Strativerse Reducer Patterns Info' (Verbose Split)
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

export type StrativerseReducerPatternsInfo = Quality<StrativerseState>;

export const strativerseReducerPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Reducer Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'The Shortest Path Principle',
        citation: 'STRATIMUX-REFERENCE.md: Critical Reducer Performance Optimization (3642-3860)',
        coreRule: 'Reducers must return ONLY changed properties. Never spread full state.',
        correctPattern: {
          code: 'reducer: (state) => ({\n  count: state.count + 1  // Only this property\n})',
          description: 'Partial State Return - Only changed properties',
        },
        wrongPattern: {
          code: 'reducer: (state) => ({\n  ...state,\n  count: state.count + 1\n})',
          description: 'Full State Spread - defeats reactivity optimization',
        },
        whyItMatters: [
          'Stratimux reactivity system depends on detecting which properties changed',
          'Full state spread triggers unnecessary re-renders across all selectors',
          'Partial returns enable targeted subscriber notifications',
        ],
        decisionMatrix: [
          { scenario: 'Property changes value', returnPattern: '{ prop: newValue }', example: '{ count: state.count + 1 }' },
          { scenario: 'Multiple properties change', returnPattern: '{ propA: newA, propB: newB }', example: '{ name: "new", age: 25 }' },
          { scenario: 'No state change needed', returnPattern: '{}', example: 'Informative qualities' },
          { scenario: 'Method handles all logic', returnPattern: 'Use defaultReducer', example: 'Strategy-enabled qualities' },
          { scenario: 'Async method handles logic', returnPattern: 'Use nullReducer', example: 'API call qualities' },
        ],
        complexUpdatePatterns: [
          {
            name: 'Array Append (Immutable)',
            code: 'reducer: (state, action) => ({\n  items: [...state.items, action.payload.newItem]\n})',
          },
          {
            name: 'Array Filter (Immutable)',
            code: 'reducer: (state, action) => ({\n  items: state.items.filter(item => item.id !== action.payload.removeId)\n})',
          },
          {
            name: 'Array Update at Index (Immutable)',
            code: 'reducer: (state, action) => ({\n  items: state.items.map((item, idx) =>\n    idx === action.payload.index ? action.payload.newItem : item\n  )\n})',
          },
          {
            name: 'Nested Object Update',
            code: 'reducer: (state, action) => ({\n  config: {\n    ...state.config,  // Spread ONLY the nested object\n    setting: action.payload.newSetting\n  }\n})',
          },
          {
            name: 'Map/Record Update',
            code: 'reducer: (state, action) => ({\n  entityMap: {\n    ...state.entityMap,\n    [action.payload.id]: action.payload.entity\n  }\n})',
          },
        ],
        antiPatterns: [
          {
            name: 'Full state spread at root',
            wrong: 'reducer: (state) => ({ ...state, count: state.count + 1 })',
            problem: 'Triggers all property selectors',
          },
          {
            name: 'Mutating state directly',
            wrong: 'reducer: (state) => { state.count++; return state; }',
            problem: 'Breaks immutability, reactivity fails',
          },
          {
            name: 'Returning undefined',
            wrong: 'reducer: (state) => { if (condition) return { count: 1 }; }',
            problem: 'Implicit undefined return breaks system',
            correct: 'Always return object: return {};',
          },
        ],
        relatedTools: [
          { tool: 'strativerse_quality_patterns_info', purpose: 'Quality patterns using these reducers' },
          { tool: 'strativerse_method_patterns_info', purpose: 'When method vs reducer handles logic' },
          { tool: 'strativerse_quality_create', purpose: 'Create quality with specification' },
        ],
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
