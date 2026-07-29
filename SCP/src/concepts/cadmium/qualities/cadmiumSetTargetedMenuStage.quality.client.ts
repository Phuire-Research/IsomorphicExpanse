/**
 * cadmiumSetTargetedMenuStage Quality — Local Reducer (Diamond TRP · 4th STCP)
 *
 * Sets the current Anchor-authored targeted-research Shatterite Menu stage (MenuStage). Full-replace:
 * each Anchor advance writes a new stage to targeted/targeted-menu.json; the targeted-menu watcher
 * relays the parsed stage here. Partial reducer return (only targetedMenuStage · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Cadmium Set Targeted Menu Stage') is the SAME type the
 * cadmiumOkMonitor's targeted-menu watcher broadcasts via webSocketServerAppendToActionQue
 * (mirrors the cadmiumSetMenuStage / cadmiumSetResearchBulletin relay precedent). When CadmiumLanding's
 * page muxium is mounted, the broadcast lands here and re-renders the targeted-research menu.
 *
 * TQNI byte-match anchor — the type string 'Cadmium Set Targeted Menu Stage' MUST match exactly:
 *   (1) this quality `type` · (2) cadmium.muxonomy.ts demometer `type` ·
 *   (3) cadmium.muxonomy.ts actionExchange.serverToClient `actionType` ·
 *   (4) the cadmiumSetTargetedMenuStage.actionCreator the relay config imports (carries this type).
 *
 * Citation: cadmiumSetMenuStage.quality.client.ts (byte-mirror · relay reception bearing).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" · "🚀 Reducer Performance".
 * Citation: TRP-DIAMOND-WGB.md §3 (relay quality · TQNI 6-site map).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CadmiumClientState,
  CadmiumSetTargetedMenuStagePayload,
} from '../cadmium.type';

export type { CadmiumSetTargetedMenuStagePayload };

export const cadmiumSetTargetedMenuStage = createQualityCardWithPayload<
  CadmiumClientState,
  CadmiumSetTargetedMenuStagePayload
>({
  type: 'Cadmium Set Targeted Menu Stage',
  reducer: (state, action) => {
    const { targetedMenuStage } = action.payload;
    // SHORTEST PATH — return only the changed slot, never the whole state.
    return { targetedMenuStage };
  },
  methodCreator: defaultMethodCreator,
});
