/**
 * strativerseSyncWatcher Principle - Chokidar-based File Watcher
 *
 * Single-Stage Architecture (Suite 7 Rose Diagnostic Fix):
 * - Stage 1: Unified monitoring - fires on selector changes, creates watchers directly
 * - No stage navigation needed - selector-based firing handles data availability
 *
 * Version Halting Pattern:
 * - Each change event reads syncVersion from disk
 * - Compares with stored lastKnownVersion per watcher
 * - If different: external change → trigger sync
 * - If same: internal write → halt (no retrigger)
 *
 * Chokidar Configuration (Grounded via Web Search):
 * - awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 }
 * - Single watcher per concept directory
 * - Dynamic add/remove on conceptList changes
 *
 * Citation: Crystraline 6 Diamond Plan - Phase B
 * Citation: POC-4-STRATIVERSE-PROJECT-MANAGEMENT-WORKGAMEBOARD.md
 * Citation: Suite 7 Rose Diagnostic - Single-stage architecture fix
 */
import { watch, FSWatcher } from 'chokidar';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { StrativersePrinciple } from '../strativerse.concept';
import type { ConceptEntry, ProjectEntry } from '../strativerse.type';

const LOG = '[SyncWatcher]';
const DBG = '[SyncWatcher:DBG]';  // Isolatable debug tag for diagnostic tracing

type WatcherEntry = {
  watcher: FSWatcher;
  conceptName: string;
  projectName: string;
  conceptPath: string;
  lastKnownSyncVersion: number;
};

var activeWatchers: Map<string, WatcherEntry> = new Map();

function generateWatcherKey(projectName: string, conceptName: string): string {
  return projectName + ':' + conceptName;
}

