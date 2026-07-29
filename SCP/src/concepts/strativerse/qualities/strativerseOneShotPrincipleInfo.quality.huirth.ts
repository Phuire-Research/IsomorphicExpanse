import {
  createQualityCard,
  defaultReducer,
  createMethodWithConcepts,
  strategyData_muxifyData,
  strategySuccess,
  type Quality,
} from 'stratimux';
import type { StrativerseState } from '../strativerse.type';

const LOG = '[StratiVERSE] OneShotPrincipleInfo:';

export const strativerseOneShotPrincipleInfo = createQualityCard<StrativerseState>({
  type: 'Strativerse One Shot Principle Info',
  reducer: defaultReducer,
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      console.log(LOG, 'Returning Means 10 specification');

      const informativeContent = {
        title: 'Means 10: OneShot Principle Creation Specification',
        citation: 'Crystraline 6 Diamond Plan - Means 10-12',
        description: 'Creates a principle file and performs all hookups in a single SCP tool call. Principles are behavioral — they initialize concepts at startup. Unlike qualities, principles have NO diameter option (a dummy principle is meaningless).',

        keyDifferencesFromQuality: {
          noDiameter: 'Principles are included or excluded, never junctioned with dummy implementations',
          behavioral: 'Principles DO things at startup; they are not reducers',
          location: 'Still supports huirth/client/omitted deployment targeting',
          optionalSCP: 'Principles can optionally register as informative SCP tools',
        },

        fieldDefinitions: [
          { field: 'principle.principleName', type: 'string', required: true, description: 'Principle variable name (e.g., strativerseSyncWatcher)' },
          { field: 'principle.principleFileContent', type: 'string', required: true, description: 'Complete TypeScript principle file content' },
          { field: 'principle.conceptName', type: 'string', required: true, description: 'Concept to add principle to (e.g., strativerse)' },
          { field: 'principle.location', type: 'huirth|client|omitted', required: true, description: 'Deployment target. huirth=server, client=browser, omitted=all' },
          { field: 'principle.description', type: 'string', required: true, description: 'Description for muxonomy demometer entry' },
          { field: 'principle.citations', type: 'string[]', required: false, description: 'Reference documents' },
        ],

        fileHookups: {
          description: 'OneShot Principle handles all file modifications automatically:',
          operations: [
            '1. Write principle file to principles/{principleName}.principle.{location}.ts',
            '2. Add export to principles/index.ts (if exists)',
            '3. Add import to {concept}.concept.ts',
            '4. Add to principles[] array in createConcept call',
            '5. Add demometer entry to {concept}.muxonomy.ts principleDemometers array',
          ],
        },

        fileNamingConvention: {
          pattern: '{principleName}.principle.{location}.ts',
          examples: [
            'strativerseSyncWatcher.principle.huirth.ts — Server-only principle',
            'clientBootstrap.principle.client.ts — Client-only principle',
            'sharedInit.principle.ts — All deployments (no location suffix)',
          ],
        },

        specificationTemplate: {
          principle: {
            principleName: 'myPrinciple',
            principleFileContent: 'COMPLETE_TYPESCRIPT_FILE (use A-to-B pipe pattern)',
            conceptName: 'strativerse',
            location: 'huirth',
            description: 'My principle description',
            citations: ['REFERENCE.md - Section'],
          },
        },

        curlExecutionPattern: {
          description: 'A-to-B pipe pattern for file content passthrough',
          pattern: 'cat << TSEOF | jq -Rs ... | curl -s ... -d @-',
          note: 'Use quoted heredoc (TSEOF not $TSEOF) to prevent bash parameter expansion',
          templateLiteralWarning: 'Convert ${...} template literals to string concatenation in file content',
        },

        whenToUse: [
          { scenario: 'New staged principle with Chokidar/timers', recommendation: 'Means 10 with principleFileContent' },
          { scenario: 'New initialization principle', recommendation: 'Means 10 with principleFileContent' },
          { scenario: 'Remove existing principle', recommendation: 'Means 12 (strativerse_oneshot_principle_remove)' },
        ],

        relatedTools: [
          { tool: 'strativerse_oneshot_principle', purpose: 'Paired actionable — creates principle + hookups' },
          { tool: 'strativerse_oneshot_principle_remove', purpose: 'Remove principle and all hookups' },
          { tool: 'strativerse_quality_create_info', purpose: 'Compare: quality creation has diameter option' },
        ],

        pairedActionable: 'strativerse_oneshot_principle',
      };

      if (action.strategy) {
        return strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, informativeContent));
      }
      return action;
    }),
});

export type StrativerseOneShotPrincipleInfoQuality = Quality<StrativerseState>;
