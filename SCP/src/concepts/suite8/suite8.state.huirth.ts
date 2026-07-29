/**
 * Suite8 Concept State Factory (Huirth Deployment) · GTMS8C Base
 *
 * The server-side (Base) state for the suite8 Demometer — holds menuStage as the Huirth
 * source of truth so the STCP SBIS+SMRP+BOCR stack can keep it authoritative. Seeds to
 * EMPTY_MENU_STAGE (stageIndex -1) so the KeyedSelector slot is ALWAYS present (never
 * optional · KeyedSelector discipline) and BOCR reads a valid value on a connect before any
 * menu.json exists. The thin menu-watch dir-watch (suite8MenuWatch) writes real stages via the
 * Base quality (suite8SetMenuStageHuirthBase); JDIS unlink resets it back to EMPTY_MENU_STAGE.
 *
 * Citation: cadmium.state.huirth.ts (createCadmiumHuirthState · Base/Informative split).
 * Citation: TU-S8C-S3-YELLOW-BLUEPRINT.md W2.3.
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state).
 */
import type { Suite8HuirthState } from './suite8.type';
import { EMPTY_MENU_STAGE } from '../../model/shatteriteMenu.model';

export function createSuite8HuirthState(): Suite8HuirthState {
  return {
    // KeyedSelector discipline · NON-OPTIONAL · the menu-watch dir-watch writes real stages via
    // the Base quality (suite8SetMenuStageHuirthBase); an unlink resets it to EMPTY_MENU_STAGE.
    menuStage: EMPTY_MENU_STAGE,

    // PRE-EPOCH · BSSM keyed Record (Base mirror). Always {} at boot (KeyedSelector). The N-watcher
    // dir-watch writes per-designation stages via suite8SetDesignationMenuStageHuirthBase; the SMRP
    // relay reads this Record + broadcasts the keyed relay.
    shatteriteMenus: {},
  };
}
