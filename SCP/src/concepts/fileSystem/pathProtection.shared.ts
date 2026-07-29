/**
 * Path Protection Model
 * Phase 3 Quining Protection System
 * Centralized path protection for dual dispatch CDRUM operations
 * Reference: Phase 2.6 Capstone - Grounded Truth Pattern
 *
 * MD-A D5 · THE PROTECTION RE-ANCHOR (the Release Candidate epoch):
 * the boundary anchor was a literal path segment — the developer monorepo's
 * directory name, a fossil that never appears on a user machine, so
 * every guard silently allowed everything (the rimraf gate stood open). The
 * anchor is now the SCP PACKAGE ROOT resolved at runtime from process.cwd()
 * (the SCP process launches at its package root — the findRoot precedent).
 * The host project root (the workspace above) is a DISTINCT, dormant boundary
 * reserved for the future OUTSIDE gate + AllowedPaths model.
 *
 * Architecture:
 * - FileManager: Our OS concept for managed file operations (future)
 * - FileSystem: Current OS interaction layer (uni-directional tree)
 * - CDRUM: Central enforcement point for all operations
 * - AllowedPaths: Future extensible permission model
 */

import { CDRUMOperation } from './CDRUM.shared';

/**
 * Protected SCP package root directories
 * All directories except buildPlatform are protected from deletion
 */
export const SCP_ROOT_PROTECTED_DIRECTORIES = [
  'src',
  'public',
  'scripts',
  '.git',
  'node_modules', // Protect dependency directories
] as const;

/**
 * Protected SCP package root files
 * Critical configuration and documentation files at the package root
 */
export const SCP_ROOT_PROTECTED_FILES = [
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE',
  'SCP-TEMPLATE.md',
  '.gitignore',
  '.env',
  '.env.local',
  'tsconfig.json',
  'vite.client.config.ts',
  'vite.ssr.config.ts',
  'jest.config.js',
  'jest.config.cjs',
  'nodemon.json',
  'scp.config.json',
  'template-version.json',
  'index.html',
] as const;

/**
 * Path Protection Error Types
 */
export enum PathProtectionError {
  PROTECTED_SOURCE_DIRECTORY = 'PROTECTED_SOURCE_DIRECTORY',
  PROTECTED_ROOT_FILE = 'PROTECTED_ROOT_FILE',
  PROTECTED_SYSTEM_FILE = 'PROTECTED_SYSTEM_FILE',
  INVALID_PATH = 'INVALID_PATH',
  OUTSIDE_PROTECTION_ROOT = 'OUTSIDE_PROTECTION_ROOT', // Future: paths outside the SCP package root without permission
  NOT_IN_ALLOWED_PATHS = 'NOT_IN_ALLOWED_PATHS', // Future: External path not in AllowedPaths
}

/**
 * Path Protection Result
 */
export interface PathProtectionResult {
  isProtected: boolean;
  reason?: string;
  errorType?: PathProtectionError;
  allowedAction?: string; // Suggested alternative action
  requiresPermission?: boolean; // Future: Indicates need for AllowedPaths entry
}

/**
 * Normalize path for cross-platform compatibility
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

/**
 * Extract filename from path
 */
function getFilename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * THE PROTECTION ROOT — the SCP package root, resolved once at module load.
 * The SCP server process launches at its package root (the findRoot precedent),
 * so process.cwd() IS the boundary. Guarded for non-Node contexts (.shared may
 * bundle client-side, where no real filesystem operations occur): an empty root
 * degrades every check to "outside" — allow — which mirrors the file's behavior
 * anywhere the boundary is unknowable.
 */
const PROTECTION_ROOT: string =
  typeof process !== 'undefined' && typeof process.cwd === 'function'
    ? normalizePath(process.cwd())
    : '';

/**
 * Resolve a path to its package-root-relative remainder, or null when the path
 * lies outside the protection root.
 * - Absolute paths must sit under PROTECTION_ROOT (prefix match).
 * - Relative paths are root-relative by construction (the process cwd IS the
 *   root), except '..'-escapes, which resolve outside.
 */
