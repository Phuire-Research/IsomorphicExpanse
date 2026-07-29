/**
 * scsBridgeInvokeSessionSpawn Principle — Client Deployment (CMIA-Spawn)
 *
 * Sibling to scsBridgePingPrinciple (M63 PPLD pattern · CMIA family).
 * Watches the pendingSpawnScpName trigger field — Vue dispatches with
 * the user-selected SCP name when Spawn button clicked; this principle
 * fires the MCP fetch tools/call('scp_launch_new_session', { scpName }).
 *
 * Architectural alignment (User clarification 2026-05-23):
 *   TUI [N] handleSpawn → manager.createSession + launchInformative
 *   Client UI Spawn → MCP scp_launch_new_session → SAME manager functions
 *   Shared function discipline — both routes terminate in identical code.
 *
 * ACK-ONLY DISCIPLINE (DSAB · HAZARD-D dissolution):
 *   Client does NOT parse the HTTP ack body for session data. Authoritative
 *   session row arrives via the existing DSAB 8-step FBB relay chain:
 *   manager → sessions.json → chokidar → SLSR → setSessionsListRelay → Vue.
 *
 * SIGR (Spawn-Idempotency-Guard-Rapid):
 *   Module-level isSpawning ref prevents double-fire during the in-flight
 *   window. Cleared on fetch success/failure, or after 5000ms HAZARD-V
 *   timeout fallback. Exported for Vue component binding (single source).
 *
 * Citation: D3D-ARCHITECTURE-R3C-YELLOW-CLIENT-PRINCIPLE.md §S2
 * Citation: scsBridgePing.principle.client.ts (CMIA-M63 clone source)
 * Citation: D3D-MANIFOLD-RECALL-R0-OBSIDIAN.md §A (shared-function discipline)
 */
import { ref, type Ref } from 'vue';
import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeClientQualities,
  ScsBridgeDeck,
} from '../scsBridge.type';

export type ScsBridgeInvokeSessionSpawnPrinciple = PrincipleFunction<
  ScsBridgeClientQualities,
  MuxiumDeck & ScsBridgeDeck,
  ScsBridgeClientState
>;

// SIGR · transient in-flight guard · M58-safe (Vue ref object stable)
// Exported so the Vue component can read .value for :disabled binding.
// Cite: R3-C §S2 + R4 Angle 9 (M58 SAFE).
export const isSpawning: Ref<boolean> = ref<boolean>(false);

// C1-D2 · SBST · separate in-flight guard for the Suite 8 spawn lane.
// Independent of isSpawning (SCP-spawn) so the two lanes never block each other.
export const isSpawningSuite8: Ref<boolean> = ref<boolean>(false);

