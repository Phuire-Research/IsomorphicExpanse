import {
  createQualityCardWithPayload,
  selectPayload,
  createAsyncMethodWithState,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type { LocalStorageState } from '../localStorage.model';
import { indexedDBRemoveItem } from '../indexeddb.model';

interface RemoveSelectorPayload extends Record<string, unknown> {
  key: string;
}

export const localStorageRemoveSelectorFromSync = createQualityCardWithPayload<
  LocalStorageState,
  RemoveSelectorPayload
>({
  type: 'Local Storage Remove Selector From Sync',
  reducer: (state, action) => {
    const { key } = selectPayload<RemoveSelectorPayload>(action);

    // Check if selector exists
    if (!state.syncedSelectors[key]) {
      return {
        lastError: `Selector ${key} is not being synchronized`,
      };
    }

    // Remove selector from synced list
    const { [key]: removed, ...remainingSyncedSelectors } = state.syncedSelectors;

    return {
      syncedSelectors: remainingSyncedSelectors,
    };
  },
  methodCreator: () =>
    createAsyncMethodWithState<LocalStorageState, RemoveSelectorPayload>(
      ({ action, state, controller }) => {
        const { key } = selectPayload<RemoveSelectorPayload>(action);
        const selectorConfig = state.syncedSelectors[key];

        if (selectorConfig) {
          // Check if this is a chunked entry using mappedStorage
          const mappedConfig = state.mappedStorage[key];
          if (mappedConfig && mappedConfig.chunkedKeys && mappedConfig.chunkedKeys.length > 0) {
            // Remove all chunks
            const removePromises = mappedConfig.chunkedKeys.map((chunkKey) =>
              indexedDBRemoveItem(chunkKey).catch((error) =>
                console.warn(`Failed to remove chunk ${chunkKey} for selector "${key}":`, error),
              ),
            );

            Promise.all(removePromises).then(() => {
              console.log(
                `Removed ${mappedConfig.chunkedKeys.length} chunks for selector "${key}"`,
              );
              if (action.strategy) {
                controller.fire(strategySuccess(action.strategy));
              } else {
                controller.fire(muxiumConclude());
              }
            });
          } else {
            // Remove single entry from IndexedDB
            indexedDBRemoveItem(selectorConfig.storageKey)
              .then(() => {
                console.log(`Removed IndexedDB entry for selector "${key}"`);
                if (action.strategy) {
                  controller.fire(strategySuccess(action.strategy));
                } else {
                  controller.fire(muxiumConclude());
                }
              })
              .catch((error) => {
                console.warn(`Failed to remove IndexedDB entry for selector "${key}":`, error);
                if (action.strategy) {
                  controller.fire(strategySuccess(action.strategy));
                } else {
                  controller.fire(muxiumConclude());
                }
              });
          }
        } else {
          // No selector found
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        }
      },
    ),
});
