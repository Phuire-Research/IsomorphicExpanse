/**
 * CDRUM (Create Delete Read Update Muxify) Universal Method Creator
 * Centralizes dual dispatch pattern for all MuxTape operations
 * Reference: STRATIMUX-REFERENCE.md - 🎬 ActionStrategies - Orchestrated Action Sequences
 * 
 * CRITICAL: This pattern ensures consistent dual dispatch across all operations
 * Extracted from successful paste operation implementation
 */

import {
  type AnyAction,
  type Concepts,
} from 'stratimux';


/**
 * CDRUM Operation Types
 * Maps to FileSystem operations with future Muxify support
 */
export enum CDRUMOperation {
  CREATE = 'create',
  DELETE = 'delete',
  READ = 'read',
  UPDATE = 'update',
  MUXIFY = 'muxify', // Phase 3 placeholder
  BATCH = 'batch'    // For multi-operation support like paste
}

/**
 * Configuration for CDRUM operations
 */
export interface CDRUMConfig<P = void> {
  operation: CDRUMOperation;
  topic: string;                    // Strategy topic for debugging
  generateClientActions: (deck: any, concepts: Concepts, payload?: P) => AnyAction[];  // CDI buffer updates
  generateServerActions: (deck: any, concepts: Concepts, payload?: P) => AnyAction[];  // FileSystem operations
  hairTriggerDuration?: number;     // Default 3000ms
  skipServerDispatch?: boolean;     // For client-only operations
}

