import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemSetWatching, SetWatchingPayload } from './types';

/**
 * Set Watching Quality
 * Enables or disables file system watching
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Controls whether the fileSystemWatcher principle is active
 */

export const fileSystemSetWatching: FileSystemSetWatching = createQualityCardWithPayload<FileSystemState, SetWatchingPayload>({
  type: 'File System Set Watching',
  reducer: (state, action) => {
    const { isWatching } = action.payload;
    
    // Performance optimization: return only changed properties
    return {
      isWatching
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});