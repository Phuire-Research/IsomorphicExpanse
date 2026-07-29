/**
 * SCS-Bridge Sub-Page Registry (Cycle 157 · TaskBar Pewter Pass · Wave 3 Cobalt-Refactor)
 *
 * Single source of truth for the sub-page Navbar. Driving registry consumed by
 * ScsBridgeSubPageNav.vue via v-for; ScsBridgeLanding.vue imports the constant
 * to populate the Navbar's options prop.
 *
 * Active pages (Cycle 157):
 *   sessions   -> cobalt   (Suite 5 · professional inventory · primary default)
 *   components -> viridian (Suite 4 · validation · portable concept showcase)
 *
 * Session Management is FIRST so it renders as the default active tab when
 * activeSubPage defaults to 'sessions' (DEFAULT_SCS_BRIDGE_ACTIVE_SUB_PAGE).
 *
 * The `deferred: boolean` field is preserved for forward-compatibility — no
 * deferred entries exist in this revision, but the field shape remains for
 * future extension without breaking downstream SubPageOption consumers.
 *
 * Citation: TASKBAR-PEWTER-PASS-WAVE2-OCHRE-REFACTOR-BLUEPRINT.md Section 2
 * Citation: scsBridge.type.ts ScsBridgeSubPage union (L41)
 */
import type { ScsBridgeSubPage } from './scsBridge.type';

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

export interface SubPageOption {
  value: ScsBridgeSubPage;
  label: string;
  deferred: boolean;
  suite?: SuiteColor;
}

export const SCSBRIDGE_SUB_PAGE_OPTIONS: SubPageOption[] = [
  { value: 'sessions',   label: 'Session Management', deferred: false, suite: 'cobalt'   },
  { value: 'components', label: 'Components',         deferred: false, suite: 'viridian' },
  { value: 'archive',    label: 'Archive',           deferred: false, suite: 'maroon'   },
  // SWRM · D4 · the render-mode Settings sub-page (amethyst · Suite 6 orchestration tint).
  { value: 'settings',   label: 'Settings',          deferred: false, suite: 'amethyst' },
  // GITM PAGE · the Git sub-page (viridian · Suite 4 · git state visibility/validation).
  // DOCUMENTATION PAGE · Bridge Turn-Over reference + glossary (amethyst · Suite 6 orchestration tint).
  { value: 'documentation', label: 'Documentation',  deferred: false, suite: 'amethyst' },
  // MD-B → C821 D1 · THE SCP MANAGEMENT SUB-PAGE (renamed from Installation) · install +
  // the commit-locked manifest interchange + the roster (cobalt · Suite 5 professional).
  { value: 'installation',  label: 'SCP Management', deferred: false, suite: 'cobalt' },
  // D-EF-0 · THE CARD SUBPAGE · appended LAST (the MD-5 Character-Forward Card · viridian · Suite 4).
  // The MD-6 stacked HOME|CARD wrapper is dissolved — Card is now the last tab of THIS island's own nav.
  { value: 'card',          label: 'Card',           deferred: false, suite: 'viridian' },
];
