import { createQualityCard, defaultMethodCreator } from 'stratimux';
import type { LocalStorageState, FingerprintComponents } from '../localStorage.model';

export const localStorageGenerateFingerprint = createQualityCard<LocalStorageState>({
  type: 'Local Storage Generate Fingerprint',
  reducer: () => {
    // Generate fingerprint synchronously in the reducer
    console.log('[ENCRYPTION] 🔑 localStorage: Generating system fingerprint.');
    const generateFingerprint = (): string => {
      // Generate browser fingerprint components
      const generateCanvasFingerprint = (): string => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.log('[ENCRYPTION] Canvas context blocked');
            return 'canvas_blocked';
          }

          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Stratimux Dev Fingerprint', 2, 2);
          const canvasData = canvas.toDataURL();
          console.log('[ENCRYPTION] Canvas fingerprint length:', canvasData.length);
          return canvasData;
        } catch (e) {
          console.error('[ENCRYPTION] Canvas fingerprint error:', e);
          return 'canvas_blocked';
        }
      };

      const getStoredRandomness = (): string => {
        const storedRandom = localStorage.getItem('stratimux_dev_random');
        if (storedRandom) {
          console.log(
            '[ENCRYPTION] Using stored randomness:',
            storedRandom.substring(0, 20) + '...',
          );
          return storedRandom;
        }

        const newRandom = crypto.getRandomValues(new Uint8Array(16)).toString();
        console.log('[ENCRYPTION] Generated new randomness:', newRandom.substring(0, 20) + '...');
        try {
          localStorage.setItem('stratimux_dev_random', newRandom);
        } catch (e) {
          // If localStorage is full, use sessionStorage as fallback
          console.warn('[ENCRYPTION] localStorage full, using sessionStorage for randomness');
          sessionStorage.setItem('stratimux_dev_random', newRandom);
        }
        return newRandom;
      };

      // Collect fingerprint components
      const components: FingerprintComponents = {
        canvas: generateCanvasFingerprint(),
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        random: getStoredRandomness(),
      };

      console.log('[ENCRYPTION] Fingerprint components:', {
        screen: components.screen,
        timezone: components.timezone,
        hardwareConcurrency: components.hardwareConcurrency,
        canvasLength: components.canvas.length,
        randomLength: components.random.length,
      });

      // Generate deterministic hash (simple string-based for synchronous operation)
      const combined = JSON.stringify(components);
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      const fingerprintHash = Math.abs(hash).toString(16).padStart(8, '0');
      console.log('[ENCRYPTION] Combined string length:', combined.length);
      console.log('[ENCRYPTION] Generated hash:', fingerprintHash);

      return fingerprintHash;

      // console.warn('Fingerprint generation failed, using fallback:', error);
      // return `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    };

    const fingerprint = generateFingerprint();

    console.log('[ENCRYPTION] 🔑 localStorage: Final fingerprint:', fingerprint);

    return {
      systemFingerprint: fingerprint,
    };
  },
  methodCreator: defaultMethodCreator,
});
