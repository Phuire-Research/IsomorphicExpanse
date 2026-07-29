/**
 * suiteCascadeSetCascadeJson Quality — Local Reducer
 *
 * Updates the parsed `cascadeJson` for one named cascade entry (the General
 * Watcher dispatches this when the GRID `Cascade.json` is read / changes). If
 * the named entry does not yet exist, this is a no-op return ({}) — the entry
 * must first be registered via suiteCascadeRegisterNamedCascade. SHORTEST PATH:
 * spread the Record + the single entry; never spread the whole state.
 *
 * Citation: S8SC-SCHOLAR-COMPOSITION-GROUNDING.md §3/§4 (Watcher dispatches
 *           Tier-2 setters into the shared Record).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeState,
  SuiteCascadeSetCascadeJsonPayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetCascadeJsonPayload };

export const suiteCascadeSetCascadeJson = createQualityCardWithPayload<
  SuiteCascadeState,
  SuiteCascadeSetCascadeJsonPayload
>({
  type: 'Suite Cascade Set Cascade Json',
  reducer: (state, action) => {
    const { name, cascadeJson } = action.payload;
    const existing = state.cascades[name];
    if (!existing) {
      // Entry must be registered first — no-op partial return.
      return {};
    }
    return {
      cascades: {
        ...state.cascades,
        [name]: {
          ...existing,
          cascadeJson,
        },
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
