/**
 * strativerseOneShotQualitySCP Strategy - OneShot Quality + SCP Registration
 *
 * UNIFIED SINGLE STRATEGY: All nodes from Means 1 + Means 2 in ONE chain.
 * Creates a quality AND registers it as an SCP tool in one ActionStrategy.
 *
 * Node Chain (9-10 nodes):
 * 1. createFileNode - Create quality file
 * 2. typesInsertNode - Insert in types.ts
 * 3. indexInsertNode - Insert export in index.ts
 * 4. muxonomyInsertNode - Insert demometer in muxonomy.ts
 * 5a. importNode - Insert import in concept.ts
 * 5b. typeExportNode - Insert type export in concept.ts
 * 5c. qualitiesTypeNode - Insert in ConceptQualities type
 * 5d. qualitiesObjectNode - Insert in qualities object
 * 6. (optional) scpImportNode - Insert strategyCreator import (strategy-based only)
 * 7. scpMetadataNode - Insert scpToolMetadata entry
 *
 * Key Insight: SCP Manifold wraps tools in HEAD → BODY → TAIL. BODY must be
 * ONE continuous strategy, not a composition of strategies via strategySequence.
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 2.0 Means 3
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies"
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
import { type QualityCreationSpecification } from './qualityCreate.strategy.huirth';
import { type SCPToolRegistrationSpecification } from './scpToolRegister.strategy.huirth';
import { resolveProjectRoot, getConceptPath } from '../model/projectPathResolver.model';
import path from 'path';

// ============================================
// ONESHOT SPECIFICATION TYPE
// ============================================

/**
 * OneShotQualitySCPSpecification - Combined specification for quality + SCP registration
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 */
export type OneShotQualitySCPSpecification = {
  /** Quality creation specification (Means 1) */
  quality: QualityCreationSpecification;

  /**
   * SCP tool registration specification (Means 2)
   * Note: qualityName and conceptName are derived from quality spec
   */
  scp: Omit<SCPToolRegistrationSpecification, 'qualityName' | 'conceptName'>;
};

// ============================================
// CONTENT GENERATORS (From Means 1)
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// getConceptPath imported from ../model/projectPathResolver.model

function generateQualityFileName(spec: QualityCreationSpecification): string {
  const locationSuffix = spec.location === 'huirth' ? '.huirth'
    : spec.location === 'client' ? '.client'
    : '';
  const diameterSuffix = spec.diameter ? '.diameter' : '';
  return `${spec.qualityName}.quality${locationSuffix}${diameterSuffix}.ts`;
}

