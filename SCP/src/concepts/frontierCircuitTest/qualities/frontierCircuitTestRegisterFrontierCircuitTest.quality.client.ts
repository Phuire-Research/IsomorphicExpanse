/**
 * frontierCircuitTestRegisterFrontierCircuitTest Quality — SPSR Record Registration
 *
 * Registers one FrontierCircuitTestEntry into the `frontierCircuitTests` Record keyed by NDEP Name.
 * Idempotent: re-dispatching the same name overwrites the prior entry.
 *
 * Shortest-path reducer: returns ONLY `frontierCircuitTests` — spreads the Record,
 * NOT the whole state (Scholar §3; S12 Shortest-Path Principle).
 *
 * Citation: MASTER-DIAMOND-FRONTIERCIRCUITTEST-CONCEPT-ASPIRANT.md §1 (SPSR + reducer).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  FrontierCircuitTestClientState,
  FrontierCircuitTestEntry,
} from '../frontierCircuitTest.type';

export type FrontierCircuitTestRegisterFrontierCircuitTestPayload = {
  name: string;
  entry: FrontierCircuitTestEntry;
};

export const frontierCircuitTestRegisterFrontierCircuitTest = createQualityCardWithPayload<
  FrontierCircuitTestClientState,
  FrontierCircuitTestRegisterFrontierCircuitTestPayload
>({
  type: 'Suite 8 Register FrontierCircuitTest',
  reducer: (state, { payload }) => {
    const { name, entry } = payload;
    return { frontierCircuitTests: { ...state.frontierCircuitTests, [name]: entry } };
  },
  methodCreator: defaultMethodCreator,
});
