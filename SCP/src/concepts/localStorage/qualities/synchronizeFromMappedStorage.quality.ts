import {
  createQualityCard,
  nullReducer,
  createAsyncMethodWithState,
  strategySuccess,
  strategyBegin,
  createActionNode,
  createStrategy,
  type ActionStrategy,
  muxiumConclude,
  strategySequence,
} from 'stratimux';
import type { LocalStorageDeck, LocalStorageState } from '../localStorage.model';
import { decryptData, reassembleChunks } from '../localStorage.model';
import { indexedDBGetItem } from '../indexeddb.model';

export const localStorageSynchronizeFromMappedStorage = createQualityCard<
  LocalStorageState,
  LocalStorageDeck
>({
  type: 'Local Storage Synchronize From Mapped Storage',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ action, state, deck, controller }) => {
      const mappedStorage = state.mappedStorage;
      const systemFingerprint = state.systemFingerprint;

      if (!systemFingerprint || !mappedStorage || Object.keys(mappedStorage).length === 0) {
        console.log(
          '[IndexedDB] 🔄 synchronizeFromMappedStorage: No mappedStorage to synchronize',
          {
            hasFingerprint: !!systemFingerprint,
            hasMappedStorage: !!mappedStorage,
            mappedStorageKeys: mappedStorage ? Object.keys(mappedStorage).length : 0,
          },
        );
        if (action.strategy) {
          controller.fire(strategySuccess(action.strategy));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      console.log(
        '[IndexedDB] 🔄 synchronizeFromMappedStorage: Synchronizing',
        Object.keys(mappedStorage).length,
        'entries from mappedStorage',
      );
      console.log(
        '[IndexedDB] 🔄 synchronizeFromMappedStorage: Keys to synchronize:',
        Object.keys(mappedStorage),
      );

      // Create strategy to load all stored items
      let strategy: ActionStrategy = createStrategy({
        topic: 'Synchronize localStorage entries',
        initialNode: createActionNode(deck.muxium.e.muxiumKick()),
      });

      const stateUpdates: Record<string, any> = {};

      // Process all mapped storage entries with promises
      const loadPromises: Promise<void>[] = [];

      for (const [key, config] of Object.entries(mappedStorage)) {
        console.log(
          '[IndexedDB] 🔄 synchronizeFromMappedStorage: Loading',
          key,
          'encrypted:',
          config.encrypted,
          'storageKey:',
          config.storageKey,
        );

        const loadPromise = new Promise<void>((resolve) => {
          try {
            // Check if this is a chunked entry
            // Create promise for retrieving the stored value
            const retrievalPromise: Promise<string | null> =
              config.chunkedKeys && config.chunkedKeys.length > 0
                ? reassembleChunks(config.chunkedKeys).then((result) => {
                    console.log(
                      `[IndexedDB] 📦 synchronizeFromMappedStorage: Loaded chunked data for ${key}, chunks: ${config.chunkedKeys.length}`,
                    );
                    return result;
                  })
                : indexedDBGetItem(config.storageKey);

            retrievalPromise
              .then((storedValue) => {
                if (storedValue) {
                  if (config.encrypted) {
                    // Use real decryption with system fingerprint
                    decryptData(storedValue, systemFingerprint)
                      .then((decryptedString) => {
                        try {
                          const value = JSON.parse(decryptedString);

                          // Extract property name from key (e.g., 'client.count' -> 'count')
                          const keyParts = key.split('.');
                          const propertyName = keyParts[1] || keyParts[0]; // Use second part if available, otherwise use the whole key

                          // Set the value directly on stateUpdates using the property name
                          stateUpdates[propertyName] = value;

                          console.log(
                            '[IndexedDB] ✅ synchronizeFromMappedStorage: Loaded',
                            key,
                            ':',
                            value,
                          );
                        } catch (error) {
                          console.error(
                            '[IndexedDB] ❌ synchronizeFromMappedStorage: JSON parse failed for',
                            key,
                            error,
                          );
                        }
                        resolve();
                      })
                      .catch((decryptError) => {
                        console.error(
                          '[IndexedDB] ❌ synchronizeFromMappedStorage: Decryption failed for',
                          key,
                          decryptError,
                        );
                        resolve(); // Continue even if decryption fails
                      });
                  } else {
                    // Non-encrypted value
                    try {
                      const value = JSON.parse(storedValue);

                      // Extract property name from key (e.g., 'client.count' -> 'count')
                      const keyParts = key.split('.');
                      const propertyName = keyParts[1] || keyParts[0]; // Use second part if available, otherwise use the whole key

                      // Set the value directly on stateUpdates using the property name
                      stateUpdates[propertyName] = value;

                      console.log(
                        '[IndexedDB] ✅ synchronizeFromMappedStorage: Loaded',
                        key,
                        ':',
                        value,
                      );
                    } catch (error) {
                      console.error(
                        '[IndexedDB] ❌ synchronizeFromMappedStorage: JSON parse failed for',
                        key,
                        error,
                      );
                    }
                    resolve();
                  }
                } else {
                  resolve();
                }
              })
              .catch((error) => {
                console.error(
                  '[IndexedDB] ❌ synchronizeFromMappedStorage: Failed to retrieve stored value for',
                  key,
                  error,
                );
                resolve(); // Continue even if retrieval fails
              });
          } catch (error) {
            console.error(
              '[IndexedDB] ❌ synchronizeFromMappedStorage: Failed to load',
              key,
              error,
            );
            resolve();
          }
        });

        loadPromises.push(loadPromise);
      }

      // Wait for all loads to complete then call controller
      Promise.all(loadPromises).then(() => {
        // Create setState action with all accumulated updates
        if (Object.keys(stateUpdates).length > 0) {
          console.log(
            '[IndexedDB] 📝 synchronizeFromMappedStorage: Preparing to set state with updates:',
            stateUpdates,
          );
          const setStateAction = deck.localStorage.e.localStorageSetState({
            newState: stateUpdates,
          });

          strategy = createStrategy({
            topic: 'Synchronized state from localStorage',
            initialNode: createActionNode(setStateAction),
          });
        } else {
          console.log('[IndexedDB] 📝 synchronizeFromMappedStorage: No state updates to apply');
        }

        // Return the strategy or success through controller
        if (action.strategy) {
          controller.fire(
            strategyBegin(
              strategySequence([
                strategy,
                strategySuccess(action.strategy).strategy as ActionStrategy,
              ]) as ActionStrategy,
            ),
          );
        } else {
          controller.fire(strategyBegin(strategy));
        }
      });
    }),
});
