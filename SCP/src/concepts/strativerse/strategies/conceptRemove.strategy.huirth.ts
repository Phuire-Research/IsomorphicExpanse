/**
 * conceptRemove Strategy - Remove Concept from Managed Project (Means 12)
 *
 * 6-node chain (all always execute, no-op safe):
 * 1. grepReplaceInFiles - Remove island registry entry from IslandWrapper.vue
 * 2. grepReplaceInFiles - Remove REGISTERED_MUXONOMICS entry from vue.principle.ts
 * 3. grepReplaceInFiles - Remove muxonomy import from vue.principle.ts
 * 4. grepReplaceInFiles - Remove muxifyConcepts entry from huirth.concept.ts
 * 5. grepReplaceInFiles - Remove import from huirth.concept.ts
 * 6. fileSystemRemoveTargetDirectory - Delete entire concept directory
 *
 * Removal order is REVERSE of creation (Means 11).
 * All grep nodes are no-op safe (succeed with 0 replacements).
 *
 * SCP Tool: strativerse_concept_remove
 * Tool Type: actionable
 *
 * Citation: SUITE-5-COBALT-POC4-PHASE3-C2-C3-ROADMAP.md
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
import path from 'path';

// ============================================
// SPECIFICATION TYPE
// ============================================

export type ConceptRemoveSpecification = {
  projectPath: string;
  conceptName: string;
};

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is ConceptRemoveSpecification {
  var s = spec as ConceptRemoveSpecification;
  return !!(
    s &&
    s.projectPath &&
    typeof s.projectPath === 'string' &&
    s.conceptName &&
    typeof s.conceptName === 'string'
  );
}

// ============================================
// HELPERS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// STRATEGY CREATOR
// ============================================

export const createStrativerseConceptRemoveStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means12:ConceptRemove]';
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Params:', JSON.stringify(params, null, 2));

  var specification = params.specification as ConceptRemoveSpecification;

  if (!validateSpecification(specification)) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED');
    console.error(LOG_PREFIX + ' Specification:', JSON.stringify(specification, null, 2));
    return undefined;
  }

  var projectPath = specification.projectPath;
  var conceptName = specification.conceptName;
  var pascalName = capitalizeFirst(conceptName);

  console.log(LOG_PREFIX + ' Validated: removing ' + conceptName + ' from ' + projectPath);

  var fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  var grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');

  if (!fileSystemDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - fileSystem');
    return undefined;
  }
  if (!grepDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - grep');
    return undefined;
  }
  console.log(LOG_PREFIX + ' All decks acquired (fileSystem, grep)');

  var conceptDir = path.join(projectPath, 'src', 'concepts', conceptName);

  console.log(LOG_PREFIX + ' Building 6-node chain (reverse of creation)...');

  // Node 6 (Final): Delete entire concept directory
  var deleteConceptDirNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: conceptDir,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: conceptName + '/ directory deleted.',
      },
    }
  );

  // Node 5: Remove import from huirth.concept.ts
  var removeHuirthImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "\nimport { create" + pascalName + "Concept } from '../" + conceptName + "/" + conceptName + ".concept';",
      replaceWith: '',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'huirth'),
      fileGlob: 'huirth.concept.ts',
      dryRun: false,
    }),
    {
      successNode: deleteConceptDirNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Import removed from huirth.concept.ts;',
      },
    }
  );

  // Node 4: Remove muxifyConcepts entry from huirth.concept.ts
  var removeMuxifyNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "\n        create" + pascalName + "Concept\\(\\),",
      replaceWith: '',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'huirth'),
      fileGlob: 'huirth.concept.ts',
      dryRun: false,
    }),
    {
      successNode: removeHuirthImportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'muxifyConcepts entry removed;',
      },
    }
  );

  // Node 3: Remove muxonomy import from vue.principle.ts
  var removeVueImportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "\nimport { " + conceptName + "Muxonomic } from '../" + conceptName + "/" + conceptName + ".muxonomy';",
      replaceWith: '',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'vue'),
      fileGlob: 'vue.principle.ts',
      dryRun: false,
    }),
    {
      successNode: removeMuxifyNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Muxonomy import removed from vue.principle.ts;',
      },
    }
  );

  // Node 2: Remove REGISTERED_MUXONOMICS entry from vue.principle.ts
  var removeRegisteredNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "\n  " + conceptName + "Muxonomic,",
      replaceWith: '',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'vue'),
      fileGlob: 'vue.principle.ts',
      dryRun: false,
    }),
    {
      successNode: removeVueImportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'REGISTERED_MUXONOMICS entry removed;',
      },
    }
  );

  // Node 1 (Initial): Remove island registry entry from IslandWrapper.vue
  var removeIslandNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "\n    " + conceptName + ": \\(\\) => import\\('../" + conceptName + "/vue/" + pascalName + "Landing\\.vue'\\),",
      replaceWith: '',
      targetDirectory: path.join(projectPath, 'src', 'concepts', 'vue'),
      fileGlob: 'IslandWrapper.vue',
      dryRun: false,
    }),
    {
      successNode: removeRegisteredNode,
      successNotes: {
        preposition: 'First',
        denoter: 'Island registry entry removed from IslandWrapper.vue;',
      },
    }
  );

  var strategy = createStrategy({
    topic: 'StratiVERSE Concept Remove - ' + conceptName + ' from ' + projectPath,
    initialNode: removeIslandNode,
    data: {
      specification: specification,
      projectPath: projectPath,
      conceptName: conceptName,
      pascalName: pascalName,
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED: ' + strategy.topic);
  console.log(LOG_PREFIX + ' Node chain: rmIsland -> rmRegistered -> rmVueImport -> rmMuxify -> rmHuirthImport -> rmConceptDir');
  return strategy;
};
