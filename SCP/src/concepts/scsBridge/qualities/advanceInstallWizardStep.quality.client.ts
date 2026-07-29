/**
 * advanceInstallWizardStep Quality — Client UI Reducer (Local · M2-A1-D1)
 *
 * Advances the install wizard state machine to the supplied next step.
 * Caller decides the next step (no internal transition table) — keeps the
 * reducer pure and the state machine inspectable from outside.
 *
 * Wizard step machine (see scsBridge.type.ts):
 *   idle → naming → validating → cloning → priming → launching → complete
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D1
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeAdvanceInstallWizardStepPayload,
} from '../scsBridge.type';

export type { ScsBridgeAdvanceInstallWizardStepPayload };

export const scsBridgeAdvanceInstallWizardStep = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeAdvanceInstallWizardStepPayload
>({
  type: 'Scs Bridge Advance Install Wizard Step',
  reducer: (_state, action) => {
    return {
      installWizardStep: action.payload.nextStep,
    };
  },
  methodCreator: defaultMethodCreator,
});
