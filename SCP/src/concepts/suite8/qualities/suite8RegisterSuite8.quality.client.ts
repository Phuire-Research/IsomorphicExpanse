/**
 * suite8RegisterSuite8 Quality — SPSR Record Registration
 *
 * Registers one Suite8Entry into the `suite8s` Record keyed by NDEP Name.
 * Idempotent: re-dispatching the same name overwrites the prior entry.
 *
 * Shortest-path reducer: returns ONLY `suite8s` — spreads the Record,
 * NOT the whole state (Scholar §3; S12 Shortest-Path Principle).
 *
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §1 (SPSR + reducer).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  Suite8ClientState,
  Suite8Entry,
} from '../suite8.type';

export type Suite8RegisterSuite8Payload = {
  name: string;
  entry: Suite8Entry;
};

export const suite8RegisterSuite8 = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8RegisterSuite8Payload
>({
  type: 'Suite 8 Register Suite8',
  reducer: (state, { payload }) => {
    const { name, entry } = payload;
    return { suite8s: { ...state.suite8s, [name]: entry } };
  },
  methodCreator: defaultMethodCreator,
});
