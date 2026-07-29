/**
 * setSessionsListHuirthBase Quality — Huirth-Only Base State Maintenance
 *
 * SBIS (Stratidian-Base-Informative-State) Pattern
 * Citation: ~/.claude/projects/<project-slug>/memory/feedback_stratidian_base_informative_state.md
 *
 * Base = Huirth state (server source of truth, maintained by file-watcher Lambda events).
 * Informative = Client state (derived, broadcast-synchronized from Base).
 *
 * This quality is the Base-maintenance companion to setSessionsListRelay.
 * Dispatched by scsBridgeJsonWatcherPrinciple ALONGSIDE setSessionsListRelay at every
 * dispatch site. The relay action routes via actionExchange.serverToClient to Client
 * (Informative path). THIS action runs LOCAL HUIRTH REDUCER ONLY (Base path).
 *
 * Problem diagnosed (Cycle 163 R6 · SBIS):
 *   setSessionsListRelay is in actionExchange.serverToClient — the local Huirth reducer
 *   is bypassed. The SLSR-Reducer log ([SCS-Bridge SLSR-Reducer]) never appears in
 *   template-debug.json. Huirth state.sessionsList never updates. SMRP selectors never
 *   fire. Broadcast never happens.
 *
 * Fix: add a Huirth-only sibling action (this file) with a DISTINCT type string that
 *   is NOT registered in actionExchange.serverToClient. The local Huirth reducer runs
 *   unconditionally. State changes. SMRP selectors observe the change. Broadcast follows.
 *
 * INVARIANT: This action type MUST NOT appear in actionExchange.serverToClient.
 *   It MUST NOT be registered in scsBridge.concept.client.ts.
 *   It IS registered in scsBridge.concept.huirth.ts only.
 *
 * Citation: setSessionsListRelay.quality.ts (Informative companion)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { ScsBridgeSessionEntry } from '../scsBridge.type';

export type ScsBridgeSetSessionsListHuirthBasePayload = {
  scsBridgeSessionsList: ScsBridgeSessionEntry[];
};

export const scsBridgeSetSessionsListHuirthBase = createQualityCardWithPayload<
  { sessionsList: ScsBridgeSessionEntry[] },
  ScsBridgeSetSessionsListHuirthBasePayload
>({
  type: 'Scs Bridge Set Sessions List Huirth Base',
  reducer: (_state, action) => {
    console.log(
      '[SCS-Bridge SBIS-Base-Sessions] setSessionsListHuirthBase reducer · sessionsList length=',
      action.payload.scsBridgeSessionsList?.length ?? 0,
    );
    return {
      sessionsList: action.payload.scsBridgeSessionsList,
    };
  },
  methodCreator: defaultMethodCreator,
});
