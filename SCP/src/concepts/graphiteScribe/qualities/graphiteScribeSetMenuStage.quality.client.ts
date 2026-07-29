/**
 * graphiteScribeSetMenuStage Quality — Local Reducer (GTMS8C · Macro SM · SMSP · IAJW)
 *
 * Sets the current agent-authored Shatterite Menu stage (MenuStage). Full-replace: each
 * agent advance writes a new stage to menu.json; the IAJW menu-watch relays the parsed stage
 * here. Partial reducer return (only menuStage · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('GraphiteScribe Set Menu Stage') is the SAME type the
 * graphiteScribe menu-watch broadcasts via webSocketServerAppendToActionQue. When GraphiteScribeHomeLanding's
 * page muxium is mounted, the broadcast lands here and re-renders the menu.
 *
 * TQNI byte-match anchor — the type string 'GraphiteScribe Set Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) graphiteScribe.muxonomy.ts demometer `type` ·
 *   (3) graphiteScribe.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the graphiteScribeSetMenuStage.actionCreator the menu-watch relay imports (carries this type).
 *
 * Citation: cadmiumSetMenuStage.quality.client.ts (relay reception bearing).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.4 (VERBOSE resolution: literal · cadmium precedent).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { GraphiteScribeClientState, GraphiteScribeSetMenuStagePayload } from '../graphiteScribe.type';

export type { GraphiteScribeSetMenuStagePayload };

export const graphiteScribeSetMenuStage = createQualityCardWithPayload<
  GraphiteScribeClientState,
  GraphiteScribeSetMenuStagePayload
>({
  // TQNI · = VERBOSE('SetMenuStage') · rename target. The relay-reception type. MUST byte-match:
  // (1) this type · (2) graphiteScribe.muxonomy.ts demometer type · (3) actionExchange actionType ·
  // (4) the graphiteScribeSetMenuStage.actionCreator the menu-watch relay imports.
  type: 'GraphiteScribe Set Menu Stage',
  reducer: (_state, action) => {
    const { menuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { menuStage };
  },
  methodCreator: defaultMethodCreator,
});
