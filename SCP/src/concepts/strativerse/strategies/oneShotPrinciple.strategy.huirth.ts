/**
 * oneShotPrinciple Strategy - Means 10 Actionable
 *
 * Creates a principle file and all hookups in a single SCP tool call:
 * 1. Create principle file in principles/ directory
 * 2. Add import statement to concept.ts
 * 3. Add to principles[] array in createConcept
 * 4. Add demometer entry to muxonomy.ts
 *
 * Citation: Crystraline 6 Diamond Plan - Means 10
 * Citation: POC-4-STRATIVERSE-PROJECT-MANAGEMENT-WORKGAMEBOARD.md
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

export type PrincipleCreationSpecification = {
  principleName: string;
  principleFileContent: string;
  conceptName: string;
  location: 'huirth' | 'client' | 'all';
  description: string;
  citations?: string[];
};

// ============================================
// VALIDATION
// ============================================

type ValidationResult = { valid: true } | { valid: false; reason: string };

function validateSpecification(spec: unknown): ValidationResult {
  var s = spec as PrincipleCreationSpecification;

  if (!s.principleName) {
    return { valid: false, reason: 'Missing principleName' };
  }
  if (!s.principleFileContent) {
    return { valid: false, reason: 'Missing principleFileContent' };
  }
  if (!s.conceptName) {
    return { valid: false, reason: 'Missing conceptName' };
  }
  if (!s.location) {
    return { valid: false, reason: 'Missing location' };
  }
  if (!s.description) {
    return { valid: false, reason: 'Missing description' };
  }
  return { valid: true };
}

// ============================================
// CONTENT GENERATORS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generatePrincipleFileName(spec: PrincipleCreationSpecification): string {
  var locationSuffix = spec.location === 'huirth' ? '.huirth'
    : spec.location === 'client' ? '.client'
    : '';
  return spec.principleName + '.principle' + locationSuffix + '.ts';
}

function generateConceptImport(spec: PrincipleCreationSpecification): string {
  var fileName = generatePrincipleFileName(spec).replace('.ts', '');
  return 'import { ' + spec.principleName + " } from './principles/" + fileName + "';";
}

function generateDemometerEntry(spec: PrincipleCreationSpecification): string {
  var location = spec.location === 'huirth' ? 'DeploymentTarget.Huirth'
    : spec.location === 'client' ? 'DeploymentTarget.Client'
    : 'DeploymentTarget.All';

  return '      {\n' +
    "        name: '" + spec.principleName + "',\n" +
    "        filePath: 'principles/" + generatePrincipleFileName(spec) + "',\n" +
    '        location: ' + location + ',\n' +
    '      },';
}

// ============================================
// STRATEGY CREATOR
// ============================================

export const createStrativerseOneShotPrincipleStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means10:OneShotPrinciple]';
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Timestamp: ' + new Date().toISOString());

  var specification = params.specification as PrincipleCreationSpecification;

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
  var principleFileName = generatePrincipleFileName(specification);
  var principleFilePath = conceptPath + '/principles/' + principleFileName;
  var muxonomyFileName = specification.conceptName + '.muxonomy.ts';
  var conceptFileName = specification.conceptName + '.concept.ts';

  // Generated content
  var conceptImport = generateConceptImport(specification);
  var demometerEntry = generateDemometerEntry(specification);

  console.log(LOG_PREFIX + ' Building 4-node chain...');

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================

  // Node 4 (Final): Add demometer entry to muxonomy.ts
  var demometerNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(principles: \\[)',
      replaceWith: '$1\n' + demometerEntry,
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'demometer entry added to muxonomy.',
      },
    }
  );

  // Node 3: Add principle to principles[] array in createConcept
  var principleArrayNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(\\[[^\\]]*Principle[^\\]]*)(\\],)',
      replaceWith: '$1, ' + specification.principleName + '$2',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: demometerNode,
      successNotes: {
        preposition: 'then',
        denoter: 'principle added to principles array;',
      },
    }
  );

  // Node 2: Add import statement to concept.ts
  var importNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(// Principles\\n(?:import [^\\n]+\\n)*)',
      replaceWith: '$1' + conceptImport + '\n',
      targetDirectory: conceptPath,
      fileGlob: conceptFileName,
      dryRun: false,
    }),
    {
      successNode: principleArrayNode,
      successNotes: {
        preposition: 'then',
        denoter: 'import statement added;',
      },
    }
  );

  // Node 1 (Initial): Create principle file
  var createFileNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: principleFilePath,
      content: specification.principleFileContent,
    }),
    {
      successNode: importNode,
      successNotes: {
        preposition: 'First',
        denoter: 'principle file ' + principleFileName + ' created;',
      },
    }
  );

  // Create strategy
  var strategy = createStrategy({
    topic: 'StratiVERSE OneShot Principle - ' + specification.principleName,
    initialNode: createFileNode,
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
