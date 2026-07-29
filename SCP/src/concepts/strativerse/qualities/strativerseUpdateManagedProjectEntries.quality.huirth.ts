import { createQualityCard, defaultMethodCreator, strategyData_select, type Quality } from 'stratimux';
import type { StrativerseState, ProjectEntry } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';
import type { StrativerseScanManagedProjectsDataField } from './strativerseScanManagedProjects.quality.huirth';

export type StrativerseUpdateManagedProjectEntries = Quality<StrativerseState>;

export const strativerseUpdateManagedProjectEntries = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Update Managed Project Entries',
  reducer: (state, action) => {
    if (action.strategy) {
      const data = strategyData_select<StrativerseScanManagedProjectsDataField>(action.strategy);
      if (data && data.scannedProjects) {
        const updatedProjects = state.managedProjects.map((project: ProjectEntry) => {
          const scanned = data.scannedProjects.find(s => s.projectName === project.name);
          if (scanned) {
            return {
              ...project,
              conceptEntries: scanned.conceptEntries,
              concepts: scanned.conceptEntries.map(c => c.name),
              lastScanned: scanned.lastScanned,
            };
          }
          return project;
        });
        return { managedProjects: updatedProjects };
      }
    }
    return {};
  },
  methodCreator: defaultMethodCreator,
});
