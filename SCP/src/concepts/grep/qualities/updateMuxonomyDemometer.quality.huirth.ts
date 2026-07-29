/**
 * updateMuxonomyDemometer Quality - Huirth Deployment
 *
 * Updates the demometers.qualities array in a muxonomy file to reflect
 * a new deployment location for a quality.
 *
 * The muxonomy file is the Source of Truth for quality locations.
 * This quality updates:
 * - demometers.qualities[qualityName].location
 * - demometers.qualities[qualityName].filePath
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data"
 *
 * Type: 'Grep Update Muxonomy Demometer' (Verbose Split)
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
import type { GrepState, GrepUpdateMuxonomyDemometerPayload } from '../grep.type';
import * as fs from 'fs/promises';

export type GrepUpdateMuxonomyDemometer = Quality<
  GrepState,
  GrepUpdateMuxonomyDemometerPayload,
  MuxiumDeck
>;

export const grepUpdateMuxonomyDemometer = createQualityCardWithPayload<
  GrepState,
  GrepUpdateMuxonomyDemometerPayload,
  MuxiumDeck
>({
  type: 'Grep Update Muxonomy Demometer',
  reducer: (state) => state,
  methodCreator: () =>
    createAsyncMethodWithConcepts(async ({ controller, action }) => {
      const {
        muxonomyFilePath,
        qualityName,
        newLocation,
        newFilePath,
      } = action.payload;

      console.log('[Grep] Updating muxonomy demometer:', {
        muxonomyFilePath,
        qualityName,
        newLocation,
        newFilePath,
      });

      try {
        // Read the muxonomy file
        const content = await fs.readFile(muxonomyFilePath, 'utf-8');

        // Find the quality entry in demometers.qualities array
        // Pattern matches the quality object: { name: 'qualityName', ... location: DeploymentTarget.X, ... }
        const qualityPattern = new RegExp(
          `(\\{[^}]*name:\\s*['"]${qualityName}['"][^}]*)(location:\\s*DeploymentTarget\\.)(\\w+)([^}]*)(filePath:\\s*['"])([^'"]+)(['"][^}]*\\})`,
          's'
        );

        // Alternative pattern where filePath comes before location
        const qualityPatternAlt = new RegExp(
          `(\\{[^}]*name:\\s*['"]${qualityName}['"][^}]*)(filePath:\\s*['"])([^'"]+)(['"][^}]*)(location:\\s*DeploymentTarget\\.)(\\w+)([^}]*\\})`,
          's'
        );

        let updatedContent = content;
        let matched = false;

        // Try first pattern (location before filePath)
        if (qualityPattern.test(content)) {
          updatedContent = content.replace(
            qualityPattern,
            `$1$2${newLocation}$4$5${newFilePath}$7`
          );
          matched = true;
        }
        // Try alternative pattern (filePath before location)
        else if (qualityPatternAlt.test(content)) {
          updatedContent = content.replace(
            qualityPatternAlt,
            `$1$2${newFilePath}$4$5${newLocation}$7`
          );
          matched = true;
        }

        if (!matched) {
          throw new Error(`Quality '${qualityName}' not found in muxonomy demometers`);
        }

        // Write the updated content
        await fs.writeFile(muxonomyFilePath, updatedContent, 'utf-8');

        console.log('[Grep] Muxonomy demometer updated successfully:', {
          muxonomyFilePath,
          qualityName,
          newLocation,
          newFilePath,
        });

        if (action.strategy) {
          controller.fire(
            strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, {
                muxonomyUpdate: {
                  muxonomyFilePath,
                  qualityName,
                  newLocation,
                  newFilePath,
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
        console.error('[Grep] Failed to update muxonomy demometer:', errorMessage);

        if (action.strategy) {
          controller.fire(
            strategyFailed(
              action.strategy,
              strategyData_appendFailure(action.strategy, `Muxonomy update failed: ${errorMessage}`)
            )
          );
        } else {
          controller.fire(muxiumConclude());
        }
      }
    }),
});
