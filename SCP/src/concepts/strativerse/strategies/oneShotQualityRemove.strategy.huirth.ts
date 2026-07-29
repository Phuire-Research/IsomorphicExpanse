/**
 * strativerseOneShotQualityRemove Strategy - OneShot Quality + SCP Removal Tool (Means 6)
 *
 * Reverse of Means 3 (OneShot Quality+SCP). Removes quality AND SCP registration
 * in a single unified strategy:
 * 1. Remove SCP metadata from muxonomy.ts (Means 5 inline)
 * 2. Remove from conceptQualities object in concept.ts
 * 3. Remove from ConceptQualities type in concept.ts
 * 4. Remove type export from concept.ts
 * 5. Remove import from concept.ts
 * 6. Remove demometer entry from muxonomy.ts
 * 7. Remove export from index.ts
 * 8. Remove type definitions from types.ts
 * 9. Delete quality file
 *
 * Composition: Means 4 (Quality Remove) + Means 5 (SCP Unregister) unified.
 * Input mirrors Means 3 spec structure (quality + scp fields).
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.2
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Means 6
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
// ONESHOT REMOVAL SPECIFICATION TYPE
// ============================================

/**
 * OneShotRemovalSpecification - Mirrors Means 3 OneShotQualitySCPSpecification
 *
 * Requires both quality and SCP fields to explicitly document
 * what is being removed. Reverse of Means 3 creation spec.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.2
 */
export type OneShotRemovalSpecification = {
  quality: {
    qualityName: string;
    conceptName: string;
    location: 'huirth' | 'client' | 'all';
    diameter: boolean;
  };
  scp: {
    toolName: string;
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// getConceptPath imported from ../model/projectPathResolver.model

function generateQualityFileName(qualityName: string, location: string, diameter: boolean): string {
  var parts = [qualityName, 'quality'];
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
 * Uses [\\s\\S]*? (non-greedy any-including-newlines) for nested {} in inputSchema.
 */
function generateSCPMetadataRemovalPattern(qualityName: string): string {
  // Uses \\r?\\n for CRLF compatibility (muxonomy.ts may have CRLF line endings)
  return '\\r?\\n?\\s*(?:\\/\\/[^\\r\\n]*\\r?\\n\\s*)*\\{\\r?\\n\\s*qualityName: \'' + qualityName + '\',[\\s\\S]*?\\} as SCPQualityMetadata,';
}

/**
 * Generate regex to remove quality demometer entry from muxonomy.ts qualities array.
 * Quality entries are flat objects (no nested {}), so [^}]* is safe.
 */
function generateDemometerRemovalPattern(qualityName: string): string {
  return '\\n?\\s*\\{[^}]*name: \'' + qualityName + '\'[^}]*\\},?';
}

/**
 * Generate regex to remove quality from conceptQualities object in concept.ts.
 */
function generateQualitiesObjectRemovalPattern(qualityName: string): string {
  return '\\n\\s*' + qualityName + ',';
}

/**
 * Generate regex to remove from ConceptQualities type definition in concept.ts.
 */
function generateQualitiesTypeRemovalPattern(qualityName: string, qualityTypeName: string): string {
  return '\\n\\s*' + qualityName + ':\\s*' + qualityTypeName + ';';
}

/**
 * Generate regex to remove type export from concept.ts.
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
 */
function generateTypesRemovalPattern(qualityTypeName: string): string {
  return '\\n?export type ' + qualityTypeName + ' = Quality<[^;]+>;';
}

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is OneShotRemovalSpecification {
  var s = spec as OneShotRemovalSpecification;
  if (!s.quality) {
    console.error('[Means6] Missing quality object');
    return false;
  }
  if (!s.quality.qualityName) {
    console.error('[Means6] Missing quality.qualityName');
    return false;
  }
  if (!s.quality.conceptName) {
    console.error('[Means6] Missing quality.conceptName');
    return false;
  }
  if (!s.quality.location) {
    console.error('[Means6] Missing quality.location');
    return false;
  }
  if (typeof s.quality.diameter !== 'boolean') {
    console.error('[Means6] Missing quality.diameter');
    return false;
  }
  if (!s.scp) {
    console.error('[Means6] Missing scp object');
    return false;
  }
  if (!s.scp.toolName) {
    console.error('[Means6] Missing scp.toolName');
    return false;
  }
  return true;
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseOneShotQualityRemoveStrategy - SCP Strategy Creator (Means 6)
 *
 * Creates a 9-node strategy for unified quality + SCP removal (reverse of Means 3):
 * Node 1: Remove SCP metadata from muxonomy.ts (Means 5 inline)
 * Node 2: Remove from conceptQualities object in concept.ts
 * Node 3: Remove from ConceptQualities type in concept.ts
 * Node 4: Remove type export from concept.ts
 * Node 5: Remove import from concept.ts
 * Node 6: Remove demometer entry from muxonomy.ts
 * Node 7: Remove export from index.ts
 * Node 8: Remove type definitions from types.ts
 * Node 9: Delete quality file
 *
 * Composition: Means 4 (Quality Remove) + Means 5 (SCP Unregister) unified.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 2.2
 */
export const createStrativerseOneShotQualityRemoveStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means6:OneShotRemove]';
  console.log(LOG_PREFIX + ' ===============================================================');
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Timestamp: ' + new Date().toISOString());
  console.log(LOG_PREFIX + ' Params received:', JSON.stringify(params, null, 2));

  var specification = params.specification as OneShotRemovalSpecification;

  if (!validateSpecification(specification)) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED - Invalid specification');
    console.error(LOG_PREFIX + ' Specification received:', JSON.stringify(specification, null, 2));
    return undefined;
  }

  var quality = specification.quality;
  var scp = specification.scp;
  var qualityName = quality.qualityName;
  var conceptName = quality.conceptName;
  var location = quality.location;
  var diameter = quality.diameter;
  var qualityTypeName = capitalizeFirst(qualityName);

  console.log(LOG_PREFIX + ' Validation passed');
  console.log(LOG_PREFIX + ' Quality: ' + qualityName);
  console.log(LOG_PREFIX + ' SCP Tool: ' + scp.toolName);

  // Get decks
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
        denoter: 'SCP metadata removed for tool ' + scp.toolName + ' (Means 5 inline);',
      },
    }
  );

  // Create and return the strategy
  console.log(LOG_PREFIX + ' All 9 nodes created, building final strategy...');
  var strategy = createStrategy({
    topic: 'StratiVERSE OneShot Remove - ' + qualityName + ' (' + scp.toolName + ')',
    initialNode: removeSCPMetadataNode,
    data: {
      specification: specification,
      qualityFilePath: qualityFilePath,
      qualityFileName: qualityFileName,
      conceptPath: conceptPath,
      toolName: scp.toolName,
      initTimestamp: Date.now(),
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED SUCCESSFULLY');
  console.log(LOG_PREFIX + ' Strategy topic: ' + strategy.topic);
  console.log(LOG_PREFIX + ' ===============================================================');

  return strategy;
};
