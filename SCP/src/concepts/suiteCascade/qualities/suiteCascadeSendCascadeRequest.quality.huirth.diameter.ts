/**
 * suiteCascadeSendCascadeRequest Quality — Huirth Real (Diametric Real)
 *
 * SCRR (Sentinel-Client-Request-Response) server leg — mirrors the proven
 * sendBridgeMessage.quality.huirth.diameter.ts SCRR branch exactly.
 *
 * WHY: The client's suiteCascadeRequestOnLoad principle (client SCRR leg) sends a
 * sentinel action of type 'Suite Cascade Send Cascade Request' over WebSocket. Without this
 * Huirth Real, that action arrives server-side and is silently dropped (no matching
 * quality in HuirthQualities — the E11 Partial-Diametric-Pattern failure mode).
 *
 * HOW: This Real detects the incoming sentinel, reads the current Huirth cascades
 * state, and dispatches suiteCascadeSetCascadeRelay + suiteCascadeSetActiveCascadeFilesRelay
 * for every cascade entry via webSocketServerAppendToActionQue (BROADCAST). The two paths
 * converge on the same relay qualities the BOCR and SMRP use — idempotent delivery.
 *
 * Routing decision: BROADCAST (no targetConnectionId). The sentinel arrives as a plain
 * action without strategy wrap (no clientStateKey available). Broadcasting via
 * webSocketServerAppendToActionQue with no routing key broadcasts to ALL connected
 * clients. Already-populated clients no-op via selector deduplication (cascades Record
 * is keyed; same keys/values → no state change → subscription silent).
 *
 * Pattern: Diametric Real (createQualityCardWithPayload + createMethodWithConcepts)
 *   — same pattern as sendBridgeMessage.quality.huirth.diameter.ts SCRR branch.
 * Type-string source of truth: 'Suite Cascade Send Cascade Request' (Verbose Split · exact
 *   match to client action + actionExchange.clientToServer entry · AESR pattern).
 *
 * Citation: sendBridgeMessage.quality.huirth.diameter.ts (SCRR branch · canonical exemplar)
 * Citation: suiteCascadeBackfillOnConnect.principle.huirth.ts (BOCR · TSPB · same relay payload)
 * Citation: suiteCascadeRequestOnLoad.principle.client.ts (client SCRR leg · sentinel emit)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices"
 */
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumTimeOut,
  nullReducer,
  selectPayload,
  selectState,
  strategySuccess,
  type Concepts,
  type Action,
  type AnyAction,
} from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeSetCascadeRelayPayload,
  SuiteCascadeSetActiveCascadeFilesRelayPayload,
  Cascade,
} from '../suiteCascade.type';
import { suiteCascadeName } from '../suiteCascade.type';
import { SUITE_CASCADE_REQUEST_SENTINEL } from '../principles/suiteCascadeRequestOnLoad.principle.client';

type SuiteCascadeSendCascadeRequestPayload = {
  sentinel?: string;
};

type SuiteCascadeSendCascadeRequestHuirthDeck = {
  suiteCascade: {
    k: {
      cascades: { select: () => Record<string, Cascade> };
    };
    e: {
      suiteCascadeSetCascadeRelay: (payload: SuiteCascadeSetCascadeRelayPayload) => Action;
      suiteCascadeSetActiveCascadeFilesRelay: (payload: SuiteCascadeSetActiveCascadeFilesRelayPayload) => Action;
    };
  };
  webSocketServer: {
    e: {
      webSocketServerAppendToActionQue: (payload: {
        actionQue: AnyAction[];
        targetClientStateKey?: string;
        targetConnectionId?: string;
      }) => Action;
    };
  };
};

export const suiteCascadeSendCascadeRequestHuirth = createQualityCardWithPayload<
  SuiteCascadeHuirthState,
  SuiteCascadeSendCascadeRequestPayload
>({
  type: 'Suite Cascade Send Cascade Request',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action, concepts_, deck }) => {
      const huirthDeck = deck as unknown as SuiteCascadeSendCascadeRequestHuirthDeck;
      const payload = (selectPayload<SuiteCascadeSendCascadeRequestPayload>(action) ?? {}) as SuiteCascadeSendCascadeRequestPayload;
      const sentinel = payload?.sentinel ?? '';

      if (sentinel === SUITE_CASCADE_REQUEST_SENTINEL) {
        console.log(
          '[SuiteCascade SCRR] Sentinel __suite_cascade_cascade_request__ received · initiating Backfill-On-Request',
        );

        // LIVE-STATE READ (race fix) — the deck snapshot (huirthDeck.suiteCascade.k.cascades)
        // can be read BEFORE the fire-and-forget Extended auto-registration BOOT sweep lands its
        // nextA Base dispatches, so a client requesting-on-load early receives ONLY the General
        // root cascade and every registered Extra starves. selectState reads the LIVE Huirth
        // muxium state at request time (mirrors the sibling scsBridge SCRR reading fresh from
        // disk) so EVERY registered cascade's state + activeCascadeFiles is relayed, reaching
        // clients that connect anor request AFTER boot. NEVER throws — absent state → {} → skip.
        const huirthState = selectState<SuiteCascadeHuirthState>(concepts_ as Concepts, suiteCascadeName);
        const cascades = (huirthState?.cascades ?? {}) as Record<string, Cascade>;
        const cascadeEntries = Object.values(cascades).filter(Boolean) as Cascade[];

        if (cascadeEntries.length === 0) {
          console.log('[SuiteCascade SCRR] No cascades in Huirth state yet · skipping response');
          if (action.strategy) {
            return strategySuccess(action.strategy);
          }
          return action as unknown as Action;
        }

        console.log(
          '[SuiteCascade SCRR] Building relay · cascadeCount=',
          cascadeEntries.length,
        );

        // PAYLOAD TELEMETRY (Band1-L3) — the exact NAMES + per-name activeCascadeFiles counts
        // being relayed. Never throws (map over already-validated Cascade[] · counts default 0).
        const relayManifest = cascadeEntries
          .map((c) => `${c.name}:${(c.activeCascadeFiles ?? []).length}`)
          .join(', ');
        console.log('[SuiteCascade SCRR] Relay manifest (name:fileCount) ·', relayManifest);

        const relayActions: AnyAction[] = [];
        for (const cascade of cascadeEntries) {
          relayActions.push(
            huirthDeck.suiteCascade.e.suiteCascadeSetCascadeRelay({
              name: cascade.name,
              cascade,
            }),
          );
          relayActions.push(
            huirthDeck.suiteCascade.e.suiteCascadeSetActiveCascadeFilesRelay({
              name: cascade.name,
              activeCascadeFiles: cascade.activeCascadeFiles ?? [],
            }),
          );
        }

        muxiumTimeOut(
          concepts_ as Concepts,
          () =>
            huirthDeck.webSocketServer.e.webSocketServerAppendToActionQue({
              actionQue: relayActions,
            }),
          30,
        );
      } else {
        console.log('[SuiteCascade Huirth] suiteCascadeSendCascadeRequest received non-sentinel message:', sentinel);
      }

      if (action.strategy) {
        return strategySuccess(action.strategy);
      }
      return action as unknown as Action;
    }),
});
