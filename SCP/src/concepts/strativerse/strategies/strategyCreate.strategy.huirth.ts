/**
 * strativerseStrategyCreate Strategy - Strategy Creation SCP Tool (Means 7)
 *
 * Creates a new strategy file with required file modifications:
 * 1. {strategyName}.strategy.{location}.ts - Create strategy file
 * 2. muxonomy.ts - Add demometer entry in demometers.strategies
 *
 * Pattern: Grep-based insertion with fileSystem for file creation
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 1.1
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Recursive Self-Improvement
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
// STRATEGY CREATION SPECIFICATION TYPE
// ============================================

/**
 * StrategyCreationSpecification - Complete specification for strategy creation
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Means 7
 */
export type StrategyCreationSpecification = {
  // Identity
  strategyName: string;
  conceptName: string;

  // Location
  location: 'huirth' | 'client' | 'all';

  // Documentation
  topic: string;
  description: string;
  citations: string[];

  // Content (simplified approach - like qualityFileContent)
  // When provided, bypasses template generation and writes file directly
  strategyFileContent?: string;

  // Template generation fields (used when strategyFileContent not provided)
  // These follow the ActionStrategy pattern
  deckRequirements?: string[];  // e.g., ['grep', 'fileSystem']
  inputSpecType?: string;       // Type name for input specification
  nodeCount?: number;           // Number of nodes in the strategy
};

// ============================================
// CONTENT GENERATORS
// ============================================

/**
 * Generate strategy file name based on location
 */
function generateStrategyFileName(spec: StrategyCreationSpecification): string {
  const parts = [spec.strategyName, 'strategy'];

  if (spec.location !== 'all') {
    parts.push(spec.location);
  }

  return parts.join('.') + '.ts';
}

/**
 * Generate default strategy file content template
 * Used when strategyFileContent is not provided
 */
function generateDefaultStrategyTemplate(spec: StrategyCreationSpecification): string {
  const capitalizedConcept = capitalizeFirst(spec.conceptName);
  const creatorFunctionName = `create${capitalizedConcept}${capitalizeFirst(spec.strategyName)}Strategy`;

  return `/**
 * ${spec.strategyName} Strategy - ${spec.description}
 *
 * ${spec.citations.map(c => `Citation: ${c}`).join('\n * ')}
 */
import {
  ActionStrategy,
  Concepts,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { SCPStrategyCreator } from '../../scp/scp.types';

// ============================================
// SPECIFICATION TYPE
// ============================================

// TODO: Define your specification type
export type ${capitalizeFirst(spec.strategyName)}Specification = {
  // Add specification fields
};

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * ${creatorFunctionName} - SCP Strategy Creator
 *
 * ${spec.description}
 *
 * Citation: STRATIMUX-REFERENCE.md "ActionStrategies"
 */
export const ${creatorFunctionName}: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[${spec.strategyName}]';
  console.log(\`\${LOG_PREFIX} ═══════════════════════════════════════════════════════════\`);
  console.log(\`\${LOG_PREFIX} STRATEGY CREATOR ENTERED\`);
  console.log(\`\${LOG_PREFIX} Timestamp: \${new Date().toISOString()}\`);
  console.log(\`\${LOG_PREFIX} Params received:\`, JSON.stringify(params, null, 2));

  // TODO: Implement strategy logic
  // 1. Validate params
  // 2. Access required decks via selectStratiDECK
  // 3. Build node chain (reverse order: final -> initial)
  // 4. Return createStrategy({ topic, initialNode, data })

  console.log(\`\${LOG_PREFIX} ❌ NOT IMPLEMENTED - Replace this template with actual logic\`);
  return undefined;
};
`;
}

/**
 * Generate complete strategy file content
 */
function generateStrategyFileContent(spec: StrategyCreationSpecification): string {
  // If complete file content provided, use it directly
  if (spec.strategyFileContent) {
    return spec.strategyFileContent;
  }

  // Otherwise generate default template
  return generateDefaultStrategyTemplate(spec);
}

/**
 * Generate demometer entry for muxonomy.ts strategies array
 */
