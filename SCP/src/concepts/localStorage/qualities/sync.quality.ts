import {
  createQualityCardWithPayload,
  selectPayload,
  createMethodWithState,
  strategySuccess,
  muxiumConclude,
} from 'stratimux';
import type { LocalStorageState, LocalStorageSyncPayload } from '../localStorage.model';

export const localStorageSync = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageSyncPayload
>({
  type: 'Local Storage Sync',
  reducer: (state, action) => {
    const { changes } = selectPayload<LocalStorageSyncPayload>(action);

    return {
      lastSyncTimestamp: Date.now(),
      pendingSync: changes,
    };
  },
  methodCreator: () =>
    createMethodWithState<LocalStorageState, LocalStorageSyncPayload>(({ action, state, deck }) => {
      const { changes } = selectPayload<LocalStorageSyncPayload>(action);

      console.log(`Syncing ${changes.length} KeyedSelector changes to localStorage`);

      // Filter changes to only include selectors configured for synchronization
      const syncedChanges = changes.filter((selectorKey) => state.syncedSelectors[selectorKey]);
      let finalAction;
      if (action.strategy) {
        finalAction = strategySuccess(action.strategy);
      } else {
        finalAction = muxiumConclude();
      }
      if (syncedChanges.length === 0) {
        console.log('No synced selectors in change list');
        return finalAction;
      }

      // For each synced change, log the operation
      // In Phase 2, this will be implemented with actual KeyedSelector monitoring
      syncedChanges.forEach((selectorKey) => {
        const selectorConfig = state.syncedSelectors[selectorKey];

        if (selectorConfig) {
          // TODO: Implement actual value retrieval and storage
          console.log(
            `Would sync selector "${selectorKey}" with encryption: ${selectorConfig.encrypted}`,
          );
        }
      });

      return finalAction; // Continue the flow
    }),
});
