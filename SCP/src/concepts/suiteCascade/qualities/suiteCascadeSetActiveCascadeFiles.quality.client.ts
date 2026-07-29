/**
 * suiteCascadeSetActiveCascadeFiles Quality — Local Reducer
 *
 * Replaces the finite `activeCascadeFiles` list for one named cascade entry
 * (the WCJF watcher / Component dispatches this as live markdown content
 * updates). If the named entry does not yet exist, no-op return ({}). SHORTEST
 * PATH: spread the Record + the single entry; never spread the whole state.
 *
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-2 ACFR
 *           (activeCascadeFiles is finite + Component-declared; reactive render).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeState,
  SuiteCascadeSetActiveCascadeFilesPayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetActiveCascadeFilesPayload };

export const suiteCascadeSetActiveCascadeFiles = createQualityCardWithPayload<
  SuiteCascadeState,
  SuiteCascadeSetActiveCascadeFilesPayload
>({
  type: 'Suite Cascade Set Active Cascade Files',
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
