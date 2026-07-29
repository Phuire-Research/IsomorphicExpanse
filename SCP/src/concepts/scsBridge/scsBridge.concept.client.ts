/**
 * SCS-Bridge Concept Factory (Client-Side)
 *
 * D2 implementation: real qualities map (5 entries · 1 Diametric Induction +
 * 4 reducers) + connection principle in the principles array.
 *
 * Citation: DIAMOND-TIER-M1-A1-D2.md · Wave E
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles for Successful StratiDECK"
 * Citation: notification.concept.client.ts (Island Architecture exemplar)
 */
import { createConcept } from 'stratimux';
import {
  scsBridgeName,
  type ScsBridgeClientQualities,
} from './scsBridge.type';
import { createScsBridgeClientState } from './scsBridge.state';
import { scsBridgeSendBridgeMessageInduction } from './qualities/sendBridgeMessage.quality.client.diameter';
import { scsBridgeTriggerHardTurnOverInduction } from './qualities/triggerHardTurnOver.quality.client.diameter';
import { scsBridgeSetBridgeStatus } from './qualities/setBridgeStatus.quality.client';
import { scsBridgeSetBarVisible } from './qualities/setBarVisible.quality.client';
import { scsBridgeSetBarExpanded } from './qualities/setBarExpanded.quality.client';
import { scsBridgeSetActiveSubPage } from './qualities/setActiveSubPage.quality.client';
import { scsBridgeSetRenderSettings } from './qualities/setRenderSettings.quality.client';
// GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight reducer (relay + auto-reset)
import { scsBridgeSetHighlightTarget } from './qualities/setHighlightTarget.quality.client';
import { scsBridgeSetInstallMenuOpen } from './qualities/setInstallMenuOpen.quality.client';
import { scsBridgeAdvanceInstallWizardStep } from './qualities/advanceInstallWizardStep.quality.client';
import { scsBridgeSetInstalledScps } from './qualities/setInstalledScps.quality.client';
import { scsBridgeRecomputeMainMenuMirror } from './qualities/recomputeMainMenuMirror.quality.client';
import { scsBridgeSetWizardConceptNameDraft } from './qualities/setWizardConceptNameDraft.quality.client';
import { scsBridgeSetCadmiumTutorialJoin } from './qualities/setCadmiumTutorialJoin.quality.client';
import { scsBridgeRegisterToolbarButton } from './qualities/registerToolbarButton.quality.client';
import { scsBridgeUnregisterToolbarButton } from './qualities/unregisterToolbarButton.quality.client';
import { scsBridgeSetToolbarButtonEnabled } from './qualities/setToolbarButtonEnabled.quality.client';
import { scsBridgeBootDefaultToolbar } from './qualities/bootDefaultToolbar.quality.client';
import { scsBridgeEnableSendMessageToolbar } from './qualities/enableSendMessageToolbar.quality.client';
// Cycle 155 · BJDP · JSON Relay setters (dual-deployment · received via actionExchange.serverToClient)
import { scsBridgeSetBridgeJsonRelay } from './qualities/setBridgeJsonRelay.quality';
import { scsBridgeSetSessionsListRelay } from './qualities/setSessionsListRelay.quality';
// SE · Epoch Extension · ASMQ relay (received via actionExchange.serverToClient · UFRT full-replace).
// Base is Huirth-only (SBIS invariant · NOT registered client-side).
import { scsBridgeSetArchiveManifestRelay } from './qualities/setArchiveManifestRelay.quality';
// D3F Diamond B · transcript relay (dual-deployment · received via actionExchange.serverToClient)
import { scsBridgeSetSessionTranscriptDataRelay } from './qualities/scsBridgeSetSessionTranscriptDataRelay.quality';
// D3D Wave-2 · SAES + CMIA-Spawn/Engage trigger reducers (R3-C §S1-S3)
import { scsBridgeSetActiveEngagedSessionId } from './qualities/setActiveEngagedSessionId.quality.client';
import { scsBridgeSetPendingSpawnScpName } from './qualities/setPendingSpawnScpName.quality.client';
// C1-D2 · SBST · CMIA-Spawn-Suite8 trigger reducer
import { scsBridgeSetPendingSpawnSuite8Name } from './qualities/setPendingSpawnSuite8Name.quality.client';
// MD-9 · D-MC-3 · Per-Instance Model Control · model-selection reducer
import { scsBridgeSetPendingSpawnModel } from './qualities/setPendingSpawnModel.quality.client';
import { scsBridgeSetPendingEngageSessionId } from './qualities/setPendingEngageSessionId.quality.client';
// D3RM-E · CMIA-Focus trigger reducer
import { scsBridgeSetPendingFocusSessionId } from './qualities/setPendingFocusSessionId.quality.client';
// D3RM-G · CBSE chat trigger reducer · compound { sessionId, message } | null
import { scsBridgeSetPendingChatMessage } from './qualities/setPendingChatMessage.quality.client';
// GITM PAGE · action-pipe trigger reducer · { tool, arguments } | null
import { scsBridgeSetGitmPendingAction } from './qualities/scsBridgeSetGitmPendingAction.quality.client';
import { scsBridgeConnectionPrinciple } from './principles/scsBridgeConnection.principle.client';
import { scsBridgeDisplayPrinciple } from './principles/scsBridgeDisplay.principle.client';
// PP-D4 · Option ζ · one-shot fetch principle · Ochre-C §3
import { scsBridgePingPrinciple } from './principles/scsBridgePing.principle.client';
// D3D Wave-2 · CMIA-Spawn + CMIA-Engage principles (Client-as-MCP-caller · shared-function discipline)
import { scsBridgeInvokeSessionSpawnPrinciple } from './principles/scsBridgeInvokeSessionSpawn.principle.client';
import { scsBridgeInvokeSessionEngagePrinciple } from './principles/scsBridgeInvokeSessionEngage.principle.client';
// D3RM-E · CMIA-Focus principle (Client-as-MCP-caller · ASFP shared with future TUI hotkey)
import { scsBridgeInvokeSessionFocusPrinciple } from './principles/scsBridgeInvokeSessionFocus.principle.client';
// D3RM-G · CBSE chat principle · CCDR-disciplined (WSVN + RBDOS + ACPF + KFAF + IGPAFP + DSAB)
import { scsBridgeInvokeSessionChatPrinciple } from './principles/scsBridgeInvokeSessionChat.principle.client';
// GITM PAGE · action-pipe principle (Client-as-MCP-caller · ACPF + DSAB + RBDOS + WSVN)
import { scsBridgeGitmActionPrinciple } from './principles/scsBridgeGitmAction.principle.client';

