import {
  createQualityCard,
  defaultMethodCreator,
  strategyData_select,
  type Quality,
} from 'stratimux';
import type { StrativerseState } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';
import type { StrativerseReadManagedProjectsFileDataField } from './strativerseReadManagedProjectsFile.quality.huirth';

export type StrativerseSetManagedProjects = Quality<StrativerseState>;

export const strativerseSetManagedProjects = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Set Managed Projects',
  reducer: (state, action) => {
    if (action.strategy) {
      const data = strategyData_select<StrativerseReadManagedProjectsFileDataField>(action.strategy);
      if (data) {
        return { managedProjects: data.managedProjects };
      }
    }
    return {};
  },
  methodCreator: defaultMethodCreator,
});
