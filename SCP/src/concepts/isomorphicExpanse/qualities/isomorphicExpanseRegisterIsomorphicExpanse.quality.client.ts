/**
 * isomorphicExpanseRegisterIsomorphicExpanse Quality — SPSR Record Registration
 *
 * Registers one IsomorphicExpanseEntry into the `isomorphicExpanses` Record keyed by NDEP Name.
 * Idempotent: re-dispatching the same name overwrites the prior entry.
 *
 * Shortest-path reducer: returns ONLY `isomorphicExpanses` — spreads the Record,
 * NOT the whole state (Scholar §3; S12 Shortest-Path Principle).
 *
 * Citation: MASTER-DIAMOND-ISOMORPHICEXPANSE-CONCEPT-ASPIRANT.md §1 (SPSR + reducer).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  IsomorphicExpanseClientState,
  IsomorphicExpanseEntry,
} from '../isomorphicExpanse.type';

export type IsomorphicExpanseRegisterIsomorphicExpansePayload = {
  name: string;
  entry: IsomorphicExpanseEntry;
};

export const isomorphicExpanseRegisterIsomorphicExpanse = createQualityCardWithPayload<
  IsomorphicExpanseClientState,
  IsomorphicExpanseRegisterIsomorphicExpansePayload
>({
  type: 'Suite 8 Register IsomorphicExpanse',
  reducer: (state, { payload }) => {
    const { name, entry } = payload;
    return { isomorphicExpanses: { ...state.isomorphicExpanses, [name]: entry } };
  },
  methodCreator: defaultMethodCreator,
});
