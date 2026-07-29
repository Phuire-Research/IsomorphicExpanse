/**
 * Notification Bridge Model - muxiumTimeOut Integration
 *
 * Provides helper functions for dispatching notifications from within qualities
 * using the muxiumTimeOut pattern for deferred execution.
 *
 * TWO VARIANTS:
 * 1. notifyLocal - Client variant for local notifications
 * 2. notifyClient - Huirth variant with clientStateKey routing via WebSocket
 *
 * Citation: STRATIMUX-REFERENCE.md "🕐 Strategy Temporal Expansion Pattern"
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 *
 * Usage Pattern:
 * ```typescript
 * methodCreator: () => createMethodWithConcepts(({ action, concepts_, deck }) => {
 *   // Dispatch notification after 30ms
 *   notifyLocal(concepts_, deck, {
 *     message: 'Operation completed',
 *     priority: 'viridian'
 *   });
 *
 *   // For Huirth with client routing:
 *   const clientStateKey = action.strategy?.data?.clientStateKey;
 *   if (clientStateKey) {
 *     notifyClient(concepts_, deck, {
 *       message: 'Server processed request',
 *       priority: 'cobalt'
 *     }, clientStateKey);
 *   }
 *
 *   return strategySuccess(action.strategy);
 * })
 * ```
 */
import { muxiumTimeOut, type Concepts, type Action } from 'stratimux';
import type { AddNotificationPayload, NotificationPriority } from '../notification.type';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Simplified notification payload for bridge functions
 */
export type BridgeNotificationPayload = {
  message: string;
  priority?: NotificationPriority;
  duration?: number;
  closeOnly?: boolean;
};

/**
 * Deck interface for Client-side notification dispatch
 * Requires notification concept with addNotification quality
 */
export type NotificationClientDeck = {
  notification: {
    e: {
      notificationAddNotification: (payload: AddNotificationPayload) => Action;
    };
  };
};

/**
 * Deck interface for Huirth-side notification dispatch with WebSocket routing
 * Requires both notification and webSocketServer concepts
 */
export type NotificationHuirthDeck = {
  notification: {
    e: {
      notificationAddNotification: (payload: AddNotificationPayload) => Action;
    };
  };
  webSocketServer: {
    e: {
      webSocketServerAppendToActionQue: (payload: {
        actionQue: Action[];
        targetClientStateKey?: string;
        targetConnectionId?: string;
      }) => Action;
    };
  };
};

// ============================================
// CLIENT VARIANT: LOCAL NOTIFICATION
// ============================================

/**
 * notifyLocal - Dispatch a local notification on Client
 *
 * Uses muxiumTimeOut to defer notification dispatch, allowing the current
 * action to complete before the notification appears.
 *
 * @param concepts_ - Concepts from createMethodWithConcepts
 * @param deck - Deck with notification concept access
 * @param payload - Notification content
 * @param timeout - Delay in ms before dispatch (default: 30)
 *
 * Citation: STRATIMUX-REFERENCE.md "Strategy Temporal Expansion Pattern"
 */
export function notifyLocal(
  concepts_: Concepts,
  deck: NotificationClientDeck,
  payload: BridgeNotificationPayload,
  timeout: number = 30,
): void {
  const notificationPayload: AddNotificationPayload = {
    message: payload.message,
    notificationPriority: payload.priority ?? 'cobalt',
    duration: payload.duration,
    closeOnly: payload.closeOnly,
    notificationOrigin: 'local',
  };

  muxiumTimeOut(
    concepts_,
    () => deck.notification.e.notificationAddNotification(notificationPayload),
    timeout,
  );
}

// ============================================
// HUIRTH VARIANT: ROUTED CLIENT NOTIFICATION
// ============================================

