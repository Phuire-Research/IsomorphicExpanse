/**
 * Concept Parser Utilities
 *
 * Parses TypeScript files to extract:
 * - State type definitions with property types as STRINGS
 * - Quality type strings and payload types
 * - Muxonomy configuration summaries
 *
 * Type as STRING enables:
 * - Deep inspection later (expand defined types)
 * - Crystraline Pearl compression (type string = Conceptual Set)
 * - Property collision detection across concepts
 *
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 * Citation: POC-TO-MVP-STRATIVERSE-CASCADE.md - Phase 2.2
 */

// Direct import from type file (NO barrel exports for tree-shaking)
import type {
  StateFieldEntry,
  QualityEntry,
  PrincipleEntry,
  StrategyEntry,
  MuxonomyConfigSummary,
  SCPQualityMetadata,
} from '../strativerse.type';
import { DeploymentTarget } from '../../muxonomy/muxonomy.model';
import {
  parseQualityFileName,
  parsePrincipleFileName,
  parseStrategyFileName,
} from './fileNaming.model';

// ============================================
// BASE TYPE DETECTION
// ============================================

/**
 * TypeScript base/primitive types
 * These are built-in types that don't need deep inspection
 */
const BASE_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'never',
  'any',
  'unknown',
  'bigint',
  'symbol',
]);

/**
 * Check if a type string represents a base/primitive type
 *
 * @param typeString - The type as a string
 * @returns true if it's a base type
 */
export function isBaseType(typeString: string): boolean {
  const normalized = typeString.trim().toLowerCase();
  return BASE_TYPES.has(normalized);
}

/**
 * Check if a type string represents an array type
 *
 * Matches:
 * - SomeType[]
 * - Array<SomeType>
 *
 * @param typeString - The type as a string
 * @returns true if it's an array type
 */
export function isArrayType(typeString: string): boolean {
  const trimmed = typeString.trim();
  return trimmed.endsWith('[]') || trimmed.startsWith('Array<');
}

// ============================================
// STATE TYPE PARSING
// ============================================

/**
 * Parse state type definition from file content
 *
 * Looks for patterns like:
 * - export type ConceptNameState = { ... }
 * - export type SomeState = { ... }
 *
 * @param content - The file content
 * @param conceptName - The concept name to find ConceptNameState
 * @returns Array of StateFieldEntry or null if not found
 */
export function parseStateType(
  content: string,
  conceptName: string
): { stateTypeName: string; stateFields: StateFieldEntry[] } | null {
  // Try concept-specific state type first
  const pascalName = toPascalCase(conceptName);
  const specificStateRegex = new RegExp(
    `export\\s+type\\s+(${pascalName}State)\\s*=\\s*\\{([^}]+)\\}`,
    's'
  );

  let match = content.match(specificStateRegex);

  // Fallback to any State type
  if (!match) {
    const genericStateRegex = /export\s+type\s+(\w+State)\s*=\s*\{([^}]+)\}/s;
    match = content.match(genericStateRegex);
  }

  if (!match) {
    return null;
  }

  const [, stateTypeName, propertiesBlock] = match;
  const stateFields = parseProperties(propertiesBlock);

  return { stateTypeName, stateFields };
}

/**
 * Parse properties from a type block
 *
 * Handles:
 * - propertyName: TypeName;
 * - propertyName?: TypeName;
 * - Multi-line definitions
 *
 * @param propertiesBlock - The content between { and }
 * @returns Array of StateFieldEntry
 */
export function parseProperties(propertiesBlock: string): StateFieldEntry[] {
  const fields: StateFieldEntry[] = [];

  // Match property definitions: name?: Type;
  // Handles multi-line and complex types
  const propertyRegex = /(\w+)(\?)?:\s*([^;]+);/g;

  let match;
  while ((match = propertyRegex.exec(propertiesBlock)) !== null) {
    const [, name, optional, typeString] = match;
    const cleanType = typeString.trim();

    fields.push({
      name,
      typeString: cleanType,
      isBaseType: isBaseType(cleanType),
      isArray: isArrayType(cleanType),
      isOptional: optional === '?',
      defaultValue: undefined, // Would need to parse state creator for this
    });
  }

  return fields;
}

// ============================================
// QUALITY CONTENT PARSING
// ============================================

/**
 * Parse quality file content to extract metadata
 *
 * Extracts:
 * - Type string (Verbose Split naming)
 * - Has payload (createQualityCardWithPayload vs createQualityCard)
 * - Payload type string
 *
 * @param content - The quality file content
 * @param fileName - The file name for deployment parsing
 * @param filePath - Full path for reference
 * @returns QualityEntry or null if invalid
 */
