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
import fs from 'fs/promises';
import path from 'path';
import type { StrativerseState, StrativerseModelDeck } from '../strativerse.type';
import { buildConceptDependencyMap } from '../model/conceptDependencyMap.model';

// Phase B: Idempotency check helper functions (prevent duplicate registrations)
function isRegisteredInPrinciple(content: string, conceptName: string): boolean {
  // Check if muxonomy import already exists in vue.principle.ts
  return content.includes(conceptName + 'Muxonomic');
}

function isRegisteredInIslandWrapper(content: string, conceptName: string): boolean {
  // Check if island registry entry already exists in IslandWrapper.vue
  const pattern = new RegExp(conceptName + ':\\s*\\(\\)\\s*=>\\s*import');
  return pattern.test(content);
}

export type ConceptSynchronizePayload = {
  conceptName: string;
  sourceProjectPath: string;
  targetProjectPath: string;
};

export type StrativerseConceptSynchronize = Quality<StrativerseState, ConceptSynchronizePayload>;

export const strativerseConceptSynchronize = createQualityCardWithPayload<
  StrativerseState,
  ConceptSynchronizePayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Concept Synchronize',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action }) => {
      const { conceptName, sourceProjectPath, targetProjectPath } = action.payload;
      const LOG = '[StratiVERSE Sync]';

      console.log(LOG, 'Starting sync:', { conceptName, sourceProjectPath, targetProjectPath });

      const sourceConceptPath = path.join(sourceProjectPath, 'src', 'concepts', conceptName);
      const targetConceptPath = path.join(targetProjectPath, 'src', 'concepts', conceptName);
      const sourceMuxonomyPath = path.join(sourceConceptPath, conceptName + '.muxonomy.ts');
      const targetMuxonomyPath = path.join(targetConceptPath, conceptName + '.muxonomy.ts');

      fs.access(sourceConceptPath)
        .then(() => fs.access(sourceMuxonomyPath))
        .then(() => {
          console.log(LOG, 'Source concept validated:', sourceConceptPath);
          return buildConceptDependencyMap(sourceProjectPath);
        })
        .then((depMap) => {
          const conceptDeps = depMap.dependencies[conceptName];
          if (!conceptDeps) {
            throw new Error('Concept not found in dependency map: ' + conceptName);
          }
          console.log(LOG, 'Dependencies:', conceptDeps.importedFrom);

          return fs.readdir(path.join(targetProjectPath, 'src', 'concepts'), { withFileTypes: true })
            .then((entries) => {
              const targetConcepts = entries.filter(e => e.isDirectory()).map(e => e.name);
              const missingDeps = conceptDeps.importedFrom.filter(dep => !targetConcepts.includes(dep));
              if (missingDeps.length > 0) {
                throw new Error('Missing dependencies in target: ' + missingDeps.join(', '));
              }
              console.log(LOG, 'All dependencies present in target');
              return conceptDeps;
            });
        })
        .then((conceptDeps) => {
          return fs.readFile(sourceMuxonomyPath, 'utf-8')
            .then((content) => {
              const versionMatch = content.match(/syncVersion\s*:\s*(\d+)/);
              const currentVersion = versionMatch ? parseInt(versionMatch[1], 10) : 0;
              console.log(LOG, 'Current syncVersion:', currentVersion);
              return { currentVersion, conceptDeps };
            });
        })
        .then(({ currentVersion, conceptDeps }) => {
          console.log(LOG, 'Copying', sourceConceptPath, '->', targetConceptPath);
          return fs.cp(sourceConceptPath, targetConceptPath, { recursive: true, force: true })
            .then(() => ({ currentVersion, conceptDeps }));
        })
        .then(({ currentVersion, conceptDeps }) => {
          // Phase A: Parse target muxonomy for navigation config and enabled status
          return fs.readFile(targetMuxonomyPath, 'utf-8')
            .then((targetMuxonomyContent) => {
              const hasNavigation = /navigation\s*:\s*\w+Navigation/.test(targetMuxonomyContent) ||
                                   /navigation\s*:\s*\{/.test(targetMuxonomyContent);
              const isExplicitlyDisabled = /enabled\s*:\s*false/.test(targetMuxonomyContent);
              const shouldRegisterIsland = hasNavigation && !isExplicitlyDisabled;

              console.log(LOG, 'Island registration check:', { hasNavigation, isExplicitlyDisabled, shouldRegisterIsland });
              return { currentVersion, conceptDeps, shouldRegisterIsland, targetMuxonomyContent };
            });
        })
        .then(({ currentVersion, conceptDeps, shouldRegisterIsland }) => {
          const newVersion = currentVersion + 1;
          console.log(LOG, 'Incrementing syncVersion to', newVersion);

          const updateSyncVersion = (filePath: string): Promise<void> => {
            return fs.readFile(filePath, 'utf-8').then((content) => {
              const versionRegex = /syncVersion\s*:\s*\d+/;
              let updated: string;
              if (versionRegex.test(content)) {
                updated = content.replace(versionRegex, 'syncVersion: ' + newVersion);
              } else {
                const insertAfter = /(syncManaged\s*:\s*(?:true|false)\s*,|direction\s*:\s*'[^']*'\s*,)/;
                if (insertAfter.test(content)) {
                  updated = content.replace(insertAfter, '$1\n    syncVersion: ' + newVersion + ',');
                } else {
                  const syncBlock = /(sync\s*:\s*\{)/;
                  if (syncBlock.test(content)) {
                    updated = content.replace(syncBlock, '$1\n    syncVersion: ' + newVersion + ',');
                  } else {
                    console.warn(LOG, 'No sync block in', filePath);
                    return Promise.resolve();
                  }
                }
              }
              return fs.writeFile(filePath, updated);
            });
          };

          return Promise.all([
            updateSyncVersion(sourceMuxonomyPath),
            updateSyncVersion(targetMuxonomyPath),
          ]).then(() => ({ newVersion, conceptDeps, shouldRegisterIsland }));
        })
        .then(({ newVersion, conceptDeps, shouldRegisterIsland }) => {
          // Phase C: Register muxonomy in vue.principle.ts (if shouldRegisterIsland)
          if (!shouldRegisterIsland) {
            console.log(LOG, 'No navigation config or disabled, skipping island registration');
            return { newVersion, conceptDeps, registrationStatus: 'skipped' };
          }

          const vuePrinciplePath = path.join(targetProjectPath, 'src', 'concepts', 'vue', 'vue.principle.ts');

          return fs.readFile(vuePrinciplePath, 'utf-8')
            .then((principleContent) => {
              if (isRegisteredInPrinciple(principleContent, conceptName)) {
                console.log(LOG, 'Already registered in vue.principle.ts');
                return { newVersion, conceptDeps, registrationStatus: 'already-registered', principleContent };
              }

              // Insert muxonomy import (after muxonomy.model import)
              const importPattern = /import \{ type MuxonomicConfig.*\} from '\.\.\/muxonomy\/muxonomy\.model';/;
              const importReplacement = "$&\nimport { " + conceptName + "Muxonomic } from '../" + conceptName + "/" + conceptName + ".muxonomy';";
              let updated = principleContent.replace(importPattern, importReplacement);

              // Insert REGISTERED_MUXONOMICS entry (after DEFAULT_LANDING_MUXONOMIC)
              const registryPattern = /DEFAULT_LANDING_MUXONOMIC,/;
              const registryReplacement = "DEFAULT_LANDING_MUXONOMIC,\n  " + conceptName + "Muxonomic,";
              updated = updated.replace(registryPattern, registryReplacement);

              console.log(LOG, 'Registering muxonomy in vue.principle.ts');
              return fs.writeFile(vuePrinciplePath, updated)
                .then(() => ({ newVersion, conceptDeps, registrationStatus: 'registered-principle', principleContent: updated }));
            });
        })
        .then(({ newVersion, conceptDeps, registrationStatus }) => {
          // Phase D: Register island in IslandWrapper.vue
          if (registrationStatus === 'skipped') {
            return { newVersion, conceptDeps, registrationStatus };
          }

          const islandWrapperPath = path.join(targetProjectPath, 'src', 'concepts', 'vue', 'IslandWrapper.vue');
          const pascalName = conceptName.charAt(0).toUpperCase() + conceptName.slice(1);

          return fs.readFile(islandWrapperPath, 'utf-8')
            .then((wrapperContent) => {
              if (isRegisteredInIslandWrapper(wrapperContent, conceptName)) {
                console.log(LOG, 'Already registered in IslandWrapper.vue');
                const finalStatus = registrationStatus === 'already-registered'
                  ? 'already-registered'
                  : registrationStatus + '+already-in-wrapper';
                return { newVersion, conceptDeps, registrationStatus: finalStatus };
              }

              // Insert island registry entry (after DefaultLanding.vue)
              const registryPattern = /default:\s*\(\)\s*=>\s*import\(['"]\.\.\/(vue\/vue\/)?DefaultLanding\.vue['"]\),/;
              const registryReplacement = "$&\n    " + conceptName + ": () => import('../" + conceptName + "/vue/" + pascalName + "Landing.vue'),";
              const updated = wrapperContent.replace(registryPattern, registryReplacement);

              console.log(LOG, 'Registering island in IslandWrapper.vue');
              return fs.writeFile(islandWrapperPath, updated)
                .then(() => ({ newVersion, conceptDeps, registrationStatus: 'fully-registered' }));
            });
        })
        .then(({ newVersion, conceptDeps, registrationStatus }) => {
          console.log(LOG, 'Sync complete:', { conceptName, syncVersion: newVersion, islandRegistration: registrationStatus });
          if (action.strategy) {
            controller.fire(strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, {
              conceptName,
              sourceProjectPath,
              targetProjectPath,
              syncVersion: newVersion,
              importedFrom: conceptDeps.importedFrom,
              importedBy: conceptDeps.importedBy,
              islandRegistration: registrationStatus,
            })));
          } else {
            controller.fire(muxiumConclude());
          }
        })
        .catch((error) => {
          console.error(LOG, 'Sync failed:', error.message);
          if (action.strategy) {
            controller.fire(strategyFailed(action.strategy, strategyData_appendFailure(action.strategy, 'Concept sync failed: ' + error.message)));
          } else {
            controller.fire(muxiumConclude());
          }
        });
    }),
});
