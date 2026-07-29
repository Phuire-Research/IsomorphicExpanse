/**
 * Suite8 Muxonomy Configuration
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
// A-1 SCBM/B-6 reconciliation · suite8 muxifies suiteCascade (ONE shared instance at
// Tier 2). The muxified member's Record properties (`cascades`, `activeCascadeDirectory`,
// `activeSubPage`) must be aggregated into suite8's filterKeys so the client base
// observes the shared Record on the Suite8 Landing (without aggregation the muxified
// suiteCascade's properties are not registered as non-synced filterKeys on the page base).
import { suiteCascadeMuxonomic } from '../suiteCascade/suiteCascade.muxonomy';
import { S8_MENU_STAGE_RELAY_TYPE, S8_DESIGNATION_MENU_STAGE_RELAY_TYPE } from '../scsBridge/model/s8RelayTypes.model';

const suite8LandingPage: PageEntry = {
  path: '/suite8',
  label: 'Suite 8 Designations',
  order: 0,
  componentPath: 'suite8/vue/Suite8Landing',
  isMain: true,
};

const suite8DetailPage: PageEntry = {
  path: '/suite8/page',
  label: 'Suite 8 Page',
  order: 1,
  componentPath: 'suite8/vue/Suite8Page',
  isMain: false,
};

// DSSLS · the Template Suite 8 Page (Suite8HomeLanding.vue) — the pared-down Cadmium
// homepage scaffold a minted domain Suite 8 inherits. Registered as a non-main subpage so
// its componentPath resolves. THE HOME CLAIM IS RETIRED (C780/C787): a domain page is a
// NAMED ROOM at its own route — nothing here claims `/` and no install step flips it.
const suite8HomePage: PageEntry = {
  path: '/suite8/home',
  label: 'Suite 8 Home',
  order: 2,
  componentPath: 'suite8/vue/Suite8HomeLanding',
  isMain: false,
};

export const suite8Navigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🎴',
  color: 'amethyst',
  label: 'Suite 8',
  order: 3,
  pages: [suite8LandingPage, suite8DetailPage, suite8HomePage],
};

// SAMLS · the dedicated DOMAIN HOME navigation config — RETIRED DOCTRINE (C780/C787): the
// home claim no longer runs. This config stays isMainLanding: false PERMANENTLY (the default
// landing keeps `/`); it is kept only for shape-compatibility with prior mints. Do NOT flip
// isMainLanding anor lower `order` — no install anor agent step does this anymore.
export const suite8HomeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🏠',
  color: 'cobalt',
  label: 'Domain Home',
  order: 2,
  pages: [{ ...suite8HomePage, isMain: true }],
};

export const suite8Muxonomic: MuxonomicConfig<'suite8'> = {
  conceptName: 'suite8',

  filterKeys: [
    'actionQue',
    'filterKeys',
    // A-1 SPSR · the shared Record key.
    'suite8s',
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
    // N-watcher SMRP relay · 'Suite8 Set Designation Menu Stage').
    'shatteriteMenus',
    // A-1 B-6 reconciliation · AGGREGATE the muxified suiteCascade's filterKeys
    // (`cascades`, `activeCascadeDirectory`, `activeSubPage`) so the Suite8 page base
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
        name: 'suite8RegisterDesignation',
        type: 'Suite 8 Register Designation',
        filePath: 'qualities/registerDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8RegisterSampleDesignations',
        type: 'Suite 8 Register Sample Designations',
        filePath: 'qualities/registerSampleDesignations.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8SetActiveDesignation',
        type: 'Suite 8 Set Active Designation',
        filePath: 'qualities/setActiveDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8SetActiveTab',
        type: 'Suite 8 Set Active Tab',
        filePath: 'qualities/setActiveTab.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // A-6 HCD · local SubPage selector (Home · Component · Documentation triad).
      {
        name: 'suite8SetActiveSubPage',
        type: 'Suite 8 Set Active Sub Page',
        filePath: 'qualities/suite8SetActiveSubPage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8SetDiamondContent',
        type: 'Suite 8 Set Diamond Content',
        filePath: 'qualities/setDiamondContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8SetOnyxContent',
        type: 'Suite 8 Set Onyx Content',
        filePath: 'qualities/setOnyxContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8SetBoundCascade',
        type: 'Suite 8 Set Bound Cascade',
        filePath: 'qualities/setBoundCascade.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suite8SetFileSystemSheet',
        type: 'Suite 8 Set File System Sheet',
        filePath: 'qualities/setFileSystemSheet.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
      {
        name: 'suite8SetMenuStage',
        type: 'Suite8 Set Menu Stage',  // = VERBOSE('SetMenuStage') · TQNI byte-match
        filePath: 'qualities/suite8SetMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // PRE-EPOCH · BSSM keyed MenuStage relay-reception quality (the N-watcher SMRP broadcasts this).
      {
        name: 'suite8SetDesignationMenuStage',
        type: 'Suite8 Set Designation Menu Stage',  // = VERBOSE('SetDesignationMenuStage') · TQNI byte-match
        filePath: 'qualities/suite8SetDesignationMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'Suite8HuirthDeck',
    client: 'Suite8ClientDeck',
  },

  navigation: suite8Navigation,

  actionExchange: {
    serverToClient: [
      // GTMS8C · the scalar relay-routed quality — the single-designation menu-watch broadcasts this
      // type. The HuirthBase ('Suite8 Set Menu Stage Huirth Base') is ABSENT here (TQNI invariant).
      {
        qualityName: 'suite8SetMenuStage',
        actionType: S8_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetMenuStage') · byte-match the demometer type
        direction: ExchangeDirection.ServerToClient,
      },
      // PRE-EPOCH · BSSM the keyed relay-routed quality — the N-watcher SMRP broadcasts this type.
      // The keyed HuirthBase ('Suite8 Set Designation Menu Stage Huirth Base') is ABSENT here
      // (Huirth-only · the Base-maintenance law · Seam 2).
      {
        qualityName: 'suite8SetDesignationMenuStage',
        actionType: S8_DESIGNATION_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetDesignationMenuStage') · byte-match
        direction: ExchangeDirection.ServerToClient,
      },
    ],
    clientToServer: [],
  },
};
