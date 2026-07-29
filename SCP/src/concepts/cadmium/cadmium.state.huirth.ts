/**
 * Cadmium Concept State Factory (Huirth Deployment) · STCP Base
 *
 * The server-side (Base) state for the cadmium Demometer — holds menuStage as the Huirth
 * source of truth so the STCP SBIS+SMRP+BOCR stack can keep it authoritative. Seeds to
 * EMPTY_MENU_STAGE (stageIndex -1) so the KeyedSelector slot is ALWAYS present (never
 * optional · KeyedSelector discipline) and BOCR reads a valid value on a connect before any
 * menu.json exists. The IAJW dir-watch (cadmiumOkMonitor) writes real stages via the Base
 * quality (cadmiumSetMenuStageHuirthBase); JDIS unlink resets it back to EMPTY_MENU_STAGE.
 *
 * Citation: suiteCascade.state.ts (createSuiteCascadeHuirthState · Base/Informative split).
 * Citation: STCP-S3-OCHRE-BLUEPRINT.md §2.0 (NEW thin Cadmium Huirth concept holds menuStage Base).
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state).
 */
import type { CadmiumHuirthState } from './cadmium.type';
import { EMPTY_MENU_STAGE } from './cadmium.type';

export function createCadmiumHuirthState(): CadmiumHuirthState {
  return {
    // Always present — never optional (KeyedSelector requirement). The IAJW watcher populates
    // a real stage via the Base quality; JDIS unlink resets it to EMPTY_MENU_STAGE.
    menuStage: EMPTY_MENU_STAGE,
    // Diamond TRP · 4th STCP · the Huirth source of truth for the Anchor-authored targeted-research
    // menu. Seeded to EMPTY_MENU_STAGE (KeyedSelector discipline · NON-OPTIONAL). The targeted-menu
    // dir-watch populates a real stage via the Base quality (cadmiumSetTargetedMenuStageHuirthBase);
    // JDIS unlink resets it to EMPTY_MENU_STAGE.
    targetedMenuStage: EMPTY_MENU_STAGE,
    // Diamond RFI · 2nd STCP · the Huirth source of truth for topics. Seeded to an empty array
    // (KeyedSelector discipline · NON-OPTIONAL · never undefined). The topics dir-watch populates
    // it via the Base quality (cadmiumSetTopicsHuirthBase); JDIS unlink resets it to [].
    topics: [],
    // Diamond RAR · 3rd STCP · the Huirth source of truth for the targeted ResearchBulletin.
    // Seeded to an empty array (KeyedSelector discipline · NON-OPTIONAL). The researchBulletin
    // dir-watch populates it via the Base quality (cadmiumSetResearchBulletinHuirthBase); JDIS
    // unlink resets it to [].
    researchBulletin: [],
    // Topic Live Bulletin · the Huirth source of truth for the merged Topic Bulletin. Seeded to
    // an empty array (KeyedSelector discipline · NON-OPTIONAL). The frontier/ folder-tree merge
    // populates it via the Base quality (cadmiumSetTopicBulletinHuirthBase); an empty tree resets
    // it to [].
    topicBulletin: [],
  };
}
