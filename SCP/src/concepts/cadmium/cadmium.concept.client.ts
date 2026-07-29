/**
 * Cadmium Concept Factory (Client-Side)
 *
 * Citation: DIAMOND-TIER-M1-A2-D1.md · Wave D
 */
import { createConcept } from 'stratimux';
import {
  cadmiumName,
  type CadmiumClientQualities,
} from './cadmium.type';
import { createCadmiumClientState } from './cadmium.state';
import { cadmiumSetDesignationName } from './qualities/setDesignationName.quality.client';
// C3-D2 · PlannedQuery qualities (PQCR)
import { cadmiumRegisterPlannedQuery } from './qualities/cadmiumRegisterPlannedQuery.quality.client';
import { cadmiumUpdatePlannedQueryStage } from './qualities/cadmiumUpdatePlannedQueryStage.quality.client';
// C3-D1 · DiamondScale quality (DSTS)
import { cadmiumSetDiamondScale } from './qualities/cadmiumSetDiamondScale.quality.client';
// C4-D1 · Article + Topics qualities (WNPM · TLCR) — relay reception side
import { cadmiumRegisterArticle } from './qualities/cadmiumRegisterArticle.quality.client';
import { cadmiumClearArticles } from './qualities/cadmiumClearArticles.quality.client';
import { cadmiumSetTopics } from './qualities/cadmiumSetTopics.quality.client';
// Diamond RAR · 3rd STCP · ResearchBulletin quality — relay reception side
import { cadmiumSetResearchBulletin } from './qualities/cadmiumSetResearchBulletin.quality.client';
// Topic Live Bulletin · TopicBulletin quality — relay reception side
import { cadmiumSetTopicBulletin } from './qualities/cadmiumSetTopicBulletin.quality.client';
// Macro SM · MenuStage quality (SMSP · IAJW) — relay reception side
import { cadmiumSetMenuStage } from './qualities/cadmiumSetMenuStage.quality.client';
// Diamond TRP · 4th STCP · TargetedMenuStage quality — relay reception side
import { cadmiumSetTargetedMenuStage } from './qualities/cadmiumSetTargetedMenuStage.quality.client';

const cadmiumQualities: CadmiumClientQualities = {
  cadmiumSetDesignationName,
  // C3-D2 PQCR + C3-D1 DSTS
  cadmiumRegisterPlannedQuery,
  cadmiumUpdatePlannedQueryStage,
  cadmiumSetDiamondScale,
  // C4-D1 WNPM + TLCR
  cadmiumRegisterArticle,
  cadmiumClearArticles,
  cadmiumSetTopics,
  // Diamond RAR · 3rd STCP · ResearchBulletin relay reception
  cadmiumSetResearchBulletin,
  // Topic Live Bulletin · TopicBulletin relay reception
  cadmiumSetTopicBulletin,
  // Macro SM · SMSP · MenuStage relay reception
  cadmiumSetMenuStage,
  // Diamond TRP · 4th STCP · TargetedMenuStage relay reception
  cadmiumSetTargetedMenuStage,
};

export const createCadmiumClientConcept = () => {
  return createConcept(
    cadmiumName,
    createCadmiumClientState(),
    cadmiumQualities,
    [],
  );
};
