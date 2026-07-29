/**
 * scpStrategyDelete Strategy - Delete SCP strategy with cascading removal (reverse of Means 8)
 *
 * Removes an SCP strategy with all file modifications reversed:
 * 1. Remove SCP metadata from muxonomy.ts (CRLF-safe)
 * 2. Remove strategyCreator import from muxonomy.ts
 * 3. Remove demometer entry from muxonomy.ts
 * 4. Remove export from strategies/index.ts (no-op if not found)
 * 5. Delete strategy file
 *
 * SCP Tool: strativerse_scp_strategy_delete
 * Tool Type: actionable
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 3.1
 * Citation: POC-2-3B-INFORMATIVE-SPREE-WORKGAMEBOARD.md - Suite 7 Rose R3.2
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
import path from 'path';

// ============================================
// SPECIFICATION TYPE
// ============================================

export type ScpStrategyDeleteSpecification = {
  strategyName: string;
  conceptName: string;
  location: 'huirth' | 'client' | 'all';
  toolName: string;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// getConceptPath imported from ../model/projectPathResolver.model

function generateStrategyFileName(strategyName: string, location: string): string {
  var parts = [strategyName, 'strategy'];
  if (location !== 'all') {
    parts.push(location);
  }
  return parts.join('.') + '.ts';
}

function generateStrategyCreatorName(conceptName: string, strategyName: string): string {
  return 'create' + capitalizeFirst(conceptName) + capitalizeFirst(strategyName) + 'Strategy';
}

// ============================================
// REMOVAL PATTERN GENERATORS
// ============================================

/**
 * Generate CRLF-safe regex to remove SCP metadata entry from muxonomy.ts.
 * Uses \\r?\\n for CRLF compatibility.
 * Uses [\\s\\S]*? for nested {} in inputSchema.
 */
function generateSCPMetadataRemovalPattern(qualityName: string): string {
  return '\\r?\\n?\\s*(?:\\/\\/[^\\r\\n]*\\r?\\n\\s*)*\\{\\r?\\n\\s*qualityName: \'' + qualityName + '\',[\\s\\S]*?\\} as SCPQualityMetadata,';
}

/**
 * Generate regex to remove strategyCreator import from muxonomy.ts.
 */
function generateImportRemovalPattern(creatorName: string): string {
  return '\\r?\\nimport \\{ ' + creatorName + ' \\} from \'[^\']*\';';
}

/**
 * Generate regex to remove strategy demometer entry from muxonomy.ts.
 * Strategy demometers have nested filePath but no nested {}, so [^}]* is safe.
 */
function generateDemometerRemovalPattern(demometerName: string): string {
  return '\\r?\\n?\\s*\\{[^}]*name: \'' + demometerName + '\'[^}]*\\},?';
}

/**
 * Generate regex to remove export from strategies/index.ts (if it exists).
 */
