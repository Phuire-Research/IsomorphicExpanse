import { createConcept } from 'stratimux';
import type { LocalStorageState, LocalStorageQualities } from './localStorage.model';

// Qualities imports
import { localStorageInitialize } from './qualities/initialize.quality';
import { localStorageIsInitialized } from './qualities/isInitialized.quality';
import { localStorageIsPrimed } from './qualities/isPrimed.quality';
import { localStorageAddSelectorForSync } from './qualities/addSelectorForSync.quality';
import { localStorageRemoveSelectorFromSync } from './qualities/removeSelectorFromSync.quality';
import { localStorageSet } from './qualities/set.quality';
import { localStorageGet } from './qualities/get.quality';
import { localStorageSetState } from './qualities/setState.quality';
import { localStorageSaveMappedStorage } from './qualities/saveMappedStorage.quality';
import { localStorageGetMappedStorage } from './qualities/getMappedStorage.quality';
import { localStorageSynchronizeFromMappedStorage } from './qualities/synchronizeFromMappedStorage.quality';
import { localStorageSync } from './qualities/sync.quality';
import { localStorageCleanup } from './qualities/cleanup.quality';
import { localStorageGenerateFingerprint } from './qualities/generateFingerprint.quality';
import { localStorageValidateEnvironment } from './qualities/validateEnvironment.quality';

// Principle imports
import { localStoragePrinciple } from './principles/localStorage.principle';

// Strategy imports
import { initializeLocalStorageStrategy } from './strategies/initializeLocalStorage.strategy';

// Concept name
export const localStorageName = 'localStorage';

// Initial state factory
export const initialLocalStorageState = (): LocalStorageState => ({
  // Core state
  isInitialized: false,
  isLocalStoragePrimed: false,
  systemFingerprint: '',

  // Configuration
  configuration: null,

  // KeyedSelector management
  syncedSelectors: {},
  mappedStorage: {},
  pendingSync: [],
  lastSyncTimestamp: 0,

  // Development safety - Force development for localStorage testing
  environment: 'development', // TODO: Change back to process.env.NODE_ENV check for production
  autoCleanupEnabled: true,
});

// Qualities object
export const localStorageQualities: LocalStorageQualities = {
  localStorageInitialize,
  localStorageIsInitialized,
  localStorageIsPrimed,
  localStorageAddSelectorForSync,
  localStorageRemoveSelectorFromSync,
  localStorageSet,
  localStorageGet,
  localStorageSetState,
  localStorageSaveMappedStorage,
  localStorageGetMappedStorage,
  localStorageSynchronizeFromMappedStorage,
  localStorageSync,
  localStorageCleanup,
  localStorageGenerateFingerprint,
  localStorageValidateEnvironment,
};

// Concept creation function
export const createLocalStorageConcept = () => {
  return createConcept<LocalStorageState, LocalStorageQualities>(
    localStorageName,
    initialLocalStorageState(),
    localStorageQualities,
    [localStoragePrinciple],
  );
};

// Export strategy
export { initializeLocalStorageStrategy };

export default createLocalStorageConcept;
