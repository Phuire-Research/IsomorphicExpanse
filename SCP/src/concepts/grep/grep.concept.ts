/**
 * Grep Concept - Huirth Deployment
 *
 * File searching and replacement concept for import path cascading.
 * Muxified into Huirth to provide server-side file operations.
 *
 * DEPLOYMENT: Huirth only (server-side file system access required)
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎯 Essential Principles"
 */
import { createConcept } from 'stratimux';
import type { AnyConcept } from 'stratimux';
import {
  grepName,
  type GrepState,
  type GrepQualities,
} from './grep.type';
import { createGrepState } from './grep.state';
import { grepSearchPattern } from './qualities/searchPattern.quality.huirth';
import { grepReplaceInFiles } from './qualities/replaceInFiles.quality.huirth';
import { grepCascadeImportPaths } from './qualities/cascadeImportPaths.quality.huirth';
import { grepUpdateDemometricConcept } from './qualities/updateDemometricConcept.quality.huirth';
import { grepUpdateMuxonomyDemometer } from './qualities/updateMuxonomyDemometer.quality.huirth';

// ============================================
// QUALITIES REGISTRATION
// ============================================

/**
 * Grep Qualities
 *
 * Citation: STRATIMUX-REFERENCE.md "Quality Type Definition Pattern"
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Explicit mapping - NEVER use typeof pattern
 */
export const grepQualities = {
  grepSearchPattern,
  grepReplaceInFiles,
  grepCascadeImportPaths,
  grepUpdateDemometricConcept,
  grepUpdateMuxonomyDemometer,
};

// ============================================
// CONCEPT CREATOR
// ============================================

/**
 * Create Grep Concept
 *
 * Returns AnyConcept due to TypeScript constraints on concept typing.
 * Type safety recovered through deck access patterns.
 */
export const createGrepConcept = (): AnyConcept =>
  createConcept<GrepState, typeof grepQualities>(
    grepName,
    createGrepState(),
    grepQualities,
    [] // No principles needed - operations are fire-and-forget via AsyncQualities
  );

// ============================================
// RE-EXPORTS
// ============================================

export type { GrepState, GrepQualities };
export { grepName };
export type { GrepConcept, GrepDeck, GrepModelDeck } from './grep.type';
