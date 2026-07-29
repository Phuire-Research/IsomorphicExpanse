/**
 * setBridgeJsonHuirthBase Quality — Huirth-Only Base State Maintenance
 *
 * SBIS (Stratidian-Base-Informative-State) Pattern
 * Citation: ~/.claude/projects/<project-slug>/memory/feedback_stratidian_base_informative_state.md
 *
 * Base = Huirth state (server source of truth, maintained by file-watcher Lambda events).
 * Informative = Client state (derived, broadcast-synchronized from Base).
 *
 * This quality is the Base-maintenance companion to setBridgeJsonRelay.
 * Dispatched by scsBridgeJsonWatcherPrinciple ALONGSIDE setBridgeJsonRelay at every
 * dispatch site. The relay action routes via actionExchange.serverToClient to Client
 * (Informative path). THIS action runs LOCAL HUIRTH REDUCER ONLY (Base path).
 *
 * Problem diagnosed (Cycle 163 R6 · SBIS):
 *   setBridgeJsonRelay is in actionExchange.serverToClient — it intercepts the action
 *   and routes it to Client before the local Huirth reducer can run. Huirth state
 *   never changes. SMRP selectors never fire. Broadcast never happens.
 *
 * Fix: add a Huirth-only sibling action (this file) with a DISTINCT type string that
 *   is NOT registered in actionExchange.serverToClient. The local Huirth reducer runs
 *   unconditionally. State changes. SMRP selectors observe the change. Broadcast follows.
 *
 * INVARIANT: This action type MUST NOT appear in actionExchange.serverToClient.
 *   It MUST NOT be registered in scsBridge.concept.client.ts.
 *   It IS registered in scsBridge.concept.huirth.ts only.
 *
 * Citation: setBridgeJsonRelay.quality.ts (Informative companion)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { BridgeJsonShape } from '../scsBridge.type';

export type ScsBridgeSetBridgeJsonHuirthBasePayload = {
  scsBridgeBridgeJson: BridgeJsonShape | null;
  serverStartupTime: number | null;
};

export const scsBridgeSetBridgeJsonHuirthBase = createQualityCardWithPayload<
  {
    bridgeJson: BridgeJsonShape | null;
    serverStartupTime: number | null;
  },
  ScsBridgeSetBridgeJsonHuirthBasePayload
>({
  type: 'Scs Bridge Set Bridge Json Huirth Base',
  reducer: (state, action) => {
    console.log(
      '[SCS-Bridge SBIS-Base-Bridge] setBridgeJsonHuirthBase reducer · endpoint=',
      action.payload.scsBridgeBridgeJson?.endpoint,
    );
    return {
      bridgeJson: action.payload.scsBridgeBridgeJson,
      serverStartupTime:
        action.payload.serverStartupTime ?? state.serverStartupTime,
    };
  },
  methodCreator: defaultMethodCreator,
});
