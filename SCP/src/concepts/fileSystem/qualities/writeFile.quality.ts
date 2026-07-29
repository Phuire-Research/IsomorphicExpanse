import { createQualityCardWithPayload, createAsyncMethod, strategySuccess, strategyData_muxifyData, strategyData_select, nullReducer } from 'stratimux';
import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemWriteFile, WriteFilePayload } from './types';

/**
 * Write File Quality - Approved Write Operations
 * Writes content to files after orchestration approval
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Part of the Quining infrastructure - executes approved file modifications
 * Tracks write operations in state for audit trail
 * Content can come from payload or strategy data
 */

export type WriteResultDataField = {
  path: string;
  success: boolean;
  bytesWritten?: number;
  error?: string;
  timestamp: number;
};

export const fileSystemWriteFile: FileSystemWriteFile = createQualityCardWithPayload<FileSystemState, WriteFilePayload>({
  type: 'File System Write File',
  reducer: nullReducer,  // No state changes - audit via action stream subscription
  methodCreator: () => createAsyncMethod(({ controller, action }) => {
    console.log('[SESSION] [DefaultKick] [FileSystem] writeFile called with payload:', action.payload);
    const { path: filePath, encoding = 'utf8', createDirectories = true } = action.payload;
    
    // Content can come from payload or strategy data
    let content = action.payload.content;
    
    // Check if content is in strategy data (from previous quality)
    if (action.strategy && !content) {
      const strategyData = strategyData_select(action.strategy) as any;
      if (strategyData?.content) {
        content = strategyData.content;
      }
    }
    
    if (!content) {
      const errorResult: WriteResultDataField = {
        path: filePath,
        success: false,
        error: 'No content provided',
        timestamp: Date.now()
      };
      
      if (action.strategy) {
        controller.fire(
          strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, errorResult)
          )
        );
      }
      return;
    }
    
    // Create directory if needed
    const writeOperation = async () => {
      if (createDirectories) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      // Write the file
      await fs.writeFile(filePath, content as any, encoding);
      
      // Get file size after write
      const stats = await fs.stat(filePath);
      return stats.size;
    };
    
    writeOperation().then((bytesWritten) => {
      console.log('[SESSION] [DefaultKick] [FileSystem] File written successfully:', filePath, 'bytes:', bytesWritten);
      const result: WriteResultDataField = {
        path: filePath,
        success: true,
        bytesWritten,
        timestamp: Date.now()
      };
      
      if (action.strategy) {
        controller.fire(
          strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, result)
          )
        );
      } else {
        controller.fire(action);
      }
    }).catch((error) => {
      console.error('[SESSION] [DefaultKick] [FileSystem] Error writing file:', filePath, error);
      
      const errorResult: WriteResultDataField = {
        path: filePath,
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      
      if (action.strategy) {
        controller.fire(
          strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, errorResult)
          )
        );
      }
    });
  }),
  keyedSelectors: directorySelectorsBucket
});