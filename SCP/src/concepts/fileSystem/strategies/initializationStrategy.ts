import { 
  ActionStrategy, 
  createActionNode, 
  createStrategy, 
  selectStratiDECK,
  strategyData_muxifyData,
  OwnershipConcept
} from 'stratimux';
import { FileSystemConcept } from '../fileSystem.concept';
import path from 'path';

/**
 * FileSystem Initialization Strategy
 * Reference: STRATIMUX-REFERENCE.md - 🎬 ActionStrategies - Orchestrated Action Sequences
 * Reference: STRATIMUX-REFERENCE.md - 🔧 selectStratiDECK Pattern for Strategy Creator Functions
 * Reference: STRATIMUX-REFERENCE.md - 🎯 ActionStrategy Data - Universal Transformer Pattern
 * 
 * Proper initialization flow:
 * 1. READ directories from file system (getDirectories)
 * 2. BUILD directoryClone from the read data
 * 3. SET UP observation paths for monitoring
 * 4. ENABLE watching for lazy operations
 */

export interface FileSystemInitializationPayload {
  rootPath?: string;  // Optional override for root path
  watchPaths?: string[];  // Initial paths to watch
  depth?: number;  // Max depth for directory mapping (default: 3)
  excludePatterns?: string[];  // Patterns to exclude (e.g., node_modules)
}

/**
 * Create FileSystem Initialization Strategy
 * Properly sequences: Read → Build → Configure → Watch
 */
export function createFileSystemInitializationStrategy(
  deck: unknown,  // Always use unknown type due to TypeScript design limitations
  payload: FileSystemInitializationPayload = {}
): ActionStrategy | undefined {
  
  // Access FileSystem concept using selectStratiDECK
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(
    deck, 
    'fileSystem'
  );
  
  // Access Ownership concept for backtrack coordination
  const ownershipDeck = selectStratiDECK<OwnershipConcept>(
    deck,
    'ownership'
  );
  
  // Guard clause: Return undefined if concepts unavailable
  if (!fileSystemDeck) {
    console.warn('FileSystem Initialization: Cannot create strategy - FileSystem concept not found');
    return undefined;
  }
  
  // Set defaults
  const {
    rootPath = process.cwd(),
    watchPaths = ['src', 'concepts', 'qualities', 'principles'],
    depth = 3,
    excludePatterns = ['node_modules', '.git', 'dist', 'build', '.cache']
  } = payload;
  
  // Create action nodes for initialization sequence
  
  // Create backtrack node for ownership coordination (if ownership is available)
  const backTrack = ownershipDeck ? createActionNode(ownershipDeck.e.ownershipBackTrack({})) : undefined;
  
  // Node 1: READ the actual directories from file system
  // This will populate strategy data with directory information
  const getDirectoriesNode = createActionNode(
    fileSystemDeck.e.fileSystemGetDirectories({
      path: rootPath
    }),
    { 
      priority: 100,
      ...(backTrack && { failureNode: backTrack }),  // Only add if ownership is available
      agreement: 10000  // 10 seconds for coordination
    }
  );
  
  // Node 2: READ subdirectories recursively to build full structure
  // Each level adds to the strategy data
  const getConceptsDirectoriesNode = createActionNode(
    fileSystemDeck.e.fileSystemGetDirectories({
      path: path.join(rootPath, 'src', 'concepts')
    }),
    { 
      priority: 100,
      ...(backTrack && { failureNode: backTrack }),
      agreement: 10000
    }
  );
  
  // Node 3: Process the read data to create directoryClone
  // This quality would transform the read directory data into the clone structure
  const buildDirectoryCloneNode = createActionNode(
    fileSystemDeck.e.fileSystemGetDirectoriesAndFiles({
      path: rootPath
    }),
    { 
      priority: 100,
      ...(backTrack && { failureNode: backTrack }),
      agreement: 10000
    }
  );
  
  // Node 4: Set up observation paths for lazy monitoring
  // Now that we have the directory structure, we can observe specific paths
  const observePathsNode = createActionNode(
    fileSystemDeck.e.fileSystemObservePaths({
      paths: watchPaths.map(p => path.isAbsolute(p) ? p : path.join(rootPath, p))
    }),
    { 
      priority: 100,
      ...(backTrack && { failureNode: backTrack }),
      agreement: 10000
    }
  );
  
  // Node 5: Enable file watching for lazy operations
  const enableWatchingNode = createActionNode(
    fileSystemDeck.e.fileSystemSetWatching({
      isWatching: true
    }),
    { 
      priority: 100,
      ...(backTrack && { failureNode: backTrack }),
      agreement: 10000
    }
  );
  
  // Link nodes in proper sequence: Read → Build → Configure → Watch
  getDirectoriesNode.successNode = getConceptsDirectoriesNode;
  getConceptsDirectoriesNode.successNode = buildDirectoryCloneNode;
  buildDirectoryCloneNode.successNode = observePathsNode;
  observePathsNode.successNode = enableWatchingNode;
  
  // Create and return the strategy
  return createStrategy({
    topic: 'FileSystem Initialization',
    initialNode: getDirectoriesNode,
    data: {
      rootPath,
      depth,
      excludePatterns,
      watchPaths,
      initialized: false  // Will be set to true after completion
    }
  });
}