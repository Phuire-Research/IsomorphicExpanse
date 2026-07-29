/**
 * sendBridgeMessage Quality — Client Diameter (Induction · ClientToServer)
 *
 * Single-message-relay junction to the SCP bridge runtime. Diametric Induction
 * pattern: dispatch routes payload through actionQue → webSocketClient principle
 * sends via WebSocket → server-side bridge runtime executes the matching
 * 'Scs Bridge Send Bridge Message' quality by type-string lookup.
 *
 * Type-string source of truth: D1's actionExchange declaration in
 * scsBridge.muxonomy.ts. This file must match EXACTLY ('Scs Bridge Send
 * Bridge Message' · Verbose Split).
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave B
 * Citation: muxonomy.model.ts createInductionQualityCardWithPayload
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 */
import { createInductionQualityCardWithPayload } from '../../muxonomy/muxonomy.model';
import type {
  ScsBridgeClientState,
  ScsBridgeSendBridgeMessagePayload,
} from '../scsBridge.type';

export type { ScsBridgeSendBridgeMessagePayload };

export const scsBridgeSendBridgeMessageInduction = createInductionQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSendBridgeMessagePayload
>('Scs Bridge Send Bridge Message');
