import path from 'path';

/**
 * Finds the root directory of the project
 * Navigates up from the current working directory (server) to find the project root
 * 
 * @returns The absolute path to the project root (the project directory)
 */
export const findRoot = (): string => {
  const cwd = process.cwd();
  console.log('[FileSystem] Current working directory:', cwd);
  
  // Check if we're already in the server directory
  if (cwd.endsWith('/server') || cwd.endsWith('\\server')) {
    // Go up one level to get project root
    const projectRoot = path.dirname(cwd);
    console.log('[FileSystem] Project root determined as:', projectRoot);
    return projectRoot;
  }
  
  // Otherwise, find the project root by looking for server/client directories
  const pathParts = cwd.split(path.sep);
  const root: string[] = [];
  
  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] !== 'server' && pathParts[i] !== 'client') {
      root.push(pathParts[i]);
    } else {
      // Stop when we hit 'server' or 'client'
      break;
    }
  }
  
  const rootPath = root.length > 1 ? root.join(path.sep) : '/';
  console.log('[FileSystem] Project root determined as:', rootPath);
  return rootPath;
};

/**
 * Creates a path relative to the project root
 * Useful for buildPlatform file operations
 * 
 * @param relativePath - Path relative to project root (e.g., 'buildPlatform/proj_default/...')
 * @returns Absolute path from project root
 */
export const createProjectPath = (relativePath: string): string => {
  const root = findRoot();
  const fullPath = path.join(root, relativePath);
  console.log('[FileSystem] Created project path:', fullPath);
  return fullPath;
};