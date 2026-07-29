/**
 * graphiteScribeRegisterGraphiteScribe Quality — SPSR Record Registration
 *
 * Registers one GraphiteScribeEntry into the `graphiteScribes` Record keyed by NDEP Name.
 * Idempotent: re-dispatching the same name overwrites the prior entry.
 *
 * Shortest-path reducer: returns ONLY `graphiteScribes` — spreads the Record,
 * NOT the whole state (Scholar §3; S12 Shortest-Path Principle).
 *
 * Citation: MASTER-DIAMOND-CODEEDITOR-CONCEPT-ASPIRANT.md §1 (SPSR + reducer).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeClientState,
  GraphiteScribeEntry,
} from '../graphiteScribe.type';

export type GraphiteScribeRegisterGraphiteScribePayload = {
  name: string;
  entry: GraphiteScribeEntry;
};

export const graphiteScribeRegisterGraphiteScribe = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeRegisterGraphiteScribePayload
>({
  type: 'Suite 8 Register GraphiteScribe',
  reducer: (state, { payload }) => {
    const { name, entry } = payload;
    return { graphiteScribes: { ...state.graphiteScribes, [name]: entry } };
  },
  methodCreator: defaultMethodCreator,
});
