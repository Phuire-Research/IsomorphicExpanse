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

export type ToggleSyncManagedPayload = {
  conceptName: string;
  projectName?: string;
};

export type StrativerseToggleSyncManaged = Quality<StrativerseState, ToggleSyncManagedPayload>;

export const strativerseToggleSyncManaged = createQualityCardWithPayload<
  StrativerseState,
  ToggleSyncManagedPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Toggle Sync Managed',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action, state }) => {
      const { conceptName, projectName } = action.payload;

      console.log('[StratiVERSE] Toggle Sync Managed:', {
        conceptName,
        projectName: projectName || 'ADMIN_SCP',
      });

      let projectRoot: string;
      let concept;
      if (!projectName || projectName === 'ADMIN_SCP') {
        projectRoot = process.cwd();
        concept = state.conceptList.concepts.find(c => c.name === conceptName);
      } else {
        const project = state.managedProjects.find(p => p.name === projectName);
        if (!project) {
          const error = 'Project not found: ' + projectName;
          console.error('[StratiVERSE] Toggle Sync Managed:', error);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
          } else {
            controller.fire(muxiumConclude());
          }
          return;
        }
        projectRoot = project.path;
        concept = project.conceptEntries.find(c => c.name === conceptName);
      }

      if (!concept || !concept.hasMuxonomy) {
        const error = 'Concept not found or has no muxonomy: ' + conceptName;
        console.error('[StratiVERSE] Toggle Sync Managed:', error);
        if (action.strategy) {
          controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, error)));
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      const muxonomyPath = path.join(concept.path, conceptName + '.muxonomy.ts');

      fs.readFile(muxonomyPath, 'utf-8')
        .then((content) => {
          const syncManagedMatch = content.match(/syncManaged\s*:\s*(true|false)/);
          const currentValue = syncManagedMatch ? syncManagedMatch[1] === 'true' : false;
          const newValue = !currentValue;

          let updatedContent: string;
          if (syncManagedMatch) {
            updatedContent = content.replace(/syncManaged\s*:\s*(true|false)/, 'syncManaged: ' + newValue);
          } else {
            const directionRegex = /(direction\s*:\s*'[^']*'\s*,)/;
            if (directionRegex.test(content)) {
              updatedContent = content.replace(directionRegex, '$1\n    syncManaged: ' + newValue + ',');
            } else {
              const syncStartRegex = /(sync\s*:\s*\{)/;
              if (syncStartRegex.test(content)) {
                updatedContent = content.replace(syncStartRegex, '$1\n    syncManaged: ' + newValue + ',');
              } else {
                throw new Error('No sync block found in muxonomy: ' + muxonomyPath);
              }
            }
          }

          console.log('[StratiVERSE] Toggle Sync Managed: Writing syncManaged=' + newValue + ' to ' + muxonomyPath);

          return fs.writeFile(muxonomyPath, updatedContent).then(() => newValue);
        })
        .then((newValue) => {
          console.log('[StratiVERSE] Toggle Sync Managed: Success');
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, {
              conceptName: conceptName,
              projectName: projectName || 'ADMIN_SCP',
              syncManaged: newValue,
            })));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[StratiVERSE] Toggle Sync Managed: Failed', error);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, 'Toggle sync managed failed: ' + error.message)));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
