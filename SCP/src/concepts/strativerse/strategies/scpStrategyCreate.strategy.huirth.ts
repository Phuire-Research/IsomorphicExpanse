/**
 * strativerseSCPStrategyCreate Strategy - SCP Strategy Creation Tool (Means 8)
 *
 * Creates a new strategy file AND registers it as an SCP tool:
 * 1. {strategyName}.strategy.{location}.ts - Create strategy file
 * 2. muxonomy.ts - Add demometer entry in demometers.strategies
 * 3. muxonomy.ts - Add strategyCreator import statement
 * 4. muxonomy.ts - Add scpToolMetadata entry
 *
 * Composition: Means 7 (Strategy Create) + Means 2 (SCP Register)
 *
 * CRITICAL: Ensures SCPStrategyCreator params align with inputSchema
 * The strategyCreator function receives typed params matching inputSchema.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 1.2
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - SCP Strategy Type Alignment
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
// SCP STRATEGY CREATION SPECIFICATION TYPE
// ============================================

/**
 * SCPStrategyCreationSpecification - Complete specification for SCP strategy creation
 *
 * Combines strategy creation with SCP tool registration.
 * Ensures type alignment between strategyCreator params and inputSchema.
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Means 8
 */
export type SCPStrategyCreationSpecification = {
  // Strategy Identity (Means 7 fields)
  strategy: {
    strategyName: string;
    conceptName: string;
    location: 'huirth' | 'client' | 'all';
    topic: string;
    description: string;
    citations: string[];
    strategyFileContent?: string;  // Complete file as code block
  };

  // SCP Registration (Means 2 fields)
  scp: {
    toolName: string;
    description: string;
    inputSchema: Record<string, unknown>;  // JSON Schema
    toolType: 'informative' | 'actionable';
    relatedActionables: string[];
  };

  // Type Alignment (Means 8 enhancement)
  // Ensures strategyCreator params match inputSchema
  paramsTypeName?: string;  // TypeScript type name for params (optional documentation)
};

// ============================================
// CONTENT GENERATORS
// ============================================

/**
 * Generate strategy file name based on location
 */
function generateStrategyFileName(strategyName: string, location: string): string {
  const parts = [strategyName, 'strategy'];

  if (location !== 'all') {
    parts.push(location);
  }

  return parts.join('.') + '.ts';
}

/**
 * Generate strategy creator function name
 */
function generateStrategyCreatorName(conceptName: string, strategyName: string): string {
  return `create${capitalizeFirst(conceptName)}${capitalizeFirst(strategyName)}Strategy`;
}

/**
 * Generate demometer entry for muxonomy.ts strategies array
 */
function generateStrategyDemometerEntry(conceptName: string, strategyName: string, location: string): string {
  const strategyFileName = generateStrategyFileName(strategyName, location);
  const demometerName = `${conceptName}${capitalizeFirst(strategyName)}Strategy`;

  return `      {
        name: '${demometerName}',
        filePath: 'strategies/${strategyFileName}',
      },`;
}

/**
 * Generate import statement for strategyCreator
 */
function generateStrategyCreatorImport(conceptName: string, strategyName: string, location: string): string {
  const creatorName = generateStrategyCreatorName(conceptName, strategyName);
  const fileName = generateStrategyFileName(strategyName, location).replace('.ts', '');
  return `import { ${creatorName} } from './strategies/${fileName}';`;
}

/**
 * Generate scpToolMetadata entry
 */
function generateSCPMetadataEntry(spec: SCPStrategyCreationSpecification): string {
  const { strategy, scp } = spec;
  const qualityName = `${strategy.conceptName}${capitalizeFirst(strategy.strategyName)}`;
  const strategyCreatorName = generateStrategyCreatorName(strategy.conceptName, strategy.strategyName);
  const strategyDemometerName = `${strategy.conceptName}${capitalizeFirst(strategy.strategyName)}Strategy`;

  const inputSchemaStr = JSON.stringify(scp.inputSchema, null, 6)
    .split('\n')
    .map((line, i) => i === 0 ? line : '      ' + line)
    .join('\n');

  const relatedActionablesStr = scp.relatedActionables.length > 0
    ? `[${scp.relatedActionables.map(a => `'${a}'`).join(', ')}]`
    : '[]';

  return `    // SCP Strategy: ${scp.toolName} (Means 8 Generated)
    // Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md
    {
      qualityName: '${qualityName}',
      toolName: '${scp.toolName}',
      description: '${scp.description.replace(/'/g, "\\'")}',
      inputSchema: ${inputSchemaStr},
      toolType: '${scp.toolType}',
      handlerType: 'strategy',
      strategyName: '${strategyDemometerName}',
      strategyCreator: ${strategyCreatorName},
      relatedActionables: ${relatedActionablesStr},
    } as SCPQualityMetadata,`;
}

