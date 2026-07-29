/**
 * gitmSetUpdateResolvedHuirthBase Quality — Huirth-side Base Reducer (STCP · SBIS Base · D-U4.2)
 *
 * Writes the current scp-update-resolved.<name>.json body into the gitm Demometer's OWN Huirth
 * (Base) state — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by the
 * gitmUpdateWatcher's SBIS path (Base FIRST, then the relay 'Gitm Set Update Resolved').
 * Full-replace; partial reducer return (only updateResolved · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'Gitm Set Update Resolved Huirth Base' is DISTINCT
 * from the relay's 'Gitm Set Update Resolved' and MUST:
 *   (1) match this quality `type` ·
 *   (2) match gitm.concept.huirth.ts GitmHuirthQualities mapping ·
 *   (3) match gitm.type.ts GitmHuirthQualities deck-key ·
 *   (4) INVARIANT — be ABSENT from gitm.muxonomy.ts actionExchange.serverToClient
 *       (Huirth-only · local reducer) AND ABSENT from gitm.concept.client.ts.
 *
 * Note: the Base state slot is `UpdateResolvedShape | null` (null IS the sentinel here · the
 * STCP emptyPayload:null path) — so the null payload passes through unchanged (no non-null
 * fallback · the resolved body has no typed empty shape).
 *
 * Citation: gitmSetGitmJsonHuirthBase.quality.huirth.ts (Huirth-only Base · SBIS precedent · clone).
 * Citation: SCP-UPD-D-U4-WGB.md §◆ D-U4.2 gitmSetUpdateResolvedHuirthBase.
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GitmHuirthState,
} from '../gitm.type';
import type { GitmSetUpdateResolvedPayload } from '../gitmUpdate.type';

export type { GitmSetUpdateResolvedPayload };

export const gitmSetUpdateResolvedHuirthBase = createQualityCardWithPayload<
  GitmHuirthState,
  GitmSetUpdateResolvedPayload
>({
  // TQNI · DISTINCT from the relay's 'Gitm Set Update Resolved'. MUST NOT appear in
  // gitm.muxonomy.ts actionExchange.serverToClient (Huirth-only · local reducer).
  type: 'Gitm Set Update Resolved Huirth Base',
  reducer: (_state, action) => {
    // SHORTEST PATH — return only the changed slot, never the whole state. null payload
    // (absent/parse-fail) passes through as null (the resolved body's sentinel · KeyedSelector-safe:
    // the slot is `UpdateResolvedShape | null`, ALWAYS present).
    const { updateResolved } = action.payload;
    return { updateResolved };
  },
  methodCreator: defaultMethodCreator,
});
