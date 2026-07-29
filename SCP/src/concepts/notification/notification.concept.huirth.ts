/**
 * Notification Concept - Huirth Deployment
 *
 * Server-side notification concept with broadcast principle.
 * When notifications are added, broadcasts to all connected clients.
 *
 * Demometric Pattern:
 * - helloWorld Real Quality is on Huirth (huirth.diameter.ts)
 * - Client has Induction Quality (routes to Huirth via WebSocket)
 * - Same property key, different Quality instance
 * - Explicit typing forms the Diameter (similarity)
 *
 * ============================================
 * CRITICAL: Sending Notifications from Qualities
 * ============================================
 *
 * When sending notifications from within qualities (especially in ActionStrategies),
 * use the bridge model helpers with `concepts_` parameter, NOT `controller.fire()`.
 *
 * WHY: The ActionController is single-use scope. Calling controller.fire() closes
 * the connection. If you fire a notification before strategySuccess, the controller
 * is closed and the strategy cannot continue to the next node.
 *
 * CORRECT PATTERN (uses muxiumTimeOut, does NOT close controller):
 * ```typescript
 * createAsyncMethodWithConcepts(({ controller, action, deck, concepts_ }) => {
 *   const huirthDeck = deck as unknown as NotificationHuirthDeck;
 *   notifyClient(concepts_, huirthDeck, { message: 'Success!', priority: 'viridian' }, clientStateKey);
 *   controller.fire(strategySuccess(action.strategy));  // Controller still open!
 * });
 * ```
 *
 * BROKEN PATTERN (closes controller prematurely):
 * ```typescript
 * controller.fire(webSocketDeck.e.webSocketServerAppendToActionQue({...}));  // CLOSES CONTROLLER
 * controller.fire(strategySuccess(action.strategy));  // FAILS - controller closed!
 * ```
 *
 * See: ./model/notificationBridge.model.ts for helper implementations
 * Citation: STRATIMUX-REFERENCE.md "🕐 Strategy Temporal Expansion Pattern"
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: POC-2-5-DEMOMETRIC-QUALITY-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md - "🎯 Essential Principles"
 */
import { createConcept, type AnyConcept } from 'stratimux';
import type { MuxonomicConcept } from '../muxonomy/muxonomy.model';
import {
  notificationName,
  type NotificationState,
  type NotificationQualities,
} from './notification.type';
import { createNotificationState } from './notification.state';
import { notificationMuxonomic } from './notification.muxonomy';
import { notificationAddNotification } from './qualities/addNotification.quality';
import { notificationClearNotification } from './qualities/clearNotification.quality';
import { notificationBroadcastPrinciple } from './principles/notificationBroadcast.principle.huirth';
import { notificationHelloWorld } from './qualities/helloWorld.quality.huirth.diameter';

// ============================================
// QUALITIES REGISTRATION
// ============================================

// Phase 3 Cobalt-C (2026-05-19): Dead `notificationHelloWorldInduction` removed.
// Citation: SUITE-1-MAROON P3/P5 Prune Targets · SUITE-4-VIRIDIAN G2.
// Huirth owns the Real Quality (imported above from helloWorld.quality.huirth.diameter).
// The Client side owns the Induction (notification.concept.ts). The Diameter is
// the shared type string 'Notification Hello World'; redefining the Induction here
// was dead code that confused the Huirth concept-authoring mental model.

/**
 * Huirth Qualities - Uses Real HelloWorld implementation
 *
 * notificationHelloWorld: Real Quality (imported from helloWorld.quality.huirth.diameter.ts)
 * Client has the Induction Quality for this diameter pattern.
 */
export const notificationHuirthQualities = {
  notificationAddNotification,
  notificationClearNotification,
  notificationHelloWorld,
};

// ============================================
// HUIRTH CONCEPT CREATOR (with Broadcast Principle)
// ============================================

export const createNotificationHuirthConcept = () =>
  createConcept(notificationName, createNotificationState(), notificationHuirthQualities, [
    notificationBroadcastPrinciple,
  ]);

// ============================================
// MUXONOMIC CONCEPT CREATOR (HUIRTH)
// ============================================

/**
 * createMuxonomicNotificationHuirth - Create MuxonomicConcept for Notification (HUIRTH)
 *
 * Returns the union pairing of AnyConcept + MuxonomicConfig for use with
 * server-side Muxium creation. Includes broadcast principle for global notifications.
 *
 * Citation: muxonomy.model.ts - MuxonomicConcept pattern
 */
export function createMuxonomicNotificationHuirth(): MuxonomicConcept<'notification'> {
  return {
    concept: createNotificationHuirthConcept() as AnyConcept,
    muxonomy: notificationMuxonomic,
  };
}

// ============================================
// RE-EXPORTS
// ============================================

export type { NotificationState, NotificationQualities };
export { notificationName };

// ============================================
// BRIDGE MODEL HELPERS (muxiumTimeOut Integration)
// ============================================
//
// These helpers dispatch notifications via muxiumTimeOut scheduling,
// which does NOT close the ActionController. Use these instead of
// controller.fire() when sending notifications within ActionStrategies.
//
// - notifyClient(concepts_, deck, payload, clientStateKey) - Route to specific client
// - notifyAllClients(concepts_, deck, payload) - Broadcast to all clients
// - notifyLocal(concepts_, deck, payload) - Local notification (Client-side)
// - notify.success/warning/error/info/system - Priority-specific helpers
//
// See: ./model/notificationBridge.model.ts for full documentation
export {
  notifyClient,
  notifyAllClients,
  notifyLocal,
  notify,
  type BridgeNotificationPayload,
  type NotificationClientDeck,
  type NotificationHuirthDeck,
} from './model/notificationBridge.model';
