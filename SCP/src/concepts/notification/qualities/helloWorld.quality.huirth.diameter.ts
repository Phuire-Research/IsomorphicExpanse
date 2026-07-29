/**
 * helloWorld Quality - Huirth Diameter (Generalized — accepts ANY message payload)
 *
 * Hello World notification demonstrating StratiVERSE Diameter system.
 * This quality's deployment target can be toggled via StratiVERSE:
 *
 * - helloWorld.quality.client.diameter.ts → Local notification (Client)
 * - helloWorld.quality.huirth.diameter.ts → Global broadcast (Huirth)
 *
 * The file rename mechanism (POC 2.3b) controls execution context.
 * When on Huirth, the principle broadcasts to all connected clients.
 *
 * ============================================
 * GENERALIZATION (Phase 3 Cobalt-C — 2026-05-19)
 * ============================================
 *
 * "Notification is a Generalized Hello World that can Emit Any Message"
 * (user-author 2026-05-19). The Quality previously hardcoded the message
 * 'Hello World from StratiVERSE!'. Generalized to accept an OPTIONAL
 * NotificationHelloWorldPayload:
 *
 *   { notificationMessage?, notificationPriority?, notificationDuration?, notificationOrigin? }
 *
 * Backward-compat preserved: when payload absent OR fields undefined, defaults
 * to 'Hello World from StratiVERSE!' + viridian priority + 5000ms duration.
 *
 * Diameter contract PRESERVED: type string 'Notification Hello World' is
 * IDENTICAL on both sides. The Client Induction routes the action (with
 * payload) to actionQue via createDiametricQualityWithPayload; the Huirth
 * Real reads the payload via selectPayload and creates the notification.
 *
 * Citation: SUITE-4-VIRIDIAN §7 Generalization Path · SUITE-1-MAROON P1 Prune Target.
 * Citation: SUITE-2-RUST PATTERN 17 PACP (Payload Anti-Collision Prefix).
 *
 * Citation: POC-2-4-NOTIFICATION-BRIDGE-WORKGAMEBOARD.md - Suite 4 Viridian
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 *
 * Type: 'Notification Hello World' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  createMethodWithState,
  selectPayload,
  strategySuccess,
  strategyData_muxifyData,
  muxiumConclude,
} from 'stratimux';
import type {
  NotificationState,
  NotificationModelDeck,
  NotificationOrigin,
  NotificationHelloWorldPayload,
} from '../notification.type';
import { createNotification } from '../model/notification.model';

const DEFAULT_HELLO_WORLD_MESSAGE = 'Hello World from StratiVERSE!';
const DEFAULT_HELLO_WORLD_PRIORITY = 'viridian' as const;
const DEFAULT_HELLO_WORLD_DURATION = 5000;

function determineOrigin(): NotificationOrigin {
  return typeof window !== 'undefined' ? 'local' : 'global';
}

export const notificationHelloWorld = createQualityCardWithPayload<
  NotificationState,
  NotificationHelloWorldPayload,
  NotificationModelDeck
>({
  type: 'Notification Hello World',
  reducer: (state, action) => {
    const payload = (selectPayload<NotificationHelloWorldPayload>(action) ??
      {}) as NotificationHelloWorldPayload;

    const message = payload.notificationMessage ?? DEFAULT_HELLO_WORLD_MESSAGE;
    const priority = payload.notificationPriority ?? DEFAULT_HELLO_WORLD_PRIORITY;
    const duration = payload.notificationDuration ?? DEFAULT_HELLO_WORLD_DURATION;
    const origin: NotificationOrigin = payload.notificationOrigin ?? determineOrigin();

    const notification = createNotification(
      {
        message,
        notificationPriority: priority,
        duration,
        notificationOrigin: origin,
      },
      origin,
      state.defaultDuration,
    );

    console.log(`[Notification] Hello World (${origin}):`, notification.id);

    return {
      notifications: [...state.notifications, notification],
    };
  },
  methodCreator: () =>
    createMethodWithState(({ action }) => {
      const payload = (selectPayload<NotificationHelloWorldPayload>(action) ??
        {}) as NotificationHelloWorldPayload;
      const origin: NotificationOrigin = payload.notificationOrigin ?? determineOrigin();

      console.log(`[Notification] Hello World method executed (${origin})`);

      if (action.strategy) {
        return strategySuccess(
          action.strategy,
          strategyData_muxifyData(action.strategy, {
            helloWorldTriggered: true,
            origin,
            message: payload.notificationMessage ?? DEFAULT_HELLO_WORLD_MESSAGE,
            timestamp: Date.now(),
          }),
        );
      }
      return muxiumConclude();
    }),
});
