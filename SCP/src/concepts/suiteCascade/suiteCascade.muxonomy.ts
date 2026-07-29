/**
 * SuiteCascade Muxonomy Configuration
 *
 * Declares the SuiteCascade concept's demometers (3 local quality reducers — no
 * Diametric routes for B-1) + navigation for the (future) HCD SubPage triad
 * (B-6). Mirrors suite8.muxonomy.ts MuxonomicConfig shape.
 *
 * B-1 registers the 3 quality demometers (register + 2 setters) and the
 * always-present `cascades` filterKey. The Vue surfaces (ACFR B-2 · DOPR B-3 ·
 * HCD triad B-6) are wired in later Bands; navigation pages reference their
 * future component paths.
 *
 * Citation: suite8.muxonomy.ts (MuxonomicConfig pattern).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 * Citation: muxonomy.model.ts MuxonomicConfig.
 */
import {
  type MuxonomicConfig,
  type NavigationConfig,
  type PageEntry,
  ChangeDetectionMode,
  DeploymentTarget,
  ExchangeDirection,
} from '../muxonomy/muxonomy.model';

const suiteCascadeLandingPage: PageEntry = {
  path: '/suiteCascade',
  label: 'Suite Cascade',
  order: 0,
  componentPath: 'suiteCascade/vue/SuiteCascadeLanding',
  isMain: true,
};

export const suiteCascadeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🌊',
  color: 'cobalt',
  label: 'Suite Cascade',
  order: 4,
  pages: [suiteCascadeLandingPage],
};

export const suiteCascadeMuxonomic: MuxonomicConfig<'suiteCascade'> = {
  conceptName: 'suiteCascade',

  filterKeys: [
    'cascades',
    // B-5 SDCR + GRID — the re-scope selector key (watcher reads it; sync broadcasts it).
    'activeCascadeDirectory',
    // B-6 HCD — the SubPage selector key (local-only UI; never synced).
    'activeSubPage',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    // cascades + activeCascadeDirectory broadcast via the explicit
    // actionExchange.serverToClient relay (Path B · B-4 WCJF + B-5 SDCR) rather than
    // auto-sync — mirrors scsBridge bridgeJson.
    filterKeys: ['cascades', 'activeCascadeDirectory'],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'suiteCascadeRegisterNamedCascade',
        type: 'Suite Cascade Register Named Cascade',
        filePath: 'qualities/suiteCascadeRegisterNamedCascade.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suiteCascadeSetCascadeJson',
        type: 'Suite Cascade Set Cascade Json',
        filePath: 'qualities/suiteCascadeSetCascadeJson.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suiteCascadeSetActiveCascadeFiles',
        type: 'Suite Cascade Set Active Cascade Files',
        filePath: 'qualities/suiteCascadeSetActiveCascadeFiles.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // B-5 SDCR + GRID · local re-scope setter (Client face · HCD Home context selector).
      {
        name: 'suiteCascadeSetActiveCascadeDirectory',
        type: 'Suite Cascade Set Active Cascade Directory',
        filePath: 'qualities/suiteCascadeSetActiveCascadeDirectory.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // B-6 HCD · local SubPage selector (Home · Component · Documentation triad).
      {
        name: 'suiteCascadeSetActiveSubPage',
        type: 'Suite Cascade Set Active Sub Page',
        filePath: 'qualities/suiteCascadeSetActiveSubPage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // ============================================
      // B-4 WCJF · SBIS BASE (Huirth-only · NOT in actionExchange.serverToClient)
      // ============================================
      {
        name: 'suiteCascadeSetCascadeHuirthBase',
        type: 'Suite Cascade Set Cascade Huirth Base',
        filePath: 'qualities/suiteCascadeSetCascadeHuirthBase.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'suiteCascadeSetActiveCascadeFilesHuirthBase',
        type: 'Suite Cascade Set Active Cascade Files Huirth Base',
        filePath: 'qualities/suiteCascadeSetActiveCascadeFilesHuirthBase.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      // B-5 SDCR + GRID · SBIS BASE re-scope trigger (Huirth-only · the watcher reads
      // its selector to tear down + re-arm chokidar on the new dir).
      {
        name: 'suiteCascadeSetActiveCascadeDirectoryHuirthBase',
        type: 'Suite Cascade Set Active Cascade Directory Huirth Base',
        filePath: 'qualities/suiteCascadeSetActiveCascadeDirectoryHuirthBase.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      // ============================================
      // B-4 WCJF · SBIS RELAY (dual-deployment · broadcast via actionExchange · Path B)
      // ============================================
      {
        name: 'suiteCascadeSetCascadeRelay',
        type: 'Suite Cascade Set Cascade Relay',
        filePath: 'qualities/suiteCascadeSetCascadeRelay.quality.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'suiteCascadeSetActiveCascadeFilesRelay',
        type: 'Suite Cascade Set Active Cascade Files Relay',
        filePath: 'qualities/suiteCascadeSetActiveCascadeFilesRelay.quality.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // B-5 SDCR + GRID · SBIS RELAY (dual-deployment · broadcast the active dir · Path B).
      {
        name: 'suiteCascadeSetActiveCascadeDirectoryRelay',
        type: 'Suite Cascade Set Active Cascade Directory Relay',
        filePath: 'qualities/suiteCascadeSetActiveCascadeDirectoryRelay.quality.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [
      {
        name: 'suiteCascadeGeneralWatcherPrinciple',
        filePath: 'principles/suiteCascade.principles.model.ts',
        location: DeploymentTarget.Client,
      },
      {
        name: 'suiteCascadeNamedLoaderPrinciple',
        filePath: 'principles/suiteCascade.principles.model.ts',
        location: DeploymentTarget.Client,
      },
      // B-4 WCJF · the Huirth-side chokidar Cascade.json watcher principle.
      {
        name: 'suiteCascadeJsonWatcherPrinciple',
        filePath: 'principles/suiteCascadeJsonWatcher.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: 'SuiteCascadeHuirthDeck',
    client: 'SuiteCascadeClientDeck',
  },

  navigation: suiteCascadeNavigation,

  // B-4 WCJF · Path B relay — the Huirth watcher's Relay actions cross the WS
  // boundary to the Client `cascades` Record. Base actions are Huirth-only and are
  // INTENTIONALLY ABSENT here (SBIS invariant). Mirrors scsBridge.muxonomy.ts.
  actionExchange: {
    serverToClient: [
      {
        qualityName: 'suiteCascadeSetCascadeRelay',
        actionType: 'Suite Cascade Set Cascade Relay',
        direction: ExchangeDirection.ServerToClient,
      },
      {
        qualityName: 'suiteCascadeSetActiveCascadeFilesRelay',
        actionType: 'Suite Cascade Set Active Cascade Files Relay',
        direction: ExchangeDirection.ServerToClient,
      },
      // B-5 SDCR + GRID · broadcast the active dir (GRID vs docked Suite8) to the Client.
      {
        qualityName: 'suiteCascadeSetActiveCascadeDirectoryRelay',
        actionType: 'Suite Cascade Set Active Cascade Directory Relay',
        direction: ExchangeDirection.ServerToClient,
      },
    ],
    // SCRR · client sentinel → server Backfill-On-Request (mirrors scsBridge.muxonomy.ts
    // clientToServer pattern). The Huirth Real (suiteCascadeSendCascadeRequest) receives
    // this type string and responds with the current cascades relay.
    clientToServer: [
      {
        qualityName: 'suiteCascadeSendCascadeRequest',
        actionType: 'Suite Cascade Send Cascade Request',
        direction: ExchangeDirection.ClientToServer,
      },
    ],
  },
};
