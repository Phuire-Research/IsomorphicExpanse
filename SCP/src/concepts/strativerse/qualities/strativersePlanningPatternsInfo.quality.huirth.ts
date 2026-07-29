/**
 * strativersePlanningPatternsInfo - Returns planning scope and stage patterns
 *
 * Citation: STRATIMUX-REFERENCE.md: Critical Planning Context Patterns (463-608)
 *
 * Type: 'Strativerse Planning Patterns Info' (Verbose Split)
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

export type StrativersePlanningPatternsInfo = Quality<StrativerseState>;

export const strativersePlanningPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Planning Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Planning Scope and Stage Patterns',
        citation: 'STRATIMUX-REFERENCE.md: Critical Planning Context Patterns (463-608)',
        outerVsPrinciple: {
          outerPlanContext: {
            description: 'Via muxium.plan() - access state via d.conceptName.k',
            code: 'muxium.plan<MyDeck>("Plan Name", ({ stage, d, conclude }) => [\n  stage(({ dispatch, d }) => {\n    const value = d.myConcept.k.someProperty.select();\n    dispatch(d.myConcept.e.someAction({ value }), { iterateStage: true });\n  }),\n  conclude()\n]);',
            stateAccess: 'd.conceptName.k.propertyName.select()',
            actionAccess: 'd.conceptName.e.actionName()',
          },
          principleContext: {
            description: 'Within concept principles - own concept via k directly',
            code: 'plan("Principle Plan", ({ stage, k, conclude }) => [\n  stage(({ dispatch, k, d_ }) => {\n    const value = k.someProperty.select();\n    const otherValue = d_.otherConcept.k.otherProperty.select();\n    dispatch(d_.myConcept.e.someAction({ value }), { iterateStage: true });\n  }),\n  conclude()\n])',
            ownState: 'k.propertyName.select() (no concept prefix)',
            otherState: 'd_.conceptName.k.propertyName.select()',
          },
        },
        singleDispatchRule: {
          rule: 'ONE dispatch per stage. Multiple dispatches cause action overflow.',
          wrong: 'stage(({ dispatch, d }) => {\n  dispatch(d.concept.e.action1(), { iterateStage: true });\n  dispatch(d.concept.e.action2(), { iterateStage: true });  // OVERFLOW!\n})',
          correct: 'stage(({ dispatch, d }) => {\n  dispatch(d.concept.e.action1(), { iterateStage: true });\n}),\nstage(({ dispatch, d }) => {\n  dispatch(d.concept.e.action2(), { iterateStage: true });\n})',
          exception: 'muxiumTimeOut for deferred additional actions does not count as second dispatch',
        },
        stageOptions: [
          { option: '{ iterateStage: true }', behavior: 'Move to next stage', useCase: 'Sequential progression' },
          { option: '{ iterateStage: false }', behavior: 'Stay on current stage', useCase: 'Conditional waiting' },
          { option: '{ }', behavior: 'Fire-and-forget', useCase: 'No stage control needed' },
          { option: '{ setStage: N }', behavior: 'Jump to stage N', useCase: 'Non-linear navigation' },
          { option: '{ throttle: 0 }', behavior: 'Recurrent in same stage', useCase: 'Monitoring loops' },
        ],
        throttleVsSetStage: {
          throttle: {
            description: 'Same stage recurrence',
            code: 'stage(({ dispatch, d_ }) => {\n  dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });\n}, { beat: 3, selectors: [k__.queueProperty] })',
            safetyRequired: 'beat: 3+ OR selectors: [...] - Without protection: infinite recursion overflow',
          },
          setStage: {
            description: 'Different stage navigation (bidirectional allowed)',
            code: 'stage(({ dispatch, d }) => {\n  dispatch(d.concept.e.action(), { setStage: 1 });\n})',
            rule: 'setStage: N invalid when already in stage N - use throttle: 0 instead',
          },
        },
        selectorsPattern: {
          description: 'Stage only executes when selected properties change',
          code: 'stage(({ dispatch, d, k }) => {\n  const queue = k.queueProperty.select();\n  if (queue.length > 0) {\n    dispatch(d.concept.e.processItem(queue[0]), { iterateStage: true });\n  } else {\n    dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });\n  }\n}, { selectors: [k__.queueProperty], beat: 3 })',
          benefits: ['Prevents unnecessary stage executions', 'Essential for monitoring patterns with throttle: 0'],
        },
        relatedTools: [
          { tool: 'strativerse_strategy_patterns_info', purpose: 'When to use strategies vs plans' },
          { tool: 'strativerse_method_patterns_info', purpose: 'DECK K patterns for state access' },
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
