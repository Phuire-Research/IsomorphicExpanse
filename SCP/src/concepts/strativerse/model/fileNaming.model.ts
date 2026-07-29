/**
 * File Naming Convention Parser
 *
 * Parses Muxonomic file naming convention to extract:
 * - DeploymentTarget (All | Huirth | Client)
 * - Diameter (true | false) - qualities only
 *
 * File Naming Patterns:
 * - qualityName.quality.[location].[diameter].ts
 * - principleName.principle.[location].ts
 * - strategyName.strategy.[location].ts
 *
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 */

import { DeploymentTarget } from '../../muxonomy/muxonomy.model';

// ============================================
// PARSED RESULT TYPES
// ============================================

export type ParsedQualityFileName = {
  qualityName: string;
  deploymentTarget: DeploymentTarget;
  diameter: boolean;
  isValid: boolean;
};

export type ParsedPrincipleFileName = {
  principleName: string;
  deploymentTarget: DeploymentTarget;
  isValid: boolean;
};

export type ParsedStrategyFileName = {
  strategyName: string;
  location: DeploymentTarget | null; // null = universal (deprecated)
  isValid: boolean;
};

// ============================================
// FILE NAME REGEX PATTERNS
// ============================================

/**
 * Quality file pattern: qualityName.quality.[location].[diameter].ts
 *
 * Groups:
 * 1. qualityName (everything before .quality)
 * 2. location (huirth | client | undefined)
 * 3. diameter (diameter | undefined)
 *
 * Examples:
 * - setConceptList.quality.ts → All, diameter: false
 * - scanConcepts.quality.huirth.ts → Huirth, diameter: false
 * - scanConcepts.quality.huirth.diameter.ts → Huirth, diameter: true
 */
const QUALITY_FILE_REGEX = /^(.+)\.quality(?:\.(huirth|client))?(?:\.(diameter))?\.ts$/;

/**
 * Principle file pattern: principleName.principle.[location].ts
 *
 * Groups:
 * 1. principleName (everything before .principle)
 * 2. location (huirth | client | undefined)
 *
 * Examples:
 * - main.principle.ts → All
 * - main.principle.huirth.ts → Huirth
 */
const PRINCIPLE_FILE_REGEX = /^(.+)\.principle(?:\.(huirth|client))?\.ts$/;

/**
 * Strategy file pattern: strategyName.strategy.[location].ts
 *
 * Groups:
 * 1. strategyName (everything before .strategy)
 * 2. location (huirth | client | undefined)
 *
 * Examples:
 * - initialization.strategy.ts → Universal (deprecated)
 * - initialization.strategy.huirth.ts → Huirth
 */
const STRATEGY_FILE_REGEX = /^(.+)\.strategy(?:\.(huirth|client))?\.ts$/;

// ============================================
// PARSING FUNCTIONS
// ============================================

/**
 * Parse quality file name to extract deployment metadata
 *
 * @param fileName - The file name (e.g., 'scanConcepts.quality.huirth.diameter.ts')
 * @returns Parsed result with qualityName, deploymentTarget, diameter
 */
export function parseQualityFileName(fileName: string): ParsedQualityFileName {
  const match = fileName.match(QUALITY_FILE_REGEX);

  if (!match) {
    return {
      qualityName: '',
      deploymentTarget: DeploymentTarget.All,
      diameter: false,
      isValid: false,
    };
  }

  const [, qualityName, location, diameterFlag] = match;

  let deploymentTarget: DeploymentTarget;
  switch (location) {
    case 'huirth':
      deploymentTarget = DeploymentTarget.Huirth;
      break;
    case 'client':
      deploymentTarget = DeploymentTarget.Client;
      break;
    default:
      deploymentTarget = DeploymentTarget.All;
  }

  return {
    qualityName,
    deploymentTarget,
    diameter: diameterFlag === 'diameter',
    isValid: true,
  };
}

/**
 * Parse principle file name to extract deployment metadata
 *
 * @param fileName - The file name (e.g., 'main.principle.huirth.ts')
 * @returns Parsed result with principleName, deploymentTarget
 */
