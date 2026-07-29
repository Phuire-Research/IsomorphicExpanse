import {
  type ActionType,
  createQualityCard,
  selectPayload,
  type Quality,
  defaultMethodCreator,
} from 'stratimux';
import type { LocalStorageState } from '../localStorage.model';

/**
 * Quality to mark localStorage as initialized after database setup
 * Reference: 🧩 Quality Creation Patterns & Best Practices - Pattern 1: Simple Quality (No Payload)
 */

export const localStorageIsInitialized = createQualityCard<LocalStorageState>({
  type: 'Local Storage Is Initialized',
  reducer: (state) => {
    console.log('[IndexedDB] ✅ localStorage isInitialized: Setting isInitialized to true');
    return {
      isInitialized: true,
    };
  },
  methodCreator: defaultMethodCreator,
});