const scsBridgeQualities: ScsBridgeClientQualities = {
  scsBridgeSendBridgeMessage: scsBridgeSendBridgeMessageInduction,
  scsBridgeTriggerHardTurnOver: scsBridgeTriggerHardTurnOverInduction,
  scsBridgeSetBridgeStatus,
  scsBridgeSetBarVisible,
  scsBridgeSetBarExpanded,
  scsBridgeSetActiveSubPage,
  scsBridgeSetRenderSettings,
  // GITM color-cascade (W4) · Vermillion Focus+Highlight — the transient highlight reducer
  scsBridgeSetHighlightTarget,
  // M2-A1-D1 · Install Menu Foundation + AJMI Mirror consumer
  scsBridgeSetInstallMenuOpen,
  scsBridgeAdvanceInstallWizardStep,
  scsBridgeSetInstalledScps,
  scsBridgeRecomputeMainMenuMirror,
  // M2-A1-D2 · Naming Wizard live validation
  scsBridgeSetWizardConceptNameDraft,
  // M2-A1-D5 · AJMI Cadmium Tutorial Join Point
  scsBridgeSetCadmiumTutorialJoin,
  // M2-A2-D1 · Toolbar registration (TaskBar pattern port)
  scsBridgeRegisterToolbarButton,
  scsBridgeUnregisterToolbarButton,
  scsBridgeSetToolbarButtonEnabled,
  // M2-A2-D2 · Boot default toolbar (Turn Over refold + 3 other reserved buttons)
  scsBridgeBootDefaultToolbar,
  // M2-A2-D3 · Enable send-message toolbar entry post-handshake
  scsBridgeEnableSendMessageToolbar,
  // Cycle 155 · BJDP · JSON Relay setters (received via Path B broadcast)
  scsBridgeSetBridgeJsonRelay,
  scsBridgeSetSessionsListRelay,
  // SE · Epoch Extension · ASMQ relay (received via actionExchange.serverToClient · UFRT full-replace)
  scsBridgeSetArchiveManifestRelay,
  // D3F Diamond B · transcript relay (received via actionExchange.serverToClient)
  scsBridgeSetSessionTranscriptDataRelay,
  // D3D Wave-2 · SAES + CMIA-Spawn/Engage trigger reducers
  scsBridgeSetActiveEngagedSessionId,
  scsBridgeSetPendingSpawnScpName,
  // C1-D2 · SBST · CMIA-Spawn-Suite8 trigger reducer
  scsBridgeSetPendingSpawnSuite8Name,
  // MD-9 · D-MC-3 · Per-Instance Model Control · model-selection reducer
  scsBridgeSetPendingSpawnModel,
  scsBridgeSetPendingEngageSessionId,
  // D3RM-E · CMIA-Focus trigger reducer
  scsBridgeSetPendingFocusSessionId,
  // D3RM-G · CBSE chat trigger reducer · compound { sessionId, message } | null
  scsBridgeSetPendingChatMessage,
  // GITM PAGE · action-pipe trigger reducer · { tool, arguments } | null
  scsBridgeSetGitmPendingAction,
};

export const createScsBridgeClientConcept = () => {
  return createConcept(
    scsBridgeName,
    createScsBridgeClientState(),
    scsBridgeQualities,
    [
      scsBridgeConnectionPrinciple,
      scsBridgeDisplayPrinciple,
      scsBridgePingPrinciple,
      // D3D Wave-2 · CMIA-Spawn + CMIA-Engage trigger-field watchers
      scsBridgeInvokeSessionSpawnPrinciple,
      scsBridgeInvokeSessionEngagePrinciple,
      // D3RM-E · CMIA-Focus trigger-field watcher
      scsBridgeInvokeSessionFocusPrinciple,
      // D3RM-G · CBSE chat trigger-field watcher (CCDR-disciplined)
      scsBridgeInvokeSessionChatPrinciple,
      // GITM PAGE · action-pipe trigger-field watcher
      scsBridgeGitmActionPrinciple,
    ],
  );
};
