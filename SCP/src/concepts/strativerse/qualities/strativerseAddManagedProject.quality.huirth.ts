import { createQualityCardWithPayload, defaultMethodCreator, selectPayload } from 'stratimux';
import { type StrativerseState, type ProjectEntry } from '../strativerse.type';

export type StrativerseAddManagedProjectPayload = ProjectEntry;

export const strativerseAddManagedProject = createQualityCardWithPayload<StrativerseState, StrativerseAddManagedProjectPayload>({
  type: 'Strativerse Add Managed Project',
  reducer: (state, action) => {
    const payload = selectPayload<StrativerseAddManagedProjectPayload>(action);
    if (payload) {
      return {
        managedProjects: [...state.managedProjects, payload]
      };
    }
    return {};
  },
  methodCreator: defaultMethodCreator,
});
