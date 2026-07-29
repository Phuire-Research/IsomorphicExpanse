import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemRestoreHairTriggerLock, RestoreHairTriggerLockPayload } from './types';

/**
 * Restore HairTrigger Lock Quality
 * One-shot handler that restores the original handler when triggered
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * This quality is invoked by fileChangeProcessor when a file event
 * matches a path that has been rotated to 'fileSystemRestoreHairTriggerLock'
 */

export const fileSystemRestoreHairTriggerLock: FileSystemRestoreHairTriggerLock = createQualityCardWithPayload<FileSystemState, RestoreHairTriggerLockPayload>({
  type: 'fileSystem Restore HairTrigger Lock',
  reducer: (state, { payload }) => {
    const { path } = payload;
    
    // Get the lock for this exact path
    const hairTriggerLock = state.hairTriggerLocks.get(path);
    
    // No change if no lock found
    if (!hairTriggerLock) {
      return {};
    }
    
    // Clone Map and remove the lock (one-shot)
    const newHairTriggerLocks = new Map(state.hairTriggerLocks);
    newHairTriggerLocks.delete(path);
    
    // Restore original handler
    const newFileActionRouter = {
      ...state.fileActionRouter,
      [path]: hairTriggerLock.originalHandler
    };
    
    // Performance optimization: return only changed properties
    return {
      fileActionRouter: newFileActionRouter,
      hairTriggerLocks: newHairTriggerLocks
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});