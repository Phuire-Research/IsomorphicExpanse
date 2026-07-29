import {
  createQualityCard,
  nullReducer,
  strategyData_muxifyData,
  strategySuccess,
  createAsyncMethodWithConcepts,
  muxiumConclude,
  type Quality,
} from 'stratimux';
import type { StrativerseState, ProjectEntry } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';
import {
  readManagedProjectsFile,
  projectEntryFromFileEntry,
} from '../model/managedProjects.model';

export type StrativerseReadManagedProjectsFile = Quality<StrativerseState>;

export type StrativerseReadManagedProjectsFileDataField = {
  managedProjects: ProjectEntry[];
};

export const strativerseReadManagedProjectsFile = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Read Managed Projects File',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action }) => {
      console.log('[ManagedProjects] Reading .managed-projects.json...');
      readManagedProjectsFile()
        .then((fileData) => {
          const managedProjects = fileData.projects.map(projectEntryFromFileEntry);
          console.log('[ManagedProjects] Read', managedProjects.length, 'projects from file');
          if (action.strategy) {
            const dataField: StrativerseReadManagedProjectsFileDataField = {
              managedProjects,
            };
            controller.fire(
              strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, dataField)
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[ManagedProjects] Failed to read file:', error);
          if (action.strategy) {
            const dataField: StrativerseReadManagedProjectsFileDataField = {
              managedProjects: [],
            };
            controller.fire(
              strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, dataField)
              )
            );
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
