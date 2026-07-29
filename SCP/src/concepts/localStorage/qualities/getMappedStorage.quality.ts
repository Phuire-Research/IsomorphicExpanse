import {
  createQualityCard,
  nullReducer,
  strategySuccess,
  muxiumConclude,
  selectState,
  createMethodWithConcepts,
} from 'stratimux';
import type { LocalStorageDeck, LocalStorageState, SyncedConfig } from '../localStorage.model';

export const localStorageGetMappedStorage = createQualityCard<LocalStorageState, LocalStorageDeck>({
  type: 'Local Storage Get Mapped Storage',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      console.log('[LocalStorage] 🔍 getMappedStorage: Starting getMappedStorage action');
      const conceptName = deck.localStorage.k.getName(concepts_) || 'localStorage';
      console.log(
        '[LocalStorage] 🔍 getMappedStorage: Looking for concept with name:',
        conceptName,
      );
      const state = selectState<LocalStorageState>(concepts_, conceptName);

      if (!state) {
        console.error('[LocalStorage] ❌ Cannot get mappedStorage - state not found');
        if (action.strategy) {
          return strategySuccess(action.strategy);
        }
        return muxiumConclude();
      }

      // Use the mappedStorage KeyedSelector keys for storage
      const storageKey = deck.localStorage.k.mappedStorage.keys;
      console.log('[LocalStorage] 🔍 getMappedStorage: Using storage key:', storageKey);

      try {
        // Retrieve unencrypted configuration from browser localStorage
        const storedData = window.localStorage.getItem(storageKey);

        if (!storedData) {
          console.log(
            '[LocalStorage] 📭 getMappedStorage: No mappedStorage configuration found in browser localStorage',
          );
          if (action.strategy) {
            return strategySuccess(action.strategy);
          }
          return muxiumConclude();
        }

        // Parse the stored configuration
        console.log('[LocalStorage] 🔓 getMappedStorage: Found mappedStorage, parsing...');
        const rawMappedStorage = JSON.parse(storedData) as Record<string, any>;

        // Ensure backward compatibility - add chunkedKeys if missing
        const mappedStorage: Record<string, SyncedConfig> = {};
        for (const [key, config] of Object.entries(rawMappedStorage)) {
          mappedStorage[key] = {
            ...config,
            chunkedKeys: config.chunkedKeys || [],
          };
        }

        console.log(
          '[LocalStorage] 📦 getMappedStorage: Loaded mappedStorage from browser localStorage',
        );
        console.log(
          '[LocalStorage] 📦 getMappedStorage: All keys in mappedStorage:',
          Object.keys(mappedStorage),
        );
        console.log(
          '[LocalStorage] 📦 getMappedStorage: Retrieved mappedStorage with',
          Object.keys(mappedStorage).length,
          'entries',
        );

        // Log each entry for debugging
        Object.entries(mappedStorage).forEach(([key, config]) => {
          console.log(`[LocalStorage] 📦 getMappedStorage: Entry ${key}:`, {
            encrypted: config.encrypted,
            storageKey: config.storageKey,
            hasChunks: config.chunkedKeys?.length > 0,
          });
        });

        // Update state with retrieved mappedStorage synchronously
        const setStateAction = deck.localStorage.e.localStorageSetState({
          newState: {
            mappedStorage,
          },
        });

        // Chain the setState with the strategy success
        if (action.strategy) {
          // First execute setState, then signal strategy success
          deck.localStorage.e.localStorageSetState({
            newState: {
              mappedStorage,
            },
          });
          return strategySuccess(action.strategy);
        } else {
          return setStateAction;
        }
      } catch (error) {
        console.error('[LocalStorage] ❌ Failed to get mappedStorage:', error);

        if (action.strategy) {
          return strategySuccess(action.strategy);
        }
        return muxiumConclude();
      }
    }),
});
