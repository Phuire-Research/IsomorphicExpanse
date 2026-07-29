/**
 * scsBridgeConnection Principle — Client Deployment
 *
 * Initial-connection principle for the SCS-Bridge concept. On muxium kick,
 * fires a single 'request initial status' Diametric Induction toward the
 * bridge runtime to elicit the first 'Scs Bridge Set Bridge Status' response.
 * Once connectionEstablished flips to true (via setBridgeStatus reducer on
 * first non-empty payload), the principle passively monitors.
 *
 * CESA Pattern: connectionEstablished is the Selector Anchor. Initial state
 * is false; first non-empty server status flips it true; principle stage
 * detects the flip and stops dispatching further initial-request actions.
 *
 * Sentinel payload: `__scs_bridge_status_request__` — placeholder protocol
 * token. D3+ will replace with a structured request shape when the full
 * bridge protocol lands.
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave C
 * Citation: notificationDisplay.principle.client.ts (selector + throttle:0 + beat:3 exemplar)
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 */
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

// Cycle 159 D1 · IUPA Adoption · ScsBridgeDeck consumed via ClientDeck composition.
// The principle type retains the local muxified deck contract (MuxiumDeck & ScsBridgeDeck)
// because k_/d_ continue to refer to scsBridge's own concept context; only the dispatch path
// through plan() needs the Tier-2 composition (d.client.d.scsBridge.*).
export type ScsBridgeConnectionPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

const INITIAL_STATUS_REQUEST_SENTINEL = '__scs_bridge_status_request__';

export const scsBridgeConnectionPrinciple: ScsBridgeConnectionPrinciple = ({ d_, k_, plan }) => {
  console.log('[SCS-Bridge Connection] Principle started');

  const connectionPlan = plan('SCS-Bridge Connection (Client)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        const established = k_.connectionEstablished.select();

        if (established) {
          dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
          return;
        }

        console.log('[SCS-Bridge Connection] Dispatching initial-status request');
        // Cycle 159 D1 · IUPA · Tier-2 DECK K path via ClientDeck composition
        dispatch(
          (d as any).client.d.scsBridge.e.scsBridgeSendBridgeMessage({
            message: INITIAL_STATUS_REQUEST_SENTINEL,
          }),
          { throttle: 0 },
        );
      },
      {
        selectors: [k_.connectionEstablished],
        beat: 3,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge Connection] Principle cleanup');
    connectionPlan.conclude();
  };
};
