/**
 * gitmSetGitmJsonHuirthBase Quality — Huirth-side Base Reducer (STCP · SBIS Base)
 *
 * Writes the current gitm.json snapshot into the gitm Demometer's OWN Huirth (Base)
 * state — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by the
 * helper's SBIS path (Base FIRST, then the relay 'Gitm Set Gitm Json'). Full-replace;
 * partial reducer return (only gitmJson · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Gitm Set Gitm Json Huirth Base' is DISTINCT
 * from the relay's 'Gitm Set Gitm Json' and MUST:
 *   (1) match this quality `type` ·
 *   (2) match gitm.concept.huirth.ts GitmHuirthQualities mapping ·
 *   (3) match gitm.type.ts GitmHuirthQualities deck-key ·
 *   (4) INVARIANT — be ABSENT from gitm.muxonomy.ts actionExchange.serverToClient
 *       (Huirth-only · local reducer) AND ABSENT from gitm.concept.client.ts.
 *
 * Note: the seeded Base state is GitmJsonShape (non-optional sentinel) but the relay
 * payload is `GitmJsonShape | null` (null on absent/parse-fail). When the payload is
 * null the reducer falls back to the empty sentinel to preserve KeyedSelector discipline.
 *
 * Citation: cadmiumSetMenuStageHuirthBase.quality.huirth.ts (Huirth-only Base · SBIS precedent).
 * Citation: GITM-SCP-S3-YELLOW-BLUEPRINT.md §W2 gitmSetGitmJsonHuirthBase.
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GitmHuirthState,
  GitmSetGitmJsonHuirthBasePayload,
} from '../gitm.type';
import { GITM_JSON_EMPTY_SENTINEL } from '../gitm.state.huirth';

export type { GitmSetGitmJsonHuirthBasePayload };

export const gitmSetGitmJsonHuirthBase = createQualityCardWithPayload<
  GitmHuirthState,
  GitmSetGitmJsonHuirthBasePayload
>({
  // TQNI · DISTINCT from the relay's 'Gitm Set Gitm Json'. MUST NOT appear in
  // gitm.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Gitm Set Gitm Json Huirth Base',
  reducer: (_state, action) => {
    // SHORTEST PATH — return only the changed slot, never the whole state. Null payload
    // (absent/parse-fail) falls back to the empty sentinel (KeyedSelector discipline).
    const gitmJson = action.payload.gitmJson ?? GITM_JSON_EMPTY_SENTINEL;
    return { gitmJson };
  },
  methodCreator: defaultMethodCreator,
});
