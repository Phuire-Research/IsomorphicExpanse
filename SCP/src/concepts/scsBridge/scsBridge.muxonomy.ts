/**
 * SCS-Bridge Muxonomy Configuration
 *
 * Muxonomic configuration for the scsBridge concept (foundation · D1).
 *
 * Declares the single-message Diameter junction via M1-P1's actionExchange API
 * (canonical exemplar: notification.muxonomy.ts).
 *
 * MSDT note (Cycle 160 R13 BOCR) · scsBridge huirth principles include
 * scsBridgeBackfillOnConnectPrinciple which reads
 * d.webSocketServer.k.webSocketClients and dispatches
 * d.webSocketServer.e.webSocketServerAppendToActionQue. This is an
 * intra-Huirth Diameter (local cross-concept call) · NOT an actionExchange
 * entry. actionExchange.serverToClient governs WebSocket boundary crossings;
 * the BOCR principle's cross-concept access is fully contained within the
 * huirth Muxium and is declared via ScsBridgeBackfillDeck in
 * principles/scsBridgeBackfillOnConnect.principle.huirth.ts.
 * Citation: EPSILON-BACKFILL-ON-CONNECT-WAVE1-R4-VIRIDIAN-AUDIT.md §HAZARD-γ
 *
 * Citation: DIAMOND-TIER-M1-A1-D1.md (this sub-Diamond)
 * Citation: muxonomy.model.ts MuxonomicConcept pattern · M1-P1 actionExchange API
 * Citation: notification.muxonomy.ts (Island Architecture exemplar with actionExchange)
 */
import {
  type MuxonomicConfig,
  type NavigationConfig,
  type PageEntry,
  ChangeDetectionMode,
  DeploymentTarget,
  ExchangeDirection,
} from '../muxonomy/muxonomy.model';

// ============================================
// SCS-BRIDGE PAGES
// ============================================

/**
 * SCS-Bridge Landing Page
 *
 * Foundation: PageEntry references future Vue component path; D2 lands the
 * actual ScsBridgeLanding.vue surface. Until D2, the route is registered but
 * the component does not yet exist on disk — StratiVerse scanner tolerates
 * this and emits a warning rather than failing the registry.
 */
const scsBridgeLandingPage: PageEntry = {
  path: '/scs-bridge',
  label: 'SCS-Bridge',
  order: 0,
  componentPath: 'scsBridge/vue/ScsBridgeLanding',
  isMain: true,
};

// ============================================
// SCS-BRIDGE NAVIGATION CONFIG
// ============================================

export const scsBridgeNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🌉',
  color: 'cobalt',
  label: 'SCS-Bridge',
  order: 2,
  pages: [scsBridgeLandingPage],
};

// ============================================
// MUXONOMIC CONFIGURATION
// ============================================

