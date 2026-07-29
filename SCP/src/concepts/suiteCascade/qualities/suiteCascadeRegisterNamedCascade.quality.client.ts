/**
 * suiteCascadeRegisterNamedCascade Quality — Local Reducer
 *
 * Registers (or replaces) one entry in the shared `cascades` Record, keyed by
 * Name. The SHORTEST-PATH return spreads the Record itself — NOT the whole
 * state. Only `cascades` listeners are notified.
 *
 *   CORRECT:  return { cascades: { ...state.cascades, [name]: cascade } }
 *   WRONG:    return { ...state, cascades: { ...state.cascades, [name]: cascade } }
 *
 * Citation: S8SC-SCHOLAR-COMPOSITION-GROUNDING.md §3 (shared-Record reducer).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeState,
  SuiteCascadeRegisterNamedCascadePayload,
} from '../suiteCascade.type';

export type { SuiteCascadeRegisterNamedCascadePayload };

export const suiteCascadeRegisterNamedCascade = createQualityCardWithPayload<
  SuiteCascadeState,
  SuiteCascadeRegisterNamedCascadePayload
>({
  type: 'Suite Cascade Register Named Cascade',
  reducer: (state, action) => {
    const { name, cascade } = action.payload;
    // SHORTEST PATH — spread the Record, never the state.
    return {
      cascades: {
        ...state.cascades,
        [name]: cascade,
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
