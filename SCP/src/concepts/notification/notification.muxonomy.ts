/**
 * Notification Muxonomy Configuration
 *
 * Muxonomic configuration for the notification concept.
 * Defines filter keys, sync config, and deployment metadata.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: muxonomy.model.ts - MuxonomicConcept pattern
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
// NOTIFICATION PAGES
// ============================================

/**
 * Notification Test Landing Page
 *
 * POC 2.4 test interface for the Notification Bridge system.
 * Demonstrates Zero-Knowledge pattern with base ClientMuxium.
 */
const notificationLandingPage: PageEntry = {
  path: '/notification',
  label: 'Notification Bridge',
  order: 0,
  componentPath: 'notification/vue/NotificationLanding',
  isMain: true,
};

// ============================================
// NOTIFICATION NAVIGATION CONFIG
// ============================================

/**
 * Notification Navigation Configuration
 *
 * isMainLanding: false - Not the site landing, just a subpage
 * icon: bell symbol
 * color: cobalt - System (Suite 5)
 * order: 1 - Second in sidebar after StratiVERSE
 */
export const notificationNavigation: NavigationConfig = {
  isMainLanding: false,
  icon: '🔔',
  color: 'cobalt',
  label: 'Notifications',
  order: 1,
  pages: [notificationLandingPage],
};

// ============================================
// MUXONOMIC CONFIGURATION
// ============================================

export const notificationMuxonomic: MuxonomicConfig<'notification'> = {
  conceptName: 'notification',

  filterKeys: [
    'notifications', // Local notifications don't sync to server
    'maxVisible', // Local config
    'defaultDuration', // Local config
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: ['notifications', 'maxVisible', 'defaultDuration'],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'notificationAddNotification',
        type: 'Notification Add Notification',
        filePath: 'qualities/addNotification.quality.ts',
        location: DeploymentTarget.All,
        diameter: false,
      },
      {
        name: 'notificationClearNotification',
        type: 'Notification Clear Notification',
        filePath: 'qualities/clearNotification.quality.ts',
        location: DeploymentTarget.All,
        diameter: false,
      },
      {
        name: 'notificationHelloWorld',
        type: 'Notification Hello World',
        filePath: 'qualities/helloWorld.quality.huirth.diameter.ts',
        location: DeploymentTarget.Huirth,
        diameter: true,
      },
    ],
    strategies: [],
    principles: [
      {
        name: 'notificationDisplayPrinciple',
        filePath: 'principles/notificationDisplay.principle.client.ts',
        location: DeploymentTarget.Client,
      },
      {
        name: 'notificationBroadcastPrinciple',
        filePath: 'principles/notificationBroadcast.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: 'NotificationHuirthDeck',
    client: 'NotificationClientDeck',
  },

  navigation: notificationNavigation,

  // M1-P1 · Explicit Diameter junction registration (per Pattern AESR · CNDR).
  // Makes the server→client routing of notificationHelloWorld declarative
  // alongside the implicit FNDR encoding in qualities/helloWorld.quality.huirth.diameter.ts.
  actionExchange: {
    serverToClient: [
      {
        qualityName: 'notificationHelloWorld',
        actionType: 'Notification Hello World',
        direction: ExchangeDirection.ServerToClient,
        // self-routing — receiver is the client-side notification concept
      },
    ],
    clientToServer: [],
  },
};
