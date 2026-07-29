/**
 * Demometric Interchange Strategy - Complete Location Change Orchestration
 *
 * Orchestrates the complete sequence of operations when a Quality's
 * deployment location changes via StratiVERSE.
 *
 * 7-Step Bridge Restart Manifold:
 * 1. updateMuxonomyDemometer → Update source of truth
 * 2. renameQualityFile → Move file to new location
 * 3. updateSourceConcept → Source concept gets Induction (or pruned)
 * 4. updateTargetConcept → Target concept gets Real import
 * 5. cascadeImportPaths → Update external imports
 * 6. buildClient → Recompile client with new file locations
 * 7. bridgeRestartToggle → Toggle restart file, server restarts
 *
 * Post-Step-7 Bridge Transition Phase (External):
 * - Nodemon detects toggle file change
 * - Server process terminates
 * - New server spawns with new code
 * - Clients detect connection loss
 * - Clients ping /mcp until server responds
 * - Clients execute window.location.reload()
 * - Clients reconnect with stored clientStateId
 *
 * Muxonomy Paths as Whitelist: Only files listed in demometers are modified.
 *
 * Citation: POC-2-6-DEMOMETRIC-INTERCHANGE-WORKGAMEBOARD.md
 * Citation: BRIDGE-RESTART-MANIFOLD-SPECIFICATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 */
import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { StrativerseConcept } from '../strativerse.concept';
import type { GrepConcept } from '../../grep/grep.concept';
import type { FileSystemConcept } from '../../fileSystem/fileSystem.concept';
import { DeploymentTarget } from '../../muxonomy/muxonomy.model';
import * as path from 'path';

/**
 * Payload for Demometric Interchange
 *
 * Includes payload detection for correct Induction creation:
 * - hasPayload: true → createDiametricQualityWithPayload
 * - hasPayload: false → createDiametricQuality
 */
export type DemometricInterchangePayload = {
  conceptName: string;
  conceptPath: string;
  qualityName: string;
  qualityTypeString: string;
  oldTarget: DeploymentTarget;
  newTarget: DeploymentTarget;
  diameter: boolean;
  stateTypeName: string;
  deckTypeName: string;
  // Payload detection for asymmetric Induction creation
  hasPayload: boolean;
  payloadTypeName?: string;  // Required if hasPayload is true
};

/**
 * Derive file suffix from DeploymentTarget
 */
function getTargetSuffix(target: DeploymentTarget, diameter: boolean): string {
  if (target === DeploymentTarget.All) {
    return diameter ? '.diameter' : '';
  }
  const targetStr = target === DeploymentTarget.Client ? 'client' : 'huirth';
  return diameter ? `.${targetStr}.diameter` : `.${targetStr}`;
}

/**
 * Get concept file suffix for a target
 */
function getConceptFileSuffix(target: DeploymentTarget): string {
  if (target === DeploymentTarget.All) return '';
  return target === DeploymentTarget.Client ? '' : '.huirth';
}

/**
 * Derive old and new file paths from quality name and targets
 */
function deriveFilePaths(
  qualityName: string,
  oldTarget: DeploymentTarget,
  newTarget: DeploymentTarget,
  diameter: boolean
): { oldFilePath: string; newFilePath: string } {
  // Extract base name from quality name (e.g., 'notificationHelloWorld' → 'helloWorld')
  const baseName = qualityName.replace(/^[a-z]+/, '').replace(/^[A-Z]/, c => c.toLowerCase());

  const oldSuffix = getTargetSuffix(oldTarget, diameter);
  const newSuffix = getTargetSuffix(newTarget, diameter);

  return {
    oldFilePath: `qualities/${baseName}.quality${oldSuffix}.ts`,
    newFilePath: `qualities/${baseName}.quality${newSuffix}.ts`,
  };
}

/**
 * Create Demometric Interchange Strategy
 *
 * @param deck - Muxium deck for selectStratiDECK access
 * @param payload - Interchange configuration
 */
