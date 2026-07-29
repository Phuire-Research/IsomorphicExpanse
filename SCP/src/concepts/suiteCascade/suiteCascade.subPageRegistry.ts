/**
 * SuiteCascade Sub-Page Registry (Band B-6 HCD)
 *
 * Single source of truth for the SuiteCascade Landing SubPage triad Navbar
 * (Home · Component · Documentation). Consumed by SuiteCascadeSubPageNav.vue via
 * v-for; SuiteCascadeLanding.vue imports the constant to populate the Navbar's
 * `options` prop and drives a v-if/v-else-if chain off `activeSubPage`.
 *
 * Suite-colored (Cobalt = Suite 5 · the SuiteCascade concept's home color):
 *   home          -> cobalt   (the active General cascade summary · primary default)
 *   component     -> viridian (Suite 4 · validation · CPLD live component showcase)
 *   documentation -> amethyst (Suite 6 · the Diamond-forms ladder + Commands reference)
 *
 * Home is FIRST so it renders as the default active tab when activeSubPage
 * defaults to 'home' (DEFAULT_SUITE_CASCADE_SUB_PAGE).
 *
 * The `deferred: boolean` field is preserved for forward-compatibility (mirrors
 * scsBridge.subPageRegistry.ts) — no deferred entries exist in this revision.
 *
 * Citation: scsBridge.subPageRegistry.ts (SCSBRIDGE_SUB_PAGE_OPTIONS source pattern).
 * Citation: suiteCascade.type.ts SuiteCascadeSubPage union.
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 */
import type { SuiteCascadeSubPage } from './suiteCascade.type';

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

export interface SuiteCascadeSubPageOption {
  value: SuiteCascadeSubPage;
  label: string;
  deferred: boolean;
  suite?: SuiteColor;
}

export const SUITECASCADE_SUB_PAGE_OPTIONS: SuiteCascadeSubPageOption[] = [
  // C882 · 'home' PRUNED — the Documentation Site leads; the union keeps 'home' for state compat.
  // C894 · Documentation FIRST (the leading default tab) · Components pluralized.
  { value: 'documentation', label: 'Documentation', deferred: false, suite: 'amethyst' },
  { value: 'component',     label: 'Components',    deferred: false, suite: 'viridian' },
];
