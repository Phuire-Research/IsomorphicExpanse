/**
 * SCP Log Concept Type Definitions
 *
 * Server-side concept managing bridge.log + bun.log read/truncate/query
 * operations for the SCS-Bridge log dump UI. Ports ADMIN_ICP precedent:
 *   - rotation thresholds 2MB cap → trim to 1MB tail
 *   - rotation timing every 100 writes
 *   - logs path /.claude/claudebridge/ (per Q4 locked decision)
 *
 * Higher-Order Composition: standalone base concept; huirth muxifies it
 * (access via d.huirth.d.scpLog.k.lastQuery.select()). Distinct from
 * scpRegistry — different operational aspect (logs vs registry).
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-P2 (types) + M2-P3 (rotation impl)
 * Citation: SUITE-3-YELLOW-MACRO-2-ARCHITECTURE.md (R3 grounding)
 * Citation: SUITE-1-RED-MACRO-2-CURATION.md (ADMIN_ICP bridge.log rotation pattern · lines 2544-2557)
 */
import type { AnyAction } from 'stratimux';

// ============================================
// SCP LOG NAME CONSTANT
// ============================================

export const scpLogName = 'scpLog';

// ============================================
// LOG SOURCE + ENTRY TYPES
// ============================================

export type ScpLogSource = 'bridge' | 'bun';

export type ScpLogEntry = {
  source: ScpLogSource;
  lines: string[];               // matched/tail lines
  totalLines: number;            // total lines in file
  truncated: boolean;            // true if file > maxTailLines
  queriedAt: number;             // ms epoch
};

// ============================================
// CONCEPT STATE (server-side)
// ============================================

export type ScpLogState = {
  // InductionState (Diametric Quality routing)
  actionQue: AnyAction[];
  filterKeys: string[];

  // Log paths (abs)
  bridgeLogPath: string;
  bunLogPath: string;

  // Read/query config
  maxTailLines: number;          // default 200 — max lines returned per query
  lastQuery: ScpLogEntry | null;

  // Rotation state (ADMIN_ICP precedent)
  bridgeLogWriteCount: number;   // increments per write; triggers rotation check every 100
  bunLogWriteCount: number;
};

// ============================================
// QUALITY PAYLOAD TYPES (Verbose Split Naming)
// ============================================

export type ScpLogReadTailPayload = {
  source: ScpLogSource;
  maxLines?: number;             // overrides state.maxTailLines for this call
};

export type ScpLogQueryPayload = {
  source: ScpLogSource;
  pattern: string;               // regex pattern
  maxLines?: number;
};

export type ScpLogSetResultPayload = {
  result: ScpLogEntry;
};

export type ScpLogRotateIfNeededPayload = {
  source: ScpLogSource;
};

// ============================================
// ROTATION CONSTANTS (ported from ADMIN_ICP)
// ============================================

export const SCP_LOG_MAX_BYTES = 2 * 1024 * 1024;        // 2MB hard cap
export const SCP_LOG_TRIM_TO_BYTES = 1 * 1024 * 1024;    // 1MB tail retained after rotation
export const SCP_LOG_ROTATION_CHECK_INTERVAL = 100;       // check every N writes
export const SCP_LOG_DEFAULT_MAX_TAIL_LINES = 200;
export const SCP_LOG_DEFAULT_BRIDGE_LOG_RELATIVE = '.claude/claudebridge/bridge.log';
export const SCP_LOG_DEFAULT_BUN_LOG_RELATIVE = '.claude/claudebridge/bun.log';
