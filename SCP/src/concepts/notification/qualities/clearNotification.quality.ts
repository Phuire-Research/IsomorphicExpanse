/**
 * clearNotification Quality - All Deployment
 *
 * Removes a notification from the queue by ID. Pure reducer - no method.
 * Works on both Client and Huirth deployments.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Phase 2.2
 * Citation: STRATIMUX-REFERENCE.md - "🧩 Quality Creation Patterns"
 *
 * Type: 'Notification Clear Notification' (Verbose Split)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  NotificationState,
  NotificationModelDeck,
  ClearNotificationPayload,
} from '../notification.type';
import { removeNotificationById } from '../model/notification.model';

export const notificationClearNotification = createQualityCardWithPayload<
  NotificationState,
  ClearNotificationPayload,
  NotificationModelDeck
>({
  type: 'Notification Clear Notification',
  reducer: (state, action) => {
    return {
      notifications: removeNotificationById(state.notifications, action.payload.id),
    };
  },
  methodCreator: defaultMethodCreator,
});

export type { ClearNotificationPayload };