export const scsBridgeMuxonomic: MuxonomicConfig<'scsBridge'> = {
  conceptName: 'scsBridge',

  filterKeys: [
    'actionQue',
    'filterKeys',
    'barVisible',
    'barExpanded',
    'activeSubPage',
    'bridgeStatus',
    'bridgeStatusLastUpdate',
    // Cycle 155 · JSON Relay (pushed via explicit actionExchange.serverToClient · Path B)
    'bridgeJson',
    'sessionsList',
    // SE · Epoch Extension · ASMQ/UFRT · archive-manifest (broadcast via actionExchange.serverToClient)
    'archiveManifest',
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'barVisible',
      'barExpanded',
      'activeSubPage',
      'bridgeStatus',
      'bridgeStatusLastUpdate',
      // Cycle 155 · JSON Relay excluded from auto-sync; broadcast via actionExchange
      'bridgeJson',
      'sessionsList',
      // SE · Epoch Extension · ASMQ/UFRT · archive-manifest (broadcast via actionExchange)
      'archiveManifest',
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'scsBridgeSendBridgeMessage',
        type: 'Scs Bridge Send Bridge Message',
        filePath: 'qualities/sendBridgeMessage.quality.client.diameter.ts',
        location: DeploymentTarget.Client,
        diameter: true,
      },
      {
        name: 'scsBridgeTriggerHardTurnOver',
        type: 'Scs Bridge Trigger Hard Turn Over',
        filePath: 'qualities/triggerHardTurnOver.quality.client.diameter.ts',
        location: DeploymentTarget.Client,
        diameter: true,
      },
      {
        name: 'scsBridgeSetBridgeStatus',
        type: 'Scs Bridge Set Bridge Status',
        filePath: 'qualities/setBridgeStatus.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetBarVisible',
        type: 'Scs Bridge Set Bar Visible',
        filePath: 'qualities/setBarVisible.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetBarExpanded',
        type: 'Scs Bridge Set Bar Expanded',
        filePath: 'qualities/setBarExpanded.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetActiveSubPage',
        type: 'Scs Bridge Set Active Sub Page',
        filePath: 'qualities/setActiveSubPage.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetRenderSettings',
        type: 'Scs Bridge Set Render Settings',
        filePath: 'qualities/setRenderSettings.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight reducer
      // (received via actionExchange.serverToClient from the scs:highlight relay · set + clear).
      {
        name: 'scsBridgeSetHighlightTarget',
        type: 'Scs Bridge Set Highlight Target',
        filePath: 'qualities/setHighlightTarget.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // ============================================
      // M2 EXTENSION BACKFILL (Cycle 155 · MSDT completion · Foundation A Wave 0)
      // Previously unlisted Client qualities now registered for StratiVERSE
      // auto-discovery completeness per S15 §6 MSDT.
      // ============================================
      {
        name: 'scsBridgeSetInstallMenuOpen',
        type: 'Scs Bridge Set Install Menu Open',
        filePath: 'qualities/setInstallMenuOpen.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeAdvanceInstallWizardStep',
        type: 'Scs Bridge Advance Install Wizard Step',
        filePath: 'qualities/advanceInstallWizardStep.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetInstalledScps',
        type: 'Scs Bridge Set Installed Scps',
        filePath: 'qualities/setInstalledScps.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeRecomputeMainMenuMirror',
        type: 'Scs Bridge Recompute Main Menu Mirror',
        filePath: 'qualities/recomputeMainMenuMirror.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetWizardConceptNameDraft',
        type: 'Scs Bridge Set Wizard Concept Name Draft',
        filePath: 'qualities/setWizardConceptNameDraft.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetCadmiumTutorialJoin',
        type: 'Scs Bridge Set Cadmium Tutorial Join',
        filePath: 'qualities/setCadmiumTutorialJoin.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeRegisterToolbarButton',
        type: 'Scs Bridge Register Toolbar Button',
        filePath: 'qualities/registerToolbarButton.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeUnregisterToolbarButton',
        type: 'Scs Bridge Unregister Toolbar Button',
        filePath: 'qualities/unregisterToolbarButton.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetToolbarButtonEnabled',
        type: 'Scs Bridge Set Toolbar Button Enabled',
        filePath: 'qualities/setToolbarButtonEnabled.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeBootDefaultToolbar',
        type: 'Scs Bridge Boot Default Toolbar',
        filePath: 'qualities/bootDefaultToolbar.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeEnableSendMessageToolbar',
        type: 'Scs Bridge Enable Send Message Toolbar',
        filePath: 'qualities/enableSendMessageToolbar.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // Huirth Real counterpart of the Hard Turn Over Diameter (MSDT completeness)
      {
        name: 'scsBridgeTriggerHardTurnOverHuirth',
        type: 'Scs Bridge Trigger Hard Turn Over',
        filePath: 'qualities/triggerHardTurnOver.quality.huirth.diameter.ts',
        location: DeploymentTarget.Huirth,
        diameter: true,
      },
      // ============================================
      // CYCLE 155 · JSON RELAY (Foundation A Wave 3 · Cobalt-C lands these)
      // ============================================
      {
        name: 'scsBridgeSetBridgeJsonRelay',
        type: 'Scs Bridge Set Bridge Json Relay',
        filePath: 'qualities/setBridgeJsonRelay.quality.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetSessionsListRelay',
        type: 'Scs Bridge Set Sessions List Relay',
        filePath: 'qualities/setSessionsListRelay.quality.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // SE · Epoch Extension · ASMQ · archive-manifest Relay (dual-deployment · client receives
      // via actionExchange.serverToClient) + Huirth-only Base (NOT in actionExchange · SBIS).
      {
        name: 'scsBridgeSetArchiveManifestRelay',
        type: 'Scs Bridge Set Archive Manifest Relay',
        filePath: 'qualities/setArchiveManifestRelay.quality.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'scsBridgeSetArchiveManifestHuirthBase',
        type: 'Scs Bridge Set Archive Manifest Huirth Base',
        filePath: 'qualities/setArchiveManifestHuirthBase.quality.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      // PP-D4 · Cycle 160 · Stale-Pong Baseline (huirth-only · not broadcast directly;
      // value is threaded into setBridgeJsonRelay payload by scsBridgeJsonWatcher).
      {
        name: 'scsBridgeSetServerStartupTime',
        type: 'Scs Bridge Set Server Startup Time',
        filePath: 'qualities/setServerStartupTime.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [
      {
        name: 'scsBridgeConnectionPrinciple',
        filePath: 'principles/scsBridgeConnection.principle.client.ts',
        location: DeploymentTarget.Client,
      },
      // Cycle 155 · Huirth filesystem watcher principle (Foundation A Wave 3)
      {
        name: 'scsBridgeJsonWatcherPrinciple',
        filePath: 'principles/scsBridgeJsonWatcher.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
      // SE · Epoch Extension · AMWP · archive-manifest chokidar watcher (Cascades/Archive/ → ASMQ)
      {
        name: 'scsBridgeArchiveManifestWatcherPrinciple',
        filePath: 'principles/scsBridgeArchiveManifestWatcher.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: 'ScsBridgeHuirthDeck',
    client: 'ScsBridgeClientDeck',
  },

  navigation: scsBridgeNavigation,

  // M1-P1 actionExchange — declares the Diameter junctions this concept owns.
  // Both routes are PLACEHOLDERS (NOT-IMPLEMENTED-YET) — D2 lands the actual
  // quality files matching these declarations. The declaration here is the
  // SEMANTIC CONTRACT; the quality files (D2) are the runtime implementation.
  actionExchange: {
    clientToServer: [
      {
        qualityName: 'scsBridgeSendBridgeMessage',
        actionType: 'Scs Bridge Send Bridge Message',
        direction: ExchangeDirection.ClientToServer,
      },
      {
        qualityName: 'scsBridgeTriggerHardTurnOver',
        actionType: 'Scs Bridge Trigger Hard Turn Over',
        direction: ExchangeDirection.ClientToServer,
      },
    ],
    serverToClient: [
      {
        qualityName: 'scsBridgeSetBridgeStatus',
        actionType: 'Scs Bridge Set Bridge Status',
        direction: ExchangeDirection.ServerToClient,
        // self-routing — receiver is the client-side scsBridge concept itself
      },
      // Cycle 155 · JSON Relay broadcast targets (Path B · mirrors setBridgeStatus precedent)
      {
        qualityName: 'scsBridgeSetBridgeJsonRelay',
        actionType: 'Scs Bridge Set Bridge Json Relay',
        direction: ExchangeDirection.ServerToClient,
      },
      {
        qualityName: 'scsBridgeSetSessionsListRelay',
        actionType: 'Scs Bridge Set Sessions List Relay',
        direction: ExchangeDirection.ServerToClient,
      },
      // GITM color-cascade (W4) · Vermillion Focus+Highlight — the scs:highlight relay broadcast
      // target (the huirth receiver dispatches this on a scs:highlight message · mirrors the
      // setBridgeJsonRelay self-routing precedent · receiver is the client-side scsBridge concept).
      {
        qualityName: 'scsBridgeSetHighlightTarget',
        actionType: 'Scs Bridge Set Highlight Target',
        direction: ExchangeDirection.ServerToClient,
      },
      // SE · Epoch Extension · ASMQ · archive-manifest relay (BCMC channel · the AMWP watcher
      // broadcasts this · MUST byte-match SCS_BRIDGE_SET_ARCHIVE_MANIFEST_RELAY_TYPE · without it
      // the broadcast silently never reaches client state · S4 Angle 6 TQNI / Card G3).
      {
        qualityName: 'scsBridgeSetArchiveManifestRelay',
        actionType: 'Scs Bridge Set Archive Manifest Relay',
        direction: ExchangeDirection.ServerToClient,
      },
      // D3F Diamond B · transcript data relay (real-time turn update to Client · Direct Relay D2 decision)
      {
        qualityName: 'scsBridgeSetSessionTranscriptDataRelay',
        actionType: 'Scs Bridge Set Session Transcript Data Relay',
        direction: ExchangeDirection.ServerToClient,
      },
      // GITM #639 · the gitm.json relay (scsBridgeSetGitmJsonRelay · 'Scs Bridge Set Gitm Json
      // Relay') MIGRATED → gitm.muxonomy.ts actionExchange ('Gitm Set Gitm Json'). The gitm
      // STCP relay (gitmStcpRelay) now broadcasts it. The action-pipe stays on scsBridge.
    ],
  },
};
