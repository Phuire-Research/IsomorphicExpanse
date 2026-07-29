/**
 * suiteCascadeSetActiveCascadeFilesHuirthBase Quality — Huirth-Only Base Maintenance
 *
 * SBIS Base companion to suiteCascadeSetActiveCascadeFilesRelay · Band B-4 WCJF.
 * Replaces the finite activeCascadeFiles list for one named cascade entry in the
 * Huirth (Base) state. The WCJF watcher dispatches this alongside the relay after
 * reading the live markdown of each file listed in the Cascade.json manifest.
 *
 * If the named entry does not yet exist (register did not run first), no-op ({}).
 *
 * INVARIANT: Huirth-only · NOT in actionExchange.serverToClient · NOT in client face.
 *
 * Citation: scsBridge/qualities/setSessionsListHuirthBase.quality.ts (SBIS Base bearing).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeSetActiveCascadeFilesHuirthBasePayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetActiveCascadeFilesHuirthBasePayload };

export const suiteCascadeSetActiveCascadeFilesHuirthBase = createQualityCardWithPayload<
  SuiteCascadeHuirthState,
  SuiteCascadeSetActiveCascadeFilesHuirthBasePayload
>({
  type: 'Suite Cascade Set Active Cascade Files Huirth Base',
  reducer: (state, action) => {
    const { name, activeCascadeFiles } = action.payload;
    const existing = state.cascades[name];
    if (!existing) {
      return {};
    }
    return {
      cascades: {
        ...state.cascades,
        [name]: {
          ...existing,
          activeCascadeFiles,
        },
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