/**
 * Generate default strategy file content template for SCP strategy
 */
function generateDefaultSCPStrategyTemplate(spec: SCPStrategyCreationSpecification): string {
  const { strategy, scp } = spec;
  const creatorFunctionName = generateStrategyCreatorName(strategy.conceptName, strategy.strategyName);

  return `/**
 * ${strategy.strategyName} Strategy - ${strategy.description}
 *
 * SCP Tool: ${scp.toolName}
 * Tool Type: ${scp.toolType}
 *
 * ${strategy.citations.map(c => `Citation: ${c}`).join('\n * ')}
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

// TODO: Define your specification type matching inputSchema
export type ${capitalizeFirst(strategy.strategyName)}Specification = {
  // Add specification fields matching inputSchema
};

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is ${capitalizeFirst(strategy.strategyName)}Specification {
  // TODO: Implement validation matching inputSchema
  return true;
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * ${creatorFunctionName} - SCP Strategy Creator
 *
 * ${strategy.description}
 *
 * CRITICAL: params must match inputSchema structure
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Type Alignment
 */
export const ${creatorFunctionName}: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[${strategy.strategyName}]';
  console.log(\`\${LOG_PREFIX} ═══════════════════════════════════════════════════════════\`);
  console.log(\`\${LOG_PREFIX} STRATEGY CREATOR ENTERED\`);
  console.log(\`\${LOG_PREFIX} Timestamp: \${new Date().toISOString()}\`);
  console.log(\`\${LOG_PREFIX} Params received:\`, JSON.stringify(params, null, 2));

  const specification = params.specification as ${capitalizeFirst(strategy.strategyName)}Specification;

  // Validate specification
  if (!validateSpecification(specification)) {
    console.error(\`\${LOG_PREFIX} ❌ VALIDATION FAILED - Invalid specification\`);
    return undefined;
  }

  console.log(\`\${LOG_PREFIX} ✅ Validation passed\`);

  // TODO: Implement strategy logic
  // 1. Access required decks via selectStratiDECK
  // 2. Build node chain (reverse order: final -> initial)
  // 3. Return createStrategy({ topic, initialNode, data })

  console.log(\`\${LOG_PREFIX} ❌ NOT IMPLEMENTED - Replace this template with actual logic\`);
  return undefined;
};
`;
}

/**
 * Generate complete strategy file content
 */
