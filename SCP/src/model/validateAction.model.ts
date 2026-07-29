/*<$
For the asynchronous graph programming framework Stratimux,
generate validation utilities that will validate and recreate incoming actions using deck action creators,
ensuring type safety and preventing execution of unknown actions across WebSocket boundaries.
Reference: STRATIMUX-REFERENCE.md - 🎯 ActionStrategy Data - Universal Transformer Pattern
$>*/
/*<#*/
import {
  type AnyAction,
  getMuxiumState,
  type Concepts,
  type StratiDECK,
  type AnyConcept,
} from 'stratimux';

/**
 * Validates and recreates an incoming action using the deck's action creators (e parameter)
 * This ensures type safety and prevents execution of unknown actions
 *
 * @param concepts - The concepts to access muxium for BadAction creation
 * @param deck - The concept's deck with e parameter containing action creators
 * @param incomingAction - The action received over WebSocket
 * @returns Recreated action or BadAction if validation fails
 */
export function validateAndRecreateAction(
  concepts: Concepts,
  deck: unknown,
  incomingAction: AnyAction,
): AnyAction {
  const { type, payload, strategy, muxium, semaphore } = incomingAction;
  // Cast deck to access e parameter
  const deckWithActions = deck as StratiDECK<AnyConcept>;
  // Get muxium for BadAction creation
  const muxiumDeck = getMuxiumState(concepts).deck;
  if (!deckWithActions.e) {
    const badAction = muxiumDeck.e.muxiumBadAction({
      badActions: [incomingAction],
    });
    return badAction;
  }

  // Cycle 8 · Salvo B · THE-CASE-DESTROYING-RECONSTRUCTION (confirmed live, not inferred).
  // This rebuilds a deck key from a VERBOSE wire type ('IsomorphicExpanse Set Designation Menu
  // Stage' -> 'isomorphicExpanseSetDesignationMenuStage'). The old index-0 branch lowercased the
  // WHOLE first token, so any concept whose name carries an INTERNAL capital lost it:
  //   'IsomorphicExpanse' -> 'isomorphicexpanse...'  (deck key is 'isomorphicExpanse...')
  // No key matched, the lookup fell through to muxiumBadAction, and EVERY relay action for that
  // concept was silently discarded — no error, no throw, just a menu that never arrives.
  // Single-case concept names ('suite8', 'cadmium', 'gitm') were immune only by coincidence: for
  // them the destructive lowercase was a no-op, which is why the defect stayed dormant.
  // Decapitalize ONLY the leading character — behavior-identical for every single-case name,
  // correct for camelCase ones (isomorphicExpanse, graphiteScribe, testingADomain, webSocketClient).
  const potentialKey = type
    .split(' ')
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');

  let actionCreator;
  if (deckWithActions.e[potentialKey]) {
    actionCreator = deckWithActions.e[potentialKey];
  }
  if (!actionCreator) {
    const keys = Object.keys(deckWithActions.d);
    for (let k of keys) {
      const possible = (deckWithActions.d as any)[k].e[potentialKey];
      if (possible) {
        actionCreator = possible;
        break;
      }
    }

    if (actionCreator === undefined) {
      const badAction = muxiumDeck.e.muxiumBadAction({
        badActions: [incomingAction],
      });
      // Action type not found in this deck - return BadAction
      return badAction;
    }
  }

  // Step 2: Recreate the action using the found creator

  // Step 3: Build action options (excluding expiration which shouldn't cross network boundary)
  const actionOptions: Record<string, unknown> = {};
  if (strategy) {
    actionOptions.strategy = strategy;
  }
  if (muxium) {
    actionOptions.muxium = muxium; // Updated from axium to muxium
  }
  if (semaphore !== undefined) {
    actionOptions.semaphore = semaphore;
  }

  // Step 4: Call the creator with payload or options
  // Check if payload exists (could be undefined, null, or any falsy value that's intentional)
  const hasPayload = 'payload' in incomingAction;

  try {
    if (hasPayload) {
      // Action has payload - pass it as first parameter
      if (Object.keys(actionOptions).length > 0) {
        return actionCreator(payload, actionOptions) as AnyAction;
      }
      return actionCreator(payload) as AnyAction;
    } else if (Object.keys(actionOptions).length > 0) {
      // No payload but has options
      return actionCreator(actionOptions) as AnyAction;
    } else {
      // Simple action with no payload or options
      return actionCreator() as AnyAction;
    }
  } catch (error) {
    const badAction = muxiumDeck.e.muxiumBadAction({
      badActions: [incomingAction],
    });
    return badAction;
  }
}

/**
 * Helper to validate multiple actions at once
 * @param concepts - The concepts to access muxium
 * @param deck - The concept's deck with e parameter
 * @param actions - Array of actions to validate
 * @returns Array of validated actions (may include BadActions)
 */
export function validateActionBatch(
  concepts: Concepts,
  deck: unknown,
  actions: AnyAction[],
): AnyAction[] {
  return actions.map((action) => validateAndRecreateAction(concepts, deck, action));
}

/**
 * Check if an action is a BadAction
 * @param action - The action to check
 * @returns true if the action is a BadAction
 */
export function isBadAction(action: AnyAction): boolean {
  return action?.type?.includes('Bad Action') || false;
}
/*#>*/
