import { watch } from 'chokidar';
import { createPathSelector } from '../fileSystem.pathTransform';
import { FileSystemPrinciple } from '../fileSystem.concept';

/**
 * FileSystem Watcher Principle
 * Binds filesystem events to Stratimux actions using chokidar
 * Reference: STRATIMUX-REFERENCE.md - 🎯 Critical Planning Context Patterns
 * Reference: STRATIMUX-REFERENCE.md - 🏗️ Principle Context
 * 
 * Uses nextA for event dispatching from filesystem events
 * deck_ and concepts_ are used for createPathSelector from Phase 1A
 */

export const fileSystemWatcherPrinciple: FileSystemPrinciple = ({ k_, d_, nextA, plan }) => {
    // Monitor for new paths to observe
    const observedPaths = k_.observedPaths.select();
    const activeWatchers = k_.activeWatchers.select();
    
    // Only set up watchers if we have paths to observe
    if (observedPaths.length > 0) {
      plan('File System Observed Path Binding', ({ stage }) => [
        stage(({ d, k, concepts }) => {
          const currentObservedPaths = k.observedPaths.select();
          const currentActiveWatchers = k.activeWatchers.select();
          
          currentObservedPaths.forEach(pathToWatch => {
            // Only create watcher if it doesn't already exist
            if (!currentActiveWatchers.has(pathToWatch)) {
              const watcher = watch(pathToWatch, {
                ignoreInitial: true,
                persistent: true,
                depth: 99,
                awaitWriteFinish: {
                  stabilityThreshold: 300,
                  pollInterval: 100
                }
              });
              
              // Event binding using nextA for async dispatch
              // 'add' event: new file created
              watcher.on('add', (filePath: string) => {
                const selector = createPathSelector(d, concepts, filePath);
                if (selector) {
                  nextA(d_.fileSystem.e.fileSystemQueueFileChange({
                    selector,
                    changeType: 'add',
                    path: filePath
                  }));
                }
              });
              
              // 'change' event: file modified
              watcher.on('change', (filePath: string) => {
                const selector = createPathSelector(d, concepts, filePath);
                if (selector) {
                  nextA(d_.fileSystem.e.fileSystemQueueFileChange({
                    selector,
                    changeType: 'change',
                    path: filePath
                  }));
                }
              });
              
              // 'unlink' event: file deleted
              watcher.on('unlink', (filePath: string) => {
                const selector = createPathSelector(d, concepts, filePath);
                if (selector) {
                  nextA(d_.fileSystem.e.fileSystemQueueFileChange({
                    selector,
                    changeType: 'unlink',
                    path: filePath
                  }));
                }
              });
              
              // Error handling
              watcher.on('error', (error: Error) => {
                console.error('FileSystem Watcher Error:', error);
              });
              
              // Store the watcher reference
              const updatedWatchers = new Map(currentActiveWatchers);
              updatedWatchers.set(pathToWatch, watcher);
              
              // Update state with new watcher using dispatch
              nextA(d_.fileSystem.e.fileSystemUpdateWatchers({
                activeWatchers: updatedWatchers
              }));
            }
          });
        }, {
          selectors: [k_.observedPaths, k_.activeWatchers],
          beat: 100  // Check every 100ms for new paths to observe
        })
      ]);
    }
};