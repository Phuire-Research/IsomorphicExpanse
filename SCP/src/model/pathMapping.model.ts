/**
 * Path Mapping Model - Simplified Path Structure
 * Converts between simplified client paths and verbose server paths
 * Reference: CLAUDE.md - Higher-Order Composition Pattern
 *
 * Simplified Structure: projectId/sessionId/* (where * = stack/file)
 * Verbose Structure: projects/projectId/sessions/sessionId/muxTapes/*
 */

/**
 * Convert simplified path to verbose server path
 * Example: "proj123/sess456/tape.muxtape" → "/projects/proj123/sessions/sess456/muxTapes/tape.muxtape"
 */
export function expandToServerPath(simplifiedPath: string, basePath: string = ''): string {
  const segments = simplifiedPath.split('/').filter(Boolean);

  if (segments.length < 2) {
    throw new Error(`Invalid simplified path format: ${simplifiedPath}`);
  }

  const [projectId, sessionId, ...rest] = segments;

  // Build verbose path with proper nesting
  const verbosePath = `/projects/${projectId}/sessions/${sessionId}/muxTapes/${rest.join('/')}`;

  return basePath ? `${basePath}${verbosePath}` : verbosePath;
}

/**
 * Convert verbose server path to simplified client path
 * Example: "/projects/proj123/sessions/sess456/muxTapes/tape.muxtape" → "proj123/sess456/tape.muxtape"
 */
export function simplifyFromServerPath(verbosePath: string): string {
  // Remove leading slash and split
  const normalized = verbosePath.replace(/^\/+/, '');
  const segments = normalized.split('/');

  // Find indices of key segments
  const projectIdx = segments.indexOf('projects');
  const sessionIdx = segments.indexOf('sessions');
  const muxTapesIdx = segments.indexOf('muxTapes');

  if (projectIdx === -1 || sessionIdx === -1) {
    // Path doesn't match expected format, return as-is
    return verbosePath;
  }

  const projectId = segments[projectIdx + 1];
  const sessionId = segments[sessionIdx + 1];

  if (!projectId || !sessionId) {
    throw new Error(`Invalid verbose path format: ${verbosePath}`);
  }

  // Extract remaining path after muxTapes
  const remaining =
    muxTapesIdx !== -1 && muxTapesIdx + 1 < segments.length
      ? segments.slice(muxTapesIdx + 1).join('/')
      : '';

  return remaining ? `${projectId}/${sessionId}/${remaining}` : `${projectId}/${sessionId}`;
}

/**
 * Build a simplified MuxTape path
 * Column A: Project | Column B: Session | Item: MuxTape
 */
export function buildSimplifiedMuxTapePath(
  projectId: string,
  sessionId: string,
  muxTapeId: string,
  isStack: boolean = false,
): string {
  const suffix = isStack ? `${muxTapeId}/stack` : `${muxTapeId}.muxtape`;
  return `${projectId}/${sessionId}/${suffix}`;
}

/**
 * Parse a simplified path into its components
 */
export function parseSimplifiedPath(simplifiedPath: string): {
  projectId: string;
  sessionId: string;
  resource?: string;
  isStack: boolean;
} {
  const segments = simplifiedPath.split('/').filter(Boolean);

  if (segments.length < 2) {
    throw new Error(`Invalid simplified path: ${simplifiedPath}`);
  }

  const [projectId, sessionId, ...rest] = segments;
  const resource = rest.join('/');
  const isStack = resource.endsWith('/stack') || resource === 'stack';

  return {
    projectId,
    sessionId,
    resource: resource || undefined,
    isStack,
  };
}

/**
 * Type for path configuration
 */
export interface PathConfig {
  useSimplified: boolean;
  basePath?: string;
  includeProjects?: boolean;
  includeSessions?: boolean;
  includeMuxTapes?: boolean;
}

/**
 * Build a path based on configuration
 */
export function buildPath(
  projectId: string,
  sessionId: string,
  resource: string = '',
  config: PathConfig = { useSimplified: true },
): string {
  if (config.useSimplified) {
    return resource ? `${projectId}/${sessionId}/${resource}` : `${projectId}/${sessionId}`;
  }

  // Build verbose path
  let path = '';

  if (config.includeProjects !== false) {
    path += `/projects/${projectId}`;
  }

  if (config.includeSessions !== false) {
    path += `/sessions/${sessionId}`;
  }

  if (config.includeMuxTapes !== false && resource) {
    path += `/muxTapes/${resource}`;
  }

  return config.basePath ? `${config.basePath}${path}` : path;
}
