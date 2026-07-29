/**
 * SCP Muxonomy Configuration
 *
 * This file declares SCP's participation in the Muxonomy pattern.
 * KEY: filterKeys exclude pendingHttpResponses from serialization.
 *
 * The pendingHttpResponses Map stores Express Response objects for async
 * manifold execution. These objects are not serializable and must be
 * excluded from state sync operations.
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
 * Citation: muxonomy.model.ts - MuxonomicConfig, filterKeys pattern
 */

import {
  type MuxonomicConfig,
  ChangeDetectionMode,
  DeploymentTarget,
} from '../muxonomy/muxonomy.model';

// ============================================
// SCP MUXONOMIC CONFIG
// ============================================

/**
 * SCP Muxonomy Configuration
 *
 * Pattern: filterKeys for non-serializable state properties
 *
 * pendingHttpResponses: Map<string | number, Response>
 * - Stores Express Response objects for manifold closure
 * - Keyed by MCP requestId
 * - Excluded from serialization (Response is not serializable)
 * - Managed by scpExecuteTool (store) and scpExtractAndSendResponse (send + delete)
 */
export const scpMuxonomic: MuxonomicConfig<'scp'> = {
  conceptName: 'scp',

  filterKeys: [
    'pendingHttpResponses', // Map<requestId, Response> - not serializable
  ],

  novelChange: {
    mode: ChangeDetectionMode.KeyedSelector,
  },

  sync: {
    direction: 'toClient',
    filterKeys: [
      'pendingHttpResponses', // Never sync Response objects
      'tools', // Tool handlers are functions, not serializable
      'pendingResponses', // Server-side tracking only
      'responseQueue', // Server-side queue only
    ],
    novelChange: {
      mode: ChangeDetectionMode.KeyedSelector,
    },
  },

  demometers: {
    qualities: [
      {
        name: 'scpInitialize',
        type: 'I C P Initialize',
        filePath: 'qualities/scpInitialize.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpConnectionOpened',
        type: 'I C P Connection Opened',
        filePath: 'qualities/scpConnectionOpened.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpSendResponse',
        type: 'I C P Send Response',
        filePath: 'qualities/scpSendResponse.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpResponseSent',
        type: 'I C P Response Sent',
        filePath: 'qualities/scpResponseSent.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpRegisterTool',
        type: 'I C P Register Tool',
        filePath: 'qualities/scpRegisterTool.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpExecuteTool',
        type: 'I C P Execute Tool',
        filePath: 'qualities/scpExecuteTool.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpExtractAndSendResponse',
        type: 'I C P Extract And Send Response',
        filePath: 'qualities/scpExtractAndSendResponse.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpStoreHttpResponse',
        type: 'I C P Store Http Response',
        filePath: 'qualities/scpStoreHttpResponse.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
      {
        name: 'scpRegisterToolsWithMetadata',
        type: 'I C P Register Tools With Metadata',
        filePath: 'qualities/scpRegisterToolsWithMetadata.quality.huirth.ts',
        location: DeploymentTarget.Huirth,
        diameter: false,
      },
    ],
    strategies: [
      {
        name: 'scpToolManifold',
        filePath: 'strategies/scpToolManifold.strategy.ts',
      },
    ],
    principles: [
      {
        name: 'scpExpressTransportPrinciple',
        filePath: 'principles/scpExpressTransport.principle.huirth.ts',
        location: DeploymentTarget.Huirth,
      },
    ],
  },

  decks: {
    huirth: 'SCPDeck',
    client: '', // SCP is server-only, no client deck
  },

  // SCP does not expose its own tools via SCP (would be recursive)
  scpToolMetadata: [],
};
