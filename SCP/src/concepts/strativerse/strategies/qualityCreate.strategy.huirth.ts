/**
 * strativerseQualityCreate Strategy - Quality Creation SCP Tool
 *
 * Creates a new quality with all required file modifications:
 * 1. types.ts - Add payload type + quality type
 * 2. {qualityName}.quality.{location}.ts - Create quality file
 * 3. index.ts - Add export statement
 * 4. muxonomy.ts - Add demometer entry
 * 5. concept.ts - Add import + type mapping + factory entry
 *
 * Pattern: Grep-based insertion with failure routing to createFileWithContents
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 2.0
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
import type { FileSystemConcept } from '../../fileSystem/fileSystem.concept';
import type { SCPStrategyCreator } from '../../scp/scp.types';
import type { StrativerseConcept } from '../strativerse.concept';
import type { StrativerseState } from '../strativerse.type';
import { resolveProjectRoot, getConceptPath } from '../model/projectPathResolver.model';
import path from 'path';

// ============================================
// QUALITY CREATION SPECIFICATION TYPE
// ============================================

/**
 * QualityCreationSpecification - Complete specification for quality creation
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md
 */
export type QualityCreationSpecification = {
  // Identity
  qualityName: string;
  typeString: string;
  conceptName: string;

  // Location
  location: 'huirth' | 'client' | 'all';
  diameter: boolean;

  // NEW: Complete quality file as code block (simplified approach)
  // When provided, bypasses all template generation and writes file directly
  // Citation: BREAKOUT-QUALITY-FILE-CONTENT-MANIFOLD-ENHANCEMENT.md
  qualityFileContent?: string;

  // Payload (optional when qualityFileContent provided)
  hasPayload: boolean;
  payloadTypeName: string;
  payloadFields: Array<{
    name: string;
    type: string;
    documentation: string;
    required: boolean;
  }>;

  // Reducer (optional when qualityFileContent provided)
  reducerModifies: string[];
  reducerLogic: string;

  // Method (optional when qualityFileContent provided)
  methodType: 'simple' | 'withConcepts' | 'none';
  usesStrategy: boolean;
  methodLogic: string;

  // Documentation
  description: string;
  citations: string[];
};

// ============================================
// CONTENT GENERATORS
// ============================================

/**
 * Generate quality file name based on location and diameter
 */
function generateQualityFileName(spec: QualityCreationSpecification): string {
  const parts = [spec.qualityName, 'quality'];

  if (spec.location !== 'all') {
    parts.push(spec.location);
  }

  if (spec.diameter) {
    parts.push('diameter');
  }

  return parts.join('.') + '.ts';
}

/**
 * Generate payload type definition for types.ts
 */
function generatePayloadType(spec: QualityCreationSpecification): string {
  if (!spec.hasPayload || spec.payloadFields.length === 0) {
    return '';
  }

  const fields = spec.payloadFields.map(f => {
    const optional = f.required ? '' : '?';
    return `  /** ${f.documentation} */\n  ${f.name}${optional}: ${f.type};`;
  }).join('\n');

  return `
export type ${spec.payloadTypeName} = {
${fields}
};
`;
}

/**
 * Generate quality type definition for types.ts
 *
 * CRITICAL: Quality type is ALWAYS required for explicit type mapping.
 * Even without payload, use Quality<ConceptNameState> pattern.
 *
 * Citation: STRATIMUX-REFERENCE.md "Quality Type Definition Pattern"
 */
function generateQualityType(spec: QualityCreationSpecification): string {
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  const stateTypeName = capitalizeFirst(spec.conceptName) + 'State';

  if (spec.hasPayload) {
    return `export type ${qualityTypeName} = Quality<${stateTypeName}, ${spec.payloadTypeName}>;`;
  }
  return `export type ${qualityTypeName} = Quality<${stateTypeName}>;`;
}

/**
 * Generate types.ts insertion content (payload type + quality type)
 *
 * ALWAYS includes quality type for explicit type mapping requirement.
 * Payload type only included when hasPayload is true.
 */
function generateTypesInsertContent(spec: QualityCreationSpecification): string {
  const qualityType = generateQualityType(spec);

  if (spec.hasPayload && spec.payloadFields.length > 0) {
    const payloadType = generatePayloadType(spec);
    return `${payloadType}\n${qualityType}`;
  }

  return qualityType;
}

/**
 * Generate complete quality file content
 *
 * SIMPLIFIED APPROACH: When qualityFileContent is provided, return it directly.
 * This enables AI to generate complete quality files using informative patterns
 * and pass them through without template transformation.
 *
 * Citation: BREAKOUT-QUALITY-FILE-CONTENT-MANIFOLD-ENHANCEMENT.md
 */