function generateExportRemovalPattern(strategyFileName: string): string {
  var fileNameNoExt = strategyFileName.replace('.ts', '');
  return '\\r?\\nexport \\* from \'\\.\/' + fileNameNoExt + '\';';
}

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is ScpStrategyDeleteSpecification {
  var s = spec as ScpStrategyDeleteSpecification;
  return !!(
    s.strategyName &&
    s.conceptName &&
    s.location &&
    s.toolName
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseScpStrategyDeleteStrategy - SCP Strategy Creator (Means 9)
 *
 * Creates a 5-node strategy for SCP strategy deletion (reverse of Means 8):
 * Node 1: Remove SCP metadata from muxonomy.ts (CRLF-safe)
 * Node 2: Remove strategyCreator import from muxonomy.ts
 * Node 3: Remove demometer entry from muxonomy.ts
 * Node 4: Remove export from strategies/index.ts (no-op if not found)
 * Node 5: Delete strategy file
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 3.1
 */
export const createStrativerseScpStrategyDeleteStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means9:SCPStrategyDelete]';
  console.log(LOG_PREFIX + ' ===============================================================');
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Timestamp: ' + new Date().toISOString());
  console.log(LOG_PREFIX + ' Params received:', JSON.stringify(params, null, 2));

  var specification = params.specification as ScpStrategyDeleteSpecification;

  if (!validateSpecification(specification)) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED - Invalid specification');
    console.error(LOG_PREFIX + ' Specification received:', JSON.stringify(specification, null, 2));
    return undefined;
  }

  var strategyName = specification.strategyName;
  var conceptName = specification.conceptName;
  var location = specification.location;
  var toolName = specification.toolName;

  console.log(LOG_PREFIX + ' Validation passed for strategy: ' + strategyName);
  console.log(LOG_PREFIX + ' SCP tool to unregister: ' + toolName);

  var grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  var fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');

  if (!grepDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - grep deck not found');
    return undefined;
  }
  if (!fileSystemDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - fileSystem deck not found');
    return undefined;
  }
  console.log(LOG_PREFIX + ' Both decks acquired (grep, fileSystem)');

  // Project resolution
  var strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');
  var projName = params.projectName as string | undefined;
  var projPath = params.projectPath as string | undefined;
  var strativerseState = strativerseDeck?.k.getState(concepts_) as StrativerseState | undefined;
  var managedProjectsList = strativerseState?.managedProjects || [];
  var resolved = resolveProjectRoot(projName, projPath, managedProjectsList);
  if (!resolved) {
    console.error(LOG_PREFIX + ' PROJECT RESOLUTION FAILED - project \'' + projName + '\' not found in managed projects');
    return undefined;
  }
  console.log(LOG_PREFIX + ' Project resolved:', JSON.stringify({ projectRoot: resolved.projectRoot, isAdminSCP: resolved.isAdminSCP }));

  var conceptPath = getConceptPath(resolved.projectRoot, conceptName);
  var strategyFileName = generateStrategyFileName(strategyName, location);
  var strategyFilePath = conceptPath + '/strategies/' + strategyFileName;
  var muxonomyFileName = conceptName + '.muxonomy.ts';

  var creatorName = generateStrategyCreatorName(conceptName, strategyName);
  var qualityName = conceptName + capitalizeFirst(strategyName);
  var demometerName = conceptName + capitalizeFirst(strategyName) + 'Strategy';

  console.log(LOG_PREFIX + ' Paths:', JSON.stringify({
    conceptPath: conceptPath,
    strategyFileName: strategyFileName,
    strategyFilePath: strategyFilePath,
    muxonomyFileName: muxonomyFileName,
    creatorName: creatorName,
    qualityName: qualityName,
    demometerName: demometerName,
  }, null, 2));

  var scpMetadataPattern = generateSCPMetadataRemovalPattern(qualityName);
  var importPattern = generateImportRemovalPattern(creatorName);
  var demometerPattern = generateDemometerRemovalPattern(demometerName);
  var exportPattern = generateExportRemovalPattern(strategyFileName);

  console.log(LOG_PREFIX + ' Removal patterns generated for all 5 nodes');

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order: Node 5 first, Node 1 last)
  // ============================================

  // Node 5: Delete strategy file (final node)
  var deleteFileNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: strategyFilePath,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'strategy file ' + strategyFileName + ' deleted.',
      },
    }
  );

  // Node 4: Remove export from strategies/index.ts (no-op if not found)
  var removeExportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: exportPattern,
      replaceWith: '',
      targetDirectory: conceptPath + '/strategies',
      fileGlob: 'index.ts',
      dryRun: false,
    }),
    {
      successNode: deleteFileNode,
      successNotes: {
        preposition: 'then',
        denoter: 'export removal attempted from strategies/index.ts;',
      },
    }
  );

  // Node 3: Remove demometer entry from muxonomy.ts
  var removeDemometerNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: demometerPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: removeExportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'demometer entry removed from muxonomy.ts;',
      },
    }
  );

  // Node 2: Remove strategyCreator import from muxonomy.ts
  var removeImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: importPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: removeDemometerNode,
      successNotes: {
        preposition: 'then',
        denoter: 'strategyCreator import removed from muxonomy.ts;',
      },
    }
  );

  // Node 1: Remove SCP metadata from muxonomy.ts (CRLF-safe)
  var removeSCPMetadataNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: scpMetadataPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: removeImportNode,
      successNotes: {
        preposition: 'First',
        denoter: 'SCP metadata removal from muxonomy.ts;',
      },
    }
  );

  var strategy = createStrategy({
    topic: 'StratiVERSE SCP Strategy Delete - ' + toolName,
    initialNode: removeSCPMetadataNode,
    data: {
      specification: specification,
      strategyFilePath: strategyFilePath,
      strategyFileName: strategyFileName,
      conceptPath: conceptPath,
      creatorName: creatorName,
      initTimestamp: Date.now(),
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED SUCCESSFULLY');
  console.log(LOG_PREFIX + ' Strategy topic: ' + strategy.topic);
  console.log(LOG_PREFIX + ' Node chain: SCP metadata -> import -> demometer -> export -> delete file');
  console.log(LOG_PREFIX + ' ===============================================================');

  return strategy;
};
