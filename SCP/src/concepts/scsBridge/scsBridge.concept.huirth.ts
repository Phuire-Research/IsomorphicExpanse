/**
 * SCS-Bridge Concept (Huirth Deployment) — Cycle 155 Enrichment
 *
 * Server-side companion to scsBridge.concept.client.ts. Registers:
 *  - Trigger Hard Turn Over Diametric Real (M1-Final · existing)
 *  - JSON Relay setter qualities (Cycle 155 · BJDP)
 *  - JSON Watcher Principle that reads bridge.json + sessions.json from
 *    ./Cascades/Bridge/ and dispatches the relay setters on filesystem change
 *    via Path B actionExchange.serverToClient broadcast.
 *
 * State: typed ScsBridgeHuirthState via createScsBridgeHuirthState() factory.
 *   Previous M1-Final state was `Record<string, never>` (placeholder) —
 *   replaced as part of Foundation A Wave 3 (Cycle 155 BJDP enrichment).
 *
 * Principles: scsBridgeJsonWatcherPrinciple registered in createConcept's
 *   third arg (Stratimux principles array).
 *
 * Citation: FOUNDATION-A consolidated RD §6 File 7
 * Citation: notification/notification.concept.huirth.ts (broadcast principle
 *   registration exemplar)
 */
import { createConcept } from 'stratimux';
import { createScsBridgeHuirthState } from './scsBridge.state';
import type { ScsBridgeHuirthQualities } from './scsBridge.type';
import { scsBridgeTriggerHardTurnOverHuirth } from './qualities/triggerHardTurnOver.quality.huirth.diameter';
import { scsBridgeSendBridgeMessageHuirth } from './qualities/sendBridgeMessage.quality.huirth.diameter';
import { scsBridgeSetBridgeJsonRelay } from './qualities/setBridgeJsonRelay.quality';
import { scsBridgeSetSessionsListRelay } from './qualities/setSessionsListRelay.quality';
// SE · Epoch Extension · ASMQ · archive-manifest Base (Huirth-only) + Relay (serverToClient)
import { scsBridgeSetArchiveManifestHuirthBase } from './qualities/setArchiveManifestHuirthBase.quality';
import { scsBridgeSetArchiveManifestRelay } from './qualities/setArchiveManifestRelay.quality';
// PP-D4 · Stale-Pong Baseline · captures huirth boot timestamp · Cycle 160
import { scsBridgeSetServerStartupTime } from './qualities/setServerStartupTime.quality.huirth';
// SBIS Base maintenance qualities (Cycle 163 R6 · Huirth-only · NOT in actionExchange)
import { scsBridgeSetBridgeJsonHuirthBase } from './qualities/setBridgeJsonHuirthBase.quality';
import { scsBridgeSetSessionsListHuirthBase } from './qualities/setSessionsListHuirthBase.quality';
import { scsBridgeJsonWatcherPrinciple } from './principles/scsBridgeJsonWatcher.principle.huirth';
// BO-2-G · the field-triggered turn-over watcher (the layered watcher's SCP-side half).
import { scsBridgeTurnOverFieldWatcherPrinciple } from './principles/scsBridgeTurnOverFieldWatcher.principle.huirth';
// GITM #639 · the gitm.json SBIS pair + sibling watcher MIGRATED → src/concepts/gitm/
// (the gitm Huirth BASE concept). scsBridge retains ONLY the gitmPendingAction action-pipe.
// D3F Diamond B · SSTE transcript watcher quality registrations (Cycle 164 R3)
import { scsBridgeReadSessionTranscript } from './qualities/scsBridgeReadSessionTranscript.quality.huirth';
import { scsBridgeSetSessionTranscriptDataHuirthBase } from './qualities/scsBridgeSetSessionTranscriptDataHuirthBase.quality';
import { scsBridgeSetSessionTranscriptDataRelay } from './qualities/scsBridgeSetSessionTranscriptDataRelay.quality';
import { scsBridgeSessionTranscriptWatcherPrinciple } from './principles/scsBridgeSessionTranscriptWatcher.principle.huirth';
// Cycle 160 R13 · BOCR · Closes EBOA race window via WPES+TSPB backfill-on-connect.
// HAZARD-γ (cross-concept DECK) MITIGATED in principle file via explicit
// ScsBridgeBackfillDeck declaration. See scsBridge.muxonomy.ts MSDT note.
import { scsBridgeBackfillOnConnectPrinciple } from './principles/scsBridgeBackfillOnConnect.principle.huirth';
// Cycle 163 R5 · SMRP · State-Mirror-Reactive-Principle · selector-driven broadcast on every
// bridgeJson + sessionsList state change. Supersedes unreliable actionExchange.serverToClient
// for ongoing change propagation. ADDITIVE — does not replace watcher or BOCR-S.
import { scsBridgeStateMirrorPrinciple } from './principles/scsBridgeStateMirror.principle.huirth';
// SE · Epoch Extension · AMWP · archive-manifest chokidar watcher (Cascades/Archive/ → ASMQ broadcast)
import { scsBridgeArchiveManifestWatcherPrinciple } from './principles/scsBridgeArchiveManifestWatcher.principle.huirth';

export const scsBridgeHuirthName = 'scsBridge';

// E11 fix · Cycle 160 R7 Rose Clinical · sendBridgeMessage Huirth Real registered
// PP-D4 · Cycle 160 R4 · setServerStartupTime registered (stale-pong baseline)
// SBIS · Cycle 163 R6 · Base maintenance actions registered (Huirth-only)
const scsBridgeHuirthQualities: ScsBridgeHuirthQualities = {
  scsBridgeTriggerHardTurnOver: scsBridgeTriggerHardTurnOverHuirth,
  scsBridgeSendBridgeMessage: scsBridgeSendBridgeMessageHuirth,
  scsBridgeSetBridgeJsonRelay,
  scsBridgeSetSessionsListRelay,
  scsBridgeSetServerStartupTime,
  scsBridgeSetBridgeJsonHuirthBase,
  scsBridgeSetSessionsListHuirthBase,
  // SE · Epoch Extension · ASMQ · archive-manifest Base + Relay
  scsBridgeSetArchiveManifestHuirthBase,
  scsBridgeSetArchiveManifestRelay,
  // D3F Diamond B · transcript watcher (Huirth-only read + Base; Relay also registered for serverToClient)
  scsBridgeReadSessionTranscript,
  scsBridgeSetSessionTranscriptDataHuirthBase,
  scsBridgeSetSessionTranscriptDataRelay,
  // GITM #639 · the gitm.json SBIS Base + Relay MIGRATED → the gitm Huirth BASE concept.
};

export const createScsBridgeHuirthConcept = () =>
  createConcept(
    scsBridgeHuirthName,
    createScsBridgeHuirthState(),
    scsBridgeHuirthQualities,
    [scsBridgeJsonWatcherPrinciple, scsBridgeTurnOverFieldWatcherPrinciple, scsBridgeBackfillOnConnectPrinciple, scsBridgeStateMirrorPrinciple, scsBridgeSessionTranscriptWatcherPrinciple, scsBridgeArchiveManifestWatcherPrinciple],
  );