export const scsBridgeInvokeSessionSpawnPrinciple: ScsBridgeInvokeSessionSpawnPrinciple = ({
  e_,
  k_,
  nextA,
  plan,
}) => {
  console.log('[SCS-Bridge CMIA-Spawn] Principle started · trigger-field watcher · ack-only');

  const spawnPlan = plan('SCS-Bridge InvokeSpawn (Client)', ({ stageO, stage }) => [
    stageO(),
    stage(
      ({d, dispatch}) => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const pendingScpName = k_.pendingSpawnScpName.select();
        // MD-9 · D-MC-3 · Per-Instance Model Control · read the persistent model selection at
        // fire-time (companion to the trigger; the gate stays keyed on pendingSpawnScpName).
        const pendingModel = k_.pendingSpawnModel.select();

        // LSSD · Gate evaluation (TTVS-aware · undefined=no-trigger · null+string=valid-trigger)
        console.log(
          '[SCS-Bridge CMIA-Spawn] Gate · pendingSpawnScpName=',
          pendingScpName,
          '· willFire=',
          pendingScpName !== undefined && !!connectionEstablished && !!bridgeJson && !isSpawning.value,
          '· connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· isSpawning=',
          isSpawning.value,
        );

        // DSBG + CBBSA + SIGR + trigger-presence gate
        // TTVS Three-Value Trigger Semantic · only undefined = no trigger.
        // null = valid trigger fire (Template SCP / All SCP default).
        // Cite: D3D-HOTFIX-2-R7-FUCHSIA-CLINICAL.md §C.
        if (!connectionEstablished || !bridgeJson || pendingScpName === undefined) {
          // Honest silence — undefined = no trigger pending (null and string are valid triggers).
          return;
        }
        if (isSpawning.value) {
          console.log('[SCS-Bridge CMIA-Spawn] Gate BLOCKED · reason: isSpawning=true');
          return;
        }

        isSpawning.value = true;
        // D-UP5 · TFCD-EARLY REFIT (the page-select spawn storm · IE field-caught): this lane
        // kept the TFCD-LATE shape — the .finally() nextA clear lands QUEUED while any state
        // beat (the spawned session's own sessionsList/bridgeJson relay · a page selection)
        // re-evaluates the gate with the trigger STILL set and isSpawning already released →
        // "new session after new session". The Suite 8 lane cured this exact race (its
        // TFCD-EARLY comment names it); this is the same cure: clear the trigger the INSTANT
        // the gate fires — the clear applies DURING the fetch while isSpawning blocks re-fires.
        dispatch(e_.scsBridgeSetPendingSpawnScpName({ scpName: undefined }), {
          throttle: 0
        });
        console.log('[SCS-Bridge CMIA-Spawn] Gate FIRE · pendingScpName=', pendingScpName, '· trigger cleared early (TFCD-EARLY) · (null=Template-SCP-default)');

        // HAZARD-V (R4 Angle 4) · 5000ms timeout fallback for orphan SIGR reset.
        const sigRTimeoutId = setTimeout(() => {
          if (isSpawning.value) {
            isSpawning.value = false;
            console.warn('[SCS-Bridge SIGR] DSAB timeout — forcing isSpawning reset');
          }
        }, 5000);

        // MCP-Correct-RPC · /mcp single endpoint with JSON-RPC 2.0 tools/call
        // envelope · same pattern verified in M63 scsBridgePingPrinciple.
        const url = `${bridgeJson.endpoint}/mcp`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: 'scp_launch_new_session',
            // MD-9 · D-MC-3 · thread the selected model ONLY when set (omit → bridge global
            // default). Field-agnostic: model flows through toolArgs → payload.model → the
            // bridge quality → setSessionModel → entry.model → resume modelClause override.
            arguments: pendingModel
              ? { scpName: pendingScpName, model: pendingModel }
              : { scpName: pendingScpName },
          },
        };

        // Snapshot pendingScpName for finally-clear (avoid stale closure capture).
        const firedScpName = pendingScpName;

        console.log('[SCS-Bridge CMIA-Spawn] Firing fetch · url=', url, '· bodyShape=', { tool: 'scp_launch_new_session', scpName: firedScpName }, '· rpcId=', rpcId);

        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify(body),
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge CMIA-Spawn] Ack · status=',
              res.status,
              '· content-type=',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            console.log(
              '[SCS-Bridge CMIA-Spawn] Ack received · session row will arrive via DSAB FBB relay · scpName=',
              firedScpName,
            );
          })
          .catch((err: Error) => {
            console.error('[SCS-Bridge CMIA-Spawn] Fetch failed:', err.message);
          })
          .finally(() => {
            clearTimeout(sigRTimeoutId);
            // D-UP5 · the TFCD-LATE nextA clear RETIRED — the trigger was already cleared
            // at gate-fire (TFCD-EARLY above · the Suite 8 lane's proven shape). Clearing
            // again here re-opened nothing but the log; the race lived in the queued gap.
            console.log('[SCS-Bridge CMIA-Spawn] fetch settled · scpName-was=', firedScpName, '· trigger was cleared at fire (TFCD-EARLY)');
          });
      },
      {
        selectors: [k_.bridgeJson, k_.connectionEstablished, k_.pendingSpawnScpName],
        beat: 3,
      },
    ),
    stage(({stagePlanner}) => {
      stagePlanner.conclude();
    })
  ]);

  // C1-D2 · SBST · sibling plan watching pendingSpawnSuite8Name.
  // Mirrors the CMIA-Spawn lane above but fires MCP scs_spawn_suite8_session
  // with { suite8Name }. Independent SIGR guard (isSpawningSuite8). The Bridge
  // tool sets entry.suite8Name BEFORE spawn so cli-handler composes Base+Dock+Instance.
  const spawnSuite8Plan = plan('SCS-Bridge InvokeSpawnSuite8 (Client)', ({ stage, stageO }) => [
    stageO(),
    stage(
      ({dispatch}) => {
        const bridgeJson = k_.bridgeJson.select();
        const connectionEstablished = k_.connectionEstablished.select();
        const pendingSuite8Name = k_.pendingSpawnSuite8Name.select();
        // SBST asWorker companion · read at fire time (TTVS gate stays keyed on the name).
        const pendingAsWorker = k_.pendingSpawnSuite8AsWorker.select();
        // MD-9 · D-MC-3 · Per-Instance Model Control · read the persistent model selection at
        // fire-time (same lane as asWorker · threaded into the MCP arguments when set).
        const pendingModel = k_.pendingSpawnModel.select();
        // C373 · THE SCP THREAD · read the caller's SCP at fire-time (same lane as asWorker/model ·
        // threaded into the MCP arguments when set → the Forge anchor lands on the caller's SCP).
        const pendingScpName = k_.pendingSpawnSuite8ScpName.select();
        // C386 · THE FRESH FLAG · read the Forge's Per-Actualization Engage flag at fire-time (same
        // lane as asWorker/scpName) · threaded into the MCP arguments when true → the bridge quality,
        // on an OFFLINE anchor, creates a NEW session + re-claims the anchor instead of re-engaging it.
        const pendingFresh = k_.pendingSpawnSuite8Fresh.select();
        // D-UP · THE MANUAL-MODE SEVER · read at fire-time (same lane) · threaded when true →
        // the bridge quality skips the auto-permission marker (approval gate intact) + arms the
        // Stand By overlay on the primed session (the Gitm Resolver's user-controlled update law).
        const pendingManualMode = k_.pendingSpawnSuite8ManualMode.select();

        console.log(
          '[SCS-Bridge CMIA-Spawn-Suite8] Gate · pendingSpawnSuite8Name=',
          pendingSuite8Name,
          '· willFire=',
          pendingSuite8Name !== undefined && !!connectionEstablished && !!bridgeJson && !isSpawningSuite8.value,
          '· connEst=',
          connectionEstablished,
          '· bridgeJson=',
          !!bridgeJson,
          '· isSpawningSuite8=',
          isSpawningSuite8.value,
        );

        // Only undefined = no trigger; any string = valid Suite 8 spawn fire.
        if (!connectionEstablished || !bridgeJson || pendingSuite8Name === undefined) {
          return;
        }
        if (isSpawningSuite8.value) {
          console.log('[SCS-Bridge CMIA-Spawn-Suite8] Gate BLOCKED · reason: isSpawningSuite8=true');
          return;
        }

        isSpawningSuite8.value = true;
        // TFCD-EARLY (re-fire-loop fix): clear the trigger the INSTANT the gate fires — not in
        // the async .finally(). The .finally() sets isSpawningSuite8=false synchronously while
        // the nextA clear is still QUEUED → in that gap a bridgeJson relay re-fire (the just-
        // spawned session updates the selector) sees the trigger STILL set + not-spawning →
        // spawns AGAIN → infinite "new session after new session". Clearing here means the clear
        // is applied DURING the fetch (while isSpawningSuite8=true blocks re-fires), so by the
        // time .finally() releases the guard the trigger is already undefined.
        dispatch(e_.scsBridgeSetPendingSpawnSuite8Name({ suite8Name: undefined, asWorker: undefined, scpName: undefined, fresh: undefined, manualMode: undefined }), {
          throttle: 0
        });
        console.log('[SCS-Bridge CMIA-Spawn-Suite8] Gate FIRE · pendingSuite8Name=', pendingSuite8Name, '· asWorker=', pendingAsWorker ?? false, '· trigger cleared early (TFCD-EARLY)');

        const sigRTimeoutId = setTimeout(() => {
          if (isSpawningSuite8.value) {
            isSpawningSuite8.value = false;
            console.warn('[SCS-Bridge SIGR-Suite8] DSAB timeout — forcing isSpawningSuite8 reset');
          }
        }, 5000);

        const url = `${bridgeJson.endpoint}/mcp`;
        const rpcId = Date.now();
        const body = {
          jsonrpc: '2.0',
          id: rpcId,
          method: 'tools/call',
          params: {
            name: 'scs_spawn_suite8_session',
            // SBST asWorker · only thread the flag when true (worker spawn). Omitted for the
            // anchor/PPOL path so the bridge quality default (false) keeps anti-flood + auto-anchor.
            // MD-9 · D-MC-3 · thread model ONLY when set (omit → bridge global default). Composed
            // additively so asWorker + model are independent lanes.
            arguments: {
              suite8Name: pendingSuite8Name,
              ...(pendingAsWorker ? { asWorker: true } : {}),
              ...(pendingModel ? { model: pendingModel } : {}),
              // C373 · THE SCP THREAD · thread scpName ONLY when set (the bridge quality already
              // consumes payload.scpName — no bridge edit). Omitted → the bridge resolves the SCP dir.
              ...(pendingScpName ? { scpName: pendingScpName } : {}),
              // C386 · THE FRESH FLAG · thread fresh ONLY when true (the bridge quality reads
              // payload.fresh → on an OFFLINE anchor, create a NEW session + re-claim the anchor).
              // Omitted → the ordinary offline→re-engage behaviour.
              ...(pendingFresh ? { fresh: true } : {}),
              // D-UP · thread manualMode ONLY when true (the bridge quality severs the
              // auto-permission marker + arms the Stand By overlay). Omitted → worker auto-accept.
              ...(pendingManualMode ? { manualMode: true } : {}),
            },
          },
        };

        const firedSuite8Name = pendingSuite8Name;

        console.log('[SCS-Bridge CMIA-Spawn-Suite8] Firing fetch · url=', url, '· bodyShape=', { tool: 'scs_spawn_suite8_session', suite8Name: firedSuite8Name, asWorker: pendingAsWorker ?? false }, '· rpcId=', rpcId);

        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify(body),
        })
          .then(async (res) => {
            const contentType = res.headers.get('content-type') ?? '';
            console.log(
              '[SCS-Bridge CMIA-Spawn-Suite8] Ack · status=',
              res.status,
              '· content-type=',
              contentType,
            );
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status} · body=${text.slice(0, 200)}`);
            }
            console.log(
              '[SCS-Bridge CMIA-Spawn-Suite8] Ack received · session row will arrive via DSAB FBB relay · suite8Name=',
              firedSuite8Name,
            );
          })
          .catch((err: Error) => {
            console.error('[SCS-Bridge CMIA-Spawn-Suite8] Fetch failed:', err.message);
          })
          .finally(() => {
            clearTimeout(sigRTimeoutId);
            // Trigger already cleared at gate-fire (TFCD-EARLY · re-fire-loop fix) — release the
            // SIGR guard only. suite8Name-was=firedSuite8Name (captured for the fetch body/logs).
            isSpawningSuite8.value = false;
          });
      },
      {
        selectors: [k_.bridgeJson, k_.connectionEstablished, k_.pendingSpawnSuite8Name],
        beat: 3,
      },
    ),
    stage(({stagePlanner}) => {
      stagePlanner.conclude();
    })
  ]);

  return () => {
    console.log('[SCS-Bridge CMIA-Spawn] Principle cleanup');
    spawnPlan.conclude();
    spawnSuite8Plan.conclude();
  };
};
