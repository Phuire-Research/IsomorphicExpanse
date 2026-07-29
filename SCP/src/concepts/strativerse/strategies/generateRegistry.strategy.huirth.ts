import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { StrativerseConcept } from '../strativerse.concept';

/**
 * StratiVERSE Generate Registry Strategy - A→B→Y→Z Manifold Circuit
 *
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 * Citation: STRATIMUX-REFERENCE.md "🔧 selectStratiDECK Pattern for Strategy Creator Functions"
 * Citation: SUITE-1-2-MUXONOMY-ISLANDS-ARCHITECTURE.md
 *
 * Manifold Pattern:
 * - A Trigger: Client triggers via WebSocket OR principle initiates at startup
 * - B Processing: This strategy is created
 * - Y Anchor: generateMuxonomyRegistry (async file scanning + generation)
 * - Z Return: strategySuccess with MuxonomyRegistryResult DataField
 *
 * Client → Server Flow:
 * 1. Client dispatches strategyBegin(generateRegistryStrategy)
 * 2. WebSocket serializes action to Huirth
 * 3. Huirth executes async quality (file scan, generate registry)
 * 4. strategySuccess with DataField broadcasts result to Client
 *
 * Usage in principle:
 * ```typescript
 * const strategy = createStrativerseGenerateRegistryStrategy(deck);
 * if (strategy) {
 *   dispatch(strategyBegin(strategy), { setStage: 1 });
 * }
 * ```
 */
export function createStrativerseGenerateRegistryStrategy(
  deck: unknown,
  options?: {
    scanPath?: string;
    outputPath?: string;
    dryRun?: boolean;
  }
): ActionStrategy | undefined {

  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!strativerseDeck) {
    console.error('[StratiVERSE] Failed to access strativerse deck');
    return undefined;
  }

  console.log('[StratiVERSE] Creating registry generation strategy');

  const generateNode = createActionNode(
    strativerseDeck.e.strativerseGenerateMuxonomyRegistry({
      scanPath: options?.scanPath,
      outputPath: options?.outputPath,
      dryRun: options?.dryRun,
    }),
    {
      successNotes: {
        preposition: '',
        denoter: 'muxonomy registry generated successfully.'
      }
    }
  );

  return createStrategy({
    topic: 'StratiVERSE Manifold - Generate Muxonomy Registry',
    initialNode: generateNode,
    data: {
      ...options,
      initTimestamp: Date.now()
    }
  });
}
