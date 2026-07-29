import { createQualityCardWithPayload, createAsyncMethod, nullReducer, strategySuccess, strategyData_muxifyData } from 'stratimux';
import { promises as fs } from 'fs';
import { FileSystemState, LoadedFile } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemHandleTypeScriptChange, HandleFileChangePayload } from './types';

/**
 * Load TypeScript File Quality
 * Asynchronously loads TypeScript file contents
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * 
 * Uses nullReducer since this is async load operation
 * Passes loaded file data through strategy for setLoadedFile quality
 */

export type LoadedFileDataField = {
  loadedFile: LoadedFile;
  previousContents?: string | Buffer;
};

export const fileSystemLoadTypeScriptFile: FileSystemHandleTypeScriptChange = createQualityCardWithPayload<FileSystemState, HandleFileChangePayload>({
  type: 'fileSystem-loadTypeScriptFile',
  reducer: nullReducer,
  methodCreator: () => createAsyncMethod(({ controller, action }) => {
    const { path } = action.payload;
    
    // Read file contents and stats asynchronously
    Promise.all([
      fs.readFile(path),
      fs.stat(path)
    ]).then(([buffer, stats]) => {
      const contents = buffer.toString('utf8');
      
      const loadedFile: LoadedFile = {
        path,
        extension: 'ts',
        isText: true,
        contents,
        lastModified: stats.mtimeMs,
        size: buffer.length,
        opened: Date.now()
      };
      
      if (action.strategy) {
        // Pass loaded file data through strategy
        controller.fire(
          strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { loadedFile })
          )
        );
      }
    }).catch((error) => {
      console.error('Error loading TypeScript file:', error);
      if (action.strategy) {
        // Still fire strategy to continue flow even on error
        controller.fire(strategySuccess(action.strategy));
      }
    });
  }),
  keyedSelectors: directorySelectorsBucket
});