/**
 * scanConcepts Quality - Huirth-only (DeploymentTarget.Huirth)
 *
 * Scans the concepts directory and returns ConceptEntry list with full detail.
 *
 * Citation: SUITE-4-VIRIDIAN-INDUCTION-DIAMETRIC-QUALITY-PATTERN.md
 * Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
 * Citation: SUITE-0-5-OBSIDIAN-COBALT-CONCEPT-DIRECTORY-SPECIFICATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 *
 * Two Execution Modes:
 *
 * 1. Strategy Mode: Called from ActionStrategy (server principle)
 *    - Uses strategySuccess/strategyFailed for continuation
 *    - strategyData carries concepts to setConceptList in the strategy chain
 *
 * 2. Induction Mode: Called via client Induction (no strategy attached)
 *    - Performs scan directly
 *    - Fires setConceptList with payload to update state
 *    - Fires broadcastConceptList to notify clients
 *
 * Type: 'Strativerse Scan Concepts' (Verbose Split of strativerseScanConcepts)
 */
import {
  createQualityCardWithPayload,
  nullReducer,
  strategyData_appendFailure,
  strategyData_muxifyData,
  strategyFailed,
  strategySuccess,
  createAsyncMethodWithState,
  muxiumConclude,
} from 'stratimux';
import {
  type StrativerseState,
  type StrativerseScanConceptsDataField,
  type StrativerseModelDeck,
} from '../strativerse.type';
import { scanConceptsDirectory } from '../model/conceptScanner.model';

export type StrativerseScanConceptsPayload = {
  scanPath?: string;
};

export const strativerseScanConcepts = createQualityCardWithPayload<
  StrativerseState,
  StrativerseScanConceptsPayload,
  StrativerseModelDeck
>({
  type: 'Strativerse Scan Concepts',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethodWithState(({ controller, action, state, deck }) => {
      const scanPath = action.payload?.scanPath ?? state.conceptList.scanPath;

      if (action.strategy) {
        // Strategy Mode: Part of ActionStrategy chain (principle-initiated)
        const strategy = action.strategy;
        scanConceptsDirectory(scanPath)
          .then((concepts) => {
            const dataField: StrativerseScanConceptsDataField = {
              concepts,
              lastScan: Date.now(),
              scanPath
            };
            controller.fire(
              strategySuccess(
                strategy,
                strategyData_muxifyData(strategy, dataField)
              )
            );
          })
          .catch((error) => {
            console.error('[StratiVERSE] Error scanning concepts:', error);
            controller.fire(strategyFailed(strategy, strategyData_appendFailure(strategy, error)));
          });
      } else {
        // Induction Mode: Client request via WebSocket (no strategy attached)
        // Complete the A→B→Y→Z Manifold manually by firing setConceptList and broadcastConceptList
        // Citation: FORWARD-PASS-INDUCTION-DIAMETRIC-QUALITY.md
        console.log('[StratiVERSE] Induction Mode: Performing scan and completing manifold chain');

        scanConceptsDirectory(scanPath)
          .then((concepts) => {
            const scanResult: StrativerseScanConceptsDataField = {
              concepts,
              lastScan: Date.now(),
              scanPath
            };

            console.log('[StratiVERSE] Induction Mode: Scan complete, updating state and broadcasting', {
              conceptCount: concepts.length
            });

            // Step Y: Fire setConceptList with payload (uses fallback path in reducer)
            // Access via deck.strativerse.e for proper action creator
            const setConceptListAction = deck.strativerse.e.strativerseSetConceptList(scanResult);
            console.log('[StratiVERSE] Induction Mode: Firing setConceptList action', {
              type: setConceptListAction.type,
              payloadKeys: Object.keys(setConceptListAction.payload || {})
            });
            controller.fire(setConceptListAction);

            // Step Z: Fire broadcastConceptList to complete Z Return to client
            const broadcastAction = deck.strativerse.e.strativerseBroadcastConceptList({});
            console.log('[StratiVERSE] Induction Mode: Firing broadcastConceptList action', {
              type: broadcastAction.type,
              hasStrategy: !!broadcastAction.strategy
            });
            controller.fire(broadcastAction);

            // Conclude the action
            console.log('[StratiVERSE] Induction Mode: Firing muxiumConclude');
            controller.fire(muxiumConclude());
          })
          .catch((error) => {
            console.error('[StratiVERSE] Induction Mode: Error scanning concepts:', error);
            controller.fire(muxiumConclude());
          });
      }
    }),
});
