/**
 * isomorphicExpanseSetMenuStage Quality — Local Reducer (GTMS8C · Macro SM · SMSP · IAJW)
 *
 * Sets the current agent-authored Shatterite Menu stage (MenuStage). Full-replace: each
 * agent advance writes a new stage to menu.json; the IAJW menu-watch relays the parsed stage
 * here. Partial reducer return (only menuStage · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('IsomorphicExpanse Set Menu Stage') is the SAME type the
 * isomorphicExpanse menu-watch broadcasts via webSocketServerAppendToActionQue. When IsomorphicExpanseHomeLanding's
 * page muxium is mounted, the broadcast lands here and re-renders the menu.
 *
 * TQNI byte-match anchor — the type string 'IsomorphicExpanse Set Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) isomorphicExpanse.muxonomy.ts demometer `type` ·
 *   (3) isomorphicExpanse.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the isomorphicExpanseSetMenuStage.actionCreator the menu-watch relay imports (carries this type).
 *
 * Citation: cadmiumSetMenuStage.quality.client.ts (relay reception bearing).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.4 (VERBOSE resolution: literal · cadmium precedent).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { IsomorphicExpanseClientState, IsomorphicExpanseSetMenuStagePayload } from '../isomorphicExpanse.type';

export type { IsomorphicExpanseSetMenuStagePayload };

export const isomorphicExpanseSetMenuStage = createQualityCardWithPayload<
  IsomorphicExpanseClientState,
  IsomorphicExpanseSetMenuStagePayload
>({
  // TQNI · = VERBOSE('SetMenuStage') · rename target. The relay-reception type. MUST byte-match:
  // (1) this type · (2) isomorphicExpanse.muxonomy.ts demometer type · (3) actionExchange actionType ·
  // (4) the isomorphicExpanseSetMenuStage.actionCreator the menu-watch relay imports.
  type: 'IsomorphicExpanse Set Menu Stage',
  reducer: (_state, action) => {
    const { menuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { menuStage };
  },
  methodCreator: defaultMethodCreator,
});
