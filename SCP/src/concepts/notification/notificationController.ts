/**
 * Notification Controller Interface
 *
 * Tier 2 (Island Wrapper) creates and provides this controller.
 * Tier 3 (Concept Landings) ClientMuxium principle hooks into it.
 *
 * Pattern: Zero Knowledge Handoff
 * - Stratimux owns notifications until handoff
 * - Vue controller TAKES ownership via take()
 * - Stratimux clears its array after handoff
 * - Vue manages expiration/dismissal independently
 * - Page navigation finds empty Stratimux → nothing to take → no stacking
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: NOTIFICATION-HANDOFF-SEPARATION-ROADMAP.md
 * Citation: 3-Tier Application Architecture Discovery
 */
import { shallowRef, type ShallowRef } from 'vue';
import type { Notification } from './notification.type';

// ============================================
// CONTROLLER KEY (for provide/inject)
// ============================================

export const NOTIFICATION_CONTROLLER_KEY = 'notificationController';

// ============================================
// CONTROLLER TYPE
// ============================================

export type NotificationController = {
  /**
   * Vue-owned notifications (post-handoff)
   * Use shallowRef for performance - replace entire array on change
   */
  activeNotifications: ShallowRef<Notification[]>;

  /**
   * Take ownership from Stratimux (handoff pattern)
   * - Adds notifications to activeNotifications
   * - Sets up expiration timers for each
   * - After take(), Stratimux should clear its array
   *
   * Called by ClientMuxium's notification display principle
   */
  take: (notifications: Notification[]) => void;

  /**
   * Clear notification by ID
   * Called by expiration timer or NotificationPopup dismiss
   * Only affects Vue's activeNotifications (Stratimux has zero knowledge)
   */
  clear: (id: string) => void;

  /**
   * Clear all notifications
   * Utility for testing or reset scenarios
   * Also clears all expiration timers
   */
  clearAll: () => void;

  /**
   * @deprecated Use take() instead for proper handoff pattern
   * Sync entire notifications array from muxium state
   */
  sync: (notifications: Notification[]) => void;
};

// ============================================
// CONTROLLER FACTORY
// ============================================

/**
 * Creates a notification controller instance with Zero Knowledge Handoff
 *
 * Usage in IslandWrapper.vue:
 * ```typescript
 * const controller = createNotificationController();
 * provide(NOTIFICATION_CONTROLLER_KEY, controller);
 * ```
 *
 * Handoff Flow:
 * 1. Stratimux adds notification to its array
 * 2. Display principle observes change
 * 3. Principle calls controller.take(notifications)
 * 4. Vue takes ownership, sets expiration timers
 * 5. Principle dispatches clearNotification for each
 * 6. Stratimux array now empty (zero knowledge)
 * 7. User dismisses or timer expires → Vue clears from activeNotifications
 * 8. Page navigation → New controller → Empty Stratimux → Nothing to take
 */
export function createNotificationController(): NotificationController {
  // Vue-owned notifications (post-handoff)
  const activeNotifications = shallowRef<Notification[]>([]);

  // Track expiration timers for cleanup
  const expirationTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Clear a single notification and its timer
   */
  const clear = (id: string) => {
    // Clear the timer if exists
    const timer = expirationTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      expirationTimers.delete(id);
    }

    // Remove from active notifications
    activeNotifications.value = activeNotifications.value.filter((n) => n.id !== id);
    console.log('[NotificationController] Cleared:', id);
  };

  /**
   * Clear all notifications and timers
   */
  const clearAll = () => {
    // Clear all timers
    expirationTimers.forEach((timer) => clearTimeout(timer));
    expirationTimers.clear();

    // Clear all notifications
    activeNotifications.value = [];
    console.log('[NotificationController] Cleared all');
  };

  /**
   * Take ownership from Stratimux (Zero Knowledge Handoff)
   *
   * Key aspects:
   * - Filters out duplicates (notifications already in activeNotifications)
   * - Sets up expiration timers for non-closeOnly notifications
   * - After this, Stratimux should dispatch clearNotification for each
   */
  const take = (notifications: Notification[]) => {
    if (notifications.length === 0) {
      return;
    }

    // Filter out notifications we already have (by ID)
    const existingIds = new Set(activeNotifications.value.map((n) => n.id));
    const newNotifications = notifications.filter((n) => !existingIds.has(n.id));

    if (newNotifications.length === 0) {
      console.log('[NotificationController] Take: All notifications already active');
      return;
    }

    // Add to active notifications
    activeNotifications.value = [...activeNotifications.value, ...newNotifications];
    console.log(
      '[NotificationController] Took ownership of',
      newNotifications.length,
      'notifications',
    );

    // Set up expiration timers for each notification
    for (const notification of newNotifications) {
      // Skip closeOnly notifications (no auto-expire)
      if (notification.closeOnly) {
        console.log(
          '[NotificationController] Notification',
          notification.id,
          'is closeOnly, no timer',
        );
        continue;
      }

      // Calculate remaining time until expiration
      const now = Date.now();
      const expiresAt = notification.createdAt + notification.duration;
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        // Already expired - clear immediately
        console.log(
          '[NotificationController] Notification',
          notification.id,
          'already expired, clearing',
        );
        // Use setTimeout(0) to allow current operation to complete
        setTimeout(() => clear(notification.id), 0);
      } else {
        // Set timer for remaining duration
        console.log(
          '[NotificationController] Setting expiration timer for',
          notification.id,
          ':',
          remaining,
          'ms',
        );
        const timer = setTimeout(() => {
          console.log('[NotificationController] Timer expired for:', notification.id);
          clear(notification.id);
        }, remaining);
        expirationTimers.set(notification.id, timer);
      }
    }
  };

  return {
    activeNotifications,

    take,

    clear,

    clearAll,

    // Deprecated - kept for backwards compatibility during transition
    sync: (newNotifications: Notification[]) => {
      console.warn('[NotificationController] sync() is deprecated, use take() instead');
      // For backwards compatibility, just replace the array
      activeNotifications.value = [...newNotifications];
    },
  };
}

// ============================================
// TYPE GUARD
// ============================================

export function isNotificationController(obj: unknown): obj is NotificationController {
  if (!obj || typeof obj !== 'object') return false;
  const controller = obj as NotificationController;
  return (
    'activeNotifications' in controller &&
    typeof controller.take === 'function' &&
    typeof controller.clear === 'function' &&
    typeof controller.clearAll === 'function'
  );
}

// ============================================
// GLOBAL CONTROLLER REFERENCE (for Muxium Hook)
// ============================================

/**
 * Global controller reference for ClientMuxium principle to perform handoff
 *
 * Pattern:
 * 1. IslandWrapper creates controller and provides via Vue
 * 2. IslandWrapper also registers globally via setGlobalNotificationController()
 * 3. ClientMuxium's notification display principle accesses via getGlobalNotificationController()
 * 4. Principle calls controller.take(notifications) for handoff
 * 5. Principle dispatches clearNotification for each → Stratimux has zero knowledge
 *
 * This bridges Stratimux muxium context with Vue provide/inject context.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: NOTIFICATION-HANDOFF-SEPARATION-ROADMAP.md
 */
let globalController: NotificationController | null = null;

export function setGlobalNotificationController(controller: NotificationController): void {
  globalController = controller;
  console.log('[NotificationController] Global controller registered');
}

export function getGlobalNotificationController(): NotificationController | null {
  return globalController;
}

export function clearGlobalNotificationController(): void {
  globalController = null;
  console.log('[NotificationController] Global controller cleared');
}
