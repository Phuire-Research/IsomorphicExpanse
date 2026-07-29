/**
 * Pewter Tessera Muxonomy Configuration (HIFI.3 · nav-only)
 *
 * The LIGHTEST grounded registration for the Pewter Tessera page: a nav-only
 * MuxonomicConfig that mirrors DEFAULT_LANDING_MUXONOMIC (empty demometers /
 * empty decks) — it carries NO concept state of its own. The page is a pure Vue
 * surface (PewterLanding.vue) whose Main control writes through the HIFI.1 runtime
 * override mechanism (suiteColorOverride.model · documentElement :root) and whose
 * Spawn Button rides the universal scsBridge controller (triggerSpawnSuite8Session).
 *
 * Reachability (mirrors gitmMuxonomic · nav-only page entry):
 *   - getNavItems() reads navigation → renders the sidebar "Pewter Tessera" item.
 *   - getAuthorizedIslandIds() includes conceptName 'pewter' → the islandId.
 *   - getIslandForPath('/pewter') → conceptName 'pewter' → IslandWrapper
 *     islandRegistry['pewter'] → PewterLanding.vue.
 *
 * conceptName MUST equal the islandId registered in IslandWrapper.vue islandRegistry.
 *
 * Citation: cadmium.muxonomy.ts (cadmiumNavigation · PageEntry · nav-entry shape)
 * Citation: vue.principle.ts DEFAULT_LANDING_MUXONOMIC (minimal nav-only config)
 * Citation: gitm.muxonomy.ts (nav-only REGISTERED page · data rides scsBridge base)
 */
import {
  type MuxonomicConfig,
  type NavigationConfig,
  type PageEntry,
  ChangeDetectionMode,
} from '../muxonomy/muxonomy.model';

const pewterLandingPage: PageEntry = {
  path: '/pewter',
  label: 'Pewter Tessera',
  order: 0,
  componentPath: 'pewter/vue/PewterLanding',
  isMain: true,
};

export const pewterNavigation: NavigationConfig = {
  // Pewter Tessera is NOT the site landing — the DEFAULT Home owns the / route.
  isMainLanding: false,
  icon: '🎨',
  color: 'amethyst',
  label: 'Pewter Tessera',
  // After Suite Cascade (4) + GitM (5) — the Suite Color page sits at the tail.
  order: 6,
  pages: [pewterLandingPage],
};

export const pewterMuxonomic: MuxonomicConfig<'pewter'> = {
  conceptName: 'pewter',
  filterKeys: [],
  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },
  sync: {
    direction: 'toClient',
    filterKeys: [],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },
  demometers: {
    qualities: [],
    strategies: [],
    principles: [],
  },
  decks: {
    huirth: '',
    client: '',
  },
  navigation: pewterNavigation,
};
