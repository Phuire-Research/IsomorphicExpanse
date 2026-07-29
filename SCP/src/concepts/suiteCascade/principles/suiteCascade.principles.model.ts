/**
 * SuiteCascade Principles — Model File · TPDF (Two-Principle-Decomposition)
 *
 * SuiteCascade's `createConcept` receives a principles ARRAY with TWO entries:
 *
 *   1. General Watcher Principle — owns `cascades['General']`. At startup it
 *      registers the General (GRID) cascade entry, then (B-4 WCJF) will arm a
 *      chokidar watch on the GRID `Cascade.json` and dispatch setCascadeJson on
 *      change. For B-1 the watch is a minimal scaffold: it registers the
 *      'General' entry so the registration flow is real and compiles. The
 *      chokidar arm + debounce + Base→Relay (SBIS) discipline is fleshed out in
 *      Band B-4 (`suiteCascadeJsonWatcher.principle.huirth.ts`).
 *
 *   2. Named Loader Principle — reactive to name-keyed cascade requests. It
 *      watches the shared `cascades` Record and loads named cascades on demand
 *      (Suite8's own principle dispatches into `suiteCascadeRegisterNamedCascade`
 *      via Tier-2 to trigger this loader). For B-1 it is a minimal reactive
 *      scaffold; the load mechanism dives further in B-4/B-5.
 *
 * A `PrincipleFunction` is ONE reactive loop (returns one cleanup). Two distinct
 * reactive concerns => TWO array entries — NOT one function returning two
 * subscriptions (S4 Hazard A3 RESOLVED). Both run concurrently + independently.
 *
 * Precedent: scsBridge.concept.client.ts passes a multi-principle array to
 *   createConcept; scsBridgeJsonWatcher.principle.huirth.ts is the watcher
 *   lifecycle the General Watcher evolves toward (B-4).
 *
 * Citation: S8SC-SCHOLAR-COMPOSITION-GROUNDING.md §4 (Model-File-as-Principle-
 *           Function + Two-Principle Decomposition · getSuiteCascadePrinciples).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-1 TPDF.
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 *           (Principle Context · single dispatch per stage · setStage).
 */
import {
  GENERAL_CASCADE_NAME,
  type SuiteCascadePrinciple,
} from '../suiteCascade.type';

// ============================================
// PRINCIPLE 1 — General Watcher (owns cascades['General'])
// ============================================

export const suiteCascadeGeneralWatcherPrinciple: SuiteCascadePrinciple = ({ plan }) => {
  const watcherPlan = plan('SuiteCascade General Watcher', ({ stage, conclude }) => [
    stage(({ d, dispatch }) => {
      // B-1 scaffold: register the always-present General (GRID) cascade entry.
      // The GRID Cascade.json read + chokidar arm is fleshed out in B-4 WCJF.
      dispatch(
        d.suiteCascade.e.suiteCascadeRegisterNamedCascade({
          name: GENERAL_CASCADE_NAME,
          cascade: {
            name: GENERAL_CASCADE_NAME,
            cascadeDirectory: 'Cascades',
            cascadeJson: null,
            activeCascadeFiles: [],
            // C1-D5 CWSD · scaffold registration before any Cascade.json read · true.
            missingCascadeJson: true,
          },
        }),
        { iterateStage: true },
      );
    }),
    conclude(),
  ]);

  // Cleanup — conclude the plan on principle teardown (HAZARD-A: timers/watchers
  // added in B-4 tear down BEFORE conclude).
  return () => {
    watcherPlan.conclude();
  };
};

// ============================================
// PRINCIPLE 2 — Named Loader (reactive to name-keyed cascade requests)
// ============================================

export const suiteCascadeNamedLoaderPrinciple: SuiteCascadePrinciple = ({ k_, plan }) => {
  const loaderPlan = plan('SuiteCascade Named Loader', ({ stage, conclude }) => [
    // Reactive to changes in the shared cascades Record. For B-1 this is a
    // minimal observation stage; the named-load mechanism (read the Suite8
    // directory's Cascade.json into cascades[name]) is engaged in B-4/B-5.
    stage(
      ({ k }) => {
        // Principle Context: own state via direct k access.
        const cascades = k.cascades.select();
        // B-1 scaffold: observe the Record. Named-load dispatch arms in B-4/B-5.
        void cascades;
      },
      {
        selectors: [k_.cascades],
        beat: 0,
      },
    ),
    conclude(),
  ]);

  return () => {
    loaderPlan.conclude();
  };
};

// ============================================
// TPDF ARRAY EXPORT — the Two-Principle pair
// ============================================

// Importable as an array (spread into createConcept) OR destructured into the
// two named functions above. Typed as SuiteCascadePrinciple[] — each is one
// reactive loop; createConcept accepts these as its (loose) principles array.
export const getSuiteCascadePrinciples = (): SuiteCascadePrinciple[] => [
  suiteCascadeGeneralWatcherPrinciple,
  suiteCascadeNamedLoaderPrinciple,
];
