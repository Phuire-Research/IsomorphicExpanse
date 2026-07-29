/**
 * strativerseIncrementConceptVersion - Increments concept syncVersion for SyncWatcher
 *
 * This quality increments the syncVersion field in a concept's muxonomy.ts file.
 * Used by SCP Actionable Strategy Manifold to trigger automatic concept synchronization.
 *
 * Pattern:
 * - SCP Actionable tool modifies concept files
 * - VERSION_UPDATE node calls this quality with conceptName
 * - syncVersion incremented → SyncWatcher detects "external change"
 * - SyncWatcher triggers sync to managed projects
 *
 * Halting Complete: Every SCP Actionable now properly triggers sync via version change.
 *
 * Citation: Crystraline 6 Diamond Plan - SCP Actionable Demometer
 * Citation: strativerseSyncWatcher.principle.huirth.ts - Version Halting Pattern
 *
 * Type: 'Strativerse Increment Concept Version' (Verbose Split)
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
  type Quality,
} from 'stratimux';
import fs from 'fs/promises';
import path from 'path';
import type { StrativerseState, StrativerseModelDeck } from '../strativerse.type';

export type IncrementConceptVersionPayload = {
  conceptName: string;
  projectName?: string;
};

export type StrativerseIncrementConceptVersion = Quality<StrativerseState, IncrementConceptVersionPayload>;

export const strativerseIncrementConceptVersion = createQualityCardWithPayload<
  StrativerseState,
  IncrementConceptVersionPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Increment Concept Version',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action, state }) => {
      // Support both payload AND strategy.data sources for SCP Manifold chain compatibility
      // When called from SCP Actionable Manifold, values come via strategy.data
      // When called directly, values come via payload
      var strategyData = (action.strategy?.data || {}) as Record<string, unknown>;
      var specification = strategyData.specification as Record<string, unknown> | undefined;
      var conceptName = action.payload.conceptName || (strategyData.conceptName as string) || (specification?.conceptName as string);
      var projectName = action.payload.projectName || (strategyData.projectName as string);

      console.log('[StratiVERSE] Increment Concept Version:', {
        conceptName: conceptName,
        projectName: projectName || 'ADMIN_SCP',
      });

      var projectRoot: string;
      var concept;

      if (!projectName || projectName === 'ADMIN_SCP') {
        projectRoot = process.cwd();
        concept = state.conceptList.concepts.find(function(c) { return c.name === conceptName; });
      } else {
        var project = state.managedProjects.find(function(p) { return p.name === projectName; });
        if (!project) {
          var error = 'Project not found: ' + projectName;
          console.error('[StratiVERSE] Increment Concept Version:', error);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
          } else {
            controller.fire(muxiumConclude());
          }
          return;
        }
        projectRoot = project.path;
        concept = project.conceptEntries.find(function(c) { return c.name === conceptName; });
      }

      if (!concept || !concept.hasMuxonomy) {
        var notFoundError = 'Concept not found or has no muxonomy: ' + conceptName;
        console.error('[StratiVERSE] Increment Concept Version:', notFoundError);
        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, notFoundError)));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      var muxonomyPath = path.join(concept.path, conceptName + '.muxonomy.ts');

      fs.readFile(muxonomyPath, 'utf-8')
        .then(function(content) {
          var syncVersionMatch = content.match(/syncVersion\s*:\s*(\d+)/);
          var previousVersion = syncVersionMatch ? parseInt(syncVersionMatch[1], 10) : 0;
          var newVersion = previousVersion + 1;

          var updatedContent: string;
          if (syncVersionMatch) {
            updatedContent = content.replace(/syncVersion\s*:\s*\d+/, 'syncVersion: ' + newVersion);
          } else {
            var syncManagedRegex = /(syncManaged\s*:\s*(true|false)\s*,)/;
            if (syncManagedRegex.test(content)) {
              updatedContent = content.replace(syncManagedRegex, '$1\n    syncVersion: ' + newVersion + ',');
            } else {
              var directionRegex = /(direction\s*:\s*'[^']*'\s*,)/;
              if (directionRegex.test(content)) {
                updatedContent = content.replace(directionRegex, '$1\n    syncVersion: ' + newVersion + ',');
              } else {
                var syncStartRegex = /(sync\s*:\s*\{)/;
                if (syncStartRegex.test(content)) {
                  updatedContent = content.replace(syncStartRegex, '$1\n    syncVersion: ' + newVersion + ',');
                } else {
                  throw new Error('No sync block found in muxonomy: ' + muxonomyPath);
                }
              }
            }
          }

          console.log('[StratiVERSE] Increment Concept Version: Writing syncVersion=' + newVersion + ' to ' + muxonomyPath);

          return fs.writeFile(muxonomyPath, updatedContent).then(function() {
            return { previousVersion: previousVersion, newVersion: newVersion };
          });
        })
        .then(function(result) {
          console.log('[StratiVERSE] Increment Concept Version: Success', {
            conceptName: conceptName,
            previousVersion: result.previousVersion,
            newVersion: result.newVersion,
          });
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, {
              conceptName: conceptName,
              projectName: projectName || 'ADMIN_SCP',
              previousVersion: result.previousVersion,
              newVersion: result.newVersion,
              versionIncremented: true,
            })));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch(function(error) {
          console.error('[StratiVERSE] Increment Concept Version: Failed', error);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, 'Increment concept version failed: ' + error.message)));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
