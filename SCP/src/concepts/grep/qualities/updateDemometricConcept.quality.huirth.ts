/**
 * updateDemometricConcept Quality - Huirth Deployment
 *
 * Updates a concept definition file to switch between Real and Induction patterns.
 * Uses the Muxonomy paths as whitelist for bounded operations.
 *
 * Mode: toInduction
 * - Removes Real Quality import
 * - Adds Diametric import (if not present)
 * - Adds Induction creation (if not present)
 * - Updates qualities registration to use Induction assignment
 *
 * Mode: toReal
 * - Adds Real Quality import
 * - Removes Induction creation
 * - Updates qualities registration to use direct reference
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data"
 *
 * Type: 'Grep Update Demometric Concept' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  strategySuccess,
  strategyFailed,
  strategyData_muxifyData,
  strategyData_appendFailure,
  muxiumConclude,
  type Quality,
  type MuxiumDeck,
} from 'stratimux';
import type { GrepState } from '../grep.type';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Payload for updateDemometricConcept
 *
 * Includes payload detection for asymmetric Induction creation:
 * - hasPayload: true → createDiametricQualityWithPayload<State, Payload, Deck>
 * - hasPayload: false → createDiametricQuality<State, Deck>
 */
export type GrepUpdateDemometricConceptPayload = {
  conceptFilePath: string;        // Full path to concept file
  qualityName: string;            // 'notificationHelloWorld'
  qualityTypeString: string;      // 'Notification Hello World'
  qualityFileName: string;        // 'helloWorld.quality.huirth.diameter.ts' (new location)
  stateTypeName: string;          // 'NotificationState'
  deckTypeName: string;           // 'NotificationModelDeck'
  mode: 'toInduction' | 'toReal'; // Transformation direction
  // Payload detection for asymmetric Induction creation
  hasPayload: boolean;
  payloadTypeName?: string;       // Required if hasPayload is true
};

export type GrepUpdateDemometricConcept = Quality<
  GrepState,
  GrepUpdateDemometricConceptPayload,
  MuxiumDeck
>;

/**
 * Generate Induction creation code block (payload-aware)
 *
 * Creates the correct Induction quality based on payload detection:
 * - hasPayload: true → createDiametricQualityWithPayload<State, Payload, Deck>
 * - hasPayload: false → createDiametricQuality<State, Deck>
 */
function generateInductionCreation(
  qualityName: string,
  qualityTypeString: string,
  stateTypeName: string,
  deckTypeName: string,
  hasPayload: boolean,
  payloadTypeName?: string
): string {
  if (hasPayload && payloadTypeName) {
    return `const ${qualityName}Induction = createDiametricQualityWithPayload<
  WithDiametricState<${stateTypeName}>,
  ${payloadTypeName},
  ${deckTypeName}
>('${qualityTypeString}');`;
  }
  return `const ${qualityName}Induction = createDiametricQuality<
  WithDiametricState<${stateTypeName}>,
  ${deckTypeName}
>('${qualityTypeString}');`;
}

/**
 * Generate Real Quality import line
 */
function generateRealImport(qualityName: string, qualityFileName: string): string {
  const importPath = qualityFileName.replace(/\.ts$/, '');
  return `import { ${qualityName} } from './qualities/${importPath}';`;
}

export const grepUpdateDemometricConcept = createQualityCardWithPayload<
  GrepState,
  GrepUpdateDemometricConceptPayload,
  MuxiumDeck
