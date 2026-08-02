/**
 * setPendingSpawnSuite8Name Quality — Client UI Reducer (Local)
 *
 * C1-D2 · SBST · CMIA-Spawn-Suite8 trigger field setter. Vue dispatches with
 * suite8Name when user clicks the Suite 8 Spawn button (Suite8OnDemand) or on
 * Cadmium page-load (CadmiumLanding PPOL); the scsBridgeInvokeSessionSpawn
 * principle watches this selector and fires the MCP scs_spawn_suite8_session
 * fetch. Cleared (set to undefined) after fetch resolves (TFCD) to prevent re-fire.
 *
 * Sibling to setPendingSpawnScpName.quality.client.ts (CMIA-Spawn pattern).
 *
 * Citation: CADMIUM-C1-OCHRE-BLUEPRINT.md §C1-D2 (client-side trigger note)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetPendingSpawnSuite8NamePayload,
} from '../scsBridge.type';

export type { ScsBridgeSetPendingSpawnSuite8NamePayload };

export const scsBridgeSetPendingSpawnSuite8Name = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetPendingSpawnSuite8NamePayload
>({
  type: 'Scs Bridge Set Pending Spawn Suite8 Name',
  reducer: (_state, action) => {
    // LSSD · CMIA-Spawn-Suite8 trigger transition. asWorker rides alongside the name so the
    // principle reads BOTH at fire time (worker path = skip anti-flood guard + auto-anchor).
    console.log(
      '[SCS-Bridge CMIA-Spawn-Suite8] setPendingSpawnSuite8Name · suite8Name=',
      action.payload.suite8Name,
      '· asWorker=',
      action.payload.asWorker ?? false,
      '· scpName=',
      action.payload.scpName ?? null,
      '· fresh=',
      action.payload.fresh ?? false,
      '· manualMode=',
      action.payload.manualMode ?? false,
    );
    // C373 · scpName rides alongside name + asWorker (TFCD clears all three together). The principle
    // reads it FRESH at fire-time and threads it into the MCP scs_spawn_suite8_session arguments.
    // C386 · fresh rides the same lane (TFCD clears all four together) so the InvokeSpawnSuite8
    // principle can thread fresh:true into the MCP args for the Forge's Per-Actualization Engage.
    // D-UP · manualMode rides the same lane (TFCD clears all five together) — the Gitm Resolver's
    // user-controlled spawn (no auto-permission marker + the Stand By overlay).
    // RS.2b · initialDirective rides the same lane (TFCD clears all six together) — the per-run
    // anchor the bridge composes into the initial positional prompt (no post-boot delivery).
    // THE ONBOARD OPTION · onboard rides the same lane (TFCD clears all seven together) —
    // undefined = default (Onboard rides); false = suppress this spawn's seed.
    return {
      pendingSpawnSuite8Name: action.payload.suite8Name,
      pendingSpawnSuite8AsWorker: action.payload.asWorker,
      pendingSpawnSuite8ScpName: action.payload.scpName,
      pendingSpawnSuite8Fresh: action.payload.fresh,
      pendingSpawnSuite8ManualMode: action.payload.manualMode,
      pendingSpawnSuite8InitialDirective: action.payload.initialDirective,
      pendingSpawnSuite8Onboard: action.payload.onboard,
      pendingSpawnSuite8Anchor: action.payload.anchor,
    };
  },
  methodCreator: defaultMethodCreator,
});