export function parseQualityContent(
  content: string,
  fileName: string,
  filePath: string
): QualityEntry | null {
  // Parse file name for deployment metadata
  const fileInfo = parseQualityFileName(fileName);
  if (!fileInfo.isValid) {
    return null;
  }

  // Extract type string: type: 'Some Action Type'
  const typeStringMatch = content.match(/type:\s*['"]([^'"]+)['"]/);
  if (!typeStringMatch) {
    return null;
  }
  const typeString = typeStringMatch[1];

  // Check for payload: createQualityCardWithPayload vs createQualityCard
  const hasPayload = /createQualityCardWithPayload/.test(content);

  // Extract payload type if present
  let payloadTypeString: string | undefined;
  if (hasPayload) {
    // Look for export type SomePayload = { ... }
    const payloadMatch = content.match(/export\s+type\s+(\w+Payload)\s*=/);
    if (payloadMatch) {
      payloadTypeString = payloadMatch[1];
    }
  }

  // Extract variable name from export const
  const varNameMatch = content.match(/export\s+const\s+(\w+)\s*=/);
  const name = varNameMatch ? varNameMatch[1] : fileInfo.qualityName;

  return {
    name,
    typeString,
    filePath,
    fileName,
    deploymentTarget: fileInfo.deploymentTarget,
    diameter: fileInfo.diameter,
    hasPayload,
    payloadTypeString,
  };
}

// ============================================
// PRINCIPLE CONTENT PARSING
// ============================================

/**
 * Parse principle file content to extract metadata
 *
 * @param content - The principle file content
 * @param fileName - The file name for deployment parsing
 * @param filePath - Full path for reference
 * @returns PrincipleEntry or null if invalid
 */
export function parsePrincipleContent(
  content: string,
  fileName: string,
  filePath: string
): PrincipleEntry | null {
  // Parse file name for deployment metadata
  const fileInfo = parsePrincipleFileName(fileName);
  if (!fileInfo.isValid) {
    return null;
  }

  // Extract variable name from export const
  const varNameMatch = content.match(/export\s+const\s+(\w+)\s*[=:]/);
  const name = varNameMatch ? varNameMatch[1] : fileInfo.principleName;

  return {
    name,
    filePath,
    fileName,
    deploymentTarget: fileInfo.deploymentTarget,
  };
}

// ============================================
// STRATEGY CONTENT PARSING
// ============================================

/**
 * Parse strategy file content to extract metadata
 *
 * @param content - The strategy file content
 * @param fileName - The file name for location parsing
 * @param filePath - Full path for reference
 * @returns StrategyEntry or null if invalid
 */
export function parseStrategyContent(
  content: string,
  fileName: string,
  filePath: string
): StrategyEntry | null {
  // Parse file name for location metadata
  const fileInfo = parseStrategyFileName(fileName);
  if (!fileInfo.isValid) {
    return null;
  }

  // Extract function name from export function or export const
  const funcNameMatch = content.match(/export\s+(?:function|const)\s+(\w+)/);
  const name = funcNameMatch ? funcNameMatch[1] : fileInfo.strategyName;

  return {
    name,
    filePath,
    fileName,
  };
}

// ============================================
// MUXONOMY CONFIG PARSING
// ============================================

/**
 * Parse muxonomy file content to extract configuration summary
 *
 * @param content - The muxonomy file content
 * @returns MuxonomyConfigSummary or null if invalid
 */
