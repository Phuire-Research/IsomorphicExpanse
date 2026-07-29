import {
  createQualityCardWithPayload,
  selectPayload,
  nullReducer,
  strategySuccess,
  strategyFailed,
  createAsyncMethodWithState,
  muxiumConclude,
} from 'stratimux';
import type { LocalStorageState, LocalStorageGetPayload } from '../localStorage.model';
import { decryptData, reassembleChunks } from '../localStorage.model';
import { indexedDBGetItem } from '../indexeddb.model';

export const localStorageGet = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageGetPayload
>({
  type: 'Local Storage Get',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(async ({ action, state, controller }) => {
      const { key, encrypted = false } = selectPayload<LocalStorageGetPayload>(action);

      console.log('[GET] 📖 localStorage: Getting value for key:', key, 'encrypted:', encrypted);

      try {
        // Check if this is a chunked entry
        const config = state.mappedStorage[key];

        // Create promise for retrieval based on whether it's chunked or not
        const retrievalPromise: Promise<string | null> =
          config && config.chunkedKeys && config.chunkedKeys.length > 0
            ? // Chunked retrieval
              (() => {
                console.log('[GET] 📦 localStorage: Retrieving chunked data:', key, {
                  chunks: config.chunkedKeys.length,
                });
                return reassembleChunks(config.chunkedKeys).then((reassembled) => {
                  if (!reassembled) {
                    console.error('[GET] ❌ localStorage: Failed to reassemble chunks for:', key);
                    return null;
                  }
                  console.log('[GET] 🔄 localStorage: Reassembled chunks:', {
                    totalSize: reassembled.length,
                    sizeInMB: ((reassembled.length * 2) / 1024 / 1024).toFixed(2) + 'MB',
                  });
                  return reassembled;
                });
              })()
            : // Normal retrieval
              indexedDBGetItem(key);

        // Handle the retrieval promise
        retrievalPromise
          .then((retrievedData) => {
            if (retrievedData) {
              // Auto-detect if data is encrypted by checking if it's valid JSON
              let isActuallyEncrypted = encrypted;
              if (!encrypted) {
                try {
                  JSON.parse(retrievedData);
                  // If JSON.parse succeeds, it's unencrypted
                  isActuallyEncrypted = false;
                } catch {
                  // If JSON.parse fails, it's likely encrypted
                  isActuallyEncrypted = true;
                }
              }

              // Create promise for the retrieval operation
              const retrievalPromise = isActuallyEncrypted
                ? // Decrypt and parse encrypted data
                  decryptData(retrievedData, state.systemFingerprint)
                    .then((decryptedData) => {
                      const value = JSON.parse(decryptedData);
                      console.log(
                        '[GET] 🔓 localStorage: Successfully retrieved and decrypted value:',
                        key,
                        'value:',
                        value,
                      );
                      return value;
                    })
                    .catch((error) => {
                      console.error('[GET] ❌ localStorage: Failed to decrypt:', key, error);
                      throw error;
                    })
                : // Parse unencrypted data synchronously but wrap in promise
                  new Promise<any>((resolve, reject) => {
                    try {
                      const value = JSON.parse(retrievedData);
                      console.log(
                        '[GET] ✅ localStorage: Successfully retrieved value:',
                        key,
                        'value:',
                        value,
                      );
                      resolve(value);
                    } catch (error) {
                      console.error(
                        '[GET] ❌ localStorage: Failed to parse JSON for key:',
                        key,
                        error,
                      );
                      reject(error);
                    }
                  });

              // Wait for retrieval to complete and fire controller once
              retrievalPromise
                .then((value) => {
                  if (action.strategy) {
                    controller.fire(strategySuccess(action.strategy, value));
                  } else {
                    controller.fire(muxiumConclude());
                  }
                })
                .catch((error) => {
                  console.error('[GET] ❌ localStorage: Retrieval failed for key:', key, error);
                  if (action.strategy) {
                    controller.fire(strategyFailed(action.strategy));
                  } else {
                    controller.fire(muxiumConclude());
                  }
                });
            } else {
              console.log('[GET] 📭 localStorage: No stored value found for key:', key);

              // Return undefined for missing values
              if (action.strategy) {
                controller.fire(strategySuccess(action.strategy, undefined));
              } else {
                controller.fire(muxiumConclude());
              }
            }
          })
          .catch((error) => {
            console.error('[GET] ❌ localStorage: Failed to retrieve from IndexedDB:', key, error);

            if (action.strategy) {
              controller.fire(strategyFailed(action.strategy));
            } else {
              controller.fire(muxiumConclude());
            }
          });
      } catch (error) {
        console.error('[GET] ❌ localStorage: Failed to retrieve:', key, error);

        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy));
        } else {
          controller.fire(muxiumConclude());
        }
      }
    }),
});
