import {
  createQualityCard,
  defaultReducer,
  strategySuccess,
  strategyData_muxifyData,
  createMethodWithConcepts,
  muxiumConclude,
  type Quality,
} from 'stratimux';
import type { StrativerseState } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';

export type StrativerseListManagedProjects = Quality<StrativerseState>;

export const strativerseListManagedProjects = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse List Managed Projects',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck, concepts_ }) => {
      const state = deck.strativerse.k.getState(concepts_) as StrativerseState;
      const managedProjects = state.managedProjects;
      const response = {
        title: 'Managed Projects Registry',
        description: 'Current managed projects from .managed-projects.json persistence layer',
        count: managedProjects.length,
        projects: managedProjects,
        pairedActionables: ['strativerse_project_create'],
        relatedTools: [
          'strativerse_project_create_info',
          'strativerse_concept_create',
          'strativerse_concept_remove',
        ],
      };
      if (action.strategy) {
        return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, response));
      }
      return muxiumConclude();
    }),
});
