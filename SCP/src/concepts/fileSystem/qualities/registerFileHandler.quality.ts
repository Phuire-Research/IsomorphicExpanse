import { createQualityCardWithPayload, defaultMethodCreator, Quality } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemRegisterFileHandler, RegisterFileHandlerPayload } from './types';

/**
 * Register File Handler Quality
 * Registers a handler action for specific file patterns in the fileActionRouter
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * The fileActionRouter uses O(1) pattern matching for efficient handler lookup
 * Patterns support wildcards for flexible matching (e.g., "*.ts", "src/*.js")
 */

export const fileSystemRegisterFileHandler: FileSystemRegisterFileHandler = createQualityCardWithPayload<FileSystemState, RegisterFileHandlerPayload>({
  type: 'fileSystem-registerFileHandler',
  reducer: (state, action) => {
    const { keysPattern, actionName } = action.payload;
    
    // Performance optimization: return only changed properties
    // Add or update the pattern -> action mapping
    return {
      fileActionRouter: {
        ...state.fileActionRouter,
        [keysPattern]: actionName
      }
    };
  },
  methodCreator: defaultMethodCreator,
  keyedSelectors: directorySelectorsBucket
});