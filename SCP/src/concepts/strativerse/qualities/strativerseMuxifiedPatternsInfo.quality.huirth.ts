/**
 * strativerseMuxifiedPatternsInfo - Returns muxified concept access patterns
 *
 * Citation: STRATIMUX-REFERENCE.md: Muxified Concept Access Patterns (2404-2591)
 *
 * Type: 'Strativerse Muxified Patterns Info' (Verbose Split)
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

export type StrativerseMuxifiedPatternsInfo = Quality<StrativerseState>;

export const strativerseMuxifiedPatternsInfo = createQualityCard<StrativerseState, StrativerseDeck>({
  type: 'Strativerse Muxified Patterns Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const informativeContent = {
        title: 'Muxified Concept Access Patterns',
        citation: 'STRATIMUX-REFERENCE.md: Muxified Concept Access Patterns (2404-2591)',
        baseVsMuxified: {
          baseConcept: {
            tier: 'Tier 1',
            access: 'd.myConcept.k.someProperty.select()',
            description: 'Directly accessible from deck, full TypeScript type safety',
          },
          muxifiedConcept: {
            tier: 'Tier 2',
            access: 'd.parentConcept.d.muxifiedConcept.k.someProperty.select()',
            description: 'Accessed through parent concept .d property, TypeScript limitations apply',
          },
        },
        eckLimitation: {
          definition: 'ECK = Explicit Concept Key - Stratimux enforces Tier 2 maximum for muxified access',
          valid: ['d.concept.k.property.select() (Tier 1)', 'd.parent.d.muxified.k.property.select() (Tier 2)'],
          invalid: 'd.grandparent.d.parent.d.child.k.property.select() (Tier 3+ blocked)',
          whyExists: ['TypeScript Performance: Recursive types beyond 2 tiers cause exponential type expansion', 'Architectural Clarity: Forces explicit composition boundaries', 'Runtime Safety: Prevents deeply nested state access bugs', 'Compositional Design: Encourages flat concept structures'],
        },
        typescriptLimitations: {
          problem: 'TypeScript CANNOT validate muxified access at compile-time beyond Tier 2',
          developerResponsibility: ['Manually verify muxified access patterns', 'Test-driven development critical for muxified concepts', 'Document composition explicitly in concept files'],
        },
        accessPatterns: [
          {
            name: 'Pattern 1: Direct Muxified State Access',
            code: 'muxium.plan<MyDeck>("Muxified Access Plan", ({ stage, d, conclude }) => [\n  stage(({ dispatch, d }) => {\n    const muxifiedState = d.parentConcept.d.muxifiedConcept.k.someProperty.select();\n    dispatch(d.parentConcept.d.muxifiedConcept.e.updateProperty({\n      newValue: muxifiedState + 1\n    }), { iterateStage: true });\n  }),\n  conclude()\n]);',
          },
          {
            name: 'Pattern 2: Total Muxified State (via getState)',
            code: 'const muxifiedFullState = deck.parentConcept.d.muxifiedConcept.k.getState(concepts_);\nconst result = processMuxifiedState(muxifiedFullState);',
          },
          {
            name: 'Pattern 3: Muxified Actions in Strategy',
            code: 'const d_ = selectStratiDECK<D>(deck);\nreturn createStrategy({\n  initialNode: createActionNode(d_.parentConcept.d.muxifiedConcept.e.firstAction(), { ... })\n});',
          },
        ],
        flattenComposition: {
          antiPattern: 'd.level1.d.level2.d.level3.k.property.select() - Tier 3+ blocked by ECK',
          solution: 'Promote frequently-accessed muxified concepts to base level via muxifyConcepts()',
          example: 'const value = d.level3AsBase.k.property.select(); // Now Tier 1 access',
        },
        decisionMatrix: [
          { need: 'Base concept state', pattern: 'Direct', accessPath: 'd.concept.k.property.select()' },
          { need: 'Muxified concept state', pattern: 'Tier 2', accessPath: 'd.parent.d.muxified.k.property.select()' },
          { need: 'Muxified total state', pattern: 'getState', accessPath: 'deck.parent.d.muxified.k.getState(concepts_)' },
          { need: 'Deep nested (3+)', pattern: 'Flatten', accessPath: 'Promote to Tier 1 via composition' },
          { need: 'Strategy with muxified', pattern: 'selectStratiDECK', accessPath: 'd_.parent.d.muxified.e.action()' },
        ],
        relatedTools: [
          { tool: 'strativerse_method_patterns_info', purpose: 'DECK K patterns for state access' },
          { tool: 'strativerse_strategy_patterns_info', purpose: 'selectStratiDECK for strategies' },
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
