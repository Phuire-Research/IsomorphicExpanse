/**
 * IsomorphicExpanse Muxonomy Configuration
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave B
 * Citation: muxonomy.model.ts MuxonomicConfig pattern
 *
 * D3 declares 7 local quality demometers (all reducers · no Diametric routes
 * yet). D4 adds file-loading Diametric Inductions for Diamond/Onyx/BoundCascade
 * content reads.
 */
import {
  type MuxonomicConfig,
  type NavigationConfig,
  type PageEntry,
  ChangeDetectionMode,
  DeploymentTarget,
  ExchangeDirection,
} from '../muxonomy/muxonomy.model';
// A-1 SCBM/B-6 reconciliation · isomorphicExpanse muxifies suiteCascade (ONE shared instance at
// Tier 2). The muxified member's Record properties (`cascades`, `activeCascadeDirectory`,
// `activeSubPage`) must be aggregated into isomorphicExpanse's filterKeys so the client base
// observes the shared Record on the IsomorphicExpanse Landing (without aggregation the muxified
// suiteCascade's properties are not registered as non-synced filterKeys on the page base).
import { suiteCascadeMuxonomic } from '../suiteCascade/suiteCascade.muxonomy';
import { S8_MENU_STAGE_RELAY_TYPE, S8_DESIGNATION_MENU_STAGE_RELAY_TYPE } from '../scsBridge/model/s8RelayTypes.model';

const isomorphicExpanseLandingPage: PageEntry = {
  path: '/isomorphicExpanse',
  label: 'Suite 8 Designations',
  order: 0,
  componentPath: 'isomorphicExpanse/vue/IsomorphicExpanseLanding',
  isMain: true,
};

const isomorphicExpanseDetailPage: PageEntry = {
  path: '/isomorphicExpanse/page',
  label: 'Suite 8 Page',
  order: 1,
  componentPath: 'isomorphicExpanse/vue/IsomorphicExpansePage',
  isMain: false,
};

// DSSLS · the Template Suite 8 Page (IsomorphicExpanseHomeLanding.vue) — the pared-down Cadmium
// homepage scaffold the install Opus adapts into the user's domain Suite 8 as the SCP
// HOME PAGE. Registered as a non-main subpage here so its componentPath resolves; the
// SAMLS swap (S10-HomePageAdapt) flips a dedicated home NavigationConfig to isMainLanding.
const isomorphicExpanseHomePage: PageEntry = {
  path: '/isomorphicExpanse/home',
  label: 'Suite 8 Home',
  order: 2,
  componentPath: 'isomorphicExpanse/vue/IsomorphicExpanseHomeLanding',
  isMain: false,
};

export const isomorphicExpanseNavigation: NavigationConfig = {
  isMainLanding: false,
  // THE RELEASE ICON (IE portability): the isometric cube — the domain's own geometry
  // (the isometric expanse rendered in one glyph), distinct from every other rail icon;
  // the copied-concept '🎴' default retired.
  icon: '🧊',
  color: 'amethyst',
  label: 'Isomorphic Expanse',
  order: 3,
  pages: [isomorphicExpanseLandingPage, isomorphicExpanseDetailPage, isomorphicExpanseHomePage],
};

// SAMLS · the dedicated DOMAIN HOME navigation config. Default isMainLanding: false —
// the Template Suite 8 Page exists but does NOT yet claim the `/` route. S10-HomePageAdapt
// flips isMainLanding: true (and lowers `order` below cadmium's 4) so the user's adapted
// domain page wins getLandingPage(). The install Opus also sets `color` + `label` to the
// user's chosen domain/suite-tier at adapt time.
//
// ADAPT (S10): set isMainLanding: true · set order: 0 · set color/label/icon to the domain.
export const isomorphicExpanseHomeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🏠',
  color: 'cobalt',
  label: 'Isomorphic Expanse',
  order: 2,
  pages: [{ ...isomorphicExpanseHomePage, isMain: true }],
};

