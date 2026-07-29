import type { WebSocketServerPrinciple, WebSocketServerState } from '../webSocketServer.concept';
import type { ServerState } from '../../server/server.concept';
import _ws from 'express-ws';
import WebSocket from 'ws';

/**
 * VPN WebSocket Proxy Principle
 *
 * Provides bidirectional passthrough between external clients and EasyTier sidecar.
 * This principle operates independently of Stratimux state synchronization.
 *
 * Route: /vpn
 * Upstream: ws://localhost:11010 (EasyTier WebSocket listener)
 *
 * CRITICAL: Pure passthrough - no message parsing, validation, or transformation.
 * Binary frames must pass through unmodified for VPN protocol integrity.
 */

const EASYTIER_WS_URL = process.env.EASYTIER_WS_URL || 'ws://localhost:11010';
const VPN_RECONNECT_DELAY = 1000; // ms before retry on upstream failure
const VPN_MAX_RECONNECTS = 3; // Max reconnection attempts per client

export const vpnProxyPrinciple: WebSocketServerPrinciple = ({ k_, concepts_ }) => {
  const initialServerState = k_.getState(concepts_) as WebSocketServerState & ServerState;
  const server = initialServerState.server;

  if (!server) {
    console.error('[VPN Proxy] No server instance available');
    return;
  }

  // Wrap Express app for WebSocket support
  const socket = _ws(server);

  // Track active connections for monitoring
  let activeConnections = 0;

  socket.app.ws('/vpn', (clientWs, req) => {
    const clientId = `vpn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    let reconnectAttempts = 0;
    let upstream: WebSocket | null = null;
    let isClosing = false;

    console.log(`[VPN Proxy] Client ${clientId} connected from ${req.ip}`);
    activeConnections++;

    /**
     * Establish upstream connection to EasyTier sidecar
     */
    const connectUpstream = () => {
      if (isClosing) return;

      upstream = new WebSocket(EASYTIER_WS_URL, {
        // Binary type for VPN traffic
        perMessageDeflate: false,
      });

      upstream.binaryType = 'arraybuffer';

      upstream.on('open', () => {
        console.log(`[VPN Proxy] Client ${clientId} connected to EasyTier`);
        reconnectAttempts = 0; // Reset on successful connection
      });

      upstream.on('message', (data: WebSocket.Data) => {
        // Passthrough: upstream -> client
        if (clientWs.readyState === WebSocket.OPEN) {
          try {
            // Send as binary buffer for VPN protocol integrity
            if (data instanceof ArrayBuffer) {
              clientWs.send(Buffer.from(data));
            } else if (Buffer.isBuffer(data)) {
              clientWs.send(data);
            } else {
              clientWs.send(data);
            }
          } catch (err) {
            console.error(`[VPN Proxy] Error sending to client ${clientId}:`, err);
          }
        }
      });

      upstream.on('close', (code, reason) => {
        console.log(`[VPN Proxy] Upstream closed for ${clientId}: ${code} ${reason}`);

        if (!isClosing && reconnectAttempts < VPN_MAX_RECONNECTS) {
          reconnectAttempts++;
          console.log(
            `[VPN Proxy] Reconnecting ${clientId} (attempt ${reconnectAttempts}/${VPN_MAX_RECONNECTS})`,
          );
          setTimeout(connectUpstream, VPN_RECONNECT_DELAY);
        } else if (!isClosing) {
          console.log(`[VPN Proxy] Max reconnects reached for ${clientId}, closing client`);
          cleanup();
        }
      });

      upstream.on('error', (err) => {
        console.error(`[VPN Proxy] Upstream error for ${clientId}:`, err.message);
        // Error will trigger close event, which handles reconnection
      });
    };

    /**
     * Handle client -> upstream passthrough
     */
    clientWs.on('message', (data: WebSocket.Data) => {
      if (upstream && upstream.readyState === WebSocket.OPEN) {
        try {
          // Passthrough: client -> upstream (binary-safe)
          upstream.send(data);
        } catch (err) {
          console.error(`[VPN Proxy] Error sending to upstream for ${clientId}:`, err);
        }
      } else {
        console.warn(`[VPN Proxy] Upstream not ready for ${clientId}, buffering not implemented`);
        // Future enhancement: implement message buffering during reconnection
      }
    });

    /**
     * Cleanup function for connection termination
     */
    const cleanup = () => {
      if (isClosing) return;
      isClosing = true;

      console.log(`[VPN Proxy] Cleaning up client ${clientId}`);
      activeConnections--;

      if (upstream) {
        try {
          if (
            upstream.readyState === WebSocket.OPEN ||
            upstream.readyState === WebSocket.CONNECTING
          ) {
            upstream.close(1000, 'Client disconnected');
          }
        } catch (err) {
          // Ignore cleanup errors
        }
        upstream = null;
      }

      if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
        try {
          clientWs.close(1000, 'Connection terminated');
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };

    // Client disconnect handler
    clientWs.on('close', (code, reason) => {
      console.log(`[VPN Proxy] Client ${clientId} disconnected: ${code} ${reason}`);
      cleanup();
    });

    clientWs.on('error', (err) => {
      console.error(`[VPN Proxy] Client ${clientId} error:`, err.message);
      cleanup();
    });

    // Initiate upstream connection
    connectUpstream();
  });

  // Health check endpoint for VPN proxy status
  socket.app.get('/vpn/health', (req, res) => {
    // Test upstream connectivity
    const testWs = new WebSocket(EASYTIER_WS_URL);
    const timeout = setTimeout(() => {
      testWs.close();
      res.status(503).json({
        status: 'unhealthy',
        upstream: EASYTIER_WS_URL,
        error: 'Connection timeout',
        activeConnections,
      });
    }, 5000);

    testWs.on('open', () => {
      clearTimeout(timeout);
      testWs.close();
      res.json({
        status: 'healthy',
        upstream: EASYTIER_WS_URL,
        activeConnections,
      });
    });

    testWs.on('error', (err) => {
      clearTimeout(timeout);
      res.status(503).json({
        status: 'unhealthy',
        upstream: EASYTIER_WS_URL,
        error: err.message,
        activeConnections,
      });
    });
  });

  console.log(`[VPN Proxy] Initialized - upstream: ${EASYTIER_WS_URL}`);
};
