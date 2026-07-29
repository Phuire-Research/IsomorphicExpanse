/**
 * SCP Concept Types - Suite Cascade Protocol
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Blue - Professional Implementation
 *
 * Citation: SUITE-2-RUST-ICP-TYPE-EXPLORATION.md (historical · pre-SCP-2 working file in /reference/beginning/)
 * Pattern: Flat list management, factory functions, no optional properties
 *
 * Key Insight: Transport Configuration as Compositional Strategy
 * - Same SCP output regardless of transport
 * - ActionStrategies hotload appropriate communication origin
 */

import type { Response } from 'express';
import type { ActionStrategy, Concepts } from 'stratimux';

export const scpName = 'scp';

// ═══════════════════════════════════════════════════════════════════
// TRANSPORT TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * TransportMode - Determines communication concept at startup
 *
 * Verbose Split: 'Transport Mode'
 */
export type TransportMode = 'stdio' | 'http' | 'websocket';

/**
 * TransportStatus - Current state of transport layer
 *
 * Verbose Split: 'Transport Status'
 */
export type TransportStatus = 'inactive' | 'initializing' | 'active' | 'error';

/**
 * TransportConfiguration - Startup configuration for SCP
 *
 * Verbose Split: 'Transport Configuration'
 */
export type TransportConfiguration = {
  mode: TransportMode;
  port: number;
  host: string;
};

// ═══════════════════════════════════════════════════════════════════
// CONNECTION TYPES (Flat List Pattern)
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPConnectionInstance - Single connection in flat list
 *
 * Pattern: Record<string, SCPConnectionInstance>
 * Verbose Split: 'I C P Connection Instance'
 */
export type SCPConnectionInstance = {
  connectionId: string;
  connectionIndex: number;
  clientName: string;
  clientVersion: string;
  protocolVersion: string;
  connectedAt: number;
  lastMessageAt: number;
  status: 'connected' | 'disconnected' | 'error';
  transportOrigin: TransportMode;
};

/**
 * createSCPConnectionInstance - Factory function
 */
export const createSCPConnectionInstance = (
  connectionId: string,
  connectionIndex: number,
  clientName: string,
  clientVersion: string,
  protocolVersion: string,
  transportOrigin: TransportMode,
): SCPConnectionInstance => ({
  connectionId,
  connectionIndex,
  clientName,
  clientVersion,
  protocolVersion,
  connectedAt: Date.now(),
  lastMessageAt: Date.now(),
  status: 'connected',
  transportOrigin,
});

// ═══════════════════════════════════════════════════════════════════
// TOOL REGISTRY TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * JSONSchemaProperty - Property definition in JSON Schema
 */
export type JSONSchemaProperty = {
  type: string;
  description: string;
  enum: string[];
  default: unknown;
  items: { type: string };
};

/**
 * JSONSchema - Standard JSON Schema for tool inputs
 */
export type JSONSchema = {
  type: string;
  properties: Record<string, Partial<JSONSchemaProperty>>;
  required: string[];
};

/**
 * SCPToolDefinition - Registered tool specification
 *
 * Verbose Split: 'I C P Tool Definition'
 */
export type SCPToolDefinition = {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  registeredAt: number;
  handler: (params: Record<string, unknown>) => unknown;
};

// ═══════════════════════════════════════════════════════════════════
// SCP QUALITY METADATA (Muxonomy Integration)
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPToolType - Sub-typing for SCP Quality Tools
 *
 * Self-Labeling Pattern: Category derived from concept name automatically.
 * Sub-types distinguish the role of each tool within the concept.
 *
 * - informative: Read-only tools that provide state/data AND can explain
 *   how to use related Actionable tools. Designed for SCP expansion upon
 *   utilization - the tool response includes documentation of actionables.
 *
 * - actionable: Tools that perform mutations/actions. The "doers" that
 *   Informative tools describe how to use.
 *
 * Pattern: Informative explains Actionables → SCP expands upon utilization
 *
 * Verbose Split: 'I C P Tool Type'
 */
