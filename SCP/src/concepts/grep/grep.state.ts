/**
 * Grep Concept State Factory
 *
 * Creates initial state for Grep concept.
 * Minimal state - operations are fire-and-forget via AsyncQualities.
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management"
 */
import type { GrepState } from './grep.type';

/**
 * Create initial Grep state
 *
 * Note: ripgrepAvailable starts false, set true by initialization principle
 * after checking `which rg` succeeds.
 */
export const createGrepState = (): GrepState => ({
  lastSearchResult: null,
  lastReplaceResult: null,
  ripgrepAvailable: false,
});
