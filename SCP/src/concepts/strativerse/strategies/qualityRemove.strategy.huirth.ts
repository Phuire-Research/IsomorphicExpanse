/**
 * strativerseQualityRemove Strategy - Quality Removal SCP Tool (Means 4)
 *
 * Removes a quality with all file modifications reversed (reverse of Means 1):
 * 1. Remove SCP metadata from muxonomy.ts (Means 5 inline - no-op if not found)
 * 2. Remove from conceptQualities object in concept.ts
 * 3. Remove from ConceptQualities type in concept.ts
 * 4. Remove type export from concept.ts
 * 5. Remove import from concept.ts
 * 6. Remove demometer entry from muxonomy.ts
 * 7. Remove export from index.ts
 * 8. Remove type definitions from types.ts
 * 9. Delete quality file
 *
 * SCP Detection: Always attempts SCP removal (no-op if no SCP entry found).
 * grepReplaceInFiles with 0 matches succeeds with 0 replacements.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.1
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Means 4
 * Citation: STRATIMUX-REFERENCE.md "ActionStrategies"
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
// QUALITY REMOVAL SPECIFICATION TYPE
// ============================================

/**
 * QualityRemovalSpecification - Specification for removing a quality
 *
 * Reverse of QualityCreationSpecification (Means 1).
 * Only identity fields needed - removal patterns are derived.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.1
 */
