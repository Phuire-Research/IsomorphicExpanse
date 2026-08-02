/**
 * FrontierCircuitTest Muxonomy Configuration
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
// A-1 SCBM/B-6 reconciliation · frontierCircuitTest muxifies suiteCascade (ONE shared instance at
// Tier 2). The muxified member's Record properties (`cascades`, `activeCascadeDirectory`,
// `activeSubPage`) must be aggregated into frontierCircuitTest's filterKeys so the client base
// observes the shared Record on the FrontierCircuitTest Landing (without aggregation the muxified
// suiteCascade's properties are not registered as non-synced filterKeys on the page base).
import { suiteCascadeMuxonomic } from '../suiteCascade/suiteCascade.muxonomy';
import { S8_MENU_STAGE_RELAY_TYPE, S8_DESIGNATION_MENU_STAGE_RELAY_TYPE } from '../scsBridge/model/s8RelayTypes.model';

const frontierCircuitTestLandingPage: PageEntry = {
  path: '/frontierCircuitTest',
  label: 'Suite 8 Designations',
  order: 0,
  componentPath: 'frontierCircuitTest/vue/FrontierCircuitTestLanding',
  isMain: true,
};

const frontierCircuitTestDetailPage: PageEntry = {
  path: '/frontierCircuitTest/page',
  label: 'Suite 8 Page',
  order: 1,
  componentPath: 'frontierCircuitTest/vue/FrontierCircuitTestPage',
  isMain: false,
};

// DSSLS · the Template Suite 8 Page (FrontierCircuitTestHomeLanding.vue) — the pared-down Cadmium
// homepage scaffold a minted domain Suite 8 inherits. Registered as a non-main subpage so
// its componentPath resolves. THE HOME CLAIM IS RETIRED (C780/C787): a domain page is a
// NAMED ROOM at its own route — nothing here claims `/` and no install step flips it.
const frontierCircuitTestHomePage: PageEntry = {
  path: '/frontierCircuitTest/home',
  label: 'Suite 8 Home',
  order: 2,
  componentPath: 'frontierCircuitTest/vue/FrontierCircuitTestHomeLanding',
  isMain: false,
};

export const frontierCircuitTestNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🎴',
  color: 'amethyst',
  label: 'FrontierCircuitTest',
  order: 3,
  pages: [frontierCircuitTestLandingPage, frontierCircuitTestDetailPage, frontierCircuitTestHomePage],
};

// SAMLS · the dedicated DOMAIN HOME navigation config — RETIRED DOCTRINE (C780/C787): the
// home claim no longer runs. This config stays isMainLanding: false PERMANENTLY (the default
// landing keeps `/`); it is kept only for shape-compatibility with prior mints. Do NOT flip
// isMainLanding anor lower `order` — no install anor agent step does this anymore.
export const frontierCircuitTestHomeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🏠',
  color: 'cobalt',
  label: 'FrontierCircuitTest',
  order: 2,
  pages: [{ ...frontierCircuitTestHomePage, isMain: true }],
};

export const frontierCircuitTestMuxonomic: MuxonomicConfig<'frontierCircuitTest'> = {
  conceptName: 'frontierCircuitTest',

  filterKeys: [
    'actionQue',
    'filterKeys',
    // A-1 SPSR · the shared Record key.
    'frontierCircuitTests',
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
    // N-watcher SMRP relay · 'FrontierCircuitTest Set Designation Menu Stage').
    'shatteriteMenus',
    // A-1 B-6 reconciliation · AGGREGATE the muxified suiteCascade's filterKeys
    // (`cascades`, `activeCascadeDirectory`, `activeSubPage`) so the FrontierCircuitTest page base
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
        name: 'frontierCircuitTestRegisterDesignation',
        type: 'Suite 8 Register Designation',
        filePath: 'qualities/registerDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestRegisterSampleDesignations',
        type: 'Suite 8 Register Sample Designations',
        filePath: 'qualities/registerSampleDesignations.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestSetActiveDesignation',
        type: 'Suite 8 Set Active Designation',
        filePath: 'qualities/setActiveDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestSetActiveTab',
        type: 'Suite 8 Set Active Tab',
        filePath: 'qualities/setActiveTab.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // A-6 HCD · local SubPage selector (Home · Component · Documentation triad).
      {
        name: 'frontierCircuitTestSetActiveSubPage',
        type: 'Suite 8 Set Active Sub Page',
        filePath: 'qualities/frontierCircuitTestSetActiveSubPage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestSetDiamondContent',
        type: 'Suite 8 Set Diamond Content',
        filePath: 'qualities/setDiamondContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestSetOnyxContent',
        type: 'Suite 8 Set Onyx Content',
        filePath: 'qualities/setOnyxContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestSetBoundCascade',
        type: 'Suite 8 Set Bound Cascade',
        filePath: 'qualities/setBoundCascade.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'frontierCircuitTestSetFileSystemSheet',
        type: 'Suite 8 Set File System Sheet',
        filePath: 'qualities/setFileSystemSheet.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
      {
        name: 'frontierCircuitTestSetMenuStage',
        type: 'FrontierCircuitTest Set Menu Stage',  // = VERBOSE('SetMenuStage') · TQNI byte-match
        filePath: 'qualities/frontierCircuitTestSetMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // PRE-EPOCH · BSSM keyed MenuStage relay-reception quality (the N-watcher SMRP broadcasts this).
      {
        name: 'frontierCircuitTestSetDesignationMenuStage',
        type: 'FrontierCircuitTest Set Designation Menu Stage',  // = VERBOSE('SetDesignationMenuStage') · TQNI byte-match
        filePath: 'qualities/frontierCircuitTestSetDesignationMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'FrontierCircuitTestHuirthDeck',
    client: 'FrontierCircuitTestClientDeck',
  },

  navigation: frontierCircuitTestNavigation,

  actionExchange: {
    serverToClient: [
      // GTMS8C · the scalar relay-routed quality — the single-designation menu-watch broadcasts this
      // type. The HuirthBase ('FrontierCircuitTest Set Menu Stage Huirth Base') is ABSENT here (TQNI invariant).
      {
        qualityName: 'frontierCircuitTestSetMenuStage',
        actionType: S8_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetMenuStage') · byte-match the demometer type
        direction: ExchangeDirection.ServerToClient,
      },
      // PRE-EPOCH · BSSM the keyed relay-routed quality — the N-watcher SMRP broadcasts this type.
      // The keyed HuirthBase ('FrontierCircuitTest Set Designation Menu Stage Huirth Base') is ABSENT here
      // (Huirth-only · the Base-maintenance law · Seam 2).
      {
        qualityName: 'frontierCircuitTestSetDesignationMenuStage',
        actionType: S8_DESIGNATION_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetDesignationMenuStage') · byte-match
        direction: ExchangeDirection.ServerToClient,
      },
    ],
    clientToServer: [],
  },
};