function generateQualityFileContent(spec: QualityCreationSpecification): string {
  // NEW: If complete file content provided, use it directly (no templating)
  // Citation: BREAKOUT-QUALITY-FILE-CONTENT-MANIFOLD-ENHANCEMENT.md
  if (spec.qualityFileContent) {
    return spec.qualityFileContent;
  }

  // FALLBACK: Existing template generation for backwards compatibility
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  const stateTypeName = capitalizeFirst(spec.conceptName) + 'State';
  const deckTypeName = capitalizeFirst(spec.conceptName) + 'Deck';
  const usesDefaultReducer = spec.reducerModifies.length === 0;

  const imports = [
    spec.hasPayload ? 'createQualityCardWithPayload' : 'createQualityCard',
    spec.hasPayload ? 'selectPayload' : '',
    spec.methodType === 'withConcepts' ? 'createMethodWithConcepts' : '',
    spec.methodType === 'simple' ? 'createMethod' : '',
    spec.usesStrategy ? 'strategySuccess' : '',
    spec.usesStrategy ? 'strategyData_muxifyData' : '',
    spec.usesStrategy ? 'muxiumConclude' : '',
    usesDefaultReducer ? 'defaultReducer' : '',
  ].filter(Boolean);

  const stratimuxImports = imports.join(',\n  ');
  const typeImports = 'type Quality,';

  let methodBody = '';
  if (spec.methodType !== 'none') {
    if (spec.usesStrategy) {
      methodBody = `
  methodCreator: () =>
    ${spec.methodType === 'withConcepts' ? 'createMethodWithConcepts' : 'createMethod'}(({ action }) => {
      // ${spec.methodLogic}
      if (action.strategy) {
        return strategySuccess(action.strategy);
      }
      return muxiumConclude();
    }),`;
    } else {
      methodBody = `
  methodCreator: () =>
    ${spec.methodType === 'withConcepts' ? 'createMethodWithConcepts' : 'createMethod'}(({ action }) => {
      // ${spec.methodLogic}
      return muxiumConclude();
    }),`;
    }
  }

  const createFn = spec.hasPayload ? 'createQualityCardWithPayload' : 'createQualityCard';
  const typeParams = spec.hasPayload
    ? `<\n  ${stateTypeName},\n  ${spec.payloadTypeName},\n  ${deckTypeName}\n>`
    : `<${stateTypeName}, ${deckTypeName}>`;

  const payloadExtract = spec.hasPayload
    ? `\n    const payload = selectPayload<${spec.payloadTypeName}>(action);`
    : '';

  const reducerSection = usesDefaultReducer
    ? 'reducer: defaultReducer,'
    : `reducer: (state, action) => {${payloadExtract}
    // ${spec.reducerLogic}
    return {
      // TODO: Implement reducer - return ONLY changed properties
    };
  },`;

  return `/**
 * ${spec.qualityName} - ${spec.description}
 *
 * ${(spec.citations || []).map(c => `Citation: ${c}`).join('\n * ')}
 *
 * Type: '${spec.typeString}' (Verbose Split)
 */
import {
  ${stratimuxImports},
  ${typeImports}
} from 'stratimux';
import type { ${stateTypeName} } from '../${spec.conceptName}.type';
import type { ${deckTypeName} } from '../${spec.conceptName}.concept';
${spec.hasPayload ? `import type { ${spec.payloadTypeName} } from './types';` : ''}

export type ${qualityTypeName} = Quality<${stateTypeName}${spec.hasPayload ? `, ${spec.payloadTypeName}` : ''}>;

export const ${spec.qualityName} = ${createFn}${typeParams}({
  type: '${spec.typeString}',
  ${reducerSection}${methodBody}
});
`;
}

function generateTypesInsertContent(spec: QualityCreationSpecification): string {
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  const stateTypeName = capitalizeFirst(spec.conceptName) + 'State';
  let content = `export type ${qualityTypeName} = Quality<${stateTypeName}${spec.hasPayload ? `, ${spec.payloadTypeName}` : ''}>;`;
  if (spec.hasPayload && spec.payloadTypeName && spec.payloadFields) {
    const fields = spec.payloadFields.map(f =>
      `  /** ${f.documentation} */\n  ${f.name}${f.required ? '' : '?'}: ${f.type};`
    ).join('\n');
    content = `export type ${spec.payloadTypeName} = {\n${fields}\n};\n\n${content}`;
  }
  return content;
}

function generateExportStatement(spec: QualityCreationSpecification): string {
  const fileName = generateQualityFileName(spec).replace('.ts', '');
  return `export * from './${fileName}';`;
}

function generateDemometerEntry(spec: QualityCreationSpecification): string {
  const location = spec.location === 'huirth' ? 'DeploymentTarget.Huirth'
    : spec.location === 'client' ? 'DeploymentTarget.Client'
    : 'DeploymentTarget.All';

  return `      {
        name: '${spec.qualityName}',
        type: '${spec.typeString}',
        filePath: 'qualities/${generateQualityFileName(spec)}',
        location: ${location},
        diameter: ${spec.diameter},
      },`;
}

function generateConceptImport(spec: QualityCreationSpecification): string {
  const fileName = generateQualityFileName(spec).replace('.ts', '');
  return `import { ${spec.qualityName} } from './qualities/${fileName}';`;
}

