/**
 * Suite8 Registration Principle (Client-Side) — MPRF Boot Seed
 *
 * On startup this principle dispatches one `suite8RegisterSuite8` action per
 * known Suite 8 directory entry, populating the SPSR Record (`suite8s: {}`)
 * from the KNOWN_SUITE8_ENTRIES seed in the MPRF Model File.
 *
 * PrincipleFunction-void idiom (per B-1/B-4 Lambda discovery):
 *   - The body returns `() => void` (the cleanup function).
 *   - The load helper runs INSIDE the stage so the plan context is live when
 *     dispatch fires.
 *
 * Outer Plan Context: dispatches against `d.suite8.e.*` (Tier 1 own quality).
 * Single dispatch per stage: each stage dispatches exactly one action.
 * iterateStage: true — advances after each registration to prevent lockup.
 *
 * After seeding, the plan concludes. A-3 SAPR / A-4 ODSS / A-5 PFGD add
 * further entries at runtime when sessions are spawned.
 *
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md Band A-2 MPRF + NDEP.
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 *           (Outer Plan Context · single dispatch · iterateStage).
 * Citation: suiteCascade/principles/suiteCascade.principles.model.ts
 *           (PrincipleFunction array + cleanup idiom).
 */
import type { Suite8Principle } from '../suite8.type';
import { KNOWN_SUITE8_ENTRIES } from '../model/suite8Registration.model';

export const suite8RegistrationPrinciple: Suite8Principle = ({ plan }) => {
  const seedPlan = plan('Suite8 SPSR Boot Seed', ({ stage, conclude }) => [
    ...KNOWN_SUITE8_ENTRIES.map((entry) =>
      stage(({ d, dispatch }) => {
        dispatch(
          d.suite8.e.suite8RegisterSuite8({ name: entry.name, entry }),
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
