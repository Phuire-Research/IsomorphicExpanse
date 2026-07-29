/*<$
For the graph programming framework Stratimux generate a CounterCommandDeckInterface Initialization Principle that registers client.count selector for localStorage synchronization and restores count from storage on initialization.
$>*/
/*<#*/
import type { ClientPrinciple } from './client.concept';

export const clientInitializationPrinciple: ClientPrinciple = ({ plan, d_ }) => {
  return plan('Client Initialization', ({ stage, stageO, conclude }) => [
    stageO(),

    // Stage 1: Register this principle with muxium
    stage(({ concepts, dispatch, stagePlanner, k }) => {
      const name = k.getName(concepts);
      if (name) {
        dispatch(d_.muxium.e.muxiumRegisterStagePlanner({ conceptName: name, stagePlanner }), {
          iterateStage: true,
        });
      } else {
        stagePlanner.conclude();
      }
    }),
    stage(({ dispatch, d, k }) => {
      const fingerprint = d.client.d.localStorage.k.systemFingerprint.select();
      const syncedSelectors = d.client.d.localStorage.k.syncedSelectors.select();

      if (fingerprint && syncedSelectors && !syncedSelectors['client.darkMode']) {
        console.log('🔗 Client: Registering client.darkMode for localStorage synchronization');
        // Register client.count for localStorage synchronization
        dispatch(
          d.client.d.localStorage.e.localStorageAddSelectorForSync({
            keyedSelector: k.darkMode,
            encrypted: false,
          }),
          {
            iterateStage: true,
          },
        );
      } else if (syncedSelectors && syncedSelectors['client.darkMode']) {
        console.log('✅ Client CDI: client.darkMode already registered for sync');
      }
    }),
    conclude(),
  ]);
};

/*#>*/
