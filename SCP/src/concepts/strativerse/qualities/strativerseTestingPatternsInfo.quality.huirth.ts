/**
 * strativerseTestingPatternsInfo - Returns Stratimux testing patterns
 *
 * Citation: STRATIMUX-REFERENCE.md: Stratimux Testing Patterns (3192-3641)
 *
 * Type: 'Strativerse Testing Patterns Info' (Verbose Split)
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

export type StrativerseTestingPatternsInfo = Quality<StrativerseState>;

export const strativerseTestingPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Testing Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Stratimux Testing Patterns',
        citation: 'STRATIMUX-REFERENCE.md: Stratimux Testing Patterns (3192-3641)',
        essentialPrinciples: {
          criticalRule: 'Never use async/await. Always use done() callback.',
          wrong: 'test("Bad async", async () => { await muxium.dispatch(action); });',
          correct: 'test("Good reactive", (done) => { /* test plan with done() call */ });',
          whyDoneRequired: ['Stratimux is reactive - state changes propagate asynchronously', 'async/await does not capture reactive stream timing', 'done() allows precise control of test completion'],
        },
        stageSeparation: {
          rule: 'Dispatch in stage N, validate in stage N+1',
          wrong: 'stage(({ dispatch, d, k }) => {\n  dispatch(action, { iterateStage: true });\n  expect(k.prop.select()).toBe(expected);  // FAILS - state not updated yet!\n})',
          correct: 'stage(({ dispatch, d }) => {\n  dispatch(action, { iterateStage: true });  // Stage N: Dispatch\n}),\nstage(({ k }) => {\n  expect(k.prop.select()).toBe(expected);  // Stage N+1: Validate\n})',
          whySeparation: ['Dispatch triggers reducer', 'Reducer updates state', 'State update notifies selectors', 'Next stage sees updated state'],
        },
        reactiveTiming: {
          pattern: 'After plan concludes, wait for reactive stream to settle',
          code: 'setTimeout(() => {\n  // Final assertions after stream settles\n  done();\n}, 100);  // 100ms minimum for reactive timing',
          why100ms: ['Allows all reactive subscriptions to process', 'Ensures state is fully propagated', 'Prevents race conditions in test assertions'],
        },
        completeTestStructure: {
          code: 'describe("MyConcept Tests", () => {\n  let muxium: ReturnType<typeof createMuxium>;\n\n  beforeEach(() => {\n    muxium = createMuxium({ name: "Test", concepts: [myConcept] });\n  });\n\n  afterEach(() => {\n    muxium.close();  // Clean up after each test\n  });\n\n  test("should update value", (done) => {\n    muxium.plan<MyDeck>("Test", ({ stage, d, conclude }) => [\n      stage(({ dispatch, d }) => {\n        dispatch(d.myConcept.e.setValue({ value: "new" }), { iterateStage: true });\n      }),\n      stage(({ k }) => {\n        expect(k.myConcept.k.value.select()).toBe("new");\n      }, { iterateStage: true }),\n      conclude()\n    ]);\n    setTimeout(done, 100);\n  });\n});',
        },
        antiPatterns: [
          { name: 'async/await', wrong: 'async () => { await dispatch(); }', reason: 'Breaks reactive timing' },
          { name: 'Same-stage validation', wrong: 'dispatch(); expect();', reason: 'State not updated yet' },
          { name: 'Missing iterateStage', wrong: 'dispatch(action);', reason: 'Plan does not progress' },
          { name: 'No setTimeout before done()', wrong: 'plan(); done();', reason: 'Reactive stream not settled' },
          { name: 'Direct state mutation', wrong: 'muxium.getState().value = x;', reason: 'Bypasses reactive system' },
        ],
        deckKInTests: {
          description: 'Use k for stage function state access, k__ for stage selectors',
          code: 'stage(({ dispatch, d, k }) => {\n  const before = k.myConcept.k.counter.select();  // k for state access\n  dispatch(d.myConcept.e.increment(), { iterateStage: true });\n}, {\n  selectors: [k__.myConcept.k.counter]  // k__ for stage options\n})',
        },
        checklist: [
          'Use done() callback (never async/await)',
          'Stage separation: dispatch in N, validate in N+1',
          'Include { iterateStage: true } on all dispatches',
          'Add setTimeout(done, 100) after plan',
          'Use k.concept.k.property.select() for state access',
          'Call muxium.close() in afterEach',
          'Test both success and failure paths for strategies',
          'Verify reactive timing for multi-stage plans',
        ],
        relatedTools: [
          { tool: 'strativerse_planning_patterns_info', purpose: 'Stage options and patterns' },
          { tool: 'strativerse_strategy_patterns_info', purpose: 'Testing strategies' },
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
