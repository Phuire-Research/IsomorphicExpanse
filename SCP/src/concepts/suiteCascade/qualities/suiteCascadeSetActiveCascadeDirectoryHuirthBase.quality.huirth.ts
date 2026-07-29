/**
 * suiteCascadeSetActiveCascadeDirectoryHuirthBase Quality — Huirth-Only Base · Band B-5 SDCR + GRID
 *
 * The RE-SCOPE TRIGGER. This Huirth-only Base action runs the LOCAL HUIRTH REDUCER,
 * writing `activeCascadeDirectory` server-side. The WCJF watcher principle (B-4)
 * is selector-bound to `activeCascadeDirectory` — when this reducer changes it, the
 * watcher's re-arm stage fires: it TEARS DOWN the current chokidar watcher + debounce
 * timer (B-4 cleanup order: timer → watcher) and RE-ARMS on the new directory's
 * `Cascade.json`, then reloads (setStage serialization · no watcher-handle leaks).
 *
 * SDCR mechanism: dispatch this with a Suite8's `Cascades/8_SUITES/<Name>/Cascades`
 * dir to dock; dispatch with `GENERAL_CASCADE_DIRECTORY` to un-dock (GRID restore).
 * The General RI is NEVER destroyed — only the active watch re-points.
 *
 * INVARIANT (SBIS): this action type MUST NOT appear in actionExchange.serverToClient
 *   and MUST NOT be registered in the Client concept face. It IS the server-side
 *   re-scope substrate; the Client mirror flows via the Relay companion.
 *
 * SHORTEST PATH: return ONLY the changed property.
 *
 * Citation: suiteCascadeSetCascadeHuirthBase.quality.huirth.ts (SBIS Base bearing).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-5 SDCR + GRID.
 * Citation: feedback_stratidian_base_informative_state.md.
 * Citation: STRATIMUX-REFERENCE.md "🔄 Synchronizing Principle Pattern with setStage".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeSetActiveCascadeDirectoryHuirthBasePayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetActiveCascadeDirectoryHuirthBasePayload };

export const suiteCascadeSetActiveCascadeDirectoryHuirthBase = createQualityCardWithPayload<
  SuiteCascadeHuirthState,
  SuiteCascadeSetActiveCascadeDirectoryHuirthBasePayload
>({
  type: 'Suite Cascade Set Active Cascade Directory Huirth Base',
  reducer: (state, action) => {
    const { activeCascadeDirectory } = action.payload;
    // SHORTEST PATH — return ONLY the changed property. The watcher's selector
    // ([k_.activeCascadeDirectory]) observes this change and re-arms.
    return {
      activeCascadeDirectory,
    };
  },
  methodCreator: defaultMethodCreator,
});
