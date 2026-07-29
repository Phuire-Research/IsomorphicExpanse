import { 
  createQualityCardWithPayload, 
  createAsyncMethod, 
  strategySuccess, 
  strategyData_muxifyData, 
  nullReducer 
} from 'stratimux';
import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemState } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import type { FileSystemRenameFile, RenameFilePayload } from './types';

/**
 * Rename File Quality - Atomic File Renaming Operations
 * Efficiently renames files using Node.js fs.rename() without copying data
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Critical for SORD reordering operations - changes file order numbers
 * Uses atomic OS-level rename for same-filesystem operations
 * Falls back to copy+delete for cross-filesystem operations
 */

export type RenameResultDataField = {
  oldPath: string;
  newPath: string;
  success: boolean;
  method?: 'rename' | 'copy-delete';  // Track if fallback was used
  error?: string;
  timestamp: number;
};

export const fileSystemRenameFile: FileSystemRenameFile = createQualityCardWithPayload<FileSystemState, RenameFilePayload>({
  type: 'File System Rename File',
  reducer: nullReducer,  // No state changes - file operations only
  methodCreator: () => createAsyncMethod(({ controller, action }) => {
    const { oldPath, newPath, createDirectories = false } = action.payload;
    
    // Validate paths
    if (!oldPath || !newPath) {
      const errorResult: RenameResultDataField = {
        oldPath,
        newPath,
        success: false,
        error: 'Invalid paths provided',
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
    
    // Rename operation with optional directory creation
    const renameOperation = async () => {
      // Create target directory if needed
      if (createDirectories) {
        const dir = path.dirname(newPath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      try {
        // Attempt atomic rename (most efficient)
        await fs.rename(oldPath, newPath);
        return 'rename' as const;
      } catch (error: any) {
        // If cross-device error (EXDEV), fall back to copy+delete
        if (error.code === 'EXDEV') {
          console.log('[FileSystem] Cross-device rename detected, using copy+delete fallback');
          
          // Copy file to new location
          await fs.copyFile(oldPath, newPath);
          
          // Delete original
          await fs.unlink(oldPath);
          
          return 'copy-delete' as const;
        }
        // Re-throw other errors
        throw error;
      }
    };
    
    renameOperation().then((method) => {
      const result: RenameResultDataField = {
        oldPath,
        newPath,
        success: true,
        method,
        timestamp: Date.now()
      };
      
      console.log(`[FileSystem] File renamed successfully: ${oldPath} → ${newPath} (${method})`);
      
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
      console.error('[FileSystem] Error renaming file:', oldPath, '→', newPath, error);
      
      const errorResult: RenameResultDataField = {
        oldPath,
        newPath,
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