function generateConceptTypeExport(spec: QualityCreationSpecification): string {
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  const stateTypeName = capitalizeFirst(spec.conceptName) + 'State';
  return `export type ${qualityTypeName} = Quality<${stateTypeName}${spec.hasPayload ? `, ${spec.payloadTypeName}` : ''}>;`;
}

function generateQualitiesTypeEntry(spec: QualityCreationSpecification): string {
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  return `  ${spec.qualityName}: ${qualityTypeName};`;
}

// ============================================
// CONTENT GENERATORS (From Means 2)
// ============================================

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

function generateStrategyCreatorImport(spec: SCPToolRegistrationSpecification): string {
  if (spec.handlerType !== 'strategy' || !spec.strategyFilePath || !spec.strategyCreatorName) {
    return '';
  }
  return `import { ${spec.strategyCreatorName} } from '${spec.strategyFilePath}';`;
}

// ============================================
// VALIDATION
// ============================================

type ValidationResult = { valid: true } | { valid: false; reason: string };

function validateSpecification(spec: unknown): ValidationResult {
  const s = spec as OneShotQualitySCPSpecification;

  // Check quality object exists
  if (!s.quality) {
    return { valid: false, reason: 'Missing quality object' };
  }

  // Required quality fields
  if (!s.quality.qualityName) {
    return { valid: false, reason: 'Missing quality.qualityName' };
  }
  if (!s.quality.conceptName) {
    return { valid: false, reason: 'Missing quality.conceptName' };
  }
  if (!s.quality.typeString) {
    return { valid: false, reason: 'Missing quality.typeString' };
  }
  if (!s.quality.location) {
    return { valid: false, reason: 'Missing quality.location' };
  }
  if (!s.quality.description) {
    return { valid: false, reason: 'Missing quality.description' };
  }

  // methodType is ONLY required when qualityFileContent is NOT provided
  // Citation: BREAKOUT-QUALITY-FILE-CONTENT-MANIFOLD-ENHANCEMENT.md
  if (!s.quality.qualityFileContent && !s.quality.methodType) {
    return { valid: false, reason: 'Missing quality.methodType (required when qualityFileContent not provided)' };
  }

  // Check SCP object exists
  if (!s.scp) {
    return { valid: false, reason: 'Missing scp object' };
  }

  // Required SCP fields
  if (!s.scp.toolName) {
    return { valid: false, reason: 'Missing scp.toolName' };
  }
  if (!s.scp.description) {
    return { valid: false, reason: 'Missing scp.description' };
  }

  return { valid: true };
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseOneShotQualitySCPStrategy - Unified Single Strategy
 *
 * Creates ONE strategy with all 9-10 nodes chained directly:
 * - Nodes 1-8: Quality creation (Means 1)
 * - Nodes 9-10: SCP registration (Means 2)
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-THREE-MEANS-SCP-TOOL-AUTOMATION-SPECIFICATION.md
 */
export const createStrativerseOneShotQualitySCPStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[Means3:OneShotQualitySCP]';
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);
  console.log(`${LOG_PREFIX} UNIFIED STRATEGY CREATOR ENTERED`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);

  const specification = params.specification as OneShotQualitySCPSpecification;

  // Validate with detailed failure reason
  const validationResult = validateSpecification(specification);
  if (!validationResult.valid) {
    console.error(`${LOG_PREFIX} ❌ VALIDATION FAILED`);
    console.error(`${LOG_PREFIX} Reason: ${validationResult.reason}`);
    console.error(`${LOG_PREFIX} Specification:`, JSON.stringify(specification, null, 2));
    return undefined;
  }

  console.log(`${LOG_PREFIX} ✅ Validation passed`);
  console.log(`${LOG_PREFIX} Quality: ${specification.quality.qualityName}`);
  console.log(`${LOG_PREFIX} Tool: ${specification.scp.toolName}`);

  // Get decks
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');

  if (!grepDeck || !fileSystemDeck) {
    console.error(`${LOG_PREFIX} ❌ DECK ACCESS FAILED`);
    return undefined;
  }
  console.log(`${LOG_PREFIX} ✅ Decks acquired (grep, fileSystem)`);

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

  // Derive full SCP spec
  const scpSpec: SCPToolRegistrationSpecification = {
    ...specification.scp,
    qualityName: specification.quality.qualityName,
    conceptName: specification.quality.conceptName,
  };

  // Paths
  const conceptPath = getConceptPath(resolved.projectRoot, specification.quality.conceptName);
  const qualityFileName = generateQualityFileName(specification.quality);
  const qualityFilePath = `${conceptPath}/qualities/${qualityFileName}`;
  const muxonomyFileName = `${specification.quality.conceptName}.muxonomy.ts`;

  // Generated content (Means 1)
  const qualityFileContent = generateQualityFileContent(specification.quality);
  const typesInsertContent = generateTypesInsertContent(specification.quality);
  const exportStatement = generateExportStatement(specification.quality);
  const demometerEntry = generateDemometerEntry(specification.quality);
  const conceptImport = generateConceptImport(specification.quality);
  const conceptTypeExport = generateConceptTypeExport(specification.quality);
  const qualitiesTypeEntry = generateQualitiesTypeEntry(specification.quality);
  const conceptQualityTypeName = capitalizeFirst(specification.quality.conceptName) + 'Qualities';

  // Generated content (Means 2)
  const scpMetadataEntry = generateSCPMetadataEntry(scpSpec);
  const scpImportStatement = generateStrategyCreatorImport(scpSpec);

  console.log(`${LOG_PREFIX} Content generated, building unified node chain...`);

  // ============================================
  // BUILD UNIFIED NODE CHAIN (Reverse Order)
  // ============================================

  // FINAL NODE: Insert scpToolMetadata entry (Means 2)
  console.log(`${LOG_PREFIX} Creating Node FINAL: scpMetadataNode`);
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
        denoter: `scpToolMetadata entry added for ${scpSpec.toolName}.`,
      },
    }
  );

  // Determine Means 2 first node
  let means2FirstNode = scpMetadataNode;

  // If strategy-based, prepend import node
  if (scpSpec.handlerType === 'strategy' && scpImportStatement) {
    console.log(`${LOG_PREFIX} Creating Node 9: scpImportNode (strategy-based)`);
    const scpImportNode = createActionNode(
      grepDeck.e.grepReplaceInFiles({
        searchPattern: "(import type { SCPQualityMetadata }[^;]*;)",
        replaceWith: `${scpImportStatement}\n$1`,
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
    means2FirstNode = scpImportNode;
  }

  // Node 5d: Insert quality in concept qualities object
  console.log(`${LOG_PREFIX} Creating Node 5d: qualitiesObjectNode`);
  const qualitiesObjectNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(export const ${specification.quality.conceptName}Qualities = \\{)`,
      replaceWith: `$1\n  ${specification.quality.qualityName},`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.quality.conceptName}.concept.ts`,
      dryRun: false,
    }),
    {
      successNode: means2FirstNode, // Chain to Means 2
      successNotes: {
        preposition: 'then',
        denoter: 'quality added to concept qualities object;',
      },
    }
  );

  // Node 5c: Insert entry in ConceptQualities type
  console.log(`${LOG_PREFIX} Creating Node 5c: qualitiesTypeNode`);
  const qualitiesTypeNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(export type ${conceptQualityTypeName} = \\{)`,
      replaceWith: `$1\n${qualitiesTypeEntry}`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.quality.conceptName}.concept.ts`,
      dryRun: false,
    }),
    {
      successNode: qualitiesObjectNode,
      successNotes: {
        preposition: 'then',
        denoter: 'quality type entry added to ConceptQualities;',
      },
    }
  );

  // Node 5b: Insert type export
  console.log(`${LOG_PREFIX} Creating Node 5b: typeExportNode`);
  const typeExportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(export type ${conceptQualityTypeName} = \\{)`,
      replaceWith: `${conceptTypeExport}\n\n$1`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.quality.conceptName}.concept.ts`,
      dryRun: false,
    }),
    {
      successNode: qualitiesTypeNode,
      successNotes: {
        preposition: 'then',
        denoter: 'quality type export added;',
      },
    }
  );

  // Node 5a: Insert import statement
  console.log(`${LOG_PREFIX} Creating Node 5a: importNode`);
  const importNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(// Qualities\\n(?:import [^\\n]+\\n)*)`,
      replaceWith: `$1${conceptImport}\n`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.quality.conceptName}.concept.ts`,
      dryRun: false,
    }),
    {
      successNode: typeExportNode,
      successNotes: {
        preposition: 'then',
        denoter: 'quality import added to concept;',
      },
    }
  );

  // Node 4: Insert demometer in muxonomy.ts
  console.log(`${LOG_PREFIX} Creating Node 4: muxonomyInsertNode`);
  const muxonomyInsertNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(qualities: \\[)',
      replaceWith: `$1\n${demometerEntry}`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.quality.conceptName}.muxonomy.ts`,
      dryRun: false,
    }),
    {
      successNode: importNode,
      successNotes: {
        preposition: 'then',
        denoter: 'demometer entry added to muxonomy;',
      },
    }
  );

  // Node 3: Insert export in index.ts
  console.log(`${LOG_PREFIX} Creating Node 3: indexInsertNode`);
  const indexInsertNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: "(export \\* from '\\./)",
      replaceWith: `${exportStatement}\n$1`,
      targetDirectory: `${conceptPath}/qualities`,
      fileGlob: 'index.ts',
      dryRun: false,
    }),
    {
      successNode: muxonomyInsertNode,
      successNotes: {
        preposition: 'then',
        denoter: 'export statement added to index;',
      },
    }
  );

  // Node 2: Insert quality type in types.ts
  console.log(`${LOG_PREFIX} Creating Node 2: typesInsertNode`);
  const typesInsertNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: '(// QUALITY TYPE DEFINITIONS)',
      replaceWith: `${typesInsertContent}\n\n$1`,
      targetDirectory: `${conceptPath}/qualities`,
      fileGlob: 'types.ts',
      dryRun: false,
    }),
    {
      successNode: indexInsertNode,
      successNotes: {
        preposition: 'then',
        denoter: 'quality type added to types;',
      },
    }
  );

  // Node 1: Create quality file (INITIAL NODE)
  console.log(`${LOG_PREFIX} Creating Node 1: createFileNode (initial)`);
  const createFileNode = createActionNode(
    fileSystemDeck.e.fileSystemCreateFileWithContentsIndex({
      path: qualityFilePath,
      content: qualityFileContent,
    }),
    {
      successNode: typesInsertNode,
      successNotes: {
        preposition: 'First',
        denoter: `quality file ${qualityFileName} created;`,
      },
    }
  );

  // Create unified strategy
  console.log(`${LOG_PREFIX} Building unified strategy...`);
  const strategy = createStrategy({
    topic: `StratiVERSE OneShot - ${specification.quality.qualityName} → ${scpSpec.toolName}`,
    initialNode: createFileNode,
    data: {
      qualitySpec: specification.quality,
      scpSpec,
      qualityFilePath,
      qualityFileName,
      conceptPath,
      initTimestamp: Date.now(),
    },
  });

  const nodeCount = scpSpec.handlerType === 'strategy' && scpImportStatement ? 10 : 9;
  console.log(`${LOG_PREFIX} ✅ UNIFIED STRATEGY CREATED (${nodeCount} nodes)`);
  console.log(`${LOG_PREFIX} Topic: ${strategy.topic}`);
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);

  return strategy;
};
