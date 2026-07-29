/**
 * Client State Cache - Shared State Access for SCP Tools
 *
 * Suite 5 Cobalt - Professional Implementation
 *
 * Purpose:
 * - Provides cached clientState access for SCP tools
 * - Breaks circular dependency between principle and protocol
 * - Principle calls setClientState(), tools call getClientState()
 */

// Module-level cache
let cachedClientState: unknown = {};

/**
 * setClientState - Called by scpExpressTransport.principle.ts
 *
 * Updates the cached client state from Huirth's synced state
 */
export function setClientState(state: unknown): void {
  cachedClientState = state;
}

/**
 * getClientState - Called by SCP tools
 *
 * Returns the current cached client state
 */
export function getClientState(): unknown {
  return cachedClientState;
}