/**
 * notifyClient - Dispatch a notification to a specific client from Huirth
 *
 * Routes the notification through WebSocket server's action queue to the
 * client identified by clientStateKey. This enables Huirth-side qualities
 * to send targeted notifications back to the triggering client.
 *
 * A→B→Y→Z Manifold Pattern:
 * - Client (A) dispatches action via Induction
 * - WebSocket Server (B) adds clientStateKey to strategy.data
 * - Huirth quality (Y) processes and calls notifyClient
 * - WebSocket routes notification back to Client (Z)
 *
 * @param concepts_ - Concepts from createMethodWithConcepts
 * @param deck - Deck with notification and webSocketServer access
 * @param payload - Notification content
 * @param clientStateKey - Client session key for routing
 * @param timeout - Delay in ms before dispatch (default: 30)
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Card 1
 * Citation: appendActionQue.quality.ts - Routing modes
 */
export function notifyClient(
  concepts_: Concepts,
  deck: NotificationHuirthDeck,
  payload: BridgeNotificationPayload,
  clientStateKey: string,
  timeout: number = 30,
): void {
  const notificationPayload: AddNotificationPayload = {
    message: payload.message,
    notificationPriority: payload.priority ?? 'cobalt',
    duration: payload.duration,
    closeOnly: payload.closeOnly,
    notificationOrigin: 'global',
  };

  // Create the notification action
  const notificationAction = deck.notification.e.notificationAddNotification(notificationPayload);

  // Route via WebSocket server action queue with clientStateKey targeting
  muxiumTimeOut(
    concepts_,
    () =>
      deck.webSocketServer.e.webSocketServerAppendToActionQue({
        actionQue: [notificationAction],
        targetClientStateKey: clientStateKey,
      }),
    timeout,
  );
}

// ============================================
// HUIRTH VARIANT: BROADCAST NOTIFICATION
// ============================================

/**
 * notifyAllClients - Broadcast a notification to ALL connected clients from Huirth
 *
 * Routes the notification through WebSocket server's action queue without
 * any targeting, broadcasting to all connected clients.
 *
 * @param concepts_ - Concepts from createMethodWithConcepts
 * @param deck - Deck with notification and webSocketServer access
 * @param payload - Notification content
 * @param timeout - Delay in ms before dispatch (default: 30)
 *
 * Citation: appendActionQue.quality.ts - Global broadcast mode
 */
export function notifyAllClients(
  concepts_: Concepts,
  deck: NotificationHuirthDeck,
  payload: BridgeNotificationPayload,
  timeout: number = 30,
): void {
  const notificationPayload: AddNotificationPayload = {
    message: payload.message,
    notificationPriority: payload.priority ?? 'cobalt',
    duration: payload.duration,
    closeOnly: payload.closeOnly,
    notificationOrigin: 'global',
  };

  // Create the notification action
  const notificationAction = deck.notification.e.notificationAddNotification(notificationPayload);

  // Route via WebSocket server action queue without targeting (broadcast)
  muxiumTimeOut(
    concepts_,
    () =>
      deck.webSocketServer.e.webSocketServerAppendToActionQue({
        actionQue: [notificationAction],
      }),
    timeout,
  );
}

// ============================================
// CONVENIENCE: PRIORITY-SPECIFIC HELPERS
// ============================================

/**
 * Priority-specific notification helpers for common use cases
 */
export const notify = {
  /**
   * Success notification (viridian/green)
   */
  success: (concepts_: Concepts, deck: NotificationClientDeck, message: string, timeout?: number) =>
    notifyLocal(concepts_, deck, { message, priority: 'viridian' }, timeout),

  /**
   * Warning notification (rust/orange)
   */
  warning: (concepts_: Concepts, deck: NotificationClientDeck, message: string, timeout?: number) =>
    notifyLocal(concepts_, deck, { message, priority: 'rust' }, timeout),

  /**
   * Error notification (maroon/red)
   */
  error: (concepts_: Concepts, deck: NotificationClientDeck, message: string, timeout?: number) =>
    notifyLocal(concepts_, deck, { message, priority: 'maroon' }, timeout),

  /**
   * Info notification (ochre/yellow)
   */
  info: (concepts_: Concepts, deck: NotificationClientDeck, message: string, timeout?: number) =>
    notifyLocal(concepts_, deck, { message, priority: 'ochre' }, timeout),

  /**
   * System notification (cobalt/blue)
   */
  system: (concepts_: Concepts, deck: NotificationClientDeck, message: string, timeout?: number) =>
    notifyLocal(concepts_, deck, { message, priority: 'cobalt' }, timeout),
};
