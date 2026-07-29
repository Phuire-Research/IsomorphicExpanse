import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import { FileSystemState, HairTriggerLock } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemCreateHairTriggerLock, CreateHairTriggerLockPayload } from './types';

/**
 * Create HairTrigger Lock Quality
 * Rotates a handler in fileActionRouter to 'fileSystemRestoreHairTriggerLock'
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * The HairTrigger pattern prevents echo effects during dual dispatch operations
 * by temporarily replacing handlers with a restoration trigger
 */

export const fileSystemCreateHairTriggerLock: FileSystemCreateHairTriggerLock = createQualityCardWithPayload<FileSystemState, CreateHairTriggerLockPayload>({
  type: 'fileSystem Create HairTrigger Lock',
  reducer: (state, { payload }) => {
    const { path, duration } = payload;
    console.log('[SESSION] [DefaultKick] [FileSystem] Creating HairTriggerLock for path:', path, 'duration:', duration);
    const currentHandler = state.fileActionRouter[path];
    
    // No change if no handler exists for this path
    if (!currentHandler) {
      console.log('[SESSION] [DefaultKick] [FileSystem] No handler found for path:', path);
      return {};
    }
    
    // Create new HairTriggerLock
    const hairTriggerLock: HairTriggerLock = {
      originalHandler: currentHandler,
      expiresAt: Date.now() + duration
    };
    
    // Clone Map for immutability
    const newHairTriggerLocks = new Map(state.hairTriggerLocks);
    newHairTriggerLocks.set(path, hairTriggerLock);
    
    // Rotate handler to restoration handler
    const newFileActionRouter = {
      ...state.fileActionRouter,
      [path]: 'fileSystemRestoreHairTriggerLock'
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