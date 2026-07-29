/*<$
For the graph programming framework Stratimux generate a LocalStorage Synchronization Principle that monitors state changes and automatically synchronizes registered KeyedSelectors to localStorage with encryption.
$>*/
/*<#*/
import { strategyBegin, type KeyedSelector } from 'stratimux';
import type { LocalStoragePrinciple, LocalStorageSetPayload } from '../localStorage.model';
import { initializeLocalStorageStrategy } from '../strategies/initializeLocalStorage.strategy';

export const localStoragePrinciple: LocalStoragePrinciple = ({ plan, d_, k_ }) => {
  if (true) {
    // if (window.location.port === '7676') {
    plan('LocalStorage Synchronization', ({ stage, stageO, conclude }) => [
      stageO(),
      // Stage 2: Initialize localStorage if not already done
      stage(({ dispatch, d, k }) => {
        // Use k_ from outer scope to access localStorage state
        const isInitialized = k.isInitialized.select();
        const environment = k.environment.select();

        console.log(
          '[IndexedDB] 🏗️ localStorage principle: Stage 2 - isInitialized:',
          isInitialized,
          'environment:',
          environment,
        );

        // Force initialization regardless of environment for testing
        if (!isInitialized) {
          console.log('[IndexedDB] 🔧 localStorage principle: Force initializing for testing');
          dispatch(d.localStorage.e.localStorageInitialize({ environment: 'development' }), {
            iterateStage: true,
          });
        } else {
          console.log('[IndexedDB] 🔧 localStorage principle: Already initialized');
          // Continue to next stage even when already initialized
          dispatch(d.muxium.e.muxiumKick(), {
            iterateStage: true,
          });
        }
      }),

      // Stage 3: Generate system fingerprint if needed
      stage(({ concepts, dispatch, d, k }) => {
        console.log('[IndexedDB] 🔑 localStorage principle: Stage 3 - RUNNING', concepts);
        const isInitialized = k.isInitialized.select();
        const systemFingerprint = k.systemFingerprint.select();

        console.log(
          '[IndexedDB] 🔑 localStorage principle: Stage 3 - initialized:',
          isInitialized,
          'fingerprint exists:',
          !!systemFingerprint,
        );

        if (!systemFingerprint) {
          const action = d.localStorage.e.localStorageGenerateFingerprint({
            priority: 1000,
          });
          console.log(
            '[IndexedDB] 🔑 localStorage principle: Generating system fingerprint',
            action,
          );
          dispatch(action, {
            iterateStage: true,
          });
        } else if (systemFingerprint) {
          console.log(
            '[IndexedDB] 🔑 localStorage principle: Fingerprint already exists, continuing',
          );
          dispatch(d.muxium.e.muxiumKick(), {
            iterateStage: true,
          });
        }
      }),

      // Stage 4: Initialize from stored data using strategy
      stage(
        ({ dispatch, d, k }) => {
          console.log('[IndexedDB] 🔧 localStorage principle: Stage 4 - RUNNING');
          const systemFingerprint = k.systemFingerprint.select();
          const isInitialized = k.isInitialized.select();

          console.log(
            '[IndexedDB] 🔧 localStorage principle: Stage 4 - fingerprint:',
            !!systemFingerprint,
            'initialized:',
            isInitialized,
          );

          // Always run initialization strategy if we have fingerprint and are initialized
          if (systemFingerprint && isInitialized) {
            console.log(
              '[IndexedDB] 🔧 localStorage principle: Running initialization strategy to load stored data',
            );
            const strategy = initializeLocalStorageStrategy(d);
            if (strategy) {
              dispatch(strategyBegin(strategy), {
                iterateStage: true,
              });
            } else {
              console.log(
                '[IndexedDB] 🔧 localStorage principle: Strategy creation failed, continuing without loading data',
              );
              dispatch(d.muxium.e.muxiumKick(), {
                iterateStage: true,
              });
            }
          } else {
            console.log(
              '[IndexedDB] 🔧 localStorage principle: Waiting for initialization conditions',
            );
            // Don't iterate - wait for state changes with a beat
          }
        },
        { beat: 300 },
      ), // Check every 300ms for initialization

      // Stage 4.5: Wait for localStorage to be primed with data
      stage(({ dispatch, d, k }) => {
        const isLocalStoragePrimed = k.isLocalStoragePrimed.select();

        if (isLocalStoragePrimed) {
          console.log(
            '[IndexedDB] ✅ localStorage principle: Data primed, continuing to monitoring',
          );
          dispatch(d.muxium.e.muxiumKick(), {
            iterateStage: true,
          });
        } else {
          console.log('[IndexedDB] ⏳ localStorage principle: Waiting for data to be primed');
          // Don't iterate - wait for priming
        }
      }),

      // Stage 5: Monitor synced selectors for changes (reactive synchronization)
      stage(
        ({ dispatch, d, k, changes }) => {
          console.log(
            '[NAVIGATE-DEBUG] 🔔 localStorage principle: Stage 5 PING - Monitoring triggered!',
          );
          console.log('[NAVIGATE-DEBUG] 🔔 Number of changes detected:', changes.length);
          if (changes.length > 0) {
            console.log(
              '[NAVIGATE-DEBUG] 🔔 Changed selectors:',
              changes.map((c) => c.keys),
            );
          }

          console.log('[IndexedDB] 🔄 localStorage principle: Stage 5 - RUNNING');
          const syncedSelectors = k.syncedSelectors.select();
          const mappedStorage = k.mappedStorage.select();
          const systemFingerprint = k.systemFingerprint.select();

          console.log(
            '[IndexedDB] 🔄 localStorage principle: Stage 5 check - fingerprint:',
            !!systemFingerprint,
            'selectors:',
            syncedSelectors,
          );
          console.log(
            '[NAVIGATE-DEBUG] 🔔 Registered selectors for sync:',
            Object.keys(syncedSelectors || {}),
          );

          if (systemFingerprint && syncedSelectors && Object.keys(syncedSelectors).length > 0) {
            console.log(
              '[IndexedDB] 🔄 localStorage principle: Stage 5 - Monitoring synced selectors:',
              Object.keys(syncedSelectors),
            );
            console.log('[NAVIGATE-DEBUG] 🔔 Guard check passed - Processing changes');
            const newSelectors: KeyedSelector[] = [];
            const updateSet: LocalStorageSetPayload = {
              toBeSet: [],
            };
            if (changes.length > 0) {
              changes.forEach((change) => {
                // Get encryption flag from mappedStorage
                const encrypted = mappedStorage[change.keys]?.encrypted ?? false;
                console.log(
                  '[IndexedDB] [SET] 🔍 localStorage principle: Processing change for key:',
                  change.keys,
                );
                console.log(
                  '[IndexedDB] [SET] 🔍 localStorage principle: mappedStorage entry:',
                  mappedStorage[change.keys],
                );
                console.log(
                  '[IndexedDB] [SET] 🔍 localStorage principle: encrypted flag:',
                  encrypted,
                );

                // Special logging for projects to track sessionSlice
                const valueToStore = change.select();
                if (change.keys === 'projects' && valueToStore) {
                  const projectIds = Object.keys(valueToStore);
                  console.log('[ProjectManager] 📋 Projects being saved to localStorage:', {
                    projectCount: projectIds.length,
                    projects: projectIds.map((id) => {
                      const project = (valueToStore as any)[id];
                      return {
                        id,
                        name: project.name,
                        hasSessionSlice: !!project.sessionSlice,
                        sliceSessionCount: project.sessionSlice
                          ? Object.keys(project.sessionSlice.sessions || {}).length
                          : 0,
                        sliceCurrentSessionId: project.sessionSlice?.currentSessionId,
                        sliceBufferLength: project.sessionSlice?.lastKnownBuffer?.length || 0,
                        sliceEntriesInCurrentSession:
                          project.sessionSlice?.sessions?.[project.sessionSlice?.currentSessionId]
                            ?.entries?.length || 0,
                      };
                    }),
                  });
                }

                console.log(
                  '[IndexedDB] [SET] 🔍 localStorage principle: value to store:',
                  valueToStore,
                );
                updateSet.toBeSet.push({
                  key: change.keys,
                  value: change.select(),
                  encrypted: encrypted,
                });
              });
            }
            const keysOfSelectors = Object.keys(syncedSelectors);
            keysOfSelectors.forEach((selectorKey) => {
              const selectorConfig = syncedSelectors[selectorKey];
              console.log(
                '[IndexedDB] 🔍 localStorage DEBUG: Retrieved selectorConfig from state:',
                selectorKey,
                selectorConfig,
              );
              if (selectorConfig && selectorConfig.selector) {
                console.log(
                  '[IndexedDB] 🔍 localStorage DEBUG: selectorConfig.selector functions check:',
                );
                console.log(
                  '[IndexedDB]  🔍 localStorage - hasSelect:',
                  !!selectorConfig.selector.select,
                );
                console.log(
                  '[IndexedDB]  🔍 localStorage - has_selector:',
                  !!selectorConfig.selector._selector,
                );
                console.log(
                  '[IndexedDB]  🔍 localStorage - selector object:',
                  selectorConfig.selector,
                );
                const possibleKey = selectorConfig.key.split('.').pop();
                if (selectorConfig.selector._selector === undefined && possibleKey) {
                  // TODO: CRITICAL ISSUE - KeyedSelector Function Loss Investigation Required
                  //
                  // PROBLEM: KeyedSelector objects stored in syncedSelectors state are losing their
                  // select() and _selector() functions between storage and retrieval. The stored
                  // selector reference becomes a plain object with only basic properties
                  // (conceptName, conceptSemaphore, keys) instead of the full functional KeyedSelector.
                  //
                  // ROOT CAUSE: Unknown - KeyedSelector singleton is NOT being mutated, but the
                  // reference stored in state (selectorConfig.selector) is being replaced with
                  // a stripped-down version missing all function properties.
                  //
                  // STOPGAP SOLUTION: Detect corrupted selectors and recover the functional
                  // KeyedSelector from the k object using the selector key name. This allows
                  // localStorage synchronization to continue working while the root cause is
                  // investigated.
                  //
                  // NEXT STEPS:
                  // 1. Investigate state management system for reference corruption
                  // 2. Determine why stored selector references lose functions
                  // 3. Implement proper solution to prevent corruption at source
                  // 4. Remove this recovery logic once root cause is fixed

                  // Selector functions were lost, get the actual selector from k
                  const actualSelector = (k as any)[possibleKey];
                  if (actualSelector && actualSelector._selector) {
                    console.log(
                      '[IndexedDB] 🔄 localStorage principle: Fixed corrupted selector using actual selector from k',
                    );
                    newSelectors.push(actualSelector);
                  } else {
                    console.log(
                      '[IndexedDB] 🔄 localStorage principle: Bad Selector in Sync - cannot recover:',
                      selectorConfig,
                      syncedSelectors,
                      k,
                    );
                  }
                } else {
                  newSelectors.push(selectorConfig.selector);
                }
              }
            });
            console.log('[IndexedDB] CHECK NEW SELECTORS', newSelectors, k.syncedSelectors);
            if (updateSet.toBeSet.length > 0 && newSelectors.length > 0) {
              console.log(
                '[IndexedDB] 🔄 localStorage principle: CONDITION 1 - Updating storage AND selectors',
              );
              console.log('[IndexedDB]   - updateSet:', updateSet);
              console.log('[IndexedDB]   - newSelectors count:', newSelectors.length);
              console.log(
                '[IndexedDB]   - newSelectors have functions:',
                newSelectors.map((sel) => ({
                  keys: sel.keys,
                  hasSelect: !!sel.select,
                  has_selector: !!sel._selector,
                })),
              );
              dispatch(d.localStorage.e.localStorageSet(updateSet), {
                throttle: 0,
                newSelectors: [k.syncedSelectors, ...newSelectors],
              });
            } else if (updateSet.toBeSet.length > 0 && newSelectors.length === 0) {
              console.log(
                '[IndexedDB] 🔄 localStorage principle: CONDITION 2 - Updating storage ONLY',
              );
              console.log('[IndexedDB]   - updateSet:', updateSet);
              console.log('[IndexedDB]   - No new selectors to add');
              dispatch(d.localStorage.e.localStorageSet(updateSet), {
                throttle: 0,
              });
            } else if (updateSet.toBeSet.length === 0 && newSelectors.length > 0) {
              console.log(
                '[IndexedDB] 🔄 localStorage principle: CONDITION 3 - Updating selectors ONLY',
              );
              console.log('[IndexedDB]   - No storage updates');
              console.log('[IndexedDB]   - newSelectors count:', newSelectors.length);
              console.log(
                '[IndexedDB]   - newSelectors have functions:',
                newSelectors.map((sel) => ({
                  keys: sel.keys,
                  hasSelect: !!sel.select,
                  has_selector: !!sel._selector,
                })),
              );
              dispatch(d.muxium.e.muxiumKick(), {
                throttle: 0,
                newSelectors: [k.syncedSelectors, k.mappedStorage, ...newSelectors],
              });
            }
          }
        },
        {
          priority: 500, // Medium priority
          selectors: [k_.syncedSelectors, k_.mappedStorage],
        },
      ),

      // Stage 6: Periodic cleanup of expired data

      conclude(),
    ]);
  }

  // if (k_.autoCleanupEnabled.select()) {
  //   plan('Auto Clean Up' , ({ stage, stageO, conclude }) => [

  //   stageO(() => d_.muxium.e.muxiumKick()),

  //   // Stage 1: Register this principle with muxium
  //   stage(({ concepts, dispatch, stagePlanner, k }) => {
  //     const name = k.getName(concepts);

  //     // Register with the concept name we found
  //     if (name) {
  //       dispatch(d_.muxium.e.muxiumRegisterStagePlanner({ conceptName: name, stagePlanner }), {
  //         iterateStage: true,
  //       });
  //     } else {
  //       stagePlanner.conclude();
  //     }
  //   }),
  //   stage(({ dispatch, d, }) => {
  //     const autoCleanupEnabled = k_.autoCleanupEnabled.select();

  //     if (autoCleanupEnabled) {
  //       dispatch(d.localStorage.e.localStorageCleanup({
  //         maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  //       }), {
  //         throttle: 60 // Throttle cleanup to prevent overflow
  //       });
  //     }
  //   }, {
  //     beat: 60000, // Every minute
  //     priority: 100 // Low priority background task
  //   }),
  //   conclude()
  //   ])
  // }
};

/*#>*/
