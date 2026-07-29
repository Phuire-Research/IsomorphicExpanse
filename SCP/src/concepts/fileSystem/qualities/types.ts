import { Quality, KeyedSelector, createQualityCard, createQualityCardWithPayload } from 'stratimux';
import { FileSystemState, FileSystemSelector } from '../fileSystem.model';
import { directorySelectorsBucket } from '../directorySelectors.singleton';
import { FSWatcher } from 'chokidar';

// ============================================
// PAYLOAD TYPES
// ============================================

export type QueueFileChangePayload = {
  selector: FileSystemSelector;
  changeType: 'add' | 'change' | 'unlink';
  path: string;
};

export type RegisterFileHandlerPayload = {
  keysPattern: string;
  actionName: string;
};

export type HandleFileChangePayload = {
  path: string;
  selector?: KeyedSelector;
};

export type ObservePathsPayload = {
  paths: string[];
};

export type LoadFilePayload = {
  path: string;
  forceReload?: boolean;
};

export type ReadFilePayload = {
  path: string;
  encoding?: BufferEncoding;
};

export type WriteFilePayload = {
  path: string;
  content: string | Buffer;
  encoding?: BufferEncoding;
  createDirectories?: boolean;
};

export type RenameFilePayload = {
  oldPath: string;
  newPath: string;
  createDirectories?: boolean;
};

export type SetWatchingPayload = {
  isWatching: boolean;
};

export type UpdateWatchersPayload = {
  activeWatchers: Map<string, FSWatcher>;
};

export type CreateHairTriggerLockPayload = {
  path: string;
  duration: number;
};

export type RestoreHairTriggerLockPayload = {
  path: string;
};

// ============================================
// QUALITY TYPE DEFINITIONS
// ============================================

export type FileSystemQueueFileChange = Quality<FileSystemState, QueueFileChangePayload>;
export type FileSystemClearProcessedChanges = Quality<FileSystemState>;
export type FileSystemRegisterFileHandler = Quality<FileSystemState, RegisterFileHandlerPayload>;
export type FileSystemHandleTypeScriptChange = Quality<FileSystemState, HandleFileChangePayload>;
export type FileSystemHandleJavaScriptChange = Quality<FileSystemState, HandleFileChangePayload>;
export type FileSystemHandleVueChange = Quality<FileSystemState, HandleFileChangePayload>;
export type FileSystemHandlePackageJsonChange = Quality<FileSystemState, HandleFileChangePayload>;
export type FileSystemObservePaths = Quality<FileSystemState, ObservePathsPayload>;
export type FileSystemSetWatching = Quality<FileSystemState, SetWatchingPayload>;
export type FileSystemUpdateWatchers = Quality<FileSystemState, UpdateWatchersPayload>;
export type FileSystemLoadFile = Quality<FileSystemState, LoadFilePayload>;
export type FileSystemSetLoadedFile = Quality<FileSystemState>;
export type FileSystemReadFile = Quality<FileSystemState, ReadFilePayload>;
export type FileSystemWriteFile = Quality<FileSystemState, WriteFilePayload>;
export type FileSystemRenameFile = Quality<FileSystemState, RenameFilePayload>;
export type FileSystemRenamePath = Quality<FileSystemState, RenameFilePayload>;
export type FileSystemCreateHairTriggerLock = Quality<FileSystemState, CreateHairTriggerLockPayload>;
export type FileSystemRestoreHairTriggerLock = Quality<FileSystemState, RestoreHairTriggerLockPayload>;

// Legacy qualities from existing implementation
export type GetDirectoriesPayload = {
  path: string;
};

export type RemoveTargetDirectoryPayload = {
  path: string;
};

export type CreateTargetDirectoryPayload = {
  path: string;
};

export type CopyMoveTargetDirectoryPayload = {
  path: string;  // Source path (standardized from 'target')
  newLocation: string;
};

export type RecursivelyCopyMoveTargetDirectoriesPayload = {
  directories: {
    name: string;
    path: string;  // Source path (standardized from 'target')
    newLocation: string;
  }[];
};

export type CreateContextIndexPayload = {
  path: string;  // File path (standardized from 'target')
  content: string;
};

export type GetDirectoriesAndFilesPayload = {
  path: string;
};

