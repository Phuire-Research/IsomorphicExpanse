/**
 * oneShotPrincipleRemove Strategy - Means 12 Actionable
 *
 * Removes a principle file and all hookups in a single SCP tool call:
 * 1. Remove demometer entry from muxonomy.ts
 * 2. Remove from principles[] array in createConcept
 * 3. Remove import statement from concept.ts
 * 4. Delete principle file from principles/ directory
 *
 * Citation: Crystraline 6 Diamond Plan - Means 12
 */
import {
  ActionStrategy,
  Concepts,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { GrepConcept } from '../../grep/grep.type';
import type { FileSystemConcept } from '../../fileSystem/fileSystem.concept';
import type { SCPStrategyCreator } from '../../scp/scp.types';
import type { StrativerseConcept } from '../strativerse.concept';
import type { StrativerseState } from '../strativerse.type';
import { resolveProjectRoot, getConceptPath } from '../model/projectPathResolver.model';

// ============================================
// SPECIFICATION TYPE
// ============================================

export type PrincipleRemoveSpecification = {
  principleName: string;
  conceptName: string;
  location: 'huirth' | 'client' | 'all';
};

// ============================================
// VALIDATION
// ============================================

type ValidationResult = { valid: true } | { valid: false; reason: string };

function validateSpecification(spec: unknown): ValidationResult {
  var s = spec as PrincipleRemoveSpecification;

  if (!s.principleName) {
    return { valid: false, reason: 'Missing principleName' };
  }
  if (!s.conceptName) {
    return { valid: false, reason: 'Missing conceptName' };
  }
  if (!s.location) {
    return { valid: false, reason: 'Missing location' };
  }
  return { valid: true };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generatePrincipleFileName(principleName: string, location: string): string {
  var locationSuffix = location === 'huirth' ? '.huirth'
    : location === 'client' ? '.client'
    : '';
  return principleName + '.principle' + locationSuffix + '.ts';
}

// ============================================
// REMOVAL PATTERN GENERATORS
// ============================================

/**
 * Generate regex to remove demometer entry from muxonomy.ts principles array.
 * Matches the demometer object for this principle.
 */
function generateDemometerRemovalPattern(principleName: string): string {
  return '\\n?\\s*\\{[^}]*name: \'' + principleName + '\'[^}]*\\},?';
}

/**
 * Generate regex to remove import statement from concept.ts.
 */
function generateImportRemovalPattern(principleName: string): string {
  return '\\nimport \\{ ' + principleName + ' \\} from \'[^\']*\';';
}

/**
 * Generate regex to remove principle from principles[] array in createConcept.
 * Matches: [existingPrinciple, principleName] or [principleName, existingPrinciple]
 */
function generatePrincipleArrayRemovalPattern(principleName: string): string {
  return ',?\\s*' + principleName;
}

// ============================================
// STRATEGY CREATOR
// ============================================

export const createStrativerseOneShotPrincipleRemoveStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means12:OneShotPrincipleRemove]';
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Timestamp: ' + new Date().toISOString());

  var specification = params.specification as PrincipleRemoveSpecification;

  // Validate
  var validationResult = validateSpecification(specification);
  if (!validationResult.valid) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED: ' + validationResult.reason);
    return undefined;
  }

  console.log(LOG_PREFIX + ' Validated: ' + specification.principleName);

  // Get decks
  var grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  var fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  var strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!grepDeck || !fileSystemDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED');
    return undefined;
  }

  // Project resolution
  var projectName = params.projectName as string | undefined;
  var projectPath = params.projectPath as string | undefined;
  var strativerseState = strativerseDeck?.k.getState(concepts_) as StrativerseState | undefined;
  var managedProjects = strativerseState?.managedProjects || [];
  var resolved = resolveProjectRoot(projectName, projectPath, managedProjects);
  if (!resolved) {
    console.error(LOG_PREFIX + ' PROJECT RESOLUTION FAILED');
    return undefined;
  }
  console.log(LOG_PREFIX + ' Project resolved: ' + resolved.projectRoot);

  // Paths
  var conceptPath = getConceptPath(resolved.projectRoot, specification.conceptName);
  var principleFileName = generatePrincipleFileName(specification.principleName, specification.location);
  var principleFilePath = conceptPath + '/principles/' + principleFileName;
  var muxonomyFileName = specification.conceptName + '.muxonomy.ts';
  var conceptFileName = specification.conceptName + '.concept.ts';

  // Generate removal patterns
  var demometerPattern = generateDemometerRemovalPattern(specification.principleName);
  var importPattern = generateImportRemovalPattern(specification.principleName);
  var principleArrayPattern = generatePrincipleArrayRemovalPattern(specification.principleName);

  console.log(LOG_PREFIX + ' Building 4-node chain...');

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================

  // Node 4 (Final): Delete principle file
  var deleteFileNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: principleFilePath,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'principle file ' + principleFileName + ' deleted.',
      },
    }
  );

  // Node 3: Remove import statement from concept.ts
  var removeImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: importPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: deleteFileNode,
      successNotes: {
        preposition: 'then',
        denoter: 'import statement removed;',
      },
    }
  );

  // Node 2: Remove principle from principles[] array in createConcept
  var removePrincipleArrayNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: principleArrayPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: removeImportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'principle removed from principles array;',
      },
    }
  );

  // Node 1 (Initial): Remove demometer entry from muxonomy.ts
  var removeDemometerNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: demometerPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: removePrincipleArrayNode,
      successNotes: {
        preposition: 'First',
        denoter: 'demometer entry removed from muxonomy;',
      },
    }
  );

  // Create strategy
  var strategy = createStrategy({
    topic: 'StratiVERSE OneShot Principle Remove - ' + specification.principleName,
    initialNode: removeDemometerNode,
    data: {
      specification: specification,
      principleFilePath: principleFilePath,
      principleFileName: principleFileName,
      conceptPath: conceptPath,
      initTimestamp: Date.now(),
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED (4 nodes)');
  console.log(LOG_PREFIX + ' Topic: ' + strategy.topic);
  return strategy;
};
