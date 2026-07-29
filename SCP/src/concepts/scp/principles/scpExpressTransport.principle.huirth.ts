/**
 * scpExpressTransport - HTTP Transport Principle
 *
 * Stage 2 Cobalt - Express HTTP Transport for SCP
 *
 * Citation: STRATIMUX-REFERENCE.md - Critical Planning Context Patterns (lines 463-608)
 * Pattern: Principle with external event integration via observer.next()
 *
 * Purpose:
 * - Add /mcp endpoint to existing Express server
 * - Handle JSON-RPC 2.0 over HTTP (separates debug logs from protocol)
 * - Session management for stateful connections
 * - Register Huirth HiFi tools on startup
 *
 * Key Benefit:
 * - console.log() goes to Express stdout (debug)
 * - Protocol messages flow over HTTP (clean channel separation)
 */

import type { Request, Response } from 'express';
import type { PrincipleFunction, MuxiumDeck, AnyAction } from 'stratimux';
import { strategyBegin, strategySequence, createStrategy, createActionNode } from 'stratimux';
import type { SCPQualities, SCPDeck } from '../scp.concept';
import type { SCPState, MCPRequest, MCPResponse } from '../scp.types';
import type { ServerDeck, ServerState } from '../../server/server.concept';
import {
  createInitializeResponse,
  createToolsListResponse,
  createErrorResponse,
  MCP_ERRORS,
} from '../model/scp.protocol';
import { randomUUID } from 'crypto';
import { scpMuxonomyRegistry } from '../scpMuxonomyRegistry';
// MD-CE-7 · the editor_* tool builders (the same fs authority as the /editor-fs routes).
import { buildEditorScpTools } from '../../../model/editorFs.model';
import type { SCPQualityMetadataRegistered, SCPToolDefinition } from '../scp.types';
import { createSCPStrategyManifold } from '../strategies/scpToolManifold.strategy';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveBridgeRoot } from '../../scsBridge/bridgeRoot.model';

type ExpressTransportDeck = MuxiumDeck & SCPDeck & ServerDeck;

let scpState: SCPState;

// Session storage for stateful connections
const sessions: Record<string, { createdAt: number; lastActivity: number }> = {};

/**
 * Create tool call response
 */
const createToolCallResponse = (requestId: string | number, result: unknown): MCPResponse => ({
  jsonrpc: '2.0',
  id: requestId,
  result: {
    content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }],
  },
});

export const scpExpressTransportPrinciple: PrincipleFunction<
  SCPQualities,
  ExpressTransportDeck,
  SCPState