export type ReadDirectoryPayload = {
  path: string;  // Directory path (standardized from 'target')
};

export type FilterFilesAndDirectoriesPayload = {
  isTokens: string[];
  notTokens: string[];
};

export type FileSystemGetDirectories = Quality<FileSystemState, GetDirectoriesPayload>;
export type FileSystemRemoveTargetDirectory = Quality<FileSystemState, RemoveTargetDirectoryPayload>;
export type FileSystemCreateTargetDirectory = Quality<FileSystemState, CreateTargetDirectoryPayload>;
export type FileSystemCopyMoveTargetDirectory = Quality<FileSystemState, CopyMoveTargetDirectoryPayload>;
export type FileSystemRecursivelyCopyMoveTargetDirectories = Quality<FileSystemState, RecursivelyCopyMoveTargetDirectoriesPayload>;
export type FileSystemServerSetConceptDirectoriesFromData = Quality<FileSystemState>;
export type FileSystemCreateFileWithContentsIndex = Quality<FileSystemState, CreateContextIndexPayload>;
export type FileSystemGetDirectoriesAndFiles = Quality<FileSystemState, GetDirectoriesAndFilesPayload>;
export type FileSystemReadDirectory = Quality<FileSystemState, ReadDirectoryPayload>;
export type FileSystemFilterFilesAndDirectories = Quality<FileSystemState, FilterFilesAndDirectoriesPayload>;
export type FileSystemReadFileContentsAndAppendToData = Quality<FileSystemState>;
export type FileSystemReadAllFileContentsAndAppendToData = Quality<FileSystemState>;

// ============================================
// FILESYSTEM QUALITIES TYPE
// ============================================

export type FileSystemQualities = {
  // New v0.3.2 qualities
  fileSystemQueueFileChange: FileSystemQueueFileChange;
  fileSystemClearProcessedChanges: FileSystemClearProcessedChanges;
  fileSystemRegisterFileHandler: FileSystemRegisterFileHandler;
  // Handler qualities - To be implemented in Phase 3 by Project Manager
  // fileSystemHandleTypeScriptChange: FileSystemHandleTypeScriptChange;
  // fileSystemHandleJavaScriptChange: FileSystemHandleJavaScriptChange;
  // fileSystemHandleVueChange: FileSystemHandleVueChange;
  // fileSystemHandlePackageJsonChange: FileSystemHandlePackageJsonChange;
  fileSystemObservePaths: FileSystemObservePaths;
  fileSystemSetWatching: FileSystemSetWatching;
  fileSystemUpdateWatchers: FileSystemUpdateWatchers;
  // fileSystemLoadFile: FileSystemLoadFile; // Not needed for lazy loading approach
  fileSystemReadFile: FileSystemReadFile;
  fileSystemWriteFile: FileSystemWriteFile;
  fileSystemRenameFile: FileSystemRenameFile;
  fileSystemRenamePath: FileSystemRenamePath;
  fileSystemCreateHairTriggerLock: FileSystemCreateHairTriggerLock;
  fileSystemRestoreHairTriggerLock: FileSystemRestoreHairTriggerLock;
  
  // Legacy qualities
  fileSystemGetDirectories: FileSystemGetDirectories;
  fileSystemRemoveTargetDirectory: FileSystemRemoveTargetDirectory;
  fileSystemCreateTargetDirectory: FileSystemCreateTargetDirectory;
  fileSystemCopyMoveTargetDirectory: FileSystemCopyMoveTargetDirectory;
  fileSystemRecursivelyCopyMoveTargetDirectories: FileSystemRecursivelyCopyMoveTargetDirectories;
  fileSystemServerSetConceptDirectoriesFromData: FileSystemServerSetConceptDirectoriesFromData;
  fileSystemCreateFileWithContentsIndex: FileSystemCreateFileWithContentsIndex;
  fileSystemGetDirectoriesAndFiles: FileSystemGetDirectoriesAndFiles;
  fileSystemReadDirectory: FileSystemReadDirectory;
  fileSystemFilterFilesAndDirectories: FileSystemFilterFilesAndDirectories;
  fileSystemReadFileContentsAndAppendToData: FileSystemReadFileContentsAndAppendToData;
  fileSystemReadAllFileContentsAndAppendToData: FileSystemReadAllFileContentsAndAppendToData;
};
