/**
 * registerDesignation Quality — Local Reducer
 *
 * Adds a Suite8Designation to the registry. Idempotent: if a designation with
 * the same name exists, replaces it; otherwise appends.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  Suite8ClientState,
  Suite8RegisterDesignationPayload,
} from '../suite8.type';

export type { Suite8RegisterDesignationPayload };

export const suite8RegisterDesignation = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8RegisterDesignationPayload
>({
  type: 'Suite 8 Register Designation',
  reducer: (state, action) => {
    const incoming = action.payload.designation;
    const existingIndex = state.designations.findIndex((d) => d.name === incoming.name);

    if (existingIndex >= 0) {
      const next = [...state.designations];
      next[existingIndex] = incoming;
      return { designations: next };
    }

    return { designations: [...state.designations, incoming] };
  },
  methodCreator: defaultMethodCreator,
});
