/**
 * strativerseStrategyPatternsInfo - Returns ActionStrategy architecture documentation
 *
 * Citation: STRATIMUX-REFERENCE.md: ActionStrategies - Orchestrated Action Sequences (926-1667)
 *
 * Type: 'Strativerse Strategy Patterns Info' (Verbose Split)
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

export type StrativerseStrategyPatternsInfo = Quality<StrativerseState>;

export const strativerseStrategyPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Strategy Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'ActionStrategy Architecture',
        citation: 'STRATIMUX-REFERENCE.md: ActionStrategies - Orchestrated Action Sequences (926-1667)',
        vsPlans: {
          comparison: [
            { aspect: 'Structure', actionStrategy: 'Fixed graph with nodes', plan: 'Reactive stage array' },
            { aspect: 'Execution', actionStrategy: 'Traverses success/failure paths', plan: 'Responds to state changes' },
            { aspect: 'Data Flow', actionStrategy: 'strategyData carries between nodes', plan: 'Stage-local state access' },
            { aspect: 'Branching', actionStrategy: 'Explicit decision nodes', plan: 'Stage options (setStage)' },
            { aspect: 'Use Case', actionStrategy: 'Multi-step orchestration', plan: 'Reactive state management' },
          ],
          whenToUseStrategy: ['Multi-step workflows with defined paths', 'Need to carry data between steps', 'Require explicit success/failure handling', 'Complex decision routing'],
          whenToUsePlan: ['Reactive monitoring', 'State-driven transitions', 'Simple stage progression'],
        },
        architecture: {
          basicStructure: 'const myStrategy = createStrategy({\n  topic: "My Strategy Topic",\n  initialNode: createActionNode(\n    firstAction(),\n    {\n      successNode: createActionNode(secondAction(), { successNode: null, failureNode: errorHandler() }),\n      failureNode: createActionNode(fallbackAction())\n    }\n  )\n});',
          nodeTypes: [
            { type: 'successNode', description: 'Path taken when action succeeds' },
            { type: 'failureNode', description: 'Path taken when action fails' },
            { type: 'decisionNodes', description: 'Named paths for branching logic' },
            { type: 'null', description: 'Terminates strategy (success) or uses default conclusion' },
          ],
        },
        selectStratiDECK: {
          description: 'Guard pattern for type-safe deck access in strategy creators',
          code: 'export const createMyStrategyCreator = <D extends MyConceptDeck>(deck: D, initialData: SomeType) => {\n  const d_ = selectStratiDECK<D>(deck);\n  return createStrategy<MyStrategyData>({\n    topic: "My Strategy",\n    initialNode: createActionNode(d_.myConcept.e.firstAction({ data: initialData }), { ... })\n  });\n};',
          usage: 'Actions dispatch via d_.conceptName.e.actionName()',
        },
        dataPatterns: {
          carryForward: 'return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { result, metadata }));',
          selectPrevious: 'const previousData = strategyData_select<MyDataType>(action.strategy);',
          appendFailure: 'return strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, { error, code }));',
          lifecycle: ['Initial data set in createStrategy({ data: {...} })', 'Each node reads via strategyData_select()', 'Each node adds/modifies via strategyData_muxifyData()', 'Failure info via strategyData_appendFailure()'],
        },
        decisionNodes: {
          code: 'createActionNode(evaluateConditionAction(), {\n  successNode: null,\n  failureNode: null,\n  decisionNodes: {\n    "pathA": createActionNode(pathAAction()),\n    "pathB": createActionNode(pathBAction()),\n    "pathC": createActionNode(pathCAction())\n  }\n})',
          routing: 'return strategyDecide(action.strategy, "pathA", { extraData });',
        },
        temporalExpansion: {
          description: 'Deferred strategy continuation using muxiumTimeOut',
          code: 'methodCreator: () => createMethodWithConcepts(({ action, concepts_ }) => {\n  muxiumTimeOut(concepts_, () => {\n    if (action.strategy) return strategySuccess(action.strategy);\n    return muxiumConclude();\n  }, 100);\n  return muxiumConclude();\n})',
          whenToUse: ['Rate limiting external API calls', 'Waiting for external process completion', 'Debouncing rapid operations', 'Coordinating timing-sensitive workflows'],
        },
        relatedTools: [
          { tool: 'strativerse_method_patterns_info', purpose: 'Method patterns for strategy integration' },
          { tool: 'strativerse_planning_patterns_info', purpose: 'When to use plans vs strategies' },
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
