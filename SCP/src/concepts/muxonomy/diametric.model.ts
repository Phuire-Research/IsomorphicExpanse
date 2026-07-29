/**
 * Diametric Model - Type-Safe Demometric Quality Pattern
 *
 * Provides helpers for creating TYPE-IDENTICAL Induction qualities
 * that share a Diameter (type signature) with their Real counterparts.
 *
 * Terminology:
 * - Diameter: Similarities (shared type signature, behavior contract)
 * - Diametric: Pertaining to similarities (the pattern of sharing)
 * - Demometer: Different measure (Client and Huirth are different Demometers)
 * - Demometric: Demometers sharing a Diameter - different locations, same concept
 * - Induction: A similarity that moves to the Real Location
 *
 * The Pattern:
 * - Same Property Key in concept definition
 * - Same Type String (Verbose Split)
 * - Same Explicit Typing (Quality<State, Payload, Deck>)
 * - Different Quality Instance (Real vs Induction)
 *
 * Citation: POC-2-5-DEMOMETRIC-QUALITY-WORKGAMEBOARD.md
 * Citation: SCP - Suite Cascade Protocol (historical exploratory expansion: ICP - Interstellar Crystalized Protocol)
 */

import {
  createQualityCard,
  createQualityCardWithPayload,
  strategyDetermine,
  type Quality,
  type AnyAction,
} from 'stratimux';

/**
 * DiametricState - State constraint for Diametric Induction qualities
 *
 * The opposite Demometer's state must include actionQue for routing.
 * At runtime, actionQue is provided by muxified webSocketClient.
 */
export type DiametricState = {
  actionQue: AnyAction[];
};

/**
 * WithDiametricState - Utility type to add DiametricState to concept state
 *
 * Usage:
 * ```typescript
 * type NotificationDiametricState = WithDiametricState<NotificationState>;
 * // Equivalent to: NotificationState & DiametricState
 * ```
 */
export type WithDiametricState<S extends Record<string, unknown>> = S & DiametricState;

/**
 * createDiametricQuality - No payload variant
 *
 * Creates a TYPE-IDENTICAL Induction quality for the opposite Demometer.
 * The Induction routes actions to actionQue instead of executing locally.
 *
 * The Diameter (similarity) is formed by:
 * - Same type string (Verbose Split)
 * - Same explicit typing (Quality<State, void, Deck>)
 *
 * Usage:
 * ```typescript
 * // In notification.concept.huirth.ts (opposite Demometer)
 * const notificationHelloWorldInduction = createDiametricQuality<
 *   WithDiametricState<NotificationState>,
 *   NotificationModelDeck
 * >('Notification Hello World');
 *
 * export const notificationHuirthQualities = {
 *   notificationHelloWorld: notificationHelloWorldInduction,  // Same KEY
 * };
 * ```
 *
 * @param type - Quality action type (Verbose Split - MUST match Real Quality)
 */
export function createDiametricQuality<State extends DiametricState, Deck = void>(
  type: string,
): Quality<State, void, Deck> {
  return createQualityCard<State, Deck>({
    type,
    reducer: (state, action) => {
      const actionToQueue = action.strategy ? action : strategyDetermine(action);
      return {
        actionQue: [...state.actionQue, actionToQueue],
      } as Partial<State>;
    },
  });
}

/**
 * createDiametricQualityWithPayload - With payload variant
 *
 * Creates a TYPE-IDENTICAL Induction quality with payload for the opposite Demometer.
 * The Induction routes actions (with payload preserved) to actionQue.
 *
 * The Diameter (similarity) is formed by:
 * - Same type string (Verbose Split)
 * - Same explicit typing (Quality<State, Payload, Deck>)
 *
 * Usage:
 * ```typescript
 * // In strativerse.concept.client.ts (opposite Demometer)
 * const strativerseScanConceptsInduction = createDiametricQualityWithPayload<
 *   WithDiametricState<StrativerseState>,
 *   StrativerseScanConceptsPayload,
 *   StrativerseModelDeck
 * >('Strativerse Scan Concepts');
 *
 * export const strativerseClientQualities = {
 *   strativerseScanConcepts: strativerseScanConceptsInduction,  // Same KEY
 * };
 * ```
 *
 * @param type - Quality action type (Verbose Split - MUST match Real Quality)
 */
export function createDiametricQualityWithPayload<
  State extends DiametricState,
  Payload extends Record<string, unknown>,
  Deck = void,
>(type: string): Quality<State, Payload, Deck> {
  return createQualityCardWithPayload<State, Payload, Deck>({
    type,
    reducer: (state, action) => {
      const actionToQueue = action.strategy ? action : strategyDetermine(action);
      return {
        actionQue: [...state.actionQue, actionToQueue],
      } as Partial<State>;
    },
  });
}
