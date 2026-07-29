import {
  createQualityCard,
  nullReducer,
  strategySuccess,
  createAsyncMethodWithConcepts,
  muxiumConclude,
  type Quality,
  type Concepts,
} from 'stratimux';
import type { StrativerseState, ProjectEntry } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';
import {
  writeManagedProjectsFile,
  fileEntryFromProjectEntry,
} from '../model/managedProjects.model';

export type StrativerseWriteManagedProjectsFile = Quality<StrativerseState>;

export const strativerseWriteManagedProjectsFile = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Write Managed Projects File',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, deck, concepts_ }) => {
      console.log('[ManagedProjects] Writing managedProjects to .managed-projects.json...');
      const state = deck.strativerse.k.getState(concepts_) as StrativerseState;
      const managedProjects: ProjectEntry[] = state?.managedProjects || [];
      const fileEntries = managedProjects.map(fileEntryFromProjectEntry);
      writeManagedProjectsFile({
        version: 1,
        lastUpdated: Date.now(),
        projects: fileEntries,
      })
        .then(() => {
          console.log('[ManagedProjects] Written', fileEntries.length, 'projects to file');
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[ManagedProjects] Failed to write file:', error);
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
