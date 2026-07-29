/**
 * IsomorphicExpanse Sub-Page Registry (Band A-6 HCD)
 *
 * Single source of truth for the IsomorphicExpanse Landing SubPage triad Navbar
 * (Home · Component · Documentation). Consumed by IsomorphicExpanseSubPageNav.vue via
 * v-for; IsomorphicExpanseLanding.vue imports the constant to populate the Navbar's
 * `options` prop and drives a v-if/v-else-if chain off `activeSubPage`.
 *
 * Suite-colored (Amethyst = Suite 6 · the isomorphicExpanse concept's nav home color):
 *   home          -> amethyst (the Suite 8 roster + docked-cascade context · primary default)
 *   component     -> viridian (Suite 4 · validation · CPLD live ODSS + PFGD showcase)
 *   documentation -> cobalt   (Suite 5 · the IsomorphicExpanse registration/assignment reference)
 *
 * Home is FIRST so it renders as the default active tab when activeSubPage
 * defaults to 'home' (DEFAULT_ISOMORPHICEXPANSE_SUB_PAGE).
 *
 * The `deferred: boolean` field is preserved for forward-compatibility (mirrors
 * suiteCascade.subPageRegistry.ts) — no deferred entries exist in this revision.
 *
 * Citation: suiteCascade.subPageRegistry.ts (SUITECASCADE_SUB_PAGE_OPTIONS DIRECT bearing).
 * Citation: isomorphicExpanse.type.ts IsomorphicExpanseSubPage union.
 * Citation: MASTER-DIAMOND-ISOMORPHICEXPANSE-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 */
import type { IsomorphicExpanseSubPage } from './isomorphicExpanse.type';

export type SuiteColor =
  | 'base'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'fuchsia'
  | 'maroon'
  | 'viridian'
  | 'cobalt'
  | 'amethyst';

export interface IsomorphicExpanseSubPageOption {
  value: IsomorphicExpanseSubPage;
  label: string;
  deferred: boolean;
  suite?: SuiteColor;
}

export const ISOMORPHICEXPANSE_SUB_PAGE_OPTIONS: IsomorphicExpanseSubPageOption[] = [
  { value: 'home',          label: 'Home',          deferred: false, suite: 'amethyst' },
  { value: 'component',     label: 'Component',     deferred: false, suite: 'viridian' },
  { value: 'documentation', label: 'Documentation', deferred: false, suite: 'cobalt'   },
];
