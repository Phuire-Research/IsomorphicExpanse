import { createOwnershipConcept, muxification } from 'stratimux';

import { createHuirthConcept } from './concepts/huirth/huirth.concept';
import { registerCallerSessionWithBridge } from './scsRegisterSession';

(() => {
  // SCSER · SAWSR-D2.B Cycle 153 · fire-and-forget caller-session binding callback
  // Reads SCS_BRIDGE_CALLER_SESSION + SCS_BRIDGE_MCP_ENDPOINT env vars · HTTP POSTs
  // to Bridge MCP tool scs_bridge_bind_caller_session if present · non-blocking
  void registerCallerSessionWithBridge();

  const muxiumName = 'SCP Template Server';
  const port = parseInt(process.env.PORT || '7637', 10);
  // C667 · S0b: default the reported bind to loopback (the actual server binds 127.0.0.1 via
  // server.principle HOST); the IP env escape hatch remains for a deliberate LAN-dev override.
  const ip = process.env.IP || '127.0.0.1';

  console.log(`[Huirth] Starting ${muxiumName} (PID: ${process.pid}, port: ${port}, ip: ${ip})`);

  // Define filterKeys - properties to exclude from sync entirely
  const filterKeys = [
    'lastSyncTimestamp', // Timestamp of last sync - not to be synced itself
    'lastKnownBuffer', // Internal diff calculation state - not to be synced
    'actionQue', // Action queue is server-specific
    'filterKeys', // Filter configuration is meta-property
    'clientSemaphore', // WebSocket connection state identifier
    'novelChangeHandlers', // Handler configuration is meta-property
    'webSocketClients', // Connection list is server-specific
    'stateUpdates', // Update queue is server-specific
    'specificQue', // Client-specific routing queue
    'port', // Server configuration
    'clientState', // Server state tracking
    'syncClientState', // Server configuration flag
  ];

  muxification(
    muxiumName,
    {
      huirth: createHuirthConcept({ port }, filterKeys),
      ownership: createOwnershipConcept(),
    },
    {},
  );

  console.log('[Huirth] Bridge Restart Manifold: READY');
})();
