import { Dirent } from 'fs';
import { FSWatcher } from 'chokidar';
import { KeyedSelector } from 'stratimux';
import { findRoot } from './model/findRoot';

/**
 * FileSystemSelector extends KeyedSelector with a specific 'File' type
 * This ensures type safety while maintaining compatibility with KeyedSelector
 * Used for file path selectors in the singleton directorySelectorsBucket
 */
export type FileSystemSelector = KeyedSelector & {
  type: 'File';
  // File extension as the subtype
  fileExt?: 'txt' | 'md' | 'js' | 'ts' | 'jsx' | 'tsx' | 'vue' | 'json' |
    'css' | 'scss' | 'sass' | 'less' | 'html' | 'xml' | 'yaml' | 'yml' |
    'ini' | 'conf' | 'config' | 'env' | 'sh' | 'bash' | 'zsh' |
    'py' | 'rb' | 'go' | 'rs' | 'java' | 'c' | 'cpp' | 'h' | 'hpp' |
    'sql' | 'graphql' | 'gql' | 'proto' | 'dockerfile' | 'gitignore' |
    'jpg' | 'jpeg' | 'png' | 'gif' | 'bmp' | 'webp' | 'ico' |
    'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' |
    'zip' | 'tar' | 'gz' | 'rar' | '7z' |
    'mp3' | 'mp4' | 'avi' | 'mov' | 'wav' | 'flac' |
    'exe' | 'dll' | 'so' | 'dylib' | string; // Allow any string for unknown extensions
  // Additional metadata for file system operations
  filePath?: string;
  isText?: boolean;
};

export type FileDirent = { path: string } & Dirent;
export type FileNode = { type: 'file'; name: string };
export type DirectoryTreeNode = {
  [key: string]: DirectoryTreeNode | FileNode;
}

export type LoadedFile = {
  path: string;
  extension: string;
  isText: boolean;
  contents: Buffer | string;
  lastModified: number;
  size: number;
  opened: number;
  hash?: string;
}

export type HairTriggerLock = {
  originalHandler: string;
  expiresAt: number;
}

export type FileSystemState = {
  // Core State
  conceptDirectoryMap: string[];
  root: string;
  
  // Observation System
  loadedFiles: Map<string, LoadedFile>;
  observedPaths: string[];
  
  // Change Management
  fileChanges: KeyedSelector[];
  fileActionRouter: Record<string, string>;
  
  // HairTrigger Lock Management (path → lock info)
  hairTriggerLocks: Map<string, HairTriggerLock>;
  
  // Watcher Management
  activeWatchers: Map<string, FSWatcher>;
  
  // Cache & Clones
  directoryCache: Map<string, FileDirent[]>;
  directoryClone: DirectoryTreeNode;
  
  // State Flags
  selectorsInitialized: boolean;
  isWatching: boolean;
}

export const fileSystemName = 'fileSystem';

export function createFileSystemState(): FileSystemState {
  return {
    conceptDirectoryMap: [],
    root: findRoot(), // Use project root instead of server directory
    loadedFiles: new Map(),
    observedPaths: [],
    fileChanges: [],
    fileActionRouter: {},
    hairTriggerLocks: new Map(),
    activeWatchers: new Map(),
    directoryCache: new Map(),
    directoryClone: {},
    selectorsInitialized: false,
    isWatching: false
  };
}