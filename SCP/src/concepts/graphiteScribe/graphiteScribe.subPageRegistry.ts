/**
 * GraphiteScribe Sub-Page Registry (Band A-6 HCD)
 *
 * Single source of truth for the GraphiteScribe Landing SubPage triad Navbar
 * (Home · Component · Documentation). Consumed by GraphiteScribeSubPageNav.vue via
 * v-for; GraphiteScribeLanding.vue imports the constant to populate the Navbar's
 * `options` prop and drives a v-if/v-else-if chain off `activeSubPage`.
 *
 * Suite-colored (Amethyst = Suite 6 · the graphiteScribe concept's nav home color):
 *   home          -> amethyst (the Suite 8 roster + docked-cascade context · primary default)
 *   component     -> viridian (Suite 4 · validation · CPLD live ODSS + PFGD showcase)
 *   documentation -> cobalt   (Suite 5 · the GraphiteScribe registration/assignment reference)
 *
 * Home is FIRST so it renders as the default active tab when activeSubPage
 * defaults to 'home' (DEFAULT_GRAPHITESCRIBE_SUB_PAGE).
 *
 * The `deferred: boolean` field is preserved for forward-compatibility (mirrors
 * suiteCascade.subPageRegistry.ts) — no deferred entries exist in this revision.
 *
 * Citation: suiteCascade.subPageRegistry.ts (SUITECASCADE_SUB_PAGE_OPTIONS DIRECT bearing).
 * Citation: graphiteScribe.type.ts GraphiteScribeSubPage union.
 * Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 */
import type { GraphiteScribeSubPage } from './graphiteScribe.type';

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

export interface GraphiteScribeSubPageOption {
  value: GraphiteScribeSubPage;
  label: string;
  deferred: boolean;
  suite?: SuiteColor;
}

export const GRAPHITESCRIBE_SUB_PAGE_OPTIONS: GraphiteScribeSubPageOption[] = [
  { value: 'home',          label: 'Home',          deferred: false, suite: 'amethyst' },
  { value: 'editor',        label: 'Editor',        deferred: false, suite: 'green'    },
  { value: 'component',     label: 'Component',     deferred: false, suite: 'viridian' },
  { value: 'documentation', label: 'Documentation', deferred: false, suite: 'cobalt'   },
];
