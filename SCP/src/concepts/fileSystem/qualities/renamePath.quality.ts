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

/**
 * Rename Path Quality - Atomic Path Renaming Operations
 * Efficiently renames both files AND directories using Node.js fs.rename()
 * Reference: STRATIMUX-REFERENCE.md - 🧩 Quality Creation Patterns & Best Practices
 * Reference: STRATIMUX-REFERENCE.md - 🚀 Critical Reducer Performance Optimization
 * 
 * Critical for CDRUM operations - handles both file and directory renames
 * Uses atomic OS-level rename for same-filesystem operations (instant)
 * Falls back to recursive copy+delete for cross-filesystem operations
 */

export type RenamePathPayload = {
  oldPath: string;
  newPath: string;
  createDirectories?: boolean;
};

export type RenamePathResultDataField = {
  oldPath: string;
  newPath: string;
  success: boolean;
  pathType?: 'file' | 'directory';
  method?: 'rename' | 'copy-delete';
  error?: string;
  timestamp: number;
};

export const fileSystemRenamePath = createQualityCardWithPayload<FileSystemState, RenamePathPayload>({
  type: 'File System Rename Path',
  reducer: nullReducer,  // No state changes - filesystem operations only
  methodCreator: () => createAsyncMethod(({ controller, action }) => {
    const { oldPath, newPath, createDirectories = false } = action.payload;
    
    // Validate paths
    if (!oldPath || !newPath) {
      const errorResult: RenamePathResultDataField = {
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
      // Check if path exists and determine type
      const stats = await fs.stat(oldPath);
      const pathType = stats.isDirectory() ? 'directory' : 'file';
      
      // Create target directory if needed
      if (createDirectories) {
        const dir = path.dirname(newPath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      try {
        // Attempt atomic rename (instant on same filesystem)
        await fs.rename(oldPath, newPath);
        return { method: 'rename' as const, pathType };
      } catch (error: any) {
        // If cross-device error (EXDEV), fall back to copy+delete
        if (error.code === 'EXDEV') {
          console.log('[FileSystem] Cross-device rename detected, using copy+delete fallback');
          
          if (pathType === 'directory') {
            // For directories, we need recursive copy
            const { cp, rm } = await import('fs/promises');
            await cp(oldPath, newPath, { recursive: true });
            await rm(oldPath, { recursive: true });
          } else {
            // For files, use copyFile
            await fs.copyFile(oldPath, newPath);
            await fs.unlink(oldPath);
          }
          
          return { method: 'copy-delete' as const, pathType };
        }
        // Re-throw other errors
        throw error;
      }
    };
    
    renameOperation().then(({ method, pathType }) => {
      const result: RenamePathResultDataField = {
        oldPath,
        newPath,
        success: true,
        pathType: pathType as 'file' | 'directory',
        method,
        timestamp: Date.now()
      };
      
      console.log(`[FileSystem] Path renamed successfully: ${oldPath} → ${newPath} (${pathType}, ${method})`);
      
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
      console.error('[FileSystem] Error renaming path:', oldPath, '→', newPath, error);
      
      const errorResult: RenamePathResultDataField = {
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