export type SCPToolType = 'informative' | 'actionable';

/**
 * SCPQualityMetadata - Per-quality SCP tool metadata
 *
 * Lives in MuxonomicConfig.scpToolMetadata[] to enable self-referential
 * tool registration. Quality + Muxonomy metadata = Complete SCP tool definition.
 *
 * Self-Labeling: Category is auto-derived from concept name at registration.
 * No manual category field needed - the concept IS the category (Demometer).
 *
 * Pattern: Quality becomes the "middle" of SCP Manifold (Inlet → Quality → Return)
 * DataField becomes the return value for SCP tool responses.
 *
 * StratiSPACE Integration:
 * - CLAUDE.md managed by StratiVERSE as StratiSPACE Entry Area
 * - Interchanged based on connected Huirth's Muxonomy Configuration
 * - Informative tools expand to describe Actionables in their responses
 *
 * Citation: POC-3-MUXONOMIC-SCP-BRIDGE-TOGGLE-WORKGAMEBOARD.md
 * Citation: CDI-COMMAND-REGISTRATION-SYSTEM.md (Inspiration)
 *
 * Verbose Split: 'I C P Quality Metadata'
 */
export type SCPQualityMetadata = {
  /** Quality name in concept (e.g., 'strativerseBridgeRestartToggle') */
  qualityName: string;

  /** MCP tool name (e.g., 'strativerse_bridge_toggle') */
  toolName: string;

  /** Tool description for Claude/MCP clients */
  description: string;

  /** JSON Schema for tool input parameters */
  inputSchema: JSONSchema;

  /**
   * Tool type: informative or actionable
   *
   * - informative: Provides state/data, explains related actionables
   * - actionable: Performs mutations/actions
   */
  toolType: SCPToolType;

  /** Handler type: single quality or multi-step strategy */
  handlerType: 'quality' | 'strategy';

  /** Strategy name if handlerType === 'strategy' (empty string if quality) */
  strategyName: string;

  /**
   * Related actionable tool names (for informative tools)
   *
   * When toolType === 'informative', this array lists the actionable
   * tools that this informative tool can explain. The Informative's
   * response should include usage documentation for these actionables.
   */
  relatedActionables: string[];

  /**
   * Strategy creator function (for strategy-based tools)
   *
   * When handlerType === 'strategy', this function creates the ActionStrategy
   * that will be executed via strategySequence pattern. The strategyCreator
   * uses the Stradian Informative Actionable Pairing to access both state
   * (via concepts_) and dispatch capabilities (via deck).
   *
   * Optional: Omit entirely for quality-based tools (handlerType === 'quality').
   * Presence of strategyCreator indicates Strategic SCP Quality routing.
   *
   * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8 (Stradian Interface Pattern)
   * Verbose Split: 'Strategy Creator'
   */
  strategyCreator?: SCPStrategyCreator;
};

/**
 * SCPQualityMetadataRegistered - Metadata with concept context added at registration
 *
 * When tools are registered from Muxonomy configs, the conceptName is added
 * to enable proper deck access for quality dispatch. The conceptName also
 * serves as the self-labeled category (Demometer) for System Menu grouping.
 *
 * Verbose Split: 'I C P Quality Metadata Registered'
 */
export type SCPQualityMetadataRegistered = SCPQualityMetadata & {
  /** Concept name (added at registration time, also serves as category) */
  conceptName: string;
};

// ═══════════════════════════════════════════════════════════════════
// SCP STRATEGY TYPES (Strategic Tool Expansion)
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPStrategyCreator - Function signature for SCP strategy creators
 *
 * Stradian Informative Actionable Pairing:
 * - concepts_: Stratimux Concepts type - enables state access for strategy formalization
 * - deck: Unknown Huirth deck - enables selectStratiDECK for quality dispatch
 * - params: Tool call parameters from MCP client
 *
 * Strategy creators are both Informative (can read state via concepts_) AND
 * Actionable (can dispatch qualities via deck). This enables complete strategy
 * formalization within SCP context.
 *
 * Zero-knowledge to SCP - operates like standard Stratimux strategy.
 * Data flows via strategyData_muxifyData through the chain.
 *
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8 (Stradian Interface Pattern)
 * Citation: actionStrategyConsumersAdvanced.ts - strategySequence pattern
 *
 * Verbose Split: 'I C P Strategy Creator'
 */
