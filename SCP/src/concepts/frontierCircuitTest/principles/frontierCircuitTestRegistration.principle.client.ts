/**
 * FrontierCircuitTest Registration Principle (Client-Side) — MPRF Boot Seed
 *
 * On startup this principle dispatches one `frontierCircuitTestRegisterFrontierCircuitTest` action per
 * known Suite 8 directory entry, populating the SPSR Record (`frontierCircuitTests: {}`)
 * from the KNOWN_FRONTIERCIRCUITTEST_ENTRIES seed in the MPRF Model File.
 *
 * PrincipleFunction-void idiom (per B-1/B-4 Lambda discovery):
 *   - The body returns `() => void` (the cleanup function).
 *   - The load helper runs INSIDE the stage so the plan context is live when
 *     dispatch fires.
 *
 * Outer Plan Context: dispatches against `d.frontierCircuitTest.e.*` (Tier 1 own quality).
 * Single dispatch per stage: each stage dispatches exactly one action.
 * iterateStage: true — advances after each registration to prevent lockup.
 *
 * After seeding, the plan concludes. A-3 SAPR / A-4 ODSS / A-5 PFGD add
 * further entries at runtime when sessions are spawned.
 *
 * Citation: MASTER-DIAMOND-FRONTIERCIRCUITTEST-CONCEPT-ASPIRANT.md Band A-2 MPRF + NDEP.
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 *           (Outer Plan Context · single dispatch · iterateStage).
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts
 *           (PrincipleFunction array + cleanup idiom).
 */
import type { FrontierCircuitTestPrinciple } from '../frontierCircuitTest.type';
import { KNOWN_FRONTIERCIRCUITTEST_ENTRIES } from '../model/frontierCircuitTestRegistration.model';

export const frontierCircuitTestRegistrationPrinciple: FrontierCircuitTestPrinciple = ({ plan }) => {
  const seedPlan = plan('FrontierCircuitTest SPSR Boot Seed', ({ stage, conclude }) => [
    ...KNOWN_FRONTIERCIRCUITTEST_ENTRIES.map((entry) =>
      stage(({ d, dispatch }) => {
        dispatch(
          d.frontierCircuitTest.e.frontierCircuitTestRegisterFrontierCircuitTest({ name: entry.name, entry }),
          { iterateStage: true },
        );
      }),
    ),
    conclude(),
  ]);

  return () => {
    seedPlan.conclude();
  };
};
