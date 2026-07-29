import { Action } from 'stratimux';
import { FileSystemPrinciple } from '../fileSystem.concept';
import { dotNotationToPath, matchesPattern } from '../fileSystem.pathTransform';
import { FileSystemSelector } from '../fileSystem.model';

/**
 * FileSystem Change Processor Principle
 * Processes queued file changes using depletion pattern
 * Reference: STRATIMUX-REFERENCE.md - 🎯 Critical Planning Context Patterns
 * Reference: STRATIMUX-REFERENCE.md - 🏗️ Principle Context
 * 
 * Uses depletion loop with array.shift() to avoid reactive notifications
 * Matches file patterns to registered handlers for routing
 */

/**
 * Find matching action for a file path using pattern matching
 */
function findMatchingAction(keys: string, fileActionRouter: Record<string, string>): string | undefined {
  for (const [pattern, actionName] of Object.entries(fileActionRouter)) {
    // Extract the file path from the keys (remove concept prefix)
    const pathPart = keys.split('.').slice(2).join('.');
    const filePath = dotNotationToPath(pathPart);
    
    if (matchesPattern(filePath, pattern)) {
      return actionName;
    }
  }
  return undefined;
}

export const fileChangeProcessorPrinciple: FileSystemPrinciple = ({ k_, d_, plan, nextA }) => {
  // Check if we have file changes to process
  const fileChanges = k_.fileChanges.select();
  
  if (fileChanges.length > 0) {
    plan('Process file changes', ({ stage, conclude }) => [
      stage(({ k, d, concepts }) => {
        const fileActionRouter = k.fileActionRouter.select();
        const currentFileChanges = k.fileChanges.select() as FileSystemSelector[];
        
        // Depletion loop - process all changes without triggering reactive updates
        while (currentFileChanges.length > 0) {
          const selector = currentFileChanges.shift();
          if (selector) {
            // Find matching handler action based on file pattern
            const actionName = findMatchingAction(selector.keys, fileActionRouter);
            
            if (actionName) {
              // Cast to any to access dynamic property
              const actions = d.fileSystem.e as any;
              if (actions[actionName]) {
                // Use filePath from selector metadata if available
                const path = selector.filePath || dotNotationToPath(
                  selector.keys.replace(k.getName(concepts) + '.directoryClone.', '')
                );
                
                // Dispatch the handler action with file information
                const handlerAction = actions[actionName]({ 
                  path, 
                  selector 
                });
                if (handlerAction) {
                  nextA(handlerAction);
                }
              }
            }
          }
        }
        
        // Clear the processed changes
        const clearAction = d.fileSystem.e.fileSystemClearProcessedChanges();
        if (clearAction) {
          clearAction.priority = 100;
          nextA(clearAction as Action);
        }
      }, {
        selectors: [k_.fileChanges, k_.fileActionRouter],
        beat: 100  // Process changes every 100ms to prevent overflow
      }),
      conclude()
    ]);
  }
};