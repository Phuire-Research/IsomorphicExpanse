import { createQualityCardWithPayload, defaultMethodCreator, selectPayload, strategyData_select } from 'stratimux';
// Direct import from type file (NO barrel exports for tree-shaking)
import { type StrativerseState, type StrativerseConceptList, type StrativerseScanConceptsDataField } from '../strativerse.type';

export type StrativerseSetConceptListPayload = Partial<StrativerseConceptList>;

/**
 * setConceptList Quality - CONSUMER Pattern
 *
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data - Universal Transformer Pattern"
 * Citation: server/src/concepts/fileSystem/qualities/setConceptDirectoriesFromData.quality.ts
 *
 * This quality extracts data from StrategyData in the REDUCER when used in an ActionStrategy chain.
 * When StrategyData is present, it takes precedence over payload data.
 * This enables Higher-Order Composition where FileSystem qualities can curry forward data.
 */
export const strativerseSetConceptList = createQualityCardWithPayload<StrativerseState, StrativerseSetConceptListPayload>({
  type: 'Strativerse Set Concept List',
  reducer: (_, action) => {
    // CONSUMER Pattern: Extract from StrategyData in reducer
    if (action.strategy) {
      const data = strategyData_select<StrativerseScanConceptsDataField>(action.strategy);
      if (data && data.concepts) {
        return {
          conceptList: {
            concepts: data.concepts,
            lastScan: data.lastScan,
            scanPath: data.scanPath
          }
        };
      }
    }
    // Fallback to payload if no strategy data
    const payload = selectPayload<StrativerseSetConceptListPayload>(action);
    if (payload && payload.concepts) {
      return {
        conceptList: {
          concepts: payload.concepts,
          lastScan: payload.lastScan ?? Date.now(),
          scanPath: payload.scanPath ?? ''
        }
      };
    }
    return {};
  },
  methodCreator: defaultMethodCreator,
});
