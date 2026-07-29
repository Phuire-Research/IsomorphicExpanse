/**
 * strativerseOwnershipPatternsInfo - Returns ownership coordination patterns
 *
 * Citation: STRATIMUX-REFERENCE.md: Ownership Patterns - Bi-Directional Coordination System (1668-2032)
 *
 * Type: 'Strativerse Ownership Patterns Info' (Verbose Split)
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

export type StrativerseOwnershipPatternsInfo = Quality<StrativerseState>;

export const strativerseOwnershipPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Ownership Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Ownership Coordination Patterns',
        citation: 'STRATIMUX-REFERENCE.md: Ownership Patterns - Bi-Directional Coordination System (1668-2032)',
        coreConcept: {
          whatItSolves: 'Enables bi-directional blocking in uni-directional action trees',
          withoutOwnership: 'Action A -> Action B -> Action C (no way for C to block A)',
          withOwnership: 'Action A (owns selector) -> Action B -> Action C, Ownership blocks until A releases',
          keyPrinciple: 'Ownership creates bi-directional coordination within Stratimux uni-directional action dispatch model',
        },
        enablingOwnership: {
          code: 'import { createOwnershipConcept } from "stratimux";\n\nconst myMuxium = createMuxium({\n  name: "My Muxium",\n  concepts: [\n    createOwnershipConcept(),\n    myConcept,\n    otherConcept\n  ]\n});',
          note: 'Without createOwnershipConcept: Ownership features are disabled - KeyedSelector attachment fails silently',
        },
        keyedSelector: {
          description: 'Create a KeyedSelector with ownership attachment',
          code: 'import { attachKeyedSelector } from "stratimux";\n\nconst myKeyedSelector = attachKeyedSelector(\n  k.someProperty,\n  "uniqueOwnershipKey"\n);\n\nstage(({ dispatch, d }) => {\n  dispatch(d.concept.e.action(), { iterateStage: true });\n}, {\n  selectors: [myKeyedSelector]\n})',
          properties: ['Opt-in: Only selectors explicitly attached participate', 'Unique keys: Each ownership claim needs distinct key', 'Cascading: Ownership propagates through strategy chains automatically'],
        },
        stageOPattern: {
          description: 'Ownership-aware stages with automatic acquisition/release',
          code: 'import { stageO } from "stratimux";\n\nmuxium.plan<MyDeck>("Ownership-Aware Plan", ({ stage, d, k__, conclude }) => [\n  stage(({ dispatch, d }) => {\n    dispatch(d.concept.e.prepare(), { iterateStage: true });\n  }),\n  stageO(\n    { key: "myOwnershipKey", selector: k__.myConcept.k.criticalProperty },\n    ({ dispatch, d, k }) => {\n      const value = k.myConcept.k.criticalProperty.select();\n      dispatch(d.concept.e.updateCritical({ value }), { iterateStage: true });\n    }\n  ),\n  conclude()\n])',
          benefits: ['Automatic ownership acquisition on stage entry', 'Automatic ownership release on stage completion', 'Blocks other plans watching same selector', 'Prevents race conditions on critical state'],
        },
        strategyIntegration: {
          description: 'Strategy automatically cascades ownership',
          cascadingOwnership: ['Ownership acquired in strategy node propagates to subsequent nodes', 'No explicit passing required - automatic propagation', 'Release at strategy completion or explicit release action'],
        },
        offPremise: {
          description: 'Actions marked as off-premise bypass ownership checks',
          code: 'const offPremiseAction = createQualityCard<MyState>({\n  type: "My Off Premise Action",\n  reducer: (state) => ({ offPremiseResult: "value" }),\n  methodCreator: defaultMethodCreator,\n  offPremise: true\n});',
          whenToUse: ['Diagnostic/logging actions that should not be blocked', 'Emergency state corrections', 'Actions that must execute regardless of ownership state'],
          warning: 'Overuse of off-premise defeats ownership coordination benefits',
        },
        antiPatterns: [
          { wrong: 'Missing createOwnershipConcept() in muxium concepts', problem: 'Ownership features silently disabled' },
          { wrong: 'Duplicate ownership keys', problem: 'Key conflict causes undefined behavior' },
          { wrong: 'stageO without iterateStage or stage completion', problem: 'Infinite ownership - deadlock' },
        ],
        relatedTools: [
          { tool: 'strativerse_strategy_patterns_info', purpose: 'Strategy-ownership integration' },
          { tool: 'strativerse_planning_patterns_info', purpose: 'Stage options and selectors' },
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