export type SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>,
) => ActionStrategy | undefined;

/**
 * SCPStrategyRegistry - Maps strategyName to strategy creator function
 *
 * The registry is populated during tool registration from Muxonomy configs.
 * Each concept with strategy-based SCP tools registers its creators here.
 *
 * Verbose Split: 'I C P Strategy Registry'
 */
export type SCPStrategyRegistry = Record<string, SCPStrategyCreator>;

// ═══════════════════════════════════════════════════════════════════
// SYSTEM MENU TYPES (Muxonomic Pattern)
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPDemometerTool - Category demometer for System Menu
 *
 * Muxonomic Pattern: A Demometer is a "Different Measure" - each concept
 * becomes a distinct category with its own measurable tool set.
 *
 * Verbose Split: 'I C P Demometer Tool'
 * Citation: Stratidia Muxonomy - Compositional Measurement Framework
 */
export type SCPDemometerTool = {
  name: string;
  description: string;
  conceptPath: string;
  tools: string[];
};

/**
 * SCPSystemMenu - Complete System Menu topology
 *
 * Muxonomic Pattern: The System Menu is the Muxonomy - the complete
 * graph of all Demometers (concepts) connected by their tool Diameters.
 *
 * Verbose Split: 'I C P System Menu'
 */
export type SCPSystemMenu = {
  demometers: SCPDemometerTool[];
  demometerCount: number;
  lastBuilt: number;
};

/**
 * SCPConceptEntry - Discovered concept with SCP directory
 *
 * Pattern: Auto-registry scans for concepts/{name}/scp/{name}.scp.ts
 *
 * Verbose Split: 'I C P Concept Entry'
 */
export type SCPConceptEntry = {
  conceptName: string;
  conceptPath: string;
  scpFilePath: string;
  toolNames: string[];
  hasDocumentation: boolean;
  lastScanned: number;
};

/**
 * SCPRegistryStatus - Current state of auto-registry
 *
 * Verbose Split: 'I C P Registry Status'
 */
export type SCPRegistryStatus = 'idle' | 'scanning' | 'registering' | 'ready';

// ═══════════════════════════════════════════════════════════════════
// MESSAGE TYPES (MCP Protocol)
// ═══════════════════════════════════════════════════════════════════

/**
 * MCPError - Error object
 */
export type MCPError = {
  code: number;
  message: string;
  data?: unknown;
};

/**
 * MCPMessage - JSON-RPC 2.0 message wrapper
 *
 * Verbose Split: 'M C P Message'
 */
export type MCPMessage = {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string | null;
  params: Record<string, unknown> | null;
  result: unknown;
  error: MCPError | null;
};

/**
 * MCPRequest - Incoming request
 */
export type MCPRequest = {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: Record<string, unknown>;
};

/**
 * MCPResponse - Outgoing response
 */
export type MCPResponse = {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
};

// ═══════════════════════════════════════════════════════════════════
// SERVER INFO TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPServerInfo - Server identification
 *
 * Verbose Split: 'I C P Server Info'
 */
export type SCPServerInfo = {
  name: string;
  version: string;
  protocolVersion: string;
};

/**
 * SCPCapabilities - Declared server capabilities
 *
 * Verbose Split: 'I C P Capabilities'
 */
export type SCPCapabilities = {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
};

// ═══════════════════════════════════════════════════════════════════
// PENDING RESPONSE TYPE
// ═══════════════════════════════════════════════════════════════════

/**
 * PendingResponse - Awaiting response assembly
 */
export type PendingResponse = {
  requestId: string | number;
  connectionId: string;
  toolName: string;
  receivedAt: number;
  response: MCPResponse | null;
  ready: boolean;
};

