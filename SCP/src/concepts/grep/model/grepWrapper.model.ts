/**
 * Grep CLI Wrapper Model
 *
 * Wraps ripgrep (rg) CLI for fast file searching and replacement.
 * Falls back to Node.js fs/glob if ripgrep not available.
 *
 * ARCHITECTURAL NOTE: This is a stateless endpoint wrapper.
 * Each operation is independent - no session tracking needed.
 * AsyncQualities call these methods and fire strategy on completion.
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: Claude Server claudeCLIWrapper.model.ts (pattern reference)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type {
  GrepMatch,
  GrepSearchResult,
  GrepReplaceResult,
  GrepReplaceRequest,
} from '../grep.type';

const execAsync = promisify(exec);

// ============================================
// RIPGREP CHECK
// ============================================

let ripgrepAvailable: boolean | null = null;

/**
 * Check if ripgrep (rg) is available on the system
 * Result is cached after first check
 */
export async function checkRipgrepAvailable(): Promise<boolean> {
  if (ripgrepAvailable !== null) {
    return ripgrepAvailable;
  }

  try {
    await execAsync('which rg');
    ripgrepAvailable = true;
    console.log('[GrepWrapper] ripgrep (rg) is available');
  } catch {
    ripgrepAvailable = false;
    console.log('[GrepWrapper] ripgrep (rg) not found, using Node.js fallback');
  }

  return ripgrepAvailable;
}

// ============================================
// SEARCH OPERATIONS
// ============================================

/**
 * Search for pattern in files
 *
 * @param pattern - Regex pattern to search for
 * @param targetDirectory - Directory to search in
 * @param fileGlob - Glob pattern for files (e.g., "**\/*.ts")
 * @returns Search result with matches
 */
export async function searchPattern(
  pattern: string,
  targetDirectory: string,
  fileGlob: string = '**/*.ts'
): Promise<GrepSearchResult> {
  const useRg = await checkRipgrepAvailable();
  const startTime = Date.now();

  if (useRg) {
    return searchWithRipgrep(pattern, targetDirectory, fileGlob, startTime);
  } else {
    return searchWithNodeFs(pattern, targetDirectory, fileGlob, startTime);
  }
}

/**
 * Search using ripgrep CLI
 */
async function searchWithRipgrep(
  pattern: string,
  targetDirectory: string,
  fileGlob: string,
  startTime: number
): Promise<GrepSearchResult> {
  const matches: GrepMatch[] = [];
  let filesSearched = 0;

  try {
    // Use ripgrep with JSON output for structured results
    // --json provides structured output
    // -g for glob pattern
    // -n for line numbers
    const { stdout } = await execAsync(
      `rg --json -g "${fileGlob}" "${pattern}" "${targetDirectory}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    // Parse JSON lines output
    const lines = stdout.trim().split('\n').filter(Boolean);
    const seenFiles = new Set<string>();

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        if (entry.type === 'match') {
          const match = entry.data;
          matches.push({
            filePath: match.path.text,
            lineNumber: match.line_number,
            lineContent: match.lines.text.trim(),
            matchStart: match.submatches[0]?.start ?? 0,
            matchEnd: match.submatches[0]?.end ?? 0,
          });
          seenFiles.add(match.path.text);
        } else if (entry.type === 'summary') {
          filesSearched = entry.data.stats.searches;
        }
      } catch {
        // Skip malformed JSON lines
      }
    }

    if (filesSearched === 0) {
      filesSearched = seenFiles.size;
    }
  } catch (error: unknown) {
    // ripgrep returns exit code 1 when no matches found - not an error
    const execError = error as { code?: number; stdout?: string };
    if (execError.code !== 1) {
      console.error('[GrepWrapper] ripgrep error:', error);
    }
  }

  return {
    pattern,
    matches,
    filesSearched,
    timestamp: startTime,
  };
}

/**
 * Search using Node.js fs (fallback when ripgrep not available)
 */
async function searchWithNodeFs(
  pattern: string,
  targetDirectory: string,
  fileGlob: string,
  startTime: number
): Promise<GrepSearchResult> {
  const matches: GrepMatch[] = [];
  const regex = new RegExp(pattern, 'g');

  // Get all matching files
  const files = await getFilesMatchingGlob(targetDirectory, fileGlob);

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
          matches.push({
            filePath,
            lineNumber: i + 1,
            lineContent: line.trim(),
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }
    } catch (error) {
      console.error(`[GrepWrapper] Error reading ${filePath}:`, error);
    }
  }

  return {
    pattern,
    matches,
    filesSearched: files.length,
    timestamp: startTime,
  };
}

// ============================================
// REPLACE OPERATIONS
// ============================================

/**
 * Replace pattern in files
 *
 * @param request - Replace request with pattern, replacement, and scope
 * @returns Replace result with modified files list
 */
export async function replaceInFiles(
  request: GrepReplaceRequest
): Promise<GrepReplaceResult> {
  const { searchPattern, replaceWith, targetDirectory, fileGlob, dryRun } = request;
  const regex = new RegExp(searchPattern, 'g');
  const filesModified: string[] = [];
  const errors: string[] = [];
  let totalReplacements = 0;

  // Get all matching files
  const files = await getFilesMatchingGlob(targetDirectory, fileGlob);

  console.log(`[GrepWrapper] Searching ${files.length} files for pattern: ${searchPattern}`);

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const newContent = content.replace(regex, replaceWith);

      if (content !== newContent) {
        // Count replacements
        const matchCount = (content.match(regex) || []).length;
        totalReplacements += matchCount;

        if (!dryRun) {
          await fs.writeFile(filePath, newContent, 'utf-8');
          console.log(`[GrepWrapper] Modified: ${filePath} (${matchCount} replacements)`);
        } else {
          console.log(`[GrepWrapper] Would modify: ${filePath} (${matchCount} replacements)`);
        }

        filesModified.push(filePath);
      }
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error}`;
      console.error(`[GrepWrapper] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log(`[GrepWrapper] ${dryRun ? 'Dry run complete' : 'Replace complete'}: ${filesModified.length} files, ${totalReplacements} replacements`);

  return {
    filesModified,
    totalReplacements,
    errors,
    dryRun,
  };
}

// ============================================
// FILE GLOB HELPER
// ============================================

/**
 * Get files matching glob pattern within directory
 * Simple implementation - supports ** and * patterns
 */
async function getFilesMatchingGlob(
  directory: string,
  globPattern: string
): Promise<string[]> {
  const results: string[] = [];

  // Convert glob to regex
  const regexPattern = globPattern
    .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<DOUBLESTAR>>>/g, '.*')
    .replace(/\./g, '\\.');

  const regex = new RegExp(`^${regexPattern}$`);

  async function walkDir(dir: string, relativePath: string = ''): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          // Skip node_modules and dist
          if (entry.name !== 'node_modules' && entry.name !== 'dist') {
            await walkDir(fullPath, relPath);
          }
        } else if (entry.isFile() && regex.test(relPath)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`[GrepWrapper] Error reading directory ${dir}:`, error);
    }
  }

  await walkDir(directory);
  return results;
}
