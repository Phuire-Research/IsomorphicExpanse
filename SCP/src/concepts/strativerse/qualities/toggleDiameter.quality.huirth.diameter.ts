/**
 * toggleDiameter Quality - Huirth Diameter (Server-side Executor)
 *
 * Performs the actual file rename to enable/disable Induction pattern (diameter) on a quality.
 * Note: Principles do NOT have diameter - they are behavioral, simply included/excluded.
 *
 * Citation: FORWARD-PASS-POC-2-3-MUXONOMY-CONFIGURATION.md
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 *
 * Diameter Toggle:
 * - qualityName.quality.huirth.ts        ↔ qualityName.quality.huirth.diameter.ts
 * - qualityName.quality.client.ts        ↔ qualityName.quality.client.diameter.ts
 * - qualityName.quality.ts               → Cannot have diameter (All deployment)
 *
 * SCOPE: Only Managed Concepts (hasMuxonomy: true)
 * ASPECT: Only Qualities (principles don't have diameter)
 *
 * Type: 'Strativerse Toggle Diameter' (Verbose Split)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  createAsyncMethodWithState,
  strategySuccess,
  strategyFailed,
  strategyData_appendFailure,
  strategyData_muxifyData,
  muxiumConclude,
} from 'stratimux';
import fs from 'fs/promises';
import path from 'path';
import {
  type StrativerseState,
  type StrativerseModelDeck,
  type TriggerToggleDiameterPayload,
  type MuxonomyModificationResult,
  DeploymentTarget,
} from '../strativerse.type';
import {
  parseQualityFileName,
  generateQualityFileName,
} from '../model/fileNaming.model';

export const strativerseToggleDiameter = createQualityCardWithPayload<
  StrativerseState,
  TriggerToggleDiameterPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Toggle Diameter',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action, state }) => {
      const { conceptName, qualityName, enableDiameter } = action.payload;

      console.log('[StratiVERSE] Toggle Diameter: Executing', {
        conceptName,
        qualityName,
        enableDiameter,
      });

      // Find concept in state
      const concept = state.conceptList.concepts.find(c => c.name === conceptName);
      if (!concept) {
        const error = `Concept not found: ${conceptName}`;
        console.error('[StratiVERSE] Toggle Diameter:', error);
        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Find the quality
      const quality = concept.qualities.find(q => q.name === qualityName);
      if (!quality) {
        const error = `Quality not found: ${qualityName}`;
        console.error('[StratiVERSE] Toggle Diameter:', error);
        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Parse current filename
      const parsed = parseQualityFileName(quality.fileName);

      // Validate: Cannot enable diameter on DeploymentTarget.All
      if (enableDiameter && parsed.deploymentTarget === DeploymentTarget.All) {
        const error = 'Cannot enable diameter on DeploymentTarget.All - quality must be Huirth or Client';
        console.error('[StratiVERSE] Toggle Diameter:', error);
        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Check if toggle is needed
      if (parsed.diameter === enableDiameter) {
        console.log('[StratiVERSE] Toggle Diameter: No change needed, diameter already', enableDiameter ? 'enabled' : 'disabled');
        if (action.strategy) {
          const result: MuxonomyModificationResult = {
            success: true,
            conceptName,
            aspectName: qualityName,
            oldFileName: quality.fileName,
            newFileName: quality.fileName,
          };
          controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { modificationResult: result })));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      // Generate new filename with toggled diameter
      const newFileName = generateQualityFileName(parsed.qualityName, parsed.deploymentTarget, enableDiameter);
      const qualitiesDir = path.join(concept.path, 'qualities');
      const newFilePath = path.join(qualitiesDir, newFileName);

      console.log('[StratiVERSE] Toggle Diameter: Renaming', {
        from: quality.filePath,
        to: newFilePath,
      });

      fs.rename(quality.filePath, newFilePath)
        .then(() => {
          console.log('[StratiVERSE] Toggle Diameter: Rename successful');

          const result: MuxonomyModificationResult = {
            success: true,
            conceptName,
            aspectName: qualityName,
            oldFileName: quality.fileName,
            newFileName,
          };

          if (action.strategy) {
            controller.fire(strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { modificationResult: result })
            ));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[StratiVERSE] Toggle Diameter: Rename failed', error);

          const result: MuxonomyModificationResult = {
            success: false,
            conceptName,
            aspectName: qualityName,
            oldFileName: quality.fileName,
            newFileName,
            error: error.message,
          };

          if (action.strategy) {
            controller.fire(strategyFailed(
              action.strategy,
              strategyData_appendFailure(action.strategy, `Toggle diameter failed: ${error.message}`)
            ));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
