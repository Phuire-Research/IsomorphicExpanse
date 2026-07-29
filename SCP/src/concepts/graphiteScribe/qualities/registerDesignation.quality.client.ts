/**
 * registerDesignation Quality — Local Reducer
 *
 * Adds a GraphiteScribeDesignation to the registry. Idempotent: if a designation with
 * the same name exists, replaces it; otherwise appends.
 *
 * Citation: DIAMOND-TIER-M1-A1-D3.md · Wave C
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeRegisterDesignationPayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeRegisterDesignationPayload };

export const graphiteScribeRegisterDesignation = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeRegisterDesignationPayload
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
