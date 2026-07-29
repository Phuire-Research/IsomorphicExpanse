import { createQualityCardWithPayload, defaultMethodCreator, Quality, KeyedSelector } from 'stratimux';
import { FileSystemState, FileSystemSelector } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemQueueFileChange, QueueFileChangePayload } from './types';

/**
 * Queue File Change Quality
 * Adds file change events to the queue for processing
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Uses FileSystemSelector type from Phase 1A implementation
 * Part of the singleton KeyedSelector pattern
 */

export const fileSystemQueueFileChange: FileSystemQueueFileChange = createQualityCardWithPayload<FileSystemState, QueueFileChangePayload>({
  type: 'fileSystem-queueFileChange',
  reducer: (state, action) => {
    const { selector } = action.payload;
    
    // Performance optimization: return only changed properties
    // Cast FileSystemSelector to KeyedSelector for state compatibility
    return {
      fileChanges: [...state.fileChanges, selector as KeyedSelector]
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});