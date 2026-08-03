/*<$
For the graph programming framework Stratimux generate a Huirth Concept, that accepts an initial port.
$>*/
/*<#*/
import {
  MuxiumDeck,
  createConcept,
  PrincipleFunction,
  muxifyConcepts,
  createOwnershipConcept,
} from 'stratimux';
import { createServerConcept, ServerState } from '../server/server.concept';
import {
  createWebSocketServerConcept,
  WebSocketServerState,
} from '../webSocketServer/webSocketServer.concept';
import { createVueConcept } from '../vue/vue.concept';
import { createSCPConcept } from '../scp/scp.concept';
import { createNotificationHuirthConcept } from '../notification/notification.concept.huirth';
import { createScsBridgeHuirthConcept } from '../scsBridge/scsBridge.concept.huirth';
// GITM #639 · the gitm Huirth BASE concept — gitmJson STCP relay (gitm.json file-watch ·
// migrated off scsBridge). Co-muxified FLAT alongside scsBridge (sibling · Tier-1 Huirth muxium).
import { createGitmHuirthConcept } from '../gitm/gitm.concept.huirth';
import { createSuiteCascadeHuirthConcept } from '../suiteCascade/suiteCascade.concept.huirth';
// STCP · the thin cadmium Huirth concept holds the menuStage Base + the SMRP/BOCR relay
// principle. Co-muxified flat alongside suiteCascade (same Tier-1 Huirth muxium · the
// CadmiumOkMonitorDeck's cross-concept access proves d.cadmium.* is then live).
import { createCadmiumHuirthConcept } from '../cadmium/cadmium.concept.huirth';
// GTMS8C · the thin suite8 Huirth concept — menuStage Base + the menu SMRP/BOCR relay + the thin
// menu-watch dir-watch. Co-muxified FLAT alongside cadmium + suiteCascade (Tier-1 Huirth muxium).
import { createSuite8HuirthConcept } from '../suite8/suite8.concept.huirth';
import { createScpRegistryConcept } from '../scpRegistry/scpRegistry.concept';
import { createScpLogConcept } from '../scpLog/scpLog.concept';

export type HuirthState = {
  //
} & ServerState &
  WebSocketServerState;

export const huirthName = 'huirth';

const initialHuirthState = (settings: Partial<HuirthState>, filterKeys?: string[]): HuirthState => {
  return {
    // Server and WebSocket state
    actionQue: [],
    specificQue: [],
    clientState: {},
    syncClientState: true,
    clientSemaphore: -1,
    webSocketClients: [],
    clientStates: {},
    stateUpdates: [],
    port: settings.port || 7637,
    filterKeys: filterKeys || [],
    servers: [],
    // Pool management for multi-window support
    connectionPools: {},
    connectionToPool: {},

    ...settings,
  };
};

export type HuirthPrinciple = PrincipleFunction<void, MuxiumDeck, ServerState>;

import { createGraphiteScribeHuirthConcept } from '../graphiteScribe/graphiteScribe.concept.huirth';
export const createHuirthConcept = (settings: Partial<HuirthState>, filterKeys?: string[]) => {
  const muxifiedHuirth = muxifyConcepts(
    [
      createServerConcept(true, settings.port),
      createWebSocketServerConcept(settings.port, filterKeys),
      createVueConcept(),
      createNotificationHuirthConcept(),
      createSCPConcept(),
      createScsBridgeHuirthConcept(),
      // GITM #639 · gitm Huirth BASE face — gitmJson STCP relay (gitm.json watcher · SMRP+BOCR ·
      // migrated off the scsBridge bolt-on). Sibling of scsBridge (flat Tier-1 co-muxification).
      createGitmHuirthConcept(),
      // B-4 WCJF · SuiteCascade Huirth face — Cascade.json watcher (Base→Relay · SBIS)
      createSuiteCascadeHuirthConcept(),
      // STCP · Cadmium Huirth face — menuStage Base + SMRP/BOCR menu relay (first STCP instance).
      createCadmiumHuirthConcept(),
      // GTMS8C · Suite8 Huirth face — the Template Suite 8 menu relay (the renameable instance).
      createSuite8HuirthConcept(),
      createGraphiteScribeHuirthConcept(),
      // M2-A1-D4 · SCP Registry + Log concepts (server-side)
      createScpRegistryConcept(),
      createScpLogConcept(),
    ],
    createConcept(huirthName, initialHuirthState(settings, filterKeys), {}, []),
  );
  return muxifiedHuirth;
};
/*#>*/