> = ({ plan, d_, k_, observer, concepts_ }) => {
  // Get Express server from huirth/server state
  // Access via concepts_ since server is muxified into huirth
  const getExpressServer = () => {
    const state = k_.getState(concepts_);
    // The server is at the root level due to muxification
    return (state as unknown as ServerState).server;
  };

  const expressApp = getExpressServer();

  if (!expressApp) {
    console.error('[SCP Express] No Express server found in state');
    return;
  }

  // Add JSON body parser for /mcp endpoint
  expressApp.use('/mcp', (req: Request, _res: Response, next) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          (req as any).body = JSON.parse(body);
        } catch {
          (req as any).body = null;
        }
        next();
      });
    } else {
      next();
    }
  });

  // GITM A↔B (045 fix · GAFP — Gitm-Action Forward Proxy). The gitm toolbar buttons fetched the
  // bridge MCP DIRECTLY from the browser (cross-origin to 127.0.0.1:7111) — across 043→045 that fetch
  // never ARRIVED at the bridge (no mcp.toolcall.received for the turn-over; gitm.turnover.invoked
  // stayed 0) and the client console is NOT file-captured, so the failure was invisible. The blind
  // turn-over that ALWAYS worked went through the SAME-ORIGIN SCP server. Mirror it: the client POSTs
  // same-origin /gitm-action; the SCP server forwards { tool, arguments } to the bridge MCP server-side
  // (no CORS, reliable) — and the bridge's mcp.toolcall.received fires on the forward (observable). The
  // bridge endpoint is read fresh from bridge.json (RBJP-aligned · resolveBridgeRoot); no page Muxium,
  // no client bridgeJson. The turn-over restart later tears this connection down — that is expected;
  // the forward already reached the bridge by then.
  expressApp.post('/gitm-action', (req: Request, res: Response) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', async () => {
      let tool = '';
      let toolArgs: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(raw) as { tool?: string; arguments?: Record<string, unknown> };
        tool = parsed.tool ?? '';
        toolArgs = parsed.arguments ?? {};
      } catch {
        res.status(400).json({ ok: false, error: 'invalid JSON' });
        return;
      }
      if (!tool) {
        res.status(400).json({ ok: false, error: 'missing tool' });
        return;
      }
      console.log('[SCP Express] /gitm-action forward · tool=', tool, '· args=', JSON.stringify(toolArgs));
      try {
        const bj = JSON.parse(
          readFileSync(join(resolveBridgeRoot(), 'bridge.json'), 'utf8'),
        ) as { endpoint?: string };
        const endpoint = bj.endpoint ?? 'http://127.0.0.1:7111';
        const r = await fetch(`${endpoint}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name: tool, arguments: toolArgs },
          }),
        });
        console.log('[SCP Express] /gitm-action bridge ack · status=', r.status, '· tool=', tool);
        res.json({ ok: r.ok, status: r.status });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[SCP Express] /gitm-action forward FAILED · tool=', tool, '·', msg);
        if (!res.headersSent) res.status(502).json({ ok: false, error: msg });
      }
    });
  });

  // MCP HTTP endpoint
  expressApp.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const body = (req as any).body as MCPRequest | null;

    console.log('[SCP Express] Received request:', body?.method || 'unknown');

    if (!body) {
      res.status(400).json(createErrorResponse(0, MCP_ERRORS.PARSE_ERROR, 'Invalid JSON'));
      return;
    }

    // Session management
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = randomUUID();
      sessions[currentSessionId] = { createdAt: Date.now(), lastActivity: Date.now() };
    } else if (sessions[currentSessionId]) {
      sessions[currentSessionId].lastActivity = Date.now();
    }

    // Set session header in response
    res.setHeader('mcp-session-id', currentSessionId);

    // Guard: Ensure SCP state is initialized
    if (!scpState) {
      res
        .status(503)
        .json(
          createErrorResponse(
            body.id,
            MCP_ERRORS.INTERNAL_ERROR,
            'Server initializing, please retry',
          ),
        );
      scpState = k_.getState(concepts_) as unknown as SCPState;
      return;
    }

    // Handle different methods
    switch (body.method) {
      case 'initialize': {
        console.log('[SCP Express] Initialize request from:', body.params?.clientInfo);

        const initResponse = createInitializeResponse(
          body.id,
          scpState.serverInfo,
          scpState.capabilities,
        );

        // Dispatch connection opened via observer (includes initResponse for state tracking)
        const action = d_.scp.e.scpConnectionOpened({
          connectionId: currentSessionId,
          clientName: (body.params?.clientInfo as any)?.name || 'unknown',
          clientVersion: (body.params?.clientInfo as any)?.version || '0.0.0',
          protocolVersion: (body.params?.protocolVersion as string) || '2024-11-05',
          initResponse,
        });
        observer.next(action as AnyAction);

        // Send response directly via HTTP (not via responseQueue)
        res.json(initResponse);
        return;
      }

      case 'notifications/initialized': {
        console.log('[SCP Express] Client initialized');
        res.status(204).send();
        return;
      }

      case 'tools/list': {
        console.log('[SCP Express] Tools list request');
        const response = createToolsListResponse(body.id, scpState.tools);
        res.json(response);
        return;
      }

      case 'tools/call': {
        const toolName = (body.params?.name as string) || '';
        const toolArgs = (body.params?.arguments as Record<string, unknown>) || {};

        console.log('[SCP Express] Tool call:', toolName, toolArgs);

        const tool = scpState.tools[toolName];
        if (!tool) {
          res.json(
            createErrorResponse(
              body.id,
              MCP_ERRORS.METHOD_NOT_FOUND,
              `Tool not found: ${toolName}`,
            ),
          );
          return;
        }

        // Check for metadata-registered tool (manifold execution path)
        const toolMeta = scpState.toolMetadataRegistry[toolName];

        if (toolMeta) {
          // MANIFOLD PATH: Route based on strategyCreator presence
          // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8

          if (toolMeta.strategyCreator) {
            // STRATEGY-BASED: Create manifold directly and engage via strategyBegin
            // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
            console.log('[SCP Express] Strategy manifold execution for:', toolName);

            const manifold = createSCPStrategyManifold(
              concepts_,
              d_,
              toolMeta,
              toolArgs,
              body.id,
              currentSessionId,
              res,
            );

            if (manifold) {
              // Engage strategy via strategyBegin dispatched through observer
              const strategyAction = strategyBegin(manifold);
              observer.next(strategyAction as AnyAction);
              return; // Response sent by scpExtractAndSendResponse in tail
            } else {
              console.error('[SCP Express] Failed to create strategy manifold for:', toolName);
              res.json(
                createErrorResponse(
                  body.id,
                  MCP_ERRORS.INTERNAL_ERROR,
                  `Failed to create strategy manifold: ${toolName}`,
                ),
              );
              return;
            }
          }

          // QUALITY-BASED: Dispatch scpExecuteTool with httpResponse
          // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
          console.log('[SCP Express] Quality manifold execution for:', toolName);

          const action = d_.scp.e.scpExecuteTool({
            requestId: body.id,
            connectionId: currentSessionId,
            toolName,
            params: toolArgs,
            httpResponse: res,
          });
          observer.next(action as AnyAction);
          return; // Response sent by scpExtractAndSendResponse
        }

        // LEGACY PATH: Direct handler execution (no metadata)
        try {
          const result = tool.handler(toolArgs);
          res.json(createToolCallResponse(body.id, result));
        } catch (err) {
          console.error('[SCP Express] Tool execution error:', err);
          res.json(createErrorResponse(body.id, MCP_ERRORS.INTERNAL_ERROR, String(err)));
        }
        return;
      }

      case 'ping': {
        res.json({ jsonrpc: '2.0', id: body.id, result: {} });
        return;
      }

      default: {
        console.log('[SCP Express] Unknown method:', body.method);
        res.json(
          createErrorResponse(
            body.id,
            MCP_ERRORS.METHOD_NOT_FOUND,
            `Unknown method: ${body.method}`,
          ),
        );
        return;
      }
    }
  });

  // GET endpoint for SSE streaming (future use)
  expressApp.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method not allowed. Use POST for requests.' });
  });

  console.log('[SCP Express] MCP endpoint registered at /mcp');

  // Plan for initialization and tool registration
  // Citation: STRATIMUX-REFERENCE.md - Critical Planning Context Patterns
  // Pattern: Initial stages use beat ONLY (no selectors) to avoid initialization deadlock
  return plan('SCP Express Transport', ({ stageO, stage, conclude }) => [
    stageO(),

    // Stage 1: Initialize SCP
    stage(({ dispatch, d, k }) => {
      const initialized = k.initialized.select();

      if (!initialized) {
        console.log('[SCP Express] Initializing...');

        dispatch(
          d.scp.e.scpInitialize({
            transportConfiguration: {
              mode: 'http',
              port: 7111,
              // C667 · S0b THE LOOPBACK BIND (template parity to the bridge C666 flip): the
              // SCP's own Express transport must not be reachable from other LAN hosts. The
              // Electron window loads this SCP via http://localhost:${port} (same-machine),
              // so loopback breaks nothing.
              host: '127.0.0.1',
            },
          }),
          { iterateStage: true },
        );
        return;
      }

      dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
    }),

    // Stage 2: Register Muxonomy-based tools with metadata (SCP Manifold pattern)
    // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Bridge Muxonomic File Pattern
    stage(({ dispatch, d, k }) => {
      console.log('[SCP Express] Stage 2.5 FUNCTION ENTERED');
      console.log('[SCP Express] scpMuxonomyRegistry exists:', !!scpMuxonomyRegistry);
      console.log('[SCP Express] scpMuxonomyRegistry length:', scpMuxonomyRegistry?.length || 0);
      try {
        console.log('[SCP Express] Stage 2.5 ENTERED - Iterating scpMuxonomyRegistry');

        const metadataRegistry = k.toolMetadataRegistry.select();

        // Collect all tools from all registered muxonomies
        const allRegisteredMeta: SCPQualityMetadataRegistered[] = [];
        const allToolDefs: SCPToolDefinition[] = [];

        for (const entry of scpMuxonomyRegistry) {
          const muxonomyTools = entry.muxonomic.scpToolMetadata || [];

          if (muxonomyTools.length === 0) {
            continue;
          }

          // Check if this concept's tools are already registered
          const alreadyRegistered = muxonomyTools.every((meta) => metadataRegistry[meta.toolName]);
          if (alreadyRegistered) {
            console.log(`[SCP Express] ${entry.conceptName} tools already registered`);
            continue;
          }

          console.log(
            `[SCP Express] Registering ${muxonomyTools.length} tools from ${entry.conceptName}`,
          );

          // Build registered metadata with conceptName
          for (const meta of muxonomyTools) {
            allRegisteredMeta.push({
              ...meta,
              conceptName: entry.conceptName,
            });

            // Build tool definition (placeholder handler - execution via manifold)
            allToolDefs.push({
              name: meta.toolName,
              description: meta.description,
              inputSchema: meta.inputSchema,
              registeredAt: Date.now(),
              handler: () => ({ error: 'Use manifold execution' }),
            });
          }
        }

        // MD-CE-7 · THE EDITOR TOOL FAMILY — the Code Editor's five editor_* tools join the
        // SCP's own /mcp surface here (direct handlers · the LEGACY execution path · the same
        // editorFs guards as the /editor-fs express routes). Graphite Scribe calls these.
        allToolDefs.push(...buildEditorScpTools());

        // Register all collected tools
        if (allToolDefs.length > 0) {
          console.log(
            `[SCP Express] Registering ${allToolDefs.length} total tools from Muxonomy Registry`,
          );

          // Build metadata registry map
          const metadataRegistryMap: Record<string, SCPQualityMetadataRegistered> =
            Object.fromEntries(allRegisteredMeta.map((m) => [m.toolName, m]));

          dispatch(
            d.scp.e.scpRegisterToolsWithMetadata({
              tools: allToolDefs,
              metadataRegistry: metadataRegistryMap,
            }),
            { iterateStage: true },
          );
          return;
        }

        dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
      } catch (e) {
        console.error('[SCP Express] Stage 2.5 ERROR:', e);
        dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
      }
    }),

    // Stage 3: Ready - sync SCP state for HTTP handler access
    // Note: clientState cache is updated via syncClientState.quality.ts
    stage(
      ({ concepts, k }) => {
        const state = k.getState(concepts);
        if (state) {
          scpState = state;
        }
      },
      {
        beat: 30,
      },
    ),

    conclude(),
  ]);
};
