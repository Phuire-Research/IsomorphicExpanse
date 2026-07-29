import {
  createQualityCardWithPayload,
  selectPayload,
  nullReducer,
  strategySuccess,
  strategyFailed,
  createAsyncMethodWithState,
  muxiumConclude,
} from 'stratimux';
import type {
  LocalStorageState,
  LocalStorageSetPayload,
  SyncedConfig,
} from '../localStorage.model';
import { encryptData, needsChunking, chunkString } from '../localStorage.model';
import { indexedDBSetItem, indexedDBRemoveItem } from '../indexeddb.model';

// Helper function for quota exceeded logging
function logQuotaExceeded(context: string, key: string, attemptedSize?: number) {
  console.error(`[SET] 💾 Storage QUOTA EXCEEDED - ${context}: ${key}`);

  // Note: IndexedDB doesn't provide a simple way to enumerate all keys/sizes
  // This is now just for logging the attempted write
  console.error(`[SET] 📊 Storage QUOTA Info:`, {
    failedKey: key,
    attemptedSizeKB: attemptedSize ? (attemptedSize / 1024).toFixed(2) : 'unknown',
    estimatedSizeKB: attemptedSize ? ((attemptedSize * 2) / 1024).toFixed(2) : 'unknown', // UTF-16
    message: 'IndexedDB storage limit reached',
  });
}

export const localStorageSet = createQualityCardWithPayload<
  LocalStorageState,
  LocalStorageSetPayload
>({
  type: 'Local Storage Set',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ action, state, controller }) => {
      const { toBeSet } = selectPayload<LocalStorageSetPayload>(action);

      console.log('[SET] 📥 localStorage: Received set request with payload:', toBeSet);

      try {
        // Create promises for all storage operations
        const storagePromises: Promise<void>[] = [];

        // Process each item in the array
        for (const { key, value, encrypted = false } of toBeSet) {
          console.log(
            '[SET] 🔍 localStorage: Processing item - key:',
            key,
            'encrypted:',
            encrypted,
            'value:',
            value,
          );
          const jsonData = JSON.stringify(value);

          // Create a promise for the entire storage operation (encrypted or not)
          const storePromise = new Promise<void>(async (resolve, reject) => {
            try {
              // Step 1: Prepare data (encrypt if needed)
              const dataToStore = encrypted
                ? await encryptData(jsonData, state.systemFingerprint)
                : jsonData;

              // Step 2: Check if chunking is needed
              if (!needsChunking(dataToStore)) {
                // Store normally
                indexedDBSetItem(key, dataToStore)
                  .then(() => {
                    console.log(
                      `[SET] ${encrypted ? '🔐' : '✅'} localStorage: Stored directly:`,
                      key,
                    );

                    // Update synced config to indicate no chunking
                    if (state.mappedStorage[key]) {
                      state.mappedStorage[key].chunkedKeys = [];
                    }

                    resolve();
                  })
                  .catch((error) => {
                    // This should rarely happen with our chunking solution
                    if (error instanceof Error && error.name === 'QuotaExceededError') {
                      logQuotaExceeded('Direct storage failed', key, dataToStore.length);
                      console.error(
                        '[SET] 💡 HINT: This data should have been chunked. Check MAX_CHUNK_SIZE configuration.',
                      );
                    }
                    throw error;
                  });
              } else {
                // Chunked storage needed
                console.log(
                  '[SET] 📦 localStorage: Large data detected, chunking required for:',
                  key,
                  {
                    dataSize: dataToStore.length,
                    sizeInMB: ((dataToStore.length * 2) / 1024 / 1024).toFixed(2) + 'MB',
                  },
                );

                // Clean up any existing chunks first
                const existingConfig = state.mappedStorage[key];
                if (
                  existingConfig &&
                  existingConfig.chunkedKeys &&
                  existingConfig.chunkedKeys.length > 0
                ) {
                  console.log(
                    '[SET] 🧹 Cleaning up existing chunks:',
                    existingConfig.chunkedKeys.length,
                  );
                  const cleanupPromises = existingConfig.chunkedKeys.map((oldChunkKey) =>
                    indexedDBRemoveItem(oldChunkKey).catch((e) =>
                      console.warn('[SET] Failed to remove old chunk:', oldChunkKey, e),
                    ),
                  );
                  await Promise.all(cleanupPromises);
                }

                // Chunk the data
                const chunks = chunkString(dataToStore);
                const chunkKeys: string[] = [];
                console.log('[SET] 🔪 Splitting into chunks:', chunks.length);

                // Store each chunk
                const chunkPromises: Promise<void>[] = [];

                for (let i = 0; i < chunks.length; i++) {
                  const chunkKey = `${key}_chunk_${i}`;
                  const chunkIndex = i;

                  const chunkPromise = indexedDBSetItem(chunkKey, chunks[i])
                    .then(() => {
                      chunkKeys.push(chunkKey);
                      console.log(
                        `[SET] 📄 Stored chunk ${chunkIndex + 1}/${chunks.length}:`,
                        chunkKey,
                      );
                    })
                    .catch((chunkError) => {
                      // Log if we hit quota even with chunking
                      if (chunkError instanceof Error && chunkError.name === 'QuotaExceededError') {
                        logQuotaExceeded(
                          `Chunk storage failed at chunk ${chunkIndex}`,
                          chunkKey,
                          chunks[chunkIndex].length,
                        );
                        console.error(
                          '[SET] 🚨 CRITICAL: localStorage is full even with chunking!',
                        );
                        console.error(
                          '[SET] 💡 HINT: Consider cleaning up old data or reducing chunk size.',
                        );
                      } else {
                        console.error('[SET] ❌ Failed to store chunk:', chunkKey, chunkError);
                      }

                      throw chunkError;
                    });

                  chunkPromises.push(chunkPromise);
                }

                // Wait for all chunks to be stored
                Promise.all(chunkPromises)
                  .then(() => {
                    // Update synced config with chunk keys
                    if (state.mappedStorage[key]) {
                      state.mappedStorage[key].chunkedKeys = chunkKeys;
                    }

                    console.log(`[SET] ✅ Successfully stored ${chunks.length} chunks for:`, key);
                    resolve();
                  })
                  .catch(async (error) => {
                    // Rollback on failure
                    console.log('[SET] 🔄 Rolling back stored chunks...');
                    const rollbackPromises = chunkKeys.map((storedKey) =>
                      indexedDBRemoveItem(storedKey).catch((e) =>
                        console.warn('[SET] Failed to rollback chunk:', storedKey, e),
                      ),
                    );

                    await Promise.all(rollbackPromises);
                    reject(error);
                  });
              }
            } catch (error) {
              console.error('[SET] ❌ localStorage: Failed to store:', key, error);
              reject(error);
            }
          });

          storagePromises.push(storePromise);
        }

        // Wait for all storage operations to complete
        Promise.all(storagePromises).then(() => {
          console.log('[SET] 🚀 localStorage');
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        });

        // Fire controller only once after all operations complete
      } catch (error) {
        console.error('[SET] ❌ localStorage: Error during set operation:', error);
        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy));
        } else {
          controller.fire(muxiumConclude());
        }
      }
    }),
});
