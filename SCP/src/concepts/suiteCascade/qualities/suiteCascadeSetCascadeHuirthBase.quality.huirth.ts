/**
 * suiteCascadeSetCascadeHuirthBase Quality — Huirth-Only Base State Maintenance
 *
 * SBIS (Stratidian-Base-Informative-State) Pattern · Band B-4 WCJF.
 *
 * Base = Huirth state (server source of truth, maintained by the WCJF Cascade.json
 * watcher Lambda). Informative = Client state (derived, broadcast-synchronized).
 *
 * This is the Base-maintenance companion to suiteCascadeSetCascadeRelay. The WCJF
 * watcher dispatches THIS action ALONGSIDE the relay at every dispatch site: this
 * action runs the LOCAL HUIRTH REDUCER ONLY (so cascades['General'] actually exists
 * server-side); the relay routes via actionExchange.serverToClient to the Client.
 *
 * INVARIANT: this action type MUST NOT appear in actionExchange.serverToClient and
 *   MUST NOT be registered in the client concept face. It IS registered in
 *   suiteCascade.concept.huirth.ts only.
 *
 * Citation: scsBridge/qualities/setBridgeJsonHuirthBase.quality.ts (SBIS Base bearing).
 * Citation: feedback_stratidian_base_informative_state.md.
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeSetCascadeHuirthBasePayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetCascadeHuirthBasePayload };

export const suiteCascadeSetCascadeHuirthBase = createQualityCardWithPayload<
  SuiteCascadeHuirthState,
  SuiteCascadeSetCascadeHuirthBasePayload
>({
  type: 'Suite Cascade Set Cascade Huirth Base',
  reducer: (state, action) => {
    const { name, cascade } = action.payload;
    // SHORTEST PATH — spread the Record, never the whole state.
    return {
      cascades: {
        ...state.cascades,
        [name]: cascade,
      },
    };
  },
  methodCreator: defaultMethodCreator,
});
