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
import fs from 'fs/promises';
import path from 'path';

export type DetectConceptChangesPayload = {
  conceptName?: string;
  projectName?: string;
};

type ConceptSyncStatus = {
  conceptName: string;
  projectName: string;
  projectPath: string;
  syncManaged: boolean;
  syncVersion: number;
  hasMuxonomy: boolean;
  lastSyncedFrom: string;
  lastSyncedAt: number;
  lastSyncedVersion: number;
};

type DetectConceptChangesResult = {
  statuses: ConceptSyncStatus[];
  conflicts: string[];
  summary: string;
};

const LOG = '[StratiVERSE] DetectConceptChanges:';

async function readSyncVersionFromDisk(conceptDir: string, conceptName: string): Promise<number> {
  const muxonomyPath = path.join(conceptDir, conceptName + '.muxonomy.ts');
  try {
    const content = await fs.readFile(muxonomyPath, 'utf-8');
    const match = content.match(/syncVersion\s*:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  } catch {
    return 0;
  }
}

export const strativerseDetectConceptChanges = createQualityCardWithPayload<
  StrativerseState,
  DetectConceptChangesPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Detect Concept Changes',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action, state }) => {
      const payload = action.payload;
      const managedProjects = state.managedProjects;
      const statuses: ConceptSyncStatus[] = [];
      const conflicts: string[] = [];

      const filteredProjects = managedProjects.filter(
        (p) => !payload.projectName || p.name === payload.projectName
      );

      const projectChecks = filteredProjects.map(async (project) => {
        const conceptsPath = path.join(project.path, 'src', 'concepts');

        for (const entry of project.conceptEntries) {
          if (payload.conceptName && entry.name !== payload.conceptName) continue;

          const diskVersion = await readSyncVersionFromDisk(
            path.join(conceptsPath, entry.name),
            entry.name
          );

          const configManaged = entry.muxonomyConfig ? entry.muxonomyConfig.syncManaged : false;
          const syncMeta = project.conceptSyncMetadata[entry.name];

          statuses.push({
            conceptName: entry.name,
            projectName: project.name,
            projectPath: project.path,
            syncManaged: configManaged,
            syncVersion: diskVersion,
            hasMuxonomy: entry.hasMuxonomy,
            lastSyncedFrom: syncMeta ? syncMeta.lastSyncedFrom : '',
            lastSyncedAt: syncMeta ? syncMeta.lastSyncedAt : 0,
            lastSyncedVersion: syncMeta ? syncMeta.syncVersion : 0,
          });

          if (configManaged && syncMeta && syncMeta.syncVersion !== diskVersion) {
            conflicts.push(
              entry.name + ' in ' + project.name +
              ': disk syncVersion=' + diskVersion +
              ' vs metadata syncVersion=' + syncMeta.syncVersion
            );
          }
        }
      });

      Promise.all(projectChecks)
        .then(() => {
          const syncManagedCount = statuses.filter((s) => s.syncManaged).length;
          const summary = 'Scanned ' + statuses.length + ' concepts across ' +
            filteredProjects.length + ' projects. ' +
            syncManagedCount + ' sync-managed. ' +
            conflicts.length + ' version conflicts detected.';

          console.log(LOG, summary);

          const result: DetectConceptChangesResult = { statuses, conflicts, summary };

          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, result)));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error(LOG, 'Detection failed:', error);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, 'Detection failed: ' + error.message)));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});

export type StrativerseDetectConceptChangesQuality = Quality<StrativerseState, DetectConceptChangesPayload>;
