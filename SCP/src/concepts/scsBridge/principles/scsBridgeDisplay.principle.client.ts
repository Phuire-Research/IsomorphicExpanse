/**
 * scsBridgeDisplay Principle — Client Deployment (Cycle 159 D3 · SDPS)
 *
 * Separate Display Principle Sync (SDPS) · per Cycle 159 D3 verdict:
 * dedicated principle owns Vue controller sync · split from scsBridgeConnection
 * principle. Subscribes to scsBridge state via Tier-2 DECK K and pushes deltas
 * into the global controller.
 *
 * Flow:
 *  1. Principle starts on muxium kick
 *  2. Looks up global controller (registered by IslandWrapper)
 *  3. Binds Muxium reference into controller (GPIM)
 *  4. Stage subscribes to relevant scsBridge K refs
 *  5. On any selector change → controller.sync({ ...state })
 *  6. Cleanup clears Muxium binding on principle conclude
 *
 * Citation: CLIENT-MUXIUM-ADOPTION-WAVE2-OCHRE-B-CONTROLLER-BLUEPRINT.md §SDPS
 * Citation: ADMIN_ICP claudeBridgeBarDisplay principle (sync pattern exemplar)
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 */
import type { PrincipleFunction, MuxiumDeck, Muxium, AnyAction } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';
import { getGlobalScsBridgeController } from '../scsBridgeController';

