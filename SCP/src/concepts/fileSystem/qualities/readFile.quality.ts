import { createQualityCardWithPayload, createAsyncMethod, nullReducer, strategySuccess, strategyData_muxifyData } from 'stratimux';
import { promises as fs } from 'fs';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemReadFile, ReadFilePayload } from './types';

/**
 * Read File Quality - Lazy Loading Pattern
 * Reads file contents without storing in state
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * 
 * Part of the Quining infrastructure - provides lazy file access
 * File contents passed through strategy data, not stored in state
 * Enables Project Manager orchestration without memory overhead
 */

export type FileContentDataField = {
  path: string;
  content: string | Buffer;
  encoding?: BufferEncoding;
  size: number;
  error?: string;
};

export const fileSystemReadFile: FileSystemReadFile = createQualityCardWithPayload<FileSystemState, ReadFilePayload>({
  type: 'File System Read File',
  reducer: nullReducer,  // No state changes - lazy pattern
  methodCreator: () => createAsyncMethod(({ controller, action }) => {
    const { path, encoding = 'utf8' } = action.payload;
    
    // Read file asynchronously
    fs.readFile(path, encoding).then((content) => {
      // Get file size
      fs.stat(path).then((stats) => {
        const dataField: FileContentDataField = {
          path,
          content,
          encoding,
          size: stats.size
        };
        
        if (action.strategy) {
          // Pass file content through strategy data
          controller.fire(
            strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, dataField)
            )
          );
        } else {
          // Fire action with content for direct handling
          controller.fire(action);
        }
      }).catch((statError) => {
        // Still pass content even if stat fails
        const dataField: FileContentDataField = {
          path,
          content,
          encoding,
          size: content.length
        };
        
        if (action.strategy) {
          controller.fire(
            strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, dataField)
            )
          );
        }
      });
    }).catch((error) => {
      console.error('Error reading file:', path, error);
      
      const errorDataField: FileContentDataField = {
        path,
        content: '',
        encoding,
        size: 0,
        error: error.message
      };
      
      if (action.strategy) {
        // Pass error through strategy to allow handling
        controller.fire(
          strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, errorDataField)
          )
        );
      }
    });
  }),
  keyedSelectors: directorySelectorsBucket
});