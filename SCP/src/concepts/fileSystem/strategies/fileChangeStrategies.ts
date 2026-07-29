import { 
  ActionStrategy, 
  createActionNode, 
  createStrategy, 
  selectStratiDECK, 
  Concepts,
  OwnershipConcept
} from 'stratimux';
import { FileSystemConcept } from '../fileSystem.concept';
import { getDirectorySelectorByPath } from '../directorySelectors.singleton';
import { createPathSelector } from '../fileSystem.pathTransform';

/**
 * Strategy Creator Functions for File Change Handling
 * Reference: STRATIMUX-REFERENCE.md - 🎬 ActionStrategies - Orchestrated Action Sequences
 * Reference: STRATIMUX-REFERENCE.md - 🔧 selectStratiDECK Pattern for Strategy Creator Functions
 * 
 * These strategies orchestrate lazy file operations with spatial locking
 * Part of the Quining infrastructure - enables Project Manager orchestration
 */

/**
 * Create a strategy for reading a file lazily
 * Attaches FileSystemSelector for spatial locking via Ownership
 */
export function createReadFileStrategy(
  deck: unknown,
  concepts: Concepts,
  path: string,
  encoding?: BufferEncoding
): ActionStrategy | undefined {
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  const ownershipDeck = selectStratiDECK<OwnershipConcept>(deck, 'ownership');
  
  if (!fileSystemDeck) {
    return undefined;
  }
  
  // First check if selector already exists (O(1) lookup)
  let selector = getDirectorySelectorByPath(path);
  
  // If not, create a new selector
  if (!selector) {
    selector = createPathSelector(deck, concepts, path);
  }
  
  // Create read action
  const readAction = fileSystemDeck.e.fileSystemReadFile({ 
    path, 
    encoding 
  });
  
  // Attach selector for Ownership locking
  if (selector) {
    readAction.keyedSelectors = [selector];
  }
  
  // Create backtrack node for ownership coordination
  const backTrack = ownershipDeck ? createActionNode(ownershipDeck.e.ownershipBackTrack({})) : undefined;
  
  const readNode = createActionNode(readAction, { 
    priority: 100,
    ...(backTrack && { failureNode: backTrack }),
    agreement: 10000  // 10 seconds for coordination
  });
  
  return createStrategy({
    topic: 'Lazy File Read Strategy',
    initialNode: readNode
  });
}

/**
 * Create a strategy for writing a file after approval
 * Attaches FileSystemSelector for spatial locking via Ownership
 */
export function createWriteFileStrategy(
  deck: unknown,
  concepts: Concepts,
  path: string,
  content: string | Buffer,
  encoding?: BufferEncoding
): ActionStrategy | undefined {
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  const ownershipDeck = selectStratiDECK<OwnershipConcept>(deck, 'ownership');
  
  if (!fileSystemDeck) {
    return undefined;
  }
  
  // First check if selector already exists (O(1) lookup)
  let selector = getDirectorySelectorByPath(path);
  
  // If not, create a new selector
  if (!selector) {
    selector = createPathSelector(deck, concepts, path);
  }
  
  // Create write action
  const writeAction = fileSystemDeck.e.fileSystemWriteFile({ 
    path, 
    content,
    encoding,
    createDirectories: true
  });
  
  // Attach selector for Ownership locking
  if (selector) {
    writeAction.keyedSelectors = [selector];
  }
  
  // Create backtrack node for ownership coordination
  const backTrack = ownershipDeck ? createActionNode(ownershipDeck.e.ownershipBackTrack({})) : undefined;
  
  const writeNode = createActionNode(writeAction, { 
    priority: 100,
    ...(backTrack && { failureNode: backTrack }),
    agreement: 10000  // 10 seconds for coordination
  });
  
  return createStrategy({
    topic: 'File Write Strategy',
    initialNode: writeNode
  });
}

/**
 * Create a strategy for read-modify-write operations
 * Chains read → processing → write with spatial locking
 */
export function createReadModifyWriteStrategy(
  deck: unknown,
  concepts: Concepts,
  path: string,
  modifyAction: any  // Action that processes file content
): ActionStrategy | undefined {
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  const ownershipDeck = selectStratiDECK<OwnershipConcept>(deck, 'ownership');
  
  if (!fileSystemDeck) {
    return undefined;
  }
  
  // First check if selector already exists (O(1) lookup)
  let selector = getDirectorySelectorByPath(path);
  
  // If not, create a new selector
  if (!selector) {
    selector = createPathSelector(deck, concepts, path);
  }
  
  // Create action nodes
  const readAction = fileSystemDeck.e.fileSystemReadFile({ path });
  if (selector) {
    readAction.keyedSelectors = [selector];
  }
  // Create backtrack node for ownership coordination
  const backTrack = ownershipDeck ? createActionNode(ownershipDeck.e.ownershipBackTrack({})) : undefined;
  
  const readNode = createActionNode(readAction, { 
    priority: 100,
    ...(backTrack && { failureNode: backTrack }),
    agreement: 10000
  });
  
  // Modify action will receive file content in strategy data
  const modifyNode = createActionNode(modifyAction, { 
    priority: 100,
    ...(backTrack && { failureNode: backTrack }),
    agreement: 10000
  });
  
  // Write action will receive modified content in strategy data
  const writeAction = fileSystemDeck.e.fileSystemWriteFile({ 
    path,
    content: '',  // Content will come from strategy data
    createDirectories: true
  });
  if (selector) {
    writeAction.keyedSelectors = [selector];
  }
  const writeNode = createActionNode(writeAction, { 
    priority: 100,
    ...(backTrack && { failureNode: backTrack }),
    agreement: 10000
  });
  
  // Chain nodes
  readNode.successNode = modifyNode;
  modifyNode.successNode = writeNode;
  
  return createStrategy({
    topic: 'Read-Modify-Write Strategy',
    initialNode: readNode
  });
}


/**
 * Create a strategy for handling file change events
 * Used by fileChangeProcessor principle
 */
export function createFileChangeHandlerStrategy(
  deck: unknown,
  concepts: Concepts,
  path: string,
  changeType: 'add' | 'change' | 'unlink'
): ActionStrategy | undefined {
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  
  if (!fileSystemDeck) {
    return undefined;
  }
  
  // For now, just read the file lazily
  // Project Manager will orchestrate more complex handling
  if (changeType === 'unlink') {
    // File deleted - no read needed
    return undefined;
  }
  
  return createReadFileStrategy(deck, concepts, path);
}