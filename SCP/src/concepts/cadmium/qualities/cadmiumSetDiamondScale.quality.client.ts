/**
 * cadmiumSetDiamondScale Quality — Local Reducer (DSTS · C3-D1)
 *
 * Sets the Cadmium research-depth scale (Initial / Macro / Epoch). Partial reducer return
 * (only diamondScale · Shortest Path Principle). The value rides on the SCS:Diamond FKIS
 * body as `Scale: <value>` — it is Cadmium-owned, NOT a suiteCascade quality.
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" Pattern 2 (Payload Quality).
 * Citation: CADMIUM-C3-OCHRE-BLUEPRINT.md §C3-D1-c.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetDiamondScalePayload,
} from '../cadmium.type';

export type { CadmiumSetDiamondScalePayload };

export const cadmiumSetDiamondScale = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetDiamondScalePayload
>({
  type: 'Cadmium Set Diamond Scale',
  reducer: (state, action) => {
    // Shortest Path: return ONLY the changed property.
    return { diamondScale: action.payload.scale };
  },
  methodCreator: defaultMethodCreator,
});