export const isomorphicExpanseMuxonomic: MuxonomicConfig<'isomorphicExpanse'> = {
  conceptName: 'isomorphicExpanse',

  filterKeys: [
    'actionQue',
    'filterKeys',
    // A-1 SPSR · the shared Record key.
    'isomorphicExpanses',
    // LEGACY designation slots.
    'designations',
    'activeDesignationName',
    'activeTab',
    // A-6 HCD · the SubPage selector key (local-only UI; never synced).
    'activeSubPage',
    'loadedDiamondContent',
    'loadedOnyxContent',
    'loadedBoundCascade',
    'loadedFileSystemSheet',
    // GTMS8C · the Anchor-authored Shatterite Menu stage (local-only · driven by the IAJW relay).
    'menuStage',
    // PRE-EPOCH · BSSM keyed Record of per-designation Shatterite Menu stages (driven by the
    // N-watcher SMRP relay · 'IsomorphicExpanse Set Designation Menu Stage').
    'shatteriteMenus',
    // A-1 B-6 reconciliation · AGGREGATE the muxified suiteCascade's filterKeys
    // (`cascades`, `activeCascadeDirectory`, `activeSubPage`) so the IsomorphicExpanse page base
    // observes the shared Tier-2 Record. Sourced from the canonical suiteCascade
    // muxonomic; dedup is handled by the client base (`[...new Set(allFilterKeys)]`).
    ...suiteCascadeMuxonomic.filterKeys,
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: ['designations', 'activeDesignationName', 'activeTab'],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'isomorphicExpanseRegisterDesignation',
        type: 'Suite 8 Register Designation',
        filePath: 'qualities/registerDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseRegisterSampleDesignations',
        type: 'Suite 8 Register Sample Designations',
        filePath: 'qualities/registerSampleDesignations.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseSetActiveDesignation',
        type: 'Suite 8 Set Active Designation',
        filePath: 'qualities/setActiveDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseSetActiveTab',
        type: 'Suite 8 Set Active Tab',
        filePath: 'qualities/setActiveTab.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // A-6 HCD · local SubPage selector (Home · Component · Documentation triad).
      {
        name: 'isomorphicExpanseSetActiveSubPage',
        type: 'Suite 8 Set Active Sub Page',
        filePath: 'qualities/isomorphicExpanseSetActiveSubPage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseSetDiamondContent',
        type: 'Suite 8 Set Diamond Content',
        filePath: 'qualities/setDiamondContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseSetOnyxContent',
        type: 'Suite 8 Set Onyx Content',
        filePath: 'qualities/setOnyxContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseSetBoundCascade',
        type: 'Suite 8 Set Bound Cascade',
        filePath: 'qualities/setBoundCascade.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'isomorphicExpanseSetFileSystemSheet',
        type: 'Suite 8 Set File System Sheet',
        filePath: 'qualities/setFileSystemSheet.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
      {
        name: 'isomorphicExpanseSetMenuStage',
        type: 'IsomorphicExpanse Set Menu Stage',  // = VERBOSE('SetMenuStage') · TQNI byte-match
        filePath: 'qualities/isomorphicExpanseSetMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // PRE-EPOCH · BSSM keyed MenuStage relay-reception quality (the N-watcher SMRP broadcasts this).
      {
        name: 'isomorphicExpanseSetDesignationMenuStage',
        type: 'IsomorphicExpanse Set Designation Menu Stage',  // = VERBOSE('SetDesignationMenuStage') · TQNI byte-match
        filePath: 'qualities/isomorphicExpanseSetDesignationMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'IsomorphicExpanseHuirthDeck',
    client: 'IsomorphicExpanseClientDeck',
  },

  navigation: isomorphicExpanseNavigation,

  actionExchange: {
    serverToClient: [
      // GTMS8C · the scalar relay-routed quality — the single-designation menu-watch broadcasts this
      // type. The HuirthBase ('IsomorphicExpanse Set Menu Stage Huirth Base') is ABSENT here (TQNI invariant).
      {
        qualityName: 'isomorphicExpanseSetMenuStage',
        actionType: S8_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetMenuStage') · byte-match the demometer type
        direction: ExchangeDirection.ServerToClient,
      },
      // PRE-EPOCH · BSSM the keyed relay-routed quality — the N-watcher SMRP broadcasts this type.
      // The keyed HuirthBase ('IsomorphicExpanse Set Designation Menu Stage Huirth Base') is ABSENT here
      // (Huirth-only · the Base-maintenance law · Seam 2).
      {
        qualityName: 'isomorphicExpanseSetDesignationMenuStage',
        actionType: S8_DESIGNATION_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetDesignationMenuStage') · byte-match
        direction: ExchangeDirection.ServerToClient,
      },
    ],
    clientToServer: [],
  },
};
