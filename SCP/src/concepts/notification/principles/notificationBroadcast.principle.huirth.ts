/**
 * notificationBroadcast Principle - Huirth Deployment
 *
 * Huirth-side principle that broadcasts notifications to all connected clients.
 * When notifications are added to the Huirth queue, broadcasts via WebSocket
 * and then clears the queue (Zero Knowledge Handoff to clients).
 *
 * Zero Knowledge Handoff Pattern (Server → Clients):
 * 1. HelloWorld quality adds notification to Huirth's notifications array
 * 2. This principle observes the change
 * 3. Broadcasts notificationAddNotification action to all connected clients
 * 4. Dispatches clearNotification for each → Huirth has zero knowledge
 * 5. Clients receive action → Their notification concept handles it
 * 6. Client's display principle does handoff → Vue takes ownership
 *
 * Demometer Pattern:
 * - Sends notificationAddNotification action to each client
 * - Client's notification concept handles it naturally
 * - Same quality type string works on both sides
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Suite 4 Viridian
 * Citation: POC-2-6-FORWARD-PASS-SUITE-7.md - Global Broadcast Fix
 * Citation: NOTIFICATION-HANDOFF-SEPARATION-ROADMAP.md
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import type { NotificationState, NotificationQualities } from '../notification.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import type { WebSocketClientConnection } from '../../webSocketServer/model/webSocketClient.model';

export type NotificationBroadcastDeck = MuxiumDeck & {
  notification: Concept<NotificationState, NotificationQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type NotificationBroadcastPrinciple = PrincipleFunction<
  NotificationQualities,
  NotificationBroadcastDeck,
  NotificationState
>;

export const notificationBroadcastPrinciple: NotificationBroadcastPrinciple = ({ plan, k_ }) => {
  console.log('[Notification Broadcast] Principle started (Zero Knowledge Handoff)');

  const broadcastPlan = plan('Notification Broadcast (Huirth)', ({ stage }) => [
    stage(
      ({ concepts, k, d, dispatch }) => {
        const state = k.getState(concepts) as NotificationState;
        const notifications = state.notifications;

        // No notifications to broadcast
        if (notifications.length === 0) {
          return;
        }

        const wsState = d.webSocketServer.k.getState(concepts) as WebSocketServerState;
        const clients: WebSocketClientConnection[] = wsState?.webSocketClients || [];

        if (clients.length === 0) {
          console.log('[Notification Broadcast] No clients connected, clearing local queue');
          // Still clear even with no clients (Zero Knowledge - don't hold onto notifications)
          for (const notification of notifications) {
            dispatch(d.notification.e.notificationClearNotification({ id: notification.id }), {});
          }
          return;
        }

        console.log(
          `[Notification Broadcast] Broadcasting ${notifications.length} notifications to ${clients.length} clients`,
        );

        let broadcastCount = 0;

        // Send notificationAddNotification action for each notification to each client
        // This uses the Demometer pattern - same quality type string works on both sides
        for (const notification of notifications) {
          const addAction = d.notification.e.notificationAddNotification({
            message: notification.message,
            notificationPriority: notification.priority,
            duration: notification.duration,
            closeOnly: notification.closeOnly,
            notificationOrigin: 'global', // Mark as global origin for UI differentiation
          });

          clients.forEach((client) => {
            try {
              client.ws.send(JSON.stringify(addAction));
              broadcastCount++;
            } catch (error) {
              console.error(
                `[Notification Broadcast] Failed to send to ${client.connectionId}:`,
                error,
              );
            }
          });
        }

        console.log(
          `[Notification Broadcast] Sent ${broadcastCount} actions to ${clients.length} clients`,
        );

        // CLEAR: Huirth relinquishes ownership (Zero Knowledge)
        // Dispatch clearNotification for each to remove from Huirth state
        for (const notification of notifications) {
          dispatch(d.notification.e.notificationClearNotification({ id: notification.id }), {});
        }
      },
      {
        selectors: [k_.notifications],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[Notification Broadcast] Principle cleanup');
    broadcastPlan.conclude();
  };
};
