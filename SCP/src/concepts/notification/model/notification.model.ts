/**
 * Notification Model - Helper Functions
 *
 * Utility functions for notification creation, expiration checking,
 * and queue management without quality dispatch.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Discovery 3
 * Citation: stateBroadcast.principle.ts - Depletion loop pattern
 */
import {
  type Notification,
  type NotificationPriority,
  type NotificationOrigin,
  type AddNotificationPayload,
  DEFAULT_NOTIFICATION_DURATION,
} from '../notification.type';

// ============================================
// ID GENERATION
// ============================================

let notificationCounter = 0;

export function generateNotificationId(): string {
  notificationCounter += 1;
  return `notif-${Date.now()}-${notificationCounter}`;
}

// ============================================
// NOTIFICATION FACTORY
// ============================================

export function createNotification(
  payload: AddNotificationPayload,
  origin: NotificationOrigin = 'local',
  defaultDuration: number = DEFAULT_NOTIFICATION_DURATION,
): Notification {
  return {
    id: generateNotificationId(),
    message: payload.message,
    priority: payload.notificationPriority ?? 'cobalt',
    createdAt: Date.now(),
    duration: payload.duration ?? defaultDuration,
    origin: payload.notificationOrigin ?? origin,
    closeOnly: payload.closeOnly ?? false,
  };
}

// ============================================
// EXPIRATION CHECKING
// ============================================

export function isNotificationExpired(notification: Notification): boolean {
  if (notification.closeOnly) {
    return false;
  }
  return Date.now() > notification.createdAt + notification.duration;
}

export function getExpiredNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter(isNotificationExpired);
}

export function getActiveNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => !isNotificationExpired(n));
}

// ============================================
// QUEUE OPERATIONS (For Principle Use)
// ============================================

export function popExpiredNotifications(notifications: Notification[]): {
  remaining: Notification[];
  expired: Notification[];
} {
  const expired: Notification[] = [];
  const remaining: Notification[] = [];

  for (const notification of notifications) {
    if (isNotificationExpired(notification)) {
      expired.push(notification);
    } else {
      remaining.push(notification);
    }
  }

  return { remaining, expired };
}

export function removeNotificationById(notifications: Notification[], id: string): Notification[] {
  return notifications.filter((n) => n.id !== id);
}

// ============================================
// VISIBILITY MANAGEMENT
// ============================================

export function getVisibleNotifications(
  notifications: Notification[],
  maxVisible: number,
): Notification[] {
  return getActiveNotifications(notifications).slice(0, maxVisible);
}

// ============================================
// TIME REMAINING
// ============================================

export function getTimeRemaining(notification: Notification): number {
  if (notification.closeOnly) {
    return Infinity;
  }
  const remaining = notification.createdAt + notification.duration - Date.now();
  return Math.max(0, remaining);
}

export function getNextExpirationTime(notifications: Notification[]): number | null {
  const active = getActiveNotifications(notifications);
  if (active.length === 0) {
    return null;
  }

  let earliest = Infinity;
  for (const notification of active) {
    if (!notification.closeOnly) {
      const expiresAt = notification.createdAt + notification.duration;
      if (expiresAt < earliest) {
        earliest = expiresAt;
      }
    }
  }

  return earliest === Infinity ? null : earliest;
}