// ═══════════════════════════════════════════════════════════════════
// SCP STATE (Complete)
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPState - Complete SCP concept state
 *
 * Pattern: Flat lists, no optional properties (KeyedSelector compliant)
 * Citation: STRATIMUX-REFERENCE.md "State Design Best Practices"
 *
 * ============================================
 * MUXONOMY SELF-DOCUMENTATION
 * ============================================
 *
 * System Menu Pattern:
 * - Each concept with /scp/ directory becomes a Demometer in the System Menu
 * - Demometers group tools by concept ownership
 * - Auto-registry scans concepts/{name}/scp/{name}.scp.ts on startup
 * - CURL actualization bypasses Claude Code connection loss during Bridge Restart
 *
 * Citation: Phase 3 WorkGameBoard - Modular SCP Tool Registration
 */
export type SCPState = {
  // Transport Configuration
  transportMode: TransportMode;
  transportStatus: TransportStatus;
  transportConfiguration: TransportConfiguration;

  // Server Identity
  serverInfo: SCPServerInfo;
  capabilities: SCPCapabilities;

  // Connection Management (Flat List)
  connections: Record<string, SCPConnectionInstance>;
  connectionCount: number;
  nextConnectionIndex: number;

  // Tool Registry (Existing - All Tools)
  tools: Record<string, SCPToolDefinition>;
  toolCount: number;

  // Tool Metadata Registry (SCP Manifold - Muxonomic Pattern)
  // Maps toolName → registered metadata with conceptName for deck access
  toolMetadataRegistry: Record<string, SCPQualityMetadataRegistered>;

  // Strategy Registry (SCP Strategic Tool Expansion)
  // Maps strategyName → strategy creator function for createSCPStrategyManifold
  // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8
  strategyRegistry: SCPStrategyRegistry;

  // System Menu (NEW - Muxonomic Pattern)
  systemMenu: SCPSystemMenu;
  conceptSCP: Record<string, SCPConceptEntry>;
  registryStatus: SCPRegistryStatus;
  lastRegistryScan: number;

  // Message Queue (for response assembly)
  pendingResponses: Record<string, PendingResponse>;
  responseQueue: MCPResponse[];

  // HTTP Response Storage (SCP Manifold Closure)
  // Stores Express Response objects keyed by requestId for async manifold execution
  // MUST be in filterKeys - Response objects are not serializable
  // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
  pendingHttpResponses: Map<string | number, Response>;

  // Lifecycle
  initialized: boolean;
  startedAt: number;
  lastActivityAt: number;
};

/**
 * createSCPState - State factory
 *
 * Citation: STRATIMUX-REFERENCE.md - State Design Best Practices
 * Pattern: No optional properties (KeyedSelector compliant)
 */
export const createSCPState = (): SCPState => ({
  // Transport
  transportMode: 'stdio',
  transportStatus: 'inactive',
  transportConfiguration: {
    mode: 'stdio',
    port: 0,
    host: '',
  },

  // Server
  serverInfo: {
    name: 'huirth',
    version: '0.0.1',
    protocolVersion: '2024-11-05',
  },
  capabilities: {
    tools: true,
    resources: false,
    prompts: false,
  },

  // Connections
  connections: {},
  connectionCount: 0,
  nextConnectionIndex: 0,

  // Tools (All registered tools)
  tools: {},
  toolCount: 0,

  // Tool Metadata Registry (SCP Manifold)
  toolMetadataRegistry: {},

  // Strategy Registry (SCP Strategic Tool Expansion)
  strategyRegistry: {},

  // System Menu (Muxonomic Pattern)
  systemMenu: {
    demometers: [],
    demometerCount: 0,
    lastBuilt: 0,
  },
  conceptSCP: {},
  registryStatus: 'idle',
  lastRegistryScan: 0,

  // Messages
  pendingResponses: {},
  responseQueue: [],

  // HTTP Response Storage (SCP Manifold)
  pendingHttpResponses: new Map(),

  // Lifecycle
  initialized: false,
  startedAt: 0,
  lastActivityAt: 0,
});
