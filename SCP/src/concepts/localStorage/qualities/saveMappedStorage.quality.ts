import {
  createQualityCard,
  nullReducer,
  createMethodWithConcepts,
  strategySuccess,
  strategyFailed,
  muxiumConclude,
  selectState,
} from 'stratimux';
import type { LocalStorageState, LocalStorageDeck } from '../localStorage.model';

export const localStorageSaveMappedStorage = createQualityCard<LocalStorageState, LocalStorageDeck>(
  {
    type: 'Local Storage Save Mapped Storage',
    reducer: nullReducer,
    methodCreator: () =>
      createMethodWithConcepts(({ action, concepts_, deck }) => {
        console.log('[LocalStorage] 💾 saveMappedStorage: Starting');
        const conceptName = deck.localStorage.k.getName(concepts_) || 'localStorage';
        const state = selectState<LocalStorageState>(concepts_, conceptName);

        if (!state) {
          console.error(
            '[LocalStorage] ❌ saveMappedStorage: Cannot save mappedStorage - state not found',
          );
          if (action.strategy) {
            return strategySuccess(action.strategy);
          }
          return muxiumConclude();
        }

        const mappedStorage = state.mappedStorage;

        console.log(
          '[LocalStorage] 💾 saveMappedStorage: Saving mappedStorage to browser localStorage (unencrypted)',
        );
        console.log('[LocalStorage] 💾 Number of entries:', Object.keys(mappedStorage).length);

        // Use the mappedStorage KeyedSelector keys for storage
        // This enables multiple mappedStorage entries per concept
        const storageKey = deck.localStorage.k.mappedStorage.keys;

        console.log(
          '[LocalStorage] 💾 saveMappedStorage: Using KeyedSelector storage key:',
          storageKey,
        );

        try {
          // Store mappedStorage directly without encryption
          const dataToStore = JSON.stringify(mappedStorage);
          window.localStorage.setItem(storageKey, dataToStore);

          console.log(
            '[LocalStorage] ✅ saveMappedStorage: Saved mappedStorage to browser localStorage',
          );
          console.log('[LocalStorage] 💾 Storage key:', storageKey);
          console.log('[LocalStorage] 💾 Data size:', dataToStore.length, 'characters');

          // Log entries for debugging
          Object.entries(mappedStorage).forEach(([key, config]) => {
            console.log(`[LocalStorage] 📦 Entry ${key}:`, {
              encrypted: config.encrypted,
              hasChunks: config.chunkedKeys?.length > 0,
            });
          });

          if (action.strategy) {
            return strategySuccess(action.strategy);
          }
          return muxiumConclude();
        } catch (error) {
          console.error(
            '[LocalStorage] ❌ saveMappedStorage: Failed to save mappedStorage:',
            error,
          );

          if (action.strategy) {
            return strategyFailed(action.strategy);
          }
          return muxiumConclude();
        }
      }),
  },
);
