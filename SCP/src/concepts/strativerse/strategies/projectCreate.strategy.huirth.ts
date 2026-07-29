/**
 * projectCreate Strategy - Create New Project from SCP Template (Means 10)
 *
 * 10-node chain:
 * 1. fileSystemCopyMoveTargetDirectory - Copy template to targetPath
 * 2. fileSystemRemoveTargetDirectory - Remove node_modules from copy
 * 3. fileSystemRemoveTargetDirectory - Remove dist from copy
 * 4. fileSystemRemoveTargetDirectory - Remove .git from copy
 * 5. fileSystemRemoveTargetDirectory - Remove package-lock.json from copy
 * 6. grepReplaceInFiles - Update package.json name
 * 7. grepReplaceInFiles - Update port in index.ts
 * 8. grepReplaceInFiles - Update muxium name in index.ts
 * 9. strativerseAddManagedProject - Add ProjectEntry to state
 * 10. strativerseWriteManagedProjectsFile - Persist to .managed-projects.json
 *
 * SCP Tool: strativerse_project_create
 * Tool Type: actionable
 *
 * Citation: BREAKOUT-POC4-PHASE3-MVP-CONCEPT-LIBRARY-MANAGEMENT.md
 * Citation: POC-4-STRATIVERSE-PROJECT-MANAGEMENT-WORKGAMEBOARD.md - Suite 2.4
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
import type { StrativerseConcept } from '../strativerse.concept';
import type { SCPStrategyCreator } from '../../scp/scp.types';
import type { ProjectEntry } from '../strativerse.type';
import path from 'path';

// ============================================
// SPECIFICATION TYPE
// ============================================

export type ProjectCreateSpecification = {
  projectName: string;
  targetPath: string;
  port: number;
  templatePath?: string;
};

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is ProjectCreateSpecification {
  const s = spec as ProjectCreateSpecification;
  return !!(
    s &&
    s.projectName &&
    typeof s.projectName === 'string' &&
    s.targetPath &&
    typeof s.targetPath === 'string' &&
    s.port &&
    typeof s.port === 'number' &&
    s.port > 0 &&
    s.port < 65536
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseProjectCreateStrategy - SCP Strategy Creator (Means 10)
 *
 * Creates a 10-node strategy for project creation from SCP Template:
 * 1. Copy template directory to targetPath
 * 2-5. Remove excluded directories (node_modules, dist, .git, package-lock.json)
 * 6. Update package.json name
 * 7. Update port in index.ts
 * 8. Update muxium name in index.ts
 * 9. Add ProjectEntry to StratiVERSE managed projects state
 * 10. Persist managed projects to .managed-projects.json
 *
 * Citation: BREAKOUT-POC4-PHASE3-MVP-CONCEPT-LIBRARY-MANAGEMENT.md
 * Citation: STRATIMUX-REFERENCE.md "ActionStrategies"
 */
export const createStrativerseProjectCreateStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  var LOG_PREFIX = '[Means10:ProjectCreate]';
  console.log(LOG_PREFIX + ' STRATEGY CREATOR ENTERED');
  console.log(LOG_PREFIX + ' Params:', JSON.stringify(params, null, 2));

  var specification = params.specification as ProjectCreateSpecification;

  if (!validateSpecification(specification)) {
    console.error(LOG_PREFIX + ' VALIDATION FAILED');
    console.error(LOG_PREFIX + ' Specification:', JSON.stringify(specification, null, 2));
    return undefined;
  }

  var projectName = specification.projectName;
  var targetPath = specification.targetPath;
  var port = specification.port;

  console.log(LOG_PREFIX + ' Validated: ' + projectName + ' -> ' + targetPath + ':' + String(port));

  // Get decks
  console.log(LOG_PREFIX + ' Accessing decks...');
  var fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  var grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  var strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!fileSystemDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - fileSystem');
    return undefined;
  }
  if (!grepDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - grep');
    return undefined;
  }
  if (!strativerseDeck) {
    console.error(LOG_PREFIX + ' DECK ACCESS FAILED - strativerse');
    return undefined;
  }
  console.log(LOG_PREFIX + ' All decks acquired (fileSystem, grep, strativerse)');

  // Template path resolution
  var templatePath = specification.templatePath
    ? specification.templatePath
    : path.resolve(process.cwd(), '..', 'SCP');

  console.log(LOG_PREFIX + ' Template path: ' + templatePath);
  console.log(LOG_PREFIX + ' Target path: ' + targetPath);

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================
  console.log(LOG_PREFIX + ' Building 10-node chain...');

  // Node 10 (Final): Persist managed projects to .managed-projects.json
  var writeManagedProjectsFileNode = createActionNode(
    strativerseDeck.e.strativerseWriteManagedProjectsFile({}),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'managed projects persisted to .managed-projects.json.',
      },
    }
  );

  // Node 9: Add ProjectEntry to state
  var now = Date.now();
  var addProjectNode = createActionNode(
    strativerseDeck.e.strativerseAddManagedProject({
      name: projectName,
      path: targetPath,
      templateVersion: '0.1.0',
      exists: true,
      port: port,
      concepts: ['huirth', 'scp', 'vue'],
      conceptEntries: [],
      hasMuxonomy: false,
      registeredTools: [],
      registeredNavigation: [],
      createdAt: now,
      lastScanned: 0,
      lastModified: now,
      status: 'active',
      conceptSyncMetadata: {},
    } as ProjectEntry),
    {
      successNode: writeManagedProjectsFileNode,
      successNotes: {
        preposition: 'then',
        denoter: 'ProjectEntry added to managedProjects state;',
      },
    }
  );

  // Node 8: Update muxium name in index.ts
  var updateMuxiumNameNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: 'SCP Template Server',
      replaceWith: projectName + ' Server',
      targetDirectory: path.join(targetPath, 'src'),
      fileGlob: 'index.ts',
      dryRun: false,
    }),
    {
      successNode: addProjectNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Muxium name updated in index.ts;',
      },
    }
  );

  // Node 7: Update port in index.ts
  var updatePortNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "'7637'",
      replaceWith: "'" + String(port) + "'",
      targetDirectory: path.join(targetPath, 'src'),
      fileGlob: 'index.ts',
      dryRun: false,
    }),
    {
      successNode: updateMuxiumNameNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Port updated in index.ts;',
      },
    }
  );

  // Node 6: Update package.json name
  var updatePackageNameNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '"huirth-scp-template"',
      replaceWith: '"' + projectName + '"',
      targetDirectory: targetPath,
      fileGlob: 'package.json',
      dryRun: false,
    }),
    {
      successNode: updatePortNode,
      successNotes: {
        preposition: 'then',
        denoter: 'Package name updated in package.json;',
      },
    }
  );

  // Node 5: Remove package-lock.json from copy
  var removePackageLockNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: path.join(targetPath, 'package-lock.json'),
    }),
    {
      successNode: updatePackageNameNode,
      successNotes: {
        preposition: 'then',
        denoter: 'package-lock.json removed;',
      },
    }
  );

  // Node 4: Remove .git from copy
  var removeGitNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: path.join(targetPath, '.git'),
    }),
    {
      successNode: removePackageLockNode,
      successNotes: {
        preposition: 'then',
        denoter: '.git directory removed;',
      },
    }
  );

  // Node 3: Remove dist from copy
  var removeDistNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: path.join(targetPath, 'dist'),
    }),
    {
      successNode: removeGitNode,
      successNotes: {
        preposition: 'then',
        denoter: 'dist directory removed;',
      },
    }
  );

  // Node 2: Remove node_modules from copy
  var removeNodeModulesNode = createActionNode(
    fileSystemDeck.e.fileSystemRemoveTargetDirectory({
      path: path.join(targetPath, 'node_modules'),
    }),
    {
      successNode: removeDistNode,
      successNotes: {
        preposition: 'then',
        denoter: 'node_modules directory removed;',
      },
    }
  );

  // Node 1 (Initial): Copy template to target path
  var copyTemplateNode = createActionNode(
    fileSystemDeck.e.fileSystemCopyMoveTargetDirectory({
      path: templatePath,
      newLocation: targetPath,
    }),
    {
      successNode: removeNodeModulesNode,
      successNotes: {
        preposition: 'First',
        denoter: 'Template copied to ' + targetPath + ';',
      },
    }
  );

  // Create and return strategy
  var strategy = createStrategy({
    topic: 'StratiVERSE Project Create - ' + projectName,
    initialNode: copyTemplateNode,
    data: {
      specification: specification,
      templatePath: templatePath,
      targetPath: targetPath,
      projectName: projectName,
      port: port,
      initTimestamp: now,
    },
  });

  console.log(LOG_PREFIX + ' STRATEGY CREATED: ' + strategy.topic);
  console.log(LOG_PREFIX + ' Node chain: copy -> rmNodeModules -> rmDist -> rmGit -> rmPkgLock -> updateName -> updatePort -> updateMuxium -> addProject -> writeManagedProjectsFile');
  return strategy;
};
