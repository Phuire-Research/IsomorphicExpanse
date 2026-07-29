/**
 * cadmiumUpdatePlannedQueryStage Quality — Local Reducer (PQCR · C3-D2)
 *
 * Updates a single stage within one PlannedQuery (find-by-queryId, update-by-stageIndex).
 * Partial reducer return (only plannedQueries · Shortest Path Principle). LQRT streaming is
 * MVP-simplified: each dispatch re-renders the Vue component reactively (no streaming engine).
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 4 (Complex Array/Object Updates).
 * Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D2-d.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumUpdatePlannedQueryStagePayload,
} from '../cadmium.type';

export type { CadmiumUpdatePlannedQueryStagePayload };

export const cadmiumUpdatePlannedQueryStage = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumUpdatePlannedQueryStagePayload
>({
  type: 'Cadmium Update Planned Query Stage',
  reducer: (state, action) => {
    const { queryId, stageIndex, status, resultMarkdown } = action.payload;
    // Shortest Path: locate the query, update the target stage, return ONLY plannedQueries.
    return {
      plannedQueries: state.plannedQueries.map((q) =>
        q.queryId === queryId
          ? {
              ...q,
              updatedAt: Date.now(),
              stages: q.stages.map((s) =>
                s.stageIndex === stageIndex
                  ? { ...s, status, resultMarkdown }
                  : s,
              ),
              overallStatus: status,
            }
          : q,
      ),
    };
  },
  methodCreator: defaultMethodCreator,
});