export type ScsBridgeDisplayPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// E12 fix · Cycle 160 R7 Rose Clinical · GPIM binding executed (not just declared)
// Stratimux PrincipleInterface does not provide a muxium reference directly · the
// controller only needs .dispatch + .deck.d.client.d.scsBridge.e access to fire
// scsBridgeTriggerHardTurnOver. We construct a minimal-surface dispatch shim using
// the principle's own nextA + e_ · this satisfies setMuxium(muxium)'s contract while
// living at principle scope (always-on while island mounted · outlives landing navigation).
export const scsBridgeDisplayPrinciple: ScsBridgeDisplayPrinciple = ({ e_, k_, nextA, plan }) => {
  console.log('[SCS-Bridge Display] Principle started · SDPS · binding controller · GPIM');

  // E12 fix · Cycle 160 R7 Rose Clinical · GPIM binding executed (not just declared)
  // Construct a synthetic Muxium-shaped dispatch hook from principle context.
  // The controller's triggerHardTurnOver only accesses .dispatch + .deck.d.client.d.scsBridge.e
  // We provide both via principle's nextA + e_ · this enables Shell-level Turn Over dispatch
  // even when no landing page is mounted (the page-scoped binding gap is closed at principle scope).
  const principleDispatchShim: Muxium<any> = {
    dispatch: (action: AnyAction) => nextA(action),
    deck: {
      d: {
        client: {
          d: {
            scsBridge: { e: e_ },
          },
        },
        scsBridge: { e: e_ },
      },
    },
  } as unknown as Muxium<any>;

  const controller = getGlobalScsBridgeController();
  if (controller) {
    // E12 fix · Bind principle-scoped dispatch hook into controller (GPIM)
    controller.setMuxium(principleDispatchShim);
    console.log('[SCS-Bridge Display] GPIM binding active · controller has principle-scoped dispatch');

    // Initial sync · push current snapshot from this concept's own K refs (Principle Context)
    controller.sync({
      toolbarButtons: k_.toolbarButtons.select(),
      bridgeJson: k_.bridgeJson.select(),
      bridgeStatus: k_.bridgeStatus.select(),
      sessionsList: k_.sessionsList.select(),
      connectionEstablished: k_.connectionEstablished.select(),
      // PP-D4 · Stale-Pong Baseline · Ochre-C §5
      pongReceipt: k_.bridgeJson.select()?.pongReceipt ?? null,
      serverStartupTime: k_.serverStartupTime.select(),
      // D3D Wave-2 · SAES mirror initial sync
      activeEngagedSessionId: k_.activeEngagedSessionId.select(),
      // AMWP sync · Epoch Extension · archiveManifest reactive relay (initial paint)
      archiveManifest: k_.archiveManifest.select(),
      // GITM color-cascade (W4) · Vermillion Focus+Highlight — initial highlight mirror sync.
      highlightTarget: k_.highlightTarget.select(),
    });
  } else {
    console.warn(
      '[SCS-Bridge Display] No global controller registered · IslandWrapper has not mounted · sync deferred',
    );
  }

  // SDPS · separate display principle owns sync · per Cycle 159 D3 verdict.
  // Principle Context: k_ refers to scsBridge's own state (Tier-1 from this principle's view);
  // Tier-2 binding occurs at consumer side (Shell.vue) via global controller.
  // Cycle 159 D1 · Cobalt Wave 2 · ADMIN_ICP CSCM pattern (Continuous Sync).
  const displayPlan = plan('SCS-Bridge Display Sync (Client)', ({ stage }) => [
    stage(
      // Cycle 159 D1 · d.client.d.scsBridge.k.* Tier-2 access via cast (matches scsBridgeConnection pattern)
      ({ d }) => {
        const liveController = getGlobalScsBridgeController();
        if (!liveController) {
          return;
        }
        const scsBridgeCtx = (d as any).client?.d?.scsBridge ?? d.scsBridge;
        // LSSD · Display sync stage entry witness · confirms selector subscription re-fire.
        // Citation: PING-GATE-BLOCKED-DIAGNOSIS-R7-FUCHSIA-CLINICAL.md §1 L9
        const bridgeJsonValue = scsBridgeCtx.k.bridgeJson.select();
        const serverStartupTimeValue = scsBridgeCtx.k.serverStartupTime.select();
        console.log(
          '[SCS-Bridge Display] Sync stage · bridgeJson=',
          !!bridgeJsonValue,
          '· serverStartupTime=',
          serverStartupTimeValue,
          '· pongReceipt=',
          bridgeJsonValue?.pongReceipt?.respondedAt,
        );
        liveController.sync({
          toolbarButtons: scsBridgeCtx.k.toolbarButtons.select(),
          bridgeJson: scsBridgeCtx.k.bridgeJson.select(),
          bridgeStatus: scsBridgeCtx.k.bridgeStatus.select(),
          sessionsList: scsBridgeCtx.k.sessionsList.select(),
          connectionEstablished: scsBridgeCtx.k.connectionEstablished.select(),
          // PP-D4 · Stale-Pong Baseline · Ochre-C §5
          pongReceipt: scsBridgeCtx.k.bridgeJson.select()?.pongReceipt ?? null,
          serverStartupTime: scsBridgeCtx.k.serverStartupTime.select(),
          // D3D Wave-2 · SAES mirror sync
          activeEngagedSessionId: scsBridgeCtx.k.activeEngagedSessionId.select(),
          // AMWP sync · Epoch Extension · archiveManifest reactive relay
          archiveManifest: scsBridgeCtx.k.archiveManifest.select(),
          // GITM color-cascade (W4) · Vermillion Focus+Highlight — highlight mirror sync.
          highlightTarget: scsBridgeCtx.k.highlightTarget.select(),
        });
      },
      {
        selectors: [
          k_.toolbarButtons,
          k_.bridgeJson,
          k_.bridgeStatus,
          k_.sessionsList,
          k_.connectionEstablished,
          // PP-D4 · Stale-Pong Baseline · Ochre-C §5 (pongReceipt derived from bridgeJson)
          k_.serverStartupTime,
          // D3D Wave-2 · SAES selector
          k_.activeEngagedSessionId,
          // AMWP selector · Epoch Extension · triggers re-sync when manifest changes
          k_.archiveManifest,
          // GITM color-cascade (W4) · Vermillion Focus+Highlight — re-sync on highlight change.
          k_.highlightTarget,
        ],
        beat: 0,
      },
    ),
  ]);

  return () => {
    console.log('[SCS-Bridge Display] Principle cleanup · clearing display plan');
    const liveController = getGlobalScsBridgeController();
    if (liveController) {
      liveController.setMuxium(null);
    }
    displayPlan.conclude();
  };
};
