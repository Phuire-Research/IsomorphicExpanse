/**
 * Shared FileSystemSelector Model
 * Used by both BuildPlatform (server) and ProjectManager (client) for spatial blocking
 * Reference: STRATIMUX-REFERENCE.md - 🏗️ Muxified Concept Access Patterns
 */

import path from 'path';

/**
 * Minimal FileSystemSelector structure for Ownership spatial blocking
 * This shared type doesn't need the full _selector or select functions
 * Just the structure needed for Ownership concept locking
 */
export interface FileSystemSelector {
  conceptName: string;
  conceptSemaphore: number;
  keys: string;
  type: 'File' | 'Directory';
  fileExt?: string;
  filePath: string;
  isText: boolean;
}

/**
 * Convert a filesystem path to dot notation for KeyedSelector keys
 * Example: "/home/user/file.txt" → "home.user.file_txt"
 */
export function pathToDotNotation(fsPath: string): string {
  const normalized = path.normalize(fsPath);
  const segments = normalized.split(path.sep).filter(Boolean);

  return segments
    .map((segment) => {
      // Replace dots in filenames with underscores to maintain dot notation integrity
      return segment.replace(/\./g, '_');
    })
    .join('.');
}

/**
 * Get the file extension from a path
 */
export function getExtension(fsPath: string): string {
  return path.extname(fsPath).toLowerCase().slice(1);
}

/**
 * Check if a file should be treated as text based on extension
 */
export function isTextFile(fsPath: string): boolean {
  const textExtensions = new Set([
    'txt',
    'md',
    'js',
    'ts',
    'jsx',
    'tsx',
    'vue',
    'json',
    'css',
    'scss',
    'sass',
    'less',
    'html',
    'xml',
    'yaml',
    'yml',
    'ini',
    'conf',
    'config',
    'env',
    'sh',
    'bash',
    'zsh',
    'py',
    'rb',
    'go',
    'rs',
    'java',
    'c',
    'cpp',
    'h',
    'hpp',
    'sql',
    'graphql',
    'gql',
    'proto',
    'dockerfile',
    'gitignore',
  ]);

  const ext = getExtension(fsPath);
  return textExtensions.has(ext);
}

/**
 * Create a minimal FileSystemSelector for spatial blocking
 * Used by both client and server to create compatible selectors
 *
 * @param conceptName - Name of the concept (e.g., 'buildPlatform', 'projectManager')
 * @param propertyName - Name of the directory property (e.g., 'buildPlatformMap', 'projects')
 * @param fsPath - The filesystem path to create a selector for
 * @param semaphore - The concept semaphore (optional, defaults to 0)
 */
export function createSharedPathSelector(
  conceptName: string,
  propertyName: string,
  fsPath: string,
  semaphore: number = 0,
): FileSystemSelector {
  const dotNotation = pathToDotNotation(fsPath);
  const keys = `${conceptName}.${propertyName}.${dotNotation}`;
  const ext = getExtension(fsPath);
  const isText = isTextFile(fsPath);

  return {
    conceptName,
    conceptSemaphore: semaphore,
    keys,
    type: 'File' as const,
    fileExt: ext || undefined,
    filePath: fsPath,
    isText,
  };
}
