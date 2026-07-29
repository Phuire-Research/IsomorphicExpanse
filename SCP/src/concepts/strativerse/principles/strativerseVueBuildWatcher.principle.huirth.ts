/**
 * strativerseVueBuildWatcher Principle - Auto-Rebuild on Vue File Changes
 *
 * Single-Stage Architecture (Same pattern as SyncWatcher):
 * - Stage 1: Selector-driven monitoring - fires on conceptList/managedProjects changes
 * - Creates per-project watchers watching all concept Vue directories with enabled islands
 * - Debounce pattern: 1.5s quiet period before triggering buildClient()
 *
 * Problem Solved:
 * - Phuire concept changes failed to transfer because client bundles weren't rebuilt after sync
 * - Manual `npm run build:client` required after every Vue change
 *
 * Solution:
 * - Monitor concept Vue directories for changes
 * - Debounce rapid changes (1.5s quiet period)
 * - Trigger buildClient() automatically
 * - Prevent concurrent builds with buildInProgress flag
 *
 * Detection Logic:
 * - Concept has enabled island if: muxonomyConfig.hasNavigation === true
 * - enabled !== false (defaults to true for backward compatibility)
 *
 * Chokidar Configuration:
 * - awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
 * - Vue files stabilize faster than general files
 * - depth: 2 (Vue directories are typically flat or 1-level deep)
 *
 * Citation: Crystraline 6 Diamond Plan - Vue Build Watcher
 * Citation: BREAKOUT-POC4-PHASE6-PHUIRE-SCP-HOSTING-READINESS.md
 * Citation: strativerseSyncWatcher.principle.huirth.ts (pattern reference)
 */
import { watch, FSWatcher } from 'chokidar';
import type { StrativersePrinciple } from '../strativerse.concept';
import type { ConceptEntry, ProjectEntry } from '../strativerse.type';
import { buildClient } from '../model/buildWrapper.model';
import { join } from 'path';

const LOG = '[VueBuildWatcher]';
const DBG = '[VueBuildWatcher:DBG]';

const VUE_BUILD_DEBOUNCE_MS = 1500;

type VueBuildWatcherEntry = {
  watcher: FSWatcher;
  projectName: string;
  projectPath: string;
  watchedConcepts: string[];
  buildInProgress: boolean;
};

var activeVueWatchers: Map<string, VueBuildWatcherEntry> = new Map();
var buildDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

function hasEnabledIsland(entry: ConceptEntry): boolean {
  if (!entry.muxonomyConfig) {
    return false;
  }
  return entry.muxonomyConfig.hasNavigation === true;
}

function getVueWatchTargets(
  conceptEntries: ConceptEntry[],
  projectName: string,
  projectPath: string
): Array<{ conceptName: string; vuePath: string }> {
  var result: Array<{ conceptName: string; vuePath: string }> = [];

  for (var i = 0; i < conceptEntries.length; i++) {
    var entry = conceptEntries[i];
    if (hasEnabledIsland(entry)) {
      var vuePath = join(projectPath, 'src/concepts', entry.name, 'vue');
      result.push({
        conceptName: entry.name,
        vuePath: vuePath,
      });
    }
  }

  return result;
}

function scheduleVueBuild(projectName: string, projectPath: string): void {
  console.log(LOG, 'Scheduling build for', projectName, '(debounce:', VUE_BUILD_DEBOUNCE_MS + 'ms)');

  var existingTimer = buildDebounceTimers.get(projectName);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  var timer = setTimeout(function() {
    executePendingBuild(projectName, projectPath);
  }, VUE_BUILD_DEBOUNCE_MS);

  buildDebounceTimers.set(projectName, timer);
}

function executePendingBuild(projectName: string, projectPath: string): void {
  buildDebounceTimers.delete(projectName);

  var watcherEntry = activeVueWatchers.get(projectName);
  if (!watcherEntry) {
    console.log(LOG, 'No watcher entry for', projectName, '- skipping build');
    return;
  }

  if (watcherEntry.buildInProgress) {
    console.log(LOG, 'Build already in progress for', projectName, '- requeueing');
    scheduleVueBuild(projectName, projectPath);
    return;
  }

  watcherEntry.buildInProgress = true;
  console.log(LOG, 'Executing build for', projectName);

  buildClient(projectPath).then(function(result) {
    var entry = activeVueWatchers.get(projectName);
    if (entry) {
      entry.buildInProgress = false;
    }

    if (result.success) {
      console.log(LOG, 'Build complete for', projectName, 'in', result.duration + 'ms');
    } else {
      console.error(LOG, 'Build failed for', projectName, ':', result.error);
    }

    var pendingTimer = buildDebounceTimers.get(projectName);
    if (pendingTimer) {
      console.log(LOG, 'Changes occurred during build - new build scheduled');
    }
  }).catch(function(error) {
    var entry = activeVueWatchers.get(projectName);
    if (entry) {
      entry.buildInProgress = false;
    }
    console.error(LOG, 'Build error for', projectName, ':', error);
  });
}

function closeVueWatcher(projectName: string): void {
  var entry = activeVueWatchers.get(projectName);
  if (entry) {
    console.log(LOG, 'Closing watcher for', projectName);
    entry.watcher.close();
    activeVueWatchers.delete(projectName);
  }

  var timer = buildDebounceTimers.get(projectName);
  if (timer) {
    clearTimeout(timer);
    buildDebounceTimers.delete(projectName);
  }
}

