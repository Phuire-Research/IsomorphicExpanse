/**
 * WebSocketClient LocalStorage Registration Principle
 * Registers clientStateId for localStorage persistence
 *
 * Reference: STRATIMUX-REFERENCE.md - 🎯 Critical Planning Context Patterns
 * Pattern: LocalStorage Registration - Wait for fingerprint, then register selectors
 *
 * Flow:
 * 1. Wait for localStorage systemFingerprint (indicates localStorage is primed)
 * 2. Register clientStateId selector for localStorage sync
 * 3. localStorage will automatically load existing clientStateId from IndexedDB
 * 4. localStorage will automatically save clientStateId changes to IndexedDB
 */

import type { PrincipleFunction, MuxiumDeck } from 'stratimux';
import { strategyBegin, createStrategy, createActionNode } from 'stratimux';
import type {
  WebSocketClientState,
  WebSocketClientQualities,
  WebSocketClientDeck,
} from '../webSocketClient.concept';
import type { LocalStorageDeck } from '../../localStorage/localStorage.model';

export type WebSocketClientLocalStorageRegistrationPrinciple = PrincipleFunction<
  WebSocketClientQualities,
  WebSocketClientDeck & MuxiumDeck & LocalStorageDeck,
  WebSocketClientState
>;

export const webSocketClientLocalStorageRegistrationPrinciple: WebSocketClientLocalStorageRegistrationPrinciple =
  ({ d_, k_, plan }) => {
    console.log('[WebSocketClient] 🎯 LocalStorage Registration Principle initialized');

    return plan('WebSocketClient LocalStorage Registration', ({ stage, stageO, conclude }) => [
      stageO(),

      stage(
        ({ dispatch, d }) => {
          const localStorage = d.localStorage;

          if (!localStorage) {
            console.warn('[WebSocketClient] localStorage not available');
            return;
          }

          const fingerprint = localStorage.k.systemFingerprint.select();

          if (fingerprint) {
            console.log(
              '[WebSocketClient] ✓ Fingerprint detected, registering clientStateId for sync',
            );

            const registrationStrategy = createStrategy({
              topic: '[WebSocketClient] Register clientStateId for localStorage Sync',
              initialNode: createActionNode(
                localStorage.e.localStorageAddSelectorForSync({
                  keyedSelector: k_.clientStateId,
                }),
              ),
            });

            dispatch(strategyBegin(registrationStrategy), { iterateStage: true });
          }
        },
        {
          beat: 300,
          selectors: [d_.localStorage.k.systemFingerprint],
        },
      ),

      conclude(),
    ]);
  };
