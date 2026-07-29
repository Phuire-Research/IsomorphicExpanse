/**
 * cadmiumSetMenuStage Quality — Local Reducer (Macro SM · SMSP · IAJW)
 *
 * Sets the current agent-authored Shatterite Menu stage (MenuStage). Full-replace: each
 * agent advance writes a new stage to menu.json; the IAJW watcher relays the parsed stage
 * here. Partial reducer return (only menuStage · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Cadmium Set Menu Stage') is the SAME type the
 * cadmiumOkMonitor's IAJW menu watcher broadcasts via webSocketServerAppendToActionQue
 * (mirrors the cadmiumRegisterArticle / cadmiumSetTopics relay precedent). When
 * CadmiumLanding's page muxium is mounted, the broadcast lands here and re-renders the menu.
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) cadmium.muxonomy.ts demometer `type` ·
 *   (3) cadmium.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the cadmiumSetMenuStage.actionCreator the OkMonitor imports (carries this type).
 *
 * Citation: cadmiumRegisterArticle.quality.client.ts (relay reception bearing).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 * Citation: EPOCH-SR-S2-ORANGE-NAMING.md §Macro SM (SMSP · IAJW).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetMenuStagePayload,
} from '../cadmium.type';

export type { CadmiumSetMenuStagePayload };

export const cadmiumSetMenuStage = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetMenuStagePayload
>({
  type: 'Cadmium Set Menu Stage',
  reducer: (state, action) => {
    const { menuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { menuStage };
  },
  methodCreator: defaultMethodCreator,
});
