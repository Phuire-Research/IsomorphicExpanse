/**
 * triggerHardTurnOver Quality — Client Diameter (Induction · ClientToServer)
 *
 * Hard Turn Over signal (Pattern G · SCP-S11 spec from Refine-Macro). User
 * clicks Pewter Turn Over Button → CGDA 2-click confirmation → this Induction
 * dispatches a `'Scs Bridge Trigger Hard Turn Over'` action with empty payload
 * via actionQue. Server-side handler is implemented in M1-Final (final cleanup
 * sub-Diamond of Macro 1) per ClientState-Preservation + Hard Turn Over Escape
 * pattern.
 *
 * D6 ships the CLIENT SURFACE only · server-side mechanism is M1-Final scope.
 *
 * Citation: DIAMOND-TIER-M1-A1-D6.md · Wave B
 * Citation: muxonomy.model.ts createInductionQualityCardWithPayload
 * Citation: Refine-Macro Cycle 58 SCP-S11 spec
 */
import { createInductionQualityCardWithPayload } from '../../muxonomy/muxonomy.model';
import type { ScsBridgeClientState, ScsBridgeTriggerHardTurnOverPayload } from '../scsBridge.type';

export const scsBridgeTriggerHardTurnOverInduction = createInductionQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeTriggerHardTurnOverPayload
>('Scs Bridge Trigger Hard Turn Over');