function generateStrategyFileContent(spec: SCPStrategyCreationSpecification): string {
  // If complete file content provided, use it directly
  if (spec.strategy.strategyFileContent) {
    return spec.strategy.strategyFileContent;
  }

  // Otherwise generate default SCP strategy template
  return generateDefaultSCPStrategyTemplate(spec);
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

function validateSpecification(spec: unknown): spec is SCPStrategyCreationSpecification {
  const s = spec as SCPStrategyCreationSpecification;
  return !!(
    s.strategy &&
    s.strategy.strategyName &&
    s.strategy.conceptName &&
    s.strategy.location &&
    s.strategy.topic &&
    s.strategy.description &&
    s.scp &&
    s.scp.toolName &&
    s.scp.description &&
    s.scp.inputSchema &&
    s.scp.toolType
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseSCPStrategyCreateStrategy - SCP Strategy Creator (Means 8)
 *
 * Creates a 4-node strategy for SCP strategy creation:
 * 1. Create strategy file in strategies/
 * 2. Insert demometer entry in muxonomy.ts demometers.strategies
 * 3. Insert strategyCreator import in muxonomy.ts
 * 4. Insert scpToolMetadata entry in muxonomy.ts
 *
 * Composition: Means 7 (Strategy Create) + Means 2 (SCP Register)
 *
 * Citation: SCP-MANAGEMENT-MANIFOLD-WORKGAMEBOARD.md - Phase 1.2
 * Citation: FORWARD-PASS-QUALITY-FILE-CONTENT-MANIFOLD.md - Means 8
 */
export const createStrativerseSCPStrategyCreateStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[Means8:SCPStrategyCreate]';
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);
  console.log(`${LOG_PREFIX} STRATEGY CREATOR ENTERED`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
  console.log(`${LOG_PREFIX} Params received:`, JSON.stringify(params, null, 2));

  const specification = params.specification as SCPStrategyCreationSpecification;

  // Validate specification
  if (!validateSpecification(specification)) {
    console.error(`${LOG_PREFIX} ❌ VALIDATION FAILED - Invalid specification`);
    console.error(`${LOG_PREFIX} Specification received:`, JSON.stringify(specification, null, 2));
    return undefined;
  }

  const { strategy, scp } = specification;

  console.log(`${LOG_PREFIX} ✅ Validation passed for strategy:`, strategy.strategyName);
  console.log(`${LOG_PREFIX} SCP tool:`, scp.toolName);

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
  const conceptPath = getConceptPath(resolved.projectRoot, strategy.conceptName);
  const strategyFileName = generateStrategyFileName(strategy.strategyName, strategy.location);
  const strategyFilePath = `${conceptPath}/strategies/${strategyFileName}`;
  const muxonomyFileName = `${strategy.conceptName}.muxonomy.ts`;

  console.log(`${LOG_PREFIX} Paths computed:`, {
    conceptPath,
    strategyFileName,
    strategyFilePath,
    muxonomyFileName,
  });

  // Generated content
  console.log(`${LOG_PREFIX} Generating content...`);
  const strategyFileContent = generateStrategyFileContent(specification);
  const demometerEntry = generateStrategyDemometerEntry(strategy.conceptName, strategy.strategyName, strategy.location);
  const importStatement = generateStrategyCreatorImport(strategy.conceptName, strategy.strategyName, strategy.location);
  const scpMetadataEntry = generateSCPMetadataEntry(specification);

  console.log(`${LOG_PREFIX} Content generated:`, {
    strategyFileContentLength: strategyFileContent.length,
    demometerEntryLength: demometerEntry.length,
    importStatementLength: importStatement.length,
    scpMetadataEntryLength: scpMetadataEntry.length,
  });

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================
  console.log(`${LOG_PREFIX} Building strategy nodes (reverse order)...`);

  // Node 4: Insert scpToolMetadata entry (final node)
  console.log(`${LOG_PREFIX} Creating Node 4: scpMetadataNode`);
  const scpMetadataNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(scpToolMetadata: \\[)',
      replaceWith: `$1\n${scpMetadataEntry}`,
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: `scpToolMetadata entry added for ${scp.toolName}.`,
      },
    }
  );

  // Node 3: Insert strategyCreator import
  console.log(`${LOG_PREFIX} Creating Node 3: importNode`);
  const importNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "(import type { SCPQualityMetadata }[^;]*;)",
      replaceWith: `${importStatement}\n$1`,
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: scpMetadataNode,
      successNotes: {
        preposition: 'then',
        denoter: `strategyCreator import added;`,
      },
    }
  );

  // Node 2: Insert demometer entry in muxonomy.ts
  console.log(`${LOG_PREFIX} Creating Node 2: muxonomyInsertNode`);
  const muxonomyInsertNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(strategies: \\[)',
      replaceWith: `$1\n${demometerEntry}`,
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNode: importNode,
      successNotes: {
        preposition: 'then',
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
  const strategyResult = createStrategy({
    topic: `StratiVERSE SCP Strategy Create - ${scp.toolName}`,
    initialNode: createFileNode,
    data: {
      specification,
      strategyFilePath,
      strategyFileName,
      conceptPath,
      importStatement,
      initTimestamp: Date.now(),
    },
  });

  console.log(`${LOG_PREFIX} ✅ STRATEGY CREATED SUCCESSFULLY`);
  console.log(`${LOG_PREFIX} Strategy topic: ${strategyResult.topic}`);
  console.log(`${LOG_PREFIX} Strategy data keys:`, Object.keys(strategyResult.data || {}));
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);

  return strategyResult;
};
