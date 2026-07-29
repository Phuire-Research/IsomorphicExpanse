/**
 * Notification Concept State Creators
 *
 * Unified state factory for both Client and Huirth contexts.
 * The same state structure is used on both - the difference is in principles.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md - "🧠 Strategic State Management"
 */
import {
  type NotificationState,
  DEFAULT_NOTIFICATION_DURATION,
  DEFAULT_MAX_VISIBLE,
} from './notification.type';

// ============================================
// UNIFIED STATE CREATOR
// ============================================

export function createNotificationState(): NotificationState {
  return {
    notifications: [],
    maxVisible: DEFAULT_MAX_VISIBLE,
    defaultDuration: DEFAULT_NOTIFICATION_DURATION,
  };
}

// ============================================
// FILTER KEYS
// ============================================

export const NOTIFICATION_FILTER_KEYS: string[] = [
  'notifications', // Local notifications don't sync to server
  'maxVisible', // Local config
  'defaultDuration', // Local config
];
