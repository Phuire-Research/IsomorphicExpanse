/**
 * GitM Muxonomy Configuration (full concept · BASE · #639)
 *
 * Registers the GitM page on the Suite Muxonomy sidebar nav — the REGISTERED page
 * sibling of Suite Cascade / Cadmium Researcher — AND the full gitm Stratimux concept
 * (post-migration): the gitmJson STCP relay (gitmSetGitmJson · serverToClient) plus the
 * gitmJsonWatcher + gitmStcpRelay principles. gitm is a BASE concept (BASE_CONCEPTS_CREATORS)
 * because its data is needed on TWO independent landings (GitmLanding + ScsBridgeLanding) —
 * structurally BASE, not PAGE.
 *
 * TQNI invariant: 'Gitm Set Gitm Json Huirth Base' (the Huirth-only Base) is ABSENT from
 * actionExchange.serverToClient; 'Gitm Set Gitm Json' (the relay) is PRESENT.
 *
 * Registered AFTER suiteCascadeMuxonomic in REGISTERED_MUXONOMICS (order 5, after
 * Suite Cascade's order 4) — the AIME-3 anchor stays undisturbed.
 *
 * Citation: cadmium.muxonomy.ts (full MuxonomicConfig · demometers/decks/actionExchange).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W3 gitm.muxonomy.ts expansion.
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

const gitmLandingPage: PageEntry = {
  path: '/gitm',
  label: 'GitM',
  order: 0,
  componentPath: 'gitm/vue/GitmLanding',
  isMain: true,
};

export const gitmNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🔀',
  color: 'viridian',
  label: 'GitM',
  order: 5,
  pages: [gitmLandingPage],
};

export const gitmMuxonomic: MuxonomicConfig<'gitm'> = {
  conceptName: 'gitm',

  // GITM Staging-Update (D-U4.2) — updateDiff/updateResolved join the synced slots (the heavy
  // bodies relay to the client off gitm.json · null until D-U4.3 writes the source files).
  filterKeys: ['gitmJson', 'updateDiff', 'updateResolved'],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: ['gitmJson', 'updateDiff', 'updateResolved'],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      // STCP relay reception (client-facing · type-matched to the gitmStcpRelay broadcast).
      // TQNI byte-match: 'Gitm Set Gitm Json'. The Huirth Base ('...Huirth Base') is ABSENT
      // here (Huirth-only invariant).
      {
        name: 'gitmSetGitmJson',
        type: 'Gitm Set Gitm Json',
        filePath: 'qualities/gitmSetGitmJson.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      // GITM Staging-Update (D-U4.2) — the diff/resolved RELAY qualities (client-facing ·
      // type-matched to the gitmUpdateWatcher broadcast). TQNI byte-match: 'Gitm Set Update Diff'
      // / 'Gitm Set Update Resolved'. The Huirth Base variants ('...Huirth Base') are ABSENT here
      // (Huirth-only invariant · same as the gitmSetGitmJson Base).
      {
        name: 'gitmSetUpdateDiff',
        type: 'Gitm Set Update Diff',
        filePath: 'qualities/gitmSetUpdateDiff.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
      {
        name: 'gitmSetUpdateResolved',
        type: 'Gitm Set Update Resolved',
        filePath: 'qualities/gitmSetUpdateResolved.quality.client.ts',
        location: DeploymentTarget.Client,
        diameter: false,
      },
    ],
    strategies: [],
    principles: [],
  },

  decks: {
    huirth: 'GitmHuirthDeck',
    client: 'GitmClientDeck',
  },

  navigation: gitmNavigation,

  // STCP · gitm.json relay route — the gitmStcpRelay broadcasts this type via
  // webSocketServerAppendToActionQue. TQNI byte-match: qualityName 'gitmSetGitmJson' ·
  // actionType 'Gitm Set Gitm Json'. The Huirth Base ('Gitm Set Gitm Json Huirth Base')
  // is deliberately ABSENT here (Huirth-only invariant).
  actionExchange: {
    clientToServer: [],
    serverToClient: [
      {
        qualityName: 'gitmSetGitmJson',
        actionType: 'Gitm Set Gitm Json',
        direction: ExchangeDirection.ServerToClient,
      },
      // GITM Staging-Update (D-U4.2) — the diff/resolved relay routes. TQNI byte-match:
      // qualityName 'gitmSetUpdateDiff'/'gitmSetUpdateResolved' · actionType 'Gitm Set Update
      // Diff'/'Gitm Set Update Resolved'. The Huirth Base variants ('...Huirth Base') are
      // deliberately ABSENT here (Huirth-only invariant · the TQNI rule the header documents).
      {
        qualityName: 'gitmSetUpdateDiff',
        actionType: 'Gitm Set Update Diff',
        direction: ExchangeDirection.ServerToClient,
      },
      {
        qualityName: 'gitmSetUpdateResolved',
        actionType: 'Gitm Set Update Resolved',
        direction: ExchangeDirection.ServerToClient,
      },
    ],
  },
};
