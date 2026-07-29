/**
 * strativerseSCPToolRegister Strategy - SCP Tool Registration
 *
 * Registers a quality as an SCP tool in a concept's muxonomy.
 * Adds scpToolMetadata entry and strategyCreator import (if strategy-based).
 *
 * Pattern: Grep-based insertion for muxonomy modification
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 2.0 Means 2
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies"
 */
import {
  ActionStrategy,
  Concepts,
  createActionNode,
  createStrategy,
  selectStratiDECK,
  strategyData_muxifyData,
} from 'stratimux';
import type { GrepConcept } from '../../grep/grep.type';
import type { SCPStrategyCreator } from '../../scp/scp.types';
import type { StrativerseConcept } from '../strativerse.concept';
import type { StrativerseState } from '../strativerse.type';
import { resolveProjectRoot, getConceptPath } from '../model/projectPathResolver.model';
import path from 'path';

// ============================================
// SCP TOOL REGISTRATION SPECIFICATION TYPE
// ============================================

/**
 * SCPToolRegistrationSpecification - Complete specification for SCP tool registration
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 */
export type SCPToolRegistrationSpecification = {
  // Identity
  qualityName: string;
  toolName: string;
  conceptName: string;

  // Tool Configuration
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  toolType: 'informative' | 'actionable';
  handlerType: 'quality' | 'strategy';
  strategyName: string;

  // Strategy-specific (only if handlerType === 'strategy')
  strategyFilePath?: string;
  strategyCreatorName?: string;

  // Relationships
  relatedActionables: string[];
};

// ============================================
// CONTENT GENERATORS
// ============================================

/**
 * Generate scpToolMetadata entry for muxonomy.ts
 */
function generateSCPMetadataEntry(spec: SCPToolRegistrationSpecification): string {
  const inputSchemaStr = JSON.stringify(spec.inputSchema, null, 6)
    .split('\n')
    .map((line, i) => i === 0 ? line : '      ' + line)
    .join('\n');

  const strategyCreatorLine = spec.handlerType === 'strategy' && spec.strategyCreatorName
    ? `\n      strategyCreator: ${spec.strategyCreatorName},`
    : '';

  const relatedActionablesStr = spec.relatedActionables.length > 0
    ? `['${spec.relatedActionables.join("', '")}']`
    : '[]';

  return `    // SCP Tool: ${spec.toolName}
    {
      qualityName: '${spec.qualityName}',
      toolName: '${spec.toolName}',
      description: '${spec.description.replace(/'/g, "\\'")}',
      inputSchema: ${inputSchemaStr},
      toolType: '${spec.toolType}',
      handlerType: '${spec.handlerType}',
      strategyName: '${spec.strategyName}',${strategyCreatorLine}
      relatedActionables: ${relatedActionablesStr},
    } as SCPQualityMetadata,`;
}

/**
 * Generate import statement for strategyCreator
 */