function generateQualityFileContent(spec: QualityCreationSpecification): string {
  // NEW: If complete file content provided, use it directly (no templating)
  if (spec.qualityFileContent) {
    return spec.qualityFileContent;
  }

  // FALLBACK: Existing template generation for backwards compatibility
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  const stateTypeName = capitalizeFirst(spec.conceptName) + 'State';
  const deckTypeName = capitalizeFirst(spec.conceptName) + 'Deck';

  // CRITICAL: Use defaultReducer when no state modifications (returns {} instead of state)
  // Citation: STRATIMUX-REFERENCE.md "Critical Reducer Performance Optimization"
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

  // CRITICAL: Always include 'type Quality' for explicit Quality type definition
  // Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md - Phase 2
  const stratimuxImports = imports.join(',\n  ');
  const typeImports = 'type Quality,';

  // Generate method body
  // CRITICAL: Must include muxiumConclude() to properly close manifold when no strategy
  // Citation: STRATIMUX-REFERENCE.md - "muxiumConclude() ensures manifold closes"
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

  // Build the quality file
  const createFn = spec.hasPayload ? 'createQualityCardWithPayload' : 'createQualityCard';
  const typeParams = spec.hasPayload
    ? `<\n  ${stateTypeName},\n  ${spec.payloadTypeName},\n  ${deckTypeName}\n>`
    : `<${stateTypeName}, ${deckTypeName}>`;

  const payloadExtract = spec.hasPayload
    ? `\n    const payload = selectPayload<${spec.payloadTypeName}>(action);`
    : '';

  // Generate reducer section based on whether state is modified
  // CRITICAL: Use defaultReducer when no state modifications (Shortest Path Principle)
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
 * ${spec.citations.map(c => `Citation: ${c}`).join('\n * ')}
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

/**
 * Generate export statement for index.ts
 */
function generateExportStatement(spec: QualityCreationSpecification): string {
  const fileName = generateQualityFileName(spec).replace('.ts', '');
  return `export * from './${fileName}';`;
}

/**
 * Generate import statement for concept.ts
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md - Phase 5
 */
function generateConceptImport(spec: QualityCreationSpecification): string {
  const fileName = generateQualityFileName(spec).replace('.ts', '');
  if (spec.hasPayload && spec.payloadTypeName) {
    return `import { ${spec.qualityName}, ${spec.payloadTypeName} } from './qualities/${fileName}';`;
  }
  return `import { ${spec.qualityName} } from './qualities/${fileName}';`;
}

/**
 * Generate type export for concept.ts
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md - Phase 5
 */
function generateConceptTypeExport(spec: QualityCreationSpecification): string {
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  const stateTypeName = capitalizeFirst(spec.conceptName) + 'State';

  if (spec.hasPayload) {
    return `export type ${qualityTypeName} = Quality<${stateTypeName}, ${spec.payloadTypeName}>;`;
  }
  return `export type ${qualityTypeName} = Quality<${stateTypeName}>;`;
}

/**
 * Generate StrativerseQualities type entry for concept.ts
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md - Phase 5
 */
function generateQualitiesTypeEntry(spec: QualityCreationSpecification): string {
  const qualityTypeName = capitalizeFirst(spec.qualityName);
  return `  ${spec.qualityName}: ${qualityTypeName};`;
}

/**
 * Generate demometer entry for muxonomy.ts
 */
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

function validateSpecification(spec: unknown): spec is QualityCreationSpecification {
  const s = spec as QualityCreationSpecification;
  return !!(
    s.qualityName &&
    s.typeString &&
    s.conceptName &&
    s.location &&
    typeof s.diameter === 'boolean' &&
    typeof s.hasPayload === 'boolean' &&
    s.methodType &&
    s.description
  );
}

// ============================================
// STRATEGY CREATOR
// ============================================

/**
 * createStrativerseQualityCreateStrategy - SCP Strategy Creator
 *
 * Creates an 8-node strategy for quality creation:
 * 1. Create quality file (always new)
 * 2. Insert quality type (and payload type if hasPayload) in types.ts
 * 3. Insert export in index.ts
 * 4. Insert demometer in muxonomy.ts
 * 5a. Insert import statement in concept.ts
 * 5b. Insert type export in concept.ts
 * 5c. Insert entry in ConceptQualities type definition
 * 5d. Insert quality in conceptQualities object
 *
 * Uses Grep for pattern-based insertion with failure routing.
 *
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 2.0
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md - Phase 5
 */
export const createStrativerseQualityCreateStrategy: SCPStrategyCreator = (
  concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>
): ActionStrategy | undefined => {
  const LOG_PREFIX = '[Means1:QualityCreate]';
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);
  console.log(`${LOG_PREFIX} STRATEGY CREATOR ENTERED`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
  console.log(`${LOG_PREFIX} Params received:`, JSON.stringify(params, null, 2));

  const specification = params.specification as QualityCreationSpecification;

  // Validate specification
  if (!validateSpecification(specification)) {
    console.error(`${LOG_PREFIX} ❌ VALIDATION FAILED - Invalid specification`);
    console.error(`${LOG_PREFIX} Specification received:`, JSON.stringify(specification, null, 2));
    return undefined;
  }

  console.log(`${LOG_PREFIX} ✅ Validation passed for quality:`, specification.qualityName);
  console.log(`${LOG_PREFIX} Specification details:`, {
    qualityName: specification.qualityName,
    typeString: specification.typeString,
    conceptName: specification.conceptName,
    location: specification.location,
    diameter: specification.diameter,
    hasPayload: specification.hasPayload,
    methodType: specification.methodType,
  });

  // Get decks
  console.log(`${LOG_PREFIX} Accessing decks via selectStratiDECK...`);
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');
  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!grepDeck) {
    console.error(`${LOG_PREFIX} ❌ DECK ACCESS FAILED - grep deck not found`);
    return undefined;
  }
  if (!fileSystemDeck) {
    console.error(`${LOG_PREFIX} ❌ DECK ACCESS FAILED - fileSystem deck not found`);
    return undefined;
  }
  console.log(`${LOG_PREFIX} ✅ Both decks acquired (grep, fileSystem)`);

  // Project path resolution (Phase 4C: Managed Project Scope Extension)
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
  const qualityFileName = generateQualityFileName(specification);
  const qualityFilePath = `${conceptPath}/qualities/${qualityFileName}`;

  console.log(`${LOG_PREFIX} Paths computed:`, {
    conceptPath,
    qualityFileName,
    qualityFilePath,
  });

  // Generated content
  console.log(`${LOG_PREFIX} Generating content...`);
  const qualityFileContent = generateQualityFileContent(specification);
  const typesInsertContent = generateTypesInsertContent(specification);
  const exportStatement = generateExportStatement(specification);
  const demometerEntry = generateDemometerEntry(specification);

  console.log(`${LOG_PREFIX} Content generated:`, {
    qualityFileContentLength: qualityFileContent.length,
    typesInsertContentLength: typesInsertContent.length,
    exportStatement,
    demometerEntryLength: demometerEntry.length,
  });

  // ============================================
  // BUILD STRATEGY NODES (Reverse Order)
  // ============================================
  console.log(`${LOG_PREFIX} Building strategy nodes (reverse order)...`);

  // Generate concept.ts content pieces
  // Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md - Phase 5
  const conceptImport = generateConceptImport(specification);
  const conceptTypeExport = generateConceptTypeExport(specification);
  const qualitiesTypeEntry = generateQualitiesTypeEntry(specification);
  const conceptQualityTypeName = capitalizeFirst(specification.conceptName) + 'Qualities';

  console.log(`${LOG_PREFIX} Concept.ts content generated:`, {
    conceptImport,
    conceptTypeExport,
    qualitiesTypeEntry,
    conceptQualityTypeName,
  });

  // Node 5d: Insert quality in concept qualities object (final node)
  console.log(`${LOG_PREFIX} Creating Node 5d: qualitiesObjectNode`);
  const qualitiesObjectNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(export const ${specification.conceptName}Qualities = \\{)`,
      replaceWith: `$1\n  ${specification.qualityName},`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.conceptName}.concept.ts`,
      dryRun: false,
    }),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'quality added to concept qualities object.',
      },
    }
  );

  // Node 5c: Insert entry in ConceptQualities type definition
  console.log(`${LOG_PREFIX} Creating Node 5c: qualitiesTypeNode`);
  const qualitiesTypeNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(export type ${conceptQualityTypeName} = \\{)`,
      replaceWith: `$1\n${qualitiesTypeEntry}`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.conceptName}.concept.ts`,
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
  // Pattern: Find last type export and insert after it
  console.log(`${LOG_PREFIX} Creating Node 5b: typeExportNode`);
  const typeExportNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(export type ${conceptQualityTypeName} = \\{)`,
      replaceWith: `${conceptTypeExport}\n\n$1`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.conceptName}.concept.ts`,
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
  // Pattern: Find last quality import and insert after it
  console.log(`${LOG_PREFIX} Creating Node 5a: importNode`);
  const importNode = createActionNode(
    grepDeck.e.grepReplaceInFiles({
      searchPattern: `(// Qualities\\n(?:import [^\\n]+\\n)*)`,
      replaceWith: `$1${conceptImport}\n`,
      targetDirectory: conceptPath,
      fileGlob: `${specification.conceptName}.concept.ts`,
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
      fileGlob: `${specification.conceptName}.muxonomy.ts`,
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

  // Node 2: Insert quality type (and payload type if hasPayload) in types.ts
  // CRITICAL: Quality type is ALWAYS required for explicit type mapping
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

  // Node 1: Create quality file (always first)
  console.log(`${LOG_PREFIX} Creating Node 1: createFileNode (initial node)`);
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

  // Create and return the strategy
  console.log(`${LOG_PREFIX} All nodes created, building final strategy...`);
  const strategy = createStrategy({
    topic: `StratiVERSE Quality Create - ${specification.qualityName}`,
    initialNode: createFileNode,
    data: {
      specification,
      qualityFilePath,
      qualityFileName,
      conceptPath,
      // Phase 5 content pieces for debugging
      conceptImport,
      conceptTypeExport,
      qualitiesTypeEntry,
      initTimestamp: Date.now(),
    },
  });

  console.log(`${LOG_PREFIX} ✅ STRATEGY CREATED SUCCESSFULLY`);
  console.log(`${LOG_PREFIX} Strategy topic: ${strategy.topic}`);
  console.log(`${LOG_PREFIX} Strategy data keys:`, Object.keys(strategy.data || {}));
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════════════════════════`);

  return strategy;
};