export function parseMuxonomyConfig(content: string): MuxonomyConfigSummary | null {
  // Check for valid muxonomy file (accept both const and var declarations)
  const configMatch = content.match(/export\s+(?:const|var)\s+\w+Muxonomic\s*[=:]/);
  if (!configMatch) {
    return null;
  }

  // Extract filterKeys array
  const filterKeysMatch = content.match(/filterKeys:\s*\[([^\]]*)\]/);
  const filterKeys: string[] = [];
  if (filterKeysMatch) {
    const keysContent = filterKeysMatch[1];
    const keyMatches = keysContent.match(/['"]([^'"]+)['"]/g);
    if (keyMatches) {
      filterKeys.push(...keyMatches.map(k => k.replace(/['"]/g, '')));
    }
  }

  // Extract sync direction
  const syncMatch = content.match(/direction:\s*['"]([^'"]+)['"]/);
  const syncDirection = syncMatch ? syncMatch[1] : 'bidirectional';

  // Check for navigation
  const hasNavigation = /navigation\s*:\s*\w+Navigation/.test(content) ||
                        /navigation\s*:\s*\{/.test(content);

  // Count demometers (would need full parsing for accurate counts)
  // For now, estimate based on imports or demometers block
  const demometerCounts = {
    qualityCount: 0,
    principleCount: 0,
    strategyCount: 0,
  };

  // Count quality imports
  const qualityImports = content.match(/from\s+['"]\.\/qualities\//g);
  if (qualityImports) {
    demometerCounts.qualityCount = qualityImports.length;
  }

  // Count principle imports
  const principleImports = content.match(/from\s+['"]\.\/principles\//g);
  if (principleImports) {
    demometerCounts.principleCount = principleImports.length;
  }

  // Count strategy imports
  const strategyImports = content.match(/from\s+['"]\.\/strategies\//g);
  if (strategyImports) {
    demometerCounts.strategyCount = strategyImports.length;
  }

  const syncVersionMatch = content.match(/syncVersion\s*:\s*(\d+)/);
  const syncVersion = syncVersionMatch ? parseInt(syncVersionMatch[1], 10) : 0;

  const syncManagedMatch = content.match(/syncManaged\s*:\s*(true|false)/);
  const syncManaged = syncManagedMatch ? syncManagedMatch[1] === 'true' : false;

  return {
    filterKeys,
    syncDirection,
    hasNavigation,
    syncVersion,
    syncManaged,
    demometerCounts,
  };
}

// ============================================
// SCP TOOL METADATA PARSING (POC 2.3b-SCP)
// ============================================

/**
 * Parse scpToolMetadata array from muxonomy file content
 *
 * Extracts the scpToolMetadata: [...] array and parses each entry.
 *
 * Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Means 1
 * Citation: scp.types.ts - SCPQualityMetadata type
 *
 * @param content - The muxonomy file content
 * @returns Array of SCPQualityMetadata or empty array if not found
 */
export function parseScpToolMetadata(content: string): SCPQualityMetadata[] {
  const tools: SCPQualityMetadata[] = [];

  // Find the scpToolMetadata array block
  // Match: scpToolMetadata: [ ... ]
  const metadataBlockMatch = content.match(/scpToolMetadata\s*:\s*\[([^\]]*(?:\{[^}]*\}[^]]*)*)\]/s);
  if (!metadataBlockMatch) {
    return tools;
  }

  const blockContent = metadataBlockMatch[1];

  // Parse each tool entry object
  // This regex captures each {...} block within the array
  const toolBlockRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let toolMatch;

  while ((toolMatch = toolBlockRegex.exec(blockContent)) !== null) {
    const toolContent = toolMatch[1];

    try {
      // Extract qualityName
      const qualityNameMatch = toolContent.match(/qualityName\s*:\s*['"]([^'"]+)['"]/);
      if (!qualityNameMatch) continue;
      const qualityName = qualityNameMatch[1];

      // Extract toolName
      const toolNameMatch = toolContent.match(/toolName\s*:\s*['"]([^'"]+)['"]/);
      if (!toolNameMatch) continue;
      const toolName = toolNameMatch[1];

      // Extract description (may be multi-line)
      const descriptionMatch = toolContent.match(/description\s*:\s*['"]([^'"]+)['"]|description\s*:\s*['"]([^'"]*)['"]\s*\+\s*['"]([^'"]+)['"]/);
      const description = descriptionMatch
        ? (descriptionMatch[1] || (descriptionMatch[2] + descriptionMatch[3]) || '')
        : '';

      // Extract toolType
      const toolTypeMatch = toolContent.match(/toolType\s*:\s*['"]([^'"]+)['"]/);
      const toolType = (toolTypeMatch?.[1] as 'informative' | 'actionable') || 'informative';

      // Extract handlerType
      const handlerTypeMatch = toolContent.match(/handlerType\s*:\s*['"]([^'"]+)['"]/);
      const handlerType = (handlerTypeMatch?.[1] as 'quality' | 'strategy') || 'quality';

      // Extract strategyName
      const strategyNameMatch = toolContent.match(/strategyName\s*:\s*['"]([^'"]*)['"]/);
      const strategyName = strategyNameMatch?.[1] || '';

      // Extract relatedActionables array
      const relatedMatch = toolContent.match(/relatedActionables\s*:\s*\[([^\]]*)\]/);
      const relatedActionables: string[] = [];
      if (relatedMatch) {
        const relatedContent = relatedMatch[1];
        const relatedItems = relatedContent.match(/['"]([^'"]+)['"]/g);
        if (relatedItems) {
          relatedActionables.push(...relatedItems.map(s => s.replace(/['"]/g, '')));
        }
      }

      // Parse inputSchema (simplified - captures type, properties, required)
      let inputSchema = { type: 'object' as const, properties: {}, required: [] as string[] };
      const schemaMatch = toolContent.match(/inputSchema\s*:\s*\{([^}]*)\}/);
      if (schemaMatch) {
        const schemaContent = schemaMatch[1];
        const typeMatch = schemaContent.match(/type\s*:\s*['"]([^'"]+)['"]/);
        if (typeMatch) {
          inputSchema = { ...inputSchema, type: typeMatch[1] as 'object' };
        }
      }

      tools.push({
        qualityName,
        toolName,
        description,
        inputSchema,
        toolType,
        handlerType,
        strategyName,
        relatedActionables,
      });
    } catch (err) {
      console.warn('[StratiVERSE] Could not parse SCP tool metadata entry:', err);
    }
  }

  return tools;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert camelCase or kebab-case to PascalCase
 *
 * @param str - The input string
 * @returns PascalCase version
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^(\w)/, (_, c) => c.toUpperCase());
}

/**
 * Convert PascalCase or kebab-case to camelCase
 *
 * @param str - The input string
 * @returns camelCase version
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^(\w)/, (_, c) => c.toLowerCase());
}

/**
 * Extract concept name from path
 *
 * @param conceptPath - Path like '/path/to/concepts/strativerse'
 * @returns Concept name like 'strativerse'
 */
export function extractConceptName(conceptPath: string): string {
  const parts = conceptPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}
