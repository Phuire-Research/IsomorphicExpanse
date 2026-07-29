/**
 * SCP Quality Type Definitions
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Cobalt - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns (lines 2905-3191)
 * Pattern: Explicit Quality type mapping (v0.3.2+)
 */

import type { Quality } from 'stratimux';
import type { Response } from 'express';
import type {
  SCPState,
  TransportConfiguration,
  MCPResponse,
  SCPToolDefinition,
  SCPConceptEntry,
  SCPDemometerTool,
} from '../scp.types';

// ═══════════════════════════════════════════════════════════════════
// LIFECYCLE PAYLOADS
// ═══════════════════════════════════════════════════════════════════

export type SCPInitializePayload = {
  transportConfiguration: TransportConfiguration;
};

// ═══════════════════════════════════════════════════════════════════
// CONNECTION PAYLOADS
// ═══════════════════════════════════════════════════════════════════

export type SCPConnectionOpenedPayload = {
  connectionId: string;
  clientName: string;
  clientVersion: string;
  protocolVersion: string;
  initResponse: MCPResponse;
};

export type SCPConnectionClosedPayload = {
  connectionId: string;
  reason: string;
};

// ═══════════════════════════════════════════════════════════════════
// MESSAGE PAYLOADS
// ═══════════════════════════════════════════════════════════════════

export type SCPSendResponsePayload = {
  connectionId: string;
  response: MCPResponse;
};

// ═══════════════════════════════════════════════════════════════════
// TOOL PAYLOADS
// ═══════════════════════════════════════════════════════════════════

export type SCPRegisterToolPayload = {
  tools: SCPToolDefinition[];
};

export type SCPUnregisterToolPayload = {
  toolName: string;
};

/**
 * SCPExecuteToolPayload - Payload for scpExecuteTool quality
 *
 * The httpResponse field holds the Express Response object for manifold closure.
 * This is stored on SCP state via pendingHttpResponses Map and excluded from
 * serialization via filterKeys in scp.muxonomy.ts.
 *
 * REQUIRED: httpResponse must be provided for non-blocking manifold completion.
 * Express transport provides this via scpExpressTransport.principle.
 * Stdio transport uses separate response mechanism (not this quality).
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
 */
export type SCPExecuteToolPayload = {
  requestId: string | number;
  connectionId: string;
  toolName: string;
  params: Record<string, unknown>;
  /** Express Response object for manifold closure - REQUIRED */
  httpResponse: Response;
};

export type SCPExtractAndSendResponsePayload = {
  requestId: string | number;
  connectionId: string;
};

/**
 * SCPStoreHttpResponsePayload - Payload for scpStoreHttpResponse quality (Join)
 *
 * The "Join" quality for SCP Strategy Manifolds. Stores httpResponse in
 * pendingHttpResponses Map BEFORE tool strategy executes, ensuring
 * scpExtractAndSendResponse can retrieve it in the final node.
 *
 * Part 1 of 3-part strategy sequence: Join → Tool → Return
 *
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8
 * Verbose Split: 'I C P Store Http Response'
 */
export type SCPStoreHttpResponsePayload = {
  requestId: string | number;
  connectionId: string;
  toolName: string;
  /** Express Response object for manifold closure - REQUIRED */
  httpResponse: Response;
};

export type SCPRegisterToolsWithMetadataPayload = {
  tools: SCPToolDefinition[];
  metadataRegistry: Record<string, import('../scp.types').SCPQualityMetadataRegistered>;
};

export type SCPToolResultPayload = {
  requestId: string | number;
  result: unknown;
  success: boolean;
  error: string;
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM MENU PAYLOADS (Muxonomic Pattern)
// ═══════════════════════════════════════════════════════════════════

export type SCPScanConceptSCPPayload = {
  scanPath: string;
};

export type SCPScanConceptSCPDataField = {
  conceptEntries: SCPConceptEntry[];
  lastScan: number;
  scanPath: string;
};

export type SCPBuildSystemMenuPayload = Record<string, never>;

export type SCPSetConceptSCPPayload = {
  conceptEntries: SCPConceptEntry[];
};

export type SCPSetSystemMenuPayload = {
  demometers: SCPDemometerTool[];
};

// ═══════════════════════════════════════════════════════════════════
// QUALITY TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

// Lifecycle
export type SCPInitialize = Quality<SCPState, SCPInitializePayload>;
export type SCPShutdown = Quality<SCPState, void>;

// Connection
export type SCPConnectionOpened = Quality<SCPState, SCPConnectionOpenedPayload>;
export type SCPConnectionClosed = Quality<SCPState, SCPConnectionClosedPayload>;

// Message
export type SCPSendResponse = Quality<SCPState, SCPSendResponsePayload>;
export type SCPResponseSent = Quality<SCPState>;

// Tools
export type SCPRegisterTool = Quality<SCPState, SCPRegisterToolPayload>;
export type SCPUnregisterTool = Quality<SCPState, SCPUnregisterToolPayload>;
export type SCPExecuteTool = Quality<SCPState, SCPExecuteToolPayload>;
export type SCPToolResult = Quality<SCPState, SCPToolResultPayload>;
export type SCPExtractAndSendResponse = Quality<SCPState, SCPExtractAndSendResponsePayload>;
export type SCPRegisterToolsWithMetadata = Quality<SCPState, SCPRegisterToolsWithMetadataPayload>;
export type SCPStoreHttpResponse = Quality<SCPState, SCPStoreHttpResponsePayload>;

// System Menu (Muxonomic Pattern)
export type SCPScanConceptSCP = Quality<SCPState, SCPScanConceptSCPPayload>;
export type SCPBuildSystemMenu = Quality<SCPState, SCPBuildSystemMenuPayload>;
export type SCPSetConceptSCP = Quality<SCPState, SCPSetConceptSCPPayload>;
export type SCPSetSystemMenu = Quality<SCPState, SCPSetSystemMenuPayload>;
