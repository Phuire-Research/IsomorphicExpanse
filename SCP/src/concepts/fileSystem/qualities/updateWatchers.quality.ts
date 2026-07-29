import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemUpdateWatchers, UpdateWatchersPayload } from './types';

/**
 * Update Watchers Quality
 * Updates the activeWatchers Map with new FSWatcher instances
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Used by fileSystemWatcher principle to store watcher references
 * Creates a new Map to trigger reactivity
 */

export const fileSystemUpdateWatchers: FileSystemUpdateWatchers = createQualityCardWithPayload<FileSystemState, UpdateWatchersPayload>({
  type: 'File System Update Watchers',
  reducer: (state, action) => {
    const { activeWatchers } = action.payload;
    
    // Create new Map to trigger reactivity
    // This ensures proper state updates and subscriptions are notified
    const newActiveWatchers = new Map(activeWatchers);
    
    // Performance optimization: return only changed properties
    return {
      activeWatchers: newActiveWatchers
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});