function toRootRelative(normalizedPath: string): string | null {
  if (!PROTECTION_ROOT) return null;
  if (normalizedPath === PROTECTION_ROOT) return '';
  if (normalizedPath.startsWith(PROTECTION_ROOT + '/')) {
    return normalizedPath.slice(PROTECTION_ROOT.length + 1);
  }
  const isAbsolute = normalizedPath.startsWith('/') || /^[a-z]:\//.test(normalizedPath);
  if (!isAbsolute) {
    const relative = normalizedPath.replace(/^\.\//, '');
    if (relative.split('/').includes('..')) return null; // escapes the root
    return relative;
  }
  return null;
}

/**
 * Check if a root-relative path is a protected root file
 */
function isProtectedRootFile(rootRelative: string, path: string): boolean {
  // A root file has no directory component in its root-relative form
  if (rootRelative.includes('/')) return false;
  const filename = getFilename(path);
  return SCP_ROOT_PROTECTED_FILES.some(
    protectedFile => protectedFile.toLowerCase() === filename
  );
}

/**
 * Check if path is protected based on Phase 3 Quining rules
 *
 * Protection Logic (anchored to the SCP package root):
 * 1. If the path lies outside the protection root → ALLOW (the dormant OUTSIDE
 *    gate reserves this class for the future AllowedPaths model)
 * 2. If the path is under <root>/buildPlatform → ALLOW (the Quining exception;
 *    prefix anchoring subsumes the old copy-in-flight index comparison — any
 *    self-modification copy lives under the buildPlatform subtree)
 * 3. If path is a protected root file → PROTECT
 * 4. If path is under a protected root directory → PROTECT
 *
 * @param path - The path to check for protection
 * @returns PathProtectionResult indicating if path is protected and why
 */
export function checkPathProtection(path: string): PathProtectionResult {
  // Check for invalid paths
  if (!path || path.trim() === '') {
    return {
      isProtected: true,
      reason: 'Invalid or empty path',
      errorType: PathProtectionError.INVALID_PATH,
    };
  }

  const normalizedPath = normalizePath(path);
  const rootRelative = toRootRelative(normalizedPath);

  // Outside the protection root — allow (the future OUTSIDE gate lives here)
  if (rootRelative === null) {
    return { isProtected: false };
  }

  // Phase 3 Quining Rule: the buildPlatform subtree is destructible by design.
  // Under prefix anchoring this single exception covers both the directory
  // itself and any self-modification copy being built inside it.
  if (rootRelative === 'buildplatform' || rootRelative.startsWith('buildplatform/')) {
    return {
      isProtected: false,
      allowedAction: 'BuildPlatform is destructible by design',
    };
  }

  // Check if this is a protected root file
  if (isProtectedRootFile(rootRelative, path)) {
    const filename = getFilename(path);
    return {
      isProtected: true,
      reason: `Protected SCP root file: ${filename}`,
      errorType: PathProtectionError.PROTECTED_ROOT_FILE,
    };
  }

  // Check against protected directories
  for (const protectedDir of SCP_ROOT_PROTECTED_DIRECTORIES) {
    const dir = protectedDir.toLowerCase();
    if (rootRelative === dir || rootRelative.startsWith(`${dir}/`)) {
      return {
        isProtected: true,
        reason: `Protected SCP source directory: ${protectedDir}`,
        errorType: PathProtectionError.PROTECTED_SOURCE_DIRECTORY,
      };
    }
  }

  // Path within the SCP package root but not in a protected class
  return {
    isProtected: false,
    allowedAction: 'Non-protected path within the SCP package root',
  };
}

/**
 * Create a protection error message for dual dispatch
 * This can be sent to both client and server for consistent error handling
 */
export function createProtectionErrorMessage(
  path: string,
  result: PathProtectionResult
): string {
  const prefix = '[Path Protection]';

  if (result.errorType === PathProtectionError.INVALID_PATH) {
    return `${prefix} Invalid path provided: "${path}"`;
  }

  if (result.errorType === PathProtectionError.PROTECTED_SOURCE_DIRECTORY) {
    return `${prefix} Cannot modify protected directory: ${result.reason}`;
  }

  if (result.errorType === PathProtectionError.PROTECTED_ROOT_FILE) {
    return `${prefix} Cannot modify protected root file: ${result.reason}`;
  }

  if (result.errorType === PathProtectionError.PROTECTED_SYSTEM_FILE) {
    return `${prefix} Cannot modify system file: ${result.reason}`;
  }

  return `${prefix} Operation blocked: ${result.reason || 'Unknown protection rule'}`;
}

/**
 * Check if operation should be logged for security auditing
 */
export function shouldAuditOperation(
  path: string,
  operation: string,
  result: PathProtectionResult
): boolean {
  // Always audit protected path attempts
  if (result.isProtected) return true;

  // Audit operations within the SCP package root even if allowed
  const normalizedPath = normalizePath(path);
  if (toRootRelative(normalizedPath) !== null) return true;

  // Audit destructive operations
  const destructiveOps = ['delete', 'remove', 'move'];
  if (destructiveOps.some(op => operation.toLowerCase().includes(op))) return true;

  return false;
}

/**
 * Path Protection Metadata for CDRUM operations
 * Can be attached to actions for tracking and auditing
 */
export interface PathProtectionMetadata {
  path: string;
  operation: string;
  protectionResult: PathProtectionResult;
  timestamp: number;
  auditRequired: boolean;
}

/**
 * Create metadata for CDRUM action tracking
 */
export function createPathProtectionMetadata(
  path: string,
  operation: string
): PathProtectionMetadata {
  const protectionResult = checkPathProtection(path);

  return {
    path,
    operation,
    protectionResult,
    timestamp: Date.now(),
    auditRequired: shouldAuditOperation(path, operation, protectionResult),
  };
}

/**
 * CDRUM Operation Protection Check
 * Central enforcement point for all CDRUM operations
 *
 * Current Rules:
 * - READ operations: ALLOWED anywhere (for reference/learning)
 * - All other operations: Subject to path protection rules
 *
 * Future Rules (Post Phase 3):
 * - ALL operations restricted to the host project boundary by default
 * - AllowedPaths list will permit specific external paths
 * - Permission model integration for fine-grained control
 *
 * @param path - The path to check
 * @param operation - The CDRUM operation type
 * @param allowedPaths - Future: List of allowed external paths from FileManager state
 * @returns PathProtectionResult with enforcement decision
 */
export function checkCDRUMOperation(
  path: string,
  operation: CDRUMOperation,
  allowedPaths?: string[]
): PathProtectionResult {
  // EXCEPTION: READ operations are currently allowed anywhere
  // This enables reference and learning from any part of the system
  if (operation === CDRUMOperation.READ) {
    return {
      isProtected: false,
      allowedAction: 'READ operations permitted for reference',
    };
  }

  // Future: the OUTSIDE gate — paths beyond the HOST PROJECT root (the
  // workspace above the SCP package; derivable via the workspace walk-up)
  // will require an explicit AllowedPaths grant:
  // if (outsideHostProject(path) && !allowedPaths?.some(allowed => normalizePath(path).startsWith(normalizePath(allowed)))) {
  //   return {
  //     isProtected: true,
  //     reason: 'Path outside the host project requires explicit permission',
  //     errorType: PathProtectionError.OUTSIDE_PROTECTION_ROOT,
  //     requiresPermission: true,
  //   };
  // }

  // Apply standard path protection rules for non-READ operations
  return checkPathProtection(path);
}

/**
 * Future: Check if external path is in AllowedPaths list
 * This will be used when FileManager state includes AllowedPaths
 *
 * @param path - The path to check
 * @param allowedPaths - List of allowed external paths from FileManager state
 * @returns boolean indicating if path is explicitly allowed
 */
export function isPathInAllowedList(path: string, allowedPaths: string[]): boolean {
  const normalizedPath = normalizePath(path);

  return allowedPaths.some(allowed => {
    const normalizedAllowed = normalizePath(allowed);
    // Check if path starts with allowed path (includes subdirectories)
    return normalizedPath.startsWith(normalizedAllowed);
  });
}

/**
 * Create a CDRUM protection error action
 * This can be dispatched through dual dispatch to notify both client and server
 *
 * @param path - The protected path
 * @param operation - The attempted operation
 * @param result - The protection check result
 * @returns An object that can be used as action payload
 */
export function createCDRUMProtectionError(
  path: string,
  operation: CDRUMOperation,
  result: PathProtectionResult
) {
  return {
    type: 'PATH_PROTECTION_ERROR',
    path,
    operation,
    message: createProtectionErrorMessage(path, result),
    errorType: result.errorType,
    timestamp: Date.now(),
    auditRequired: true,
  };
}
