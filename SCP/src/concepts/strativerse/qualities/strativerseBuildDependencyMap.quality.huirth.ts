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
import type { StrativerseState, StrativerseModelDeck } from '../strativerse.type';
import { buildConceptDependencyMap } from '../model/conceptDependencyMap.model';

export type BuildDependencyMapPayload = {
  projectPath?: string;
};

export type StrativerseBuildDependencyMap = Quality<StrativerseState, BuildDependencyMapPayload>;

export const strativerseBuildDependencyMap = createQualityCardWithPayload<
  StrativerseState,
  BuildDependencyMapPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Build Dependency Map',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action }) => {
      const projectPath = action.payload.projectPath || process.cwd();

      console.log('[StratiVERSE] Build Dependency Map:', { projectPath });

      buildConceptDependencyMap(projectPath)
        .then((dependencyMap) => {
          console.log('[StratiVERSE] Build Dependency Map: Success', Object.keys(dependencyMap.dependencies).length, 'concepts analyzed');
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, dependencyMap)));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[StratiVERSE] Build Dependency Map: Failed', error);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, 'Build dependency map failed: ' + error.message)));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
