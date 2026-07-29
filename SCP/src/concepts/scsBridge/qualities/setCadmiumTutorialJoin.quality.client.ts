/**
 * setCadmiumTutorialJoin Quality — AJMI Extension 3 Cadmium Join (M2-A1-D5)
 *
 * State transition reducer for the AJMI Extension 3 Cadmium Tutorial Join
 * Point. After a successful SABO spawn, the Managing Instance dispatches
 * this quality with `{ kind: 'pending', scpName }` to arm the post-install
 * handshake. Macro 3 Cadmium Researcher then reads `pending` → guides user
 * into a Looped Macro Diamond → fills `{ kind: 'active', loopedMacroId }`.
 *
 * Pure replace-state reducer. The discriminated union shape carries its
 * own state shape (no derivation needed).
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D5 + §AJMI Extension 3
 * Citation: scsBridge.type.ts CadmiumTutorialJoinState definition
 * Citation: scpSpawn.model.ts deriveCadmiumJoinPending helper
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetCadmiumTutorialJoinPayload,
} from '../scsBridge.type';

export type { ScsBridgeSetCadmiumTutorialJoinPayload };

export const scsBridgeSetCadmiumTutorialJoin = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetCadmiumTutorialJoinPayload
>({
  type: 'Scs Bridge Set Cadmium Tutorial Join',
  reducer: (_state, action) => {
    return {
      cadmiumTutorialJoin: action.payload.joinState,
    };
  },
  methodCreator: defaultMethodCreator,
});
