/**
 * setWizardConceptNameDraft Quality — Naming Wizard Live Validation (M2-A1-D2)
 *
 * Single-dispatch tri-field update: every keystroke in the naming wizard
 * fires this quality with the new draft → reducer validates inline →
 * returns { draft, valid, error } as a coupled partial state.
 *
 * SDM-AJMI pattern reused (Single-Dispatch-Multimirror from M2-A1-D1):
 * the 3 fields are computationally coupled (validation is a pure function
 * of draft), so coupling them in one reducer eliminates the race between
 * draft update and validation result render.
 *
 * Citation: DIAMOND-TIER-MACRO-2.md M2-A1-D2
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 * Citation: SDM-AJMI pattern (Cycle 77 M2-A1-D1 setInstalledScps)
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetWizardConceptNameDraftPayload,
} from '../scsBridge.type';
import { validateDesignationForWizard } from '../../../model/designationValidator.model';

export type { ScsBridgeSetWizardConceptNameDraftPayload };

export const scsBridgeSetWizardConceptNameDraft = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetWizardConceptNameDraftPayload
>({
  type: 'Scs Bridge Set Wizard Concept Name Draft',
  reducer: (_state, action) => {
    const draft = action.payload.draft;
    const validation = validateDesignationForWizard(draft);
    return {
      wizardConceptNameDraft: draft,
      wizardConceptNameValid: validation.valid,
      wizardConceptNameError: validation.valid ? '' : (validation.reason ?? ''),
    };
  },
  methodCreator: defaultMethodCreator,
});