function generateStrategyCreatorImport(spec: SCPToolRegistrationSpecification): string {
  if (spec.handlerType !== 'strategy' || !spec.strategyFilePath || !spec.strategyCreatorName) {
    return '';
  }

  return `import { ${spec.strategyCreatorName} } from '${spec.strategyFilePath}';`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// getConceptPath imported from ../model/projectPathResolver.model

// ============================================
// VALIDATION
// ============================================

function validateSpecification(spec: unknown): spec is SCPToolRegistrationSpecification {
  const s = spec as SCPToolRegistrationSpecification;
  return !!(
    s.qualityName &&
    s.toolName &&
    s.conceptName &&
    s.description &&
    s.inputSchema &&
    s.toolType &&
    s.handlerType &&
    typeof s.strategyName === 'string' &&
    Array.isArray(s.relatedActionables)
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseSCPToolRegisterStrategy - SCP Strategy Creator
 *
 * Creates a 2-3 node strategy for SCP tool registration:
 * 1. Insert scpToolMetadata entry in muxonomy.ts
 * 2. Insert strategyCreator import (conditional - strategy-based only)
 *
 * Uses Grep for pattern-based insertion.
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 */
export const createStrativerseSCPToolRegisterStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[Means2:SCPToolRegister]';
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);
  console.log(`${LOG_PREFIX} STRATEGY CREATOR ENTERED`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
  console.log(`${LOG_PREFIX} Params received:`, JSON.stringify(params, null, 2));

  const specification = params.specification as SCPToolRegistrationSpecification;

  // Validate specification
  if (!validateSpecification(specification)) {
    console.error(`${LOG_PREFIX} ❌ VALIDATION FAILED - Invalid specification`);
    console.error(`${LOG_PREFIX} Specification received:`, JSON.stringify(specification, null, 2));
    return undefined;
  }

  console.log(`${LOG_PREFIX} ✅ Validation passed for tool:`, specification.toolName);
  console.log(`${LOG_PREFIX} Specification details:`, {
    qualityName: specification.qualityName,
    toolName: specification.toolName,
    conceptName: specification.conceptName,
    toolType: specification.toolType,
    handlerType: specification.handlerType,
    strategyName: specification.strategyName,
    strategyCreatorName: specification.strategyCreatorName || '(none)',
    relatedActionables: specification.relatedActionables,
  });

  // Get deck
  console.log(`${LOG_PREFIX} Accessing deck via selectStratiDECK...`);
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');

  if (!grepDeck) {
    console.error(`${LOG_PREFIX} ❌ DECK ACCESS FAILED - grep deck not found`);
    return undefined;
  }
  console.log(`${LOG_PREFIX} ✅ Grep deck acquired`);

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
  const muxonomyFileName = `${specification.conceptName}.muxonomy.ts`;

  console.log(`${LOG_PREFIX} Paths computed:`, {
    conceptPath,
    muxonomyFileName,
  });

  // Generated content
  console.log(`${LOG_PREFIX} Generating content...`);
  const scpMetadataEntry = generateSCPMetadataEntry(specification);
  const importStatement = generateStrategyCreatorImport(specification);

  console.log(`${LOG_PREFIX} Content generated:`, {
    scpMetadataEntryLength: scpMetadataEntry.length,
    importStatement: importStatement || '(none - quality-based)',
    isStrategyBased: specification.handlerType === 'strategy',
  });

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================
  console.log(`${LOG_PREFIX} Building strategy nodes...`);

  // Final Node: Insert scpToolMetadata entry
  console.log(`${LOG_PREFIX} Creating insertMetadataNode`);
  const insertMetadataNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(scpToolMetadata: \\[)',
      replaceWith: `$1\n${scpMetadataEntry}`,
      targetDirectory: conceptPath,
      fileGlob: muxonomyFileName,
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: specification.handlerType === 'strategy' ? 'then' : 'Finally',
        denoter: `scpToolMetadata entry added for ${specification.toolName}.`,
      },
    }
  );

  // If strategy-based, prepend import insertion node
  if (specification.handlerType === 'strategy' && importStatement) {
    console.log(`${LOG_PREFIX} Strategy-based: Creating insertImportNode`);
    const insertImportNode = createActionNode(
      grepDeck.e.grepReplaceInFiles({
        searchPattern: "(import type { SCPQualityMetadata }[^;]*;)",
        replaceWith: `${importStatement}\n$1`,
        targetDirectory: conceptPath,
        fileGlob: muxonomyFileName,
        dryRun: false,
      }),
      {
        successNode: insertMetadataNode,
        successNotes: {
          preposition: 'First',
          denoter: `strategyCreator import added for ${specification.strategyCreatorName};`,
        },
      }
    );

    console.log(`${LOG_PREFIX} Building 2-node strategy (import + metadata)...`);
    const strategy = createStrategy({
      topic: `StratiVERSE SCP Tool Register - ${specification.toolName}`,
      initialNode: insertImportNode,
      data: {
        specification,
        conceptPath,
        muxonomyFileName,
        initTimestamp: Date.now(),
      },
    });

    console.log(`${LOG_PREFIX} ✅ STRATEGY CREATED SUCCESSFULLY (strategy-based, 2 nodes)`);
    console.log(`${LOG_PREFIX} Strategy topic: ${strategy.topic}`);
    console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);

    return strategy;
  }

  // Quality-based: Single node strategy
  console.log(`${LOG_PREFIX} Quality-based: Building 1-node strategy (metadata only)...`);
  const strategy = createStrategy({
    topic: `StratiVERSE SCP Tool Register - ${specification.toolName}`,
    initialNode: insertMetadataNode,
    data: {
      specification,
      conceptPath,
      muxonomyFileName,
      initTimestamp: Date.now(),
    },
  });

  console.log(`${LOG_PREFIX} ✅ STRATEGY CREATED SUCCESSFULLY (quality-based, 1 node)`);
  console.log(`${LOG_PREFIX} Strategy topic: ${strategy.topic}`);
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);

  return strategy;
};