export function parsePrincipleFileName(fileName: string): ParsedPrincipleFileName {
  const match = fileName.match(PRINCIPLE_FILE_REGEX);

  if (!match) {
    return {
      principleName: '',
      deploymentTarget: DeploymentTarget.All,
      isValid: false,
    };
  }

  const [, principleName, location] = match;

  let deploymentTarget: DeploymentTarget;
  switch (location) {
    case 'huirth':
      deploymentTarget = DeploymentTarget.Huirth;
      break;
    case 'client':
      deploymentTarget = DeploymentTarget.Client;
      break;
    default:
      deploymentTarget = DeploymentTarget.All;
  }

  return {
    principleName,
    deploymentTarget,
    isValid: true,
  };
}

/**
 * Parse strategy file name to extract location metadata
 *
 * @param fileName - The file name (e.g., 'initialization.strategy.huirth.ts')
 * @returns Parsed result with strategyName, location
 */
export function parseStrategyFileName(fileName: string): ParsedStrategyFileName {
  const match = fileName.match(STRATEGY_FILE_REGEX);

  if (!match) {
    return {
      strategyName: '',
      location: null,
      isValid: false,
    };
  }

  const [, strategyName, locationStr] = match;

  let location: DeploymentTarget | null;
  switch (locationStr) {
    case 'huirth':
      location = DeploymentTarget.Huirth;
      break;
    case 'client':
      location = DeploymentTarget.Client;
      break;
    default:
      location = null; // Universal (deprecated)
  }

  return {
    strategyName,
    location,
    isValid: true,
  };
}

// ============================================
// FILE NAME GENERATORS (For future MCP generation)
// ============================================

/**
 * Generate quality file name from metadata
 *
 * @param qualityName - The quality name (camelCase)
 * @param deploymentTarget - Where the quality runs
 * @param diameter - Whether this is a diameter junction
 * @returns The file name (e.g., 'scanConcepts.quality.huirth.diameter.ts')
 */
export function generateQualityFileName(
  qualityName: string,
  deploymentTarget: DeploymentTarget,
  diameter: boolean
): string {
  let fileName = `${qualityName}.quality`;

  if (deploymentTarget !== DeploymentTarget.All) {
    fileName += `.${deploymentTarget}`;
  }

  if (diameter) {
    fileName += '.diameter';
  }

  return `${fileName}.ts`;
}

/**
 * Generate principle file name from metadata
 *
 * @param principleName - The principle name (camelCase)
 * @param deploymentTarget - Where the principle runs
 * @returns The file name (e.g., 'main.principle.huirth.ts')
 */
export function generatePrincipleFileName(
  principleName: string,
  deploymentTarget: DeploymentTarget
): string {
  let fileName = `${principleName}.principle`;

  if (deploymentTarget !== DeploymentTarget.All) {
    fileName += `.${deploymentTarget}`;
  }

  return `${fileName}.ts`;
}

/**
 * Generate strategy file name from metadata
 *
 * @param strategyName - The strategy name (camelCase)
 * @param location - Where the strategy initializes (null = universal)
 * @returns The file name (e.g., 'initialization.strategy.huirth.ts')
 */
export function generateStrategyFileName(
  strategyName: string,
  location: DeploymentTarget | null
): string {
  let fileName = `${strategyName}.strategy`;

  if (location) {
    fileName += `.${location}`;
  }

  return `${fileName}.ts`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a file name is a quality file
 */
export function isQualityFile(fileName: string): boolean {
  return QUALITY_FILE_REGEX.test(fileName);
}

/**
 * Check if a file name is a principle file
 */
export function isPrincipleFile(fileName: string): boolean {
  return PRINCIPLE_FILE_REGEX.test(fileName);
}

/**
 * Check if a file name is a strategy file
 */
export function isStrategyFile(fileName: string): boolean {
  return STRATEGY_FILE_REGEX.test(fileName);
}
