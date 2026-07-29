import {
  createQualityCardWithPayload,
  selectPayload,
  createAsyncMethodWithState,
  strategySuccess,
  strategyDetermine,
  muxiumConclude,
  nullReducer,
} from 'stratimux';
import type {
  LocalStorageState,
  LocalStorageInitializePayload,
  LocalStorageDeck,
} from '../localStorage.model';
import { indexedDBGetItem } from '../indexeddb.model';

export const localStorageInitialize = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageInitializePayload,
  LocalStorageDeck
>({
  type: 'Local Storage Initialize',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ action, deck, controller }) => {
      console.log('[IndexedDB] 🚀 localStorage initialize: Starting IndexedDB initialization');

      // Initialize IndexedDB by making a simple test call
      // This ensures the database is opened and ready before we proceed
      const testKey = 'stratimux_initialization_test';

      indexedDBGetItem(testKey)
        .then((result) => {
          console.log('[IndexedDB] ✅ IndexedDB initialized successfully');
          console.log(
            '[IndexedDB] 📊 Test read result:',
            result ? 'found test data' : 'no test data',
          );

          // IndexedDB is now initialized and ready
          controller.fire(
            strategyDetermine(deck.localStorage.e.localStorageIsInitialized(), action.strategy),
          );
        })
        .catch((error) => {
          console.error('[IndexedDB] ❌ IndexedDB initialization failed:', error);

          // Even on error, we continue - the app can fall back to memory-only operation
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
