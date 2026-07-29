import {
  createQualityCardWithPayload,
  selectPayload,
  createAsyncMethodWithState,
  nullReducer,
  strategySuccess,
  muxiumConclude,
} from 'stratimux';
import type { LocalStorageState, LocalStorageCleanupPayload } from '../localStorage.model';
import { indexedDBGetAllKeys, indexedDBGetItem, indexedDBRemoveItem } from '../indexeddb.model';

export const localStorageCleanup = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageCleanupPayload
>({
  type: 'Local Storage Cleanup',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState<LocalStorageState, LocalStorageCleanupPayload>(
      ({ action, state, controller }) => {
        const { maxAge = 7 * 24 * 60 * 60 * 1000 } =
          selectPayload<LocalStorageCleanupPayload>(action); // Default 7 days
        const now = Date.now();
        const keysToRemove: string[] = [];

        console.log('Starting IndexedDB cleanup for expired development data...');

        // Get all keys from IndexedDB
        indexedDBGetAllKeys()
          .then((keys) => {
            // Filter for Stratimux development data
            const stratimuxKeys = keys.filter((key) => key.startsWith('stratimux_dev_'));

            // Check each key for expiration
            const checkPromises = stratimuxKeys.map((key) =>
              indexedDBGetItem(key)
                .then((storedValue) => {
                  if (!storedValue) return;

                  try {
                    // Try to parse as JSON to check timestamp
                    const parsedData = JSON.parse(storedValue);

                    if (parsedData && parsedData.development && parsedData.timestamp) {
                      const dataAge = now - parsedData.timestamp;

                      if (dataAge > maxAge) {
                        keysToRemove.push(key);
                        console.log(
                          `Marking expired data for removal: ${key} (age: ${Math.round(
                            dataAge / (24 * 60 * 60 * 1000),
                          )} days)`,
                        );
                      }
                    } else {
                      // Invalid or corrupted data structure
                      keysToRemove.push(key);
                      console.log(`Marking corrupted data for removal: ${key}`);
                    }
                  } catch (error) {
                    // Failed to parse, probably corrupted
                    keysToRemove.push(key);
                    console.log(`Marking unparseable data for removal: ${key}`);
                  }
                })
                .catch((error) => {
                  console.warn(`Failed to check key ${key}:`, error);
                }),
            );

            // Wait for all checks to complete
            return Promise.all(checkPromises);
          })
          .then(() => {
            // Remove expired/corrupted entries
            const removePromises = keysToRemove.map((key) =>
              indexedDBRemoveItem(key)
                .then(() => console.log(`Removed expired/corrupted entry: ${key}`))
                .catch((error) => console.warn(`Failed to remove entry ${key}:`, error)),
            );

            return Promise.all(removePromises);
          })
          .then(() => {
            console.log(`Cleanup completed. Removed ${keysToRemove.length} entries.`);

            if (action.strategy) {
              controller.fire(strategySuccess(action.strategy));
            } else {
              controller.fire(muxiumConclude());
            }
          })
          .catch((error) => {
            console.error('Cleanup failed:', error);

            if (action.strategy) {
              controller.fire(strategySuccess(action.strategy));
            } else {
              controller.fire(muxiumConclude());
            }
          });
      },
    ),
});
