import path from 'path';
import { KeyedSelector, Concepts, selectStratiDECK } from 'stratimux';
import { fileSystemName, FileSystemSelector } from './fileSystem.model';
import type { FileSystemConcept } from './fileSystem.concept';
import { addDirectorySelector, getDirectorySelectorByPath } from './directorySelectors.singleton';

/**
 * Path Transformation System for FileSystem Concept
 * Handles bidirectional conversion between filesystem paths and dot notation
 * Reference: STRATIMUX-REFERENCE.md - 🎯 DECK K Constant Pattern
 * Reference: STRATIMUX-REFERENCE.md - 🔧 selectStratiDECK Pattern for Strategy Creator Functions
 */

/**
 * Helper functions for creating selector functions
 * Based on Stratimux's internal selector creation pattern
 */
const finalReturn = (key: string): SelectorFunction => {
  return (obj: Record<string, unknown>) => {
    if (obj[key] !== undefined) {
      return obj[key];
    } else {
      return undefined;
    }
  };
};

const recordReturn = (key: string, prev: SelectorFunction): SelectorFunction => {
  return (obj: Record<string, unknown>) => {
    if (obj[key] !== undefined) {
      const result = obj[key];
      if (typeof result === 'object' && result !== null) {
        return prev(result as Record<string, unknown>);
      }
    }
    return undefined;
  };
};

const creation = (
  keys: string[],
  index: number,
  length: number,
  prev?: SelectorFunction | undefined
): SelectorFunction | undefined => {
  let previous: SelectorFunction | undefined = prev;
  let i = index;
  if (index === length - 1) {
    previous = finalReturn(keys[i]);
    i--;
  }
  if (i !== 0 && previous) {
    previous = recordReturn(keys[i], previous);
    return creation(keys, i - 1, length, previous);
  } else if (previous) {
    return previous;
  } else {
    return undefined;
  }
};
export type SelectorFunction = (obj: Record<string, unknown>) => unknown | undefined;
/**
 * Convert a filesystem path to dot notation for KeyedSelector keys
 * Example: "/home/user/file.txt" → "home.user.file_txt"
 */
export function pathToDotNotation(fsPath: string): string {
  const normalized = path.normalize(fsPath);
  const segments = normalized.split(path.sep).filter(Boolean);
  
  return segments.map(segment => {
    // Replace dots in filenames with underscores to maintain dot notation integrity
    return segment.replace(/\./g, '_');
  }).join('.');
}

/**
 * Convert dot notation back to filesystem path
 * Example: "home.user.file_txt" → "/home/user/file.txt"
 */
export function dotNotationToPath(dotNotation: string): string {
  const segments = dotNotation.split('.').map(segment => {
    // Attempt to restore file extensions
    const lastUnderscore = segment.lastIndexOf('_');
    if (lastUnderscore > 0) {
      const possibleExt = segment.substring(lastUnderscore + 1);
      // Common file extensions are 2-4 characters
      if (possibleExt.length >= 2 && possibleExt.length <= 4 && /^[a-zA-Z0-9]+$/.test(possibleExt)) {
        return segment.substring(0, lastUnderscore) + '.' + possibleExt;
      }
    }
    return segment;
  });
  
  return path.resolve(path.sep, ...segments);
}

/**
 * Create a file dot path with flexible prefix
 * Can use concept name from k.getName() or custom prefix
 */
export function createFileDotPath(conceptNameOrPrefix: string, fsPath: string): string {
  const dotNotation = pathToDotNotation(fsPath);
  return `${conceptNameOrPrefix}.${dotNotation}`;
}

/**
 * Create a FileSystemSelector for a file path
 * Extracts semaphore from selectStratiDECK and creates a valid _selector function
 * Integrates with the singleton directorySelectorsBucket for Ownership concept locking
 * 
 * The path structure follows: conceptName.directoryClone.path.to.file
 * This ensures the path corresponds to a valid location in the directoryClone structure
 */
export function createPathSelector(
  deck: unknown,
  concepts: Concepts,
  fsPath: string
): FileSystemSelector | undefined {
  // Check if selector already exists in the record for O(1) lookup
  const existing = getDirectorySelectorByPath(fsPath);
  if (existing) {
    return existing;
  }
  
  // Use fileSystemName as the conceptName for consistency
  const conceptName = fileSystemName;
  
  // Get the FileSystem deck to extract the semaphore
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, conceptName);
  
  if (!fileSystemDeck) {
    return undefined;
  }
  
  // Extract the semaphore from the directoryClone selector
  const semaphore = fileSystemDeck.k.directoryClone.conceptSemaphore || 0;
  
  // Build the full path including directoryClone prefix
  const dotNotation = pathToDotNotation(fsPath);
  const keys = `${conceptName}.directoryClone.${dotNotation}`;
  
  // Create the selector base array for the creation function
  const selectorBase = [conceptName, 'directoryClone', ...dotNotation.split('.')];
  
  // Create a valid _selector function using the creation pattern
  const _selector = creation(selectorBase, selectorBase.length - 1, selectorBase.length) as SelectorFunction;
  
  // Get file extension for the FileSystemSelector
  const ext = getExtension(fsPath);
  const isText = isTextFile(fsPath);
  
  // Create a select function that returns file content or type
  const selectFile = () => {
    return isText ? `text/${ext}` : `binary/${ext}`;
  };
  
  // Create a FileSystemSelector that extends KeyedSelector
  const selector: FileSystemSelector = {
    conceptName: conceptName,
    conceptSemaphore: semaphore,
    _selector: _selector,
    select: selectFile,
    keys: keys,
    type: 'File',
    fileExt: ext as any, // Cast to any to allow dynamic extension
    filePath: fsPath,
    isText: isText
  };
  
  // Add to both singleton structures atomically
  addDirectorySelector(selector);
  
  return selector;
}

/**
 * Check if a path matches a pattern (supports wildcards)
 * Example patterns: "*.ts", "src/*.js", "**\/*.vue"
 */
export function matchesPattern(fsPath: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '[^/]*')
    .replace(/\*\*/g, '.*');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(fsPath);
}

/**
 * Extract the relative path from a dot notation key
 */
export function extractRelativePath(dotKey: string, conceptName: string): string {
  const prefix = `${conceptName}.`;
  if (dotKey.startsWith(prefix)) {
    const relativeDotNotation = dotKey.substring(prefix.length);
    return dotNotationToPath(relativeDotNotation);
  }
  return dotNotationToPath(dotKey);
}

/**
 * Normalize a path for cross-platform compatibility
 */
export function normalizePath(fsPath: string): string {
  return path.normalize(fsPath);
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
    'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'vue', 'json',
    'css', 'scss', 'sass', 'less', 'html', 'xml', 'yaml', 'yml',
    'ini', 'conf', 'config', 'env', 'sh', 'bash', 'zsh',
    'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp',
    'sql', 'graphql', 'gql', 'proto', 'dockerfile', 'gitignore'
  ]);
  
  const ext = getExtension(fsPath);
  return textExtensions.has(ext);
}