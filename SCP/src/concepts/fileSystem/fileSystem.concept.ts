/*<$
For the graph programming framework Stratimux generate a File System Concept that will store the current projects root and concept directory map.
$>*/
/*<#*/
import { createConcept, Concept, PrincipleFunction, MuxiumDeck } from 'stratimux';
import { fileSystemGetDirectories } from './qualities/getDirectories.quality';
import { fileSystemRemoveTargetDirectory } from './qualities/removeTargetDirectory.quality';
import { fileSystemCreateTargetDirectory } from './qualities/createTargetDirectory.quality';
import { fileSystemCopyMoveTargetDirectory } from './qualities/copyMoveDirectory.quality';
// import { findRoot } from '../../model/findRoot'; // Not currently used
import { fileSystemRecursivelyCopyMoveTargetDirectories } from './qualities/recursivelyCopyMoveDirectories.quality';
import { fileSystemServerSetConceptDirectoriesFromData } from './qualities/setConceptDirectoriesFromData.quality';
import { fileSystemCreateFileWithContentsIndex } from './qualities/createFileWithContents.quality';
import { fileSystemGetDirectoriesAndFiles } from './qualities/getDirectoriesAndFiles.quality';
import { fileSystemReadDirectory } from './qualities/readDir.quality';
import { fileSystemFilterFilesAndDirectories } from './qualities/filterFilesAndDirectories.quality';
import { fileSystemReadFileContentsAndAppendToData } from './qualities/readFileContentsAndAppendToData.quality';
import { fileSystemReadAllFileContentsAndAppendToData } from './qualities/readAllFileContentsAndAppendToData.quality copy';

// New v0.3.2 qualities
import { fileSystemQueueFileChange } from './qualities/queueFileChange.quality';
import { fileSystemClearProcessedChanges } from './qualities/clearProcessedChanges.quality';
import { fileSystemRegisterFileHandler } from './qualities/registerFileHandler.quality';
import { fileSystemObservePaths } from './qualities/observePaths.quality';
import { fileSystemSetWatching } from './qualities/setWatching.quality';
import { fileSystemUpdateWatchers } from './qualities/updateWatchers.quality';
import { fileSystemReadFile } from './qualities/readFile.quality';
import { fileSystemWriteFile } from './qualities/writeFile.quality';
import { fileSystemRenameFile } from './qualities/renameFile.quality';
import { fileSystemRenamePath } from './qualities/renamePath.quality';
import { fileSystemCreateHairTriggerLock } from './qualities/createHairTriggerLock.quality'
import { fileSystemRestoreHairTriggerLock } from './qualities/restoreHairTriggerLock.quality'

// Principles
import { fileSystemWatcherPrinciple } from './principles/fileSystemWatcher.principle';
import { fileChangeProcessorPrinciple } from './principles/fileChangeProcessor.principle';

import { FileSystemQualities } from './qualities/types';
import { fileSystemName, createFileSystemState } from './fileSystem.model';
import type { FileSystemState } from './fileSystem.model';
export type { FileSystemState } from './fileSystem.model';

// Explicit quality mapping for v0.3.2 compliance
const qualities: FileSystemQualities = {
  // New v0.3.2 qualities
  fileSystemQueueFileChange,
  fileSystemClearProcessedChanges,
  fileSystemRegisterFileHandler,
  fileSystemObservePaths,
  fileSystemSetWatching,
  fileSystemUpdateWatchers,
  fileSystemReadFile,
  fileSystemWriteFile,
  fileSystemRenameFile,
  fileSystemRenamePath,
  fileSystemCreateHairTriggerLock,
  fileSystemRestoreHairTriggerLock,
  // Legacy qualities
  fileSystemGetDirectories,
  fileSystemRemoveTargetDirectory,
  fileSystemCreateTargetDirectory,
  fileSystemCopyMoveTargetDirectory,
  fileSystemRecursivelyCopyMoveTargetDirectories,
  fileSystemServerSetConceptDirectoriesFromData,
  fileSystemCreateFileWithContentsIndex,
  fileSystemGetDirectoriesAndFiles,
  fileSystemReadDirectory,
  fileSystemFilterFilesAndDirectories,
  fileSystemReadFileContentsAndAppendToData,
  fileSystemReadAllFileContentsAndAppendToData,
};

// Using explicit typing to work around TypeScript's unidirectional type associations
export type FileSystemConcept = Concept<FileSystemState, FileSystemQualities>;
export type FileSystemDeck = {
  fileSystem: Concept<FileSystemState, FileSystemQualities>;
};
export type FileSystemPrinciple = PrincipleFunction<
  FileSystemQualities,
  MuxiumDeck & FileSystemDeck,
  FileSystemState
>;

// Principles for file watching and processing
const principles: FileSystemPrinciple[] = [
  fileSystemWatcherPrinciple,
  fileChangeProcessorPrinciple
];

export const createFileSystemConcept = () => {
  return createConcept(
    fileSystemName, 
    createFileSystemState(), 
    qualities, 
    principles,
    []
  ) as FileSystemConcept;
};
/*#>*/