export type QualityRemovalSpecification = {
  qualityName: string;
  conceptName: string;
  location: 'huirth' | 'client' | 'all';
  diameter: boolean;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// getConceptPath imported from ../model/projectPathResolver.model

function generateQualityFileName(qualityName: string, location: string, diameter: boolean): string {
  const parts = [qualityName, 'quality'];
  if (location !== 'all') {
    parts.push(location);
  }
  if (diameter) {
    parts.push('diameter');
  }
  return parts.join('.') + '.ts';
}

// ============================================
// REMOVAL PATTERN GENERATORS
// ============================================

/**
 * Generate regex to remove SCP metadata entry from muxonomy.ts scpToolMetadata array.
 * Matches optional comment lines + the full block including nested inputSchema.
 * Uses [\\s\\S]*? (non-greedy any-including-newlines) for nested {} in inputSchema.
 */
function generateSCPMetadataRemovalPattern(qualityName: string): string {
  // Pattern: optional comment lines, then { qualityName: 'NAME' ... } as SCPQualityMetadata,
  // Uses \\r?\\n for CRLF compatibility (muxonomy.ts may have CRLF line endings)
  return '\\r?\\n?\\s*(?:\\/\\/[^\\r\\n]*\\r?\\n\\s*)*\\{\\r?\\n\\s*qualityName: \'' + qualityName + '\',[\\s\\S]*?\\} as SCPQualityMetadata,';
}

/**
 * Generate regex to remove quality demometer entry from muxonomy.ts qualities array.
 * Quality demometer entries are flat objects (no nested {}), so [^}]* is safe.
 */
function generateDemometerRemovalPattern(qualityName: string): string {
  // Pattern: { name: 'qualityName' ... },
  return '\\n?\\s*\\{[^}]*name: \'' + qualityName + '\'[^}]*\\},?';
}

/**
 * Generate regex to remove quality from conceptQualities object in concept.ts.
 * Matches: "  qualityName," on its own line.
 */
function generateQualitiesObjectRemovalPattern(qualityName: string): string {
  return '\\n\\s*' + qualityName + ',';
}

/**
 * Generate regex to remove from ConceptQualities type definition in concept.ts.
 * Matches: "  qualityName: QualityTypeName;" on its own line.
 */
function generateQualitiesTypeRemovalPattern(qualityName: string, qualityTypeName: string): string {
  return '\\n\\s*' + qualityName + ':\\s*' + qualityTypeName + ';';
}

/**
 * Generate regex to remove type export from concept.ts.
 * Handles both Quality<State> and Quality<State, Payload> forms.
 */
function generateTypeExportRemovalPattern(qualityTypeName: string): string {
  return '\\n?export type ' + qualityTypeName + ' = Quality<[^;]+>;\\n?';
}

/**
 * Generate regex to remove import statement from concept.ts.
 */
function generateImportRemovalPattern(qualityName: string): string {
  return '\\nimport \\{ ' + qualityName + ' \\} from \'[^\']*\';';
}

/**
 * Generate regex to remove export statement from index.ts.
 */
function generateExportRemovalPattern(qualityFileName: string): string {
  var fileNameNoExt = qualityFileName.replace('.ts', '');
  return '\\nexport \\* from \'\\.\/' + fileNameNoExt + '\';';
}

/**
 * Generate regex to remove type definition from types.ts.
 * Handles both Quality<State> and Quality<State, Payload> forms.
 */
function generateTypesRemovalPattern(qualityTypeName: string): string {
  return '\\n?export type ' + qualityTypeName + ' = Quality<[^;]+>;';
}

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is QualityRemovalSpecification {
  var s = spec as QualityRemovalSpecification;
  return !!(
    s.qualityName &&
    s.conceptName &&
    s.location &&
    typeof s.diameter === 'boolean'
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseQualityRemoveStrategy - SCP Strategy Creator (Means 4)
 *
 * Creates a 9-node strategy for quality removal (reverse of Means 1):
 * Node 1: Remove SCP metadata from muxonomy.ts (Means 5 inline - no-op if not found)
 * Node 2: Remove from conceptQualities object in concept.ts
 * Node 3: Remove from ConceptQualities type in concept.ts
 * Node 4: Remove type export from concept.ts
 * Node 5: Remove import from concept.ts
 * Node 6: Remove demometer entry from muxonomy.ts
 * Node 7: Remove export from index.ts
 * Node 8: Remove type definitions from types.ts
 * Node 9: Delete quality file
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.1
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Means 4
 */
export const createStrativerseQualityRemoveStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means4:QualityRemove]';
  console.log(LOG_PREFIX + ' ===============================================================');
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Timestamp: ' + new Date().toISOString());
  console.log(LOG_PREFIX + ' Params received:', JSON.stringify(params, null, 2));

  var specification = params.specification as QualityRemovalSpecification;

  if (!validateSpecification(specification)) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED - Invalid specification');
    console.error(LOG_PREFIX + ' Specification received:', JSON.stringify(specification, null, 2));
    return undefined;
  }

  var qualityName = specification.qualityName;
  var conceptName = specification.conceptName;
  var location = specification.location;
  var diameter = specification.diameter;
  var qualityTypeName = capitalizeFirst(qualityName);

  console.log(LOG_PREFIX + ' Validation passed for quality: ' + qualityName);
  console.log(LOG_PREFIX + ' Specification:', JSON.stringify(specification, null, 2));

  // Get decks
  console.log(LOG_PREFIX + ' Accessing decks via selectStratiDECK...');
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

  // Paths
  var conceptPath = getConceptPath(resolved.projectRoot, conceptName);
  var qualityFileName = generateQualityFileName(qualityName, location, diameter);
  var qualityFilePath = conceptPath + '/qualities/' + qualityFileName;
  var muxonomyFileName = conceptName + '.muxonomy.ts';
  var conceptFileName = conceptName + '.concept.ts';

  console.log(LOG_PREFIX + ' Paths:', JSON.stringify({
    conceptPath: conceptPath,
    qualityFileName: qualityFileName,
    qualityFilePath: qualityFilePath,
    muxonomyFileName: muxonomyFileName,
    conceptFileName: conceptFileName,
  }, null, 2));

  // Generate removal patterns
  var scpMetadataPattern = generateSCPMetadataRemovalPattern(qualityName);
  var demometerPattern = generateDemometerRemovalPattern(qualityName);
  var qualitiesObjectPattern = generateQualitiesObjectRemovalPattern(qualityName);
  var qualitiesTypePattern = generateQualitiesTypeRemovalPattern(qualityName, qualityTypeName);
  var typeExportPattern = generateTypeExportRemovalPattern(qualityTypeName);
  var importPattern = generateImportRemovalPattern(qualityName);
  var exportPattern = generateExportRemovalPattern(qualityFileName);
  var typesPattern = generateTypesRemovalPattern(qualityTypeName);

  console.log(LOG_PREFIX + ' Removal patterns generated for all 9 nodes');

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order: Node 9 first, Node 1 last)
  // ============================================
  console.log(LOG_PREFIX + ' Building strategy nodes (reverse order)...');

  // Node 9: Delete quality file (final node)
  console.log(LOG_PREFIX + ' Creating Node 9: deleteFileNode');
  var deleteFileNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: qualityFilePath,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'quality file ' + qualityFileName + ' deleted.',
      },
    }
  );

  // Node 8: Remove type definitions from types.ts
  console.log(LOG_PREFIX + ' Creating Node 8: removeTypesNode');
  var removeTypesNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: typesPattern,
      replaceWith: '',
      targetDirectory: conceptPath + '/qualities',
      fileGlob: 'types.ts',
      dryRun: false,
    }),
    {
      successNode: deleteFileNode,
      successNotes: {
        preposition: 'then',
        denoter: 'type definitions removed from types.ts;',
      },
    }
  );

  // Node 7: Remove export from index.ts
  console.log(LOG_PREFIX + ' Creating Node 7: removeExportNode');
  var removeExportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: exportPattern,
      replaceWith: '',
      targetDirectory: conceptPath + '/qualities',
      fileGlob: 'index.ts',
      dryRun: false,
    }),
    {
      successNode: removeTypesNode,
      successNotes: {
        preposition: 'then',
        denoter: 'export removed from index.ts;',
      },
    }
  );

  // Node 6: Remove demometer entry from muxonomy.ts
  console.log(LOG_PREFIX + ' Creating Node 6: removeDemometerNode');
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
        denoter: 'demometer removed from muxonomy.ts;',
      },
    }
  );

  // Node 5: Remove import from concept.ts
  console.log(LOG_PREFIX + ' Creating Node 5: removeImportNode');
  var removeImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: importPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: removeDemometerNode,
      successNotes: {
        preposition: 'then',
        denoter: 'import removed from concept.ts;',
      },
    }
  );

  // Node 4: Remove type export from concept.ts
  console.log(LOG_PREFIX + ' Creating Node 4: removeTypeExportNode');
  var removeTypeExportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: typeExportPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: removeImportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'type export removed from concept.ts;',
      },
    }
  );

  // Node 3: Remove from ConceptQualities type definition
  console.log(LOG_PREFIX + ' Creating Node 3: removeQualitiesTypeNode');
  var removeQualitiesTypeNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: qualitiesTypePattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: removeTypeExportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'quality type entry removed from ConceptQualities;',
      },
    }
  );

  // Node 2: Remove from conceptQualities object
  console.log(LOG_PREFIX + ' Creating Node 2: removeQualitiesObjectNode');
  var removeQualitiesObjectNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: qualitiesObjectPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: removeQualitiesTypeNode,
      successNotes: {
        preposition: 'then',
        denoter: 'quality removed from conceptQualities object;',
      },
    }
  );

  // Node 1: Remove SCP metadata from muxonomy.ts (Means 5 inline)
  // No-op if quality has no SCP registration (0 replacements = success)
  console.log(LOG_PREFIX + ' Creating Node 1: removeSCPMetadataNode (Means 5 inline)');
  var removeSCPMetadataNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: scpMetadataPattern,
      replaceWith: '',
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: removeQualitiesObjectNode,
      successNotes: {
        preposition: 'First',
        denoter: 'SCP metadata removal attempted (Means 5 inline);',
      },
    }
  );

  // Create and return the strategy
  console.log(LOG_PREFIX + ' All 9 nodes created, building final strategy...');
  var strategy = createStrategy({
    topic: 'StratiVERSE Quality Remove - ' + qualityName,
    initialNode: removeSCPMetadataNode,
    data: {
      specification: specification,
      qualityFilePath: qualityFilePath,
      qualityFileName: qualityFileName,
      conceptPath: conceptPath,
      initTimestamp: Date.now(),
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED SUCCESSFULLY');
  console.log(LOG_PREFIX + ' Strategy topic: ' + strategy.topic);
  console.log(LOG_PREFIX + ' Node chain: SCP metadata -> qualities object -> qualities type -> type export -> import -> demometer -> export -> types -> delete file');
  console.log(LOG_PREFIX + ' ===============================================================');

  return strategy;
};
