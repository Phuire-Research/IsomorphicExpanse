/**
 * Notification Concept Type Definitions
 *
 * Universal notification system that can be muxified into Client or Huirth.
 * Demonstrates clean separation of concerns with Muxonomic architecture.
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md - "🧩 Quality Creation Patterns"
 *
 * Suite Color Coding:
 * - Maroon (1): Critical/Error - Dark Red
 * - Rust (2): Warning - Orange
 * - Ochre (3): Info - Yellow
 * - Viridian (4): Success - Green
 * - Cobalt (5): System - Blue
 * - Amethyst (6): Debug - Purple
 * - Rose (7): Diagnostic - Pink/Fuchsia
 */
import type { Concept, Quality, PrincipleFunction, MuxiumDeck } from 'stratimux';

// ============================================
// NOTIFICATION NAME CONSTANT
// ============================================

export const notificationName = 'notification';

// ============================================
// NOTIFICATION PRIORITY (Suite Color Coding)
// ============================================

export type NotificationPriority =
  | 'maroon' // Suite 1 - Critical/Error (Dark Red)
  | 'rust' // Suite 2 - Warning (Orange)
  | 'ochre' // Suite 3 - Info (Yellow)
  | 'viridian' // Suite 4 - Success (Green)
  | 'cobalt' // Suite 5 - System (Blue)
  | 'amethyst' // Suite 6 - Debug (Purple)
  | 'rose'; // Suite 7 - Diagnostic (Pink/Fuchsia)

// ============================================
// NOTIFICATION ORIGIN
// ============================================

export type NotificationOrigin = 'local' | 'global';

// ============================================
// NOTIFICATION ENTITY
// ============================================

export type Notification = {
  id: string;
  message: string;
  priority: NotificationPriority;
  createdAt: number;
  duration: number;
  origin: NotificationOrigin;
  closeOnly: boolean;
};

// ============================================
// STATE DEFINITIONS (Unified for Both Contexts)
// ============================================

export type NotificationState = {
  notifications: Notification[];
  maxVisible: number;
  defaultDuration: number;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

/**
 * AddNotificationPayload - Prefixed property names
 *
 * TYPESCRIPT STOPGAP: Properties prefixed with 'notification' to avoid
 * collision with Action base type properties. When Stratimux operates
 * with its own type system, these can revert to cleaner names.
 *
 * Citation: Action type collision with 'origin' property
 */
export type AddNotificationPayload = {
  message: string;
  notificationPriority?: NotificationPriority;
  duration?: number;
  closeOnly?: boolean;
  notificationOrigin?: NotificationOrigin;
};

export type ClearNotificationPayload = {
  id: string;
};

/**
 * NotificationHelloWorldPayload - Generalized Hello World message envelope
 *
 * PACP (Payload Anti-Collision Pattern): properties prefixed with `notification`
 * to avoid collision with Stratimux Action base type (which reserves `origin`).
 * Citation: Suite 2 Rust R2 PATTERN 17 — PACP.
 *
 * All fields OPTIONAL — backward-compat preserved. When payload is undefined
 * (legacy `e.notificationHelloWorld()` dispatch) the Real Quality falls back to
 * the canonical Hello World message + viridian priority + 5000ms duration.
 *
 * Doctrinal: "Notification is a Generalized Hello World that can Emit Any Message"
 * (user-author 2026-05-19). This payload type is the contract surface for that
 * generalization. The Diameter type string 'Notification Hello World' is
 * unchanged — only the payload becomes typed where it was previously `void`.
 *
 * Citation: SUITE-4-VIRIDIAN §7 Generalization Path · SUITE-1-MAROON P1 Prune Target.
 */
export type NotificationHelloWorldPayload = {
  notificationMessage?: string;
  notificationPriority?: NotificationPriority;
  notificationDuration?: number;
  notificationOrigin?: NotificationOrigin;
};

// ============================================
// MODEL DECK TYPES
// ============================================

export type NotificationModelDeck = MuxiumDeck & {
  notification: Concept<NotificationState, NotificationQualities>;
};

// ============================================
// QUALITY TYPE DEFINITIONS (Unified)
// ============================================

export type NotificationQualities = {
  notificationAddNotification: Quality<NotificationState, AddNotificationPayload>;
  notificationClearNotification: Quality<NotificationState, ClearNotificationPayload>;
  notificationHelloWorld: Quality<NotificationState, NotificationHelloWorldPayload>;
};

// ============================================
// CONCEPT TYPE DEFINITIONS
// ============================================

export type NotificationConcept = Concept<NotificationState, NotificationQualities>;

// ============================================
// DECK TYPE DEFINITIONS
// ============================================

export type NotificationDeck = {
  notification: NotificationConcept;
};

// ============================================
// PRINCIPLE TYPE DEFINITIONS
// ============================================

export type NotificationPrinciple = PrincipleFunction<
  NotificationQualities,
  MuxiumDeck & NotificationDeck,
  NotificationState
>;

// ============================================
// PRIORITY COLOR MAPPING (CSS Reference)
// ============================================

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  maroon: '#800000', // Suite 1 - Critical
  rust: '#b7410e', // Suite 2 - Warning
  ochre: '#cc7722', // Suite 3 - Info
  viridian: '#40826d', // Suite 4 - Success
  cobalt: '#0047ab', // Suite 5 - System
  amethyst: '#9966cc', // Suite 6 - Debug
  rose: '#ff007f', // Suite 7 - Diagnostic
};

export const DEFAULT_NOTIFICATION_DURATION = 5000;
export const DEFAULT_MAX_VISIBLE = 5;
