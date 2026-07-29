import { createQualityCard, selectPayload } from 'stratimux';
import type { LocalStorageState } from '../localStorage.model';

export const localStorageValidateEnvironment = createQualityCard<LocalStorageState>({
  type: 'Local Storage Validate Environment',
  reducer: (state) => {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

    // Validate environment safety
    if (environment === 'production') {
      return {
        environment,
      };
    }

    console.log('✅ localStorage: Environment validated - development mode enabled');

    return {
      environment,
      isInitialized: true, // Set to true after environment validation
    };
  },
});