>({
  type: 'Grep Update Demometric Concept',
  reducer: (state) => state,
  methodCreator: () =>
    createAsyncMethodWithConcepts(async ({ controller, action }) => {
      const {
        conceptFilePath,
        qualityName,
        qualityTypeString,
        qualityFileName,
        stateTypeName,
        deckTypeName,
        mode,
        hasPayload,
        payloadTypeName,
      } = action.payload;

      console.log('[Grep] Updating demometric concept:', {
        conceptFilePath,
        qualityName,
        mode,
      });

      try {
        // Read the concept file
        const content = await fs.readFile(conceptFilePath, 'utf-8');
        let updatedContent = content;

        if (mode === 'toInduction') {
          // =============================================
          // MODE: toInduction
          // Remove Real import, add Induction pattern
          // =============================================

          // 1. Remove existing Real Quality import for this quality
          const realImportPattern = new RegExp(
            `import\\s*\\{[^}]*\\b${qualityName}\\b[^}]*\\}\\s*from\\s*['"]\\.\\/qualities\\/[^'"]+['"];?\\n?`,
            'g'
          );

          // Check if this is a multi-import line
          const multiImportMatch = content.match(
            new RegExp(`import\\s*\\{([^}]*)\\b${qualityName}\\b([^}]*)\\}\\s*from\\s*['"](\\.\/qualities\\/[^'"]+)['"];?`)
          );

          if (multiImportMatch) {
            const beforeQuality = multiImportMatch[1];
            const afterQuality = multiImportMatch[2];
            const importPath = multiImportMatch[3];

            // Check if there are other imports on this line
            const otherImports = (beforeQuality + afterQuality)
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0 && s !== qualityName);

            if (otherImports.length > 0) {
              // Keep the import line but remove just this quality
              const newImportLine = `import { ${otherImports.join(', ')} } from '${importPath}';`;
              updatedContent = updatedContent.replace(multiImportMatch[0], newImportLine);
            } else {
              // Remove the entire import line
              updatedContent = updatedContent.replace(realImportPattern, '');
            }
          } else {
            updatedContent = updatedContent.replace(realImportPattern, '');
          }

          // 2. Ensure Diametric import exists (payload-aware)
          // Check for the specific function we need based on hasPayload
          const diametricFunctionName = hasPayload ? 'createDiametricQualityWithPayload' : 'createDiametricQuality';
          const diametricImportExists = new RegExp(
            `import\\s*\\{[^}]*${diametricFunctionName}[^}]*\\}\\s*from\\s*['"]\\.\\.\\/(muxonomy\\/)?diametric\\.model['"]`
          ).test(updatedContent);

          if (!diametricImportExists) {
            // Add diametric import after the last COMPLETE import statement
            // CRITICAL: Must distinguish imports from export re-exports
            // Multi-line exports like `export { x } from '...'` have `} from '...'` without 'export' on that line
            // Solution: Find all IMPORT statements (single-line and multi-line) and get the last one

            // Match both single-line and multi-line import statements
            // Single-line: import { x } from '...';
            // Multi-line: import {\n  x,\n} from '...';
            const importBlockPattern = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*from\s*['"][^'"]+['"]\s*;?/gs;
            const importMatches = updatedContent.match(importBlockPattern);

            if (importMatches && importMatches.length > 0) {
              const lastImport = importMatches[importMatches.length - 1];
              // Generate payload-aware import
              const diametricImport = hasPayload
                ? `import {\n  createDiametricQualityWithPayload,\n  type WithDiametricState,\n} from '../muxonomy/diametric.model';`
                : `import {\n  createDiametricQuality,\n  type WithDiametricState,\n} from '../muxonomy/diametric.model';`;
              updatedContent = updatedContent.replace(
                lastImport,
                `${lastImport}\n${diametricImport}`
              );
            }
          }

          // 3. Add Induction creation if not exists
          const inductionExists = new RegExp(`const\\s+${qualityName}Induction\\s*=`).test(updatedContent);

          if (!inductionExists) {
            // Find the QUALITIES REGISTRATION section and add before it
            const qualitiesRegMatch = updatedContent.match(
              /(\/\/\s*=+\s*\n\/\/\s*QUALITIES REGISTRATION\s*\n\/\/\s*=+)/
            );

            if (qualitiesRegMatch) {
              const inductionCode = generateInductionCreation(
                qualityName,
                qualityTypeString,
                stateTypeName,
                deckTypeName,
                hasPayload,
                payloadTypeName
              );
              updatedContent = updatedContent.replace(
                qualitiesRegMatch[0],
                `${inductionCode}\n\n${qualitiesRegMatch[0]}`
              );
            }
          }

          // 4. Update qualities registration to use Induction
          // Pattern: qualityName, → qualityName: qualityNameInduction,
          const directUsagePattern = new RegExp(
            `(\\s+)(${qualityName})(,)`,
            'g'
          );
          updatedContent = updatedContent.replace(
            directUsagePattern,
            `$1${qualityName}: ${qualityName}Induction$3`
          );

        } else {
          // =============================================
          // MODE: toReal
          // Add Real import, remove Induction pattern
          // =============================================

          // 1. Add Real Quality import
          const realImportExists = new RegExp(
            `import\\s*\\{[^}]*\\b${qualityName}\\b[^}]*\\}\\s*from\\s*['"]\\.\\/qualities\\/`
          ).test(updatedContent);

          if (!realImportExists) {
            const realImport = generateRealImport(qualityName, qualityFileName);
            // Add after the last COMPLETE import statement
            // CRITICAL: Must distinguish imports from export re-exports
            // Multi-line exports like `export { x } from '...'` have `} from '...'` without 'export' on that line
            // Solution: Find all IMPORT statements (single-line and multi-line) and get the last one

            // Match both single-line and multi-line import statements
            const importBlockPattern = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*from\s*['"][^'"]+['"]\s*;?/gs;
            const importMatches = updatedContent.match(importBlockPattern);

            if (importMatches && importMatches.length > 0) {
              const lastImport = importMatches[importMatches.length - 1];
              updatedContent = updatedContent.replace(
                lastImport,
                `${lastImport}\n${realImport}`
              );
            }
          }

          // 2. Remove Induction creation (handles both payload and no-payload variants)
          // Pattern must match both:
          // - createDiametricQuality<State, Deck>('Type String');
          // - createDiametricQualityWithPayload<State, Payload, Deck>('Type String');
          const inductionPattern = new RegExp(
            `const\\s+${qualityName}Induction\\s*=\\s*createDiametricQuality(?:WithPayload)?<[^>]+>(?:<[^>]+>)?(?:<[^>]+>)?\\([^)]+\\);?\\n*`,
            'g'
          );
          updatedContent = updatedContent.replace(inductionPattern, '');

          // 3. Update qualities registration to use direct reference
          // Pattern: qualityName: qualityNameInduction, → qualityName,
          const inductionUsagePattern = new RegExp(
            `(\\s+)(${qualityName}):\\s*${qualityName}Induction(,)`,
            'g'
          );
          updatedContent = updatedContent.replace(
            inductionUsagePattern,
            `$1$2$3`
          );
        }

        // Write the updated content
        await fs.writeFile(conceptFilePath, updatedContent, 'utf-8');

        console.log('[Grep] Demometric concept updated successfully:', {
          conceptFilePath,
          mode,
        });

        if (action.strategy) {
          controller.fire(
            strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, {
                demometricUpdate: {
                  conceptFilePath,
                  qualityName,
                  mode,
                  success: true,
                },
              })
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[Grep] Failed to update demometric concept:', errorMessage);

        if (action.strategy) {
          controller.fire(
            strategyFailed(
              action.strategy,
              strategyData_appendFailure(action.strategy, `Demometric update failed: ${errorMessage}`)
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }
      }
    }),
});
