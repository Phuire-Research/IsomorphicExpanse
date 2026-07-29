/**
 * Cascade Import Paths Strategy - Huirth Deployment
 *
 * Orchestrates import path updates after deployment target changes.
 * Called by StratiVERSE updateTarget strategy after file rename succeeds.
 *
 * Strategy Flow:
 * 1. Derive old/new import paths from modification result
 * 2. Build regex pattern for import statements
 * 3. Replace in files within concept directory
 * 4. Return result via strategy success/failure
 *
 * Citation: POC-2-5-GREP-CONCEPT-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies"
 */
import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { GrepConcept } from '../grep.concept';

/**
 * Import cascade request - data from StratiVERSE modification result
 */
export type ImportCascadeRequest = {
  conceptName: string;
  conceptPath: string;
  oldFileName: string;
  newFileName: string;
};

/**
 * Create strategy to cascade import path updates
 *
 * @param deck - Muxium deck for selectStratiDECK
 * @param request - Import cascade request with old/new filenames
 * @returns ActionStrategy or undefined if deck not available
 */
export function createCascadeImportPathsStrategy(
  deck: unknown,
  request: ImportCascadeRequest
): ActionStrategy | undefined {
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');

  if (!grepDeck) {
    console.error('[Grep Strategy] Failed to access grep deck');
    return undefined;
  }

  const { conceptName, conceptPath, oldFileName, newFileName } = request;

  // Derive import paths (strip .ts extension)
  const oldImportPath = oldFileName.replace(/\.ts$/, '');
  const newImportPath = newFileName.replace(/\.ts$/, '');

  // Escape special regex characters in the path
  const escapedOldPath = oldImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build regex pattern that matches import statements
  // Matches: from './qualities/oldFileName' or from "./qualities/oldFileName"
  const searchPattern = `(from\\s+['"])(\\.\\/)?(qualities\\/)?${escapedOldPath}(['"])`;

  // Build replacement that preserves the quote style and path structure
  // Uses capture groups to maintain original formatting
  const replaceWith = `$1$2$3${newImportPath}$4`;

  console.log('[Grep Strategy] Creating cascade import paths strategy:', {
    conceptName,
    conceptPath,
    oldImportPath,
    newImportPath,
    searchPattern,
  });

  const replaceNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern,
      replaceWith,
      targetDirectory: conceptPath,
      fileGlob: '**/*.ts',
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: '',
        denoter: `import paths cascaded for ${conceptName}.`,
      },
    }
  );

  return createStrategy({
    topic: `Grep - Cascade Import Paths (${conceptName})`,
    initialNode: replaceNode,
    data: {
      conceptName,
      conceptPath,
      oldFileName,
      newFileName,
      oldImportPath,
      newImportPath,
    },
  });
}
