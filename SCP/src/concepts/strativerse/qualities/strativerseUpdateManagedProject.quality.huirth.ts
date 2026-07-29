import { createQualityCardWithPayload, defaultMethodCreator, selectPayload } from 'stratimux';
import { type StrativerseState, type ProjectEntry } from '../strativerse.type';

export type StrativerseUpdateManagedProjectPayload = {
  projectPath: string;
  updates: Partial<ProjectEntry>;
};

export const strativerseUpdateManagedProject = createQualityCardWithPayload<StrativerseState, StrativerseUpdateManagedProjectPayload>({
  type: 'Strativerse Update Managed Project',
  reducer: (state, action) => {
    const payload = selectPayload<StrativerseUpdateManagedProjectPayload>(action);
    if (payload) {
      return {
        managedProjects: state.managedProjects.map(project =>
          project.path === payload.projectPath
            ? { ...project, ...payload.updates }
            : project
        )
      };
    }
    return {};
  },
  methodCreator: defaultMethodCreator,
});
