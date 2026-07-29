import { createQualityCard, defaultMethodCreator, Quality } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemClearProcessedChanges } from './types';

/**
 * Clear Processed Changes Quality
 * Clears the file changes queue after processing
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Uses depletion pattern - changes are shifted from array during processing
 * This quality resets the array after depletion loop completes
 */

export const fileSystemClearProcessedChanges: FileSystemClearProcessedChanges = createQualityCard<FileSystemState>({
  type: 'fileSystem-clearProcessedChanges',
  reducer: (state) => {
    // Performance optimization: only return changed properties
    // Reset fileChanges to empty array after processing
    return {
      fileChanges: []
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});