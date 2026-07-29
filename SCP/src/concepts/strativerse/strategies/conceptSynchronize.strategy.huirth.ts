import {
  ActionStrategy,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { StrativerseConcept } from '../strativerse.concept';
import type { SCPStrategyCreator } from '../../scp/scp.types';

const LOG_PREFIX = '[StratiVERSE Sync Strategy]';

export const createStrativerseConceptSynchronizeStrategy: SCPStrategyCreator = (concepts_, deck, params) => {
  const strativerseDeck = selectStratiDECK<StrativerseConcept>(deck, 'strativerse');

  if (!strativerseDeck) {
    console.error(LOG_PREFIX + ' Failed to access strativerse deck');
    return undefined;
  }

  const conceptName = params?.conceptName as string;
  const sourceProjectPath = params?.sourceProjectPath as string;
  const targetProjectPath = params?.targetProjectPath as string;

  if (!conceptName || !sourceProjectPath || !targetProjectPath) {
    console.error(LOG_PREFIX + ' Missing required params: conceptName, sourceProjectPath, targetProjectPath');
    return undefined;
  }

  console.log(LOG_PREFIX + ' Building strategy:', { conceptName, sourceProjectPath, targetProjectPath });

  const syncNode = createActionNode(
    strativerseDeck.e.strativerseConceptSynchronize({
      conceptName,
      sourceProjectPath,
      targetProjectPath,
    }),
    {
      successNotes: {
        preposition: '',
        denoter: 'Concept ' + conceptName + ' synchronized from source to target',
      },
    }
  );

  return createStrategy({
    topic: 'StratiVERSE Concept Synchronization: ' + conceptName,
    initialNode: syncNode,
    data: {
      conceptName,
      sourceProjectPath,
      targetProjectPath,
      timestamp: Date.now(),
    },
  });
};