export function createDemometricInterchangeStrategy(
  deck: unknown,
  payload: DemometricInterchangePayload
): ActionStrategy | undefined {

  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');
  const grepDeck = selectStratiDECK<GrepConcept>(deck, 'grep');
  const fileSystemDeck = selectStratiDECK<FileSystemConcept>(deck, 'fileSystem');

  if (!strativerseDeck) {
    console.error('[Demometric] Failed to access strativerse deck');
    return undefined;
  }

  if (!grepDeck) {
    console.error('[Demometric] Failed to access grep deck');
    return undefined;
  }

  const {
    conceptName,
    conceptPath,
    qualityName,
    qualityTypeString,
    oldTarget,
    newTarget,
    diameter,
    stateTypeName,
    deckTypeName,
    hasPayload,
    payloadTypeName,
  } = payload;

  // Derive file paths
  const { oldFilePath, newFilePath } = deriveFilePaths(qualityName, oldTarget, newTarget, diameter);
  const muxonomyFilePath = path.join(conceptPath, `${conceptName}.muxonomy.ts`);

  // Determine concept file paths
  const sourceConceptSuffix = getConceptFileSuffix(oldTarget);
  const targetConceptSuffix = getConceptFileSuffix(newTarget);
  const sourceConceptPath = path.join(conceptPath, `${conceptName}.concept${sourceConceptSuffix}.ts`);
  const targetConceptPath = path.join(conceptPath, `${conceptName}.concept${targetConceptSuffix}.ts`);

  console.log('[Demometric] Creating interchange strategy:', {
    conceptName,
    qualityName,
    oldTarget,
    newTarget,
    diameter,
    oldFilePath,
    newFilePath,
    sourceConceptPath,
    targetConceptPath,
  });

  // Determine location string for muxonomy
  const newLocationStr = newTarget === DeploymentTarget.Client ? 'Client' :
                         newTarget === DeploymentTarget.Huirth ? 'Huirth' : 'All';

  // =============================================
  // BUILD STRATEGY NODE GRAPH (Bottom-Up)
  // =============================================

  // Step 7 (FINAL): Trigger bridge restart
  // Server restarts after this step - no further nodes execute
  const bridgeRestartNode = createActionNode(
    strativerseDeck.e.strativerseBridgeRestartToggle({}),
    {
      successNotes: {
        preposition: 'Finally',
        denoter: 'bridge restart triggered - server will restart with new code.'
      }
    }
  );

  // Step 6: Build client with new file locations
  const buildNode = createActionNode(
    strativerseDeck.e.strativerseBuildClient({ conceptPath }),
    {
      successNode: bridgeRestartNode,
      successNotes: {
        preposition: 'then',
        denoter: 'client rebuilt with new file locations;'
      }
    }
  );

  // Step 5: Cascade import paths in other files
  const cascadeNode = createActionNode(
    grepDeck.e.grepCascadeImportPaths({ conceptPath }),
    {
      successNode: buildNode,
      successNotes: {
        preposition: 'then',
        denoter: 'import paths cascaded in dependent files;'
      }
    }
  );

  // Step 4: Update target concept (gains Real import)
  // Only if target is different from source
  let targetConceptNode = cascadeNode;
  if (sourceConceptPath !== targetConceptPath && diameter) {
    targetConceptNode = createActionNode(
      grepDeck.e.grepUpdateDemometricConcept({
        conceptFilePath: targetConceptPath,
        qualityName,
        qualityTypeString,
        qualityFileName: newFilePath.replace('qualities/', ''),
        stateTypeName,
        deckTypeName,
        mode: 'toReal',
        hasPayload,
        payloadTypeName,
      }),
      {
        successNode: cascadeNode,
        successNotes: {
          preposition: 'then',
          denoter: `target concept updated with Real import;`
        }
      }
    );
  }

  // Step 3: Update source concept (gains Induction or pruned)
  // Only if diameter is true and source is different from target
  let sourceConceptNode = targetConceptNode;
  if (sourceConceptPath !== targetConceptPath && diameter) {
    sourceConceptNode = createActionNode(
      grepDeck.e.grepUpdateDemometricConcept({
        conceptFilePath: sourceConceptPath,
        qualityName,
        qualityTypeString,
        qualityFileName: newFilePath.replace('qualities/', ''),
        stateTypeName,
        deckTypeName,
        mode: 'toInduction',
        hasPayload,
        payloadTypeName,
      }),
      {
        successNode: targetConceptNode,
        successNotes: {
          preposition: 'then',
          denoter: `source concept updated with Induction;`
        }
      }
    );
  }

  // Step 2: Rename quality file
  let renameNode = sourceConceptNode;
  if (oldFilePath !== newFilePath && fileSystemDeck) {
    const oldFullPath = path.join(conceptPath, oldFilePath);
    const newFullPath = path.join(conceptPath, newFilePath);

    renameNode = createActionNode(
      fileSystemDeck.e.fileSystemRenameFile({
        oldPath: oldFullPath,
        newPath: newFullPath,
      }),
      {
        successNode: sourceConceptNode,
        successNotes: {
          preposition: 'then',
          denoter: `quality file renamed: ${oldFilePath} → ${newFilePath};`
        }
      }
    );
  }

  // Step 1: Update muxonomy demometer (Source of Truth)
  const muxonomyNode = createActionNode(
    grepDeck.e.grepUpdateMuxonomyDemometer({
      muxonomyFilePath,
      qualityName,
      newLocation: newLocationStr as 'Client' | 'Huirth' | 'All',
      newFilePath,
    }),
    {
      successNode: renameNode,
      successNotes: {
        preposition: 'First',
        denoter: `muxonomy demometer updated for ${qualityName};`
      }
    }
  );

  return createStrategy({
    topic: 'Demometric Interchange - Quality Location Change',
    initialNode: muxonomyNode,
    data: {
      ...payload,
      oldFilePath,
      newFilePath,
      sourceConceptPath,
      targetConceptPath,
      muxonomyFilePath,
      initTimestamp: Date.now(),
    }
  });
}
