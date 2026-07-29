/**
 * Grep Concept Type Definitions
 *
 * Provides file searching and replacement capabilities for import path cascading.
 * Used by StratiVERSE to update import paths when deployment targets change.
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management"
 *
 * Deployment: Huirth only (server-side file operations)
 */
import type { Concept, MuxiumDeck } from 'stratimux';

// ============================================
// CONCEPT NAME
// ============================================

export const grepName = 'grep';

// ============================================
// SEARCH RESULT TYPES
// ============================================

/**
 * Single match within a file
 */
export type GrepMatch = {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
};

/**
 * Result of a search operation
 */
export type GrepSearchResult = {
  pattern: string;
  matches: GrepMatch[];
  filesSearched: number;
  timestamp: number;
};

// ============================================
// REPLACE REQUEST/RESULT TYPES
// ============================================

/**
 * Request to replace pattern in files
 */
export type GrepReplaceRequest = {
  searchPattern: string;
  replaceWith: string;
  targetDirectory: string;
  fileGlob: string;
  dryRun: boolean;
};

/**
 * Result of a replace operation
 */
export type GrepReplaceResult = {
  filesModified: string[];
  totalReplacements: number;
  errors: string[];
  dryRun: boolean;
};

// ============================================
// STATE DEFINITION
// ============================================

/**
 * Grep Concept State
 *
 * ARCHITECTURAL NOTE: No isSearching/isReplacing flags.
 * Grep operations are independent AsyncQualities that can run concurrently.
 * Each operation fires strategy success/failure on completion - the CLI wrapper
 * acts as an endpoint, not a stateful service.
 *
 * CRITICAL: No optional properties (KeyedSelector requirement)
 * Citation: STRATIMUX-REFERENCE.md "Avoid Optional Properties in State"
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 */
export type GrepState = {
  /** Last search result (null if no search performed) */
  lastSearchResult: GrepSearchResult | null;
  /** Last replace result (null if no replace performed) */
  lastReplaceResult: GrepReplaceResult | null;
  /** ripgrep availability flag (checked once at init) */
  ripgrepAvailable: boolean;
};

// ============================================
// QUALITY PAYLOAD TYPES
// ============================================

export type GrepSearchPatternPayload = {
  pattern: string;
  targetDirectory: string;
  fileGlob: string;
};

export type GrepReplaceInFilesPayload = GrepReplaceRequest;

export type GrepCascadeImportPathsPayload = {
  conceptPath: string;
};

/**
 * Payload for updateDemometricConcept quality
 *
 * Includes payload detection for asymmetric Induction creation:
 * - hasPayload: true → createDiametricQualityWithPayload<State, Payload, Deck>
 * - hasPayload: false → createDiametricQuality<State, Deck>
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 */
export type GrepUpdateDemometricConceptPayload = {
  conceptFilePath: string;        // Full path to concept file
  qualityName: string;            // 'notificationHelloWorld'
  qualityTypeString: string;      // 'Notification Hello World'
  qualityFileName: string;        // 'helloWorld.quality.huirth.diameter.ts' (new location)
  stateTypeName: string;          // 'NotificationState'
  deckTypeName: string;           // 'NotificationModelDeck'
  mode: 'toInduction' | 'toReal'; // Transformation direction
  // Payload detection for asymmetric Induction creation
  hasPayload: boolean;
  payloadTypeName?: string;       // Required if hasPayload is true
};

/**
 * Payload for updateMuxonomyDemometer quality
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 */
export type GrepUpdateMuxonomyDemometerPayload = {
  muxonomyFilePath: string;       // Full path to muxonomy file
  qualityName: string;            // 'notificationHelloWorld'
  newLocation: 'Client' | 'Huirth' | 'All';
  newFilePath: string;            // New relative file path
};

// ============================================
// QUALITY TYPE IMPORTS (Forward declarations)
// ============================================

import type { GrepSearchPattern } from './qualities/searchPattern.quality.huirth';
import type { GrepReplaceInFiles } from './qualities/replaceInFiles.quality.huirth';
import type { GrepCascadeImportPaths } from './qualities/cascadeImportPaths.quality.huirth';
import type { GrepUpdateDemometricConcept } from './qualities/updateDemometricConcept.quality.huirth';
import type { GrepUpdateMuxonomyDemometer } from './qualities/updateMuxonomyDemometer.quality.huirth';

// ============================================
// DECK TYPES
// ============================================

/**
 * Grep Qualities mapping
 *
 * Citation: STRATIMUX-REFERENCE.md "Quality Type Definition Pattern"
 * NEVER use typeof pattern - causes compilation failures
 */
export type GrepQualities = {
  grepSearchPattern: GrepSearchPattern;
  grepReplaceInFiles: GrepReplaceInFiles;
  grepCascadeImportPaths: GrepCascadeImportPaths;
  grepUpdateDemometricConcept: GrepUpdateDemometricConcept;
  grepUpdateMuxonomyDemometer: GrepUpdateMuxonomyDemometer;
};

/**
 * Grep Concept type for selectStratiDECK
 */
export type GrepConcept = Concept<GrepState, GrepQualities>;

/**
 * Grep Deck for muxification typing
 */
export type GrepDeck = {
  grep: GrepConcept;
};

/**
 * Grep Model Deck (for qualities that need muxium access)
 */
export type GrepModelDeck = MuxiumDeck & GrepDeck;
