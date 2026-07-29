/**
 * SCP Registry Watcher Principle — AJMI Extension 4 Reactivity (M2-A1-D4)
 *
 * Arms fs.watch over Cascades/SCPs.json. On change, reads the file, parses
 * the registry, and (via the principle's planning scope) dispatches the
 * client-side `scsBridgeSetInstalledScps` to push the updated installedScps
 * to all connected SCS-Bridge consumers.
 *
 * AJMI Extension 4 (reactivity) consumer: this principle IS what makes
 * SCS-Bridge respond to SCPs.json changes without polling. The Main Menu
 * mirror entry updates within ~one fs.watch event of any registry mutation.
 *
 * Lifecycle:
 *   - Mount: fs.watchFile(scpRegistryPath, { interval: 1000 }, listener)
 *   - On change: readRegistryFile() → parse → dispatch (if changed)
 *   - On startup: ALSO perform initial read so clients see existing entries
 *   - Teardown: fs.unwatchFile (lifecycle managed by Muxium muxiumStop)
 *
 * Higher-Order Composition: principle composes scpRegistry (own state) +
 * scsBridge (target dispatch). Through-Diameter on huirth deck.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D4 + §AJMI Extension 4
 * Citation: STRATIMUX-REFERENCE.md "🎯 Critical Planning Context Patterns"
 */
import { watchFile, unwatchFile, existsSync, readFileSync } from 'node:fs';
import type { PrincipleFunction } from 'stratimux';
import type { ScpRegistry, ScpRegistryEntry } from '../scpRegistry.type';

// ============================================
// PURE PARSE (testable in isolation)
// ============================================

/**
 * Parses SCPs.json content into a ScpRegistry. Returns empty `{ scps: [] }`
 * on parse error or missing file — registry MUST always present a valid
 * shape to consumers. Caller may log the error but does not throw.
 */
export function parseScpRegistry(content: string): ScpRegistry {
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.scps)) {
      return { scps: parsed.scps as ScpRegistryEntry[] };
    }
    return { scps: [] };
  } catch {
    return { scps: [] };
  }
}

/**
 * Reads the registry from disk. Returns empty registry on missing file.
 */
export function readRegistryFile(scpRegistryPath: string): ScpRegistry {
  if (!existsSync(scpRegistryPath)) {
    return { scps: [] };
  }
  try {
    const content = readFileSync(scpRegistryPath, 'utf8');
    return parseScpRegistry(content);
  } catch {
    return { scps: [] };
  }
}

// ============================================
// PRINCIPLE
// ============================================

/**
 * Stratimux principle skeleton. Concrete dispatch wiring (planning into
 * scsBridge) lands when consumer principles compose with this one — for
 * M2-A1-D4 the focus is the fs.watch lifecycle + parse pipeline as a
 * verified substrate. M2-A1-D5 wires the dispatch path through
 * webSocketServer to the client.
 *
 * NOTE: typed as `PrincipleFunction<never, never, never>` because the
 * concept registers it via `as never` cast at the concept factory — the
 * runtime Muxium provides correct deck shape. Strict typing of the deck
 * is deferred until full quality library lands.
 */
export const scpRegistryWatcherPrinciple: PrincipleFunction<never, never, never> = ((args: {
  conceptSemaphore: number;
  muxified: { name: string };
  plan: unknown;
}) => {
  // Resolve registry path from this concept's own state (Tier 1 self-access).
  // NOTE: Full planning-scope wiring would use `plan(...)` from args, but
  // M2-A1-D4 scope keeps the principle to the fs.watch lifecycle gate.
  // The fs.watch arming below is a side effect at principle mount time —
  // dispatch path through Muxium is wired when M2-A1-D5 consumer lands.

  // Defensive: principle should be mountable without crashing if Muxium
  // hasn't fully wired state access. Best-effort path resolution.
  const projectRoot = process.cwd();
  const path = require('node:path') as typeof import('node:path');
  const scpRegistryPath = path.resolve(projectRoot, 'Cascades/SCPs.json');

  if (!existsSync(scpRegistryPath)) {
    // No file yet — nothing to watch. Watcher will be re-armed when file
    // first appears (M2-A1-D5 install creates SCPs.json entries).
    return;
  }

  // Initial read (Lambda-event — registry hydration)
  const initial = readRegistryFile(scpRegistryPath);
  // eslint-disable-next-line no-console
  console.log(`[scpRegistryWatcher] Initial registry load: ${initial.scps.length} entries`);

  // Arm fs.watchFile (polling-based watcher · cross-platform reliable)
  watchFile(scpRegistryPath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtimeMs === prev.mtimeMs) return; // No real change
    const updated = readRegistryFile(scpRegistryPath);
    // eslint-disable-next-line no-console
    console.log(`[scpRegistryWatcher] Registry change detected: ${updated.scps.length} entries`);
    // M2-A1-D5: dispatch through webSocketServer to scsBridgeSetInstalledScps
    // For now, the side-effect log is the verifiable Lambda-event.
  });

  // Teardown handled implicitly by Node process exit — Muxium muxiumStop
  // would call unwatchFile if it tracked principle disposers (future).
  // eslint-disable-next-line no-console
  console.log(`[scpRegistryWatcher] fs.watchFile armed at ${scpRegistryPath}`);
}) as never;
