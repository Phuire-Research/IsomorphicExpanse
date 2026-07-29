/**
 * strativerseMethodPatternsInfo - Returns method creator patterns with DECK K and muxiumTimeOut
 *
 * Citation: STRATIMUX-REFERENCE.md: DECK K Constant Pattern (2592-2904)
 *
 * Type: 'Strativerse Method Patterns Info' (Verbose Split)
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

export type StrativerseMethodPatternsInfo = Quality<StrativerseState>;

export const strativerseMethodPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Method Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Method Creator Patterns with DECK K and muxiumTimeOut',
        citation: 'STRATIMUX-REFERENCE.md: DECK K Constant Pattern (2592-2904)',
        methodTypeSelection: [
          { methodType: 'none', function: 'No method', stateAccess: 'N/A', useCase: 'State-only qualities that do NOT participate in ActionStrategy chains (rare)' },
          { methodType: 'default', function: 'defaultMethodCreator', stateAccess: 'N/A', useCase: 'REQUIRED for reducer-only qualities that participate in ActionStrategy chains — auto-succeeds strategy to advance to next node' },
          { methodType: 'simple', function: 'defaultMethodCreator', stateAccess: 'None', useCase: '70%+ of qualities - fire-and-forget' },
          { methodType: 'withConcepts', function: 'createMethodWithConcepts', stateAccess: 'deck.conceptName.k.getState(concepts_)', useCase: 'State access, strategy chains' },
        ],
        deckKPatterns: {
          stateAccess: {
            name: 'State Access via deck.conceptName.k.getState(concepts_)',
            code: 'methodCreator: () => createMethodWithConcepts(({ action, deck, concepts_ }) => {\n  const state = deck.strativerse.k.getState(concepts_) as StrativerseState;\n  const someValue = state.someProperty;\n  const otherValue = state.otherProperty;\n  if (action.strategy) {\n    return strategySuccess(action.strategy,\n      strategyData_muxifyData(action.strategy, { someValue, otherValue }));\n  }\n  return muxiumConclude();\n})',
            useWhen: 'Need state values from own or other concepts',
            access: 'deck.conceptName.k.getState(concepts_) cast as ConceptState',
            performance: 'Canonical pattern for method state access',
            critical: 'NEVER use k__ in methods — k__ does not exist on MethodWithConceptsParams',
          },
        },
        patternSelection: [
          { need: 'Own concept state', accessSyntax: 'deck.strativerse.k.getState(concepts_) as StrativerseState' },
          { need: 'Other concept state', accessSyntax: 'deck.otherConcept.k.getState(concepts_) as OtherState' },
          { need: 'Muxified concept state', accessSyntax: 'deck.parent.d.muxified.k.getState(concepts_)' },
        ],
        strategyIntegration: {
          strategySuccess: 'return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { data }));',
          strategyFailed: 'return strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, errorInfo));',
          strategyDecide: 'return strategyDecide(action.strategy, "decisionKey", optionalData);',
        },
        muxiumTimeOut: {
          description: 'Dispatch follow-up actions WITHOUT blocking current quality execution',
          code: 'methodCreator: () => createMethodWithConcepts(({ action, concepts_ }) => {\n  muxiumTimeOut(concepts_, () => someFollowUpAction(), 30);\n  muxiumTimeOut(concepts_, () => notificationAction(), 100);\n  if (action.strategy) return strategySuccess(action.strategy);\n  return muxiumConclude();\n})',
          whenToUse: [
            'Notifications that should not block strategy',
            'Follow-up cleanup operations',
            'Side effects that do not affect current operation result',
            'Deferred state synchronization',
          ],
          importantNotes: [
            'Quality returns IMMEDIATELY - does not wait for timeout',
            'Timeout actions fire AFTER quality method completes',
            'Multiple timeouts can be scheduled with different delays',
            'Use for non-blocking side effects only',
          ],
        },
        asyncMethodPattern: {
          code: 'methodCreator: () => createAsyncMethodWithConcepts(({ controller, action, deck, concepts_ }) => {\n  const state = deck.strativerse.k.getState(concepts_) as StrativerseState;\n  asyncModelFunction(state.config)\n    .then((result) => {\n      if (action.strategy) {\n        controller.fire(strategySuccess(action.strategy,\n          strategyData_muxifyData(action.strategy, { result })));\n      } else {\n        controller.fire(muxiumConclude());\n      }\n    })\n    .catch((error) => {\n      console.error(error);\n      if (action.strategy) {\n        controller.fire(strategySuccess(action.strategy));\n      } else {\n        controller.fire(muxiumConclude());\n      }\n    });\n})',
          notes: [
            'Use createAsyncMethodWithConcepts with BASE function (NOT async arrow)',
            'Use .then() and .catch() for async operations — NEVER async/await',
            'Use controller.fire() instead of return',
            'Access state via deck.conceptName.k.getState(concepts_)',
            'Always handle both .then() and .catch() paths',
            'Pair with nullReducer (async handles everything)',
          ],
        },
        antiPatterns: [
          {
            wrong: 'createAsyncMethodWithConcepts(async ({ controller, action }) => { await something(); })',
            correct: 'createAsyncMethodWithConcepts(({ controller, action }) => { something().then(() => controller.fire(...)).catch(...); })',
            reason: 'NEVER use async arrow — use base function with .then() chains for consistency',
          },
          {
            wrong: 'createMethodWithConcepts(({ action, k__ }) => { k__.property.select(); })',
            correct: 'createMethodWithConcepts(({ action, deck, concepts_ }) => { deck.concept.k.getState(concepts_) as State; })',
            reason: 'k__ does not exist on MethodWithConceptsParams — use deck.conceptName.k.getState(concepts_)',
          },
          {
            wrong: 'await muxiumTimeOut(concepts_, () => action(), 30);',
            correct: 'muxiumTimeOut(concepts_, () => action(), 30); return strategySuccess(...);',
            reason: 'muxiumTimeOut is fire-and-forget, not awaitable',
          },
          {
            wrong: 'createQualityCard({ type: "...", reducer: (state, action) => { /* extract strategyData */ } }) // No methodCreator',
            correct: 'createQualityCard({ type: "...", reducer: (state, action) => { /* extract strategyData */ }, methodCreator: defaultMethodCreator })',
            reason: 'Without methodCreator, strategySuccess is never called — the strategy HALTS at this node. All qualities in an ActionStrategy chain MUST have a methodCreator.',
          },
        ],
        relatedTools: [
          { tool: 'strativerse_quality_patterns_info', purpose: 'Quality patterns using these methods' },
          { tool: 'strativerse_reducer_patterns_info', purpose: 'When reducer vs method handles logic' },
          { tool: 'strativerse_strategy_patterns_info', purpose: 'Full ActionStrategy architecture' },
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