function createProjectVueWatcher(
  projectName: string,
  projectPath: string,
  vueTargets: Array<{ conceptName: string; vuePath: string }>
): void {
  if (vueTargets.length === 0) {
    console.log(LOG, 'No Vue targets for', projectName, '- skipping watcher');
    return;
  }

  var vuePaths = vueTargets.map(function(t) { return t.vuePath; });
  var conceptNames = vueTargets.map(function(t) { return t.conceptName; });

  console.log(LOG, 'Creating watcher for', projectName, 'watching', conceptNames.length, 'concepts:', conceptNames.join(', '));

  var watcher = watch(vuePaths, {
    ignoreInitial: true,
    persistent: true,
    depth: 2,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
    ignored: [
      /(^|[\/\\])\../,
      /node_modules/,
      /\.d\.ts$/,
    ],
  });

  var watcherEntry: VueBuildWatcherEntry = {
    watcher: watcher,
    projectName: projectName,
    projectPath: projectPath,
    watchedConcepts: conceptNames,
    buildInProgress: false,
  };

  watcher.on('change', function(filePath: string) {
    console.log(LOG, 'Vue file changed:', filePath);
    scheduleVueBuild(projectName, projectPath);
  });

  watcher.on('add', function(filePath: string) {
    console.log(LOG, 'Vue file added:', filePath);
    scheduleVueBuild(projectName, projectPath);
  });

  watcher.on('unlink', function(filePath: string) {
    console.log(LOG, 'Vue file removed:', filePath);
    scheduleVueBuild(projectName, projectPath);
  });

  watcher.on('error', function(error: Error) {
    console.error(LOG, 'Watcher error for', projectName, error);
  });

  watcher.on('ready', function() {
    console.log(LOG, 'Watcher ready for', projectName, '- watching', vuePaths.length, 'Vue directories');
  });

  activeVueWatchers.set(projectName, watcherEntry);
}

export const strativerseVueBuildWatcher: StrativersePrinciple = ({ k_, d_, plan }) => {
  console.log(LOG, 'Principle initialized');
  console.log(DBG, 'activeVueWatchers.size at init:', activeVueWatchers.size);

  return plan('Vue Build Watcher', ({ stage, stageO, conclude }) => [
    stageO(),
    stage(({ dispatch, k }) => {
      console.log(DBG, 'Watcher stage ENTERED');

      var conceptList = k.conceptList.select();
      var managedProjects = k.managedProjects.select();

      console.log(DBG, 'conceptList.concepts.length:', conceptList.concepts.length);
      console.log(DBG, 'managedProjects.length:', managedProjects.length);

      var projectTargets: Map<string, { projectPath: string; vueTargets: Array<{ conceptName: string; vuePath: string }> }> = new Map();

      // ADMIN_SCP Vue targets
      var adminPath = process.cwd();
      var adminVueTargets = getVueWatchTargets(conceptList.concepts, 'ADMIN_SCP', adminPath);
      if (adminVueTargets.length > 0) {
        projectTargets.set('ADMIN_SCP', { projectPath: adminPath, vueTargets: adminVueTargets });
        console.log(DBG, 'ADMIN_SCP Vue targets:', adminVueTargets.length);
      }

      // Managed project Vue targets
      for (var p = 0; p < managedProjects.length; p++) {
        var project = managedProjects[p];
        if (project.status === 'active' && project.conceptEntries) {
          var projectVueTargets = getVueWatchTargets(project.conceptEntries, project.name, project.path);
          if (projectVueTargets.length > 0) {
            projectTargets.set(project.name, { projectPath: project.path, vueTargets: projectVueTargets });
            console.log(DBG, project.name, 'Vue targets:', projectVueTargets.length);
          }
        }
      }

      console.log(LOG, 'Total projects with Vue targets:', projectTargets.size, 'activeWatchers:', activeVueWatchers.size);

      // Reconcile watchers
      var currentProjects = new Set(activeVueWatchers.keys());
      var neededProjects = new Set(projectTargets.keys());

      // Remove watchers for projects no longer needed
      currentProjects.forEach(function(projectName) {
        if (!neededProjects.has(projectName)) {
          closeVueWatcher(projectName);
        }
      });

      // Create/update watchers for current projects
      projectTargets.forEach(function(data, projectName) {
        var existingWatcher = activeVueWatchers.get(projectName);

        if (!existingWatcher) {
          createProjectVueWatcher(projectName, data.projectPath, data.vueTargets);
        } else {
          // Check if watched concepts changed
          var existingConcepts = existingWatcher.watchedConcepts.sort().join(',');
          var newConcepts = data.vueTargets.map(function(t) { return t.conceptName; }).sort().join(',');

          if (existingConcepts !== newConcepts) {
            console.log(LOG, 'Vue targets changed for', projectName, '- recreating watcher');
            closeVueWatcher(projectName);
            createProjectVueWatcher(projectName, data.projectPath, data.vueTargets);
          }
        }
      });

      // Stay in this stage - fire again when selectors change
      dispatch(d_.muxium.e.muxiumKick(), { throttle: 0 });
    }, {
      selectors: [k_.conceptList, k_.managedProjects],
      beat: 3,
    }),

    conclude(),
  ]);
};
