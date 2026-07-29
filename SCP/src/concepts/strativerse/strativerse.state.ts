/**
 * StratiVERSE State Creators
 *
 * State creation functions with initial values.
 * Complex nature - manual maintenance required.
 *
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 */

import type { StrativerseState } from './strativerse.type';

// ============================================
// UNIVERSAL STATE CREATOR
// ============================================

/**
 * Creates initial strativerse state
 *
 * Automatically detects environment:
 * - SERVER (Node.js): Uses findRoot() to determine scanPath
 * - CLIENT (Browser): Returns empty scanPath (state syncs from server)
 *
 * The scanPath is only meaningful on server where actual filesystem scanning occurs.
 * Client receives conceptList via WebSocket sync, not filesystem access.
 */
export function createStrativerseState(): StrativerseState {
  let scanPath = '';

  // Server-side: Dynamically resolve scanPath using findRoot
  // Client-side: typeof process is undefined, so this block is skipped
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      // Dynamic import to avoid bundling Node.js modules in client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { findRoot } = require('../fileSystem/model/findRoot');
      const root = findRoot();
      scanPath = `${root}/src/concepts`;
    } catch {
      // Fallback if findRoot fails
      scanPath = '';
    }
  }

  return {
    conceptList: {
      concepts: [],
      lastScan: 0,
      scanPath
    },
    managedProjects: [],
    templatePath: '',
    lastProjectScan: 0
  };
}

// ============================================
// HUIRTH STATE CREATOR
// ============================================

/**
 * Creates Huirth-specific strativerse state
 *
 * Server-side initialization with filesystem scanning capability.
 * Uses findRoot() to determine the concepts directory path.
 */
export function createStrativerseHuirthState(): StrativerseState {
  let scanPath = '';

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { findRoot } = require('../fileSystem/model/findRoot');
    const root = findRoot();
    scanPath = `${root}/src/concepts`;
  } catch {
    scanPath = '';
  }

  return {
    conceptList: {
      concepts: [],
      lastScan: 0,
      scanPath
    },
    managedProjects: [],
    templatePath: '',
    lastProjectScan: 0
  };
}

// ============================================
// CLIENT STATE CREATOR
// ============================================

/**
 * Creates Client-specific strativerse state
 *
 * Client-side initialization - minimal state.
 * ConceptList is synced from server via WebSocket, not local scanning.
 */
export function createStrativerseClientState(): StrativerseState {
  return {
    conceptList: {
      concepts: [],
      lastScan: 0,
      scanPath: '' // Client receives state via sync
    },
    managedProjects: [],
    templatePath: '',
    lastProjectScan: 0
  };
}
