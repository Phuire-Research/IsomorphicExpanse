/**
 * suiteCascadeSetActiveCascadeDirectory Quality — Local Reducer (Client) · Band B-5 SDCR + GRID
 *
 * The re-scope setter on the CLIENT face. Sets the single active watched Cascade
 * directory (`activeCascadeDirectory`) so the HCD Home context selector reflects the
 * active context (GRID vs a docked Suite8). DEFAULT = GRID (`GENERAL_CASCADE_DIRECTORY`,
 * the General RI, always the assumed default).
 *
 * SDCR = Suite8-Docking-Cascade-Re-scope. When a Suite8 docks, the active context
 * re-points to `Cascades/8_SUITES/<Name>/Cascades`; un-dock returns to GRID. The
 * authoritative re-arm happens server-side: the Huirth Base setter
 * (suiteCascadeSetActiveCascadeDirectoryHuirthBase) is the action the WCJF watcher
 * reads via selector to TEAR DOWN + RE-ARM chokidar on the new dir's Cascade.json
 * (setStage serialization). This Client setter keeps the UI in sync.
 *
 * SHORTEST PATH: return ONLY the changed property.
 *
 * Citation: suiteCascadeSetCascadeJson.quality.client.ts (local Client setter bearing).
 * Citation: MASTER-DIAMOND-SUITECASCADE-CONCEPT-ASPIRANT.md Band B-5 SDCR + GRID.
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeState,
  SuiteCascadeSetActiveCascadeDirectoryPayload,
} from '../suiteCascade.type';

export type { SuiteCascadeSetActiveCascadeDirectoryPayload };

export const suiteCascadeSetActiveCascadeDirectory = createQualityCardWithPayload<
  SuiteCascadeState,
  SuiteCascadeSetActiveCascadeDirectoryPayload
>({
  type: 'Suite Cascade Set Active Cascade Directory',
  reducer: (state, action) => {
    const { activeCascadeDirectory } = action.payload;
    // SHORTEST PATH — return ONLY the changed property.
    return {
      activeCascadeDirectory,
    };
  },
  methodCreator: defaultMethodCreator,
});
