import {
  createQualityCardWithPayload,
  selectPayload,
  createMethodWithState,
  strategyBegin,
  createStrategy,
  createActionNode,
  strategySequence,
  strategyPunt,
  strategySuccess,
  createMethodWithConcepts,
  muxiumRegisterTimeOut,
  muxiumTimeOut,
} from 'stratimux';
import type {
  LocalStorageState,
  LocalStorageAddSelectorPayload,
  SyncedConfig,
  LocalStorageDeck,
} from '../localStorage.model';

export const localStorageAddSelectorForSync = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageAddSelectorPayload,
  LocalStorageDeck
>({
  type: 'Local Storage Add Selector For Sync',
  reducer: (state, action) => {
    console.log('CHECK NEW');
    const { keyedSelector, encrypted = false } =
      selectPayload<LocalStorageAddSelectorPayload>(action);
    const selectorKey = keyedSelector.keys; // Use keys property from KeyedSelector

    console.log(
      '[SET] 📝 localStorage: Adding selector for sync:',
      selectorKey,
      'encrypted:',
      encrypted,
    );
    console.log('[SET] 📝 localStorage: KeyedSelector object:', keyedSelector);
    console.log('[SET] 📝 localStorage: Current mappedStorage before update:', state.mappedStorage);
    console.log(
      '[SET] 📝 localStorage: Current mappedStorage client.count entry:',
      state.mappedStorage['client.count'],
    );

    // Check if already synced
    if (action.payload.keyedSelector._selector === undefined) {
      console.log('⚠️ localStorage: Bad Selector!', action.payload.keyedSelector);
      return {};
    }
    if (state.syncedSelectors[selectorKey]) {
      console.log('[SET] ⚠️ localStorage: Selector already synced:', selectorKey);
      console.log(
        '[SET] ⚠️ localStorage: Existing encryption setting:',
        state.syncedSelectors[selectorKey].encrypted,
      );
      console.log('[SET] ⚠️ localStorage: New encryption setting:', encrypted);

      // Check if encryption setting has changed
      if (state.syncedSelectors[selectorKey].encrypted !== encrypted) {
        console.log('[SET] 🔄 localStorage: Encryption setting changed, updating selector');
        // Continue to update the selector with new encryption setting
      } else {
        return {};
      }
    }

    const timestamp = Date.now();
    const storageKey = selectorKey;

    console.log('🔍 localStorage DEBUG: Before storing - keyedSelector functions check:');
    console.log(' 🔍 localStorage - hasSelect:', !!keyedSelector.select);
    console.log(' 🔍 localStorage - has_selector:', !!keyedSelector._selector);
    console.log(' 🔍 localStorage - keyedSelector object:', keyedSelector);

    const selectorConfig = {
      key: selectorKey,
      selector: keyedSelector,
      encrypted,
      lastUpdated: timestamp,
      storageKey,
    };

    console.log('🔍 localStorage DEBUG: selectorConfig created:', selectorConfig);
    console.log(' 🔍 localStorage - selectorConfig.selector functions check:');
    console.log(' 🔍 localStorage - hasSelect:', !!selectorConfig.selector.select);
    console.log(' 🔍 localStorage - has_selector:', !!selectorConfig.selector._selector);

    // Always update mappedStorage with current encryption setting
    const updatedState = {
      syncedSelectors: {
        ...state.syncedSelectors,
        [selectorKey]: selectorConfig,
      },
      // Also update mappedStorage (without the selector reference)
      mappedStorage: {
        ...state.mappedStorage,
        [selectorKey]: {
          key: selectorKey,
          encrypted,
          lastUpdated: timestamp,
          storageKey,
          chunkedKeys: [],
        } as SyncedConfig,
      },
    };

    console.log(
      '[SET] 📝 localStorage: Updated mappedStorage entry:',
      updatedState.mappedStorage[selectorKey],
    );

    return updatedState;
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      // After updating state, trigger saveMappedStorage
      console.log('[SESSION] Check action prior to  sequence', action);
      const strategy = createStrategy({
        topic: 'Save mappedStorage after adding selector',
        initialNode: createActionNode(deck.localStorage.e.localStorageSaveMappedStorage()),
      });
      if (action.strategy) {
        const punt = strategySuccess(action.strategy);
        muxiumTimeOut(concepts_, () => punt, 30);
      }
      return strategyBegin(strategy);
    }),
});