function generateStrategyDemometerEntry(spec: StrategyCreationSpecification): string {
  const capitalizedConcept = capitalizeFirst(spec.conceptName);
  const strategyFileName = generateStrategyFileName(spec);
  const demometerName = `${spec.conceptName}${capitalizeFirst(spec.strategyName)}Strategy`;

  return `      {
        name: '${demometerName}',
        filePath: 'strategies/${strategyFileName}',
      },`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// getConceptPath imported from ../model/projectPathResolver.model

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is StrategyCreationSpecification {
  const s = spec as StrategyCreationSpecification;
  return !!(
    s.strategyName &&
    s.conceptName &&
    s.location &&
    s.topic &&
    s.description
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseStrategyCreateStrategy - SCP Strategy Creator (Means 7)
 *
 * Creates a 2-node strategy for strategy file creation:
 * 1. Create strategy file in strategies/
 * 2. Insert demometer entry in muxonomy.ts demometers.strategies
 *
 * Uses FileSystem for file creation and Grep for pattern-based insertion.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 1.1
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Means 7
 */
export const createStrativerseStrategyCreateStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[Means7:StrategyCreate]';
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);
  console.log(`${LOG_PREFIX} STRATEGY CREATOR ENTERED`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
  console.log(`${LOG_PREFIX} Params received:`, JSON.stringify(params, null, 2));

  const specification = params.specification as StrategyCreationSpecification;

  // Validate specification
  if (!validateSpecification(specification)) {
    console.error(`${LOG_PREFIX} ❌ VALIDATION FAILED - Invalid specification`);
    console.error(`${LOG_PREFIX} Specification received:`, JSON.stringify(specification, null, 2));
    return undefined;
  }

  console.log(`${LOG_PREFIX} ✅ Validation passed for strategy:`, specification.strategyName);
  console.log(`${LOG_PREFIX} Specification details:`, {
    strategyName: specification.strategyName,
    conceptName: specification.conceptName,
    location: specification.location,
    topic: specification.topic,
  });

  // Get decks
  console.log(`${LOG_PREFIX} Accessing decks via selectStratiDECK...`);
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');

  if (!grepDeck) {
    console.error(`${LOG_PREFIX} ❌ DECK ACCESS FAILED - grep deck not found`);
    return undefined;
  }
  if (!fileSystemDeck) {
    console.error(`${LOG_PREFIX} ❌ DECK ACCESS FAILED - fileSystem deck not found`);
    return undefined;
  }
  console.log(`${LOG_PREFIX} ✅ Both decks acquired (grep, fileSystem)`);

  // Project resolution
  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');
  const projectName = params.projectName as string | undefined;
  const projectPath = params.projectPath as string | undefined;
  const strativerseState = strativerseDeck?.k.getState(concepts_) as StrativerseState | undefined;
  const managedProjects = strativerseState?.managedProjects || [];
  const resolved = resolveProjectRoot(projectName, projectPath, managedProjects);
  if (!resolved) {
    console.error(`${LOG_PREFIX} ❌ PROJECT RESOLUTION FAILED - project '${projectName}' not found in managed projects`);
    return undefined;
  }
  console.log(`${LOG_PREFIX} Project resolved:`, { projectRoot: resolved.projectRoot, isAdminSCP: resolved.isAdminSCP });

  // Paths
  const conceptPath = getConceptPath(resolved.projectRoot, specification.conceptName);
  const strategyFileName = generateStrategyFileName(specification);
  const strategyFilePath = `${conceptPath}/strategies/${strategyFileName}`;

  console.log(`${LOG_PREFIX} Paths computed:`, {
    conceptPath,
    strategyFileName,
    strategyFilePath,
  });

  // Generated content
  console.log(`${LOG_PREFIX} Generating content...`);
  const strategyFileContent = generateStrategyFileContent(specification);
  const demometerEntry = generateStrategyDemometerEntry(specification);

  console.log(`${LOG_PREFIX} Content generated:`, {
    strategyFileContentLength: strategyFileContent.length,
    demometerEntryLength: demometerEntry.length,
  });

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================
  console.log(`${LOG_PREFIX} Building strategy nodes (reverse order)...`);

  // Node 2: Insert demometer entry in muxonomy.ts (final node)
  console.log(`${LOG_PREFIX} Creating Node 2: muxonomyInsertNode`);
  const muxonomyInsertNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(strategies: \\[)',
      replaceWith: `$1\n${demometerEntry}`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.conceptName}.muxonomy.ts`,
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'demometer entry added to muxonomy strategies;',
      },
    }
  );

  // Node 1: Create strategy file (initial node)
  console.log(`${LOG_PREFIX} Creating Node 1: createFileNode (initial node)`);
  const createFileNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: strategyFilePath,
      content: strategyFileContent,
    }),
    {
      successNode: muxonomyInsertNode,
      successNotes: {
        preposition: 'First',
        denoter: `strategy file ${strategyFileName} created;`,
      },
    }
  );

  // Create and return the strategy
  console.log(`${LOG_PREFIX} All nodes created, building final strategy...`);
  const strategy = createStrategy({
    topic: `StratiVERSE Strategy Create - ${specification.strategyName}`,
    initialNode: createFileNode,
    data: {
      specification,
      strategyFilePath,
      strategyFileName,
      conceptPath,
      initTimestamp: Date.now(),
    },
  });

  console.log(`${LOG_PREFIX} ✅ STRATEGY CREATED SUCCESSFULLY`);
  console.log(`${LOG_PREFIX} Strategy topic: ${strategy.topic}`);
  console.log(`${LOG_PREFIX} Strategy data keys:`, Object.keys(strategy.data || {}));
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);

  return strategy;
};
