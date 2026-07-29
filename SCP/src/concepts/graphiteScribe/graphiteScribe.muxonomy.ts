/**
 * GraphiteScribe Muxonomy Configuration
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
// A-1 SCBM/B-6 reconciliation · graphiteScribe muxifies suiteCascade (ONE shared instance at
// Tier 2). The muxified member's Record properties (`cascades`, `activeCascadeDirectory`,
// `activeSubPage`) must be aggregated into graphiteScribe's filterKeys so the client base
// observes the shared Record on the GraphiteScribe Landing (without aggregation the muxified
// suiteCascade's properties are not registered as non-synced filterKeys on the page base).
import { suiteCascadeMuxonomic } from '../suiteCascade/suiteCascade.muxonomy';
import { S8_MENU_STAGE_RELAY_TYPE, S8_DESIGNATION_MENU_STAGE_RELAY_TYPE } from '../scsBridge/model/s8RelayTypes.model';

const graphiteScribeLandingPage: PageEntry = {
  path: '/graphiteScribe',
  label: 'Suite 8 Designations',
  order: 0,
  componentPath: 'graphiteScribe/vue/GraphiteScribeLanding',
  isMain: true,
};

const graphiteScribeDetailPage: PageEntry = {
  path: '/graphiteScribe/page',
  label: 'Suite 8 Page',
  order: 1,
  componentPath: 'graphiteScribe/vue/GraphiteScribePage',
  isMain: false,
};

// DSSLS · the Template Suite 8 Page (GraphiteScribeHomeLanding.vue) — the pared-down Cadmium
// homepage scaffold the install Opus adapts into the user's domain Suite 8 as the SCP
// HOME PAGE. Registered as a non-main subpage here so its componentPath resolves; the
// SAMLS swap (S10-HomePageAdapt) flips a dedicated home NavigationConfig to isMainLanding.
const graphiteScribeHomePage: PageEntry = {
  path: '/graphiteScribe/home',
  label: 'Suite 8 Home',
  order: 2,
  componentPath: 'graphiteScribe/vue/GraphiteScribeHomeLanding',
  isMain: false,
};

export const graphiteScribeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '✏️',
  color: 'amethyst',
  label: 'Graphite Scribe',
  order: 3,
  pages: [graphiteScribeLandingPage, graphiteScribeDetailPage, graphiteScribeHomePage],
};

// SAMLS · the dedicated DOMAIN HOME navigation config. Default isMainLanding: false —
// the Template Suite 8 Page exists but does NOT yet claim the `/` route. S10-HomePageAdapt
// flips isMainLanding: true (and lowers `order` below cadmium's 4) so the user's adapted
// domain page wins getLandingPage(). The install Opus also sets `color` + `label` to the
// user's chosen domain/suite-tier at adapt time.
//
// ADAPT (S10): set isMainLanding: true · set order: 0 · set color/label/icon to the domain.
export const graphiteScribeHomeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🏠',
  color: 'cobalt',
  label: 'Graphite Scribe',
  order: 2,
  pages: [{ ...graphiteScribeHomePage, isMain: true }],
};

export const graphiteScribeMuxonomic: MuxonomicConfig<'graphiteScribe'> = {
  conceptName: 'graphiteScribe',

  filterKeys: [
    'actionQue',
    'filterKeys',
    // A-1 SPSR · the shared Record key.
    'graphiteScribes',
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
    // N-watcher SMRP relay · 'GraphiteScribe Set Designation Menu Stage').
    'shatteriteMenus',
    // A-1 B-6 reconciliation · AGGREGATE the muxified suiteCascade's filterKeys
    // (`cascades`, `activeCascadeDirectory`, `activeSubPage`) so the GraphiteScribe page base
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
        name: 'graphiteScribeRegisterDesignation',
        type: 'Suite 8 Register Designation',
        filePath: 'qualities/registerDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeRegisterSampleDesignations',
        type: 'Suite 8 Register Sample Designations',
        filePath: 'qualities/registerSampleDesignations.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetActiveDesignation',
        type: 'Suite 8 Set Active Designation',
        filePath: 'qualities/setActiveDesignation.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetActiveTab',
        type: 'Suite 8 Set Active Tab',
        filePath: 'qualities/setActiveTab.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // MD-CE-3 · the editor-holding six (local-only · never in actionExchange).
      {
        name: 'graphiteScribeOpenFile',
        type: 'Code Editor Open File',
        filePath: 'qualities/graphiteScribeOpenFile.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeCloseFile',
        type: 'Code Editor Close File',
        filePath: 'qualities/graphiteScribeCloseFile.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetActiveFile',
        type: 'Code Editor Set Active File',
        filePath: 'qualities/graphiteScribeSetActiveFile.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeUpdateBuffer',
        type: 'Code Editor Update Buffer',
        filePath: 'qualities/graphiteScribeUpdateBuffer.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeMarkFileSaved',
        type: 'Code Editor Mark File Saved',
        filePath: 'qualities/graphiteScribeMarkFileSaved.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetEditorSettings',
        type: 'Code Editor Set Editor Settings',
        filePath: 'qualities/graphiteScribeSetEditorSettings.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // A-6 HCD · local SubPage selector (Home · Component · Documentation triad).
      {
        name: 'graphiteScribeSetActiveSubPage',
        type: 'Suite 8 Set Active Sub Page',
        filePath: 'qualities/graphiteScribeSetActiveSubPage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetDiamondContent',
        type: 'Suite 8 Set Diamond Content',
        filePath: 'qualities/setDiamondContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetOnyxContent',
        type: 'Suite 8 Set Onyx Content',
        filePath: 'qualities/setOnyxContent.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetBoundCascade',
        type: 'Suite 8 Set Bound Cascade',
        filePath: 'qualities/setBoundCascade.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'graphiteScribeSetFileSystemSheet',
        type: 'Suite 8 Set File System Sheet',
        filePath: 'qualities/setFileSystemSheet.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // GTMS8C · MenuStage relay-reception quality (type-matched to the menu-watch broadcast).
      {
        name: 'graphiteScribeSetMenuStage',
        type: 'GraphiteScribe Set Menu Stage',  // = VERBOSE('SetMenuStage') · TQNI byte-match
        filePath: 'qualities/graphiteScribeSetMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // PRE-EPOCH · BSSM keyed MenuStage relay-reception quality (the N-watcher SMRP broadcasts this).
      {
        name: 'graphiteScribeSetDesignationMenuStage',
        type: 'GraphiteScribe Set Designation Menu Stage',  // = VERBOSE('SetDesignationMenuStage') · TQNI byte-match
        filePath: 'qualities/graphiteScribeSetDesignationMenuStage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'GraphiteScribeHuirthDeck',
    client: 'GraphiteScribeClientDeck',
  },

  navigation: graphiteScribeNavigation,

  actionExchange: {
    serverToClient: [
      // GTMS8C · the scalar relay-routed quality — the single-designation menu-watch broadcasts this
      // type. The HuirthBase ('GraphiteScribe Set Menu Stage Huirth Base') is ABSENT here (TQNI invariant).
      {
        qualityName: 'graphiteScribeSetMenuStage',
        actionType: S8_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetMenuStage') · byte-match the demometer type
        direction: ExchangeDirection.ServerToClient,
      },
      // PRE-EPOCH · BSSM the keyed relay-routed quality — the N-watcher SMRP broadcasts this type.
      // The keyed HuirthBase ('GraphiteScribe Set Designation Menu Stage Huirth Base') is ABSENT here
      // (Huirth-only · the Base-maintenance law · Seam 2).
      {
        qualityName: 'graphiteScribeSetDesignationMenuStage',
        actionType: S8_DESIGNATION_MENU_STAGE_RELAY_TYPE,  // the SERVER'S wire dialect (never-copied · C760)  // = VERBOSE('SetDesignationMenuStage') · byte-match
        direction: ExchangeDirection.ServerToClient,
      },
    ],
    clientToServer: [],
  },
};
