import {
  createQualityCard,
  nullReducer,
  strategySuccess,
  strategyData_muxifyData,
  createAsyncMethodWithConcepts,
  muxiumConclude,
  type Quality,
} from 'stratimux';
import type { StrativerseState, ProjectEntry, ConceptEntry } from '../strativerse.type';
import type { StrativerseDeck } from '../strativerse.concept';
import { scanConceptsDirectory } from '../model/conceptScanner.model';
import path from 'path';

export type StrativerseScanManagedProjects = Quality<StrativerseState>;

export type StrativerseScanManagedProjectsDataField = {
  scannedProjects: Array<{
    projectName: string;
    conceptEntries: ConceptEntry[];
    lastScanned: number;
  }>;
};

export const strativerseScanManagedProjects = createQualityCard<
  StrativerseState,
  StrativerseDeck
>({
  type: 'Strativerse Scan Managed Projects',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, deck, concepts_ }) => {
      const state = deck.strativerse.k.getState(concepts_) as StrativerseState;
      const managedProjects: ProjectEntry[] = state?.managedProjects || [];

      if (managedProjects.length === 0) {
        console.log('[ManagedProjects] No managed projects to scan');
        if (action.strategy) {
          const dataField: StrativerseScanManagedProjectsDataField = { scannedProjects: [] };
          controller.fire(
            strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, dataField))
          );
        } else {
          controller.fire(muxiumConclude());
        }
        return;
      }

      console.log('[ManagedProjects] Scanning', managedProjects.length, 'managed projects');

      const scanPromises = managedProjects.map((project) => {
        const scanPath = path.join(project.path, 'src', 'concepts');
        return scanConceptsDirectory(scanPath)
          .then((conceptEntries) => ({
            projectName: project.name,
            conceptEntries,
            lastScanned: Date.now(),
          }))
          .catch((error) => {
            console.warn('[ManagedProjects] Failed to scan project:', project.name, error);
            return {
              projectName: project.name,
              conceptEntries: [] as ConceptEntry[],
              lastScanned: Date.now(),
            };
          });
      });

      Promise.all(scanPromises)
        .then((scannedProjects) => {
          console.log('[ManagedProjects] Scanned all projects:', scannedProjects.map(p => p.projectName));
          if (action.strategy) {
            const dataField: StrativerseScanManagedProjectsDataField = { scannedProjects };
            controller.fire(
              strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, dataField))
            );
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error('[ManagedProjects] Scan failed:', error);
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
