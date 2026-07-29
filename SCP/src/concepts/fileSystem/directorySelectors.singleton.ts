import { KeyedSelector } from 'stratimux';
import { FileSystemSelector } from './fileSystem.model';

/**
 * Singleton array shared by ALL FileSystem qualities
 * This implements the Singleton KeyedSelector Pattern for unified selector management
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 */
export const directorySelectorsBucket: KeyedSelector[] = [];

/**
 * Private Record singleton for O(1) path → selector lookup
 * Used for spatial locking via Ownership concept
 * Keys are file paths, values are FileSystemSelectors
 * NOT exported - access only through controlled functions
 */
const directorySelectorsRecord: Record<string, FileSystemSelector> = {};

// ============================================
// ARRAY SINGLETON FUNCTIONS
// ============================================

export function clearDirectorySelectors(): void {
  directorySelectorsBucket.length = 0;
  // Also clear the record
  for (const key in directorySelectorsRecord) {
    delete directorySelectorsRecord[key];
  }
}

export function addDirectorySelectors(selectors: KeyedSelector[]): void {
  directorySelectorsBucket.push(...selectors);
  // Add FileSystemSelectors to record
  selectors.forEach(sel => {
    const fsSel = sel as FileSystemSelector;
    if (fsSel.filePath) {
      directorySelectorsRecord[fsSel.filePath] = fsSel;
    }
  });
}

export function hasSelector(dotPath: string): boolean {
  return directorySelectorsBucket.some(sel => sel.keys === dotPath);
}

export function removeSelector(dotPath: string): void {
  const index = directorySelectorsBucket.findIndex(sel => sel.keys === dotPath);
  if (index !== -1) {
    const selector = directorySelectorsBucket[index] as FileSystemSelector;
    // Remove from array
    directorySelectorsBucket.splice(index, 1);
    // Remove from record if it has a filePath
    if (selector.filePath) {
      delete directorySelectorsRecord[selector.filePath];
    }
  }
}

export function getSelectorByPath(dotPath: string): KeyedSelector | undefined {
  return directorySelectorsBucket.find(sel => sel.keys === dotPath);
}

export function getSelectorsCount(): number {
  return directorySelectorsBucket.length;
}

// ============================================
// ENHANCED FUNCTIONS FOR RECORD MANAGEMENT
// ============================================

/**
 * Add a single FileSystemSelector to both singleton structures
 * Used by createPathSelector for atomic operations
 */
export function addDirectorySelector(selector: FileSystemSelector): void {
  // Add to array
  directorySelectorsBucket.push(selector);
  
  // Add to record using filePath as key
  if (selector.filePath) {
    directorySelectorsRecord[selector.filePath] = selector;
  }
}

/**
 * Remove selector by file path from both structures
 * Used for cleanup operations
 */
export function removeDirectorySelectorByPath(path: string): void {
  // Remove from record
  delete directorySelectorsRecord[path];
  
  // Remove from array
  const index = directorySelectorsBucket.findIndex(
    sel => (sel as FileSystemSelector).filePath === path
  );
  if (index !== -1) {
    directorySelectorsBucket.splice(index, 1);
  }
}

/**
 * Get FileSystemSelector by file path (O(1) lookup)
 * Read-only access for external use
 */
export function getDirectorySelectorByPath(path: string): FileSystemSelector | undefined {
  return directorySelectorsRecord[path];
}

/**
 * Get read-only copy of the selector record
 * For internal use by qualities/principles only
 */
export function getDirectorySelectorsRecord(): Readonly<Record<string, FileSystemSelector>> {
  return Object.freeze({ ...directorySelectorsRecord });
}

/**
 * Check if a file path has an associated selector
 */
export function hasSelectorForPath(path: string): boolean {
  return path in directorySelectorsRecord;
}