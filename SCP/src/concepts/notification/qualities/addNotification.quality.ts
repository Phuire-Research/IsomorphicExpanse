/**
 * addNotification Quality - All Deployment
 *
 * Adds a notification to the queue. Pure reducer - no method.
 * Works on both Client and Huirth deployments.
 *
 * Origin Detection: Determined by window object existence
 * - window exists → Client context → 'local' origin
 * - window undefined → Huirth context → 'global' origin
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Phase 2.1
 * Citation: STRATIMUX-REFERENCE.md - "🧩 Quality Creation Patterns"
 *
 * Type: 'Notification Add Notification' (Verbose Split)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  NotificationState,
  NotificationModelDeck,
  AddNotificationPayload,
  NotificationOrigin,
} from '../notification.type';
import { createNotification } from '../model/notification.model';

function determineOrigin(): NotificationOrigin {
  return typeof window !== 'undefined' ? 'local' : 'global';
}

export const notificationAddNotification = createQualityCardWithPayload<
  NotificationState,
  AddNotificationPayload,
  NotificationModelDeck
>({
  type: 'Notification Add Notification',
  reducer: (state, action) => {
    const origin = action.payload.notificationOrigin ?? determineOrigin();
    const notification = createNotification(action.payload, origin, state.defaultDuration);
    return {
      notifications: [...state.notifications, notification],
    };
  },
  methodCreator: defaultMethodCreator,
});

export type { AddNotificationPayload };