function readSyncVersionFromMuxonomy(conceptPath: string, conceptName: string): number {
  try {
    var muxonomyPath = join(conceptPath, conceptName + '.muxonomy.ts');
    var content = readFileSync(muxonomyPath, 'utf-8');
    var match = content.match(/syncVersion:\s*(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (e) {
    console.log(LOG, 'Could not read syncVersion from', conceptPath, e);
  }
  return 0;
}

function getSyncManagedConcepts(
  conceptEntries: ConceptEntry[],
  projectName: string,
  projectPath: string
): Array<{ conceptName: string; conceptPath: string; projectName: string; syncVersion: number }> {
  var result: Array<{ conceptName: string; conceptPath: string; projectName: string; syncVersion: number }> = [];

  for (var i = 0; i < conceptEntries.length; i++) {
    var entry = conceptEntries[i];
    if (entry.muxonomyConfig && entry.muxonomyConfig.syncManaged) {
      var conceptPath = join(projectPath, 'src/concepts', entry.name);
      result.push({
        conceptName: entry.name,
        conceptPath: conceptPath,
        projectName: projectName,
        syncVersion: entry.muxonomyConfig.syncVersion || 0,
      });
    }
  }

  return result;
}

function closeWatcher(key: string): void {
  var entry = activeWatchers.get(key);
  if (entry) {
    console.log(LOG, 'Closing watcher for', key);
    entry.watcher.close();
    activeWatchers.delete(key);
  }
}

export const strativerseSyncWatcher: StrativersePrinciple = ({ k_, d_, plan, nextA }) => {
  console.log(LOG, 'Principle initialized');
  console.log(DBG, 'activeWatchers.size at init:', activeWatchers.size);

  return plan('SyncWatcher File Monitor', ({ stage, stageO, conclude }) => [
    stageO(),
    // Single unified stage: fires on selector changes, creates/updates watchers
    stage(({ dispatch, k }) => {
      console.log(DBG, 'Watcher stage ENTERED');

      var conceptList = k.conceptList.select();
      var managedProjects = k.managedProjects.select();

      console.log(DBG, 'conceptList.concepts.length:', conceptList.concepts.length);
      console.log(DBG, 'managedProjects.length:', managedProjects.length);

      // Collect all syncManaged concepts across all projects
      var allSyncManagedConcepts: Array<{ conceptName: string; conceptPath: string; projectName: string; syncVersion: number }> = [];

      // From ADMIN_SCP (conceptList)
      for (var i = 0; i < conceptList.concepts.length; i++) {
        var entry = conceptList.concepts[i];
        if (entry.muxonomyConfig && entry.muxonomyConfig.syncManaged) {
          console.log(DBG, 'Found ADMIN syncManaged:', entry.name);
          allSyncManagedConcepts.push({
            conceptName: entry.name,
            conceptPath: entry.path,
            projectName: 'ADMIN_SCP',
            syncVersion: entry.muxonomyConfig.syncVersion || 0,
          });
        }
      }

      // From managed projects
      for (var p = 0; p < managedProjects.length; p++) {
        var project = managedProjects[p];
        if (project.status === 'active' && project.conceptEntries) {
          var syncManaged = getSyncManagedConcepts(project.conceptEntries, project.name, project.path);
          for (var sm = 0; sm < syncManaged.length; sm++) {
            console.log(DBG, 'Found project syncManaged:', project.name, '/', syncManaged[sm].conceptName);
          }
          allSyncManagedConcepts = allSyncManagedConcepts.concat(syncManaged);
        }
      }

      console.log(LOG, 'Total syncManaged concepts:', allSyncManagedConcepts.length, 'activeWatchers:', activeWatchers.size);

      // Determine watchers to add/remove
      var currentKeys = new Set(activeWatchers.keys());
      var neededKeys = new Set<string>();

      for (var j = 0; j < allSyncManagedConcepts.length; j++) {
        var concept = allSyncManagedConcepts[j];
        var key = generateWatcherKey(concept.projectName, concept.conceptName);
        neededKeys.add(key);

        if (!activeWatchers.has(key)) {
          // Create new watcher
          console.log(LOG, 'Creating watcher for', key, 'at', concept.conceptPath);

          var watcher = watch(concept.conceptPath, {
            ignoreInitial: true,
            persistent: true,
            depth: 99,
            awaitWriteFinish: {
              stabilityThreshold: 500,
              pollInterval: 100,
            },
          });

          var watcherEntry: WatcherEntry = {
            watcher: watcher,
            conceptName: concept.conceptName,
            projectName: concept.projectName,
            conceptPath: concept.conceptPath,
            lastKnownSyncVersion: concept.syncVersion,
          };

          // Bind change event
          (function(we: WatcherEntry) {
            we.watcher.on('change', function(filePath: string) {
              console.log(LOG, 'File changed:', filePath, 'in', we.conceptName);

              // Read current syncVersion from disk
              var currentSyncVersion = readSyncVersionFromMuxonomy(we.conceptPath, we.conceptName);

              if (currentSyncVersion !== we.lastKnownSyncVersion) {
                console.log(LOG, 'SyncVersion changed:', we.lastKnownSyncVersion, '->', currentSyncVersion);
                console.log(LOG, 'External change detected — sync required');
                we.lastKnownSyncVersion = currentSyncVersion;
                // TODO: Dispatch sync action when conceptSynchronize is available
                // nextA(d_.strativerse.e.strativerseConceptSynchronize({ conceptName: we.conceptName, ... }));
              } else {
                console.log(LOG, 'SyncVersion unchanged — halting (internal write)');
              }
            });

            we.watcher.on('error', function(error: Error) {
              console.error(LOG, 'Watcher error for', we.conceptName, error);
            });

            we.watcher.on('ready', function() {
              console.log(LOG, 'Watcher ready for', we.conceptName);
            });
          })(watcherEntry);

          activeWatchers.set(key, watcherEntry);
        }
      }

      // Remove watchers for concepts no longer syncManaged
      currentKeys.forEach(function(key) {
        if (!neededKeys.has(key)) {
          closeWatcher(key);
        }
      });

      // Stay in this stage - fire again when selectors change
      // throttle: 0 with selectors means fire immediately on selector change
      dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
    }, {
      selectors: [k_.conceptList, k_.managedProjects],
      beat: 3,  // Hardware protection for throttle: 0
    }),

    conclude(),
  ]);
};
