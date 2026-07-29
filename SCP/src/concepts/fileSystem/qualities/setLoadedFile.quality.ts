import { createQualityCard, defaultMethodCreator, strategyData_select } from 'stratimux';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemSetLoadedFile } from './types';
import type { LoadedFileDataField } from './loadTypeScriptFile.quality';

/**
 * Set Loaded File Quality
 * Updates the loadedFiles Map with file data passed through strategy
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Shared quality for all file types
 * Uses strategy data to get LoadedFile from async load qualities
 */

export const fileSystemSetLoadedFile: FileSystemSetLoadedFile = createQualityCard<FileSystemState>({
  type: 'fileSystem-setLoadedFile',
  reducer: (state, action) => {
    if (action.strategy) {
      const data = strategyData_select<LoadedFileDataField>(action.strategy);
      if (data?.loadedFile) {
        // Create new Map to trigger reactivity
        const newLoadedFiles = new Map(state.loadedFiles);
        newLoadedFiles.set(data.loadedFile.path, data.loadedFile);
        
        // Performance optimization: return only changed properties
        return { 
          loadedFiles: newLoadedFiles 
        };
      }
    }
    // No state change if no strategy data
    return {};
  },
  methodCreator: defaultMethodCreator,  // Pass function reference, not call
  keyedSelectors: directorySelectorsBucket
});