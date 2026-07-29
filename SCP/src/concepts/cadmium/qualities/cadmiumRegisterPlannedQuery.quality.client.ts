/**
 * cadmiumRegisterPlannedQuery Quality — Local Reducer (PQCR · C3-D2)
 *
 * Registers a PlannedQuery (multi-stage research-execution structure). Append-to-array;
 * partial reducer return (only plannedQueries · Shortest Path Principle). PlannedQuery is
 * a SEPARATE Demometer from CadmiumVermillionSkill — distinct state slot, distinct quality.
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 2 (Payload Quality).
 * Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D2-c.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumRegisterPlannedQueryPayload,
} from '../cadmium.type';

export type { CadmiumRegisterPlannedQueryPayload };

export const cadmiumRegisterPlannedQuery = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumRegisterPlannedQueryPayload
>({
  type: 'Cadmium Register Planned Query',
  reducer: (state, action) => {
    // Shortest Path: return ONLY the changed property (append the new query).
    return {
      plannedQueries: [...state.plannedQueries, action.payload.query],
    };
  },
  methodCreator: defaultMethodCreator,
});
