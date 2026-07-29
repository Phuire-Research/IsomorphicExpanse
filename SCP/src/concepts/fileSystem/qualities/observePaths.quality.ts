import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemObservePaths, ObservePathsPayload } from './types';

/**
 * Observe Paths Quality
 * Adds paths to the observation list for file watching
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Triggers the fileSystemWatcher principle to create watchers
 */

export const fileSystemObservePaths: FileSystemObservePaths = createQualityCardWithPayload<FileSystemState, ObservePathsPayload>({
  type: 'File System Observe Paths',
  reducer: (state, action) => {
    const { paths } = action.payload;
    
    // Add new paths to observation list (avoid duplicates)
    const observedPathsSet = new Set(state.observedPaths);
    paths.forEach(path => observedPathsSet.add(path));
    
    // Performance optimization: return only changed properties
    return {
      observedPaths: Array.from(observedPathsSet)
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});