import { createStrategy, createActionNode, selectStratiDECK, type ActionStrategy } from 'stratimux';
import type { LocalStorageDeck, LocalStorageConcept } from '../localStorage.model';
import { localStorageName } from '../localStorage.concept';

/**
 * Creates an initialization strategy that chains:
 * 1. getMappedStorage - Retrieves encrypted configuration
 * 2. synchronizeFromMappedStorage - Loads all stored values
 * 3. localStorageInitialize - Completes setup
 */
export function initializeLocalStorageStrategy<DECK extends LocalStorageDeck>(
  d: unknown,
): ActionStrategy | undefined {
  const deck = selectStratiDECK<LocalStorageConcept>(d, localStorageName);
  if (deck && deck.d.localStorage) {
    const primedNode = createActionNode(deck.e.localStorageIsPrimed({}), {
      successNode: null,
    });
    const synchronizeNode = createActionNode(deck.e.localStorageSynchronizeFromMappedStorage({}), {
      successNode: primedNode,
    });
    const getMappedNode = createActionNode(deck.e.localStorageGetMappedStorage({}), {
      successNode: synchronizeNode,
    });

    return createStrategy({
      topic: 'Initialize localStorage with stored data',
      initialNode: getMappedNode,
    });
  }
  return undefined;
}
