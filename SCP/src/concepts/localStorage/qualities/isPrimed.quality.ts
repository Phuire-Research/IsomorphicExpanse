import { createQualityCard, selectPayload, type Quality } from 'stratimux';
import type { LocalStorageState } from '../localStorage.model';

/**
 * Quality to mark localStorage as primed after all data is loaded from IndexedDB
 * Reference: 🧩 Quality Creation Patterns & Best Practices - Pattern 1: Simple Quality (No Payload)
 */
export const localStorageIsPrimed = createQualityCard<LocalStorageState>({
  type: 'Local Storage Is Primed',
  reducer: (state) => {
    console.log('[IndexedDB] ✅ localStorage isPrimed: Data fully loaded from IndexedDB');
    return {
      isLocalStoragePrimed: true,
    };
  },
});
