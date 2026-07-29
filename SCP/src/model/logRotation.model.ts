/**
 * Log Rotation Utility — ADMIN_ICP Port (M2-P3)
 *
 * Pure functions for bridge.log + bun.log rotation. Ported from ADMIN_ICP
 * bridge.log rotation pattern (R1 curation lines 2544-2557):
 *   - 2MB hard cap → trim to 1MB tail
 *   - Rotation check every 100 writes
 *   - Best-effort (non-fatal · errors swallowed at caller)
 *   - Truncation header preserved at top of rotated file
 *
 * Higher-Order Composition: pure functions composed by scpLog concept
 * qualities (M2-A1-D4 wires the Diameter to SCS-Bridge log dump UI).
 * No state owned by this module; all I/O parameterized.
 *
 * Citation: SUITE-1-RED-MACRO-2-CURATION.md (R1 ADMIN_ICP grounding lines 2544-2557)
 * Citation: DIAMOND-TIER-MACRO-2.md M2-P3
 * Citation: scpLog.type.ts (constant + type source)
 */
import {
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import type { ScpLogEntry, ScpLogSource } from '../concepts/scpLog/scpLog.type';
import {
  SCP_LOG_MAX_BYTES,
  SCP_LOG_TRIM_TO_BYTES,
  SCP_LOG_DEFAULT_MAX_TAIL_LINES,
} from '../concepts/scpLog/scpLog.type';

// ============================================
// ROTATION CORE
// ============================================

/**
 * Returns true if the file at `logPath` exceeds `maxBytes` and rotation
 * is warranted. False on missing file (nothing to rotate).
 *
 * Pure observation — no I/O side effects.
 */
export function checkRotationNeeded(logPath: string, maxBytes: number = SCP_LOG_MAX_BYTES): boolean {
  if (!existsSync(logPath)) return false;
  try {
    const stat = statSync(logPath);
    return stat.size > maxBytes;
  } catch {
    return false;
  }
}

/**
 * Rotates the log file at `logPath` if it exceeds `maxBytes`.
 *
 * Algorithm (ADMIN_ICP-faithful):
 *   1. Read entire file into buffer
 *   2. Slice to last `trimToBytes` bytes
 *   3. Find first newline in the slice (avoid orphan partial line at top)
 *   4. Prepend truncation header with rotation metadata
 *   5. Write atomically (writeFileSync replaces full content)
 *
 * Best-effort: errors swallowed and logged via the optional `onError` callback.
 * Returns true if rotation occurred, false otherwise.
 */
export function rotateLogIfNeeded(
  logPath: string,
  maxBytes: number = SCP_LOG_MAX_BYTES,
  trimToBytes: number = SCP_LOG_TRIM_TO_BYTES,
  onError?: (err: Error) => void,
): boolean {
  if (!checkRotationNeeded(logPath, maxBytes)) return false;

  try {
    const fullContent = readFileSync(logPath, 'utf8');
    const tailSlice = fullContent.slice(-trimToBytes);
    const firstNewline = tailSlice.indexOf('\n');
    const cleanTail = firstNewline >= 0 ? tailSlice.slice(firstNewline + 1) : tailSlice;
    const header = formatRotationHeader(fullContent.length, cleanTail.length);
    writeFileSync(logPath, header + cleanTail, 'utf8');
    return true;
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return false;
  }
}

/**
 * Truncation header prepended atop rotated log. Records original size,
 * retained size, and rotation timestamp for downstream forensics.
 */
export function formatRotationHeader(originalBytes: number, retainedBytes: number): string {
  const ts = new Date().toISOString();
  return `[LOG ROTATED ${ts}] original=${originalBytes}B retained=${retainedBytes}B\n`;
}

// ============================================
// READ / QUERY (consumed by SCS-Bridge log dump UI · M2-A1-D4)
// ============================================

/**
 * Reads the last `maxLines` from `logPath`. Returns ScpLogEntry shape with
 * `truncated: true` if the file had more lines than returned.
 *
 * `source` is metadata only — caller specifies which log this is for the UI.
 * Returns an empty-lines entry if file doesn't exist (NOT an error).
 */
export function readTailLines(
  logPath: string,
  source: ScpLogSource,
  maxLines: number = SCP_LOG_DEFAULT_MAX_TAIL_LINES,
): ScpLogEntry {
  if (!existsSync(logPath)) {
    return {
      source,
      lines: [],
      totalLines: 0,
      truncated: false,
      queriedAt: Date.now(),
    };
  }
  try {
    const content = readFileSync(logPath, 'utf8');
    const allLines = content.split('\n');
    // Trailing empty line from final newline is common — strip for accurate count
    const cleanLines = allLines[allLines.length - 1] === '' ? allLines.slice(0, -1) : allLines;
    const totalLines = cleanLines.length;
    const tail = totalLines > maxLines ? cleanLines.slice(-maxLines) : cleanLines;
    return {
      source,
      lines: tail,
      totalLines,
      truncated: totalLines > maxLines,
      queriedAt: Date.now(),
    };
  } catch {
    return {
      source,
      lines: [],
      totalLines: 0,
      truncated: false,
      queriedAt: Date.now(),
    };
  }
}

/**
 * Returns matching lines from `logPath` filtered by `pattern` (regex source).
 * Honors `maxLines` cap on results. Invalid pattern returns empty entry.
 */
export function queryLogPattern(
  logPath: string,
  source: ScpLogSource,
  pattern: string,
  maxLines: number = SCP_LOG_DEFAULT_MAX_TAIL_LINES,
): ScpLogEntry {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return {
      source,
      lines: [],
      totalLines: 0,
      truncated: false,
      queriedAt: Date.now(),
    };
  }
  if (!existsSync(logPath)) {
    return {
      source,
      lines: [],
      totalLines: 0,
      truncated: false,
      queriedAt: Date.now(),
    };
  }
  try {
    const content = readFileSync(logPath, 'utf8');
    const allLines = content.split('\n');
    const cleanLines = allLines[allLines.length - 1] === '' ? allLines.slice(0, -1) : allLines;
    const matches = cleanLines.filter((line) => regex.test(line));
    const totalMatches = matches.length;
    const capped = totalMatches > maxLines ? matches.slice(-maxLines) : matches;
    return {
      source,
      lines: capped,
      totalLines: totalMatches,
      truncated: totalMatches > maxLines,
      queriedAt: Date.now(),
    };
  } catch {
    return {
      source,
      lines: [],
      totalLines: 0,
      truncated: false,
      queriedAt: Date.now(),
    };
  }
}

// ============================================
// WRITE (used by future spawn-piping in M2-A1-D5)
// ============================================

/**
 * Append `text` to `logPath`, then conditionally rotate if rotation-check
 * interval has elapsed. Returns the new write count so callers can persist
 * it to state.
 *
 * Caller is responsible for tracking the write count between calls (typically
 * in scpLog state). This function performs the rotation check inline but
 * does NOT persist state — that's the consuming quality's responsibility.
 */
export function appendAndMaybeRotate(
  logPath: string,
  text: string,
  currentWriteCount: number,
  rotationCheckInterval: number,
  maxBytes: number = SCP_LOG_MAX_BYTES,
  trimToBytes: number = SCP_LOG_TRIM_TO_BYTES,
  onError?: (err: Error) => void,
): { newWriteCount: number; rotated: boolean } {
  try {
    appendFileSync(logPath, text, 'utf8');
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return { newWriteCount: currentWriteCount, rotated: false };
  }
  const newWriteCount = currentWriteCount + 1;
  let rotated = false;
  if (newWriteCount % rotationCheckInterval === 0) {
    rotated = rotateLogIfNeeded(logPath, maxBytes, trimToBytes, onError);
  }
  return { newWriteCount, rotated };
}
