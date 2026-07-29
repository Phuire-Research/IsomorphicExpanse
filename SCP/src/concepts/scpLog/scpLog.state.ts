/**
 * SCP Log Concept State Factory
 *
 * Server-side concept state for bridge.log + bun.log read/truncate/query.
 * Initializes path defaults per Q4 (ADMIN_ICP `/.claude/claudebridge/`) and
 * rotation/tail constants per ADMIN_ICP curation (R1 grounding).
 *
 * Higher-Order Composition: this state factory produces a base concept's
 * state shape; huirth muxifies the concept (Tier 1 → 2 access:
 * `d.huirth.d.scpLog.k.lastQuery.select()`).
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-P3
 * Citation: scpLog.type.ts (type + constant source)
 * Citation: SUITE-1-RED-MACRO-2-CURATION.md (R1 ADMIN_ICP grounding)
 */
import path from 'node:path';
import type { ScpLogState } from './scpLog.type';
import {
  SCP_LOG_DEFAULT_MAX_TAIL_LINES,
  SCP_LOG_DEFAULT_BRIDGE_LOG_RELATIVE,
  SCP_LOG_DEFAULT_BUN_LOG_RELATIVE,
} from './scpLog.type';

// ============================================
// STATE FACTORY
// ============================================

/**
 * Creates the initial scpLog state. `projectRoot` resolves the relative log
 * paths to absolute paths at startup.
 *
 * Defaults:
 *   - bridgeLogPath = {projectRoot}/.claude/claudebridge/bridge.log
 *   - bunLogPath = {projectRoot}/.claude/claudebridge/bun.log
 *   - maxTailLines = 200
 *   - lastQuery = null (no query yet performed)
 *   - bridgeLogWriteCount = 0 · bunLogWriteCount = 0
 */
export function createScpLogState(projectRoot: string = process.cwd()): ScpLogState {
  return {
    // InductionState (Diametric Quality routing)
    actionQue: [],
    filterKeys: SCPLOG_FILTER_KEYS,

    // Log paths (resolved to abs)
    bridgeLogPath: path.resolve(projectRoot, SCP_LOG_DEFAULT_BRIDGE_LOG_RELATIVE),
    bunLogPath: path.resolve(projectRoot, SCP_LOG_DEFAULT_BUN_LOG_RELATIVE),

    // Read/query config
    maxTailLines: SCP_LOG_DEFAULT_MAX_TAIL_LINES,
    lastQuery: null,

    // Rotation state (ADMIN_ICP precedent · increments per write)
    bridgeLogWriteCount: 0,
    bunLogWriteCount: 0,
  };
}

// ============================================
// FILTER KEYS (server-only state · does not sync to client)
// ============================================

export const SCPLOG_FILTER_KEYS: string[] = [
  // InductionState
  'actionQue',
  'filterKeys',

  // Path config (server-resolved at startup)
  'bridgeLogPath',
  'bunLogPath',

  // Read/query config
  'maxTailLines',

  // Rotation counters (internal accounting · not observable to client)
  'bridgeLogWriteCount',
  'bunLogWriteCount',

  // lastQuery IS synced (client reads to display log dump result)
  // intentionally NOT in filterKeys
];
