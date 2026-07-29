/**
 * Notification Concept - Client Deployment
 *
 * Client-side notification concept with display principle.
 * Watches notification state and displays via Vue controller.
 *
 * ============================================
 * MUXONOMY SELF-DOCUMENTATION
 * ============================================
 *
 * Concept: notification
 * Deployment: Client (with Huirth counterpart)
 * Muxonomy Source: notification.muxonomy.ts
 *
 * DEMOMETRIC QUALITIES:
 * ┌────────────────────────────┬────────────┬──────────┬───────────────────────────────┐
 * │ Quality                    │ Location   │ Diameter │ Pattern                       │
 * ├────────────────────────────┼────────────┼──────────┼───────────────────────────────┤
 * │ notificationAddNotification│ All        │ false    │ Real on both sides            │
 * │ notificationClearNotification│ All      │ false    │ Real on both sides            │
 * │ notificationHelloWorld     │ Huirth     │ true     │ Client=Induction, Huirth=Real │
 * └────────────────────────────┴────────────┴──────────┴───────────────────────────────┘
 *
 * PRINCIPLES:
 * ┌──────────────────────────────────┬────────┬─────────────────────────────────────────┐
 * │ Principle                        │ Deploy │ Responsibility                          │
 * ├──────────────────────────────────┼────────┼─────────────────────────────────────────┤
 * │ notificationDisplayPrinciple     │ Client │ Zero Knowledge Handoff to Vue controller│
 * │ notificationBroadcastPrinciple   │ Huirth │ Broadcast to all clients via WebSocket  │
 * └──────────────────────────────────┴────────┴─────────────────────────────────────────┘
 *
 * ZERO KNOWLEDGE HANDOFF PATTERN:
 * 1. Stratimux holds notifications array (pending handoff)
 * 2. Display principle observes change via KeyedSelector
 * 3. Principle calls controller.take(notifications)
 * 4. Vue takes ownership, sets expiration timers
 * 5. Principle dispatches clearNotification for each
 * 6. Stratimux array now empty (zero knowledge)
 * 7. User dismisses/timer expires → Vue clears from activeNotifications
 * 8. Page navigation → New controller → Empty Stratimux → No stacking
 *
 * DEMOMETER PATTERN (HelloWorld Example):
 * - Button dispatches d.notification.e.notificationHelloWorld()
 * - Same dispatch regardless of where quality lives
 * - On Client (Induction): Routes to Huirth via WebSocket actionQue
 * - On Huirth (Real): Executes locally, broadcasts to all clients
 * - User experience differs (local vs global) but API unchanged
 *
 * STATE FILTER KEYS (not synced to server):
 * - notifications (local only, handoff to Vue)
 * - maxVisible (local config)
 * - defaultDuration (local config)
 *
 * Future Expansion: This Muxonomy documentation will be extended as the
 * notification concept evolves with additional qualities and patterns.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Citation: NOTIFICATION-HANDOFF-SEPARATION-ROADMAP.md
 * Citation: STRATIMUX-REFERENCE.md - "🎯 Essential Principles"
 */
import { createConcept, type AnyConcept } from 'stratimux';
import type { MuxonomicConcept } from '../muxonomy/muxonomy.model';
import {
  notificationName,
  type NotificationState,
  type NotificationQualities,
  type NotificationModelDeck,
  type NotificationHelloWorldPayload,
} from './notification.type';
import { createNotificationState } from './notification.state';
import { notificationMuxonomic } from './notification.muxonomy';
import { notificationAddNotification } from './qualities/addNotification.quality';
import { notificationClearNotification } from './qualities/clearNotification.quality';
import { notificationDisplayPrinciple } from './principles/notificationDisplay.principle.client';
import {
  createDiametricQualityWithPayload,
  type WithDiametricState,
} from '../muxonomy/diametric.model';

/**
 * Induction Quality - Routes HelloWorld to Huirth via WebSocket
 *
 * Demometric Pattern:
 * - Client has Induction (routes to actionQue with payload preserved)
 * - Huirth has Real (helloWorld.quality.huirth.diameter.ts)
 * - Same type string: 'Notification Hello World'
 * - Same payload contract: NotificationHelloWorldPayload (all fields optional)
 *
 * CRITICAL (CISV invariant): Variable MUST have 'Induction' suffix for toReal
 * to work. Pattern: const ${qualityName}Induction = createDiametricQuality...
 * Without suffix, toReal transformation fails (causes infinite action loop).
 *
 * GENERALIZED (Phase 3 Cobalt-C 2026-05-19): Upgraded from createDiametricQuality
 * (void payload) to createDiametricQualityWithPayload<..., NotificationHelloWorldPayload, ...>.
 * The action with payload is preserved through strategyDetermine into actionQue and
 * crosses the WebSocket boundary intact to the Huirth Real Quality.
 *
 * Citation: diametric.model.ts - createDiametricQualityWithPayload
 * Citation: SUITE-4-VIRIDIAN §7 Generalization Path.
 */
const notificationHelloWorldInduction = createDiametricQualityWithPayload<
  WithDiametricState<NotificationState>,
  NotificationHelloWorldPayload,
  NotificationModelDeck
>('Notification Hello World');

// ============================================
// QUALITIES REGISTRATION
// ============================================

/**
 * Client Qualities - Uses Induction for HelloWorld
 *
 * notificationHelloWorld routes to Huirth for Real execution.
 * webSocketClient.principle monitors actionQue and sends via WebSocket.
 */
export const notificationQualities = {
  notificationAddNotification,
  notificationClearNotification,
  notificationHelloWorld: notificationHelloWorldInduction,
};

// ============================================
// CLIENT CONCEPT CREATOR (with Display Principle)
// ============================================

export const createNotificationConcept = () =>
  createConcept(notificationName, createNotificationState(), notificationQualities, [
    notificationDisplayPrinciple,
  ]);

// ============================================
// MUXONOMIC CONCEPT CREATOR (CLIENT)
// ============================================

/**
 * createMuxonomicNotification - Create MuxonomicConcept for Notification (CLIENT)
 *
 * Returns the union pairing of AnyConcept + MuxonomicConfig for use with
 * client-side Muxium creation. Includes display principle for local notifications.
 *
 * Citation: muxonomy.model.ts - MuxonomicConcept pattern
 */
export function createMuxonomicNotification(): MuxonomicConcept<'notification'> {
  return {
    concept: createNotificationConcept() as AnyConcept,
    muxonomy: notificationMuxonomic,
  };
}

// ============================================
// RE-EXPORTS
// ============================================

export type { NotificationState, NotificationQualities };
export { notificationName };

// Bridge model functions for muxiumTimeOut integration
export {
  notifyLocal,
  notify,
  type BridgeNotificationPayload,
  type NotificationClientDeck,
} from './model/notificationBridge.model';
