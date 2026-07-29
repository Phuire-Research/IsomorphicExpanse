/**
 * notificationDisplay Principle - Client Deployment
 *
 * Client-side principle that performs Zero Knowledge Handoff.
 * When Stratimux has notifications, hands off to Vue controller,
 * then clears Stratimux state.
 *
 * Zero Knowledge Handoff Pattern:
 * 1. Stratimux adds notification to its array
 * 2. This principle observes the change (selector triggers)
 * 3. Principle calls controller.take(notifications)
 * 4. Vue takes ownership, sets up expiration timers
 * 5. Principle dispatches clearNotification for each
 * 6. Stratimux array now empty (zero knowledge)
 * 7. Page navigation → New controller → Empty Stratimux → No stacking
 *
 * 3-Tier Architecture Integration:
 * - Tier 2 (IslandWrapper) registers global controller
 * - This principle performs handoff from muxium → controller
 * - Tier 2 (NotificationPopup) watches controller.activeNotifications
 *
 * Responsibility (Simplified - Handoff Only):
 * - Observe notifications array via k_ selectors
 * - Hand off to Vue controller via take()
 * - Clear Stratimux state via clearNotification dispatch
 * - NO expiration handling (Vue controller manages that)
 *
 * k_ Pattern:
 * - k_ = First tier abstraction at principle level
 * - Used in stages via closure for property access
 * - Selectors reference k_.propertyName for stage options
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: NOTIFICATION-HANDOFF-SEPARATION-ROADMAP.md
 * Citation: 3-Tier Application Architecture Discovery
 * Citation: CLAUDE.md "Throttle vs SetStage Stage Options Pattern"
 */
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  NotificationState,
  NotificationQualities,
  NotificationDeck,
} from '../notification.type';
import { getGlobalNotificationController } from '../notificationController';

export type NotificationDisplayPrinciple = PrincipleFunction<
  NotificationQualities,
  MuxiumDeck & NotificationDeck,
  NotificationState
>;

export const notificationDisplayPrinciple: NotificationDisplayPrinciple = ({ d_, k_, plan }) => {
  console.log('[Notification Display] Principle started (Zero Knowledge Handoff)');

  const displayPlan = plan('Notification Display (Client)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        // Access notifications via k_ (principle-level tier)
        const notifications = k_.notifications.select();

        // Get global controller for handoff
        const controller = getGlobalNotificationController();

        // No notifications or no controller - keep monitoring
        if (notifications.length === 0 || !controller) {
          dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
          return;
        }

        // HANDOFF: Vue takes ownership
        console.log(
          '[Notification Display] Handing off',
          notifications.length,
          'notifications to Vue',
        );
        controller.take(notifications);

        // CLEAR: Stratimux relinquishes ownership (Zero Knowledge)
        // Dispatch clearNotification for each to remove from Stratimux state
        for (const notification of notifications) {
          dispatch(d.notification.e.notificationClearNotification({ id: notification.id }), {});
        }

        // Note: Expiration is now handled by Vue controller, not this principle
        // The controller.take() method sets up expiration timers for each notification
      },
      {
        // k_ at principle level, used here via closure
        selectors: [k_.notifications],
        beat: 3, // Required safety for throttle: 0 pattern
      },
    ),
  ]);

  return () => {
    console.log('[Notification Display] Principle cleanup');
    displayPlan.conclude();
  };
};
