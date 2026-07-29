/**
 * SCP Concept - Suite Cascade Protocol
 *
 * UnHex Instance - SCP Hello World PoC
 * Suite 5 Blue - Professional Implementation
 *
 * Citation: STRATIMUX-REFERENCE.md - Essential Principles (lines 153-196)
 * Pattern: Explicit Quality mapping (NEVER typeof), Deck type definition
 *
 * Purpose:
 * - Universal Connection Point for MCP protocol
 * - Operates via HTTP/Express transport (avoids stdio/console conflicts)
 * - Exposes Stratimux qualities as MCP tools
 */

import { createConcept, type Concept } from 'stratimux';
import { scpName, createSCPState, type SCPState } from './scp.types';

// Quality imports
import { scpInitialize, type SCPInitialize } from './qualities/scpInitialize.quality.huirth';
import {
  scpConnectionOpened,
  type SCPConnectionOpened,
} from './qualities/scpConnectionOpened.quality.huirth';
import { scpSendResponse, type SCPSendResponse } from './qualities/scpSendResponse.quality.huirth';
import { scpResponseSent, type SCPResponseSent } from './qualities/scpResponseSent.quality.huirth';
import { scpRegisterTool, type SCPRegisterTool } from './qualities/scpRegisterTool.quality.huirth';
import { scpExecuteTool, type SCPExecuteTool } from './qualities/scpExecuteTool.quality.huirth';
import {
  scpExtractAndSendResponse,
  type SCPExtractAndSendResponse,
} from './qualities/scpExtractAndSendResponse.quality.huirth';
import {
  scpRegisterToolsWithMetadata,
  type SCPRegisterToolsWithMetadata,
} from './qualities/scpRegisterToolsWithMetadata.quality.huirth';
import {
  scpStoreHttpResponse,
  type SCPStoreHttpResponse,
} from './qualities/scpStoreHttpResponse.quality.huirth';

// Principle imports
import { scpExpressTransportPrinciple } from './principles/scpExpressTransport.principle.huirth';

// ═══════════════════════════════════════════════════════════════════
// QUALITY TYPE MAPPING (Explicit - NEVER typeof)
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPQualities - Explicit quality type mapping
 *
 * Citation: STRATIMUX-REFERENCE.md - Quality Creation Patterns
 * Pattern: v0.3.2+ explicit mapping (typeof causes compilation failure)
 */
export type SCPQualities = {
  scpInitialize: SCPInitialize;
  scpConnectionOpened: SCPConnectionOpened;
  scpSendResponse: SCPSendResponse;
  scpResponseSent: SCPResponseSent;
  scpRegisterTool: SCPRegisterTool;
  scpExecuteTool: SCPExecuteTool;
  scpExtractAndSendResponse: SCPExtractAndSendResponse;
  scpRegisterToolsWithMetadata: SCPRegisterToolsWithMetadata;
  scpStoreHttpResponse: SCPStoreHttpResponse;
};

// ═══════════════════════════════════════════════════════════════════
// DECK TYPE
// ═══════════════════════════════════════════════════════════════════

/**
 * SCPConcept - Full concept type for selectStratiDECK usage
 *
 * Citation: STRATIMUX-REFERENCE.md - StratiDECK System
 * Pattern: Concept<State, Qualities> - Distinct from SCPDeck
 */
export type SCPConcept = Concept<SCPState, SCPQualities>;

/**
 * SCPDeck - Deck type for SCP concept access
 *
 * Citation: STRATIMUX-REFERENCE.md - StratiDECK System
 * Pattern: Concept<State, Qualities> - Must be inline, distinct from SCPConcept
 */
export type SCPDeck = {
  scp: Concept<SCPState, SCPQualities>;
};

// ═══════════════════════════════════════════════════════════════════
// CONCEPT FACTORY
// ═══════════════════════════════════════════════════════════════════

/**
 * createSCPConcept - Factory function for SCP concept
 *
 * Citation: STRATIMUX-REFERENCE.md - Concept Composition
 * Pattern: createConcept<State, Qualities>
 */
export const createSCPConcept = () =>
  createConcept(
    scpName,
    createSCPState(),
    {
      scpInitialize,
      scpConnectionOpened,
      scpSendResponse,
      scpResponseSent,
      scpRegisterTool,
      scpExecuteTool,
      scpExtractAndSendResponse,
      scpRegisterToolsWithMetadata,
      scpStoreHttpResponse,
    },
    [scpExpressTransportPrinciple],
  );
