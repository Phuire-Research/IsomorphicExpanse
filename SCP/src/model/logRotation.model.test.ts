/**
 * Log Rotation Utility Tests — M2-P3
 *
 * Pure-function tests for logRotation.model.ts. Uses tmpdir for isolation.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-P3
 * Citation: STRATIMUX-REFERENCE.md "🧪 Stratimux Testing Patterns"
 */
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  checkRotationNeeded,
  rotateLogIfNeeded,
  formatRotationHeader,
  readTailLines,
  queryLogPattern,
  appendAndMaybeRotate,
} from './logRotation.model';

describe('logRotation.model', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'scp-log-test-'));
    logPath = path.join(tmpDir, 'bridge.log');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ============================================
  // checkRotationNeeded
  // ============================================

  describe('checkRotationNeeded', () => {
    it('returns false for missing file', () => {
      expect(checkRotationNeeded(logPath, 100)).toBe(false);
    });

    it('returns false when file is under cap', () => {
      writeFileSync(logPath, 'hello\n');
      expect(checkRotationNeeded(logPath, 1000)).toBe(false);
    });

    it('returns true when file exceeds cap', () => {
      writeFileSync(logPath, 'x'.repeat(2000));
      expect(checkRotationNeeded(logPath, 1000)).toBe(true);
    });
  });

  // ============================================
  // rotateLogIfNeeded
  // ============================================

  describe('rotateLogIfNeeded', () => {
    it('no-op on file under cap', () => {
      const content = 'line1\nline2\n';
      writeFileSync(logPath, content);
      const rotated = rotateLogIfNeeded(logPath, 1000, 500);
      expect(rotated).toBe(false);
      expect(readFileSync(logPath, 'utf8')).toBe(content);
    });

    it('rotates file over cap, preserves tail content', () => {
      // Create file with 100 lines, each ~10 bytes
      const lines = Array.from({ length: 100 }, (_, i) => `line${i.toString().padStart(3, '0')}`);
      writeFileSync(logPath, lines.join('\n') + '\n');
      // Cap at 100 bytes, trim to 50 bytes
      const rotated = rotateLogIfNeeded(logPath, 100, 50);
      expect(rotated).toBe(true);
      const result = readFileSync(logPath, 'utf8');
      // Header present
      expect(result).toMatch(/^\[LOG ROTATED .*\] original=\d+B retained=\d+B\n/);
      // Tail content preserved
      expect(result).toContain('line099');
      // Early content stripped
      expect(result).not.toContain('line000');
    });

    it('strips orphan partial line at top of slice', () => {
      // Construct content where the trim boundary falls mid-line
      writeFileSync(logPath, 'aaaaaaaaaa\nbbbbbbbbbb\ncccccccccc\n');
      rotateLogIfNeeded(logPath, 10, 15);
      const result = readFileSync(logPath, 'utf8');
      // Should NOT contain a partial-line fragment at start of content (post-header)
      const postHeader = result.split('\n').slice(1).join('\n');
      // First line of remaining content should be a complete line
      expect(postHeader.startsWith('cccccccccc') || postHeader.startsWith('bbbbbbbbbb')).toBe(true);
    });

    it('non-fatal on missing file', () => {
      const rotated = rotateLogIfNeeded(logPath, 100, 50);
      expect(rotated).toBe(false);
    });
  });

  // ============================================
  // formatRotationHeader
  // ============================================

  describe('formatRotationHeader', () => {
    it('formats with ISO timestamp + byte counts', () => {
      const header = formatRotationHeader(2000, 1000);
      expect(header).toMatch(/^\[LOG ROTATED \d{4}-\d{2}-\d{2}T.*Z\] original=2000B retained=1000B\n$/);
    });
  });

  // ============================================
  // readTailLines
  // ============================================

  describe('readTailLines', () => {
    it('returns empty entry for missing file (not error)', () => {
      const entry = readTailLines(logPath, 'bridge', 10);
      expect(entry.lines).toEqual([]);
      expect(entry.totalLines).toBe(0);
      expect(entry.truncated).toBe(false);
      expect(entry.source).toBe('bridge');
    });

    it('returns all lines when under maxLines', () => {
      writeFileSync(logPath, 'a\nb\nc\n');
      const entry = readTailLines(logPath, 'bridge', 10);
      expect(entry.lines).toEqual(['a', 'b', 'c']);
      expect(entry.totalLines).toBe(3);
      expect(entry.truncated).toBe(false);
    });

    it('returns tail and sets truncated=true when over maxLines', () => {
      const lines = Array.from({ length: 20 }, (_, i) => `line${i}`);
      writeFileSync(logPath, lines.join('\n') + '\n');
      const entry = readTailLines(logPath, 'bridge', 5);
      expect(entry.lines).toEqual(['line15', 'line16', 'line17', 'line18', 'line19']);
      expect(entry.totalLines).toBe(20);
      expect(entry.truncated).toBe(true);
    });

    it('honors source parameter', () => {
      writeFileSync(logPath, 'x\n');
      expect(readTailLines(logPath, 'bun', 5).source).toBe('bun');
    });
  });

  // ============================================
  // queryLogPattern
  // ============================================

  describe('queryLogPattern', () => {
    it('returns matching lines only', () => {
      writeFileSync(logPath, 'error: foo\ninfo: bar\nerror: baz\n');
      const entry = queryLogPattern(logPath, 'bridge', '^error', 100);
      expect(entry.lines).toEqual(['error: foo', 'error: baz']);
      expect(entry.totalLines).toBe(2);
      expect(entry.truncated).toBe(false);
    });

    it('returns empty entry for invalid regex', () => {
      writeFileSync(logPath, 'x\n');
      const entry = queryLogPattern(logPath, 'bridge', '(unclosed', 100);
      expect(entry.lines).toEqual([]);
    });

    it('caps results at maxLines, marks truncated', () => {
      const lines = Array.from({ length: 10 }, (_, i) => `match${i}`);
      writeFileSync(logPath, lines.join('\n') + '\n');
      const entry = queryLogPattern(logPath, 'bridge', '^match', 3);
      expect(entry.lines.length).toBe(3);
      expect(entry.totalLines).toBe(10);
      expect(entry.truncated).toBe(true);
    });
  });

  // ============================================
  // appendAndMaybeRotate
  // ============================================

  describe('appendAndMaybeRotate', () => {
    it('appends text and increments writeCount', () => {
      const result = appendAndMaybeRotate(logPath, 'hello\n', 0, 100);
      expect(result.newWriteCount).toBe(1);
      expect(result.rotated).toBe(false);
      expect(readFileSync(logPath, 'utf8')).toBe('hello\n');
    });

    it('triggers rotation at interval boundary when over cap', () => {
      writeFileSync(logPath, 'x'.repeat(200));
      // currentWriteCount=99, increment makes 100, which is interval boundary
      const result = appendAndMaybeRotate(logPath, 'new\n', 99, 100, 50, 30);
      expect(result.newWriteCount).toBe(100);
      expect(result.rotated).toBe(true);
    });

    it('does not rotate when interval not reached', () => {
      writeFileSync(logPath, 'x'.repeat(200));
      const result = appendAndMaybeRotate(logPath, 'new\n', 50, 100, 50, 30);
      expect(result.newWriteCount).toBe(51);
      expect(result.rotated).toBe(false);
    });
  });
});
